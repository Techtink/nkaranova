import Work from '../models/Work.js';
import TailorProfile from '../models/TailorProfile.js';
import { paginationResult } from '../utils/helpers.js';

// @desc    Get all approved works (gallery)
// @route   GET /api/works
// @access  Public
export const getWorks = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      tailor,
      featured,
      sortBy = 'newest'
    } = req.query;

    const query = { approvalStatus: 'approved' };

    if (category) {
      query.category = category;
    }

    if (tailor) {
      const tailorProfile = await TailorProfile.findOne({ username: tailor });
      if (tailorProfile) {
        query.tailor = tailorProfile._id;
      }
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    // Sort options
    let sortOption = {};
    switch (sortBy) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'popular':
        sortOption = { viewCount: -1 };
        break;
      case 'likes':
        sortOption = { likeCount: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const total = await Work.countDocuments(query);
    const works = await Work.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort(sortOption)
      .populate({
        path: 'tailor',
        select: 'username businessName profilePhoto averageRating verificationStatus',
        populate: {
          path: 'user',
          select: 'firstName lastName'
        }
      });

    res.status(200).json({
      success: true,
      data: works,
      pagination: paginationResult(total, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single work
// @route   GET /api/works/:id
// @access  Public
export const getWork = async (req, res, next) => {
  try {
    const work = await Work.findOne({
      _id: req.params.id,
      approvalStatus: 'approved'
    }).populate({
      path: 'tailor',
      select: 'username businessName profilePhoto averageRating verificationStatus location',
      populate: {
        path: 'user',
        select: 'firstName lastName'
      }
    });

    if (!work) {
      return res.status(404).json({
        success: false,
        message: 'Work not found'
      });
    }

    // Increment view count
    work.viewCount += 1;
    await work.save();

    res.status(200).json({
      success: true,
      data: work
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my works (tailor)
// @route   GET /api/works/me
// @access  Private/Tailor
export const getMyWorks = async (req, res, next) => {
  try {
    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    const { page = 1, limit = 20, status } = req.query;

    const query = { tailor: tailor._id };
    if (status) {
      query.approvalStatus = status;
    }

    const total = await Work.countDocuments(query);
    const works = await Work.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: works,
      pagination: paginationResult(total, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create work
// @route   POST /api/works
// @access  Private/Tailor
export const createWork = async (req, res, next) => {
  try {
    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    const {
      title,
      description,
      images,
      category,
      fabricTypes,
      tags,
      price,
      completionTime
    } = req.body;

    const work = await Work.create({
      tailor: tailor._id,
      title,
      description,
      images,
      category,
      fabricTypes,
      tags,
      price,
      completionTime,
      approvalStatus: 'pending'
    });

    res.status(201).json({
      success: true,
      data: work
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update work
// @route   PUT /api/works/:id
// @access  Private/Tailor
export const updateWork = async (req, res, next) => {
  try {
    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    let work = await Work.findOne({
      _id: req.params.id,
      tailor: tailor._id
    });

    if (!work) {
      return res.status(404).json({
        success: false,
        message: 'Work not found'
      });
    }

    const {
      title,
      description,
      images,
      category,
      fabricTypes,
      tags,
      price,
      completionTime
    } = req.body;

    if (title) work.title = title;
    if (description !== undefined) work.description = description;
    if (images) work.images = images;
    if (category) work.category = category;
    if (fabricTypes) work.fabricTypes = fabricTypes;
    if (tags) work.tags = tags;
    if (price) work.price = price;
    if (completionTime) work.completionTime = completionTime;

    // If significant changes, set back to pending
    if (images || title || description) {
      work.approvalStatus = 'pending';
    }

    await work.save();

    res.status(200).json({
      success: true,
      data: work
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete work
// @route   DELETE /api/works/:id
// @access  Private/Tailor
export const deleteWork = async (req, res, next) => {
  try {
    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    const work = await Work.findOneAndDelete({
      _id: req.params.id,
      tailor: tailor._id
    });

    if (!work) {
      return res.status(404).json({
        success: false,
        message: 'Work not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Work deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured works
// @route   GET /api/works/featured
// @access  Public
export const getFeaturedWorks = async (req, res, next) => {
  try {
    const works = await Work.find({
      approvalStatus: 'approved',
      isFeatured: true
    })
      .sort({ featuredAt: -1 })
      .limit(12)
      .populate({
        path: 'tailor',
        select: 'username businessName profilePhoto verificationStatus'
      });

    res.status(200).json({
      success: true,
      data: works
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get work categories
// @route   GET /api/works/categories
// @access  Public
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Work.aggregate([
      { $match: { approvalStatus: 'approved' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: categories.map(c => ({ name: c._id, count: c.count }))
    });
  } catch (error) {
    next(error);
  }
};
