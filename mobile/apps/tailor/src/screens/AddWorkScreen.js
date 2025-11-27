import { useState } from 'react';
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
import { worksAPI, uploadFile } from '../../../../shared/services/api';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../../../shared/constants/theme';

const categories = [
  'Traditional Wear',
  'Wedding Dresses',
  'Suits',
  'Casual Wear',
  'Formal Wear',
  'Alterations',
  'Children Clothing',
  'Accessories',
  'Other'
];

export default function AddWorkScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pickImages = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
      quality: 0.8
    });

    if (!result.canceled && result.assets) {
      uploadImages(result.assets.map(a => a.uri));
    }
  };

  const uploadImages = async (uris) => {
    setUploading(true);
    try {
      const uploadPromises = uris.map(uri => uploadFile(uri, 'work'));
      const results = await Promise.all(uploadPromises);
      setImages([...images, ...results.map(r => r.url)]);
    } catch (error) {
      Alert.alert('Error', 'Failed to upload some images');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (images.length === 0) {
      Alert.alert('Error', 'Please add at least one image');
      return;
    }

    setSubmitting(true);
    try {
      await worksAPI.create({
        title: title.trim(),
        description: description.trim(),
        category,
        price: price ? parseFloat(price) : undefined,
        images
      });

      Alert.alert(
        'Success',
        'Your work has been submitted for review. It will be visible once approved.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create work');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Images Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photos *</Text>
        <Text style={styles.hint}>Add up to 5 photos of your work</Text>

        <View style={styles.imagesContainer}>
          {images.map((uri, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="close" size={16} color={colors.white} />
              </TouchableOpacity>
            </View>
          ))}

          {images.length < 5 && (
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={pickImages}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={32} color={colors.primary} />
                  <Text style={styles.addImageText}>Add Photo</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Title */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter a title for your work"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your work, materials used, etc."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={500}
        />
      </View>

      {/* Category */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Category *</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                category === cat && styles.categoryChipSelected
              ]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[
                styles.categoryText,
                category === cat && styles.categoryTextSelected
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Price */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Price (Optional)</Text>
        <View style={styles.priceInput}>
          <Text style={styles.currency}>$</Text>
          <TextInput
            style={styles.priceField}
            placeholder="0.00"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />
        </View>
        <Text style={styles.hint}>Leave empty if price varies</Text>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.submitButtonText}>Submit for Review</Text>
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
  section: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginTop: spacing.sm
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  imageWrapper: {
    position: 'relative'
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center'
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  addImageText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    marginTop: spacing.xs
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
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  categoryChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  categoryText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary
  },
  categoryTextSelected: {
    color: colors.white,
    fontWeight: '600'
  },
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  currency: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    paddingLeft: spacing.md
  },
  priceField: {
    flex: 1,
    padding: spacing.md,
    fontSize: fontSize.base
  },
  submitButton: {
    backgroundColor: colors.primary,
    margin: spacing.lg,
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
  },
  bottomPadding: {
    height: spacing.xl
  }
});
