import { Pressable, StyleSheet, Text } from 'react-native';
import { buttonStyles } from '../theme/designSystem';

// Three variants:
//   primary  → moss-green pill, used for hero CTAs
//   secondary → ivory pill with hairline border
//   ghost    → tiny uppercase text button (e.g., "Switch memorial")
export default function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  labelStyle,
}) {
  const containerKey = variant in buttonStyles ? variant : 'primary';
  const labelKey = `${containerKey}Label`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        buttonStyles[containerKey],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[buttonStyles[labelKey], labelStyle]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
});
