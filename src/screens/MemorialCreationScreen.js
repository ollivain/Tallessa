import { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useI18n } from '../i18n';
import { useMemorials } from '../state/MemorialContext';
import { colors } from '../theme/colors';
import PrimaryButton from '../components/PrimaryButton';
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

  // If the user picked a portrait but then navigates away without saving,
  // drop the persisted copy so the app sandbox doesn't accumulate orphans.
  useEffect(() => () => {
    if (portraitUri && !savedPortrait) removePersistedMedia(portraitUri);
  }, [portraitUri, savedPortrait]);

  const onPickPortrait = async () => {
    const result = await pickImageFromLibrary(t);
    if (!result) return;
    if (portraitUri && portraitUri !== result.uri) {
      removePersistedMedia(portraitUri);
    }
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
        >
          <Text style={styles.title}>{t('creation.title')}</Text>
          <Text style={styles.subtitle}>{t('creation.subtitle')}</Text>

          <View style={styles.portraitBlock}>
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
                  <Feather name="image" size={26} color={colors.accent} />
                </View>
              )}
            </Pressable>
            <View style={styles.portraitActions}>
              <Pressable onPress={onPickPortrait} style={styles.portraitBtn}>
                <Feather name="image" size={14} color={colors.accentDark} />
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

          <Field
            label={t('creation.name')}
            value={name}
            onChangeText={(v) => {
              setError('');
              setName(v);
            }}
            placeholder={t('creation.namePlaceholder')}
          />

          <View style={styles.row}>
            <Field
              label={t('creation.birth')}
              value={birth}
              onChangeText={setBirth}
              placeholder={t('creation.datePlaceholder')}
              style={styles.rowField}
            />
            <Field
              label={t('creation.death')}
              value={death}
              onChangeText={setDeath}
              placeholder={t('creation.datePlaceholder')}
              style={styles.rowField}
            />
          </View>

          <Field
            label={t('creation.description')}
            value={description}
            onChangeText={setDescription}
            placeholder={t('creation.descriptionPlaceholder')}
            multiline
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton label={t('creation.save')} onPress={onSave} style={styles.save} />
          <PrimaryButton
            label={t('creation.cancel')}
            onPress={() => navigation.goBack()}
            variant="secondary"
            style={styles.cancel}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, multiline, style, ...inputProps }) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...inputProps}
        style={[styles.input, multiline && styles.inputMultiline]}
        placeholderTextColor={colors.textSoft}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  iconBtn: { padding: 8 },
  pressed: { opacity: 0.6 },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 26,
    fontWeight: '300',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 24,
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  row: { flexDirection: 'row', gap: 12 },
  rowField: { flex: 1 },
  field: { marginBottom: 18 },
  fieldLabel: {
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  inputMultiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    marginBottom: 12,
  },
  save: { marginTop: 8 },
  cancel: { marginTop: 12 },
  portraitBlock: { marginBottom: 18 },
  portraitFrame: {
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  portraitImage: { width: '100%', height: '100%' },
  portraitPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portraitActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  portraitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.card,
  },
  portraitBtnLabel: { fontSize: 12, color: colors.accentDark, letterSpacing: 0.5 },
});
