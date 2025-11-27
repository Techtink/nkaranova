import { TailorProfile, Referral, TokenTransaction, Settings } from '../models/index.js';
import crypto from 'crypto';

// Generate unique referral code
const generateReferralCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'REF-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// @desc    Get tailor's referral info
// @route   GET /api/referrals/my-info
// @access  Private (Tailor)
export const getMyReferralInfo = async (req, res) => {
  try {
    let tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    // Generate referral code if doesn't exist
    if (!tailor.referralCode) {
      let code;
      let exists = true;
      while (exists) {
        code = generateReferralCode();
        exists = await TailorProfile.findOne({ referralCode: code });
      }
      tailor.referralCode = code;
      await tailor.save();
    }

    // Get referral stats
    const referrals = await Referral.find({ referrer: tailor._id })
      .populate({
        path: 'referred',
        select: 'username businessName profilePhoto verificationStatus',
        populate: { path: 'user', select: 'firstName lastName' }
      })
      .sort({ createdAt: -1 });

    // Get settings
    const tokensPerReferral = await Settings.getValue('tokens_per_referral');
    const tokensForFeatured = await Settings.getValue('tokens_for_featured_spot');

    res.json({
      success: true,
      data: {
        referralCode: tailor.referralCode,
        referralLink: `${process.env.FRONTEND_URL}/join?ref=${tailor.referralCode}`,
        tokenBalance: tailor.tokenBalance,
        totalReferrals: tailor.totalReferrals,
        successfulReferrals: tailor.successfulReferrals,
        referrals,
        settings: {
          tokensPerReferral,
          tokensForFeatured,
          referralsNeededForFeatured: Math.ceil(tokensForFeatured / tokensPerReferral)
        }
      }
    });
  } catch (error) {
    console.error('Get referral info error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get token transaction history
// @route   GET /api/referrals/token-history
// @access  Private (Tailor)
export const getTokenHistory = async (req, res) => {
  try {
    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const transactions = await TokenTransaction.find({ tailor: tailor._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('relatedReferral')
      .populate('relatedFeaturedSpot');

    const total = await TokenTransaction.countDocuments({ tailor: tailor._id });

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get token history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Process referral when new tailor signs up
// @route   POST /api/referrals/process
// @access  Private (Internal use / during registration)
export const processReferral = async (req, res) => {
  try {
    const { referralCode, newTailorId } = req.body;

    if (!referralCode || !newTailorId) {
      return res.status(400).json({
        success: false,
        message: 'Referral code and new tailor ID required'
      });
    }

    // Find referrer
    const referrer = await TailorProfile.findOne({ referralCode });
    if (!referrer) {
      return res.status(404).json({
        success: false,
        message: 'Invalid referral code'
      });
    }

    // Find new tailor
    const newTailor = await TailorProfile.findById(newTailorId);
    if (!newTailor) {
      return res.status(404).json({
        success: false,
        message: 'New tailor not found'
      });
    }

    // Check if already referred
    const existingReferral = await Referral.findOne({ referred: newTailorId });
    if (existingReferral) {
      return res.status(400).json({
        success: false,
        message: 'This tailor has already been referred'
      });
    }

    // Can't refer yourself
    if (referrer._id.equals(newTailorId)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot refer yourself'
      });
    }

    // Create referral record
    const referral = await Referral.create({
      referrer: referrer._id,
      referred: newTailorId,
      referralCode,
      status: 'pending'
    });

    // Update new tailor's referredBy
    newTailor.referredBy = referrer._id;
    await newTailor.save();

    // Increment referrer's total referrals
    referrer.totalReferrals += 1;
    await referrer.save();

    res.json({
      success: true,
      data: referral
    });
  } catch (error) {
    console.error('Process referral error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Complete referral and award tokens (called when referred tailor is verified)
// @route   POST /api/referrals/complete/:referralId
// @access  Private (Admin)
export const completeReferral = async (req, res) => {
  try {
    const referral = await Referral.findById(req.params.referralId);

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Referral not found'
      });
    }

    if (referral.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Referral already processed'
      });
    }

    // Get tokens per referral from settings
    const tokensPerReferral = await Settings.getValue('tokens_per_referral');

    // Update referrer's token balance
    const referrer = await TailorProfile.findById(referral.referrer);
    referrer.tokenBalance += tokensPerReferral;
    referrer.successfulReferrals += 1;
    await referrer.save();

    // Create token transaction
    await TokenTransaction.create({
      tailor: referrer._id,
      type: 'credit',
      amount: tokensPerReferral,
      balanceAfter: referrer.tokenBalance,
      reason: 'referral_bonus',
      description: `Bonus for referring a new tailor`,
      relatedReferral: referral._id
    });

    // Update referral status
    referral.status = 'completed';
    referral.tokensAwarded = tokensPerReferral;
    referral.completedAt = new Date();
    await referral.save();

    res.json({
      success: true,
      data: referral
    });
  } catch (error) {
    console.error('Complete referral error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Validate referral code
// @route   GET /api/referrals/validate/:code
// @access  Public
export const validateReferralCode = async (req, res) => {
  try {
    const tailor = await TailorProfile.findOne({ referralCode: req.params.code })
      .populate('user', 'firstName lastName');

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Invalid referral code'
      });
    }

    res.json({
      success: true,
      data: {
        valid: true,
        referrerName: tailor.businessName || `${tailor.user.firstName} ${tailor.user.lastName}`
      }
    });
  } catch (error) {
    console.error('Validate referral code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Admin: Get all referrals
// @route   GET /api/referrals/admin/all
// @access  Private (Admin)
export const getAllReferrals = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;

    const referrals = await Referral.find(query)
      .populate({
        path: 'referrer',
        select: 'username businessName',
        populate: { path: 'user', select: 'firstName lastName email' }
      })
      .populate({
        path: 'referred',
        select: 'username businessName verificationStatus',
        populate: { path: 'user', select: 'firstName lastName email' }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Referral.countDocuments(query);

    res.json({
      success: true,
      data: referrals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all referrals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Admin: Adjust tailor tokens
// @route   POST /api/referrals/admin/adjust-tokens
// @access  Private (Admin)
export const adjustTokens = async (req, res) => {
  try {
    const { tailorId, amount, reason, description } = req.body;

    const tailor = await TailorProfile.findById(tailorId);
    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor not found'
      });
    }

    const type = amount >= 0 ? 'credit' : 'debit';
    tailor.tokenBalance += amount;

    // Prevent negative balance
    if (tailor.tokenBalance < 0) {
      return res.status(400).json({
        success: false,
        message: 'Adjustment would result in negative balance'
      });
    }

    await tailor.save();

    // Create transaction record
    const transaction = await TokenTransaction.create({
      tailor: tailor._id,
      type,
      amount: Math.abs(amount),
      balanceAfter: tailor.tokenBalance,
      reason: reason || 'admin_adjustment',
      description,
      createdBy: req.user._id
    });

    res.json({
      success: true,
      data: {
        newBalance: tailor.tokenBalance,
        transaction
      }
    });
  } catch (error) {
    console.error('Adjust tokens error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
