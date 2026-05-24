import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

export default function PrimaryButton({ label, onPress, variant = 'primary', style }) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, isPrimary ? styles.primaryLabel : styles.secondaryLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.accentDark,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontSize: 15,
    letterSpacing: 1,
    fontWeight: '500',
  },
  primaryLabel: {
    color: '#fbf6ec',
  },
  secondaryLabel: {
    color: colors.accentDark,
  },
});
