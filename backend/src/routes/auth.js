import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  updatePassword,
  updateDetails
} from '../controllers/authController.js';
import {
  setup2FA,
  verify2FA,
  disable2FA,
  validate2FA,
  get2FAStatus,
  regenerateBackupCodes
} from '../controllers/twoFactorController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/password', protect, updatePassword);
router.put('/details', protect, updateDetails);

// 2FA routes
router.post('/2fa/setup', protect, setup2FA);
router.post('/2fa/verify', protect, verify2FA);
router.post('/2fa/disable', protect, disable2FA);
router.post('/2fa/validate', validate2FA);
router.get('/2fa/status', protect, get2FAStatus);
router.post('/2fa/backup-codes', protect, regenerateBackupCodes);

export default router;
