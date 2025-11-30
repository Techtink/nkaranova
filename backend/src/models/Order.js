import mongoose from 'mongoose';

// Sub-schema for stage notes/updates
const stageNoteSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    maxlength: [500, 'Note cannot exceed 500 characters']
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

// Sub-schema for work plan stages
const workPlanStageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Stage name is required'],
    maxlength: [100, 'Stage name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Stage description cannot exceed 500 characters']
  },
  estimatedDays: {
    type: Number,
    required: [true, 'Estimated days is required'],
    min: [1, 'Estimated days must be at least 1']
  },
  order: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },
  startedAt: Date,
  completedAt: Date,
  notes: [stageNoteSchema]
}, { _id: true });

// Sub-schema for work plan
const workPlanSchema = new mongoose.Schema({
  submittedAt: Date,
  approvedAt: Date,
  rejectedAt: Date,
  rejectionReason: String,
  estimatedCompletion: Date,
  stages: [workPlanStageSchema],
  totalEstimatedDays: Number,
  revisionHistory: [{
    revisedAt: {
      type: Date,
      default: Date.now
    },
    revisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    previousStages: mongoose.Schema.Types.Mixed // Snapshot of previous stages
  }]
}, { _id: false });

// Sub-schema for delay requests
const delayRequestSchema = new mongoose.Schema({
  requestedAt: {
    type: Date,
    default: Date.now
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: [true, 'Delay reason is required'],
    maxlength: [500, 'Delay reason cannot exceed 500 characters']
  },
  additionalDays: {
    type: Number,
    required: [true, 'Additional days is required'],
    min: [1, 'Additional days must be at least 1']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedAt: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewNotes: String
}, { _id: true });

// Main Order schema
const orderSchema = new mongoose.Schema({
  // Reference to booking
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  // Customer and tailor references (denormalized for easier querying)
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tailor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TailorProfile',
    required: true
  },
  // Order status - includes work plan review phase
  status: {
    type: String,
    enum: [
      'awaiting_plan',      // Waiting for tailor to submit work plan
      'plan_review',        // Work plan submitted, awaiting customer approval
      'plan_rejected',      // Work plan rejected by customer, needs revision
      'in_progress',        // Work plan approved, work in progress
      'ready',              // Work completed, ready for pickup/delivery
      'completed',          // Order delivered and confirmed
      'cancelled',          // Order cancelled
      'disputed'            // Under dispute
    ],
    default: 'awaiting_plan'
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
  // Work plan
  workPlan: workPlanSchema,
  // Current stage index (0-based)
  currentStage: {
    type: Number,
    default: 0
  },
  // Plan creation deadline
  planDeadline: {
    type: Date,
    required: true
  },
  planReminderSent: {
    type: Boolean,
    default: false
  },
  planOverdueNotified: {
    type: Boolean,
    default: false
  },
  // Delay requests
  delayRequests: [delayRequestSchema],
  // Completion tracking
  workStartedAt: Date,
  workCompletedAt: Date,
  deliveredAt: Date,
  completedAt: Date,
  // Customer feedback on completion
  completionFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date
  },
  // Cancellation
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: String,
  // Dispute
  dispute: {
    raisedAt: Date,
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    status: {
      type: String,
      enum: ['open', 'under_review', 'resolved'],
      default: 'open'
    },
    resolvedAt: Date,
    resolution: String
  }
}, {
  timestamps: true
});

// Indexes
orderSchema.index({ booking: 1 }, { unique: true });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ tailor: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ planDeadline: 1 });
orderSchema.index({ 'workPlan.estimatedCompletion': 1 });

// Virtual for progress percentage
orderSchema.virtual('progressPercentage').get(function() {
  if (!this.workPlan?.stages?.length) return 0;

  const completedStages = this.workPlan.stages.filter(s => s.status === 'completed').length;
  return Math.round((completedStages / this.workPlan.stages.length) * 100);
});

// Virtual for current stage info
orderSchema.virtual('currentStageInfo').get(function() {
  if (!this.workPlan?.stages?.length) return null;
  return this.workPlan.stages[this.currentStage] || null;
});

// Virtual for is overdue
orderSchema.virtual('isOverdue').get(function() {
  if (!this.workPlan?.estimatedCompletion) return false;
  if (this.status === 'completed' || this.status === 'cancelled') return false;
  return new Date() > this.workPlan.estimatedCompletion;
});

// Virtual for days remaining
orderSchema.virtual('daysRemaining').get(function() {
  if (!this.workPlan?.estimatedCompletion) return null;
  const diff = this.workPlan.estimatedCompletion - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to update status history
orderSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date()
    });
  }
  next();
});

