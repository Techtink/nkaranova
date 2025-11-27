import express from 'express';
import {
  aiSearch,
  getRecommendations,
  globalSearch,
  getSuggestions
} from '../controllers/searchController.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', globalSearch);
router.get('/suggestions', getSuggestions);
router.post('/ai', aiSearch);

// Protected routes
router.get('/recommendations', protect, getRecommendations);

export default router;
