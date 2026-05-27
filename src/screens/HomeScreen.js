import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useI18n } from '../i18n';
import { useMemorials } from '../state/MemorialContext';
import AppScreen from '../components/AppScreen';
import AppCard from '../components/AppCard';
import SectionLabel from '../components/SectionLabel';
import MemoryHeroCard from '../components/MemoryHeroCard';
import ImageControls from '../components/ImageControls';
import ImageCropAspectPicker, { DEFAULT_CROP_VALUE } from '../components/ImageCropAspectPicker';
import { pickImageFromLibrary, removePersistedMedia } from '../lib/media';
import {
  colors,
  radii,
  shadows,
  spacing,
  typography,
} from '../theme/designSystem';
import { useTheme } from '../state/ThemeContext';
import { getHeroImage, getHomeMemoryOfDay, getMemorialName } from '../models/memorial';

const HERO_FALLBACK = require('../../assets/bg-koti.png');
const SCREEN_BG = require('../../assets/bg-koti.png');

// HomeScreen mirrors styles.css `.home-memory-stack`:
//   .hero (memory hero card) overlaps the .memory-of-day card by 34px.
// Then comes .daily-quote, then a 2×2 .quick-actions grid.
//
// The hero image is fully user-editable: change / edit crop / remove, all
// routed through the shared ImageCropAspectPicker so the cropped preview
// renders identically to the saved card.
export default function HomeScreen() {
  const { t, language } = useI18n();
  const { activeMemorial, updateMemorial } = useMemorials();
  const navigation = useNavigation();
  const [cropTarget, setCropTarget] = useState(null);
  // PWA parity: floating image-edit pills are hidden until the user taps
  // the hero image. Tap again → hide. Tap a control pill → run the action.
  const [heroControlsVisible, setHeroControlsVisible] = useState(false);

  const name = getMemorialName(activeMemorial);
  const heroLine = name
    ? t('home.heroMemoryLine', { name })
    : t('tagline');

  const portraitUri = getHeroImage(activeMemorial);
  const heroImage = portraitUri ? { uri: portraitUri } : null;
  const heroImagePosition = activeMemorial?.heroImagePosition ?? DEFAULT_CROP_VALUE;

  const memories = activeMemorial?.memories ?? [];
  const memoryOfDay = getHomeMemoryOfDay(memories);
  const possessiveName = toPossessive(name, language);

  // ── Hero image edit / change / remove ──────────────────────────────────
  const openCropPicker = ({ uri, current, apply }) => {
    setCropTarget({
      uri,
      current,
      apply,
      replace: async () => {
        const replaced = await pickImageFromLibrary(t);
        if (replaced) setCropTarget((c) => c ? { ...c, uri: replaced.uri } : null);
      },
    });
  };

  const pickHeroImage = async () => {
    if (!activeMemorial) return;
    const result = await pickImageFromLibrary(t);
    if (!result) return;
    const previousUri = portraitUri;
    openCropPicker({
      uri: result.uri,
      current: previousUri === result.uri ? heroImagePosition : DEFAULT_CROP_VALUE,
      apply: (value) => {
        if (previousUri && previousUri !== result.uri) removePersistedMedia(previousUri);
        updateMemorial(activeMemorial.id, {
          heroImage:         result.uri,
          heroImagePosition: value,
        });
        setCropTarget(null);
      },
    });
  };

  const editHeroCrop = () => {
    if (!activeMemorial || !portraitUri) return;
    openCropPicker({
      uri: portraitUri,
      current: heroImagePosition,
      apply: (value) => {
        updateMemorial(activeMemorial.id, { heroImagePosition: value });
        setCropTarget(null);
      },
    });
  };

  const removeHeroImage = () => {
    if (!activeMemorial) return;
    if (portraitUri) removePersistedMedia(portraitUri);
    updateMemorial(activeMemorial.id, {
      heroImage:         '',
      heroImagePosition: DEFAULT_CROP_VALUE,
    });
  };

  return (
    <AppScreen background={SCREEN_BG}>
      {/* Hero card with tap-to-reveal floating image controls. The controls
          stay hidden until the user taps the hero. Tapping a pill runs the
          action and leaves the rest of the menu visible until tapped away. */}
      <View style={styles.heroWrap}>
        <MemoryHeroCard
          imageSource={heroImage}
          fallbackSource={HERO_FALLBACK}
          imagePosition={heroImagePosition}
          memoryLine={heroLine}
          onPress={activeMemorial ? () => setHeroControlsVisible((v) => !v) : undefined}
        />
        {activeMemorial ? (
          <ImageControls
            variant="floating"
            visible={heroControlsVisible}
            hasImage={!!portraitUri}
            onPick={() => { setHeroControlsVisible(false); pickHeroImage(); }}
            onEditCrop={() => { setHeroControlsVisible(false); editHeroCrop(); }}
            onRemove={() => { setHeroControlsVisible(false); removeHeroImage(); }}
            pickLabel={portraitUri ? t('creation.changePortrait') : t('creation.pickPortrait')}
            editLabel={t('imageCrop.edit')}
            removeLabel={t('creation.removePortrait')}
          />
        ) : null}
      </View>

      <MemoryOfDayCard
        memory={memoryOfDay}
        eyebrow={t('home.memoryOfDay')}
        title={t('home.memoryOfDayTitle', { name: possessiveName })}
        emptyBody={t('home.memoryEmpty')}
        openLabel={t('home.openMemory')}
        onPress={() => navigation.navigate('Wall', memoryOfDay ? { highlightMemoryId: memoryOfDay.id } : undefined)}
      />

      <DailyQuoteCard
        eyebrow={t('home.dailyQuote')}
        quote={t('quote')}
      />

      <View style={styles.actions}>
        <ActionTile icon="image"    label={t('tab.wall')}     onPress={() => navigation.navigate('Wall')} />
        <ActionTile icon="mail"     label={t('tab.letters')}  onPress={() => navigation.navigate('Letters')} />
        <ActionTile icon="calendar" label={t('tab.calendar')} onPress={() => navigation.navigate('Calendar')} />
        <ActionTile icon="heart"    label={t('tab.memorial')} onPress={() => navigation.navigate('Memorial')} />
      </View>

      {/* Same crop modal used everywhere — preview = final card. */}
      <ImageCropAspectPicker
        visible={!!cropTarget}
        uri={cropTarget?.uri}
        initialValue={cropTarget?.current}
        onApply={cropTarget?.apply}
        onCancel={() => setCropTarget(null)}
        onReplace={cropTarget?.replace}
      />
    </AppScreen>
  );
}

