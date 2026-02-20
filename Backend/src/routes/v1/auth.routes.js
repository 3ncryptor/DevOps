import { Router } from 'express';
import {
    register,
    login,
    refresh,
    logout,
    logoutAll,
    changePasswordHandler,
    getCurrentUser,
} from '../../controllers/auth.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);

// Protected routes (require authentication)
router.post('/logout', authenticate, logout);
router.post('/logout-all', authenticate, logoutAll);
router.post('/change-password', authenticate, changePasswordHandler);
router.get('/me', authenticate, getCurrentUser);

export default router;
