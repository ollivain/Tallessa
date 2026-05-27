import { Image, StyleSheet, View } from 'react-native';
import { resolveCardAspectRatio } from '../lib/imageAspectRatio';

// PositionedImage renders an image with the metadata produced by
// ImageCropAspectPicker (or the legacy `ImagePositionControls`). The same
// metadata is used both in the picker preview and the final card render —
// so what the user sees while cropping is exactly what they get.
//
// Metadata schema (see ImageCropAspectPicker.js + lib/imageAspectRatio.js):
//   aspectRatio:    'fill' | 'original' | number
//   fitMode:        'cover' | 'contain'
//   x, y:           0-100 percent
//   zoom:           1.0-2.0
//   naturalAspect:  number — image's intrinsic w/h
//   width, height:  numbers — raw pixel dims (optional)
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
    width:  Number(position?.width)  || undefined,
    height: Number(position?.height) || undefined,
  };
}

function alignFromPercent(value) {
  if (value <= 25) return 'flex-start';
  if (value >= 75) return 'flex-end';
  return 'center';
}

export default function PositionedImage({ uri, source, position, style, imageStyle }) {
  const normalized = normalizePosition(position);
  const imageSource = uri ? { uri } : source;
  if (!imageSource) return <View style={style} />;

  // When metadata picks a real aspect ratio (1, 4/5, original, …), let it
  // drive the card's shape. To make that take effect we *unset* any fixed
  // height the parent might have supplied — otherwise RN's aspectRatio style
  // is ignored when a height also exists.
  const aspectRatio = resolveCardAspectRatio(normalized);
  const aspectStyle = aspectRatio
    ? { aspectRatio, height: undefined, minHeight: undefined, maxHeight: undefined }
    : null;

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

// Backwards-compatible no-op: earlier code wrapped positions with
// `cardPosition()` to *force* aspectRatio:'fill' on every card. That defeated
// the whole point of letting users pick a ratio, so the wrapper now passes
// the metadata through untouched. Kept exported so existing imports don't
// break — call sites can be deleted opportunistically.
export function cardPosition(position) {
  return position;
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
