import { parseDateInput } from "./calendar.js?v=20260523-i18nv3";
import { buildMemorialText, normalizePosition, normalizeTheme, toGenitive } from "./ui.js?v=20260523-i18nv3";
import { t } from "./i18n.js?v=20260523-i18nv3";

const STORAGE_KEY = "tallessa.prototype.v2";
const LANGUAGE_KEY = "tallessa.language"; // device-wide UI language (not per memorial)
const DEVICE_ID_KEY = "tallessa.deviceId";
const SUPPORTED_LANGUAGES = new Set(["en", "fi"]);
const DEFAULT_LANGUAGE = "en";

// ── UI language persistence (separate from appState because it's device-wide,
//    not per memorial) ────────────────────────────────────────────────────────

export function loadLanguage() {
  try {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    return SUPPORTED_LANGUAGES.has(stored) ? stored : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function saveLanguage(lang) {
  if (!SUPPORTED_LANGUAGES.has(lang)) return false;
  try {
    localStorage.setItem(LANGUAGE_KEY, lang);
    return true;
  } catch {
    return false;
  }
}
const SUPABASE_CONFIG = window.TallessaSupabase || {};
const SUPABASE_BUCKET = SUPABASE_CONFIG.bucket || "memories";

let supabaseClientPromise = null;
let syncDebounceTimer = null;
let currentUserId = null; // set by setAuthUser() when a user signs in

// ── Auth integration (set by app.js via onAuthChange) ────────────────────────

/**
 * Called by app.js whenever auth state changes.
 * When a user is signed in, cloud state is scoped to their user ID.
 * When null (anonymous), the anonymous device ID is used instead.
 */
export function setAuthUser(user) {
  currentUserId = user?.id ?? null;
}

// ── Device identity (namespaces cloud state per device/browser) ───────────────

function getOrCreateDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

function getStateStoragePath() {
  // Authenticated users get a user-scoped path; anonymous users use device ID.
  const id = currentUserId ?? getOrCreateDeviceId();
  return `state/${id}/appstate.json`;
}

// ── Supabase client ───────────────────────────────────────────────────────────

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey && SUPABASE_BUCKET);
}

export async function getSupabaseClient() {
  if (!supabaseClientPromise) {
    supabaseClientPromise = import("https://esm.sh/@supabase/supabase-js@2").then(({ createClient }) =>
      createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey),
    );
  }
  return supabaseClientPromise;
}

// ── Soft cloud sync error notification ───────────────────────────────────────
// Programmatic element — no changes to index.html or styles.css needed.

function showCloudSyncError(message) {
  if (typeof document === "undefined") return;
  let el = document.getElementById("tallessa-cloud-status");
  if (!el) {
    el = document.createElement("div");
    el.id = "tallessa-cloud-status";
    Object.assign(el.style, {
      position: "fixed",
      bottom: "76px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "rgba(74,44,24,0.94)",
      color: "#f5efdf",
      padding: "8px 18px",
      borderRadius: "10px",
      fontSize: "13px",
      lineHeight: "1.45",
      zIndex: "9999",
      maxWidth: "88vw",
      textAlign: "center",
      pointerEvents: "none",
      opacity: "0",
      transition: "opacity 0.35s",
    });
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.style.opacity = "1";
  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(() => {
    el.style.opacity = "0";
  }, 5000);
}

// ── Supabase state sync ───────────────────────────────────────────────────────

async function pushToSupabase(appState) {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = await getSupabaseClient();
    const blob = new Blob([JSON.stringify(appState)], { type: "application/json" });
    const file = new File([blob], "appstate.json", { type: "application/json" });
    const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(getStateStoragePath(), file, {
      cacheControl: "0",
      contentType: "application/json",
      upsert: true,
    });
    if (error) throw error;
  } catch (error) {
    console.warn("Tallessa cloud save failed", error);
    showCloudSyncError(t("msg.cloud.saveFailed"));
  }
}

