import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useI18n } from '../i18n';
import { useMemorials } from '../state/MemorialContext';
import AppScreen from '../components/AppScreen';
import AppCard from '../components/AppCard';
import SectionLabel from '../components/SectionLabel';
import MemoryHeroCard from '../components/MemoryHeroCard';
import {
  colors,
  radii,
  shadows,
  spacing,
  typography,
} from '../theme/designSystem';
import { useTheme } from '../state/ThemeContext';
import { getHeroImage, getHomeMemoryOfDay, getMemorialName, toPossessive } from '../models/memorial';

const HERO_FALLBACK = require('../../assets/bg-koti.png');
const SCREEN_BG = require('../../assets/bg-koti.png');

// HomeScreen mirrors styles.css `.home-memory-stack`:
//   .hero (memory hero card) overlaps the .memory-of-day card by 34px.
// Then comes .daily-quote, then a 2×2 .quick-actions grid.
export default function HomeScreen() {
  const { t, language, getDailyQuote } = useI18n();
  const { activeMemorial } = useMemorials();
  const navigation = useNavigation();

  const name = getMemorialName(activeMemorial);
  const heroLine = name
    ? t('home.heroMemoryLine', { name })
    : t('tagline');

  const portraitUri = getHeroImage(activeMemorial);
  const heroImage = portraitUri ? { uri: portraitUri } : null;

  const memories = activeMemorial?.memories ?? [];
  const memoryOfDay = getHomeMemoryOfDay(memories);
  const possessiveName = toPossessive(name, language);

  return (
    <AppScreen background={SCREEN_BG}>
      <MemoryHeroCard
        imageSource={heroImage}
        fallbackSource={HERO_FALLBACK}
        imagePosition={activeMemorial?.heroImagePosition}
        memoryLine={heroLine}
      />

      <MemoryOfDayCard
        memory={memoryOfDay}
        eyebrow={t('home.memoryOfDay')}
        title={t('home.memoryOfDayTitle', { name: possessiveName })}
        emptyBody={t('home.memoryEmpty')}
        openLabel={t('home.openMemory')}
        onPress={() => navigation.navigate('Wall', memoryOfDay ? { highlightMemoryId: memoryOfDay.id } : undefined)}
      />

      <DailyQuoteCard
        eyebrow={t('home.dailyQuote')}
        quote={getDailyQuote()}
      />

      <View style={styles.actions}>
        <ActionTile
          icon="image"
          label={t('home.action.wall')}
          onPress={() => navigation.navigate('Wall')}
        />
        <ActionTile
          icon="mail"
          label={t('home.action.letters')}
          onPress={() => navigation.navigate('Letters')}
        />
        <ActionTile
          icon="calendar"
          label={t('home.action.calendar')}
          onPress={() => navigation.navigate('Calendar')}
        />
        <ActionTile
          icon="heart"
          label={t('home.action.memorial', { name: possessiveName })}
          onPress={() => navigation.navigate('Memorial')}
        />
      </View>
    </AppScreen>
  );
}

