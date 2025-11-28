import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import TailorProfile from '../models/TailorProfile.js';
import User from '../models/User.js';
import emailService from '../services/emailService.js';
import { paginationResult } from '../utils/helpers.js';

// @desc    Get my conversations
// @route   GET /api/conversations
// @access  Private
export const getConversations = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const query = {
      participants: req.user._id,
      isActive: true
    };

    const total = await Conversation.countDocuments(query);
    const conversations = await Conversation.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ updatedAt: -1 })
      .populate('participants', 'firstName lastName avatar role')
      .populate({
        path: 'tailor',
        select: 'username businessName profilePhoto'
      });

    // Add unread count for current user
    const conversationsWithUnread = conversations.map(conv => {
      const convObj = conv.toObject();
      convObj.unreadCount = conv.unreadCount.get(req.user._id.toString()) || 0;
      return convObj;
    });

    res.status(200).json({
      success: true,
      data: conversationsWithUnread,
      pagination: paginationResult(total, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get or create conversation with tailor
// @route   POST /api/conversations/tailor/:username
// @access  Private (Admin only - customers cannot message tailors directly)
export const startConversationWithTailor = async (req, res, next) => {
  try {
    // Only admins can start conversations with tailors
    // Customers must go through the booking flow and communicate via admin
    if (req.user.role === 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Customers cannot message tailors directly. Please use the booking system and our admin team will assist you.'
      });
    }

    const tailor = await TailorProfile.findOne({
      username: req.params.username,
      approvalStatus: 'approved'
    });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor not found'
      });
    }

    // Can't message yourself
    if (tailor.user.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start conversation with yourself'
      });
    }

    const conversation = await Conversation.findOrCreate(
      req.user._id,
      tailor.user,
      tailor._id
    );

    await conversation.populate('participants', 'firstName lastName avatar role');
    await conversation.populate({
      path: 'tailor',
      select: 'username businessName profilePhoto'
    });

    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single conversation with messages
// @route   GET /api/conversations/:id
// @access  Private
export const getConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id
    })
      .populate('participants', 'firstName lastName avatar role')
      .populate({
        path: 'tailor',
        select: 'username businessName profilePhoto'
      });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Mark as read
    await conversation.markAsRead(req.user._id);

    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages for conversation
