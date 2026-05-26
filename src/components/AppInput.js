import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, inputStyles, spacing, typography } from '../theme/designSystem';

// Labelled text/textarea input.
// Visual rules mirror styles.css inputs:
//   border 1px var(--line), border-radius 14px, padding 13×14,
//   background rgba(255,252,246,0.88), font-size max(1rem, 16px).
// Multiline matches PWA `textarea { min-height: 108px; line-height: 1.55 }`.
export default function AppInput({ label, style, inputStyle, multiline, ...rest }) {
  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={inputStyles.label}>{label}</Text> : null}
      <TextInput
        style={[
          inputStyles.base,
          multiline && styles.multiline,
          inputStyle,
        ]}
        // PWA uses `select:has(option[value=""]:checked) { color: var(--muted) }`
        // for placeholder appearance — RN takes a flat colour, so use --muted.
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  // PWA textarea: min-height 108, line-height 1.55 ≈ 22 at 14px
  multiline: {
    minHeight:        108,
    paddingTop:       13,
    paddingBottom:    13,
    textAlignVertical: 'top',
    lineHeight:       typography.lineHeights.body,
  },
});
