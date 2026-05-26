import {
  ImageBackground,
  Platform,
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
  morning: 'rgba(160, 90, 30, 0.22)',
  day:     'rgba(20, 60, 10, 0.14)',
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

// PWA `.candle` (.flame / .wick / .wax) — teardrop flame + cream wax body.
// PWA parity approximation: PWA uses `border-radius: 55% 55% 55% 10%` to make
// the asymmetric teardrop; RN approximates with mixed border radii.
function CandleView({ lit }) {
  return (
    <View style={cStyles.wrap}>
      <View style={cStyles.flameArea}>
        {lit ? <View style={cStyles.flame} /> : null}
      </View>
      <View style={cStyles.wick} />
      <View style={cStyles.body}>
        <View style={cStyles.shine} />
      </View>
    </View>
  );
}

const cStyles = StyleSheet.create({
  wrap: {
    width: 54,
    height: 88,
    alignSelf: 'center',
    alignItems: 'center',
    marginTop: -54,
    ...Platform.select({
      ios: {
        shadowColor:   '#74522c',
        shadowOffset:  { width: 0, height: 10 },
        shadowOpacity: 0.22,
        shadowRadius:  12,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  flameArea: { height: 32, width: 22, alignItems: 'center', justifyContent: 'flex-end' },
  // PWA: width 20, height 31, border-radius 55% 55% 55% 10%
  flame: {
    width:                18,
    height:               28,
    borderTopLeftRadius:  10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 10,
    backgroundColor:      '#d69b48',
  },
  wick: { width: 2, height: 9, backgroundColor: '#3b2700', borderRadius: 1 },
  body: {
    width:           36,
    height:          54,
    borderRadius:    4,
    backgroundColor: '#f7f3ea',
    borderWidth:     1,
    borderColor:     'rgba(160, 140, 100, 0.22)',
    overflow:        'hidden',
  },
  shine: {
    position: 'absolute',
    left: 7, top: 5,
    width: 4, height: 38,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.46)',
  },
});

// PWA Memorial day screen — single card, no edit/delete buttons (edits
// happen through the Settings screen as on the web). Tab bar stays visible.
export default function MemorialDayScreen() {
  const { t, language } = useI18n();
  const { activeMemorial, setCandleLit } = useMemorials();
  const { themeColors } = useTheme();

  const timeOfDay = getTimeOfDay();
  const isDark = SKY_DARK[timeOfDay];

  const onToggleCandle = () => {
    if (!activeMemorial) return;
    setCandleLit(activeMemorial.id, !activeMemorial.candleLit);
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

  // PWA dynamic colours for dark (night/evening) vs light (morning/day) skies
  const eyebrowColor = isDark ? 'rgba(255, 247, 231, 0.82)' : colors.textSoft;
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
          <View style={styles.cardShadow}>
            <View style={[styles.card, candle && styles.cardLit, { backgroundColor: themeColors.card }]}>

              {/* PWA `.memorial-image { min-height: 280; border-radius: 22 }` */}
              {displayImage ? (
                <PositionedImage
                  uri={displayImage}
                  position={activeMemorial.memorialImagePosition}
                  style={styles.memorialImage}
                />
              ) : (
                <View style={[styles.memorialImage, styles.memorialImagePlaceholder]}>
                  <Feather name="user" size={52} color="rgba(80, 95, 62, 0.35)" />
                </View>
              )}

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
  card: {
    overflow:        'hidden',
    borderRadius:    radii.card,
    borderWidth:     1,
    borderColor:     colors.divider,
    backgroundColor: 'rgba(255, 250, 240, 0.96)',
    padding:         spacing.md,
    gap:             14,
    alignItems:      'center',
  },
  // PWA `.memorial-card.is-lit { background: linear-gradient(rgba(251,247,239,.96), rgba(238,226,206,.92)) }`
  cardLit: { backgroundColor: 'rgba(251, 247, 239, 0.96)' },

  memorialImage: {
    width:           '100%',
    height:          280,
    borderRadius:    radii.memoryImg,
    backgroundColor: colors.surface,
  },
  memorialImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },

  // PWA `.italic-note { color: var(--brown); font-family: var(--font-accent);
  //   font-size: 1.12rem; font-style: italic; font-weight: 500 }`
  memorialDate: {
    fontFamily:    typography.serifItalic,
    fontSize:      typography.sizes.italicNote,
    fontStyle:     'italic',
    color:         colors.brown,
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
    lineHeight: typography.lineHeights.body,
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
