import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { verificationAPI } from '../../../../shared/services/api';
import { colors, spacing, fontSize, borderRadius } from '../../../../shared/constants/theme';

// Try to import FaceDetector, but handle if not available (Expo Go)
let FaceDetector = null;
let faceDetectionAvailable = false;
try {
  FaceDetector = require('expo-face-detector');
  faceDetectionAvailable = true;
} catch (e) {
  console.log('Face detector not available - using fallback UI');
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Face guide dimensions
const FACE_GUIDE_WIDTH = SCREEN_WIDTH * 0.7;
const FACE_GUIDE_HEIGHT = SCREEN_WIDTH * 0.9;

// Number of spikes around the oval
const NUM_SPIKES = 24;

const CHALLENGE_INSTRUCTIONS = {
  turn_left: { text: 'Turn your head LEFT', icon: 'arrow-back' },
  turn_right: { text: 'Turn your head RIGHT', icon: 'arrow-forward' },
  look_up: { text: 'Look UP', icon: 'arrow-up' },
  look_down: { text: 'Look DOWN', icon: 'arrow-down' },
  blink: { text: 'BLINK your eyes', icon: 'eye-outline' },
  smile: { text: 'SMILE', icon: 'happy-outline' },
  nod: { text: 'NOD your head', icon: 'swap-vertical' },
  open_mouth: { text: 'OPEN your mouth', icon: 'ellipse-outline' }
};

// Individual animated spike component
function AnimatedSpike({ index, totalSpikes, faceData, isActive }) {
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isActive) {
      // Pulse animation when active
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.3,
            duration: 500,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [isActive]);

  // Calculate position on the oval
  const angle = (index / totalSpikes) * 2 * Math.PI - Math.PI / 2;
  const radiusX = FACE_GUIDE_WIDTH / 2;
  const radiusY = FACE_GUIDE_HEIGHT / 2;

  // Base position on the oval
  let x = Math.cos(angle) * radiusX;
  let y = Math.sin(angle) * radiusY;

  // Apply face tracking offset if face is detected
  if (faceData) {
    const faceYawAngle = faceData.yawAngle || 0;
    const faceRollAngle = faceData.rollAngle || 0;

    // Subtle movement based on face rotation
    const yawOffset = (faceYawAngle / 45) * 15;
    const rollOffset = (faceRollAngle / 30) * 10;

    x += yawOffset * Math.cos(angle);
    y += rollOffset * Math.sin(angle);
  }

  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT * 0.35;

  return (
    <Animated.View
      style={[
        styles.spike,
        {
          left: centerX + x - 3,
          top: centerY + y - 3,
          backgroundColor: faceData ? colors.success : 'rgba(255, 255, 255, 0.7)',
          transform: [
            { rotate: `${angle}rad` },
            { scale: pulseAnimation }
          ]
        }
      ]}
    />
  );
}

// Face tracking overlay with animated spikes
function FaceTrackingOverlay({ faceData, isActive }) {
  const opacityAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (faceData) {
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      }).start();
    } else {
      Animated.timing(opacityAnim, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true
      }).start();
    }
  }, [faceData]);

  return (
    <View style={styles.faceOverlayContainer}>
      {/* Animated spikes */}
      {Array.from({ length: NUM_SPIKES }).map((_, index) => (
        <AnimatedSpike
          key={index}
          index={index}
          totalSpikes={NUM_SPIKES}
          faceData={faceData}
          isActive={isActive}
        />
      ))}

      {/* Center oval guide */}
      <Animated.View
        style={[
          styles.faceGuide,
          {
            opacity: opacityAnim,
            borderColor: faceData ? colors.success : 'rgba(255, 255, 255, 0.5)'
          }
        ]}
      />

      {/* Face detection indicator */}
      {faceData && (
        <View style={styles.faceDetectedBadge}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.faceDetectedText}>Face detected</Text>
        </View>
      )}
    </View>
  );
}

// Simple overlay without face detection (for Expo Go)
function SimpleFaceOverlay({ isActive }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true
          })
        ])
      ).start();
    }
  }, [isActive]);

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.faceGuideSimple,
          { transform: [{ scale: pulseAnim }] }
        ]}
      />
    </View>
  );
}

