import express from 'express';
import {
  getLeads,
  getLeadById,
  updateLeadStatus,
  toggleBookmark,
  addNote,
  assignLead,
  addLeadManually,
  exportLeads,
  getDashboardStats,
  getActiveCities
} from '../controllers/lead.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/cities', getActiveCities);
router.get('/', getLeads);
router.post('/', addLeadManually);
router.get('/export', exportLeads);
router.get('/:id', getLeadById);
router.put('/:id/status', updateLeadStatus);
router.put('/:id/bookmark', toggleBookmark);
router.post('/:id/notes', addNote);
router.put('/:id/assign', assignLead);

export default router;
