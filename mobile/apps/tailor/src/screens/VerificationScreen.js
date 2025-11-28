import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { verificationAPI, uploadFile } from '../../../../shared/services/api';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../../../shared/constants/theme';

const STEPS = {
  LIVENESS: 'liveness',
  DOCUMENTS: 'documents',
  REVIEW: 'review'
};

export default function VerificationScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [currentStep, setCurrentStep] = useState(STEPS.LIVENESS);

  // Liveness state
  const [livenessComplete, setLivenessComplete] = useState(false);
  const [selfieImage, setSelfieImage] = useState(null);
  const [livenessSessionId, setLivenessSessionId] = useState(null);

  // Documents state
  const [idDocument, setIdDocument] = useState(null);

  // Face match state
  const [faceMatchResult, setFaceMatchResult] = useState(null);

  useEffect(() => {
    loadVerificationStatus();
  }, []);

  const loadVerificationStatus = async () => {
    try {
      const response = await verificationAPI.getStatus();
      if (response.data.success) {
        setVerificationStatus(response.data.data?.status || 'not_started');
      }
    } catch (error) {
      // If endpoint doesn't exist, assume not started
      setVerificationStatus('not_started');
    } finally {
      setLoading(false);
    }
  };

  const handleLivenessComplete = (result) => {
    if (result.success) {
      setLivenessComplete(true);
      setSelfieImage(result.selfieFrame);
      setLivenessSessionId(result.sessionId);
      setCurrentStep(STEPS.DOCUMENTS);
    }
  };

  const startLivenessCheck = () => {
    navigation.navigate('LivenessCheck', {
      onComplete: handleLivenessComplete
    });
  };

  const pickIDDocument = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true
    });

    if (!result.canceled && result.assets[0]) {
      setIdDocument({
        uri: result.assets[0].uri,
        base64: result.assets[0].base64
      });
    }
  };

  const handleFaceMatch = async () => {
    if (!idDocument?.base64 || !selfieImage) {
      Alert.alert('Error', 'Please complete all verification steps');
      return;
    }

    setSubmitting(true);
    try {
      const response = await verificationAPI.compareFaceWithID(
        idDocument.base64,
        selfieImage
      );

      if (response.data.success) {
        setFaceMatchResult(response.data.data);
        if (response.data.data.matched) {
          setCurrentStep(STEPS.REVIEW);
        } else {
          Alert.alert(
            'Face Match Failed',
            'The face in your selfie does not match your ID. Please try again with clearer photos.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Face comparison failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const documents = {
        idDocument: idDocument.base64,
        selfie: selfieImage,
        livenessSessionId
      };

      const response = await verificationAPI.submitVerification(documents);

      if (response.data.success) {
        Alert.alert(
          'Verification Submitted',
          'Your verification is being reviewed. This usually takes 1-2 business days.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit verification');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Already verified
  if (verificationStatus === 'verified') {
    return (
      <View style={styles.statusContainer}>
        <View style={styles.statusIcon}>
          <Ionicons name="checkmark-circle" size={80} color={colors.success} />
        </View>
        <Text style={styles.statusTitle}>You're Verified!</Text>
        <Text style={styles.statusText}>
          Your account has been verified. Customers can see the verification badge on your profile.
        </Text>
      </View>
    );
  }

  // Pending review
  if (verificationStatus === 'pending') {
    return (
      <View style={styles.statusContainer}>
        <View style={[styles.statusIcon, { backgroundColor: colors.warning + '20' }]}>
          <Ionicons name="time" size={80} color={colors.warning} />
        </View>
        <Text style={styles.statusTitle}>Under Review</Text>
        <Text style={styles.statusText}>
          Your verification documents are being reviewed. This usually takes 1-2 business days.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Progress Steps */}
        <View style={styles.progressContainer}>
          <View style={styles.progressStep}>
            <View style={[
              styles.progressCircle,
              currentStep === STEPS.LIVENESS && styles.progressCircleActive,
              livenessComplete && styles.progressCircleComplete
            ]}>
              {livenessComplete ? (
                <Ionicons name="checkmark" size={16} color={colors.white} />
              ) : (
                <Text style={styles.progressNumber}>1</Text>
              )}
            </View>
            <Text style={styles.progressLabel}>Liveness</Text>
          </View>

          <View style={[styles.progressLine, livenessComplete && styles.progressLineComplete]} />

          <View style={styles.progressStep}>
            <View style={[
              styles.progressCircle,
              currentStep === STEPS.DOCUMENTS && styles.progressCircleActive,
              currentStep === STEPS.REVIEW && styles.progressCircleComplete
            ]}>
              {currentStep === STEPS.REVIEW ? (
                <Ionicons name="checkmark" size={16} color={colors.white} />
              ) : (
                <Text style={styles.progressNumber}>2</Text>
              )}
            </View>
            <Text style={styles.progressLabel}>Documents</Text>
          </View>

          <View style={[styles.progressLine, currentStep === STEPS.REVIEW && styles.progressLineComplete]} />

          <View style={styles.progressStep}>
            <View style={[
              styles.progressCircle,
              currentStep === STEPS.REVIEW && styles.progressCircleActive
            ]}>
              <Text style={styles.progressNumber}>3</Text>
            </View>
            <Text style={styles.progressLabel}>Submit</Text>
          </View>
        </View>

        {/* Step 1: Liveness Check */}
        {currentStep === STEPS.LIVENESS && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <Ionicons name="scan-outline" size={48} color={colors.primary} />
              <Text style={styles.stepTitle}>Face Verification</Text>
              <Text style={styles.stepDescription}>
                Complete a quick face scan to prove you're a real person. You'll be asked to perform simple actions like turning your head.
              </Text>
            </View>

            <View style={styles.requirementsBox}>
              <Text style={styles.requirementsTitle}>Tips for best results:</Text>
              <View style={styles.requirementItem}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.requirementText}>Good lighting on your face</Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.requirementText}>Remove glasses or hats</Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.requirementText}>Face the camera directly</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={startLivenessCheck}>
              <Ionicons name="camera" size={20} color={colors.white} />
              <Text style={styles.primaryButtonText}>Start Face Scan</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: ID Document */}
        {currentStep === STEPS.DOCUMENTS && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <Ionicons name="card-outline" size={48} color={colors.primary} />
              <Text style={styles.stepTitle}>Upload ID Document</Text>
              <Text style={styles.stepDescription}>
                Upload a clear photo of your government-issued ID (Passport, National ID, or Driver's License).
              </Text>
            </View>

            {/* Selfie Preview */}
            <View style={styles.previewSection}>
              <Text style={styles.previewLabel}>Your Selfie</Text>
              {selfieImage && (
                <View style={styles.imagePreview}>
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${selfieImage}` }}
                    style={styles.previewImage}
                  />
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={12} color={colors.white} />
                  </View>
                </View>
              )}
            </View>

            {/* ID Document Upload */}
            <View style={styles.previewSection}>
              <Text style={styles.previewLabel}>ID Document</Text>
              {idDocument ? (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: idDocument.uri }} style={styles.previewImage} />
                  <TouchableOpacity style={styles.changeButton} onPress={pickIDDocument}>
                    <Text style={styles.changeButtonText}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.uploadArea} onPress={pickIDDocument}>
                  <Ionicons name="cloud-upload-outline" size={32} color={colors.primary} />
                  <Text style={styles.uploadText}>Tap to upload ID</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, !idDocument && styles.buttonDisabled]}
              onPress={handleFaceMatch}
              disabled={!idDocument || submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="scan" size={20} color={colors.white} />
                  <Text style={styles.primaryButtonText}>Verify Face Match</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: Review & Submit */}
        {currentStep === STEPS.REVIEW && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <Ionicons name="shield-checkmark-outline" size={48} color={colors.primary} />
              <Text style={styles.stepTitle}>Review & Submit</Text>
              <Text style={styles.stepDescription}>
                Review your verification details before submitting.
              </Text>
            </View>

            <View style={styles.reviewCard}>
              <View style={styles.reviewItem}>
                <View style={styles.reviewIcon}>
                  <Ionicons name="scan-outline" size={20} color={colors.success} />
                </View>
                <View style={styles.reviewContent}>
                  <Text style={styles.reviewTitle}>Liveness Check</Text>
                  <Text style={styles.reviewStatus}>Passed</Text>
                </View>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              </View>

              <View style={styles.reviewDivider} />

              <View style={styles.reviewItem}>
                <View style={styles.reviewIcon}>
                  <Ionicons name="person-outline" size={20} color={colors.success} />
                </View>
                <View style={styles.reviewContent}>
                  <Text style={styles.reviewTitle}>Face Match</Text>
                  <Text style={styles.reviewStatus}>
                    {faceMatchResult?.confidence?.toFixed(1)}% confidence
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              </View>

              <View style={styles.reviewDivider} />

              <View style={styles.reviewImages}>
                <Image
                  source={{ uri: `data:image/jpeg;base64,${selfieImage}` }}
                  style={styles.reviewImage}
                />
                <Image source={{ uri: idDocument.uri }} style={styles.reviewImage} />
              </View>
            </View>

            <View style={styles.noticeBox}>
              <Ionicons name="information-circle" size={20} color={colors.warning} />
              <Text style={styles.noticeText}>
                By submitting, you confirm that all information is accurate. Verification typically takes 1-2 business days.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="send" size={20} color={colors.white} />
                  <Text style={styles.primaryButtonText}>Submit Verification</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgSecondary
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl
  },
  statusIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center'
  },
  statusTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.lg
  },
  statusText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white
  },
  progressStep: {
    alignItems: 'center'
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center'
  },
  progressCircleActive: {
    backgroundColor: colors.primary
  },
  progressCircleComplete: {
    backgroundColor: colors.success
  },
  progressNumber: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted
  },
  progressLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm
  },
  progressLineComplete: {
    backgroundColor: colors.success
  },
  stepContainer: {
    padding: spacing.md
  },
  stepHeader: {
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md
  },
  stepTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.md
  },
  stepDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20
  },
  requirementsBox: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md
  },
  requirementsTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs
  },
  requirementText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary
  },
  previewSection: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md
  },
  previewLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase'
  },
  imagePreview: {
    position: 'relative',
    borderRadius: borderRadius.md,
    overflow: 'hidden'
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md
  },
  checkBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center'
  },
  changeButton: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: borderRadius.sm
  },
  changeButtonText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: '600'
  },
  uploadArea: {
    height: 150,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary
  },
  uploadText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.sm
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: '600'
  },
  buttonDisabled: {
    opacity: 0.5
  },
  reviewCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm
  },
  reviewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center'
  },
  reviewContent: {
    flex: 1,
    marginLeft: spacing.md
  },
  reviewTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary
  },
  reviewStatus: {
    fontSize: fontSize.sm,
    color: colors.success,
    marginTop: 2
  },
  reviewDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm
  },
  reviewImages: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  reviewImage: {
    flex: 1,
    height: 100,
    borderRadius: borderRadius.md
  },
  noticeBox: {
    flexDirection: 'row',
    backgroundColor: colors.warning + '15',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.sm
  },
  noticeText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20
  },
  bottomPadding: {
    height: spacing.xl
  }
});
