import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { I18nextProvider } from 'react-i18next';

// Инициализация i18n
import i18n, { loadSavedLanguage } from './src/i18n';

// Ленивая загрузка провайдеров для избежания ошибок инициализации
const App = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [AppContent, setAppContent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    const loadApp = async () => {
      try {
        // Загрузка сохранённого языка
        await loadSavedLanguage();
        
        // Динамический импорт для отлова ошибок
        const { AuthProvider } = await import('./src/contexts/AuthContext');
        const { ReceiptsProvider } = await import('./src/contexts/ReceiptsContext');
        const { AppNavigator } = await import('./src/navigation/AppNavigator');
        
        const Content = () => (
          <AuthProvider>
            <ReceiptsProvider>
              <StatusBar style="light" />
              <AppNavigator />
            </ReceiptsProvider>
          </AuthProvider>
        );
        
        setAppContent(() => Content);
        setIsReady(true);
      } catch (e: any) {
        console.error('App initialization error:', e);
        setError(e.message || 'Ошибка загрузки');
      }
    };

    loadApp();
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Ошибка запуска</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!isReady || !AppContent) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nextProvider i18n={i18n}>
          <AppContent />
        </I18nextProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 16,
    fontSize: 16,
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  errorText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default App;
