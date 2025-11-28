import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tailorsAPI } from '../../../../shared/services/api';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../../../shared/constants/theme';

const PAYMENT_SETTINGS_KEY = '@payment_settings';

const PAYMENT_METHODS = [
  { id: 'cash', name: 'Cash', icon: 'cash-outline', description: 'Accept cash payments' },
  { id: 'bank_transfer', name: 'Bank Transfer', icon: 'card-outline', description: 'Accept bank transfers' },
  { id: 'mobile_money', name: 'Mobile Money', icon: 'phone-portrait-outline', description: 'Accept mobile money payments' }
];

export default function PaymentSettingsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [acceptedMethods, setAcceptedMethods] = useState({
    cash: true,
    bank_transfer: false,
    mobile_money: false
  });
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountNumber: '',
    accountName: ''
  });
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState('');
  const [depositRequired, setDepositRequired] = useState(false);
  const [depositPercentage, setDepositPercentage] = useState('50');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load from local storage first
      const saved = await AsyncStorage.getItem(PAYMENT_SETTINGS_KEY);
      if (saved) {
        const settings = JSON.parse(saved);
        setAcceptedMethods(settings.acceptedMethods || acceptedMethods);
        setBankDetails(settings.bankDetails || bankDetails);
        setMobileMoneyNumber(settings.mobileMoneyNumber || '');
        setDepositRequired(settings.depositRequired || false);
        setDepositPercentage(settings.depositPercentage || '50');
      }

      // Also try to load from profile
      const response = await tailorsAPI.getMyProfile();
      const profile = response.data.data;
      if (profile.paymentSettings) {
        const ps = profile.paymentSettings;
        if (ps.acceptedMethods) setAcceptedMethods(ps.acceptedMethods);
        if (ps.bankDetails) setBankDetails(ps.bankDetails);
        if (ps.mobileMoneyNumber) setMobileMoneyNumber(ps.mobileMoneyNumber);
        if (ps.depositRequired !== undefined) setDepositRequired(ps.depositRequired);
        if (ps.depositPercentage) setDepositPercentage(ps.depositPercentage.toString());
      }
    } catch (error) {
      console.error('Error loading payment settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate bank details if bank transfer is enabled
    if (acceptedMethods.bank_transfer) {
      if (!bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.accountName) {
        Alert.alert('Error', 'Please fill in all bank details');
        return;
      }
    }

    // Validate mobile money if enabled
    if (acceptedMethods.mobile_money && !mobileMoneyNumber) {
      Alert.alert('Error', 'Please enter your mobile money number');
      return;
    }

    setSaving(true);
    try {
      const settings = {
        acceptedMethods,
        bankDetails,
        mobileMoneyNumber,
        depositRequired,
        depositPercentage: parseInt(depositPercentage)
      };

      // Save locally
      await AsyncStorage.setItem(PAYMENT_SETTINGS_KEY, JSON.stringify(settings));

      // Save to server
      await tailorsAPI.updateProfile({
        paymentSettings: settings
      });

      Alert.alert('Success', 'Payment settings saved successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving payment settings:', error);
      Alert.alert('Error', 'Failed to save payment settings');
    } finally {
      setSaving(false);
    }
  };

  const togglePaymentMethod = (methodId) => {
    setAcceptedMethods(prev => ({
      ...prev,
      [methodId]: !prev[methodId]
    }));
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
        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accepted Payment Methods</Text>
          <View style={styles.card}>
            {PAYMENT_METHODS.map((method, index) => (
              <View key={method.id}>
                {index > 0 && <View style={styles.divider} />}
                <View style={styles.methodItem}>
                  <View style={styles.methodLeft}>
                    <View style={styles.methodIcon}>
                      <Ionicons name={method.icon} size={22} color={colors.primary} />
                    </View>
                    <View style={styles.methodText}>
                      <Text style={styles.methodName}>{method.name}</Text>
                      <Text style={styles.methodDescription}>{method.description}</Text>
                    </View>
                  </View>
                  <Switch
                    value={acceptedMethods[method.id]}
                    onValueChange={() => togglePaymentMethod(method.id)}
                    trackColor={{ false: colors.border, true: colors.primary + '50' }}
                    thumbColor={acceptedMethods[method.id] ? colors.primary : colors.textMuted}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Bank Details */}
        {acceptedMethods.bank_transfer && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bank Details</Text>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bank Name</Text>
                <TextInput
                  style={styles.input}
                  value={bankDetails.bankName}
                  onChangeText={(val) => setBankDetails(prev => ({ ...prev, bankName: val }))}
                  placeholder="e.g., First Bank"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Number</Text>
                <TextInput
                  style={styles.input}
                  value={bankDetails.accountNumber}
                  onChangeText={(val) => setBankDetails(prev => ({ ...prev, accountNumber: val }))}
                  placeholder="Enter account number"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Name</Text>
                <TextInput
                  style={styles.input}
                  value={bankDetails.accountName}
                  onChangeText={(val) => setBankDetails(prev => ({ ...prev, accountName: val }))}
                  placeholder="Enter account name"
                />
              </View>
            </View>
          </View>
        )}

        {/* Mobile Money */}
        {acceptedMethods.mobile_money && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mobile Money Details</Text>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Money Number</Text>
                <TextInput
                  style={styles.input}
                  value={mobileMoneyNumber}
                  onChangeText={setMobileMoneyNumber}
                  placeholder="e.g., 08012345678"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>
        )}

        {/* Deposit Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deposit Settings</Text>
          <View style={styles.card}>
            <View style={styles.methodItem}>
              <View style={styles.methodLeft}>
                <View style={styles.methodIcon}>
                  <Ionicons name="wallet-outline" size={22} color={colors.primary} />
                </View>
                <View style={styles.methodText}>
                  <Text style={styles.methodName}>Require Deposit</Text>
                  <Text style={styles.methodDescription}>
                    Request upfront payment before starting work
                  </Text>
                </View>
              </View>
              <Switch
                value={depositRequired}
                onValueChange={setDepositRequired}
                trackColor={{ false: colors.border, true: colors.primary + '50' }}
                thumbColor={depositRequired ? colors.primary : colors.textMuted}
              />
            </View>
            {depositRequired && (
              <>
                <View style={styles.divider} />
                <View style={styles.depositPercentage}>
                  <Text style={styles.inputLabel}>Deposit Percentage</Text>
                  <View style={styles.percentageRow}>
                    <TextInput
                      style={styles.percentageInput}
                      value={depositPercentage}
                      onChangeText={setDepositPercentage}
                      keyboardType="numeric"
                      maxLength={3}
                    />
                    <Text style={styles.percentageSymbol}>%</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        <Text style={styles.disclaimer}>
          Your payment details are securely stored and only shared with customers when they book your services.
        </Text>
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
            <Text style={styles.saveButtonText}>Save Settings</Text>
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
    marginBottom: spacing.lg
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    ...shadows.sm
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center'
  },
  methodText: {
    marginLeft: spacing.md,
    flex: 1
  },
  methodName: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.textPrimary
  },
  methodDescription: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md
  },
  inputGroup: {
    padding: spacing.md
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.sm
  },
  input: {
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: colors.textPrimary
  },
  depositPercentage: {
    padding: spacing.md
  },
  percentageRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  percentageInput: {
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    width: 80,
    textAlign: 'center'
  },
  percentageSymbol: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: spacing.sm
  },
  disclaimer: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.md
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
