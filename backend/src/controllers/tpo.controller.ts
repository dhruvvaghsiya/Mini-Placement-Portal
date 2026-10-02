import { Request, Response, NextFunction } from 'express';
import { verifyStudent, getAllApplications, updateApplicationStatus } from '../services/tpo.service';

// ─── PATCH /api/tpo/students/:id/verify ──────────────────────────────────────

/**
 * Marks a student profile as verified.
 * Requires TPO role (enforced at the route level via requireTPO).
 *
 * URL param :id — the StudentProfile primary-key CUID.
 */
export async function verifyStudentHandler(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const { id } = req.params;

        if (!id || !id.trim()) {
            res.status(400).json({ success: false, message: 'Student profile id is required' });
            return;
        }

        const result = await verifyStudent(id.trim());

        res.status(200).json({
            success: true,
            message: `Student "${result.fullName}" verified successfully`,
            data: { verification: result },
        });
    } catch (err) {
        if (err instanceof Error) {
            const code = (err as Error & { code?: string }).code;

            if (code === 'NOT_FOUND') {
                res.status(404).json({ success: false, message: err.message });
                return;
            }

            if (code === 'PROFILE_INCOMPLETE') {
                res.status(409).json({ success: false, message: err.message });
                return;
            }
        }
        next(err);
    }
}

// ─── GET /api/tpo/applications ───────────────────────────────────────────────────

/**
 * Returns all applications enriched with student, drive, and company info.
 * Requires TPO role (enforced at the route level via requireTPO).
 */
export async function getApplicationsHandler(
    _req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const applications = await getAllApplications();

        res.status(200).json({
            success: true,
            message: 'Applications fetched successfully',
            data: { applications },
        });
    } catch (err) {
        next(err);
    }
}

// ─── PATCH /api/tpo/applications/:id/status ─────────────────────────────────────

/**
 * Updates the status of a single application.
 * Requires TPO role (enforced at the route level via requireTPO).
 *
 * URL param :id  — the Application primary-key CUID.
 * Body       { status: ApplicationStatus }
 */
export async function updateApplicationStatusHandler(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const { id } = req.params;
        const { status } = req.body as { status?: string };

        if (!id || !id.trim()) {
            res.status(400).json({ success: false, message: 'Application id is required' });
            return;
        }

        if (!status || typeof status !== 'string' || !status.trim()) {
            res.status(400).json({
                success: false,
                message: 'status is required in the request body',
            });
            return;
        }

        const application = await updateApplicationStatus(id.trim(), status.trim().toUpperCase());

        res.status(200).json({
            success: true,
            message: `Application status updated to "${application.status}"`,
            data: { application },
        });
    } catch (err) {
        if (err instanceof Error) {
            const code = (err as Error & { code?: string }).code;

            if (code === 'INVALID_STATUS') {
                res.status(400).json({ success: false, message: err.message });
                return;
            }

            if (code === 'NOT_FOUND') {
                res.status(404).json({ success: false, message: err.message });
                return;
            }
        }
        next(err);
    }
}
