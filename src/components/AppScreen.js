import { ImageBackground, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { screenStyles, spacing } from '../theme/designSystem';
import { useTheme } from '../state/ThemeContext';

// Paper-style screen wrapper. The optional `background` prop accepts a require
// (e.g. require('../../assets/bg-koti.png')) so each screen can use its own
// watercolour image like the PWA. Falling back to the active theme's
// background colour when no image is supplied keeps the screen safe.
//
// PWA parity: the PWA's `body::before` paints the watercolour full-viewport
// and is fixed behind the safe area. Here the `ImageBackground` wraps the
// SafeAreaView, so the watercolour fills the status-bar area too — exactly
// like the PWA. SafeAreaView only insets the *content*, not the background.
//
// edges defaults to `['top', 'left', 'right']` because the tab bar already
// handles the bottom inset.
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
      // `style.flex: 1` + no border-radius anywhere on this wrapper keeps the
      // watercolour edge-to-edge. Any rounded card belongs to the *content*,
      // not to the screen container.
      <ImageBackground source={background} resizeMode="cover" style={styles.flex}>
        <SafeAreaView style={styles.transparentSafe} edges={edges}>
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
  // Transparent so the ImageBackground watercolour shows through behind the
  // safe-area inset (PWA `body::before` parity).
  transparentSafe: { flex: 1, backgroundColor: 'transparent' },
  flex: { flex: 1 },
});

export { spacing };
