import { GoogleGenerativeAI } from '@google/generative-ai';
import { ReceiptData } from '../types';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const genAI = new GoogleGenerativeAI(API_KEY);

const receiptPrompt = `Ты — продвинутый AI-аналитик финансов. Проанализируй изображение чека.

ВАЖНО: Отвечай СТРОГО валидным JSON без markdown, без комментариев, без пояснений.

JSON формат:
{
  "merchant": "Полное название магазина/заведения",
  "date": "YYYY-MM-DD",
  "currency": "₸",
  "total_spent": 0.00,
  "items_aggregated": [
    {
      "name": "Полное человекочитаемое название товара",
      "original_text": "Текст как в чеке",
      "quantity": 1,
      "total_price": 0.00,
      "category": "Категория",
      "type": "Essential|Standard|Luxury|Health",
      "insight": "Короткий полезный комментарий"
    }
  ],
  "consumption_summary": {
    "luxury_item_count": 0,
    "essential_item_count": 0,
    "top_habit": "Вывод о покупке (существительное)"
  }
}

═══ ОБЩИЕ ПРАВИЛА ═══
• currency — определи из чека: казахстанский → "₸", российский → "₽", доллары → "$", евро → "€"
• total_spent — бери строку "ИТОГО"/"ИТОГ"/"TOTAL" из чека. Не суммируй вручную.
• name — расшифруй сокращения в ПОЛНОЕ название ("МОЛ ПАК 0.93" → "Молоко пастеризованное 0.93л", "ПАК МАЕЧКА" → "Пакет-маечка")
• top_habit — "покупка продуктов", "закупка бытовой химии" и т.д. НЕ от лица человека.
• Группируй одинаковые товары.

═══ КАТЕГОРИИ (ТОЛЬКО ЭТИ) ═══
"Продукты" — еда, напитки, молочка, мясо, хлеб, крупы, овощи, фрукты, снеки, чай, кофе, вода, яйца, масло, алкоголь
"Дом и быт" — бытовая химия, порошок, пакеты, мешки, салфетки, туалетная бумага, посуда, лампочки, подгузники
"Рестораны" — готовая еда из кафе/ресторана/фастфуда, доставка еды
"Одежда" — ТОЛЬКО одежда/обувь/аксессуары для ношения. ⚠️ Пакет — НЕ одежда!
"Красота" — шампунь, гель, крем, зубная паста, дезодорант, косметика, парфюм
"Здоровье" — лекарства, витамины, БАДы, медизделия
"Техника" — электроника, телефоны, наушники, бытовая техника
"Развлечения" — кино, игры, книги, подписки, игрушки, спорттовары
"Транспорт" — бензин, проезд, такси, парковка, автозапчасти
"Образование" — учебники, курсы, канцелярия
"Коммунальные услуги" — ЖКХ, электричество, интернет, связь
"Другое" — всё остальное (сигареты, корм для животных и т.д.)

═══ ЧАСТЫЕ ОШИБКИ ═══
• Пакет/мешок → "Дом и быт", НЕ "Одежда"
• Вода/сок/кола → "Продукты", НЕ "Здоровье"
• Шампунь/зубная паста → "Красота", НЕ "Дом и быт"
• Готовая еда из кафе → "Рестораны"; замороженная из магазина → "Продукты"

═══ ТИП (type) ═══
Essential — базовые продукты, лекарства, гигиена, коммуналка
Standard — обычные покупки: полуфабрикаты, бытовая химия, базовая одежда
Luxury — премиальное: деликатесы, бренды, алкоголь, рестораны, развлечения, гаджеты
Health — лекарства, витамины, БАДы, спортпитание`;

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
