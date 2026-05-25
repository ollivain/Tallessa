import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useI18n } from '../i18n';
import { useMemorials } from '../state/MemorialContext';
import {
  colors,
  typography,
  spacing,
  radii,
  shadows,
} from '../theme/designSystem';
import AppScreen from '../components/AppScreen';
import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import EmptyStateCard from '../components/EmptyStateCard';

const SCREEN_BG = require('../../assets/bg-muistot.png');
import {
  pickImageFromLibrary,
  pickVideoFromLibrary,
  removePersistedMedia,
} from '../lib/media';
import { uploadMedia, UploadError } from '../lib/uploadMedia';
import { isSupabaseConfigured } from '../lib/supabase';
import { useTheme } from '../state/ThemeContext';

const MODE_ADD  = 'add';
const MODE_EDIT = 'edit';

export default function MemoryWallScreen() {
  const { t } = useI18n();
  const { activeMemorial, addMemory, updateMemory, deleteMemory } = useMemorials();
  const { themeColors } = useTheme();

  const [modalMode, setModalMode] = useState(MODE_ADD);
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [media, setMedia] = useState(null);
  const [uploading, setUploading] = useState(false);

  const memories = activeMemorial?.memories ?? [];

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
    setMedia(null);
    setOpen(true);
  };

  const openEdit = (memory) => {
    setModalMode(MODE_EDIT);
    setEditingId(memory.id);
    setTitle(memory.title ?? '');
    setBody(memory.body ?? '');
    setMedia(
      memory.mediaUri
        ? { type: memory.mediaType, uri: memory.mediaUri, _persisted: true }
        : null,
    );
    setOpen(true);
  };

  const close = () => {
    if (media?.uri && !media._persisted) removePersistedMedia(media.uri);
    setOpen(false);
    setTitle('');
    setBody('');
    setMedia(null);
    setEditingId(null);
  };

  const swapMedia = (next) => {
    if (media?.uri && !media._persisted && media.uri !== next?.uri) {
      removePersistedMedia(media.uri);
    }
    setMedia(next);
  };

  const onPickImage = async () => {
    const result = await pickImageFromLibrary(t);
    if (result) swapMedia({ type: 'image', uri: result.uri, mimeType: result.mimeType });
  };

  const onPickVideo = async () => {
    const result = await pickVideoFromLibrary(t);
    if (result) swapMedia({ type: 'video', uri: result.uri, mimeType: result.mimeType });
  };

  const save = async () => {
    if (!title.trim() && !body.trim() && !media) { close(); return; }

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

    const payload = {
      title: title.trim(),
      body: body.trim(),
      date: new Date().toISOString().slice(0, 10),
      mediaType: media?.type ?? null,
      mediaUri: media?.uri ?? null,
      mediaRemoteUrl: uploaded?.publicUrl ?? (media?._persisted ? undefined : null),
      mediaRemotePath: uploaded?.path ?? (media?._persisted ? undefined : null),
    };
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    if (modalMode === MODE_EDIT && editingId) {
      updateMemory(activeMemorial.id, editingId, payload);
    } else {
      addMemory(activeMemorial.id, { ...payload, date: new Date().toISOString().slice(0, 10) });
    }

    setOpen(false);
    setTitle('');
    setBody('');
    setMedia(null);
    setEditingId(null);
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
          onPress: () => {
            deleteMemory(activeMemorial.id, memory.id);
          },
        },
      ],
    );
  };

  return (
    <AppScreen scroll={false} background={SCREEN_BG} contentStyle={styles.noInnerPad}>
      {/* PWA: topbar is position:static, scrolls with content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* PWA: <h2> wall.title — transparent, no divider */}
        <View style={styles.wallHeader}>
          <Text style={[styles.wallTitle, { color: themeColors.textPrimary }]}>{t('wall.title')}</Text>
        </View>

        {/* PWA: .add-card-toggle — card button with + circle and label */}
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
                onEdit={() => openEdit(m)}
                onDelete={() => confirmDelete(m)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add / Edit Modal */}
      <Modal visible={open} animationType="slide" onRequestClose={close} transparent={false}>
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: themeColors.background }]} edges={['top', 'left', 'right']}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalBar}>
              <Pressable onPress={close} hitSlop={12} style={styles.iconBtn}>
                <Feather name="x" size={22} color={themeColors.textPrimary} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={[styles.modalTitle, { color: themeColors.textPrimary }]}>
                {modalMode === MODE_EDIT ? t('wall.edit') : t('wall.add')}
              </Text>

              {/* Media preview — PWA: .memory-draft-preview { border-radius: 18px } */}
              <View style={styles.mediaPreviewBox}>
                {media?.type === 'image' ? (
                  <Image source={{ uri: media.uri }} style={styles.mediaPreview} resizeMode="cover" />
                ) : media?.type === 'video' ? (
                  <VideoClip uri={media.uri} style={styles.mediaPreview} />
                ) : (
                  <View style={styles.mediaPlaceholder}>
                    <Feather name="image" size={32} color={themeColors.brown} />
                  </View>
                )}
              </View>

              {/* Media actions */}
              <View style={styles.mediaActions}>
                <Pressable onPress={onPickImage} style={styles.mediaBtn}>
                  <Feather name="image" size={15} color={themeColors.moss} />
                  <Text style={[styles.mediaBtnLabel, { color: themeColors.moss }]}>
                    {media?.type === 'image' ? t('wall.changeImage') : t('wall.pickImage')}
                  </Text>
                </Pressable>
                <Pressable onPress={onPickVideo} style={styles.mediaBtn}>
                  <Feather name="video" size={15} color={themeColors.moss} />
                  <Text style={[styles.mediaBtnLabel, { color: themeColors.moss }]}>
                    {media?.type === 'video' ? t('wall.changeVideo') : t('wall.pickVideo')}
                  </Text>
                </Pressable>
                {media ? (
                  <Pressable onPress={() => swapMedia(null)} style={styles.mediaBtn}>
                    <Feather name="trash-2" size={15} color={colors.danger} />
                    <Text style={[styles.mediaBtnLabel, { color: colors.danger }]}>
                      {t('wall.removeMedia')}
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              <AppInput
                label={t('mock.memoryTitle')}
                value={title}
                onChangeText={setTitle}
                placeholder={t('mock.memoryTitle')}
                style={styles.inputWrap}
              />
              <AppInput
                label={t('mock.memoryBody')}
                value={body}
                onChangeText={setBody}
                placeholder={t('mock.memoryBody')}
                multiline
                style={styles.inputWrap}
              />

              <AppButton
                label={uploading ? t('media.uploading') : t('creation.save')}
                onPress={save}
                disabled={uploading}
                style={styles.saveBtn}
              />
              {uploading ? (
                <View style={styles.uploadingRow}>
                  <ActivityIndicator color={themeColors.moss} />
                  <Text style={styles.uploadingText}>{t('media.uploading')}</Text>
                </View>
              ) : null}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </AppScreen>
  );
}

