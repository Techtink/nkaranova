import express from 'express';
import {
  getFeaturedTailors,
  getFeaturedPricing,
  getFeaturedAvailability,
  redeemTokensForFeaturedSpot,
  createFeaturedSpotPayment,
  confirmFeaturedSpotPayment,
  getMyFeaturedStatus,
  getMyWaitlistStatus,
  cancelMyWaitlistEntry,
  getAllFeaturedSpots,
  adminCreateFeaturedSpot,
  adminCancelFeaturedSpot,
  getWaitlist,
  adminProcessWaitlist
} from '../controllers/featuredController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getFeaturedTailors);
router.get('/pricing', getFeaturedPricing);
router.get('/availability', getFeaturedAvailability);

// Protected tailor routes
router.get('/my-status', protect, authorize('tailor'), getMyFeaturedStatus);
router.get('/my-waitlist-status', protect, authorize('tailor'), getMyWaitlistStatus);
router.post('/redeem-tokens', protect, authorize('tailor'), redeemTokensForFeaturedSpot);
router.post('/create-payment', protect, authorize('tailor'), createFeaturedSpotPayment);
router.post('/confirm-payment', protect, authorize('tailor'), confirmFeaturedSpotPayment);
router.post('/cancel-waitlist', protect, authorize('tailor'), cancelMyWaitlistEntry);

// Admin routes
router.get('/admin/all', protect, authorize('admin'), getAllFeaturedSpots);
router.get('/admin/waitlist', protect, authorize('admin'), getWaitlist);
router.post('/admin/create', protect, authorize('admin'), adminCreateFeaturedSpot);
router.post('/admin/cancel/:spotId', protect, authorize('admin'), adminCancelFeaturedSpot);
router.post('/admin/process-waitlist', protect, authorize('admin'), adminProcessWaitlist);

export default router;
