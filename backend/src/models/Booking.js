import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
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
  // Appointment details
  date: {
    type: Date,
    required: [true, 'Booking date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required']
  },
  // Service details
  service: {
    type: String,
    required: [true, 'Service description is required'],
    maxlength: [200, 'Service description cannot exceed 200 characters']
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  // Reference images from customer
  referenceImages: [{
    url: String,
    description: String
  }],
  // Customer measurement profile for this booking
  measurementProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerMeasurement'
  },
  // Snapshot of measurements at booking time (in case profile is later modified)
  measurementSnapshot: [{
    pointKey: String,
    value: Number,
    unit: String
  }],
  // Status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'completed', 'cancelled'],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    note: String
  }],
  // Tailor's response
  declineReason: String,
  // Payment
  price: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'held', 'released', 'refunded'],
    default: 'pending'
  },
  stripePaymentIntentId: String,
  // Completion
  completedAt: Date,
  completionNotes: String,
  // Cancellation
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: String
}, {
  timestamps: true
});

// Indexes
bookingSchema.index({ tailor: 1, date: 1 });
bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });

// Update tailor's completed bookings count
bookingSchema.post('findOneAndUpdate', async function(doc) {
  if (doc && doc.status === 'completed') {
    const TailorProfile = mongoose.model('TailorProfile');
    const count = await mongoose.model('Booking').countDocuments({
      tailor: doc.tailor,
      status: 'completed'
    });
    await TailorProfile.findByIdAndUpdate(doc.tailor, { completedBookings: count });
  }
});

export default mongoose.model('Booking', bookingSchema);
