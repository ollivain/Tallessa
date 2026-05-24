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

export default function LettersScreen() {
  const { t } = useI18n();
  const { activeMemorial, addLetter } = useMemorials();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const letters = activeMemorial?.letters ?? [];

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
    addLetter(activeMemorial.id, {
      title: title.trim() || t('mock.letterTitle'),
      body: body.trim(),
      date: new Date().toISOString().slice(0, 10),
    });
    close();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title={t('letters.title')} subtitle={t('letters.subtitle')} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {letters.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="mail" size={28} color={colors.accent} />
            <Text style={styles.emptyText}>{t('letters.empty')}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {letters.map((l) => (
              <View key={l.id} style={styles.letterCard}>
                <Text style={styles.letterTitle}>{l.title}</Text>
                {l.body ? <Text style={styles.letterBody}>{l.body}</Text> : null}
                {l.date ? <Text style={styles.letterDate}>{l.date}</Text> : null}
              </View>
            ))}
          </View>
        )}

        <PrimaryButton
          label={t('letters.add')}
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
              <Text style={styles.modalTitle}>{t('letters.add')}</Text>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{t('mock.letterTitle')}</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  style={styles.input}
                  placeholder={t('mock.letterTitle')}
                  placeholderTextColor={colors.textSoft}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{t('mock.letterBody')}</Text>
                <TextInput
                  value={body}
                  onChangeText={setBody}
                  style={[styles.input, styles.multiline]}
                  placeholder={t('mock.letterBody')}
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
  empty: { alignItems: 'center', paddingVertical: 56, gap: 14 },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 22,
  },
  list: { gap: 14, marginBottom: 24 },
  letterCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  letterTitle: {
    fontSize: 17,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: 6,
  },
  letterBody: { fontSize: 14, color: colors.textMuted, lineHeight: 22 },
  letterDate: { fontSize: 12, color: colors.textSoft, marginTop: 10, letterSpacing: 0.5 },
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
  multiline: { minHeight: 160, textAlignVertical: 'top' },
});
