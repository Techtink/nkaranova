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
import { tailorsAPI } from '../../../../shared/services/api';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../../../shared/constants/theme';

export default function TailorsListScreen({ route, navigation }) {
  const [tailors, setTailors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState(route.params?.search || '');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadTailors(true);
  }, [search]);

  const loadTailors = async (reset = false) => {
    if (!hasMore && !reset) return;

    try {
      const currentPage = reset ? 1 : page;
      const response = await tailorsAPI.getAll({
        page: currentPage,
        limit: 10,
        search: search || undefined
      });

      const newTailors = response.data.data;
      setTailors(reset ? newTailors : [...tailors, ...newTailors]);
      setHasMore(newTailors.length === 10);
      setPage(currentPage + 1);
    } catch (error) {
      console.error('Error loading tailors:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setHasMore(true);
    loadTailors(true);
  };

  const TailorCard = ({ tailor }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('TailorProfile', { username: tailor.user.username })}
    >
      <Image
        source={{ uri: tailor.user.profilePhoto || 'https://via.placeholder.com/100' }}
        style={styles.image}
      />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{tailor.user.name}</Text>
          {tailor.isVerified && (
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
          )}
        </View>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color={colors.secondary} />
          <Text style={styles.rating}>
            {tailor.rating?.toFixed(1) || 'New'} ({tailor.reviewCount || 0} reviews)
          </Text>
        </View>
        <Text style={styles.specialties} numberOfLines={1}>
          {tailor.specialties?.join(', ') || 'General Tailoring'}
        </Text>
        <Text style={styles.location} numberOfLines={1}>
          <Ionicons name="location-outline" size={12} color={colors.textMuted} />
          {' '}{tailor.location?.city || 'Location not specified'}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>
            From ${tailor.priceRange?.min || 0}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !tailors.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tailors..."
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        data={tailors}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <TailorCard tailor={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={() => loadTailors()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && hasMore ? (
            <ActivityIndicator style={styles.footer} color={colors.primary} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No tailors found</Text>
          </View>
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
    backgroundColor: colors.white
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: fontSize.base
  },
  list: {
    padding: spacing.md
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md
  },
  info: {
    flex: 1,
    marginLeft: spacing.md
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  name: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs
  },
  rating: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs
  },
  specialties: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginTop: spacing.xs
  },
  location: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs
  },
  priceRow: {
    marginTop: spacing.sm
  },
  price: {
    fontSize: fontSize.sm,
    color: colors.success,
    fontWeight: '600'
  },
  footer: {
    padding: spacing.md
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xxl
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    marginTop: spacing.md
  }
});
