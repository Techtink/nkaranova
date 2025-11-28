/**
 * Liveness Detection Service
 *
 * Implements active liveness checks where users perform actions
 * (turn head, blink, smile) to prove they're a real person.
 *
 * Supported providers:
 * - AWS Rekognition Face Liveness (recommended)
 * - FaceTec (premium, highest security)
 * - Mock (for development)
 *
 * Environment Variables:
 * - LIVENESS_PROVIDER: 'aws' | 'facetec' | 'mock'
 * - AWS credentials for AWS provider
 * - FACETEC_DEVICE_KEY for FaceTec
 */

import crypto from 'crypto';

// Challenge types for active liveness
export const CHALLENGE_TYPES = {
  TURN_LEFT: 'turn_left',
  TURN_RIGHT: 'turn_right',
  LOOK_UP: 'look_up',
  LOOK_DOWN: 'look_down',
  BLINK: 'blink',
  SMILE: 'smile',
  NOD: 'nod',
  OPEN_MOUTH: 'open_mouth'
};

// Thresholds for pose detection
const POSE_THRESHOLDS = {
  YAW_LEFT: -25,      // degrees
  YAW_RIGHT: 25,
  PITCH_UP: -20,
  PITCH_DOWN: 20,
  BLINK_THRESHOLD: 0.3,
  SMILE_THRESHOLD: 0.7
};

class LivenessService {
  constructor() {
    this.provider = process.env.LIVENESS_PROVIDER || 'mock';
    this.sessions = new Map(); // In production, use Redis
  }

  /**
   * Create a new liveness session with random challenges
   */
  async createSession(userId, numChallenges = 3) {
    const sessionId = crypto.randomUUID();
    const challenges = this.generateChallenges(numChallenges);

    const session = {
      sessionId,
      userId,
      challenges,
      currentChallengeIndex: 0,
      completedChallenges: [],
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      attempts: 0,
      maxAttempts: 3
    };

    this.sessions.set(sessionId, session);

    return {
      success: true,
      sessionId,
      challenges: challenges.map((c, i) => ({
        index: i,
        type: c.type,
        instruction: c.instruction
      })),
      expiresAt: session.expiresAt
    };
  }

  /**
   * Generate random challenges for liveness check
   */
  generateChallenges(count) {
    const availableChallenges = [
      {
        type: CHALLENGE_TYPES.TURN_LEFT,
        instruction: 'Slowly turn your head to the LEFT',
        icon: 'arrow-left'
      },
      {
        type: CHALLENGE_TYPES.TURN_RIGHT,
        instruction: 'Slowly turn your head to the RIGHT',
        icon: 'arrow-right'
      },
      {
        type: CHALLENGE_TYPES.LOOK_UP,
        instruction: 'Look UP towards the ceiling',
        icon: 'arrow-up'
      },
      {
        type: CHALLENGE_TYPES.LOOK_DOWN,
        instruction: 'Look DOWN towards the floor',
        icon: 'arrow-down'
      },
      {
        type: CHALLENGE_TYPES.BLINK,
        instruction: 'Blink your eyes twice',
        icon: 'eye'
      },
      {
        type: CHALLENGE_TYPES.SMILE,
        instruction: 'Give us a big SMILE',
        icon: 'smile'
      }
    ];

    // Shuffle and pick random challenges
    const shuffled = [...availableChallenges].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  /**
   * Verify a challenge with the captured frame
   */
  async verifyChallenge(sessionId, challengeIndex, frameData) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return { success: false, error: 'Session not found or expired' };
    }

    if (new Date() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return { success: false, error: 'Session expired' };
    }

    if (challengeIndex !== session.currentChallengeIndex) {
      return { success: false, error: 'Invalid challenge index' };
    }

    session.attempts++;
    if (session.attempts > session.maxAttempts * session.challenges.length) {
      session.status = 'failed';
      return { success: false, error: 'Maximum attempts exceeded' };
    }

