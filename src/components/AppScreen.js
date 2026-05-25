import { ImageBackground, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, screenStyles, spacing } from '../theme/designSystem';

// Paper-style screen wrapper. The optional `background` prop accepts a require
// (e.g. require('../../assets/bg-koti.png')) so each screen can use its own
// watercolour image like the web version. Falling back to a flat cream when no
// image is supplied keeps the screen safe even if the asset is missing.
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
    <SafeAreaView style={styles.safe} edges={edges}>
      {inner}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
});

export { spacing };
