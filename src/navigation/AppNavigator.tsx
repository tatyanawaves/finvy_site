import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../utils/colors';

// Screens
import { AuthScreen } from '../screens/AuthScreen';
import { ReceiptsScreen } from '../screens/ReceiptsScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { MarketsScreen } from '../screens/MarketsScreen';
import { LearnScreen } from '../screens/LearnScreen';
import { AssistantScreen } from '../screens/AssistantScreen';
import { NewsScreen } from '../screens/NewsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { CameraScreen } from '../screens/CameraScreen';

// Types
import { RootStackParamList, MainTabParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Main Tab Navigator
const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Receipts':
              iconName = focused ? 'receipt' : 'receipt-outline';
              break;
            case 'Analytics':
              iconName = focused ? 'pie-chart' : 'pie-chart-outline';
              break;
            case 'Markets':
              iconName = focused ? 'trending-up' : 'trending-up-outline';
              break;
            case 'News':
              iconName = focused ? 'newspaper' : 'newspaper-outline';
              break;
            case 'Assistant':
              iconName = focused ? 'sparkles' : 'sparkles-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 16,
          paddingBottom: 28,
          height: 115,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 6,
        },
        headerStyle: {
          backgroundColor: colors.surface,
          shadowColor: 'transparent',
          elevation: 0,
          height: 110,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 20,
        },
        headerTitleAlign: 'left',
        headerLeftContainerStyle: {
          paddingLeft: 16,
        },
      })}
    >
      <Tab.Screen
        name="Receipts"
        component={ReceiptsScreen}
        options={{
          title: 'Чеки',
          headerTitle: 'Мои чеки',
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          title: 'Аналитика',
          headerTitle: 'Умная аналитика',
        }}
      />
      <Tab.Screen
        name="Markets"
        component={MarketsScreen}
        options={{
          title: 'Рынки',
          headerTitle: 'Рынки',
        }}
      />
      <Tab.Screen
        name="News"
        component={NewsScreen}
        options={{
          title: 'Новости',
          headerTitle: 'Новости',
        }}
      />
      <Tab.Screen
        name="Assistant"
        component={AssistantScreen}
        options={{
          title: 'AI',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Профиль',
          headerTitle: 'Мой профиль',
        }}
      />
    </Tab.Navigator>
  );
};

// Root Navigator
export const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or splash screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen 
              name="Camera" 
              component={CameraScreen}
              options={{
                animation: 'slide_from_bottom',
                presentation: 'fullScreenModal',
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
