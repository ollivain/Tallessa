import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { loadAppState } from './storage/storage';
import { I18nProvider } from './i18n';
import { MemorialProvider } from './state/MemorialContext';
import { ThemeProvider } from './state/ThemeContext';
import RootNavigator from './navigation/RootNavigator';
import LoadingScreen from './components/LoadingScreen';
import { colors } from './theme/colors';

const navTheme = {
  dark: false,
  colors: {
    primary:      colors.accentDark,
    background:   colors.background,
    // PWA parity: in the PWA every screen sits on --cream (background).
    // React Navigation's `card` colour is the per-screen base layer that
    // shows through wherever a screen doesn't paint its own background. If
    // we leave it at `surface` (a darker beige) it bleeds in at the edges
    // and behind safe-area insets, making the whole app look framed by a
    // tinted card. Aligning `card` to `background` removes that frame.
    card:         colors.background,
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
        <ThemeProvider initialTheme={appState.settings?.theme}>
          <MemorialProvider
            initialMemorials={appState.memorials}
            initialActiveId={appState.activeId}
          >
            <NavigationContainer theme={navTheme}>
              <RootNavigator />
            </NavigationContainer>
          </MemorialProvider>
        </ThemeProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
