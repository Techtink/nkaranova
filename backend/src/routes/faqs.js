import express from 'express';
import {
  getFAQs,
  getAdminFAQs,
  getFAQ,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  reorderFAQs,
  getFAQCategories
} from '../controllers/faqController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/categories', getFAQCategories);
router.get('/', getFAQs);

// Admin routes
router.get('/admin', protect, authorize('admin'), getAdminFAQs);
router.post('/', protect, authorize('admin'), createFAQ);
router.put('/reorder', protect, authorize('admin'), reorderFAQs);

// These routes with :id param must come after other routes
router.get('/:id', getFAQ);
router.put('/:id', protect, authorize('admin'), updateFAQ);
router.delete('/:id', protect, authorize('admin'), deleteFAQ);

export default router;
