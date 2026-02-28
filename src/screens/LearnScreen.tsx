import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';

type Category = 'overview' | 'basics' | 'crypto' | 'stocks' | 'metals' | 'portfolio';

interface Article {
  id: string;
  title: string;
  description: string;
  readTime: string;
  content: string[];
  tips?: string[];
}

interface CategoryData {
  id: Category;
  title: string;
  description: string;
  icon: string;
  color: string;
  articles: Article[];
}

const CATEGORIES: CategoryData[] = [
  {
    id: 'basics',
    title: 'Финансовая грамотность',
    description: 'Основы управления финансами',
    icon: 'school',
    color: '#3b82f6',
    articles: [
      {
        id: 'basics-1',
        title: 'Что такое финансовая грамотность?',
        description: 'Базовые понятия и почему это важно',
        readTime: '5 мин',
        content: [
          'Финансовая грамотность — это совокупность знаний и навыков, которые позволяют принимать обоснованные решения о деньгах.',
          'Она включает понимание того, как работают деньги, как их сберегать и инвестировать.',
          'Финансово грамотный человек умеет составлять бюджет и понимает основы инвестирования.',
        ],
        tips: ['Начните вести учёт расходов', 'Откладывайте 10% от дохода', 'Создайте подушку на 3-6 месяцев'],
      },
      {
        id: 'basics-2',
        title: 'Метод бюджетирования 50/30/20',
        description: 'Простая система распределения доходов',
        readTime: '7 мин',
        content: [
          '50% — на необходимые расходы: жильё, еда, транспорт.',
          '30% — на желания: развлечения, рестораны, хобби.',
          '20% — на сбережения и инвестиции.',
        ],
        tips: ['Автоматизируйте сбережения', 'Отслеживайте расходы', 'Пересматривайте бюджет ежемесячно'],
      },
    ],
  },
  {
    id: 'crypto',
    title: 'Криптовалюты',
    description: 'Покупка и хранение крипты',
    icon: 'logo-bitcoin',
    color: '#f59e0b',
    articles: [
      {
        id: 'crypto-1',
        title: 'Что такое криптовалюта?',
        description: 'Основы блокчейна и цифровых активов',
        readTime: '8 мин',
        content: [
          'Криптовалюта — цифровой актив на основе криптографии.',
          'Bitcoin — первая криптовалюта, созданная в 2009 году.',
          'Ethereum — вторая по капитализации, поддерживает смарт-контракты.',
        ],
        tips: ['Инвестируйте только свободные деньги', 'Изучите проект перед покупкой', 'Диверсифицируйте'],
      },
      {
        id: 'crypto-2',
        title: 'Как купить криптовалюту?',
        description: 'Пошаговая инструкция',
        readTime: '10 мин',
        content: [
          'Выберите биржу: Binance, Bybit, OKX.',
          'Пройдите верификацию (KYC).',
          'Пополните счёт и купите крипту.',
          'Переведите на холодный кошелёк для хранения.',
        ],
        tips: ['Используйте 2FA', 'Храните seed-фразу офлайн', 'Не передавайте ключи'],
      },
    ],
  },
  {
    id: 'stocks',
    title: 'Акции',
    description: 'Инвестирование в фондовый рынок',
    icon: 'stats-chart',
    color: '#8b5cf6',
    articles: [
      {
        id: 'stocks-1',
        title: 'Что такое акции?',
        description: 'Основы фондового рынка',
        readTime: '6 мин',
        content: [
          'Акция — ценная бумага, доля владения в компании.',
          'Покупая акции, вы становитесь совладельцем бизнеса.',
          'Для покупки нужен брокерский счёт.',
        ],
        tips: ['Инвестируйте в долгосрок', 'Изучайте отчётность', 'Не пытайтесь угадать рынок'],
      },
      {
        id: 'stocks-2',
        title: 'ETF и индексные фонды',
        description: 'Простой способ диверсификации',
        readTime: '7 мин',
        content: [
          'ETF отслеживает индекс или корзину активов.',
          'Одна акция ETF = инвестиция в десятки компаний.',
          'Идеально для начинающих.',
        ],
        tips: ['Начните с широких ETF', 'Смотрите на комиссию', 'Докупайте регулярно'],
      },
    ],
  },
  {
    id: 'metals',
    title: 'Драгоценные металлы',
    description: 'Золото, серебро и другие',
    icon: 'diamond',
    color: '#eab308',
    articles: [
      {
        id: 'metals-1',
        title: 'Зачем инвестировать в золото?',
        description: 'Защитный актив в портфеле',
        readTime: '6 мин',
        content: [
          'Золото — защитный актив, сохраняющий ценность.',
          'Защищает от инфляции и кризисов.',
          'Рекомендуемая доля: 5-15% портфеля.',
        ],
        tips: ['Рассматривайте как страховку', 'Не больше 15%', 'Покупайте надолго'],
      },
    ],
  },
  {
    id: 'portfolio',
    title: 'Распределение капитала',
    description: 'Как составить портфель',
    icon: 'pie-chart',
    color: '#10b981',
    articles: [
      {
        id: 'portfolio-1',
        title: 'Принципы диверсификации',
        description: 'Не кладите все яйца в одну корзину',
        readTime: '7 мин',
        content: [
          'Распределяйте инвестиции между разными активами.',
          'Уровни: по классам, странам, секторам.',
          'Ребалансируйте раз в год.',
        ],
        tips: ['5-7 классов активов', 'Ребалансировка ежегодно', 'Не гонитесь за модой'],
      },
      {
        id: 'portfolio-2',
        title: 'Стратегия DCA',
        description: 'Регулярные инвестиции',
        readTime: '6 мин',
        content: [
          'DCA — регулярные инвестиции фиксированной суммы.',
          'Не нужно угадывать "дно" рынка.',
          'При падении покупаете больше — выгодно в долгосроке.',
        ],
        tips: ['Автоматизируйте покупки', 'Не прекращайте при падении', 'Сочетайте с ребалансировкой'],
      },
    ],
  },
];