// PWA `.memory-of-day` is a 2-column grid:
//   col 1 (.memory-of-day-copy): eyebrow pill + h3 + body + "Open →" link
//   col 2 (.daily-memory-element): decorative botanical shape + chevron (›)
// We mirror that by laying out a horizontal Row with both halves.
function MemoryOfDayCard({ memory, eyebrow, title, emptyBody, openLabel, onPress }) {
  const { themeColors } = useTheme();
  const hasMemory = !!memory;
  const body = memory?.text || emptyBody;
  return (
    <AppCard
      variant="soft"
      onPress={onPress}
      style={styles.memoryCard}
      contentStyle={styles.memoryCardContent}
    >
      {/* col 1 — copy block (matches PWA `.memory-of-day-copy`) */}
      <View style={styles.memoryCopy}>
        <SectionLabel variant="pill" style={styles.eyebrow}>{eyebrow}</SectionLabel>
        <Text
          style={[styles.memoryTitle, { color: themeColors.textPrimary }]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.84}
        >
          {title}
        </Text>
        <Text style={styles.memoryBody} numberOfLines={3}>{hasMemory ? body : emptyBody}</Text>
        {/* PWA: <span class="memory-of-day-link">Open memory <span>→</span></span> */}
        <View style={styles.openRow}>
          <Text style={[styles.openLink, { color: themeColors.moss }]}>{openLabel}</Text>
          <Text style={[styles.openArrow, { color: themeColors.moss }]}>→</Text>
        </View>
      </View>

      {/* col 2 — decorative element (matches PWA `.daily-memory-element` +
          `.memory-of-day-chevron`). PWA parity approximation: PWA uses a
          custom inline SVG of botanical leaves; we approximate with a
          quarter-circle background + Feather "feather" icon to evoke the
          same warm-paper decorative feel. */}
      <View style={styles.memoryDecor} pointerEvents="none">
        <View style={styles.memoryDecorBg} />
        <Feather
          name="feather"
          size={36}
          color="rgba(154, 118, 87, 0.46)"
          style={styles.memoryDecorIcon}
        />
        <Text style={styles.memoryChevron}>›</Text>
      </View>
    </AppCard>
  );
}

// PWA `.daily-quote.card`: 14×16×16 padding, border-radius 22, light cream
// gradient, eyebrow pill + blockquote with italic serif accent.
function DailyQuoteCard({ eyebrow, quote }) {
  const { themeColors } = useTheme();
  return (
    <AppCard variant="warm" style={styles.quoteCard}>
      <SectionLabel variant="pill" style={styles.eyebrow}>{eyebrow}</SectionLabel>
      <Text style={[styles.quote, { color: themeColors.brown }]}>{`"${quote}"`}</Text>
    </AppCard>
  );
}

