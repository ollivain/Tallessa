import { useState } from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useI18n } from '../i18n';
import { useMemorials } from '../state/MemorialContext';
import {
  colors,
  radii,
  shadows,
  spacing,
  typography,
} from '../theme/designSystem';
import AppScreen from '../components/AppScreen';
import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import EmptyStateCard from '../components/EmptyStateCard';
import PositionedImage from '../components/PositionedImage';
import { resolveCardAspectRatio } from '../lib/imageAspectRatio';
import ImageControls from '../components/ImageControls';
import ImageCropAspectPicker, { DEFAULT_CROP_VALUE } from '../components/ImageCropAspectPicker';
import { pickImageFromLibrary, removePersistedMedia } from '../lib/media';
import { useTheme } from '../state/ThemeContext';
import {
  capitalize,
  monthName,
  parseDate,
  parseDateInput,
  toDateKey,
  toPossessive,
  getImportantDays,
  getMemorialDate,
  getMonthPhotosArray,
} from '../models/memorial';
import {
  sortImportantDaysForVisibleMonth,
  sortMemoriesForVisibleMonth,
} from '../lib/calendar';

const SCREEN_BG = require('../../assets/bg-kalenteri.png');
// Fallback cover used until the user picks a month image — matches the PWA
// `.month-cover` default `background-image` (Unsplash kept locally on web).
const DEFAULT_COVER = require('../../assets/memorial-day-sunny-field.jpg');

const { width: SCREEN_W } = Dimensions.get('window');
const CELL_GAP = 6;
const CELL_SIZE = Math.floor((SCREEN_W - spacing.md * 2 - 14 * 2 - CELL_GAP * 6) / 7);
const SYMBOL_OPTIONS = [
  { value: '♡', labelKey: 'calendar.form.symbolHeart' },
  { value: '✦', labelKey: 'calendar.form.symbolStar' },
  { value: '♢', labelKey: 'calendar.form.symbolMemory' },
  { value: '\u{1F56F}', labelKey: 'calendar.form.symbolCandle' },
];
const DEFAULT_SYMBOL = SYMBOL_OPTIONS[0].value;

function sameMonthDay(date, refDate) {
  return date.getMonth() === refDate.getMonth() && date.getDate() === refDate.getDate();
}

