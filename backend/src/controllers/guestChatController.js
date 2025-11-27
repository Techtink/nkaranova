import GuestConversation from '../models/GuestConversation.js';
import { v4 as uuidv4 } from 'uuid';

// @desc    Start or resume guest conversation
// @route   POST /api/guest-chat/start
// @access  Public
export const startConversation = async (req, res, next) => {
  try {
    const { guestId, guestName, guestEmail, metadata } = req.body;

    // Use provided guestId or generate new one
    const finalGuestId = guestId || uuidv4();

    // Check for existing active conversation
    let conversation = await GuestConversation.findOne({
      guestId: finalGuestId,
      status: { $ne: 'closed' }
    });

    if (!conversation) {
      // Create new conversation
      conversation = await GuestConversation.create({
        guestId: finalGuestId,
        guestName: guestName || 'Visitor',
        guestEmail,
        metadata: {
          ...metadata,
          ip: req.ip
        },
        messages: [{
          sender: 'admin',
          content: 'Welcome to Tailor Connect! How can we help you today?'
        }]
      });
    }

    res.status(200).json({
      success: true,
      data: {
        conversationId: conversation._id,
        guestId: finalGuestId,
        messages: conversation.messages,
        status: conversation.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send message as guest
// @route   POST /api/guest-chat/:id/messages
// @access  Public
export const sendGuestMessage = async (req, res, next) => {
  try {
    const { content, guestId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const conversation = await GuestConversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Verify guestId matches
    if (conversation.guestId !== guestId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (conversation.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'This conversation has been closed'
      });
    }

    // Add message
    const newMessage = {
      sender: 'guest',
      content: content.trim()
    };
    conversation.messages.push(newMessage);
    conversation.unreadCount += 1;
    conversation.status = 'waiting'; // Mark as waiting for admin response

    await conversation.save();

    // Emit socket event for real-time update
    const io = req.app.get('io');
    io.to('admin-chat').emit('guest:message', {
      conversationId: conversation._id,
      message: conversation.messages[conversation.messages.length - 1]
    });

    res.status(200).json({
      success: true,
      data: conversation.messages[conversation.messages.length - 1]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get conversation messages
// @route   GET /api/guest-chat/:id
// @access  Public (with guestId verification)
export const getConversation = async (req, res, next) => {
  try {
    const { guestId } = req.query;

    const conversation = await GuestConversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Verify guestId matches
    if (conversation.guestId !== guestId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        messages: conversation.messages,
        status: conversation.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

// @desc    Get all guest conversations (admin)
// @route   GET /api/guest-chat/admin/conversations
// @access  Private/Admin
export const getGuestConversations = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const total = await GuestConversation.countDocuments(query);
    const conversations = await GuestConversation.find(query)
      .sort({ lastMessageAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('assignedAdmin', 'firstName lastName')
      .select('-messages');

    res.status(200).json({
      success: true,
      data: conversations,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single guest conversation with messages (admin)
// @route   GET /api/guest-chat/admin/conversations/:id
// @access  Private/Admin
export const getGuestConversationById = async (req, res, next) => {
  try {
    const conversation = await GuestConversation.findById(req.params.id)
      .populate('assignedAdmin', 'firstName lastName');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Mark messages as read
    conversation.messages.forEach(msg => {
      if (msg.sender === 'guest') {
        msg.read = true;
      }
    });
    conversation.unreadCount = 0;
    await conversation.save();

    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send message as admin
// @route   POST /api/guest-chat/admin/conversations/:id/messages
// @access  Private/Admin
export const sendAdminMessage = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const conversation = await GuestConversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Add message
    const newMessage = {
      sender: 'admin',
      adminUser: req.user._id,
      content: content.trim()
    };
    conversation.messages.push(newMessage);
    conversation.status = 'active';

    // Assign admin if not already assigned
    if (!conversation.assignedAdmin) {
      conversation.assignedAdmin = req.user._id;
    }

    await conversation.save();

    // Emit socket event for real-time update to guest
    const io = req.app.get('io');
    io.to(`guest:${conversation.guestId}`).emit('admin:message', {
      conversationId: conversation._id,
      message: conversation.messages[conversation.messages.length - 1]
    });

    res.status(200).json({
      success: true,
      data: conversation.messages[conversation.messages.length - 1]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Close conversation
// @route   PUT /api/guest-chat/admin/conversations/:id/close
// @access  Private/Admin
export const closeConversation = async (req, res, next) => {
  try {
    const conversation = await GuestConversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    conversation.status = 'closed';
    conversation.messages.push({
      sender: 'admin',
      adminUser: req.user._id,
      content: 'This conversation has been closed. Thank you for contacting us!'
    });

    await conversation.save();

    // Notify guest
    const io = req.app.get('io');
    io.to(`guest:${conversation.guestId}`).emit('conversation:closed', {
      conversationId: conversation._id
    });

    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread count for admin
// @route   GET /api/guest-chat/admin/unread
// @access  Private/Admin
export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await GuestConversation.countDocuments({
      status: 'waiting',
      unreadCount: { $gt: 0 }
    });

    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    next(error);
  }
};