// PWA `.section-button`: 78px tall, 46×46 round icon, label + chevron (›).
// Icon gradient `linear-gradient(145deg, #687151, var(--moss-dark))` is
// approximated with a mid-tone solid colour (#47533e).
function ActionTile({ icon, label, onPress }) {
  const { themeColors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, { backgroundColor: themeColors.card }, pressed && styles.tilePressed]}
      accessibilityRole="button"
    >
      <View style={[styles.tileIcon, { backgroundColor: themeColors.mossDark }]}>
        <Feather name={icon} size={20} color={colors.textOnPrimary} />
      </View>
      <Text style={[styles.tileLabel, { color: themeColors.textPrimary }]} numberOfLines={1}>{label}</Text>
      <Text style={styles.tileChevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // PWA `.home-memory-stack .memory-of-day`:
  //   margin-top: -34px; padding-top: 48px; border-color: rgba(255,250,240,.72)
  memoryCard: {
    marginTop:    -34,
    paddingTop:   48,
    paddingBottom: 15,
    marginBottom: 14,
    borderRadius: radii.memoryImg,        // PWA 22px
    borderColor:  colors.cardBorder,
    padding:      0,
  },
  memoryCardContent: {
    flexDirection: 'row',
    alignItems:    'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop:    0,
    paddingBottom: 0,
  },
  memoryCopy: {
    flex:     1,
    minWidth: 0,
  },
  memoryDecor: {
    position: 'relative',
    width:    78,
    height:   86,
    marginRight: -9,
    marginBottom: -15,
    opacity:  0.56,
  },
  // PWA `.daily-memory-element::before { border-radius: 999px 0 0 0;
  // width:78px; height:78px; background:rgba(230,216,192,0.42) }`
  memoryDecorBg: {
    position: 'absolute',
    right:    -30,
    bottom:   0,
    width:    78,
    height:   78,
    borderTopLeftRadius: 999,
    backgroundColor: 'rgba(230, 216, 192, 0.42)',
  },
  memoryDecorIcon: {
    position: 'absolute',
    right:    4,
    bottom:   18,
  },
  // PWA `.memory-of-day-chevron`: bottom-right ›
  memoryChevron: {
    position: 'absolute',
    right:    -2,
    bottom:   2,
    fontSize: 28,
    color:    'rgba(48, 56, 45, 0.68)',
    fontFamily: typography.sans,
    fontWeight: typography.weights.medium,
    lineHeight: 28,
    includeFontPadding: false,
  },
  eyebrow: { marginBottom: 9 },
  // PWA `.memory-of-day h3 { font-size: clamp(1.28rem,6vw,1.72rem) }` ≈ 22
  memoryTitle: {
    fontFamily:   typography.serif,
    fontSize:     typography.sizes.memoryOfDay,
    lineHeight:   24,
    color:        colors.textPrimary,
    marginBottom: 6,
  },
  // PWA `.memory-of-day p:last-child { font-size: 0.82rem; line-height: 1.45 }`
  memoryBody: {
    fontSize:   typography.sizes.footnote,
    lineHeight: 18,
    color:      colors.textMuted,
  },
  // PWA `.memory-of-day-link { font-size: 0.78rem; font-weight: 800 }`
  openRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
    marginTop:     8,
  },
  openLink: {
    color:      colors.moss,
    fontSize:   12.5,
    fontWeight: typography.weights.heavy,
  },
  openArrow: {
    color:      colors.moss,
    fontSize:   15,
    fontWeight: typography.weights.heavy,
    lineHeight: 15,
  },
  // PWA `.daily-quote { padding: 14 16 16; border-radius: 22 }`
  quoteCard: {
    paddingTop:    14,
    paddingBottom: 16,
    marginBottom:  14,
    borderRadius:  radii.memoryImg,
  },
  // PWA `.daily-quote blockquote { font-size: clamp(1.28rem,5.6vw,1.75rem);
  //      font-style: italic; font-weight: 500; line-height: 1.2 }`
  quote: {
    fontFamily: typography.serif,
    fontStyle:  'italic',
    fontSize:   typography.sizes.blockquote,
    lineHeight: typography.lineHeights.quote,
    color:      colors.brown,
    fontWeight: typography.weights.medium,
  },
  // PWA `.quick-actions { grid-template-columns: repeat(2, 1fr); gap: 12 }`
  actions: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           12,
    marginBottom:  14,
  },
  // PWA `.section-button { min-height: 78; border-radius: 17;
  //       padding: 14 10 14 12; grid: 46 1fr 18 }`
  tile: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
    width:         '48%',
    flexGrow:      1,
    minHeight:     78,
    paddingVertical:   14,
    paddingLeft:       12,
    paddingRight:      10,
    borderRadius:      radii.button,
    borderWidth:       1,
    borderColor:       colors.cardBorder,
    backgroundColor:   'rgba(255, 250, 240, 0.72)',
    ...shadows.soft,
  },
  tilePressed: { transform: [{ scale: 0.98 }], opacity: 0.94 },
  // PWA `.button-icon { width: 46; height: 46; border-radius: 50% }`
  // PWA parity approximation: gradient (#687151 → #26352a) flattened to mid-tone.
  tileIcon: {
    width:           46,
    height:          46,
    borderRadius:    23,
    backgroundColor: '#47533e',
    alignItems:      'center',
    justifyContent:  'center',
  },
  // PWA `.section-button span:last-child { font-size: clamp(0.9rem,3.8vw,1.05rem) }`
  tileLabel: {
    flex:       1,
    fontFamily: typography.serif,
    fontSize:   typography.sizes.sectionLabel,
    fontWeight: typography.weights.bold,
    color:      colors.textPrimary,
  },
  // PWA `.section-button::after { content: '›'; font-size: 1.8rem }`
  tileChevron: {
    color:    'rgba(48, 56, 45, 0.72)',
    fontSize: 26,
    lineHeight: 26,
    includeFontPadding: false,
  },
});
