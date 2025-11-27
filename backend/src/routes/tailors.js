import express from 'express';
import {
  getTailors,
  getTailorByUsername,
  getMyProfile,
  updateMyProfile,
  getTailorAvailability,
  updateMyAvailability,
  getAvailableSlots,
  submitVerification,
  getFeaturedTailors,
  checkUsernameAvailability
} from '../controllers/tailorController.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';
import { uploadProfilePhoto } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/featured', getFeaturedTailors);
router.get('/', getTailors);

// Protected tailor routes (must come before :username routes)
router.get('/me/profile', protect, authorize('tailor'), getMyProfile);
router.put('/me/profile', protect, authorize('tailor'), updateMyProfile);
router.put('/me/availability', protect, authorize('tailor'), updateMyAvailability);
router.post('/me/verification', protect, authorize('tailor'), submitVerification);
router.get('/check-username/:username', protect, authorize('tailor'), checkUsernameAvailability);

// Public username routes (after /me routes to avoid conflicts)
router.get('/:username', getTailorByUsername);
router.get('/:username/availability', getTailorAvailability);
router.get('/:username/slots/:date', getAvailableSlots);

export default router;
