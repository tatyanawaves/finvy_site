import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useReceipts } from '../hooks/useReceipts';
import { colors, chartColors, getTypeColor, getTypeLabel } from '../utils/colors';
import { InvestmentPlanQuiz } from '../components/InvestmentPlanQuiz';
import { AffiliateBanner } from '../components/AffiliateBanner';
import { INVEST_BANNER, AFFILIATE_LINKS } from '../config/affiliateLinks';
import { fetchAllMarketData, AllMarketData } from '../services/marketApiService';

const { width } = Dimensions.get('window');

// Заглушки инвестиционных рекомендаций (используются если нет данных с API)
const FALLBACK_RECOMMENDATIONS = [
  { symbol: 'HSBK', name: 'Halyk Bank', price: 401.88, change: 0.20, type: 'stock', currency: '₸', unit: '' },
  { symbol: 'BTC', name: 'Bitcoin', price: 97500, change: 1.3, type: 'crypto', currency: '$', unit: '' },
  { symbol: 'XAU', name: 'Золото', price: 985000, change: 0.66, type: 'metal', currency: '', unit: '₸/г' },
];

// Функция умного анализа экономии — учитывает все расходы
const analyzeSavings = (
  total: number, 
  luxury: number, 
  standard: number,
  categoryStats: Record<string, number>,
  currency: string
) => {
  // Анализируем по нескольким источникам экономии
  let potentialSavings = 0;
  const tips: string[] = [];

  // 1. Премиум-расходы — можно сократить на 30%
  if (luxury > 0) {
    potentialSavings += luxury * 0.3;
    tips.push(`Премиум-покупки: экономия до ${Math.round(luxury * 0.3)} ${currency}`);
  }

  // 2. Рестораны — можно сократить на 40% готовкой дома
  const restaurants = categoryStats['Рестораны'] || 0;
  if (restaurants > 0) {
    potentialSavings += restaurants * 0.4;
    tips.push(`Рестораны: готовка дома сэкономит до ${Math.round(restaurants * 0.4)} ${currency}`);
  }

  // 3. Продукты — оптимизация списка покупок экономит 10-15%
  const food = categoryStats['Продукты'] || 0;
  if (food > 0) {
    potentialSavings += food * 0.1;
    tips.push(`Продукты: список покупок сэкономит ~${Math.round(food * 0.1)} ${currency}`);
  }

  // 4. Развлечения — можно найти бесплатные альтернативы для 25%
  const entertainment = categoryStats['Развлечения'] || 0;
  if (entertainment > 0) {
    potentialSavings += entertainment * 0.25;
  }

  // 5. Стандартные расходы — поиск скидок и акций экономит 5-10%
  if (standard > 0 && potentialSavings === 0) {
    potentialSavings += standard * 0.08;
  }

  // Минимальная экономия — 5% от общих расходов
  if (potentialSavings < total * 0.05 && total > 0) {
    potentialSavings = total * 0.05;
  }

  potentialSavings = Math.round(potentialSavings);

  // Формируем рекомендацию
  let suggestion = '';
  if (potentialSavings > 50000) {
    suggestion = 'Отличный потенциал! Эту сумму можно инвестировать в ETF или акции крупных компаний.';
  } else if (potentialSavings > 20000) {
    suggestion = 'Хорошая сумма для старта. Рассмотрите накопительный счёт или облигации.';
  } else if (potentialSavings > 5000) {
    suggestion = 'Хорошее начало! Регулярные вклады формируют привычку экономить.';
  } else if (potentialSavings > 1000) {
    suggestion = 'Даже небольшая экономия важна — начните откладывать эту сумму каждый месяц.';
  } else if (total > 0) {
    suggestion = 'Ваши расходы достаточно оптимальны. Попробуйте искать акции и скидки.';
  } else {
    suggestion = 'Добавьте чеки для анализа расходов и поиска возможностей экономии.';
  }

  return { potentialSavings, suggestion, tips };
};

