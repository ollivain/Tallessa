// Tallessa — runtime i18n
//
// Public API
//   getLanguage()           → current "en" | "fi"
//   setLanguage(lang)       → switch and remember (in-memory; persistence is
//                             handled by storage.js via appState.language)
//   t(key, params)          → translated string with {placeholder} substitution
//   formatTemplate(s, p)    → reusable string-template substitution
//   applyTranslations(root) → walks the DOM and updates text + selected
//                             attributes for elements that opt in via
//                             data-i18n[*] attributes
//   getDailyQuote(date)     → deterministic per-day quote in current language

import { dictionaries, quotePools } from "./translations.js?v=20260523-i18nv7";

const SUPPORTED = new Set(["en", "fi"]);
const DEFAULT_LANGUAGE = "en";

let currentLanguage = DEFAULT_LANGUAGE;
const listeners = new Set();

export function getLanguage() {
  return currentLanguage;
}

export function setLanguage(lang) {
  const next = SUPPORTED.has(lang) ? lang : DEFAULT_LANGUAGE;
  if (next === currentLanguage) return currentLanguage;
  currentLanguage = next;
  document.documentElement.setAttribute("lang", next);
  listeners.forEach((fn) => {
    try { fn(next); } catch { /* listener crashes shouldn't break i18n */ }
  });
  return currentLanguage;
}

export function onLanguageChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function formatTemplate(template, params) {
  if (!params) return template;
  return String(template).replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match,
  );
}

export function t(key, params) {
  const dict = dictionaries[currentLanguage] || dictionaries[DEFAULT_LANGUAGE];
  const value =
    (dict && dict[key]) ||
    (dictionaries[DEFAULT_LANGUAGE] && dictionaries[DEFAULT_LANGUAGE][key]) ||
    key;
  return formatTemplate(value, params);
}

export function getDailyQuote(date = new Date()) {
  const pool = quotePools[currentLanguage] || quotePools[DEFAULT_LANGUAGE];
  if (!pool?.length) return "";
  const dayIndex = Math.floor(
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() /
      86400000,
  );
  return pool[((dayIndex % pool.length) + pool.length) % pool.length];
}

/**
 * Walks `root` (defaults to document) and applies translations to every
 * element that opts in via these attributes:
 *
 *   data-i18n="key"                 → element.textContent
 *   data-i18n-html="key"            → element.innerHTML (use sparingly)
 *   data-i18n-aria-label="key"      → aria-label attribute
 *   data-i18n-placeholder="key"     → placeholder attribute
 *   data-i18n-title="key"           → title attribute
 *   data-i18n-content="key"         → content attribute (for <meta>)
 *
 * Each element may also expose a `data-i18n-params` JSON attribute that
 * provides values for {placeholder} substitution.
 */
export function applyTranslations(root = document) {
  const scope = root.querySelectorAll ? root : document;

  scope.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n, readParams(el));
  });
  scope.querySelectorAll("[data-i18n-html]").forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml, readParams(el));
  });
  scope.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    el.setAttribute("aria-label", t(el.dataset.i18nAriaLabel, readParams(el)));
  });
  scope.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.setAttribute("placeholder", t(el.dataset.i18nPlaceholder, readParams(el)));
  });
  scope.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.setAttribute("title", t(el.dataset.i18nTitle, readParams(el)));
  });
  scope.querySelectorAll("[data-i18n-content]").forEach((el) => {
    el.setAttribute("content", t(el.dataset.i18nContent, readParams(el)));
  });
}

function readParams(el) {
  const raw = el.dataset.i18nParams;
  if (!raw) return undefined;
  try { return JSON.parse(raw); } catch { return undefined; }
}
