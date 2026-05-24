import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { loadAppState } from './storage/storage';
import { I18nProvider } from './i18n';
import { MemorialProvider } from './state/MemorialContext';
import RootNavigator from './navigation/RootNavigator';
import LoadingScreen from './components/LoadingScreen';
import { colors } from './theme/colors';

const navTheme = {
  dark: false,
  colors: {
    primary:      colors.accentDark,
    background:   colors.background,
    card:         colors.surface,
    text:         colors.textPrimary,
    border:       colors.divider,
    notification: colors.accent,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium:  { fontFamily: 'System', fontWeight: '500' },
    bold:    { fontFamily: 'System', fontWeight: '700' },
    heavy:   { fontFamily: 'System', fontWeight: '900' },
  },
};

export default function App() {
  // null = loading, object = ready
  const [appState, setAppState] = useState(null);

  useEffect(() => {
    loadAppState()
      .then(setAppState)
      .catch((e) => {
        console.error('[App] loadAppState threw unexpectedly:', e);
        // Fall back to a clean slate so the app is never stuck on the loader.
        setAppState({ memorials: [], activeId: null, settings: {} });
      });
  }, []);

  if (appState === null) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <LoadingScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <I18nProvider initialLanguage={appState.settings?.language}>
        <MemorialProvider
          initialMemorials={appState.memorials}
          initialActiveId={appState.activeId}
        >
          <NavigationContainer theme={navTheme}>
            <RootNavigator />
          </NavigationContainer>
        </MemorialProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
