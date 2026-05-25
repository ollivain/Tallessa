import { useEffect, useState } from 'react';
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
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
import { pickImageFromLibrary, removePersistedMedia } from '../lib/media';

const SCREEN_BG = require('../../assets/selector-background.png');

const PET_TYPE_KEYS = ['human', 'horse', 'dog', 'cat', 'rabbit', 'bird', 'guineaPig', 'hamster', 'ferret', 'turtle', 'other'];

export default function MemorialCreationScreen() {
  const { t } = useI18n();
  const { createMemorial } = useMemorials();
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [birth, setBirth] = useState('');
  const [death, setDeath] = useState('');
  const [description, setDescription] = useState('');
  const [petType, setPetType] = useState('');
  const [petTypeCustom, setPetTypeCustom] = useState('');
  const [memorialName, setMemorialName] = useState('');
  const [portraitUri, setPortraitUri] = useState(null);
  const [error, setError] = useState('');
  const [savedPortrait, setSavedPortrait] = useState(false);

  useEffect(() => () => {
    if (portraitUri && !savedPortrait) removePersistedMedia(portraitUri);
  }, [portraitUri, savedPortrait]);

  const onPickPortrait = async () => {
    const result = await pickImageFromLibrary(t);
    if (!result) return;
    if (portraitUri && portraitUri !== result.uri) removePersistedMedia(portraitUri);
    setPortraitUri(result.uri);
  };

  const onRemovePortrait = () => {
    if (portraitUri) removePersistedMedia(portraitUri);
    setPortraitUri(null);
  };

  const onSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('creation.nameRequired'));
      return;
    }
    setSavedPortrait(true);
    createMemorial({
      name: trimmed,
      birth: birth.trim(),
      death: death.trim(),
      description: description.trim(),
      petType: petType || null,
      petTypeCustom: petTypeCustom.trim(),
      memorialName: memorialName.trim(),
      portraitUri: portraitUri ?? null,
    });
  };

  return (
    <ImageBackground source={SCREEN_BG} resizeMode="cover" style={styles.bgWrap}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Top bar */}
          <View style={styles.topBar}>
            <Pressable
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              hitSlop={12}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            >
              <Feather name="x" size={22} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Title + subtitle above the form card */}
            <Text style={styles.title}>{t('creation.title')}</Text>
            <Text style={styles.subtitle}>{t('creation.subtitle')}</Text>

            {/* PWA: .form-card.card { padding:16px; gap:14px; border-radius:24px; bg:rgba(255,250,240,.98) } */}
            <View style={styles.formCardShadow}>
              <View style={styles.formCard}>

                {/* Portrait */}
                <View>
                  <Text style={styles.fieldLabel}>{t('creation.portrait')}</Text>
                  <Pressable
                    onPress={onPickPortrait}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.portraitFrame, pressed && styles.pressed]}
                  >
                    {portraitUri ? (
                      <Image source={{ uri: portraitUri }} style={styles.portraitImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.portraitPlaceholder}>
                        <Feather name="user" size={32} color={colors.brown} />
                        <Text style={styles.portraitHint}>{t('creation.pickPortrait')}</Text>
                      </View>
                    )}
                  </Pressable>
                  <View style={styles.portraitActions}>
                    <Pressable onPress={onPickPortrait} style={styles.portraitBtn}>
                      <Feather name="image" size={14} color={colors.moss} />
                      <Text style={styles.portraitBtnLabel}>
                        {portraitUri ? t('creation.changePortrait') : t('creation.pickPortrait')}
                      </Text>
                    </Pressable>
                    {portraitUri ? (
                      <Pressable onPress={onRemovePortrait} style={styles.portraitBtn}>
                        <Feather name="trash-2" size={14} color={colors.danger} />
                        <Text style={[styles.portraitBtnLabel, { color: colors.danger }]}>
                          {t('creation.removePortrait')}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>

                {/* Name */}
                <AppInput
                  label={t('creation.name')}
                  value={name}
                  onChangeText={(v) => { setError(''); setName(v); }}
                  placeholder={t('creation.namePlaceholder')}
                />

                {/* Dates row */}
                <View style={styles.row}>
                  <AppInput
                    label={t('creation.birth')}
                    value={birth}
                    onChangeText={setBirth}
                    placeholder={t('creation.datePlaceholder')}
                    style={styles.rowField}
                  />
                  <AppInput
                    label={t('creation.death')}
                    value={death}
                    onChangeText={setDeath}
                    placeholder={t('creation.datePlaceholder')}
                    style={styles.rowField}
                  />
                </View>

                {/* Description */}
                <AppInput
                  label={t('creation.description')}
                  value={description}
                  onChangeText={setDescription}
                  placeholder={t('creation.descriptionPlaceholder')}
                  multiline
                />

                {/* Pet type — PWA: <select name="petType"> */}
                <View>
                  <Text style={styles.fieldLabel}>{t('settings.petType')}</Text>
                  <View style={styles.petTypeGrid}>
                    {PET_TYPE_KEYS.map((key) => {
                      const active = petType === key;
                      return (
                        <Pressable
                          key={key}
                          onPress={() => setPetType(active ? '' : key)}
                          style={({ pressed }) => [
                            styles.petTypePill,
                            active && styles.petTypePillActive,
                            pressed && styles.pressed,
                          ]}
                          accessibilityRole="button"
                        >
                          <Text style={[styles.petTypePillLabel, active && styles.petTypePillLabelActive]}>
                            {t(`settings.petTypeOptions.${key}`)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Add details if you wish — PWA: always visible */}
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

                {error ? <Text style={styles.error}>{error}</Text> : null}

                {/* PWA: .primary-action { min-height:52px; border-radius:17px; bg:moss } */}
                <AppButton label={t('creation.save')} onPress={onSave} />
                {/* PWA: .secondary-action { min-height:48px; border-radius:16px } */}
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgWrap: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  iconBtn: { padding: spacing.xs },
  pressed: { opacity: 0.6 },

  // PWA .selector-screen: padding-left/right max(28px, safe-area+20px)
  //   padding-top: calc(safe-area-top + 96px) — SafeAreaView handles safe-area,
  //   so paddingTop here is the extra breathing room under the close button.
  scroll: {
    paddingHorizontal: 28,
    paddingTop: 52,
    paddingBottom: 52,
  },

  // PWA .selector-hero h1: font-size clamp(4.6rem, 20vw, 6.7rem) → ~78px at 390px
  //   font-weight: 700; line-height: 0.82; letter-spacing: 0; color: var(--color-primary)
  title: {
    fontFamily: typography.serif,
    fontSize: 60,
    lineHeight: 57,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0,
    marginBottom: 14,
  },
  // PWA .selector-hero p: font-size clamp(1.1rem, 4.7vw, 1.42rem) → ~18px at 390px
  //   font-weight: 500; color: rgba(80,86,76,0.88)
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(80, 86, 76, 0.88)',
    lineHeight: 27,
    marginBottom: 42,
  },

  // PWA: .form-card.card { padding:16px; gap:14px; border-radius:24px; bg:rgba(255,250,240,.98); overflow:hidden }
  // Shadow wrapper (shadow separate from overflow:hidden)
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

  // PWA: form-card label span { font-size:13px; font-weight:700; color:var(--text) }
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textBody,
    marginBottom: 8,
  },

  row: { flexDirection: 'row', gap: spacing.sm },
  rowField: { flex: 1 },

  // Portrait
  portraitFrame: {
    height: 180,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: 8,
  },
  portraitImage: { width: '100%', height: '100%' },
  portraitPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  portraitHint: {
    fontSize: typography.sizes.label,
    color: colors.textSoft,
    letterSpacing: 0.3,
  },
  portraitActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  portraitBtn: {
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
  portraitBtnLabel: {
    fontSize: typography.sizes.label,
    color: colors.moss,
    letterSpacing: 0.3,
  },

  // PWA: form-card label span { font-size:13px; font-weight:700; color:var(--text) }
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textBody,
    marginBottom: 8,
  },

  petTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  petTypePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: 'transparent',
  },
  petTypePillActive: { backgroundColor: colors.moss, borderColor: colors.moss },
  pressed: { opacity: 0.72 },
  petTypePillLabel: {
    fontSize: 13,
    color: colors.moss,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  petTypePillLabelActive: { color: colors.textOnPrimary },

  error: {
    color: colors.danger,
    fontSize: typography.sizes.label,
  },
});
