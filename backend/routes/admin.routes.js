import express from 'express';
import { getUsers, updateUserCredits, getSystemStats } from '../controllers/admin.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/users', getUsers);
router.put('/users/:userId/credits', updateUserCredits);
router.get('/stats', getSystemStats);

export default router;
