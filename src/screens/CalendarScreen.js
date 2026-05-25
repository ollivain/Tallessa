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
  shadows,
} from '../theme/designSystem';
import AppScreen from '../components/AppScreen';
import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import EmptyStateCard from '../components/EmptyStateCard';

const SCREEN_BG = require('../../assets/bg-kalenteri.png');

const { width: SCREEN_W } = Dimensions.get('window');
// PWA: .calendar-grid { gap: 6px } with calendar-card padding 14 and screen padding 16
const CELL_GAP = 6;
const CELL_SIZE = Math.floor((SCREEN_W - spacing.md * 2 - 14 * 2 - CELL_GAP * 6) / 7);

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

  const deathDate = parseAnyDate(activeMemorial?.death);
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
    <AppScreen scroll={false} background={SCREEN_BG} contentStyle={styles.noInnerPad}>
      {/* PWA: topbar is position:static, scrolls with content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* PWA: transparent h2 header */}
        <View style={styles.wallHeader}>
          <Text style={styles.wallTitle}>{t('calendar.title')}</Text>
        </View>

        {/* PWA: .calendar-card.card — padding:14, gap:14 */}
        <View style={styles.calCardShadow}>
          <View style={styles.calCard}>

            {/* PWA: .calendar-controls — 52px nav + center (eyebrow+h3) + 52px nav */}
            <View style={styles.monthNav}>
              <Pressable
                onPress={goPrev}
                hitSlop={8}
                style={({ pressed }) => [styles.navBtn, pressed && styles.navBtnPressed]}
              >
                <Text style={styles.navArrow}>{t('calendar.prev')}</Text>
              </Pressable>
              <View style={styles.monthCenter}>
                <Text style={styles.monthEyebrow}>{t('calendar.eyebrow')}</Text>
                <Text style={styles.monthLabel}>{capitalize(monthLabel)}</Text>
              </View>
              <Pressable
                onPress={goNext}
                hitSlop={8}
                style={({ pressed }) => [styles.navBtn, pressed && styles.navBtnPressed]}
              >
                <Text style={styles.navArrow}>{t('calendar.next')}</Text>
              </Pressable>
            </View>

            {/* PWA: .weekdays — 7-col grid, gap:6, muted text */}
            <View style={styles.weekRow}>
              {weekdays.map((wd, i) => (
                <View key={i} style={styles.weekCell}>
                  <Text style={styles.weekday}>{wd}</Text>
                </View>
              ))}
            </View>

            {/* PWA: .calendar-grid — 7-col grid, gap:6 */}
            <View style={styles.calGrid}>
              {gridCells.map((cell, i) => (
                <DayCell key={i} cell={cell} />
              ))}
            </View>
          </View>
        </View>

        {/* PWA: .add-card-toggle after calendar card */}
        <Pressable
          onPress={openAdd}
          style={({ pressed }) => [styles.addToggle, pressed && styles.addTogglePressed]}
          accessibilityRole="button"
        >
          <View style={styles.addIcon}>
            <Text style={styles.addPlus}>+</Text>
          </View>
          <Text style={styles.addLabel}>{t('calendar.add')}</Text>
        </Pressable>

        {/* PWA: .day-list — grid gap:12 */}
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
    </AppScreen>
  );
}

// ── Grid helpers ──────────────────────────────────────────────────────────────

