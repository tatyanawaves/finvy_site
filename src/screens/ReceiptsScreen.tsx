import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useReceipts } from '../hooks/useReceipts';
import { colors, getTypeColor, getTypeLabel } from '../utils/colors';
import { FirestoreReceipt } from '../types';

export const ReceiptsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { receipts, loading, totalSpent, refreshReceipts, removeReceipt } = useReceipts();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshReceipts();
    setRefreshing(false);
  };

  const handleDelete = (receipt: FirestoreReceipt) => {
    Alert.alert(
      'Удалить чек?',
      `Чек от "${receipt.merchant}" будет удалён`,
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Удалить', 
          style: 'destructive',
          onPress: async () => {
            if (receipt.id) {
              await removeReceipt(receipt.id);
            }
          }
        },
      ]
    );
  };

  const currency = receipts[0]?.currency || '₸';

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Загрузка чеков...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header Stats */}
        <LinearGradient
          colors={colors.gradientPrimary as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statsCard}
        >
          <View>
            <Text style={styles.statsLabel}>Общие расходы</Text>
            <Text style={styles.statsValue}>
              {totalSpent.toFixed(2)} {currency}
            </Text>
            <Text style={styles.statsSubtext}>
              {receipts.length} {receipts.length === 1 ? 'чек' : 'чеков'}
            </Text>
          </View>
          <Ionicons name="receipt" size={60} color="rgba(255,255,255,0.2)" />
        </LinearGradient>

        {/* Add Receipt Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('Camera')}
          activeOpacity={0.8}
        >
          <View style={styles.addButtonIcon}>
            <Ionicons name="add" size={32} color={colors.primary} />
          </View>
          <View style={styles.addButtonText}>
            <Text style={styles.addButtonTitle}>Добавить чек</Text>
            <Text style={styles.addButtonSubtitle}>
              Сфотографируйте или загрузите
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Receipts List */}
        {receipts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Нет чеков</Text>
            <Text style={styles.emptySubtitle}>
              Добавьте первый чек для анализа расходов
            </Text>
          </View>
        ) : (
          <View style={styles.receiptsList}>
            <Text style={styles.sectionTitle}>История покупок</Text>
            {receipts.map((receipt) => (
              <TouchableOpacity
                key={receipt.id}
                style={styles.receiptCard}
                onLongPress={() => handleDelete(receipt)}
                activeOpacity={0.7}
              >
                <View style={styles.receiptHeader}>
                  <View>
                    <Text style={styles.receiptMerchant}>{receipt.merchant}</Text>
                    <Text style={styles.receiptDate}>{receipt.date}</Text>
                  </View>
                  <View style={styles.receiptTotal}>
                    <Text style={styles.receiptAmount}>
                      {receipt.total_spent.toFixed(2)} {receipt.currency}
                    </Text>
                  </View>
                </View>

                <View style={styles.receiptItems}>
                  {receipt.items_aggregated.slice(0, 3).map((item, idx) => (
                    <View key={idx} style={styles.receiptItem}>
                      <Text style={styles.itemName}>
                        {item.name}
                      </Text>
                      <View style={[
                        styles.itemType,
                        { borderColor: getTypeColor(item.type) }
                      ]}>
                        <Text style={[
                          styles.itemTypeText,
                          { color: getTypeColor(item.type) }
                        ]}>
                          {getTypeLabel(item.type)}
                        </Text>
                      </View>
                    </View>
                  ))}
                  {receipt.items_aggregated.length > 3 && (
                    <Text style={styles.moreItems}>
                      +{receipt.items_aggregated.length - 3} ещё
                    </Text>
                  )}
                </View>

                <View style={styles.receiptFooter}>
                  <Text style={styles.receiptHabit}>
                    "{receipt.consumption_summary.top_habit}"
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    color: colors.textSecondary,
    fontSize: 16,
  },
  scrollContent: {
    padding: 16,
  },
  statsCard: {
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statsLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  statsValue: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statsSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  addButtonIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    flex: 1,
    marginLeft: 16,
  },
  addButtonTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  addButtonSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  receiptsList: {
    marginBottom: 20,
  },
  receiptCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  receiptMerchant: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  receiptDate: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  receiptTotal: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  receiptAmount: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  receiptItems: {
    marginBottom: 12,
  },
  receiptItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    color: colors.textSecondary,
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  itemType: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  itemTypeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  moreItems: {
    color: colors.primary,
    fontSize: 13,
    fontStyle: 'italic',
  },
  receiptFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  receiptHabit: {
    color: colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
});
