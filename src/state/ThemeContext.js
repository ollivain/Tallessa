import { createContext, useContext, useMemo } from 'react';
import { themes } from '../theme/themes';
import { colors as baseColors } from '../theme/designSystem';

const ThemeContext = createContext(null);

// Classic theme colours — computed once, never changes.
const CLASSIC_COLORS = Object.freeze({ ...baseColors, ...themes.classic });

/**
 * Wraps the app and provides the Classic theme colour tokens.
 * The mobile app uses only the Classic theme; the theme picker has been
 * removed. initialTheme is accepted but ignored — always resolves to classic.
 */
export function ThemeProvider({ children }) {
  const value = useMemo(
    () => ({
      themeKey:    'classic',
      setTheme:    () => {},   // no-op — kept so any stale callsite doesn't crash
      themeColors: CLASSIC_COLORS,
      themes,
    }),
    [],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Returns the active theme state (always Classic).
 * Safe to call outside a ThemeProvider — returns Classic fallback.
 */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      themeKey:    'classic',
      setTheme:    () => {},
      themeColors: CLASSIC_COLORS,
      themes,
    };
  }
  return ctx;
}
