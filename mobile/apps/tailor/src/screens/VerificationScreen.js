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
import { tailorsAPI, uploadFile } from '../../../../shared/services/api';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../../../shared/constants/theme';

const requiredDocuments = [
  {
    key: 'governmentId',
    title: 'Government ID',
    description: 'Passport, Driver\'s License, or National ID',
    icon: 'card-outline'
  },
  {
    key: 'businessProof',
    title: 'Business Proof',
    description: 'Business registration, tax certificate, or shop license',
    icon: 'business-outline'
  },
  {
    key: 'workSample',
    title: 'Work Sample',
    description: 'Photo of your tailoring work or workshop',
    icon: 'images-outline'
  }
];

export default function VerificationScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [documents, setDocuments] = useState({
    governmentId: null,
    businessProof: null,
    workSample: null
  });

  useEffect(() => {
    loadVerificationStatus();
  }, []);

  const loadVerificationStatus = async () => {
    try {
      const response = await tailorsAPI.getMyProfile();
      const tailor = response.data.data;
      setVerificationStatus(tailor.verificationStatus);

      if (tailor.verificationDocuments) {
        setDocuments(tailor.verificationDocuments);
      }
    } catch (error) {
      console.error('Error loading verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickDocument = async (docKey) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8
    });

    if (!result.canceled && result.assets[0]) {
      uploadDocument(docKey, result.assets[0].uri);
    }
  };

  const uploadDocument = async (docKey, uri) => {
    setUploading(docKey);
    try {
      const response = await uploadFile(uri, 'verification');
      setDocuments(prev => ({
        ...prev,
        [docKey]: response.url
      }));
    } catch (error) {
      Alert.alert('Error', 'Failed to upload document');
    } finally {
      setUploading(null);
    }
  };

  const removeDocument = (docKey) => {
    setDocuments(prev => ({
      ...prev,
      [docKey]: null
    }));
  };

  const handleSubmit = async () => {
    const missingDocs = requiredDocuments.filter(doc => !documents[doc.key]);
    if (missingDocs.length > 0) {
      Alert.alert(
        'Missing Documents',
        `Please upload: ${missingDocs.map(d => d.title).join(', ')}`
      );
      return;
    }

    setSubmitting(true);
    try {
      await tailorsAPI.submitVerification(documents);
      Alert.alert(
        'Verification Submitted',
        'Your documents have been submitted for review. We\'ll notify you once verified.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
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

  const DocumentCard = ({ doc }) => {
    const isUploading = uploading === doc.key;
    const isUploaded = !!documents[doc.key];

    return (
      <View style={styles.documentCard}>
        <View style={styles.documentInfo}>
          <View style={[styles.documentIcon, isUploaded && styles.documentIconUploaded]}>
            <Ionicons
              name={isUploaded ? 'checkmark' : doc.icon}
              size={24}
              color={isUploaded ? colors.white : colors.primary}
            />
          </View>
          <View style={styles.documentText}>
            <Text style={styles.documentTitle}>{doc.title}</Text>
            <Text style={styles.documentDesc}>{doc.description}</Text>
          </View>
        </View>

        {isUploaded ? (
          <View style={styles.uploadedContainer}>
            <Image source={{ uri: documents[doc.key] }} style={styles.thumbnail} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeDocument(doc.key)}
            >
              <Ionicons name="close" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickDocument(doc.key)}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />
                <Text style={styles.uploadButtonText}>Upload</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="shield-checkmark-outline" size={48} color={colors.primary} />
          <Text style={styles.headerTitle}>Get Verified</Text>
          <Text style={styles.headerText}>
            Verified tailors get more visibility and customer trust. Upload the following documents to get verified.
          </Text>
        </View>

        {/* Rejected notice */}
        {verificationStatus === 'rejected' && (
          <View style={styles.rejectedNotice}>
            <Ionicons name="warning-outline" size={20} color={colors.error} />
            <Text style={styles.rejectedText}>
              Your previous submission was rejected. Please resubmit with valid documents.
            </Text>
          </View>
        )}

        {/* Documents */}
        <View style={styles.documentsSection}>
          <Text style={styles.sectionTitle}>Required Documents</Text>
          {requiredDocuments.map((doc) => (
            <DocumentCard key={doc.key} doc={doc} />
          ))}
        </View>

        {/* Benefits */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>Benefits of Verification</Text>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.benefitText}>Verification badge on your profile</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.benefitText}>Higher ranking in search results</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.benefitText}>Increased customer trust</Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>Submit for Verification</Text>
          )}
        </TouchableOpacity>
      </View>
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
  header: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.md
  },
  headerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20
  },
  rejectedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '10',
    padding: spacing.md,
    margin: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm
  },
  rejectedText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.error
  },
  documentsSection: {
    padding: spacing.md
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md
  },
  documentCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center'
  },
  documentIconUploaded: {
    backgroundColor: colors.success
  },
  documentText: {
    flex: 1,
    marginLeft: spacing.md
  },
  documentTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary
  },
  documentDesc: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs
  },
  uploadedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    left: 72,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center'
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '10',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    gap: spacing.xs
  },
  uploadButtonText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600'
  },
  benefitsSection: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    margin: spacing.md,
    borderRadius: borderRadius.lg
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm
  },
  benefitText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary
  },
  bottomPadding: {
    height: 100
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center'
  },
  submitButtonDisabled: {
    opacity: 0.6
  },
  submitButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: '600'
  }
});
