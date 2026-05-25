import { useEffect, useState } from 'react';
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
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
  typography,
  spacing,
  radii,
  shadows,
  screenStyles,
} from '../theme/designSystem';
import AppCard from '../components/AppCard';
import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import ImagePositionControls, { DEFAULT_IMAGE_POSITION } from '../components/ImagePositionControls';
import PositionedImage from '../components/PositionedImage';
import { pickImageFromLibrary, removePersistedMedia } from '../lib/media';
import { useTheme } from '../state/ThemeContext';
import { getMemorialDate, getMemorialDayName, getMemorialImage, getMemorialName } from '../models/memorial';

// ── Time-of-day sky system (matches PWA: morning / day / evening / night) ──────
function getTimeOfDay() {
  const h = new Date().getHours();
  if (h >= 5 && h < 10) return 'morning';
  if (h >= 10 && h < 18) return 'day';
  if (h >= 18 && h < 22) return 'evening';
  return 'night';
}

// Time-of-day background photos (user-provided, saved to assets/)
const SKY_BG_IMAGE = {
  morning: require('../../assets/memorial-bg-morning.jpg'),
  day:     require('../../assets/memorial-bg-day.jpg'),
  evening: require('../../assets/memorial-bg-evening.jpg'),
  night:   require('../../assets/memorial-bg-night.jpg'),
};

// Semi-transparent mood overlay placed above the photo — enhances text
// readability and preserves the warm paper feel across all time periods.
const SKY_OVERLAY = {
  morning: 'rgba(160, 90, 30, 0.22)',   // warm amber wash
  day:     'rgba(20, 60, 10, 0.14)',    // subtle green tint
  evening: 'rgba(60, 24, 8, 0.30)',     // deep rust veil
  night:   'rgba(12, 10, 20, 0.42)',    // dark indigo overlay
};

// Fallback solid colour used if the image file is missing.
const SKY_BG_FALLBACK = {
  night:   '#1c1c2e',
  morning: '#c8895a',
  day:     '#7a9e5c',
  evening: '#7a4230',
};

// night & evening use light text; morning & day use dark text
const SKY_DARK = { night: true, morning: false, day: false, evening: true };

// ── Finnish allative case: Pepe → Pepelle, Tom → Tomille ──────────────────────
// Used as the h3 heading inside the memorial card (matches PWA toAllative())
function toAllative(name, language) {
  if (!name) return '';
  if (language !== 'fi') return name; // English: show name as-is
  const last = name[name.length - 1]?.toLowerCase() || '';
  return 'aeiouäöy'.includes(last) ? `${name}lle` : `${name}ille`;
}

// ── Finnish possessive (page title) ───────────────────────────────────────────
function toPossessive(name, language) {
  if (!name) return '';
  if (language !== 'fi') return /s$/i.test(name) ? `${name}'` : `${name}'s`;
  const last = name[name.length - 1]?.toLowerCase() || '';
  return 'aeiouäöy'.includes(last) ? `${name}n` : `${name}in`;
}

// ── Date formatter: "19. May — Repeats automatically every year" ───────────────
// Matches PWA: `${day}. ${monthName} — ${t("calendar.memorialRecurring")…}`
function formatMemorialDate(dateStr, language, recurringText) {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  let date = null;

  // dd.mm.yyyy or d.m.yyyy
  const dmy = s.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
  if (dmy) {
    date = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    date = new Date(y, m - 1, d);
  }

  if (!date || isNaN(date.getTime())) return s; // raw fallback

  const day = date.getDate();
  const monthIdx = date.getMonth();

  // Month name — Intl preferred, hardcoded fallback for bare JSC builds
  let monthName;
  try {
    monthName = new Intl.DateTimeFormat(
      language === 'fi' ? 'fi-FI' : 'en-US',
      { month: 'long' },
    ).format(date);
  } catch {
    const EN = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
    const FI = ['tammikuuta','helmikuuta','maaliskuuta','huhtikuuta',
                'toukokuuta','kesäkuuta','heinäkuuta','elokuuta',
                'syyskuuta','lokakuuta','marraskuuta','joulukuuta'];
    monthName = (language === 'fi' ? FI : EN)[monthIdx];
  }

  const cap = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  // PWA strips trailing period: t("calendar.memorialRecurring").replace(/\.$/, "")
  const recurring = recurringText.replace(/\.$/, '');
  return `${day}. ${cap} — ${recurring}`;
}

// ── Pet types for memorial text template ──────────────────────────────────────
const PET_TYPES = ['human','horse','dog','cat','rabbit','bird',
                   'guineaPig','hamster','ferret','turtle','other'];

