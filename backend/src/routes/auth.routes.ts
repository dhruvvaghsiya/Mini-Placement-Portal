import { Router } from 'express';
import { register, login, me, logout } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes — require a valid JWT cookie
router.get('/me', authenticate, me);
router.post('/logout', authenticate, logout);

export default router;
