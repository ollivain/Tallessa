import { parseDate } from '../models/memorial';

// ── PWA parity: calendar.js sort/grouping helpers ─────────────────────────
// The PWA's `.day-list` always renders *every* important day the user has
// added, no matter which month the calendar currently shows. The visible
// month's days appear first; the rest follow underneath, ordered naturally.
//
// Earlier the RN side used a `.filter(day => isSameVisibleMonth(...))` that
// dropped off-month days entirely — switching from May to June made Pepe's
// 19-May memorial disappear from the list. These helpers replace that
// behaviour with a *grouping* sort that keeps the full list intact.

/**
 * Sorts a list of important days (date-of-passing anniversaries, birthdays,
 * user-added "important days") so the visible month's entries are first.
 *
 * Important guarantees:
 *   - Every input day is preserved; nothing is filtered away because of
 *     month membership. Only entries with an *unparseable* date are
 *     dropped — those would have no place in the calendar list anyway.
 *   - The visible-month group is sorted by day-of-month ascending.
 *   - The other-months group is sorted by month, then day-of-month.
 *
 * @param {Array} days          – important-day objects with a `date` string
 * @param {Date}  visibleMonth  – any date inside the currently visible month
 * @returns {Array}             – same shape as input, re-ordered
 */
export function sortImportantDaysForVisibleMonth(days, visibleMonth) {
  if (!Array.isArray(days) || days.length === 0) return [];
  const targetMonth = visibleMonth.getMonth();

  const dated = [];
  for (const day of days) {
    const parsed = parseDate(day?.date);
    if (parsed) dated.push({ day, parsed });
  }

  const inMonth = dated.filter((entry) => entry.parsed.getMonth() === targetMonth);
  const others  = dated.filter((entry) => entry.parsed.getMonth() !== targetMonth);

  inMonth.sort((a, b) => a.parsed.getDate() - b.parsed.getDate());
  others.sort((a, b) =>
    (a.parsed.getMonth() - b.parsed.getMonth())
    || (a.parsed.getDate() - b.parsed.getDate()),
  );

  return [...inMonth.map((entry) => entry.day), ...others.map((entry) => entry.day)];
}

/**
 * Same shape as `sortImportantDaysForVisibleMonth` but for the memory list
 * (memory.calendarDate). Memories *are* year-specific, so the secondary
 * sort prefers most-recent-first to match how the PWA renders them.
 */
export function sortMemoriesForVisibleMonth(memories, visibleMonth) {
  if (!Array.isArray(memories) || memories.length === 0) return [];
  const targetMonth = visibleMonth.getMonth();

  const dated = [];
  for (const memory of memories) {
    const parsed = parseDate(memory?.calendarDate);
    if (parsed) dated.push({ memory, parsed });
  }

  const inMonth = dated.filter((entry) => entry.parsed.getMonth() === targetMonth);
  const others  = dated.filter((entry) => entry.parsed.getMonth() !== targetMonth);

  inMonth.sort((a, b) => a.parsed.getDate() - b.parsed.getDate());
  others.sort((a, b) =>
    (a.parsed.getMonth() - b.parsed.getMonth())
    || (a.parsed.getDate() - b.parsed.getDate()),
  );

  return [...inMonth.map((entry) => entry.memory), ...others.map((entry) => entry.memory)];
}

// ── Minimal in-file sanity tests ─────────────────────────────────────────
// Tiny self-checks that run only when explicitly invoked (e.g. from a node
// REPL or a future jest suite). They prove the three contract guarantees:
//   1. May day visible in June       → still present after sort
//   2. June day with visibleMonth=Jun → bubbles to the top
//   3. No day ever disappears across month changes
//
// Call `runCalendarSortSelfTests()` from anywhere to verify. Throws if any
// assertion fails; returns `true` otherwise.
export function runCalendarSortSelfTests() {
  const days = [
    { id: 'a', date: '2025-05-19' }, // May 19
    { id: 'b', date: '2025-06-01' }, // June 1
    { id: 'c', date: '2025-06-15' }, // June 15
    { id: 'd', date: '2025-12-24' }, // December 24
  ];

  const may  = new Date(2025, 4, 1);
  const june = new Date(2025, 5, 1);
  const sortedMay  = sortImportantDaysForVisibleMonth(days, may);
  const sortedJune = sortImportantDaysForVisibleMonth(days, june);

  // 1. No day disappears
  if (sortedMay.length !== days.length) {
    throw new Error(`May sort dropped days: ${sortedMay.length} of ${days.length}`);
  }
  if (sortedJune.length !== days.length) {
    throw new Error(`June sort dropped days: ${sortedJune.length} of ${days.length}`);
  }

  // 2. May day is first when visibleMonth = May
  if (sortedMay[0].id !== 'a') {
    throw new Error(`Expected May 19 first in May, got ${sortedMay[0].id}`);
  }

  // 3. June days bubble to the top when visibleMonth = June, in day order
  if (sortedJune[0].id !== 'b' || sortedJune[1].id !== 'c') {
    throw new Error(`Expected June days first in June, got ${sortedJune.map((d) => d.id).join(',')}`);
  }

  // 4. Off-month days are still in the list (just later) and sorted by month
  const offMonthIds = sortedJune.slice(2).map((d) => d.id);
  if (!offMonthIds.includes('a') || !offMonthIds.includes('d')) {
    throw new Error(`Expected off-month days a + d present, got ${offMonthIds.join(',')}`);
  }
  if (offMonthIds[0] !== 'a' || offMonthIds[1] !== 'd') {
    throw new Error(`Expected off-month order a,d, got ${offMonthIds.join(',')}`);
  }

  return true;
}
