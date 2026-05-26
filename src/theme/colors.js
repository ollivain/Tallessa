// Legacy colour shim — values are sourced from the shared design system so
// older consumers (App.js navTheme, PrimaryButton, LoadingScreen) match the
// PWA palette without duplicating the token list.
//
// New code should import from `theme/designSystem.js` instead. This file
// only stays around because removing it would break callers that still use
// the `accent` / `accentDark` / `surface` aliases. Every value below maps to
// a PWA custom property declared in styles.css.

import { colors as ds } from './designSystem';

export const colors = {
  // PWA --color-background / --cream
  background: ds.background,
  // PWA --color-surface / --sand
  surface:    ds.surface,
  // Slightly warmer surface tint — mirrors styles.css band gradient at top
  surfaceMuted: ds.backgroundWarm,
  // PWA --color-card
  card:       ds.card,
  // PWA --brown / --color-accent — used by selection chips and dividers
  accent:     ds.brown,
  // PWA --moss-dark / --color-primary — used by primary buttons and text
  accentDark: ds.mossDark,
  // PWA --color-primary / --moss-dark for primary text
  textPrimary: ds.textPrimary,
  // PWA --muted
  textMuted:   ds.textMuted,
  // Faint body text (mirrors selector-bird stroke tone)
  textSoft:    ds.textSoft,
  // PWA --line
  divider:     ds.divider,
  // PWA .danger-zone-label
  danger:      ds.danger,
};

export default colors;
