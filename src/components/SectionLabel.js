import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme/designSystem';

// Small uppercase "eyebrow" label, like the web's `.eyebrow` and the rounded
// pill chip used on memory-of-day / daily-quote cards.
export default function SectionLabel({ children, variant = 'plain', style }) {
  if (variant === 'pill') {
    return (
      <View style={[styles.pill, style]}>
        <Text style={styles.pillText}>{String(children).toUpperCase()}</Text>
      </View>
    );
  }
  return (
    <Text style={[styles.text, style]}>{String(children).toUpperCase()}</Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: typography.sizes.eyebrow,
    letterSpacing: typography.letterSpacing.eyebrow,
    color: colors.brown,
    fontWeight: '700',
  },
  pill: {
    alignSelf: 'flex-start',
    minHeight: 22,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.pillBg,
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.pillText,
    fontWeight: '800',
  },
});
