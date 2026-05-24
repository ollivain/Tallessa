import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useI18n } from '../i18n';
import { useMemorials } from '../state/MemorialContext';
import { colors } from '../theme/colors';
import PrimaryButton from '../components/PrimaryButton';

export default function MemorialSelectionScreen() {
  const { t } = useI18n();
  const { memorials, selectMemorial } = useMemorials();
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brandBlock}>
          <Text style={styles.brand}>{t('brand')}</Text>
          <View style={styles.brandRule} />
          <Text style={styles.tagline}>{t('tagline')}</Text>
        </View>

        <View style={styles.headerBlock}>
          <Text style={styles.title}>{t('selection.title')}</Text>
          <Text style={styles.subtitle}>{t('selection.subtitle')}</Text>
        </View>

        {memorials.length === 0 ? (
          <Text style={styles.empty}>{t('selection.empty')}</Text>
        ) : (
          <View style={styles.list}>
            {memorials.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => selectMemorial(m.id)}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              >
                <View style={styles.cardBody}>
                  <Text style={styles.cardName}>{m.name}</Text>
                  <Text style={styles.cardSuffix}>{t('selection.placeSuffix')}</Text>
                </View>
                <Feather name="chevron-right" size={20} color={colors.accentDark} />
              </Pressable>
            ))}
          </View>
        )}

        <PrimaryButton
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
  content: { paddingHorizontal: 24, paddingVertical: 32, paddingBottom: 64 },
  brandBlock: { alignItems: 'center', marginTop: 16, marginBottom: 36 },
  brand: {
    fontSize: 40,
    fontWeight: '300',
    color: colors.textPrimary,
    letterSpacing: 3,
  },
  brandRule: {
    height: 1,
    width: 48,
    backgroundColor: colors.accent,
    marginVertical: 12,
    opacity: 0.6,
  },
  tagline: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  headerBlock: { marginBottom: 20 },
  title: {
    fontSize: 22,
    color: colors.textPrimary,
    fontWeight: '400',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  empty: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
    marginVertical: 24,
  },
  list: { marginBottom: 24 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  cardPressed: { opacity: 0.85 },
  cardBody: { flex: 1, paddingRight: 12 },
  cardName: { fontSize: 18, color: colors.textPrimary, fontWeight: '500' },
  cardSuffix: { fontSize: 13, color: colors.textMuted, marginTop: 2, fontStyle: 'italic' },
  cta: { marginTop: 8 },
});
