import express from 'express';
import {
  startConversation,
  sendGuestMessage,
  getConversation,
  getGuestConversations,
  getGuestConversationById,
  sendAdminMessage,
  closeConversation,
  getUnreadCount
} from '../controllers/guestChatController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes (for guests)
router.post('/start', startConversation);
router.get('/:id', getConversation);
router.post('/:id/messages', sendGuestMessage);

// Admin routes
router.get('/admin/conversations', protect, authorize('admin'), getGuestConversations);
router.get('/admin/unread', protect, authorize('admin'), getUnreadCount);
router.get('/admin/conversations/:id', protect, authorize('admin'), getGuestConversationById);
router.post('/admin/conversations/:id/messages', protect, authorize('admin'), sendAdminMessage);
router.put('/admin/conversations/:id/close', protect, authorize('admin'), closeConversation);

export default router;
