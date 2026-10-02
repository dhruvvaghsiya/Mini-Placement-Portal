import { Router } from 'express';
import { requireTPO } from '../middleware/authenticate';
import {
    verifyStudentHandler,
    getApplicationsHandler,
    updateApplicationStatusHandler,
} from '../controllers/tpo.controller';

const router = Router();

// All TPO routes require authentication + TPO role.
// requireTPO = [authenticate, roleCheck(TPO)]

// ─── PATCH /api/tpo/students/:id/verify ──────────────────────────────────────
router.patch('/students/:id/verify', ...requireTPO, verifyStudentHandler);

// ─── GET /api/tpo/applications ────────────────────────────────────────────────
router.get('/applications', ...requireTPO, getApplicationsHandler);

// ─── PATCH /api/tpo/applications/:id/status ──────────────────────────────────
router.patch('/applications/:id/status', ...requireTPO, updateApplicationStatusHandler);

export default router;
