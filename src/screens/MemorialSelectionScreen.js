import { Image, ImageBackground, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useI18n } from '../i18n';
import { useMemorials } from '../state/MemorialContext';
import {
  colors,
  radii,
  shadows,
  typography,
} from '../theme/designSystem';
import { getMemorialImage, getMemorialName } from '../models/memorial';

const SCREEN_BG = require('../../assets/selector-background.png');

export default function MemorialSelectionScreen() {
  const { t } = useI18n();
  const { memorials, selectMemorial } = useMemorials();
  const navigation = useNavigation();

  const openMemorial = (id) => {
    selectMemorial(id);
    navigation.navigate('Main', { screen: 'Home' });
  };

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
            <Text
              style={styles.heroTitle}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
              numberOfLines={1}
            >
              {t('brand')}
            </Text>
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
                  onPress={() => openMemorial(m.id)}
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
            <Text style={styles.selectorAddLabel}>{t('selection.addPlace')}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

// PWA: .memorial-place-card { grid: 78px 1fr 26px; min-height:122px; border-radius:30px; gap:14px }
function MemorialPlaceCard({ memorial, onPress }) {
  const imageUri = getMemorialImage(memorial);
  const name = getMemorialName(memorial);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.placeCard, pressed && styles.placeCardPressed]}
      accessibilityRole="button"
    >
      {/* PWA: .memorial-place-image { width:78px; aspect-ratio:1; border-radius:24px } */}
      <View style={styles.placeImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.placeImageFill} resizeMode="cover" />
        ) : (
          <Feather name="user" size={28} color="rgba(80, 95, 62, 0.5)" />
        )}
      </View>

      {/* PWA: .memorial-place-copy strong { font-family:serif; font-size:~20px; color:mossDark } */}
      <View style={styles.placeCopy}>
        <Text style={styles.placeName} numberOfLines={2}>{name}</Text>
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
  // PWA `.selector-hero h1 { font-size: clamp(4.6rem,20vw,6.7rem); line-height: 0.82;
  //   color: var(--color-primary); text-shadow: 0 1px 0 rgba(255,255,255,.62) }`
  // adjustsFontSizeToFit guards Finnish "Tallessa" on narrow SE screens.
  heroTitle: {
    fontFamily:       typography.serif,
    fontSize:         typography.sizes.h1Selector,
    lineHeight:       typography.lineHeights.h1Selector,
    fontWeight:       typography.weights.regular,
    color:            colors.mossDark,
    textShadowColor:  'rgba(255, 255, 255, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
    marginBottom:     14,
  },
  // PWA `.selector-hero p { font-size: clamp(1.1rem,4.7vw,1.42rem); font-weight: 500 }`
  heroTagline: {
    fontSize:   typography.sizes.selectorSub,
    fontWeight: typography.weights.medium,
    lineHeight: 26,
    color:      'rgba(80, 86, 76, 0.88)',
  },

  // PWA `.memorial-place-list { gap: 14 }`
  list: { gap: 14 },

  // PWA `.memorial-place-card { grid: 78px 1fr 26px; min-height: 122; padding: 14;
  //   border: 1px solid rgba(255,255,255,0.82); border-radius: 30;
  //   bg: rgba(255,253,247,0.78); box-shadow: 0 22px 46px rgba(62,53,36,.18),
  //   0 7px 16px rgba(62,53,36,.08), inset 0 1px 0 rgba(255,255,255,.88) }`
  // PWA parity approximation: RN supports only one shadow per view; inset is dropped.
  placeCard: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             14,
    minHeight:       122,
    padding:         14,
    borderRadius:    radii.selectorCard,
    backgroundColor: 'rgba(255, 253, 247, 0.78)',
    borderWidth:     1,
    borderColor:     'rgba(255, 255, 255, 0.82)',
    ...shadows.selectorCard,
  },
  placeCardPressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },

  // PWA `.memorial-place-image { width: 78; aspect-ratio: 1; border-radius: 24 }`
  placeImage: {
    width:           78,
    height:          78,
    borderRadius:    24,
    backgroundColor: 'rgba(80, 95, 62, 0.14)',
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
    flexShrink:      0,
  },
  placeImageFill: { width: '100%', height: '100%' },

  placeCopy: { flex: 1, minWidth: 0 },
  // PWA `.memorial-place-copy strong { font-family: var(--serif);
  //   font-size: clamp(1.04rem,3.8vw,1.28rem); line-height: 1.16; color: var(--moss-dark) }`
  placeName: {
    fontFamily: typography.serif,
    fontSize:   20,
    lineHeight: 23,
    fontWeight: typography.weights.regular,
    color:      colors.mossDark,
  },

  // PWA `.memorial-place-arrow { font-size: 2.25rem; color: rgba(81,87,75,0.82) }`
  placeArrow: {
    fontSize:   36,
    lineHeight: 40,
    color:      'rgba(81, 87, 75, 0.82)',
    flexShrink: 0,
  },

  // PWA `.selector-empty { padding: 26 }`
  emptyBlock: { paddingVertical: 26, paddingHorizontal: 4 },
  emptyText: {
    color:      colors.textMuted,
    fontSize:   typography.sizes.body,
    lineHeight: typography.lineHeights.body,
    fontStyle:  'italic',
  },

  // PWA `.primary-action.selector-add { min-height: 74; border-radius: 28;
  //   background: linear-gradient(135deg, var(--color-primary-soft), var(--color-primary));
  //   box-shadow: 0 16px 34px rgba(45,58,39,0.2); font-size: 1.08rem }`
  // PWA parity approximation: gradient flattened to mossDark solid colour;
  // a second pseudo-layer cannot be stacked on a Pressable without extra deps.
  selectorAdd: {
    minHeight:       74,
    borderRadius:    radii.hero,
    backgroundColor: colors.mossDark,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 18,
    ...Platform.select({
      ios: {
        shadowColor:   '#2d3a27',
        shadowOffset:  { width: 0, height: 16 },
        shadowOpacity: 0.20,
        shadowRadius:  14,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  selectorAddPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  selectorAddLabel: {
    fontSize:      typography.sizes.primaryBtn,
    fontWeight:    typography.weights.bold,
    color:         '#fffaf0',
    letterSpacing: 0.3,
  },
});
