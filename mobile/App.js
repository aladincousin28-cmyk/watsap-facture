import React, { useState, useEffect } from 'react';
import { StatusBar, Platform, Dimensions } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './src/screens/HomeScreen';
import InvoicesScreen from './src/screens/InvoicesScreen';
import CreateInvoiceScreen from './src/screens/CreateInvoiceScreen';
import ClientsScreen from './src/screens/ClientsScreen';
import ExpensesScreen from './src/screens/ExpensesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { ToastProvider } from './src/components/Toast';
import { getColors, getTheme, setTheme } from './src/theme';
import { t, getCurrentLang } from './src/i18n';

const Tab = createBottomTabNavigator();

const NAV_DARK = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: '#D4A843',
    background: '#0a0a14',
    card: '#181830',
    text: '#f0f0f0',
    border: '#1e1e3a',
    notification: '#D4A843',
  },
};

const NAV_LIGHT = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: '#B8860B',
    background: '#f5f5f7',
    card: '#ffffff',
    text: '#1a1a1a',
    border: '#e0e0e5',
    notification: '#B8860B',
  },
};

const navBarHeight = Platform.OS === 'android'
  ? Math.max(18, (Dimensions.get('screen').height - Dimensions.get('window').height))
  : 0;

export default function App() {
  const [themeMode, setThemeMode] = useState(getTheme());
  const [lang, setLang] = useState(getCurrentLang());

  useEffect(() => { SplashScreen.hideAsync(); }, []);

  const C = getColors();
  const isDark = themeMode === 'dark';

  return (
    <ToastProvider>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#0a0a14' : '#f5f5f7'} />
      <NavigationContainer theme={isDark ? NAV_DARK : NAV_LIGHT}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              const icons = { Home: 'home-outline', Invoices: 'document-text-outline', Expenses: 'cash-outline', Clients: 'people-outline', Create: 'add-circle', Settings: 'settings-outline' };
              const filledIcons = { Home: 'home', Invoices: 'document-text', Expenses: 'cash', Clients: 'people', Create: 'add-circle', Settings: 'settings' };
              return <Ionicons name={focused ? filledIcons[route.name] : icons[route.name]} size={size} color={color} />;
            },
            tabBarActiveTintColor: C.gold,
            tabBarInactiveTintColor: C.muted,
            tabBarStyle: { backgroundColor: C.card, borderTopColor: C.cardBorder, borderTopWidth: 1, height: 56 + navBarHeight, paddingBottom: navBarHeight + 4, paddingTop: 6 },
            tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
            headerStyle: { backgroundColor: C.surface, shadowColor: 'transparent', elevation: 0 },
            headerTintColor: C.gold,
            headerTitleStyle: { fontWeight: '700', fontSize: 17 },
            headerShadowVisible: false,
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('home'), headerShown: false }} />
          <Tab.Screen name="Invoices" component={InvoicesScreen} options={{ title: t('invoices') }} />
          <Tab.Screen name="Clients" component={ClientsScreen} options={{ title: t('clients') }} />
          <Tab.Screen name="Expenses" component={ExpensesScreen} options={{ title: t('expenses') }} />
          <Tab.Screen name="Create" component={CreateInvoiceScreen} options={{ title: t('newInvoice') }} />
          <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: t('settings') }} initialParams={{ onThemeChange: (mode) => setThemeMode(mode), onLangChange: (l) => setLang(l) }} />
        </Tab.Navigator>
      </NavigationContainer>
    </ToastProvider>
  );
}
