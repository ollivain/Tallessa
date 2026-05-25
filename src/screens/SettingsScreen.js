import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useI18n } from '../i18n';
import { useMemorials } from '../state/MemorialContext';
import {
  colors,
  typography,
  spacing,
  radii,
  screenStyles,
} from '../theme/designSystem';
import ScreenHeader from '../components/ScreenHeader';
import AppCard from '../components/AppCard';
import SectionLabel from '../components/SectionLabel';
import { clearAllData } from '../storage/storage';

export default function SettingsScreen() {
  const { t, language, setLanguage } = useI18n();
  const { activeMemorial, clearActive, deleteMemorial } = useMemorials();

  const onClearAll = () => {
    Alert.alert(
      t('settings.clearAllConfirmTitle'),
      t('settings.clearAllConfirmBody'),
      [
        { text: t('settings.clearAllCancel'), style: 'cancel' },
        {
          text: t('settings.clearAllConfirm'),
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            clearActive();
          },
        },
      ],
    );
  };

  const onDeleteMemorial = () => {
    if (!activeMemorial) return;
    Alert.alert(
      t('memorial.deleteTitle'),
      t('memorial.deleteBody'),
      [
        { text: t('memorial.deleteCancel'), style: 'cancel' },
        {
          text: t('memorial.deleteConfirm'),
          style: 'destructive',
          onPress: () => {
            deleteMemorial(activeMemorial.id);
            clearActive();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title={t('settings.title')} />

      <ScrollView contentContainerStyle={screenStyles.scroll}>

        {/* Language */}
        <SectionLabel style={styles.groupLabel}>{t('settings.language')}</SectionLabel>
        <AppCard variant="soft" style={styles.groupCard}>
          <View style={styles.langRow}>
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
        </AppCard>

        {/* Active memorial */}
        <SectionLabel style={styles.groupLabel}>{t('settings.memorial')}</SectionLabel>
        <AppCard variant="soft" style={styles.groupCard}>
          {activeMemorial ? (
            <View style={styles.memorialInfo}>
              <Text style={styles.memorialName}>{activeMemorial.name}</Text>
              {activeMemorial.description ? (
                <Text style={styles.memorialDesc}>{activeMemorial.description}</Text>
              ) : null}
            </View>
          ) : null}

          <Pressable
            onPress={clearActive}
            style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
          >
            <View style={styles.linkIcon}>
              <Feather name="repeat" size={16} color={colors.textOnPrimary} />
            </View>
            <Text style={styles.linkText}>{t('settings.switchMemorial')}</Text>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </Pressable>

          {activeMemorial ? (
            <Pressable
              onPress={onDeleteMemorial}
              style={({ pressed }) => [styles.dangerLinkRow, pressed && styles.pressed]}
            >
              <View style={styles.dangerIcon}>
                <Feather name="trash-2" size={16} color={colors.danger} />
              </View>
              <Text style={styles.dangerLinkText}>{t('settings.deleteMemorial')}</Text>
            </Pressable>
          ) : null}
        </AppCard>

        {/* About */}
        <SectionLabel style={styles.groupLabel}>{t('settings.about')}</SectionLabel>
        <AppCard variant="warm" style={styles.groupCard}>
          <Text style={styles.aboutBody}>{t('settings.aboutBody')}</Text>
          <View style={styles.versionRow}>
            <Feather name="info" size={13} color={colors.textSoft} />
            <Text style={styles.version}>{t('settings.version')} 0.1.0</Text>
          </View>
        </AppCard>

        {/* Developer */}
        <SectionLabel style={styles.groupLabel}>{t('settings.devSection')}</SectionLabel>
        <AppCard variant="soft" style={styles.groupCard}>
          <Pressable
            onPress={onClearAll}
            style={({ pressed }) => [styles.dangerRow, pressed && styles.pressed]}
          >
            <View style={styles.dangerRowIcon}>
              <Feather name="trash-2" size={16} color={colors.danger} />
            </View>
            <Text style={styles.dangerText}>{t('settings.clearAll')}</Text>
            <Feather name="chevron-right" size={16} color={colors.danger} style={{ opacity: 0.5 }} />
          </Pressable>
        </AppCard>

      </ScrollView>
    </SafeAreaView>
  );
}

function LanguagePill({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.langPill,
        active && styles.langPillActive,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.langPillLabel, active && styles.langPillLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  groupLabel: { marginBottom: spacing.xs, marginLeft: 2 },
  groupCard: { marginBottom: spacing.lg },

  // Language
  langRow: { flexDirection: 'row', gap: spacing.sm },
  langPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: 'transparent',
  },
  langPillActive: { backgroundColor: colors.moss, borderColor: colors.moss },
  pressed: { opacity: 0.72 },
  langPillLabel: {
    fontSize: typography.sizes.label,
    color: colors.moss,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.3,
  },
  langPillLabelActive: { color: colors.textOnPrimary },

  // Memorial info
  memorialInfo: {
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  memorialName: {
    fontFamily: typography.serif,
    fontSize: typography.sizes.title,
    color: colors.textPrimary,
    fontWeight: typography.weights.regular,
  },
  memorialDesc: {
    marginTop: 4,
    fontSize: typography.sizes.label,
    color: colors.textMuted,
    lineHeight: typography.lineHeights.body,
    fontStyle: 'italic',
  },

  // Switch link row
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
    marginBottom: 8,
  },
  linkIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.moss,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    flex: 1,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },

  // Delete memorial link row (inside memorial card)
  dangerLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  dangerIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(143, 77, 56, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerLinkText: {
    flex: 1,
    fontSize: typography.sizes.body,
    color: colors.danger,
    fontWeight: typography.weights.medium,
  },

  // About
  aboutBody: {
    fontSize: typography.sizes.label,
    color: colors.textMuted,
    lineHeight: typography.lineHeights.body,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  version: {
    fontSize: typography.sizes.eyebrow,
    color: colors.textSoft,
    letterSpacing: 0.8,
  },

  // Dev danger section
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  dangerRowIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(143, 77, 56, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerText: {
    flex: 1,
    fontSize: typography.sizes.body,
    color: colors.danger,
    fontWeight: typography.weights.medium,
  },
});
