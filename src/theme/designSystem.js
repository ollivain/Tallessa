// Visual design tokens shared across every screen.
//
// Values are ported 1:1 from the PWA stylesheet (styles.css) so that the
// React Native surface is a direct clone of the warm, paper-like
// Withen / Tallessa look. Every numeric value below has a comment that
// points to the PWA CSS line it mirrors, so future drift is easy to
// catch by diffing against styles.css.

import { Platform } from 'react-native';

// ── Colour tokens ─────────────────────────────────────────────────────────
// Values mirror styles.css `:root` and `.theme-classic` custom properties.
// Per-theme overrides live in theme/themes.js and are merged on top of these
// in ThemeContext.
export const colors = {
  // Paper / surfaces — PWA --cream / --sand / --card (root + theme-classic)
  background:     '#f2e8d7',                    // --color-background
  backgroundSoft: '#f6efde',                    // mid-tone for subtle bands
  backgroundWarm: '#ede2cb',                    // warmer footer tint near tab bar
  surface:        '#e6d8c0',                    // --color-surface / --sand
  card:           '#fffaf0',                    // --color-card
  cardSoft:       '#fffdf6',                    // brightest ivory
  cardWarm:       '#f8efdd',                    // off-white with a beige cast

  // Ink / text — PWA --text / --muted
  textPrimary:    '#26352a',                    // --color-primary (theme-classic)
  textBody:       '#2f362f',                    // --text
  textMuted:      '#65695d',                    // --muted
  textSoft:       '#9b8d72',                    // faintest body text (selector-bird stroke tone)
  textOnImage:    '#fffaf0',                    // overlay text on hero/memorial backgrounds
  textOnPrimary:  '#fffaf0',                    // text on moss buttons

  // Accents — PWA --moss / --moss-dark / --brown
  moss:           '#586244',                    // --color-primary-soft (root)
  mossDark:       '#26352a',                    // --color-primary
  brown:          '#9a7657',                    // --color-accent (root)
  brownSoft:      '#b89b70',

  // Lines / overlays — PWA --line
  divider:        'rgba(79, 83, 62, 0.14)',     // --line
  cardBorder:     'rgba(255, 250, 240, 0.72)',  // .memory-of-day / .daily-quote border-color
  cardBorderSoft: 'rgba(255, 250, 240, 0.72)',  // warm card border
  hairline:       'rgba(48, 56, 45, 0.10)',     // section-button shadow contour

  // Hero gradient bands — PWA `linear-gradient(180deg, rgba(37,42,31,.08) 24%,
  // rgba(37,42,31,.72) 100%)` (.hero-image).
  // PWA parity approximation: RN has no native multi-stop gradient without an
  // extra dep, so the gradient is sliced into ten translucent stepped bands.
  // Values calculated from the CSS gradient: 0–24% is constant 0.08, then
  // linear from 0.08 → 0.72 over 24–100%.
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

  // Eyebrow pill — PWA .memory-of-day .eyebrow / .daily-quote .eyebrow
  pillBg:   'rgba(224, 216, 196, 0.72)',
  pillText: 'rgba(48, 56, 45, 0.78)',

  // Tab bar — PWA .bottom-nav
  // PWA parity approximation: the PWA layers a 22px backdrop-filter blur on
  // top of `rgba(255,250,240,0.78)` so the cream stays *opaque-looking* in
  // practice. RN has no native blur, so a translucent fill leaks content
  // through the bar and makes scroll text appear behind the icons.
  // Using a fully-opaque cream matches the visual result while keeping the
  // PWA palette.
  tabBg:            '#fffaf0',
  tabBgInactive:    '#fffaf0',
  tabActiveBg:      'rgba(88, 98, 68, 0.10)',   // .bottom-nav button.is-active
  tabActiveText:    '#26352a',
  tabInactiveText:  'rgba(101, 105, 93, 0.72)', // color-mix(muted 72%, cream 28%)
  tabBorderTop:     'rgba(255, 250, 240, 0.62)', // .bottom-nav border-top

  // Feedback — PWA .danger-action / .danger-zone (styles.css ~L1273+)
  danger:        '#8f4d38',                      // .danger-zone-label colour
  dangerSoft:    'rgba(252, 236, 230, 0.72)',    // .danger-action background
  dangerSolid:   '#98543f',                      // .danger-action--solid bg
  dangerOnSolid: '#fff8f3',                      // .danger-action--solid colour
};

