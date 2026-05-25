import { Image, StyleSheet, View } from 'react-native';

function normalizePosition(position) {
  const x = Number(position?.x);
  const y = Number(position?.y);
  const zoom = Number(position?.zoom);
  const fit = position?.fit === 'contain' ? 'contain' : 'cover';
  return {
    x: Number.isFinite(x) ? x : 50,
    y: Number.isFinite(y) ? y : 50,
    zoom: Number.isFinite(zoom) && zoom > 0 ? zoom : 1,
    fit,
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

  return (
    <View
      style={[
        styles.frame,
        style,
        {
          alignItems: alignFromPercent(normalized.x),
          justifyContent: alignFromPercent(normalized.y),
        },
      ]}
    >
      <Image
        source={imageSource}
        style={[
          styles.image,
          {
            width: `${normalized.zoom * 100}%`,
            height: `${normalized.zoom * 100}%`,
          },
          imageStyle,
        ]}
        resizeMode={normalized.fit}
      />
    </View>
  );
}

export function imageResizeMode(position) {
  return normalizePosition(position).fit;
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  image: {
    minWidth: '100%',
    minHeight: '100%',
  },
});
