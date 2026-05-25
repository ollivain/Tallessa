const DEFAULT_POSITION = { x: 50, y: 50, zoom: 1, fit: 'cover' };

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

function parseMemoryDate(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const [year, month, day] = text.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  const dmy = text.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
  if (dmy) return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  return null;
}

function toDateKey(date) {
  if (!date || Number.isNaN(date.getTime())) return '';
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function normalizePosition(value) {
  const position = asObject(value);
  const x = Number(position.x);
  const y = Number(position.y);
  const zoom = Number(position.zoom);
  return {
    x: Number.isFinite(x) ? x : DEFAULT_POSITION.x,
    y: Number.isFinite(y) ? y : DEFAULT_POSITION.y,
    zoom: Number.isFinite(zoom) && zoom > 0 ? zoom : DEFAULT_POSITION.zoom,
    fit: position.fit === 'contain' ? 'contain' : 'cover',
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
  const todayKey = toDateKey(today);
  return (
    items.find((memory) => toDateKey(parseMemoryDate(memory?.calendarDate || memory?.date)) === todayKey)
    || items.find((memory) => memory.isFirstMemorialMemory)
    || items[0]
  );
}

export function normalizeMemorial(memorial) {
  const value = asObject(memorial);
  const horseName = getMemorialName(value);
  const memorialDate = getMemorialDate(value);
  const memorialImage = getMemorialImage(value);
  const heroImage = getHeroImage(value);
  const memorialDayName = getMemorialDayName(value);
  const importantDays = getImportantDays(value);
  const monthPhotos = getMonthPhotos(value);
  const calendarImages = monthPhotosToCalendarImages(monthPhotos, value.calendarImages);

  return {
    ...value,
    horseName,
    memorialDate,
    memorialImage,
    heroImage,
    importantDays,
    monthPhotos,
    monthPhotoPositions: normalizePositionMap(value.monthPhotoPositions),
    memories: asArray(value.memories),
    letters: asArray(value.letters),
    memorialDayName,
    memorialName: firstText(value.memorialName, memorialDayName),
    theme: value.theme || 'classic',
    language: value.language || 'en',
    heroImagePosition: normalizePosition(value.heroImagePosition),
    memorialImagePosition: normalizePosition(value.memorialImagePosition),
    candleLit: Boolean(value.candleLit),
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
