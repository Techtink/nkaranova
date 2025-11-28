import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base upload directory (relative to backend root)
const uploadsBase = path.join(__dirname, '..', '..', 'uploads');

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subDir = 'misc';

    // Organize by type
    if (file.fieldname === 'profilePhoto') {
      subDir = 'profiles';
    } else if (file.fieldname === 'workImages') {
      subDir = 'works';
    } else if (file.fieldname === 'verificationDocs') {
      subDir = 'verification';
    } else if (file.fieldname === 'heroImage') {
      subDir = 'landing';
    }

    const uploadPath = path.join(uploadsBase, subDir);
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
