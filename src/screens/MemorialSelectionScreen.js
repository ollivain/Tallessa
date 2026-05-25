import { Image, ImageBackground, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useI18n } from '../i18n';
import { useMemorials } from '../state/MemorialContext';
import {
  colors,
  typography,
} from '../theme/designSystem';

const SCREEN_BG = require('../../assets/selector-background.png');

export default function MemorialSelectionScreen() {
  const { t } = useI18n();
  const { memorials, selectMemorial } = useMemorials();
  const navigation = useNavigation();

  return (
    <ImageBackground source={SCREEN_BG} resizeMode="cover" style={styles.bgWrap}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* PWA: .selector-hero { padding: 0 4px 42px } */}
          <View style={styles.hero}>
            {/* PWA: .selector-hero h1 { font-size:~74px; line-height:0.82; color:mossDark } */}
            <Text style={styles.heroTitle}>{t('brand')}</Text>
            {/* PWA: .selector-hero p { font-size:~18px; font-weight:500; color:rgba(80,86,76,.88) } */}
            <Text style={styles.heroTagline}>{t('tagline')}</Text>
          </View>

          {/* PWA: .memorial-place-list { gap:14px } */}
          {memorials.length === 0 ? (
            // PWA: .selector-empty { padding:26px }
            <View style={styles.emptyBlock}>
              <Text style={styles.emptyText}>{t('selection.empty')}</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {memorials.map((m) => (
                <MemorialPlaceCard
                  key={m.id}
                  memorial={m}
                  onPress={() => selectMemorial(m.id)}
                />
              ))}
            </View>
          )}

          {/* PWA: .primary-action.selector-add { min-height:74px; border-radius:28px; gradient } */}
          <Pressable
            onPress={() => navigation.navigate('MemorialCreation')}
            style={({ pressed }) => [styles.selectorAdd, pressed && styles.selectorAddPressed]}
            accessibilityRole="button"
          >
            <Text style={styles.selectorAddLabel}>{t('selection.create')}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

// PWA: .memorial-place-card { grid: 78px 1fr 26px; min-height:122px; border-radius:30px; gap:14px }
function MemorialPlaceCard({ memorial, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.placeCard, pressed && styles.placeCardPressed]}
      accessibilityRole="button"
    >
      {/* PWA: .memorial-place-image { width:78px; aspect-ratio:1; border-radius:24px } */}
      <View style={styles.placeImage}>
        {memorial.portraitUri ? (
          <Image source={{ uri: memorial.portraitUri }} style={styles.placeImageFill} resizeMode="cover" />
        ) : (
          <Feather name="user" size={28} color="rgba(80, 95, 62, 0.5)" />
        )}
      </View>

      {/* PWA: .memorial-place-copy strong { font-family:serif; font-size:~20px; color:mossDark } */}
      <View style={styles.placeCopy}>
        <Text style={styles.placeName} numberOfLines={2}>{memorial.name}</Text>
      </View>

      {/* PWA: .memorial-place-arrow { font-size:2.25rem≈36px; color:rgba(81,87,75,.82) } */}
      <Text style={styles.placeArrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bgWrap: { flex: 1 },
  safe: { flex: 1 },

  // PWA: .selector-screen { padding: safe-area-top+96px 28px safe-area-bottom+44px; gap:24px }
  content: {
    paddingHorizontal: 28,
    paddingTop: 96,
    paddingBottom: 44,
    gap: 24,
  },

  // PWA: .selector-hero { padding: 0 4px 42px }
  hero: {
    paddingHorizontal: 4,
    paddingBottom: 42,
  },
  // PWA: .selector-hero h1 { font-size:clamp(4.6rem,20vw,6.7rem)≈74px; line-height:0.82; color:mossDark; text-shadow:0 1px 0 rgba(255,255,255,.62) }
  heroTitle: {
    fontFamily: typography.serif,
    fontSize: 74,
    lineHeight: 61,
    fontWeight: '400',
    color: colors.mossDark,
    textShadowColor: 'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
    marginBottom: 14,
  },
  // PWA: .selector-hero p { font-size:clamp(1.1rem,4.7vw,1.42rem)≈18px; font-weight:500; line-height:1.45; color:rgba(80,86,76,.88) }
  heroTagline: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 26,
    color: 'rgba(80, 86, 76, 0.88)',
  },

  // PWA: .memorial-place-list { gap:14px }
  list: { gap: 14 },

  // PWA: .memorial-place-card { min-height:122px; border-radius:30px; bg:rgba(255,253,247,.78); border:1px solid rgba(255,255,255,.82); padding:14px }
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 122,
    padding: 14,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 253, 247, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.82)',
    ...Platform.select({
      ios: {
        shadowColor: '#3e3524',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  placeCardPressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },

  // PWA: .memorial-place-image { width:78px; aspect-ratio:1; border-radius:24px }
  placeImage: {
    width: 78,
    height: 78,
    borderRadius: 24,
    backgroundColor: 'rgba(80, 95, 62, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  placeImageFill: { width: '100%', height: '100%' },

  placeCopy: { flex: 1, minWidth: 0 },
  // PWA: .memorial-place-copy strong { font-family:serif; font-size:~20px; line-height:1.16; color:mossDark }
  placeName: {
    fontFamily: typography.serif,
    fontSize: 20,
    lineHeight: 23,
    fontWeight: '400',
    color: colors.mossDark,
  },

  // PWA: .memorial-place-arrow { font-size:2.25rem≈36px; color:rgba(81,87,75,.82) }
  placeArrow: {
    fontSize: 36,
    lineHeight: 40,
    color: 'rgba(81, 87, 75, 0.82)',
    flexShrink: 0,
  },

  // PWA: .selector-empty { padding:26px } .selector-empty h2 { font-size:2rem; color:mossDark }
  emptyBlock: {
    paddingVertical: 26,
    paddingHorizontal: 4,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },

  // PWA: .primary-action.selector-add { min-height:74px; border-radius:28px; gradient bg:moss→mossDark; font-size:1.08rem }
  selectorAdd: {
    minHeight: 74,
    borderRadius: 28,
    backgroundColor: colors.mossDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#2d3a27',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.20,
        shadowRadius: 14,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  selectorAddPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  selectorAddLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fffaf0',
    letterSpacing: 0.3,
  },
});
