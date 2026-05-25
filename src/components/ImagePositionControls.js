import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme/designSystem';
import { useTheme } from '../state/ThemeContext';

const DEFAULT_POSITION = { x: 50, y: 50, zoom: 1, fit: 'cover' };
const ZOOM_STEPS = [1, 1.2, 1.5, 2];
const POSITIONS = [
  { labelKey: 'imagePosition.top', value: 15, icon: 'arrow-up' },
  { labelKey: 'imagePosition.center', value: 50, icon: 'align-center' },
  { labelKey: 'imagePosition.bottom', value: 85, icon: 'arrow-down' },
];

function normalize(position) {
  const x = Number(position?.x);
  const y = Number(position?.y);
  const zoom = Number(position?.zoom);
  return {
    x: Number.isFinite(x) ? x : DEFAULT_POSITION.x,
    y: Number.isFinite(y) ? y : DEFAULT_POSITION.y,
    zoom: Number.isFinite(zoom) && zoom > 0 ? zoom : DEFAULT_POSITION.zoom,
    fit: position?.fit === 'contain' ? 'contain' : 'cover',
  };
}

export default function ImagePositionControls({ value, onChange, t }) {
  const { themeColors } = useTheme();
  const current = normalize(value);

  const update = (changes) => onChange?.({ ...current, ...changes });

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {['cover', 'contain'].map((fit) => {
          const active = current.fit === fit;
          return (
            <Pressable
              key={fit}
              onPress={() => update({ fit })}
              style={({ pressed }) => [
                styles.pill,
                active && { backgroundColor: themeColors.moss, borderColor: themeColors.moss },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {t(`imagePosition.${fit}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.row}>
        {POSITIONS.map((position) => {
          const active = Math.abs(current.y - position.value) < 2;
          return (
            <Pressable
              key={position.value}
              onPress={() => update({ y: position.value, x: 50 })}
              style={({ pressed }) => [
                styles.iconPill,
                active && { backgroundColor: themeColors.moss, borderColor: themeColors.moss },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
            >
              <Feather
                name={position.icon}
                size={14}
                color={active ? colors.textOnPrimary : themeColors.moss}
              />
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {t(position.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.row}>
        {ZOOM_STEPS.map((zoom) => {
          const active = Math.abs(current.zoom - zoom) < 0.01;
          return (
            <Pressable
              key={zoom}
              onPress={() => update({ zoom })}
              style={({ pressed }) => [
                styles.zoomPill,
                active && { backgroundColor: themeColors.moss, borderColor: themeColors.moss },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {`${zoom.toFixed(zoom === 1 ? 0 : 1)}x`}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export { DEFAULT_POSITION as DEFAULT_IMAGE_POSITION };

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  pill: {
    minHeight: 34,
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: 'rgba(255, 250, 240, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPill: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: 'rgba(255, 250, 240, 0.82)',
  },
  zoomPill: {
    minHeight: 34,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: 'rgba(255, 250, 240, 0.82)',
  },
  pillText: {
    fontSize: typography.sizes.label,
    fontWeight: '700',
    color: colors.moss,
  },
  pillTextActive: {
    color: colors.textOnPrimary,
  },
  pressed: { opacity: 0.72 },
});
