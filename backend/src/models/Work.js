import mongoose from 'mongoose';

const workSchema = new mongoose.Schema({
  tailor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TailorProfile',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  category: {
    type: String,
    required: [true, 'Category is required']
  },
  fabricTypes: [{
    type: String
  }],
  tags: [{
    type: String,
    lowercase: true
  }],
  price: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    isStartingPrice: {
      type: Boolean,
      default: true
    }
  },
  completionTime: {
    value: Number,
    unit: {
      type: String,
      enum: ['days', 'weeks', 'months'],
      default: 'days'
    }
  },
  // Approval for moderation
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
  // Stats
  viewCount: {
    type: Number,
    default: 0
  },
  likeCount: {
    type: Number,
    default: 0
  },
  // Featured
  isFeatured: {
    type: Boolean,
    default: false
  },
  featuredAt: Date,
  featuredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for search
workSchema.index({
  title: 'text',
  description: 'text',
  category: 'text',
  tags: 'text'
});

// Get primary image
workSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary ? primary.url : (this.images[0]?.url || null);
});

workSchema.set('toJSON', { virtuals: true });
workSchema.set('toObject', { virtuals: true });

// Update tailor's work count on save/delete
workSchema.post('save', async function() {
  const TailorProfile = mongoose.model('TailorProfile');
  const count = await mongoose.model('Work').countDocuments({
    tailor: this.tailor,
    approvalStatus: 'approved'
  });
  await TailorProfile.findByIdAndUpdate(this.tailor, { workCount: count });
});

workSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    const TailorProfile = mongoose.model('TailorProfile');
    const count = await mongoose.model('Work').countDocuments({
      tailor: doc.tailor,
      approvalStatus: 'approved'
    });
    await TailorProfile.findByIdAndUpdate(doc.tailor, { workCount: count });
  }
});

export default mongoose.model('Work', workSchema);
