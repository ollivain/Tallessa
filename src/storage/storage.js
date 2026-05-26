import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeMemorials } from '../models/memorial';

// Version suffix lets us safely migrate storage format in the future by
// changing the key prefix without old data silently breaking the app.
const K = {
  APP_STATE: 'tallessa.prototype.v2',
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
    const unifiedRaw = await AsyncStorage.getItem(K.APP_STATE);
    if (unifiedRaw) {
      const raw = parseJSON(unifiedRaw, {});
      const memorials = normalizeMemorials(raw.memorials);
      const activeId = memorials.some((m) => m.id === raw.activeMemorialId)
        ? raw.activeMemorialId
        : memorials[0]?.id ?? null;
      return {
        memorials,
        activeId,
        settings: await readJSON(K.SETTINGS, {}),
        savedAt: raw.savedAt || 0,
      };
    }

    const results = await AsyncStorage.multiGet([K.MEMORIALS, K.ACTIVE_ID, K.SETTINGS]);
    const [memorialsStr, activeIdStr, settingsStr] = results.map(([, v]) => v);
    const memorials = normalizeMemorials(parseJSON(memorialsStr, []));
    const activeId = parseJSON(activeIdStr, null);
    const normalizedActiveId = memorials.some((m) => m.id === activeId)
      ? activeId
      : memorials[0]?.id ?? null;
    const settings = parseJSON(settingsStr, {});
    const normalized = {
      memorials,
      activeId: normalizedActiveId,
      settings,
    };

    if (memorials.length || normalizedActiveId) {
      await saveAppState(normalized);
    }

    return {
      memorials,
      activeId: normalizedActiveId,
      settings,
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
    const normalizedMemorials = normalizeMemorials(memorials);
    const normalizedActiveId = normalizedMemorials.some((m) => m.id === activeId)
      ? activeId
      : normalizedMemorials[0]?.id ?? null;
    const appState = {
      version: 2,
      activeMemorialId: normalizedActiveId || '',
      savedAt: Date.now(),
      memorials: normalizedMemorials,
    };
    await AsyncStorage.multiSet([
      [K.APP_STATE, JSON.stringify(appState)],
      [K.MEMORIALS, JSON.stringify(normalizedMemorials)],
      [K.ACTIVE_ID, JSON.stringify(normalizedActiveId)],
      [K.SETTINGS,  JSON.stringify(settings ?? {})],
    ]);
  } catch (e) {
    console.error('[storage] saveAppState failed:', e);
  }
}

// ── Granular helpers ─────────────────────────────────────────────────────────

export async function getMemorialSpaces() {
  const state = await loadAppState();
  return state.memorials;
}
export async function saveMemorialSpaces(spaces) {
  const state = await loadAppState();
  return saveAppState({ ...state, memorials: spaces });
}

export async function getActiveMemorialSpaceId() {
  const state = await loadAppState();
  return state.activeId;
}
export async function saveActiveMemorialSpaceId(id) {
  const state = await loadAppState();
  return saveAppState({ ...state, activeId: id });
}

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
