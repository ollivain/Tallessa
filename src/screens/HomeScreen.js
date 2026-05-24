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

// Default soft watercolour shipped with the app — used when the active
// memorial has no portrait of its own. Keeps the hero card feeling finished.
const HERO_FALLBACK = require('../../assets/bg-koti.png');
const SCREEN_BG = require('../../assets/bg-koti.png');

export default function HomeScreen() {
  const { t } = useI18n();
  const { activeMemorial } = useMemorials();
  const navigation = useNavigation();

  const name = activeMemorial?.name ?? '';
  const heroLine = name
    ? t('home.heroMemoryLine', { name })
    : t('tagline');
  const heroEyebrow = t('brand');

  const portraitUri = activeMemorial?.portraitUri;
  const heroImage = portraitUri ? { uri: portraitUri } : null;

  const latestMemory = activeMemorial?.memories?.[0] ?? null;

  return (
    <AppScreen background={SCREEN_BG}>
      <MemoryHeroCard
        imageSource={heroImage}
        fallbackSource={HERO_FALLBACK}
        eyebrow={heroEyebrow}
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

      <SectionLabel style={styles.quickActionsLabel}>
        {t('home.quickActions')}
      </SectionLabel>

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
      </View>
    </AppScreen>
  );
}

function MemoryOfDayCard({ memory, eyebrow, emptyBody, openLabel, onPress }) {
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
            <Text style={styles.memoryTitle} numberOfLines={2}>{memory.title}</Text>
          ) : null}
          {memory.body ? (
            <Text style={styles.memoryBody} numberOfLines={3}>{memory.body}</Text>
          ) : null}
          <View style={styles.openRow}>
            <Text style={styles.openLink}>{openLabel}</Text>
            <Feather name="arrow-right" size={14} color={colors.moss} />
          </View>
        </>
      ) : (
        <Text style={styles.memoryBody}>{emptyBody}</Text>
      )}
    </AppCard>
  );
}

function DailyQuoteCard({ eyebrow, quote }) {
  return (
    <AppCard variant="warm" style={styles.quoteCard}>
      <SectionLabel variant="pill" style={styles.eyebrow}>{eyebrow}</SectionLabel>
      <Text style={styles.quote}>{`“${quote}”`}</Text>
    </AppCard>
  );
}

function ActionTile({ icon, label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
      accessibilityRole="button"
    >
      <View style={styles.tileIcon}>
        <Feather name={icon} size={20} color={colors.textOnPrimary} />
      </View>
      <Text style={styles.tileLabel} numberOfLines={1}>{label}</Text>
      <Feather name="chevron-right" size={18} color="rgba(48,56,45,0.6)" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  memoryCard: {
    paddingTop: 14,
    paddingBottom: 16,
    marginBottom: spacing.md,
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
  quoteCard: {
    paddingTop: 14,
    paddingBottom: 18,
    marginBottom: spacing.lg,
  },
  quote: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 22,
    lineHeight: 30,
    color: colors.brown,
  },
  quickActionsLabel: {
    marginLeft: 4,
    marginBottom: 10,
    color: colors.textPrimary,
  },
  actions: {
    gap: 10,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 68,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 14,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: 'rgba(255, 250, 240, 0.84)',
    ...shadows.soft,
  },
  tilePressed: { transform: [{ scale: 0.985 }], opacity: 0.94 },
  tileIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.moss,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    flex: 1,
    fontFamily: typography.serif,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