// Static method to create order from a paid booking
orderSchema.statics.createFromBooking = async function(booking, userId) {
  const { quote } = booking;

  // Create 3 stages: Design -> Sew -> Deliver
  const stages = [
    {
      name: 'Design',
      description: 'Design phase - patterns and preparation',
      estimatedDays: quote.estimatedDays?.design || 3,
      order: 0,
      status: 'in_progress',
      startedAt: new Date(),
      notes: []
    },
    {
      name: 'Sew',
      description: 'Sewing and assembly',
      estimatedDays: quote.estimatedDays?.sew || 7,
      order: 1,
      status: 'pending',
      notes: []
    },
    {
      name: 'Deliver',
      description: 'Final fitting and delivery',
      estimatedDays: quote.estimatedDays?.deliver || 2,
      order: 2,
      status: 'pending',
      notes: []
    }
  ];

  const totalDays = stages.reduce((sum, s) => sum + s.estimatedDays, 0);
  const estimatedCompletion = new Date();
  estimatedCompletion.setDate(estimatedCompletion.getDate() + totalDays);

  const order = new this({
    booking: booking._id,
    customer: booking.customer,
    tailor: booking.tailor,
    status: 'in_progress',
    workPlan: {
      submittedAt: new Date(),
      approvedAt: new Date(),
      stages,
      totalEstimatedDays: totalDays,
      estimatedCompletion
    },
    currentStage: 0,
    planDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    workStartedAt: new Date(),
    statusHistory: [{
      status: 'in_progress',
      changedAt: new Date(),
      changedBy: userId,
      note: 'Order created from paid booking, design phase started'
    }]
  });

  return order;
};

// Method to approve work plan
orderSchema.methods.approveWorkPlan = function(userId) {
  if (!this.workPlan) {
    throw new Error('No work plan to approve');
  }

  this.workPlan.approvedAt = new Date();
  this.status = 'in_progress';
  this.workStartedAt = new Date();

  // Start the first stage
  if (this.workPlan.stages?.length > 0) {
    this.workPlan.stages[0].status = 'in_progress';
    this.workPlan.stages[0].startedAt = new Date();
  }

  this.statusHistory.push({
    status: 'in_progress',
    changedAt: new Date(),
    changedBy: userId,
    note: 'Work plan approved, work started'
  });

  return this;
};

// Method to reject work plan
orderSchema.methods.rejectWorkPlan = function(reason, userId) {
  if (!this.workPlan) {
    throw new Error('No work plan to reject');
  }

  this.workPlan.rejectedAt = new Date();
  this.workPlan.rejectionReason = reason;
  this.status = 'plan_rejected';

  this.statusHistory.push({
    status: 'plan_rejected',
    changedAt: new Date(),
    changedBy: userId,
    note: `Work plan rejected: ${reason}`
  });

  return this;
};

// Method to complete a stage
orderSchema.methods.completeStage = function(stageIndex, notes, userId) {
  if (!this.workPlan?.stages?.[stageIndex]) {
    throw new Error('Invalid stage index');
  }

  const stage = this.workPlan.stages[stageIndex];
  stage.status = 'completed';
  stage.completedAt = new Date();

  if (notes) {
    stage.notes.push({
      text: notes,
      addedBy: userId,
      addedAt: new Date()
    });
  }

  // Check if all stages are complete
  const allComplete = this.workPlan.stages.every(s => s.status === 'completed');

  if (allComplete) {
    this.status = 'ready';
    this.workCompletedAt = new Date();
    this.statusHistory.push({
      status: 'ready',
      changedAt: new Date(),
      changedBy: userId,
      note: 'All stages completed, order ready'
    });
  } else {
    // Start next stage
    const nextStageIndex = stageIndex + 1;
    if (this.workPlan.stages[nextStageIndex]) {
      this.workPlan.stages[nextStageIndex].status = 'in_progress';
      this.workPlan.stages[nextStageIndex].startedAt = new Date();
      this.currentStage = nextStageIndex;
    }
  }

  return this;
};

// Method to mark as delivered/completed
orderSchema.methods.markCompleted = function(userId) {
  if (this.status !== 'ready') {
    throw new Error('Can only complete orders that are ready');
  }

  this.status = 'completed';
  this.deliveredAt = new Date();
  this.completedAt = new Date();

  this.statusHistory.push({
    status: 'completed',
    changedAt: new Date(),
    changedBy: userId,
    note: 'Order completed and delivered'
  });

  return this;
};

// Ensure virtuals are included in JSON
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

export default mongoose.model('Order', orderSchema);
