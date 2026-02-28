import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { AffiliateBanner } from '../components/AffiliateBanner';
import { AFFILIATE_LINKS } from '../config/affiliateLinks';
import { 
  fetchAllMarketData, 
  isApiConfigured,
  StockQuote,
  CryptoQuote,
  MetalQuote,
  CurrencyQuote,
  AllMarketData 
} from '../services/marketApiService';

type MarketTab = 'stocks' | 'crypto' | 'metals' | 'currencies';

// Заглушки с актуальными данными
const STOCKS_DATA = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 182.52, change: 1.23, changePercent: 0.68 },
  { symbol: 'MSFT', name: 'Microsoft', price: 415.80, change: -2.15, changePercent: -0.51 },
  { symbol: 'GOOGL', name: 'Alphabet', price: 141.25, change: 0.89, changePercent: 0.63 },
  { symbol: 'AMZN', name: 'Amazon', price: 178.90, change: 3.45, changePercent: 1.97 },
  { symbol: 'NVDA', name: 'NVIDIA', price: 878.35, change: 12.50, changePercent: 1.44 },
  { symbol: 'TSLA', name: 'Tesla', price: 248.50, change: -5.20, changePercent: -2.05 },
  { symbol: 'META', name: 'Meta Platforms', price: 485.20, change: 8.30, changePercent: 1.74 },
  { symbol: 'KZTO', name: 'КазТрансОйл', price: 1850.00, change: 25.00, changePercent: 1.37, currency: '₸' },
  { symbol: 'HSBK', name: 'Halyk Bank', price: 172.50, change: 2.30, changePercent: 1.35, currency: '₸' },
  { symbol: 'KEGC', name: 'КазМунайГаз', price: 32500.00, change: 450.00, changePercent: 1.40, currency: '₸' },
];

const CRYPTO_DATA = [
  { symbol: 'BTC', name: 'Bitcoin', price: 97500.00, change: 1250.00, changePercent: 1.30 },
  { symbol: 'ETH', name: 'Ethereum', price: 3420.50, change: -45.30, changePercent: -1.31 },
  { symbol: 'BNB', name: 'BNB', price: 645.80, change: 12.40, changePercent: 1.96 },
  { symbol: 'SOL', name: 'Solana', price: 198.25, change: 8.50, changePercent: 4.48 },
  { symbol: 'XRP', name: 'Ripple', price: 2.85, change: 0.12, changePercent: 4.40 },
  { symbol: 'ADA', name: 'Cardano', price: 0.98, change: 0.03, changePercent: 3.16 },
  { symbol: 'DOGE', name: 'Dogecoin', price: 0.32, change: -0.01, changePercent: -3.03 },
  { symbol: 'TON', name: 'Toncoin', price: 5.85, change: 0.25, changePercent: 4.46 },
];

const METALS_DATA = [
  { symbol: 'XAU', name: 'Золото', price: 2045.30, change: 12.50, changePercent: 0.62, unit: '$/oz' },
  { symbol: 'XAG', name: 'Серебро', price: 23.15, change: 0.35, changePercent: 1.54, unit: '$/oz' },
  { symbol: 'XPT', name: 'Платина', price: 925.40, change: -8.20, changePercent: -0.88, unit: '$/oz' },
  { symbol: 'XPD', name: 'Палладий', price: 985.60, change: 15.30, changePercent: 1.58, unit: '$/oz' },
  { symbol: 'XAU/KZT', name: 'Золото (₸)', price: 985000.00, change: 6500.00, changePercent: 0.66, unit: '₸/г' },
  { symbol: 'XAG/KZT', name: 'Серебро (₸)', price: 11300.00, change: 175.00, changePercent: 1.55, unit: '₸/г' },
];

