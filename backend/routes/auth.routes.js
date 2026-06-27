import express from 'express';
import { register, login, logout, getMe, forgotPassword, resetPassword, verifyEmail } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:token', resetPassword);
router.get('/verifyemail/:token', verifyEmail);

export default router;