// ── Candle component — View-based shape matching PWA CSS candle ───────────────
// PWA: .candle { width:54px; height:88px; margin:-54px auto 0 }
//      .flame  { width:20px; height:31px; border-radius:55% 55% 55% 10% }
//      .wick   { width:2px;  height:10px }
function CandleView({ lit }) {
  return (
    <View style={cStyles.wrap}>
      {/* Flame (only visible when lit) */}
      <View style={cStyles.flameArea}>
        {lit ? <View style={cStyles.flame} /> : null}
      </View>
      {/* Wick */}
      <View style={cStyles.wick} />
      {/* Body */}
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
    marginTop: -50, // overlap the image below — matches PWA margin:-54px auto 0
    ...Platform.select({
      ios: {
        shadowColor: '#74522c',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.22,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  flameArea: {
    height: 32,
    width: 22,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  // PWA: border-radius 55% 55% 55% 10% — teardrop shape
  // RN approximation: top rounded, bottom-left sharp
  flame: {
    width: 18,
    height: 28,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 10,
    backgroundColor: '#d69b48',
  },
  wick: {
    width: 2,
    height: 9,
    backgroundColor: '#3b2700',
    borderRadius: 1,
  },
  body: {
    width: 36,
    height: 54,
    borderRadius: 4,
    backgroundColor: '#f7f3ea',
    borderWidth: 1,
    borderColor: 'rgba(160, 140, 100, 0.22)',
    overflow: 'hidden',
  },
  // Vertical highlight stripe (candle gloss)
  shine: {
    position: 'absolute',
    left: 7,
    top: 5,
    width: 4,
    height: 38,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.46)',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
export default function MemorialDayScreen() {
  const { t, language } = useI18n();
  const { activeMemorial, updateMemorial, setCandleLit, deleteMemorial, clearActive } = useMemorials();
  const { themeKey, themeColors } = useTheme();

  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState('');
  const [birth, setBirth] = useState('');
  const [death, setDeath] = useState('');
  const [description, setDescription] = useState('');
  const [petType, setPetType] = useState('');
  const [petTypeCustom, setPetTypeCustom] = useState('');
  const [memorialName, setMemorialName] = useState('');
  const [portraitUri, setPortraitUri] = useState(null);
  const [memorialImagePosition, setMemorialImagePosition] = useState(DEFAULT_IMAGE_POSITION);

  // Time-of-day sky — computed once per render (re-mounts on navigation return)
  const timeOfDay = getTimeOfDay();
  const isDark = SKY_DARK[timeOfDay];

  useEffect(() => {
    if (editOpen && activeMemorial) {
      setName(getMemorialName(activeMemorial));
      setBirth(activeMemorial.birth ?? '');
      setDeath(getMemorialDate(activeMemorial));
      setDescription(activeMemorial.description ?? '');
      setPetType(activeMemorial.petType ?? '');
      setPetTypeCustom(activeMemorial.petTypeCustom ?? '');
      setMemorialName(getMemorialDayName(activeMemorial));
      setPortraitUri(getMemorialImage(activeMemorial) || null);
      setMemorialImagePosition(activeMemorial.memorialImagePosition ?? DEFAULT_IMAGE_POSITION);
    }
  }, [editOpen, activeMemorial]);

  const openEdit = () => setEditOpen(true);

  const closeEdit = () => {
    setEditOpen(false);
    setPortraitUri(getMemorialImage(activeMemorial) || null);
    setMemorialImagePosition(activeMemorial?.memorialImagePosition ?? DEFAULT_IMAGE_POSITION);
  };

  const onPickPortrait = async () => {
    const result = await pickImageFromLibrary(t);
    if (!result) return;
    if (portraitUri && portraitUri !== getMemorialImage(activeMemorial) && portraitUri !== result.uri) {
      removePersistedMedia(portraitUri);
    }
    setPortraitUri(result.uri);
    setMemorialImagePosition(DEFAULT_IMAGE_POSITION);
  };

  const onRemovePortrait = () => {
    if (portraitUri && portraitUri !== getMemorialImage(activeMemorial)) {
      removePersistedMedia(portraitUri);
    }
    setPortraitUri(null);
    setMemorialImagePosition(DEFAULT_IMAGE_POSITION);
  };

  const saveEdit = () => {
    if (!activeMemorial) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    updateMemorial(activeMemorial.id, {
      horseName: trimmed,
      memorialDate: death.trim(),
      memorialImage: portraitUri ?? '',
      memorialImagePosition,
      theme: themeKey,
      language,
      name: trimmed,
      birth: birth.trim(),
      death: death.trim(),
      description: description.trim(),
      petType: petType || null,
      petTypeCustom: petTypeCustom.trim(),
      memorialDayName: memorialName.trim(),
      memorialName: memorialName.trim(),
      portraitUri: portraitUri ?? null,
    });
    setEditOpen(false);
  };

  const onToggleCandle = () => {
    if (!activeMemorial) return;
    setCandleLit(activeMemorial.id, !activeMemorial.candleLit);
  };

  const onDeleteMemorial = () => {
    Alert.alert(
      t('memorial.deleteTitle'),
      t('memorial.deleteBody'),
      [
        { text: t('memorial.deleteCancel'), style: 'cancel' },
        {
          text: t('memorial.deleteConfirm'),
          style: 'destructive',
          onPress: () => {
            if (!activeMemorial) return;
            deleteMemorial(activeMemorial.id);
            clearActive();
          },
        },
      ],
    );
  };

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!activeMemorial) {
    return (
      <ImageBackground
        source={SKY_BG_IMAGE[timeOfDay]}
        style={[styles.bgWrap, { backgroundColor: SKY_BG_FALLBACK[timeOfDay] }]}
        resizeMode="cover"
      >
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: SKY_OVERLAY[timeOfDay] }]} />
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          <ScrollView contentContainerStyle={screenStyles.scroll}>
            <AppCard variant="soft">
              <Text style={[styles.emptyTitle, { color: themeColors.textPrimary }]}>{t('selection.title')}</Text>
              <Text style={styles.emptyBody}>{t('wall.noMemorial')}</Text>
            </AppCard>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  // ── Derived display values ──────────────────────────────────────────────────
  const displayName = getMemorialName(activeMemorial);
  const displayDate = getMemorialDate(activeMemorial);
  const displayImage = getMemorialImage(activeMemorial);
  const possessiveName = toPossessive(displayName, language);
  const pageTitle = t('memorial.dayTitle', { name: possessiveName || t('memorial.fallbackName') });

  // Topbar h2 title (memorialName takes priority, e.g. "Pepen päivä")
  const cardTitle = getMemorialDayName(activeMemorial) || pageTitle;

  // Card h3 heading — Finnish allative ("Pepelle"), English plain name ("Pepe")
  // Matches PWA: elements.memorialHeading.textContent = toAllative(state.horseName)
  const cardHeading = toAllative(displayName, language);

  // Formatted memorial date: "19. May — Repeats automatically every year"
  const formattedDate = formatMemorialDate(
    displayDate,
    language,
    t('calendar.memorialRecurring'),
  );

  // Memorial text template
  const petTypeKey = PET_TYPES.includes(activeMemorial.petType)
    ? activeMemorial.petType : 'horse';
  const memorialBody = t(`memorialText.${petTypeKey}`, {
    name: displayName || t('memorialText.fallbackName'),
    animal: activeMemorial.petTypeCustom || t('memorialText.fallbackAnimal'),
  });

  const candle = activeMemorial.candleLit;

  // Dynamic colours for dark (night/evening) vs light (morning/day) backgrounds
  const eyebrowColor = isDark ? 'rgba(255, 247, 231, 0.80)' : colors.textSoft;
  const titleColor   = isDark ? '#fff7e7' : themeColors.textPrimary;
  const editBtnBg    = isDark ? 'rgba(255,255,255,0.13)' : 'rgba(88, 98, 68, 0.10)';
  const editIconColor = isDark ? 'rgba(255,247,231,0.88)' : themeColors.moss;
  const deleteColor  = isDark ? 'rgba(255, 180, 160, 0.80)' : colors.danger;

  return (
    <ImageBackground
      source={SKY_BG_IMAGE[timeOfDay]}
      style={[styles.bgWrap, { backgroundColor: SKY_BG_FALLBACK[timeOfDay] }]}
      resizeMode="cover"
    >
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: SKY_OVERLAY[timeOfDay] }]} />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Topbar: eyebrow (script-style italic) + h2 title + edit btn ── */}
          <View style={styles.topbar}>
            <View style={styles.topbarLeft}>
              {/* PWA: .topbar .eyebrow { font-family: var(--script); font-size:1.45rem } */}
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
            <Pressable
              onPress={openEdit}
              style={({ pressed }) => [
                styles.editBtn,
                { backgroundColor: editBtnBg },
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={8}
              accessibilityRole="button"
            >
              <Feather name="edit-2" size={16} color={editIconColor} />
            </Pressable>
          </View>

          {/* ── Memorial card: image + candle + date + h3 + text + button ──── */}
          {/* PWA: .memorial-card { position:relative; display:grid; gap:14px;
                padding:16px; text-align:center;
                bg:rgba(255,250,240,.96); box-shadow:0 22px 60px rgba(55,48,35,.2) } */}
          <View style={styles.cardShadow}>
            <View style={[styles.card, candle && styles.cardLit, { backgroundColor: themeColors.card }]}>

              {/* Portrait image — PWA: .memorial-image { min-height:280px; border-radius:22px } */}
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

              {/* Candle — PWA: .candle { margin:-54px auto 0 } (overlaps image bottom) */}
              <CandleView lit={candle} />

              {/* Italic date: "19. May — Repeats automatically every year" */}
              {formattedDate ? (
                <Text style={styles.memorialDate}>{formattedDate}</Text>
              ) : null}

              {/* h3 heading — PWA: toAllative(horseName) = "Pepelle" */}
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

              {/* Memorial text paragraph */}
              <Text style={styles.memorialText}>{memorialBody}</Text>

              {/* Light a candle button */}
              <AppButton
                label={candle ? t('memorial.candleLit') : t('memorial.candleLight')}
                onPress={onToggleCandle}
              />

            </View>
          </View>

          {/* Delete link */}
          <Pressable
            onPress={onDeleteMemorial}
            style={({ pressed }) => [styles.deleteRow, pressed && { opacity: 0.7 }]}
          >
            <Feather name="trash-2" size={15} color={deleteColor} />
            <Text style={[styles.deleteText, { color: deleteColor }]}>
              {t('memorial.deleteTitle')}
            </Text>
          </Pressable>

        </ScrollView>

        {/* ── Edit Modal ─────────────────────────────────────────────────────── */}
        <Modal visible={editOpen} animationType="slide" onRequestClose={closeEdit} transparent={false}>
          <SafeAreaView style={[styles.modalSafe, { backgroundColor: themeColors.background }]} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView
              style={styles.flex}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <View style={styles.modalBar}>
                <Pressable onPress={closeEdit} hitSlop={12} style={styles.iconBtn}>
                  <Feather name="x" size={22} color={themeColors.textPrimary} />
                </Pressable>
              </View>
              <ScrollView
                contentContainerStyle={styles.modalScroll}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={[styles.modalTitle, { color: themeColors.textPrimary }]}>{t('memorial.editTitle')}</Text>

                <View style={styles.formCardShadow}>
                  <View style={[styles.formCard, { backgroundColor: themeColors.card }]}>

                    {/* Memorial day image picker */}
                    <View>
                      <Text style={styles.modalFieldLabel}>{t('settings.memorialImage')}</Text>
                      <Pressable
                        onPress={onPickPortrait}
                        style={({ pressed }) => [styles.portraitFrame, pressed && { opacity: 0.8 }]}
                      >
                        {portraitUri ? (
                          <PositionedImage uri={portraitUri} position={memorialImagePosition} style={styles.portraitFrameImg} />
                        ) : (
                          <View style={styles.portraitFramePlaceholder}>
                            <Feather name="user" size={28} color={themeColors.brown} />
                          </View>
                        )}
                      </Pressable>
                      <View style={styles.portraitActions}>
                        <Pressable onPress={onPickPortrait} style={styles.smallBtn}>
                          <Feather name="image" size={13} color={themeColors.moss} />
                          <Text style={[styles.smallBtnLabel, { color: themeColors.moss }]}>
                            {portraitUri ? t('creation.changePortrait') : t('creation.pickPortrait')}
                          </Text>
                        </Pressable>
                        {portraitUri ? (
                          <Pressable onPress={onRemovePortrait} style={styles.smallBtn}>
                            <Feather name="trash-2" size={13} color={colors.danger} />
                            <Text style={[styles.smallBtnLabel, { color: colors.danger }]}>
                              {t('creation.removePortrait')}
                            </Text>
                          </Pressable>
                        ) : null}
                      </View>
                      {portraitUri ? (
                        <ImagePositionControls
                          value={memorialImagePosition}
                          onChange={setMemorialImagePosition}
                          t={t}
                        />
                      ) : null}
                    </View>

                    <AppInput
                      label={t('settings.horseName')}
                      value={name}
                      onChangeText={setName}
                      placeholder={t('settings.horseNamePlaceholder')}
                    />
                    <View style={styles.row}>
                      <AppInput
                        label={t('creation.birth')}
                        value={birth}
                        onChangeText={setBirth}
                        placeholder={t('creation.datePlaceholder')}
                        style={styles.rowField}
                      />
                      <AppInput
                        label={t('settings.memorialDate')}
                        value={death}
                        onChangeText={setDeath}
                        placeholder={t('creation.datePlaceholder')}
                        style={styles.rowField}
                      />
                    </View>
                    <AppInput
                      label={t('settings.memorialName')}
                      value={memorialName}
                      onChangeText={setMemorialName}
                      placeholder={t('settings.memorialNamePlaceholder')}
                    />
                    <AppInput
                      label={t('creation.description')}
                      value={description}
                      onChangeText={setDescription}
                      placeholder={t('creation.descriptionPlaceholder')}
                      multiline
                    />

                    <AppButton label={t('creation.save')} onPress={saveEdit} />

                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgWrap: { flex: 1 },
  safe: { flex: 1, backgroundColor: 'transparent' },
  flex: { flex: 1 },

  scroll: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 150,
  },

  // ── Topbar ──────────────────────────────────────────────────────────────────
  topbar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  topbarLeft: { flex: 1, marginRight: spacing.sm },

  // PWA: .topbar .eyebrow { font-family: var(--script); font-size: 1.45rem; font-weight: 400 }
  // Approximated with italic serif — Alex Brush not bundled in this build
  eyebrow: {
    fontFamily: typography.serifItalic,
    fontSize: 22,
    fontWeight: '400',
    letterSpacing: 0.3,
    marginBottom: 2,
  },

  // PWA: .topbar h2 { font-size: clamp(1.9rem, 7.8vw, 2.5rem) ≈ 30px; font-weight: 600 }
  pageTitle: {
    fontFamily: typography.serif,
    fontSize: 30,
    fontWeight: '600',
    letterSpacing: 0.2,
    lineHeight: 34,
  },

  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  // ── Memorial card ───────────────────────────────────────────────────────────
  // PWA: box-shadow: 0 22px 60px rgba(55,48,35,0.2)
  cardShadow: {
    borderRadius: 24,
    marginBottom: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#373023',
        shadowOffset: { width: 0, height: 22 },
        shadowOpacity: 0.20,
        shadowRadius: 24,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  card: {
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: 'rgba(255, 250, 240, 0.96)',
    padding: 16,
    gap: 14,
    alignItems: 'center',
  },
  // PWA: .memorial-card.is-lit { background: linear-gradient(rgba(251,247,239,.96), rgba(238,226,206,.92)) }
  cardLit: {
    backgroundColor: 'rgba(251, 247, 239, 0.96)',
  },

  // PWA: .memorial-image { min-height: 280px; border-radius: 22px }
  memorialImage: {
    width: '100%',
    height: 280,
    borderRadius: 22,
    backgroundColor: colors.surface,
  },
  memorialImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Italic date below candle — PWA: .italic-note
  memorialDate: {
    fontSize: typography.sizes.label,
    fontFamily: typography.serifItalic,
    fontStyle: 'italic',
    color: colors.textSoft,
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // PWA: .memorial-card h3 { … } — heading inside card
  memorialHeading: {
    fontFamily: typography.serif,
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 26,
  },

  // PWA: .memorial-card p { color: var(--muted) }
  memorialText: {
    fontSize: typography.sizes.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Delete ──────────────────────────────────────────────────────────────────
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  deleteText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
  },

  // ── Empty state ─────────────────────────────────────────────────────────────
  emptyTitle: {
    fontFamily: typography.serif,
    fontSize: typography.sizes.title,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptyBody: {
    fontSize: typography.sizes.label,
    color: colors.textMuted,
    lineHeight: typography.lineHeights.body,
    fontStyle: 'italic',
  },

  // ── Edit modal ──────────────────────────────────────────────────────────────
  modalSafe: { flex: 1, backgroundColor: colors.background },
  modalBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  iconBtn: { padding: spacing.xs },
  modalScroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 60,
  },
  modalTitle: {
    fontFamily: typography.serif,
    fontSize: typography.sizes.titleLarge,
    fontWeight: typography.weights.regular,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: 0.3,
  },

  formCardShadow: {
    borderRadius: 24,
    ...shadows.soft,
  },
  formCard: {
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: 'rgba(255, 250, 240, 0.98)',
    padding: 16,
    gap: 14,
  },
  modalFieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textBody,
    marginBottom: 8,
  },

  portraitFrame: {
    height: 180,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: 8,
  },
  portraitFrameImg: { width: '100%', height: '100%' },
  portraitFramePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portraitActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.card,
  },
  smallBtnLabel: {
    fontSize: typography.sizes.label,
    color: colors.moss,
    letterSpacing: 0.3,
  },
  row: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  rowField: { flex: 1 },
});