const CURRENCIES_DATA = [
  { symbol: 'USD/KZT', name: 'Доллар США', price: 501.24, change: 0.50, changePercent: 0.10, currency: '₸', flag: '🇺🇸' },
  { symbol: 'EUR/KZT', name: 'Евро', price: 528.50, change: -1.20, changePercent: -0.23, currency: '₸', flag: '🇪🇺' },
  { symbol: 'RUB/KZT', name: 'Российский рубль', price: 5.12, change: 0.03, changePercent: 0.59, currency: '₸', flag: '🇷🇺' },
  { symbol: 'GBP/KZT', name: 'Фунт стерлингов', price: 632.80, change: 2.10, changePercent: 0.33, currency: '₸', flag: '🇬🇧' },
  { symbol: 'CNY/KZT', name: 'Китайский юань', price: 68.95, change: -0.15, changePercent: -0.22, currency: '₸', flag: '🇨🇳' },
  { symbol: 'TRY/KZT', name: 'Турецкая лира', price: 14.20, change: 0.05, changePercent: 0.35, currency: '₸', flag: '🇹🇷' },
  { symbol: 'UZS/KZT', name: 'Узбекский сум', price: 0.038, change: 0, changePercent: 0, currency: '₸', flag: '🇺🇿' },
  { symbol: 'KGS/KZT', name: 'Кыргызский сом', price: 5.72, change: -0.02, changePercent: -0.35, currency: '₸', flag: '🇰🇬' },
];

interface MarketItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency?: string;
  unit?: string;
}

