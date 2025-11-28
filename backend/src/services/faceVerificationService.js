/**
 * Face Verification Service
 *
 * This service handles tailor identity verification by comparing
 * selfie photos with ID document photos.
 *
 * Supported providers:
 * - AWS Rekognition (default)
 * - Veriff (full identity verification)
 * - Mock (for development/testing)
 *
 * Environment Variables Required:
 * - FACE_VERIFICATION_PROVIDER: 'aws' | 'veriff' | 'mock'
 * - AWS_REGION (for AWS Rekognition)
 * - AWS_ACCESS_KEY_ID (for AWS Rekognition)
 * - AWS_SECRET_ACCESS_KEY (for AWS Rekognition)
 * - VERIFF_API_KEY (for Veriff)
 * - VERIFF_API_SECRET (for Veriff)
 */

import crypto from 'crypto';

// Face match confidence threshold (0-100)
const MATCH_THRESHOLD = 90;

class FaceVerificationService {
  constructor() {
    this.provider = process.env.FACE_VERIFICATION_PROVIDER || 'mock';
  }

  /**
   * Compare two face images
   * @param {Buffer|string} sourceImage - The ID document image
   * @param {Buffer|string} targetImage - The selfie image
   * @returns {Promise<Object>} - Verification result
   */
  async compareFaces(sourceImage, targetImage) {
    switch (this.provider) {
      case 'aws':
        return this.compareWithAWS(sourceImage, targetImage);
      case 'veriff':
        return this.compareWithVeriff(sourceImage, targetImage);
      case 'mock':
      default:
        return this.mockCompare(sourceImage, targetImage);
    }
  }

  /**
   * AWS Rekognition implementation
   */
  async compareWithAWS(sourceImage, targetImage) {
    try {
      // Lazy load AWS SDK to avoid errors when not configured
      const { RekognitionClient, CompareFacesCommand } = await import('@aws-sdk/client-rekognition');

      const client = new RekognitionClient({
        region: process.env.AWS_REGION || 'us-east-1'
      });

      const sourceBytes = Buffer.isBuffer(sourceImage)
        ? sourceImage
        : Buffer.from(sourceImage, 'base64');
      const targetBytes = Buffer.isBuffer(targetImage)
        ? targetImage
        : Buffer.from(targetImage, 'base64');

      const command = new CompareFacesCommand({
        SourceImage: { Bytes: sourceBytes },
        TargetImage: { Bytes: targetBytes },
        SimilarityThreshold: MATCH_THRESHOLD
      });

      const response = await client.send(command);

      if (response.FaceMatches && response.FaceMatches.length > 0) {
        const match = response.FaceMatches[0];
        return {
          success: true,
          matched: true,
          confidence: match.Similarity,
          details: {
            faceMatchConfidence: match.Similarity,
            sourceFaceConfidence: match.Face?.Confidence,
            provider: 'aws'
          }
        };
      }

      return {
        success: true,
        matched: false,
        confidence: 0,
        reason: 'No matching faces found',
        details: {
          unmatchedFaces: response.UnmatchedFaces?.length || 0,
          provider: 'aws'
        }
      };
    } catch (error) {
      console.error('AWS Rekognition error:', error);
      return {
        success: false,
        error: error.message,
        provider: 'aws'
      };
    }
  }

