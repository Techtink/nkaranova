import mongoose from 'mongoose';

// Custom measurement point created by a tailor
const customMeasurementPointSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  // Position on mannequin (percentages)
  position: {
    male: {
      front: { x: Number, y: Number },
      back: { x: Number, y: Number }
    },
    female: {
      front: { x: Number, y: Number },
      back: { x: Number, y: Number }
    }
  },
  side: {
    type: String,
    enum: ['front', 'back', 'both'],
    default: 'front'
  },
  category: {
    type: String,
    enum: ['upper_body', 'lower_body', 'full_body', 'arms', 'legs', 'other'],
    default: 'other'
  },
  applicableGenders: [{
    type: String,
    enum: ['male', 'female', 'both']
  }],
  instructions: String,
  isRequired: {
    type: Boolean,
    default: true
  },
  order: Number
});

// Tailor's measurement configuration
const tailorMeasurementConfigSchema = new mongoose.Schema({
  tailor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TailorProfile',
    required: true,
    unique: true
  },
  // System measurement points that this tailor requires
  requiredSystemPoints: [{
    pointKey: {
      type: String,
      required: true
    },
    isRequired: {
      type: Boolean,
      default: true
    },
    // Tailor can add custom instructions
    customInstructions: String,
    // Override order for this tailor
    order: Number
  }],
  // Custom measurement points defined by this tailor
  customPoints: [customMeasurementPointSchema],
  // General settings
  settings: {
    // Measurement unit preference
    preferredUnit: {
      type: String,
      enum: ['cm', 'inches'],
      default: 'cm'
    },
    // Whether measurements are required for booking
    measurementsRequired: {
      type: Boolean,
      default: true
    },
    // Allow customers to skip measurements temporarily
    allowSkip: {
      type: Boolean,
      default: false
    },
    // Custom message shown to customers
    customMessage: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Get combined measurement points for a tailor
tailorMeasurementConfigSchema.methods.getCombinedPoints = async function(gender = null) {
  const MeasurementPoint = mongoose.model('MeasurementPoint');

  // Get all system points
  const systemPoints = await MeasurementPoint.getActive(gender);

  // Create a map of required system points with tailor overrides
  const configuredSystemPoints = this.requiredSystemPoints.reduce((acc, rsp) => {
    acc[rsp.pointKey] = rsp;
    return acc;
  }, {});

  // Build combined list
  const combined = [];

  // Add configured system points
  for (const point of systemPoints) {
    const tailorConfig = configuredSystemPoints[point.key];
    if (tailorConfig) {
      combined.push({
        ...point.toObject(),
        isRequired: tailorConfig.isRequired,
        instructions: tailorConfig.customInstructions || point.instructions,
        order: tailorConfig.order || point.order,
        isCustom: false
      });
    }
  }

  // Add custom points (filter by gender if specified)
  for (const customPoint of this.customPoints) {
    if (!gender || customPoint.applicableGenders.includes(gender) || customPoint.applicableGenders.includes('both')) {
      combined.push({
        ...customPoint.toObject(),
        isCustom: true
      });
    }
  }

  // Sort by order
  combined.sort((a, b) => (a.order || 999) - (b.order || 999));

  return combined;
};

// Static: Create default config for a tailor
tailorMeasurementConfigSchema.statics.createDefaultConfig = async function(tailorId) {
  const MeasurementPoint = mongoose.model('MeasurementPoint');
  const systemPoints = await MeasurementPoint.find({ isSystemDefault: true });

  const requiredSystemPoints = systemPoints.map((point, index) => ({
    pointKey: point.key,
    isRequired: true,
    order: index + 1
  }));

  return this.create({
    tailor: tailorId,
    requiredSystemPoints,
    customPoints: []
  });
};

export default mongoose.model('TailorMeasurementConfig', tailorMeasurementConfigSchema);
