import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { saveSettings } from '../storage/storage';
import { themes, THEME_KEYS } from '../theme/themes';
import { colors as baseColors } from '../theme/designSystem';

const ThemeContext = createContext(null);

/**
 * Wraps the app and provides the active theme name + computed colour tokens.
 * initialTheme is loaded from AsyncStorage settings in App.js before mount
 * so there is no flash-of-wrong-theme on startup.
 */
export function ThemeProvider({ initialTheme, children }) {
  const [themeKey, setThemeKey] = useState(() =>
    THEME_KEYS.includes(initialTheme) ? initialTheme : 'classic',
  );

  const setTheme = useCallback((key) => {
    const resolved = THEME_KEYS.includes(key) ? key : 'classic';
    setThemeKey(resolved);
    // Persist alongside language (saveSettings merges, not overwrites)
    saveSettings({ theme: resolved });
  }, []);

  // Merge base design-system colours with per-theme overrides so consumers
  // can use themeColors as a drop-in replacement for the static `colors`.
  const themeColors = useMemo(
    () => ({ ...baseColors, ...themes[themeKey] }),
    [themeKey],
  );

  const value = useMemo(
    () => ({ themeKey, setTheme, themeColors, themes }),
    [themeKey, setTheme, themeColors],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Returns the active theme state.
 * Provides a Classic-theme fallback when called outside a ThemeProvider so
 * components are safe in test/storybook contexts.
 */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      themeKey: 'classic',
      setTheme: () => {},
      themeColors: { ...baseColors, ...themes.classic },
      themes,
    };
  }
  return ctx;
}
