import { Router } from 'express';
import { requireTPO } from '../middleware/authenticate';
import { getApplications, updateApplicationStatus } from '../controllers/tpo.controller';

const router = Router();

router.use(requireTPO);

router.get('/applications', getApplications);
router.patch('/applications/:id/status', updateApplicationStatus);

export default router;
