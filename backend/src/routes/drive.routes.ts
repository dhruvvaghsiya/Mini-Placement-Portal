import { Router } from 'express';
import { authenticate, requireTPO } from '../middleware/authenticate';
import { getDrives, getDrive, createDrive } from '../controllers/drive.controller';

const router = Router();

// ─── GET /api/drives ──────────────────────────────────────────────────────────
// Any authenticated user (STUDENT or TPO) can list drives.
router.get('/', authenticate, getDrives);

// ─── GET /api/drives/:id ──────────────────────────────────────────────────────
// Any authenticated user can view a single drive.
router.get('/:id', authenticate, getDrive);

// ─── POST /api/drives ─────────────────────────────────────────────────────────
// Only TPO users can create drives.
router.post('/', ...requireTPO, createDrive);

export default router;
