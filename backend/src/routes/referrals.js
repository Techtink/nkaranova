import express from 'express';
import {
  getMyReferralInfo,
  getTokenHistory,
  processReferral,
  completeReferral,
  validateReferralCode,
  getAllReferrals,
  adjustTokens
} from '../controllers/referralController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/validate/:code', validateReferralCode);

// Protected tailor routes
router.get('/my-info', protect, authorize('tailor'), getMyReferralInfo);
router.get('/token-history', protect, authorize('tailor'), getTokenHistory);

// Internal routes (used during registration)
router.post('/process', protect, processReferral);

// Admin routes
router.get('/admin/all', protect, authorize('admin'), getAllReferrals);
router.post('/admin/complete/:referralId', protect, authorize('admin'), completeReferral);
router.post('/admin/adjust-tokens', protect, authorize('admin'), adjustTokens);

export default router;
