import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useI18n } from '../i18n';
import { useMemorials } from '../state/MemorialContext';
import {
  colors,
  typography,
  spacing,
  radii,
} from '../theme/designSystem';
import AppCard from '../components/AppCard';
import AppButton from '../components/AppButton';
import EmptyStateCard from '../components/EmptyStateCard';
import SectionLabel from '../components/SectionLabel';

export default function MemorialSelectionScreen() {
  const { t } = useI18n();
  const { memorials, selectMemorial } = useMemorials();
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand block */}
        <View style={styles.brandBlock}>
          <SectionLabel variant="pill" style={styles.brandPill}>Tallessa</SectionLabel>
          <Text style={styles.brand}>{t('brand')}</Text>
          <View style={styles.brandRule} />
          <Text style={styles.tagline}>{t('tagline')}</Text>
        </View>

        {/* Heading */}
        <View style={styles.headerBlock}>
          <Text style={styles.title}>{t('selection.title')}</Text>
          <Text style={styles.subtitle}>{t('selection.subtitle')}</Text>
        </View>

        {/* List or empty */}
        {memorials.length === 0 ? (
          <EmptyStateCard
            eyebrow={t('selection.title')}
            body={t('selection.empty')}
          />
        ) : (
          <View style={styles.list}>
            {memorials.map((m) => (
              <AppCard
                key={m.id}
                variant="soft"
                onPress={() => selectMemorial(m.id)}
                style={styles.memorialCard}
              >
                <View style={styles.memorialRow}>
                  <View style={styles.memorialAvatar}>
                    <Feather name="user" size={18} color={colors.textOnPrimary} />
                  </View>
                  <View style={styles.memorialInfo}>
                    <Text style={styles.memorialName}>{m.name}</Text>
                    <Text style={styles.memorialSuffix}>{t('selection.placeSuffix')}</Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={colors.moss} />
                </View>
              </AppCard>
            ))}
          </View>
        )}

        <AppButton
          label={t('selection.create')}
          onPress={() => navigation.navigate('MemorialCreation')}
          style={styles.cta}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },

  // Brand
  brandBlock: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  brandPill: { marginBottom: spacing.md },
  brand: {
    fontFamily: typography.serif,
    fontSize: 44,
    fontWeight: typography.weights.regular,
    color: colors.textPrimary,
    letterSpacing: 3,
  },
  brandRule: {
    height: 1,
    width: 56,
    backgroundColor: colors.brown,
    marginVertical: spacing.sm,
    opacity: 0.55,
  },
  tagline: {
    fontSize: typography.sizes.label,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Header
  headerBlock: { marginBottom: spacing.lg },
  title: {
    fontFamily: typography.serif,
    fontSize: typography.sizes.title,
    color: colors.textPrimary,
    fontWeight: typography.weights.regular,
    letterSpacing: 0.3,
  },
  subtitle: {
    marginTop: 6,
    fontSize: typography.sizes.label,
    color: colors.textMuted,
    fontStyle: 'italic',
  },

  // List
  list: { gap: spacing.sm, marginBottom: spacing.lg },
  memorialCard: { paddingVertical: spacing.sm },
  memorialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  memorialAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.moss,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memorialInfo: { flex: 1 },
  memorialName: {
    fontFamily: typography.serif,
    fontSize: typography.sizes.bodyLarge,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  memorialSuffix: {
    fontSize: typography.sizes.eyebrow,
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginTop: 2,
  },

  cta: { marginTop: spacing.xs },
});
