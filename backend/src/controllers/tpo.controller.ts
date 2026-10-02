import { Request, Response, NextFunction } from 'express';
import { verifyStudent } from '../services/tpo.service';

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
