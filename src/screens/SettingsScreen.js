import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useI18n } from '../i18n';
import { useMemorials } from '../state/MemorialContext';
import { colors } from '../theme/colors';
import ScreenHeader from '../components/ScreenHeader';

export default function SettingsScreen() {
  const { t, language, setLanguage } = useI18n();
  const { activeMemorial, clearActive } = useMemorials();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title={t('settings.title')} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Group label={t('settings.language')}>
          <View style={styles.row}>
            <LanguagePill
              label={t('settings.languageFi')}
              active={language === 'fi'}
              onPress={() => setLanguage('fi')}
            />
            <LanguagePill
              label={t('settings.languageEn')}
              active={language === 'en'}
              onPress={() => setLanguage('en')}
            />
          </View>
        </Group>

        <Group label={t('settings.memorial')}>
          {activeMemorial ? (
            <View style={styles.card}>
              <Text style={styles.cardName}>{activeMemorial.name}</Text>
              {activeMemorial.description ? (
                <Text style={styles.cardBody}>{activeMemorial.description}</Text>
              ) : null}
            </View>
          ) : null}
          <Pressable
            onPress={clearActive}
            style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
          >
            <Feather name="repeat" size={18} color={colors.accentDark} />
            <Text style={styles.linkText}>{t('settings.switchMemorial')}</Text>
          </Pressable>
        </Group>

        <Group label={t('settings.about')}>
          <Text style={styles.aboutBody}>{t('settings.aboutBody')}</Text>
          <Text style={styles.version}>{t('settings.version')} 0.1.0</Text>
        </Group>
      </ScrollView>
    </SafeAreaView>
  );
}

function Group({ label, children }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      {children}
    </View>
  );
}

function LanguagePill({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        active && styles.pillActive,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.pillLabel, active && styles.pillLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 48 },
  group: { marginBottom: 28 },
  groupLabel: {
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  row: { flexDirection: 'row', gap: 10 },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: 'transparent',
  },
  pillActive: { backgroundColor: colors.accentDark, borderColor: colors.accentDark },
  pillLabel: { fontSize: 14, color: colors.accentDark, letterSpacing: 0.5 },
  pillLabelActive: { color: '#fbf6ec' },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: 12,
  },
  cardName: { fontSize: 18, color: colors.textPrimary, fontWeight: '500' },
  cardBody: {
    marginTop: 6,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  pressed: { opacity: 0.7 },
  linkText: { fontSize: 15, color: colors.accentDark, letterSpacing: 0.5 },
  aboutBody: { fontSize: 14, color: colors.textMuted, lineHeight: 22, fontStyle: 'italic' },
  version: { marginTop: 12, fontSize: 12, color: colors.textSoft, letterSpacing: 1 },
});
