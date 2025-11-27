import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';

    // Organize by type
    if (file.fieldname === 'profilePhoto') {
      uploadPath += 'profiles/';
    } else if (file.fieldname === 'workImages') {
      uploadPath += 'works/';
    } else if (file.fieldname === 'verificationDocs') {
      uploadPath += 'verification/';
    } else if (file.fieldname === 'heroImage') {
      uploadPath += 'landing/';
    } else {
      uploadPath += 'misc/';
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedDocTypes = /jpeg|jpg|png|gif|webp|pdf/;

  const extname = allowedDocTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf';

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only images and PDFs are allowed'), false);
  }
};

// Upload configurations
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Specific upload handlers
export const uploadProfilePhoto = upload.single('profilePhoto');
export const uploadWorkImages = upload.array('workImages', 10);
export const uploadVerificationDocs = upload.array('verificationDocs', 5);
export const uploadHeroImage = upload.single('heroImage');
