import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AdminMember from '../models/AdminMember.js';

// Protect routes - verify JWT
export const protect = async (req, res, next) => {
  let token;

  // Check for token in cookies or Authorization header
  if (req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Optional auth - doesn't fail if no token, but attaches user if present
export const optionalAuth = async (req, res, next) => {
  let token;

  if (req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Token invalid, but we continue without user
    }
  }

  next();
};

// Check if admin has specific permission(s)
export const requirePermission = (...permissions) => {
  return async (req, res, next) => {
    try {
      // User must be authenticated and admin
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin access required.'
        });
      }

      // Get admin member with their role
      const adminMember = await AdminMember.findOne({
        user: req.user._id,
        isActive: true
      }).populate('role');

      if (!adminMember) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Not a registered admin team member.'
        });
      }

      // Attach admin member info to request
      req.adminMember = adminMember;

      // Check if user has required permission(s)
      const hasPermission = permissions.every(
        permission => adminMember.role?.permissions?.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.'
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
