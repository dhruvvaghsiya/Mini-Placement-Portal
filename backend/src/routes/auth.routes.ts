import { Router } from 'express';
import { register, login, me, logout } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// ─── Public routes ────────────────────────────────────────────────────────────
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// ─── Protected routes ─────────────────────────────────────────────────────────
router.get('/me', authenticate, me);

export default router;
