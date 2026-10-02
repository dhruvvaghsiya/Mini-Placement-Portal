import { Request, Response, NextFunction } from 'express';
import * as driveService from '../services/drive.service';

function isNonNegativeNumber(v: unknown): v is number {
    return typeof v === 'number' && isFinite(v) && v >= 0;
}

function validateCreateBody(body: Record<string, unknown>): string[] {
    const errors: string[] = [];

    // Normalize field aliases from frontend
    if (typeof body.ctc === 'string') {
        const parsedCtc = parseFloat(body.ctc);
        if (!isNaN(parsedCtc)) body.ctc = parsedCtc;
    }
    if (!body.deadline && body.applicationDeadline) {
        body.deadline = body.applicationDeadline;
    }
    if (body.minTenthPercentage === undefined && body.minPercentage10th !== undefined) {
        body.minTenthPercentage = body.minPercentage10th;
    }
    if (body.minTwelfthPercentage === undefined && body.minPercentage12th !== undefined) {
        body.minTwelfthPercentage = body.minPercentage12th;
    }
    if (body.minD2DCgpa === undefined && body.minD2dCgpa !== undefined) {
        body.minD2DCgpa = body.minD2dCgpa;
    }

    if (typeof body.companyId !== 'string' || !body.companyId.trim()) {
        errors.push('companyId is required and must be a non-empty string');
    }

    if (typeof body.role !== 'string' || !body.role.trim()) {
        errors.push('role is required and must be a non-empty string');
    } else if (body.role.trim().length > 150) {
        errors.push('role must be 150 characters or fewer');
    }

    if (!isNonNegativeNumber(body.ctc)) {
        errors.push('ctc must be a non-negative number (LPA)');
    }

    if (typeof body.description !== 'string' || !body.description.trim()) {
        errors.push('description is required and must be a non-empty string');
    }

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

function formatDriveResponse(d: any) {
    if (!d) return d;
    return {
        ...d,
        title: d.title ?? (d.company?.name ? `${d.company.name} - ${d.role}` : d.role),
        status: d.status ?? (new Date(d.deadline) > new Date() ? 'UPCOMING' : 'COMPLETED'),
        applicationDeadline: d.deadline instanceof Date ? d.deadline.toISOString() : d.deadline,
        driveDate: d.deadline instanceof Date ? d.deadline.toISOString() : d.deadline,
        location: d.location ?? 'On-Campus',
        minPercentage10th: d.minTenthPercentage,
        minPercentage12th: d.minTwelfthPercentage,
        minD2dCgpa: d.minD2DCgpa,
    };
}

// ─── GET /api/drives ──────────────────────────────────────────────────────────

/**
 * Returns all recruitment drives with their company details.
 * Accessible to any authenticated user (STUDENT or TPO).
 */
export async function getDrives(
    _req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const rawDrives = await driveService.getAllDrives();
        const drives = rawDrives.map(formatDriveResponse);

        res.status(200).json({
            success: true,
            message: 'Drives fetched successfully',
            data: { drives },
            drives,
        });
    } catch (err) {
        next(err);
    }
}

// ─── GET /api/drives/:id ──────────────────────────────────────────────────────

/**
 * Returns a single drive by ID.
 */
export async function getDriveById(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const { id } = req.params;
        const rawDrive = await driveService.getDriveById(id.trim());

        if (!rawDrive) {
            res.status(404).json({ success: false, message: 'Drive not found' });
            return;
        }

        const drive = formatDriveResponse(rawDrive);

        res.status(200).json({
            success: true,
            message: 'Drive fetched successfully',
            data: { drive },
            drive,
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

        const input: driveService.CreateDriveInput = {
            companyId: (body.companyId as string).trim(),
            role: (body.role as string).trim(),
            ctc: body.ctc as number,
            description: (body.description as string).trim(),
            deadline: (body.deadline as string).trim(),
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

        const rawDrive = await driveService.createDrive(input);
        const drive = formatDriveResponse(rawDrive);

        res.status(201).json({
            success: true,
            message: 'Recruitment drive created successfully',
            data: { drive },
            drive,
        });
    } catch (err) {
        if (err instanceof Error && err.message.includes('does not exist')) {
            res.status(422).json({ success: false, message: err.message });
            return;
        }
        next(err);
    }
}

// ─── POST /api/drives/:id/apply ───────────────────────────────────────────────

/**
 * Student applies to a recruitment drive.
 * Validates profile completion, TPO verification, eligibility criteria, and uniqueness.
 */
export async function applyToDrive(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const { id: driveId } = req.params;
        const userId = req.user!.id;

        const application = await driveService.applyToDrive(userId, driveId);

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            data: { application },
        });
    } catch (err) {
        if (err instanceof Error) {
            const code = (err as Error & { code?: string }).code;

            if (code === 'NOT_FOUND') {
                res.status(404).json({ success: false, message: err.message });
                return;
            }
            if (code === 'DEADLINE_PASSED' || code === 'PROFILE_REQUIRED') {
                res.status(400).json({ success: false, message: err.message });
                return;
            }
            if (code === 'INELIGIBLE') {
                res.status(403).json({ success: false, message: err.message });
                return;
            }
            if (code === 'DUPLICATE') {
                res.status(409).json({ success: false, message: err.message });
                return;
            }
        }
        next(err);
    }
}

// ─── GET /api/drives/:id/eligible-students ────────────────────────────────────

/**
 * Returns all student profiles that are eligible for the given drive.
 * Requires TPO role (enforced at the route level via requireTPO).
 */
export async function getEligibleStudents(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const { id } = req.params;
        const students = await driveService.getEligibleStudentsForDrive(id);

        res.status(200).json({
            success: true,
            message: `${students.length} eligible student(s) found`,
            data: { driveId: id, count: students.length, students },
        });
    } catch (err) {
        if (err instanceof Error && err.message === 'Drive not found') {
            res.status(404).json({ success: false, message: 'Drive not found' });
            return;
        }
        next(err);
    }
}

