import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getDrives, getDriveById } from '../controllers/drive.controller';

const router = Router();

// Any authenticated user (STUDENT or TPO) can list/view drives.
router.get('/', authenticate, getDrives);
router.get('/:id', authenticate, getDriveById);

export default router;