  /**
   * Veriff implementation (for full identity verification)
   */
  async compareWithVeriff(sourceImage, targetImage) {
    try {
      const axios = (await import('axios')).default;

      const apiKey = process.env.VERIFF_API_KEY;
      const apiSecret = process.env.VERIFF_API_SECRET;

      if (!apiKey || !apiSecret) {
        throw new Error('Veriff API credentials not configured');
      }

      // Create a verification session
      const sessionResponse = await axios.post(
        'https://stationapi.veriff.com/v1/sessions',
        {
          verification: {
            callback: `${process.env.BACKEND_URL}/api/verification/webhook`,
            person: {
              firstName: '',
              lastName: ''
            },
            vendorData: crypto.randomUUID()
          }
        },
        {
          headers: {
            'X-AUTH-CLIENT': apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        sessionId: sessionResponse.data.verification.id,
        sessionUrl: sessionResponse.data.verification.url,
        provider: 'veriff',
        message: 'Redirect user to complete verification'
      };
    } catch (error) {
      console.error('Veriff error:', error);
      return {
        success: false,
        error: error.message,
        provider: 'veriff'
      };
    }
  }

  /**
   * Mock implementation for development/testing
   */
  async mockCompare(sourceImage, targetImage) {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate deterministic result based on image data
    const sourceHash = crypto.createHash('md5')
      .update(sourceImage?.toString() || 'source')
      .digest('hex');
    const targetHash = crypto.createHash('md5')
      .update(targetImage?.toString() || 'target')
      .digest('hex');

    // Calculate a "similarity" based on hash overlap
    let matchCount = 0;
    for (let i = 0; i < Math.min(sourceHash.length, targetHash.length); i++) {
      if (sourceHash[i] === targetHash[i]) matchCount++;
    }
    const similarity = (matchCount / 32) * 100;

    // For testing: return true if both images are provided
    const matched = sourceImage && targetImage ? similarity > 10 : false;

    return {
      success: true,
      matched,
      confidence: matched ? 92.5 : similarity,
      details: {
        provider: 'mock',
        note: 'This is a mock response for development'
      }
    };
  }

  /**
   * Detect if an image contains a face
   */
  async detectFace(image) {
    if (this.provider === 'mock') {
      return {
        success: true,
        faceDetected: true,
        details: { provider: 'mock' }
      };
    }

    if (this.provider === 'aws') {
      try {
        const { RekognitionClient, DetectFacesCommand } = await import('@aws-sdk/client-rekognition');

        const client = new RekognitionClient({
          region: process.env.AWS_REGION || 'us-east-1'
        });

        const imageBytes = Buffer.isBuffer(image)
          ? image
          : Buffer.from(image, 'base64');

        const command = new DetectFacesCommand({
          Image: { Bytes: imageBytes },
          Attributes: ['ALL']
        });

        const response = await client.send(command);

        return {
          success: true,
          faceDetected: response.FaceDetails && response.FaceDetails.length > 0,
          faceCount: response.FaceDetails?.length || 0,
          details: response.FaceDetails?.[0] || null,
          provider: 'aws'
        };
      } catch (error) {
        console.error('Face detection error:', error);
        return {
          success: false,
          error: error.message,
          provider: 'aws'
        };
      }
    }

    return { success: false, error: 'Provider not supported for face detection' };
  }

  /**
   * Perform liveness detection (prevent photo spoofing)
   * This requires video/multiple frames in production
   */
  async checkLiveness(images) {
    if (this.provider === 'mock') {
      return {
        success: true,
        isLive: true,
        confidence: 95.0,
        details: { provider: 'mock' }
      };
    }

    // Real liveness detection requires specialized services
    // AWS has FaceLiveness API, Veriff includes it in their flow
    return {
      success: false,
      error: 'Liveness detection requires specialized service configuration'
    };
  }

  /**
   * Get verification requirements
   */
  getRequirements() {
    return {
      documents: [
        {
          type: 'government_id',
          name: 'Government-issued ID',
          description: 'Passport, National ID, or Driver\'s License',
          required: true
        },
        {
          type: 'selfie',
          name: 'Selfie Photo',
          description: 'Clear photo of your face matching the ID',
          required: true
        },
        {
          type: 'business_license',
          name: 'Business License',
          description: 'Tailoring or fashion business registration (if applicable)',
          required: false
        }
      ],
      guidelines: [
        'Ensure good lighting when taking photos',
        'Remove glasses, hats, or face coverings',
        'Face should be clearly visible and centered',
        'ID documents should be fully visible with no glare',
        'All text on documents should be readable'
      ]
    };
  }
}

export default new FaceVerificationService();
