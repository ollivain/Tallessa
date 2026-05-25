import { useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useI18n } from '../i18n';
import { useMemorials } from '../state/MemorialContext';
import {
  colors,
  typography,
  spacing,
  radii,
  screenStyles,
} from '../theme/designSystem';
import ScreenHeader from '../components/ScreenHeader';
import AppCard from '../components/AppCard';
import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import EmptyStateCard from '../components/EmptyStateCard';
import SectionLabel from '../components/SectionLabel';

const MODE_ADD  = 'add';
const MODE_EDIT = 'edit';

export default function LettersScreen() {
  const { t } = useI18n();
  const { activeMemorial, addLetter, updateLetter, deleteLetter } = useMemorials();

  const [modalMode, setModalMode] = useState(MODE_ADD);
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const letters = activeMemorial?.letters ?? [];

  const openAdd = () => {
    setModalMode(MODE_ADD);
    setEditingId(null);
    setTitle('');
    setBody('');
    setOpen(true);
  };

  const openEdit = (letter) => {
    setModalMode(MODE_EDIT);
    setEditingId(letter.id);
    setTitle(letter.title ?? '');
    setBody(letter.body ?? '');
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setTitle('');
    setBody('');
    setEditingId(null);
  };

  const save = () => {
    if (!title.trim() && !body.trim()) { close(); return; }

    if (modalMode === MODE_EDIT && editingId) {
      updateLetter(activeMemorial.id, editingId, {
        title: title.trim() || t('mock.letterTitle'),
        body: body.trim(),
      });
    } else {
      addLetter(activeMemorial.id, {
        title: title.trim() || t('mock.letterTitle'),
        body: body.trim(),
        date: new Date().toISOString().slice(0, 10),
      });
    }
    close();
  };

  const confirmDelete = (letter) => {
    Alert.alert(
      t('delete.letterTitle'),
      t('delete.letterBody'),
      [
        { text: t('delete.cancel'), style: 'cancel' },
        {
          text: t('delete.confirm'),
          style: 'destructive',
          onPress: () => deleteLetter(activeMemorial.id, letter.id),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title={t('letters.title')} subtitle={t('letters.subtitle')} />

      <ScrollView contentContainerStyle={screenStyles.scroll}>
        {letters.length === 0 ? (
          <EmptyStateCard eyebrow={t('letters.title')} body={t('letters.empty')} />
        ) : (
          <View style={styles.list}>
            {letters.map((l) => (
              <LetterCard
                key={l.id}
                letter={l}
                onEdit={() => openEdit(l)}
                onDelete={() => confirmDelete(l)}
              />
            ))}
          </View>
        )}

        <AppButton label={t('letters.add')} onPress={openAdd} style={styles.cta} />
      </ScrollView>

      <Modal visible={open} animationType="slide" onRequestClose={close} transparent={false}>
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalBar}>
              <Pressable onPress={close} hitSlop={12} style={styles.iconBtn}>
                <Feather name="x" size={22} color={colors.textPrimary} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalTitle}>
                {modalMode === MODE_EDIT ? t('letters.edit') : t('letters.add')}
              </Text>
              <AppInput
                label={t('mock.letterTitle')}
                value={title}
                onChangeText={setTitle}
                placeholder={t('mock.letterTitle')}
                style={styles.inputWrap}
              />
              <AppInput
                label={t('mock.letterBody')}
                value={body}
                onChangeText={setBody}
                placeholder={t('mock.letterBody')}
                multiline
                style={styles.inputWrap}
              />
              <AppButton label={t('creation.save')} onPress={save} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function LetterCard({ letter, onEdit, onDelete }) {
  return (
    <AppCard variant="soft">
      <View style={styles.cardActions}>
        <Pressable onPress={onEdit} hitSlop={8} style={styles.cardActionBtn}>
          <Feather name="edit-2" size={14} color={colors.moss} />
        </Pressable>
        <Pressable onPress={onDelete} hitSlop={8} style={styles.cardActionBtn}>
          <Feather name="trash-2" size={14} color={colors.danger} />
        </Pressable>
      </View>

      <View style={styles.letterHeader}>
        <Feather name="mail" size={16} color={colors.brown} style={styles.letterIcon} />
        <Text style={styles.letterTitle} numberOfLines={1}>{letter.title}</Text>
      </View>
      {letter.body ? (
        <Text style={styles.letterBody} numberOfLines={4}>{letter.body}</Text>
      ) : null}
      {letter.date ? (
        <View style={styles.datePillWrap}>
          <SectionLabel variant="pill">{letter.date}</SectionLabel>
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },

  list: { gap: spacing.md, marginBottom: spacing.lg },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  cardActionBtn: {
    padding: 6,
    borderRadius: radii.xs,
    backgroundColor: colors.surface,
  },
  letterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  letterIcon: { opacity: 0.7 },
  letterTitle: {
    flex: 1,
    fontFamily: typography.serif,
    fontSize: typography.sizes.bodyLarge,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  letterBody: {
    fontSize: typography.sizes.label,
    color: colors.textMuted,
    lineHeight: typography.lineHeights.body,
    marginTop: 4,
    fontStyle: 'italic',
  },
  datePillWrap: { marginTop: spacing.sm },
  cta: { marginTop: spacing.md },

  // Modal
  modalBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  iconBtn: { padding: spacing.xs },
  modalScroll: { paddingHorizontal: spacing.xl, paddingBottom: 60 },
  modalTitle: {
    fontFamily: typography.serif,
    fontSize: typography.sizes.titleLarge,
    fontWeight: typography.weights.regular,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    letterSpacing: 0.3,
  },
  inputWrap: { marginBottom: spacing.md },
});