function MemoryOfDayCard({ memory, eyebrow, title, emptyBody, openLabel, onPress }) {
  const { themeColors } = useTheme();
  const hasMemory = !!memory;
  const body = memory?.body || memory?.text || emptyBody;
  return (
    <AppCard
      variant="soft"
      onPress={onPress}
      style={styles.memoryCard}
      contentStyle={styles.memoryCardContent}
    >
      <View style={styles.memoryCopy}>
        <SectionLabel variant="pill" style={styles.eyebrow}>{eyebrow}</SectionLabel>
        {hasMemory ? (
          <Text
            style={[styles.memoryTitle, { color: themeColors.textPrimary }]}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.84}
          >
            {title}
          </Text>
        ) : null}
        <Text style={styles.memoryBody} numberOfLines={3}>{hasMemory ? body : emptyBody}</Text>
        <View style={styles.openRow}>
          <Text style={[styles.openLink, { color: themeColors.moss }]}>{openLabel}</Text>
          <Text style={[styles.openArrow, { color: themeColors.moss }]}>→</Text>
        </View>
      </View>

      <View style={styles.memoryDecor} pointerEvents="none">
        <View style={styles.memoryDecorBg} />
        <Feather
          name="feather"
          size={36}
          color="rgba(154, 118, 87, 0.46)"
          style={styles.memoryDecorIcon}
        />
        <Text style={styles.memoryChevron}>›</Text>
      </View>
    </AppCard>
  );
}

