import { Router } from 'express';
import { requireTPO } from '../middleware/authenticate';
import { verifyStudentHandler } from '../controllers/tpo.controller';

const router = Router();

// All TPO routes require authentication + TPO role.
// requireTPO = [authenticate, roleCheck(TPO)]

// ─── PATCH /api/tpo/students/:id/verify ──────────────────────────────────────
router.patch('/students/:id/verify', ...requireTPO, verifyStudentHandler);

export default router;
