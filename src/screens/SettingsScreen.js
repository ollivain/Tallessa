import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useI18n } from '../i18n';
import { useMemorials } from '../state/MemorialContext';
import {
  colors,
  typography,
  spacing,
  shadows,
} from '../theme/designSystem';
import AppScreen from '../components/AppScreen';
import AppCard from '../components/AppCard';
import { clearAllData } from '../storage/storage';

const SCREEN_BG = require('../../assets/bg-asetukset.png');

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
    <AppScreen scroll={false} background={SCREEN_BG} contentStyle={styles.noInnerPad}>
      {/* PWA: topbar is position:static, scrolls with content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* PWA: transparent h2 header, no divider */}
        <View style={styles.wallHeader}>
          <Text style={styles.wallTitle}>{t('settings.title')}</Text>
        </View>

        {/* PWA: .memory-switch-button.memory-place-switch — pill outside the form card */}
        <Pressable
          onPress={clearActive}
          style={({ pressed }) => [styles.switchPill, pressed && styles.switchPillPressed]}
          accessibilityRole="button"
        >
          <Text style={styles.switchPillLabel}>{t('settings.switchMemorial')}</Text>
        </Pressable>

        {/* PWA: .form-card.card — main settings card */}
        <View style={styles.formCardShadow}>
          <View style={styles.formCard}>

            {/* Language — PWA: label + select */}
            <View>
              <Text style={styles.fieldLabel}>{t('settings.language')}</Text>
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
            </View>

            {/* Active memorial info — PWA: horseName + description fields */}
            {activeMemorial ? (
              <View>
                <Text style={styles.fieldLabel}>{t('settings.memorial')}</Text>
                <Text style={styles.memorialName}>{activeMemorial.name}</Text>
                {activeMemorial.description ? (
                  <Text style={styles.memorialDesc}>{activeMemorial.description}</Text>
                ) : null}
              </View>
            ) : null}

            {/* PWA: .danger-zone — delete memorial */}
            {activeMemorial ? (
              <View style={styles.dangerZone}>
                <Pressable
                  onPress={onDeleteMemorial}
                  style={({ pressed }) => [styles.dangerAction, pressed && styles.pressed]}
                  accessibilityRole="button"
                >
                  <Text style={styles.dangerActionText}>{t('settings.deleteMemorial')}</Text>
                </Pressable>
                <Text style={styles.dangerNote}>{t('memorial.deleteBody')}</Text>
              </View>
            ) : null}

          </View>
        </View>

        {/* About — warm card */}
        <AppCard variant="warm" style={styles.aboutCard}>
          <Text style={styles.aboutBody}>{t('settings.aboutBody')}</Text>
          <View style={styles.versionRow}>
            <Feather name="info" size={13} color={colors.textSoft} />
            <Text style={styles.version}>{t('settings.version')} 0.1.0</Text>
          </View>
        </AppCard>

        {/* Developer — PWA-style danger zone card */}
        <View style={styles.formCardShadow}>
          <View style={styles.formCard}>
            <Pressable
              onPress={onClearAll}
              style={({ pressed }) => [styles.dangerAction, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.dangerActionText}>{t('settings.clearAll')}</Text>
            </Pressable>
          </View>
        </View>

      </ScrollView>
    </AppScreen>
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
      accessibilityRole="button"
    >
      <Text style={[styles.langPillLabel, active && styles.langPillLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  noInnerPad: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0 },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 150,
  },

  // PWA: transparent static h2 (same pattern as Wall, Letters, Calendar)
  wallHeader: {
    paddingTop: 6,
    paddingBottom: 14,
  },
  wallTitle: {
    fontFamily: typography.serif,
    fontSize: 36,
    lineHeight: 37,
    fontWeight: '400',
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },

  // PWA: .memory-switch-button { min-height:38px; padding:0 14px; border-radius:999px;
  //   bg:rgba(255,252,244,.76); border:1px solid rgba(255,255,255,.72);
  //   color:var(--muted); font-size:0.76rem; font-weight:800; text-transform:uppercase }
  switchPill: {
    alignSelf: 'flex-start',
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 252, 244, 0.76)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  switchPillPressed: { opacity: 0.72 },
  switchPillLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },

  // PWA: .form-card.card { padding:16px; gap:14px; border-radius:24px;
  //   bg:rgba(255,250,240,.98); border:1px solid var(--line); overflow:hidden }
  // Shadow wrapper (shadow separate from overflow:hidden)
  formCardShadow: {
    borderRadius: 24,
    marginBottom: 14,
    ...shadows.soft,
  },
  formCard: {
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: 'rgba(255, 250, 240, 0.98)',
    padding: 16,
    gap: 14,
  },

  // PWA: form-card label > span { font-size:13px; font-weight:700; color:var(--text) }
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textBody,
    marginBottom: 8,
  },

  // Language pills (native equivalent of PWA select)
  langRow: { flexDirection: 'row', gap: spacing.sm },
  langPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langPillActive: { backgroundColor: colors.moss, borderColor: colors.moss },
  pressed: { opacity: 0.72 },
  langPillLabel: {
    fontSize: 13,
    color: colors.moss,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  langPillLabelActive: { color: colors.textOnPrimary },

  // Memorial info (display only in native — form fields in PWA)
  memorialName: {
    fontFamily: typography.serif,
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: '400',
    marginBottom: 4,
  },
  memorialDesc: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // PWA: .danger-zone { gap:8px; margin-top:6px; border-top:1px solid rgba(143,77,56,.16); padding-top:18px }
  dangerZone: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(143, 77, 56, 0.16)',
    paddingTop: 18,
    gap: 8,
  },

  // PWA: .danger-action { min-height:48px; border-radius:16px; padding:0 16px;
  //   font-weight:800; border:1px solid rgba(143,77,56,.28); color:#8f4d38; bg:rgba(252,236,230,.72) }
  dangerAction: {
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(143, 77, 56, 0.28)',
    backgroundColor: 'rgba(252, 236, 230, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerActionText: {
    fontSize: typography.sizes.body,
    fontWeight: '800',
    color: '#8f4d38',
  },

  // PWA: .danger-zone p:last-child { color:var(--muted); font-size:0.82rem; line-height:1.45 }
  dangerNote: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },

  // About
  aboutCard: { marginBottom: 14 },
  aboutBody: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  version: {
    fontSize: 11,
    color: colors.textSoft,
    letterSpacing: 0.8,
  },
});
