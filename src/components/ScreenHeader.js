import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme/designSystem';

// Transparent in-page header — mirrors the PWA topbar override used on the
// five content screens (Memory wall, Letters, Calendar, Settings, Home):
//
//   .screen[data-screen="wall"] .topbar {
//     position: static;
//     background: transparent;
//     padding-top: 6px;
//   }
//
// On those screens the title sits directly on the watercolour background
// with a small 6px top inset, no bottom divider, no blur.
export default function ScreenHeader({ title, subtitle }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // PWA `padding-top: 6px` on the static topbar override
  wrap: {
    paddingTop:    6,
    paddingBottom: 14,
  },
  // PWA h2: 2.25rem ≈ 36px, font-weight 700, color var(--moss-dark), line-height 1.02
  title: {
    fontFamily:    typography.serif,
    fontSize:      typography.sizes.h2,
    lineHeight:    typography.lineHeights.h2,
    fontWeight:    typography.weights.bold,
    color:         colors.textPrimary,
    letterSpacing: typography.letterSpacing.title,
  },
  // Italic muted subtitle (PWA uses `.lead` styling on subtitles)
  subtitle: {
    marginTop:  6,
    fontSize:   typography.sizes.label,
    color:      colors.textMuted,
    fontStyle:  'italic',
    lineHeight: typography.lineHeights.body,
    paddingHorizontal: spacing.xxxs,
  },
});
