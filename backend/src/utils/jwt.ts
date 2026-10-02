import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import type { JwtPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN as string) || '7d';

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
}

// ─── Sign ─────────────────────────────────────────────────────────────────────

export function signToken(payload: JwtPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);
}

// ─── Verify ───────────────────────────────────────────────────────────────────

export function verifyToken(token: string): JwtPayload {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as JwtPayload;
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────

/** Returns the max-age in milliseconds for the auth cookie. */
export function cookieMaxAgeMs(): number {
    // Parse the JWT_EXPIRES_IN string (e.g. "7d", "24h") into milliseconds.
    const unit = JWT_EXPIRES_IN.slice(-1);
    const value = parseInt(JWT_EXPIRES_IN.slice(0, -1), 10);
    const multipliers: Record<string, number> = {
        s: 1_000,
        m: 60_000,
        h: 3_600_000,
        d: 86_400_000,
    };
    return (multipliers[unit] ?? 86_400_000) * (isNaN(value) ? 7 : value);
}

export { Role };
