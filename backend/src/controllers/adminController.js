import User from '../models/User.js';
import TailorProfile from '../models/TailorProfile.js';
import Work from '../models/Work.js';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import Conversation from '../models/Conversation.js';
import Referral from '../models/Referral.js';
import TokenTransaction from '../models/TokenTransaction.js';
import Settings from '../models/Settings.js';
import Role from '../models/Role.js';
import AdminMember from '../models/AdminMember.js';
import emailService from '../services/emailService.js';
import { paginationResult } from '../utils/helpers.js';
import crypto from 'crypto';

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalTailors,
      pendingTailors,
      totalWorks,
      pendingWorks,
      totalBookings,
      totalReviews,
      pendingReviews,
      pendingVerifications
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      TailorProfile.countDocuments({ approvalStatus: 'approved' }),
      TailorProfile.countDocuments({ approvalStatus: 'pending' }),
      Work.countDocuments({ approvalStatus: 'approved' }),
      Work.countDocuments({ approvalStatus: 'pending' }),
      Booking.countDocuments(),
      Review.countDocuments({ approvalStatus: 'approved' }),
      Review.countDocuments({ approvalStatus: 'pending' }),
      TailorProfile.countDocuments({ verificationStatus: 'pending' })
    ]);

    // Recent activity
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'firstName lastName')
      .populate({
        path: 'tailor',
        select: 'username businessName'
      });

    const recentTailors = await TailorProfile.find({ approvalStatus: 'pending' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'firstName lastName email');

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalTailors,
          pendingTailors,
          totalWorks,
          pendingWorks,
          totalBookings,
          totalReviews,
          pendingReviews,
          pendingVerifications
        },
        recentBookings,
        recentTailors
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tailors (with status filter)
// @route   GET /api/admin/tailors
// @route   GET /api/admin/tailors/pending
// @access  Private/Admin
export const getPendingTailors = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const query = {};
    if (status && status !== 'all') {
      query.approvalStatus = status;
    }
    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await TailorProfile.countDocuments(query);
    const tailors = await TailorProfile.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate('user', 'firstName lastName email profileImage createdAt');

    res.status(200).json({
      success: true,
      data: tailors,
      pagination: paginationResult(total, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve/reject/suspend tailor
// @route   PUT /api/admin/tailors/:id/approval
// @access  Private/Admin
export const updateTailorApproval = async (req, res, next) => {
  try {
    const { status, note, reason } = req.body;

    if (!['approved', 'rejected', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const tailor = await TailorProfile.findById(req.params.id)
      .populate('user', 'firstName lastName email');

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor not found'
      });
    }

    tailor.approvalStatus = status;
    tailor.approvalNote = note || reason;
    tailor.approvedAt = new Date();
    tailor.approvedBy = req.user._id;

    await tailor.save();

    // TODO: Send email notification to tailor

    res.status(200).json({
      success: true,
      data: tailor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get works (with status filter)
// @route   GET /api/admin/works
// @route   GET /api/admin/works/pending
// @access  Private/Admin
export const getPendingWorks = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const query = {};
    if (status && status !== 'all') {
      query.approvalStatus = status;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Work.countDocuments(query);
    const works = await Work.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate({
        path: 'tailor',
        select: 'username businessName',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      });

    res.status(200).json({
      success: true,
      data: works,
      pagination: paginationResult(total, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve/reject work
// @route   PUT /api/admin/works/:id/approval
// @access  Private/Admin
export const updateWorkApproval = async (req, res, next) => {
  try {
    const { status, note, reason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const work = await Work.findById(req.params.id);

    if (!work) {
      return res.status(404).json({
        success: false,
        message: 'Work not found'
      });
    }

    work.approvalStatus = status;
    work.approvalNote = note || reason;
    work.approvedAt = new Date();
    work.approvedBy = req.user._id;

    await work.save();

    res.status(200).json({
      success: true,
      data: work
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Feature/unfeature work
// @route   PUT /api/admin/works/:id/feature
// @access  Private/Admin
export const toggleWorkFeatured = async (req, res, next) => {
  try {
    const work = await Work.findById(req.params.id);

    if (!work) {
      return res.status(404).json({
        success: false,
        message: 'Work not found'
      });
    }

    work.isFeatured = !work.isFeatured;
    if (work.isFeatured) {
      work.featuredAt = new Date();
      work.featuredBy = req.user._id;
    }

    await work.save();

    res.status(200).json({
      success: true,
      data: work
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews (with status filter)
// @route   GET /api/admin/reviews
// @route   GET /api/admin/reviews/pending
// @access  Private/Admin
export const getPendingReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const query = {};
    if (status && status !== 'all') {
      query.approvalStatus = status;
    }
    if (search) {
      query.comment = { $regex: search, $options: 'i' };
    }

    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate('customer', 'firstName lastName email profileImage')
      .populate({
        path: 'tailor',
        select: 'username businessName',
        populate: {
          path: 'user',
          select: 'firstName lastName profileImage'
        }
      })
      .populate('booking', 'serviceType');

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: paginationResult(total, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve/reject review
// @route   PUT /api/admin/reviews/:id/approval
// @access  Private/Admin
export const updateReviewApproval = async (req, res, next) => {
  try {
    const { status, note, reason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.approvalStatus = status;
    review.approvalNote = note || reason;
    review.rejectionReason = status === 'rejected' ? (reason || note) : undefined;
    review.approvedAt = new Date();
    review.approvedBy = req.user._id;

    await review.save();

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/admin/reviews/:id
// @access  Private/Admin
export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await review.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get verifications (with status filter)
// @route   GET /api/admin/verifications
// @route   GET /api/admin/verifications/pending
// @access  Private/Admin
export const getPendingVerifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const query = {};
    if (status && status !== 'all') {
      query.verificationStatus = status;
    }
    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await TailorProfile.countDocuments(query);
    const tailors = await TailorProfile.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ verificationSubmittedAt: -1 })
      .populate('user', 'firstName lastName email profileImage');

    res.status(200).json({
      success: true,
      data: tailors,
      pagination: paginationResult(total, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve/reject verification
// @route   PUT /api/admin/verifications/:id
// @access  Private/Admin
export const updateVerification = async (req, res, next) => {
  try {
    const { status, note, reason } = req.body;

    // Accept both 'verified' and 'approved' as valid approval statuses
    const normalizedStatus = status === 'verified' ? 'verified' : status;

    if (!['verified', 'approved', 'rejected'].includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const tailor = await TailorProfile.findById(req.params.id);

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor not found'
      });
    }

    tailor.verificationStatus = normalizedStatus === 'approved' ? 'verified' : normalizedStatus;
    tailor.verificationNote = note || reason;
    tailor.verificationRejectionReason = normalizedStatus === 'rejected' ? (reason || note) : undefined;
    tailor.verifiedAt = new Date();
    tailor.verifiedBy = req.user._id;

    await tailor.save();

    // If tailor was verified, complete any pending referrals
    if (tailor.verificationStatus === 'verified' || tailor.verificationStatus === 'approved') {
      const requiresVerification = await Settings.getValue('referral_requires_verification');

      if (requiresVerification !== false) {
        // Find pending referral for this tailor
        const pendingReferral = await Referral.findOne({
          referred: tailor._id,
          status: 'pending'
        });

        if (pendingReferral) {
          const tokensPerReferral = await Settings.getValue('tokens_per_referral');

          // Update referrer's token balance
          const referrer = await TailorProfile.findById(pendingReferral.referrer);
          if (referrer) {
            referrer.tokenBalance += tokensPerReferral;
            referrer.successfulReferrals += 1;
            await referrer.save();

            // Create token transaction
            await TokenTransaction.create({
              tailor: referrer._id,
              type: 'credit',
              amount: tokensPerReferral,
              balanceAfter: referrer.tokenBalance,
              reason: 'referral_bonus',
              description: `Bonus for referring ${tailor.businessName || tailor.username}`,
              relatedReferral: pendingReferral._id
            });

            // Update referral status
            pendingReferral.status = 'completed';
            pendingReferral.tokensAwarded = tokensPerReferral;
            pendingReferral.completedAt = new Date();
            await pendingReferral.save();
          }
        }
      }
    }

    // Send email notification
    await emailService.sendVerificationStatusUpdate(tailor, status);

    res.status(200).json({
      success: true,
      data: tailor
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// BOOKING MANAGEMENT
// ==========================================

// @desc    Get all bookings (admin view)
// @route   GET /api/admin/bookings
// @access  Private/Admin
export const getAdminBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      // We'll need to search across customer and tailor names
      // For now, search by service description
      query.service = { $regex: search, $options: 'i' };
    }

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate('customer', 'firstName lastName email')
      .populate({
        path: 'tailor',
        select: 'username businessName profilePhoto',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      })
      .populate('order', 'status');

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: paginationResult(total, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get booking stats for admin dashboard
// @route   GET /api/admin/bookings/stats
// @access  Private/Admin
export const getAdminBookingStats = async (req, res, next) => {
  try {
    const [
      pending,
      confirmed,
      consultationDone,
      quoteSubmitted,
      quoteAccepted,
      paid,
      converted,
      cancelled
    ] = await Promise.all([
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'consultation_done' }),
      Booking.countDocuments({ status: 'quote_submitted' }),
      Booking.countDocuments({ status: 'quote_accepted' }),
      Booking.countDocuments({ status: 'paid' }),
      Booking.countDocuments({ status: 'converted' }),
      Booking.countDocuments({ status: 'cancelled' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        pending,
        confirmed,
        consultationDone,
        quoteSubmitted,
        quoteAccepted,
        paid,
        converted,
        cancelled,
        total: pending + confirmed + consultationDone + quoteSubmitted + quoteAccepted + paid + converted + cancelled
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bookings needing consultation completion (confirmed status)
// @route   GET /api/admin/bookings/needs-consultation
// @access  Private/Admin
export const getBookingsNeedingConsultation = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const query = { status: 'confirmed' };

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ date: 1 }) // Sort by consultation date (soonest first)
      .populate('customer', 'firstName lastName email phone')
      .populate({
        path: 'tailor',
        select: 'username businessName profilePhoto location',
        populate: {
          path: 'user',
          select: 'firstName lastName email phone'
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

// @desc    Get all conversations (admin view)
// @route   GET /api/admin/conversations
// @access  Private/Admin
export const getAllConversations = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, flagged } = req.query;

    const query = {};
    if (flagged === 'true') {
      query.flagged = true;
    }

    const total = await Conversation.countDocuments(query);
    const conversations = await Conversation.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ updatedAt: -1 })
      .populate('participants', 'firstName lastName email role')
      .populate({
        path: 'tailor',
        select: 'username businessName'
      });

    res.status(200).json({
      success: true,
      data: conversations,
      pagination: paginationResult(total, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Flag/unflag conversation
// @route   PUT /api/admin/conversations/:id/flag
// @access  Private/Admin
export const toggleConversationFlag = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    conversation.flagged = !conversation.flagged;
    if (conversation.flagged) {
      conversation.flagReason = reason;
      conversation.flaggedAt = new Date();
      conversation.flaggedBy = req.user._id;
    } else {
      conversation.flagReason = null;
      conversation.flaggedAt = null;
      conversation.flaggedBy = null;
    }

    await conversation.save();

    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// TEAM & ROLES MANAGEMENT
// ==========================================

// @desc    Get all team members
// @route   GET /api/admin/team
// @access  Private/Admin
export const getTeamMembers = async (req, res, next) => {
  try {
    const members = await AdminMember.find()
      .populate('user', 'firstName lastName email avatar')
      .populate('role', 'name permissions isSystem')
      .populate('addedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: members
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a team member
// @route   POST /api/admin/team
// @access  Private/Admin
export const addTeamMember = async (req, res, next) => {
  try {
    const { email, firstName, lastName, roleId } = req.body;

    if (!email || !roleId) {
      return res.status(400).json({
        success: false,
        message: 'Email and role are required'
      });
    }

    // Check if role exists
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // Check if already a team member
      const existingMember = await AdminMember.findOne({ user: user._id });
      if (existingMember) {
        return res.status(400).json({
          success: false,
          message: 'User is already a team member'
        });
      }

      // Update user role to admin
      user.role = 'admin';
      await user.save();
    } else {
      // Create new user with temporary password
      const tempPassword = crypto.randomBytes(8).toString('hex');
      user = await User.create({
        email: email.toLowerCase(),
        firstName,
        lastName,
        password: tempPassword,
        role: 'admin'
      });

      // TODO: Send invite email with temporary password or password reset link
    }

    // Create admin member entry
    const adminMember = await AdminMember.create({
      user: user._id,
      role: roleId,
      addedBy: req.user._id
    });

    // Populate the response
    await adminMember.populate('user', 'firstName lastName email avatar');
    await adminMember.populate('role', 'name permissions isSystem');

    res.status(201).json({
      success: true,
      data: adminMember
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a team member
// @route   PUT /api/admin/team/:id
// @access  Private/Admin
export const updateTeamMember = async (req, res, next) => {
  try {
    const { roleId, isActive } = req.body;

    const member = await AdminMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    // Prevent self-demotion from manage_team permission
    if (member.user.toString() === req.user._id.toString()) {
      const newRole = await Role.findById(roleId);
      if (newRole && !newRole.permissions.includes('manage_team')) {
        return res.status(400).json({
          success: false,
          message: 'You cannot remove your own team management permission'
        });
      }
    }

    if (roleId) {
      const role = await Role.findById(roleId);
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }
      member.role = roleId;
    }

    if (typeof isActive === 'boolean') {
      member.isActive = isActive;
    }

    await member.save();
    await member.populate('user', 'firstName lastName email avatar');
    await member.populate('role', 'name permissions isSystem');

    res.status(200).json({
      success: true,
      data: member
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a team member
// @route   DELETE /api/admin/team/:id
// @access  Private/Admin
export const removeTeamMember = async (req, res, next) => {
  try {
    const member = await AdminMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    // Prevent self-removal
    if (member.user.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot remove yourself from the team'
      });
    }

    // Remove admin role from user
    const user = await User.findById(member.user);
    if (user) {
      user.role = 'customer';
      await user.save();
    }

    await member.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all roles
// @route   GET /api/admin/roles
// @access  Private/Admin
export const getRoles = async (req, res, next) => {
  try {
    // Ensure default admin role exists
    await Role.getDefaultAdminRole();

    const roles = await Role.find({ isActive: true }).sort({ isSystem: -1, name: 1 });

    res.status(200).json({
      success: true,
      data: roles
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a role
// @route   POST /api/admin/roles
// @access  Private/Admin
export const createRole = async (req, res, next) => {
  try {
    const { name, description, permissions } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required'
      });
    }

    // Check for duplicate name
    const existingRole = await Role.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'A role with this name already exists'
      });
    }

    const role = await Role.create({
      name,
      description,
      permissions: permissions || []
    });

    res.status(201).json({
      success: true,
      data: role
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a role
// @route   PUT /api/admin/roles/:id
// @access  Private/Admin
export const updateRole = async (req, res, next) => {
  try {
    const { name, description, permissions } = req.body;

    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Prevent editing system role name
    if (role.isSystem && name && name !== role.name) {
      return res.status(400).json({
        success: false,
        message: 'Cannot rename system roles'
      });
    }

    // Check for duplicate name (excluding current role)
    if (name && name !== role.name) {
      const existingRole = await Role.findOne({
        _id: { $ne: role._id },
        name: { $regex: new RegExp(`^${name}$`, 'i') }
      });
      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: 'A role with this name already exists'
        });
      }
      role.name = name;
    }

    if (description !== undefined) {
      role.description = description;
    }

    if (permissions) {
      role.permissions = permissions;
    }

    await role.save();

    res.status(200).json({
      success: true,
      data: role
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a role
// @route   DELETE /api/admin/roles/:id
// @access  Private/Admin
export const deleteRole = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    if (role.isSystem) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete system roles'
      });
    }

    // Check if any members have this role
    const membersWithRole = await AdminMember.countDocuments({ role: role._id });
    if (membersWithRole > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role. ${membersWithRole} member(s) still have this role assigned.`
      });
    }

    await role.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};
