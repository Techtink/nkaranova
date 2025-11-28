import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  startLivenessSession,
  verifyLivenessChallenge,
  getLivenessSession,
  compareFaceWithID,
  getVerificationRequirements,
  getVerificationStatus,
  submitVerification
} from '../controllers/verificationController.js';

const router = express.Router();

// Public routes
router.get('/requirements', getVerificationRequirements);

// Protected routes (require authentication)
router.use(protect);

// Tailor-only routes
router.post('/liveness/start', authorize('tailor'), startLivenessSession);
router.post('/liveness/verify', authorize('tailor'), verifyLivenessChallenge);
router.get('/liveness/:sessionId', authorize('tailor'), getLivenessSession);
router.post('/face-match', authorize('tailor'), compareFaceWithID);
router.get('/status', authorize('tailor'), getVerificationStatus);
router.post('/submit', authorize('tailor'), submitVerification);

export default router;
