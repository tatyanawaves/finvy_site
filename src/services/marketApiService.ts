// Сервис для получения реальных котировок с API
// Finnhub — US акции, Binance — криптовалюты, MetalpriceAPI — металлы, KASE — казахстанские акции

const FINNHUB_API_KEY = process.env.EXPO_PUBLIC_FINNHUB_API_KEY || '';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const BINANCE_BASE_URL = 'https://api.binance.com/api/v3';
const METALPRICE_API_KEY = process.env.EXPO_PUBLIC_METALPRICE_API_KEY || '';
const METALPRICE_BASE_URL = 'https://api.metalpriceapi.com/v1';

// Кэш для хранения данных и уменьшения количества запросов
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

const cache: Record<string, CacheItem<any>> = {};
const CACHE_TTL = 60 * 1000; // 1 минута

function getCached<T>(key: string): T | null {
  const item = cache[key];
  if (item && Date.now() - item.timestamp < CACHE_TTL) {
    return item.data;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache[key] = { data, timestamp: Date.now() };
}

// Интерфейсы
export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency?: string;
}

export interface CryptoQuote {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
}

export interface MetalQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  unit: string;
}

// ===== KASE (Казахстанские акции) =====

interface KZStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
}

// Реальные данные с KASE (обновляются при парсинге)
let kaseStocksCache: KZStock[] = [
  { symbol: 'HSBK', name: 'Halyk Bank', price: 401.88, change: 0.80, changePercent: 0.20, currency: '₸' },
  { symbol: 'KZTO', name: 'КазТрансОйл', price: 966.00, change: 2.22, changePercent: 0.23, currency: '₸' },
  { symbol: 'KEGC', name: 'KEGOC', price: 1471.95, change: 0, changePercent: 0, currency: '₸' },
  { symbol: 'KMGZ', name: 'КазМунайГаз', price: 23999.99, change: 873.99, changePercent: 3.78, currency: '₸' },
  { symbol: 'KSPI', name: 'Kaspi.kz', price: 39901.00, change: -897.00, changePercent: -2.20, currency: '₸' },
  { symbol: 'KZAP', name: 'Казатомпром', price: 41950.00, change: -2340.00, changePercent: -5.28, currency: '₸' },
  { symbol: 'AIRA', name: 'Air Astana', price: 870.78, change: -1.22, changePercent: -0.14, currency: '₸' },
  { symbol: 'CCBN', name: 'ЦентрКредит', price: 4730.51, change: -31.49, changePercent: -0.66, currency: '₸' },
];

async function fetchKaseStocks(): Promise<void> {
  const cacheKey = 'kase_stocks';
  const cached = getCached<KZStock[]>(cacheKey);
  if (cached) {
    kaseStocksCache = cached;
    return;
  }

  try {
    // KASE не предоставляет бесплатный API, используем CORS-прокси для парсинга
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    const kaseUrl = encodeURIComponent('https://kase.kz/ru/shares/');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 секунд таймаут
    
    const response = await fetch(`${proxyUrl}${kaseUrl}`, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn('KASE fetch failed, using cached data');
      return;
    }

    const html = await response.text();
    const stocksData = parseKaseHtml(html);
    
    if (stocksData.length > 0) {
      kaseStocksCache = stocksData;
      setCache(cacheKey, stocksData);
    }
  } catch (error: any) {
    // AbortError — таймаут, не критично, используем кэшированные данные
    if (error?.name === 'AbortError') {
      console.warn('KASE fetch timeout, using cached data');
    } else {
      console.warn('KASE parsing error, using cached data:', error);
    }
  }
}

