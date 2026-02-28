import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';

type NewsTab = 'tengrinews' | 'neon';

const TABS: { id: NewsTab; label: string; url: string; icon: string; color: string }[] = [
  {
    id: 'tengrinews',
    label: 'Новости',
    url: 'https://tengrinews.kz/',
    icon: 'newspaper-outline',
    color: '#3b82f6',
  },
  {
    id: 'neon',
    label: 'NEON',
    url: 'https://neon-extended.web.app/',
    icon: 'planet-outline',
    color: '#8b5cf6',
  },
];

export const NewsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NewsTab>('tengrinews');
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const currentTab = TABS.find((t) => t.id === activeTab)!;

  const handleGoBack = () => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
    }
  };

  const handleGoHome = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(
        `window.location.href = '${currentTab.url}'; true;`
      );
    }
  };

  const handleRefresh = () => {
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const handleTabChange = (tabId: NewsTab) => {
    if (tabId !== activeTab) {
      setActiveTab(tabId);
      setLoading(true);
      setCanGoBack(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && { backgroundColor: tab.color },
            ]}
            onPress={() => handleTabChange(tab.id)}
          >
            <Ionicons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.id ? 'white' : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.id && styles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.toolbarButton, !canGoBack && styles.toolbarButtonDisabled]}
          onPress={handleGoBack}
          disabled={!canGoBack}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={canGoBack ? colors.textPrimary : colors.textMuted}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolbarButton} onPress={handleGoHome}>
          <Ionicons name="home-outline" size={18} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.urlBar}>
          <Ionicons name="globe-outline" size={14} color={colors.textMuted} />
          <Text style={styles.urlText} numberOfLines={1}>
            {activeTab === 'tengrinews' ? 'tengrinews.kz' : 'neon-extended.web.app'}
          </Text>
          {loading && (
            <ActivityIndicator size="small" color={currentTab.color} style={{ marginLeft: 4 }} />
          )}
        </View>

        <TouchableOpacity style={styles.toolbarButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* WebView */}
      <WebView
        key={activeTab}
        ref={webViewRef}
        source={{ uri: currentTab.url }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack);
        }}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={currentTab.color} />
            <Text style={styles.loadingText}>
              {activeTab === 'tengrinews' ? 'Загрузка новостей...' : 'Загрузка NEON...'}
            </Text>
          </View>
        )}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsBackForwardNavigationGestures={true}
        pullToRefreshEnabled={true}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 8,
    backgroundColor: colors.surface,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: 'white',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 4,
  },
  toolbarButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  toolbarButtonDisabled: {
    opacity: 0.4,
  },
  urlBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 6,
  },
  urlText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
