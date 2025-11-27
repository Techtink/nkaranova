import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  attachments: [{
    url: String,
    type: {
      type: String,
      enum: ['image', 'document']
    },
    name: String
  }],
  // Read status tracking
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Message type
  type: {
    type: String,
    enum: ['text', 'system', 'booking'],
    default: 'text'
  },
  // For system messages
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
}, {
  timestamps: true
});

// Index for fetching messages in a conversation
messageSchema.index({ conversation: 1, createdAt: -1 });

// Update conversation's last message after saving
messageSchema.post('save', async function() {
  const Conversation = mongoose.model('Conversation');
  await Conversation.findByIdAndUpdate(this.conversation, {
    lastMessage: {
      content: this.content.substring(0, 100),
      sender: this.sender,
      sentAt: this.createdAt
    }
  });
});

export default mongoose.model('Message', messageSchema);
