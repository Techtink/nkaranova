import express from 'express';
import {
  // System points
  getSystemMeasurementPoints,
  initializeMeasurementPoints,
  // Tailor config
  getMyMeasurementConfig,
  updateRequiredSystemPoints,
  addCustomMeasurementPoint,
  updateCustomMeasurementPoint,
  deleteCustomMeasurementPoint,
  updateMeasurementSettings,
  getTailorMeasurementRequirements,
  // Customer measurements
  getMyMeasurementProfiles,
  getMeasurementProfile,
  createMeasurementProfile,
  updateMeasurementProfile,
  updateMeasurements,
  deleteMeasurementProfile,
  getProfileCompleteness,
  setDefaultProfile
} from '../controllers/measurementController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================
// Get system measurement points
router.get('/points', getSystemMeasurementPoints);

// Get tailor's measurement requirements (for customers to see)
router.get('/tailor/:tailorId/requirements', getTailorMeasurementRequirements);

// ==================== ADMIN ROUTES ====================
// Initialize default measurement points
router.post('/points/initialize', protect, authorize('admin'), initializeMeasurementPoints);

// ==================== TAILOR ROUTES ====================
// Get tailor's measurement config
router.get('/tailor/config', protect, authorize('tailor'), getMyMeasurementConfig);

// Update required system points
router.put('/tailor/config/system-points', protect, authorize('tailor'), updateRequiredSystemPoints);

// Custom measurement points
router.post('/tailor/config/custom-point', protect, authorize('tailor'), addCustomMeasurementPoint);
router.put('/tailor/config/custom-point/:pointKey', protect, authorize('tailor'), updateCustomMeasurementPoint);
router.delete('/tailor/config/custom-point/:pointKey', protect, authorize('tailor'), deleteCustomMeasurementPoint);

// Update measurement settings
router.put('/tailor/config/settings', protect, authorize('tailor'), updateMeasurementSettings);

// ==================== CUSTOMER ROUTES ====================
// Get all measurement profiles
router.get('/profiles', protect, getMyMeasurementProfiles);

// Create new measurement profile
router.post('/profiles', protect, createMeasurementProfile);

// Get specific profile
router.get('/profiles/:profileId', protect, getMeasurementProfile);

// Update profile info
router.put('/profiles/:profileId', protect, updateMeasurementProfile);

// Update measurements in profile
router.put('/profiles/:profileId/measurements', protect, updateMeasurements);

// Delete profile
router.delete('/profiles/:profileId', protect, deleteMeasurementProfile);

// Get profile completeness for a tailor
router.get('/profiles/:profileId/completeness/:tailorId', protect, getProfileCompleteness);

// Set as default profile
router.post('/profiles/:profileId/set-default', protect, setDefaultProfile);

export default router;
