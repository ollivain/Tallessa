import { capitalize, escapeHtml, toGenitive } from "./ui.js";

export const monthNames = [
  "tammikuu",
  "helmikuu",
  "maaliskuu",
  "huhtikuu",
  "toukokuu",
  "kesäkuu",
  "heinäkuu",
  "elokuu",
  "syyskuu",
  "lokakuu",
  "marraskuu",
  "joulukuu",
];

export function renderCalendarView({
  elements,
  state,
  visibleMonth,
  applyImagePosition,
  getMonthPosition,
}) {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const monthKey = getMonthKey(visibleMonth);
  const customPhoto = state.monthPhotos[monthKey];

  elements.currentMonth.textContent = `${capitalize(monthNames[month])} ${year}`;
  elements.monthCover.style.backgroundImage = customPhoto
    ? `linear-gradient(180deg, rgba(47,54,47,0), rgba(47,54,47,0.22)), url('${customPhoto}')`
    : "";
  applyImagePosition(elements.monthCover, getMonthPosition(monthKey));

  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - startOffset);
  const todayKey = toDateKey(new Date());

  const cells = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const dateKey = toDateKey(date);
    const isCurrentMonth = date.getMonth() === month;
    const note = getDayNote(state, date);
    const isMemorial = isMemorialDate(state, date);
    const hasMemory = hasCalendarMemory(state, date);
    const classes = [
      "day-cell",
      !isCurrentMonth ? "is-muted" : "",
      dateKey === todayKey ? "is-today" : "",
      note || isMemorial || hasMemory ? "has-note" : "",
      isMemorial ? "is-memorial" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return `<div class="${classes}" data-symbol="${escapeHtml(isMemorial || hasMemory ? "♡" : note?.symbol || "")}">${date.getDate()}</div>`;
  });

  elements.calendarGrid.innerHTML = cells.join("");
  renderDayList({ elements, state, visibleMonth });
}

function renderDayList({ elements, state, visibleMonth }) {
  const month = visibleMonth.getMonth();
  const year = visibleMonth.getFullYear();
  const days = [
    {
      name: `${toGenitive(state.horseName)} päivä`,
      date: state.memorialDate,
      note: "Toistuu automaattisesti joka vuosi.",
      symbol: "♡",
      type: "memorial-day",
      recurring: true,
    },
    ...state.importantDays,
  ].filter((day) => {
    const date = parseDate(day.date);
    return date && date.getMonth() === month && (day.recurring || date.getFullYear() === year);
  });
  const memories = state.memories.filter((memory) => parseDate(memory.calendarDate));

  if (!days.length && !memories.length) {
    elements.dayList.innerHTML = `<p class="empty-state">Tässä kuussa ei ole vielä omia muistopäiviä.</p>`;
    return;
  }

  const dayCards = days
    .map((day) => {
      const date = parseDate(day.date);
      const deleteType = day.type || "day";
      const itemId = day.id || "";
      const deletableAttributes = ` data-deletable-item="${deleteType}" data-item-id="${itemId}"`;
      const deleteButton =
        `<button class="delete-action" type="button" data-delete-item="${deleteType}" data-item-id="${itemId}" hidden>Poista</button>`;
      return `
        <article class="day-card card"${deletableAttributes}>
          ${deleteButton}
          <span class="day-symbol">${escapeHtml(day.symbol)}</span>
          <div>
            <p class="date-line">${date.getDate()}. ${monthNames[date.getMonth()]}</p>
            <h3>${escapeHtml(day.name)}</h3>
            <p>${escapeHtml(day.note || "Hiljainen, tärkeä päivä.")}</p>
          </div>
        </article>
      `;
    })
    .join("");
  const memoryCards = memories.map((memory) => renderCalendarMemoryCard(memory)).join("");

  elements.dayList.innerHTML = `${dayCards}${memoryCards}`;
}

function renderCalendarMemoryCard(memory) {
  const date = parseDate(memory.calendarDate);
  return `
    <article class="day-card card" data-deletable-item="memory" data-item-id="${memory.id}">
      <button class="delete-action" type="button" data-delete-item="memory" data-item-id="${memory.id}" hidden>Poista</button>
      <span class="day-symbol">&#9825;</span>
      <div>
        <p class="date-line">${date.getDate()}. ${monthNames[date.getMonth()]}</p>
        <h3>Muisto</h3>
        <p>${escapeHtml(memory.text || "Muisto ilman sanoja.")}</p>
      </div>
    </article>
  `;
}

export function parseDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function parseDateInput(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const match = trimmed.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
  if (!match) return "";

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return "";

  return toDateKey(date);
}

export function formatDateInput(value) {
  const date = parseDate(value);
  if (!date) return "";
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
}

export function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatDate(value) {
  const date = new Date(value);
  return `${date.getDate()}. ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function getDayNote(state, date) {
  const dateKey = toDateKey(date);
  return state.importantDays.find((day) => day.date === dateKey);
}

function hasCalendarMemory(state, date) {
  const dateKey = toDateKey(date);
  return state.memories.some((memory) => memory.calendarDate === dateKey);
}

function isMemorialDate(state, date) {
  const memorial = parseDate(state.memorialDate);
  return memorial && memorial.getMonth() === date.getMonth() && memorial.getDate() === date.getDate();
}
