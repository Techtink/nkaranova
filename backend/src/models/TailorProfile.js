import mongoose from 'mongoose';

const tailorProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  businessName: {
    type: String,
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  bio: {
    type: String,
    maxlength: [1000, 'Bio cannot exceed 1000 characters']
  },
  profilePhoto: {
    type: String,
    default: null
  },
  coverPhoto: {
    type: String,
    default: null
  },
  specialties: [{
    type: String
  }],
  location: {
    address: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  // Private contact info - only visible to admin
  privateContact: {
    phone: String,
    email: String,
    website: String,
    instagram: String,
    facebook: String,
    twitter: String
  },
  // Approval status
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvalNote: String,
  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Verification
  verificationStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none'
  },
  verificationDocuments: [{
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  verificationNote: String,
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Stats (denormalized for performance)
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  workCount: {
    type: Number,
    default: 0
  },
  completedBookings: {
    type: Number,
    default: 0
  },
  // Stripe Connect
  stripeAccountId: String,
  stripeOnboardingComplete: {
    type: Boolean,
    default: false
  },
  // Settings
  acceptingBookings: {
    type: Boolean,
    default: true
  },
  minimumPrice: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  // Referral System
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TailorProfile'
  },
  tokenBalance: {
    type: Number,
    default: 0
  },
  totalReferrals: {
    type: Number,
    default: 0
  },
  successfulReferrals: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for search
tailorProfileSchema.index({
  username: 'text',
  businessName: 'text',
  bio: 'text',
  specialties: 'text',
  'location.city': 'text',
  'location.country': 'text'
});

// Index for geolocation queries
tailorProfileSchema.index({ 'location.coordinates': '2dsphere' });

// Only return approved tailors in public queries
tailorProfileSchema.statics.findApproved = function(query = {}) {
  return this.find({ ...query, approvalStatus: 'approved' });
};

export default mongoose.model('TailorProfile', tailorProfileSchema);
