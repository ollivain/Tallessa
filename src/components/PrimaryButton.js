import { Pressable, StyleSheet, Text } from 'react-native';
import { buttonStyles, colors } from '../theme/designSystem';

// Legacy button still used by a few callsites. Re-routes to the shared
// design-system tokens so the visual language matches AppButton and the
// PWA .primary-action / .secondary-action rules in styles.css.
export default function PrimaryButton({ label, onPress, variant = 'primary', style, disabled = false }) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        isPrimary ? buttonStyles.primary : buttonStyles.secondary,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={isPrimary ? buttonStyles.primaryLabel : buttonStyles.secondaryLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // PWA .primary-action:active: transform scale(0.98)
  pressed:  { transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
});

// Re-export for any callsite that still pulls colours from this module.
export { colors };
