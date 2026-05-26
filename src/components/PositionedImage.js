import { Image, StyleSheet, View } from 'react-native';

// PositionedImage renders an image with the metadata produced by
// ImageCropAspectPicker (or the legacy `ImagePositionControls`). The same
// metadata is used both in the picker preview and the final card render —
// so what the user sees while cropping is exactly what they get.
//
// Metadata schema (see ImageCropAspectPicker.js):
//   aspectRatio: 'fill' | 'original' | number
//   fitMode:     'cover' | 'contain'
//   x, y:        0-100 percent
//   zoom:        1.0-2.0
//   naturalAspect: number (used when aspectRatio === 'original')
//
// `fit` is still accepted for backwards compatibility.

function normalizePosition(position) {
  const x    = Number(position?.x);
  const y    = Number(position?.y);
  const zoom = Number(position?.zoom);
  const naturalAspect = Number(position?.naturalAspect);
  return {
    x:    Number.isFinite(x)    ? x    : 50,
    y:    Number.isFinite(y)    ? y    : 50,
    zoom: Number.isFinite(zoom) && zoom > 0 ? zoom : 1,
    fitMode: position?.fitMode
      ?? (position?.fit === 'contain' ? 'contain' : 'cover'),
    aspectRatio: position?.aspectRatio ?? 'fill',
    naturalAspect: Number.isFinite(naturalAspect) && naturalAspect > 0
      ? naturalAspect
      : 1,
  };
}

function alignFromPercent(value) {
  if (value <= 25) return 'flex-start';
  if (value >= 75) return 'flex-end';
  return 'center';
}

// Resolve the aspectRatio metadata into a numeric value or `undefined`
// (meaning "let the parent frame's height drive layout").
function resolveAspectStyle(aspectRatio, naturalAspect) {
  if (aspectRatio === 'original') return { aspectRatio: naturalAspect || 1 };
  if (typeof aspectRatio === 'number' && aspectRatio > 0) return { aspectRatio };
  // 'fill' or null/undefined → defer to parent's height/width
  return null;
}

export default function PositionedImage({ uri, source, position, style, imageStyle }) {
  const normalized = normalizePosition(position);
  const imageSource = uri ? { uri } : source;
  if (!imageSource) return <View style={style} />;

  // When the caller-supplied style sets an explicit height *and* metadata
  // says `fill`, the parent's height wins (PWA-equivalent behaviour). When
  // metadata supplies a numeric/intrinsic aspectRatio, we add an
  // `aspectRatio` style so the frame's height tracks its width.
  const aspectStyle = resolveAspectStyle(normalized.aspectRatio, normalized.naturalAspect);

  return (
    <View
      style={[
        styles.frame,
        style,
        aspectStyle,
        {
          alignItems:     alignFromPercent(normalized.x),
          justifyContent: alignFromPercent(normalized.y),
        },
      ]}
    >
      <Image
        source={imageSource}
        style={[
          styles.image,
          {
            width:  `${normalized.zoom * 100}%`,
            height: `${normalized.zoom * 100}%`,
          },
          imageStyle,
        ]}
        resizeMode={normalized.fitMode}
      />
    </View>
  );
}

export function imageResizeMode(position) {
  return normalizePosition(position).fitMode;
}

const styles = StyleSheet.create({
  frame: {
    overflow:        'hidden',
    backgroundColor: 'transparent',
  },
  image: {
    minWidth:  '100%',
    minHeight: '100%',
  },
});
