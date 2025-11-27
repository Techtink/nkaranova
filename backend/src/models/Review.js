import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  tailor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TailorProfile',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  images: [{
    url: String,
    caption: String
  }],
  // Tailor response
  response: {
    comment: String,
    respondedAt: Date
  },
  // Moderation
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
  // Helpful votes
  helpfulCount: {
    type: Number,
    default: 0
  },
  helpfulVotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    votedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Prevent duplicate reviews from same customer for same tailor
reviewSchema.index({ tailor: 1, customer: 1 }, { unique: true });

// Update tailor's average rating on save
reviewSchema.post('save', async function() {
  await updateTailorRating(this.tailor);
});

reviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    await updateTailorRating(doc.tailor);
  }
});

reviewSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    await updateTailorRating(doc.tailor);
  }
});

async function updateTailorRating(tailorId) {
  const Review = mongoose.model('Review');
  const TailorProfile = mongoose.model('TailorProfile');

  const stats = await Review.aggregate([
    {
      $match: {
        tailor: tailorId,
        approvalStatus: 'approved'
      }
    },
    {
      $group: {
        _id: '$tailor',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await TailorProfile.findByIdAndUpdate(tailorId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      reviewCount: stats[0].reviewCount
    });
  } else {
    await TailorProfile.findByIdAndUpdate(tailorId, {
      averageRating: 0,
      reviewCount: 0
    });
  }
}

export default mongoose.model('Review', reviewSchema);
