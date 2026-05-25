import { Pressable, StyleSheet, View } from 'react-native';
import { cardStyles } from '../theme/designSystem';
import { useTheme } from '../state/ThemeContext';

// Generic ivory card used for memory-of-day, daily quote, settings rows, etc.
// Renders a Pressable when `onPress` is provided, otherwise a View — keeps
// callsites tidy (no ternary boilerplate at the use site).
//
// Card background automatically follows the active theme (themeColors.card),
// matching the way the PWA applies --color-card via CSS custom properties.
export default function AppCard({
  children,
  variant = 'soft',
  onPress,
  style,
  contentStyle,
  ...rest
}) {
  const { themeColors } = useTheme();

  const base = variant === 'raised'
    ? cardStyles.raised
    : variant === 'warm'
      ? cardStyles.warm
      : cardStyles.base;

  // Override the static card colour with the active theme's card colour.
  const themed = [base, { backgroundColor: themeColors.card }, style];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [...themed, pressed && styles.pressed]}
        accessibilityRole="button"
        {...rest}
      >
        <View style={contentStyle}>{children}</View>
      </Pressable>
    );
  }
  return (
    <View style={themed} {...rest}>
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.96 },
});
