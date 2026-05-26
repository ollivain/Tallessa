import { Pressable, StyleSheet, Text } from 'react-native';
import { buttonStyles } from '../theme/designSystem';
import { useTheme } from '../state/ThemeContext';

// Three variants that mirror the PWA button rules in styles.css:
//   primary   → PWA .primary-action — moss pill, white label, deep shadow
//   secondary → PWA .secondary-action — ivory pill with hairline --line border
//   ghost     → tiny uppercase text button (no PWA equivalent, kept for menus)
//
// The active theme's moss tone is applied via ThemeContext so the colour
// matches whichever theme the user picked, just like the CSS rule
// `background: var(--moss)` does on the web.
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

  // Override primary background colour with the active theme's moss tone
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
  // PWA .primary-action:active / .section-button:active: transform scale(0.98)
  pressed:  { transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
});
