import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Linking,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { tailorsAPI, conversationsAPI, worksAPI, reviewsAPI } from '../../../../shared/services/api';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../../../shared/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function TailorProfileScreen({ route, navigation }) {
  const { username } = route.params;
  const [tailor, setTailor] = useState(null);
  const [works, setWorks] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('portfolio');

  useEffect(() => {
    loadTailorData();
  }, [username]);

  const loadTailorData = async () => {
    try {
      const [tailorRes, reviewsRes] = await Promise.all([
        tailorsAPI.getByUsername(username),
        reviewsAPI.getTailorReviews(username, { limit: 10 })
      ]);
      const data = tailorRes.data.data;
      setTailor(data.tailor || data);
      setWorks(data.works || []);
      setReviews(reviewsRes.data.data || []);
    } catch (error) {
      console.error('Error loading tailor:', error);
      Alert.alert('Error', 'Failed to load tailor profile');
    } finally {
      setLoading(false);
    }
  };

  // Get display name - prefer businessName, then user name
  const getDisplayName = () => {
    if (!tailor) return '';
    return tailor.businessName || `${tailor.user?.firstName || ''} ${tailor.user?.lastName || ''}`.trim() || tailor.user?.name || 'Unknown';
  };

  const handleMessage = async () => {
    try {
      const response = await conversationsAPI.startWithTailor(username);
      navigation.navigate('Chat', { conversationId: response.data.data._id });
    } catch (error) {
      Alert.alert('Error', 'Failed to start conversation');
    }
  };

  const handleBook = () => {
    navigation.navigate('BookAppointment', { username, tailor });
  };

  const handleCall = () => {
    if (tailor?.phone) {
      Linking.openURL(`tel:${tailor.phone}`);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={16} color={colors.secondary} />);
      } else if (i === fullStars && hasHalf) {
        stars.push(<Ionicons key={i} name="star-half" size={16} color={colors.secondary} />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={16} color={colors.secondary} />);
      }
    }
    return stars;
  };

  const WorkCard = ({ work }) => (
    <TouchableOpacity
      style={styles.workCard}
      onPress={() => Alert.alert(work.title, work.description || 'No description available')}
    >
      <Image
        source={{ uri: work.images?.[0] || 'https://via.placeholder.com/150' }}
        style={styles.workImage}
      />
      <Text style={styles.workTitle} numberOfLines={1}>{work.title}</Text>
      <Text style={styles.workPrice}>
        {work.price?.amount ? `${work.price.currency || '$'}${work.price.amount}` : 'Contact for price'}
      </Text>
    </TouchableOpacity>
  );

  const ReviewCard = ({ review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Image
          source={{ uri: review.customer?.profilePhoto || 'https://via.placeholder.com/40' }}
          style={styles.reviewerAvatar}
        />
        <View style={styles.reviewerInfo}>
          <Text style={styles.reviewerName}>{review.customer?.name}</Text>
          <View style={styles.reviewStars}>{renderStars(review.rating)}</View>
        </View>
        <Text style={styles.reviewDate}>
          {new Date(review.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.reviewText}>{review.comment}</Text>
      {review.response && (
        <View style={styles.responseContainer}>
          <Text style={styles.responseLabel}>Response from tailor:</Text>
          <Text style={styles.responseText}>{review.response}</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!tailor) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.textMuted} />
        <Text style={styles.errorText}>Tailor not found</Text>
      </View>
    );
  }

  const displayName = getDisplayName();
  const isVerified = tailor.verificationStatus === 'approved';

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Cover Photo */}
        <View style={styles.coverContainer}>
          {tailor.coverPhoto ? (
            <Image source={{ uri: tailor.coverPhoto }} style={styles.coverPhoto} />
          ) : (
            <LinearGradient
              colors={['#e8b5ce', '#c9a0dc', '#a78bda', '#8fa0e0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.coverGradient}
            />
          )}
        </View>

        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: tailor.profilePhoto || 'https://via.placeholder.com/120' }}
              style={styles.avatar}
            />
            {isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={14} color={colors.white} />
              </View>
            )}
          </View>
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{displayName}</Text>
              {tailor.acceptingBookings && (
                <View style={styles.availableBadge}>
                  <View style={styles.availableDot} />
                  <Text style={styles.availableText}>Available</Text>
                </View>
              )}
            </View>
            <Text style={styles.username}>@{tailor.username}</Text>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  <Ionicons name="star" size={16} color="#F59E0B" /> {tailor.averageRating?.toFixed(1) || '0.0'}
                </Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{tailor.reviewCount || 0}</Text>
                <Text style={styles.statLabel}>Reviews</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{works.length}</Text>
                <Text style={styles.statLabel}>Works</Text>
              </View>
              {tailor.location?.city && (
                <>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{tailor.location.city}</Text>
                    <Text style={styles.statLabel}>Location</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Bio Section */}
        {tailor.bio && (
          <View style={styles.section}>
            <Text style={styles.bio}>{tailor.bio}</Text>
          </View>
        )}

        {/* Info Cards */}
        <View style={styles.infoCards}>
          <View style={styles.infoCard}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              {tailor.location?.city || 'Location not set'}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="pricetag-outline" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              ${tailor.priceRange?.min || 0} - ${tailor.priceRange?.max || 0}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              {tailor.experience || 0}+ years exp
            </Text>
          </View>
        </View>

        {/* Specialties */}
        {tailor.specialties?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specialties</Text>
            <View style={styles.tagContainer}>
              {tailor.specialties.map((specialty, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{specialty}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'portfolio' && styles.activeTab]}
            onPress={() => setActiveTab('portfolio')}
          >
            <Text style={[styles.tabText, activeTab === 'portfolio' && styles.activeTabText]}>
              Portfolio ({works.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
            onPress={() => setActiveTab('reviews')}
          >
            <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
              Reviews ({reviews.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'portfolio' ? (
          <View style={styles.portfolioGrid}>
            {works.length > 0 ? (
              works.map((work) => <WorkCard key={work._id} work={work} />)
            ) : (
              <Text style={styles.emptyText}>No portfolio items yet</Text>
            )}
          </View>
        ) : (
          <View style={styles.reviewsList}>
            {reviews.length > 0 ? (
              reviews.map((review) => <ReviewCard key={review._id} review={review} />)
            ) : (
              <Text style={styles.emptyText}>No reviews yet</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionButton} onPress={handleMessage}>
          <Ionicons name="chatbubble-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
        {tailor.phone && (
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <Ionicons name="call-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.bookButton} onPress={handleBook}>
          <Text style={styles.bookButtonText}>Book Appointment</Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.textMuted,
    marginTop: spacing.md
  },
  // Cover Photo
  coverContainer: {
    width: SCREEN_WIDTH,
    height: 180,
    overflow: 'hidden'
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  coverGradient: {
    width: '100%',
    height: '100%'
  },
  // Header
  header: {
    flexDirection: 'row',
    padding: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.white,
    marginTop: -40
  },
  avatarContainer: {
    position: 'relative'
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: colors.white
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1DA1F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center'
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  name: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs
  },
  availableDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981'
  },
  availableText: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    color: '#10B981'
  },
  username: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs
  },
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    flexWrap: 'wrap'
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: '500',
    color: colors.textPrimary
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border
  },
  section: {
    padding: spacing.md,
    backgroundColor: colors.white,
    marginTop: spacing.sm
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  bio: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    lineHeight: 22
  },
  infoCards: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm
  },
  infoCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.sm
  },
  infoText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center'
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  tag: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full
  },
  tagText: {
    fontSize: fontSize.sm,
    color: colors.primary
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginTop: spacing.sm
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  activeTab: {
    borderBottomColor: colors.primary
  },
  tabText: {
    fontSize: fontSize.base,
    color: colors.textMuted
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600'
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.sm
  },
  workCard: {
    width: '48%',
    margin: '1%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.sm
  },
  workImage: {
    width: '100%',
    height: 120
  },
  workTitle: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textPrimary,
    padding: spacing.sm,
    paddingBottom: 0
  },
  workPrice: {
    fontSize: fontSize.sm,
    color: colors.success,
    padding: spacing.sm,
    paddingTop: spacing.xs
  },
  reviewsList: {
    padding: spacing.md
  },
  reviewCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20
  },
  reviewerInfo: {
    flex: 1,
    marginLeft: spacing.sm
  },
  reviewerName: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary
  },
  reviewStars: {
    flexDirection: 'row',
    marginTop: spacing.xs
  },
  reviewDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted
  },
  reviewText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 20
  },
  responseContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.sm
  },
  responseLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.xs
  },
  responseText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    padding: spacing.xl
  },
  actionBar: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  bookButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50
  },
  bookButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: '600'
  }
});
