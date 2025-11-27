import path from 'path';
import fs from 'fs';

// Use FRONTEND_URL for uploads since nginx proxies /uploads to backend
const BASE_URL = process.env.FRONTEND_URL || process.env.BASE_URL || 'http://localhost:5000';

// @desc    Upload work images
// @route   POST /api/uploads/works
// @access  Private/Tailor
export const uploadWorkImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one image'
      });
    }

    const images = req.files.map((file, index) => ({
      url: `${BASE_URL}/uploads/works/${file.filename}`,
      filename: file.filename,
      isPrimary: index === 0
    }));

    res.status(200).json({
      success: true,
      data: images
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload profile photo
// @route   POST /api/uploads/profile
// @access  Private
export const uploadProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    const imageUrl = `${BASE_URL}/uploads/profiles/${req.file.filename}`;

    res.status(200).json({
      success: true,
      data: {
        url: imageUrl,
        filename: req.file.filename
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload verification documents
// @route   POST /api/uploads/verification
// @access  Private/Tailor
export const uploadVerificationDocs = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one document'
      });
    }

    const documents = req.files.map(file => ({
      url: `${BASE_URL}/uploads/verification/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      type: path.extname(file.originalname).toLowerCase().replace('.', '')
    }));

    res.status(200).json({
      success: true,
      data: documents
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload landing page hero image
// @route   POST /api/uploads/hero
// @access  Private/Admin
export const uploadHeroImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    const imageUrl = `${BASE_URL}/uploads/landing/${req.file.filename}`;

    res.status(200).json({
      success: true,
      data: {
        url: imageUrl,
        filename: req.file.filename
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete uploaded file
// @route   DELETE /api/uploads/:type/:filename
// @access  Private
export const deleteUpload = async (req, res, next) => {
  try {
    const { type, filename } = req.params;
    const validTypes = ['works', 'profiles', 'verification', 'landing', 'misc'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid upload type'
      });
    }

    const filePath = path.join(process.cwd(), 'uploads', type, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
  } catch (error) {
    next(error);
  }
};
