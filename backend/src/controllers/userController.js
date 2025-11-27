import User from '../models/User.js';
import TailorProfile from '../models/TailorProfile.js';

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;

    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let tailorProfile = null;
    if (user.role === 'tailor') {
      tailorProfile = await TailorProfile.findOne({ user: user._id });
    }

    res.status(200).json({
      success: true,
      data: { user, tailorProfile }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user (admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res, next) => {
  try {
    const { firstName, lastName, role, isActive } = req.body;

    const updateFields = {};
    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (role) updateFields.role = role;
    if (isActive !== undefined) updateFields.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deleting admin users
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }

    // If tailor, delete profile too
    if (user.role === 'tailor') {
      await TailorProfile.findOneAndDelete({ user: user._id });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add to browsing history
// @route   POST /api/users/history/:tailorId
// @access  Private
export const addToHistory = async (req, res, next) => {
  try {
    const { tailorId } = req.params;

    // Check if tailor exists
    const tailor = await TailorProfile.findById(tailorId);
    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor not found'
      });
    }

    // Add to history (remove if exists, then add to front)
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { browsingHistory: { tailorId } }
    });

    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        browsingHistory: {
          $each: [{ tailorId, viewedAt: new Date() }],
          $position: 0,
          $slice: 50 // Keep last 50 entries
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'History updated'
    });
  } catch (error) {
    next(error);
  }
};
