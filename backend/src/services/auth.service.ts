import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { Role } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegisterInput {
    email: string;
    password: string;
    role?: Role;
}

export interface LoginInput {
    email: string;
    password: string;
}

/** User record without the password field — safe to return to client */
export type SafeUser = {
    id: string;
    email: string;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
};

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Register a new user.
 * Throws if the email is already taken.
 */
export async function registerUser(input: RegisterInput): Promise<SafeUser> {
    const { email, password, role = Role.STUDENT } = input;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        throw new Error('Email is already registered');
    }

    const hashed = await hashPassword(password);

    const user = await prisma.user.create({
        data: { email, password: hashed, role },
        select: { id: true, email: true, role: true, createdAt: true, updatedAt: true },
    });

    return user;
}

/**
 * Validate credentials and return the safe user on success.
 * Throws if email not found or password is wrong.
 */
export async function loginUser(input: LoginInput): Promise<SafeUser> {
    const { email, password } = input;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new Error('Invalid email or password');
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
        throw new Error('Invalid email or password');
    }

    const { password: _omit, ...safeUser } = user;
    return safeUser;
}

/**
 * Fetch a user by ID without exposing the password.
 * Returns null if not found.
 */
export async function getUserById(id: string): Promise<SafeUser | null> {
    return prisma.user.findUnique({
        where: { id },
        select: { id: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
}
