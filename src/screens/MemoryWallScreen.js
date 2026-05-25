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
  screenStyles,
} from '../theme/designSystem';
import ScreenHeader from '../components/ScreenHeader';
import AppCard from '../components/AppCard';
import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import EmptyStateCard from '../components/EmptyStateCard';
import SectionLabel from '../components/SectionLabel';
import {
  pickImageFromLibrary,
  pickVideoFromLibrary,
  removePersistedMedia,
} from '../lib/media';
import { uploadMedia, UploadError } from '../lib/uploadMedia';
import { isSupabaseConfigured } from '../lib/supabase';

// Modal mode: 'add' or 'edit'
const MODE_ADD  = 'add';
const MODE_EDIT = 'edit';

export default function MemoryWallScreen() {
  const { t } = useI18n();
  const { activeMemorial, addMemory, updateMemory, deleteMemory } = useMemorials();

  const [modalMode, setModalMode] = useState(MODE_ADD);
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [media, setMedia] = useState(null);  // { type, uri, mimeType }
  const [uploading, setUploading] = useState(false);

  const memories = activeMemorial?.memories ?? [];

  const mediaRef = useRef(null);
  useEffect(() => { mediaRef.current = media; }, [media]);
  // Clean up draft media when the screen unmounts (add mode only)
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
    // Load existing media (mark as persisted so we don't delete on close)
    setMedia(
      memory.mediaUri
        ? { type: memory.mediaType, uri: memory.mediaUri, _persisted: true }
        : null,
    );
    setOpen(true);
  };

  const close = () => {
    // Only clean up newly picked (not yet saved) media
    if (media?.uri && !media._persisted) removePersistedMedia(media.uri);
    setOpen(false);
    setTitle('');
    setBody('');
    setMedia(null);
    setEditingId(null);
  };

  const swapMedia = (next) => {
    // Remove the previous draft if it's new (not already saved to the memory)
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

    // Determine if media actually changed (new pick vs existing)
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
    // Remove undefined keys so existing values are preserved on update
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
            if (memory.mediaRemotePath) {
              // Remote cleanup is fire-and-forget; local file stays as-is
            }
          },
        },
      ],
    );
  };

  if (!activeMemorial) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScreenHeader title={t('wall.title')} subtitle={t('wall.subtitle')} />
        <ScrollView contentContainerStyle={screenStyles.scroll}>
          <EmptyStateCard eyebrow={t('wall.title')} body={t('wall.noMemorial')} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title={t('wall.title')} subtitle={t('wall.subtitle')} />

      <ScrollView contentContainerStyle={screenStyles.scroll}>
        {memories.length === 0 ? (
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

        <AppButton
          label={t('wall.add')}
          onPress={openAdd}
          style={styles.cta}
        />
      </ScrollView>

      {/* Add / Edit Modal */}
      <Modal visible={open} animationType="slide" onRequestClose={close} transparent={false}>
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalBar}>
              <Pressable onPress={close} hitSlop={12} style={styles.iconBtn}>
                <Feather name="x" size={22} color={colors.textPrimary} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalTitle}>
                {modalMode === MODE_EDIT ? t('wall.edit') : t('wall.add')}
              </Text>

              {/* Media preview */}
              <View style={styles.mediaPreviewBox}>
                {media?.type === 'image' ? (
                  <Image source={{ uri: media.uri }} style={styles.mediaPreview} resizeMode="cover" />
                ) : media?.type === 'video' ? (
                  <VideoClip uri={media.uri} style={styles.mediaPreview} />
                ) : (
                  <View style={styles.mediaPlaceholder}>
                    <Feather name="image" size={32} color={colors.brown} />
                  </View>
                )}
              </View>

              {/* Media actions */}
              <View style={styles.mediaActions}>
                <Pressable onPress={onPickImage} style={styles.mediaBtn}>
                  <Feather name="image" size={15} color={colors.moss} />
                  <Text style={styles.mediaBtnLabel}>
                    {media?.type === 'image' ? t('wall.changeImage') : t('wall.pickImage')}
                  </Text>
                </Pressable>
                <Pressable onPress={onPickVideo} style={styles.mediaBtn}>
                  <Feather name="video" size={15} color={colors.moss} />
                  <Text style={styles.mediaBtnLabel}>
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
                  <ActivityIndicator color={colors.moss} />
                  <Text style={styles.uploadingText}>{t('media.uploading')}</Text>
                </View>
              ) : null}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function MemoryCard({ memory, t, onEdit, onDelete }) {
  return (
    <AppCard variant="soft">
      {/* Action bar */}
      <View style={styles.cardActions}>
        <Pressable onPress={onEdit} hitSlop={8} style={styles.cardActionBtn}>
          <Feather name="edit-2" size={14} color={colors.moss} />
        </Pressable>
        <Pressable onPress={onDelete} hitSlop={8} style={styles.cardActionBtn}>
          <Feather name="trash-2" size={14} color={colors.danger} />
        </Pressable>
      </View>

      {/* Media */}
      {memory.mediaUri && memory.mediaType === 'image' ? (
        <Image source={{ uri: memory.mediaUri }} style={styles.thumb} resizeMode="cover" />
      ) : memory.mediaUri && memory.mediaType === 'video' ? (
        <VideoClip uri={memory.mediaUri} style={styles.thumb} />
      ) : (
        <View style={styles.thumbPlaceholder}>
          <Feather name="image" size={22} color={colors.brown} />
        </View>
      )}

      {memory.title ? (
        <Text style={styles.memoryTitle}>{memory.title}</Text>
      ) : null}
      {memory.body ? (
        <Text style={styles.memoryBody} numberOfLines={3}>{memory.body}</Text>
      ) : null}
      {memory.date ? (
        <View style={styles.datePillWrap}>
          <SectionLabel variant="pill">{memory.date}</SectionLabel>
        </View>
      ) : null}
    </AppCard>
  );
}

function VideoClip({ uri, style }) {
  const player = useVideoPlayer(uri, (p) => { p.loop = false; });
  return <VideoView player={player} nativeControls contentFit="cover" style={style} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },

  grid: { gap: spacing.md, marginBottom: spacing.lg },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  cardActionBtn: {
    padding: 6,
    borderRadius: radii.xs,
    backgroundColor: colors.surface,
  },
  thumb: {
    height: 180,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  thumbPlaceholder: {
    height: 96,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  memoryTitle: {
    fontFamily: typography.serif,
    fontSize: typography.sizes.bodyLarge,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
    marginBottom: 4,
  },
  memoryBody: {
    fontSize: typography.sizes.label,
    color: colors.textMuted,
    lineHeight: typography.lineHeights.body,
    marginTop: 4,
  },
  datePillWrap: { marginTop: spacing.sm },
  cta: { marginTop: spacing.md },

  // Modal
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
  mediaPreviewBox: {
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  mediaPreview: { width: '100%', height: 220 },
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
