import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { faqAPI } from '../services/api';
import { colors, spacing, fontSize, borderRadius, shadows } from '../constants/theme';

// Fallback FAQs if API fails
const FALLBACK_FAQ_DATA = [
  {
    _id: '1',
    question: 'How do I book an appointment?',
    answer: 'Browse tailors on the Explore tab, select a tailor you like, and tap "Book Appointment". Choose your preferred date and time, add any notes about your requirements, and confirm your booking.'
  },
  {
    _id: '2',
    question: 'How do I cancel a booking?',
    answer: 'Go to your Bookings in your profile, find the booking you want to cancel, and tap "Cancel Booking". Please note that cancellation policies may vary by tailor.'
  },
  {
    _id: '3',
    question: 'How do I message a tailor?',
    answer: 'You can message a tailor directly from their profile page by tapping the message icon, or through your existing conversations in the Messages tab.'
  },
  {
    _id: '4',
    question: 'What payment methods are accepted?',
    answer: 'Payment methods vary by tailor. Most tailors accept cash, bank transfers, and mobile payments. Check with your specific tailor for their accepted payment methods.'
  },
  {
    _id: '5',
    question: 'How do I become a verified tailor?',
    answer: 'Go to your Profile > Verification and complete the identity verification process including document upload and liveness check.'
  },
  {
    _id: '6',
    question: 'How do I update my profile?',
    answer: 'Go to Profile > Edit Profile to update your personal information, profile photo, and other details.'
  }
];

const CATEGORY_ICONS = {
  general: 'help-circle-outline',
  account: 'person-outline',
  orders: 'cart-outline',
  payments: 'card-outline',
  shipping: 'cube-outline',
  returns: 'arrow-undo-outline',
  tailors: 'shirt-outline',
  customers: 'people-outline'
};

export default function HelpSupportScreen({ route }) {
  // Get audience from route params (customers or tailors)
  const audience = route?.params?.audience || 'all';

  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      const [faqsRes, categoriesRes] = await Promise.all([
        faqAPI.getAll({ audience }),
        faqAPI.getCategories()
      ]);

      const faqData = faqsRes.data.data;
      setFaqs(faqData && faqData.length > 0 ? faqData : FALLBACK_FAQ_DATA);
      setCategories(categoriesRes.data.data || []);
    } catch (error) {
      console.error('Error loading FAQs:', error);
      setFaqs(FALLBACK_FAQ_DATA);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadFAQs();
  };

  const handleContact = (method) => {
    switch (method) {
      case 'email':
        Linking.openURL('mailto:support@tailorconnect.com?subject=App Support Request');
        break;
      case 'phone':
        Linking.openURL('tel:+2341234567890');
        break;
      case 'whatsapp':
        Linking.openURL('https://wa.me/2341234567890');
        break;
      default:
        Alert.alert('Contact Support', 'Please email us at support@tailorconnect.com');
    }
  };

  const filteredFaqs = selectedCategory
    ? faqs.filter(faq => faq.category === selectedCategory)
    : faqs;

  const ContactOption = ({ icon, title, subtitle, onPress }) => (
    <TouchableOpacity style={styles.contactOption} onPress={onPress}>
      <View style={styles.contactIconContainer}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <View style={styles.contactText}>
        <Text style={styles.contactTitle}>{title}</Text>
        <Text style={styles.contactSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );

  const FAQItem = ({ faq }) => {
    const isExpanded = expandedFaq === faq._id;

    return (
      <TouchableOpacity
        style={styles.faqItem}
        onPress={() => setExpandedFaq(isExpanded ? null : faq._id)}
      >
        <View style={styles.faqHeader}>
          <Text style={styles.faqQuestion}>{faq.question}</Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textMuted}
          />
        </View>
        {isExpanded && (
          <Text style={styles.faqAnswer}>{faq.answer}</Text>
        )}
      </TouchableOpacity>
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
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Contact Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <View style={styles.card}>
          <ContactOption
            icon="mail-outline"
            title="Email Support"
            subtitle="support@tailorconnect.com"
            onPress={() => handleContact('email')}
          />
          <View style={styles.divider} />
          <ContactOption
            icon="call-outline"
            title="Phone Support"
            subtitle="+234 123 456 7890"
            onPress={() => handleContact('phone')}
          />
          <View style={styles.divider} />
          <ContactOption
            icon="logo-whatsapp"
            title="WhatsApp"
            subtitle="Chat with us"
            onPress={() => handleContact('whatsapp')}
          />
        </View>
      </View>

      {/* Category Filter */}
      {categories.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filter by Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryContainer}
          >
            <TouchableOpacity
              style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[styles.categoryChip, selectedCategory === cat.value && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat.value)}
              >
                <Ionicons
                  name={CATEGORY_ICONS[cat.value] || 'help-circle-outline'}
                  size={14}
                  color={selectedCategory === cat.value ? colors.white : colors.textSecondary}
                  style={{ marginRight: spacing.xs }}
                />
                <Text style={[styles.categoryText, selectedCategory === cat.value && styles.categoryTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* FAQ Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.card}>
          {filteredFaqs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="help-circle-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>No FAQs in this category</Text>
            </View>
          ) : (
            filteredFaqs.map((faq, index) => (
              <View key={faq._id}>
                {index > 0 && <View style={styles.divider} />}
                <FAQItem faq={faq} />
              </View>
            ))
          )}
        </View>
      </View>

      {/* Quick Links */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Links</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => Linking.openURL('https://tailorconnect.com/terms')}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.linkText}>Terms of Service</Text>
            <Ionicons name="open-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => Linking.openURL('https://tailorconnect.com/privacy')}
          >
            <Ionicons name="shield-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.linkText}>Privacy Policy</Text>
            <Ionicons name="open-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => Alert.alert('App Version', 'Tailor Connect v1.0.0\nBuild 1')}
          >
            <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.linkText}>About App</Text>
            <Text style={styles.versionText}>v1.0.0</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          We're here to help! Our support team typically responds within 24 hours.
        </Text>
      </View>
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
    alignItems: 'center',
    backgroundColor: colors.bgSecondary
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md
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
  categoryContainer: {
    paddingBottom: spacing.sm,
    gap: spacing.xs
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  categoryText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary
  },
  categoryTextActive: {
    color: colors.white
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md
  },
  contactIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center'
  },
  contactText: {
    flex: 1,
    marginLeft: spacing.md
  },
  contactTitle: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.textPrimary
  },
  contactSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md
  },
  faqItem: {
    padding: spacing.md
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  faqQuestion: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.textPrimary,
    marginRight: spacing.sm
  },
  faqAnswer: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 20
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.sm
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md
  },
  linkText: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    marginLeft: spacing.md
  },
  versionText: {
    fontSize: fontSize.sm,
    color: colors.textMuted
  },
  footer: {
    padding: spacing.xl,
    alignItems: 'center'
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20
  }
});