// ── Typography ────────────────────────────────────────────────────────────
// The PWA uses Cormorant Garamond (serif), Manrope (sans) and Alex Brush
// (script). Those Google Fonts are not bundled in this Expo build, so we map
// to the closest native fallbacks. To load the real fonts later, plug in
// expo-font and swap the string values below.
//
// PWA parity approximation: serif maps to Georgia / Android "serif"; script
// maps to italic serif (Alex Brush is decorative italic).
export const typography = {
  serif: Platform.select({
    ios:     'Georgia',
    android: 'serif',
    default: 'serif',
  }),
  serifItalic: Platform.select({
    ios:     'Georgia-Italic',
    android: 'serif',
    default: 'serif',
  }),
  // PWA --script ("Authenia Textured", "Alex Brush"). Without expo-font we
  // approximate with the italic serif. Replace once expo-font is wired up.
  script: Platform.select({
    ios:     'Georgia-Italic',
    android: 'serif',
    default: 'serif',
  }),
  // System sans serif (San Francisco / Roboto) — PWA --font-body Manrope
  // PWA parity approximation: Manrope is not bundled, falls back to system.
  sans: undefined,

  // Font sizes mirror PWA `clamp()` values at the typical phone width
  // (~390pt content). Each entry references its PWA source.
  sizes: {
    eyebrow:      11,   // PWA .eyebrow: 0.72rem ≈ 11px
    eyebrowSmall: 10,   // PWA .memory-of-day .eyebrow / .daily-quote .eyebrow: 0.62rem ≈ 10px
    label:        13,   // PWA <label> span: 0.86rem ≈ 14px (rounded down)
    footnote:     12,   // PWA .calendar-photos-note / .danger-zone p: 0.82rem
    body:         15,   // PWA body: 1rem (font-size:max(1rem,16px))
    bodyLarge:    16,   // PWA inputs / textarea: 16px (no-zoom guard)
    input:        16,   // PWA input/textarea font-size
    title:        22,   // PWA h3: 1.35rem ≈ 22px
    titleLarge:   26,   // PWA .selector-empty h2: 2rem ≈ 32px → reduced for RN-modal titles
    h2:           36,   // PWA h2: 2.25rem ≈ 36px
    h1Hero:       52,   // PWA h1 (.hero-copy): clamp(3.3rem,17vw,5.1rem) lower ≈ 53
    h1Selector:   74,   // PWA .selector-hero h1: clamp(4.6rem,20vw,6.7rem) ≈ 74 at 390px
    italicNote:   18,   // PWA .date-line / .italic-note: 1.12rem ≈ 18px
    blockquote:   22,   // PWA .daily-quote blockquote: clamp(1.28rem,5.6vw,1.75rem) ≈ 22
    memoryOfDay:  22,   // PWA .memory-of-day h3: clamp(1.28rem,6vw,1.72rem) ≈ 22
    heroLine:     24,   // PWA .hero-memory-line: clamp(1.45rem,6vw,2rem) ≈ 24
    selectorSub:  18,   // PWA .selector-hero p: clamp(1.1rem,4.7vw,1.42rem) ≈ 18
    sectionLabel: 15,   // PWA .section-button last span: clamp(0.9rem,3.8vw,1.05rem) ≈ 15
    navLabel:     11,   // PWA .bottom-nav button: 0.68rem ≈ 11px
    primaryBtn:   17,   // PWA .primary-action.selector-add: 1.08rem ≈ 17px
    scriptEyebrow:23,   // PWA .screen[data-screen="memorial"] .topbar .eyebrow: 1.45rem ≈ 23
    candleCaption:13,   // PWA delete-action label
  },

  // PWA only uses values 400, 500, 600, 700, 800 (650 on .bottom-nav button).
  // RN accepts 100-step weights only; 650 → '600' as a PWA parity approximation.
  weights: {
    regular:  '400',
    medium:   '500',
    semibold: '600',
    bold:     '700',
    heavy:    '800',
  },

  // PWA letter-spacing in ems → RN-absolute px (assumes 16px base font)
  letterSpacing: {
    eyebrow:    1.28,   // PWA .eyebrow: 0.08em ≈ 1.28px @ 16px
    eyebrowPill:1.10,   // PWA .memory-of-day .eyebrow: 0.11em ≈ 1.76px @ 16px
    title:      0,      // PWA h2/h3 letter-spacing: 0
    body:       0,
    navStrong:  0.08,   // PWA .switch-pill / .memory-switch-button uppercase
  },

  // Line-height tokens — PWA uses `line-height` numeric multipliers:
  // - body 1.55, hero 1.45, h2 1.02, h3 1.12, hero h1 0.96, selector h1 0.82
  // RN uses absolute px; we provide rendered targets here.
  lineHeights: {
    body:        22,    // PWA body p: 1.55
    bodyLarge:   24,
    title:       25,    // PWA h3: 1.12 × 22 = 24.64
    h2:          37,    // PWA h2: 1.02 × 36 = 36.72
    h1Hero:      50,    // PWA hero h1: 0.96 × 52 = 49.92
    h1Selector:  61,    // PWA .selector-hero h1: 0.82 × 74 = 60.68
    quote:       27,    // PWA daily-quote blockquote: 1.2 × 22 = 26.4
    italicNote:  21,    // PWA .date-line: 1.18 × 18 = 21.24
  },
};

