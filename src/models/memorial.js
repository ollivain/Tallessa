const DEFAULT_POSITION = { x: 50, y: 50, zoom: 1, fit: 'cover' };
const SUPPORTED_LANGUAGES = new Set(['en', 'fi']);
const DEFAULT_LANGUAGE = 'en';

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function firstText(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export function parseDate(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split('-').map(Number);
    if (!year || !month || !day) return null;
    const date = new Date(year, month - 1, day);
    return isValidDateParts(date, year, month, day) ? date : null;
  }
  const dmy = text.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = Number(dmy[3]);
    const date = new Date(year, month - 1, day);
    return isValidDateParts(date, year, month, day) ? date : null;
  }
  return null;
}

function isValidDateParts(date, year, month, day) {
  return (
    date &&
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function toDateKey(date) {
  if (!date || Number.isNaN(date.getTime())) return '';
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function parseDateInput(value) {
  const parsed = parseDate(value);
  return parsed ? toDateKey(parsed) : '';
}

export function formatDate(value, language = DEFAULT_LANGUAGE) {
  const parsed = parseDate(value) || new Date(value);
  if (!parsed || Number.isNaN(parsed.getTime())) return String(value || '');
  const month = monthName(parsed.getMonth(), language);
  return `${parsed.getDate()}. ${month} ${parsed.getFullYear()}`;
}

export function formatDateInput(value) {
  const parsed = parseDate(value);
  if (!parsed) return '';
  return `${parsed.getDate()}.${parsed.getMonth() + 1}.${parsed.getFullYear()}`;
}

export function monthName(monthIndex, language = DEFAULT_LANGUAGE, style = 'long') {
  try {
    return new Intl.DateTimeFormat(language === 'fi' ? 'fi-FI' : 'en-US', { month: style }).format(
      new Date(2024, monthIndex, 1),
    );
  } catch {
    const names = {
      en: {
        long: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      },
      fi: {
        long: ['tammikuu', 'helmikuu', 'maaliskuu', 'huhtikuu', 'toukokuu', 'kesäkuu', 'heinäkuu', 'elokuu', 'syyskuu', 'lokakuu', 'marraskuu', 'joulukuu'],
        short: ['tammi', 'helmi', 'maalis', 'huhti', 'touko', 'kesä', 'heinä', 'elo', 'syys', 'loka', 'marras', 'joulu'],
      },
    };
    return names[language === 'fi' ? 'fi' : 'en'][style]?.[monthIndex] ?? String(monthIndex + 1);
  }
}

export function capitalize(value) {
  const text = String(value || '');
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}

export function toPossessive(name, language = DEFAULT_LANGUAGE) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return language === 'fi' ? 'Rakkaan' : 'Beloved';
  if (language !== 'fi') return /s$/i.test(trimmed) ? `${trimmed}'` : `${trimmed}'s`;
  const last = trimmed[trimmed.length - 1]?.toLowerCase() || '';
  return 'aeiouäöy'.includes(last) ? `${trimmed}n` : `${trimmed}in`;
}

export function toAllative(name, language = DEFAULT_LANGUAGE) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return '';
  if (language !== 'fi') return trimmed;
  const last = trimmed[trimmed.length - 1]?.toLowerCase() || '';
  return 'aeiouäöy'.includes(last) ? `${trimmed}lle` : `${trimmed}ille`;
}

function defaultMemorialName(name, language = DEFAULT_LANGUAGE) {
  return language === 'fi' ? `${toPossessive(name, 'fi')} päivä` : `${toPossessive(name, 'en')} day`;
}

function normalizeLanguage(value) {
  return SUPPORTED_LANGUAGES.has(value) ? value : DEFAULT_LANGUAGE;
}

export function normalizePosition(value) {
  const position = asObject(value);
  const x = Number(position.x);
  const y = Number(position.y);
  const zoom = Number(position.zoom);
  const naturalAspect = Number(position.naturalAspect);
  // PWA parity: every image's saved metadata carries the full crop spec
  // (aspectRatio + fitMode + naturalAspect) so the rendered card looks the
  // same as the preview. The older `{ x, y, zoom, fit }` shape is still
  // accepted and gets transparently upgraded.
  const fitMode = position.fitMode
    ?? (position.fit === 'contain' ? 'contain' : 'cover');
  // aspectRatio can be 'fill' (default), 'original', or a numeric ratio.
  const aspectRatio = position.aspectRatio ?? 'fill';
  return {
    x:    Number.isFinite(x) ? x : DEFAULT_POSITION.x,
    y:    Number.isFinite(y) ? y : DEFAULT_POSITION.y,
    zoom: Number.isFinite(zoom) && zoom > 0 ? zoom : DEFAULT_POSITION.zoom,
    fit:  fitMode,        // legacy field kept for forward/back compatibility
    fitMode,
    aspectRatio,
    naturalAspect: Number.isFinite(naturalAspect) && naturalAspect > 0
      ? naturalAspect
      : 1,
  };
}

function normalizePositionMap(value) {
  const source = asObject(value);
  return Object.keys(source).reduce((acc, key) => {
    acc[key] = normalizePosition(source[key]);
    return acc;
  }, {});
}

function calendarImagesToMonthPhotos(calendarImages) {
  return asArray(calendarImages).reduce((acc, uri, index) => {
    if (uri) acc[String(index + 1).padStart(2, '0')] = uri;
    return acc;
  }, {});
}

function monthPhotosToCalendarImages(monthPhotos, calendarImages) {
  const source = asObject(monthPhotos);
  const fallback = asArray(calendarImages);
  return Array.from({ length: 12 }, (_, index) => {
    const monthKey = String(index + 1);
    const paddedMonthKey = monthKey.padStart(2, '0');
    return source[paddedMonthKey] || source[monthKey] || fallback[index] || null;
  });
}

export function getMemorialName(memorial) {
  return firstText(memorial?.horseName, memorial?.name);
}

export function getMemorialDate(memorial) {
  return firstText(memorial?.memorialDate, memorial?.death);
}

export function getMemorialImage(memorial) {
  return firstText(
    memorial?.memorialImage,
    memorial?.portraitUri,
  );
}

export function getMemorialDayName(memorial) {
  return firstText(memorial?.memorialDayName, memorial?.memorialName);
}

export function getHeroImage(memorial) {
  return firstText(
    memorial?.heroImage,
    memorial?.memorialImage,
    memorial?.portraitUri,
  );
}

export function getImportantDays(memorial) {
  return asArray(memorial?.importantDays).length
    ? asArray(memorial.importantDays)
    : asArray(memorial?.events);
}

export function getMonthPhotos(memorial) {
  const monthPhotos = asObject(memorial?.monthPhotos);
  if (Object.keys(monthPhotos).length) return monthPhotos;
  return calendarImagesToMonthPhotos(memorial?.calendarImages);
}

export function getMonthPhotosArray(memorial) {
  return monthPhotosToCalendarImages(getMonthPhotos(memorial), memorial?.calendarImages);
}

export function getHomeMemoryOfDay(memories, today = new Date()) {
  const items = asArray(memories);
  if (!items.length) return null;
  return items.find((memory) => memory.isFirstMemorialMemory) || items[0];
}

export function createBlankMemorial({ theme = 'classic', language = DEFAULT_LANGUAGE } = {}) {
  return normalizeMemorial({
    id: nextId(),
    theme,
    language,
    horseName: 'Pepe',
    petType: 'horse',
    petTypeCustom: '',
    memorialName: '',
    memorialDate: '',
    heroImage: '',
    heroImagePosition: { x: 50, y: 50, zoom: 1 },
    memorialNote: '',
    memorialText: '',
    memorialImage: '',
    memorialImagePosition: { x: 50, y: 50, zoom: 1 },
    candleLit: false,
    firstMemorialMemoryCreated: false,
    memories: [],
    letters: [],
    importantDays: [],
    monthPhotos: {},
    monthPhotoPositions: {},
  });
}

export function createMemory({
  type,
  media,
  storagePath,
  draft,
  text,
  calendarDate,
  videoClipSeconds,
  fallbackText = '',
}) {
  return normalizeMemory({
    id: nextId(),
    type,
    media,
    storagePath,
    clipStart: draft?.clipStart || 0,
    clipEnd: draft?.clipEnd || (type === 'video' ? videoClipSeconds : 0),
    imagePosition: draft?.position || { x: 50, y: 50, zoom: 1 },
    text: text || fallbackText,
    calendarDate,
    createdAt: new Date().toISOString(),
  });
}

export function normalizeMemory(memory) {
  const value = asObject(memory);
  const type = firstText(value.type, value.mediaType) || 'image';
  const media = firstText(value.media, value.mediaRemoteUrl, value.mediaUri);
  const storagePath = firstText(value.storagePath, value.mediaRemotePath);
  const calendarDate = parseDateInput(value.calendarDate || value.date);
  return {
    ...value,
    id: value.id || nextId(),
    type: type || null,
    media,
    storagePath,
    text: firstText(value.text, value.body),
    calendarDate,
    createdAt: value.createdAt || new Date().toISOString(),
    imagePosition: normalizePosition(value.imagePosition),
    mediaType: type || null,
    mediaUri: firstText(value.mediaUri, media),
    mediaRemoteUrl: firstText(value.mediaRemoteUrl),
    mediaRemotePath: firstText(value.mediaRemotePath, storagePath),
  };
}

export function normalizeLetter(letter) {
  const value = asObject(letter);
  const parsedDate = parseDate(value.date);
  const createdAt = value.createdAt || (parsedDate ? parsedDate.toISOString() : new Date().toISOString());
  return {
    ...value,
    id: value.id || nextId(),
    title: firstText(value.title),
    body: firstText(value.body),
    createdAt,
    date: value.date || createdAt.slice(0, 10),
  };
}

export function normalizeImportantDay(day) {
  const value = asObject(day);
  return {
    ...value,
    id: value.id || nextId(),
    name: firstText(value.name),
    date: parseDateInput(value.date) || firstText(value.date),
    note: firstText(value.note, value.description, value.text),
    symbol: firstText(value.symbol) || '♡',
  };
}

export function nextId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeMemorial(memorial) {
  const value = asObject(memorial);
  const language = normalizeLanguage(value.language);
  const horseName = getMemorialName(value) || 'Muisto';
  const memorialDate = parseDateInput(getMemorialDate(value));
  const memorialImage = getMemorialImage(value);
  const heroImage = getHeroImage(value);
  const memorialDayName = getMemorialDayName(value) || defaultMemorialName(horseName, language);
  const importantDays = getImportantDays(value).map(normalizeImportantDay);
  const monthPhotos = getMonthPhotos(value);
  const calendarImages = monthPhotosToCalendarImages(monthPhotos, value.calendarImages);
  const memories = asArray(value.memories).map(normalizeMemory);
  const letters = asArray(value.letters).map(normalizeLetter);

  return {
    ...value,
    id: value.id || nextId(),
    horseName,
    memorialDate,
    memorialImage,
    heroImage,
    importantDays,
    monthPhotos,
    monthPhotoPositions: normalizePositionMap(value.monthPhotoPositions),
    memories,
    letters,
    memorialDayName,
    memorialName: firstText(value.memorialName, memorialDayName),
    theme: value.theme || 'classic',
    language,
    petType: value.petType || 'horse',
    petTypeCustom: value.petTypeCustom || '',
    heroImagePosition: normalizePosition(value.heroImagePosition),
    memorialImagePosition: normalizePosition(value.memorialImagePosition),
    candleLit: Boolean(value.candleLit),
    firstMemorialMemoryCreated:
      Boolean(value.firstMemorialMemoryCreated) || memories.some((memory) => memory.isFirstMemorialMemory),
    name: firstText(value.name, horseName),
    death: firstText(value.death, memorialDate),
    portraitUri: firstText(value.portraitUri, memorialImage),
    events: importantDays,
    calendarImages,
  };
}

export function normalizeMemorials(memorials) {
  return asArray(memorials).map((memorial) => normalizeMemorial(memorial));
}
