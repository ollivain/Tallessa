// Five visual themes mirroring the PWA theme picker.
//
// Colours are ported directly from PWA styles.css custom properties:
//   moss        → --color-primary-soft (lighter accent / button colour)
//   mossDark    → --color-primary      (deep text / strong accent)
//   brown       → --color-accent       (warm secondary accent)
//   background  → --color-background
//   card        → --color-card
//   divider     → --line               (theme-agnostic in PWA — listed here
//                                      so the theme object stays self-contained)
//   textPrimary → --color-primary (used as ink colour for headlines)
//   tabActive*  → derived from each theme's primary tone with a 10% mix
//
// These tokens are merged on top of the base design-system colours inside
// ThemeContext, so any colour key not present in a theme falls back to the
// design-system default.

export const THEME_KEYS = ['classic', 'timeless', 'soft', 'modern', 'romantic'];

// PWA --line is the same across every theme — declared here once so each
// theme object stays self-contained.
const DIVIDER = 'rgba(79, 83, 62, 0.14)';

export const themes = {
  classic: {
    key:           'classic',
    // PWA .theme-classic --color-primary-soft: #586a49 (overrides root #586244)
    accentHex:     '#586a49',
    moss:          '#586a49',
    mossDark:      '#26352a',   // --color-primary
    brown:         '#987557',   // --color-accent
    textPrimary:   '#26352a',
    background:    '#f2e8d7',   // --color-background
    card:          '#fffaf0',   // --color-card
    divider:       DIVIDER,
    tabActiveBg:   'rgba(88, 106, 73, 0.10)',
    tabActiveText: '#26352a',
  },

  timeless: {
    key:           'timeless',
    accentHex:     '#6f7a57',
    moss:          '#6f7a57',
    mossDark:      '#3f4b35',
    brown:         '#84785a',
    textPrimary:   '#3f4b35',
    background:    '#f1eadb',
    card:          '#fffaf0',
    divider:       DIVIDER,
    tabActiveBg:   'rgba(111, 122, 87, 0.10)',
    tabActiveText: '#3f4b35',
  },

  soft: {
    key:           'soft',
    accentHex:     '#8c604d',
    moss:          '#8c604d',
    mossDark:      '#704b3c',
    brown:         '#b26b4f',
    textPrimary:   '#704b3c',
    background:    '#f4e5d4',
    card:          '#fff8ef',
    divider:       DIVIDER,
    tabActiveBg:   'rgba(140, 96, 77, 0.10)',
    tabActiveText: '#704b3c',
  },

  modern: {
    key:           'modern',
    accentHex:     '#35686a',
    moss:          '#35686a',
    mossDark:      '#173f42',
    brown:         '#7d8c72',
    textPrimary:   '#173f42',
    background:    '#e8ece2',
    card:          '#fbfaf1',
    divider:       DIVIDER,
    tabActiveBg:   'rgba(53, 104, 106, 0.10)',
    tabActiveText: '#173f42',
  },

  romantic: {
    key:           'romantic',
    accentHex:     '#8f6673',
    moss:          '#8f6673',
    mossDark:      '#6f4b58',
    brown:         '#b38491',
    textPrimary:   '#6f4b58',
    background:    '#f4e4df',
    card:          '#fff8f2',
    divider:       DIVIDER,
    tabActiveBg:   'rgba(143, 102, 115, 0.10)',
    tabActiveText: '#6f4b58',
  },
};

export default themes;
