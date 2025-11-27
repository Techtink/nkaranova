import Booking from '../models/Booking.js';
import TailorProfile from '../models/TailorProfile.js';
import TailorAvailability from '../models/TailorAvailability.js';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import CustomerMeasurement from '../models/CustomerMeasurement.js';
import emailService from '../services/emailService.js';
import stripeService from '../services/stripeService.js';
import { paginationResult } from '../utils/helpers.js';

// @desc    Create booking
// @route   POST /api/bookings
// @access  Private
export const createBooking = async (req, res, next) => {
  try {
    const {
      tailorUsername,
      date,
      startTime,
      endTime,
      service,
      notes,
      referenceImages,
      measurementProfileId
    } = req.body;

    // Find tailor
    const tailor = await TailorProfile.findOne({
      username: tailorUsername,
      approvalStatus: 'approved'
    });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor not found'
      });
    }

    if (!tailor.acceptingBookings) {
      return res.status(400).json({
        success: false,
        message: 'Tailor is not accepting bookings at this time'
      });
    }

    // Check slot availability
    const targetDate = new Date(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const existingBooking = await Booking.findOne({
      tailor: tailor._id,
      date: {
        $gte: targetDate,
        $lt: nextDay
      },
      startTime,
      status: { $in: ['pending', 'accepted'] }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is no longer available'
      });
    }

    // Handle measurement profile if provided
    let measurementProfile = null;
    let measurementSnapshot = [];

    if (measurementProfileId) {
      measurementProfile = await CustomerMeasurement.findOne({
        _id: measurementProfileId,
        customer: req.user._id,
        isActive: true
      });

      if (measurementProfile) {
        // Create snapshot of current measurements
        measurementSnapshot = measurementProfile.measurements.map(m => ({
          pointKey: m.pointKey,
          value: m.value,
          unit: m.unit
        }));
      }
    }

    // Create booking
    const booking = await Booking.create({
      tailor: tailor._id,
      customer: req.user._id,
      date: targetDate,
      startTime,
      endTime,
      service,
      notes,
      referenceImages,
      measurementProfile: measurementProfile?._id,
      measurementSnapshot,
      statusHistory: [{
        status: 'pending',
        changedBy: req.user._id
      }]
    });

    // Send email notifications
    const tailorUser = await User.findById(tailor.user);
    await emailService.sendBookingConfirmation(booking, req.user, tailor);

    // Create or get conversation
    const conversation = await Conversation.findOrCreate(
      req.user._id,
      tailor.user,
      tailor._id
    );

    // Add system message about booking
    await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      content: `New booking request for ${service} on ${targetDate.toLocaleDateString()} at ${startTime}`,
      type: 'booking',
      metadata: { bookingId: booking._id }
    });

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my bookings (customer)
// @route   GET /api/bookings/customer
// @access  Private
export const getCustomerBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { customer: req.user._id };
    if (status) {
      query.status = status;
    }

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ date: -1 })
      .populate({
        path: 'tailor',
        select: 'username businessName profilePhoto',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      });

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: paginationResult(total, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my bookings (tailor)
// @route   GET /api/bookings/tailor
// @access  Private/Tailor
export const getTailorBookings = async (req, res, next) => {
  try {
    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    const { page = 1, limit = 10, status } = req.query;

    const query = { tailor: tailor._id };
    if (status) {
      query.status = status;
    }

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ date: -1 })
      .populate('customer', 'firstName lastName email avatar');

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: paginationResult(total, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
export const getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'tailor',
        select: 'username businessName profilePhoto user',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      })
      .populate('customer', 'firstName lastName email avatar')
      .populate('measurementProfile', 'profileName gender measurements preferredUnit');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization
    const isTailor = booking.tailor.user.toString() === req.user._id.toString();
    const isCustomer = booking.customer._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isTailor && !isCustomer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking status (tailor)
// @route   PUT /api/bookings/:id/status
// @access  Private/Tailor
export const updateBookingStatus = async (req, res, next) => {
  try {
    const { status, note, price } = req.body;

    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    const booking = await Booking.findOne({
      _id: req.params.id,
      tailor: tailor._id
    }).populate('customer', 'firstName lastName email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Validate status transition
    const validTransitions = {
      pending: ['accepted', 'declined'],
      accepted: ['completed', 'cancelled'],
      declined: [],
      completed: [],
      cancelled: []
    };

    if (!validTransitions[booking.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${booking.status} to ${status}`
      });
    }

    booking.status = status;
    booking.statusHistory.push({
      status,
      changedBy: req.user._id,
      note
    });

    if (status === 'declined') {
      booking.declineReason = note;
    }

    if (status === 'completed') {
      booking.completedAt = new Date();
      booking.completionNotes = note;

      // Release payment if held
      if (booking.stripePaymentIntentId && booking.paymentStatus === 'held') {
        await stripeService.capturePayment(booking.stripePaymentIntentId);
        booking.paymentStatus = 'released';
      }
    }

    if (status === 'accepted' && price) {
      booking.price = price;
    }

    await booking.save();

    // Send email notification
    await emailService.sendBookingStatusUpdate(
      booking,
      booking.customer,
      tailor,
      status
    );

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel booking (customer)
// @route   PUT /api/bookings/:id/cancel
// @access  Private
export const cancelBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const booking = await Booking.findOne({
      _id: req.params.id,
      customer: req.user._id
    }).populate({
      path: 'tailor',
      populate: { path: 'user', select: 'firstName lastName email' }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (!['pending', 'accepted'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel this booking'
      });
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancelledBy = req.user._id;
    booking.cancellationReason = reason;
    booking.statusHistory.push({
      status: 'cancelled',
      changedBy: req.user._id,
      note: reason
    });

    // Refund payment if held
    if (booking.stripePaymentIntentId && booking.paymentStatus === 'held') {
      await stripeService.cancelPayment(booking.stripePaymentIntentId);
      booking.paymentStatus = 'refunded';
    }

    await booking.save();

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get booking stats (tailor dashboard)
// @route   GET /api/bookings/stats
// @access  Private/Tailor
export const getBookingStats = async (req, res, next) => {
  try {
    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    const stats = await Booking.aggregate([
      { $match: { tailor: tailor._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedStats = {
      pending: 0,
      accepted: 0,
      declined: 0,
      completed: 0,
      cancelled: 0
    };

    stats.forEach(s => {
      formattedStats[s._id] = s.count;
    });

    // Get upcoming bookings
    const upcomingBookings = await Booking.find({
      tailor: tailor._id,
      status: 'accepted',
      date: { $gte: new Date() }
    })
      .sort({ date: 1 })
      .limit(5)
      .populate('customer', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: {
        stats: formattedStats,
        upcomingBookings
      }
    });
  } catch (error) {
    next(error);
  }
};
