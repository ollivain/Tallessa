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

export default function CalendarScreen() {
  const { t, language } = useI18n();
  const { activeMemorial, addEvent } = useMemorials();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');

  const events = (activeMemorial?.events ?? [])
    .slice()
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  const close = () => {
    setOpen(false);
    setName('');
    setDate('');
  };

  const save = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      close();
      return;
    }
    addEvent(activeMemorial.id, {
      name: trimmedName,
      date: date.trim(),
    });
    close();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title={t('calendar.title')} subtitle={t('calendar.subtitle')} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.eyebrow}>{t('calendar.upcoming')}</Text>

        {events.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="calendar" size={28} color={colors.accent} />
            <Text style={styles.emptyText}>{t('calendar.empty')}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {events.map((ev) => (
              <View key={ev.id} style={styles.eventCard}>
                <View style={styles.dateBlock}>
                  <Text style={styles.dateDay}>{formatDay(ev.date)}</Text>
                  <Text style={styles.dateMonth}>{formatMonth(ev.date, language)}</Text>
                </View>
                <View style={styles.eventBody}>
                  <Text style={styles.eventName}>{ev.name}</Text>
                  {ev.date ? <Text style={styles.eventDate}>{ev.date}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        )}

        <PrimaryButton
          label={t('calendar.add')}
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
              <Text style={styles.modalTitle}>{t('calendar.add')}</Text>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{t('mock.eventName')}</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                  placeholder={t('mock.eventName')}
                  placeholderTextColor={colors.textSoft}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{t('creation.birth')}</Text>
                <TextInput
                  value={date}
                  onChangeText={setDate}
                  style={styles.input}
                  placeholder={t('creation.datePlaceholder')}
                  placeholderTextColor={colors.textSoft}
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

function formatDay(iso) {
  if (!iso) return '·';
  const parts = String(iso).split('-');
  return parts[2] ?? parts[0] ?? '·';
}

function formatMonth(iso, language) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  try {
    return date.toLocaleString(language === 'fi' ? 'fi-FI' : 'en-GB', { month: 'short' });
  } catch {
    return '';
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 48 },
  eyebrow: {
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  empty: { alignItems: 'center', paddingVertical: 56, gap: 14 },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 22,
  },
  list: { gap: 12, marginBottom: 24 },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
  },
  dateBlock: {
    width: 56,
    alignItems: 'center',
    marginRight: 14,
    paddingVertical: 4,
    borderRightWidth: 1,
    borderRightColor: colors.divider,
  },
  dateDay: { fontSize: 22, color: colors.textPrimary, fontWeight: '400' },
  dateMonth: {
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  eventBody: { flex: 1 },
  eventName: { fontSize: 16, color: colors.textPrimary, fontWeight: '500' },
  eventDate: { fontSize: 12, color: colors.textSoft, marginTop: 4, letterSpacing: 0.5 },
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
});
