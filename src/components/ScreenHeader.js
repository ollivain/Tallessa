import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export default function ScreenHeader({ title, subtitle }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  divider: {
    marginTop: 14,
    height: 1,
    width: 48,
    backgroundColor: colors.accent,
    opacity: 0.5,
  },
});
