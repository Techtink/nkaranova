import express from 'express';
import {
  getTailorReviews,
  createReview,
  updateReview,
  deleteReview,
  respondToReview,
  markHelpful,
  getMyReviews
} from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/tailor/:username', getTailorReviews);

// Protected routes
router.use(protect);

router.get('/me', getMyReviews);
router.post('/', createReview);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);
router.post('/:id/helpful', markHelpful);
router.post('/:id/respond', authorize('tailor'), respondToReview);

export default router;
