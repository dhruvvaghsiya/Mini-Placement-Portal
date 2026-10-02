import { Request, Response, NextFunction } from 'express';
import * as companyService from '../services/company.service';

// ─── Validation helpers ───────────────────────────────────────────────────────

/** Accepted URL schemes for imageUrl */
const URL_PATTERN = /^https?:\/\/.+/i;

/**
 * Validates the POST body for company creation.
 * Returns a list of error messages; empty array means the body is valid.
 */
function validateCreateBody(body: Record<string, unknown>): string[] {
    const errors: string[] = [];

    // ── name ──────────────────────────────────────────────────────────────────
    if (typeof body.name !== 'string' || !body.name.trim()) {
        errors.push('name is required and must be a non-empty string');
    } else if (body.name.trim().length > 100) {
        errors.push('name must be 100 characters or fewer');
    }

    // ── imageUrl (optional) ───────────────────────────────────────────────────
    if (body.imageUrl !== undefined && body.imageUrl !== null) {
        if (typeof body.imageUrl !== 'string' || !URL_PATTERN.test(body.imageUrl.trim())) {
            errors.push('imageUrl must be a valid URL starting with http:// or https://');
        }
    }

    return errors;
}

// ─── GET /api/companies ───────────────────────────────────────────────────────

/**
 * Returns the list of all companies.
 * Accessible to any authenticated user (student or TPO).
 */
export async function getCompanies(
    _req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const companies = await companyService.getAllCompanies();

        res.status(200).json({
            success: true,
            message: 'Companies fetched successfully',
            data: { companies },
        });
    } catch (err) {
        next(err);
    }
}

// ─── POST /api/companies ──────────────────────────────────────────────────────

/**
 * Creates a new company.
 * Requires TPO role (enforced at the route level via requireTPO).
 */
export async function createCompany(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const body = req.body as Record<string, unknown>;
        const errors = validateCreateBody(body);

        if (errors.length > 0) {
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors,
            });
            return;
        }

        const company = await companyService.createCompany({
            name: (body.name as string).trim(),
            imageUrl:
                body.imageUrl !== undefined && body.imageUrl !== null
                    ? (body.imageUrl as string).trim()
                    : undefined,
        });

        res.status(201).json({
            success: true,
            message: 'Company created successfully',
            data: { company },
        });
    } catch (err) {
        if (err instanceof Error && err.message.includes('already exists')) {
            res.status(409).json({ success: false, message: err.message });
            return;
        }
        next(err);
    }
}
