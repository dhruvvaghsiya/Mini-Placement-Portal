import { prisma } from '../lib/prisma';

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

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Returns all active (non-expired) recruitment drives, newest deadline first.
 * A drive is considered active if its deadline is in the future.
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
