// Visual design tokens shared across every screen.
//
// Values are ported from the web/PWA version (styles.css) so the React Native
// surface stays in lockstep with the warm, paper-like Withen / Tallessa feel:
// soft cream paper background, ivory cards with big rounded corners, moss
// green primary, deep brown accents, muted body text.

import { Platform } from 'react-native';

export const colors = {
  // Paper / surface
  background: '#f2e8d7',        // --cream (CSS root)
  backgroundSoft: '#f6efde',    // mid-tone for subtle bands
  backgroundWarm: '#ede2cb',    // warmer footer tint near tab bar
  surface: '#e6d8c0',           // --sand
  card: '#fffaf0',              // --card (ivory)
  cardSoft: '#fffdf6',          // brightest ivory
  cardWarm: '#f8efdd',          // off-white with a beige cast

  // Ink / text
  textPrimary: '#26352a',       // --moss-dark
  textBody: '#2f362f',          // --text
  textMuted: '#65695d',         // --muted
  textSoft: '#9b8d72',          // faintest body text
  textOnImage: '#fffaf0',
  textOnPrimary: '#fffaf0',

  // Accents
  moss: '#586244',              // --moss / --color-primary-soft
  mossDark: '#26352a',          // --moss-dark / --color-primary
  brown: '#9a7657',             // --brown / --color-accent
  brownSoft: '#b89b70',

  // Lines / overlays
  divider: 'rgba(79, 83, 62, 0.14)',     // --line
  cardBorder: 'rgba(255, 250, 240, 0.74)',
  cardBorderSoft: 'rgba(255, 250, 240, 0.92)',
  hairline: 'rgba(48, 56, 45, 0.10)',

  // Hero gradient (stacked overlays — RN has no native gradient without an
  // extra dep; we approximate the CSS `linear-gradient(180deg, rgba(37,42,31,
  // .08) 24%, rgba(37,42,31,.72) 100%)` with five stepped bands).
  heroOverlayBands: [
    'rgba(37, 42, 31, 0.04)',
    'rgba(37, 42, 31, 0.12)',
    'rgba(37, 42, 31, 0.28)',
    'rgba(37, 42, 31, 0.48)',
    'rgba(37, 42, 31, 0.68)',
  ],

  // Eyebrow pill
  pillBg: 'rgba(224, 216, 196, 0.78)',
  pillText: 'rgba(48, 56, 45, 0.82)',

  // Tab bar
  tabBg: 'rgba(255, 250, 240, 0.96)',
  tabBgInactive: 'rgba(255, 250, 240, 0.78)',
  tabActiveBg: 'rgba(88, 98, 68, 0.10)',
  tabActiveText: '#26352a',
  tabInactiveText: '#7a6555',

  // Feedback
  danger: '#8f4d38',
  dangerSoft: 'rgba(252, 236, 230, 0.72)',
};

export const typography = {
  // Custom Google Fonts aren't loaded via expo-font in this build, so we map
  // to platform fonts that approximate the web look:
  // - serif: iOS "Georgia" / Android "serif" (Roboto Serif on modern Android)
  // - sans:  platform default (San Francisco / Roboto)
  // The web uses Cormorant Garamond + Manrope; if those are added to
  // expo-font later, just swap the strings below.
  serif: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'serif',
  }),
  serifItalic: Platform.select({
    ios: 'Georgia-Italic',
    android: 'serif',
    default: 'serif',
  }),
  sans: undefined, // system default

  sizes: {
    eyebrow: 11,
    label: 13,
    body: 15,
    bodyLarge: 16,
    quote: 22,
    title: 20,
    titleLarge: 26,
    display: 32,
    hero: 28,
  },

  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
  },

  letterSpacing: {
    eyebrow: 1.6,
    body: 0,
    title: 0.2,
  },

  lineHeights: {
    body: 22,
    bodyLarge: 24,
    title: 32,
    quote: 30,
  },
};

export const spacing = {
  xxxs: 2,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 44,
};

export const radii = {
  pill: 999,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,        // matches --card-radius equivalent in web (24px)
  xxl: 28,       // hero card
  xxxl: 32,
};

// Shadows tuned to the warm/sepia feel of the web (soft brown shadow rather
// than the default cold black RN drop shadow).
export const shadows = {
  soft: Platform.select({
    ios: {
      shadowColor: '#5a4a2a',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.10,
      shadowRadius: 18,
    },
    android: { elevation: 2 },
    default: {},
  }),
  card: Platform.select({
    ios: {
      shadowColor: '#5a4a2a',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.14,
      shadowRadius: 26,
    },
    android: { elevation: 4 },
    default: {},
  }),
  hero: Platform.select({
    ios: {
      shadowColor: '#3a2f1c',
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.22,
      shadowRadius: 36,
    },
    android: { elevation: 8 },
    default: {},
  }),
  tabBar: Platform.select({
    ios: {
      shadowColor: '#3a2f1c',
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: 0.10,
      shadowRadius: 18,
    },
    android: { elevation: 12 },
    default: {},
  }),
};

// Reusable style fragments.
export const cardStyles = {
  base: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    ...shadows.soft,
  },
  raised: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    ...shadows.card,
  },
  warm: {
    backgroundColor: colors.cardWarm,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.cardBorderSoft,
    padding: spacing.md,
    ...shadows.soft,
  },
};

export const buttonStyles = {
  primary: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.moss,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  primaryLabel: {
    color: colors.textOnPrimary,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.3,
  },
  secondary: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255, 252, 246, 0.90)',
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    color: colors.textPrimary,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.3,
  },
  ghost: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
};

export const inputStyles = {
  base: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: 'rgba(255, 252, 246, 0.88)',
    color: colors.textBody,
    fontSize: typography.sizes.bodyLarge,
  },
  label: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
};

export const screenStyles = {
  // Used by AppScreen as the outer wrapper background.
  base: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Content container for ScrollView with comfortable side gutters.
  scroll: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 120, // leaves room for the floating-ish tab bar
  },
};

// Tab bar styling (consumed by MainTabs.js).
export const tabBarStyle = {
  container: {
    backgroundColor: colors.tabBg,
    borderTopWidth: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingHorizontal: 8,
    ...shadows.tabBar,
  },
  itemBase: {
    flex: 1,
    minHeight: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  itemActive: {
    backgroundColor: colors.tabActiveBg,
  },
  label: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 2,
    color: colors.tabInactiveText,
  },
  labelActive: {
    color: colors.tabActiveText,
    fontWeight: '800',
  },
};

// One default export keeps imports compact when you only want the bag of
// tokens; named imports are still preferred for clarity.
export default {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  cardStyles,
  buttonStyles,
  inputStyles,
  screenStyles,
  tabBarStyle,
};
