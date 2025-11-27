import TailorProfile from '../models/TailorProfile.js';
import TailorAvailability from '../models/TailorAvailability.js';
import Work from '../models/Work.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import emailService from '../services/emailService.js';
import { paginationResult } from '../utils/helpers.js';

// @desc    Get all approved tailors (public)
// @route   GET /api/tailors
// @access  Public
export const getTailors = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      specialty,
      location,
      minRating,
      sortBy = 'rating'
    } = req.query;

    const query = { approvalStatus: 'approved' };

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Filter by specialty
    if (specialty) {
      query.specialties = { $in: specialty.split(',') };
    }

    // Filter by location
    if (location) {
      query.$or = [
        { 'location.city': { $regex: location, $options: 'i' } },
        { 'location.country': { $regex: location, $options: 'i' } }
      ];
    }

    // Filter by minimum rating
    if (minRating) {
      query.averageRating = { $gte: parseFloat(minRating) };
    }

    // Sort options
    let sortOption = {};
    switch (sortBy) {
      case 'rating':
        sortOption = { averageRating: -1, reviewCount: -1 };
        break;
      case 'reviews':
        sortOption = { reviewCount: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'works':
        sortOption = { workCount: -1 };
        break;
      default:
        sortOption = { averageRating: -1 };
    }

    const total = await TailorProfile.countDocuments(query);
    const tailors = await TailorProfile.find(query)
      .select('-privateContact')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort(sortOption)
      .populate('user', 'firstName lastName avatar');

    res.status(200).json({
      success: true,
      data: tailors,
      pagination: paginationResult(total, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single tailor by username (public)
// @route   GET /api/tailors/:username
// @access  Public
export const getTailorByUsername = async (req, res, next) => {
  try {
    const tailor = await TailorProfile.findOne({
      username: req.params.username,
      approvalStatus: 'approved'
    })
      .select('-privateContact')
      .populate('user', 'firstName lastName avatar');

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor not found'
      });
    }

    // Get tailor's works
    const works = await Work.find({
      tailor: tailor._id,
      approvalStatus: 'approved'
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { tailor, works }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current tailor's profile (for dashboard)
// @route   GET /api/tailors/me/profile
// @access  Private/Tailor
export const getMyProfile = async (req, res, next) => {
  try {
    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    const availability = await TailorAvailability.findOne({ tailor: tailor._id });

    res.status(200).json({
      success: true,
      data: { tailor, availability }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update tailor profile
// @route   PUT /api/tailors/me/profile
// @access  Private/Tailor
export const updateMyProfile = async (req, res, next) => {
  try {
    const {
      username,
      businessName,
      bio,
      profilePhoto,
      specialties,
      location,
      privateContact,
      acceptingBookings,
      minimumPrice,
      currency
    } = req.body;

    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    // Check username uniqueness if changing
    if (username && username !== tailor.username) {
      const existingUsername = await TailorProfile.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
      tailor.username = username;
    }

    if (businessName !== undefined) tailor.businessName = businessName;
    if (bio !== undefined) tailor.bio = bio;
    if (profilePhoto !== undefined) tailor.profilePhoto = profilePhoto;
    if (specialties) tailor.specialties = specialties;
    if (location) tailor.location = location;
    if (privateContact) tailor.privateContact = privateContact;
    if (acceptingBookings !== undefined) tailor.acceptingBookings = acceptingBookings;
    if (minimumPrice !== undefined) tailor.minimumPrice = minimumPrice;
    if (currency) tailor.currency = currency;

    await tailor.save();

    res.status(200).json({
      success: true,
      data: tailor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tailor availability
// @route   GET /api/tailors/:username/availability
// @access  Public
export const getTailorAvailability = async (req, res, next) => {
  try {
    const tailor = await TailorProfile.findOne({
      username: req.params.username,
      approvalStatus: 'approved'
    });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor not found'
      });
    }

    const availability = await TailorAvailability.findOne({ tailor: tailor._id });

    res.status(200).json({
      success: true,
      data: availability
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update my availability
// @route   PUT /api/tailors/me/availability
// @access  Private/Tailor
export const updateMyAvailability = async (req, res, next) => {
  try {
    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    const {
      schedule,
      exceptions,
      slotDuration,
      bufferTime,
      advanceBookingDays,
      timezone
    } = req.body;

    let availability = await TailorAvailability.findOne({ tailor: tailor._id });

    if (!availability) {
      availability = new TailorAvailability({ tailor: tailor._id });
    }

    if (schedule) availability.schedule = schedule;
    if (exceptions) availability.exceptions = exceptions;
    if (slotDuration) availability.slotDuration = slotDuration;
    if (bufferTime !== undefined) availability.bufferTime = bufferTime;
    if (advanceBookingDays) availability.advanceBookingDays = advanceBookingDays;
    if (timezone) availability.timezone = timezone;

    await availability.save();

    res.status(200).json({
      success: true,
      data: availability
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get available slots for a date
// @route   GET /api/tailors/:username/slots/:date
// @access  Public
export const getAvailableSlots = async (req, res, next) => {
  try {
    const { username, date } = req.params;

    const tailor = await TailorProfile.findOne({
      username,
      approvalStatus: 'approved'
    });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor not found'
      });
    }

    const availability = await TailorAvailability.findOne({ tailor: tailor._id });

    if (!availability) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // Get existing bookings for that date
    const targetDate = new Date(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const existingBookings = await Booking.find({
      tailor: tailor._id,
      date: {
        $gte: targetDate,
        $lt: nextDay
      },
      status: { $in: ['pending', 'accepted'] }
    }).select('startTime endTime');

    const slots = availability.getAvailableSlotsForDate(targetDate, existingBookings);

    res.status(200).json({
      success: true,
      data: slots
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit verification request
// @route   POST /api/tailors/me/verification
// @access  Private/Tailor
export const submitVerification = async (req, res, next) => {
  try {
    const { documents } = req.body;

    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    if (tailor.verificationStatus === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Verification already pending'
      });
    }

    tailor.verificationStatus = 'pending';
    tailor.verificationDocuments = documents.map(url => ({
      url,
      uploadedAt: new Date()
    }));
    tailor.verificationNote = null;

    await tailor.save();

    res.status(200).json({
      success: true,
      message: 'Verification request submitted',
      data: tailor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if username is available
// @route   GET /api/tailors/check-username/:username
// @access  Private/Tailor
export const checkUsernameAvailability = async (req, res, next) => {
  try {
    const { username } = req.params;

    // Validate username format
    if (!username || username.length < 3) {
      return res.status(400).json({
        success: false,
        available: false,
        message: 'Username must be at least 3 characters'
      });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return res.status(400).json({
        success: false,
        available: false,
        message: 'Username can only contain letters, numbers, underscores, and hyphens'
      });
    }

    // Get current user's tailor profile to allow keeping their own username
    const currentTailor = await TailorProfile.findOne({ user: req.user._id });

    // If it's the user's current username, it's available to them
    if (currentTailor && currentTailor.username === username) {
      return res.status(200).json({
        success: true,
        available: true,
        message: 'This is your current username'
      });
    }

    // Check if username exists
    const existingTailor = await TailorProfile.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    });

    if (existingTailor) {
      return res.status(200).json({
        success: true,
        available: false,
        message: 'Username is already taken'
      });
    }

    res.status(200).json({
      success: true,
      available: true,
      message: 'Username is available'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured tailors
// @route   GET /api/tailors/featured
// @access  Public
export const getFeaturedTailors = async (req, res, next) => {
  try {
    const { Settings, FeaturedSpot } = await import('../models/index.js');
    const maxFeatured = await Settings.getValue('max_featured_tailors');

    // First, get tailors from active featured spots
    const featuredSpots = await FeaturedSpot.getActiveFeatured();

    const featuredTailors = [];
    const seenTailors = new Set();

    // Add tailors from featured spots first
    for (const spot of featuredSpots) {
      if (spot.tailor && !seenTailors.has(spot.tailor._id.toString())) {
        seenTailors.add(spot.tailor._id.toString());
        const tailorObj = spot.tailor.toObject();
        tailorObj.isFeatured = true;
        tailorObj.featuredUntil = spot.endDate;
        tailorObj.featuredSource = spot.source;
        featuredTailors.push(tailorObj);
      }

      if (featuredTailors.length >= maxFeatured) break;
    }

    // If we don't have enough featured tailors, fill with top-rated tailors
    if (featuredTailors.length < maxFeatured) {
      const remainingCount = maxFeatured - featuredTailors.length;

      const topTailors = await TailorProfile.find({
        _id: { $nin: Array.from(seenTailors) },
        approvalStatus: 'approved',
        verificationStatus: 'approved'
      })
        .select('-privateContact')
        .sort({ averageRating: -1, reviewCount: -1 })
        .limit(remainingCount)
        .populate('user', 'firstName lastName avatar');

      for (const tailor of topTailors) {
        const tailorObj = tailor.toObject();
        tailorObj.isFeatured = false;
        featuredTailors.push(tailorObj);
      }
    }

    res.status(200).json({
      success: true,
      data: featuredTailors
    });
  } catch (error) {
    next(error);
  }
};
