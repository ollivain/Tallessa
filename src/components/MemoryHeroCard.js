import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadows, typography } from '../theme/designSystem';

// Hero card shown at the top of HomeScreen. Mirrors the web `.hero` block:
//   - Big rounded corners (28)
//   - Background image (memorial portrait if available, else a soft default)
//   - Stepped dark gradient overlay so text stays readable
//   - Eyebrow + memory-line text aligned to the bottom-left, on top of the
//     image, just like the web copy block.
//
// The "gradient" is approximated by 5 stacked translucent bands because the
// project doesn't ship `expo-linear-gradient`. Without that dep, layered
// rgba views give a near-identical visual result without adding install
// pressure.
export default function MemoryHeroCard({
  imageSource,
  fallbackSource,
  eyebrow,
  memoryLine,
}) {
  const source = imageSource ?? fallbackSource;

  return (
    <View style={styles.shadow}>
      <View style={styles.card}>
        {source ? (
          <ImageBackground source={source} style={styles.image} resizeMode="cover">
            <GradientStack />
            <View style={styles.copyBlock}>
              {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
              {memoryLine ? (
                <Text style={styles.memoryLine} numberOfLines={3}>
                  {memoryLine}
                </Text>
              ) : null}
            </View>
          </ImageBackground>
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <GradientStack />
            <View style={styles.copyBlock}>
              {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
              {memoryLine ? (
                <Text style={styles.memoryLine} numberOfLines={3}>
                  {memoryLine}
                </Text>
              ) : null}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

// 5 vertical bands going from very faint to fairly dark.
// Each band is 20% of the card height; stacked, they approximate the
// CSS `linear-gradient(180deg, rgba(37,42,31,.08) 24%, rgba(37,42,31,.72) 100%)`.
function GradientStack() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {colors.heroOverlayBands.map((bg, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${i * 20}%`,
            height: '20%',
            backgroundColor: bg,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Shadow needs to live on a wrapper because the card itself clips children.
  // zIndex:1 keeps the hero rendered above the memory-of-day card that overlaps it.
  shadow: {
    borderRadius: radii.xxl,
    backgroundColor: 'transparent',
    ...shadows.hero,
    marginBottom: 0,
    zIndex: 1,
  },
  card: {
    borderRadius: radii.xxl,
    overflow: 'hidden',
    backgroundColor: colors.moss,
    minHeight: 330,
  },
  image: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  placeholder: {
    backgroundColor: '#586a49',
  },
  copyBlock: {
    paddingHorizontal: 22,
    paddingBottom: 24,
    paddingTop: 14,
    gap: 8,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.8,
    color: 'rgba(255, 250, 240, 0.78)',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  memoryLine: {
    fontSize: 24,
    lineHeight: 27,
    fontFamily: typography.serif,
    fontWeight: '600',
    color: 'rgba(255, 250, 240, 0.92)',
    maxWidth: '84%',
    textShadowColor: 'rgba(28, 30, 24, 0.42)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
});