// PWA: .memory-card.card — overflow:hidden card, full-bleed media, body padding
function MemoryCard({ memory, t, onEdit, onDelete }) {
  const { themeColors } = useTheme();
  return (
    // Shadow wrapper separate from overflow:hidden (RN clips shadow if overflow:hidden)
    <View style={styles.memCardShadow}>
      <View style={[styles.memCard, { backgroundColor: themeColors.card }]}>
        {/* Full-bleed media — PWA: .memory-card .media-preview { min-height: 230px } */}
        {memory.mediaUri && memory.mediaType === 'image' ? (
          <Image source={{ uri: memory.mediaUri }} style={styles.memMedia} resizeMode="cover" />
        ) : memory.mediaUri && memory.mediaType === 'video' ? (
          <VideoClip uri={memory.mediaUri} style={styles.memMedia} />
        ) : (
          <View style={styles.memMediaPlaceholder} />
        )}

        {/* PWA: .delete-action — absolute pill buttons over media */}
        <View style={styles.memActions}>
          <Pressable onPress={onEdit} hitSlop={8} style={styles.memActionPill}>
            <Feather name="edit-2" size={12} color={themeColors.moss} />
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={8} style={[styles.memActionPill, styles.memDeletePill]}>
            <Feather name="trash-2" size={12} color="#fffaf0" />
          </Pressable>
        </View>

        {/* PWA: .memory-body { padding: 16px } */}
        <View style={styles.memBody}>
          {/* PWA: .date-line — brown, serif, italic */}
          {memory.date ? (
            <Text style={[styles.dateLine, { color: themeColors.brown }]}>{memory.date}</Text>
          ) : null}
          {memory.title ? (
            <Text style={[styles.memTitle, { color: themeColors.textPrimary }]}>{memory.title}</Text>
          ) : null}
          {memory.body ? (
            <Text style={styles.memBodyText} numberOfLines={5}>{memory.body}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function VideoClip({ uri, style }) {
  const player = useVideoPlayer(uri, (p) => { p.loop = false; });
  return <VideoView player={player} nativeControls contentFit="cover" style={style} />;
}

const styles = StyleSheet.create({
  noInnerPad: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0 },
  // PWA: screen padding matches shell + topbar reset (padding-top: 6px after static reset)
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 150,
  },

  // PWA: .topbar { h2 } — transparent, static, large serif title
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

  // PWA: .add-card-toggle — white card, 96px, + circle, label
  addToggle: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 96,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: 'rgba(255, 250, 240, 0.98)',
    marginBottom: 12,
    ...shadows.card,
  },
  addTogglePressed: { transform: [{ scale: 0.99 }], opacity: 0.95 },
  addIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.moss,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPlus: {
    fontSize: 27,
    fontWeight: '600',
    color: colors.textOnPrimary,
    lineHeight: 32,
    textAlign: 'center',
    includeFontPadding: false,
  },
  addLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // PWA: .memory-grid { gap: 12px }
  grid: { gap: 12 },

  // Shadow wrapper (shadow separate from overflow:hidden)
  memCardShadow: {
    borderRadius: 24,
    ...shadows.soft,
  },
  // PWA: .memory-card.card — overflow:hidden, border-radius:24px, border:1px var(--line), bg rgba(255,250,240,0.98)
  memCard: {
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: 'rgba(255, 250, 240, 0.98)',
  },
  // PWA: .memory-card .media-preview { min-height: 230px; background-color: var(--sand) }
  memMedia: {
    width: '100%',
    height: 230,
  },
  memMediaPlaceholder: {
    width: '100%',
    height: 230,
    backgroundColor: colors.surface,
  },
  // PWA: .delete-action { position:absolute; top:12px; right:12px; border-radius:999px }
  memActions: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 6,
    zIndex: 2,
  },
  memActionPill: {
    minHeight: 36,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 250, 240, 0.88)',
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // PWA: .delete-action { background: rgba(143,77,56,0.92) }
  memDeletePill: {
    backgroundColor: 'rgba(143, 77, 56, 0.92)',
    borderColor: 'transparent',
  },
  // PWA: .memory-body { padding: 16px }
  memBody: {
    padding: 16,
  },
  // PWA: .date-line { font-family:serif; font-size:1.12rem; font-style:italic; font-weight:500; color:var(--brown) }
  dateLine: {
    fontFamily: typography.serif,
    fontSize: 18,
    fontStyle: 'italic',
    fontWeight: '500',
    color: colors.brown,
    lineHeight: 21,
    marginBottom: 6,
  },
  memTitle: {
    fontFamily: typography.serif,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: 4,
  },
  // PWA: .memory-body p { color:var(--muted); line-height:1.6 }
  memBodyText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 24,
  },

  // Modal
  modalSafe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  modalBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  iconBtn: { padding: spacing.xs },
  modalScroll: { paddingHorizontal: spacing.xl, paddingBottom: 60 },
  modalTitle: {
    fontFamily: typography.serif,
    fontSize: typography.sizes.titleLarge,
    fontWeight: typography.weights.regular,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    letterSpacing: 0.3,
  },
  // PWA: .memory-draft-preview { border-radius: 18px }
  mediaPreviewBox: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  // PWA: .memory-draft-preview .media-preview { min-height: 230px }
  mediaPreview: { width: '100%', height: 230 },
  mediaPlaceholder: {
    width: '100%',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  mediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.card,
  },
  mediaBtnLabel: {
    fontSize: typography.sizes.label,
    color: colors.moss,
    letterSpacing: 0.3,
  },
  inputWrap: { marginBottom: spacing.md },
  saveBtn: { marginTop: spacing.xs },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  uploadingText: {
    fontSize: typography.sizes.label,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
});
