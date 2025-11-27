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
// @access  Private
export const startConversationWithTailor = async (req, res, next) => {
  try {
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
