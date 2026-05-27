import { useEffect, useRef, useState } from 'react';
import {
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
import { useNavigation } from '@react-navigation/native';
import { useI18n } from '../i18n';
import { useMemorials } from '../state/MemorialContext';
import {
  colors,
  typography,
  spacing,
  radii,
  shadows,
} from '../theme/designSystem';
import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import ImageCropAspectPicker, { DEFAULT_CROP_VALUE } from '../components/ImageCropAspectPicker';
import PositionedImage from '../components/PositionedImage';
import { pickImageFromLibrary, pickMultipleImagesFromLibrary, removePersistedMedia } from '../lib/media';
import { useTheme } from '../state/ThemeContext';
import { parseDateInput } from '../models/memorial';

// All image pickers share the same default metadata so the saved value is
// the same shape no matter which slot was tapped.
const DEFAULT_IMAGE_POSITION = DEFAULT_CROP_VALUE;

const SCREEN_BG = require('../../assets/bg-asetukset.png');

const PET_TYPE_KEYS = [
  'human', 'horse', 'dog', 'cat', 'rabbit', 'bird',
  'guineaPig', 'hamster', 'ferret', 'turtle', 'other',
];

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

function toMonthPhotos(calendarImages) {
  return calendarImages.reduce((acc, uri, index) => {
    if (uri) acc[String(index + 1).padStart(2, '0')] = uri;
    return acc;
  }, {});
}

function toMonthPhotoPositions(calendarImages, positions) {
  return calendarImages.reduce((acc, uri, index) => {
    if (uri) acc[String(index + 1).padStart(2, '0')] = positions[index] ?? DEFAULT_IMAGE_POSITION;
    return acc;
  }, {});
}

export default function MemorialCreationScreen() {
  const { t, language, setLanguage } = useI18n();
  const { createMemorial } = useMemorials();
  const { themeColors } = useTheme();
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [death, setDeath] = useState('');
  const [petType, setPetType] = useState('horse');
  const [petTypeCustom, setPetTypeCustom] = useState('');
  const [memorialName, setMemorialName] = useState('');
  const [heroImageUri, setHeroImageUri] = useState(null);
  const [memorialImageUri, setMemorialImageUri] = useState(null);
  const [heroImagePosition, setHeroImagePosition] = useState(DEFAULT_IMAGE_POSITION);
  const [memorialImagePosition, setMemorialImagePosition] = useState(DEFAULT_IMAGE_POSITION);
  const [calendarImages, setCalendarImages] = useState(() => Array(12).fill(null));
  const [calendarImagePositions, setCalendarImagePositions] = useState(() =>
    Array.from({ length: 12 }, () => DEFAULT_IMAGE_POSITION),
  );
  const [error, setError] = useState('');
  const savedMediaRef = useRef(false);
  const [petTypeOpen, setPetTypeOpen] = useState(false);
  const [calExpanded, setCalExpanded] = useState(false);
  // cropTarget routes the ImageCropAspectPicker modal: { uri, current, apply, replace }
  const [cropTarget, setCropTarget] = useState(null);

  useEffect(() => () => {
    if (savedMediaRef.current) return;
    if (heroImageUri) removePersistedMedia(heroImageUri);
    if (memorialImageUri) removePersistedMedia(memorialImageUri);
    calendarImages.forEach((uri) => { if (uri) removePersistedMedia(uri); });
  }, [calendarImages, heroImageUri, memorialImageUri]);

  // Open the crop picker for the freshly chosen URI. The picker carries the
  // image's URI + the previous crop metadata; on Apply we commit the result.
  const openCropPicker = ({ uri, current, apply }) => {
    setCropTarget({
      uri,
      current,
      apply,
      replace: async () => {
        const replaced = await pickImageFromLibrary(t);
        if (replaced) {
          setCropTarget((c) => c ? { ...c, uri: replaced.uri } : null);
        }
      },
    });
  };

  const pickHeroImage = async () => {
    const result = await pickImageFromLibrary(t);
    if (!result) return;
    const previousUri = heroImageUri;
    openCropPicker({
      uri: result.uri,
      current: previousUri === result.uri ? heroImagePosition : DEFAULT_IMAGE_POSITION,
      apply: (value) => {
        if (previousUri && previousUri !== result.uri) removePersistedMedia(previousUri);
        setHeroImageUri(result.uri);
        setHeroImagePosition(value);
        setCropTarget(null);
      },
    });
  };

  const removeHeroImage = () => {
    if (heroImageUri) removePersistedMedia(heroImageUri);
    setHeroImageUri(null);
    setHeroImagePosition(DEFAULT_IMAGE_POSITION);
  };

  const editHeroCrop = () => {
    if (!heroImageUri) return;
    openCropPicker({
      uri: heroImageUri,
      current: heroImagePosition,
      apply: (value) => {
        setHeroImagePosition(value);
        setCropTarget(null);
      },
    });
  };

  const pickMemorialImage = async () => {
    const result = await pickImageFromLibrary(t);
    if (!result) return;
    const previousUri = memorialImageUri;
    openCropPicker({
      uri: result.uri,
      current: previousUri === result.uri ? memorialImagePosition : DEFAULT_IMAGE_POSITION,
      apply: (value) => {
        if (previousUri && previousUri !== result.uri) removePersistedMedia(previousUri);
        setMemorialImageUri(result.uri);
        setMemorialImagePosition(value);
        setCropTarget(null);
      },
    });
  };

  const removeMemorialImage = () => {
    if (memorialImageUri) removePersistedMedia(memorialImageUri);
    setMemorialImageUri(null);
    setMemorialImagePosition(DEFAULT_IMAGE_POSITION);
  };

  const editMemorialCrop = () => {
    if (!memorialImageUri) return;
    openCropPicker({
      uri: memorialImageUri,
      current: memorialImagePosition,
      apply: (value) => {
        setMemorialImagePosition(value);
        setCropTarget(null);
      },
    });
  };

  // PWA parity approximation: PWA picks 12 images in one go and the user
  // crops each later. We keep the same picker behaviour but the per-month
  // ImagePositionControls have been replaced by the crop picker accessible
  // via the "Edit crop" button on each picked month thumbnail.
  const pickCalendarImages = async () => {
    const results = await pickMultipleImagesFromLibrary(t, 12);
    if (!results?.length) return;
    const next = [...calendarImages];
    const nextPositions = [...calendarImagePositions];
    results.forEach((result, index) => {
      if (index < 12) {
        if (next[index] && next[index] !== result.uri) removePersistedMedia(next[index]);
        next[index] = result.uri;
        nextPositions[index] = DEFAULT_IMAGE_POSITION;
      }
    });
    setCalendarImages(next);
    setCalendarImagePositions(nextPositions);
  };

  const editCalendarCrop = (index) => {
    const uri = calendarImages[index];
    if (!uri) return;
    openCropPicker({
      uri,
      current: calendarImagePositions[index] ?? DEFAULT_IMAGE_POSITION,
      apply: (value) => {
        const next = [...calendarImagePositions];
        next[index] = value;
        setCalendarImagePositions(next);
        setCropTarget(null);
      },
    });
  };

  const onSave = () => {
    const trimmed = name.trim() || 'Pepe';

    savedMediaRef.current = true;
    createMemorial({
      horseName: trimmed,
      memorialDate: parseDateInput(death),
      memorialImage: memorialImageUri ?? '',
      heroImage: heroImageUri ?? '',
      heroImagePosition,
      memorialImagePosition,
      monthPhotos: toMonthPhotos(calendarImages),
      monthPhotoPositions: toMonthPhotoPositions(calendarImages, calendarImagePositions),
      importantDays: [],
      theme: 'classic',
      language,
      name: trimmed,
      death: parseDateInput(death),
      petType: petType || 'horse',
      petTypeCustom: petTypeCustom.trim(),
      memorialName: memorialName.trim(),
      portraitUri: memorialImageUri ?? heroImageUri ?? null,
      calendarImages,
    });
    navigation.navigate('Main', { screen: 'Home' });
  };

  const calCount = calendarImages.filter(Boolean).length;

  // PWA parity approximation: PWA opens this from the settings view, while RN
  // keeps it as a stack screen; the fields and payload mirror PWA creation mode.
  return (
    <ImageBackground source={SCREEN_BG} resizeMode="cover" style={styles.bgWrap}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* PWA settings/creation form is one big card, not multiple.
                Field order mirrors index.html lines 336–450 exactly:
                horseName → petType → petTypeCustom → memorialName → memorialDate
                → memorialImage → calendar-photos-disclosure → theme-disclosure
                → language → save. */}
            <View style={styles.formCardShadow}>
              <View style={[styles.formCard, { backgroundColor: themeColors.card, borderColor: themeColors.borderWarm }]}>
                <Text style={styles.createNote}>{t('settings.createNote')}</Text>

                <AppInput
                  label={t('settings.horseName')}
                  value={name}
                  onChangeText={(value) => { setError(''); setName(value); }}
                  placeholder={t('settings.horseNamePlaceholder')}
                />

                {/* PWA `<select name="petType">` → modal picker (RN-native dropdown) */}
                <View>
                  <Text style={styles.fieldLabel}>{t('settings.petType')}</Text>
                  <Pressable
                    onPress={() => setPetTypeOpen(true)}
                    style={({ pressed }) => [styles.selectRow, { backgroundColor: themeColors.surfaceWarm, borderColor: themeColors.borderWarm }, pressed && styles.pressed]}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.selectValue, !petType && styles.selectPlaceholder]}>
                      {petType ? t(`settings.petTypeOptions.${petType}`) : t('settings.petType')}
                    </Text>
                    <Feather name="chevron-down" size={18} color={themeColors.moss} />
                  </Pressable>
                </View>

                <AppInput
                  label={t('settings.petTypeCustom')}
                  value={petTypeCustom}
                  onChangeText={setPetTypeCustom}
                  placeholder={t('settings.petTypeCustomPlaceholder')}
                />

                <AppInput
                  label={t('settings.memorialName')}
                  value={memorialName}
                  onChangeText={setMemorialName}
                  placeholder={t('settings.memorialNamePlaceholder')}
                />

                <AppInput
                  label={t('settings.memorialDate')}
                  value={death}
                  onChangeText={setDeath}
                  placeholder={t('creation.datePlaceholder')}
                />

                {/* PWA `<input name="memorialImage" type="file">` — single picker.
                    RN exposes both the hero image and memorial image since both
                    can be set independently on the settings page in PWA app.js. */}
                <ImagePickerBlock
                  label={t('settings.memorialImage')}
                  uri={memorialImageUri}
                  position={memorialImagePosition}
                  icon="heart"
                  onPick={pickMemorialImage}
                  onRemove={removeMemorialImage}
                  onEditCrop={editMemorialCrop}
                  pickLabel={memorialImageUri ? t('creation.changePortrait') : t('creation.pickPortrait')}
                  removeLabel={t('creation.removePortrait')}
                  tint={themeColors.brown}
                />

                <ImagePickerBlock
                  label={t('creation.portrait')}
                  uri={heroImageUri}
                  position={heroImagePosition}
                  icon="image"
                  onPick={pickHeroImage}
                  onRemove={removeHeroImage}
                  onEditCrop={editHeroCrop}
                  pickLabel={heroImageUri ? t('creation.changePortrait') : t('creation.pickPortrait')}
                  removeLabel={t('creation.removePortrait')}
                  tint={themeColors.brown}
                />

                {/* PWA `.calendar-photos-disclosure` — <details> accordion */}
                <Pressable
                  onPress={() => setCalExpanded((value) => !value)}
                  style={({ pressed }) => [styles.accordion, { backgroundColor: themeColors.mossDark }, pressed && { opacity: 0.88 }]}
                  accessibilityRole="button"
                >
                  <Text style={styles.accordionTitle}>{t('settings.calendarImages')}</Text>
                  <View style={styles.accordionRight}>
                    <View style={styles.accordionBadge}>
                      <Text style={styles.accordionBadgeText}>{calCount}/12</Text>
                    </View>
                    <Feather name={calExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#fffaf0" />
                  </View>
                </Pressable>

                {calExpanded ? (
                  <View style={styles.accordionBody}>
                    <Text style={styles.accordionNote}>{t('settings.calendarImagesDesc')}</Text>
                    <Pressable
                      onPress={pickCalendarImages}
                      style={({ pressed }) => [styles.pickButton, { backgroundColor: themeColors.surfaceWarm, borderColor: themeColors.borderWarm }, pressed && styles.pressed]}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.pickButtonTitle, { color: themeColors.textPrimary }]}>{t('settings.calendarImagesPick')}</Text>
                      <Text style={styles.pickButtonSub}>{t('settings.calendarImagesPickSub')}</Text>
                    </Pressable>
                    {calendarImages.some(Boolean) ? (
                      <View style={styles.thumbGrid}>
                        {calendarImages.map((uri, index) => (
                          <View key={index} style={styles.thumb}>
                            {uri ? (
                              <PositionedImage uri={uri} position={calendarImagePositions[index]} style={styles.thumbImg} />
                            ) : (
                              <View style={styles.thumbEmpty}>
                                <Text style={styles.thumbNum}>{index + 1}</Text>
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                    ) : null}
                    {calendarImages.some(Boolean) ? (
                      <View style={styles.monthPositionList}>
                        {calendarImages.map((uri, index) => uri ? (
                          <View key={index} style={styles.monthPositionItem}>
                            <Text style={styles.monthPositionLabel}>{getMonthName(index, language)}</Text>
                            <Pressable
                              onPress={() => editCalendarCrop(index)}
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

                {/* PWA `.language-picker` — language <select>.
                    Placed at end of the form, matching PWA order. */}
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

                {error ? <Text style={styles.error}>{error}</Text> : null}
                <AppButton label={t('creation.save')} onPress={onSave} />
                <AppButton
                  label={t('creation.cancel')}
                  onPress={() => navigation.goBack()}
                  variant="secondary"
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* PWA parity approximation: PWA crops via free drag-and-zoom directly
          on the image. RN uses a dedicated modal where the same metadata
          (aspectRatio, fitMode, x, y, zoom) is set, then rendered by the
          identical PositionedImage component in both preview and final card. */}
      <ImageCropAspectPicker
        visible={!!cropTarget}
        uri={cropTarget?.uri}
        initialValue={cropTarget?.current}
        onApply={cropTarget?.apply}
        onCancel={() => setCropTarget(null)}
        onReplace={cropTarget?.replace}
      />

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
              <Pressable onPress={() => setPetTypeOpen(false)} style={styles.modalClose} accessibilityRole="button">
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
                    {active ? <Feather name="check" size={17} color={themeColors.moss} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </ImageBackground>
  );
}

function ImagePickerBlock({
  label,
  uri,
  position,
  icon,
  onPick,
  onRemove,
  onEditCrop,
  pickLabel,
  removeLabel,
  tint,
}) {
  const { t } = useI18n();
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      {/* Frame uses the same PositionedImage as the picker preview and the
          final card render — guaranteeing visual parity across all three. */}
      <Pressable
        onPress={uri ? onEditCrop : onPick}
        accessibilityRole="button"
        style={({ pressed }) => [styles.imageFrame, pressed && styles.pressed]}
      >
        {uri ? (
          <PositionedImage uri={uri} position={position} style={styles.imageFill} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Feather name={icon} size={30} color={tint} />
          </View>
        )}
      </Pressable>
      <View style={styles.imageActions}>
        <Pressable onPress={onPick} style={styles.smallButton}>
          <Feather name="image" size={14} color={colors.moss} />
          <Text style={styles.smallButtonLabel}>{pickLabel}</Text>
        </Pressable>
        {uri ? (
          <Pressable onPress={onEditCrop} style={styles.smallButton}>
            <Feather name="crop" size={14} color={colors.moss} />
            <Text style={styles.smallButtonLabel}>{t('imageCrop.edit')}</Text>
          </Pressable>
        ) : null}
        {uri ? (
          <Pressable onPress={onRemove} style={styles.smallButton}>
            <Feather name="trash-2" size={14} color={colors.danger} />
            <Text style={[styles.smallButtonLabel, { color: colors.danger }]}>{removeLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
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
  bgWrap: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },

  pressed: { opacity: 0.72 },

  scroll: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 150,
    gap: 14,
  },

  formCardShadow: {
    borderRadius: 24,
    ...shadows.soft,
  },
  formCard: {
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: 'rgba(255, 244, 222, 0.98)',
    padding: 16,
    gap: 14,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    lineHeight: 19,
  },
  // PWA `.settings-create-note { color: var(--muted); font-weight: 700;
  //   line-height: 1.55; margin-bottom: 16px }`
  createNote: {
    fontSize:     13,
    fontWeight:   '700',
    color:        colors.textMuted,
    lineHeight:   19,
    marginBottom: 2,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textBody,
    marginBottom: 8,
  },

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
  selectPlaceholder: { color: colors.textSoft },

  imageFrame: {
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
  imageFill: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  smallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.card,
  },
  smallButtonLabel: {
    fontSize: typography.sizes.label,
    color: colors.moss,
    letterSpacing: 0.3,
  },

  accordion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    borderRadius: 14,
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
  accordionBody: {
    gap: 12,
    paddingTop: 2,
  },
  accordionNote: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
  },
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
  thumbEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  thumbNum: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSoft,
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
  // "Edit crop" button used inside the per-month list + everywhere
  // ImagePickerBlock needs a re-crop affordance.
  editCropBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             6,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    borderRadius:    radii.pill,
    borderWidth:     1,
    borderColor:     colors.warmBorder,
    backgroundColor: colors.card,
    alignSelf:       'flex-start',
  },
  editCropBtnLabel: {
    fontSize:      typography.sizes.label,
    color:         colors.moss,
    fontWeight:    typography.weights.bold,
    letterSpacing: 0.3,
  },

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
  langPillLabel: {
    fontSize: 13,
    color: colors.moss,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  langPillLabelActive: { color: colors.textOnPrimary },

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
  modalClose: { padding: 4 },
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

  error: {
    color: colors.danger,
    fontSize: typography.sizes.label,
  },
});
