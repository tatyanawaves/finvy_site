import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ru from '../locales/ru.json';
import kk from '../locales/kk.json';
import en from '../locales/en.json';

// Ресурсы локализации
const resources = {
  ru: { translation: ru },
  kk: { translation: kk },
  en: { translation: en },
};

// Ключ для хранения языка
const LANGUAGE_KEY = 'finvy_language';

// Определение языка устройства
const getDeviceLanguage = (): string => {
  try {
    const locales = Localization.getLocales();
    const locale = locales?.[0]?.languageCode || 'ru';
    
    // Поддерживаемые языки
    if (['ru', 'kk', 'en'].includes(locale)) {
      return locale;
    }
  } catch (e) {
    console.warn('Error getting device language:', e);
  }
  
  // По умолчанию русский
  return 'ru';
};

// Инициализация i18next
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3', // Важно для React Native
    resources,
    lng: getDeviceLanguage(),
    fallbackLng: 'ru',
    supportedLngs: ['ru', 'kk', 'en'],
    
    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false, // Важно для React Native
    },
  });

// Загрузка сохранённого языка
export const loadSavedLanguage = async (): Promise<void> => {
  try {
    const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (savedLang && ['ru', 'kk', 'en'].includes(savedLang)) {
      i18n.changeLanguage(savedLang);
    }
  } catch (error) {
    console.warn('Error loading saved language:', error);
  }
};

// Смена языка
export const changeLanguage = async (lang: string): Promise<void> => {
  try {
    i18n.changeLanguage(lang);
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  } catch (error) {
    console.warn('Error changing language:', error);
  }
};

// Получить текущий язык
export const getCurrentLanguage = (): string => {
  return i18n.language || 'ru';
};

// Доступные языки
export const availableLanguages = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'kk', name: 'Қазақша', flag: '🇰🇿' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

// Получить системный промпт для AI на выбранном языке
export const getAISystemPromptLanguage = (): { instruction: string; greeting: string } => {
  const lang = getCurrentLanguage();
  
  const prompts: Record<string, { instruction: string; greeting: string }> = {
    ru: {
      instruction: 'Отвечай на русском языке. Ты — финансовый ассистент Finvy.',
      greeting: 'Привет! Я ваш финансовый ассистент. Чем могу помочь?',
    },
    kk: {
      instruction: 'Қазақ тілінде жауап бер. Сен — Finvy қаржылық көмекшісісің.',
      greeting: 'Сәлем! Мен сіздің қаржылық көмекшіңізмін. Қалай көмектесе аламын?',
    },
    en: {
      instruction: 'Respond in English. You are Finvy, a financial assistant.',
      greeting: 'Hi! I\'m your financial assistant. How can I help you?',
    },
  };

  return prompts[lang] || prompts.ru;
};

export default i18n;
