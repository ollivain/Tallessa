import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing } from '../theme/designSystem';

// Brief splash shown while AsyncStorage hydrates. Visuals mirror the PWA
// pre-load placeholder: warm cream background, large serif wordmark and a
// thin brown rule below.
export default function LoadingScreen() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.brand}>Tallessa</Text>
      <View style={styles.rule} />
      <ActivityIndicator size="small" color={colors.brown} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    // PWA --color-background / --cream
    backgroundColor: colors.background,
    alignItems:      'center',
    justifyContent:  'center',
  },
  brand: {
    // PWA brand wordmark: serif, large, ink colour
    fontFamily:    typography.serif,
    fontSize:      36,
    fontWeight:    typography.weights.regular,
    color:         colors.textPrimary,
    letterSpacing: 0,
  },
  rule: {
    height:          1,
    width:           40,
    // PWA --brown
    backgroundColor: colors.brown,
    marginVertical:  spacing.md,
    opacity:         0.5,
  },
  spinner: {
    marginTop: spacing.xs,
  },
});
