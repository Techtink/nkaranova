import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TailorProfile',
    required: true
  },
  referred: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TailorProfile',
    required: true
  },
  referralCode: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'invalid'],
    default: 'pending'
  },
  tokensAwarded: {
    type: Number,
    default: 0
  },
  completedAt: Date,
  invalidReason: String
}, {
  timestamps: true
});

// Index for efficient queries
referralSchema.index({ referrer: 1, status: 1 });
referralSchema.index({ referred: 1 });
referralSchema.index({ referralCode: 1 });

export default mongoose.model('Referral', referralSchema);
