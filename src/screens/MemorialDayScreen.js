import { useState } from 'react';
import {
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useI18n } from '../i18n';
import { useMemorials } from '../state/MemorialContext';
import {
  colors,
  radii,
  shadows,
  spacing,
  typography,
} from '../theme/designSystem';
import AppCard from '../components/AppCard';
import AppButton from '../components/AppButton';
import PositionedImage from '../components/PositionedImage';
import { resolveCardAspectRatio } from '../lib/imageAspectRatio';
import ImageControls from '../components/ImageControls';
import ImageCropAspectPicker, { DEFAULT_CROP_VALUE } from '../components/ImageCropAspectPicker';
import { pickImageFromLibrary, removePersistedMedia } from '../lib/media';
import { useTheme } from '../state/ThemeContext';
import {
  getMemorialDate,
  getMemorialDayName,
  getMemorialImage,
  getMemorialName,
} from '../models/memorial';

// PWA Memorial day mirrors styles.css `.screen[data-screen="memorial"]`:
//   four time-of-day sky variants (morning/day/evening/night) painted on
//   the full screen as a stacked CSS gradient + photo. Each one swaps the
//   `.memorial-sky-*` class on the screen.
function getTimeOfDay() {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 17) return 'day';
  if (h >= 17 && h < 22) return 'evening';
  return 'night';
}

// Time-of-day background photos (PWA: same files, served from /assets)
const SKY_BG_IMAGE = {
  morning: require('../../assets/memorial-bg-morning.jpg'),
  day:     require('../../assets/memorial-bg-day.jpg'),
  evening: require('../../assets/memorial-bg-evening.jpg'),
  night:   require('../../assets/memorial-bg-night.jpg'),
};

// PWA parity approximation: PWA stacks radial- and linear-gradients on top
// of the photo (e.g. `radial-gradient(ellipse at 18% 23%, rgba(255,214,129,
// 0.95), transparent 18%)` for morning sun). RN has no multi-stop gradients
// without expo-linear-gradient; we use a single tinted overlay per sky.
const SKY_OVERLAY = {
  morning: 'rgba(180, 105, 20, 0.26)',   // warmer golden-amber morning
  day:     'rgba(150, 95, 10, 0.22)',    // warm golden instead of cold green
  evening: 'rgba(60, 24, 8, 0.30)',
  night:   'rgba(12, 10, 20, 0.42)',
};

const SKY_BG_FALLBACK = {
  night:   '#1c1c2e',
  morning: '#c8895a',
  day:     '#7a9e5c',
  evening: '#7a4230',
};

// PWA `.topbar h2 { color: #fff7e7 }` on dark backgrounds
const SKY_DARK = { night: true, morning: false, day: false, evening: true };

// PWA `toAllative(name)` — Finnish allative case: Pepe → Pepelle, Tom → Tomille
function toAllative(name, language) {
  if (!name) return '';
  if (language !== 'fi') return name;
  const last = name[name.length - 1]?.toLowerCase() || '';
  return 'aeiouäöy'.includes(last) ? `${name}lle` : `${name}ille`;
}

function toPossessive(name, language) {
  if (!name) return '';
  if (language !== 'fi') return /s$/i.test(name) ? `${name}'` : `${name}'s`;
  const last = name[name.length - 1]?.toLowerCase() || '';
  return 'aeiouäöy'.includes(last) ? `${name}n` : `${name}in`;
}

// PWA `${day}. ${monthName} — ${t("calendar.memorialRecurring")}` (period stripped)
function formatMemorialDate(dateStr, language, recurringText) {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  let date = null;
  const dmy = s.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
  if (dmy) date = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  else if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    date = new Date(y, m - 1, d);
  }
  if (!date || isNaN(date.getTime())) return s;
  const day = date.getDate();
  let monthName;
  try {
    monthName = new Intl.DateTimeFormat(language === 'fi' ? 'fi-FI' : 'en-US', { month: 'long' }).format(date);
  } catch {
    const EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const FI = ['tammikuuta','helmikuuta','maaliskuuta','huhtikuuta','toukokuuta','kesäkuuta','heinäkuuta','elokuuta','syyskuuta','lokakuuta','marraskuuta','joulukuuta'];
    monthName = (language === 'fi' ? FI : EN)[date.getMonth()];
  }
  const cap = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const recurring = recurringText.replace(/\.$/, '');
  return `${day}. ${cap} — ${recurring}`;
}

const PET_TYPES = ['human','horse','dog','cat','rabbit','bird',
                   'guineaPig','hamster','ferret','turtle','other'];

