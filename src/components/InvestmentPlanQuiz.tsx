import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';

interface InvestmentPlanQuizProps {
  visible: boolean;
  onClose: () => void;
  currency?: string;
}

interface QuizAnswer {
  questionId: string;
  value: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  description?: string;
  options: { value: string; label: string; icon?: string; description?: string }[];
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'income',
    question: 'Какой ваш ежемесячный доход?',
    description: 'Укажите примерный доход после налогов',
    options: [
      { value: '100000', label: 'До 100 000 ₸', description: 'Начальный уровень' },
      { value: '250000', label: '100 000 — 250 000 ₸', description: 'Средний уровень' },
      { value: '500000', label: '250 000 — 500 000 ₸', description: 'Выше среднего' },
      { value: '1000000', label: '500 000 — 1 000 000 ₸', description: 'Высокий доход' },
      { value: '2000000', label: 'Более 1 000 000 ₸', description: 'Премиум' },
    ]
  },
  {
    id: 'expenses',
    question: 'Сколько вы тратите в месяц?',
    description: 'Все расходы включая жильё, еду, транспорт',
    options: [
      { value: '80000', label: 'До 80 000 ₸', description: 'Экономный образ жизни' },
      { value: '150000', label: '80 000 — 150 000 ₸', description: 'Умеренные расходы' },
      { value: '300000', label: '150 000 — 300 000 ₸', description: 'Комфортный уровень' },
      { value: '500000', label: '300 000 — 500 000 ₸', description: 'Высокие расходы' },
      { value: '800000', label: 'Более 500 000 ₸', description: 'Премиум образ жизни' },
    ]
  },
  {
    id: 'savings',
    question: 'Есть ли у вас финансовая подушка?',
    description: 'Накопления на непредвиденные расходы',
    options: [
      { value: 'none', label: 'Нет накоплений', icon: 'warning', description: 'Первый приоритет' },
      { value: '1month', label: '1-2 месяца расходов', icon: 'wallet', description: 'Базовый уровень' },
      { value: '3months', label: '3-6 месяцев расходов', icon: 'shield-checkmark', description: 'Хороший уровень' },
      { value: '6months', label: 'Более 6 месяцев', icon: 'checkmark-circle', description: 'Отлично!' },
    ]
  },
  {
    id: 'goal',
    question: 'Какая ваша главная цель?',
    description: 'Выберите приоритетную цель',
    options: [
      { value: 'safety', label: 'Финансовая безопасность', icon: 'shield', description: 'Подушка и стабильность' },
      { value: 'growth', label: 'Приумножение капитала', icon: 'trending-up', description: 'Рост инвестиций' },
      { value: 'passive', label: 'Пассивный доход', icon: 'cash', description: 'Дивиденды' },
      { value: 'retirement', label: 'Пенсия / FIRE', icon: 'flag', description: 'Финансовая свобода' },
    ]
  },
  {
    id: 'horizon',
    question: 'На какой срок инвестируете?',
    description: 'Когда понадобятся деньги?',
    options: [
      { value: '1year', label: 'До 1 года', icon: 'calendar', description: 'Консервативно' },
      { value: '3years', label: '1-3 года', icon: 'calendar', description: 'Умеренно' },
      { value: '5years', label: '3-5 лет', icon: 'calendar', description: 'Сбалансированно' },
      { value: '10years', label: 'Более 5 лет', icon: 'rocket', description: 'Агрессивно' },
    ]
  },
  {
    id: 'risk',
    question: 'Как относитесь к риску?',
    description: 'Если инвестиции упадут на 20%?',
    options: [
      { value: 'conservative', label: 'Продам всё', icon: 'shield', description: 'Консервативный' },
      { value: 'moderate', label: 'Подожду восстановления', icon: 'time', description: 'Умеренный' },
      { value: 'aggressive', label: 'Докуплю ещё!', icon: 'rocket', description: 'Агрессивный' },
    ]
  },
];