function schedulePush(appState) {
  // Only push when a user is authenticated — anonymous writes are blocked by RLS.
  if (!isSupabaseConfigured() || !currentUserId) return;
  clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(() => pushToSupabase(appState), 1500);
}

async function fetchFromSupabase() {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).download(getStateStoragePath());
    if (error || !data) return null;
    const text = await data.text();
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Call once at startup. If cloud has newer data → calls onUpdate with it.
 * If cloud has no data and local does → migrates local data to cloud.
 */
export async function syncFromCloud(currentAppState, onUpdate) {
  // Only sync when authenticated — anonymous reads/writes are blocked by RLS.
  if (!isSupabaseConfigured() || !currentUserId) return;
  try {
    const cloudRaw = await fetchFromSupabase();
    if (!cloudRaw?.memorials) {
      // Cloud is empty → migrate local data up
      if (currentAppState.memorials.length) pushToSupabase(currentAppState);
      return;
    }
    const localSavedAt = currentAppState.savedAt || 0;
    const cloudSavedAt = cloudRaw.savedAt || 0;
    if (cloudSavedAt > localSavedAt) {
      const normalized = normalizeAppState(cloudRaw);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized)); } catch { /* quota */ }
      onUpdate(normalized);
    }
  } catch {
    // Cloud sync is optional — never block the app
  }
}

// ── Default state ─────────────────────────────────────────────────────────────

const defaultState = {
  theme: "classic",
  horseName: "Pepe",
  petType: "horse",
  petTypeCustom: "",
  memorialName: "Pepen päivä",
  memorialDate: "2026-05-19",
  heroImage: "",
  heroImagePosition: { x: 50, y: 50, zoom: 1 },
  memorialNote: "",
  memorialText: "",
  memorialImage: "",
  memorialImagePosition: { x: 50, y: 50, zoom: 1 },
  candleLit: false,
  firstMemorialMemoryCreated: false,
  memories: [
    {
      id: crypto.randomUUID(),
      type: "image",
      media:
        "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=900&q=80",
      text: "Aamu, jolloin laitumen valo tuntui pysähtyvän hetkeksi.",
      createdAt: new Date().toISOString(),
    },
  ],
  letters: [
    {
      id: crypto.randomUUID(),
      title: "Rakas Pepe",
      body: "Kirjoitan tämän, jotta muistan hengittää hitaammin. Sinä olet yhä mukana pienissä paikoissa: tallin hiljaisuudessa, käsissäni ja niissä päivissä, joihin palaan lempeästi.",
      createdAt: new Date().toISOString(),
    },
  ],
  importantDays: [],
  monthPhotos: {},
  monthPhotoPositions: {},
};

// ── Core state API (localStorage-first, Supabase in background) ──────────────

export function loadState() {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEY);
    if (!storedValue) return createEmptyAppState();
    const stored = JSON.parse(storedValue);
    if (stored?.memorials) return normalizeAppState(stored);
    return createEmptyAppState();
  } catch {
    return createEmptyAppState();
  }
}

export function saveState(appState) {
  try {
    appState.savedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    schedulePush(appState);
    return true;
  } catch (error) {
    console.warn("Tallessa local save failed", error);
    return false;
  }
}

export function createEmptyAppState() {
  return {
    version: 2,
    activeMemorialId: "",
    savedAt: 0,
    memorials: [],
  };
}