// Larger, more atmospheric candle — teardrop flame with soft outer glow,
// tall cream body with drip detail, and a warm ambient halo when lit.
function CandleView({ lit }) {
  return (
    <View style={cStyles.outerWrap}>
      {/* Ambient warm halo — visible only when lit */}
      {lit ? <View style={cStyles.halo} /> : null}

      <View style={cStyles.candleStack}>
        {/* Flame area: soft outer + bright core teardrop */}
        <View style={cStyles.flameArea}>
          {lit ? (
            <>
              <View style={cStyles.flameSoft} />
              <View style={cStyles.flameCore} />
            </>
          ) : null}
        </View>

        {/* Wick */}
        <View style={[cStyles.wick, lit && cStyles.wickLit]} />

        {/* Wax body with shine and drip */}
        <View style={cStyles.body}>
          <View style={cStyles.shine} />
          <View style={cStyles.drip} />
        </View>
      </View>

      {/* Soft shadow ellipse under the base */}
      <View style={[cStyles.baseShadow, !lit && { opacity: 0.40 }]} />
    </View>
  );
}

const cStyles = StyleSheet.create({
  outerWrap: {
    alignSelf:    'center',
    alignItems:   'center',
    marginTop:    -76,   // deeper overlap with the image bottom
    marginBottom: 4,
    zIndex:       1,
  },

  // Diffuse warm glow behind the candle (lit state only)
  halo: {
    position:        'absolute',
    width:           150,
    height:          120,
    borderRadius:    75,
    backgroundColor: 'rgba(255, 155, 25, 0.09)',
    top:             -6,
    alignSelf:       'center',
  },

  candleStack: {
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor:   '#d4a050',
        shadowOffset:  { width: 0, height: 0 },
        shadowOpacity: 0.42,
        shadowRadius:  26,
      },
      android: { elevation: 7 },
      default: {},
    }),
  },

  flameArea: {
    height:         54,
    width:          34,
    alignItems:     'center',
    justifyContent: 'flex-end',
  },

  // Outer diffuse flame — wide teardrop, soft amber glow
  flameSoft: {
    position:                'absolute',
    width:                   30,
    height:                  50,
    borderTopLeftRadius:     17,
    borderTopRightRadius:    17,
    borderBottomLeftRadius:  4,
    borderBottomRightRadius: 4,
    backgroundColor:         'rgba(232, 138, 22, 0.45)',
    bottom:                  0,
  },

  // Inner bright flame core — narrow, golden-yellow
  flameCore: {
    position:                'absolute',
    width:                   16,
    height:                  33,
    borderTopLeftRadius:     10,
    borderTopRightRadius:    10,
    borderBottomLeftRadius:  2,
    borderBottomRightRadius: 2,
    backgroundColor:         '#f2c030',
    bottom:                  0,
  },

  wick: {
    width:           2,
    height:          11,
    backgroundColor: '#3b2700',
    borderRadius:    1,
    marginBottom:    -1,
  },
  wickLit: { backgroundColor: '#c87820' },

  // Tall cream wax body
  body: {
    width:           46,
    height:          82,
    borderRadius:    6,
    backgroundColor: '#f4ede0',
    borderWidth:     1,
    borderColor:     'rgba(160, 140, 100, 0.22)',
    overflow:        'hidden',
    marginTop:       1,
  },

  // Vertical highlight on the body
  shine: {
    position:        'absolute',
    left:            10,
    top:             6,
    width:           5,
    height:          66,
    borderRadius:    3,
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
  },

  // Wax drip detail near the top
  drip: {
    position:                'absolute',
    top:                     -3,
    left:                    14,
    width:                   10,
    height:                  20,
    borderBottomLeftRadius:  5,
    borderBottomRightRadius: 5,
    backgroundColor:         'rgba(236, 216, 180, 0.82)',
  },

  // Soft elliptical shadow under the candle base
  baseShadow: {
    width:           38,
    height:          7,
    borderRadius:    14,
    backgroundColor: 'rgba(80, 55, 15, 0.14)',
    marginTop:       3,
  },
});