interface InvestmentPlan {
  riskProfile: string;
  monthlyInvestment: number;
  allocation: { type: string; percent: number; color: string }[];
  topPicks: { symbol: string; name: string; reason: string }[];
  steps: string[];
  warnings: string[];
}

const generatePlan = (answers: QuizAnswer[], currency: string): InvestmentPlan => {
  const income = parseInt(answers.find(a => a.questionId === 'income')?.value || '250000');
  const expenses = parseInt(answers.find(a => a.questionId === 'expenses')?.value || '150000');
  const savings = answers.find(a => a.questionId === 'savings')?.value || 'none';
  const goal = answers.find(a => a.questionId === 'goal')?.value || 'growth';
  const horizon = answers.find(a => a.questionId === 'horizon')?.value || '3years';
  const risk = answers.find(a => a.questionId === 'risk')?.value || 'moderate';

  const freeAmount = Math.max(0, income - expenses);
  const monthlyInvestment = Math.round(freeAmount * 0.5);

  let riskProfile = 'Умеренный';
  if (risk === 'conservative' || horizon === '1year') riskProfile = 'Консервативный';
  if (risk === 'aggressive' && (horizon === '5years' || horizon === '10years')) riskProfile = 'Агрессивный';

  let allocation: InvestmentPlan['allocation'] = [];
  const warnings: string[] = [];
  const steps: string[] = [];

  if (savings === 'none' || savings === '1month') {
    warnings.push('Первый приоритет — создать подушку на 3-6 месяцев!');
  }

  if (riskProfile === 'Консервативный') {
    allocation = [
      { type: 'Облигации/Депозиты', percent: 50, color: '#10b981' },
      { type: 'Акции (ETF)', percent: 30, color: '#6366f1' },
      { type: 'Золото', percent: 15, color: '#f59e0b' },
      { type: 'Криптовалюта', percent: 5, color: '#8b5cf6' },
    ];
  } else if (riskProfile === 'Агрессивный') {
    allocation = [
      { type: 'Акции роста', percent: 50, color: '#6366f1' },
      { type: 'Криптовалюта', percent: 25, color: '#8b5cf6' },
      { type: 'ETF развив. рынков', percent: 15, color: '#ec4899' },
      { type: 'Золото', percent: 10, color: '#f59e0b' },
    ];
  } else {
    allocation = [
      { type: 'Акции (ETF)', percent: 40, color: '#6366f1' },
      { type: 'Облигации', percent: 25, color: '#10b981' },
      { type: 'Криптовалюта', percent: 15, color: '#8b5cf6' },
      { type: 'Золото', percent: 15, color: '#f59e0b' },
      { type: 'Кэш резерв', percent: 5, color: '#64748b' },
    ];
  }

  steps.push('Откройте брокерский счёт');
  steps.push(`Инвестируйте ${monthlyInvestment.toLocaleString()} ${currency}/мес`);
  steps.push('Начните с ETF на S&P 500');
  steps.push('Ребалансируйте раз в квартал');

  const topPicks = [
    { symbol: 'SPY', name: 'S&P 500 ETF', reason: 'Диверсификация 500 компаний' },
    { symbol: 'HSBK', name: 'Halyk Bank', reason: 'Дивиденды Казахстана' },
  ];
  
  if (riskProfile !== 'Консервативный') {
    topPicks.unshift({ symbol: 'NVDA', name: 'NVIDIA', reason: 'Лидер AI' });
  }
  if (riskProfile === 'Агрессивный') {
    topPicks.push({ symbol: 'BTC', name: 'Bitcoin', reason: 'Цифровое золото' });
  }

  return { riskProfile, monthlyInvestment, allocation, topPicks, steps, warnings };
};

