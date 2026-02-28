import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { changeLanguage, availableLanguages, getCurrentLanguage } from '../i18n';
import { colors } from '../utils/colors';

interface LanguageSwitcherProps {
  variant?: 'button' | 'list';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  variant = 'button' 
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());
  
  const currentLanguage = availableLanguages.find(l => l.code === currentLang) || availableLanguages[0];

  const handleChange = async (code: string) => {
    await changeLanguage(code);
    setCurrentLang(code);
    setIsOpen(false);
  };

  // Вариант списка для настроек
  if (variant === 'list') {
    return (
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>{t('profile.language')}</Text>
        <View style={styles.listOptions}>
          {availableLanguages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.listOption,
                lang.code === currentLang && styles.listOptionSelected
              ]}
              onPress={() => handleChange(lang.code)}
            >
              <Text style={styles.listFlag}>{lang.flag}</Text>
              <Text style={[
                styles.listOptionText,
                lang.code === currentLang && styles.listOptionTextSelected
              ]}>
                {lang.name}
              </Text>
              {lang.code === currentLang && (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  // Кнопка с модалкой
  return (
    <>
      <TouchableOpacity 
        style={styles.button}
        onPress={() => setIsOpen(true)}
      >
        <Text style={styles.buttonFlag}>{currentLanguage.flag}</Text>
        <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('profile.language')}</Text>
            
            {availableLanguages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.modalOption,
                  lang.code === currentLang && styles.modalOptionSelected
                ]}
                onPress={() => handleChange(lang.code)}
              >
                <Text style={styles.modalFlag}>{lang.flag}</Text>
                <Text style={[
                  styles.modalOptionText,
                  lang.code === currentLang && styles.modalOptionTextSelected
                ]}>
                  {lang.name}
                </Text>
                {lang.code === currentLang && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Button variant
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  buttonFlag: {
    fontSize: 18,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.background,
  },
  modalOptionSelected: {
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary + '50',
  },
  modalFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  modalOptionText: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  modalOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },

  // List variant (for settings screen)
  listContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  listOptions: {
    gap: 8,
  },
  listOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  listOptionSelected: {
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  listFlag: {
    fontSize: 20,
    marginRight: 10,
  },
  listOptionText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  listOptionTextSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
});
