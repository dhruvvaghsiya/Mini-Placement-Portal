import { Request, Response } from 'express';
import { registerUser, loginUser, getUserById } from '../services/auth.service';
import { signToken, cookieMaxAgeMs } from '../utils/jwt';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Attach the JWT as a secure, httpOnly cookie */
function setTokenCookie(res: Response, token: string): void {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: cookieMaxAgeMs,
    });
}

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Body: { email, password, role? }
 */
export async function register(req: Request, res: Response): Promise<void> {
    try {
        const { email, password, role } = req.body as {
            email: string;
            password: string;
            role?: 'STUDENT' | 'TPO';
        };

        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Email and password are required' });
            return;
        }

        const user = await registerUser({ email, password, role });
        const token = signToken({ id: user.id, email: user.email, role: user.role });
        setTokenCookie(res, token);

        res.status(201).json({ success: true, data: user });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Registration failed';
        res.status(400).json({ success: false, message });
    }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export async function login(req: Request, res: Response): Promise<void> {
    try {
        const { email, password } = req.body as { email: string; password: string };

        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Email and password are required' });
            return;
        }

        const user = await loginUser({ email, password });
        const token = signToken({ id: user.id, email: user.email, role: user.role });
        setTokenCookie(res, token);

        res.status(200).json({ success: true, data: user });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Login failed';
        res.status(401).json({ success: false, message });
    }
}

/**
 * GET /api/auth/me
 * Requires: authenticate middleware
 */
export async function me(req: Request, res: Response): Promise<void> {
    try {
        // req.user is guaranteed by the authenticate middleware
        const user = await getUserById(req.user!.id);

        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        res.status(200).json({ success: true, data: user });
    } catch {
        res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }
}

/**
 * POST /api/auth/logout
 * Clears the token cookie.
 */
export async function logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie('token', { httpOnly: true, sameSite: 'strict' });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
}