// ── Spacing ───────────────────────────────────────────────────────────────
// PWA --shell-padding-* and screen padding patterns:
//   --shell-padding-top:   max(18px, safe-area-top + 14px)
//   --shell-padding-right: max(16px, safe-area-right + 12px)
//   --shell-padding-left:  max(16px, safe-area-left + 12px)
//   padding-bottom:        calc(150px + safe-area-bottom)
// Spacing scale is kept compact so consumer screens reference one ladder.
export const spacing = {
  xxxs: 2,
  xxs:  4,
  xs:   8,
  sm:   12,
  md:   16,    // PWA shell horizontal padding floor
  lg:   20,
  xl:   24,
  xxl:  32,
  xxxl: 44,
};

// PWA's exact screen padding values (used by AppScreen / screenStyles)
export const screenPadding = {
  top:        18,   // PWA --shell-padding-top floor
  right:      16,   // PWA --shell-padding-right floor
  left:       16,   // PWA --shell-padding-left floor
  bottomNav:  150,  // PWA shell padding-bottom: calc(150px + safe-area-bottom)
};

// ── Border radii ──────────────────────────────────────────────────────────
// All values are PWA-exact, mapped to semantic names so callers stop using
// raw numbers in screen files.
export const radii = {
  pill:    999,   // .bottom-nav.is-active 999 / pills generally
  xs:      8,
  sm:      12,
  dayCell: 13,    // PWA .day-cell: border-radius 13px
  input:   14,    // PWA input/textarea: border-radius 14px
  small:   14,
  navItem: 15,    // PWA .bottom-nav button: border-radius 15px
  button:  17,    // PWA .primary-action / .section-button: border-radius 17px
  md:      17,    // alias for button — keep existing callers working
  secondary: 16,  // PWA .danger-action / .secondary-action: border-radius 16px
  lg:      18,    // PWA .theme-card / .memory-draft-preview: border-radius 18px
  cardSm:  18,
  memoryImg: 22,  // PWA .memorial-image / .memory-of-day: border-radius 22px
  card:    24,    // PWA .card / .add-card-toggle / .calendar-card: border-radius 24px
  xl:      24,
  hero:    28,    // PWA .hero / .primary-action.selector-add / .memorial-place-card: 28-30px
  xxl:     28,
  selectorCard: 30, // PWA .memorial-place-card: border-radius 30px
  xxxl:    32,
};

