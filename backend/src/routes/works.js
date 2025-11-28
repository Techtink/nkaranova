import express from 'express';
import {
  getWorks,
  getWork,
  getMyWorks,
  createWork,
  updateWork,
  deleteWork,
  getFeaturedWorks,
  getCategories
} from '../controllers/workController.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadWorkImages } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/featured', getFeaturedWorks);
router.get('/categories', getCategories);
router.get('/', getWorks);

// Protected tailor routes - /me must come before /:id to avoid matching "me" as an ID
router.get('/me', protect, authorize('tailor'), getMyWorks);
router.post('/', protect, authorize('tailor'), createWork);

// These routes with :id param must come after /me
router.get('/:id', getWork);
router.put('/:id', protect, authorize('tailor'), updateWork);
router.delete('/:id', protect, authorize('tailor'), deleteWork);

export default router;
