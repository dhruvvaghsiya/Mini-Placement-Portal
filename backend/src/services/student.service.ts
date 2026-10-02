import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

// ─── Shared 10th subject marks shape ─────────────────────────────────────────

export interface TenthSubjectMarks {
    tenthMaths: number;
    tenthPhysics: number;
    tenthChemistry: number;
    tenthEnglish: number;
    tenthComputer: number;
}

// ─── Input types ──────────────────────────────────────────────────────────────

export interface CreateProfileInput {
    // Personal
    fullName: string;
    phone: string;
    dob: string; // ISO date string — stored as Date in DB

    // Academic
    tenthSubjectMarks: TenthSubjectMarks;
    tenthPercentage: number;

    isD2D: boolean;
    twelfthPercentage?: number; // required when isD2D = false
    d2dCgpa?: number;           // required when isD2D = true

    cpi: number;
}

export type UpdateProfileInput = Partial<Omit<CreateProfileInput, 'isD2D'>>;

// ─── GET /api/students/profile ────────────────────────────────────────────────

/**
 * Returns the authenticated student's profile, or null if not yet created.
 */
export async function getProfile(userId: string) {
    return prisma.studentProfile.findUnique({
        where: { userId },
    });
}

// ─── POST /api/students/profile ───────────────────────────────────────────────

/**
 * Creates the student profile for the first time.
 * Sets `profileLocked = true` on successful creation (enforced in backend;
 * cannot be toggled by the client).
 *
 * @throws if a profile already exists for this user.
 */
export async function createProfile(userId: string, input: CreateProfileInput) {
    // Prevent double-creation
    const existing = await prisma.studentProfile.findUnique({ where: { userId } });
    if (existing) {
        throw new Error('Profile already exists. Use PATCH to update before locking.');
    }

    const subjectMarks: Prisma.InputJsonValue = input.tenthSubjectMarks as unknown as Prisma.InputJsonValue;

    const profile = await prisma.studentProfile.create({
        data: {
            userId,
            fullName: input.fullName,
            phone: input.phone,
            dob: new Date(input.dob),
            tenthSubjectMarks: subjectMarks,
            tenthPercentage: input.tenthPercentage,
            isD2D: input.isD2D,
            twelfthPercentage: input.isD2D ? null : (input.twelfthPercentage ?? null),
            d2dCgpa: input.isD2D ? (input.d2dCgpa ?? null) : null,
            cpi: input.cpi,
            profileLocked: true, // Lock immediately on creation
        },
    });

    return profile;
}

// ─── PATCH /api/students/profile ─────────────────────────────────────────────

/**
 * Updates allowed fields on an unlocked profile.
 *
 * @throws if profile does not exist, or is locked.
 */
export async function updateProfile(userId: string, input: UpdateProfileInput) {
    const existing = await prisma.studentProfile.findUnique({ where: { userId } });

    if (!existing) {
        throw new Error('Profile not found. Submit a profile first using POST.');
    }

    // Backend-enforced lock — never trust the client
    if (existing.profileLocked) {
        throw new Error('Profile is locked and cannot be modified.');
    }

    const subjectMarks: Prisma.InputJsonValue | undefined =
        input.tenthSubjectMarks !== undefined
            ? (input.tenthSubjectMarks as unknown as Prisma.InputJsonValue)
            : undefined;

    const data: Prisma.StudentProfileUpdateInput = {
        ...(input.fullName !== undefined && { fullName: input.fullName }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.dob !== undefined && { dob: new Date(input.dob) }),
        ...(subjectMarks !== undefined && { tenthSubjectMarks: subjectMarks }),
        ...(input.tenthPercentage !== undefined && { tenthPercentage: input.tenthPercentage }),
        ...(input.twelfthPercentage !== undefined && { twelfthPercentage: input.twelfthPercentage }),
        ...(input.d2dCgpa !== undefined && { d2dCgpa: input.d2dCgpa }),
        ...(input.cpi !== undefined && { cpi: input.cpi }),
    };

    return prisma.studentProfile.update({
        where: { userId },
        data,
    });
}
