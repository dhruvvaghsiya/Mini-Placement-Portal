import { Request, Response, NextFunction } from 'express';
import * as driveService from '../services/drive.service';

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
 * Returns a single drive by ID.
 */
export async function getDriveById(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const { id } = req.params;
        const drive = await driveService.getDriveById(id);

        if (!drive) {
            res.status(404).json({ success: false, message: 'Drive not found' });
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
