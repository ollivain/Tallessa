import { StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing } from '../theme/designSystem';

export default function ScreenHeader({ title, subtitle }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontFamily: typography.serif,
    fontSize: typography.sizes.titleLarge,
    fontWeight: typography.weights.regular,
    color: colors.textPrimary,
    letterSpacing: typography.letterSpacing.title,
  },
  subtitle: {
    marginTop: 6,
    fontSize: typography.sizes.label,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  divider: {
    marginTop: 12,
    height: 1,
    width: 48,
    backgroundColor: colors.brown,
    opacity: 0.5,
  },
});
