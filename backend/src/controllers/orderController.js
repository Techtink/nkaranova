import Order from '../models/Order.js';
import Booking from '../models/Booking.js';
import TailorProfile from '../models/TailorProfile.js';
import Settings from '../models/Settings.js';
import emailService from '../services/emailService.js';
import { paginationResult } from '../utils/helpers.js';

// @desc    Create order from booking (triggered after payment)
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('customer', 'firstName lastName email')
      .populate({
        path: 'tailor',
        populate: { path: 'user', select: 'firstName lastName email' }
      });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if order already exists for this booking
    const existingOrder = await Order.findOne({ booking: bookingId });
    if (existingOrder) {
      return res.status(400).json({
        success: false,
        message: 'Order already exists for this booking'
      });
    }

    // Get plan creation deadline from settings
    const deadlineHours = await Settings.getValue('order_plan_creation_deadline_hours') || 48;
    const planDeadline = new Date();
    planDeadline.setHours(planDeadline.getHours() + deadlineHours);

    const order = await Order.create({
      booking: booking._id,
      customer: booking.customer._id,
      tailor: booking.tailor._id,
      planDeadline,
      statusHistory: [{
        status: 'awaiting_plan',
        changedBy: req.user._id,
        note: 'Order created after payment confirmation'
      }]
    });

    // Send notification to tailor about new order
    await emailService.sendNewOrderNotification(
      order,
      booking.customer,
      booking.tailor,
      planDeadline
    );

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer orders
// @route   GET /api/orders/customer
// @access  Private
export const getCustomerOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { customer: req.user._id };
    if (status) {
      query.status = status;
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate({
        path: 'tailor',
        select: 'username businessName profilePhoto',
        populate: { path: 'user', select: 'firstName lastName' }
      })
      .populate({
        path: 'booking',
        select: 'service date notes referenceImages'
      });

    res.status(200).json({
      success: true,
      data: orders,
      pagination: paginationResult(total, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tailor orders
// @route   GET /api/orders/tailor
// @access  Private/Tailor
export const getTailorOrders = async (req, res, next) => {
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

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate('customer', 'firstName lastName email avatar')
      .populate({
        path: 'booking',
        select: 'service date notes referenceImages measurementSnapshot'
      });

    res.status(200).json({
      success: true,
      data: orders,
      pagination: paginationResult(total, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate({
        path: 'tailor',
        select: 'username businessName profilePhoto user',
        populate: { path: 'user', select: 'firstName lastName email' }
      })
      .populate('customer', 'firstName lastName email avatar')
      .populate({
        path: 'booking',
        select: 'service date startTime notes referenceImages measurementProfile measurementSnapshot',
        populate: { path: 'measurementProfile' }
      })
      .populate('statusHistory.changedBy', 'firstName lastName')
      .populate('workPlan.stages.notes.addedBy', 'firstName lastName')
      .populate('delayRequests.requestedBy', 'firstName lastName')
      .populate('delayRequests.reviewedBy', 'firstName lastName');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    const isTailor = order.tailor.user._id.toString() === req.user._id.toString();
    const isCustomer = order.customer._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isTailor && !isCustomer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit work plan (tailor)
// @route   POST /api/orders/:id/work-plan
// @access  Private/Tailor
export const submitWorkPlan = async (req, res, next) => {
  try {
    const { stages, workPlan } = req.body;

    // Support both old format (stages array) and new format (workPlan object)
    const isNewFormat = workPlan && workPlan.stages;

    if (!isNewFormat && (!stages || !Array.isArray(stages) || stages.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'At least one stage is required'
      });
    }

    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      tailor: tailor._id
    }).populate('customer', 'firstName lastName email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if plan can be submitted
    if (!['awaiting_plan', 'plan_rejected'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot submit work plan at this stage'
      });
    }

    // Check revision limit if resubmitting
    if (order.status === 'plan_rejected') {
      const maxRevisions = await Settings.getValue('order_max_plan_revisions') || 3;
      const currentRevisions = order.workPlan?.revisionHistory?.length || 0;

      if (currentRevisions >= maxRevisions) {
        return res.status(400).json({
          success: false,
          message: `Maximum revision limit (${maxRevisions}) reached`
        });
      }

      // Store previous plan in revision history
      if (order.workPlan?.stages) {
        order.workPlan.revisionHistory.push({
          revisedAt: new Date(),
          revisedBy: req.user._id,
          reason: order.workPlan.rejectionReason,
          previousStages: order.workPlan.stages.map(s => ({
            name: s.name,
            description: s.description,
            estimatedDays: s.estimatedDays
          }))
        });
      }
    }

    // Submit the work plan (supports both formats)
    order.submitWorkPlan(isNewFormat ? workPlan : stages, req.user._id);
    await order.save();

    // For new format (fixed 4-stage), no customer approval needed - goes to consultation
    if (!isNewFormat) {
      // Old format: Check if customer approval is required
      const approvalRequired = await Settings.getValue('order_customer_approval_required');

      if (!approvalRequired) {
        // Auto-approve and start work
        order.approveWorkPlan(req.user._id);
        await order.save();
      } else {
        // Send notification to customer for approval
        await emailService.sendWorkPlanSubmitted(order, order.customer, tailor);
      }
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'firstName lastName email');

    res.status(200).json({
      success: true,
      data: populatedOrder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete consultation stage (admin only)
// @route   PUT /api/orders/:id/complete-consultation
// @access  Private/Admin
export const completeConsultation = async (req, res, next) => {
  try {
    const { notes } = req.body;

    // Only admin can complete consultation
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can complete consultation stage'
      });
    }

    const order = await Order.findById(req.params.id)
      .populate('customer', 'firstName lastName email')
      .populate({
        path: 'tailor',
        populate: { path: 'user', select: 'firstName lastName email' }
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'consultation') {
      return res.status(400).json({
        success: false,
        message: 'Order is not in consultation stage'
      });
    }

    // Complete consultation and start design phase
    order.completeConsultation(req.user._id, notes);
    await order.save();

    // Notify tailor that design phase can begin
    await emailService.sendConsultationCompleted(order, order.tailor, order.customer);

    res.status(200).json({
      success: true,
      message: 'Consultation completed, design phase started',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve work plan (customer)
// @route   PUT /api/orders/:id/work-plan/approve
// @access  Private
export const approveWorkPlan = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user._id
    }).populate({
      path: 'tailor',
      populate: { path: 'user', select: 'firstName lastName email' }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'plan_review') {
      return res.status(400).json({
        success: false,
        message: 'No pending work plan to approve'
      });
    }

    order.approveWorkPlan(req.user._id);
    await order.save();

    // Notify tailor that work can begin
    await emailService.sendWorkPlanApproved(order, order.tailor);

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject work plan (customer)
// @route   PUT /api/orders/:id/work-plan/reject
// @access  Private
export const rejectWorkPlan = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user._id
    }).populate({
      path: 'tailor',
      populate: { path: 'user', select: 'firstName lastName email' }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'plan_review') {
      return res.status(400).json({
        success: false,
        message: 'No pending work plan to reject'
      });
    }

    order.rejectWorkPlan(reason, req.user._id);
    await order.save();

    // Notify tailor about rejection
    await emailService.sendWorkPlanRejected(order, order.tailor, reason);

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update stage progress (tailor)
// @route   PUT /api/orders/:id/stages/:stageIndex/complete
// @access  Private/Tailor
export const completeStage = async (req, res, next) => {
  try {
    const { stageIndex } = req.params;
    const { notes } = req.body;

    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      tailor: tailor._id
    }).populate('customer', 'firstName lastName email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Order is not in progress'
      });
    }

    order.completeStage(parseInt(stageIndex), notes, req.user._id);
    await order.save();

    // Notify customer of progress
    await emailService.sendStageCompleted(
      order,
      order.customer,
      order.workPlan.stages[stageIndex],
      order.progressPercentage
    );

    // If all stages complete, notify admin
    if (order.status === 'ready') {
      const notifyAdmin = await Settings.getValue('order_notify_admin_on_completion');
      if (notifyAdmin) {
        await emailService.sendOrderCompletedAdmin(order);
      }
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add note to stage (tailor)
// @route   POST /api/orders/:id/stages/:stageIndex/notes
// @access  Private/Tailor
export const addStageNote = async (req, res, next) => {
  try {
    const { stageIndex } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Note text is required'
      });
    }

    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      tailor: tailor._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.workPlan?.stages?.[stageIndex]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stage index'
      });
    }

    order.workPlan.stages[stageIndex].notes.push({
      text,
      addedBy: req.user._id,
      addedAt: new Date()
    });

    await order.save();

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request delay (tailor)
// @route   POST /api/orders/:id/delay-request
// @access  Private/Tailor
export const requestDelay = async (req, res, next) => {
  try {
    const { reason, additionalDays } = req.body;

    if (!reason || !additionalDays) {
      return res.status(400).json({
        success: false,
        message: 'Reason and additional days are required'
      });
    }

    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      tailor: tailor._id
    }).populate('customer', 'firstName lastName email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Can only request delay for in-progress orders'
      });
    }

    // Check for pending delay requests
    const hasPendingRequest = order.delayRequests.some(dr => dr.status === 'pending');
    if (hasPendingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending delay request'
      });
    }

    order.delayRequests.push({
      requestedBy: req.user._id,
      reason,
      additionalDays: parseInt(additionalDays)
    });

    await order.save();

    // Notify customer and admin
    await emailService.sendDelayRequestNotification(order, order.customer, reason, additionalDays);

    const notifyAdmin = await Settings.getValue('order_notify_admin_on_delay');
    if (notifyAdmin) {
      await emailService.sendDelayRequestAdmin(order, reason, additionalDays);
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Respond to delay request (customer)
// @route   PUT /api/orders/:id/delay-request/:requestId
// @access  Private
export const respondToDelayRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { approved, notes } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user._id
    }).populate({
      path: 'tailor',
      populate: { path: 'user', select: 'firstName lastName email' }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const delayRequest = order.delayRequests.id(requestId);
    if (!delayRequest) {
      return res.status(404).json({
        success: false,
        message: 'Delay request not found'
      });
    }

    if (delayRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This delay request has already been processed'
      });
    }

    delayRequest.status = approved ? 'approved' : 'rejected';
    delayRequest.reviewedAt = new Date();
    delayRequest.reviewedBy = req.user._id;
    delayRequest.reviewNotes = notes;

    // If approved, extend the estimated completion date
    if (approved && order.workPlan?.estimatedCompletion) {
      const newCompletion = new Date(order.workPlan.estimatedCompletion);
      newCompletion.setDate(newCompletion.getDate() + delayRequest.additionalDays);
      order.workPlan.estimatedCompletion = newCompletion;
    }

    await order.save();

    // Notify tailor of response
    await emailService.sendDelayRequestResponse(order, order.tailor, approved, notes);

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark order as delivered/completed (customer)
// @route   PUT /api/orders/:id/complete
// @access  Private
export const markOrderCompleted = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user._id
    }).populate({
      path: 'tailor',
      populate: { path: 'user', select: 'firstName lastName email' }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'ready') {
      return res.status(400).json({
        success: false,
        message: 'Order is not ready for completion'
      });
    }

    order.markCompleted(req.user._id);

    if (rating) {
      order.completionFeedback = {
        rating,
        comment,
        submittedAt: new Date()
      };
    }

    await order.save();

    // Notify tailor
    await emailService.sendOrderCompletedNotification(order, order.tailor);

    // Notify admin
    const notifyAdmin = await Settings.getValue('order_notify_admin_on_completion');
    if (notifyAdmin) {
      await emailService.sendOrderCompletedAdmin(order);
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id)
      .populate('customer', 'firstName lastName email')
      .populate({
        path: 'tailor',
        populate: { path: 'user', select: 'firstName lastName email' }
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    const isTailor = order.tailor.user._id.toString() === req.user._id.toString();
    const isCustomer = order.customer._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isTailor && !isCustomer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    if (['completed', 'cancelled'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel this order'
      });
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelledBy = req.user._id;
    order.cancellationReason = reason;
    order.statusHistory.push({
      status: 'cancelled',
      changedAt: new Date(),
      changedBy: req.user._id,
      note: reason
    });

    await order.save();

    // Notify both parties
    if (isCustomer) {
      await emailService.sendOrderCancelledNotification(order, order.tailor, 'customer');
    } else {
      await emailService.sendOrderCancelledNotification(order, order.customer, 'tailor');
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order stats (tailor dashboard)
// @route   GET /api/orders/stats
// @access  Private/Tailor
export const getOrderStats = async (req, res, next) => {
  try {
    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    const stats = await Order.aggregate([
      { $match: { tailor: tailor._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedStats = {
      awaiting_plan: 0,
      plan_review: 0,
      plan_rejected: 0,
      in_progress: 0,
      ready: 0,
      completed: 0,
      cancelled: 0,
      disputed: 0
    };

    stats.forEach(s => {
      formattedStats[s._id] = s.count;
    });

    // Get orders needing attention
    const ordersNeedingPlan = await Order.find({
      tailor: tailor._id,
      status: 'awaiting_plan'
    })
      .sort({ planDeadline: 1 })
      .limit(5)
      .populate('customer', 'firstName lastName');

    const ordersInProgress = await Order.find({
      tailor: tailor._id,
      status: 'in_progress'
    })
      .sort({ 'workPlan.estimatedCompletion': 1 })
      .limit(5)
      .populate('customer', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: {
        stats: formattedStats,
        ordersNeedingPlan,
        ordersInProgress
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (admin)
// @route   GET /api/orders/admin
// @access  Private/Admin
export const getAdminOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate('customer', 'firstName lastName email')
      .populate({
        path: 'tailor',
        select: 'username businessName',
        populate: { path: 'user', select: 'firstName lastName' }
      })
      .populate('booking', 'service date');

    res.status(200).json({
      success: true,
      data: orders,
      pagination: paginationResult(total, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get overdue orders (admin)
// @route   GET /api/orders/admin/overdue
// @access  Private/Admin
export const getOverdueOrders = async (req, res, next) => {
  try {
    const now = new Date();

    // Orders with overdue plan creation
    const overduePlanCreation = await Order.find({
      status: 'awaiting_plan',
      planDeadline: { $lt: now }
    })
      .populate('customer', 'firstName lastName email')
      .populate({
        path: 'tailor',
        select: 'username businessName',
        populate: { path: 'user', select: 'firstName lastName email' }
      });

    // Orders with overdue completion
    const overdueCompletion = await Order.find({
      status: 'in_progress',
      'workPlan.estimatedCompletion': { $lt: now }
    })
      .populate('customer', 'firstName lastName email')
      .populate({
        path: 'tailor',
        select: 'username businessName',
        populate: { path: 'user', select: 'firstName lastName email' }
      });

    res.status(200).json({
      success: true,
      data: {
        overduePlanCreation,
        overdueCompletion
      }
    });
  } catch (error) {
    next(error);
  }
};
