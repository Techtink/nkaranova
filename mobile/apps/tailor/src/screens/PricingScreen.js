import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tailorsAPI } from '../../../../shared/services/api';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../../../shared/constants/theme';

const SERVICE_TYPES = [
  { id: 'measurement', name: 'Measurement/Consultation', icon: 'body-outline' },
  { id: 'simple_alteration', name: 'Simple Alterations', icon: 'cut-outline' },
  { id: 'complex_alteration', name: 'Complex Alterations', icon: 'construct-outline' },
  { id: 'simple_outfit', name: 'Simple Outfit (e.g., Skirt)', icon: 'shirt-outline' },
  { id: 'medium_outfit', name: 'Medium Outfit (e.g., Dress)', icon: 'woman-outline' },
  { id: 'complex_outfit', name: 'Complex Outfit (e.g., Suit)', icon: 'man-outline' },
  { id: 'traditional', name: 'Traditional Wear', icon: 'sparkles-outline' },
  { id: 'bridal', name: 'Bridal/Special Occasion', icon: 'heart-outline' }
];

export default function PricingScreen({ navigation }) {
  const [prices, setPrices] = useState({});
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPricing();
  }, []);

  const loadPricing = async () => {
    try {
      const response = await tailorsAPI.getMyProfile();
      const profile = response.data.data;

      if (profile.priceRange) {
        setMinPrice(profile.priceRange.min?.toString() || '');
        setMaxPrice(profile.priceRange.max?.toString() || '');
      }

      if (profile.servicePricing) {
        setPrices(profile.servicePricing);
      }
    } catch (error) {
      console.error('Error loading pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!minPrice || !maxPrice) {
      Alert.alert('Error', 'Please enter your price range');
      return;
    }

    if (parseInt(minPrice) > parseInt(maxPrice)) {
      Alert.alert('Error', 'Minimum price cannot be greater than maximum price');
      return;
    }

    setSaving(true);
    try {
      await tailorsAPI.updateProfile({
        priceRange: {
          min: parseInt(minPrice),
          max: parseInt(maxPrice)
        },
        servicePricing: prices
      });
      Alert.alert('Success', 'Pricing updated successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update pricing');
    } finally {
      setSaving(false);
    }
  };

  const updateServicePrice = (serviceId, field, value) => {
    setPrices(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [field]: value
      }
    }));
  };

  const ServicePriceCard = ({ service }) => {
    const price = prices[service.id] || {};

    return (
      <View style={styles.serviceCard}>
        <View style={styles.serviceHeader}>
          <View style={styles.serviceIcon}>
            <Ionicons name={service.icon} size={20} color={colors.primary} />
          </View>
          <Text style={styles.serviceName}>{service.name}</Text>
        </View>
        <View style={styles.priceInputRow}>
          <View style={styles.priceInputGroup}>
            <Text style={styles.priceLabel}>From</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.currencySymbol}>₦</Text>
              <TextInput
                style={styles.priceInput}
                value={price.min?.toString() || ''}
                onChangeText={(val) => updateServicePrice(service.id, 'min', val)}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>
          <View style={styles.priceSeparator}>
            <Text style={styles.toText}>to</Text>
          </View>
          <View style={styles.priceInputGroup}>
            <Text style={styles.priceLabel}>Up to</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.currencySymbol}>₦</Text>
              <TextInput
                style={styles.priceInput}
                value={price.max?.toString() || ''}
                onChangeText={(val) => updateServicePrice(service.id, 'max', val)}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* General Price Range */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General Price Range</Text>
          <Text style={styles.sectionDescription}>
            This is the price range shown on your profile
          </Text>
          <View style={styles.rangeCard}>
            <View style={styles.rangeInputGroup}>
              <Text style={styles.rangeLabel}>Minimum</Text>
              <View style={styles.rangeInputContainer}>
                <Text style={styles.currencySymbol}>₦</Text>
                <TextInput
                  style={styles.rangeInput}
                  value={minPrice}
                  onChangeText={setMinPrice}
                  keyboardType="numeric"
                  placeholder="5000"
                />
              </View>
            </View>
            <View style={styles.rangeDash}>
              <Ionicons name="remove" size={24} color={colors.textMuted} />
            </View>
            <View style={styles.rangeInputGroup}>
              <Text style={styles.rangeLabel}>Maximum</Text>
              <View style={styles.rangeInputContainer}>
                <Text style={styles.currencySymbol}>₦</Text>
                <TextInput
                  style={styles.rangeInput}
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  keyboardType="numeric"
                  placeholder="50000"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Service-specific Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Pricing (Optional)</Text>
          <Text style={styles.sectionDescription}>
            Set specific prices for different services to help customers know what to expect
          </Text>
          {SERVICE_TYPES.map((service) => (
            <ServicePriceCard key={service.id} service={service} />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save Pricing</Text>
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
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl
  },
  section: {
    marginBottom: spacing.xl
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  sectionDescription: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.md
  },
  rangeCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm
  },
  rangeInputGroup: {
    flex: 1
  },
  rangeLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.xs
  },
  rangeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm
  },
  currencySymbol: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginRight: spacing.xs
  },
  rangeInput: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    padding: spacing.sm
  },
  rangeDash: {
    paddingHorizontal: spacing.md
  },
  serviceCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  serviceIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm
  },
  serviceName: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.textPrimary,
    flex: 1
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  priceInputGroup: {
    flex: 1
  },
  priceLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.xs
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm
  },
  priceInput: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    padding: spacing.sm
  },
  priceSeparator: {
    paddingHorizontal: spacing.sm
  },
  toText: {
    fontSize: fontSize.sm,
    color: colors.textMuted
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center'
  },
  saveButtonDisabled: {
    opacity: 0.6
  },
  saveButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: '600'
  }
});
