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
import { tailorsAPI, authAPI, uploadFile } from '../../../../shared/services/api';
import { useAuth } from '../../../../shared/context/AuthContext';
import { colors, spacing, fontSize, borderRadius } from '../../../../shared/constants/theme';

const specialtyOptions = [
  'Traditional Wear',
  'Wedding Dresses',
  'Suits',
  'Casual Wear',
  'Formal Wear',
  'Alterations',
  'Children Clothing',
  'Accessories'
];

export default function EditProfileScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // User details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');

  // Tailor profile
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [specialties, setSpecialties] = useState([]);
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await tailorsAPI.getMyProfile();
      const profile = response.data.data;

      setName(user?.name || '');
      setPhone(user?.phone || '');
      setProfilePhoto(user?.profilePhoto || '');

      setBio(profile.bio || '');
      setExperience(profile.experience?.toString() || '');
      setSpecialties(profile.specialties || []);
      setCity(profile.location?.city || '');
      setAddress(profile.location?.address || '');
      setMinPrice(profile.priceRange?.min?.toString() || '');
      setMaxPrice(profile.priceRange?.max?.toString() || '');
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const toggleSpecialty = (specialty) => {
    if (specialties.includes(specialty)) {
      setSpecialties(specialties.filter(s => s !== specialty));
    } else {
      setSpecialties([...specialties, specialty]);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setSaving(true);
    try {
      // Update user details
      await authAPI.updateDetails({
        name: name.trim(),
        phone: phone.trim(),
        profilePhoto
      });

      // Update tailor profile
      await tailorsAPI.updateMyProfile({
        bio: bio.trim(),
        experience: experience ? parseInt(experience) : 0,
        specialties,
        location: {
          city: city.trim(),
          address: address.trim()
        },
        priceRange: {
          min: minPrice ? parseFloat(minPrice) : 0,
          max: maxPrice ? parseFloat(maxPrice) : 0
        }
      });

      updateUser({ name: name.trim(), phone: phone.trim(), profilePhoto });

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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

      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your full name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Your phone number"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell customers about yourself and your work..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Years of Experience</Text>
          <TextInput
            style={styles.input}
            value={experience}
            onChangeText={setExperience}
            placeholder="0"
            keyboardType="number-pad"
          />
        </View>
      </View>

      {/* Specialties */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Specialties</Text>
        <View style={styles.specialtiesGrid}>
          {specialtyOptions.map((specialty) => (
            <TouchableOpacity
              key={specialty}
              style={[
                styles.specialtyChip,
                specialties.includes(specialty) && styles.specialtyChipSelected
              ]}
              onPress={() => toggleSpecialty(specialty)}
            >
              <Text style={[
                styles.specialtyText,
                specialties.includes(specialty) && styles.specialtyTextSelected
              ]}>
                {specialty}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Location */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="Your city"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Your workshop/shop address"
          />
        </View>
      </View>

      {/* Pricing */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Price Range</Text>
        <View style={styles.priceRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Minimum ($)</Text>
            <TextInput
              style={styles.input}
              value={minPrice}
              onChangeText={setMinPrice}
              placeholder="0"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.md }]}>
            <Text style={styles.label}>Maximum ($)</Text>
            <TextInput
              style={styles.input}
              value={maxPrice}
              onChangeText={setMaxPrice}
              placeholder="0"
              keyboardType="decimal-pad"
            />
          </View>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
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
  section: {
    backgroundColor: colors.white,
    marginTop: spacing.sm,
    padding: spacing.lg
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md
  },
  inputGroup: {
    marginBottom: spacing.md
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500',
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
  textArea: {
    minHeight: 100
  },
  specialtiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  specialtyChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border
  },
  specialtyChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  specialtyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary
  },
  specialtyTextSelected: {
    color: colors.white,
    fontWeight: '600'
  },
  priceRow: {
    flexDirection: 'row'
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
