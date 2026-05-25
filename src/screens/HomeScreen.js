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
  typography,
} from '../theme/designSystem';
import { useTheme } from '../state/ThemeContext';
import { getHeroImage, getMemorialName } from '../models/memorial';

// Default soft watercolour shipped with the app — used when the active
// memorial has no portrait of its own. Keeps the hero card feeling finished.
const HERO_FALLBACK = require('../../assets/bg-koti.png');
const SCREEN_BG = require('../../assets/bg-koti.png');

export default function HomeScreen() {
  const { t } = useI18n();
  const { activeMemorial } = useMemorials();
  const navigation = useNavigation();

  const name = getMemorialName(activeMemorial);
  const heroLine = name
    ? t('home.heroMemoryLine', { name })
    : t('tagline');

  const portraitUri = getHeroImage(activeMemorial);
  const heroImage = portraitUri ? { uri: portraitUri } : null;

  const latestMemory = activeMemorial?.memories?.[0] ?? null;

  return (
    <AppScreen background={SCREEN_BG}>
      <MemoryHeroCard
        imageSource={heroImage}
        fallbackSource={HERO_FALLBACK}
        memoryLine={heroLine}
      />

      <MemoryOfDayCard
        memory={latestMemory}
        eyebrow={t('home.memoryOfDay')}
        emptyBody={t('home.memoryEmpty')}
        openLabel={t('home.openMemory')}
        onPress={() => navigation.navigate('Wall')}
      />

      <DailyQuoteCard
        eyebrow={t('home.dailyQuote')}
        quote={t('quote')}
      />

      <View style={styles.actions}>
        <ActionTile
          icon="image"
          label={t('tab.wall')}
          onPress={() => navigation.navigate('Wall')}
        />
        <ActionTile
          icon="mail"
          label={t('tab.letters')}
          onPress={() => navigation.navigate('Letters')}
        />
        <ActionTile
          icon="calendar"
          label={t('tab.calendar')}
          onPress={() => navigation.navigate('Calendar')}
        />
        <ActionTile
          icon="heart"
          label={t('tab.memorial')}
          onPress={() => navigation.navigate('Memorial')}
        />
      </View>
    </AppScreen>
  );
}

function MemoryOfDayCard({ memory, eyebrow, emptyBody, openLabel, onPress }) {
  const { themeColors } = useTheme();
  const hasMemory = !!memory;
  return (
    <AppCard
      variant="soft"
      onPress={hasMemory ? onPress : undefined}
      style={styles.memoryCard}
    >
      <SectionLabel variant="pill" style={styles.eyebrow}>{eyebrow}</SectionLabel>
      {hasMemory ? (
        <>
          {memory.title ? (
            <Text style={[styles.memoryTitle, { color: themeColors.textPrimary }]} numberOfLines={2}>{memory.title}</Text>
          ) : null}
          {memory.body ? (
            <Text style={styles.memoryBody} numberOfLines={3}>{memory.body}</Text>
          ) : null}
          <View style={styles.openRow}>
            <Text style={[styles.openLink, { color: themeColors.moss }]}>{openLabel}</Text>
            <Feather name="arrow-right" size={14} color={themeColors.moss} />
          </View>
        </>
      ) : (
        <Text style={styles.memoryBody}>{emptyBody}</Text>
      )}
    </AppCard>
  );
}

function DailyQuoteCard({ eyebrow, quote }) {
  const { themeColors } = useTheme();
  return (
    <AppCard variant="warm" style={styles.quoteCard}>
      <SectionLabel variant="pill" style={styles.eyebrow}>{eyebrow}</SectionLabel>
      <Text style={[styles.quote, { color: themeColors.brown }]}>{`"${quote}"`}</Text>
    </AppCard>
  );
}

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
      <Feather name="chevron-right" size={22} color="rgba(48,56,45,0.72)" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // PWA: .home-memory-stack .memory-of-day { margin-top: -34px; padding-top: 48px; border-color: rgba(255,250,240,.72) }
  memoryCard: {
    marginTop: -34,
    paddingTop: 48,
    paddingBottom: 15,
    marginBottom: 14,
    borderRadius: 22,
    borderColor: colors.cardBorder,
  },
  eyebrow: { marginBottom: 10 },
  memoryTitle: {
    fontFamily: typography.serif,
    fontSize: 22,
    lineHeight: 26,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  memoryBody: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
  },
  openRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  openLink: {
    color: colors.moss,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  // PWA: .daily-quote { padding: 14px 16px 16px; border-radius: 22px }
  quoteCard: {
    paddingTop: 14,
    paddingBottom: 16,
    marginBottom: 14,
    borderRadius: 22,
  },
  // PWA: blockquote { font-size: clamp(1.28rem,5.6vw,1.75rem); font-weight: 500; line-height: 1.2 }
  quote: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 21,
    lineHeight: 25,
    color: colors.brown,
    fontWeight: '500',
  },
  // PWA: .quick-actions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px }
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  // PWA: .section-button { min-height: 78px; border-radius: 17px; padding: 14px 10px 14px 12px }
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '48%',
    flexGrow: 1,
    minHeight: 78,
    paddingVertical: 14,
    paddingLeft: 12,
    paddingRight: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: 'rgba(255, 250, 240, 0.72)',
    ...shadows.soft,
  },
  tilePressed: { transform: [{ scale: 0.98 }], opacity: 0.94 },
  // PWA: .button-icon { width: 46px; height: 46px; border-radius: 50%;
  //   background: linear-gradient(145deg, #687151, var(--moss-dark)) }
  // Solid mid-tone approximates the gradient (#47533e ≈ midpoint of #687151→#26352a)
  tileIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#47533e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // PWA: font-size: clamp(0.9rem, 3.8vw, 1.05rem) → ~15px at 390px
  tileLabel: {
    flex: 1,
    fontFamily: typography.serif,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