// ── Shadows ───────────────────────────────────────────────────────────────
// PWA --shadow / --soft-shadow / button + nav shadows.
// Each entry below explicitly references its PWA box-shadow rule.
export const shadows = {
  // PWA --soft-shadow: 0 12px 30px rgba(83,73,55,0.08)
  soft: Platform.select({
    ios: {
      shadowColor:   '#534937',
      shadowOffset:  { width: 0, height: 12 },
      shadowOpacity: 0.08,
      shadowRadius:  12,
    },
    android: { elevation: 2 },
    default: {},
  }),
  // PWA --shadow: 0 18px 48px rgba(83,73,55,0.13)
  card: Platform.select({
    ios: {
      shadowColor:   '#534937',
      shadowOffset:  { width: 0, height: 18 },
      shadowOpacity: 0.13,
      shadowRadius:  16,
    },
    android: { elevation: 4 },
    default: {},
  }),
  // PWA .primary-action: box-shadow 0 13px 30px rgba(88,98,68,0.18)
  button: Platform.select({
    ios: {
      shadowColor:   '#586244',
      shadowOffset:  { width: 0, height: 13 },
      shadowOpacity: 0.18,
      shadowRadius:  10,
    },
    android: { elevation: 6 },
    default: {},
  }),
  // PWA .hero / .selector-hero h1 / .selector-add deep elevation:
  //   .hero box-shadow: 0 18px 44px rgba(55,48,35,0.13)
  //   .memorial-card box-shadow: 0 22px 60px rgba(55,48,35,0.20)
  // We expose the deeper variant for hero/memorial cards.
  hero: Platform.select({
    ios: {
      shadowColor:   '#373023',
      shadowOffset:  { width: 0, height: 22 },
      shadowOpacity: 0.20,
      shadowRadius:  24,
    },
    android: { elevation: 8 },
    default: {},
  }),
  // PWA .memorial-place-card: 0 22px 46px rgba(62,53,36,0.18), 0 7px 16px rgba(62,53,36,0.08)
  // PWA parity approximation: RN supports only one shadow per view, so we
  // merge into the larger of the two. The 7px inner glow / 1px inset are
  // dropped (no native equivalent without overlay views).
  selectorCard: Platform.select({
    ios: {
      shadowColor:   '#3e3524',
      shadowOffset:  { width: 0, height: 22 },
      shadowOpacity: 0.18,
      shadowRadius:  23,
    },
    android: { elevation: 6 },
    default: {},
  }),
  // PWA .bottom-nav: 0 -8px 26px rgba(55,48,35,0.08)
  tabBar: Platform.select({
    ios: {
      shadowColor:   '#373023',
      shadowOffset:  { width: 0, height: -8 },
      shadowOpacity: 0.08,
      shadowRadius:  10,
    },
    android: { elevation: 8 },
    default: {},
  }),
  // PWA .delete-action: 0 10px 22px rgba(83,73,55,0.18)
  pill: Platform.select({
    ios: {
      shadowColor:   '#534937',
      shadowOffset:  { width: 0, height: 10 },
      shadowOpacity: 0.18,
      shadowRadius:  10,
    },
    android: { elevation: 3 },
    default: {},
  }),
};

// ── Reusable style fragments ──────────────────────────────────────────────
// `cardStyles.base` mirrors PWA .card; `warm` mirrors .daily-quote /
// .memory-of-day border-color rgba(255,250,240,0.72).
export const cardStyles = {
  base: {
    backgroundColor: colors.card,
    borderRadius:    radii.card,
    borderWidth:     1,
    borderColor:     colors.divider,
    padding:         spacing.md,
    ...shadows.soft,
  },
  raised: {
    backgroundColor: colors.card,
    borderRadius:    radii.card,
    borderWidth:     1,
    borderColor:     colors.divider,
    padding:         spacing.md,
    ...shadows.card,
  },
  warm: {
    backgroundColor: colors.cardWarm,
    borderRadius:    radii.card,
    borderWidth:     1,
    borderColor:     colors.cardBorder,
    padding:         spacing.md,
    ...shadows.soft,
  },
};