// Советы по категориям
const getCategoryTip = (category: string, percentage: number): string | null => {
  if (category === 'Продукты' && percentage > 40) {
    return 'Составляйте список покупок заранее — экономия до 15%';
  }
  if (category === 'Продукты' && percentage > 25) {
    return 'Сравнивайте цены и покупайте по акциям';
  }
  if (category === 'Развлечения' && percentage > 20) {
    return 'Рассмотрите бесплатные альтернативы';
  }
  if (category === 'Развлечения' && percentage > 10) {
    return 'Ищите скидки и промокоды';
  }
  if (category === 'Рестораны' && percentage > 15) {
    return 'Готовка дома 2-3 раза в неделю — большая экономия';
  }
  if (category === 'Рестораны' && percentage > 5) {
    return 'Берите обеды с собой — сэкономите до 40%';
  }
  if (category === 'Одежда' && percentage > 15) {
    return 'Планируйте покупки на сезонные распродажи';
  }
  if (category === 'Красота' && percentage > 10) {
    return 'Ищите аналоги — часто дешевле и не хуже';
  }
  if (category === 'Транспорт' && percentage > 20) {
    return 'Рассмотрите общественный транспорт или каршеринг';
  }
  if (category === 'Дом и быт' && percentage > 15) {
    return 'Покупайте хозтовары оптом — экономия до 20%';
  }
  return null;
};

