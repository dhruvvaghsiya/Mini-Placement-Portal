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

