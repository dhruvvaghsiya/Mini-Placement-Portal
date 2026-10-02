import { Router } from 'express';
import { authenticate, requireTPO } from '../middleware/authenticate';
import { getDrives, getDriveById, getEligibleStudents } from '../controllers/drive.controller';

const router = Router();

// Any authenticated user (STUDENT or TPO) can list/view drives.
router.get('/', authenticate, getDrives);
router.get('/:id', authenticate, getDriveById);

// TPO only — returns all eligible students for a specific drive.
router.get('/:id/eligible-students', ...requireTPO, getEligibleStudents);

export default router;

