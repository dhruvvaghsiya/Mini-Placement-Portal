import { prisma } from '../lib';
import { hashPassword, comparePassword } from '../utils/password';
import { Role } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegisterInput {
    email: string;
    password: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

// ─── Safe user shape (never exposes password) ─────────────────────────────────

export type SafeUser = {
    id: string;
    email: string;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
};

function toSafeUser(user: {
    id: string;
    email: string;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
    password: string;
}): SafeUser {
    // Destructure password out so it is never returned.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pwd, ...safe } = user;
    return safe;
}

// ─── Register ─────────────────────────────────────────────────────────────────

/**
 * Creates a new User with role STUDENT.
 * A StudentProfile row is NOT created at registration time because the student
 * must fill in academic details in a separate onboarding step.
 * This keeps the User record as the single auth record and the profile as a
 * separate concern.
 *
 * @throws Error with a user-facing message on duplicate email.
 */
export async function registerUser(input: RegisterInput): Promise<SafeUser> {
    const { email, password } = input;

    // Check for duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        throw new Error('An account with this email already exists');
    }

    const hashed = await hashPassword(password);

    const user = await prisma.user.create({
        data: {
            email,
            password: hashed,
            role: Role.STUDENT,
        },
    });

    return toSafeUser(user);
}

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * Validates credentials and returns the safe user on success.
 * @throws Error with a generic message to avoid user enumeration.
 */
export async function loginUser(input: LoginInput): Promise<SafeUser> {
    const { email, password } = input;

    const user = await prisma.user.findUnique({ where: { email } });

    // Use a generic message to avoid leaking whether the email exists.
    if (!user) {
        throw new Error('Invalid email or password');
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
        throw new Error('Invalid email or password');
    }

    return toSafeUser(user);
}

// ─── Get current user ─────────────────────────────────────────────────────────

export async function getUserById(userId: string): Promise<SafeUser | null> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    return toSafeUser(user);
}
