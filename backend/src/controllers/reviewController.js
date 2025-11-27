import Review from '../models/Review.js';
import TailorProfile from '../models/TailorProfile.js';
import Booking from '../models/Booking.js';
import { paginationResult } from '../utils/helpers.js';

// @desc    Get reviews for a tailor
// @route   GET /api/reviews/tailor/:username
// @access  Public
export const getTailorReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sortBy = 'newest' } = req.query;

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

    const query = {
      tailor: tailor._id,
      approvalStatus: 'approved'
    };

    let sortOption = {};
    switch (sortBy) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'highest':
        sortOption = { rating: -1 };
        break;
      case 'lowest':
        sortOption = { rating: 1 };
        break;
      case 'helpful':
        sortOption = { helpfulCount: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort(sortOption)
      .populate('customer', 'firstName lastName avatar');

    // Get rating distribution
    const ratingDist = await Review.aggregate([
      { $match: { tailor: tailor._id, approvalStatus: 'approved' } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratingDist.forEach(r => {
      ratingDistribution[r._id] = r.count;
    });

    res.status(200).json({
      success: true,
      data: reviews,
      stats: {
        averageRating: tailor.averageRating,
        totalReviews: tailor.reviewCount,
        ratingDistribution
      },
      pagination: paginationResult(total, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
export const createReview = async (req, res, next) => {
  try {
    const { tailorUsername, rating, title, comment, images, bookingId } = req.body;

    const tailor = await TailorProfile.findOne({
      username: tailorUsername,
      approvalStatus: 'approved'
    });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor not found'
      });
    }

    // Check if user already reviewed this tailor
    const existingReview = await Review.findOne({
      tailor: tailor._id,
      customer: req.user._id
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this tailor'
      });
    }

    // Optionally verify booking
    if (bookingId) {
      const booking = await Booking.findOne({
        _id: bookingId,
        customer: req.user._id,
        tailor: tailor._id,
        status: 'completed'
      });

      if (!booking) {
        return res.status(400).json({
          success: false,
          message: 'Invalid booking reference'
        });
      }
    }

    const review = await Review.create({
      tailor: tailor._id,
      customer: req.user._id,
      booking: bookingId,
      rating,
      title,
      comment,
      images,
      approvalStatus: 'pending'
    });

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
export const updateReview = async (req, res, next) => {
  try {
    const { rating, title, comment, images } = req.body;

    const review = await Review.findOne({
      _id: req.params.id,
      customer: req.user._id
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (rating) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (comment) review.comment = comment;
    if (images) review.images = images;

    // Reset to pending for re-approval
    review.approvalStatus = 'pending';

    await review.save();

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findOneAndDelete({
      _id: req.params.id,
      customer: req.user._id
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Respond to review (tailor)
// @route   POST /api/reviews/:id/respond
// @access  Private/Tailor
export const respondToReview = async (req, res, next) => {
  try {
    const { comment } = req.body;

    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    const review = await Review.findOne({
      _id: req.params.id,
      tailor: tailor._id
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.response = {
      comment,
      respondedAt: new Date()
    };

    await review.save();

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark review as helpful
// @route   POST /api/reviews/:id/helpful
// @access  Private
export const markHelpful = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if already voted
    const alreadyVoted = review.helpfulVotes.some(
      vote => vote.user.toString() === req.user._id.toString()
    );

    if (alreadyVoted) {
      // Remove vote
      review.helpfulVotes = review.helpfulVotes.filter(
        vote => vote.user.toString() !== req.user._id.toString()
      );
      review.helpfulCount -= 1;
    } else {
      // Add vote
      review.helpfulVotes.push({ user: req.user._id });
      review.helpfulCount += 1;
    }

    await review.save();

    res.status(200).json({
      success: true,
      data: {
        helpfulCount: review.helpfulCount,
        voted: !alreadyVoted
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my reviews (customer)
// @route   GET /api/reviews/me
// @access  Private
export const getMyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ customer: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'tailor',
        select: 'username businessName profilePhoto'
      });

    res.status(200).json({
      success: true,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};
