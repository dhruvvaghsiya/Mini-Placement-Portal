import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { Role } from '@prisma/client';

// ─── requireAuth / authenticate ──────────────────────────────────────────────

/**
 * Reads the JWT from the `token` HTTP-only cookie, verifies it, and attaches
 * the decoded payload to `req.user`.
 *
 * Returns 401 if the cookie is absent or the token is invalid/expired.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
    const token: string | undefined = req.cookies?.token;

    if (!token) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
    }

    const payload = verifyToken(token);

    if (!payload) {
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
        return;
    }

    req.user = {
        id: payload.id,
        email: payload.email,
        role: payload.role as Role,
    };

    next();
}

/** Alias for `authenticate` */
export const requireAuth = authenticate;

// ─── Role guards ──────────────────────────────────────────────────────────────

/**
 * Factory: builds a middleware that first authenticates, then enforces a role.
 * Keeps the role-check logic in one place — no duplication across controllers.
 */
function requireRole(role: Role) {
    return [
        authenticate,
        (req: Request, res: Response, next: NextFunction): void => {
            if (req.user?.role !== role) {
                res.status(403).json({
                    success: false,
                    message: `Access denied. Required role: ${role}`,
                });
                return;
            }
            next();
        },
    ];
}

/**
 * Middleware chain: authenticate → verify role is STUDENT.
 * Use as a route-level guard array:  `router.get('/profile', requireStudent, handler)`
 */
export const requireStudent = requireRole(Role.STUDENT);

/**
 * Middleware chain: authenticate → verify role is TPO.
 * Use as a route-level guard array:  `router.get('/students', requireTPO, handler)`
 */
export const requireTPO = requireRole(Role.TPO);
