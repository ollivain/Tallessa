import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useI18n } from '../i18n';
import { useMemorials } from '../state/MemorialContext';
import {
  colors,
  typography,
  spacing,
  shadows,
} from '../theme/designSystem';
import AppScreen from '../components/AppScreen';
import AppCard from '../components/AppCard';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import ImageCropAspectPicker, { DEFAULT_CROP_VALUE } from '../components/ImageCropAspectPicker';
import PositionedImage from '../components/PositionedImage';
import { resolveCardAspectRatio } from '../lib/imageAspectRatio';

// Shared default so saved metadata has a consistent shape everywhere.
const DEFAULT_IMAGE_POSITION = DEFAULT_CROP_VALUE;
import { clearAllData } from '../storage/storage';
import { pickImageFromLibrary, pickMultipleImagesFromLibrary } from '../lib/media';
import { useTheme } from '../state/ThemeContext';
import {
  getMemorialDate,
  getMemorialImage,
  getMemorialName,
  getMonthPhotosArray,
  parseDateInput,
} from '../models/memorial';

const SCREEN_BG = require('../../assets/bg-asetukset.png');

// Returns the full month name for a given 0-based index in the current language.
// Mirrors CalendarScreen's toLocaleString approach so month names are consistent.
function getMonthName(monthIndex, language) {
  try {
    const name = new Date(2024, monthIndex, 1).toLocaleString(
      language === 'fi' ? 'fi-FI' : 'en-US',
      { month: 'long' },
    );
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    const EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const FI = ['Tammikuu','Helmikuu','Maaliskuu','Huhtikuu','Toukokuu','Kesäkuu','Heinäkuu','Elokuu','Syyskuu','Lokakuu','Marraskuu','Joulukuu'];
    return (language === 'fi' ? FI : EN)[monthIndex] ?? String(monthIndex + 1);
  }
}

const PET_TYPE_KEYS = [
  'human', 'horse', 'dog', 'cat', 'rabbit', 'bird',
  'guineaPig', 'hamster', 'ferret', 'turtle', 'other',
];

