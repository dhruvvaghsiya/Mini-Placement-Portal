import { Router } from 'express';
import { requireTPO } from '../middleware/authenticate';
import {
    verifyStudentHandler,
    getApplicationsHandler,
    updateApplicationStatusHandler,
    getDashboardStatsHandler,
    getStudentsHandler,
    getStudentByIdHandler,
} from '../controllers/tpo.controller';

const router = Router();

// All TPO routes require authentication + TPO role.
// requireTPO = [authenticate, roleCheck(TPO)]

// ─── GET /api/tpo/dashboard/stats ────────────────────────────────────────────
router.get('/dashboard/stats', ...requireTPO, getDashboardStatsHandler);

// ─── Students management ──────────────────────────────────────────────────────
router.get('/students', ...requireTPO, getStudentsHandler);
router.get('/students/:id', ...requireTPO, getStudentByIdHandler);
router.patch('/students/:id/verify', ...requireTPO, verifyStudentHandler);

// ─── Applications management ──────────────────────────────────────────────────
router.get('/applications', ...requireTPO, getApplicationsHandler);
router.patch('/applications/:id/status', ...requireTPO, updateApplicationStatusHandler);

export default router;
