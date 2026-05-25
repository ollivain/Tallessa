import { ImageBackground, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { screenStyles, spacing } from '../theme/designSystem';
import { useTheme } from '../state/ThemeContext';

// Paper-style screen wrapper. The optional `background` prop accepts a require
// (e.g. require('../../assets/bg-koti.png')) so each screen can use its own
// watercolour image like the web version. Falling back to the active theme's
// background colour when no image is supplied keeps the screen safe.
//
// edges defaults to `['top', 'left', 'right']` because the tab bar already
// handles bottom inset.
export default function AppScreen({
  children,
  scroll = true,
  background,
  contentStyle,
  edges = ['top', 'left', 'right'],
  ...scrollProps
}) {
  const { themeColors } = useTheme();

  const inner = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[screenStyles.scroll, contentStyle]}
      showsVerticalScrollIndicator={false}
      {...scrollProps}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, screenStyles.scroll, contentStyle]}>{children}</View>
  );

  if (background) {
    return (
      <ImageBackground source={background} resizeMode="cover" style={styles.flex}>
        <SafeAreaView style={styles.flex} edges={edges}>
          {inner}
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]} edges={edges}>
      {inner}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
});

export { spacing };
