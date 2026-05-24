import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export default function LoadingScreen() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.brand}>Tallessa</Text>
      <View style={styles.rule} />
      <ActivityIndicator size="small" color={colors.accent} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: 36,
    fontWeight: '300',
    color: colors.textPrimary,
    letterSpacing: 3,
  },
  rule: {
    height: 1,
    width: 40,
    backgroundColor: colors.accent,
    marginVertical: 16,
    opacity: 0.5,
  },
  spinner: {
    marginTop: 8,
  },
});