    const challenge = session.challenges[challengeIndex];
    let result;

    switch (this.provider) {
      case 'aws':
        result = await this.verifyWithAWS(challenge, frameData);
        break;
      case 'facetec':
        result = await this.verifyWithFaceTec(session, challenge, frameData);
        break;
      case 'mock':
      default:
        result = await this.mockVerify(challenge, frameData);
    }

    if (result.passed) {
      session.completedChallenges.push({
        type: challenge.type,
        completedAt: new Date(),
        confidence: result.confidence
      });
      session.currentChallengeIndex++;

      // Check if all challenges completed
      if (session.currentChallengeIndex >= session.challenges.length) {
        session.status = 'completed';
        return {
          success: true,
          passed: true,
          sessionComplete: true,
          message: 'Liveness verification successful!',
          confidence: this.calculateOverallConfidence(session)
        };
      }

      return {
        success: true,
        passed: true,
        sessionComplete: false,
        nextChallenge: {
          index: session.currentChallengeIndex,
          type: session.challenges[session.currentChallengeIndex].type,
          instruction: session.challenges[session.currentChallengeIndex].instruction
        }
      };
    }

    return {
      success: true,
      passed: false,
      message: result.message || 'Challenge not completed. Please try again.',
      hint: result.hint
    };
  }

  /**
   * AWS Rekognition Face Liveness implementation
   */
  async verifyWithAWS(challenge, frameData) {
    try {
      const { RekognitionClient, DetectFacesCommand } = await import('@aws-sdk/client-rekognition');

      const client = new RekognitionClient({
        region: process.env.AWS_REGION || 'us-east-1'
      });

      const imageBytes = Buffer.isBuffer(frameData)
        ? frameData
        : Buffer.from(frameData, 'base64');

      const command = new DetectFacesCommand({
        Image: { Bytes: imageBytes },
        Attributes: ['ALL']
      });

      const response = await client.send(command);

      if (!response.FaceDetails || response.FaceDetails.length === 0) {
        return { passed: false, message: 'No face detected', hint: 'Make sure your face is visible' };
      }

      const face = response.FaceDetails[0];
      const pose = face.Pose;
      const emotions = face.Emotions || [];
      const eyesOpen = face.EyesOpen;

      // Verify based on challenge type
      switch (challenge.type) {
        case CHALLENGE_TYPES.TURN_LEFT:
          if (pose.Yaw < POSE_THRESHOLDS.YAW_LEFT) {
            return { passed: true, confidence: 95 };
          }
          return { passed: false, hint: 'Turn your head more to the left' };

        case CHALLENGE_TYPES.TURN_RIGHT:
          if (pose.Yaw > POSE_THRESHOLDS.YAW_RIGHT) {
            return { passed: true, confidence: 95 };
          }
          return { passed: false, hint: 'Turn your head more to the right' };

        case CHALLENGE_TYPES.LOOK_UP:
          if (pose.Pitch < POSE_THRESHOLDS.PITCH_UP) {
            return { passed: true, confidence: 95 };
          }
          return { passed: false, hint: 'Tilt your head up more' };

        case CHALLENGE_TYPES.LOOK_DOWN:
          if (pose.Pitch > POSE_THRESHOLDS.PITCH_DOWN) {
            return { passed: true, confidence: 95 };
          }
          return { passed: false, hint: 'Tilt your head down more' };

        case CHALLENGE_TYPES.BLINK:
          // Need to detect closed eyes - AWS returns EyesOpen confidence
          if (eyesOpen && eyesOpen.Confidence < 50) {
            return { passed: true, confidence: 90 };
          }
          return { passed: false, hint: 'Please blink your eyes' };

        case CHALLENGE_TYPES.SMILE:
          const happyEmotion = emotions.find(e => e.Type === 'HAPPY');
          if (happyEmotion && happyEmotion.Confidence > 70) {
            return { passed: true, confidence: happyEmotion.Confidence };
          }
          return { passed: false, hint: 'Give us a bigger smile!' };

        default:
          return { passed: false, message: 'Unknown challenge type' };
      }
    } catch (error) {
      console.error('AWS liveness error:', error);
      return { passed: false, message: 'Verification error', error: error.message };
    }
  }

  /**
   * FaceTec implementation (premium liveness)
   */
  async verifyWithFaceTec(session, challenge, frameData) {
    // FaceTec requires their SDK on the client side
    // This is a placeholder for server-side verification
    return {
      passed: false,
      message: 'FaceTec requires client SDK integration'
    };
  }

  /**
   * Mock verification for development
   */
  async mockVerify(challenge, frameData) {
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 500));

    // For development, pass 80% of the time if frame data is provided
    const shouldPass = frameData && Math.random() > 0.2;

    if (shouldPass) {
      return {
        passed: true,
        confidence: 85 + Math.random() * 15
      };
    }

    const hints = {
      [CHALLENGE_TYPES.TURN_LEFT]: 'Turn your head more to the left',
      [CHALLENGE_TYPES.TURN_RIGHT]: 'Turn your head more to the right',
      [CHALLENGE_TYPES.LOOK_UP]: 'Look up more',
      [CHALLENGE_TYPES.LOOK_DOWN]: 'Look down more',
      [CHALLENGE_TYPES.BLINK]: 'Please blink your eyes',
      [CHALLENGE_TYPES.SMILE]: 'Give us a bigger smile!'
    };

    return {
      passed: false,
      hint: hints[challenge.type] || 'Please try again'
    };
  }

  /**
   * Calculate overall confidence from completed challenges
   */
  calculateOverallConfidence(session) {
    if (session.completedChallenges.length === 0) return 0;

    const sum = session.completedChallenges.reduce((acc, c) => acc + (c.confidence || 0), 0);
    return Math.round(sum / session.completedChallenges.length);
  }

  /**
   * Get session status
   */
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return {
      sessionId: session.sessionId,
      status: session.status,
      currentChallengeIndex: session.currentChallengeIndex,
      totalChallenges: session.challenges.length,
      completedChallenges: session.completedChallenges.length,
      expiresAt: session.expiresAt
    };
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions() {
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
      }
    }
  }

  /**
   * Get AWS Face Liveness session (uses AWS's built-in liveness flow)
   */
  async createAWSLivenessSession(userId) {
    if (this.provider !== 'aws') {
      return { success: false, error: 'AWS provider not configured' };
    }

    try {
      const { RekognitionClient, CreateFaceLivenessSessionCommand } = await import('@aws-sdk/client-rekognition');

      const client = new RekognitionClient({
        region: process.env.AWS_REGION || 'us-east-1'
      });

      const command = new CreateFaceLivenessSessionCommand({
        Settings: {
          OutputConfig: {
            S3Bucket: process.env.AWS_LIVENESS_BUCKET
          }
        }
      });

      const response = await client.send(command);

      return {
        success: true,
        sessionId: response.SessionId,
        // Client uses this with AWS Amplify FaceLivenessDetector component
        message: 'Use AWS Amplify FaceLivenessDetector with this session ID'
      };
    } catch (error) {
      console.error('AWS liveness session error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get AWS liveness session results
   */
  async getAWSLivenessResults(sessionId) {
    try {
      const { RekognitionClient, GetFaceLivenessSessionResultsCommand } = await import('@aws-sdk/client-rekognition');

      const client = new RekognitionClient({
        region: process.env.AWS_REGION || 'us-east-1'
      });

      const command = new GetFaceLivenessSessionResultsCommand({
        SessionId: sessionId
      });

      const response = await client.send(command);

      return {
        success: true,
        status: response.Status,
        confidence: response.Confidence,
        referenceImage: response.ReferenceImage,
        isLive: response.Confidence >= 90
      };
    } catch (error) {
      console.error('AWS liveness results error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton
export default new LivenessService();
