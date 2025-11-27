import TailorProfile from '../models/TailorProfile.js';
import Work from '../models/Work.js';
import User from '../models/User.js';
import aiService from '../services/aiService.js';
import { paginationResult } from '../utils/helpers.js';

// @desc    AI-powered tailor search
// @route   POST /api/search/ai
// @access  Public
export const aiSearch = async (req, res, next) => {
  try {
    const { query, page = 1, limit = 12 } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Get all approved tailors
    const allTailors = await TailorProfile.find({ approvalStatus: 'approved' })
      .populate('user', 'firstName lastName');

    // Use AI to rank tailors
    const rankedIds = await aiService.findTailors(query, allTailors);

    if (rankedIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: paginationResult(0, page, limit),
        message: 'No tailors found matching your criteria'
      });
    }

    // Get tailors in ranked order
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginatedIds = rankedIds.slice(start, end);

    const tailors = await TailorProfile.find({
      _id: { $in: paginatedIds }
    })
      .select('-privateContact')
      .populate('user', 'firstName lastName avatar');

    // Sort by AI ranking
    const sortedTailors = paginatedIds.map(id =>
      tailors.find(t => t._id.toString() === id)
    ).filter(Boolean);

    res.status(200).json({
      success: true,
      data: sortedTailors,
      pagination: paginationResult(rankedIds.length, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get personalized recommendations
// @route   GET /api/search/recommendations
// @access  Private
export const getRecommendations = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'browsingHistory.tailorId',
        select: 'username specialties location'
      });

    // Get all approved tailors
    const allTailors = await TailorProfile.find({
      approvalStatus: 'approved',
      _id: { $nin: user.browsingHistory.map(h => h.tailorId?._id).filter(Boolean) }
    })
      .select('-privateContact')
      .populate('user', 'firstName lastName avatar');

    if (user.browsingHistory.length < 3) {
      // Not enough history, return top-rated tailors
      const topTailors = allTailors
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 8);

      return res.status(200).json({
        success: true,
        data: topTailors,
        type: 'top_rated'
      });
    }

    // Get AI recommendations
    const browsingHistory = user.browsingHistory
      .filter(h => h.tailorId)
      .map(h => ({
        specialties: h.tailorId.specialties,
        location: h.tailorId.location
      }));

    const recommendedIds = await aiService.getRecommendations(
      user,
      browsingHistory,
      allTailors
    );

    const recommendations = await TailorProfile.find({
      _id: { $in: recommendedIds }
    })
      .select('-privateContact')
      .populate('user', 'firstName lastName avatar');

    // Sort by AI recommendation order
    const sortedRecommendations = recommendedIds.map(id =>
      recommendations.find(t => t._id.toString() === id)
    ).filter(Boolean);

    res.status(200).json({
      success: true,
      data: sortedRecommendations,
      type: 'personalized'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Global search (tailors + works)
// @route   GET /api/search
// @access  Public
export const globalSearch = async (req, res, next) => {
  try {
    const { q, type = 'all', page = 1, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const results = {
      tailors: [],
      works: []
    };

    if (type === 'all' || type === 'tailors') {
      const tailors = await TailorProfile.find({
        approvalStatus: 'approved',
        $or: [
          { username: { $regex: q, $options: 'i' } },
          { businessName: { $regex: q, $options: 'i' } },
          { bio: { $regex: q, $options: 'i' } },
          { specialties: { $regex: q, $options: 'i' } },
          { 'location.city': { $regex: q, $options: 'i' } },
          { 'location.country': { $regex: q, $options: 'i' } }
        ]
      })
        .select('-privateContact')
        .limit(type === 'tailors' ? parseInt(limit) : 6)
        .populate('user', 'firstName lastName avatar');

      results.tailors = tailors;
    }

    if (type === 'all' || type === 'works') {
      const works = await Work.find({
        approvalStatus: 'approved',
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { category: { $regex: q, $options: 'i' } },
          { tags: { $regex: q, $options: 'i' } }
        ]
      })
        .limit(type === 'works' ? parseInt(limit) : 6)
        .populate({
          path: 'tailor',
          select: 'username businessName profilePhoto'
        });

      results.works = works;
    }

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search suggestions (autocomplete)
// @route   GET /api/search/suggestions
// @access  Public
export const getSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const [tailors, categories] = await Promise.all([
      TailorProfile.find({
        approvalStatus: 'approved',
        $or: [
          { username: { $regex: q, $options: 'i' } },
          { businessName: { $regex: q, $options: 'i' } }
        ]
      })
        .select('username businessName')
        .limit(5),

      Work.distinct('category', {
        approvalStatus: 'approved',
        category: { $regex: q, $options: 'i' }
      })
    ]);

    const suggestions = [
      ...tailors.map(t => ({
        type: 'tailor',
        value: t.businessName || t.username,
        username: t.username
      })),
      ...categories.slice(0, 3).map(c => ({
        type: 'category',
        value: c
      }))
    ];

    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    next(error);
  }
};
