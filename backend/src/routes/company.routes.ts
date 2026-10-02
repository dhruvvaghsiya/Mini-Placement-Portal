import { Router } from 'express';
import { authenticate, requireTPO } from '../middleware/authenticate';
import { getCompanies, createCompany } from '../controllers/company.controller';

const router = Router();

// ─── GET /api/companies ───────────────────────────────────────────────────────
// Any authenticated user (STUDENT or TPO) can list companies.
router.get('/', authenticate, getCompanies);

// ─── POST /api/companies ──────────────────────────────────────────────────────
// Only TPO users can create companies.
router.post('/', ...requireTPO, createCompany);

export default router;
