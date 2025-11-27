import express from 'express';
import {
  createBooking,
  getCustomerBookings,
  getTailorBookings,
  getBooking,
  updateBookingStatus,
  cancelBooking,
  getBookingStats
} from '../controllers/bookingController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.post('/', createBooking);
router.get('/customer', getCustomerBookings);
router.get('/tailor', authorize('tailor'), getTailorBookings);
router.get('/stats', authorize('tailor'), getBookingStats);
router.get('/:id', getBooking);
router.put('/:id/status', authorize('tailor'), updateBookingStatus);
router.put('/:id/cancel', cancelBooking);

export default router;
