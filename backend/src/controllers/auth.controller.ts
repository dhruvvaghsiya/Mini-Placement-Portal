import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { signToken, cookieMaxAgeMs } from '../utils/jwt';

// ─── Cookie config ────────────────────────────────────────────────────────────

const COOKIE_NAME = 'token';

function cookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: cookieMaxAgeMs(),
    };
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { email, password } = req.body as { email?: string; password?: string };

        // ── Validation ────────────────────────────────────────────────────────
        const errors: string[] = [];

        if (!email || typeof email !== 'string') {
            errors.push('Email is required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            errors.push('Email must be a valid email address');
        }

        if (!password || typeof password !== 'string') {
            errors.push('Password is required');
        } else if (password.length < 8) {
            errors.push('Password must be at least 8 characters');
        }

        if (errors.length > 0) {
            res.status(400).json({ success: false, message: errors.join('; ') });
            return;
        }

        // ── Service call ──────────────────────────────────────────────────────
        const user = await authService.registerUser({
            email: email!.trim().toLowerCase(),
            password: password!,
        });

        // ── Sign token & set cookie ───────────────────────────────────────────
        const token = signToken({ userId: user.id, email: user.email, role: user.role });
        res.cookie(COOKIE_NAME, token, cookieOptions());

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: { user },
        });
    } catch (err) {
        // Duplicate email — surface as 409
        if (err instanceof Error && err.message.includes('already exists')) {
            res.status(409).json({ success: false, message: err.message });
            return;
        }
        next(err);
    }
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { email, password } = req.body as { email?: string; password?: string };

        // ── Validation ────────────────────────────────────────────────────────
        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Email and password are required' });
            return;
        }

        // ── Service call ──────────────────────────────────────────────────────
        const user = await authService.loginUser({
            email: email.trim().toLowerCase(),
            password,
        });

        // ── Sign token & set cookie ───────────────────────────────────────────
        const token = signToken({ userId: user.id, email: user.email, role: user.role });
        res.cookie(COOKIE_NAME, token, cookieOptions());

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: { user },
        });
    } catch (err) {
        if (err instanceof Error && err.message === 'Invalid email or password') {
            res.status(401).json({ success: false, message: err.message });
            return;
        }
        next(err);
    }
}

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        // req.user is guaranteed by the `authenticate` middleware
        const user = await authService.getUserById(req.user!.userId);

        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'User fetched successfully',
            data: { user },
        });
    } catch (err) {
        next(err);
    }
}

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

export async function logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    });

    res.status(200).json({
        success: true,
        message: 'Logged out successfully',
        data: null,
    });
}
