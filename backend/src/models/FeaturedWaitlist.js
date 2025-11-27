import mongoose from 'mongoose';

const featuredWaitlistSchema = new mongoose.Schema({
  tailor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TailorProfile',
    required: true
  },
  source: {
    type: String,
    enum: ['tokens', 'payment'],
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'activated', 'cancelled', 'expired'],
    default: 'waiting'
  },
  position: {
    type: Number,
    required: true
  },
  // For token redemption
  tokensReserved: {
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
  // Duration requested
  durationDays: {
    type: Number,
    required: true
  },
  // When activated, reference to the created featured spot
  activatedSpot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeaturedSpot'
  },
  activatedAt: Date,
  // Notification tracking
  notifiedAt: Date,
  // Expiration (waitlist entries expire after a certain time if not activated)
  expiresAt: {
    type: Date,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: Date,
  cancellationReason: String
}, {
  timestamps: true
});

// Indexes
featuredWaitlistSchema.index({ status: 1, position: 1 });
featuredWaitlistSchema.index({ tailor: 1, status: 1 });
featuredWaitlistSchema.index({ expiresAt: 1 });

// Static method to get current queue size
featuredWaitlistSchema.statics.getQueueSize = function() {
  return this.countDocuments({ status: 'waiting' });
};

// Static method to get next in queue
featuredWaitlistSchema.statics.getNextInQueue = function() {
  return this.findOne({ status: 'waiting' })
    .sort({ position: 1 })
    .populate({
      path: 'tailor',
      populate: { path: 'user', select: 'firstName lastName email' }
    });
};

// Static method to get position for a tailor
featuredWaitlistSchema.statics.getTailorPosition = async function(tailorId) {
  const entry = await this.findOne({
    tailor: tailorId,
    status: 'waiting'
  });

  if (!entry) return null;

  // Count how many are ahead
  const ahead = await this.countDocuments({
    status: 'waiting',
    position: { $lt: entry.position }
  });

  return ahead + 1;
};

// Static method to get the next position number
featuredWaitlistSchema.statics.getNextPosition = async function() {
  const lastEntry = await this.findOne({ status: 'waiting' })
    .sort({ position: -1 });
  return lastEntry ? lastEntry.position + 1 : 1;
};

// Instance method to activate this waitlist entry
featuredWaitlistSchema.methods.activate = async function(FeaturedSpot) {
  // Calculate dates
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + this.durationDays);

  // Create featured spot
  const featuredSpot = await FeaturedSpot.create({
    tailor: this.tailor,
    source: this.source,
    startDate,
    endDate,
    tokensSpent: this.tokensReserved,
    paymentAmount: this.paymentAmount,
    paymentCurrency: this.paymentCurrency,
    stripePaymentIntentId: this.stripePaymentIntentId,
    durationDays: this.durationDays,
    createdBy: this.createdBy
  });

  // Update this entry
  this.status = 'activated';
  this.activatedSpot = featuredSpot._id;
  this.activatedAt = new Date();
  await this.save();

  return featuredSpot;
};

export default mongoose.model('FeaturedWaitlist', featuredWaitlistSchema);
