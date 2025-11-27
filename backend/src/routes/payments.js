import express from 'express';
import {
  createConnectAccount,
  getOnboardingLink,
  getAccountStatus,
  createBookingPayment,
  confirmPayment,
  handleWebhook
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Webhook (no auth)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Protected routes
router.use(protect);

// Tailor routes
router.post('/connect', authorize('tailor'), createConnectAccount);
router.get('/onboarding', authorize('tailor'), getOnboardingLink);
router.get('/status', authorize('tailor'), getAccountStatus);

// Customer routes
router.post('/booking/:bookingId', createBookingPayment);
router.post('/confirm/:bookingId', confirmPayment);

export default router;
