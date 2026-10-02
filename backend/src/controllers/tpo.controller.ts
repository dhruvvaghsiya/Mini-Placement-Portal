import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ApplicationStatus } from '@prisma/client';

export const getApplications = async (req: Request, res: Response): Promise<void> => {
    try {
        const apps = await prisma.application.findMany({
            include: {
                student: { include: { user: true } },
                drive: { include: { company: true } },
            },
            orderBy: { appliedAt: 'desc' },
        });

        const formattedApps = apps.map((app) => ({
            id: app.id,
            studentId: app.studentId,
            studentName: app.student.fullName,
            studentEmail: app.student.user.email,
            companyName: app.drive.company.name,
            driveId: app.driveId,
            role: app.drive.role,
            ctc: app.drive.ctc,
            appliedDate: app.appliedAt,
            status: app.status,
        }));

        res.status(200).json({ success: true, applications: formattedApps });
    } catch (err) {
        console.error('Error fetching applications:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const updateApplicationStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !Object.values(ApplicationStatus).includes(status)) {
            res.status(400).json({ success: false, message: 'Invalid status' });
            return;
        }

        const existingApp = await prisma.application.findUnique({ where: { id } });
        if (!existingApp) {
            res.status(404).json({ success: false, message: 'Application not found' });
            return;
        }

        const updatedApp = await prisma.application.update({
            where: { id },
            data: { status },
        });

        res.status(200).json({ success: true, application: updatedApp });
    } catch (err) {
        console.error('Error updating application status:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
