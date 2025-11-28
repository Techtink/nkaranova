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
  // Status - reflects the booking/consultation flow
  status: {
    type: String,
    enum: [
      'pending',           // Initial request, waiting for tailor to accept
      'confirmed',         // Tailor accepted, consultation scheduled
      'consultation_done', // Consultation completed, tailor submitting quote
      'quote_submitted',   // Quote submitted, waiting for customer to accept
      'quote_accepted',    // Customer accepted quote, awaiting payment
      'paid',              // Payment received, ready to create order
      'converted',         // Converted to order - booking flow complete
      'cancelled',         // Cancelled by either party
      'declined'           // Tailor declined the booking
    ],
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
  // Consultation details (filled during/after consultation)
  consultation: {
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String,
    measurementsTaken: {
      type: Boolean,
      default: false
    }
  },
  // Quote from tailor (submitted after consultation)
  quote: {
    submittedAt: Date,
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // Item breakdown
    items: [{
      description: {
        type: String,
        required: true
      },
      quantity: {
        type: Number,
        default: 1
      },
      unitPrice: {
        type: Number,
        required: true
      }
    }],
    // Labor/service charges
    laborCost: {
      type: Number,
      default: 0
    },
    // Material costs
    materialCost: {
      type: Number,
      default: 0
    },
    // Total price
    totalAmount: {
      type: Number,
      required: function() { return this.quote?.submittedAt; }
    },
    currency: {
      type: String,
      default: 'NGN'
    },
    // Estimated timeline for order stages
    estimatedDays: {
      design: { type: Number, default: 3 },
      sew: { type: Number, default: 7 },
      deliver: { type: Number, default: 2 }
    },
    totalEstimatedDays: Number,
    // Quote notes/terms
    notes: String,
    validUntil: Date,
    // Customer response
    customerResponse: {
      status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
      },
      respondedAt: Date,
      rejectionReason: String
    }
  },
  // Linked order (created after payment)
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
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
