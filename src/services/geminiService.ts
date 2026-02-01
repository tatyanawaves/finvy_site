import { GoogleGenerativeAI } from '@google/generative-ai';
import { ReceiptData } from '../types';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const genAI = new GoogleGenerativeAI(API_KEY);

const receiptPrompt = `Ты - продвинутый AI-аналитик финансов.
Проанализируй изображение чека от ЛЮБОГО типа магазина (ресторан, Apple Store, супермаркет, заправка и т.д.).

1. Нормализуй названия: Преобразуй криптические тексты в читаемые названия.
2. Агрегируй: Группируй одинаковые товары.
3. Категоризируй: Определи широкую категорию (Электроника, Еда, Услуги и т.д.).
4. Классифицируй необходимость: Отметь каждый товар как 'Essential' (Необходимое), 'Standard' (Обычное), 'Luxury' (Роскошь) или 'Health' (Здоровье).

Верни ТОЛЬКО JSON объект в следующем формате:
{
  "merchant": "Название магазина",
  "date": "YYYY-MM-DD",
  "currency": "₽",
  "total_spent": 0.00,
  "items_aggregated": [
    {
      "name": "Читаемое название",
      "original_text": "Оригинальный текст",
      "quantity": 1,
      "total_price": 0.00,
      "category": "Категория",
      "type": "Essential|Standard|Luxury|Health",
      "insight": "Краткий инсайт"
    }
  ],
  "consumption_summary": {
    "luxury_item_count": 0,
    "essential_item_count": 0,
    "top_habit": "Описание главной привычки трат"
  }
}`;

/**
 * Анализ изображения чека
 */
export const analyzeReceiptImage = async (base64Image: string, mimeType: string): Promise<ReceiptData> => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: mimeType,
        data: base64Image
      }
    },
    { text: receiptPrompt }
  ]);

  const response = await result.response;
  const text = response.text();
  
  // Извлекаем JSON из ответа
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Не удалось распознать чек');
  }

  try {
    return JSON.parse(jsonMatch[0]) as ReceiptData;
  } catch (e) {
    console.error('JSON parse error:', text);
    throw new Error('Ошибка разбора данных чека');
  }
};

/**
 * Чат с ассистентом
 */
export const chatWithAssistant = async (
  message: string,
  receipts: ReceiptData[],
  history: { role: string; text: string }[]
): Promise<string> => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Подготовка контекста
  const totalSpent = receipts.reduce((sum, r) => sum + r.total_spent, 0);
  const categoryTotals: Record<string, number> = {};
  const typeTotals: Record<string, number> = {};
  
  receipts.forEach(r => {
    r.items_aggregated.forEach(item => {
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.total_price;
      typeTotals[item.type] = (typeTotals[item.type] || 0) + item.total_price;
    });
  });

  const contextString = receipts.length > 0 
    ? `
Данные о расходах пользователя:
- Всего чеков: ${receipts.length}
- Общая сумма: ${totalSpent.toFixed(2)} ${receipts[0]?.currency || '₽'}
- Расходы по категориям: ${JSON.stringify(categoryTotals)}
- Расходы по типам: ${JSON.stringify(typeTotals)}
- Детальные чеки: ${JSON.stringify(receipts.slice(0, 10))}
`
    : "Пользователь ещё не загрузил чеки.";

  const systemPrompt = `Ты - умный финансовый ассистент в приложении анализа чеков.
ВАЖНО: Отвечай ТОЛЬКО на русском языке.
Будь конкретным и используй данные из чеков.
Давай практические советы по экономии.

${contextString}`;

  const chat = model.startChat({
    history: history.map(h => ({
      role: h.role as 'user' | 'model',
      parts: [{ text: h.text }]
    })),
    generationConfig: {
      maxOutputTokens: 1000,
    },
  });

  const result = await chat.sendMessage(`${systemPrompt}\n\nВопрос пользователя: ${message}`);
  const response = await result.response;
  return response.text();
};
