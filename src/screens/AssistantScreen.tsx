import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useReceipts } from '../hooks/useReceipts';
import { colors } from '../utils/colors';
import { ChatMessage } from '../types';
import { AffiliateBanner } from '../components/AffiliateBanner';
import { INVEST_BANNER } from '../config/affiliateLinks';
import { fetchAllMarketData, AllMarketData, isApiConfigured } from '../services/marketApiService';

const QUICK_PROMPTS = [
  { icon: 'trending-up', text: 'На что я трачу больше всего?', color: colors.primary },
  { icon: 'wallet-outline', text: 'Где можно сэкономить?', color: '#10b981' },
  { icon: 'stats-chart', text: 'Какие акции сейчас растут?', color: '#f59e0b' },
  { icon: 'logo-bitcoin', text: 'Стоит ли покупать крипту?', color: '#f59e0b' },
  { icon: 'bulb', text: 'Куда инвестировать экономию?', color: '#6366f1' },
];

// Интерфейс чата
interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

const CHATS_STORAGE_KEY = 'finvy_mobile_chats';

// Начальное сообщение
const getWelcomeMessage = (): ChatMessage => ({
  id: 'welcome',
  role: 'model',
  text: `Привет! 👋 Я ваш финансовый ассистент с доступом к:

📊 Вашим чекам — анализ расходов
📈 Рынкам — акции, криптовалюты
💡 Советам — экономия и инвестиции

Спрашивайте что угодно!`,
  timestamp: new Date(),
});

