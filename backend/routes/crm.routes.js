import express from 'express';
import { getTasks, createTask, completeTask, getActivities } from '../controllers/crm.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/tasks/:leadId', getTasks);
router.post('/tasks/:leadId', createTask);
router.put('/tasks/:taskId/complete', completeTask);
router.get('/activities/:leadId', getActivities);

export default router;
