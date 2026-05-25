import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
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
import SectionLabel from '../components/SectionLabel';
import { pickImageFromLibrary, removePersistedMedia } from '../lib/media';

// Simple Finnish possessive: "Aino" → "Ainon", "Olaf" → "Olafin"
function toPossessive(name, language) {
  if (!name) return '';
  if (language !== 'fi') return `${name}'s`;
  const last = name[name.length - 1]?.toLowerCase() || '';
  const vowels = 'aeiouäöy';
  return vowels.includes(last) ? `${name}n` : `${name}in`;
}

export default function MemorialDayScreen() {
  const { t, language } = useI18n();
  const { activeMemorial, updateMemorial, setCandleLit, deleteMemorial, clearActive } = useMemorials();

  const [editOpen, setEditOpen] = useState(false);
  // Edit form state
  const [name, setName] = useState('');
  const [birth, setBirth] = useState('');
  const [death, setDeath] = useState('');
  const [description, setDescription] = useState('');
  const [portraitUri, setPortraitUri] = useState(null);
  const [savedPortrait, setSavedPortrait] = useState(false);

  // Populate edit form when modal opens
  useEffect(() => {
    if (editOpen && activeMemorial) {
      setName(activeMemorial.name ?? '');
      setBirth(activeMemorial.birth ?? '');
      setDeath(activeMemorial.death ?? '');
      setDescription(activeMemorial.description ?? '');
      setPortraitUri(activeMemorial.portraitUri ?? null);
      setSavedPortrait(true); // don't delete existing portrait on unmount
    }
  }, [editOpen, activeMemorial]);

  const openEdit = () => setEditOpen(true);

  const closeEdit = () => {
    setEditOpen(false);
    setPortraitUri(activeMemorial?.portraitUri ?? null);
  };

  const onPickPortrait = async () => {
    const result = await pickImageFromLibrary(t);
    if (!result) return;
    if (portraitUri && portraitUri !== activeMemorial?.portraitUri && portraitUri !== result.uri) {
      removePersistedMedia(portraitUri);
    }
    setPortraitUri(result.uri);
  };

  const onRemovePortrait = () => {
    if (portraitUri && portraitUri !== activeMemorial?.portraitUri) {
      removePersistedMedia(portraitUri);
    }
    setPortraitUri(null);
  };

  const saveEdit = () => {
    if (!activeMemorial) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    updateMemorial(activeMemorial.id, {
      name: trimmed,
      birth: birth.trim(),
      death: death.trim(),
      description: description.trim(),
      portraitUri: portraitUri ?? null,
    });
    setSavedPortrait(true);
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

  if (!activeMemorial) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={screenStyles.scroll}>
          <AppCard variant="soft">
            <Text style={styles.emptyTitle}>{t('selection.title')}</Text>
            <Text style={styles.emptyBody}>{t('wall.noMemorial')}</Text>
          </AppCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const possessiveName = toPossessive(activeMemorial.name, language);
  const pageTitle = language === 'fi'
    ? `${possessiveName} päivä`
    : `${possessiveName} day`;

  const candle = activeMemorial.candleLit;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={screenStyles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Portrait */}
        <View style={styles.portraitWrap}>
          {activeMemorial.portraitUri ? (
            <Image
              source={{ uri: activeMemorial.portraitUri }}
              style={styles.portrait}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.portraitPlaceholder}>
              <Feather name="user" size={48} color={colors.brown} />
            </View>
          )}
          {/* Edit button overlay */}
          <Pressable
            onPress={openEdit}
            style={({ pressed }) => [styles.editBadge, pressed && { opacity: 0.75 }]}
            hitSlop={8}
          >
            <Feather name="edit-2" size={14} color={colors.textOnPrimary} />
          </Pressable>
        </View>

        {/* Title */}
        <Text style={styles.pageTitle}>{pageTitle}</Text>
        <View style={styles.titleRule} />

        {/* Info card */}
        <AppCard variant="soft" style={styles.infoCard}>
          <Text style={styles.memorialName}>{activeMemorial.name}</Text>
          <View style={styles.datesRow}>
            {activeMemorial.birth ? (
              <View style={styles.dateItem}>
                <SectionLabel>{t('memorial.born')}</SectionLabel>
                <Text style={styles.dateText}>{activeMemorial.birth}</Text>
              </View>
            ) : null}
            {activeMemorial.birth && activeMemorial.death ? (
              <View style={styles.dateSep} />
            ) : null}
            {activeMemorial.death ? (
              <View style={styles.dateItem}>
                <SectionLabel>{t('memorial.died')}</SectionLabel>
                <Text style={styles.dateText}>{activeMemorial.death}</Text>
              </View>
            ) : null}
          </View>
        </AppCard>

        {/* Description / note */}
        <AppCard variant="warm" style={styles.noteCard}>
          {activeMemorial.description ? (
            <Text style={styles.noteText}>{activeMemorial.description}</Text>
          ) : (
            <Text style={styles.noteEmpty}>{t('memorial.noDescription')}</Text>
          )}
        </AppCard>

        {/* Candle section */}
        <AppCard
          variant="soft"
          onPress={onToggleCandle}
          style={styles.candleCard}
        >
          <View style={styles.candleRow}>
            <Text style={styles.candleEmoji}>{candle ? '🕯️' : '🕯'}</Text>
            <View style={styles.candleInfo}>
              <Text style={styles.candleLabel}>
                {candle ? t('memorial.candleLit') : t('memorial.candleLight')}
              </Text>
              {candle ? (
                <Text style={styles.candleHint}>
                  {language === 'fi' ? 'Paina sammuttaaksesi' : 'Tap to extinguish'}
                </Text>
              ) : (
                <Text style={styles.candleHint}>
                  {language === 'fi' ? 'Paina sytyttääksesi' : 'Tap to light'}
                </Text>
              )}
            </View>
            <Feather
              name={candle ? 'sun' : 'moon'}
              size={20}
              color={candle ? colors.brown : colors.textSoft}
            />
          </View>
        </AppCard>

        {/* Delete memorial */}
        <Pressable
          onPress={onDeleteMemorial}
          style={({ pressed }) => [styles.deleteRow, pressed && { opacity: 0.7 }]}
        >
          <Feather name="trash-2" size={15} color={colors.danger} />
          <Text style={styles.deleteText}>{t('memorial.deleteTitle')}</Text>
        </Pressable>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editOpen} animationType="slide" onRequestClose={closeEdit} transparent={false}>
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalBar}>
              <Pressable onPress={closeEdit} hitSlop={12} style={styles.iconBtn}>
                <Feather name="x" size={22} color={colors.textPrimary} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalTitle}>{t('memorial.editTitle')}</Text>

              {/* Portrait picker */}
              <SectionLabel style={styles.fieldLabel}>{t('creation.portrait')}</SectionLabel>
              <Pressable
                onPress={onPickPortrait}
                style={({ pressed }) => [styles.portraitFrame, pressed && { opacity: 0.8 }]}
              >
                {portraitUri ? (
                  <Image source={{ uri: portraitUri }} style={styles.portraitFrameImg} resizeMode="cover" />
                ) : (
                  <View style={styles.portraitFramePlaceholder}>
                    <Feather name="user" size={28} color={colors.brown} />
                  </View>
                )}
              </Pressable>
              <View style={styles.portraitActions}>
                <Pressable onPress={onPickPortrait} style={styles.smallBtn}>
                  <Feather name="image" size={13} color={colors.moss} />
                  <Text style={styles.smallBtnLabel}>
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

              <AppInput
                label={t('creation.name')}
                value={name}
                onChangeText={setName}
                placeholder={t('creation.namePlaceholder')}
                style={styles.inputWrap}
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
                  label={t('creation.death')}
                  value={death}
                  onChangeText={setDeath}
                  placeholder={t('creation.datePlaceholder')}
                  style={styles.rowField}
                />
              </View>
              <AppInput
                label={t('creation.description')}
                value={description}
                onChangeText={setDescription}
                placeholder={t('creation.descriptionPlaceholder')}
                multiline
                style={styles.inputWrap}
              />

              <AppButton label={t('creation.save')} onPress={saveEdit} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },

  // Portrait
  portraitWrap: {
    position: 'relative',
    height: 260,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  portrait: { width: '100%', height: '100%' },
  portraitPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  editBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.moss,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },

  // Title
  pageTitle: {
    fontFamily: typography.serif,
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.regular,
    color: colors.textPrimary,
    letterSpacing: 0.4,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  titleRule: {
    height: 1,
    width: 56,
    backgroundColor: colors.brown,
    opacity: 0.45,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },

  // Info card
  infoCard: { marginBottom: spacing.sm },
  memorialName: {
    fontFamily: typography.serif,
    fontSize: typography.sizes.title,
    color: colors.textPrimary,
    fontWeight: typography.weights.regular,
    marginBottom: spacing.sm,
  },
  datesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateItem: { gap: 4 },
  dateSep: {
    width: 1,
    height: 32,
    backgroundColor: colors.divider,
  },
  dateText: {
    fontSize: typography.sizes.body,
    color: colors.textBody,
    fontWeight: typography.weights.medium,
  },

  // Note card
  noteCard: { marginBottom: spacing.sm },
  noteText: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: typography.sizes.bodyLarge,
    color: colors.brown,
    lineHeight: typography.lineHeights.bodyLarge,
  },
  noteEmpty: {
    fontSize: typography.sizes.label,
    color: colors.textSoft,
    fontStyle: 'italic',
  },

  // Candle
  candleCard: { marginBottom: spacing.lg },
  candleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  candleEmoji: { fontSize: 28 },
  candleInfo: { flex: 1 },
  candleLabel: {
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  candleHint: {
    fontSize: typography.sizes.label,
    color: colors.textSoft,
    marginTop: 2,
  },

  // Delete
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  deleteText: {
    fontSize: typography.sizes.label,
    color: colors.danger,
    fontWeight: typography.weights.medium,
  },

  // Empty state
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

  // Edit modal
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
    marginBottom: spacing.lg,
    letterSpacing: 0.3,
  },
  fieldLabel: { marginBottom: spacing.xs },
  portraitFrame: {
    height: 180,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: spacing.sm,
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
    marginBottom: spacing.lg,
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
  inputWrap: { marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  rowField: { flex: 1 },
});
