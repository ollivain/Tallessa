import { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useI18n } from '../i18n';
import { useTheme } from '../state/ThemeContext';
import {
  colors,
  radii,
  shadows,
  spacing,
  typography,
} from '../theme/designSystem';
import PositionedImage from './PositionedImage';

// ── Crop / aspect-ratio metadata schema ───────────────────────────────────
// Every image saved through the picker carries the same metadata so the
// preview and the final card render *identically*. The same object is
// consumed by PositionedImage at render time.
//
//   aspectRatio: 'fill' | 'original' | number
//     'fill'     → fit the parent card area (default; PWA-equivalent)
//     'original' → use the image's intrinsic width/height ratio
//     number     → fixed numeric ratio (e.g. 1, 0.8 for 4:5, 1.333 for 4:3)
//   fitMode:     'cover' | 'contain'
//   x, y:        0-100 percent — where the image anchors inside the frame
//   zoom:        1.0-2.0 multiplier for cover-fit zoom
//   naturalAspect: number — image's intrinsic w/h (stored so `original`
//                  rendering survives across reloads)
//
// `fit` is also accepted for backwards compatibility (it's the old key name).
export const DEFAULT_CROP_VALUE = Object.freeze({
  aspectRatio:   'fill',
  fitMode:       'cover',
  x:             50,
  y:             50,
  zoom:          1,
  naturalAspect: 1,
});

// Aspect-ratio options match the spec: Original, 1:1, 4:5, 3:4, 4:3, 16:9,
// Fill card. They render in this exact order.
const ASPECT_OPTIONS = [
  { key: 'original',     labelKey: 'imageCrop.original',    value: 'original' },
  { key: 'square',       labelKey: 'imageCrop.square',      value: 1 },
  { key: 'portrait45',   labelKey: 'imageCrop.portrait45',  value: 4 / 5 },
  { key: 'portrait34',   labelKey: 'imageCrop.portrait34',  value: 3 / 4 },
  { key: 'landscape43',  labelKey: 'imageCrop.landscape43', value: 4 / 3 },
  { key: 'landscape169', labelKey: 'imageCrop.landscape169', value: 16 / 9 },
  { key: 'fill',         labelKey: 'imageCrop.fill',        value: 'fill' },
];

const FIT_OPTIONS = [
  { key: 'cover',   labelKey: 'imageCrop.fitCover' },
  { key: 'contain', labelKey: 'imageCrop.fitContain' },
];

const POSITION_Y_OPTIONS = [
  { key: 'top',    labelKey: 'imagePosition.top',    value: 15, icon: 'arrow-up' },
  { key: 'center', labelKey: 'imagePosition.center', value: 50, icon: 'align-center' },
  { key: 'bottom', labelKey: 'imagePosition.bottom', value: 85, icon: 'arrow-down' },
];

const POSITION_X_OPTIONS = [
  { key: 'left',   labelKey: 'imagePosition.left',   value: 15, icon: 'arrow-left' },
  { key: 'center', labelKey: 'imagePosition.center', value: 50, icon: 'align-center' },
  { key: 'right',  labelKey: 'imagePosition.right',  value: 85, icon: 'arrow-right' },
];

const ZOOM_STEPS = [1, 1.2, 1.5, 2];

function isSameAspect(a, b) {
  if (a === b) return true;
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 0.01;
  return false;
}

/**
 * Resolves a metadata `aspectRatio` value into a numeric aspect (w/h) usable
 * by RN's `aspectRatio` style prop. Returns `undefined` when the parent
 * card's existing height should win (i.e. `fill`).
 */
export function resolveAspect(aspect, naturalAspect = 1) {
  if (aspect === 'original') return naturalAspect || 1;
  if (aspect === 'fill' || aspect == null) return undefined;
  if (typeof aspect === 'number' && aspect > 0) return aspect;
  return undefined;
}

/**
 * Modal that lets the user choose aspect ratio, fit, position and zoom for
 * the image they just picked. The preview is rendered by the same
 * `PositionedImage` that renders the final card, so what they see here is
 * exactly what they will see in the saved card.
 *
 * Props:
 *   visible         – boolean
 *   uri             – string (local file URI from the picker)
 *   initialValue    – previous crop metadata (optional)
 *   defaultAspect   – default aspectRatio for first-time picks (optional)
 *   onApply(value)  – called with the chosen metadata
 *   onCancel()      – close without saving
 *   onReplace()     – re-open the system image picker
 */
