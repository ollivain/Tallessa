import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
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
import { useI18n } from '../i18n';
import { useMemorials } from '../state/MemorialContext';
import { colors } from '../theme/colors';
import ScreenHeader from '../components/ScreenHeader';
import PrimaryButton from '../components/PrimaryButton';

export default function MemoryWallScreen() {
  const { t } = useI18n();
  const { activeMemorial, addMemory } = useMemorials();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const memories = activeMemorial?.memories ?? [];

  const close = () => {
    setOpen(false);
    setTitle('');
    setBody('');
  };

  const save = () => {
    if (!title.trim() && !body.trim()) {
      close();
      return;
    }
    addMemory(activeMemorial.id, {
      title: title.trim(),
      body: body.trim(),
      date: new Date().toISOString().slice(0, 10),
    });
    close();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title={t('wall.title')} subtitle={t('wall.subtitle')} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {memories.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="image" size={28} color={colors.accent} />
            <Text style={styles.emptyText}>{t('wall.empty')}</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {memories.map((m) => (
              <View key={m.id} style={styles.memoryCard}>
                <View style={styles.thumbPlaceholder}>
                  <Feather name="image" size={20} color={colors.accent} />
                </View>
                <Text style={styles.memoryTitle}>{m.title || t('mock.memoryTitle')}</Text>
                {m.body ? <Text style={styles.memoryBody}>{m.body}</Text> : null}
                {m.date ? <Text style={styles.memoryDate}>{m.date}</Text> : null}
              </View>
            ))}
          </View>
        )}

        <PrimaryButton
          label={t('wall.add')}
          onPress={() => setOpen(true)}
          style={styles.cta}
        />
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
              <Text style={styles.modalTitle}>{t('wall.add')}</Text>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{t('mock.memoryTitle')}</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  style={styles.input}
                  placeholder={t('mock.memoryTitle')}
                  placeholderTextColor={colors.textSoft}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{t('mock.memoryBody')}</Text>
                <TextInput
                  value={body}
                  onChangeText={setBody}
                  style={[styles.input, styles.multiline]}
                  placeholder={t('mock.memoryBody')}
                  placeholderTextColor={colors.textSoft}
                  multiline
                />
              </View>
              <PrimaryButton label={t('creation.save')} onPress={save} />
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
  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 48 },
  empty: {
    alignItems: 'center',
    paddingVertical: 56,
    gap: 14,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 22,
  },
  grid: { gap: 14, marginBottom: 24 },
  memoryCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  thumbPlaceholder: {
    height: 96,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  memoryTitle: { fontSize: 16, color: colors.textPrimary, fontWeight: '500' },
  memoryBody: { fontSize: 14, color: colors.textMuted, lineHeight: 22, marginTop: 6 },
  memoryDate: { fontSize: 12, color: colors.textSoft, marginTop: 8, letterSpacing: 0.5 },
  cta: { marginTop: 8 },
  modalBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  iconBtn: { padding: 8 },
  modalScroll: { paddingHorizontal: 24, paddingBottom: 48 },
  modalTitle: {
    fontSize: 24,
    fontWeight: '300',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  field: { marginBottom: 16 },
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
  multiline: { minHeight: 120, textAlignVertical: 'top' },
});
