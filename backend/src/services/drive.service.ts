import { prisma } from '../lib/prisma';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateDriveInput {
    companyId: string;
    role: string;
    /** Cost-to-Company in LPA */
    ctc: number;
    description: string;
    /** ISO date-time string */
    deadline: string;
    // ── Optional eligibility criteria ────────────────────────────────────────
    minTenthPercentage?: number;
    minTwelfthPercentage?: number;
    minD2DCgpa?: number;
    minCpi?: number;
}

// ─── Prisma selects ───────────────────────────────────────────────────────────

/** Slim company embed included in every drive response */
const companySelect = {
    id: true,
    name: true,
    imageUrl: true,
} as const;

/** Full drive fields + nested company */
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
    company: { select: companySelect },
} as const;

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Returns all recruitment drives ordered by deadline (soonest first).
 * Includes the parent company's id, name, and imageUrl.
 */
export async function getAllDrives() {
    return prisma.recruitmentDrive.findMany({
        select: driveSelect,
        orderBy: { deadline: 'asc' },
    });
}

/**
 * Returns a single drive by ID with company details.
 * Returns null when no matching drive is found.
 */
export async function getDriveById(id: string) {
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
export async function createDrive(input: CreateDriveInput) {
    // Guard: referenced company must exist
    const company = await prisma.company.findUnique({
        where: { id: input.companyId },
        select: { id: true },
    });

    if (!company) {
        throw new Error(`Company with id "${input.companyId}" does not exist`);
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
