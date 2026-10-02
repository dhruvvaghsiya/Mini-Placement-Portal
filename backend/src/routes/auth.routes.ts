import { Router } from 'express';
import { register, login, me, logout } from '../controllers/auth.controller';
import { authenticate, requireStudent, requireTPO } from '../middleware/authenticate';

const router = Router();

// ─── Public routes ────────────────────────────────────────────────────────────
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// ─── Protected routes ─────────────────────────────────────────────────────────
router.get('/me', authenticate, me);

// ─── Role-guard smoke-test routes (dev only) ──────────────────────────────────
// These endpoints exist purely to verify middleware behaviour. They can be
// removed once real student/TPO routers are connected.
router.get('/test/student', ...requireStudent, (_req, res) => {
    res.json({ success: true, message: 'STUDENT access confirmed', user: _req.user });
});

router.get('/test/tpo', ...requireTPO, (_req, res) => {
    res.json({ success: true, message: 'TPO access confirmed', user: _req.user });
});

export default router;
