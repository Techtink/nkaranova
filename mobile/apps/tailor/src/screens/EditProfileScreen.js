import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Switch,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { tailorsAPI, authAPI, uploadFile } from '../../../../shared/services/api';
import { useAuth } from '../../../../shared/context/AuthContext';
import { colors, spacing, fontSize, borderRadius } from '../../../../shared/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // User details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [coverPhoto, setCoverPhoto] = useState('');

  // Tailor profile
  const [username, setUsername] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [specialties, setSpecialties] = useState([]);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [acceptingBookings, setAcceptingBookings] = useState(true);

  // Username validation
  const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null, message: '' });
  const usernameCheckTimeout = useRef(null);
  const originalUsername = useRef('');

  useEffect(() => {
    loadProfile();
    return () => {
      if (usernameCheckTimeout.current) {
        clearTimeout(usernameCheckTimeout.current);
      }
    };
  }, []);

  const loadProfile = async () => {
    try {
      const response = await tailorsAPI.getMyProfile();
      const profile = response.data.data.tailor || response.data.data;

      setName(user?.name || '');
      setPhone(user?.phone || '');
      setProfilePhoto(profile.profilePhoto || user?.profilePhoto || '');
      setCoverPhoto(profile.coverPhoto || '');

      setUsername(profile.username || '');
      originalUsername.current = profile.username || '';
      setBusinessName(profile.businessName || '');
      setBio(profile.bio || '');
      setExperience(profile.experience?.toString() || '');
      setSpecialties(profile.specialties || []);
      setCity(profile.location?.city || '');
      setState(profile.location?.state || '');
      setCountry(profile.location?.country || '');
      setAddress(profile.location?.address || '');
      setMinPrice(profile.minimumPrice?.toString() || profile.priceRange?.min?.toString() || '');
      setMaxPrice(profile.priceRange?.max?.toString() || '');
      setAcceptingBookings(profile.acceptingBookings ?? true);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced username check
  const checkUsername = useCallback(async (value) => {
    if (!value || value.length < 3) {
      setUsernameStatus({
        checking: false,
        available: null,
        message: value.length > 0 ? 'Username must be at least 3 characters' : ''
      });
      return;
    }

    if (value === originalUsername.current) {
      setUsernameStatus({
        checking: false,
        available: true,
        message: 'This is your current username'
      });
      return;
    }

    setUsernameStatus({ checking: true, available: null, message: '' });

    try {
      const response = await tailorsAPI.checkUsername?.(value);
      if (response) {
        setUsernameStatus({
          checking: false,
          available: response.data.available,
          message: response.data.message
        });
      }
    } catch (error) {
      setUsernameStatus({
        checking: false,
        available: false,
        message: error.response?.data?.message || 'Error checking username'
      });
    }
  }, []);

  const handleUsernameChange = (value) => {
    const cleanValue = value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setUsername(cleanValue);

    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }
    usernameCheckTimeout.current = setTimeout(() => {
      checkUsername(cleanValue);
    }, 500);
  };

  const pickImage = async (type = 'profile') => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'cover' ? [16, 9] : [1, 1],
      quality: 0.8
    });

    if (!result.canceled && result.assets[0]) {
      uploadImage(result.assets[0].uri, type);
    }
  };

  const uploadImage = async (uri, type = 'profile') => {
    const setUploading = type === 'profile' ? setUploadingProfile : setUploadingCover;
    setUploading(true);
    try {
      const response = await uploadFile(uri, type);
      if (type === 'profile') {
        setProfilePhoto(response.url);
      } else {
        setCoverPhoto(response.url);
      }
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

    if (usernameStatus.available === false) {
      Alert.alert('Error', 'Please choose an available username');
      return;
    }

    if (usernameStatus.checking) {
      Alert.alert('Please Wait', 'Verifying username availability...');
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
        username: username.trim(),
        businessName: businessName.trim(),
        bio: bio.trim(),
        profilePhoto,
        coverPhoto,
        experience: experience ? parseInt(experience) : 0,
        specialties,
        location: {
          city: city.trim(),
          state: state.trim(),
          country: country.trim(),
          address: address.trim()
        },
        minimumPrice: minPrice ? parseFloat(minPrice) : 0,
        acceptingBookings
      });

      originalUsername.current = username.trim();
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
      {/* Cover Photo */}
      <TouchableOpacity
        style={styles.coverPhotoContainer}
        onPress={() => pickImage('cover')}
        disabled={uploadingCover}
      >
        {uploadingCover ? (
          <View style={styles.coverUploadingOverlay}>
            <ActivityIndicator size="large" color={colors.white} />
          </View>
        ) : coverPhoto ? (
          <>
            <Image source={{ uri: coverPhoto }} style={styles.coverPhoto} />
            <View style={styles.coverEditOverlay}>
              <Ionicons name="camera" size={24} color={colors.white} />
              <Text style={styles.coverEditText}>Change Cover</Text>
            </View>
          </>
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="image-outline" size={32} color={colors.textMuted} />
            <Text style={styles.coverPlaceholderText}>Upload Cover Photo</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Profile Photo */}
      <View style={styles.photoSection}>
        <TouchableOpacity style={styles.photoContainer} onPress={() => pickImage('profile')} disabled={uploadingProfile}>
          {uploadingProfile ? (
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
        <Text style={styles.photoHint}>Tap to change profile photo</Text>
      </View>

      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username</Text>
          <View style={styles.usernameInputContainer}>
            <TextInput
              style={[styles.input, styles.usernameInput]}
              value={username}
              onChangeText={handleUsernameChange}
              placeholder="your-username"
              autoCapitalize="none"
            />
            <View style={styles.usernameStatus}>
              {usernameStatus.checking ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : usernameStatus.available === true ? (
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              ) : usernameStatus.available === false ? (
                <Ionicons name="close-circle" size={20} color={colors.error} />
              ) : null}
            </View>
          </View>
          {usernameStatus.message ? (
            <Text style={[
              styles.usernameMessage,
              { color: usernameStatus.available === false ? colors.error : usernameStatus.available === true ? colors.success : colors.textMuted }
            ]}>
              {usernameStatus.message}
            </Text>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Business Name</Text>
          <TextInput
            style={styles.input}
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="Your business or brand name"
          />
        </View>

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
            maxLength={1000}
          />
          <Text style={styles.charCount}>{bio.length}/1000</Text>
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
          <Text style={styles.label}>State/Province</Text>
          <TextInput
            style={styles.input}
            value={state}
            onChangeText={setState}
            placeholder="Your state or province"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Country</Text>
          <TextInput
            style={styles.input}
            value={country}
            onChangeText={setCountry}
            placeholder="Your country"
          />
        </View>
      </View>

      {/* Booking Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Booking Settings</Text>

        <View style={styles.toggleSetting}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Accepting Bookings</Text>
            <Text style={styles.toggleDesc}>Allow customers to book appointments with you</Text>
          </View>
          <Switch
            value={acceptingBookings}
            onValueChange={setAcceptingBookings}
            trackColor={{ false: colors.border, true: colors.primary + '50' }}
            thumbColor={acceptingBookings ? colors.primary : colors.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Minimum Price (USD)</Text>
          <TextInput
            style={styles.input}
            value={minPrice}
            onChangeText={setMinPrice}
            placeholder="0"
            keyboardType="decimal-pad"
          />
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
  // Cover Photo styles
  coverPhotoContainer: {
    width: SCREEN_WIDTH,
    height: 150,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    borderStyle: 'dashed'
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  coverUploadingOverlay: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  coverEditOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  coverEditText: {
    color: colors.white,
    fontSize: fontSize.sm,
    marginTop: spacing.xs
  },
  coverPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  coverPlaceholderText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs
  },
  // Profile Photo styles
  photoSection: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.white,
    marginTop: -40
  },
  photoContainer: {
    position: 'relative'
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: colors.white
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
  // Username styles
  usernameInputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center'
  },
  usernameInput: {
    flex: 1,
    paddingRight: 40
  },
  usernameStatus: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center'
  },
  usernameMessage: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs
  },
  charCount: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: spacing.xs
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
  // Toggle setting styles
  toggleSetting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md
  },
  toggleInfo: {
    flex: 1,
    marginRight: spacing.md
  },
  toggleTitle: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.textPrimary
  },
  toggleDesc: {
    fontSize: fontSize.sm,
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
