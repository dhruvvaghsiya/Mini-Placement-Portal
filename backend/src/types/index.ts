import { Role } from '@prisma/client';

// ─── JWT Payload / Authenticated User ────────────────────────────────────────

export interface JwtPayload {
    id: string;
    email: string;
    role: Role;
}

// ─── Express Request augmentation ────────────────────────────────────────────

declare global {
    namespace Express {
        interface Request {
            /** Set by `authenticate` middleware after JWT verification. */
            user?: JwtPayload;
        }
    }
}
