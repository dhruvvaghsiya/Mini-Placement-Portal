import { Router, Request, Response, NextFunction } from 'express';
import { requireStudent } from '../middleware/authenticate';
import { prisma } from '../lib/prisma';

const router = Router();

// ─── GET /api/applications/mine ──────────────────────────────────────────────
// Returns all applications for the currently authenticated student.
router.get('/mine', requireStudent, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.id;
        const profile = await prisma.studentProfile.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (!profile) {
            res.status(200).json({
                success: true,
                message: 'No student profile found',
                data: { applications: [] },
                applications: [],
            });
            return;
        }

        const rawApps = await prisma.application.findMany({
            where: { studentId: profile.id },
            include: {
                drive: {
                    include: {
                        company: true,
                    },
                },
            },
            orderBy: { appliedAt: 'desc' },
        });

        const applications = rawApps.map((app) => ({
            id: app.id,
            studentId: app.studentId,
            driveId: app.driveId,
            status: app.status,
            appliedAt: app.appliedAt.toISOString(),
            updatedAt: app.updatedAt.toISOString(),
            drive: {
                id: app.drive.id,
                title: `${app.drive.company.name} - ${app.drive.role}`,
                companyId: app.drive.companyId,
                company: app.drive.company,
                role: app.drive.role,
                ctc: `${app.drive.ctc} LPA`,
                location: 'On-Campus',
                description: app.drive.description,
                driveDate: app.drive.deadline.toISOString(),
                applicationDeadline: app.drive.deadline.toISOString(),
                status: app.drive.deadline > new Date() ? 'UPCOMING' : 'COMPLETED',
                minPercentage10th: app.drive.minTenthPercentage,
                minPercentage12th: app.drive.minTwelfthPercentage,
                minD2dCgpa: app.drive.minD2DCgpa,
                minCpi: app.drive.minCpi,
                createdAt: app.drive.createdAt.toISOString(),
                updatedAt: app.drive.updatedAt.toISOString(),
            },
        }));

        res.status(200).json({
            success: true,
            message: 'Applications fetched successfully',
            data: { applications },
            applications,
        });
    } catch (err) {
        next(err);
    }
});

export default router;