function toPossessive(name, language) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return language === 'fi' ? 'Rakkaan' : 'Beloved';
  if (language !== 'fi') return /s$/i.test(trimmed) ? `${trimmed}'` : `${trimmed}'s`;
  const last = trimmed[trimmed.length - 1]?.toLowerCase() || '';
  return 'aeiouäöy'.includes(last) ? `${trimmed}n` : `${trimmed}in`;
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
      <Text style={styles.tileChevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Wrapper so the floating ImageControls can be absolutely positioned over
  // the hero card without breaking the -34px overlap below.
  heroWrap: { position: 'relative', zIndex: 1 },

  memoryCard: {
    marginTop:    -34,
    paddingTop:   48,
    paddingBottom: 15,
    marginBottom: 14,
    borderRadius: radii.memoryImg,
    borderColor:  colors.cardBorder,
    padding:      0,
  },
  memoryCardContent: {
    flexDirection: 'row',
    alignItems:    'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop:    0,
    paddingBottom: 0,
  },
  memoryCopy: {
    flex:     1,
    minWidth: 0,
  },
  memoryDecor: {
    position: 'relative',
    width:    78,
    height:   86,
    marginRight: -9,
    marginBottom: -15,
    opacity:  0.56,
  },
  memoryDecorBg: {
    position: 'absolute',
    right:    -30,
    bottom:   0,
    width:    78,
    height:   78,
    borderTopLeftRadius: 999,
    backgroundColor: 'rgba(230, 216, 192, 0.42)',
  },
  memoryDecorIcon: {
    position: 'absolute',
    right:    4,
    bottom:   18,
  },
  memoryChevron: {
    position: 'absolute',
    right:    -2,
    bottom:   2,
    fontSize: 28,
    color:    'rgba(48, 56, 45, 0.68)',
    fontFamily: typography.sans,
    fontWeight: typography.weights.medium,
    lineHeight: 28,
    includeFontPadding: false,
  },
  eyebrow: { marginBottom: 9 },
  memoryTitle: {
    fontFamily:   typography.serif,
    fontSize:     typography.sizes.memoryOfDay,
    lineHeight:   24,
    color:        colors.textPrimary,
    marginBottom: 6,
  },
  memoryBody: {
    fontSize:   typography.sizes.footnote,
    lineHeight: 18,
    color:      colors.textMuted,
  },
  openRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
    marginTop:     8,
  },
  openLink: {
    color:      colors.moss,
    fontSize:   12.5,
    fontWeight: typography.weights.heavy,
  },
  openArrow: {
    color:      colors.moss,
    fontSize:   15,
    fontWeight: typography.weights.heavy,
    lineHeight: 15,
  },
  quoteCard: {
    paddingTop:    14,
    paddingBottom: 16,
    marginBottom:  14,
    borderRadius:  radii.memoryImg,
  },
  quote: {
    fontFamily: typography.serif,
    fontStyle:  'italic',
    fontSize:   typography.sizes.blockquote,
    lineHeight: typography.lineHeights.quote,
    color:      colors.brown,
    fontWeight: typography.weights.medium,
  },
  actions: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           12,
    marginBottom:  14,
  },
  tile: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
    width:         '48%',
    flexGrow:      1,
    minHeight:     78,
    paddingVertical:   14,
    paddingLeft:       12,
    paddingRight:      10,
    borderRadius:      radii.button,
    borderWidth:       1,
    borderColor:       colors.cardBorder,
    backgroundColor:   'rgba(255, 244, 222, 0.88)',
    ...shadows.soft,
  },
  tilePressed: { transform: [{ scale: 0.98 }], opacity: 0.94 },
  tileIcon: {
    width:           46,
    height:          46,
    borderRadius:    23,
    backgroundColor: '#47533e',
    alignItems:      'center',
    justifyContent:  'center',
  },
  tileLabel: {
    flex:       1,
    fontFamily: typography.serif,
    fontSize:   typography.sizes.sectionLabel,
    fontWeight: typography.weights.bold,
    color:      colors.textPrimary,
  },
  tileChevron: {
    color:    'rgba(48, 56, 45, 0.72)',
    fontSize: 26,
    lineHeight: 26,
    includeFontPadding: false,
  },
});
