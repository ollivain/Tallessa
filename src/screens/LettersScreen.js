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
  shadows,
} from '../theme/designSystem';
import AppScreen from '../components/AppScreen';
import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import EmptyStateCard from '../components/EmptyStateCard';

const SCREEN_BG = require('../../assets/bg-kirjeet.png');

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
    <AppScreen scroll={false} background={SCREEN_BG} contentStyle={styles.noInnerPad}>
      {/* PWA: topbar is position:static, scrolls with content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* PWA: transparent h2 header, no divider */}
        <View style={styles.wallHeader}>
          <Text style={styles.wallTitle}>{t('letters.title')}</Text>
        </View>

        {/* PWA: .add-card-toggle — same pattern as wall screen */}
        <Pressable
          onPress={openAdd}
          style={({ pressed }) => [styles.addToggle, pressed && styles.addTogglePressed]}
          accessibilityRole="button"
        >
          <View style={styles.addIcon}>
            <Text style={styles.addPlus}>+</Text>
          </View>
          <Text style={styles.addLabel}>{t('letters.add')}</Text>
        </Pressable>

        {/* Letter list */}
        {letters.length === 0 ? (
          <EmptyStateCard eyebrow={t('letters.title')} body={t('letters.empty')} />
        ) : (
          <View style={styles.grid}>
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
      </ScrollView>

      <Modal visible={open} animationType="slide" onRequestClose={close} transparent={false}>
        <SafeAreaView style={styles.modalSafe} edges={['top', 'left', 'right']}>
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
              {/* PWA: .letter-editor textarea { min-height: 190px } */}
              <AppInput
                label={t('mock.letterBody')}
                value={body}
                onChangeText={setBody}
                placeholder={t('mock.letterBody')}
                multiline
                inputStyle={styles.letterTextarea}
                style={styles.inputWrap}
              />
              <AppButton label={t('creation.save')} onPress={save} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </AppScreen>
  );
}

// PWA: .letter-card.card — padding 16px, date-line → h3 → p
function LetterCard({ letter, onEdit, onDelete }) {
  return (
    // Shadow wrapper separate from overflow:hidden
    <View style={styles.letterCardShadow}>
      <View style={styles.letterCard}>
        {/* PWA: .delete-action — absolute pill buttons top:12 right:12 */}
        <View style={styles.cardActions}>
          <Pressable onPress={onEdit} hitSlop={8} style={styles.actionPill}>
            <Feather name="edit-2" size={12} color={colors.moss} />
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={8} style={[styles.actionPill, styles.deletePill]}>
            <Feather name="trash-2" size={12} color="#fffaf0" />
          </Pressable>
        </View>

        {/* PWA: .date-line → h3 → p */}
        <View style={styles.letterBody}>
          {letter.date ? (
            <Text style={styles.dateLine}>{letter.date}</Text>
          ) : null}
          <Text style={styles.letterTitle} numberOfLines={2}>{letter.title}</Text>
          {letter.body ? (
            <Text style={styles.letterBodyText} numberOfLines={5}>{letter.body}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  noInnerPad: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0 },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 150,
  },

  // PWA: transparent static h2
  wallHeader: {
    paddingTop: 6,
    paddingBottom: 14,
  },
  wallTitle: {
    fontFamily: typography.serif,
    fontSize: 36,
    lineHeight: 37,
    fontWeight: '400',
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },

  // PWA: .add-card-toggle { min-height:96px; border-radius:24px; bg:rgba(255,250,240,.98) }
  addToggle: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 96,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: 'rgba(255, 250, 240, 0.98)',
    marginBottom: 12,
    ...shadows.card,
  },
  addTogglePressed: { transform: [{ scale: 0.99 }], opacity: 0.95 },
  addIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.moss,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPlus: {
    fontSize: 27,
    fontWeight: '600',
    color: colors.textOnPrimary,
    lineHeight: 32,
    textAlign: 'center',
    includeFontPadding: false,
  },
  addLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // PWA: .letter-list { gap: 12px }
  grid: { gap: 12 },

  // Shadow wrapper (shadow separate from overflow:hidden)
  letterCardShadow: {
    borderRadius: 24,
    ...shadows.soft,
  },
  // PWA: .letter-card.card { overflow:hidden; border-radius:24px; padding:16px; bg:rgba(251,247,239,.92) }
  letterCard: {
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: 'rgba(251, 247, 239, 0.92)',
  },

  // PWA: .delete-action { position:absolute; top:12px; right:12px; border-radius:999px }
  cardActions: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 6,
    zIndex: 2,
  },
  actionPill: {
    minHeight: 36,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 250, 240, 0.88)',
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // PWA: .delete-action { background:rgba(143,77,56,.92) }
  deletePill: {
    backgroundColor: 'rgba(143, 77, 56, 0.92)',
    borderColor: 'transparent',
  },

  // PWA: .letter-card { padding: 16px }
  letterBody: {
    padding: 16,
  },
  // PWA: .date-line { font-family:serif; font-size:1.12rem; font-style:italic; color:var(--brown) }
  dateLine: {
    fontFamily: typography.serif,
    fontSize: 18,
    fontStyle: 'italic',
    fontWeight: '500',
    color: colors.brown,
    lineHeight: 21,
    marginBottom: 6,
  },
  // PWA: h3 { font-size:1.35rem ≈ 22px; color:var(--moss-dark); line-height:1.12 }
  letterTitle: {
    fontFamily: typography.serif,
    fontSize: 22,
    lineHeight: 25,
    fontWeight: '400',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  // PWA: .letter-card p { color:var(--muted); line-height:1.6 }
  letterBodyText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 24,
  },

  // Modal
  modalSafe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
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
  // PWA: .letter-editor textarea { min-height: 190px }
  letterTextarea: { minHeight: 190 },
  inputWrap: { marginBottom: spacing.md },
});
