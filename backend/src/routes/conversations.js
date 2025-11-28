import express from 'express';
import {
  getConversations,
  startConversationWithTailor,
  startConversationWithUser,
  getConversation,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount
} from '../controllers/conversationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/', getConversations);
router.get('/unread', getUnreadCount);
router.post('/tailor/:username', startConversationWithTailor);
router.post('/user/:userId', startConversationWithUser);
router.get('/:id', getConversation);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', sendMessage);
router.put('/:id/read', markAsRead);

export default router;
