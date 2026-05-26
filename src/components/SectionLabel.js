import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme/designSystem';

// Two variants mirroring the PWA eyebrow patterns:
//   plain → PWA .eyebrow  (0.72rem ≈ 11px, --brown, font-weight 700, uppercase)
//   pill  → PWA .memory-of-day .eyebrow / .daily-quote .eyebrow
//           (0.62rem ≈ 10px, rounded 999px chip, rgba(224,216,196,.72) bg)
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
  // PWA .eyebrow { font-size:0.72rem; font-weight:700; color:var(--brown);
  //                letter-spacing:0.08em; text-transform:uppercase }
  text: {
    fontSize:      typography.sizes.eyebrow,
    letterSpacing: typography.letterSpacing.eyebrow,
    color:         colors.brown,
    fontWeight:    typography.weights.bold,
    textTransform: 'uppercase',
  },
  // PWA .memory-of-day .eyebrow / .daily-quote .eyebrow:
  //   min-height:24px; border-radius:999px; padding:0 10px;
  //   color:rgba(48,56,45,0.78); background:rgba(224,216,196,0.72);
  //   font-size:0.62rem; letter-spacing:0.11em
  pill: {
    alignSelf:       'flex-start',
    minHeight:       24,
    paddingHorizontal: 10,
    paddingVertical: 0,
    borderRadius:    999,
    backgroundColor: colors.pillBg,
    justifyContent:  'center',
  },
  pillText: {
    fontSize:      typography.sizes.eyebrowSmall,
    letterSpacing: typography.letterSpacing.eyebrowPill,
    color:         colors.pillText,
    fontWeight:    typography.weights.heavy,
    textTransform: 'uppercase',
  },
});
