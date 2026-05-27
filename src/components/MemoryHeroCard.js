import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, shadows, typography } from '../theme/designSystem';
import PositionedImage from './PositionedImage';
import { resolveCardAspectRatio } from '../lib/imageAspectRatio';

// Hero card shown at the top of HomeScreen. Mirrors the web `.hero` block:
//   - Big rounded corners (28)
//   - Background image (memorial portrait if available, else a soft default)
//   - Smooth dark gradient overlay so text stays readable
//   - Eyebrow + memory-line text aligned to the bottom-left, on top of the
//     image, just like the web copy block.
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
  // The hero card adopts the user's selected aspect ratio when one is
  // present in metadata. Falls back to the PWA `.hero` min/max heights
  // (330–382) when the user picked "Fill card" or there is no metadata.
  const aspect = imageSource ? resolveCardAspectRatio(imagePosition) : null;
  const cardShapeStyle = aspect
    ? { aspectRatio: aspect, minHeight: undefined, maxHeight: undefined }
    : null;

  const inner = (
    <View style={[styles.card, cardShapeStyle]}>
      {source ? (
        <View style={styles.image}>
          <PositionedImage
            source={source}
            position={imagePosition}
            style={StyleSheet.absoluteFill}
          />
          <HeroGradient />
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
          <HeroGradient />
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

function HeroGradient() {
  return (
    <LinearGradient
      colors={colors.heroOverlayGradient}
      locations={[0, 0.52, 0.74, 1]}
      style={styles.gradientOverlay}
    />
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
  // PWA `.hero { min-height: clamp(330px, 74vw, 382px) }` — 330 min, 382 max.
  // These act as the *fallback* when imagePosition has no aspectRatio (or
  // is set to 'fill'). When the user picked an aspectRatio in the picker,
  // MemoryHeroCard injects an `aspectRatio` style that overrides both
  // bounds so the hero adopts the chosen shape.
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
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
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
