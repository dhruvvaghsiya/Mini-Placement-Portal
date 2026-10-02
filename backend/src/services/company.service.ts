import { prisma } from '../lib/prisma';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateCompanyInput {
    name: string;
    imageUrl?: string;
}

/** Public-safe company shape returned to all callers */
export interface CompanyRecord {
    id: string;
    name: string;
    imageUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// ─── Prisma select ────────────────────────────────────────────────────────────

/** Consistent field selection — never accidentally leak relation data */
const companySelect = {
    id: true,
    name: true,
    imageUrl: true,
    createdAt: true,
    updatedAt: true,
} as const;

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Returns every company ordered by creation date (newest first).
 * Accessible to any authenticated user.
 */
export async function getAllCompanies(): Promise<CompanyRecord[]> {
    return prisma.company.findMany({
        select: companySelect,
        orderBy: { createdAt: 'desc' },
    });
}

/**
 * Creates a new company record.
 * Throws if a company with the same name already exists (case-insensitive).
 */
export async function createCompany(input: CreateCompanyInput): Promise<CompanyRecord> {
    const normalizedName = input.name.trim();

    // Prevent duplicate company names (case-insensitive)
    const duplicate = await prisma.company.findFirst({
        where: { name: { equals: normalizedName, mode: 'insensitive' } },
        select: { id: true },
    });

    if (duplicate) {
        throw new Error(`A company named "${normalizedName}" already exists`);
    }

    return prisma.company.create({
        data: {
            name: normalizedName,
            imageUrl: input.imageUrl ?? null,
        },
        select: companySelect,
    });
}
