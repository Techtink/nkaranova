import express from 'express';
import {
  createOrder,
  getCustomerOrders,
  getTailorOrders,
  getOrder,
  submitWorkPlan,
  approveWorkPlan,
  rejectWorkPlan,
  completeStage,
  addStageNote,
  requestDelay,
  respondToDelayRequest,
  markOrderCompleted,
  cancelOrder,
  getOrderStats,
  getAdminOrders,
  getOverdueOrders
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Customer routes
router.get('/customer', getCustomerOrders);
router.put('/:id/work-plan/approve', approveWorkPlan);
router.put('/:id/work-plan/reject', rejectWorkPlan);
router.put('/:id/delay-request/:requestId', respondToDelayRequest);
router.put('/:id/complete', markOrderCompleted);

// Tailor routes
router.get('/tailor', authorize('tailor'), getTailorOrders);
router.get('/stats', authorize('tailor'), getOrderStats);
router.post('/:id/work-plan', authorize('tailor'), submitWorkPlan);
router.put('/:id/stages/:stageIndex/complete', authorize('tailor'), completeStage);
router.post('/:id/stages/:stageIndex/notes', authorize('tailor'), addStageNote);
router.post('/:id/delay-request', authorize('tailor'), requestDelay);

// Admin routes
router.get('/admin', authorize('admin'), getAdminOrders);
router.get('/admin/overdue', authorize('admin'), getOverdueOrders);

// Shared routes
router.post('/', createOrder);
router.get('/:id', getOrder);
router.put('/:id/cancel', cancelOrder);

export default router;
