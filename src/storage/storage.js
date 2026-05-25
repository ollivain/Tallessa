import AsyncStorage from '@react-native-async-storage/async-storage';

// Version suffix lets us safely migrate storage format in the future by
// changing the key prefix without old data silently breaking the app.
const K = {
  MEMORIALS: 'tallessa.mobile.v1.memorials',
  ACTIVE_ID: 'tallessa.mobile.v1.activeId',
  SETTINGS:  'tallessa.mobile.v1.settings',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseJSON(raw, fallback) {
  if (raw == null) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

async function readJSON(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return parseJSON(raw, fallback);
  } catch (e) {
    console.warn(`[storage] read failed for ${key}:`, e);
    return fallback;
  }
}

async function writeJSON(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`[storage] write failed for ${key}:`, e);
  }
}

// ── Bulk load / save ─────────────────────────────────────────────────────────

/**
 * Loads all app state in one multiGet round-trip.
 * Returns a safe default state if storage is empty or corrupt.
 */
export async function loadAppState() {
  try {
    const results = await AsyncStorage.multiGet([K.MEMORIALS, K.ACTIVE_ID, K.SETTINGS]);
    const [memorialsStr, activeIdStr, settingsStr] = results.map(([, v]) => v);
    return {
      memorials: parseJSON(memorialsStr, []),
      activeId:  parseJSON(activeIdStr,  null),
      settings:  parseJSON(settingsStr,  {}),
    };
  } catch (e) {
    console.error('[storage] loadAppState failed, returning defaults:', e);
    return { memorials: [], activeId: null, settings: {} };
  }
}

/**
 * Saves all app state in one multiSet round-trip.
 * Used for bulk operations; prefer the granular helpers for individual mutations.
 */
export async function saveAppState({ memorials, activeId, settings }) {
  try {
    await AsyncStorage.multiSet([
      [K.MEMORIALS, JSON.stringify(memorials)],
      [K.ACTIVE_ID, JSON.stringify(activeId)],
      [K.SETTINGS,  JSON.stringify(settings)],
    ]);
  } catch (e) {
    console.error('[storage] saveAppState failed:', e);
  }
}

// ── Granular helpers ─────────────────────────────────────────────────────────

export async function getMemorialSpaces()           { return readJSON(K.MEMORIALS, []); }
export async function saveMemorialSpaces(spaces)    { return writeJSON(K.MEMORIALS, spaces); }

export async function getActiveMemorialSpaceId()    { return readJSON(K.ACTIVE_ID, null); }
export async function saveActiveMemorialSpaceId(id) { return writeJSON(K.ACTIVE_ID, id); }

export async function getSettings()                 { return readJSON(K.SETTINGS, {}); }
/**
 * Merges `partial` into the stored settings rather than overwriting them.
 * This ensures that changing the language does not wipe the stored theme and
 * vice-versa — all settings keys coexist in the same AsyncStorage entry.
 */
export async function saveSettings(partial) {
  const current = await readJSON(K.SETTINGS, {});
  return writeJSON(K.SETTINGS, { ...current, ...partial });
}

/** Wipes everything — use only from the developer debug menu. */
export async function clearAllData() {
  try {
    await AsyncStorage.multiRemove(Object.values(K));
  } catch (e) {
    console.error('[storage] clearAllData failed:', e);
  }
}
