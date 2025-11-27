import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { authAPI, uploadFile } from '../../../../shared/services/api';
import { useAuth } from '../../../../shared/context/AuthContext';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../../../shared/constants/theme';

export default function EditProfileScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || '');

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8
    });

    if (!result.canceled && result.assets[0]) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    setUploading(true);
    try {
      const response = await uploadFile(uri, 'profile');
      setProfilePhoto(response.url);
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.updateDetails({
        name: name.trim(),
        phone: phone.trim(),
        profilePhoto
      });

      updateUser(response.data.data);
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Photo */}
      <View style={styles.photoSection}>
        <TouchableOpacity style={styles.photoContainer} onPress={pickImage} disabled={uploading}>
          {uploading ? (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator color={colors.white} />
            </View>
          ) : (
            <>
              <Image
                source={{ uri: profilePhoto || 'https://via.placeholder.com/120' }}
                style={styles.profilePhoto}
              />
              <View style={styles.editIconContainer}>
                <Ionicons name="camera" size={16} color={colors.white} />
              </View>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.photoHint}>Tap to change photo</Text>
      </View>

      {/* Form Fields */}
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={user?.email}
            editable={false}
          />
          <Text style={styles.hint}>Email cannot be changed</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
          />
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgSecondary
  },
  photoSection: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.white
  },
  photoContainer: {
    position: 'relative'
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60
  },
  uploadingOverlay: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white
  },
  photoHint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.sm
  },
  form: {
    backgroundColor: colors.white,
    marginTop: spacing.sm,
    padding: spacing.lg
  },
  inputGroup: {
    marginBottom: spacing.lg
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  input: {
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.base,
    borderWidth: 1,
    borderColor: colors.border
  },
  inputDisabled: {
    backgroundColor: colors.bgTertiary,
    color: colors.textMuted
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs
  },
  saveButton: {
    backgroundColor: colors.primary,
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center'
  },
  saveButtonDisabled: {
    opacity: 0.6
  },
  saveButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: '600'
  },
  bottomPadding: {
    height: spacing.xl
  }
});
