import { prisma } from '../lib/prisma';
import { ApplicationStatus } from '@prisma/client';

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

// ─── Application monitoring ───────────────────────────────────────────────────

/** Allowed status values — derived from the Prisma enum so they stay in sync */
export const ALLOWED_STATUSES = Object.values(ApplicationStatus) as ApplicationStatus[];

/**
 * Shape of each item returned by getAllApplications.
 * Flattened from the nested Prisma result for cleaner API responses.
 */
export interface ApplicationListItem {
    id: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    driveId: string;
    role: string;
    ctc: number;
    companyName: string;
    status: ApplicationStatus;
    appliedAt: Date;
    updatedAt: Date;
}

/** Nested Prisma select for a fully-enriched application row */
const applicationSelect = {
    id: true,
    studentId: true,
    driveId: true,
    status: true,
    appliedAt: true,
    updatedAt: true,
    student: {
        select: {
            fullName: true,
            user: { select: { email: true } },
        },
    },
    drive: {
        select: {
            role: true,
            ctc: true,
            company: { select: { name: true } },
        },
    },
} as const;

/**
 * Returns every application with enriched student, drive, and company data.
 * Results are ordered newest-first by appliedAt.
 */
export async function getAllApplications(): Promise<ApplicationListItem[]> {
    const rows = await prisma.application.findMany({
        select: applicationSelect,
        orderBy: { appliedAt: 'desc' },
    });

    return rows.map((row) => ({
        id: row.id,
        studentId: row.studentId,
        studentName: row.student.fullName,
        studentEmail: row.student.user.email,
        driveId: row.driveId,
        role: row.drive.role,
        ctc: row.drive.ctc,
        companyName: row.drive.company.name,
        status: row.status,
        appliedAt: row.appliedAt,
        updatedAt: row.updatedAt,
    }));
}

/**
 * Updates the status of a single application.
 *
 * @throws { code: 'NOT_FOUND' }       — application id does not exist
 * @throws { code: 'INVALID_STATUS' }  — status value not in the enum
 */
export async function updateApplicationStatus(
    applicationId: string,
    status: string,
): Promise<ApplicationListItem> {
    // Validate status against the enum before any DB call
    if (!ALLOWED_STATUSES.includes(status as ApplicationStatus)) {
        throw Object.assign(
            new Error(`Invalid status "${status}". Allowed: ${ALLOWED_STATUSES.join(', ')}`),
            { code: 'INVALID_STATUS' },
        );
    }

    // Confirm the application exists
    const existing = await prisma.application.findUnique({
        where: { id: applicationId },
        select: { id: true },
    });

    if (!existing) {
        throw Object.assign(
            new Error(`Application "${applicationId}" not found`),
            { code: 'NOT_FOUND' },
        );
    }

    const updated = await prisma.application.update({
        where: { id: applicationId },
        data: { status: status as ApplicationStatus },
        select: applicationSelect,
    });

    return {
        id: updated.id,
        studentId: updated.studentId,
        studentName: updated.student.fullName,
        studentEmail: updated.student.user.email,
        driveId: updated.driveId,
        role: updated.drive.role,
        ctc: updated.drive.ctc,
        companyName: updated.drive.company.name,
        status: updated.status,
        appliedAt: updated.appliedAt,
        updatedAt: updated.updatedAt,
    };
}
