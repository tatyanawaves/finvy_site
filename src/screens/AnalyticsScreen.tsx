import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useReceipts } from '../hooks/useReceipts';
import { colors, chartColors, getTypeColor, getTypeLabel } from '../utils/colors';

const { width } = Dimensions.get('window');

export const AnalyticsScreen: React.FC = () => {
  const { receipts, totalSpent, categoryStats, typeStats } = useReceipts();

  const currency = receipts[0]?.currency || '₽';

  // Prepare category data sorted by value
  const categoryData = Object.entries(categoryStats)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const maxCategoryValue = categoryData[0]?.value || 1;

  // Type data
  const typeData = Object.entries(typeStats)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const totalTypeValue = typeData.reduce((sum, t) => sum + t.value, 0) || 1;

  // Average receipt
  const avgReceipt = receipts.length > 0 ? totalSpent / receipts.length : 0;

  // Total items count
  const totalItems = receipts.reduce(
    (sum, r) => sum + r.items_aggregated.length, 
    0
  );

  // Luxury vs Essential percentage
  const luxuryTotal = typeStats['Luxury'] || 0;
  const essentialTotal = typeStats['Essential'] || 0;
  const luxuryPercent = totalSpent > 0 ? (luxuryTotal / totalSpent) * 100 : 0;

  if (receipts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="bar-chart-outline" size={80} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>Нет данных</Text>
        <Text style={styles.emptySubtitle}>
          Добавьте чеки для просмотра аналитики
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Ionicons name="wallet-outline" size={24} color={colors.primary} />
          <Text style={styles.summaryValue}>
            {totalSpent.toFixed(0)} {currency}
          </Text>
          <Text style={styles.summaryLabel}>Всего потрачено</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="receipt-outline" size={24} color={colors.success} />
          <Text style={styles.summaryValue}>{receipts.length}</Text>
          <Text style={styles.summaryLabel}>Чеков</Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Ionicons name="pricetag-outline" size={24} color={colors.warning} />
          <Text style={styles.summaryValue}>{totalItems}</Text>
          <Text style={styles.summaryLabel}>Товаров</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="analytics-outline" size={24} color={colors.accent} />
          <Text style={styles.summaryValue}>
            {avgReceipt.toFixed(0)} {currency}
          </Text>
          <Text style={styles.summaryLabel}>Средний чек</Text>
        </View>
      </View>

      {/* Luxury Alert */}
      {luxuryPercent > 30 && (
        <LinearGradient
          colors={['#ec4899', '#8b5cf6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.alertCard}
        >
          <Ionicons name="warning" size={24} color="white" />
          <View style={styles.alertText}>
            <Text style={styles.alertTitle}>Высокие траты на роскошь</Text>
            <Text style={styles.alertSubtitle}>
              {luxuryPercent.toFixed(0)}% расходов — это роскошные покупки
            </Text>
          </View>
        </LinearGradient>
      )}

      {/* Category Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Расходы по категориям</Text>
        {categoryData.map((cat, index) => (
          <View key={cat.name} style={styles.barItem}>
            <View style={styles.barHeader}>
              <Text style={styles.barLabel}>{cat.name}</Text>
              <Text style={styles.barValue}>
                {cat.value.toFixed(0)} {currency}
              </Text>
            </View>
            <View style={styles.barBackground}>
              <View 
                style={[
                  styles.barFill,
                  { 
                    width: `${(cat.value / maxCategoryValue) * 100}%`,
                    backgroundColor: chartColors[index % chartColors.length]
                  }
                ]} 
              />
            </View>
          </View>
        ))}
      </View>

      {/* Type Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>По типу расходов</Text>
        <View style={styles.typeContainer}>
          {/* Type bar */}
          <View style={styles.typeBar}>
            {typeData.map((type, idx) => {
              const percent = (type.value / totalTypeValue) * 100;
              return (
                <View
                  key={type.name}
                  style={[
                    styles.typeSegment,
                    {
                      width: `${percent}%`,
                      backgroundColor: getTypeColor(type.name),
                    }
                  ]}
                />
              );
            })}
          </View>
          
          {/* Legend */}
          <View style={styles.typeLegend}>
            {typeData.map((type) => {
              const percent = (type.value / totalTypeValue) * 100;
              return (
                <View key={type.name} style={styles.legendItem}>
                  <View 
                    style={[
                      styles.legendDot,
                      { backgroundColor: getTypeColor(type.name) }
                    ]} 
                  />
                  <Text style={styles.legendText}>
                    {getTypeLabel(type.name)} ({percent.toFixed(0)}%)
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Top Merchants */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Топ магазинов</Text>
        {(() => {
          const merchantTotals: Record<string, number> = {};
          receipts.forEach(r => {
            merchantTotals[r.merchant] = (merchantTotals[r.merchant] || 0) + r.total_spent;
          });
          return Object.entries(merchantTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([merchant, total], idx) => (
              <View key={merchant} style={styles.merchantItem}>
                <View style={styles.merchantRank}>
                  <Text style={styles.merchantRankText}>{idx + 1}</Text>
                </View>
                <Text style={styles.merchantName}>{merchant}</Text>
                <Text style={styles.merchantTotal}>
                  {total.toFixed(0)} {currency}
                </Text>
              </View>
            ));
        })()}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 12,
    gap: 12,
  },
  alertText: {
    flex: 1,
  },
  alertTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  alertSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  barItem: {
    marginBottom: 16,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  barLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  barValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  barBackground: {
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  typeContainer: {
    gap: 16,
  },
  typeBar: {
    flexDirection: 'row',
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  typeSegment: {
    height: '100%',
  },
  typeLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  merchantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  merchantRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  merchantRankText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  merchantName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
  },
  merchantTotal: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
});
