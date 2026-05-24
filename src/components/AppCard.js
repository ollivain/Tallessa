import { Pressable, StyleSheet, View } from 'react-native';
import { cardStyles } from '../theme/designSystem';

// Generic ivory card used for memory-of-day, daily quote, settings rows, etc.
// Renders a Pressable when `onPress` is provided, otherwise a View — keeps
// callsites tidy (no ternary boilerplate at the use site).
export default function AppCard({
  children,
  variant = 'soft',
  onPress,
  style,
  contentStyle,
  ...rest
}) {
  const base = variant === 'raised'
    ? cardStyles.raised
    : variant === 'warm'
      ? cardStyles.warm
      : cardStyles.base;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [base, style, pressed && styles.pressed]}
        accessibilityRole="button"
        {...rest}
      >
        <View style={contentStyle}>{children}</View>
      </Pressable>
    );
  }
  return (
    <View style={[base, style]} {...rest}>
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.96 },
});
