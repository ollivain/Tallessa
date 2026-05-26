import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useI18n } from '../i18n';
import { useTheme } from '../state/ThemeContext';
import { colors, radii, shadows, spacing, typography } from '../theme/designSystem';

// ImageControls — shared "change / edit crop / remove" pill row used on every
// user-supplied image. Hosted by the surrounding screen, which passes the
// three callbacks. The component itself is purely presentational so all
// images get the same affordances and the same metadata shape.
//
// Variants:
//   floating → pinned top-right over an image (e.g. home hero card)
//   inline   → laid out below a picker frame (e.g. settings portrait)
//
// PWA parity: the PWA places a single "Change image" pill at the top-right
// of the hero / memorial / month-cover images. We expand that into three
// actions because RN can't free-drag-zoom the way the PWA does — making
// "Edit crop" a first-class affordance is what closes the parity gap.
export default function ImageControls({
  variant = 'floating',
  // PWA parity: PWA hides the "Change image" pill until the user interacts
  // with the image. RN mirrors that with a parent-controlled `visible` flag.
  // Inline controls (Settings / Creation pickers) default to visible because
  // they live *below* the image — they aren't an overlay that needs hiding.
  visible = true,
  hasImage,
  onPick,
  onEditCrop,
  onRemove,
  pickLabel,
  editLabel,
  removeLabel,
  style,
}) {
  const { t } = useI18n();
  const { themeColors } = useTheme();
  const isFloating = variant === 'floating';
  const containerStyle = isFloating ? styles.floating : styles.inline;

  // Floating controls fully unmount when hidden so they don't intercept taps
  // intended for the image underneath. Inline controls ignore the flag.
  if (isFloating && !visible) return null;

  return (
    <View style={[containerStyle, style]} pointerEvents="box-none">
      {/* Change picture — always shown */}
      <Pressable
        onPress={onPick}
        accessibilityRole="button"
        accessibilityLabel={pickLabel ?? (hasImage ? t('creation.changePortrait') : t('creation.pickPortrait'))}
        style={({ pressed }) => [
          isFloating ? styles.floatingPill : styles.inlinePill,
          pressed && styles.pressed,
        ]}
      >
        <Feather name="image" size={14} color={isFloating ? '#fffaf0' : themeColors.moss} />
        <Text
          style={[
            isFloating ? styles.floatingText : styles.inlineText,
            !isFloating && { color: themeColors.moss },
          ]}
          numberOfLines={1}
        >
          {pickLabel ?? (hasImage ? t('creation.changePortrait') : t('creation.pickPortrait'))}
        </Text>
      </Pressable>

      {/* Edit crop — only when there is an image */}
      {hasImage && onEditCrop ? (
        <Pressable
          onPress={onEditCrop}
          accessibilityRole="button"
          accessibilityLabel={editLabel ?? t('imageCrop.edit')}
          style={({ pressed }) => [
            isFloating ? styles.floatingPill : styles.inlinePill,
            pressed && styles.pressed,
          ]}
        >
          <Feather name="crop" size={14} color={isFloating ? '#fffaf0' : themeColors.moss} />
          <Text
            style={[
              isFloating ? styles.floatingText : styles.inlineText,
              !isFloating && { color: themeColors.moss },
            ]}
            numberOfLines={1}
          >
            {editLabel ?? t('imageCrop.edit')}
          </Text>
        </Pressable>
      ) : null}

      {/* Remove — only when there is an image */}
      {hasImage && onRemove ? (
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={removeLabel ?? t('creation.removePortrait')}
          style={({ pressed }) => [
            isFloating ? [styles.floatingPill, styles.dangerFloating] : styles.inlinePill,
            pressed && styles.pressed,
          ]}
        >
          <Feather name="trash-2" size={14} color={isFloating ? '#fffaf0' : colors.danger} />
          <Text
            style={[
              isFloating ? styles.floatingText : styles.inlineText,
              !isFloating && { color: colors.danger },
            ]}
            numberOfLines={1}
          >
            {removeLabel ?? t('creation.removePortrait')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // PWA `.image-change.hero-change { top: 14; right: 14 }` — floats over the
  // image. We stack three pills vertically so long Finnish labels still fit
  // on narrow phones.
  floating: {
    position: 'absolute',
    top:      14,
    right:    14,
    alignItems: 'flex-end',
    gap:      6,
    zIndex:   3,
  },
  // PWA `.image-change` background — moss-dark with white text
  floatingPill: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    minHeight:         34,
    paddingHorizontal: 13,
    borderRadius:      999,
    backgroundColor:   'rgba(48, 56, 45, 0.72)',
    borderWidth:       1,
    borderColor:       'rgba(255, 250, 240, 0.42)',
    ...shadows.pill,
  },
  dangerFloating: {
    backgroundColor: 'rgba(143, 77, 56, 0.92)',
    borderColor:     'transparent',
  },
  floatingText: {
    color:         '#fffaf0',
    fontSize:      typography.sizes.label,
    fontWeight:    typography.weights.bold,
    letterSpacing: 0.2,
  },

  // Inline variant — used wherever the controls sit *below* a picker frame
  // (settings portrait, memorial creation image pickers).
  inline: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           spacing.xs,
  },
  inlinePill: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    paddingVertical:   8,
    paddingHorizontal: spacing.sm,
    borderRadius:      999,
    borderWidth:       1,
    borderColor:       colors.divider,
    backgroundColor:   colors.card,
  },
  inlineText: {
    fontSize:      typography.sizes.label,
    fontWeight:    typography.weights.bold,
    letterSpacing: 0.3,
  },
  pressed: { opacity: 0.72 },
});
