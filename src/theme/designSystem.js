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

  // Lines / overlays — values from PWA styles.css --line and card border overrides
  divider: 'rgba(79, 83, 62, 0.14)',      // --line (base card border, input border)
  cardBorder: 'rgba(255, 250, 240, 0.72)', // .memory-of-day, .daily-quote border-color
  cardBorderSoft: 'rgba(255, 250, 240, 0.72)', // warm variant border
  hairline: 'rgba(48, 56, 45, 0.10)',

  // Hero gradient (stacked overlays — RN has no native gradient without an
  // extra dep; we approximate the CSS `linear-gradient(180deg, rgba(37,42,31,
  // .08) 24%, rgba(37,42,31,.72) 100%)` with ten stepped bands.
  // Values calculated from the CSS gradient: 0–24% is constant 0.08, then
  // linear from 0.08 to 0.72 over 24%–100%. Ten bands, center at each 10% step.
  heroOverlayBands: [
    'rgba(37, 42, 31, 0.08)',
    'rgba(37, 42, 31, 0.08)',
    'rgba(37, 42, 31, 0.09)',
    'rgba(37, 42, 31, 0.17)',
    'rgba(37, 42, 31, 0.26)',
    'rgba(37, 42, 31, 0.34)',
    'rgba(37, 42, 31, 0.43)',
    'rgba(37, 42, 31, 0.51)',
    'rgba(37, 42, 31, 0.59)',
    'rgba(37, 42, 31, 0.68)',
  ],

  // Eyebrow pill
  pillBg: 'rgba(224, 216, 196, 0.78)',
  pillText: 'rgba(48, 56, 45, 0.82)',

  // Tab bar — PWA: background: rgba(255,250,240,0.78) backdrop-filter blur
  tabBg: 'rgba(255, 250, 240, 0.78)',
  tabBgInactive: 'rgba(255, 250, 240, 0.78)',
  tabActiveBg: 'rgba(88, 98, 68, 0.10)',
  tabActiveText: '#26352a',
  tabInactiveText: 'rgba(101, 105, 93, 0.72)',  // color-mix(muted 72%, cream 28%)

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
  md: 17,  // PWA: .primary-action, .section-button { border-radius: 17px }
  lg: 20,
  xl: 24,        // matches --card-radius equivalent in web (24px)
  xxl: 28,       // hero card
  xxxl: 32,
};

// Shadows tuned to the warm/sepia feel of the web (soft brown shadow rather
// than the default cold black RN drop shadow).
export const shadows = {
  // PWA --soft-shadow: 0 12px 30px rgba(83,73,55,0.08)
  soft: Platform.select({
    ios: {
      shadowColor: '#534937',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    android: { elevation: 2 },
    default: {},
  }),
  // PWA --shadow: 0 18px 48px rgba(83,73,55,0.13)
  card: Platform.select({
    ios: {
      shadowColor: '#534937',
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.13,
      shadowRadius: 16,
    },
    android: { elevation: 4 },
    default: {},
  }),
  // PWA .primary-action: box-shadow 0 13px 30px rgba(88,98,68,0.18)
  button: Platform.select({
    ios: {
      shadowColor: '#586244',
      shadowOffset: { width: 0, height: 13 },
      shadowOpacity: 0.18,
      shadowRadius: 10,
    },
    android: { elevation: 6 },
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
  // PWA: box-shadow 0 -8px 26px rgba(55,48,35,0.08)
  tabBar: Platform.select({
    ios: {
      shadowColor: '#373023',
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
    },
    android: { elevation: 8 },
    default: {},
  }),
};

// Reusable style fragments.
export const cardStyles = {
  // PWA: .card { border: 1px solid var(--line) } — dark subtle border
  base: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.md,
    ...shadows.soft,
  },
  raised: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: spacing.md,
    ...shadows.card,
  },
  // PWA: .daily-quote { border-color: rgba(255,250,240,0.72) } — light border
  warm: {
    backgroundColor: colors.cardWarm,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    ...shadows.soft,
  },
};

export const buttonStyles = {
  // PWA: .primary-action { border-radius: 17px; box-shadow: 0 13px 30px rgba(88,98,68,0.18) }
  primary: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.moss,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
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
  // PWA: phone-shell padding-bottom: calc(150px + safe-area-bottom)
  scroll: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 150,
  },
};

// Tab bar styling (consumed by MainTabs.js).
// PWA: .bottom-nav button { border-radius: 15px } .bottom-nav { background: rgba(255,250,240,0.78) }
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
