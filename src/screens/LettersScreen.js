import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useI18n } from '../i18n';
import { useMemorials } from '../state/MemorialContext';
import { formatDate, getMemorialName, toAllative } from '../models/memorial';
import {
  colors,
  radii,
  shadows,
  spacing,
  typography,
} from '../theme/designSystem';
import AppScreen from '../components/AppScreen';
import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import EmptyStateCard from '../components/EmptyStateCard';
import { useTheme } from '../state/ThemeContext';

const SCREEN_BG = require('../../assets/bg-kirjeet.png');

// PWA Letters mirrors styles.css `.screen[data-screen="letters"]`:
//   transparent topbar (h2) → .add-card-toggle → .form-card.is-collapsed → list
// The form card is inline — see comments in MemoryWallScreen.
export default function LettersScreen() {
  const { t, language } = useI18n();
  const { activeMemorial, addLetter, deleteLetter } = useMemorials();
  const { themeColors } = useTheme();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const letters = activeMemorial?.letters ?? [];

  const openAdd = () => {
    setTitle('');
    setBody('');
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setTitle('');
    setBody('');
  };

  const save = () => {
    if (!title.trim() && !body.trim()) { close(); return; }

    addLetter(activeMemorial.id, {
      title: title.trim() || `Kirje ${toAllative(getMemorialName(activeMemorial), language)}`,
      body:  body.trim(),
      createdAt: new Date().toISOString(),
    });
    close();
  };

  const confirmDelete = (letter) => {
    Alert.alert(
      t('delete.letterTitle'),
      t('delete.letterBody'),
      [
        { text: t('delete.cancel'), style: 'cancel' },
        {
          text: t('delete.confirm'),
          style: 'destructive',
          onPress: () => deleteLetter(activeMemorial.id, letter.id),
        },
      ],
    );
  };

  return (
    <AppScreen scroll={false} background={SCREEN_BG} contentStyle={styles.noInnerPad}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* PWA `.topbar` static override → transparent h2 */}
        <View style={styles.wallHeader}>
          <Text style={[styles.wallTitle, { color: themeColors.textPrimary }]}>{t('letters.title')}</Text>
        </View>

        {!open ? (
          <Pressable
            onPress={openAdd}
            style={({ pressed }) => [styles.addToggle, { backgroundColor: themeColors.card, borderColor: themeColors.borderWarm }, pressed && styles.addTogglePressed]}
            accessibilityRole="button"
          >
            <View style={[styles.addIcon, { backgroundColor: themeColors.moss }]}>
              <Text style={styles.addPlus}>+</Text>
            </View>
            <Text style={[styles.addLabel, { color: themeColors.textPrimary }]}>{t('letters.add')}</Text>
          </Pressable>
        ) : (
          // PWA `.form-card.letter-editor`
          <View style={styles.formCardShadow}>
            <View style={[styles.formCard, { backgroundColor: themeColors.card, borderColor: themeColors.borderWarm }]}>
              <Pressable
                onPress={close}
                hitSlop={6}
                style={({ pressed }) => [styles.closeBtn, { backgroundColor: themeColors.surfaceWarm }, pressed && { opacity: 0.7 }]}
                accessibilityRole="button"
              >
                <Text style={styles.closeBtnText}>×</Text>
              </Pressable>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>{t('letters.form.title')}</Text>
                <AppInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder={t('letters.form.titlePlaceholder')}
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>{t('letters.form.body')}</Text>
                {/* PWA `.letter-editor textarea { min-height: 190 }` */}
                <AppInput
                  value={body}
                  onChangeText={setBody}
                  placeholder={t('letters.form.bodyPlaceholder')}
                  multiline
                  inputStyle={styles.letterTextarea}
                />
              </View>

              <AppButton label={t('letters.form.save')} onPress={save} />
            </View>
          </View>
        )}

        {letters.length === 0 ? (
          <EmptyStateCard eyebrow={t('letters.title')} body={t('letters.empty')} />
        ) : (
          <View style={styles.grid}>
            {letters.map((l) => (
              <LetterCard
                key={l.id}
                letter={l}
                language={language}
                onDelete={() => confirmDelete(l)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}

// PWA `.letter-card.card { padding: 16; bg: rgba(251,247,239,0.92) }`
function LetterCard({ letter, language, onDelete }) {
  const { themeColors } = useTheme();
  return (
    <View style={styles.letterCardShadow}>
      <View style={[styles.letterCard, { backgroundColor: themeColors.card, borderColor: themeColors.borderWarm }]}>
        <View style={styles.cardActions}>
          <Pressable onPress={onDelete} hitSlop={8} style={[styles.actionPill, styles.deletePill]}>
            <Feather name="trash-2" size={12} color="#fffaf0" />
          </Pressable>
        </View>

        <View style={styles.letterBody}>
          {letter.createdAt ? (
            <Text style={[styles.dateLine, { color: themeColors.brown }]}>{formatDate(letter.createdAt, language)}</Text>
          ) : null}
          <Text style={[styles.letterTitle, { color: themeColors.textPrimary }]} numberOfLines={2}>{letter.title}</Text>
          {letter.body ? (
            <Text style={styles.letterBodyText} numberOfLines={5}>{letter.body}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  noInnerPad: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0 },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop:    spacing.sm,
    paddingBottom: 150,
  },

  wallHeader: { paddingTop: 6, paddingBottom: 14 },
  wallTitle: {
    fontFamily:    typography.serif,
    fontSize:      typography.sizes.h2,
    lineHeight:    typography.lineHeights.h2,
    fontWeight:    typography.weights.bold,
    color:         colors.textPrimary,
    letterSpacing: typography.letterSpacing.title,
  },

  // PWA `.add-card-toggle`
  addToggle: {
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
    minHeight:      96,
    borderRadius:   radii.card,
    borderWidth:    1,
    borderColor:    colors.warmBorder,
    backgroundColor: 'rgba(255, 244, 222, 0.98)',
    marginBottom:   12,
    ...shadows.card,
  },
  addTogglePressed: { transform: [{ scale: 0.99 }], opacity: 0.95 },
  addIcon: {
    width:           42,
    height:          42,
    borderRadius:    21,
    backgroundColor: colors.moss,
    alignItems:      'center',
    justifyContent:  'center',
  },
  addPlus: {
    fontSize:   27,
    fontWeight: typography.weights.semibold,
    color:      colors.textOnPrimary,
    lineHeight: 32,
    textAlign:  'center',
    includeFontPadding: false,
  },
  addLabel: {
    fontSize:   15,
    fontWeight: typography.weights.bold,
    color:      colors.textPrimary,
  },

  // PWA `.form-card` inline
  formCardShadow: {
    borderRadius: radii.card,
    marginBottom: 12,
    ...shadows.soft,
  },
  formCard: {
    position:        'relative',
    borderRadius:    radii.card,
    borderWidth:     1,
    borderColor:     colors.warmBorder,
    backgroundColor: 'rgba(255, 244, 222, 0.98)',
    padding:         spacing.md,
    gap:             14,
  },
  closeBtn: {
    position:        'absolute',
    top:             10,
    right:           10,
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: 'rgba(255, 244, 222, 0.90)',
    borderWidth:     1,
    borderColor:     colors.warmBorder,
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          2,
  },
  closeBtnText: {
    fontSize:   22,
    color:      colors.mossDark,
    lineHeight: 24,
    includeFontPadding: false,
  },
  formField: { gap: 0 },
  fieldLabel: {
    fontSize:     typography.sizes.label,
    fontWeight:   typography.weights.bold,
    color:        colors.textPrimary,
    marginBottom: 8,
  },
  // PWA `.letter-editor textarea { min-height: 190 }`
  letterTextarea: { minHeight: 190 },

  // PWA `.letter-list { gap: 12 }`
  grid: { gap: 12 },

  letterCardShadow: {
    borderRadius: radii.card,
    ...shadows.soft,
  },
  letterCard: {
    overflow:        'hidden',
    borderRadius:    radii.card,
    borderWidth:     1,
    borderColor:     colors.warmBorder,
    backgroundColor: 'rgba(255, 244, 222, 0.96)',
  },
  cardActions: {
    position:      'absolute',
    top:           12,
    right:         12,
    flexDirection: 'row',
    gap:           6,
    zIndex:        2,
  },
  actionPill: {
    minHeight:       36,
    paddingHorizontal: 13,
    borderRadius:    999,
    backgroundColor: 'rgba(255, 244, 222, 0.90)',
    borderWidth:     1,
    borderColor:     colors.warmBorder,
    alignItems:      'center',
    justifyContent:  'center',
  },
  deletePill: {
    backgroundColor: 'rgba(143, 77, 56, 0.92)',
    borderColor:     'transparent',
  },
  letterBody: { padding: spacing.md },
  dateLine: {
    fontFamily:   typography.serif,
    fontSize:     typography.sizes.italicNote,
    fontStyle:    'italic',
    fontWeight:   typography.weights.medium,
    color:        colors.brown,
    lineHeight:   typography.lineHeights.italicNote,
    marginBottom: 6,
  },
  letterTitle: {
    fontFamily:   typography.serif,
    fontSize:     typography.sizes.title,
    lineHeight:   typography.lineHeights.title,
    fontWeight:   typography.weights.regular,
    color:        colors.textPrimary,
    marginBottom: 8,
  },
  letterBodyText: {
    color:      colors.textMuted,
    fontSize:   typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
});
