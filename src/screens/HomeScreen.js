import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.brand}>Tallessa</Text>
          <View style={styles.divider} />
          <Text style={styles.brandSecondary}>Withen</Text>
        </View>

        <View style={styles.tagline}>
          <Text style={styles.taglineFi}>Paikka rakkaiden muistoille.</Text>
          <Text style={styles.taglineEn}>A quiet place for cherished memories.</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Tervetuloa.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

// TODO: Port full feature set from the web/PWA version (memorials, memories,
// letters, calendar). This is only the initial Expo bootstrap screen.

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    paddingVertical: 48,
  },
  header: {
    alignItems: 'center',
    marginTop: 32,
  },
  brand: {
    fontSize: 44,
    fontWeight: '300',
    color: colors.textPrimary,
    letterSpacing: 3,
  },
  divider: {
    height: 1,
    width: 56,
    backgroundColor: colors.accent,
    marginVertical: 14,
    opacity: 0.6,
  },
  brandSecondary: {
    fontSize: 14,
    color: colors.textMuted,
    letterSpacing: 6,
    textTransform: 'uppercase',
  },
  tagline: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  taglineFi: {
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 10,
    lineHeight: 26,
  },
  taglineEn: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: colors.textMuted,
    letterSpacing: 2,
  },
});
