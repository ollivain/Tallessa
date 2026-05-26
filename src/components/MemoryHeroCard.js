import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadows, typography } from '../theme/designSystem';
import PositionedImage, { cardPosition } from './PositionedImage';

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
  imagePosition,
  // Tap handler used by HomeScreen to toggle the floating ImageControls.
  // When omitted, the card stays purely presentational.
  onPress,
}) {
  const source = imageSource ?? fallbackSource;
  // PWA parity: `.hero` has a fixed min/max height — the picker preview can
  // honour the user's aspectRatio choice, but the saved hero card always
  // cover-fits into that height. `cardPosition` strips numeric aspectRatio.
  const renderPosition = imageSource ? cardPosition(imagePosition) : undefined;

  const inner = (
    <View style={styles.card}>
      {source ? (
        <View style={styles.image}>
          <PositionedImage
            source={source}
            position={renderPosition}
            style={StyleSheet.absoluteFill}
          />
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
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [styles.shadow, pressed && { opacity: 0.96 }]}
      >
        {inner}
      </Pressable>
    );
  }

  return <View style={styles.shadow}>{inner}</View>;
}

// Vertical bands approximating the CSS linear-gradient. Each band's percentage
// size is derived from the array length so adding/removing bands just works.
function GradientStack() {
  const bands = colors.heroOverlayBands;
  const pct = 100 / bands.length;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {bands.map((bg, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${i * pct}%`,
            height: `${pct}%`,
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
  // PWA: .hero { min-height: clamp(330px, 74vw, 382px) } — 330 min, 382 max
  card: {
    borderRadius: radii.xxl,
    overflow: 'hidden',
    backgroundColor: colors.moss,
    minHeight: 330,
    maxHeight: 382,
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
