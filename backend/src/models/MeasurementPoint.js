import mongoose from 'mongoose';

// Default measurement points on the body
const measurementPointSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  // Position on mannequin (percentages for responsive positioning)
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
  // Which side of mannequin this measurement appears on
  side: {
    type: String,
    enum: ['front', 'back', 'both'],
    default: 'front'
  },
  // Measurement unit
  unit: {
    type: String,
    enum: ['cm', 'inches'],
    default: 'cm'
  },
  // Category for grouping
  category: {
    type: String,
    enum: ['upper_body', 'lower_body', 'full_body', 'arms', 'legs', 'other'],
    required: true
  },
  // Applicable genders
  applicableGenders: [{
    type: String,
    enum: ['male', 'female', 'both']
  }],
  // Instructions for measuring
  instructions: String,
  // Whether this is a system default (can't be deleted)
  isSystemDefault: {
    type: Boolean,
    default: false
  },
  // Display order
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Default system measurement points
const defaultMeasurementPoints = [
  // Upper Body
  {
    key: 'chest',
    name: 'Chest',
    description: 'Measure around the fullest part of the chest',
    category: 'upper_body',
    applicableGenders: ['male', 'female', 'both'],
    side: 'front',
    position: {
      male: { front: { x: 50, y: 28 }, back: { x: 50, y: 28 } },
      female: { front: { x: 50, y: 26 }, back: { x: 50, y: 26 } }
    },
    instructions: 'Wrap the tape measure around the fullest part of your chest, keeping it parallel to the ground.',
    order: 1,
    isSystemDefault: true
  },
  {
    key: 'bust',
    name: 'Bust',
    description: 'Measure around the fullest part of the bust',
    category: 'upper_body',
    applicableGenders: ['female'],
    side: 'front',
    position: {
      male: { front: { x: 50, y: 28 }, back: { x: 50, y: 28 } },
      female: { front: { x: 50, y: 25 }, back: { x: 50, y: 25 } }
    },
    instructions: 'Wrap the tape measure around the fullest part of your bust.',
    order: 2,
    isSystemDefault: true
  },
  {
    key: 'waist',
    name: 'Waist',
    description: 'Measure around natural waistline',
    category: 'upper_body',
    applicableGenders: ['male', 'female', 'both'],
    side: 'front',
    position: {
      male: { front: { x: 50, y: 38 }, back: { x: 50, y: 38 } },
      female: { front: { x: 50, y: 36 }, back: { x: 50, y: 36 } }
    },
    instructions: 'Find your natural waistline (smallest part of your torso) and measure around it.',
    order: 3,
    isSystemDefault: true
  },
  {
    key: 'shoulder_width',
    name: 'Shoulder Width',
    description: 'Measure from shoulder edge to shoulder edge',
    category: 'upper_body',
    applicableGenders: ['male', 'female', 'both'],
    side: 'back',
    position: {
      male: { front: { x: 50, y: 18 }, back: { x: 50, y: 18 } },
      female: { front: { x: 50, y: 17 }, back: { x: 50, y: 17 } }
    },
    instructions: 'Measure from the edge of one shoulder to the edge of the other across the back.',
    order: 4,
    isSystemDefault: true
  },
  {
    key: 'neck',
    name: 'Neck',
    description: 'Measure around the base of the neck',
    category: 'upper_body',
    applicableGenders: ['male', 'female', 'both'],
    side: 'front',
    position: {
      male: { front: { x: 50, y: 12 }, back: { x: 50, y: 12 } },
      female: { front: { x: 50, y: 11 }, back: { x: 50, y: 11 } }
    },
    instructions: 'Measure around the base of your neck where a collar would sit.',
    order: 5,
    isSystemDefault: true
  },
  // Lower Body
  {
    key: 'hip',
    name: 'Hip',
    description: 'Measure around the fullest part of the hips',
    category: 'lower_body',
    applicableGenders: ['male', 'female', 'both'],
    side: 'front',
    position: {
      male: { front: { x: 50, y: 48 }, back: { x: 50, y: 48 } },
      female: { front: { x: 50, y: 46 }, back: { x: 50, y: 46 } }
    },
    instructions: 'Measure around the fullest part of your hips and buttocks.',
    order: 6,
    isSystemDefault: true
  },
  {
    key: 'inseam',
    name: 'Inseam',
    description: 'Measure from crotch to ankle',
    category: 'legs',
    applicableGenders: ['male', 'female', 'both'],
    side: 'front',
    position: {
      male: { front: { x: 45, y: 70 }, back: { x: 45, y: 70 } },
      female: { front: { x: 45, y: 68 }, back: { x: 45, y: 68 } }
    },
    instructions: 'Measure from the crotch seam down the inside of the leg to the ankle.',
    order: 7,
    isSystemDefault: true
  },
  {
    key: 'outseam',
    name: 'Outseam',
    description: 'Measure from waist to ankle along outer leg',
    category: 'legs',
    applicableGenders: ['male', 'female', 'both'],
    side: 'front',
    position: {
      male: { front: { x: 35, y: 65 }, back: { x: 35, y: 65 } },
      female: { front: { x: 35, y: 63 }, back: { x: 35, y: 63 } }
    },
    instructions: 'Measure from your waist down the outside of your leg to your ankle.',
    order: 8,
    isSystemDefault: true
  },
  {
    key: 'thigh',
    name: 'Thigh',
    description: 'Measure around the fullest part of the thigh',
    category: 'legs',
    applicableGenders: ['male', 'female', 'both'],
    side: 'front',
    position: {
      male: { front: { x: 40, y: 55 }, back: { x: 40, y: 55 } },
      female: { front: { x: 40, y: 53 }, back: { x: 40, y: 53 } }
    },
    instructions: 'Measure around the fullest part of your thigh.',
    order: 9,
    isSystemDefault: true
  },
  // Arms
  {
    key: 'sleeve_length',
    name: 'Sleeve Length',
    description: 'Measure from shoulder to wrist',
    category: 'arms',
    applicableGenders: ['male', 'female', 'both'],
    side: 'front',
    position: {
      male: { front: { x: 20, y: 35 }, back: { x: 20, y: 35 } },
      female: { front: { x: 18, y: 33 }, back: { x: 18, y: 33 } }
    },
    instructions: 'Measure from the shoulder seam down to the wrist bone with arm slightly bent.',
    order: 10,
    isSystemDefault: true
  },
  {
    key: 'bicep',
    name: 'Bicep',
    description: 'Measure around the fullest part of the upper arm',
    category: 'arms',
    applicableGenders: ['male', 'female', 'both'],
    side: 'front',
    position: {
      male: { front: { x: 22, y: 30 }, back: { x: 22, y: 30 } },
      female: { front: { x: 20, y: 28 }, back: { x: 20, y: 28 } }
    },
    instructions: 'Measure around the fullest part of your upper arm.',
    order: 11,
    isSystemDefault: true
  },
  {
    key: 'wrist',
    name: 'Wrist',
    description: 'Measure around the wrist',
    category: 'arms',
    applicableGenders: ['male', 'female', 'both'],
    side: 'front',
    position: {
      male: { front: { x: 15, y: 48 }, back: { x: 15, y: 48 } },
      female: { front: { x: 13, y: 46 }, back: { x: 13, y: 46 } }
    },
    instructions: 'Measure around your wrist at the wrist bone.',
    order: 12,
    isSystemDefault: true
  },
  // Full Body
  {
    key: 'height',
    name: 'Height',
    description: 'Total body height',
    category: 'full_body',
    applicableGenders: ['male', 'female', 'both'],
    side: 'front',
    position: {
      male: { front: { x: 70, y: 50 }, back: { x: 70, y: 50 } },
      female: { front: { x: 70, y: 50 }, back: { x: 70, y: 50 } }
    },
    instructions: 'Stand straight against a wall and measure from the floor to the top of your head.',
    order: 13,
    isSystemDefault: true
  },
  {
    key: 'torso_length',
    name: 'Torso Length',
    description: 'Measure from shoulder to waist',
    category: 'full_body',
    applicableGenders: ['male', 'female', 'both'],
    side: 'back',
    position: {
      male: { front: { x: 50, y: 30 }, back: { x: 50, y: 30 } },
      female: { front: { x: 50, y: 28 }, back: { x: 50, y: 28 } }
    },
    instructions: 'Measure from the base of your neck down your spine to your natural waistline.',
    order: 14,
    isSystemDefault: true
  }
];

// Initialize default measurement points
measurementPointSchema.statics.initializeDefaults = async function() {
  for (const point of defaultMeasurementPoints) {
    await this.findOneAndUpdate(
      { key: point.key },
      point,
      { upsert: true, new: true }
    );
  }
  console.log('Default measurement points initialized');
};

// Get all active measurement points
measurementPointSchema.statics.getActive = function(gender = null) {
  const query = { isActive: true };

  if (gender) {
    query.applicableGenders = { $in: [gender, 'both'] };
  }

  return this.find(query).sort({ order: 1 });
};

export default mongoose.model('MeasurementPoint', measurementPointSchema);
