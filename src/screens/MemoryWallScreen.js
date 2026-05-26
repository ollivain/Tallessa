import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useI18n } from '../i18n';
import { useMemorials } from '../state/MemorialContext';
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
import ImageCropAspectPicker, { DEFAULT_CROP_VALUE } from '../components/ImageCropAspectPicker';
import PositionedImage from '../components/PositionedImage';

// Shared default so saved metadata has a consistent shape everywhere.
const DEFAULT_IMAGE_POSITION = DEFAULT_CROP_VALUE;

const SCREEN_BG = require('../../assets/bg-muistot.png');
import {
  DEFAULT_VIDEO_CLIP_SECONDS,
  pickImageFromLibrary,
  pickVideoFromLibrary,
  removePersistedMedia,
} from '../lib/media';
import { createMemory, formatDate, parseDateInput } from '../models/memorial';
import { deleteUploadedMedia, uploadMedia, UploadError } from '../lib/uploadMedia';
import { isSupabaseConfigured } from '../lib/supabase';
import { useTheme } from '../state/ThemeContext';

const MODE_ADD  = 'add';
const MODE_EDIT = 'edit';

// PWA Memory wall mirrors styles.css `.screen[data-screen="wall"]`:
//   transparent topbar (h2) → .add-card-toggle → .form-card.is-collapsed → grid.
// The form card is inline (not a modal); tapping `data-open-card="memory"`
// removes `.is-collapsed`, tapping `data-close-card="memory"` re-adds it.
// We mirror that behaviour with a local `open` state.
export default function MemoryWallScreen({ route }) {
  const { t, language } = useI18n();
  const { activeMemorial, addMemory, updateMemory, deleteMemory } = useMemorials();
  const { themeColors } = useTheme();

  const [modalMode, setModalMode] = useState(MODE_ADD);
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [calendarDate, setCalendarDate] = useState('');
  const [media, setMedia] = useState(null);
  const [imagePosition, setImagePosition] = useState(DEFAULT_IMAGE_POSITION);
  const [uploading, setUploading] = useState(false);
  const [cropTarget, setCropTarget] = useState(null);

  const memories = activeMemorial?.memories ?? [];
  const highlightedMemoryId = route?.params?.highlightMemoryId ?? null;

  const mediaRef = useRef(null);
  useEffect(() => { mediaRef.current = media; }, [media]);
  useEffect(() => () => {
    if (mediaRef.current?.uri && !mediaRef.current._persisted) {
      removePersistedMedia(mediaRef.current.uri);
    }
  }, []);

  const openAdd = () => {
    setModalMode(MODE_ADD);
    setEditingId(null);
    setTitle('');
    setBody('');
    setCalendarDate('');
    setMedia(null);
    setImagePosition(DEFAULT_IMAGE_POSITION);
    setOpen(true);
  };

  const openEdit = (memory) => {
    setModalMode(MODE_EDIT);
    setEditingId(memory.id);
    setTitle(memory.title ?? '');
    setBody(memory.body ?? memory.text ?? '');
    setCalendarDate(memory.calendarDate ?? memory.date ?? '');
    setMedia(
      getMemoryMediaUri(memory)
        ? { type: getMemoryMediaType(memory), uri: getMemoryMediaUri(memory), _persisted: true }
        : null,
    );
    setImagePosition(memory.imagePosition ?? DEFAULT_IMAGE_POSITION);
    setOpen(true);
  };

  const close = () => {
    if (media?.uri && !media._persisted) removePersistedMedia(media.uri);
    setOpen(false);
    setTitle('');
    setBody('');
    setCalendarDate('');
    setMedia(null);
    setImagePosition(DEFAULT_IMAGE_POSITION);
    setEditingId(null);
  };

  const swapMedia = (next) => {
    if (media?.uri && !media._persisted && media.uri !== next?.uri) {
      removePersistedMedia(media.uri);
    }
    setMedia(next);
    if (next?.type === 'image') setImagePosition(DEFAULT_IMAGE_POSITION);
  };

  // Open the crop modal for the freshly chosen image. Only commits after
  // the user presses "Use this picture" — guaranteeing the preview matches
  // the final memory card render.
  const openCropPicker = ({ uri, mimeType, current }) => {
    setCropTarget({
      uri,
      mimeType,
      current,
      apply: (value) => {
        swapMedia({ type: 'image', uri, mimeType });
        setImagePosition(value);
        setCropTarget(null);
      },
      replace: async () => {
        const replaced = await pickImageFromLibrary(t);
        if (replaced) {
          setCropTarget((c) => c ? { ...c, uri: replaced.uri, mimeType: replaced.mimeType } : null);
        }
      },
    });
  };

  const onPickImage = async () => {
    const result = await pickImageFromLibrary(t);
    if (!result) return;
    openCropPicker({
      uri:      result.uri,
      mimeType: result.mimeType,
      current:  media?.type === 'image' && media?.uri === result.uri ? imagePosition : DEFAULT_IMAGE_POSITION,
    });
  };

  const onEditCrop = () => {
    if (media?.type !== 'image') return;
    openCropPicker({
      uri:      media.uri,
      mimeType: media.mimeType,
      current:  imagePosition,
    });
  };

  const onPickVideo = async () => {
    const result = await pickVideoFromLibrary(t, { maxDurationSeconds: DEFAULT_VIDEO_CLIP_SECONDS });
    if (!result) return;
    if (result.durationMillis && result.durationMillis > DEFAULT_VIDEO_CLIP_SECONDS * 1000) {
      Alert.alert(t('wall.pickVideo'), t('media.videoNoNativeTrim'));
    }
    swapMedia({
      type: 'video',
      uri: result.uri,
      mimeType: result.mimeType,
      durationMillis: result.durationMillis,
    });
  };

  const save = async () => {
    if (!body.trim() && !media) { close(); return; }
    const memoryDate = parseDateInput(calendarDate);

    const mediaChanged = media && !media._persisted;
    let uploaded = null;
    if (mediaChanged && isSupabaseConfigured()) {
      try {
        setUploading(true);
        uploaded = await uploadMedia(media);
      } catch (e) {
        const code = e?.message;
        const errBody =
          code === UploadError.NOT_CONFIGURED ? t('media.uploadErrorNotConfigured')
          : code === UploadError.NETWORK       ? t('media.uploadErrorNetwork')
                                               : t('media.uploadErrorGeneric');
        Alert.alert(t('media.uploadErrorTitle'), errBody);
      } finally {
        setUploading(false);
      }
    }

    const videoDurationSeconds = media?.type === 'video' && media.durationMillis
      ? Math.round(media.durationMillis / 1000)
      : null;
    const canClaimTenSecondClip = media?.type === 'video' && videoDurationSeconds && videoDurationSeconds <= DEFAULT_VIDEO_CLIP_SECONDS;
    const payload = createMemory({
      type: media?.type ?? 'image',
      media: uploaded?.publicUrl ?? media?.uri ?? '',
      storagePath: uploaded?.path ?? (media?._persisted ? undefined : ''),
      draft: media?.type === 'video' && canClaimTenSecondClip
        ? { clipStart: 0, clipEnd: videoDurationSeconds }
        : { position: imagePosition },
      text: body.trim() || payload.text,
      calendarDate: memoryDate,
      videoClipSeconds: canClaimTenSecondClip ? videoDurationSeconds : undefined,
      fallbackText: t('wall.memoryNoWords'),
    });
    Object.assign(payload, {
      title: title.trim(),
      body: body.trim(),
      text: body.trim(),
      date: memoryDate,
      calendarDate: memoryDate,
      createdAt: modalMode === MODE_ADD ? new Date().toISOString() : undefined,
      mediaType: media?.type ?? 'image',
      mediaUri: media?.uri ?? null,
      mediaRemoteUrl: uploaded?.publicUrl ?? (media?._persisted ? undefined : null),
      mediaRemotePath: uploaded?.path ?? (media?._persisted ? undefined : null),
      type: media?.type ?? 'image',
      media: uploaded?.publicUrl ?? media?.uri ?? '',
      storagePath: uploaded?.path ?? (media?._persisted ? undefined : ''),
      imagePosition: media?.type === 'video' ? undefined : imagePosition,
      videoDurationSeconds: media?.type === 'video' ? videoDurationSeconds : undefined,
      isTrimmed: media?.type === 'video' ? false : undefined,
      clipStart: canClaimTenSecondClip ? 0 : undefined,
      clipEnd: canClaimTenSecondClip ? videoDurationSeconds : undefined,
    });
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    if (modalMode === MODE_EDIT && editingId) {
      updateMemory(activeMemorial.id, editingId, payload);
    } else {
      addMemory(activeMemorial.id, payload);
    }

    close();
  };

  const confirmDelete = (memory) => {
    Alert.alert(
      t('delete.memoryTitle'),
      t('delete.memoryBody'),
      [
        { text: t('delete.cancel'), style: 'cancel' },
        {
          text: t('delete.confirm'),
          style: 'destructive',
          onPress: async () => {
            await deleteUploadedMedia(memory.storagePath || memory.mediaRemotePath);
            removePersistedMedia(memory.mediaUri);
            deleteMemory(activeMemorial.id, memory.id);
          },
        },
      ],
    );
  };

  return (
    <AppScreen scroll={false} background={SCREEN_BG} contentStyle={styles.noInnerPad}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* PWA `.topbar` static override on content screens: transparent + h2 */}
        <View style={styles.wallHeader}>
          <Text style={[styles.wallTitle, { color: themeColors.textPrimary }]}>{t('wall.title')}</Text>
        </View>

        {/* PWA `.add-card-toggle` (collapsed) → form-card (expanded).
            Mirroring PWA: when the form is open, the add toggle hides. */}
        {!open ? (
          <Pressable
            onPress={openAdd}
            style={({ pressed }) => [styles.addToggle, { backgroundColor: themeColors.card }, pressed && styles.addTogglePressed]}
            accessibilityRole="button"
          >
            <View style={[styles.addIcon, { backgroundColor: themeColors.moss }]}>
              <Text style={styles.addPlus}>+</Text>
            </View>
            <Text style={[styles.addLabel, { color: themeColors.textPrimary }]}>{t('wall.add')}</Text>
          </Pressable>
        ) : (
          <InlineMemoryForm
            t={t}
            themeColors={themeColors}
            mode={modalMode}
            title={title}
            setTitle={setTitle}
            body={body}
            setBody={setBody}
            calendarDate={calendarDate}
            setCalendarDate={setCalendarDate}
            media={media}
            imagePosition={imagePosition}
            onPickImage={onPickImage}
            onPickVideo={onPickVideo}
            onRemoveMedia={() => swapMedia(null)}
            onEditCrop={onEditCrop}
            uploading={uploading}
            onSave={save}
            onClose={close}
          />
        )}

        {/* Memory grid */}
        {!activeMemorial ? (
          <EmptyStateCard eyebrow={t('wall.title')} body={t('wall.noMemorial')} />
        ) : memories.length === 0 ? (
          <EmptyStateCard eyebrow={t('wall.title')} body={t('wall.empty')} />
        ) : (
          <View style={styles.grid}>
            {memories.map((m) => (
              <MemoryCard
                key={m.id}
                memory={m}
                t={t}
                language={language}
                highlighted={m.id === highlightedMemoryId}
                onEdit={() => openEdit(m)}
                onDelete={() => confirmDelete(m)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Crop / aspect-ratio picker — same modal used everywhere. */}
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

// PWA `.form-card`: inline form revealed by removing `.is-collapsed`.
// Contains a close-card-button (×) at top-right, media picker, text + date
// inputs, and a Save primary action.
function InlineMemoryForm({
  t,
  themeColors,
  mode,
  title, setTitle,
  body, setBody,
  calendarDate, setCalendarDate,
  media,
  imagePosition,
  onPickImage, onPickVideo, onRemoveMedia, onEditCrop,
  uploading,
  onSave, onClose,
}) {
  return (
    <View style={[styles.formCardShadow]}>
      <View style={[styles.formCard, { backgroundColor: themeColors.card }]}>
        {/* PWA `.close-card-button` — 44px round top-right */}
        <Pressable
          onPress={onClose}
          hitSlop={6}
          style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
        >
          <Text style={styles.closeBtnText}>×</Text>
        </Pressable>

        {/* PWA: media preview inside `.memory-draft-preview` */}
        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>{t('wall.form.title')}</Text>
          <AppInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('wall.form.titlePlaceholder')}
          />
        </View>

        {/* Media preview — tapping an image re-opens the crop modal so the
            preview here always reflects the saved crop metadata. */}
        {media ? (
          <Pressable
            onPress={media.type === 'image' ? onEditCrop : undefined}
            style={styles.mediaPreviewBox}
          >
            {media.type === 'image' ? (
              <PositionedImage uri={media.uri} position={imagePosition} style={styles.mediaPreview} />
            ) : (
              <VideoClip uri={media.uri} style={styles.mediaPreview} />
            )}
          </Pressable>
        ) : null}

        {/* Media picker buttons */}
        <View style={styles.mediaActions}>
          <Pressable onPress={onPickImage} style={styles.mediaBtn}>
            <Feather name="image" size={15} color={themeColors.moss} />
            <Text style={[styles.mediaBtnLabel, { color: themeColors.moss }]}>
              {media?.type === 'image' ? t('wall.changeImage') : t('wall.pickImage')}
            </Text>
          </Pressable>
          {media?.type === 'image' ? (
            <Pressable onPress={onEditCrop} style={styles.mediaBtn}>
              <Feather name="crop" size={15} color={themeColors.moss} />
              <Text style={[styles.mediaBtnLabel, { color: themeColors.moss }]}>
                {t('imageCrop.edit')}
              </Text>
            </Pressable>
          ) : null}
          <Pressable onPress={onPickVideo} style={styles.mediaBtn}>
            <Feather name="video" size={15} color={themeColors.moss} />
            <Text style={[styles.mediaBtnLabel, { color: themeColors.moss }]}>
              {media?.type === 'video' ? t('wall.changeVideo') : t('wall.pickVideo')}
            </Text>
          </Pressable>
          {media ? (
            <Pressable onPress={onRemoveMedia} style={styles.mediaBtn}>
              <Feather name="trash-2" size={15} color={colors.danger} />
              <Text style={[styles.mediaBtnLabel, { color: colors.danger }]}>
                {t('wall.removeMedia')}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>{t('wall.form.text')}</Text>
          <AppInput
            value={body}
            onChangeText={setBody}
            placeholder={t('wall.form.textPlaceholder')}
            multiline
          />
        </View>

        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>{t('wall.form.calendarDate')}</Text>
          <AppInput
            value={calendarDate}
            onChangeText={setCalendarDate}
            placeholder={t('creation.datePlaceholder')}
          />
        </View>

        <AppButton
          label={uploading ? t('media.uploading') : (mode === MODE_EDIT ? t('creation.save') : t('wall.add'))}
          onPress={onSave}
          disabled={uploading}
        />
        {uploading ? (
          <View style={styles.uploadingRow}>
            <ActivityIndicator color={themeColors.moss} />
            <Text style={styles.uploadingText}>{t('media.uploading')}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// PWA `.memory-card.card`: overflow-hidden, border-radius 24, full-bleed media
// at 230px, body padding 16, date-line (brown italic serif) → optional title
// → muted body p. Delete action: single red pill at top-right; we add a
// matching edit pill so users can re-open the inline form.
function MemoryCard({ memory, t, language, highlighted, onEdit, onDelete }) {
  const { themeColors } = useTheme();
  const dateLabel = formatDate(memory.calendarDate || memory.createdAt, language);
  const text = memory.body || memory.text;
  const mediaUri = getMemoryMediaUri(memory);
  const mediaType = getMemoryMediaType(memory);
  return (
    <View style={styles.memCardShadow}>
      <View style={[
        styles.memCard,
        highlighted && [styles.memCardHighlighted, { borderColor: themeColors.moss }],
        { backgroundColor: themeColors.card },
      ]}>
        {mediaUri && mediaType === 'image' ? (
          <PositionedImage uri={mediaUri} position={memory.imagePosition} style={styles.memMedia} />
        ) : mediaUri && mediaType === 'video' ? (
          <VideoClip uri={mediaUri} style={styles.memMedia} />
        ) : null}

        <View style={styles.memActions}>
          <Pressable onPress={onEdit} hitSlop={8} style={styles.memActionPill}>
            <Feather name="edit-2" size={12} color={themeColors.moss} />
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={8} style={[styles.memActionPill, styles.memDeletePill]}>
            <Feather name="trash-2" size={12} color="#fffaf0" />
          </Pressable>
        </View>

        <View style={styles.memBody}>
          {dateLabel ? (
            <Text style={[styles.dateLine, { color: themeColors.brown }]}>{dateLabel}</Text>
          ) : null}
          {memory.title ? (
            <Text style={[styles.memTitle, { color: themeColors.textPrimary }]}>{memory.title}</Text>
          ) : null}
          {text ? (
            <Text style={styles.memBodyText} numberOfLines={5}>{text}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function getMemoryMediaUri(memory) {
  return memory?.mediaUri || memory?.mediaRemoteUrl || memory?.media || '';
}

function getMemoryMediaType(memory) {
  return memory?.mediaType || memory?.type || null;
}

function VideoClip({ uri, style }) {
  const player = useVideoPlayer(uri, (p) => { p.loop = false; });
  return <VideoView player={player} nativeControls contentFit="cover" style={style} />;
}

const styles = StyleSheet.create({
  noInnerPad: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0 },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop:    spacing.sm,
    paddingBottom: 150,
  },

  // PWA `.topbar` static override → transparent h2 with padding-top:6
  wallHeader: { paddingTop: 6, paddingBottom: 14 },
  wallTitle: {
    fontFamily:    typography.serif,
    fontSize:      typography.sizes.h2,
    lineHeight:    typography.lineHeights.h2,
    fontWeight:    typography.weights.bold,
    color:         colors.textPrimary,
    letterSpacing: typography.letterSpacing.title,
  },

  // PWA `.add-card-toggle { min-height: 96; border-radius: 24; place-items: center }`
  addToggle: {
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
    minHeight:      96,
    borderRadius:   radii.card,
    borderWidth:    1,
    borderColor:    colors.divider,
    backgroundColor: 'rgba(255, 250, 240, 0.98)',
    marginBottom:   12,
    ...shadows.card,
  },
  addTogglePressed: { transform: [{ scale: 0.99 }], opacity: 0.95 },
  // PWA `.add-card-toggle span { width: 42; height: 42; bg: var(--moss) }`
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
  // PWA `.add-card-toggle strong { font-size: 0.95rem }`
  addLabel: {
    fontSize:   15,
    fontWeight: typography.weights.bold,
    color:      colors.textPrimary,
  },

  // PWA `.form-card`: gap 14, padding 16, overflow hidden, position relative
  formCardShadow: {
    borderRadius: radii.card,
    marginBottom: 12,
    ...shadows.soft,
  },
  formCard: {
    position:        'relative',
    borderRadius:    radii.card,
    borderWidth:     1,
    borderColor:     colors.divider,
    backgroundColor: 'rgba(255, 250, 240, 0.98)',
    padding:         spacing.md,
    gap:             14,
  },
  // PWA `.close-card-button { 44×44; top: 10; right: 10; border-radius: 50% }`
  closeBtn: {
    position:        'absolute',
    top:             10,
    right:           10,
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: 'rgba(255, 250, 240, 0.88)',
    borderWidth:     1,
    borderColor:     colors.divider,
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
  // PWA `<label> > span { font-size: 0.86rem; font-weight: 700 }`
  fieldLabel: {
    fontSize:   typography.sizes.label,
    fontWeight: typography.weights.bold,
    color:      colors.textPrimary,
    marginBottom: 8,
  },

  // PWA `.memory-grid { gap: 12 }`
  grid: { gap: 12 },

  // PWA `.memory-card.card` — shadow on wrapper, content overflows hidden
  memCardShadow: {
    borderRadius: radii.card,
    ...shadows.soft,
  },
  memCard: {
    overflow:        'hidden',
    borderRadius:    radii.card,
    borderWidth:     1,
    borderColor:     colors.divider,
    backgroundColor: 'rgba(255, 250, 240, 0.98)',
  },
  memCardHighlighted: { borderWidth: 2 },
  // PWA `.memory-card .media-preview { min-height: 230 }`
  memMedia:            { width: '100%', height: 230 },
  // PWA `.delete-action { top: 12; right: 12; border-radius: 999 }`
  memActions: {
    position:      'absolute',
    top:           12,
    right:         12,
    flexDirection: 'row',
    gap:           6,
    zIndex:        2,
  },
  memActionPill: {
    minHeight:       36,
    paddingHorizontal: 13,
    borderRadius:    999,
    backgroundColor: 'rgba(255, 250, 240, 0.88)',
    borderWidth:     1,
    borderColor:     colors.divider,
    alignItems:      'center',
    justifyContent:  'center',
  },
  memDeletePill: {
    backgroundColor: 'rgba(143, 77, 56, 0.92)',
    borderColor:     'transparent',
  },
  // PWA `.memory-body { padding: 16 }`
  memBody: { padding: spacing.md },
  // PWA `.date-line { brown serif italic 1.12rem }`
  dateLine: {
    fontFamily:   typography.serif,
    fontSize:     typography.sizes.italicNote,
    fontStyle:    'italic',
    fontWeight:   typography.weights.medium,
    color:        colors.brown,
    lineHeight:   typography.lineHeights.italicNote,
    marginBottom: 6,
  },
  // PWA `h3 { font-size: 1.35rem; color: var(--moss-dark) }`
  memTitle: {
    fontFamily:   typography.serif,
    fontSize:     typography.sizes.title,
    fontWeight:   typography.weights.semibold,
    color:        colors.textPrimary,
    lineHeight:   typography.lineHeights.title,
    marginBottom: 4,
  },
  // PWA `.memory-body p { color: var(--muted); line-height: 1.6 }`
  memBodyText: {
    color:      colors.textMuted,
    fontSize:   typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },

  // Inline form media preview (PWA `.memory-draft-preview { border-radius: 18 }`)
  mediaPreviewBox: {
    borderRadius:    radii.lg,
    overflow:        'hidden',
    backgroundColor: colors.surface,
  },
  mediaPreview: { width: '100%', height: 230 },
  mediaActions: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           spacing.xs,
  },
  mediaBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             6,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    borderRadius:    radii.pill,
    borderWidth:     1,
    borderColor:     colors.divider,
    backgroundColor: colors.card,
  },
  mediaBtnLabel: {
    fontSize:      typography.sizes.label,
    color:         colors.moss,
    letterSpacing: 0.3,
  },
  uploadingRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            spacing.xs,
    marginTop:      spacing.xs,
  },
  uploadingText: {
    fontSize:      typography.sizes.label,
    color:         colors.textMuted,
    letterSpacing: 0.5,
  },
});