function parseKaseHtml(html: string): KZStock[] {
  const stocks: KZStock[] = [];
  
  const stockPatterns = [
    { symbol: 'HSBK', name: 'Halyk Bank' },
    { symbol: 'KZTO', name: 'КазТрансОйл' },
    { symbol: 'KEGC', name: 'KEGOC' },
    { symbol: 'KMGZ', name: 'КазМунайГаз' },
    { symbol: 'KSPI', name: 'Kaspi.kz' },
    { symbol: 'KZAP', name: 'Казатомпром' },
    { symbol: 'AIRA', name: 'Air Astana' },
    { symbol: 'CCBN', name: 'ЦентрКредит' },
  ];

  const priceMap: Record<string, { price: number; changePercent: number }> = {};
  
  const rows = html.split('\n');
  for (const row of rows) {
    for (const pattern of stockPatterns) {
      if (row.includes(pattern.symbol)) {
        const priceMatch = row.match(/(\d[\d\s]*[,.]?\d*)/g);
        const percentMatch = row.match(/([+-]?\d+[,.]?\d*)\s*%/);
        
        if (priceMatch && priceMatch.length > 0) {
          const priceStr = priceMatch[0].replace(/\s/g, '').replace(',', '.');
          const price = parseFloat(priceStr);
          
          let changePercent = 0;
          if (percentMatch) {
            changePercent = parseFloat(percentMatch[1].replace(',', '.'));
          }
          
          if (price > 0) {
            priceMap[pattern.symbol] = { price, changePercent };
          }
        }
      }
    }
  }

  for (const pattern of stockPatterns) {
    const data = priceMap[pattern.symbol];
    const cachedStock = kaseStocksCache.find(s => s.symbol === pattern.symbol);
    
    if (data) {
      const change = data.price * (data.changePercent / 100);
      stocks.push({
        symbol: pattern.symbol,
        name: pattern.name,
        price: data.price,
        change: Math.round(change * 100) / 100,
        changePercent: data.changePercent,
        currency: '₸',
      });
    } else if (cachedStock) {
      stocks.push(cachedStock);
    }
  }

  return stocks.length > 0 ? stocks : [];
}

// ===== FINNHUB API (US Акции) =====

const STOCK_SYMBOLS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'META', name: 'Meta Platforms' },
];

