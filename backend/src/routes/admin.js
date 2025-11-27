import express from 'express';
import {
  getDashboardStats,
  getPendingTailors,
  updateTailorApproval,
  getPendingWorks,
  updateWorkApproval,
  toggleWorkFeatured,
  getPendingReviews,
  updateReviewApproval,
  deleteReview,
  getPendingVerifications,
  updateVerification,
  getAllConversations,
  toggleConversationFlag,
  // Team & Roles
  getTeamMembers,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
  getRoles,
  createRole,
  updateRole,
  deleteRole
} from '../controllers/adminController.js';
import { protect, authorize, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected and admin-only
router.use(protect);
router.use(authorize('admin'));

// Dashboard - all admins can view
router.get('/stats', getDashboardStats);

// Tailor approvals - requires manage_tailors permission
router.get('/tailors', getPendingTailors);
router.get('/tailors/pending', getPendingTailors);
router.put('/tailors/:id/approval', requirePermission('manage_tailors'), updateTailorApproval);

// Work approvals - requires manage_works permission
router.get('/works', getPendingWorks);
router.get('/works/pending', getPendingWorks);
router.put('/works/:id/approval', requirePermission('manage_works'), updateWorkApproval);
router.put('/works/:id/feature', requirePermission('manage_works'), toggleWorkFeatured);

// Review approvals - requires manage_reviews permission
router.get('/reviews', getPendingReviews);
router.get('/reviews/pending', getPendingReviews);
router.put('/reviews/:id/approval', requirePermission('manage_reviews'), updateReviewApproval);
router.delete('/reviews/:id', requirePermission('manage_reviews'), deleteReview);

// Verifications - requires manage_verifications permission
router.get('/verifications', getPendingVerifications);
router.get('/verifications/pending', getPendingVerifications);
router.put('/verifications/:id', requirePermission('manage_verifications'), updateVerification);

// Conversations - all admins can view, flagging requires permission
router.get('/conversations', getAllConversations);
router.put('/conversations/:id/flag', toggleConversationFlag);

// Team management - requires manage_team permission
router.get('/team', requirePermission('manage_team'), getTeamMembers);
router.post('/team', requirePermission('manage_team'), addTeamMember);
router.put('/team/:id', requirePermission('manage_team'), updateTeamMember);
router.delete('/team/:id', requirePermission('manage_team'), removeTeamMember);

// Roles management - requires manage_team permission
router.get('/roles', getRoles); // All admins can see roles for assignment purposes
router.post('/roles', requirePermission('manage_team'), createRole);
router.put('/roles/:id', requirePermission('manage_team'), updateRole);
router.delete('/roles/:id', requirePermission('manage_team'), deleteRole);

export default router;