function buildGridCells(visibleMonth, events, deathDate) {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const today = new Date();
  const todayKey = toDateKey(today);

  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
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

// PWA: .day-cell { min-height:44px; border-radius:13px; bg:rgba(255,250,240,0.82) }
function DayCell({ cell }) {
  const { day, inMonth, isToday, isMemorial, hasEvent } = cell;
  return (
    <View style={[
      styles.cell,
      isToday && styles.cellToday,
      isMemorial && styles.cellMemorial,
      !inMonth && styles.cellMuted,
    ]}>
      <Text style={[
        styles.cellText,
        isMemorial && styles.cellTextMemorial,
      ]}>
        {isMemorial && !isToday ? '♡' : day}
      </Text>
      {/* PWA: .has-note::after — event dot indicator */}
      {hasEvent && !isMemorial ? (
        <View style={styles.eventDot} />
      ) : null}
    </View>
  );
}

// PWA: .day-card.card — grid auto 1fr gap:12, padding:16, .day-symbol 38px circle
function EventCard({ event, language, onEdit, onDelete }) {
  const day = formatDay(event.date);
  const month = formatMonth(event.date, language);
  const dateLabel = day !== '·' ? `${day}${month ? '. ' + month : ''}` : null;

  return (
    <View style={styles.eventCardShadow}>
      <View style={styles.eventCard}>
        {/* PWA: .delete-action absolute top:12 right:12 */}
        <View style={styles.cardActions}>
          <Pressable onPress={onEdit} hitSlop={8} style={styles.actionPill}>
            <Feather name="edit-2" size={12} color={colors.moss} />
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={8} style={[styles.actionPill, styles.deletePill]}>
            <Feather name="trash-2" size={12} color="#fffaf0" />
          </Pressable>
        </View>

        {/* PWA: .day-card grid: auto 1fr, gap:12 */}
        <View style={styles.eventRow}>
          {/* PWA: .day-symbol { width:38; height:38; border-radius:50%; bg:var(--moss) } */}
          <View style={styles.daySymbol}>
            <Text style={styles.daySymbolText}>♡</Text>
          </View>
          <View style={styles.eventBody}>
            {/* PWA: .date-line { brown serif italic } */}
            {dateLabel ? (
              <Text style={styles.dateLine}>{dateLabel}</Text>
            ) : null}
            {/* PWA: h3 { font-size:1.35rem; color:var(--moss-dark) } */}
            <Text style={styles.eventName} numberOfLines={2}>{event.name}</Text>
          </View>
        </View>
      </View>
    </View>
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
  noInnerPad: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0 },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 150,
  },

  // PWA: transparent static h2
  wallHeader: { paddingTop: 6, paddingBottom: 14 },
  wallTitle: {
    fontFamily: typography.serif,
    fontSize: 36,
    lineHeight: 37,
    fontWeight: '400',
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },

  // PWA: .calendar-card.card { padding:14; gap:14; border-radius:24 }
  calCardShadow: {
    borderRadius: 24,
    marginBottom: 12,
    ...shadows.soft,
  },
  calCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: 'rgba(255, 250, 240, 0.98)',
    padding: 14,
    gap: 14,
  },

  // PWA: .calendar-controls { grid-template-columns: 52px 1fr 52px; gap:10 }
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  // PWA: .icon-button { width:52; min-height:52; border-radius:17; bg:var(--moss); color:#fffaf0; font-size:1.9rem }
  navBtn: {
    width: 52,
    minHeight: 52,
    borderRadius: 17,
    backgroundColor: colors.moss,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnPressed: { opacity: 0.8 },
  navArrow: {
    fontSize: 30,
    color: '#fffaf0',
    fontWeight: '400',
    lineHeight: 36,
    textAlign: 'center',
    includeFontPadding: false,
  },
  monthCenter: {
    flex: 1,
    alignItems: 'center',
  },
  // PWA: .eyebrow { font-size:0.72rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--brown) }
  monthEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.brown,
    marginBottom: 2,
  },
  // PWA: h3 { font-size:1.35rem≈22px; color:var(--moss-dark); line-height:1.12 }
  monthLabel: {
    fontFamily: typography.serif,
    fontSize: 22,
    lineHeight: 25,
    fontWeight: '400',
    color: colors.textPrimary,
    textAlign: 'center',
  },

  // PWA: .weekdays { gap:6px; grid 7-col }
  weekRow: {
    flexDirection: 'row',
    gap: CELL_GAP,
  },
  weekCell: {
    width: CELL_SIZE,
    alignItems: 'center',
  },
  // PWA: .weekdays span { color:var(--muted); font-size:0.72rem; font-weight:700; text-align:center }
  weekday: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '700',
    textAlign: 'center',
  },

  // PWA: .calendar-grid { gap:6px; grid 7-col }
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CELL_GAP,
  },
  // PWA: .day-cell { min-height:44px; border-radius:13px; bg:rgba(255,250,240,0.82); font-size:0.86rem }
  cell: {
    width: CELL_SIZE,
    minHeight: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 250, 240, 0.82)',
    position: 'relative',
  },
  // PWA: .day-cell.is-muted { opacity:0.34 }
  cellMuted: { opacity: 0.34 },
  // PWA: .day-cell.is-today { outline:1px solid rgba(88,98,68,0.34) } — subtle border, no bg
  cellToday: {
    borderWidth: 1,
    borderColor: 'rgba(88, 98, 68, 0.34)',
  },
  // PWA: .day-cell.is-memorial { bg:var(--moss); color:#fffaf0; box-shadow:0 10px 22px rgba(88,98,68,0.22) }
  cellMemorial: {
    backgroundColor: colors.moss,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(88, 98, 68, 1)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  cellText: {
    fontSize: 14,
    color: colors.textBody,
    fontWeight: '400',
  },
  // PWA: .day-cell.is-memorial { color:#fffaf0 }
  cellTextMemorial: {
    color: '#fffaf0',
    fontWeight: '600',
  },
  // PWA: .day-cell.has-note::after — brown dot indicator
  eventDot: {
    position: 'absolute',
    bottom: 4,
    right: 6,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.brown,
  },

  // PWA: .add-card-toggle (same as wall/letters screens)
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

  // PWA: .day-list { gap:12px }
  eventList: { gap: 12 },

  // Shadow wrapper (shadow separate from overflow:hidden)
  eventCardShadow: {
    borderRadius: 24,
    ...shadows.soft,
  },
  // PWA: .day-card.card { overflow:hidden; border-radius:24px; padding:16; border:1px var(--line) }
  eventCard: {
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: 'rgba(255, 250, 240, 0.98)',
    padding: 16,
  },
  // PWA: .delete-action { position:absolute; top:12; right:12; border-radius:999 }
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
  deletePill: {
    backgroundColor: 'rgba(143, 77, 56, 0.92)',
    borderColor: 'transparent',
  },
  // PWA: .day-card { display:grid; grid-template-columns:auto 1fr; gap:12 }
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  // PWA: .day-symbol { width:38; height:38; border-radius:50%; bg:var(--moss); color:#fffaf0 }
  daySymbol: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.moss,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  daySymbolText: {
    fontSize: 16,
    color: '#fffaf0',
    lineHeight: 20,
    textAlign: 'center',
  },
  eventBody: { flex: 1, paddingRight: 60 },
  // PWA: .date-line { brown serif italic 18px }
  dateLine: {
    fontFamily: typography.serif,
    fontSize: 18,
    fontStyle: 'italic',
    fontWeight: '500',
    color: colors.brown,
    lineHeight: 21,
    marginBottom: 4,
  },
  // PWA: h3 { font-size:1.35rem≈22px; color:var(--moss-dark) }
  eventName: {
    fontFamily: typography.serif,
    fontSize: 22,
    lineHeight: 25,
    fontWeight: '400',
    color: colors.textPrimary,
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
  inputWrap: { marginBottom: spacing.md },
});