// PWA .primary-action: min-height implied by 13px+13px padding ≈ 52px,
// border-radius 17px, font-weight 700, color #fffaf0, bg var(--moss),
// box-shadow var(button shadow).
// PWA .secondary-action: min-height 48px, border-radius 16px.
export const buttonStyles = {
  primary: {
    minHeight:       52,
    paddingHorizontal: spacing.lg,
    borderRadius:    radii.button,
    backgroundColor: colors.moss,
    alignItems:      'center',
    justifyContent:  'center',
    ...shadows.button,
  },
  primaryLabel: {
    color:        colors.textOnPrimary,
    fontSize:     typography.sizes.body,
    fontWeight:   typography.weights.bold,
    letterSpacing: 0.3,
  },
  secondary: {
    minHeight:       48,
    paddingHorizontal: spacing.lg,
    borderRadius:    radii.secondary,
    backgroundColor: 'rgba(255, 252, 246, 0.90)',
    borderWidth:     1,
    borderColor:     colors.divider,
    alignItems:      'center',
    justifyContent:  'center',
  },
  secondaryLabel: {
    color:        colors.textPrimary,
    fontSize:     typography.sizes.body,
    fontWeight:   typography.weights.bold,
    letterSpacing: 0.3,
  },
  ghost: {
    minHeight:        44,
    paddingHorizontal: spacing.md,
    borderRadius:     radii.button,
    backgroundColor:  'transparent',
    alignItems:       'center',
    justifyContent:   'center',
  },
  ghostLabel: {
    color:        colors.textMuted,
    fontSize:     typography.sizes.label,
    fontWeight:   typography.weights.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
};

// PWA input/textarea/select base styles (styles.css ~L178+):
//   border: 1px solid var(--line)
//   border-radius: 14px
//   padding: 13px 14px
//   color: var(--text)
//   background: rgba(255, 252, 246, 0.88)
//   font-size: max(1rem, 16px)
export const inputStyles = {
  base: {
    minHeight:       48,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius:    radii.input,
    borderWidth:     1,
    borderColor:     colors.divider,
    backgroundColor: 'rgba(255, 252, 246, 0.88)',
    color:           colors.textBody,
    fontSize:        typography.sizes.input,
  },
  label: {
    // PWA <label> > span: 0.86rem ≈ 14px, font-weight 700, color --moss-dark
    fontSize:   typography.sizes.label,
    fontWeight: typography.weights.bold,
    color:      colors.textPrimary,
    marginBottom: spacing.xs,
  },
};

// Outer wrapper styling — PWA .phone-shell (max-width 460, centred).
// The watercolour backgrounds are applied per screen via AppScreen.
export const screenStyles = {
  base: {
    flex:            1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: screenPadding.left,
    paddingTop:        spacing.md,
    paddingBottom:     screenPadding.bottomNav,
  },
};

// PWA .bottom-nav: 5-column grid, max-width 452, padding 6 6 max(7,safe-bottom)
// border-radius 24 24 0 0, background rgba(255,250,240,0.78), shadow tabBar.
export const tabBarStyle = {
  container: {
    backgroundColor:   colors.tabBg,
    borderTopWidth:    1,
    borderTopColor:    colors.tabBorderTop,
    borderTopLeftRadius:  radii.card,
    borderTopRightRadius: radii.card,
    paddingTop:        6,
    paddingHorizontal: 6,
    maxWidth:          452,         // PWA .bottom-nav max-width
    alignSelf:         'center',    // mirror PWA margin: 0 auto on container
    ...shadows.tabBar,
  },
  itemBase: {
    flex:            1,
    minHeight:       44,
    borderRadius:    radii.navItem,
    alignItems:      'center',
    justifyContent:  'center',
    paddingVertical: 5,
    paddingHorizontal: 2,
  },
  itemActive: {
    backgroundColor: colors.tabActiveBg,
  },
  label: {
    fontSize:   typography.sizes.navLabel,
    // PWA .bottom-nav button uses font-weight 650. RN accepts only multiples
    // of 100 — '600' is the closest valid weight. See PWA parity note above.
    fontWeight: typography.weights.semibold,
    color:      colors.tabInactiveText,
    lineHeight: 13,
  },
  labelActive: {
    color:      colors.tabActiveText,
    fontWeight: typography.weights.heavy,
  },
};

export default {
  colors,
  typography,
  spacing,
  screenPadding,
  radii,
  shadows,
  cardStyles,
  buttonStyles,
  inputStyles,
  screenStyles,
  tabBarStyle,
};