export function createBlankMemorial(theme = "classic") {
  return normalizeMemorial({
    id: crypto.randomUUID(),
    theme,
    horseName: "Pepe",
    petType: "horse",
    petTypeCustom: "",
    memorialName: "Pepen päivä",
    memorialDate: "",
    heroImage: "",
    heroImagePosition: { x: 50, y: 50, zoom: 1 },
    memorialNote: "",
    memorialText: "",
    memorialImage: "",
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

export function getActiveMemorial(appState) {
  if (!appState.memorials.length) {
    return createBlankMemorial();
  }

  return appState.memorials.find((memorial) => memorial.id === appState.activeMemorialId) || appState.memorials[0];
}

// ── Granular CRUD API ─────────────────────────────────────────────────────────
// These wrap the saveState() mechanism and are async to allow future
// database-level Supabase integration without API changes.

export async function loadMemorials(appState) {
  return appState.memorials;
}

export async function saveMemorial(appState, memorial) {
  const index = appState.memorials.findIndex((m) => m.id === memorial.id);
  if (index === -1) {
    appState.memorials.push(memorial);
  } else {
    appState.memorials[index] = memorial;
  }
  return saveState(appState);
}

export async function updateMemorial(appState, memorialId, changes) {
  const memorial = appState.memorials.find((m) => m.id === memorialId);
  if (!memorial) return false;
  Object.assign(memorial, changes);
  return saveState(appState);
}

export async function deleteMemorial(appState, memorialId) {
  appState.memorials = appState.memorials.filter((m) => m.id !== memorialId);
  if (appState.activeMemorialId === memorialId) {
    appState.activeMemorialId = appState.memorials[0]?.id || "";
  }
  return saveState(appState);
}

export async function loadMemories(appState, memorialId) {
  const memorial = appState.memorials.find((m) => m.id === memorialId);
  return memorial?.memories ?? [];
}

export async function saveMemory(appState, memorialId, memory) {
  const memorial = appState.memorials.find((m) => m.id === memorialId);
  if (!memorial) return false;
  memorial.memories.unshift(memory);
  return saveState(appState);
}

export async function updateMemory(appState, memorialId, memoryId, changes) {
  const memorial = appState.memorials.find((m) => m.id === memorialId);
  if (!memorial) return false;
  const memory = memorial.memories.find((m) => m.id === memoryId);
  if (!memory) return false;
  Object.assign(memory, changes);
  return saveState(appState);
}

export async function deleteMemory(appState, memorialId, memoryId) {
  const memorial = appState.memorials.find((m) => m.id === memorialId);
  if (!memorial) return false;
  memorial.memories = memorial.memories.filter((m) => m.id !== memoryId);
  return saveState(appState);
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function normalizeAppState(value) {
  const memorials = (value.memorials || []).map((memorial) => normalizeMemorial(memorial));
  const activeMemorialId = memorials.some((memorial) => memorial.id === value.activeMemorialId)
    ? value.activeMemorialId
    : memorials[0]?.id || "";

  return {
    version: 2,
    activeMemorialId,
    savedAt: value.savedAt || 0,
    memorials,
  };
}

function normalizeMemorial(value) {
  const loaded = { ...structuredClone(defaultState), ...(value || {}) };
  loaded.id = loaded.id || crypto.randomUUID();
  loaded.theme = normalizeTheme(loaded.theme);
  loaded.petType = loaded.petType || "horse";
  loaded.petTypeCustom = loaded.petTypeCustom || "";
  loaded.horseName = loaded.horseName || "Muisto";
  loaded.memorialName = loaded.memorialName || `${toGenitive(loaded.horseName)} päivä`;
  loaded.heroImagePosition = normalizePosition(loaded.heroImagePosition);
  loaded.memorialImagePosition = normalizePosition(loaded.memorialImagePosition);
  loaded.monthPhotos = loaded.monthPhotos || {};
  loaded.monthPhotoPositions = loaded.monthPhotoPositions || {};
  loaded.importantDays = loaded.importantDays || [];
  loaded.memories = (loaded.memories || []).map((memory) => ({
    ...memory,
    id: memory.id || crypto.randomUUID(),
    calendarDate: parseDateInput(memory.calendarDate),
    imagePosition: normalizePosition(memory.imagePosition),
  }));
  loaded.firstMemorialMemoryCreated =
    Boolean(loaded.firstMemorialMemoryCreated) || loaded.memories.some((memory) => memory.isFirstMemorialMemory);
  loaded.letters = (loaded.letters || []).map((letter) => ({
    ...letter,
    id: letter.id || crypto.randomUUID(),
  }));
  loaded.memorialNote = loaded.memorialNote || "";
  loaded.memorialText = buildMemorialText(loaded);
  return loaded;
}
