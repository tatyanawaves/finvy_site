// Партнёрские ссылки — все в одном месте для удобной замены
// Замените URL на реальные партнёрские ссылки когда получите их

export interface AffiliateLink {
  name: string;
  url: string;
  cta: string;
  description: string;
  icon: string; // Ionicons name
  gradientColors: [string, string];
}

export const AFFILIATE_LINKS: Record<string, AffiliateLink> = {
  crypto: {
    name: 'Bybit',
    url: 'https://www.bybit.com/invite?ref=XXXXX',
    cta: 'Купить криптовалюту',
    description: 'Торгуйте криптовалютой на Bybit',
    icon: 'logo-bitcoin',
    gradientColors: ['#f59e0b', '#d97706'],
  },
  stocks: {
    name: 'Freedom Finance',
    url: 'https://freedom24.com/invite?ref=XXXXX',
    cta: 'Купить акции',
    description: 'Инвестируйте в акции на Freedom Finance',
    icon: 'trending-up',
    gradientColors: ['#6366f1', '#4f46e5'],
  },
  metals: {
    name: 'Halyk Gold',
    url: 'https://halykgold.kz/?ref=XXXXX',
    cta: 'Купить золото',
    description: 'Покупайте золото онлайн',
    icon: 'diamond',
    gradientColors: ['#eab308', '#ca8a04'],
  },
  currencies: {
    name: 'Freedom Finance',
    url: 'https://freedom24.com/invite?ref=XXXXX',
    cta: 'Обменять валюту',
    description: 'Выгодный обмен валют',
    icon: 'cash',
    gradientColors: ['#10b981', '#059669'],
  },
};

// Общий баннер для Аналитики и Ассистента
export const INVEST_BANNER = {
  name: 'Freedom Finance',
  url: 'https://freedom24.com/invite?ref=XXXXX',
  cta: 'Начать инвестировать',
  description: 'Откройте брокерский счёт и начните инвестировать',
  icon: 'rocket',
  gradientColors: ['#6366f1', '#8b5cf6'] as [string, string],
};