export const InvestmentPlanQuiz: React.FC<InvestmentPlanQuizProps> = ({
  visible,
  onClose,
  currency = '₸',
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [showResult, setShowResult] = useState(false);

  const currentQuestion = QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;

  const handleAnswer = (value: string) => {
    const newAnswers = answers.filter(a => a.questionId !== currentQuestion.id);
    newAnswers.push({ questionId: currentQuestion.id, value });
    setAnswers(newAnswers);

    if (currentStep < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 300);
    } else {
      setTimeout(() => setShowResult(true), 300);
    }
  };

  const getCurrentAnswer = () => answers.find(a => a.questionId === currentQuestion?.id)?.value;

  const plan = useMemo(() => {
    if (showResult) return generatePlan(answers, currency);
    return null;
  }, [showResult, answers, currency]);

  const handleClose = () => {
    setCurrentStep(0);
    setAnswers([]);
    setShowResult(false);
    onClose();
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setAnswers([]);
    setShowResult(false);
  };

  // Результат
  if (showResult && plan) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <View style={styles.resultHeaderLeft}>
                <View style={styles.resultIcon}>
                  <Ionicons name="sparkles" size={24} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.resultTitle}>Ваш план</Text>
                  <Text style={styles.resultSubtitle}>Профиль: {plan.riskProfile}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.resultContent} showsVerticalScrollIndicator={false}>
              {/* Warnings */}
              {plan.warnings.length > 0 && (
                <View style={styles.warningCard}>
                  <Ionicons name="warning" size={18} color="#f59e0b" />
                  <Text style={styles.warningText}>{plan.warnings[0]}</Text>
                </View>
              )}

              {/* Monthly Investment */}
              <LinearGradient
                colors={['#10b98130', '#05966930']}
                style={styles.investmentCard}
              >
                <View>
                  <Text style={styles.investmentLabel}>Инвестируйте в месяц</Text>
                  <Text style={styles.investmentAmount}>
                    {plan.monthlyInvestment.toLocaleString()} {currency}
                  </Text>
                </View>
                <View style={styles.investmentIcon}>
                  <Ionicons name="wallet" size={28} color="#10b981" />
                </View>
              </LinearGradient>

              {/* Allocation */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Распределение портфеля</Text>
                <View style={styles.allocationBar}>
                  {plan.allocation.map((item, idx) => (
                    <View 
                      key={idx}
                      style={[styles.allocationSegment, { 
                        width: `${item.percent}%`, 
                        backgroundColor: item.color 
                      }]}
                    />
                  ))}
                </View>
                {plan.allocation.map((item, idx) => (
                  <View key={idx} style={styles.allocationItem}>
                    <View style={[styles.allocationDot, { backgroundColor: item.color }]} />
                    <Text style={styles.allocationLabel}>{item.type}</Text>
                    <Text style={[styles.allocationPercent, { color: item.color }]}>{item.percent}%</Text>
                  </View>
                ))}
              </View>

              {/* Top Picks */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Что купить</Text>
                {plan.topPicks.map((pick, idx) => (
                  <View key={idx} style={styles.pickItem}>
                    <View style={styles.pickLeft}>
                      <Text style={styles.pickSymbol}>{pick.symbol}</Text>
                      <Text style={styles.pickName}>{pick.name}</Text>
                    </View>
                    <Text style={styles.pickReason}>{pick.reason}</Text>
                  </View>
                ))}
              </View>

              {/* Steps */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ваши шаги</Text>
                {plan.steps.map((step, idx) => (
                  <View key={idx} style={styles.stepItem}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>

              {/* Disclaimer */}
              <Text style={styles.disclaimer}>
                ⚠️ Это не финансовая рекомендация. Инвестиции связаны с риском.
              </Text>

              {/* Buttons */}
              <View style={styles.resultButtons}>
                <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
                  <Text style={styles.restartButtonText}>Заново</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
                  <LinearGradient
                    colors={[colors.primary, '#8b5cf6']}
                    style={styles.doneButtonGradient}
                  >
                    <Text style={styles.doneButtonText}>Готово</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }

  // Вопросы
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.quizContainer}>
          {/* Header */}
          <View style={styles.quizHeader}>
            <View style={styles.quizHeaderLeft}>
              <View style={styles.quizIcon}>
                <Ionicons name="analytics" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.quizTitle}>План инвестиций</Text>
                <Text style={styles.quizProgress}>
                  Вопрос {currentStep + 1} из {QUESTIONS.length}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>

          {/* Question */}
          <ScrollView style={styles.quizContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.question}>{currentQuestion.question}</Text>
            {currentQuestion.description && (
              <Text style={styles.questionDesc}>{currentQuestion.description}</Text>
            )}

            <View style={styles.options}>
              {currentQuestion.options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    getCurrentAnswer() === option.value && styles.optionSelected
                  ]}
                  onPress={() => handleAnswer(option.value)}
                >
                  {option.icon && (
                    <View style={[
                      styles.optionIcon,
                      getCurrentAnswer() === option.value && styles.optionIconSelected
                    ]}>
                      <Ionicons 
                        name={option.icon as any} 
                        size={18} 
                        color={getCurrentAnswer() === option.value ? colors.primary : colors.textMuted} 
                      />
                    </View>
                  )}
                  <View style={styles.optionContent}>
                    <Text style={[
                      styles.optionLabel,
                      getCurrentAnswer() === option.value && styles.optionLabelSelected
                    ]}>
                      {option.label}
                    </Text>
                    {option.description && (
                      <Text style={styles.optionDesc}>{option.description}</Text>
                    )}
                  </View>
                  {getCurrentAnswer() === option.value && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Navigation */}
          <View style={styles.quizNav}>
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              <Ionicons name="arrow-back" size={20} color={currentStep === 0 ? colors.textMuted : colors.textSecondary} />
              <Text style={[styles.navButtonText, currentStep === 0 && styles.navButtonTextDisabled]}>Назад</Text>
            </TouchableOpacity>

            <View style={styles.dots}>
              {QUESTIONS.map((_, idx) => (
                <View 
                  key={idx}
                  style={[
                    styles.dot,
                    idx === currentStep && styles.dotActive,
                    idx < currentStep && styles.dotCompleted
                  ]} 
                />
              ))}
            </View>

            {currentStep === QUESTIONS.length - 1 && getCurrentAnswer() && (
              <TouchableOpacity style={styles.submitButton} onPress={() => setShowResult(true)}>
                <LinearGradient
                  colors={[colors.primary, '#8b5cf6']}
                  style={styles.submitButtonGradient}
                >
                  <Text style={styles.submitButtonText}>Результат</Text>
                  <Ionicons name="arrow-forward" size={18} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  // Quiz styles
  quizContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  quizHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quizIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quizTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  quizProgress: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  closeButton: {
    padding: 8,
  },
  progressBar: {
    height: 3,
    backgroundColor: colors.border,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  quizContent: {
    padding: 20,
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  questionDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  options: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary + '50',
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionIconSelected: {
    backgroundColor: colors.primary + '30',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  optionLabelSelected: {
    color: colors.primary,
  },
  optionDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  quizNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  navButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  navButtonTextDisabled: {
    color: colors.textMuted,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 18,
  },
  dotCompleted: {
    backgroundColor: colors.primary + '60',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // Result styles
  resultContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '95%',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  resultSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  resultContent: {
    padding: 16,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: '#f59e0b15',
    borderRadius: 12,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#f59e0b',
  },
  investmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  investmentLabel: {
    fontSize: 13,
    color: '#10b981',
  },
  investmentAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10b981',
    marginTop: 4,
  },
  investmentIcon: {
    padding: 12,
    backgroundColor: '#10b98120',
    borderRadius: 14,
  },
  section: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 14,
  },
  allocationBar: {
    flexDirection: 'row',
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
  },
  allocationSegment: {
    height: '100%',
  },
  allocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  allocationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  allocationLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },
  allocationPercent: {
    fontSize: 14,
    fontWeight: '600',
  },
  pickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickLeft: {
    flex: 1,
  },
  pickSymbol: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  pickName: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  pickReason: {
    fontSize: 11,
    color: colors.textMuted,
    maxWidth: 120,
    textAlign: 'right',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },
  disclaimer: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginVertical: 16,
  },
  resultButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  restartButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  restartButtonText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  doneButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  doneButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
});
