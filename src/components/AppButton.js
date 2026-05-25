import { Pressable, StyleSheet, Text } from 'react-native';
import { buttonStyles } from '../theme/designSystem';
import { useTheme } from '../state/ThemeContext';

// Three variants:
//   primary  → moss-green pill, colour follows the active theme
//   secondary → ivory pill with hairline border
//   ghost    → tiny uppercase text button
export default function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  labelStyle,
}) {
  const { themeColors } = useTheme();
  const containerKey = variant in buttonStyles ? variant : 'primary';
  const labelKey = `${containerKey}Label`;

  // Override primary background colour with the active theme's moss
  const themeOverride = containerKey === 'primary'
    ? { backgroundColor: themeColors.moss }
    : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        buttonStyles[containerKey],
        themeOverride,
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