// PWA Memorial day screen — single card, no edit/delete buttons (edits
// happen through the Settings screen as on the web). Tab bar stays visible.
export default function MemorialDayScreen() {
  const { t, language } = useI18n();
  const { activeMemorial, setCandleLit, updateMemorial } = useMemorials();
  const { themeColors } = useTheme();

  const timeOfDay = getTimeOfDay();
  const isDark = SKY_DARK[timeOfDay];

  // PWA parity: image-edit pills are hidden until the user taps the picture.
  const [imageControlsVisible, setImageControlsVisible] = useState(false);
  const [cropTarget, setCropTarget] = useState(null);

  const onToggleCandle = () => {
    if (!activeMemorial) return;
    setCandleLit(activeMemorial.id, !activeMemorial.candleLit);
  };

  const openCropPicker = ({ uri, current, apply }) => {
    setCropTarget({
      uri,
      current,
      apply,
      replace: async () => {
        const replaced = await pickImageFromLibrary(t);
        if (replaced) setCropTarget((c) => c ? { ...c, uri: replaced.uri } : null);
      },
    });
  };

  const pickMemorialImage = async () => {
    if (!activeMemorial) return;
    const result = await pickImageFromLibrary(t);
    if (!result) return;
    const previousUri = getMemorialImage(activeMemorial);
    openCropPicker({
      uri: result.uri,
      current: previousUri === result.uri
        ? (activeMemorial.memorialImagePosition || DEFAULT_CROP_VALUE)
        : DEFAULT_CROP_VALUE,
      apply: (value) => {
        if (previousUri && previousUri !== result.uri) removePersistedMedia(previousUri);
        updateMemorial(activeMemorial.id, {
          memorialImage:         result.uri,
          memorialImagePosition: value,
        });
        setCropTarget(null);
      },
    });
  };

  const editMemorialCrop = () => {
    if (!activeMemorial) return;
    const uri = getMemorialImage(activeMemorial);
    if (!uri) return;
    openCropPicker({
      uri,
      current: activeMemorial.memorialImagePosition || DEFAULT_CROP_VALUE,
      apply: (value) => {
        updateMemorial(activeMemorial.id, { memorialImagePosition: value });
        setCropTarget(null);
      },
    });
  };

  const removeMemorialImage = () => {
    if (!activeMemorial) return;
    const uri = getMemorialImage(activeMemorial);
    if (uri) removePersistedMedia(uri);
    updateMemorial(activeMemorial.id, {
      memorialImage:         '',
      memorialImagePosition: DEFAULT_CROP_VALUE,
    });
  };

  if (!activeMemorial) {
    // PWA: when no memorial is selected the screen route is unreachable, but
    // we keep a soft empty state in case navigation lands here directly.
    return (
      <ImageBackground
        source={SKY_BG_IMAGE[timeOfDay]}
        style={[styles.bgWrap, { backgroundColor: SKY_BG_FALLBACK[timeOfDay] }]}
        resizeMode="cover"
      >
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: SKY_OVERLAY[timeOfDay] }]} />
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <AppCard variant="soft">
              <Text style={[styles.emptyTitle, { color: themeColors.textPrimary }]}>{t('selection.title')}</Text>
              <Text style={styles.emptyBody}>{t('wall.noMemorial')}</Text>
            </AppCard>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  const displayName = getMemorialName(activeMemorial);
  const displayDate = getMemorialDate(activeMemorial);
  const displayImage = getMemorialImage(activeMemorial);
  const possessiveName = toPossessive(displayName, language);
  const pageTitle = t('memorial.dayTitle', { name: possessiveName || t('memorial.fallbackName') });
  const cardTitle = getMemorialDayName(activeMemorial) || pageTitle;
  // PWA `elements.memorialHeading.textContent = toAllative(state.horseName)`
  const cardHeading = toAllative(displayName, language);
  const formattedDate = formatMemorialDate(displayDate, language, t('calendar.memorialRecurring')) || t('memorial.dateFallback');

  const petTypeKey = PET_TYPES.includes(activeMemorial.petType) ? activeMemorial.petType : 'horse';
  const memorialBody = t(`memorialText.${petTypeKey}`, {
    name:   displayName || t('memorialText.fallbackName'),
    animal: activeMemorial.petTypeCustom || t('memorialText.fallbackAnimal'),
  });

  const candle = activeMemorial.candleLit;

  // PWA dynamic colours for dark (night/evening) vs light (morning/day) skies.
  // On warm day/morning skies use colors.brown — richer warm tone than textSoft.
  const eyebrowColor = isDark ? 'rgba(255, 247, 231, 0.82)' : colors.brown;
  const titleColor   = isDark ? '#fff7e7' : themeColors.textPrimary;

  return (
    <ImageBackground
      source={SKY_BG_IMAGE[timeOfDay]}
      style={[styles.bgWrap, { backgroundColor: SKY_BG_FALLBACK[timeOfDay] }]}
      resizeMode="cover"
    >
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: SKY_OVERLAY[timeOfDay] }]} />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* PWA `.screen[data-screen="memorial"] .topbar`: transparent, no
              ornament, eyebrow (script-style italic) above h2 title. */}
          <View style={styles.topbar}>
            <Text style={[styles.eyebrow, { color: eyebrowColor }]}>
              {t('memorial.eyebrow')}
            </Text>
            <Text
              style={[styles.pageTitle, { color: titleColor }]}
              numberOfLines={3}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
            >
              {cardTitle}
            </Text>
          </View>

          {/* PWA `.memorial-card.card`: padding 16, gap 14, text-align center,
              bg rgba(255,250,240,.96), box-shadow 0 22px 60px rgba(55,48,35,.2) */}
          <View style={[styles.cardShadow, candle && styles.cardShadowLit]}>
            <View style={[styles.card, {
              backgroundColor: candle ? themeColors.surfaceWarm : themeColors.card,
              borderColor: candle ? 'rgba(212, 160, 80, 0.38)' : themeColors.borderWarm,
            }]}>

              {/* PWA `.memorial-image { min-height: 280; border-radius: 22 }`.
                  When the user picked a specific aspectRatio in the cropper,
                  the card adopts that shape. Otherwise the card falls back
                  to the PWA 280-tall slot. */}
              {(() => {
                const memorialAspect = displayImage
                  ? resolveCardAspectRatio(activeMemorial.memorialImagePosition)
                  : null;
                const memorialAspectStyle = memorialAspect
                  ? { aspectRatio: memorialAspect, height: undefined }
                  : null;
                return (
              <Pressable
                onPress={() => setImageControlsVisible((v) => !v)}
                accessibilityRole="button"
                style={styles.memorialImageTap}
              >
                {displayImage ? (
                  <>
                    <PositionedImage
                      uri={displayImage}
                      position={activeMemorial.memorialImagePosition}
                      style={[styles.memorialImage, memorialAspectStyle]}
                    />
                    {/* Very subtle warm amber tint — lifts cold blues, unifies
                        the portrait with the golden meadow background. */}
                    <View style={styles.imageWarmOverlay} pointerEvents="none" />
                  </>
                ) : (
                  <View style={[styles.memorialImage, styles.memorialImagePlaceholder]}>
                    <Feather name="user" size={52} color="rgba(80, 95, 62, 0.35)" />
                  </View>
                )}
                <ImageControls
                  variant="floating"
                  visible={imageControlsVisible}
                  hasImage={!!displayImage}
                  onPick={() => { setImageControlsVisible(false); pickMemorialImage(); }}
                  onEditCrop={() => { setImageControlsVisible(false); editMemorialCrop(); }}
                  onRemove={() => { setImageControlsVisible(false); removeMemorialImage(); }}
                  pickLabel={displayImage ? t('creation.changePortrait') : t('creation.pickPortrait')}
                  editLabel={t('imageCrop.edit')}
                  removeLabel={t('creation.removePortrait')}
                />
              </Pressable>
                );
              })()}

              {/* PWA `.candle { margin: -54px auto 0 }` (overlaps image bottom) */}
              <CandleView lit={candle} />

              {/* PWA `.italic-note` — italic brown-toned date line */}
              {formattedDate ? (
                <Text style={styles.memorialDate}>{formattedDate}</Text>
              ) : null}

              {/* PWA `.memorial-card h3` */}
              {cardHeading ? (
                <Text
                  style={[styles.memorialHeading, { color: themeColors.textPrimary }]}
                  numberOfLines={3}
                  adjustsFontSizeToFit
                  minimumFontScale={0.84}
                >
                  {cardHeading}
                </Text>
              ) : null}

              {/* PWA `.memorial-card p { color: var(--muted) }` */}
              <Text style={styles.memorialText}>{memorialBody}</Text>

              {/* PWA `.primary-action data-light-candle` — keeps the same label
                  copy depending on candle state, mirroring app.js logic. */}
              <AppButton
                label={candle ? t('memorial.candleLit') : t('memorial.candleLight')}
                onPress={onToggleCandle}
              />
            </View>
          </View>
        </ScrollView>

        {/* Same crop modal used everywhere — preview = final card. */}
        <ImageCropAspectPicker
          visible={!!cropTarget}
          uri={cropTarget?.uri}
          initialValue={cropTarget?.current}
          onApply={cropTarget?.apply}
          onCancel={() => setCropTarget(null)}
          onReplace={cropTarget?.replace}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgWrap: { flex: 1 },
  safe:   { flex: 1, backgroundColor: 'transparent' },

  // PWA shell padding-bottom: calc(150px + safe-area-bottom)
  scroll: {
    paddingHorizontal: spacing.md,
    paddingTop:        spacing.md,
    paddingBottom:     150,
  },

  // PWA `.screen[data-screen="memorial"] .topbar`: padding-top 20, transparent
  topbar: {
    marginBottom: spacing.md,
    paddingTop:   spacing.xs,
  },
  // PWA `.topbar .eyebrow { font-family: var(--script); font-size: 1.45rem;
  //   font-weight: 400; text-transform: none }`
  eyebrow: {
    fontFamily:     typography.script,
    fontSize:       typography.sizes.scriptEyebrow,
    fontWeight:     typography.weights.regular,
    letterSpacing:  0.3,
    marginBottom:   2,
  },
  // PWA `h2 { font-size: clamp(1.9rem,7.8vw,2.5rem); font-weight: 600 }`
  pageTitle: {
    fontFamily:    typography.serif,
    fontSize:      30,
    fontWeight:    typography.weights.semibold,
    letterSpacing: 0.2,
    lineHeight:    34,
  },

  cardShadow: {
    borderRadius: radii.card,
    marginBottom: spacing.md,
    ...shadows.hero,
  },
  // When the candle is lit — soft golden ambient glow around the card
  cardShadowLit: Platform.select({
    ios: {
      shadowColor:   '#d4a050',
      shadowOffset:  { width: 0, height: 10 },
      shadowOpacity: 0.22,
      shadowRadius:  32,
    },
    android: { elevation: 10 },
    default: {},
  }),
  card: {
    overflow:        'hidden',
    borderRadius:    radii.card,
    borderWidth:     1,
    borderColor:     colors.warmBorder,
    backgroundColor: 'rgba(255, 244, 222, 0.97)',
    padding:         spacing.md,
    gap:             14,
    alignItems:      'center',
  },
  // PWA `.memorial-card.is-lit` — candle-lit: richer amber-cream gradient approximation
  cardLit: { backgroundColor: 'rgba(255, 236, 200, 0.97)' },

  // Pressable wrapper around the portrait — its only job is to host the
  // tap-to-toggle and the floating ImageControls overlay.
  memorialImageTap: {
    width:    '100%',
    position: 'relative',
  },
  memorialImage: {
    width:           '100%',
    height:          280,
    borderRadius:    radii.memoryImg,
    backgroundColor: colors.surface,
  },
  memorialImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  // Subtle warm amber tint on the portrait — lifts cold blues, unifies the
  // image with the golden meadow atmosphere. Opacity kept very low (≈6%).
  imageWarmOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius:    radii.memoryImg,
    backgroundColor: 'rgba(220, 140, 40, 0.06)',
  },

  // PWA `.italic-note { color: var(--brown); font-family: var(--font-accent);
  //   font-size: 1.12rem; font-style: italic; font-weight: 500 }`
  memorialDate: {
    fontFamily:    typography.serifItalic,
    fontSize:      typography.sizes.italicNote,
    fontStyle:     'italic',
    color:         colors.mossDark,   // slightly darker than brown — more legible
    fontWeight:    typography.weights.medium,
    textAlign:     'center',
    lineHeight:    typography.lineHeights.italicNote,
    letterSpacing: 0.2,
  },
  // PWA `h3 { font-size: 1.35rem; font-weight: 700; color: var(--moss-dark) }`
  memorialHeading: {
    fontFamily: typography.serif,
    fontSize:   typography.sizes.title,
    fontWeight: typography.weights.bold,
    color:      colors.textPrimary,
    textAlign:  'center',
    lineHeight: typography.lineHeights.title,
  },
  // PWA `.memorial-card p { color: var(--muted); line-height: 1.6 }`
  memorialText: {
    fontSize:   typography.sizes.body,
    color:      colors.textMuted,
    textAlign:  'center',
    lineHeight: 24,   // improved: 1.6 × 15 = 24 (was 22)
  },

  emptyTitle: {
    fontFamily:   typography.serif,
    fontSize:     typography.sizes.title,
    color:        colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptyBody: {
    fontSize:   typography.sizes.label,
    color:      colors.textMuted,
    lineHeight: typography.lineHeights.body,
    fontStyle:  'italic',
  },
});
