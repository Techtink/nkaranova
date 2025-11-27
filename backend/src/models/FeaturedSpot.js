import mongoose from 'mongoose';

const featuredSpotSchema = new mongoose.Schema({
  tailor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TailorProfile',
    required: true
  },
  source: {
    type: String,
    enum: ['tokens', 'payment', 'admin'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  },
  // For token redemption
  tokensSpent: {
    type: Number,
    default: 0
  },
  // For payment
  paymentAmount: {
    type: Number,
    default: 0
  },
  paymentCurrency: {
    type: String,
    default: 'USD'
  },
  stripePaymentIntentId: String,
  // Duration in days
  durationDays: {
    type: Number,
    required: true
  },
  // Admin notes
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: String
}, {
  timestamps: true
});

// Index for finding active featured spots
featuredSpotSchema.index({ status: 1, endDate: 1 });
featuredSpotSchema.index({ tailor: 1, status: 1 });

// Static method to get currently featured tailors
featuredSpotSchema.statics.getActiveFeatured = function() {
  const now = new Date();
  return this.find({
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).populate({
    path: 'tailor',
    populate: { path: 'user', select: 'firstName lastName avatar' }
  });
};

// Static method to check if a tailor is currently featured
featuredSpotSchema.statics.isTailorFeatured = async function(tailorId) {
  const now = new Date();
  const count = await this.countDocuments({
    tailor: tailorId,
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now }
  });
  return count > 0;
};

export default mongoose.model('FeaturedSpot', featuredSpotSchema);
