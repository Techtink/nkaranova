import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tailorsAPI, worksAPI } from '../../../../shared/services/api';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../../../shared/constants/theme';

export default function HomeScreen({ navigation }) {
  const [featuredTailors, setFeaturedTailors] = useState([]);
  const [featuredWorks, setFeaturedWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tailorsRes, worksRes] = await Promise.all([
        tailorsAPI.getFeatured(),
        worksAPI.getFeatured()
      ]);
      setFeaturedTailors(tailorsRes.data.data);
      setFeaturedWorks(worksRes.data.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSearch = () => {
    navigation.navigate('TailorsList', { search: searchQuery });
  };

  const TailorCard = ({ tailor }) => (
    <TouchableOpacity
      style={styles.tailorCard}
      onPress={() => navigation.navigate('TailorProfile', { username: tailor.user.username })}
    >
      <Image
        source={{ uri: tailor.user.profilePhoto || 'https://via.placeholder.com/100' }}
        style={styles.tailorImage}
      />
      <Text style={styles.tailorName} numberOfLines={1}>{tailor.user.name}</Text>
      <View style={styles.ratingContainer}>
        <Ionicons name="star" size={14} color={colors.secondary} />
        <Text style={styles.rating}>{tailor.rating?.toFixed(1) || 'New'}</Text>
      </View>
      <Text style={styles.specialties} numberOfLines={1}>
        {tailor.specialties?.slice(0, 2).join(', ')}
      </Text>
    </TouchableOpacity>
  );

  const WorkCard = ({ work }) => (
    <TouchableOpacity
      style={styles.workCard}
      onPress={() => navigation.navigate('TailorProfile', { username: work.tailor?.user?.username })}
    >
      <Image
        source={{ uri: work.images?.[0] || 'https://via.placeholder.com/200' }}
        style={styles.workImage}
      />
      <View style={styles.workOverlay}>
        <Text style={styles.workTitle} numberOfLines={1}>{work.title}</Text>
        <Text style={styles.workCategory}>{work.category}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={[]}
        renderItem={null}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color={colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Find a tailor..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
              </View>
            </View>

            {/* Featured Tailors */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Featured Tailors</Text>
                <TouchableOpacity onPress={() => navigation.navigate('TailorsList')}>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={featuredTailors}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => <TailorCard tailor={item} />}
                contentContainerStyle={styles.horizontalList}
              />
            </View>

            {/* Featured Works */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Popular Designs</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Gallery')}>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={featuredWorks}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => <WorkCard work={item} />}
                contentContainerStyle={styles.horizontalList}
              />
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('TailorsList')}
              >
                <Ionicons name="search-outline" size={32} color={colors.primary} />
                <Text style={styles.actionTitle}>Browse Tailors</Text>
                <Text style={styles.actionDesc}>Find your perfect match</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('Gallery')}
              >
                <Ionicons name="images-outline" size={32} color={colors.primary} />
                <Text style={styles.actionTitle}>Explore Gallery</Text>
                <Text style={styles.actionDesc}>Get inspired</Text>
              </TouchableOpacity>
            </View>
          </>
        }
      />
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
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.primary
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: fontSize.base
  },
  section: {
    marginTop: spacing.lg
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary
  },
  seeAll: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '500'
  },
  horizontalList: {
    paddingHorizontal: spacing.md
  },
  tailorCard: {
    width: 140,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.md,
    alignItems: 'center',
    ...shadows.md
  },
  tailorImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: spacing.sm
  },
  tailorName: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center'
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs
  },
  rating: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginLeft: spacing.xs
  },
  specialties: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center'
  },
  workCard: {
    width: 200,
    height: 150,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginRight: spacing.md,
    ...shadows.md
  },
  workImage: {
    width: '100%',
    height: '100%'
  },
  workOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  workTitle: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '600'
  },
  workCategory: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSize.xs
  },
  quickActions: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
    marginTop: spacing.lg
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.sm
  },
  actionTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.sm
  },
  actionDesc: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs
  }
});
