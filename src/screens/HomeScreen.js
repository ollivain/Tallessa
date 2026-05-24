import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useI18n } from '../i18n';
import { useMemorials } from '../state/MemorialContext';
import { colors } from '../theme/colors';

export default function HomeScreen() {
  const { t } = useI18n();
  const { activeMemorial } = useMemorials();
  const navigation = useNavigation();

  const latestMemory = activeMemorial?.memories?.[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.heroBlock}>
          <Text style={styles.welcome}>{t('home.welcome')}</Text>
          <Text style={styles.name}>{activeMemorial?.name}</Text>
          <View style={styles.rule} />
          <Text style={styles.tagline}>{t('tagline')}</Text>
        </View>

        <Section title={t('home.memoryOfDay')}>
          {latestMemory ? (
            <View style={styles.memoryCard}>
              <Text style={styles.memoryTitle}>{latestMemory.title}</Text>
              {latestMemory.body ? (
                <Text style={styles.memoryBody}>{latestMemory.body}</Text>
              ) : null}
            </View>
          ) : (
            <Text style={styles.emptyText}>{t('home.memoryEmpty')}</Text>
          )}
        </Section>

        <Section title={t('home.dailyQuote')}>
          <Text style={styles.quote}>“{t('quote')}”</Text>
        </Section>

        <Section title={t('home.quickActions')}>
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
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionEyebrow}>{title}</Text>
      {children}
    </View>
  );
}

function ActionTile({ icon, label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
    >
      <Feather name={icon} size={22} color={colors.accentDark} />
      <Text style={styles.tileLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48 },
  heroBlock: { alignItems: 'center', marginBottom: 32 },
  welcome: {
    fontSize: 13,
    color: colors.textMuted,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  name: {
    marginTop: 10,
    fontSize: 36,
    fontWeight: '300',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  rule: {
    height: 1,
    width: 48,
    backgroundColor: colors.accent,
    marginVertical: 14,
    opacity: 0.6,
  },
  tagline: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  section: { marginBottom: 28 },
  sectionEyebrow: {
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  memoryCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  memoryTitle: {
    fontSize: 17,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: 6,
  },
  memoryBody: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  quote: {
    fontSize: 16,
    color: colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 26,
    paddingHorizontal: 4,
  },
  actions: { flexDirection: 'row', gap: 12 },
  tile: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  tilePressed: { opacity: 0.8 },
  tileLabel: {
    fontSize: 13,
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
});
