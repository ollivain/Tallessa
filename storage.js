import { parseDateInput } from "./calendar.js";
import { buildMemorialText, normalizePosition, normalizeTheme, toGenitive } from "./ui.js";

const STORAGE_KEY = "tallessa.prototype.v2";

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
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

function normalizeAppState(value) {
  const memorials = (value.memorials || []).map((memorial) => normalizeMemorial(memorial));
  const activeMemorialId = memorials.some((memorial) => memorial.id === value.activeMemorialId)
    ? value.activeMemorialId
    : memorials[0]?.id || "";

  return {
    version: 2,
    activeMemorialId,
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
