import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  // For tailor-customer conversations
  tailor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TailorProfile'
  },
  // Last message preview
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sentAt: Date
  },
  // Unread tracking per participant
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  },
  // Related booking if any
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  // For admin monitoring
  flagged: {
    type: Boolean,
    default: false
  },
  flagReason: String,
  flaggedAt: Date,
  flaggedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for finding conversations by participants
conversationSchema.index({ participants: 1 });
conversationSchema.index({ tailor: 1 });

// Find or create conversation between two users
conversationSchema.statics.findOrCreate = async function(user1Id, user2Id, tailorId = null) {
  let conversation = await this.findOne({
    participants: { $all: [user1Id, user2Id] }
  });

  if (!conversation) {
    conversation = await this.create({
      participants: [user1Id, user2Id],
      tailor: tailorId,
      unreadCount: new Map([[user1Id.toString(), 0], [user2Id.toString(), 0]])
    });
  }

  return conversation;
};

// Mark as read for a user
conversationSchema.methods.markAsRead = async function(userId) {
  this.unreadCount.set(userId.toString(), 0);
  await this.save();
};

// Increment unread count for other participants
conversationSchema.methods.incrementUnread = async function(senderUserId) {
  this.participants.forEach(participantId => {
    if (participantId.toString() !== senderUserId.toString()) {
      const currentCount = this.unreadCount.get(participantId.toString()) || 0;
      this.unreadCount.set(participantId.toString(), currentCount + 1);
    }
  });
  await this.save();
};

export default mongoose.model('Conversation', conversationSchema);
