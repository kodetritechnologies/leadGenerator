import express from 'express';
import {
  analyzeWebsite,
  generateEmail,
  generateLeadProposal,
  chatWithAI,
  getChats,
  getChatMessages,
  sendDirectEmail,
  generateWhatsAppMsg,
  logWhatsAppActivity
} from '../controllers/ai.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/analyze/:leadId', analyzeWebsite);
router.post('/email/send', sendDirectEmail);
router.post('/email/:leadId', generateEmail);
router.post('/proposal/:leadId', generateLeadProposal);
router.post('/chat', chatWithAI);
router.get('/chats', getChats);
router.get('/chats/:chatId/messages', getChatMessages);
router.post('/whatsapp/log/:leadId', logWhatsAppActivity);
router.post('/whatsapp/:leadId', generateWhatsAppMsg);

export default router;
