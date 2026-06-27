import express from 'express';
import { getInvoices, createCheckoutSession } from '../controllers/billing.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/invoices', getInvoices);
router.post('/checkout', createCheckoutSession);

export default router;
