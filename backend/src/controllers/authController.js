import User from '../models/User.js';
import TailorProfile from '../models/TailorProfile.js';
import TailorAvailability from '../models/TailorAvailability.js';
import Referral from '../models/Referral.js';
import { sendTokenResponse, generateUsername } from '../utils/helpers.js';
import emailService from '../services/emailService.js';

// Generate unique referral code for new tailors
const generateReferralCode = async () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  let exists = true;
  while (exists) {
    code = 'REF-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    exists = await TailorProfile.findOne({ referralCode: code });
  }
  return code;
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role, referralCode } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: role === 'tailor' ? 'tailor' : 'customer'
    });

    // If registering as tailor, create tailor profile
    if (role === 'tailor') {
      const username = generateUsername(firstName, lastName);
      const newReferralCode = await generateReferralCode();

      // Check if there's a valid referral code
      let referredBy = null;
      if (referralCode) {
        const referrer = await TailorProfile.findOne({ referralCode });
        if (referrer) {
          referredBy = referrer._id;
        }
      }

      const tailorProfile = await TailorProfile.create({
        user: user._id,
        username,
        referralCode: newReferralCode,
        referredBy
      });

      // Create default availability
      await TailorAvailability.create({
        tailor: tailorProfile._id
      });

      // If referred, create referral record
      if (referredBy) {
        const referrer = await TailorProfile.findById(referredBy);
        await Referral.create({
          referrer: referredBy,
          referred: tailorProfile._id,
          referralCode,
          status: 'pending'
        });

        // Increment referrer's total referrals
        referrer.totalReferrals += 1;
        await referrer.save();
      }
    }

    // Send welcome email
    await emailService.sendWelcomeEmail(user);

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user - also select twoFactorEnabled
    const user = await User.findOne({ email }).select('+password +twoFactorEnabled');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      return res.status(200).json({
        success: true,
        requires2FA: true,
        userId: user._id,
        message: 'Two-factor authentication required'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    let tailorProfile = null;
    if (user.role === 'tailor') {
      tailorProfile = await TailorProfile.findOne({ user: user._id });
    }

    res.status(200).json({
      success: true,
      user,
      tailorProfile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user details
// @route   PUT /api/auth/details
// @access  Private
export const updateDetails = async (req, res, next) => {
  try {
    const { firstName, lastName, avatar, preferences } = req.body;

    const updateFields = {};
    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (avatar !== undefined) updateFields.avatar = avatar;
    if (preferences) updateFields.preferences = preferences;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};
