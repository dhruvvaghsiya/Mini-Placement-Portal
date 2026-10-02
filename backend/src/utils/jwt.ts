import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
}

export interface TokenPayload {
    id: string;
    email: string;
    role: string;
}

/** Cookie expiry — 7 days in ms */
export const cookieMaxAgeMs = 7 * 24 * 60 * 60 * 1000;

/** Sign a JWT that expires in 7 days */
export function signToken(payload: TokenPayload): string {
    const options: SignOptions = { expiresIn: '7d' };
    return jwt.sign(payload, JWT_SECRET as string, options);
}

/** Verify a JWT and return its payload, or null if invalid/expired */
export function verifyToken(token: string): (JwtPayload & TokenPayload) | null {
    try {
        return jwt.verify(token, JWT_SECRET as string) as JwtPayload & TokenPayload;
    } catch {
        return null;
    }
}