export default function ImageCropAspectPicker({
  visible,
  uri,
  initialValue,
  defaultAspect,
  onApply,
  onCancel,
  onReplace,
}) {
  const { t } = useI18n();
  const { themeColors } = useTheme();

  const [value, setValue] = useState(() => initialCropState(initialValue, defaultAspect));
  const [naturalAspect, setNaturalAspect] = useState(initialValue?.naturalAspect || 1);

  // Reset the local state every time the modal opens with a new image
  useEffect(() => {
    if (visible) {
      setValue(initialCropState(initialValue, defaultAspect));
      setNaturalAspect(initialValue?.naturalAspect || 1);
    }
  }, [visible, uri, initialValue, defaultAspect]);

  // Probe the image's real dimensions so the "Original" preset is honest
  useEffect(() => {
    if (!uri) return;
    let cancelled = false;
    Image.getSize(
      uri,
      (w, h) => {
        if (cancelled || !h) return;
        const next = w / h;
        setNaturalAspect(next);
        setValue((current) => ({ ...current, naturalAspect: next }));
      },
      () => { /* silent: fall back to 1 */ },
    );
    return () => { cancelled = true; };
  }, [uri]);

  if (!uri) return null;

  const update = (changes) => setValue((current) => ({ ...current, ...changes }));
  const previewAspect = resolveAspect(value.aspectRatio, naturalAspect);
  const showPosition = value.fitMode === 'cover' && value.aspectRatio !== 'fill';

  const handleApply = () => {
    onApply?.({ ...value, naturalAspect });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onCancel}
    >
      <SafeAreaView
        style={[styles.safe, { backgroundColor: themeColors.background ?? colors.background }]}
        edges={['top', 'left', 'right']}
      >
        {/* Topbar — × cancel + title */}
        <View style={styles.topbar}>
          <Pressable onPress={onCancel} hitSlop={12} style={styles.iconBtn} accessibilityRole="button">
            <Feather name="x" size={22} color={themeColors.textPrimary} />
          </Pressable>
          <Text style={[styles.title, { color: themeColors.textPrimary }]}>{t('imageCrop.title')}</Text>
          <View style={styles.iconBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Live preview — renders with PositionedImage so it matches the final card */}
          <View style={styles.previewWrap}>
            <View
              style={[
                styles.previewFrame,
                previewAspect ? { aspectRatio: previewAspect } : { height: 280 },
                { backgroundColor: colors.surface },
              ]}
            >
              <PositionedImage
                uri={uri}
                position={{ ...value, naturalAspect }}
                style={StyleSheet.absoluteFillObject}
              />
            </View>
          </View>

          <SectionHeading>{t('imageCrop.aspectRatio')}</SectionHeading>
          <View style={styles.pillRow}>
            {ASPECT_OPTIONS.map((option) => {
              const active = isSameAspect(value.aspectRatio, option.value);
              return (
                <Pressable
                  key={option.key}
                  onPress={() => update({ aspectRatio: option.value })}
                  style={({ pressed }) => [
                    styles.pill,
                    active && { backgroundColor: themeColors.moss, borderColor: themeColors.moss },
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>
                    {t(option.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <SectionHeading>{t('imageCrop.fitMode')}</SectionHeading>
          <View style={styles.pillRow}>
            {FIT_OPTIONS.map((option) => {
              const active = value.fitMode === option.key;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => update({ fitMode: option.key })}
                  style={({ pressed }) => [
                    styles.pill,
                    active && { backgroundColor: themeColors.moss, borderColor: themeColors.moss },
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>
                    {t(option.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {showPosition ? (
            <>
              <SectionHeading>{t('imageCrop.position')}</SectionHeading>
              <View style={styles.pillRow}>
                {POSITION_Y_OPTIONS.map((option) => {
                  const active = Math.abs(value.y - option.value) < 2;
                  return (
                    <Pressable
                      key={`y-${option.key}`}
                      onPress={() => update({ y: option.value })}
                      style={({ pressed }) => [
                        styles.iconPill,
                        active && { backgroundColor: themeColors.moss, borderColor: themeColors.moss },
                        pressed && styles.pressed,
                      ]}
                      accessibilityRole="button"
                    >
                      <Feather
                        name={option.icon}
                        size={14}
                        color={active ? colors.textOnPrimary : themeColors.moss}
                      />
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>
                        {t(option.labelKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.pillRow}>
                {POSITION_X_OPTIONS.map((option) => {
                  const active = Math.abs(value.x - option.value) < 2;
                  return (
                    <Pressable
                      key={`x-${option.key}`}
                      onPress={() => update({ x: option.value })}
                      style={({ pressed }) => [
                        styles.iconPill,
                        active && { backgroundColor: themeColors.moss, borderColor: themeColors.moss },
                        pressed && styles.pressed,
                      ]}
                      accessibilityRole="button"
                    >
                      <Feather
                        name={option.icon}
                        size={14}
                        color={active ? colors.textOnPrimary : themeColors.moss}
                      />
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>
                        {t(option.labelKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <SectionHeading>{t('imageCrop.zoom')}</SectionHeading>
              <View style={styles.pillRow}>
                {ZOOM_STEPS.map((zoom) => {
                  const active = Math.abs(value.zoom - zoom) < 0.01;
                  return (
                    <Pressable
                      key={`zoom-${zoom}`}
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
            </>
          ) : null}
        </ScrollView>

        {/* Bottom action bar — Replace + Apply */}
        <View style={[styles.actionBar, { backgroundColor: themeColors.card ?? colors.card }]}>
          {onReplace ? (
            <Pressable
              onPress={onReplace}
              style={({ pressed }) => [styles.actionBtnSecondary, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
            >
              <Feather name="image" size={16} color={themeColors.moss} />
              <Text style={[styles.actionBtnSecondaryText, { color: themeColors.moss }]}>
                {t('imageCrop.replace')}
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={handleApply}
            style={({ pressed }) => [
              styles.actionBtnPrimary,
              { backgroundColor: themeColors.moss },
              pressed && { opacity: 0.88 },
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.actionBtnPrimaryText}>{t('imageCrop.apply')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function initialCropState(initialValue, defaultAspect) {
  return {
    ...DEFAULT_CROP_VALUE,
    ...(defaultAspect ? { aspectRatio: defaultAspect } : null),
    ...(initialValue || {}),
    // Normalize legacy `fit` field into `fitMode`
    fitMode: initialValue?.fitMode
      ?? (initialValue?.fit === 'contain' ? 'contain' : 'cover')
      ?? 'cover',
  };
}

function SectionHeading({ children }) {
  return <Text style={styles.sectionHeading}>{children}</Text>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topbar: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop:     spacing.xs,
    paddingBottom:  spacing.xs,
  },
  iconBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  title: {
    fontFamily:    typography.serif,
    fontSize:      typography.sizes.title,
    fontWeight:    typography.weights.semibold,
    color:         colors.textPrimary,
    letterSpacing: 0.2,
  },

  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom:     spacing.xxl,
  },

  // PWA-equivalent card frame (rounded ivory) with the live preview inside
  previewWrap: {
    borderRadius: radii.card,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  previewFrame: {
    width:        '100%',
    borderRadius: radii.card,
    overflow:     'hidden',
    borderWidth:  1,
    borderColor:  colors.divider,
  },

  // Section labels — PWA `<label> > span` styling
  sectionHeading: {
    fontSize:     typography.sizes.label,
    fontWeight:   typography.weights.bold,
    color:        colors.textPrimary,
    marginTop:    spacing.md,
    marginBottom: spacing.xs,
  },

  pillRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           spacing.xs,
  },
  pill: {
    minHeight:         34,
    paddingHorizontal: spacing.sm,
    borderRadius:      999,
    borderWidth:       1,
    borderColor:       colors.divider,
    backgroundColor:   'rgba(255, 250, 240, 0.82)',
    alignItems:        'center',
    justifyContent:    'center',
  },
  iconPill: {
    minHeight:         34,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    paddingHorizontal: spacing.sm,
    borderRadius:      999,
    borderWidth:       1,
    borderColor:       colors.divider,
    backgroundColor:   'rgba(255, 250, 240, 0.82)',
  },
  zoomPill: {
    minHeight:       34,
    minWidth:        56,
    alignItems:      'center',
    justifyContent:  'center',
    borderRadius:    999,
    borderWidth:     1,
    borderColor:     colors.divider,
    backgroundColor: 'rgba(255, 250, 240, 0.82)',
  },
  pillText: {
    fontSize:   typography.sizes.label,
    fontWeight: typography.weights.bold,
    color:      colors.moss,
  },
  pillTextActive: { color: colors.textOnPrimary },
  pressed: { opacity: 0.72 },

  // Bottom action bar
  actionBar: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    gap:               spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.sm,
    borderTopWidth:    1,
    borderTopColor:    colors.divider,
  },
  // PWA `.secondary-action`
  actionBtnSecondary: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    minHeight:         48,
    paddingHorizontal: spacing.md,
    borderRadius:      radii.secondary,
    borderWidth:       1,
    borderColor:       colors.divider,
    backgroundColor:   colors.card,
  },
  actionBtnSecondaryText: {
    fontSize:   typography.sizes.label,
    fontWeight: typography.weights.heavy,
    color:      colors.moss,
  },
  // PWA `.primary-action`
  actionBtnPrimary: {
    flex:              1,
    minHeight:         52,
    paddingHorizontal: spacing.lg,
    borderRadius:      radii.button,
    backgroundColor:   colors.moss,
    alignItems:        'center',
    justifyContent:    'center',
    ...shadows.button,
  },
  actionBtnPrimaryText: {
    color:         colors.textOnPrimary,
    fontSize:      typography.sizes.body,
    fontWeight:    typography.weights.bold,
    letterSpacing: 0.3,
  },
});
