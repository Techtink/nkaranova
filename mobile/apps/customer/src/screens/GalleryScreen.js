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
  Dimensions,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { worksAPI } from '../../../../shared/services/api';
import { colors, spacing, fontSize, borderRadius } from '../../../../shared/constants/theme';

const { width } = Dimensions.get('window');
const imageSize = (width - spacing.sm * 4) / 3;

export default function GalleryScreen({ navigation }) {
  const [works, setWorks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedWork, setSelectedWork] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadWorks(true);
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const response = await worksAPI.getCategories();
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadWorks = async (reset = false) => {
    if (!hasMore && !reset) return;

    try {
      const currentPage = reset ? 1 : page;
      const params = {
        page: currentPage,
        limit: 30,
        approvalStatus: 'approved'
      };
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }

      const response = await worksAPI.getAll(params);
      const newWorks = response.data.data;

      setWorks(reset ? newWorks : [...works, ...newWorks]);
      setHasMore(newWorks.length === 30);
      setPage(currentPage + 1);
    } catch (error) {
      console.error('Error loading works:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setHasMore(true);
    loadWorks(true);
  };

  const CategoryFilter = () => (
    <View style={styles.filterContainer}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[{ _id: 'all', name: 'All' }, ...categories]}
        keyExtractor={(item) => item._id || item.name}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedCategory === (item._id || item.name) && styles.filterChipActive
            ]}
            onPress={() => {
              setSelectedCategory(item._id || item.name);
              setHasMore(true);
            }}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCategory === (item._id || item.name) && styles.filterChipTextActive
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.filterList}
      />
    </View>
  );

  const WorkItem = ({ item }) => (
    <TouchableOpacity
      style={styles.workItem}
      onPress={() => setSelectedWork(item)}
    >
      <Image
        source={{ uri: item.images?.[0] || 'https://via.placeholder.com/150' }}
        style={styles.workImage}
      />
    </TouchableOpacity>
  );

  const WorkModal = () => (
    <Modal
      visible={!!selectedWork}
      transparent
      animationType="fade"
      onRequestClose={() => setSelectedWork(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setSelectedWork(null)}
          >
            <Ionicons name="close" size={24} color={colors.white} />
          </TouchableOpacity>

          <Image
            source={{ uri: selectedWork?.images?.[0] || 'https://via.placeholder.com/300' }}
            style={styles.modalImage}
            resizeMode="contain"
          />

          <View style={styles.modalInfo}>
            <Text style={styles.modalTitle}>{selectedWork?.title}</Text>
            <Text style={styles.modalCategory}>{selectedWork?.category}</Text>
            {selectedWork?.description && (
              <Text style={styles.modalDescription}>{selectedWork.description}</Text>
            )}
            {selectedWork?.price && (
              <Text style={styles.modalPrice}>${selectedWork.price}</Text>
            )}

            <TouchableOpacity
              style={styles.viewTailorButton}
              onPress={() => {
                setSelectedWork(null);
                navigation.navigate('TailorProfile', {
                  username: selectedWork?.tailor?.user?.username
                });
              }}
            >
              <Image
                source={{ uri: selectedWork?.tailor?.user?.profilePhoto || 'https://via.placeholder.com/40' }}
                style={styles.tailorAvatar}
              />
              <View style={styles.tailorInfo}>
                <Text style={styles.tailorName}>{selectedWork?.tailor?.user?.name}</Text>
                <Text style={styles.viewProfile}>View Profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading && !works.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CategoryFilter />

      <FlatList
        data={works}
        keyExtractor={(item) => item._id}
        numColumns={3}
        renderItem={WorkItem}
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={() => loadWorks()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && hasMore ? (
            <ActivityIndicator style={styles.footer} color={colors.primary} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>No works found</Text>
            <Text style={styles.emptySubtext}>
              {selectedCategory !== 'all'
                ? 'Try selecting a different category'
                : 'Check back later for new designs'}
            </Text>
          </View>
        }
      />

      <WorkModal />
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
  filterContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  filterList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgSecondary,
    marginRight: spacing.sm
  },
  filterChipActive: {
    backgroundColor: colors.primary
  },
  filterChipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary
  },
  filterChipTextActive: {
    color: colors.white,
    fontWeight: '600'
  },
  grid: {
    padding: spacing.sm
  },
  workItem: {
    margin: spacing.xs,
    borderRadius: borderRadius.sm,
    overflow: 'hidden'
  },
  workImage: {
    width: imageSize,
    height: imageSize,
    backgroundColor: colors.bgTertiary
  },
  footer: {
    padding: spacing.md
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xxl * 2
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    marginTop: spacing.md
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center'
  },
  modalContent: {
    flex: 1
  },
  modalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalImage: {
    width: '100%',
    height: '60%'
  },
  modalInfo: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary
  },
  modalCategory: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginTop: spacing.xs
  },
  modalDescription: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 22
  },
  modalPrice: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.success,
    marginTop: spacing.sm
  },
  viewTailorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg
  },
  tailorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22
  },
  tailorInfo: {
    flex: 1,
    marginLeft: spacing.md
  },
  tailorName: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary
  },
  viewProfile: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginTop: spacing.xs
  }
});