export const MarketsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MarketTab>('stocks');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString('ru-RU'));
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [liveData, setLiveData] = useState<AllMarketData | null>(null);

  // Загрузка реальных данных
  const loadMarketData = useCallback(async () => {
    try {
      const data = await fetchAllMarketData();
      setLiveData(data);
      setIsLive(data.isLive);
      setLastUpdate(new Date().toLocaleTimeString('ru-RU'));
    } catch (error) {
      console.error('Error loading market data:', error);
      setIsLive(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMarketData();
    // Обновление каждые 60 секунд
    const interval = setInterval(loadMarketData, 60000);
    return () => clearInterval(interval);
  }, [loadMarketData]);

  const tabs: { id: MarketTab; label: string; icon: string }[] = [
    { id: 'stocks', label: 'Акции', icon: 'stats-chart' },
    { id: 'crypto', label: 'Крипто', icon: 'logo-bitcoin' },
    { id: 'metals', label: 'Металлы', icon: 'diamond' },
    { id: 'currencies', label: 'Валюты', icon: 'cash' },
  ];

  // Конвертеры из API формата в MarketItem
  const stockToMarketItem = (stock: StockQuote): MarketItem => ({
    symbol: stock.symbol,
    name: stock.name,
    price: stock.price,
    change: stock.change,
    changePercent: stock.changePercent,
    currency: stock.currency,
  });

  const cryptoToMarketItem = (crypto: CryptoQuote): MarketItem => ({
    symbol: crypto.symbol,
    name: crypto.name,
    price: crypto.price,
    change: crypto.change24h,
    changePercent: crypto.changePercent24h,
  });

  const metalToMarketItem = (metal: MetalQuote): MarketItem => ({
    symbol: metal.symbol,
    name: metal.name,
    price: metal.price,
    change: metal.change,
    changePercent: metal.changePercent,
    unit: metal.unit,
  });

  const currencyToMarketItem = (curr: CurrencyQuote): MarketItem => ({
    symbol: curr.symbol,
    name: `${curr.flag} ${curr.name}`,
    price: curr.rate,
    change: curr.change,
    changePercent: curr.changePercent,
    currency: '₸',
  });

  const getData = (): MarketItem[] => {
    // Используем живые данные если доступны
    if (liveData && liveData.stocks.length > 0) {
      switch (activeTab) {
        case 'stocks': 
          return liveData.stocks.length > 0 
            ? liveData.stocks.map(stockToMarketItem) 
            : STOCKS_DATA;
        case 'crypto': 
          return liveData.crypto.length > 0 
            ? liveData.crypto.map(cryptoToMarketItem) 
            : CRYPTO_DATA;
        case 'metals': 
          return liveData.metals.length > 0 
            ? liveData.metals.map(metalToMarketItem) 
            : METALS_DATA;
        case 'currencies':
          return liveData.currencies && liveData.currencies.length > 0
            ? liveData.currencies.map(currencyToMarketItem)
            : CURRENCIES_DATA;
      }
    }
    
    // Fallback на mock данные
    switch (activeTab) {
      case 'stocks': return STOCKS_DATA;
      case 'crypto': return CRYPTO_DATA;
      case 'metals': return METALS_DATA;
      case 'currencies': return CURRENCIES_DATA;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMarketData();
    setRefreshing(false);
  };

  const formatPrice = (item: MarketItem) => {
    const currency = item.currency || '$';
    if (item.unit) return `${item.price.toLocaleString('ru-RU')} ${item.unit}`;
    // Для тенге — сумма перед символом (1 850 ₸), для $ — символ перед суммой ($1,850)
    if (currency === '₸') {
      if (item.price >= 1000) return `${item.price.toLocaleString('ru-RU')} ₸`;
      return `${item.price.toFixed(2)} ₸`;
    }
    if (item.price >= 1000) return `${currency}${item.price.toLocaleString('ru-RU')}`;
    if (item.price >= 1) return `${currency}${item.price.toFixed(2)}`;
    return `${currency}${item.price.toFixed(4)}`;
  };

  const getTabColor = (tab: MarketTab) => {
    switch (tab) {
      case 'stocks': return colors.primary;
      case 'crypto': return '#f59e0b';
      case 'metals': return '#eab308';
      case 'currencies': return '#10b981';
    }
  };

  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={[
          styles.liveIndicator,
          { backgroundColor: isLive ? '#10b98130' : '#64748b30' }
        ]}>
          <Ionicons 
            name={isLive ? 'wifi' : 'wifi-outline'} 
            size={12} 
            color={isLive ? '#10b981' : '#64748b'} 
          />
          <Text style={[
            styles.liveText,
            { color: isLive ? '#10b981' : '#64748b' }
          ]}>
            {isLive ? 'Live' : 'Demo'}
          </Text>
        </View>
        <Text style={styles.updateTime}>
          Обновлено: {lastUpdate}
        </Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && { backgroundColor: getTabColor(tab.id) }
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.tabTextActive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderColor: colors.success }]}>
            <Ionicons name="trending-up" size={20} color={colors.success} />
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {getData().filter(i => i.change > 0).length}
            </Text>
            <Text style={styles.summaryLabel}>Растут</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: colors.error }]}>
            <Ionicons name="trending-down" size={20} color={colors.error} />
            <Text style={[styles.summaryValue, { color: colors.error }]}>
              {getData().filter(i => i.change < 0).length}
            </Text>
            <Text style={styles.summaryLabel}>Падают</Text>
          </View>
        </View>

        {/* Update time */}
        <View style={styles.updateRow}>
          <Ionicons name="time-outline" size={14} color={colors.textMuted} />
          <Text style={styles.updateText}>Обновлено: {lastUpdate}</Text>
        </View>

        {/* Market List */}
        <View style={styles.listContainer}>
          {getData().map((item) => (
            <View key={item.symbol} style={styles.listItem}>
              <View style={[styles.symbolBadge, { backgroundColor: getTabColor(activeTab) + '20' }]}>
                <Text style={[styles.symbolText, { color: getTabColor(activeTab) }]}>
                  {item.symbol.slice(0, 2)}
                </Text>
              </View>
              
              <View style={styles.itemInfo}>
                <Text style={styles.itemSymbol}>{item.symbol}</Text>
                <Text style={styles.itemName}>{item.name}</Text>
              </View>
              
              <View style={styles.itemPrice}>
                <Text style={styles.priceText}>{formatPrice(item)}</Text>
                <View style={[
                  styles.changeContainer,
                  { backgroundColor: item.change >= 0 ? colors.success + '20' : colors.error + '20' }
                ]}>
                  <Ionicons 
                    name={item.change >= 0 ? 'trending-up' : 'trending-down'} 
                    size={12} 
                    color={item.change >= 0 ? colors.success : colors.error} 
                  />
                  <Text style={[
                    styles.changeText,
                    { color: item.change >= 0 ? colors.success : colors.error }
                  ]}>
                    {item.change >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Affiliate Banner */}
        {AFFILIATE_LINKS[activeTab] && (
          <AffiliateBanner
            title={AFFILIATE_LINKS[activeTab].cta}
            description={AFFILIATE_LINKS[activeTab].description}
            url={AFFILIATE_LINKS[activeTab].url}
            icon={AFFILIATE_LINKS[activeTab].icon}
            gradientColors={AFFILIATE_LINKS[activeTab].gradientColors}
          />
        )}

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          Данные носят информационный характер
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '600',
  },
  updateTime: {
    fontSize: 11,
    color: colors.textMuted,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: 'white',
  },
  scrollContent: {
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  updateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  updateText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  listContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  symbolBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  symbolText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemSymbol: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  itemName: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemPrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  disclaimer: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 20,
    marginBottom: 10,
  },
});
