import mongoose from 'mongoose';

const tokenTransactionSchema = new mongoose.Schema({
  tailor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TailorProfile',
    required: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    enum: [
      'referral_bonus',
      'featured_spot_redemption',
      'admin_adjustment',
      'promotion',
      'refund'
    ],
    required: true
  },
  description: String,
  relatedReferral: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Referral'
  },
  relatedFeaturedSpot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeaturedSpot'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient queries
tokenTransactionSchema.index({ tailor: 1, createdAt: -1 });
tokenTransactionSchema.index({ type: 1 });

export default mongoose.model('TokenTransaction', tokenTransactionSchema);
