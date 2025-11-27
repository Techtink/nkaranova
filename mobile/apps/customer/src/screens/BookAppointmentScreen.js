import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tailorsAPI, bookingsAPI } from '../../../../shared/services/api';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../../../shared/constants/theme';

export default function BookAppointmentScreen({ route, navigation }) {
  const { username, tailor: initialTailor } = route.params;
  const [tailor, setTailor] = useState(initialTailor);
  const [loading, setLoading] = useState(!initialTailor);
  const [submitting, setSubmitting] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Form state
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [serviceType, setServiceType] = useState('');
  const [notes, setNotes] = useState('');

  const serviceTypes = [
    'Custom Suit',
    'Dress Alterations',
    'Wedding Dress',
    'Traditional Wear',
    'Shirt Tailoring',
    'Pants/Trousers',
    'Jacket/Blazer',
    'Other'
  ];

  useEffect(() => {
    if (!initialTailor) {
      loadTailor();
    }
    loadAvailability();
  }, [username]);

  useEffect(() => {
    if (selectedDate) {
      loadSlots(selectedDate);
    }
  }, [selectedDate]);

  const loadTailor = async () => {
    try {
      const response = await tailorsAPI.getByUsername(username);
      setTailor(response.data.data);
    } catch (error) {
      console.error('Error loading tailor:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async () => {
    try {
      const response = await tailorsAPI.getAvailability(username);
      setAvailability(response.data.data);
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  };

  const loadSlots = async (date) => {
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const response = await tailorsAPI.getSlots(username, date);
      setSlots(response.data.data || []);
    } catch (error) {
      console.error('Error loading slots:', error);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const getNext14Days = () => {
    const days = [];
    const today = new Date();

    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' })
      });
    }
    return days;
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedSlot || !serviceType) {
      Alert.alert('Missing Information', 'Please select a date, time slot, and service type');
      return;
    }

    setSubmitting(true);
    try {
      await bookingsAPI.create({
        tailor: tailor._id,
        date: `${selectedDate}T${selectedSlot}:00`,
        serviceType,
        notes
      });

      Alert.alert(
        'Booking Requested',
        'Your appointment request has been sent. The tailor will confirm shortly.',
        [{ text: 'OK', onPress: () => navigation.navigate('Bookings') }]
      );
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create booking');
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

  const days = getNext14Days();

  return (
    <ScrollView style={styles.container}>
      {/* Tailor Info */}
      <View style={styles.tailorInfo}>
        <Text style={styles.tailorName}>{tailor?.user?.name}</Text>
        <Text style={styles.tailorUsername}>@{tailor?.user?.username}</Text>
      </View>

      {/* Date Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.datesRow}>
            {days.map((day) => (
              <TouchableOpacity
                key={day.date}
                style={[
                  styles.dateCard,
                  selectedDate === day.date && styles.dateCardSelected
                ]}
                onPress={() => setSelectedDate(day.date)}
              >
                <Text style={[
                  styles.dayName,
                  selectedDate === day.date && styles.dateTextSelected
                ]}>
                  {day.dayName}
                </Text>
                <Text style={[
                  styles.dayNum,
                  selectedDate === day.date && styles.dateTextSelected
                ]}>
                  {day.dayNum}
                </Text>
                <Text style={[
                  styles.monthName,
                  selectedDate === day.date && styles.dateTextSelected
                ]}>
                  {day.month}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Time Slots */}
      {selectedDate && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          {loadingSlots ? (
            <ActivityIndicator color={colors.primary} />
          ) : slots.length > 0 ? (
            <View style={styles.slotsGrid}>
              {slots.map((slot) => (
                <TouchableOpacity
                  key={slot.time}
                  style={[
                    styles.slotCard,
                    !slot.available && styles.slotUnavailable,
                    selectedSlot === slot.time && styles.slotSelected
                  ]}
                  onPress={() => slot.available && setSelectedSlot(slot.time)}
                  disabled={!slot.available}
                >
                  <Text style={[
                    styles.slotText,
                    !slot.available && styles.slotTextUnavailable,
                    selectedSlot === slot.time && styles.slotTextSelected
                  ]}>
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.noSlots}>No available slots for this date</Text>
          )}
        </View>
      )}

      {/* Service Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Type</Text>
        <View style={styles.servicesGrid}>
          {serviceTypes.map((service) => (
            <TouchableOpacity
              key={service}
              style={[
                styles.serviceCard,
                serviceType === service && styles.serviceSelected
              ]}
              onPress={() => setServiceType(service)}
            >
              <Text style={[
                styles.serviceText,
                serviceType === service && styles.serviceTextSelected
              ]}>
                {service}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Describe what you need, measurements, fabric preferences, etc."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Price Info */}
      {tailor?.priceRange && (
        <View style={styles.priceInfo}>
          <Ionicons name="information-circle-outline" size={20} color={colors.info} />
          <Text style={styles.priceText}>
            Typical prices range from ${tailor.priceRange.min} - ${tailor.priceRange.max}
          </Text>
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.submitButtonText}>Request Appointment</Text>
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
  tailorInfo: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  tailorName: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary
  },
  tailorUsername: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs
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
    marginBottom: spacing.md
  },
  datesRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  dateCard: {
    width: 70,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center'
  },
  dateCardSelected: {
    backgroundColor: colors.primary
  },
  dayName: {
    fontSize: fontSize.xs,
    color: colors.textMuted
  },
  dayNum: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginVertical: spacing.xs
  },
  monthName: {
    fontSize: fontSize.xs,
    color: colors.textMuted
  },
  dateTextSelected: {
    color: colors.white
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  slotCard: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgSecondary,
    minWidth: 80,
    alignItems: 'center'
  },
  slotUnavailable: {
    backgroundColor: colors.bgTertiary,
    opacity: 0.5
  },
  slotSelected: {
    backgroundColor: colors.primary
  },
  slotText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary
  },
  slotTextUnavailable: {
    color: colors.textMuted,
    textDecorationLine: 'line-through'
  },
  slotTextSelected: {
    color: colors.white,
    fontWeight: '600'
  },
  noSlots: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    padding: spacing.lg
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  serviceCard: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgSecondary
  },
  serviceSelected: {
    backgroundColor: colors.primary
  },
  serviceText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary
  },
  serviceTextSelected: {
    color: colors.white,
    fontWeight: '600'
  },
  notesInput: {
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.base,
    minHeight: 100
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.info + '10',
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.md
  },
  priceText: {
    fontSize: fontSize.sm,
    color: colors.info,
    marginLeft: spacing.sm,
    flex: 1
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