// Создание нового чата
const createNewChat = (): Chat => ({
  id: Date.now().toString(),
  title: 'Новый чат',
  messages: [getWelcomeMessage()],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const AssistantScreen: React.FC = () => {
  const { receipts = [] } = useReceipts() || { receipts: [] };
  const [chats, setChats] = useState<Chat[]>([createNewChat()]);
  const [activeChatId, setActiveChatId] = useState<string>('');
  const [showChatsModal, setShowChatsModal] = useState(false);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [liveMarketData, setLiveMarketData] = useState<AllMarketData | null>(null);
  const [isLive, setIsLive] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Активный чат
  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];
  const messages = activeChat?.messages || [];

  // Загрузка чатов из AsyncStorage
  useEffect(() => {
    const loadChats = async () => {
      try {
        const stored = await AsyncStorage.getItem(CHATS_STORAGE_KEY);
        if (stored) {
          const parsedChats = JSON.parse(stored);
          setChats(parsedChats);
          setActiveChatId(parsedChats[0]?.id || '');
        } else {
          const newChat = createNewChat();
          setChats([newChat]);
          setActiveChatId(newChat.id);
        }
      } catch (e) {
        console.error('Error loading chats:', e);
        const newChat = createNewChat();
        setChats([newChat]);
        setActiveChatId(newChat.id);
      }
    };
    loadChats();
  }, []);

  // Сохранение чатов
  useEffect(() => {
    const saveChats = async () => {
      try {
        await AsyncStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats));
      } catch (e) {
        console.error('Error saving chats:', e);
      }
    };
    if (chats.length > 0 && activeChatId) {
      saveChats();
    }
  }, [chats]);

  // Обновление сообщений в активном чате
  const updateMessages = (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    setChats(prevChats => prevChats.map(chat => {
      if (chat.id === activeChatId) {
        const newMessages = typeof updater === 'function' ? updater(chat.messages) : updater;
        let newTitle = chat.title;
        if (chat.title === 'Новый чат') {
          const firstUserMsg = newMessages.find(m => m.role === 'user');
          if (firstUserMsg) {
            newTitle = firstUserMsg.text.slice(0, 25) + (firstUserMsg.text.length > 25 ? '...' : '');
          }
        }
        return { ...chat, messages: newMessages, title: newTitle, updatedAt: new Date().toISOString() };
      }
      return chat;
    }));
  };

  // Создание нового чата
  const handleNewChat = () => {
    const newChat = createNewChat();
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setShowChatsModal(false);
  };

  // Удаление чата
  const handleDeleteChat = (chatId: string) => {
    Alert.alert(
      'Удалить чат?',
      'Это действие нельзя отменить',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => {
            if (chats.length === 1) {
              const newChat = createNewChat();
              setChats([newChat]);
              setActiveChatId(newChat.id);
            } else {
              const newChats = chats.filter(c => c.id !== chatId);
              setChats(newChats);
              if (activeChatId === chatId) {
                setActiveChatId(newChats[0]?.id || '');
              }
            }
          }
        }
      ]
    );
  };

  // Выбор чата
  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setShowChatsModal(false);
  };

  // Загрузка рыночных данных
  const loadMarketData = useCallback(async () => {
    try {
      const data = await fetchAllMarketData();
      setLiveMarketData(data);
      setIsLive(data.isLive);
    } catch (error) {
      console.error('Error loading market data:', error);
    }
  }, []);

  useEffect(() => {
    loadMarketData();
    const interval = setInterval(loadMarketData, 120000);
    return () => clearInterval(interval);
  }, [loadMarketData]);

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Подготовка контекста с рыночными данными
  const prepareMarketContext = () => {
    if (!liveMarketData || !isLive) return '';
    
    const btc = liveMarketData.crypto.find(c => c.symbol === 'BTC');
    const eth = liveMarketData.crypto.find(c => c.symbol === 'ETH');
    const topStocks = liveMarketData.stocks.sort((a, b) => b.changePercent - a.changePercent).slice(0, 3);
    const topCrypto = liveMarketData.crypto.sort((a, b) => b.changePercent24h - a.changePercent24h).slice(0, 3);
    
    return `
АКТУАЛЬНЫЕ РЫНОЧНЫЕ ДАННЫЕ (LIVE):

📈 АКЦИИ (топ по росту):
${topStocks.map(s => `- ${s.symbol}: $${s.price.toFixed(2)} (${s.changePercent >= 0 ? '+' : ''}${s.changePercent.toFixed(2)}%)`).join('\n')}

₿ КРИПТОВАЛЮТЫ (24ч):
- BTC: $${btc?.price.toLocaleString() || 'N/A'} (${btc?.changePercent24h?.toFixed(2) || 0}%)
- ETH: $${eth?.price.toLocaleString() || 'N/A'} (${eth?.changePercent24h?.toFixed(2) || 0}%)
${topCrypto.map(c => `- ${c.symbol}: $${c.price.toLocaleString()} (${c.changePercent24h >= 0 ? '+' : ''}${c.changePercent24h.toFixed(2)}%)`).join('\n')}
`;
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: messageText,
      timestamp: new Date(),
    };

    updateMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role === 'model' ? 'assistant' : 'user',
        text: m.text,
      }));

      // Подготовка расширенного контекста
      const currency = receipts.length > 0 ? (receipts[0]?.currency || '₸') : '₸';
      const totalSpent = receipts.reduce((sum, r) => sum + (r?.total_spent || 0), 0);
      
      // Анализ категорий
      const categoryTotals: Record<string, number> = {};
      const typeTotals: Record<string, number> = {};
      receipts.forEach(r => {
        if (r?.items_aggregated) {
          r.items_aggregated.forEach(item => {
            categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.total_price;
            typeTotals[item.type] = (typeTotals[item.type] || 0) + item.total_price;
          });
        }
      });
      
      const luxuryAmount = typeTotals['Luxury'] || 0;
      const potentialSavings = luxuryAmount * 0.3;
      
      const topCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([cat, amount]) => `${cat}: ${amount.toFixed(0)}${currency}`);

      const spendingContext = receipts.length > 0 
        ? `
РАСХОДЫ ПОЛЬЗОВАТЕЛЯ:
- Всего: ${totalSpent.toFixed(0)} ${currency}
- Премиум: ${luxuryAmount.toFixed(0)} ${currency}
- Потенциальная экономия: ${potentialSavings.toFixed(0)} ${currency}/мес
- Топ категории: ${topCategories.join(', ')}
`
        : 'Пользователь ещё не загрузил чеки.';

      const marketContext = prepareMarketContext();
      
      const systemPrompt = `Ты - финансовый ассистент в приложении Finvy. У тебя есть доступ к расходам пользователя и реальным рыночным данным.

ПРАВИЛА:
- Отвечай на русском языке
- Используй конкретные цифры из данных
- Связывай экономию с инвестициями: "Если сократить X, хватит на покупку Y"
- Предупреждай о рисках инвестиций
- Используй эмодзи для читаемости

${spendingContext}
${marketContext}`;

      // Запрос к Groq API
      const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            ...history.map(h => ({ role: h.role, content: h.text })),
            { role: 'user', content: messageText }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка API');
      }

      const data = await response.json();
      const botResponse = data.choices[0]?.message?.content || 'Не удалось получить ответ';

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: botResponse,
        timestamp: new Date(),
      };

      updateMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `Произошла ошибка: ${error.message || 'Попробуйте снова.'}`,
        timestamp: new Date(),
      };
      updateMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        {!isUser && (
          <View style={styles.avatarBot}>
            <Ionicons name="sparkles" size={16} color={colors.primary} />
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isUser ? styles.messageBubbleUser : styles.messageBubbleBot
        ]}>
          <Text style={[
            styles.messageText,
            isUser && styles.messageTextUser
          ]}>
            {item.text}
          </Text>
        </View>
        {isUser && (
          <View style={styles.avatarUser}>
            <Ionicons name="person" size={16} color={colors.accent} />
          </View>
        )}
      </View>
    );
  };

  // Форматирование даты
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Сегодня';
    if (days === 1) return 'Вчера';
    if (days < 7) return `${days} дн. назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <View style={styles.container}>
      {/* Chats Modal */}
      <Modal
        visible={showChatsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChatsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Чаты</Text>
              <View style={styles.modalHeaderButtons}>
                <TouchableOpacity 
                  style={styles.modalNewButton}
                  onPress={handleNewChat}
                >
                  <Ionicons name="add" size={20} color={colors.primary} />
                  <Text style={styles.modalNewButtonText}>Новый</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setShowChatsModal(false)}
                >
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
            
            <FlatList
              data={chats}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.chatItem,
                    item.id === activeChatId && styles.chatItemActive
                  ]}
                  onPress={() => handleSelectChat(item.id)}
                >
                  <View style={styles.chatItemIcon}>
                    <Ionicons 
                      name="chatbubble-outline" 
                      size={18} 
                      color={item.id === activeChatId ? colors.primary : colors.textMuted} 
                    />
                  </View>
                  <View style={styles.chatItemContent}>
                    <Text style={[
                      styles.chatItemTitle,
                      item.id === activeChatId && styles.chatItemTitleActive
                    ]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.chatItemDate}>{formatDate(item.updatedAt)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.chatDeleteButton}
                    onPress={() => handleDeleteChat(item.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.chatsList}
            />
            
            <View style={styles.modalFooter}>
              <Text style={styles.modalFooterText}>
                {chats.length} {chats.length === 1 ? 'чат' : chats.length < 5 ? 'чата' : 'чатов'}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setShowChatsModal(true)}
          >
            <Ionicons name="menu" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.headerIcon}>
            <Ionicons name="sparkles" size={20} color={colors.primary} />
          </View>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {activeChat?.title || 'Ассистент'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {receipts.length > 0 ? `${receipts.length} чеков` : 'Рынки + Советы'}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.newChatButton}
            onPress={handleNewChat}
          >
            <Ionicons name="add" size={20} color={colors.primary} />
          </TouchableOpacity>
          <View style={[
            styles.liveIndicator,
            { backgroundColor: isLive ? '#10b98120' : '#64748b20' }
          ]}>
            <Ionicons 
              name={isLive ? 'wifi' : 'wifi-outline'} 
              size={10} 
              color={isLive ? '#10b981' : '#64748b'} 
            />
            <Text style={[
              styles.liveText,
              { color: isLive ? '#10b981' : '#64748b' }
            ]}>
              {isLive ? 'Live' : 'Demo'}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={messages.length > 2 ? (
          <View style={{ paddingHorizontal: 4, paddingBottom: 8 }}>
            <AffiliateBanner
              title={INVEST_BANNER.cta}
              description={INVEST_BANNER.description}
              url={INVEST_BANNER.url}
              icon={INVEST_BANNER.icon}
              gradientColors={INVEST_BANNER.gradientColors}
              compact
            />
          </View>
        ) : null}
      />

      {/* Loading indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBubble}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Думаю...</Text>
          </View>
        </View>
      )}

      {/* Quick prompts */}
      {messages.length <= 2 && (
        <View style={styles.quickPrompts}>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.quickPrompt, { borderColor: prompt.color + '40' }]}
              onPress={() => sendMessage(prompt.text)}
              disabled={loading}
            >
              <Ionicons 
                name={prompt.icon as any} 
                size={14} 
                color={prompt.color} 
              />
              <Text style={[styles.quickPromptText, { color: prompt.color }]}>{prompt.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Спросите о расходах..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
            editable={!loading}
            onSubmitEditing={() => sendMessage()}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || loading) && styles.sendButtonDisabled
            ]}
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || loading}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modalHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modalNewButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  modalCloseButton: {
    padding: 4,
  },
  chatsList: {
    padding: 12,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chatItemActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary + '40',
  },
  chatItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatItemContent: {
    flex: 1,
  },
  chatItemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  chatItemTitleActive: {
    color: colors.primary,
  },
  chatItemDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  chatDeleteButton: {
    padding: 8,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  modalFooterText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuButton: {
    padding: 8,
    marginRight: 4,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  newChatButton: {
    padding: 6,
    backgroundColor: colors.primary + '20',
    borderRadius: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '600',
  },
  btcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f59e0b20',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  btcText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#f59e0b',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  avatarBot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarUser: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 14,
    borderRadius: 18,
  },
  messageBubbleBot: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  messageBubbleUser: {
    backgroundColor: colors.accent + '30',
    borderWidth: 1,
    borderColor: colors.accent + '40',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  messageTextUser: {
    color: colors.textPrimary,
  },
  loadingContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    alignSelf: 'flex-start',
    gap: 8,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  quickPrompts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  quickPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  quickPromptText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: 24,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 16,
    fontSize: 16,
    color: colors.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
