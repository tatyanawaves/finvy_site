// Типы товаров
export type ItemType = 'Essential' | 'Standard' | 'Luxury' | 'Health';

// Категории товаров
export type ItemCategory = 
  | 'Продукты'
  | 'Дом и быт'
  | 'Одежда'
  | 'Транспорт'
  | 'Здоровье'
  | 'Развлечения'
  | 'Техника'
  | 'Красота'
  | 'Образование'
  | 'Рестораны'
  | 'Коммунальные услуги'
  | 'Другое';

// Товар из чека
export interface ReceiptItem {
  name: string;
  original_text: string;
  quantity: number;
  total_price: number;
  category: string;
  type: ItemType;
  insight: string;
}

// Сводка по чеку
export interface ConsumptionSummary {
  luxury_item_count: number;
  essential_item_count: number;
  top_habit: string;
}

// Данные чека
export interface ReceiptData {
  merchant: string;
  date: string;
  currency: string;
  total_spent: number;
  items_aggregated: ReceiptItem[];
  consumption_summary: ConsumptionSummary;
}

// Чек с Firestore метаданными
export interface FirestoreReceipt extends ReceiptData {
  id?: string;
  userId: string;
  createdAt: Date;
}

// Сообщение чата
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

// Пользователь
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// Статистика по категориям
export interface CategoryStats {
  category: string;
  total: number;
  percentage: number;
  color: string;
}

// Навигация
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Camera: undefined;
};

export type MainTabParamList = {
  Receipts: undefined;
  Analytics: undefined;
  Assistant: undefined;
  Profile: undefined;
};
