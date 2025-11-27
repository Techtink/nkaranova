import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tailorsAPI } from '../../../../shared/services/api';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../../../shared/constants/theme';

const daysOfWeek = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
];

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00'
];

export default function AvailabilityScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState({});
  const [expandedDay, setExpandedDay] = useState(null);

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      const response = await tailorsAPI.getMyProfile();
      const data = response.data.data.availability || {};

      // Initialize availability for all days
      const initialAvailability = {};
      daysOfWeek.forEach(day => {
        initialAvailability[day.key] = data[day.key] || {
          enabled: false,
          startTime: '09:00',
          endTime: '17:00'
        };
      });
      setAvailability(initialAvailability);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (dayKey) => {
    setAvailability(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        enabled: !prev[dayKey].enabled
      }
    }));
  };

  const setTime = (dayKey, field, value) => {
    setAvailability(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await tailorsAPI.updateMyAvailability({ availability });
      Alert.alert('Success', 'Availability updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update availability');
    } finally {
      setSaving(false);
    }
  };

  const DayCard = ({ day }) => {
    const dayData = availability[day.key];
    const isExpanded = expandedDay === day.key;

    return (
      <View style={styles.dayCard}>
        <TouchableOpacity
          style={styles.dayHeader}
          onPress={() => setExpandedDay(isExpanded ? null : day.key)}
        >
          <View style={styles.dayLeft}>
            <Switch
              value={dayData?.enabled}
              onValueChange={() => toggleDay(day.key)}
              trackColor={{ false: colors.gray300, true: colors.primaryLight }}
              thumbColor={dayData?.enabled ? colors.primary : colors.gray400}
            />
            <Text style={[styles.dayLabel, !dayData?.enabled && styles.dayLabelDisabled]}>
              {day.label}
            </Text>
          </View>
          {dayData?.enabled && (
            <View style={styles.dayRight}>
              <Text style={styles.timePreview}>
                {dayData.startTime} - {dayData.endTime}
              </Text>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textMuted}
              />
            </View>
          )}
        </TouchableOpacity>

        {isExpanded && dayData?.enabled && (
          <View style={styles.timeSelector}>
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>Start Time</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.timeOptions}>
                  {timeSlots.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeChip,
                        dayData.startTime === time && styles.timeChipSelected
                      ]}
                      onPress={() => setTime(day.key, 'startTime', time)}
                    >
                      <Text style={[
                        styles.timeChipText,
                        dayData.startTime === time && styles.timeChipTextSelected
                      ]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>End Time</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.timeOptions}>
                  {timeSlots.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeChip,
                        dayData.endTime === time && styles.timeChipSelected,
                        time <= dayData.startTime && styles.timeChipDisabled
                      ]}
                      onPress={() => time > dayData.startTime && setTime(day.key, 'endTime', time)}
                      disabled={time <= dayData.startTime}
                    >
                      <Text style={[
                        styles.timeChipText,
                        dayData.endTime === time && styles.timeChipTextSelected,
                        time <= dayData.startTime && styles.timeChipTextDisabled
                      ]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        )}
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
      <ScrollView>
        <View style={styles.header}>
          <Ionicons name="time-outline" size={24} color={colors.primary} />
          <Text style={styles.headerText}>
            Set your working hours. Customers will only be able to book during these times.
          </Text>
        </View>

        {daysOfWeek.map((day) => (
          <DayCard key={day.key} day={day} />
        ))}

        <View style={styles.bottomPadding} />
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
            <Text style={styles.saveButtonText}>Save Changes</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.lg,
    gap: spacing.md
  },
  headerText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20
  },
  dayCard: {
    backgroundColor: colors.white,
    marginTop: spacing.sm,
    ...shadows.sm
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md
  },
  dayLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  dayLabel: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.textPrimary,
    marginLeft: spacing.md
  },
  dayLabelDisabled: {
    color: colors.textMuted
  },
  dayRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  timePreview: {
    fontSize: fontSize.sm,
    color: colors.textSecondary
  },
  timeSelector: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md
  },
  timeRow: {
    marginBottom: spacing.md
  },
  timeLabel: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  timeOptions: {
    flexDirection: 'row',
    gap: spacing.xs
  },
  timeChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border
  },
  timeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  timeChipDisabled: {
    opacity: 0.4
  },
  timeChipText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary
  },
  timeChipTextSelected: {
    color: colors.white,
    fontWeight: '600'
  },
  timeChipTextDisabled: {
    color: colors.textMuted
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
  saveButton: {
    backgroundColor: colors.primary,
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
  }
});