export const AnalyticsScreen: React.FC = () => {
  const { receipts, totalSpent, categoryStats, typeStats, refreshReceipts } = useReceipts();
  const [showQuiz, setShowQuiz] = useState(false);
  const [marketData, setMarketData] = useState<AllMarketData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const currency = receipts[0]?.currency || '₸';

  // Загрузка реальных рыночных данных
  const loadMarketData = useCallback(async () => {
    try {
      const data = await fetchAllMarketData();
      setMarketData(data);
    } catch (error) {
      console.error('Error loading market data for analytics:', error);
    }
  }, []);

  useEffect(() => {
    loadMarketData();
  }, [loadMarketData]);

  // Инвестиционные рекомендации из реальных данных
  const investmentRecommendations = useMemo(() => {
    if (!marketData) return FALLBACK_RECOMMENDATIONS;

    const recommendations: typeof FALLBACK_RECOMMENDATIONS = [];

    // Halyk Bank из акций
    const hsbk = marketData.stocks.find(s => s.symbol === 'HSBK');
    if (hsbk) {
      recommendations.push({
        symbol: hsbk.symbol,
        name: hsbk.name,
        price: hsbk.price,
        change: hsbk.changePercent,
        type: 'stock',
        currency: '₸',
        unit: '',
      });
    }

    // Bitcoin из крипто
    const btc = marketData.crypto.find(c => c.symbol === 'BTC');
    if (btc) {
      recommendations.push({
        symbol: btc.symbol,
        name: btc.name,
        price: btc.price,
        change: btc.changePercent24h,
        type: 'crypto',
        currency: '$',
        unit: '',
      });
    }

    // Золото в тенге из металлов
    const goldKzt = marketData.metals.find(m => m.symbol === 'XAU/KZT');
    if (goldKzt) {
      recommendations.push({
        symbol: 'XAU',
        name: goldKzt.name,
        price: goldKzt.price,
        change: goldKzt.changePercent,
        type: 'metal',
        currency: '',
        unit: goldKzt.unit,
      });
    }

    return recommendations.length > 0 ? recommendations : FALLBACK_RECOMMENDATIONS;
  }, [marketData]);

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
  const standardTotal = typeStats['Standard'] || 0;
  const luxuryPercent = totalSpent > 0 ? (luxuryTotal / totalSpent) * 100 : 0;
  
  // Анализ экономии
  const savingsAnalysis = useMemo(() => 
    analyzeSavings(totalSpent, luxuryTotal, standardTotal, categoryStats, currency), 
    [totalSpent, luxuryTotal, standardTotal, categoryStats, currency]
  );
  
  // Категории с советами
  const categoriesWithTips = useMemo(() => 
    categoryData.map(cat => ({
      ...cat,
      percentage: (cat.value / totalSpent) * 100,
      tip: getCategoryTip(cat.name, (cat.value / totalSpent) * 100),
      isHigh: (cat.value / totalSpent) * 100 > 25
    })),
    [categoryData, totalSpent]
  );

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await Promise.all([refreshReceipts(), loadMarketData()]);
            setRefreshing(false);
          }}
          tintColor={colors.primary}
        />
      }
    >
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

      {/* Savings Opportunity Card */}
      <LinearGradient
        colors={['#10b981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.savingsCard}
      >
        <View style={styles.savingsHeader}>
          <View>
            <View style={styles.savingsLabel}>
              <Ionicons name="sparkles" size={16} color="#fbbf24" />
              <Text style={styles.savingsLabelText}>УМНЫЙ АНАЛИЗ</Text>
            </View>
            <Text style={styles.savingsTitle}>Потенциальная экономия</Text>
            <Text style={styles.savingsAmount}>
              {savingsAnalysis.potentialSavings.toFixed(0)} {currency}
              <Text style={styles.savingsMonth}>/мес</Text>
            </Text>
          </View>
          <View style={styles.savingsIcon}>
            <Ionicons name="cash-outline" size={36} color="rgba(255,255,255,0.3)" />
          </View>
        </View>
        <Text style={styles.savingsSuggestion}>{savingsAnalysis.suggestion}</Text>
      </LinearGradient>

      {/* Type Distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Распределение расходов</Text>
        <View style={styles.typeDistribution}>
          <View style={styles.typeCard}>
            <View style={[styles.typeIndicator, { backgroundColor: '#10b981' }]} />
            <Text style={styles.typeLabel}>Необходимое</Text>
            <Text style={styles.typeValue}>
              {((essentialTotal / totalSpent) * 100).toFixed(0)}%
            </Text>
            <Text style={styles.typeAmount}>{essentialTotal.toFixed(0)} {currency}</Text>
          </View>
          <View style={styles.typeCard}>
            <View style={[styles.typeIndicator, { backgroundColor: '#6366f1' }]} />
            <Text style={styles.typeLabel}>Стандартное</Text>
            <Text style={styles.typeValue}>
              {((standardTotal / totalSpent) * 100).toFixed(0)}%
            </Text>
            <Text style={styles.typeAmount}>{standardTotal.toFixed(0)} {currency}</Text>
          </View>
          <View style={styles.typeCard}>
            <View style={[styles.typeIndicator, { backgroundColor: luxuryPercent > 25 ? '#f59e0b' : '#ec4899' }]} />
            <Text style={styles.typeLabel}>Премиум</Text>
            <Text style={[styles.typeValue, luxuryPercent > 25 && { color: '#f59e0b' }]}>
              {luxuryPercent.toFixed(0)}%
            </Text>
            <Text style={styles.typeAmount}>{luxuryTotal.toFixed(0)} {currency}</Text>
          </View>
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
            <Text style={styles.alertTitle}>Высокие траты на премиум</Text>
            <Text style={styles.alertSubtitle}>
              {luxuryPercent.toFixed(0)}% расходов — премиальные покупки (рекомендуется &lt;20%)
            </Text>
          </View>
        </LinearGradient>
      )}

      {/* Category Breakdown with Tips */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="bulb-outline" size={20} color="#fbbf24" />
          <Text style={styles.sectionTitle}>Советы по категориям</Text>
        </View>
        {categoriesWithTips.slice(0, 6).map((cat, index) => (
          <View key={cat.name} style={[
            styles.barItem,
            cat.isHigh && styles.barItemHighlight
          ]}>
            <View style={styles.barHeader}>
              <View style={styles.barLabelRow}>
                <Text style={styles.barLabel}>{cat.name}</Text>
                {cat.isHigh && (
                  <Ionicons name="trending-up" size={14} color="#f59e0b" style={{ marginLeft: 6 }} />
                )}
              </View>
              <Text style={styles.barValue}>
                {cat.value.toFixed(0)} {currency} ({cat.percentage.toFixed(0)}%)
              </Text>
            </View>
            <View style={styles.barBackground}>
              <View 
                style={[
                  styles.barFill,
                  { 
                    width: `${(cat.value / maxCategoryValue) * 100}%`,
                    backgroundColor: cat.isHigh ? '#f59e0b' : chartColors[index % chartColors.length]
                  }
                ]} 
              />
            </View>
            {cat.tip && (
              <View style={styles.tipContainer}>
                <Ionicons name="bulb" size={12} color="#fbbf24" />
                <Text style={styles.tipText}>{cat.tip}</Text>
              </View>
            )}
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

      {/* Investment Recommendations */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="trending-up" size={20} color="#6366f1" />
          <Text style={styles.sectionTitle}>Куда инвестировать</Text>
        </View>
        <Text style={styles.investmentSubtitle}>
          Если сэкономите {savingsAnalysis.potentialSavings.toFixed(0)} {currency}/мес
        </Text>
        
        {investmentRecommendations.map((item, idx) => (
          <View key={item.symbol} style={styles.investmentItem}>
            <View style={styles.investmentLeft}>
              <View style={[
                styles.investmentIcon,
                { backgroundColor: item.type === 'stock' ? '#6366f120' : item.type === 'crypto' ? '#f5990b20' : '#10b98120' }
              ]}>
                <Ionicons 
                  name={item.type === 'stock' ? 'stats-chart' : item.type === 'crypto' ? 'logo-bitcoin' : 'diamond-outline'} 
                  size={18} 
                  color={item.type === 'stock' ? '#6366f1' : item.type === 'crypto' ? '#f59e0b' : '#10b981'} 
                />
              </View>
              <View>
                <Text style={styles.investmentSymbol}>{item.symbol}</Text>
                <Text style={styles.investmentName}>{item.name}</Text>
              </View>
            </View>
            <View style={styles.investmentRight}>
              <Text style={styles.investmentPrice}>
                {item.unit
                  ? `${item.price.toLocaleString('ru-RU')} ${item.unit}`
                  : `${item.currency}${item.price.toLocaleString('ru-RU')}`
                }
              </Text>
              <Text style={[styles.investmentChange, { color: item.change >= 0 ? '#10b981' : '#ef4444' }]}>
                {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
              </Text>
            </View>
          </View>
        ))}
        
        {/* Affiliate Banners */}
        <AffiliateBanner
          title={AFFILIATE_LINKS.stocks.cta}
          description={AFFILIATE_LINKS.stocks.description}
          url={AFFILIATE_LINKS.stocks.url}
          icon={AFFILIATE_LINKS.stocks.icon}
          gradientColors={AFFILIATE_LINKS.stocks.gradientColors}
          compact
        />
        <AffiliateBanner
          title={AFFILIATE_LINKS.crypto.cta}
          description={AFFILIATE_LINKS.crypto.description}
          url={AFFILIATE_LINKS.crypto.url}
          icon={AFFILIATE_LINKS.crypto.icon}
          gradientColors={AFFILIATE_LINKS.crypto.gradientColors}
          compact
        />

        <View style={styles.disclaimer}>
          <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
          <Text style={styles.disclaimerText}>
            Это не финансовая рекомендация. Проконсультируйтесь со специалистом.
          </Text>
        </View>
      </View>

      {/* CTA to Investment Quiz */}
      <TouchableOpacity onPress={() => setShowQuiz(true)} activeOpacity={0.8}>
        <LinearGradient
          colors={['#6366f1', '#8b5cf6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaCard}
        >
          <View style={styles.ctaContent}>
            <Ionicons name="analytics" size={24} color="white" />
            <View style={styles.ctaText}>
              <Text style={styles.ctaTitle}>🎯 Персональный план инвестиций</Text>
              <Text style={styles.ctaSubtitle}>Пройдите тест — узнайте куда инвестировать</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7)" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Investment Quiz Modal */}
      <InvestmentPlanQuiz
        visible={showQuiz}
        onClose={() => setShowQuiz(false)}
        currency={currency}
      />
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
  // Savings Card Styles
  savingsCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  savingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  savingsLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  savingsLabelText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  savingsTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '500',
  },
  savingsAmount: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 4,
  },
  savingsMonth: {
    fontSize: 16,
    fontWeight: 'normal',
    color: 'rgba(255,255,255,0.7)',
  },
  savingsIcon: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 16,
  },
  savingsSuggestion: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    marginTop: 16,
    lineHeight: 20,
  },
  // Type Distribution Styles
  typeDistribution: {
    flexDirection: 'row',
    gap: 8,
  },
  typeCard: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  typeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  typeLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: 4,
  },
  typeValue: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  typeAmount: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  // Bar Item Styles
  barItemHighlight: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  barLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingLeft: 4,
  },
  tipText: {
    color: '#fbbf24',
    fontSize: 12,
    flex: 1,
  },
  // Investment Styles
  investmentSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 16,
    marginTop: -8,
  },
  investmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  investmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  investmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  investmentSymbol: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  investmentName: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  investmentRight: {
    alignItems: 'flex-end',
  },
  investmentPrice: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  investmentChange: {
    fontSize: 12,
    marginTop: 2,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  disclaimerText: {
    color: colors.textMuted,
    fontSize: 11,
    flex: 1,
  },
  // CTA Styles
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  ctaText: {
    flex: 1,
  },
  ctaTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  ctaSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
});
