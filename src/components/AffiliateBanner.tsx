import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';

interface AffiliateBannerProps {
  title: string;
  description: string;
  url: string;
  icon?: string;
  gradientColors?: [string, string];
  compact?: boolean;
}

export const AffiliateBanner: React.FC<AffiliateBannerProps> = ({
  title,
  description,
  url,
  icon = 'open-outline',
  gradientColors = ['#6366f1', '#8b5cf6'],
  compact = false,
}) => {
  const handlePress = () => {
    Linking.openURL(url).catch((err) =>
      console.error('Failed to open URL:', err)
    );
  };

  if (compact) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.compactContainer}
        >
          <Ionicons name={icon as any} size={18} color="rgba(255,255,255,0.9)" />
          <Text style={styles.compactTitle}>{title}</Text>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.6)" />
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name={icon as any} size={22} color="white" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>
        </View>
        <View style={styles.ctaButton}>
          <Text style={styles.ctaText}>Перейти</Text>
          <Ionicons name="arrow-forward" size={14} color="white" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  description: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 10,
  },
  ctaText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  // Compact variant
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 8,
    gap: 8,
  },
  compactTitle: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});
