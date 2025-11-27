import express from 'express';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  addToHistory
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Protected routes
router.use(protect);

router.post('/history/:tailorId', addToHistory);

// Admin routes
router.get('/', authorize('admin'), getUsers);
router.get('/:id', authorize('admin'), getUser);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

export default router;
