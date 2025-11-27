import jwt from 'jsonwebtoken';

// Generate JWT token
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Send token response with cookie
export const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  const userData = {
    _id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    avatar: user.avatar
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: userData
    });
};

// Pagination helper
export const paginate = (query, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
};

// Build pagination response
export const paginationResult = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};

// Generate username from name
export const generateUsername = (firstName, lastName) => {
  const base = `${firstName}${lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '');
  const random = Math.floor(Math.random() * 9999);
  return `${base}${random}`;
};

// Sanitize user object for public display
export const sanitizeUser = (user) => {
  const { password, ...sanitized } = user.toObject ? user.toObject() : user;
  return sanitized;
};
