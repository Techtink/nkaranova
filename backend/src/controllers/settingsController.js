import { Settings } from '../models/index.js';

// @desc    Get all settings
// @route   GET /api/settings
// @access  Private (Admin)
export const getAllSettings = async (req, res) => {
  try {
    const settings = await Settings.getAll();

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get all settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get settings by category
// @route   GET /api/settings/category/:category
// @access  Private (Admin)
export const getSettingsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const settings = await Settings.getByCategory(category);

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get settings by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get a single setting
// @route   GET /api/settings/:key
// @access  Private (Admin)
export const getSetting = async (req, res) => {
  try {
    const value = await Settings.getValue(req.params.key);

    if (value === null) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    res.json({
      success: true,
      data: { key: req.params.key, value }
    });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update a setting
// @route   PUT /api/settings/:key
// @access  Private (Admin)
export const updateSetting = async (req, res) => {
  try {
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Value is required'
      });
    }

    const setting = await Settings.setValue(req.params.key, value, req.user._id);

    res.json({
      success: true,
      data: setting
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update multiple settings
// @route   PUT /api/settings
// @access  Private (Admin)
export const updateMultipleSettings = async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Settings object is required'
      });
    }

    const updated = [];
    for (const [key, value] of Object.entries(settings)) {
      const setting = await Settings.setValue(key, value, req.user._id);
      updated.push(setting);
    }

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Update multiple settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Initialize default settings
// @route   POST /api/settings/initialize
// @access  Private (Admin)
export const initializeSettings = async (req, res) => {
  try {
    await Settings.initializeDefaults();

    const settings = await Settings.getAll();

    res.json({
      success: true,
      message: 'Settings initialized',
      data: settings
    });
  } catch (error) {
    console.error('Initialize settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get public referral settings (for registration page)
// @route   GET /api/settings/public/referral
// @access  Public
export const getPublicReferralSettings = async (req, res) => {
  try {
    const tokensPerReferral = await Settings.getValue('tokens_per_referral');
    const tokensForFeatured = await Settings.getValue('tokens_for_featured_spot');

    res.json({
      success: true,
      data: {
        tokensPerReferral,
        tokensForFeatured,
        referralsNeededForFeatured: Math.ceil(tokensForFeatured / tokensPerReferral)
      }
    });
  } catch (error) {
    console.error('Get public referral settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get public landing page settings
// @route   GET /api/settings/public/landing
// @access  Public
export const getPublicLandingSettings = async (req, res) => {
  try {
    const landingSettings = await Settings.getByCategory('landing');

    res.json({
      success: true,
      data: landingSettings
    });
  } catch (error) {
    console.error('Get public landing settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get public mobile app settings
// @route   GET /api/settings/public/mobile
// @access  Public
export const getPublicMobileSettings = async (req, res) => {
  try {
    const mobileSettings = await Settings.getByCategory('mobile');

    res.json({
      success: true,
      data: mobileSettings
    });
  } catch (error) {
    console.error('Get public mobile settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload hero image
// @route   POST /api/settings/upload-hero
// @access  Private (Admin)
export const uploadHeroImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image uploaded'
      });
    }

    const imageUrl = `/uploads/landing/${req.file.filename}`;

    // Save to settings
    await Settings.setValue('landing_hero_image', imageUrl, req.user._id);

    res.json({
      success: true,
      data: {
        url: imageUrl
      }
    });
  } catch (error) {
    console.error('Upload hero image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
