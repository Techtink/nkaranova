import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tailorsAPI } from '../../../../shared/services/api';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../../../shared/constants/theme';

const FAVORITES_KEY = '@favorite_tailors';

export default function FavoritesScreen({ navigation }) {
  const [favorites, setFavorites] = useState([]);
  const [tailors, setTailors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const saved = await AsyncStorage.getItem(FAVORITES_KEY);
      const favoriteIds = saved ? JSON.parse(saved) : [];
      setFavorites(favoriteIds);

      if (favoriteIds.length > 0) {
        // Fetch tailor details for each favorite
        const tailorPromises = favoriteIds.map(async (id) => {
          try {
            const response = await tailorsAPI.getById(id);
            return response.data.data;
          } catch (error) {
            console.error(`Error fetching tailor ${id}:`, error);
            return null;
          }
        });

        const tailorData = await Promise.all(tailorPromises);
        setTailors(tailorData.filter(t => t !== null));
      } else {
        setTailors([]);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFavorites();
  }, []);

  const removeFavorite = async (tailorId) => {
    Alert.alert(
      'Remove Favorite',
      'Are you sure you want to remove this tailor from your favorites?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const newFavorites = favorites.filter(id => id !== tailorId);
            setFavorites(newFavorites);
            setTailors(tailors.filter(t => t._id !== tailorId));
            await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
          }
        }
      ]
    );
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i < fullStars ? 'star' : 'star-outline'}
          size={14}
          color={colors.secondary}
        />
      );
    }
    return stars;
  };

  const TailorCard = ({ tailor }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('TailorProfile', { username: tailor.user?.username })}
    >
      <Image
        source={{ uri: tailor.user?.profilePhoto || 'https://via.placeholder.com/100' }}
        style={styles.avatar}
      />
      <View style={styles.cardContent}>
        <Text style={styles.name} numberOfLines={1}>{tailor.user?.name}</Text>
        <View style={styles.ratingRow}>
          <View style={styles.stars}>{renderStars(tailor.rating)}</View>
          <Text style={styles.ratingText}>
            {tailor.rating?.toFixed(1) || 'New'} ({tailor.reviewCount || 0})
          </Text>
        </View>
        <Text style={styles.specialties} numberOfLines={1}>
          {tailor.specialties?.slice(0, 3).join(' • ') || 'No specialties listed'}
        </Text>
        {tailor.priceRange && (
          <Text style={styles.price}>
            ₦{tailor.priceRange.min?.toLocaleString()} - ₦{tailor.priceRange.max?.toLocaleString()}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={() => removeFavorite(tailor._id)}
      >
        <Ionicons name="heart" size={24} color={colors.error} />
      </TouchableOpacity>
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
        data={tailors}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <TailorCard tailor={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Favorites Yet</Text>
            <Text style={styles.emptyText}>
              Browse tailors and tap the heart icon to add them to your favorites
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.navigate('Explore')}
            >
              <Text style={styles.browseButtonText}>Browse Tailors</Text>
            </TouchableOpacity>
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
  avatar: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.lg
  },
  cardContent: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center'
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
  stars: {
    flexDirection: 'row'
  },
  ratingText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginLeft: spacing.sm
  },
  specialties: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  price: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.success,
    marginTop: spacing.xs
  },
  favoriteButton: {
    justifyContent: 'center',
    paddingLeft: spacing.md
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.lg
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    marginTop: spacing.xl
  },
  browseButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: '600'
  }
});