export const LearnScreen: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<Category>('overview');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const currentCategory = CATEGORIES.find(c => c.id === activeCategory);
  const totalArticles = CATEGORIES.reduce((sum, c) => sum + c.articles.length, 0);

  // Article View
  if (selectedArticle) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedArticle(null)}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
          <Text style={styles.backText}>Назад</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.articleContent}>
          <View style={styles.readTimeContainer}>
            <Ionicons name="time-outline" size={16} color={colors.textMuted} />
            <Text style={styles.readTime}>{selectedArticle.readTime}</Text>
          </View>

          <Text style={styles.articleTitle}>{selectedArticle.title}</Text>

          {selectedArticle.content.map((paragraph, idx) => (
            <Text key={idx} style={styles.paragraph}>{paragraph}</Text>
          ))}

          {selectedArticle.tips && (
            <View style={styles.tipsContainer}>
              <View style={styles.tipsHeader}>
                <Ionicons name="sparkles" size={20} color={colors.primary} />
                <Text style={styles.tipsTitle}>Советы</Text>
              </View>
              {selectedArticle.tips.map((tip, idx) => (
                <View key={idx} style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // Category View
  if (activeCategory !== 'overview' && currentCategory) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setActiveCategory('overview')}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
          <Text style={styles.backText}>Все категории</Text>
        </TouchableOpacity>

        <View style={[styles.categoryHeader, { backgroundColor: currentCategory.color }]}>
          <Ionicons name={currentCategory.icon as any} size={32} color="white" />
          <Text style={styles.categoryHeaderTitle}>{currentCategory.title}</Text>
          <Text style={styles.categoryHeaderCount}>
            {currentCategory.articles.length} статей
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {currentCategory.articles.map((article) => (
            <TouchableOpacity
              key={article.id}
              style={styles.articleCard}
              onPress={() => setSelectedArticle(article)}
            >
              <View style={styles.articleInfo}>
                <Text style={styles.articleCardTitle}>{article.title}</Text>
                <Text style={styles.articleCardDesc}>{article.description}</Text>
                <View style={styles.readTimeRow}>
                  <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.readTimeSmall}>{article.readTime}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  // Overview
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="book" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{totalArticles}</Text>
            <Text style={styles.statLabel}>статей</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="folder" size={24} color={colors.accent} />
            <Text style={styles.statValue}>{CATEGORIES.length}</Text>
            <Text style={styles.statLabel}>категорий</Text>
          </View>
        </View>

        {/* Categories */}
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.categoryCard}
            onPress={() => setActiveCategory(category.id)}
          >
            <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
              <Ionicons name={category.icon as any} size={24} color={category.color} />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              <Text style={styles.categoryDesc}>{category.description}</Text>
              <Text style={styles.categoryCount}>{category.articles.length} статей</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ))}

        {/* Tip */}
        <View style={styles.tipCard}>
          <Ionicons name="sparkles" size={24} color={colors.primary} />
          <View style={styles.tipCardText}>
            <Text style={styles.tipCardTitle}>Совет</Text>
            <Text style={styles.tipCardDesc}>
              Начните с раздела "Финансовая грамотность" — это основа для всех знаний.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  backText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
    marginLeft: 14,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  categoryDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  categoryCount: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  categoryHeader: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  categoryHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  categoryHeaderCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  articleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  articleInfo: {
    flex: 1,
  },
  articleCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  articleCardDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  readTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  readTimeSmall: {
    fontSize: 12,
    color: colors.textMuted,
  },
  articleContent: {
    padding: 20,
  },
  readTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  readTime: {
    fontSize: 14,
    color: colors.textMuted,
  },
  articleTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  tipsContainer: {
    backgroundColor: colors.primary + '15',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '15',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    gap: 12,
  },
  tipCardText: {
    flex: 1,
  },
  tipCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  tipCardDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
});
