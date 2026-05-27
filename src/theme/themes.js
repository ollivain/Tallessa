// Visual theme for the mobile app — Classic only.
//
// All other themes (timeless, soft, modern, romantic) have been removed from
// the mobile build. The app always uses the Classic (forest-green / amber-
// ivory candle) palette. Per-theme overrides are merged on top of the base
// design-system colours in ThemeContext.

export const THEME_KEYS = ['classic'];

export const themes = {
  classic: {
    key:           'classic',
    // ── Forest green identity ──────────────────────────────────────────────
    // Warm amber-ivory cards, golden beige background. The "default" candle look.
    accentHex:     '#586a49',
    moss:          '#586a49',
    mossDark:      '#26352a',
    brown:         '#987557',
    textPrimary:   '#26352a',
    background:    '#f3e8d4',           // warm golden-beige
    card:          '#fff4e3',           // amber-ivory card
    divider:       'rgba(79, 83, 62, 0.14)',
    tabActiveBg:   'rgba(88, 106, 73, 0.10)',
    tabActiveText: '#26352a',
    // Warm semantic tokens — amber candle palette
    surfaceWarm:   '#f8e8cf',           // slightly richer warm surface
    overlayWarm:   'rgba(255, 244, 222, 0.97)',
    borderWarm:    'rgba(192, 152, 80, 0.22)',
    shadowWarm:    '#7a5435',
    candleGlow:    'rgba(196, 154, 60, 0.10)',
  },
};

export default themes;