export default function SettingsScreen() {
  const { t, language, setLanguage } = useI18n();
  const { themeColors } = useTheme();
  const { activeMemorial, memorials, clearActive, deleteMemorial, updateMemorial } = useMemorials();
  const navigation = useNavigation();

  // Memorial fields
  const [name, setName]               = useState('');
  const [death, setDeath]             = useState('');
  const [petType, setPetType]         = useState('');
  const [petTypeCustom, setPetTypeCustom] = useState('');
  const [memorialName, setMemorialName]   = useState('');
  const [portraitUri, setPortraitUri]     = useState(null);
  const [memorialImagePosition, setMemorialImagePosition] = useState(DEFAULT_IMAGE_POSITION);
  const [calendarImages, setCalendarImages] = useState(() => Array(12).fill(null));
  const [calendarImagePositions, setCalendarImagePositions] = useState(() =>
    Array.from({ length: 12 }, () => DEFAULT_IMAGE_POSITION),
  );

  // UI state
  const [calExpanded, setCalExpanded]     = useState(false);
  const [petTypeOpen, setPetTypeOpen]     = useState(false);
  const [saved, setSaved]                 = useState(false);
  const savedTimer = useRef(null);
  // cropTarget routes the ImageCropAspectPicker modal — see usage below
  const [cropTarget, setCropTarget] = useState(null);

  // Re-initialise when active memorial changes
  useEffect(() => {
    setName(getMemorialName(activeMemorial));
    setDeath(getMemorialDate(activeMemorial));
    setPetType(activeMemorial?.petType ?? '');
    setPetTypeCustom(activeMemorial?.petTypeCustom ?? '');
    setMemorialName(activeMemorial?.memorialName ?? '');
    setPortraitUri(getMemorialImage(activeMemorial) || null);
    setMemorialImagePosition(activeMemorial?.memorialImagePosition ?? DEFAULT_IMAGE_POSITION);
    setCalendarImages(getMonthPhotosArray(activeMemorial));
    setCalendarImagePositions(Array.from({ length: 12 }, (_, index) =>
      activeMemorial?.monthPhotoPositions?.[String(index + 1).padStart(2, '0')] ??
      activeMemorial?.monthPhotoPositions?.[String(index + 1)] ??
      DEFAULT_IMAGE_POSITION,
    ));
  }, [activeMemorial?.id]);

  // Clear timer on unmount
  useEffect(() => () => { if (savedTimer.current) clearTimeout(savedTimer.current); }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const onSave = () => {
    if (!activeMemorial) return;
    updateMemorial(activeMemorial.id, {
      horseName:     name.trim(),
      memorialDate:  parseDateInput(death),
      memorialImage: portraitUri ?? '',
      heroImage:     activeMemorial.heroImage ?? '',
      memorialImagePosition,
      monthPhotos:   calendarImages.reduce((acc, uri, index) => {
        if (uri) acc[String(index + 1).padStart(2, '0')] = uri;
        return acc;
      }, {}),
      monthPhotoPositions: calendarImages.reduce((acc, uri, index) => {
        if (uri) acc[String(index + 1).padStart(2, '0')] = calendarImagePositions[index] ?? DEFAULT_IMAGE_POSITION;
        return acc;
      }, {}),
      theme:         'classic',
      language,
      name:          name.trim(),
      death:         parseDateInput(death),
      petType:       petType || null,
      petTypeCustom: petTypeCustom.trim(),
      memorialName:  memorialName.trim(),
      portraitUri:   portraitUri ?? null,
      calendarImages,
    });
    // Brief "Saved" feedback
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 2200);
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

  const onPickPortrait = async () => {
    const result = await pickImageFromLibrary(t);
    if (!result) return;
    const previousUri = portraitUri;
    openCropPicker({
      uri: result.uri,
      current: previousUri === result.uri ? memorialImagePosition : DEFAULT_IMAGE_POSITION,
      apply: (value) => {
        setPortraitUri(result.uri);
        setMemorialImagePosition(value);
        setCropTarget(null);
      },
    });
  };

  const onEditPortraitCrop = () => {
    if (!portraitUri) return;
    openCropPicker({
      uri: portraitUri,
      current: memorialImagePosition,
      apply: (value) => {
        setMemorialImagePosition(value);
        setCropTarget(null);
      },
    });
  };

  const onRemovePortrait = () => {
    setPortraitUri(null);
    setMemorialImagePosition(DEFAULT_IMAGE_POSITION);
  };

  const onPickCalendarImages = async () => {
    const results = await pickMultipleImagesFromLibrary(t, 12);
    if (!results?.length) return;
    const next = [...calendarImages];
    const nextPositions = [...calendarImagePositions];
    results.forEach((r, i) => {
      if (i < 12) {
        next[i] = r.uri;
        nextPositions[i] = DEFAULT_IMAGE_POSITION;
      }
    });
    setCalendarImages(next);
    setCalendarImagePositions(nextPositions);
  };

  const onEditCalendarCrop = (idx) => {
    const uri = calendarImages[idx];
    if (!uri) return;
    openCropPicker({
      uri,
      current: calendarImagePositions[idx] ?? DEFAULT_IMAGE_POSITION,
      apply: (value) => {
        const next = [...calendarImagePositions];
        next[idx] = value;
        setCalendarImagePositions(next);
        setCropTarget(null);
      },
    });
  };

  const onClearAll = () => {
    Alert.alert(
      t('settings.clearAllConfirmTitle'),
      t('settings.clearAllConfirmBody'),
      [
        { text: t('settings.clearAllCancel'), style: 'cancel' },
        {
          text: t('settings.clearAllConfirm'),
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            clearActive();
            navigation.navigate('MemorialSelection');
          },
        },
      ],
    );
  };

  const onDeleteMemorial = () => {
    if (!activeMemorial) return;
    Alert.alert(
      t('memorial.deleteTitle'),
      t('memorial.deleteBody'),
      [
        { text: t('memorial.deleteCancel'), style: 'cancel' },
        {
          text: t('memorial.deleteConfirm'),
          style: 'destructive',
          onPress: () => {
            const deletingLast = memorials.length <= 1;
            deleteMemorial(activeMemorial.id);
            if (deletingLast) navigation.navigate('MemorialSelection');
          },
        },
      ],
    );
  };

  const calCount = calendarImages.filter(Boolean).length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AppScreen scroll={false} background={SCREEN_BG} contentStyle={styles.noInnerPad}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Page title */}
          <View style={styles.wallHeader}>
            <Text style={[styles.wallTitle, { color: themeColors.textPrimary }]}>{t('settings.title')}</Text>
          </View>

          {/* Switch memorial pill */}
          <Pressable
            onPress={() => navigation.navigate('MemorialSelection')}
            style={({ pressed }) => [styles.switchPill, { backgroundColor: themeColors.surfaceWarm, borderColor: themeColors.borderWarm }, pressed && styles.switchPillPressed]}
            accessibilityRole="button"
          >
            <Text style={styles.switchPillLabel}>{t('settings.switchMemorial')}</Text>
          </Pressable>

          {/* ── Main settings card (all sections in one card) ────────────── */}
          <View style={styles.formCardShadow}>
            <View style={[styles.formCard, { backgroundColor: themeColors.card, borderColor: themeColors.borderWarm }]}>

              {activeMemorial ? (
                <>
                  {/* Name of the loved one */}
                  <AppInput
                    label={t('settings.horseName')}
                    value={name}
                    onChangeText={setName}
                    placeholder={t('settings.horseNamePlaceholder')}
                  />

                  {/* Remembering — dropdown select (matches PWA <select>) */}
                  <View>
                    <Text style={styles.fieldLabel}>{t('settings.petType')}</Text>
                    <Pressable
                      onPress={() => setPetTypeOpen(true)}
                      style={({ pressed }) => [styles.selectRow, { backgroundColor: themeColors.surfaceWarm, borderColor: themeColors.borderWarm }, pressed && styles.pressed]}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.selectValue, !petType && styles.selectPlaceholder]}>
                        {petType
                          ? t(`settings.petTypeOptions.${petType}`)
                          : t('settings.petType')}
                      </Text>
                      <Feather name="chevron-down" size={18} color={themeColors.moss} />
                    </Pressable>
                  </View>

                  {/* Add details if you wish — always visible */}
                  <AppInput
                    label={t('settings.petTypeCustom')}
                    value={petTypeCustom}
                    onChangeText={setPetTypeCustom}
                    placeholder={t('settings.petTypeCustomPlaceholder')}
                  />

                  {/* Memorial day name */}
                  <AppInput
                    label={t('settings.memorialName')}
                    value={memorialName}
                    onChangeText={setMemorialName}
                    placeholder={t('settings.memorialNamePlaceholder')}
                  />

                  {/* Date of passing */}
                  <AppInput
                    label={t('settings.memorialDate')}
                    value={death}
                    onChangeText={setDeath}
                    placeholder={t('creation.datePlaceholder')}
                  />

                  {/* Memorial day image — portrait picker. Tapping the frame
                      opens the crop modal so preview == final card. The
                      portrait adopts the user's chosen aspectRatio when
                      one is in metadata; otherwise the PWA 150-tall slot. */}
                  {(() => {
                    const portraitAspect = portraitUri
                      ? resolveCardAspectRatio(memorialImagePosition)
                      : null;
                    const portraitAspectStyle = portraitAspect
                      ? { aspectRatio: portraitAspect, height: undefined }
                      : null;
                    return (
                  <View>
                    <Text style={styles.fieldLabel}>{t('settings.memorialImage')}</Text>
                    <Pressable
                      onPress={portraitUri ? onEditPortraitCrop : onPickPortrait}
                      style={({ pressed }) => [styles.portraitFrame, portraitAspectStyle, pressed && { opacity: 0.8 }]}
                      accessibilityRole="button"
                    >
                      {portraitUri ? (
                        <PositionedImage uri={portraitUri} position={memorialImagePosition} style={styles.portraitImage} />
                      ) : (
                        <View style={styles.portraitPlaceholder}>
                          <Feather name="user" size={28} color={themeColors.brown} />
                        </View>
                      )}
                    </Pressable>
                    <View style={styles.portraitActions}>
                      <Pressable onPress={onPickPortrait} style={[styles.portraitBtn, { backgroundColor: themeColors.surfaceWarm, borderColor: themeColors.borderWarm }]}>
                        <Feather name="image" size={13} color={themeColors.moss} />
                        <Text style={[styles.portraitBtnLabel, { color: themeColors.moss }]}>
                          {portraitUri ? t('creation.changePortrait') : t('creation.pickPortrait')}
                        </Text>
                      </Pressable>
                      {portraitUri ? (
                        <Pressable onPress={onEditPortraitCrop} style={[styles.portraitBtn, { backgroundColor: themeColors.surfaceWarm, borderColor: themeColors.borderWarm }]}>
                          <Feather name="crop" size={13} color={themeColors.moss} />
                          <Text style={[styles.portraitBtnLabel, { color: themeColors.moss }]}>
                            {t('imageCrop.edit')}
                          </Text>
                        </Pressable>
                      ) : null}
                      {portraitUri ? (
                        <Pressable onPress={onRemovePortrait} style={[styles.portraitBtn, { backgroundColor: themeColors.surfaceWarm, borderColor: themeColors.borderWarm }]}>
                          <Feather name="trash-2" size={13} color={colors.danger} />
                          <Text style={[styles.portraitBtnLabel, { color: colors.danger }]}>
                            {t('creation.removePortrait')}
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                    );
                  })()}

                  {/* ── Calendar images accordion ──────────────────────────── */}
                  <Pressable
                    onPress={() => setCalExpanded((v) => !v)}
                    style={({ pressed }) => [styles.accordion, { backgroundColor: themeColors.mossDark }, pressed && { opacity: 0.88 }]}
                    accessibilityRole="button"
                  >
                    <Text style={styles.accordionTitle}>{t('settings.calendarImages')}</Text>
                    <View style={styles.accordionRight}>
                      <View style={styles.accordionBadge}>
                        <Text style={styles.accordionBadgeText}>{calCount}/12</Text>
                      </View>
                      <Feather
                        name={calExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color="#fffaf0"
                      />
                    </View>
                  </Pressable>

                  {calExpanded ? (
                    <View style={styles.accordionBody}>
                      <Text style={styles.accordionNote}>{t('settings.calendarImagesDesc')}</Text>
                      <Pressable
                        onPress={onPickCalendarImages}
                        style={({ pressed }) => [styles.pickButton, { backgroundColor: themeColors.surfaceWarm, borderColor: themeColors.borderWarm }, pressed && styles.pressed]}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.pickButtonTitle, { color: themeColors.textPrimary }]}>{t('settings.calendarImagesPick')}</Text>
                        <Text style={styles.pickButtonSub}>{t('settings.calendarImagesPickSub')}</Text>
                      </Pressable>
                      {calendarImages.some(Boolean) ? (
                        <View style={styles.thumbGrid}>
                          {calendarImages.map((uri, idx) => (
                            <View key={idx} style={styles.thumb}>
                              {uri ? (
                                <PositionedImage uri={uri} position={calendarImagePositions[idx]} style={styles.thumbImg} />
                              ) : (
                                <View style={styles.thumbEmpty}>
                                  <Text style={styles.thumbNum}>{idx + 1}</Text>
                                  <Text style={styles.thumbMon}>{getMonthName(idx, language).slice(0, 3)}</Text>
                                </View>
                              )}
                            </View>
                          ))}
                        </View>
                      ) : null}
                      {calendarImages.some(Boolean) ? (
                        <View style={styles.monthPositionList}>
                          {calendarImages.map((uri, idx) => uri ? (
                            <View key={idx} style={styles.monthPositionItem}>
                              <Text style={styles.monthPositionLabel}>{`${getMonthName(idx, language)}`}</Text>
                              <Pressable
                                onPress={() => onEditCalendarCrop(idx)}
                                style={({ pressed }) => [styles.editCropBtn, { backgroundColor: themeColors.surfaceWarm, borderColor: themeColors.borderWarm }, pressed && styles.pressed]}
                                accessibilityRole="button"
                              >
                                <Feather name="crop" size={14} color={themeColors.moss} />
                                <Text style={[styles.editCropBtnLabel, { color: themeColors.moss }]}>
                                  {t('imageCrop.edit')}
                                </Text>
                              </Pressable>
                            </View>
                          ) : null)}
                        </View>
                      ) : null}
                    </View>
                  ) : null}

                </>
              ) : null}

              {/* PWA `.language-picker` — language <select>. The PWA settings
                  form keeps the language picker inside the same form-card,
                  directly after the theme disclosure, with no divider above. */}
              <View>
                <Text style={styles.fieldLabel}>{t('settings.language')}</Text>
                <View style={styles.langRow}>
                  <LanguagePill
                    label={t('settings.languageFi')}
                    active={language === 'fi'}
                    onPress={() => setLanguage('fi')}
                  />
                  <LanguagePill
                    label={t('settings.languageEn')}
                    active={language === 'en'}
                    onPress={() => setLanguage('en')}
                  />
                </View>
              </View>

              {/* Save changes — shows "Saved ✓" briefly after press */}
              {activeMemorial ? (
                <AppButton
                  label={saved ? t('settings.saved') : t('settings.saveChanges')}
                  onPress={onSave}
                />
              ) : null}

              {/* Danger zone — delete memorial */}
              {activeMemorial ? (
                <View style={styles.dangerZone}>
                  <Text style={styles.dangerZoneLabel}>
                    {t('settings.dangerZone')}
                  </Text>
                  <Pressable
                    onPress={onDeleteMemorial}
                    style={({ pressed }) => [styles.dangerAction, pressed && styles.pressed]}
                    accessibilityRole="button"
                  >
                    <Text style={styles.dangerActionText}>{t('settings.deleteMemorial')}</Text>
                  </Pressable>
                  <Text style={styles.dangerNote}>{t('settings.deleteNote')}</Text>
                </View>
              ) : null}

            </View>
          </View>

          {/* PWA `.about` block / version footer — placed below the main
              form card as in styles.css. Kept as a warm tinted card. */}
          <AppCard variant="warm" style={styles.aboutCard}>
            <Text style={styles.aboutBody}>{t('settings.aboutBody')}</Text>
            <View style={styles.versionRow}>
              <Feather name="info" size={13} color={colors.textSoft} />
              <Text style={styles.version}>{t('settings.version')} 0.1.0</Text>
            </View>
          </AppCard>

          {/* Developer — clear all data */}
          <View style={styles.formCardShadow}>
            <View style={[styles.formCard, { backgroundColor: themeColors.card, borderColor: themeColors.borderWarm }]}>
              <Pressable
                onPress={onClearAll}
                style={({ pressed }) => [styles.dangerAction, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <Text style={styles.dangerActionText}>{t('settings.clearAll')}</Text>
              </Pressable>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Crop / aspect-ratio picker — same modal used everywhere images are
          chosen. The preview shares its rendering with the final card. */}
      <ImageCropAspectPicker
        visible={!!cropTarget}
        uri={cropTarget?.uri}
        initialValue={cropTarget?.current}
        onApply={cropTarget?.apply}
        onCancel={() => setCropTarget(null)}
        onReplace={cropTarget?.replace}
      />

      {/* ── Pet type picker modal ───────────────────────────────────────── */}
      <Modal
        visible={petTypeOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPetTypeOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setPetTypeOpen(false)}>
          <View style={[styles.modalSheet, { backgroundColor: themeColors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('settings.petType')}</Text>
              <Pressable
                onPress={() => setPetTypeOpen(false)}
                style={styles.modalClose}
                accessibilityRole="button"
              >
                <Feather name="x" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {PET_TYPE_KEYS.map((key) => {
                const active = petType === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => { setPetType(key); setPetTypeOpen(false); }}
                    style={({ pressed }) => [styles.optionRow, pressed && styles.pressed]}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.optionText, active && { color: themeColors.moss, fontWeight: '700' }]}>
                      {t(`settings.petTypeOptions.${key}`)}
                    </Text>
                    {active ? (
                      <Feather name="check" size={17} color={themeColors.moss} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </AppScreen>
  );
}

function LanguagePill({ label, active, onPress }) {
  const { themeColors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.langPill,
        active && { backgroundColor: themeColors.moss, borderColor: themeColors.moss },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
    >
      <Text style={[styles.langPillLabel, { color: themeColors.moss }, active && styles.langPillLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  noInnerPad: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0 },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 150,
  },

  // Page title
  wallHeader: { paddingTop: 6, paddingBottom: 14 },
  wallTitle: {
    fontFamily: typography.serif,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '400',
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },

  // Switch memorial pill
  switchPill: {
    alignSelf: 'flex-start',
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 244, 222, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(200, 168, 110, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  switchPillPressed: { opacity: 0.72 },
  switchPillLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },

  // Main card
  formCardShadow: {
    borderRadius: 24,
    marginBottom: 14,
    ...shadows.soft,
  },
  formCard: {
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    // backgroundColor injected inline via themeColors.card
    padding: 16,
    gap: 14,
  },

  // Field label
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textBody,
    marginBottom: 8,
  },

  // Pet type — dropdown select row (matches PWA <select> appearance)
  selectRow: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: 'rgba(255, 240, 212, 0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectValue: {
    fontSize: 16,
    color: colors.textBody,
    fontWeight: '400',
    flex: 1,
    marginRight: 6,
  },
  selectPlaceholder: {
    color: colors.textSoft,
  },

  // Pet type picker modal (bottom sheet)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '72%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textBody,
    letterSpacing: 0.2,
  },
  modalClose: {
    padding: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  optionText: {
    fontSize: 15,
    color: colors.textBody,
    fontWeight: '500',
  },

  // Portrait picker
  portraitFrame: {
    height: 150,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portraitImage: { width: '100%', height: '100%' },
  portraitPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  portraitActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 4,
  },
  portraitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.card,
  },
  portraitBtnLabel: {
    fontSize: 13,
    color: colors.moss,
    letterSpacing: 0.3,
  },

  // Accordion header — dark green bar matching PWA .accordion-header style
  accordion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    borderRadius: 14,
    // backgroundColor injected inline via themeColors.mossDark
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  accordionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fffaf0',
    letterSpacing: 0.2,
  },
  accordionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  accordionBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  accordionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fffaf0',
    letterSpacing: 0.4,
  },
  // Accordion expanded body
  accordionBody: {
    gap: 12,
    paddingTop: 2,
  },
  accordionNote: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
  },

  // Calendar images pick button
  pickButton: {
    minHeight: 64,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: 'rgba(255, 244, 222, 0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: spacing.md,
  },
  pickButtonTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  pickButtonSub: {
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 0.3,
  },

  // 12-image thumbnails (4-column grid)
  thumbGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  thumb: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImg: { width: '100%', height: '100%' },
  thumbEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 1 },
  thumbNum: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSoft,
  },
  thumbMon: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textSoft,
    letterSpacing: 0.2,
  },
  monthPositionList: {
    gap: 12,
  },
  monthPositionItem: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 10,
  },
  monthPositionLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  editCropBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             6,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    borderRadius:    999,
    borderWidth:     1,
    borderColor:     colors.warmBorder,
    backgroundColor: colors.card,
    alignSelf:       'flex-start',
  },
  editCropBtnLabel: {
    fontSize:      13,
    color:         colors.moss,
    fontWeight:    '700',
    letterSpacing: 0.3,
  },

  // Thin divider
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    marginTop: 2,
    marginBottom: 2,
  },

  // Danger zone
  dangerZone: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(143, 77, 56, 0.16)',
    paddingTop: 18,
    gap: 8,
  },
  dangerZoneLabel: {
    color: '#8f4d38',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  dangerAction: {
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(143, 77, 56, 0.28)',
    backgroundColor: 'rgba(252, 236, 230, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerActionText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#8f4d38',
  },
  dangerNote: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },

  // Language pills
  langRow: { flexDirection: 'row', gap: spacing.sm },
  langPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langPillActive: { backgroundColor: colors.moss, borderColor: colors.moss },
  pressed: { opacity: 0.72 },
  langPillLabel: {
    fontSize: 13,
    color: colors.moss,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  langPillLabelActive: { color: colors.textOnPrimary },

  // About card
  aboutCard: { marginBottom: 14 },
  aboutBody: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  version: {
    fontSize: 11,
    color: colors.textSoft,
    letterSpacing: 0.8,
  },
});
