import { Router } from 'express';
import { login, logout, getMe, updateProfile } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', getMe);
router.put('/profile', authenticate, updateProfile);

export default router;
