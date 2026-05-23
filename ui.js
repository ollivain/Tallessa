import { getLanguage, t } from "./i18n.js?v=20260523-i18nv5";

const THEME_IDS = ["classic", "timeless", "soft", "modern", "romantic"];
const PET_TYPES = ["horse", "dog", "cat", "rabbit", "bird", "guineaPig", "hamster", "ferret", "turtle", "human", "other"];

/**
 * Returns a name in possessive form ("Pepe's" in EN, "Pepen" in FI).
 * Used in templates so the rest of the string stays in translations.js.
 */
export function toPossessive(name, lang = getLanguage()) {
  const trimmed = String(name || "").trim();
  if (!trimmed) {
    return lang === "fi" ? "Rakkaan" : "Beloved";
  }
  if (lang === "fi") return toGenitive(trimmed);
  // English: standard "'s", "'" for names already ending in s
  return /s$/i.test(trimmed) ? `${trimmed}'` : `${trimmed}'s`;
}

export function setActiveView({ name, screens, navButtons }) {
  screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen.dataset.screen === name);
  });

  document.querySelector(".phone-shell")?.classList.toggle("is-memorial-active", name === "memorial");
  document.body.classList.toggle("is-selector-active", name === "selector");
  document.body.dataset.activeScreen = name;

  navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.nav === name);
  });

  document.scrollingElement?.scrollTo({ top: 0 });
}

export function applyTheme(theme) {
  const normalizedTheme = normalizeTheme(theme);
  document.documentElement.classList.remove(...THEME_IDS.map((id) => `theme-${id}`));
  document.documentElement.classList.add(`theme-${normalizedTheme}`);
}

export function normalizeTheme(theme) {
  return THEME_IDS.includes(theme) ? theme : "classic";
}

export function normalizePosition(position) {
  return {
    x: clamp(Number(position?.x ?? 50), 0, 100),
    y: clamp(Number(position?.y ?? 50), 0, 100),
    zoom: clamp(Number(position?.zoom ?? 1), 1, 2.6),
  };
}

export function applyImagePosition(element, position) {
  const normalized = normalizePosition(position);
  element.style.backgroundPosition = `${normalized.x}% ${normalized.y}%`;
  element.style.backgroundSize = getComposedBackgroundSize(element, normalized.zoom);
}

export function getComposedBackgroundSize(element, zoom) {
  if (zoom <= 1.001) return "cover";

  const rect = element.getBoundingClientRect();
  const percent = `${Math.round(zoom * 100)}%`;
  return rect.width / rect.height > 1.35 ? `${percent} auto` : `auto ${percent}`;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function getPointerDistance(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

export function toAllative(name) {
  // Finnish allative case ("-lle"). English version uses a translated wrapper instead.
  if (!name) return t("memorialText.fallbackName");
  return `${name}lle`;
}

export function toGenitive(name) {
  // Finnish genitive case ("-n" / "-in"). English version uses toPossessive() above.
  const trimmed = String(name || "").trim();
  if (!trimmed) return "Rakkaan";
  return /[aeiouyäöå]$/i.test(trimmed) ? `${trimmed}n` : `${trimmed}in`;
}

export function buildMemorialText(source) {
  const name = source.horseName || t("memorialText.fallbackName");
  const animal = source.petTypeCustom || t("memorialText.fallbackAnimal");
  const petType = PET_TYPES.includes(source.petType) ? source.petType : "other";
  const base = t(`memorialText.${petType}`, { name, animal });
  return source.memorialNote ? `${base} ${source.memorialNote}` : base;
}

export function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[char];
  });
}
