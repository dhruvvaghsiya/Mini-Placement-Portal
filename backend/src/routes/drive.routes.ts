import { Router } from 'express';
import { authenticate, requireStudent, requireTPO } from '../middleware/authenticate';
import {
    getDrives,
    getDriveById,
    getEligibleStudents,
    createDrive,
    applyToDrive,
} from '../controllers/drive.controller';

const router = Router();

// Any authenticated user (STUDENT or TPO) can list/view drives.
router.get('/', authenticate, getDrives);
router.get('/:id', authenticate, getDriveById);

// TPO only — create drive
router.post('/', ...requireTPO, createDrive);

// TPO only — returns all eligible students for a specific drive.
router.get('/:id/eligible-students', ...requireTPO, getEligibleStudents);

// Student only — apply to a drive
router.post('/:id/apply', requireStudent, applyToDrive);

export default router;

