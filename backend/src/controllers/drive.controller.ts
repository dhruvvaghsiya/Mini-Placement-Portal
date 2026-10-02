import { Request, Response, NextFunction } from 'express';
import * as driveService from '../services/drive.service';
import type { CreateDriveInput } from '../services/drive.service';

// ─── Validation helpers ───────────────────────────────────────────────────────

/**
 * Returns true when `v` is a finite, non-negative number.
 * Used to validate numeric eligibility criteria.
 */
function isNonNegativeNumber(v: unknown): v is number {
    return typeof v === 'number' && isFinite(v) && v >= 0;
}

/**
 * Validates the POST body for drive creation.
 * Returns an array of error messages; an empty array means the body is valid.
 */
function validateCreateBody(body: Record<string, unknown>): string[] {
    const errors: string[] = [];

    // ── companyId ─────────────────────────────────────────────────────────────
    if (typeof body.companyId !== 'string' || !body.companyId.trim()) {
        errors.push('companyId is required and must be a non-empty string');
    }

    // ── role ──────────────────────────────────────────────────────────────────
    if (typeof body.role !== 'string' || !body.role.trim()) {
        errors.push('role is required and must be a non-empty string');
    } else if (body.role.trim().length > 150) {
        errors.push('role must be 150 characters or fewer');
    }

    // ── ctc ───────────────────────────────────────────────────────────────────
    if (!isNonNegativeNumber(body.ctc)) {
        errors.push('ctc must be a non-negative number (LPA)');
    }

    // ── description ───────────────────────────────────────────────────────────
    if (typeof body.description !== 'string' || !body.description.trim()) {
        errors.push('description is required and must be a non-empty string');
    }

    // ── deadline ──────────────────────────────────────────────────────────────
    if (typeof body.deadline !== 'string' || !body.deadline.trim()) {
        errors.push('deadline is required');
    } else {
        const parsed = new Date(body.deadline);
        if (isNaN(parsed.getTime())) {
            errors.push('deadline must be a valid ISO date-time string');
        } else if (parsed <= new Date()) {
            errors.push('deadline must be a future date');
        }
    }

    // ── Optional numeric criteria ─────────────────────────────────────────────
    if (body.minTenthPercentage !== undefined && body.minTenthPercentage !== null) {
        if (!isNonNegativeNumber(body.minTenthPercentage) || (body.minTenthPercentage as number) > 100) {
            errors.push('minTenthPercentage must be a number between 0 and 100');
        }
    }

    if (body.minTwelfthPercentage !== undefined && body.minTwelfthPercentage !== null) {
        if (!isNonNegativeNumber(body.minTwelfthPercentage) || (body.minTwelfthPercentage as number) > 100) {
            errors.push('minTwelfthPercentage must be a number between 0 and 100');
        }
    }

    if (body.minD2DCgpa !== undefined && body.minD2DCgpa !== null) {
        if (!isNonNegativeNumber(body.minD2DCgpa) || (body.minD2DCgpa as number) > 10) {
            errors.push('minD2DCgpa must be a number between 0 and 10');
        }
    }

    if (body.minCpi !== undefined && body.minCpi !== null) {
        if (!isNonNegativeNumber(body.minCpi) || (body.minCpi as number) > 10) {
            errors.push('minCpi must be a number between 0 and 10');
        }
    }

    return errors;
}

// ─── GET /api/drives ──────────────────────────────────────────────────────────

/**
 * Returns all recruitment drives with embedded company info.
 * Accessible to any authenticated user.
 */
export async function getDrives(
    _req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const drives = await driveService.getAllDrives();

        res.status(200).json({
            success: true,
            message: 'Drives fetched successfully',
            data: { drives },
        });
    } catch (err) {
        next(err);
    }
}

// ─── GET /api/drives/:id ──────────────────────────────────────────────────────

/**
 * Returns a single recruitment drive by ID with embedded company info.
 * 404 when no matching drive is found.
 */
export async function getDrive(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const drive = await driveService.getDriveById(req.params.id);

        if (!drive) {
            res.status(404).json({
                success: false,
                message: 'Recruitment drive not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Drive fetched successfully',
            data: { drive },
        });
    } catch (err) {
        next(err);
    }
}

// ─── POST /api/drives ─────────────────────────────────────────────────────────

/**
 * Creates a new recruitment drive.
 * Requires TPO role (enforced at route level via requireTPO).
 */
export async function createDrive(
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

        const input: CreateDriveInput = {
            companyId: (body.companyId as string).trim(),
            role: (body.role as string).trim(),
            ctc: body.ctc as number,
            description: (body.description as string).trim(),
            deadline: (body.deadline as string).trim(),
            // Pass undefined when the field was not supplied; null is coerced
            // to undefined here so the service can cleanly resolve to DB null.
            minTenthPercentage:
                body.minTenthPercentage !== undefined && body.minTenthPercentage !== null
                    ? (body.minTenthPercentage as number)
                    : undefined,
            minTwelfthPercentage:
                body.minTwelfthPercentage !== undefined && body.minTwelfthPercentage !== null
                    ? (body.minTwelfthPercentage as number)
                    : undefined,
            minD2DCgpa:
                body.minD2DCgpa !== undefined && body.minD2DCgpa !== null
                    ? (body.minD2DCgpa as number)
                    : undefined,
            minCpi:
                body.minCpi !== undefined && body.minCpi !== null
                    ? (body.minCpi as number)
                    : undefined,
        };

        const drive = await driveService.createDrive(input);

        res.status(201).json({
            success: true,
            message: 'Recruitment drive created successfully',
            data: { drive },
        });
    } catch (err) {
        if (err instanceof Error && err.message.includes('does not exist')) {
            res.status(422).json({ success: false, message: err.message });
            return;
        }
        next(err);
    }
}
