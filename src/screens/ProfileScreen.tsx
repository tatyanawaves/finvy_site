import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useReceipts } from '../hooks/useReceipts';
import { colors } from '../utils/colors';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { receipts, totalSpent } = useReceipts();
  const [showPrivacy, setShowPrivacy] = useState(false);

  const currency = receipts[0]?.currency || '₸';

  const handleLogout = () => {
    Alert.alert(
      t('auth.logout'),
      t('common.yes') + '?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('auth.logout'), 
          style: 'destructive',
          onPress: logout 
        },
      ]
    );
  };

  const getInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0].toUpperCase() || 'U';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={colors.gradientPrimary as [string, string]}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{getInitials()}</Text>
        </LinearGradient>
        <Text style={styles.name}>
          {user?.displayName || 'Пользователь'}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{receipts.length}</Text>
          <Text style={styles.statLabel}>Чеков</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {totalSpent.toFixed(0)} {currency}
          </Text>
          <Text style={styles.statLabel}>Потрачено</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {receipts.reduce((sum, r) => sum + r.items_aggregated.length, 0)}
          </Text>
          <Text style={styles.statLabel}>Товаров</Text>
        </View>
      </View>

      {/* Language Switcher */}
      <LanguageSwitcher variant="list" />

      {/* Menu Items */}
      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem}>
          <View style={[styles.menuIcon, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="settings-outline" size={22} color={colors.primary} />
          </View>
          <Text style={styles.menuText}>{t('profile.settings')}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={[styles.menuIcon, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="notifications-outline" size={22} color={colors.success} />
          </View>
          <Text style={styles.menuText}>{t('profile.notifications')}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={[styles.menuIcon, { backgroundColor: colors.warning + '20' }]}>
            <Ionicons name="help-circle-outline" size={22} color={colors.warning} />
          </View>
          <Text style={styles.menuText}>{t('profile.support')}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => setShowPrivacy(true)}>
          <View style={[styles.menuIcon, { backgroundColor: '#8b5cf6' + '20' }]}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#8b5cf6" />
          </View>
          <Text style={styles.menuText}>Политика конфиденциальности</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={[styles.menuIcon, { backgroundColor: colors.info + '20' }]}>
            <Ionicons name="information-circle-outline" size={22} color={colors.info} />
          </View>
          <Text style={styles.menuText}>{t('profile.about')}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color={colors.error} />
        <Text style={styles.logoutText}>{t('auth.logout')}</Text>
      </TouchableOpacity>

      {/* App Version */}
      <Text style={styles.version}>Finvy v1.0.0</Text>

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacy}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowPrivacy(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Политика конфиденциальности</Text>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowPrivacy(false)}
            >
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.privacyDate}>Дата вступления в силу: 1 февраля 2026 г.</Text>

            <Text style={styles.privacyHeading}>1. Общие положения</Text>
            <Text style={styles.privacyText}>
              Настоящая Политика конфиденциальности описывает, как мобильное приложение «Finvy» (далее — «Приложение») собирает, использует и защищает персональные данные пользователей. Используя Приложение, вы соглашаетесь с условиями данной Политики.
            </Text>

            <Text style={styles.privacyHeading}>2. Какие данные мы собираем</Text>
            <Text style={styles.privacyText}>
              <Text style={styles.privacyBold}>Данные аккаунта:</Text> адрес электронной почты, имя пользователя (при регистрации через Firebase Authentication).
            </Text>
            <Text style={styles.privacyText}>
              <Text style={styles.privacyBold}>Данные чеков:</Text> фотографии чеков, которые вы сканируете, а также извлечённая из них информация (магазин, дата, товары, суммы, категории). Данные хранятся в Firebase Firestore и привязаны к вашему аккаунту.
            </Text>
            <Text style={styles.privacyText}>
              <Text style={styles.privacyBold}>Данные чатов:</Text> история переписки с AI-ассистентом хранится локально на вашем устройстве (AsyncStorage) и не передаётся на серверы.
            </Text>
            <Text style={styles.privacyText}>
              <Text style={styles.privacyBold}>Настройки:</Text> выбранный язык интерфейса.
            </Text>

            <Text style={styles.privacyHeading}>3. Как мы используем данные</Text>
            <Text style={styles.privacyText}>
              • Для распознавания чеков и анализа расходов{'\n'}
              • Для предоставления персонализированных рекомендаций по экономии{'\n'}
              • Для работы AI-ассистента с учётом вашей истории покупок{'\n'}
              • Для отображения статистики расходов и аналитики{'\n'}
              • Для улучшения качества работы Приложения
            </Text>

            <Text style={styles.privacyHeading}>4. Передача данных третьим лицам</Text>
            <Text style={styles.privacyText}>
              Для работы Приложения мы используем следующие сторонние сервисы:{'\n\n'}
              <Text style={styles.privacyBold}>• Firebase (Google)</Text> — аутентификация и хранение данных чеков{'\n'}
              <Text style={styles.privacyBold}>• Groq API</Text> — AI-анализ изображений чеков и чат-ассистент{'\n'}
              <Text style={styles.privacyBold}>• Google Gemini API</Text> — резервный AI-анализ чеков{'\n'}
              <Text style={styles.privacyBold}>• Finnhub, Binance, MetalpriceAPI, exchangerate.host</Text> — получение рыночных котировок (данные пользователя не передаются){'\n\n'}
              Изображения чеков передаются в Groq/Gemini API исключительно для анализа и не сохраняются на серверах данных сервисов после обработки. Мы не продаём и не передаём ваши персональные данные рекламодателям или иным третьим лицам.
            </Text>

            <Text style={styles.privacyHeading}>5. Хранение и защита данных</Text>
            <Text style={styles.privacyText}>
              Данные аккаунта и чеков хранятся в облачном сервисе Firebase (Google Cloud) с использованием шифрования. История чатов хранится только на вашем устройстве. Мы принимаем разумные технические меры для защиты ваших данных от несанкционированного доступа.
            </Text>

            <Text style={styles.privacyHeading}>6. Ваши права</Text>
            <Text style={styles.privacyText}>
              Вы имеете право:{'\n'}
              • Просматривать свои данные в Приложении{'\n'}
              • Удалять отдельные чеки и историю чатов{'\n'}
              • Удалить свой аккаунт и все связанные данные, обратившись в поддержку{'\n'}
              • Отказаться от использования Приложения в любой момент
            </Text>

            <Text style={styles.privacyHeading}>7. Файлы cookie и аналитика</Text>
            <Text style={styles.privacyText}>
              Приложение не использует файлы cookie. Мы не собираем аналитику поведения пользователей и не используем трекеры.
            </Text>

            <Text style={styles.privacyHeading}>8. Изменения в Политике</Text>
            <Text style={styles.privacyText}>
              Мы оставляем за собой право обновлять настоящую Политику. Об изменениях мы уведомим через Приложение. Продолжая использовать Приложение после обновления, вы соглашаетесь с новой версией Политики.
            </Text>

            <Text style={styles.privacyHeading}>9. Контакты</Text>
            <Text style={styles.privacyText}>
              Если у вас есть вопросы о Политике конфиденциальности или обработке данных, свяжитесь с нами через раздел «Поддержка» в Приложении.
            </Text>

            <Text style={[styles.privacyText, { marginTop: 24, marginBottom: 40, textAlign: 'center', color: colors.textMuted }]}>
              © 2026 Finvy. Все права защищены.
            </Text>
          </ScrollView>
        </View>
      </Modal>
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
  header: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  email: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error + '15',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.error,
  },
  version: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 24,
    marginBottom: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  privacyDate: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  privacyHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 20,
    marginBottom: 8,
  },
  privacyText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  privacyBold: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