export default function LivenessCheckScreen({ navigation, route }) {
  const { onComplete } = route.params || {};
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [status, setStatus] = useState('idle'); // idle, starting, active, verifying, complete, failed
  const [session, setSession] = useState(null);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [selfieFrame, setSelfieFrame] = useState(null);
  const [faceData, setFaceData] = useState(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && status === 'active') {
      captureAndVerify();
    }
  }, [countdown, status]);

  const handleFacesDetected = ({ faces }) => {
    if (faces && faces.length > 0) {
      const face = faces[0];
      setFaceData({
        bounds: face.bounds,
        yawAngle: face.yawAngle,
        rollAngle: face.rollAngle,
        smilingProbability: face.smilingProbability,
        leftEyeOpenProbability: face.leftEyeOpenProbability,
        rightEyeOpenProbability: face.rightEyeOpenProbability
      });
    } else {
      setFaceData(null);
    }
  };

  const startSession = async () => {
    setStatus('starting');
    setFeedback('');

    try {
      const response = await verificationAPI.startLivenessSession(3);

      if (response.data.success) {
        setSession(response.data.data);
        setCurrentChallengeIndex(0);
        setCompletedChallenges([]);
        setStatus('active');
        setCountdown(3);
        setFeedback('Get ready...');
      } else {
        throw new Error(response.data.message || 'Failed to start session');
      }
    } catch (error) {
      console.error('Start session error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to start liveness check');
      setStatus('idle');
    }
  };

  const captureAndVerify = async () => {
    if (!cameraRef.current || !session) return;

    setStatus('verifying');
    setFeedback('Verifying...');

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
        skipProcessing: true
      });

      const response = await verificationAPI.verifyLivenessChallenge(
        session.sessionId,
        currentChallengeIndex,
        photo.base64
      );

      if (response.data.success && response.data.data.passed) {
        setCompletedChallenges(prev => [...prev, currentChallengeIndex]);
        setFeedback('Passed!');

        // Save selfie frame from first challenge
        if (currentChallengeIndex === 0) {
          setSelfieFrame(photo.base64);
        }

        // Check if all challenges complete
        if (currentChallengeIndex + 1 >= session.challenges.length) {
          setStatus('complete');
          setFeedback('All challenges passed!');

          // Call onComplete callback with results
          setTimeout(() => {
            if (onComplete) {
              onComplete({
                success: true,
                sessionId: session.sessionId,
                selfieFrame: selfieFrame || photo.base64
              });
            }
            navigation.goBack();
          }, 1500);
        } else {
          // Move to next challenge
          setCurrentChallengeIndex(prev => prev + 1);
          setStatus('active');
          setCountdown(3);
          setFeedback('Next challenge...');
        }
      } else {
        setFeedback(response.data.data?.feedback || 'Try again');
        setStatus('active');
        setCountdown(3);
      }
    } catch (error) {
      console.error('Verify error:', error);
      setFeedback('Verification failed, retrying...');
      setStatus('active');
      setCountdown(3);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Verification',
      'Are you sure you want to cancel? Your progress will be lost.',
      [
        { text: 'Continue', style: 'cancel' },
        { text: 'Cancel', style: 'destructive', onPress: () => navigation.goBack() }
      ]
    );
  };

  // Permission not granted
  if (!permission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color={colors.textMuted} />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          We need camera access to verify your identity through liveness detection.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentChallenge = session?.challenges?.[currentChallengeIndex];
  const challengeInfo = currentChallenge ? CHALLENGE_INSTRUCTIONS[currentChallenge.type] : null;

  // Camera props - add face detection if available
  const cameraProps = {
    ref: cameraRef,
    style: styles.camera,
    facing: "front"
  };

  if (faceDetectionAvailable && FaceDetector) {
    cameraProps.onFacesDetected = handleFacesDetected;
    cameraProps.faceDetectorSettings = {
      mode: FaceDetector.FaceDetectorMode.fast,
      detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
      runClassifications: FaceDetector.FaceDetectorClassifications.all,
      minDetectionInterval: 100,
      tracking: true
    };
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView {...cameraProps}>
          {/* Face Tracking Overlay - use advanced or simple based on availability */}
          {faceDetectionAvailable ? (
            <FaceTrackingOverlay
              faceData={faceData}
              isActive={status === 'active'}
            />
          ) : (
            <SimpleFaceOverlay isActive={status === 'active'} />
          )}

          {/* Challenge Display */}
          {status === 'active' && challengeInfo && (
            <View style={styles.challengeContainer}>
              <View style={styles.challengeBadge}>
                <Ionicons name={challengeInfo.icon} size={32} color={colors.white} />
              </View>
              <Text style={styles.challengeText}>{challengeInfo.text}</Text>
              {countdown !== null && countdown > 0 && (
                <Text style={styles.countdown}>{countdown}</Text>
              )}
            </View>
          )}

          {/* Status Display */}
          {(status === 'verifying' || status === 'starting') && (
            <View style={styles.statusOverlay}>
              <ActivityIndicator size="large" color={colors.white} />
              <Text style={styles.statusText}>
                {status === 'starting' ? 'Starting...' : 'Verifying...'}
              </Text>
            </View>
          )}

          {/* Success Display */}
          {status === 'complete' && (
            <View style={styles.statusOverlay}>
              <Ionicons name="checkmark-circle" size={80} color={colors.success} />
              <Text style={styles.successText}>Verification Complete!</Text>
            </View>
          )}
        </CameraView>
      </View>

      {/* Progress Indicators */}
      {session && status !== 'idle' && status !== 'complete' && (
        <View style={styles.progressContainer}>
          {session.challenges.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                completedChallenges.includes(index) && styles.progressDotComplete,
                index === currentChallengeIndex && styles.progressDotActive
              ]}
            />
          ))}
        </View>
      )}

      {/* Feedback */}
      {feedback && (
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackText}>{feedback}</Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {status === 'idle' && (
          <>
            <View style={styles.instructionsBox}>
              <Text style={styles.instructionsTitle}>Liveness Verification</Text>
              <Text style={styles.instructionsText}>
                Position your face within the oval guide.
                {faceDetectionAvailable ? ' The markers will turn green when your face is detected.' : ''}
                {'\n'}You'll be asked to perform simple actions like turning your head.
              </Text>
            </View>
            <TouchableOpacity style={styles.startButton} onPress={startSession}>
              <Text style={styles.startButtonText}>Start Verification</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.bgPrimary
  },
  permissionTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.lg
  },
  permissionText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md
  },
  permissionButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: '600'
  },
  cameraContainer: {
    flex: 1,
    overflow: 'hidden'
  },
  camera: {
    flex: 1
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center'
  },
  faceOverlayContainer: {
    ...StyleSheet.absoluteFillObject
  },
  faceGuide: {
    position: 'absolute',
    left: (SCREEN_WIDTH - FACE_GUIDE_WIDTH) / 2,
    top: SCREEN_HEIGHT * 0.35 - FACE_GUIDE_HEIGHT / 2,
    width: FACE_GUIDE_WIDTH,
    height: FACE_GUIDE_HEIGHT,
    borderWidth: 3,
    borderRadius: FACE_GUIDE_WIDTH / 2,
    backgroundColor: 'transparent'
  },
  faceGuideSimple: {
    width: FACE_GUIDE_WIDTH,
    height: FACE_GUIDE_HEIGHT,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: FACE_GUIDE_WIDTH / 2,
    backgroundColor: 'transparent'
  },
  spike: {
    position: 'absolute',
    width: 6,
    height: 20,
    borderRadius: 3
  },
  faceDetectedBadge: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full
  },
  faceDetectedText: {
    color: colors.success,
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginLeft: spacing.xs
  },
  challengeContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center'
  },
  challengeBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  challengeText: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3
  },
  countdown: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.white,
    marginTop: spacing.md,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3
  },
  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  statusText: {
    fontSize: fontSize.lg,
    color: colors.white,
    marginTop: spacing.md
  },
  successText: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.success,
    marginTop: spacing.md
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.black
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)'
  },
  progressDotActive: {
    backgroundColor: colors.primary,
    transform: [{ scale: 1.2 }]
  },
  progressDotComplete: {
    backgroundColor: colors.success
  },
  feedbackContainer: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.black
  },
  feedbackText: {
    fontSize: fontSize.base,
    color: colors.white,
    textAlign: 'center'
  },
  controls: {
    padding: spacing.md,
    backgroundColor: colors.black
  },
  instructionsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md
  },
  instructionsTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.white,
    marginBottom: spacing.sm
  },
  instructionsText: {
    fontSize: fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20
  },
  startButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  startButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: '600'
  },
  cancelButton: {
    padding: spacing.sm,
    alignItems: 'center'
  },
  cancelButtonText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: fontSize.base
  }
});
