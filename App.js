import React, { useState, useEffect } from 'react';
import { View, StyleSheet, BackHandler, Alert } from 'react-native';
import { Provider as PaperProvider, Text, ActivityIndicator } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { theme } from './src/services/Theme';

// Placeholder screens - We will implement these next
import OnboardingScreen from './src/screens/OnboardingScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import SettingsScreen from './src/screens/SettingsScreen';

import { registerForPushNotificationsAsync, scheduleDailyReminder } from './src/services/Notifications';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('onboarding'); // 'onboarding' | 'dashboard' | 'calendar' | 'settings'
  const [userUser, setUser] = useState(null);

  useEffect(() => {
    async function setupApp() {
      await checkUser();
      await registerForPushNotificationsAsync();
      await scheduleDailyReminder();
    }
    setupApp();
  }, []);

  // Back Button Handler
  useEffect(() => {
    const backAction = () => {
      // If we are NOT on dashboard (and not on onboarding), go back to dashboard
      if (currentScreen !== 'dashboard' && currentScreen !== 'onboarding') {
        setCurrentScreen('dashboard');
        return true;
      }

      // If we ARE on dashboard, ask to exit
      if (currentScreen === 'dashboard') {
        Alert.alert("Hold on!", "Are you sure you want to exit?", [
          {
            text: "Cancel",
            onPress: () => null,
            style: "cancel"
          },
          { text: "YES", onPress: () => BackHandler.exitApp() }
        ]);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [currentScreen]);

  const checkUser = async () => {
    try {
      const name = await AsyncStorage.getItem('userName');
      if (name) {
        setUser(name);
        setCurrentScreen('dashboard');
      } else {
        setCurrentScreen('onboarding');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishOnboarding = async (name) => {
    await AsyncStorage.setItem('userName', name);
    setUser(name);
    setCurrentScreen('dashboard');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Simple Router
  const renderScreen = () => {
    switch (currentScreen) {
      case 'onboarding':
        return <OnboardingScreen onFinish={handleFinishOnboarding} />;
      case 'dashboard':
        return <DashboardScreen navigate={setCurrentScreen} userName={userUser} />;
      case 'calendar':
        return <CalendarScreen navigate={setCurrentScreen} />;
      case 'settings':
        return <SettingsScreen navigate={setCurrentScreen} />;
      default:
        return <DashboardScreen navigate={setCurrentScreen} userName={userUser} />;
    }
  };

  return (
    <PaperProvider theme={theme}>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {renderScreen()}
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
});
