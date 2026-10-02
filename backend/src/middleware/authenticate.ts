import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

/**
 * Middleware that reads the JWT from the `token` HttpOnly cookie,
 * verifies it, and attaches the decoded payload to `req.user`.
 *
 * Responds 401 if the token is missing, expired, or invalid.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
    const token: string | undefined = req.cookies?.token;

    if (!token) {
        res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
        return;
    }

    try {
        req.user = verifyToken(token);
        next();
    } catch (err) {
        if (err instanceof TokenExpiredError) {
            res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
        } else if (err instanceof JsonWebTokenError) {
            res.status(401).json({ success: false, message: 'Invalid token. Please log in again.' });
        } else {
            next(err);
        }
    }
}