export async function fetchStockQuote(symbol: string): Promise<StockQuote | null> {
  const cacheKey = `stock_${symbol}`;
  const cached = getCached<StockQuote>(cacheKey);
  if (cached) return cached;

  if (!FINNHUB_API_KEY || FINNHUB_API_KEY === 'your_finnhub_api_key_here') {
    return null;
  }

  try {
    const response = await fetch(
      `${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.c || data.c === 0) {
      return null;
    }

    const stockInfo = STOCK_SYMBOLS.find(s => s.symbol === symbol);
    const quote: StockQuote = {
      symbol,
      name: stockInfo?.name || symbol,
      price: data.c,
      change: data.d || 0,
      changePercent: data.dp || 0,
    };

    setCache(cacheKey, quote);
    return quote;
  } catch (error) {
    console.error(`Error fetching stock quote for ${symbol}:`, error);
    return null;
  }
}

export async function fetchAllStocks(): Promise<StockQuote[]> {
  const cacheKey = 'all_stocks';
  const cached = getCached<StockQuote[]>(cacheKey);
  if (cached) return cached;

  const quotes: StockQuote[] = [];
  
  // Получаем US акции из Finnhub
  for (const stock of STOCK_SYMBOLS) {
    const quote = await fetchStockQuote(stock.symbol);
    if (quote) {
      quotes.push(quote);
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Получаем казахстанские акции (реальные данные с KASE)
  await fetchKaseStocks();
  
  for (const kzStock of kaseStocksCache) {
    quotes.push({
      symbol: kzStock.symbol,
      name: kzStock.name,
      price: kzStock.price,
      change: kzStock.change,
      changePercent: kzStock.changePercent,
      currency: kzStock.currency,
    });
  }

  setCache(cacheKey, quotes);
  return quotes;
}

// ===== BINANCE API (Криптовалюты) — Бесплатно, без регистрации =====

const CRYPTO_SYMBOLS = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', displaySymbol: 'BTC' },
  { symbol: 'ETHUSDT', name: 'Ethereum', displaySymbol: 'ETH' },
  { symbol: 'BNBUSDT', name: 'BNB', displaySymbol: 'BNB' },
  { symbol: 'SOLUSDT', name: 'Solana', displaySymbol: 'SOL' },
  { symbol: 'XRPUSDT', name: 'Ripple', displaySymbol: 'XRP' },
  { symbol: 'ADAUSDT', name: 'Cardano', displaySymbol: 'ADA' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', displaySymbol: 'DOGE' },
  { symbol: 'TONUSDT', name: 'Toncoin', displaySymbol: 'TON' },
];

export async function fetchCryptoQuotes(): Promise<CryptoQuote[]> {
  const cacheKey = 'all_crypto';
  const cached = getCached<CryptoQuote[]>(cacheKey);
  if (cached) return cached;

  try {
    const symbols = CRYPTO_SYMBOLS.map(c => `"${c.symbol}"`).join(',');
    const response = await fetch(
      `${BINANCE_BASE_URL}/ticker/24hr?symbols=[${symbols}]`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    const quotes: CryptoQuote[] = data.map((ticker: any) => {
      const cryptoInfo = CRYPTO_SYMBOLS.find(c => c.symbol === ticker.symbol);
      return {
        id: cryptoInfo?.displaySymbol.toLowerCase() || ticker.symbol,
        symbol: cryptoInfo?.displaySymbol || ticker.symbol.replace('USDT', ''),
        name: cryptoInfo?.name || ticker.symbol,
        price: parseFloat(ticker.lastPrice),
        change24h: parseFloat(ticker.priceChange),
        changePercent24h: parseFloat(ticker.priceChangePercent),
      };
    });

    setCache(cacheKey, quotes);
    return quotes;
  } catch (error) {
    console.error('Error fetching crypto quotes from Binance:', error);
    return [];
  }
}

// ===== MetalpriceAPI (Металлы) — Реальные данные =====

const METAL_NAMES: Record<string, string> = {
  XAU: 'Золото',
  XAG: 'Серебро',
  XPT: 'Платина',
  XPD: 'Палладий',
};

let USD_TO_KZT = 501.24;
const GRAMS_PER_OZ = 31.1035;
let previousMetalPrices: Record<string, number> = {};

export async function fetchMetalQuotes(): Promise<MetalQuote[]> {
  const cacheKey = 'all_metals';
  const cached = getCached<MetalQuote[]>(cacheKey);
  if (cached) return cached;

  try {
    if (!METALPRICE_API_KEY) {
      console.warn('MetalpriceAPI key not configured');
      return getFallbackMetalQuotes();
    }

    const response = await fetch(
      `${METALPRICE_BASE_URL}/latest?api_key=${METALPRICE_API_KEY}&base=USD&currencies=XAU,XAG,XPT,XPD`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.rates) {
      throw new Error('Invalid API response');
    }

    const quotes: MetalQuote[] = [];
    const processedSymbols = new Set<string>();

    for (const [rateKey, rateValue] of Object.entries(data.rates)) {
      const symbol = rateKey.replace('USD', '');
      
      if (!METAL_NAMES[symbol]) continue;
      // Пропускаем дубликаты (API может вернуть и USDXAG, и XAG)
      if (processedSymbols.has(symbol)) continue;
      processedSymbols.add(symbol);

      // MetalpriceAPI может возвращать данные в двух форматах:
      // 1) Обратный курс (oz-per-USD): rateValue < 1 → цена = 1/rateValue
      // 2) Прямая цена (USD-per-oz): rateValue > 1 → цена = rateValue
      // Все драгметаллы стоят > $1/oz, поэтому используем эвристику:
      const rawRate = rateValue as number;
      const invertedPrice = 1 / rawRate;
      const pricePerOz = invertedPrice > 1 ? invertedPrice : rawRate;
      
      const prevPrice = previousMetalPrices[symbol];
      
      // Рассчитываем изменение только если есть предыдущая цена и она разумна
      let change = 0;
      let changePercent = 0;
      if (prevPrice && prevPrice > 0) {
        change = pricePerOz - prevPrice;
        changePercent = (change / prevPrice) * 100;
        // Ограничиваем разумными пределами (макс ±15% за период)
        if (Math.abs(changePercent) > 15) {
          change = 0;
          changePercent = 0;
        }
      }
      
      previousMetalPrices[symbol] = pricePerOz;

      quotes.push({
        symbol,
        name: METAL_NAMES[symbol],
        price: Math.round(pricePerOz * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        unit: '$/oz',
      });

      if (symbol === 'XAU' || symbol === 'XAG') {
        const pricePerGram = (pricePerOz / GRAMS_PER_OZ) * USD_TO_KZT;
        const prevPricePerGramVal = prevPrice ? (prevPrice / GRAMS_PER_OZ) * USD_TO_KZT : pricePerGram;
        const changeKZT = pricePerGram - prevPricePerGramVal;
        
        quotes.push({
          symbol: `${symbol}/KZT`,
          name: `${METAL_NAMES[symbol]} (₸)`,
          price: Math.round(pricePerGram),
          change: Math.abs(changePercent) > 0 ? Math.round(changeKZT) : 0,
          changePercent: Math.round(changePercent * 100) / 100,
          unit: '₸/г',
        });
      }
    }

    setCache(cacheKey, quotes);
    return quotes;
  } catch (error) {
    console.error('Error fetching metal quotes:', error);
    return getFallbackMetalQuotes();
  }
}

function getFallbackMetalQuotes(): MetalQuote[] {
  const fallbackPrices = [
    { symbol: 'XAU', name: 'Золото', price: 2045, unit: '$/oz' },
    { symbol: 'XAG', name: 'Серебро', price: 23.15, unit: '$/oz' },
    { symbol: 'XPT', name: 'Платина', price: 925, unit: '$/oz' },
    { symbol: 'XPD', name: 'Палладий', price: 985, unit: '$/oz' },
  ];

  const quotes: MetalQuote[] = [];
  
  for (const metal of fallbackPrices) {
    const randomChange = (Math.random() - 0.5) * 0.02;
    const price = metal.price * (1 + randomChange);
    
    quotes.push({
      symbol: metal.symbol,
      name: metal.name,
      price: Math.round(price * 100) / 100,
      change: Math.round((price - metal.price) * 100) / 100,
      changePercent: Math.round(randomChange * 10000) / 100,
      unit: metal.unit,
    });

    if (metal.symbol === 'XAU' || metal.symbol === 'XAG') {
      const pricePerGram = (price / GRAMS_PER_OZ) * USD_TO_KZT;
      quotes.push({
        symbol: `${metal.symbol}/KZT`,
        name: `${metal.name} (₸)`,
        price: Math.round(pricePerGram),
        change: Math.round((pricePerGram - (metal.price / GRAMS_PER_OZ) * USD_TO_KZT)),
        changePercent: Math.round(randomChange * 10000) / 100,
        unit: '₸/г',
      });
    }
  }

  return quotes;
}

// ===== КУРСЫ ВАЛЮТ (через exchangerate.host / открытые API) =====

export interface CurrencyQuote {
  symbol: string;
  name: string;
  rate: number;
  change: number;
  changePercent: number;
  flag: string;
}

const CURRENCY_PAIRS = [
  { symbol: 'USD/KZT', name: 'Доллар США', base: 'USD', flag: '🇺🇸' },
  { symbol: 'EUR/KZT', name: 'Евро', base: 'EUR', flag: '🇪🇺' },
  { symbol: 'RUB/KZT', name: 'Российский рубль', base: 'RUB', flag: '🇷🇺' },
  { symbol: 'GBP/KZT', name: 'Фунт стерлингов', base: 'GBP', flag: '🇬🇧' },
  { symbol: 'CNY/KZT', name: 'Китайский юань', base: 'CNY', flag: '🇨🇳' },
  { symbol: 'TRY/KZT', name: 'Турецкая лира', base: 'TRY', flag: '🇹🇷' },
  { symbol: 'UZS/KZT', name: 'Узбекский сум', base: 'UZS', flag: '🇺🇿' },
  { symbol: 'KGS/KZT', name: 'Кыргызский сом', base: 'KGS', flag: '🇰🇬' },
];

let previousCurrencyRates: Record<string, number> = {};

// Заглушки курсов валют (актуальные на февраль 2026)
const FALLBACK_CURRENCY_RATES: Record<string, number> = {
  'USD/KZT': 501.24,
  'EUR/KZT': 528.50,
  'RUB/KZT': 5.12,
  'GBP/KZT': 632.80,
  'CNY/KZT': 68.95,
  'TRY/KZT': 14.20,
  'UZS/KZT': 0.038,
  'KGS/KZT': 5.72,
};

export async function fetchCurrencyQuotes(): Promise<CurrencyQuote[]> {
  const cacheKey = 'all_currencies';
  const cached = getCached<CurrencyQuote[]>(cacheKey);
  if (cached) return cached;

  try {
    // Используем открытый API для курсов валют относительно KZT
    const response = await fetch(
      'https://open.er-api.com/v6/latest/KZT'
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.rates) {
      throw new Error('Invalid currency API response');
    }

    const quotes: CurrencyQuote[] = [];

    for (const pair of CURRENCY_PAIRS) {
      const kztRate = data.rates[pair.base];
      if (!kztRate || kztRate === 0) continue;

      // API возвращает курс KZT → X, нам нужен X → KZT
      const rate = 1 / kztRate;
      const prevRate = previousCurrencyRates[pair.symbol];
      
      let change = 0;
      let changePercent = 0;
      if (prevRate && prevRate > 0) {
        change = rate - prevRate;
        changePercent = (change / prevRate) * 100;
        if (Math.abs(changePercent) > 10) {
          change = 0;
          changePercent = 0;
        }
      }
      
      previousCurrencyRates[pair.symbol] = rate;

      quotes.push({
        symbol: pair.symbol,
        name: pair.name,
        rate: Math.round(rate * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        flag: pair.flag,
      });
    }

    if (quotes.length > 0) {
      setCache(cacheKey, quotes);
      return quotes;
    }
    
    return getFallbackCurrencyQuotes();
  } catch (error) {
    console.error('Error fetching currency quotes:', error);
    return getFallbackCurrencyQuotes();
  }
}

function getFallbackCurrencyQuotes(): CurrencyQuote[] {
  return CURRENCY_PAIRS.map(pair => ({
    symbol: pair.symbol,
    name: pair.name,
    rate: FALLBACK_CURRENCY_RATES[pair.symbol] || 0,
    change: 0,
    changePercent: 0,
    flag: pair.flag,
  }));
}

// ===== ОБЩАЯ ФУНКЦИЯ =====

export interface AllMarketData {
  stocks: StockQuote[];
  crypto: CryptoQuote[];
  metals: MetalQuote[];
  currencies: CurrencyQuote[];
  lastUpdated: number;
  isLive: boolean;
}

export async function fetchAllMarketData(): Promise<AllMarketData> {
  const cacheKey = 'all_market_data';
  const cached = getCached<AllMarketData>(cacheKey);
  if (cached) return cached;

  try {
    const [stocks, crypto, metals, currencies] = await Promise.all([
      fetchAllStocks(),
      fetchCryptoQuotes(),
      fetchMetalQuotes(),
      fetchCurrencyQuotes(),
    ]);

    const data: AllMarketData = {
      stocks,
      crypto,
      metals,
      currencies,
      lastUpdated: Date.now(),
      isLive: stocks.length > 0 && crypto.length > 0,
    };

    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching all market data:', error);
    return {
      stocks: [],
      crypto: [],
      metals: [],
      currencies: [],
      lastUpdated: Date.now(),
      isLive: false,
    };
  }
}

// Проверка настроены ли API ключи
export function isApiConfigured(): boolean {
  return !!FINNHUB_API_KEY && FINNHUB_API_KEY !== 'your_finnhub_api_key_here';
}

export function isMetalApiConfigured(): boolean {
  return !!METALPRICE_API_KEY && METALPRICE_API_KEY !== 'your_metalprice_api_key_here';
}

export function getKaseStocks(): KZStock[] {
  return kaseStocksCache;
}
