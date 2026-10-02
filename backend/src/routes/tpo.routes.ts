import { Router } from 'express';
import { requireTPO } from '../middleware/authenticate';
import {
    verifyStudentHandler,
    getApplicationsHandler,
    updateApplicationStatusHandler,
    getDashboardStatsHandler,
} from '../controllers/tpo.controller';

const router = Router();

// All TPO routes require authentication + TPO role.
// requireTPO = [authenticate, roleCheck(TPO)]

// ─── GET /api/tpo/dashboard/stats ────────────────────────────────────────────
router.get('/dashboard/stats', ...requireTPO, getDashboardStatsHandler);

// ─── PATCH /api/tpo/students/:id/verify ──────────────────────────────────────
router.patch('/students/:id/verify', ...requireTPO, verifyStudentHandler);

// ─── GET /api/tpo/applications ────────────────────────────────────────────────
router.get('/applications', ...requireTPO, getApplicationsHandler);

// ─── PATCH /api/tpo/applications/:id/status ──────────────────────────────────
router.patch('/applications/:id/status', ...requireTPO, updateApplicationStatusHandler);

export default router;
