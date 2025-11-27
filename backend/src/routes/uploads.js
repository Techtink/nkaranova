import express from 'express';
import {
  uploadWorkImages as uploadWorkImagesController,
  uploadProfilePhoto as uploadProfilePhotoController,
  uploadVerificationDocs as uploadVerificationDocsController,
  uploadHeroImage as uploadHeroImageController,
  deleteUpload
} from '../controllers/uploadController.js';
import { protect, authorize } from '../middleware/auth.js';
import {
  uploadWorkImages,
  uploadProfilePhoto,
  uploadVerificationDocs,
  uploadHeroImage
} from '../middleware/upload.js';

const router = express.Router();

// Work images upload (for tailor portfolio)
router.post(
  '/works',
  protect,
  authorize('tailor'),
  uploadWorkImages,
  uploadWorkImagesController
);

// Profile photo upload
router.post(
  '/profile',
  protect,
  uploadProfilePhoto,
  uploadProfilePhotoController
);

// Verification documents upload
router.post(
  '/verification',
  protect,
  authorize('tailor'),
  uploadVerificationDocs,
  uploadVerificationDocsController
);

// Hero image upload (admin only)
router.post(
  '/hero',
  protect,
  authorize('admin'),
  uploadHeroImage,
  uploadHeroImageController
);

// Delete uploaded file
router.delete('/:type/:filename', protect, deleteUpload);

export default router;
