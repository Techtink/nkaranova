import express from 'express';
import {
  getAllSettings,
  getSettingsByCategory,
  getSetting,
  updateSetting,
  updateMultipleSettings,
  initializeSettings,
  getPublicReferralSettings,
  getPublicLandingSettings,
  getPublicMobileSettings,
  uploadHeroImage
} from '../controllers/settingsController.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadHeroImage as uploadHeroImageMiddleware } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/public/referral', getPublicReferralSettings);
router.get('/public/landing', getPublicLandingSettings);
router.get('/public/mobile', getPublicMobileSettings);

// Admin routes
router.get('/', protect, authorize('admin'), getAllSettings);
router.put('/', protect, authorize('admin'), updateMultipleSettings);
router.post('/upload-hero', protect, authorize('admin'), uploadHeroImageMiddleware, uploadHeroImage);
router.get('/category/:category', protect, authorize('admin'), getSettingsByCategory);
router.post('/initialize', protect, authorize('admin'), initializeSettings);
router.get('/:key', protect, authorize('admin'), getSetting);
router.put('/:key', protect, authorize('admin'), updateSetting);

export default router;
