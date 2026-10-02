import { prisma } from '../lib/prisma';

// ─── Return type ──────────────────────────────────────────────────────────────

/** Minimal verification snapshot returned after a successful verify call */
export interface VerificationResult {
    studentProfileId: string;
    userId: string;
    fullName: string;
    isVerified: boolean;
    profileLocked: boolean;
    updatedAt: Date;
}

// ─── Prisma select ────────────────────────────────────────────────────────────

const verificationSelect = {
    id: true,
    userId: true,
    fullName: true,
    isVerified: true,
    profileLocked: true,
    updatedAt: true,
} as const;

// ─── Service function ─────────────────────────────────────────────────────────

/**
 * Marks a student's profile as verified (`isVerified = true`).
 *
 * The `studentProfileId` parameter is the `StudentProfile.id` (CUID),
 * which is what the TPO supplies in the URL param `:id`.
 *
 * @throws 'Student profile not found'              — bad ID
 * @throws 'Profile must be locked before verification' — profile incomplete
 */
export async function verifyStudent(studentProfileId: string): Promise<VerificationResult> {
    // Look up the profile directly by its own primary key
    const profile = await prisma.studentProfile.findUnique({
        where: { id: studentProfileId },
        select: verificationSelect,
    });

    if (!profile) {
        throw Object.assign(new Error('Student profile not found'), { code: 'NOT_FOUND' });
    }

    // Profile must be locked (i.e. submitted) before it can be verified
    if (!profile.profileLocked) {
        throw Object.assign(
            new Error('Profile must be locked (submitted) before it can be verified'),
            { code: 'PROFILE_INCOMPLETE' },
        );
    }

    // Update and return only the verification snapshot
    const updated = await prisma.studentProfile.update({
        where: { id: studentProfileId },
        data: { isVerified: true },
        select: verificationSelect,
    });

    return {
        studentProfileId: updated.id,
        userId: updated.userId,
        fullName: updated.fullName,
        isVerified: updated.isVerified,
        profileLocked: updated.profileLocked,
        updatedAt: updated.updatedAt,
    };
}
