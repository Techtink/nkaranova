import {
  MeasurementPoint,
  TailorMeasurementConfig,
  CustomerMeasurement,
  TailorProfile
} from '../models/index.js';

// ==================== SYSTEM MEASUREMENT POINTS ====================

// @desc    Get all system measurement points
// @route   GET /api/measurements/points
// @access  Public
export const getSystemMeasurementPoints = async (req, res) => {
  try {
    const { gender } = req.query;
    const points = await MeasurementPoint.getActive(gender);

    res.json({
      success: true,
      data: points
    });
  } catch (error) {
    console.error('Get measurement points error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Initialize default measurement points (admin)
// @route   POST /api/measurements/points/initialize
// @access  Private (Admin)
export const initializeMeasurementPoints = async (req, res) => {
  try {
    await MeasurementPoint.initializeDefaults();

    res.json({
      success: true,
      message: 'Default measurement points initialized'
    });
  } catch (error) {
    console.error('Initialize measurement points error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ==================== TAILOR MEASUREMENT CONFIG ====================

// @desc    Get tailor's measurement configuration
// @route   GET /api/measurements/tailor/config
// @access  Private (Tailor)
export const getMyMeasurementConfig = async (req, res) => {
  try {
    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    let config = await TailorMeasurementConfig.findOne({ tailor: tailor._id });

    // Create default config if doesn't exist
    if (!config) {
      config = await TailorMeasurementConfig.createDefaultConfig(tailor._id);
    }

    // Get combined points for display
    const combinedPoints = await config.getCombinedPoints();

    res.json({
      success: true,
      data: {
        config,
        combinedPoints
      }
    });
  } catch (error) {
    console.error('Get measurement config error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update tailor's required system points
// @route   PUT /api/measurements/tailor/config/system-points
// @access  Private (Tailor)
export const updateRequiredSystemPoints = async (req, res) => {
  try {
    const { requiredSystemPoints } = req.body;
    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    let config = await TailorMeasurementConfig.findOne({ tailor: tailor._id });

    if (!config) {
      config = await TailorMeasurementConfig.createDefaultConfig(tailor._id);
    }

    config.requiredSystemPoints = requiredSystemPoints;
    await config.save();

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Update required system points error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add custom measurement point
// @route   POST /api/measurements/tailor/config/custom-point
// @access  Private (Tailor)
export const addCustomMeasurementPoint = async (req, res) => {
  try {
    const { name, description, position, side, category, applicableGenders, instructions, isRequired } = req.body;
    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    let config = await TailorMeasurementConfig.findOne({ tailor: tailor._id });

    if (!config) {
      config = await TailorMeasurementConfig.createDefaultConfig(tailor._id);
    }

    // Generate unique key
    const key = `custom_${tailor._id}_${Date.now()}`;

    // Get next order number
    const maxOrder = config.customPoints.reduce((max, cp) => Math.max(max, cp.order || 0), 0);

    const customPoint = {
      key,
      name,
      description,
      position,
      side: side || 'front',
      category: category || 'other',
      applicableGenders: applicableGenders || ['both'],
      instructions,
      isRequired: isRequired !== false,
      order: maxOrder + 1
    };

    config.customPoints.push(customPoint);
    await config.save();

    res.json({
      success: true,
      data: customPoint
    });
  } catch (error) {
    console.error('Add custom measurement point error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update custom measurement point
// @route   PUT /api/measurements/tailor/config/custom-point/:pointKey
// @access  Private (Tailor)
export const updateCustomMeasurementPoint = async (req, res) => {
  try {
    const { pointKey } = req.params;
    const updates = req.body;
    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    const config = await TailorMeasurementConfig.findOne({ tailor: tailor._id });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Measurement config not found'
      });
    }

    const pointIndex = config.customPoints.findIndex(cp => cp.key === pointKey);

    if (pointIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Custom point not found'
      });
    }

    // Update fields
    Object.assign(config.customPoints[pointIndex], updates);
    await config.save();

    res.json({
      success: true,
      data: config.customPoints[pointIndex]
    });
  } catch (error) {
    console.error('Update custom measurement point error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete custom measurement point
// @route   DELETE /api/measurements/tailor/config/custom-point/:pointKey
// @access  Private (Tailor)
export const deleteCustomMeasurementPoint = async (req, res) => {
  try {
    const { pointKey } = req.params;
    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    const config = await TailorMeasurementConfig.findOne({ tailor: tailor._id });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Measurement config not found'
      });
    }

    config.customPoints = config.customPoints.filter(cp => cp.key !== pointKey);
    await config.save();

    res.json({
      success: true,
      message: 'Custom point deleted'
    });
  } catch (error) {
    console.error('Delete custom measurement point error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update measurement settings
// @route   PUT /api/measurements/tailor/config/settings
// @access  Private (Tailor)
export const updateMeasurementSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    let config = await TailorMeasurementConfig.findOne({ tailor: tailor._id });

    if (!config) {
      config = await TailorMeasurementConfig.createDefaultConfig(tailor._id);
    }

    config.settings = { ...config.settings, ...settings };
    await config.save();

    res.json({
      success: true,
      data: config.settings
    });
  } catch (error) {
    console.error('Update measurement settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get a specific tailor's measurement requirements (for customers)
// @route   GET /api/measurements/tailor/:tailorId/requirements
// @access  Public
export const getTailorMeasurementRequirements = async (req, res) => {
  try {
    const { tailorId } = req.params;
    const { gender } = req.query;

    // Find tailor by ID or username
    let tailor;
    if (tailorId.match(/^[0-9a-fA-F]{24}$/)) {
      tailor = await TailorProfile.findById(tailorId);
    } else {
      tailor = await TailorProfile.findOne({ username: tailorId });
    }

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor not found'
      });
    }

    let config = await TailorMeasurementConfig.findOne({ tailor: tailor._id });

    // Use defaults if no config
    if (!config) {
      const systemPoints = await MeasurementPoint.getActive(gender);
      return res.json({
        success: true,
        data: {
          points: systemPoints.map(p => ({
            ...p.toObject(),
            isRequired: true,
            isCustom: false
          })),
          settings: {
            preferredUnit: 'cm',
            measurementsRequired: true,
            allowSkip: false
          }
        }
      });
    }

    const combinedPoints = await config.getCombinedPoints(gender);

    res.json({
      success: true,
      data: {
        points: combinedPoints,
        settings: config.settings
      }
    });
  } catch (error) {
    console.error('Get tailor measurement requirements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ==================== CUSTOMER MEASUREMENTS ====================

// @desc    Get all measurement profiles for current user
// @route   GET /api/measurements/profiles
// @access  Private
export const getMyMeasurementProfiles = async (req, res) => {
  try {
    const profiles = await CustomerMeasurement.getProfiles(req.user._id);

    res.json({
      success: true,
      data: profiles
    });
  } catch (error) {
    console.error('Get measurement profiles error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get a specific measurement profile
// @route   GET /api/measurements/profiles/:profileId
// @access  Private
export const getMeasurementProfile = async (req, res) => {
  try {
    const { profileId } = req.params;

    const profile = await CustomerMeasurement.findOne({
      _id: profileId,
      customer: req.user._id,
      isActive: true
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Get measurement profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create a new measurement profile
// @route   POST /api/measurements/profiles
// @access  Private
export const createMeasurementProfile = async (req, res) => {
  try {
    const { profileName, gender, bodyType, preferredUnit, notes, isDefault, measurements } = req.body;

    // Check profile count (limit to 10)
    const existingCount = await CustomerMeasurement.countDocuments({
      customer: req.user._id,
      isActive: true
    });

    if (existingCount >= 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 10 measurement profiles allowed'
      });
    }

    const profile = await CustomerMeasurement.create({
      customer: req.user._id,
      profileName: profileName || 'My Measurements',
      gender: gender || 'male',
      bodyType,
      preferredUnit: preferredUnit || 'cm',
      notes,
      isDefault: isDefault || existingCount === 0, // First profile is default
      measurements: measurements || []
    });

    res.status(201).json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Create measurement profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update measurement profile info
// @route   PUT /api/measurements/profiles/:profileId
// @access  Private
export const updateMeasurementProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { profileName, gender, bodyType, preferredUnit, notes, isDefault } = req.body;

    const profile = await CustomerMeasurement.findOne({
      _id: profileId,
      customer: req.user._id,
      isActive: true
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    if (profileName) profile.profileName = profileName;
    if (gender) profile.gender = gender;
    if (bodyType) profile.bodyType = bodyType;
    if (preferredUnit) profile.preferredUnit = preferredUnit;
    if (notes !== undefined) profile.notes = notes;
    if (isDefault !== undefined) profile.isDefault = isDefault;

    await profile.save();

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Update measurement profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update measurements in a profile
// @route   PUT /api/measurements/profiles/:profileId/measurements
// @access  Private
export const updateMeasurements = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { measurements } = req.body; // Array of { pointKey, value, unit, customPointInfo? }

    const profile = await CustomerMeasurement.findOne({
      _id: profileId,
      customer: req.user._id,
      isActive: true
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Update each measurement
    for (const m of measurements) {
      profile.setMeasurement(m.pointKey, m.value, m.unit || profile.preferredUnit, m.customPointInfo);
    }

    await profile.save();

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Update measurements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete a measurement profile (soft delete)
// @route   DELETE /api/measurements/profiles/:profileId
// @access  Private
export const deleteMeasurementProfile = async (req, res) => {
  try {
    const { profileId } = req.params;

    const profile = await CustomerMeasurement.findOne({
      _id: profileId,
      customer: req.user._id,
      isActive: true
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Check if it's the only profile
    const count = await CustomerMeasurement.countDocuments({
      customer: req.user._id,
      isActive: true
    });

    if (count === 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your only measurement profile'
      });
    }

    profile.isActive = false;
    await profile.save();

    // If it was the default, make another one default
    if (profile.isDefault) {
      const another = await CustomerMeasurement.findOne({
        customer: req.user._id,
        isActive: true
      });
      if (another) {
        another.isDefault = true;
        await another.save();
      }
    }

    res.json({
      success: true,
      message: 'Profile deleted'
    });
  } catch (error) {
    console.error('Delete measurement profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get profile completeness for a specific tailor
// @route   GET /api/measurements/profiles/:profileId/completeness/:tailorId
// @access  Private
export const getProfileCompleteness = async (req, res) => {
  try {
    const { profileId, tailorId } = req.params;

    const profile = await CustomerMeasurement.findOne({
      _id: profileId,
      customer: req.user._id,
      isActive: true
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Find tailor
    let tailor;
    if (tailorId.match(/^[0-9a-fA-F]{24}$/)) {
      tailor = await TailorProfile.findById(tailorId);
    } else {
      tailor = await TailorProfile.findOne({ username: tailorId });
    }

    const completeness = await profile.getCompleteness(tailor?._id);

    res.json({
      success: true,
      data: {
        completeness,
        isComplete: completeness === 100
      }
    });
  } catch (error) {
    console.error('Get profile completeness error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Set profile as default
// @route   POST /api/measurements/profiles/:profileId/set-default
// @access  Private
export const setDefaultProfile = async (req, res) => {
  try {
    const { profileId } = req.params;

    const profile = await CustomerMeasurement.findOne({
      _id: profileId,
      customer: req.user._id,
      isActive: true
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    profile.isDefault = true;
    await profile.save();

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Set default profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
