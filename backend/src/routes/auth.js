import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  updatePassword,
  updateDetails
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/password', protect, updatePassword);
router.put('/details', protect, updateDetails);

export default router;
