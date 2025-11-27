import mongoose from 'mongoose';

// Individual measurement value
const measurementValueSchema = new mongoose.Schema({
  pointKey: {
    type: String,
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    enum: ['cm', 'inches'],
    default: 'cm'
  },
  // For custom points, store the full point info
  customPointInfo: {
    name: String,
    description: String
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Customer measurement profile (they can have multiple - self, partner, child, etc.)
const customerMeasurementSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Profile name (e.g., "My Measurements", "Partner", "Son - John")
  profileName: {
    type: String,
    required: true,
    default: 'My Measurements'
  },
  // Gender for this profile
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true
  },
  // Body type for reference (optional)
  bodyType: {
    type: String,
    enum: ['slim', 'regular', 'athletic', 'plus'],
    default: 'regular'
  },
  // All measurements for this profile
  measurements: [measurementValueSchema],
  // Preferred unit for this profile
  preferredUnit: {
    type: String,
    enum: ['cm', 'inches'],
    default: 'cm'
  },
  // Is this the default profile for this customer?
  isDefault: {
    type: Boolean,
    default: false
  },
  // Notes (e.g., "Prefer looser fit", "Broad shoulders")
  notes: String,
  // Timestamps for tracking
  lastUsedAt: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
customerMeasurementSchema.index({ customer: 1, isActive: 1 });
customerMeasurementSchema.index({ customer: 1, isDefault: 1 });

// Ensure only one default per customer
customerMeasurementSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    // Remove default from other profiles
    await this.constructor.updateMany(
      {
        customer: this.customer,
        _id: { $ne: this._id },
        isDefault: true
      },
      { isDefault: false }
    );
  }
  next();
});

// Get measurement value by point key
customerMeasurementSchema.methods.getMeasurement = function(pointKey) {
  const measurement = this.measurements.find(m => m.pointKey === pointKey);
  return measurement ? measurement.value : null;
};

// Update or add measurement
customerMeasurementSchema.methods.setMeasurement = function(pointKey, value, unit = 'cm', customPointInfo = null) {
  const existingIndex = this.measurements.findIndex(m => m.pointKey === pointKey);

  const measurementData = {
    pointKey,
    value,
    unit,
    lastUpdated: new Date()
  };

  if (customPointInfo) {
    measurementData.customPointInfo = customPointInfo;
  }

  if (existingIndex >= 0) {
    this.measurements[existingIndex] = measurementData;
  } else {
    this.measurements.push(measurementData);
  }
};

// Get completeness percentage based on required points
customerMeasurementSchema.methods.getCompleteness = async function(tailorId = null) {
  let requiredPoints = [];

  if (tailorId) {
    const TailorMeasurementConfig = mongoose.model('TailorMeasurementConfig');
    const config = await TailorMeasurementConfig.findOne({ tailor: tailorId });

    if (config) {
      requiredPoints = config.requiredSystemPoints
        .filter(rsp => rsp.isRequired)
        .map(rsp => rsp.pointKey);

      // Add required custom points
      const requiredCustom = config.customPoints
        .filter(cp => cp.isRequired && (cp.applicableGenders.includes(this.gender) || cp.applicableGenders.includes('both')))
        .map(cp => cp.key);

      requiredPoints = [...requiredPoints, ...requiredCustom];
    }
  } else {
    // Use system defaults
    const MeasurementPoint = mongoose.model('MeasurementPoint');
    const systemPoints = await MeasurementPoint.find({
      isSystemDefault: true,
      isActive: true,
      applicableGenders: { $in: [this.gender, 'both'] }
    });
    requiredPoints = systemPoints.map(p => p.key);
  }

  if (requiredPoints.length === 0) return 100;

  const filledPoints = this.measurements.filter(m =>
    requiredPoints.includes(m.pointKey) && m.value !== null && m.value !== undefined
  ).length;

  return Math.round((filledPoints / requiredPoints.length) * 100);
};

// Static: Get all profiles for a customer
customerMeasurementSchema.statics.getProfiles = function(customerId) {
  return this.find({
    customer: customerId,
    isActive: true
  }).sort({ isDefault: -1, createdAt: -1 });
};

// Static: Get default profile for a customer
customerMeasurementSchema.statics.getDefault = function(customerId) {
  return this.findOne({
    customer: customerId,
    isDefault: true,
    isActive: true
  });
};

// Static: Get or create a default profile for a customer
customerMeasurementSchema.statics.getOrCreateDefault = async function(customerId, gender = 'male') {
  let profile = await this.getDefault(customerId);

  if (!profile) {
    profile = await this.create({
      customer: customerId,
      profileName: 'My Measurements',
      gender,
      isDefault: true
    });
  }

  return profile;
};

export default mongoose.model('CustomerMeasurement', customerMeasurementSchema);
