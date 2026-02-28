import { ReceiptData } from '../types';
import { getAISystemPromptLanguage, getCurrentLanguage } from '../i18n';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Модели (Llama 4 Scout для vision)
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
const CHAT_MODEL = 'llama-3.3-70b-versatile';

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
• currency — определи из чека: казахстанский чек → "₸", российский → "₽", доллары → "$", евро → "€"
• total_spent — ИТОГО из чека. Если в чеке есть строка "ИТОГО" / "ИТОГ" / "TOTAL" — бери именно её. Не суммируй вручную.
• name — расшифруй аббревиатуры и сокращения в ПОЛНОЕ читаемое название. Примеры:
  "МОЛ ПАК 0.93" → "Молоко пастеризованное 0.93л"
  "Х/Б ИЗД БАТОН" → "Хлебобулочное изделие — батон"
  "СМ ПОРОШОК" → "Стиральный порошок"
  "ПАК МАЕЧКА" → "Пакет-маечка"
• top_habit — описание покупки одним словосочетанием: "покупка продуктов", "закупка бытовой химии", "покупка электроники". НЕ от лица человека.
• Группируй одинаковые товары, суммируя quantity и total_price.

═══ КАТЕГОРИИ (category) — ИСПОЛЬЗУЙ ТОЛЬКО ЭТИ ═══
"Продукты"           — еда, напитки, молочка, мясо, хлеб, крупы, овощи, фрукты, сладости, снеки, чай, кофе, соки, вода, яйца, масло, соусы, специи, консервы, замороженные продукты
"Дом и быт"          — бытовая химия, моющие средства, стиральный порошок, губки, пакеты, мешки для мусора, салфетки, туалетная бумага, фольга, плёнка, хозтовары, посуда, лампочки, батарейки, инструменты
"Рестораны"          — готовая еда из ресторана/кафе/фастфуда, доставка еды, обед в кафе, бизнес-ланч
"Одежда"             — ТОЛЬКО одежда, обувь, аксессуары для ношения (куртка, джинсы, футболка, платье, кроссовки, ремень, шарф, шапка). ⚠️ Пакет, мешок, чехол — это НЕ одежда!
"Красота"            — косметика, шампунь, гель для душа, крем, дезодорант, зубная паста, бритвы, парфюм, маникюр
"Здоровье"           — лекарства, витамины, БАДы, медицинские изделия, бинты, пластыри, градусник
"Техника"            — электроника, телефоны, наушники, зарядки, кабели, компьютеры, бытовая техника (чайник, утюг, пылесос)
"Развлечения"        — кино, игры, подписки, книги, хобби, игрушки, спорттовары
"Транспорт"          — бензин, дизель, газ, проезд, такси, парковка, автозапчасти, мойка
"Образование"        — учебники, курсы, канцелярия, тетради, ручки
"Коммунальные услуги"— оплата ЖКХ, электричество, вода, газ, интернет, мобильная связь
"Другое"             — всё, что не подходит ни в одну категорию выше

═══ ЧАСТЫЕ ОШИБКИ — НЕ ДОПУСКАЙ ═══
• "Пакет" / "Пакет-маечка" / "Мешок" → категория "Дом и быт", НЕ "Одежда"
• "Вода питьевая" / "Сок" / "Кола" → "Продукты", НЕ "Здоровье"
• "Зубная паста" / "Шампунь" → "Красота", НЕ "Здоровье" и НЕ "Дом и быт"
• "Влажные салфетки" → "Дом и быт"
• "Подгузники" / "Детские товары" → "Дом и быт"
• "Корм для животных" → "Другое"
• "Бургер" / "Пицца" из кафе → "Рестораны"; из магазина (замороженная) → "Продукты"
• "Сигареты" / "Табак" → "Другое"
• "Алкоголь" / "Пиво" / "Вино" → "Продукты"

═══ ТИП (type) ═══
Essential — жизненно необходимое: базовые продукты (хлеб, молоко, крупы, мясо, овощи), лекарства, базовая гигиена, коммунальные платежи
Standard  — обычные покупки: полуфабрикаты, бытовая химия, одежда базовая, канцелярия, транспорт
Luxury    — премиальное и необязательное: деликатесы, дорогие бренды, алкоголь, сладости, рестораны, развлечения, гаджеты, подписки
Health    — для здоровья: лекарства, витамины, БАДы, спортпитание, медицинские товары`;

/**
 * Анализ изображения чека через Groq Vision
 */
export const analyzeReceiptWithGroq = async (base64Image: string, mimeType: string): Promise<ReceiptData> => {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: receiptPrompt
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 2000,
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Groq API error:', error);
    throw new Error(error.error?.message || 'Ошибка Groq API');
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('Пустой ответ от Groq');
  }

  // Извлекаем JSON из ответа
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('No JSON in response:', content);
    throw new Error('Не удалось распознать чек');
  }

  try {
    return JSON.parse(jsonMatch[0]) as ReceiptData;
  } catch (e) {
    console.error('JSON parse error:', content);
    throw new Error('Ошибка разбора данных чека');
  }
};

/**
 * Чат с ассистентом через Groq
 */
export const chatWithGroq = async (
  message: string,
  receipts: ReceiptData[] = [],
  history: { role: string; text: string }[] = []
): Promise<string> => {
  if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
    throw new Error('Groq API ключ не настроен');
  }
  
  const safeReceipts = receipts || [];
  const totalSpent = safeReceipts.reduce((sum, r) => sum + (r?.total_spent || 0), 0);
  const categoryTotals: Record<string, number> = {};
  const typeTotals: Record<string, number> = {};
  
  safeReceipts.forEach(r => {
    if (r?.items_aggregated) {
      r.items_aggregated.forEach(item => {
        categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.total_price;
        typeTotals[item.type] = (typeTotals[item.type] || 0) + item.total_price;
      });
    }
  });

  // Получаем инструкцию для языка
  const langPrompt = getAISystemPromptLanguage();
  const currentLang = getCurrentLanguage();
  
  const noReceiptsText = currentLang === 'kk' 
    ? "Пайдаланушы әлі чектерді жүктемеген. Қаржылық сауаттылық бойынша жалпы кеңестер бер."
    : currentLang === 'en'
    ? "User hasn't uploaded any receipts yet. Give general financial literacy tips."
    : "Пользователь ещё не загрузил чеки. Дай общие советы по финансовой грамотности.";

  const contextString = safeReceipts.length > 0 
    ? `
Данные о расходах пользователя:
- Всего чеков: ${safeReceipts.length}
- Общая сумма: ${totalSpent.toFixed(2)} ${safeReceipts[0]?.currency || '₸'}
- Расходы по категориям: ${JSON.stringify(categoryTotals)}
- Расходы по типам: ${JSON.stringify(typeTotals)}
`
    : noReceiptsText;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: [
        { 
          role: 'system', 
          content: `${langPrompt.instruction} Давай практические советы по экономии. ${contextString}` 
        },
        ...history.map(h => ({ role: h.role, content: h.text })),
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Ошибка Groq API');
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'Не удалось получить ответ';
};
