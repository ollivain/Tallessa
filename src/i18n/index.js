import { getLocales } from 'expo-localization';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { strings } from './strings';

const SUPPORTED = ['fi', 'en'];
const DEFAULT_LANGUAGE = 'en';

function detectInitialLanguage() {
  try {
    const locales = getLocales?.() ?? [];
    const tag = (locales[0]?.languageCode || '').toLowerCase();
    if (tag.startsWith('fi')) return 'fi';
  } catch {
    // expo-localization may be unavailable in some test environments
  }
  return DEFAULT_LANGUAGE;
}

function resolveKey(obj, key) {
  const parts = key.split('.');
  let cursor = obj;
  for (const part of parts) {
    if (cursor == null) return undefined;
    cursor = cursor[part];
  }
  return cursor;
}

function format(template, params) {
  if (params == null) return template;
  return String(template).replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
  );
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(detectInitialLanguage);

  const setLanguage = useCallback((next) => {
    setLanguageState(SUPPORTED.includes(next) ? next : DEFAULT_LANGUAGE);
  }, []);

  const t = useCallback(
    (key, params) => {
      const primary = resolveKey(strings[language], key);
      const fallback = primary ?? resolveKey(strings[DEFAULT_LANGUAGE], key);
      if (fallback == null) return key;
      return typeof fallback === 'string' ? format(fallback, params) : fallback;
    },
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
