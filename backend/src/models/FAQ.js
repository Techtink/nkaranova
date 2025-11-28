import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true,
    maxlength: [500, 'Question cannot exceed 500 characters']
  },
  answer: {
    type: String,
    required: [true, 'Answer is required'],
    trim: true,
    maxlength: [5000, 'Answer cannot exceed 5000 characters']
  },
  category: {
    type: String,
    enum: ['general', 'account', 'orders', 'payments', 'shipping', 'returns', 'tailors', 'customers'],
    default: 'general'
  },
  targetAudience: {
    type: String,
    enum: ['all', 'customers', 'tailors'],
    default: 'all'
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient queries
faqSchema.index({ category: 1, targetAudience: 1, isActive: 1, order: 1 });

export default mongoose.model('FAQ', faqSchema);