// @route   GET /api/conversations/:id/messages
// @access  Private
export const getMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const total = await Message.countDocuments({
      conversation: conversation._id,
      isDeleted: false
    });

    const messages = await Message.find({
      conversation: conversation._id,
      isDeleted: false
    })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate('sender', 'firstName lastName avatar');

    // Mark conversation as read
    await conversation.markAsRead(req.user._id);

    res.status(200).json({
      success: true,
      data: messages.reverse(),
      pagination: paginationResult(total, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send message
// @route   POST /api/conversations/:id/messages
// @access  Private
export const sendMessage = async (req, res, next) => {
  try {
    const { content, attachments } = req.body;

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id
    }).populate('participants', 'firstName lastName email preferences');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      content,
      attachments,
      readBy: [{ user: req.user._id }]
    });

    await message.populate('sender', 'firstName lastName avatar');

    // Increment unread count for other participants
    await conversation.incrementUnread(req.user._id);

    // Send email notification to other participants
    const otherParticipants = conversation.participants.filter(
      p => p._id.toString() !== req.user._id.toString()
    );

    for (const participant of otherParticipants) {
      if (participant.preferences?.emailNotifications) {
        await emailService.sendNewMessageNotification(
          conversation,
          req.user,
          participant
        );
      }
    }

    // Emit socket event
    const io = req.app.get('io');
    io.to(`conversation:${conversation._id}`).emit('message:new', {
      conversationId: conversation._id,
      message
    });

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark messages as read
// @route   PUT /api/conversations/:id/read
// @access  Private
export const markAsRead = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    await conversation.markAsRead(req.user._id);

    // Update messages read status
    await Message.updateMany(
      {
        conversation: conversation._id,
        'readBy.user': { $ne: req.user._id }
      },
      {
        $push: { readBy: { user: req.user._id, readAt: new Date() } }
      }
    );

    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread count
// @route   GET /api/conversations/unread
// @access  Private
export const getUnreadCount = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
      isActive: true
    });

    let totalUnread = 0;
    conversations.forEach(conv => {
      totalUnread += conv.unreadCount.get(req.user._id.toString()) || 0;
    });

    res.status(200).json({
      success: true,
      data: { unreadCount: totalUnread }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start or get conversation with any user
// @route   POST /api/conversations/user/:userId
// @access  Private (Restricted: customer/tailor can only message admin)
export const startConversationWithUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Can't message yourself
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start conversation with yourself'
      });
    }

    // Restrict customer-tailor direct messaging
    // Only allow conversations where at least one party is an admin
    const currentUserRole = req.user.role;
    const targetUserRole = targetUser.role;

    const isCurrentUserAdmin = currentUserRole === 'admin';
    const isTargetUserAdmin = targetUserRole === 'admin';

    // If neither party is admin, and it's customer<->tailor, block it
    if (!isCurrentUserAdmin && !isTargetUserAdmin) {
      // Customer trying to message tailor
      if (currentUserRole === 'customer' && targetUserRole === 'tailor') {
        return res.status(403).json({
          success: false,
          message: 'Customers cannot message tailors directly. Please use the booking system and our admin team will assist you.'
        });
      }
      // Tailor trying to message customer
      if (currentUserRole === 'tailor' && targetUserRole === 'customer') {
        return res.status(403).json({
          success: false,
          message: 'Tailors cannot message customers directly. Please communicate through the admin team.'
        });
      }
    }

    // Check if target is a tailor to get their profile
    let tailorId = null;
    if (targetUser.role === 'tailor') {
      const tailorProfile = await TailorProfile.findOne({ user: userId });
      if (tailorProfile) {
        tailorId = tailorProfile._id;
      }
    }

    // Check if current user is a tailor
    if (req.user.role === 'tailor') {
      const currentTailorProfile = await TailorProfile.findOne({ user: req.user._id });
      if (currentTailorProfile && !tailorId) {
        tailorId = currentTailorProfile._id;
      }
    }

    const conversation = await Conversation.findOrCreate(
      req.user._id,
      targetUser._id,
      tailorId
    );

    await conversation.populate('participants', 'firstName lastName avatar role');
    if (tailorId) {
      await conversation.populate({
        path: 'tailor',
        select: 'username businessName profilePhoto'
      });
    }

    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin start or get conversation with any user
// @route   POST /api/admin/conversations/user/:userId
// @access  Private (Admin)
export const adminStartConversationWithUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { orderId } = req.body; // Optional order context

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Can't message yourself
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start conversation with yourself'
      });
    }

    // Check if target is a tailor to get their profile
    let tailorId = null;
    if (targetUser.role === 'tailor') {
      const tailorProfile = await TailorProfile.findOne({ user: userId });
      if (tailorProfile) {
        tailorId = tailorProfile._id;
      }
    }

    const conversation = await Conversation.findOrCreate(
      req.user._id,
      targetUser._id,
      tailorId
    );

    await conversation.populate('participants', 'firstName lastName avatar role');
    if (tailorId) {
      await conversation.populate({
        path: 'tailor',
        select: 'username businessName profilePhoto'
      });
    }

    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users for admin chat (customers and tailors)
// @route   GET /api/admin/chat/users
// @access  Private (Admin)
export const getAdminChatUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 50 } = req.query;

    const query = {
      role: { $in: ['customer', 'tailor'] }
    };

    if (role && ['customer', 'tailor'].includes(role)) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('firstName lastName email avatar role createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Get tailor profiles for tailor users
    const tailorIds = users.filter(u => u.role === 'tailor').map(u => u._id);
    const tailorProfiles = await TailorProfile.find({ user: { $in: tailorIds } })
      .select('user businessName username profilePhoto');

    const tailorProfileMap = {};
    tailorProfiles.forEach(p => {
      tailorProfileMap[p.user.toString()] = p;
    });

    const usersWithProfiles = users.map(user => {
      const userObj = user.toObject();
      if (user.role === 'tailor' && tailorProfileMap[user._id.toString()]) {
        userObj.tailorProfile = tailorProfileMap[user._id.toString()];
      }
      return userObj;
    });

    res.status(200).json({
      success: true,
      data: usersWithProfiles,
      pagination: paginationResult(total, page, limit)
    });
  } catch (error) {
    next(error);
  }
};