// PWA Calendar mirrors styles.css `.screen[data-screen="calendar"]`:
//   transparent topbar (h2)
//   → .calendar-card.card  (cover image, prev/next nav, weekdays, day grid)
//   → .add-card-toggle / .form-card (inline form for memorial days)
//   → .day-list  (sorted: visible month first, then everything else)
export default function CalendarScreen() {
  const { t, language } = useI18n();
  const { activeMemorial, addEvent, deleteEvent, updateMemorial } = useMemorials();
  const { themeColors } = useTheme();

  const [visibleMonth, setVisibleMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [note, setNote] = useState('');

  // PWA parity: cover-image edit pills hidden until the user taps the image.
  const [coverControlsVisible, setCoverControlsVisible] = useState(false);
  const [cropTarget, setCropTarget] = useState(null);

  const events = getImportantDays(activeMemorial);
  const memories = activeMemorial?.memories ?? [];
  const deathDate = parseDate(getMemorialDate(activeMemorial));
  const gridCells = buildGridCells(visibleMonth, events, deathDate, memories);
  // PWA parity: the `.day-list` shows *every* important day all the time,
  // with the visible month's entries bubbled to the top. The memorial day
  // (death anniversary) is part of the same list, so we include it in the
  // input and let the helper handle ordering — instead of hard-filtering it
  // away when the calendar is on a different month.
  const memorialDayCard = buildMemorialDayCard(activeMemorial, t);
  const allImportantDays = memorialDayCard ? [memorialDayCard, ...events] : events;
  const sortedEvents     = sortImportantDaysForVisibleMonth(allImportantDays, visibleMonth);
  const calendarMemories = sortMemoriesForVisibleMonth(memories, visibleMonth);
  const visibleCards     = sortedEvents;

  const calendarImages = getMonthPhotosArray(activeMemorial);
  const coverImageUri = calendarImages[visibleMonth.getMonth()] ?? null;
  const monthKey = String(visibleMonth.getMonth() + 1);
  const paddedMonthKey = monthKey.padStart(2, '0');
  const coverImagePosition =
    activeMemorial?.monthPhotoPositions?.[monthKey] ??
    activeMemorial?.monthPhotoPositions?.[paddedMonthKey];

  const goPrev = () => {
    setCoverControlsVisible(false);
    setVisibleMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  };
  const goNext = () => {
    setCoverControlsVisible(false);
    setVisibleMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  };

  const openAdd = () => {
    setName('');
    setDate('');
    setSymbol(DEFAULT_SYMBOL);
    setNote('');
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    setName('');
    setDate('');
    setSymbol(DEFAULT_SYMBOL);
    setNote('');
  };

  const save = () => {
    const trimmedName = name.trim();
    const trimmedDate = parseDateInput(date);
    if (!trimmedName || !trimmedDate) {
      Alert.alert(t('calendar.add'), t('calendar.form.required'));
      return;
    }
    const payload = { name: trimmedName, date: trimmedDate, note: note.trim(), symbol: symbol || DEFAULT_SYMBOL };
    addEvent(activeMemorial.id, payload);
    close();
  };

  const confirmDelete = (ev) => {
    Alert.alert(
      t('delete.eventTitle'),
      t('delete.eventBody'),
      [
        { text: t('delete.cancel'), style: 'cancel' },
        { text: t('delete.confirm'), style: 'destructive', onPress: () => deleteEvent(activeMemorial.id, ev.id) },
      ],
    );
  };

  const monthLabel = visibleMonth.toLocaleString(language === 'fi' ? 'fi-FI' : 'en-GB', { month: 'long', year: 'numeric' });
  const weekdays = t('calendar.weekdays');

  // ── Month cover image: change / edit crop / remove ────────────────────
  const openCropPicker = ({ uri, current, apply }) => {
    setCropTarget({
      uri,
      current,
      apply,
      replace: async () => {
        const replaced = await pickImageFromLibrary(t);
        if (replaced) setCropTarget((c) => c ? { ...c, uri: replaced.uri } : null);
      },
    });
  };

  const pickCover = async () => {
    if (!activeMemorial) return;
    const result = await pickImageFromLibrary(t);
    if (!result) return;
    const previousUri = coverImageUri;
    openCropPicker({
      uri: result.uri,
      current: previousUri === result.uri
        ? (coverImagePosition || DEFAULT_CROP_VALUE)
        : DEFAULT_CROP_VALUE,
      apply: (value) => {
        if (previousUri && previousUri !== result.uri) removePersistedMedia(previousUri);
        const monthPhotos = {
          ...(activeMemorial.monthPhotos || {}),
          [paddedMonthKey]: result.uri,
        };
        const monthPhotoPositions = {
          ...(activeMemorial.monthPhotoPositions || {}),
          [paddedMonthKey]: value,
        };
        updateMemorial(activeMemorial.id, { monthPhotos, monthPhotoPositions });
        setCropTarget(null);
      },
    });
  };

  const editCoverCrop = () => {
    if (!activeMemorial || !coverImageUri) return;
    openCropPicker({
      uri: coverImageUri,
      current: coverImagePosition || DEFAULT_CROP_VALUE,
      apply: (value) => {
        const monthPhotoPositions = {
          ...(activeMemorial.monthPhotoPositions || {}),
          [paddedMonthKey]: value,
        };
        updateMemorial(activeMemorial.id, { monthPhotoPositions });
        setCropTarget(null);
      },
    });
  };

  const removeCover = () => {
    if (!activeMemorial) return;
    if (coverImageUri) removePersistedMedia(coverImageUri);
    const monthPhotos = { ...(activeMemorial.monthPhotos || {}) };
    delete monthPhotos[paddedMonthKey];
    delete monthPhotos[monthKey];
    const monthPhotoPositions = { ...(activeMemorial.monthPhotoPositions || {}) };
    delete monthPhotoPositions[paddedMonthKey];
    delete monthPhotoPositions[monthKey];
    updateMemorial(activeMemorial.id, { monthPhotos, monthPhotoPositions });
  };

  return (
    <AppScreen scroll={false} background={SCREEN_BG} contentStyle={styles.noInnerPad}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.wallHeader}>
          <Text style={[styles.wallTitle, { color: themeColors.textPrimary }]}>{t('calendar.title')}</Text>
        </View>

        {/* PWA `.calendar-card.card { padding: 14; gap: 14; border-radius: 24 }` */}
        <View style={styles.calCardShadow}>
          <View style={[styles.calCard, { backgroundColor: themeColors.card, borderColor: themeColors.borderWarm }]}>
            {/* PWA `.month-cover { min-height: 165; border-radius: 18 }`.
                When metadata supplies an aspectRatio, the cover adopts that
                shape; otherwise the PWA 165-tall fallback is used. The
                default cover photo always uses the fallback height. */}
            {(() => {
              const coverAspect = coverImageUri
                ? resolveCardAspectRatio(coverImagePosition)
                : null;
              const coverAspectStyle = coverAspect
                ? { aspectRatio: coverAspect, height: undefined }
                : null;
              return (
            <Pressable
              onPress={() => setCoverControlsVisible((v) => !v)}
              accessibilityRole="button"
              style={styles.coverTap}
            >
              <PositionedImage
                uri={coverImageUri || undefined}
                source={coverImageUri ? undefined : DEFAULT_COVER}
                position={coverImagePosition}
                style={[styles.coverImage, coverAspectStyle]}
              />
              <ImageControls
                variant="floating"
                visible={coverControlsVisible}
                hasImage={!!coverImageUri}
                onPick={() => { setCoverControlsVisible(false); pickCover(); }}
                onEditCrop={() => { setCoverControlsVisible(false); editCoverCrop(); }}
                onRemove={() => { setCoverControlsVisible(false); removeCover(); }}
                pickLabel={coverImageUri ? t('creation.changePortrait') : t('creation.pickPortrait')}
                editLabel={t('imageCrop.edit')}
                removeLabel={t('creation.removePortrait')}
              />
            </Pressable>
              );
            })()}

            {/* PWA `.calendar-controls { grid: 52px 1fr 52px; gap: 10 }` */}
            <View style={styles.monthNav}>
              <Pressable onPress={goPrev} hitSlop={8} style={({ pressed }) => [styles.navBtn, { backgroundColor: themeColors.moss }, pressed && styles.navBtnPressed]}>
                <Text style={styles.navArrow}>{t('calendar.prev')}</Text>
              </Pressable>
              <View style={styles.monthCenter}>
                <Text style={[styles.monthEyebrow, { color: themeColors.brown }]}>{t('calendar.eyebrow')}</Text>
                <Text style={[styles.monthLabel, { color: themeColors.textPrimary }]}>{capitalize(monthLabel)}</Text>
              </View>
              <Pressable onPress={goNext} hitSlop={8} style={({ pressed }) => [styles.navBtn, { backgroundColor: themeColors.moss }, pressed && styles.navBtnPressed]}>
                <Text style={styles.navArrow}>{t('calendar.next')}</Text>
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {weekdays.map((wd, i) => (
                <View key={i} style={styles.weekCell}>
                  <Text style={styles.weekday}>{wd}</Text>
                </View>
              ))}
            </View>

            <View style={styles.calGrid}>
              {gridCells.map((cell, i) => (
                <DayCell key={i} cell={cell} />
              ))}
            </View>
          </View>
        </View>

        {!open ? (
          <Pressable
            onPress={openAdd}
            style={({ pressed }) => [styles.addToggle, { backgroundColor: themeColors.card, borderColor: themeColors.borderWarm }, pressed && styles.addTogglePressed]}
            accessibilityRole="button"
          >
            <View style={[styles.addIcon, { backgroundColor: themeColors.moss }]}>
              <Text style={styles.addPlus}>+</Text>
            </View>
            <Text style={[styles.addLabel, { color: themeColors.textPrimary }]}>{t('calendar.add')}</Text>
          </Pressable>
        ) : (
          // PWA `.form-card` inline (gap: 14, padding: 16)
          <View style={styles.formCardShadow}>
            <View style={[styles.formCard, { backgroundColor: themeColors.card, borderColor: themeColors.borderWarm }]}>
              <Pressable onPress={close} hitSlop={6} style={({ pressed }) => [styles.closeBtn, { backgroundColor: themeColors.surfaceWarm }, pressed && { opacity: 0.7 }]} accessibilityRole="button">
                <Text style={styles.closeBtnText}>×</Text>
              </Pressable>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>{t('calendar.form.name')}</Text>
                <AppInput value={name} onChangeText={setName} placeholder={t('calendar.form.namePlaceholder')} />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>{t('calendar.form.date')}</Text>
                <AppInput value={date} onChangeText={setDate} placeholder={t('creation.datePlaceholder')} />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>{t('calendar.form.symbol')}</Text>
                <View style={styles.symbolRow}>
                  {SYMBOL_OPTIONS.map((option) => {
                    const active = symbol === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => setSymbol(option.value)}
                        style={({ pressed }) => [
                          styles.symbolPill,
                          { backgroundColor: themeColors.overlayWarm },
                          active && { backgroundColor: themeColors.moss, borderColor: themeColors.moss },
                          pressed && styles.pressed,
                        ]}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.symbolText, active && styles.symbolTextActive]}>{option.value}</Text>
                        <Text style={[styles.symbolLabel, active && styles.symbolLabelActive]}>{t(option.labelKey)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>{t('calendar.form.text')}</Text>
                <AppInput value={note} onChangeText={setNote} placeholder={t('calendar.form.textPlaceholder')} multiline />
              </View>

              <AppButton label={t('calendar.form.save')} onPress={save} />
            </View>
          </View>
        )}

        {/* PWA `.day-list { gap: 12 }` — always shows all memories, sorted */}
        {visibleCards.length === 0 && calendarMemories.length === 0 ? (
          <EmptyStateCard eyebrow={t('calendar.title')} body={t('calendar.empty')} />
        ) : (
          <View style={styles.eventList}>
            {visibleCards.map((ev) => (
              <EventCard
                key={ev.id}
                event={ev}
                language={language}
                onDelete={ev.type === 'memorial-day' ? null : () => confirmDelete(ev)}
              />
            ))}
            {calendarMemories.map((memory) => (
              <MemoryDayCard key={memory.id} memory={memory} language={language} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Crop modal — same one used everywhere; preview = final card. */}
      <ImageCropAspectPicker
        visible={!!cropTarget}
        uri={cropTarget?.uri}
        initialValue={cropTarget?.current}
        onApply={cropTarget?.apply}
        onCancel={() => setCropTarget(null)}
        onReplace={cropTarget?.replace}
      />
    </AppScreen>
  );
}

function buildGridCells(visibleMonth, events, deathDate, memories) {
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
    const event = events.find((ev) => {
      const pd = parseDate(ev.date);
      return pd && toDateKey(pd) === key;
    });
    const hasMemory = memories.some((memory) => memory.calendarDate === key);
    return {
      date: d,
      day: d.getDate(),
      inMonth,
      isToday,
      isMemorial,
      hasEvent: Boolean(event) || hasMemory,
      symbol: event ? event.symbol || DEFAULT_SYMBOL : hasMemory ? DEFAULT_SYMBOL : '',
    };
  });
}

// PWA `.day-cell { min-height: 44; border-radius: 13; bg: rgba(255,250,240,0.82) }`
function DayCell({ cell }) {
  const { themeColors } = useTheme();
  const { day, inMonth, isToday, isMemorial, hasEvent, symbol } = cell;
  const marker = isMemorial ? DEFAULT_SYMBOL : symbol;
  return (
    <View style={[
      styles.cell,
      { backgroundColor: themeColors.overlayWarm },
      isToday && [styles.cellToday, { borderColor: `${themeColors.moss}55` }],
      isMemorial && [styles.cellMemorial, { backgroundColor: themeColors.moss }],
      !inMonth && styles.cellMuted,
    ]}>
      <Text style={[styles.cellText, isMemorial && styles.cellTextMemorial]}>
        {isMemorial && !isToday ? DEFAULT_SYMBOL : day}
      </Text>
      {hasEvent && !isMemorial ? (
        <Text style={[styles.eventMarker, { color: themeColors.brown }]}>{marker}</Text>
      ) : null}
      {isMemorial && marker ? (
        <Text style={[styles.eventMarker, { color: '#fffaf0' }]}>{marker}</Text>
      ) : null}
    </View>
  );
}

// PWA `.day-card.card { grid: auto 1fr; gap: 12; padding: 16 }`
function EventCard({ event, language, onDelete }) {
  const { themeColors } = useTheme();
  const day = formatDay(event.date);
  const month = formatMonth(event.date, language);
  const dateLabel = day !== '·' ? `${day}${month ? '. ' + month : ''}` : null;
  const body = event.note || event.description || event.text;

  return (
    <View style={styles.eventCardShadow}>
      <View style={[styles.eventCard, { backgroundColor: themeColors.card, borderColor: themeColors.borderWarm }]}>
        {onDelete ? (
          <View style={styles.cardActions}>
            <Pressable onPress={onDelete} hitSlop={8} style={[styles.actionPill, styles.deletePill]}>
              <Feather name="trash-2" size={12} color="#fffaf0" />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.eventRow}>
          <View style={[styles.daySymbol, { backgroundColor: themeColors.moss }]}>
            <Text style={styles.daySymbolText}>{event.symbol || DEFAULT_SYMBOL}</Text>
          </View>
          <View style={styles.eventBody}>
            {dateLabel ? (
              <Text style={[styles.dateLine, { color: themeColors.brown }]}>{dateLabel}</Text>
            ) : null}
            <Text style={[styles.eventName, { color: themeColors.textPrimary }]} numberOfLines={2}>{event.name}</Text>
            {body ? <Text style={styles.eventNote} numberOfLines={4}>{body}</Text> : null}
          </View>
        </View>
      </View>
    </View>
  );
}

function MemoryDayCard({ memory, language }) {
  const { t } = useI18n();
  const { themeColors } = useTheme();
  const day = formatDay(memory.calendarDate);
  const month = formatMonth(memory.calendarDate, language);
  const dateLabel = day !== '·' ? `${day}${month ? '. ' + month : ''}` : null;
  const body = memory.text || t('wall.memoryNoWords');

  return (
    <View style={styles.eventCardShadow}>
      <View style={[styles.eventCard, { backgroundColor: themeColors.card, borderColor: themeColors.borderWarm }]}>
        <View style={styles.eventRow}>
          <View style={[styles.daySymbol, { backgroundColor: themeColors.moss }]}>
            <Text style={styles.daySymbolText}>{DEFAULT_SYMBOL}</Text>
          </View>
          <View style={styles.eventBody}>
            {dateLabel ? (
              <Text style={[styles.dateLine, { color: themeColors.brown }]}>{dateLabel}</Text>
            ) : null}
            <Text style={[styles.eventName, { color: themeColors.textPrimary }]} numberOfLines={2}>
              {t('calendar.memoryHeading')}
            </Text>
            <Text style={styles.eventNote} numberOfLines={4}>{body}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function formatDay(iso) {
  if (!iso) return '·';
  const d = parseDate(iso);
  if (!d) return iso.split(/[-.]/).pop() ?? '·';
  return String(d.getDate());
}
function formatMonth(iso, language) {
  if (!iso) return '';
  const d = parseDate(iso);
  if (!d || Number.isNaN(d.getTime())) return '';
  return monthName(d.getMonth(), language, 'short');
}
// PWA parity: the memorial day (death anniversary) is just another entry in
// the same `.day-list` — always present, never filtered by visible month.
// `sortImportantDaysForVisibleMonth` handles the ordering, so we return the
// card itself unconditionally as long as a memorial date exists.
function buildMemorialDayCard(activeMemorial, t) {
  const memorialDate = getMemorialDate(activeMemorial);
  const parsed = parseDate(memorialDate);
  if (!parsed) return null;
  return {
    id: 'memorial-day',
    name: t('calendar.memorialDayName', {
      name: toPossessive(activeMemorial?.horseName || activeMemorial?.name || '', activeMemorial?.language),
    }),
    date: memorialDate,
    note: t('calendar.memorialRecurring'),
    symbol: DEFAULT_SYMBOL,
    type: 'memorial-day',
  };
}

const styles = StyleSheet.create({
  noInnerPad: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0 },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop:    spacing.sm,
    paddingBottom: 150,
  },

  wallHeader: { paddingTop: 6, paddingBottom: 14 },
  wallTitle: {
    fontFamily:    typography.serif,
    fontSize:      typography.sizes.h2,
    lineHeight:    typography.lineHeights.h2,
    fontWeight:    typography.weights.bold,
    color:         colors.textPrimary,
    letterSpacing: typography.letterSpacing.title,
  },

  // PWA `.month-cover { min-height: 165; border-radius: 18 }`
  coverImage: {
    width:        '100%',
    height:       165,
    borderRadius: radii.lg,
  },
  // Pressable wrapper for the month cover — hosts tap-to-toggle floating
  // ImageControls. `relative` so the controls can be absolutely positioned.
  // `maxHeight` + `overflow:hidden` prevent portrait images (e.g. 9:16) from
  // blowing the calendar card open when the user saved with `aspectRatio:'original'`.
  // PositionedImage's internal aspectStyle overrides any height on its own View,
  // so the cap must live on the *parent* with overflow:hidden.
  coverTap: {
    width:        '100%',
    position:     'relative',
    maxHeight:    280,
    overflow:     'hidden',
    borderRadius: radii.lg,
  },

  // PWA `.calendar-card.card { padding: 14; gap: 14; border-radius: 24 }`
  calCardShadow: { borderRadius: radii.card, marginBottom: 12, ...shadows.soft },
  calCard: {
    borderRadius:    radii.card,
    borderWidth:     1,
    borderColor:     colors.warmBorder,
    backgroundColor: 'rgba(255, 244, 222, 0.98)',
    padding:         14,
    gap:             14,
  },

  // PWA `.calendar-controls`
  monthNav: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  // PWA `.icon-button { width: 52; min-height: 52; border-radius: 17 }`
  navBtn: {
    width:           52,
    minHeight:       52,
    borderRadius:    radii.button,
    backgroundColor: colors.moss,
    alignItems:      'center',
    justifyContent:  'center',
  },
  navBtnPressed: { opacity: 0.8 },
  navArrow: {
    fontSize:   30,
    color:      '#fffaf0',
    fontWeight: typography.weights.regular,
    lineHeight: 36,
    textAlign:  'center',
    includeFontPadding: false,
  },
  monthCenter: { flex: 1, alignItems: 'center' },
  // PWA `.eyebrow { font-size: 0.72rem; font-weight: 700; uppercase }`
  monthEyebrow: {
    fontSize:       typography.sizes.eyebrow,
    fontWeight:     typography.weights.bold,
    letterSpacing:  typography.letterSpacing.eyebrow,
    textTransform:  'uppercase',
    color:          colors.brown,
    marginBottom:   2,
  },
  // PWA `h3 { font-size: 1.35rem; color: var(--moss-dark) }`
  monthLabel: {
    fontFamily: typography.serif,
    fontSize:   typography.sizes.title,
    lineHeight: typography.lineHeights.title,
    fontWeight: typography.weights.regular,
    color:      colors.textPrimary,
    textAlign:  'center',
  },

  weekRow: { flexDirection: 'row', gap: CELL_GAP },
  weekCell: { width: CELL_SIZE, alignItems: 'center' },
  // PWA `.weekdays span { color: var(--muted); font-size: 0.72rem }`
  weekday: {
    fontSize:   typography.sizes.eyebrow,
    color:      colors.textMuted,
    fontWeight: typography.weights.bold,
    textAlign:  'center',
  },

  calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: CELL_GAP },
  // PWA `.day-cell { min-height: 44; border-radius: 13; bg: rgba(255,250,240,0.82) }`
  cell: {
    width:           CELL_SIZE,
    minHeight:       44,
    borderRadius:    radii.dayCell,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: 'rgba(255, 244, 222, 0.86)',
    position:        'relative',
  },
  cellMuted: { opacity: 0.34 },
  cellToday: { borderWidth: 1, borderColor: 'rgba(88, 98, 68, 0.34)' },
  cellMemorial: {
    backgroundColor: colors.moss,
    ...Platform.select({
      ios: {
        shadowColor:   'rgba(88, 98, 68, 1)',
        shadowOffset:  { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius:  8,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  cellText: {
    fontSize:   14,
    color:      colors.textBody,
    fontWeight: typography.weights.regular,
  },
  cellTextMemorial: { color: '#fffaf0', fontWeight: typography.weights.semibold },
  eventMarker: { position: 'absolute', bottom: 4, right: 6, fontSize: 11, lineHeight: 13 },

  // PWA `.add-card-toggle` and inline form
  addToggle: {
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
    minHeight:      96,
    borderRadius:   radii.card,
    borderWidth:    1,
    borderColor:    colors.warmBorder,
    backgroundColor: 'rgba(255, 244, 222, 0.98)',
    marginBottom:   12,
    ...shadows.card,
  },
  addTogglePressed: { transform: [{ scale: 0.99 }], opacity: 0.95 },
  addIcon: {
    width:           42,
    height:          42,
    borderRadius:    21,
    backgroundColor: colors.moss,
    alignItems:      'center',
    justifyContent:  'center',
  },
  addPlus: {
    fontSize:   27,
    fontWeight: typography.weights.semibold,
    color:      colors.textOnPrimary,
    lineHeight: 32,
    textAlign:  'center',
    includeFontPadding: false,
  },
  addLabel: {
    fontSize:   15,
    fontWeight: typography.weights.bold,
    color:      colors.textPrimary,
  },

  formCardShadow: { borderRadius: radii.card, marginBottom: 12, ...shadows.soft },
  formCard: {
    position:        'relative',
    borderRadius:    radii.card,
    borderWidth:     1,
    borderColor:     colors.warmBorder,
    backgroundColor: 'rgba(255, 244, 222, 0.98)',
    padding:         spacing.md,
    gap:             14,
  },
  closeBtn: {
    position:        'absolute',
    top:             10,
    right:           10,
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: 'rgba(255, 244, 222, 0.90)',
    borderWidth:     1,
    borderColor:     colors.warmBorder,
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          2,
  },
  closeBtnText: {
    fontSize:   22,
    color:      colors.mossDark,
    lineHeight: 24,
    includeFontPadding: false,
  },
  formField: { gap: 0 },
  fieldLabel: {
    fontSize:     typography.sizes.label,
    fontWeight:   typography.weights.bold,
    color:        colors.textPrimary,
    marginBottom: 8,
  },

  eventList: { gap: 12 },
  eventCardShadow: { borderRadius: radii.card, ...shadows.soft },
  eventCard: {
    overflow:        'hidden',
    borderRadius:    radii.card,
    borderWidth:     1,
    borderColor:     colors.warmBorder,
    backgroundColor: 'rgba(255, 244, 222, 0.98)',
    padding:         spacing.md,
  },
  cardActions: {
    position:      'absolute',
    top:           12,
    right:         12,
    flexDirection: 'row',
    gap:           6,
    zIndex:        2,
  },
  actionPill: {
    minHeight:       36,
    paddingHorizontal: 13,
    borderRadius:    999,
    backgroundColor: 'rgba(255, 244, 222, 0.90)',
    borderWidth:     1,
    borderColor:     colors.warmBorder,
    alignItems:      'center',
    justifyContent:  'center',
  },
  deletePill: { backgroundColor: 'rgba(143, 77, 56, 0.92)', borderColor: 'transparent' },
  // PWA `.day-card { display: grid; grid-template-columns: auto 1fr; gap: 12 }`
  eventRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  // PWA `.day-symbol { width: 38; height: 38; border-radius: 50%; bg: var(--moss) }`
  daySymbol: {
    width:          38,
    height:         38,
    borderRadius:   19,
    backgroundColor: colors.moss,
    alignItems:     'center',
    justifyContent: 'center',
    marginTop:      2,
  },
  daySymbolText: { fontSize: 16, color: '#fffaf0', lineHeight: 20, textAlign: 'center' },
  eventBody: { flex: 1, paddingRight: 60 },
  dateLine: {
    fontFamily:   typography.serif,
    fontSize:     typography.sizes.italicNote,
    fontStyle:    'italic',
    fontWeight:   typography.weights.medium,
    color:        colors.brown,
    lineHeight:   typography.lineHeights.italicNote,
    marginBottom: 4,
  },
  eventName: {
    fontFamily: typography.serif,
    fontSize:   typography.sizes.title,
    lineHeight: typography.lineHeights.title,
    fontWeight: typography.weights.regular,
    color:      colors.textPrimary,
  },
  eventNote: {
    color:      colors.textMuted,
    fontSize:   typography.sizes.body,
    lineHeight: typography.lineHeights.body,
    marginTop:  6,
  },

  symbolRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  // PWA `<select> option pills` — PWA parity approximation: PWA uses a native
  // <select> dropdown; we expose the same four options as inline pill chips.
  symbolPill: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius:    999,
    borderWidth:     1,
    borderColor:     colors.warmBorder,
    backgroundColor: 'rgba(255, 244, 222, 0.86)',
  },
  symbolText:        { fontSize: 15, color: colors.moss, lineHeight: 18 },
  symbolTextActive:  { color: colors.textOnPrimary },
  symbolLabel:       { fontSize: 12, fontWeight: typography.weights.bold, color: colors.moss },
  symbolLabelActive: { color: colors.textOnPrimary },
  pressed: { opacity: 0.72 },
});
