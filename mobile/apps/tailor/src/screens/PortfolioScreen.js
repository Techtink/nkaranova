import { useState, useEffect } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import { worksAPI, uploadFile } from '../../../../shared/services/api';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../../../shared/constants/theme';

export default function PortfolioScreen({ navigation }) {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWorks();
  }, []);

  const loadWorks = async () => {
    try {
      const response = await worksAPI.getMyWorks();
      setWorks(response.data.data);
    } catch (error) {
      console.error('Error loading works:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadWorks();
  };

  const handleAddWork = () => {
    navigation.navigate('AddWork');
  };

  const handleDeleteWork = (workId) => {
    Alert.alert(
      'Delete Work',
      'Are you sure you want to delete this portfolio item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await worksAPI.delete(workId);
              loadWorks();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete work');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return colors.success;
      case 'pending': return colors.warning;
      case 'rejected': return colors.error;
      default: return colors.textMuted;
    }
  };

  const WorkCard = ({ work }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => Alert.alert('Edit Work', 'Work editing will be available in a future update.')}
    >
      <Image
        source={{ uri: work.images?.[0] || 'https://via.placeholder.com/200' }}
        style={styles.cardImage}
      />
      <View style={styles.cardOverlay}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(work.approvalStatus) }]}>
          <Text style={styles.statusText}>{work.approvalStatus}</Text>
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.workTitle} numberOfLines={1}>{work.title}</Text>
        <Text style={styles.workCategory}>{work.category}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.workPrice}>
            {work.price?.amount ? `${work.price.currency || '$'}${work.price.amount}` : 'N/A'}
          </Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteWork(work._id)}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
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
      <FlatList
        data={works}
        keyExtractor={(item) => item._id}
        numColumns={2}
        renderItem={({ item }) => <WorkCard work={item} />}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="images-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No portfolio items</Text>
            <Text style={styles.emptyText}>
              Add your work to showcase your skills to customers
            </Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddWork}>
              <Ionicons name="add" size={20} color={colors.white} />
              <Text style={styles.addButtonText}>Add Your First Work</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {works.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleAddWork}>
          <Ionicons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
      )}
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
    padding: spacing.sm
  },
  row: {
    justifyContent: 'space-between'
  },
  card: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm
  },
  cardImage: {
    width: '100%',
    height: 150
  },
  cardOverlay: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full
  },
  statusText: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  cardContent: {
    padding: spacing.sm
  },
  workTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary
  },
  workCategory: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm
  },
  workPrice: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.success
  },
  deleteButton: {
    padding: spacing.xs
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xxl * 2
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    marginTop: spacing.xl
  },
  addButtonText: {
    color: colors.white,
    fontWeight: '600',
    marginLeft: spacing.sm
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg
  }
});
