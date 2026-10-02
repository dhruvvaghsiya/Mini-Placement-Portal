import { prisma } from '../lib/prisma';
import { checkStudentEligibility } from './eligibility.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DriveWithCompany {
    id: string;
    role: string;
    ctc: number;
    description: string;
    deadline: Date;
    minTenthPercentage: number | null;
    minTwelfthPercentage: number | null;
    minD2DCgpa: number | null;
    minCpi: number | null;
    createdAt: Date;
    updatedAt: Date;
    company: {
        id: string;
        name: string;
        imageUrl: string | null;
    };
}

export interface CreateDriveInput {
    companyId: string;
    role: string;
    ctc: number;
    description: string;
    deadline: string;
    minTenthPercentage?: number;
    minTwelfthPercentage?: number;
    minD2DCgpa?: number;
    minCpi?: number;
}

/** A student profile record safe to return to the TPO */
export interface EligibleStudent {
    id: string;
    userId: string;
    fullName: string;
    phone: string;
    tenthPercentage: number;
    twelfthPercentage: number | null;
    isD2D: boolean;
    d2dCgpa: number | null;
    cpi: number;
    isVerified: boolean;
}

// ─── Prisma select ────────────────────────────────────────────────────────────

const driveSelect = {
    id: true,
    companyId: true,
    role: true,
    ctc: true,
    description: true,
    deadline: true,
    minTenthPercentage: true,
    minTwelfthPercentage: true,
    minD2DCgpa: true,
    minCpi: true,
    createdAt: true,
    updatedAt: true,
    company: {
        select: {
            id: true,
            name: true,
            imageUrl: true,
        },
    },
} as const;

/** Student profile fields fetched for eligibility evaluation */
const profileSelect = {
    id: true,
    userId: true,
    fullName: true,
    phone: true,
    tenthPercentage: true,
    twelfthPercentage: true,
    isD2D: true,
    d2dCgpa: true,
    cpi: true,
    profileLocked: true,
    isVerified: true,
} as const;

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Returns all recruitment drives ordered by deadline ascending.
 */
export async function getAllDrives(): Promise<DriveWithCompany[]> {
    return prisma.recruitmentDrive.findMany({
        select: driveSelect,
        orderBy: { deadline: 'asc' },
    });
}

/**
 * Returns a single drive by ID, or null if not found.
 */
export async function getDriveById(id: string): Promise<DriveWithCompany | null> {
    return prisma.recruitmentDrive.findUnique({
        where: { id },
        select: driveSelect,
    });
}

/**
 * Creates a new recruitment drive.
 *
 * @throws if `companyId` does not reference an existing company.
 */
export async function createDrive(input: CreateDriveInput): Promise<DriveWithCompany> {
    const company = await prisma.company.findUnique({
        where: { id: input.companyId },
        select: { id: true },
    });

    if (!company) {
        throw Object.assign(new Error(`Company with id "${input.companyId}" does not exist`), {
            code: 'COMPANY_NOT_FOUND',
        });
    }

    return prisma.recruitmentDrive.create({
        data: {
            companyId: input.companyId,
            role: input.role.trim(),
            ctc: input.ctc,
            description: input.description.trim(),
            deadline: new Date(input.deadline),
            minTenthPercentage: input.minTenthPercentage ?? null,
            minTwelfthPercentage: input.minTwelfthPercentage ?? null,
            minD2DCgpa: input.minD2DCgpa ?? null,
            minCpi: input.minCpi ?? null,
        },
        select: driveSelect,
    });
}

/**
 * Submits an application for a student to a recruitment drive.
 * Validates eligibility using eligibility.service.ts and prevents duplicate applications.
 */
export async function applyToDrive(userId: string, driveId: string) {
    const drive = await prisma.recruitmentDrive.findUnique({
        where: { id: driveId },
        select: {
            id: true,
            minTenthPercentage: true,
            minTwelfthPercentage: true,
            minD2DCgpa: true,
            minCpi: true,
            deadline: true,
        },
    });

    if (!drive) {
        throw Object.assign(new Error('Recruitment drive not found'), { code: 'NOT_FOUND' });
    }

    if (new Date(drive.deadline) < new Date()) {
        throw Object.assign(new Error('Recruitment drive deadline has passed'), {
            code: 'DEADLINE_PASSED',
        });
    }

    const profile = await prisma.studentProfile.findUnique({
        where: { userId },
        select: profileSelect,
    });

    if (!profile) {
        throw Object.assign(
            new Error('Student profile not found. Please complete your profile first.'),
            { code: 'PROFILE_REQUIRED' },
        );
    }

    const { eligible, reasons } = checkStudentEligibility(profile, drive);
    if (!eligible) {
        throw Object.assign(new Error(`Student is not eligible: ${reasons.join('; ')}`), {
            code: 'INELIGIBLE',
            reasons,
        });
    }

    const existingApp = await prisma.application.findUnique({
        where: {
            studentId_driveId: {
                studentId: profile.id,
                driveId: drive.id,
            },
        },
    });

    if (existingApp) {
        throw Object.assign(new Error('You have already applied to this recruitment drive'), {
            code: 'DUPLICATE',
        });
    }

    return prisma.application.create({
        data: {
            studentId: profile.id,
            driveId: drive.id,
            status: 'APPLIED',
        },
        select: {
            id: true,
            studentId: true,
            driveId: true,
            status: true,
            appliedAt: true,
            updatedAt: true,
        },
    });
}

/**
 * Returns all student profiles that pass the eligibility check for a given drive.
 * Eligibility logic is fully delegated to `checkStudentEligibility` — no
 * duplication of rules here.
 *
 * @throws if the drive does not exist.
 */
export async function getEligibleStudentsForDrive(
    driveId: string,
): Promise<EligibleStudent[]> {
    // 1. Fetch the drive (needed for its eligibility criteria)
    const drive = await prisma.recruitmentDrive.findUnique({
        where: { id: driveId },
        select: {
            minTenthPercentage: true,
            minTwelfthPercentage: true,
            minD2DCgpa: true,
            minCpi: true,
        },
    });

    if (!drive) {
        throw new Error('Drive not found');
    }

    // 2. Fetch all student profiles
    const profiles = await prisma.studentProfile.findMany({
        select: profileSelect,
    });

    // 3. Run pure eligibility check on each — no DB calls inside
    return profiles.filter((profile) => {
        const { eligible } = checkStudentEligibility(profile, drive);
        return eligible;
    });
}

