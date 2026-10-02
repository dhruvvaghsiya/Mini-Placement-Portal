import { Router } from 'express';
import { requireStudent } from '../middleware/authenticate';
import { getProfile, createProfile, updateProfile } from '../controllers/student.controller';

const router = Router();

// All student routes require authentication + STUDENT role
router.get('/profile', requireStudent, getProfile);
router.post('/profile', requireStudent, createProfile);
router.patch('/profile', requireStudent, updateProfile);

export default router;
