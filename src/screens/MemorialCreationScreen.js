import { useEffect, useState } from 'react';
import {
  Image,
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
} from '../theme/designSystem';
import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import SectionLabel from '../components/SectionLabel';
import { pickImageFromLibrary, removePersistedMedia } from '../lib/media';

export default function MemorialCreationScreen() {
  const { t } = useI18n();
  const { createMemorial } = useMemorials();
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [birth, setBirth] = useState('');
  const [death, setDeath] = useState('');
  const [description, setDescription] = useState('');
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
      portraitUri: portraitUri ?? null,
    });
  };

  return (
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
          {/* Header */}
          <Text style={styles.title}>{t('creation.title')}</Text>
          <Text style={styles.subtitle}>{t('creation.subtitle')}</Text>

          {/* Portrait */}
          <SectionLabel style={styles.fieldLabel}>{t('creation.portrait')}</SectionLabel>
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

          {/* Name */}
          <AppInput
            label={t('creation.name')}
            value={name}
            onChangeText={(v) => { setError(''); setName(v); }}
            placeholder={t('creation.namePlaceholder')}
            style={styles.fieldWrap}
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
            style={styles.fieldWrap}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <AppButton label={t('creation.save')} onPress={onSave} style={styles.saveBtn} />
          <AppButton
            label={t('creation.cancel')}
            onPress={() => navigation.goBack()}
            variant="secondary"
            style={styles.cancelBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  iconBtn: { padding: spacing.xs },
  pressed: { opacity: 0.6 },

  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  title: {
    fontFamily: typography.serif,
    fontSize: typography.sizes.titleLarge,
    fontWeight: typography.weights.regular,
    color: colors.textPrimary,
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: typography.sizes.label,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginBottom: spacing.xl,
  },

  fieldLabel: {
    marginBottom: spacing.xs,
  },
  fieldWrap: { marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  rowField: { flex: 1 },

  // Portrait
  portraitFrame: {
    height: 200,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: spacing.sm,
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
    marginBottom: spacing.lg,
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

  error: {
    color: colors.danger,
    fontSize: typography.sizes.label,
    marginBottom: spacing.sm,
  },
  saveBtn: { marginTop: spacing.xs },
  cancelBtn: { marginTop: spacing.sm },
});
