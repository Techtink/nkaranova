import mongoose from 'mongoose';

const guestMessageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['guest', 'admin'],
    required: true
  },
  adminUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  read: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const guestConversationSchema = new mongoose.Schema({
  // Guest identification
  guestId: {
    type: String,
    required: true,
    index: true
  },
  guestName: {
    type: String,
    default: 'Visitor'
  },
  guestEmail: {
    type: String,
    sparse: true
  },

  // Conversation state
  status: {
    type: String,
    enum: ['active', 'waiting', 'closed'],
    default: 'waiting'
  },

  // Messages
  messages: [guestMessageSchema],

  // Admin assignment
  assignedAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Metadata
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    type: Number,
    default: 0
  },

  // Browser/device info for context
  metadata: {
    userAgent: String,
    referrer: String,
    page: String,
    ip: String
  }
}, { timestamps: true });

// Update lastMessageAt on new message
guestConversationSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.lastMessageAt = new Date();
  }
  next();
});

// Index for finding active conversations
guestConversationSchema.index({ status: 1, lastMessageAt: -1 });

export default mongoose.model('GuestConversation', guestConversationSchema);
