import { useState } from 'react';
import {
  Alert,
  Dimensions,
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

const { width: SCREEN_W } = Dimensions.get('window');
const CELL_SIZE = Math.floor((SCREEN_W - spacing.xl * 2 - 1) / 7);

// Parse "dd.mm.yyyy", "d.m.yyyy" or ISO "yyyy-mm-dd"
function parseAnyDate(str) {
  if (!str) return null;
  const s = String(str).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const m = s.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
  if (m) {
    return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  }
  return null;
}

function toDateKey(date) {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${mo}-${d}`;
}

function sameMonthDay(date, refDate) {
  return date.getMonth() === refDate.getMonth() && date.getDate() === refDate.getDate();
}

export default function CalendarScreen() {
  const { t, language } = useI18n();
  const { activeMemorial, addEvent, updateEvent, deleteEvent } = useMemorials();

  const [visibleMonth, setVisibleMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');

  const events = activeMemorial?.events ?? [];
  const sortedEvents = events.slice().sort((a, b) =>
    String(a.date).localeCompare(String(b.date)),
  );

  // Memorial's death date (recurring annual marker)
  const deathDate = parseAnyDate(activeMemorial?.death);

  // Calendar grid data
  const gridCells = buildGridCells(visibleMonth, events, deathDate);

  const goPrev = () =>
    setVisibleMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const goNext = () =>
    setVisibleMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  const openAdd = () => {
    setEditingId(null);
    setName('');
    setDate('');
    setOpen(true);
  };

  const openEdit = (ev) => {
    setEditingId(ev.id);
    setName(ev.name ?? '');
    setDate(ev.date ?? '');
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setName('');
    setDate('');
    setEditingId(null);
  };

  const save = () => {
    const trimmedName = name.trim();
    if (!trimmedName) { close(); return; }

    if (editingId) {
      updateEvent(activeMemorial.id, editingId, { name: trimmedName, date: date.trim() });
    } else {
      addEvent(activeMemorial.id, { name: trimmedName, date: date.trim() });
    }
    close();
  };

  const confirmDelete = (ev) => {
    Alert.alert(
      t('delete.eventTitle'),
      t('delete.eventBody'),
      [
        { text: t('delete.cancel'), style: 'cancel' },
        {
          text: t('delete.confirm'),
          style: 'destructive',
          onPress: () => deleteEvent(activeMemorial.id, ev.id),
        },
      ],
    );
  };

  const monthLabel = visibleMonth.toLocaleString(
    language === 'fi' ? 'fi-FI' : 'en-GB',
    { month: 'long', year: 'numeric' },
  );

  const weekdays = t('calendar.weekdays');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title={t('calendar.title')} subtitle={t('calendar.subtitle')} />

      <ScrollView
        contentContainerStyle={screenStyles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Month navigator */}
        <AppCard variant="soft" style={styles.calCard}>
          <View style={styles.monthNav}>
            <Pressable onPress={goPrev} hitSlop={12} style={styles.navBtn}>
              <Text style={styles.navArrow}>{t('calendar.prev')}</Text>
            </Pressable>
            <Text style={styles.monthLabel}>{capitalize(monthLabel)}</Text>
            <Pressable onPress={goNext} hitSlop={12} style={styles.navBtn}>
              <Text style={styles.navArrow}>{t('calendar.next')}</Text>
            </Pressable>
          </View>

          {/* Weekday headers */}
          <View style={styles.weekRow}>
            {weekdays.map((wd, i) => (
              <Text key={i} style={styles.weekday}>{wd}</Text>
            ))}
          </View>

          {/* Day grid */}
          <View style={styles.grid}>
            {gridCells.map((cell, i) => (
              <DayCell key={i} cell={cell} />
            ))}
          </View>
        </AppCard>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.moss }]} />
            <Text style={styles.legendText}>
              {language === 'fi' ? 'Tänään' : 'Today'}
            </Text>
          </View>
          {deathDate ? (
            <View style={styles.legendItem}>
              <Text style={styles.legendHeart}>♡</Text>
              <Text style={styles.legendText}>
                {language === 'fi' ? 'Muistopäivä' : 'Memorial day'}
              </Text>
            </View>
          ) : null}
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.brown }]} />
            <Text style={styles.legendText}>
              {language === 'fi' ? 'Merkitty päivä' : 'Marked day'}
            </Text>
          </View>
        </View>

        {/* Events list */}
        <SectionLabel style={styles.sectionLabel}>{t('calendar.upcoming')}</SectionLabel>

        {sortedEvents.length === 0 ? (
          <EmptyStateCard eyebrow={t('calendar.title')} body={t('calendar.empty')} />
        ) : (
          <View style={styles.eventList}>
            {sortedEvents.map((ev) => (
              <EventCard
                key={ev.id}
                event={ev}
                language={language}
                onEdit={() => openEdit(ev)}
                onDelete={() => confirmDelete(ev)}
              />
            ))}
          </View>
        )}

        <AppButton label={t('calendar.add')} onPress={openAdd} style={styles.cta} />
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
                {editingId ? t('calendar.edit') : t('calendar.add')}
              </Text>
              <AppInput
                label={t('mock.eventName')}
                value={name}
                onChangeText={setName}
                placeholder={t('mock.eventName')}
                style={styles.inputWrap}
              />
              <AppInput
                label={t('creation.birth')}
                value={date}
                onChangeText={setDate}
                placeholder={t('creation.datePlaceholder')}
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

// ── Grid helpers ──────────────────────────────────────────────────────────────

function buildGridCells(visibleMonth, events, deathDate) {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const today = new Date();
  const todayKey = toDateKey(today);

  // Grid starts on Monday: offset 0 = Mon, 6 = Sun
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Mon-based
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const key = toDateKey(d);
    const inMonth = d.getMonth() === month;
    const isToday = key === todayKey;
    const isMemorial = deathDate ? sameMonthDay(d, deathDate) : false;
    const hasEvent = events.some((ev) => {
      const pd = parseAnyDate(ev.date);
      return pd && toDateKey(pd) === key;
    });
    return { date: d, day: d.getDate(), inMonth, isToday, isMemorial, hasEvent };
  });
}

function DayCell({ cell }) {
  const { day, inMonth, isToday, isMemorial, hasEvent } = cell;
  return (
    <View style={[styles.cell, !inMonth && styles.cellMuted]}>
      <View style={[
        styles.cellInner,
        isToday && styles.cellToday,
        isMemorial && !isToday && styles.cellMemorial,
      ]}>
        <Text style={[
          styles.cellText,
          !inMonth && styles.cellTextMuted,
          isToday && styles.cellTextToday,
          isMemorial && !isToday && styles.cellTextMemorial,
        ]}>
          {isMemorial && !isToday ? '♡' : day}
        </Text>
      </View>
      {hasEvent && !isMemorial ? (
        <View style={styles.eventDot} />
      ) : null}
    </View>
  );
}

// ── Event card ────────────────────────────────────────────────────────────────

function EventCard({ event, language, onEdit, onDelete }) {
  const day = formatDay(event.date);
  const month = formatMonth(event.date, language);

  return (
    <AppCard variant="soft" style={styles.eventCard}>
      <View style={styles.cardActions}>
        <Pressable onPress={onEdit} hitSlop={8} style={styles.cardActionBtn}>
          <Feather name="edit-2" size={14} color={colors.moss} />
        </Pressable>
        <Pressable onPress={onDelete} hitSlop={8} style={styles.cardActionBtn}>
          <Feather name="trash-2" size={14} color={colors.danger} />
        </Pressable>
      </View>

      <View style={styles.eventRow}>
        <View style={styles.dateBlock}>
          <Text style={styles.dateDay}>{day}</Text>
          {month ? <Text style={styles.dateMonth}>{month}</Text> : null}
        </View>
        <View style={styles.dateSep} />
        <View style={styles.eventBody}>
          <Text style={styles.eventName}>{event.name}</Text>
          {event.date ? (
            <SectionLabel variant="pill" style={styles.datePill}>{event.date}</SectionLabel>
          ) : null}
        </View>
        <Feather name="calendar" size={18} color={colors.brown} style={styles.calIcon} />
      </View>
    </AppCard>
  );
}

function formatDay(iso) {
  if (!iso) return '·';
  const d = parseAnyDate(iso);
  if (!d) return iso.split(/[-.]/).pop() ?? '·';
  return String(d.getDate());
}

function formatMonth(iso, language) {
  if (!iso) return '';
  const d = parseAnyDate(iso);
  if (!d || Number.isNaN(d.getTime())) return '';
  try {
    return d.toLocaleString(language === 'fi' ? 'fi-FI' : 'en-GB', { month: 'short' });
  } catch {
    return '';
  }
}

function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },

  // Calendar card
  calCard: { marginBottom: spacing.xs, paddingHorizontal: spacing.sm },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  navBtn: {
    padding: spacing.xs,
    minWidth: 40,
    alignItems: 'center',
  },
  navArrow: {
    fontSize: 24,
    color: colors.moss,
    fontWeight: '600',
  },
  monthLabel: {
    fontFamily: typography.serif,
    fontSize: typography.sizes.bodyLarge,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
    letterSpacing: 0.3,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekday: {
    width: CELL_SIZE,
    textAlign: 'center',
    fontSize: 10,
    color: colors.textSoft,
    letterSpacing: 0.6,
    fontWeight: '700',
    textTransform: 'uppercase',
    paddingVertical: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellMuted: { opacity: 0.3 },
  cellInner: {
    width: CELL_SIZE - 4,
    height: CELL_SIZE - 4,
    borderRadius: (CELL_SIZE - 4) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellToday: { backgroundColor: colors.moss },
  cellMemorial: { backgroundColor: 'rgba(154, 118, 87, 0.15)' },
  cellText: {
    fontSize: 13,
    color: colors.textBody,
    fontWeight: '400',
  },
  cellTextMuted: { color: colors.textSoft },
  cellTextToday: { color: colors.textOnPrimary, fontWeight: '700' },
  cellTextMemorial: { color: colors.brown, fontWeight: '600', fontSize: 15 },
  eventDot: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.brown,
  },

  // Legend
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendHeart: { fontSize: 12, color: colors.brown },
  legendText: { fontSize: 11, color: colors.textMuted, letterSpacing: 0.3 },

  // Event list
  sectionLabel: { marginBottom: spacing.sm },
  eventList: { gap: spacing.sm, marginBottom: spacing.lg },
  eventCard: { marginBottom: 0 },
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
  eventRow: { flexDirection: 'row', alignItems: 'center' },
  dateBlock: { width: 46, alignItems: 'center', paddingRight: spacing.sm },
  dateDay: {
    fontFamily: typography.serif,
    fontSize: 26,
    color: colors.textPrimary,
    lineHeight: 30,
  },
  dateMonth: {
    fontSize: typography.sizes.eyebrow,
    color: colors.textMuted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  dateSep: { width: 1, height: 40, backgroundColor: colors.divider, marginRight: spacing.sm },
  eventBody: { flex: 1 },
  eventName: {
    fontSize: typography.sizes.bodyLarge,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
    marginBottom: 6,
  },
  datePill: { alignSelf: 'flex-start' },
  calIcon: { marginLeft: spacing.xs, opacity: 0.6 },
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
