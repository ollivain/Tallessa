// Five visual themes matching the PWA theme picker.
// Colours ported directly from PWA styles.css custom properties:
//   moss      = --color-primary-soft (lighter accent / button colour)
//   mossDark  = --color-primary      (deep dark text / strong accent)
//   brown     = --color-accent       (warm secondary accent)
//   background = --color-background
//   card       = --color-card
// These are merged on top of the base design-system tokens in ThemeContext.

export const THEME_KEYS = ['classic', 'timeless', 'soft', 'modern', 'romantic'];

export const themes = {
  classic: {
    key:           'classic',
    accentHex:     '#586a49',   // --color-primary-soft
    moss:          '#586a49',
    mossDark:      '#26352a',   // --color-primary
    brown:         '#987557',   // --color-accent
    textPrimary:   '#26352a',
    background:    '#f2e8d7',   // --color-background
    card:          '#fffaf0',   // --color-card
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
    tabActiveBg:   'rgba(143, 102, 115, 0.10)',
    tabActiveText: '#6f4b58',
  },
};
