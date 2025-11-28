import livenessService, { CHALLENGE_TYPES } from '../services/livenessService.js';
import faceVerificationService from '../services/faceVerificationService.js';
import User from '../models/User.js';
import TailorProfile from '../models/TailorProfile.js';

// @desc    Start liveness verification session
// @route   POST /api/verification/liveness/start
// @access  Private (Tailors only)
export const startLivenessSession = async (req, res) => {
  try {
    const { numChallenges = 3 } = req.body;

    const result = await livenessService.createSession(
      req.user.id,
      Math.min(Math.max(numChallenges, 2), 5) // 2-5 challenges
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Start liveness error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start liveness session'
    });
  }
};

// @desc    Verify a liveness challenge
// @route   POST /api/verification/liveness/verify
// @access  Private
export const verifyLivenessChallenge = async (req, res) => {
  try {
    const { sessionId, challengeIndex, frame } = req.body;

    console.log('Verify challenge request:', { sessionId, challengeIndex, hasFrame: !!frame });

    if (!sessionId || challengeIndex === undefined || !frame) {
      return res.status(400).json({
        success: false,
        message: 'Session ID, challenge index, and frame data are required'
      });
    }

    // Decode base64 frame (handle both with and without data URI prefix)
    const frameData = typeof frame === 'string'
      ? frame.replace(/^data:image\/\w+;base64,/, '')
      : frame;

    const result = await livenessService.verifyChallenge(
      sessionId,
      challengeIndex,
      frameData
    );

    console.log('Verify challenge result:', result);

    // If session complete, update tailor profile
    if (result.sessionComplete && result.passed) {
      await updateVerificationStatus(req.user.id, 'liveness', {
        confidence: result.confidence,
        completedAt: new Date()
      });
    }

    // Wrap result in data property to match mobile app expectations
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Verify liveness error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify challenge',
      error: error.message
    });
  }
};

// @desc    Get liveness session status
// @route   GET /api/verification/liveness/:sessionId
// @access  Private
export const getLivenessSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = livenessService.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or expired'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get session'
    });
  }
};

// @desc    Compare face with ID document
// @route   POST /api/verification/face-match
// @access  Private (Tailors only)
export const compareFaceWithID = async (req, res) => {
  try {
    const { idImage, selfieImage } = req.body;

    if (!idImage || !selfieImage) {
      return res.status(400).json({
        success: false,
        message: 'ID image and selfie image are required'
      });
    }

    // Decode base64 images
    const idData = idImage.replace(/^data:image\/\w+;base64,/, '');
    const selfieData = selfieImage.replace(/^data:image\/\w+;base64,/, '');

    const result = await faceVerificationService.compareFaces(idData, selfieData);

    if (result.success && result.matched) {
      await updateVerificationStatus(req.user.id, 'face_match', {
        confidence: result.confidence,
        completedAt: new Date()
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Face match error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to compare faces'
    });
  }
};

// @desc    Get verification requirements
// @route   GET /api/verification/requirements
// @access  Public
export const getVerificationRequirements = async (req, res) => {
  try {
    const requirements = faceVerificationService.getRequirements();
    const challengeTypes = Object.values(CHALLENGE_TYPES);

    res.json({
      success: true,
      data: {
        ...requirements,
        livenessChallengeLypes: challengeTypes
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get requirements'
    });
  }
};

// @desc    Get current verification status
// @route   GET /api/verification/status
// @access  Private (Tailors only)
export const getVerificationStatus = async (req, res) => {
  try {
    const tailorProfile = await TailorProfile.findOne({ user: req.user.id });

    if (!tailorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    res.json({
      success: true,
      data: {
        verificationStatus: tailorProfile.verificationStatus,
        verificationDetails: tailorProfile.verificationDetails || {},
        isVerified: tailorProfile.verificationStatus === 'verified'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get verification status'
    });
  }
};

// @desc    Submit full verification (documents + liveness)
// @route   POST /api/verification/submit
// @access  Private (Tailors only)
export const submitVerification = async (req, res) => {
  try {
    const { documents } = req.body;
    // documents: [{ type: 'government_id', url: '...' }, { type: 'selfie', url: '...' }, ...]

    const tailorProfile = await TailorProfile.findOne({ user: req.user.id });

    if (!tailorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    tailorProfile.verificationStatus = 'pending';
    tailorProfile.verificationDocuments = documents;
    tailorProfile.verificationSubmittedAt = new Date();
    await tailorProfile.save();

    res.json({
      success: true,
      message: 'Verification submitted for review',
      data: {
        verificationStatus: tailorProfile.verificationStatus
      }
    });
  } catch (error) {
    console.error('Submit verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit verification'
    });
  }
};

// Helper function to update verification status
async function updateVerificationStatus(userId, verificationType, data) {
  try {
    const tailorProfile = await TailorProfile.findOne({ user: userId });
    if (!tailorProfile) return;

    if (!tailorProfile.verificationDetails) {
      tailorProfile.verificationDetails = {};
    }

    tailorProfile.verificationDetails[verificationType] = data;
    await tailorProfile.save();
  } catch (error) {
    console.error('Update verification status error:', error);
  }
}
