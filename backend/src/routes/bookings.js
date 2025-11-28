import express from 'express';
import {
  createBooking,
  getCustomerBookings,
  getTailorBookings,
  getBooking,
  updateBookingStatus,
  cancelBooking,
  getBookingStats,
  // New flow endpoints
  confirmBooking,
  markConsultationComplete,
  submitQuote,
  acceptQuote,
  rejectQuote,
  processPayment,
  getPendingQuotes,
  getBookingsNeedingQuote
} from '../controllers/bookingController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Customer routes
router.post('/', createBooking);
router.get('/customer', getCustomerBookings);
router.get('/pending-quotes', getPendingQuotes);

// Tailor routes
router.get('/tailor', authorize('tailor'), getTailorBookings);
router.get('/stats', authorize('tailor'), getBookingStats);
router.get('/needs-quote', authorize('tailor'), getBookingsNeedingQuote);
router.put('/:id/confirm', authorize('tailor'), confirmBooking);
router.post('/:id/quote', authorize('tailor'), submitQuote);

// Customer quote response
router.put('/:id/quote/accept', acceptQuote);
router.put('/:id/quote/reject', rejectQuote);

// Payment and order creation
router.post('/:id/pay', processPayment);

// General routes
router.get('/:id', getBooking);
router.put('/:id/status', authorize('tailor'), updateBookingStatus);
router.put('/:id/cancel', cancelBooking);

// Admin routes
router.put('/:id/consultation-complete', authorize('admin'), markConsultationComplete);

export default router;
