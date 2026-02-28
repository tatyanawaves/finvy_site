// Цветовая палитра приложения
export const colors = {
  // Основные цвета
  primary: '#6366f1', // Indigo
  primaryLight: '#818cf8',
  primaryDark: '#4f46e5',
  
  // Акцентные цвета
  accent: '#8b5cf6', // Purple
  accentLight: '#a78bfa',
  
  // Фоновые цвета
  background: '#0f172a', // Slate 900
  surface: '#1e293b', // Slate 800
  surfaceLight: '#334155', // Slate 700
  
  // Текст
  textPrimary: '#f1f5f9', // Slate 100
  textSecondary: '#94a3b8', // Slate 400
  textMuted: '#64748b', // Slate 500
  
  // Статусы
  success: '#10b981', // Emerald
  warning: '#f59e0b', // Amber
  error: '#ef4444', // Red
  info: '#3b82f6', // Blue
  
  // Типы товаров
  essential: '#10b981', // Emerald
  standard: '#3b82f6', // Blue
  luxury: '#ec4899', // Pink
  health: '#06b6d4', // Cyan
  
  // Границы
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.2)',
  
  // Градиенты (для LinearGradient)
  gradientPrimary: ['#6366f1', '#8b5cf6'],
  gradientAccent: ['#ec4899', '#8b5cf6'],
  gradientSuccess: ['#10b981', '#06b6d4'],
};

// Цвета для категорий диаграммы
export const chartColors = [
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#84cc16', // Lime
];

// Получить цвет по типу товара
export const getTypeColor = (type: string): string => {
  switch (type) {
    case 'Essential':
      return colors.essential;
    case 'Standard':
      return colors.standard;
    case 'Luxury':
      return colors.luxury;
    case 'Health':
      return colors.health;
    default:
      return colors.textSecondary;
  }
};

// Перевод типа на русский
export const getTypeLabel = (type: string): string => {
  switch (type) {
    case 'Essential':
      return 'Необходимое';
    case 'Standard':
      return 'Стандартное';
    case 'Luxury':
      return 'Премиум';
    case 'Health':
      return 'Здоровье';
    default:
      return type;
  }
};
