import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { I18nProvider, useI18n } from './i18n';
import { MemorialProvider } from './state/MemorialContext';
import RootNavigator from './navigation/RootNavigator';
import { colors } from './theme/colors';

const navTheme = {
  dark: false,
  colors: {
    primary: colors.accentDark,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.divider,
    notification: colors.accent,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: '900' },
  },
};

function AppShell() {
  const { t } = useI18n();
  return (
    <MemorialProvider t={t}>
      <NavigationContainer theme={navTheme}>
        <RootNavigator />
      </NavigationContainer>
    </MemorialProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <I18nProvider>
        <AppShell />
      </I18nProvider>
    </SafeAreaProvider>
  );
}
