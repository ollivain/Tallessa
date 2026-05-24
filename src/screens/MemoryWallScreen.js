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
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { useI18n } from '../i18n';
import { useMemorials } from '../state/MemorialContext';
import { colors } from '../theme/colors';
import ScreenHeader from '../components/ScreenHeader';
import PrimaryButton from '../components/PrimaryButton';
import {
  pickImageFromLibrary,
  pickVideoFromLibrary,
  removePersistedMedia,
} from '../lib/media';
import { uploadMedia, UploadError } from '../lib/uploadMedia';
import { isSupabaseConfigured } from '../lib/supabase';

export default function MemoryWallScreen() {
  const { t } = useI18n();
  const { activeMemorial, addMemory } = useMemorials();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  // Draft media for the modal — { type: 'image' | 'video', uri, mimeType? }
  const [media, setMedia] = useState(null);
  const [uploading, setUploading] = useState(false);

  const memories = activeMemorial?.memories ?? [];

  // Track media in a ref so the unmount cleanup always sees the latest value
  // (the state closure captured at mount would always be null).
  const mediaRef = useRef(null);
  useEffect(() => { mediaRef.current = media; }, [media]);
  useEffect(() => () => {
    if (mediaRef.current?.uri) removePersistedMedia(mediaRef.current.uri);
  }, []);

  const close = () => {
    if (media?.uri) removePersistedMedia(media.uri);
    setOpen(false);
    setTitle('');
    setBody('');
    setMedia(null);
  };

  const swapMedia = (next) => {
    if (media?.uri && media.uri !== next?.uri) {
      removePersistedMedia(media.uri);
    }
    setMedia(next);
  };

  const onPickImage = async () => {
    const result = await pickImageFromLibrary(t);
    if (result) {
      swapMedia({ type: 'image', uri: result.uri, mimeType: result.mimeType });
    }
  };

  const onPickVideo = async () => {
    const result = await pickVideoFromLibrary(t);
    if (result) {
      swapMedia({ type: 'video', uri: result.uri, mimeType: result.mimeType });
    }
  };

  const save = async () => {
    if (!title.trim() && !body.trim() && !media) {
      close();
      return;
    }

    // Try to push the media to Supabase if it's configured. The local
    // file remains the source of truth either way — if the upload fails
    // we still keep the memory, just without a cloud copy. This matches
    // the offline-first design: never block the user on the network.
    let uploaded = null;
    if (media && isSupabaseConfigured()) {
      try {
        setUploading(true);
        uploaded = await uploadMedia(media);
      } catch (e) {
        const code = e?.message;
        const body =
          code === UploadError.NOT_CONFIGURED ? t('media.uploadErrorNotConfigured')
          : code === UploadError.NETWORK     ? t('media.uploadErrorNetwork')
                                             : t('media.uploadErrorGeneric');
        Alert.alert(t('media.uploadErrorTitle'), body);
      } finally {
        setUploading(false);
      }
    }

    addMemory(activeMemorial.id, {
      title: title.trim(),
      body: body.trim(),
      date: new Date().toISOString().slice(0, 10),
      mediaType: media?.type ?? null,
      mediaUri: media?.uri ?? null,
      // Cloud copy — null if Supabase is off or upload failed.
      mediaRemoteUrl: uploaded?.publicUrl ?? null,
      mediaRemotePath: uploaded?.path ?? null,
    });
    // Don't clean up media on a successful save — the memory now owns it.
    setOpen(false);
    setTitle('');
    setBody('');
    setMedia(null);
  };

  if (!activeMemorial) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScreenHeader title={t('wall.title')} subtitle={t('wall.subtitle')} />
        <View style={styles.empty}>
          <Feather name="image" size={28} color={colors.accent} />
          <Text style={styles.emptyText}>{t('wall.noMemorial')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title={t('wall.title')} subtitle={t('wall.subtitle')} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {memories.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="image" size={28} color={colors.accent} />
            <Text style={styles.emptyText}>{t('wall.empty')}</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {memories.map((m) => (
              <MemoryCard key={m.id} memory={m} t={t} />
            ))}
          </View>
        )}

        <PrimaryButton
          label={t('wall.add')}
          onPress={() => setOpen(true)}
          style={styles.cta}
        />
      </ScrollView>

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
              <Text style={styles.modalTitle}>{t('wall.add')}</Text>

              <View style={styles.mediaPreviewBox}>
                {media?.type === 'image' ? (
                  <Image source={{ uri: media.uri }} style={styles.mediaPreview} resizeMode="cover" />
                ) : media?.type === 'video' ? (
                  <Video
                    source={{ uri: media.uri }}
                    style={styles.mediaPreview}
                    useNativeControls
                    resizeMode={ResizeMode.COVER}
                    isLooping={false}
                  />
                ) : (
                  <View style={styles.mediaPlaceholder}>
                    <Feather name="image" size={28} color={colors.accent} />
                  </View>
                )}
              </View>

              <View style={styles.mediaActions}>
                <Pressable onPress={onPickImage} style={styles.mediaBtn}>
                  <Feather name="image" size={16} color={colors.accentDark} />
                  <Text style={styles.mediaBtnLabel}>
                    {media?.type === 'image' ? t('wall.changeImage') : t('wall.pickImage')}
                  </Text>
                </Pressable>
                <Pressable onPress={onPickVideo} style={styles.mediaBtn}>
                  <Feather name="video" size={16} color={colors.accentDark} />
                  <Text style={styles.mediaBtnLabel}>
                    {media?.type === 'video' ? t('wall.changeVideo') : t('wall.pickVideo')}
                  </Text>
                </Pressable>
                {media ? (
                  <Pressable onPress={() => swapMedia(null)} style={styles.mediaBtn}>
                    <Feather name="trash-2" size={16} color={colors.danger} />
                    <Text style={[styles.mediaBtnLabel, { color: colors.danger }]}>
                      {t('wall.removeMedia')}
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{t('mock.memoryTitle')}</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  style={styles.input}
                  placeholder={t('mock.memoryTitle')}
                  placeholderTextColor={colors.textSoft}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{t('mock.memoryBody')}</Text>
                <TextInput
                  value={body}
                  onChangeText={setBody}
                  style={[styles.input, styles.multiline]}
                  placeholder={t('mock.memoryBody')}
                  placeholderTextColor={colors.textSoft}
                  multiline
                />
              </View>
              <PrimaryButton
                label={uploading ? t('media.uploading') : t('creation.save')}
                onPress={save}
                disabled={uploading}
              />
              {uploading ? (
                <View style={styles.uploadingRow}>
                  <ActivityIndicator color={colors.accentDark} />
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

function MemoryCard({ memory, t }) {
  return (
    <View style={styles.memoryCard}>
      {memory.mediaUri && memory.mediaType === 'image' ? (
        <Image source={{ uri: memory.mediaUri }} style={styles.thumb} resizeMode="cover" />
      ) : memory.mediaUri && memory.mediaType === 'video' ? (
        <Video
          source={{ uri: memory.mediaUri }}
          style={styles.thumb}
          useNativeControls
          resizeMode={ResizeMode.COVER}
          isLooping={false}
        />
      ) : (
        <View style={styles.thumbPlaceholder}>
          <Feather name="image" size={20} color={colors.accent} />
        </View>
      )}
      <Text style={styles.memoryTitle}>{memory.title || t('mock.memoryTitle')}</Text>
      {memory.body ? <Text style={styles.memoryBody}>{memory.body}</Text> : null}
      {memory.date ? <Text style={styles.memoryDate}>{memory.date}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 48 },
  empty: {
    alignItems: 'center',
    paddingVertical: 56,
    gap: 14,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 22,
  },
  grid: { gap: 14, marginBottom: 24 },
  memoryCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  thumb: {
    height: 180,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    marginBottom: 12,
  },
  thumbPlaceholder: {
    height: 96,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  memoryTitle: { fontSize: 16, color: colors.textPrimary, fontWeight: '500' },
  memoryBody: { fontSize: 14, color: colors.textMuted, lineHeight: 22, marginTop: 6 },
  memoryDate: { fontSize: 12, color: colors.textSoft, marginTop: 8, letterSpacing: 0.5 },
  cta: { marginTop: 8 },
  modalBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  iconBtn: { padding: 8 },
  modalScroll: { paddingHorizontal: 24, paddingBottom: 48 },
  modalTitle: {
    fontSize: 24,
    fontWeight: '300',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  mediaPreviewBox: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    marginBottom: 12,
  },
  mediaPreview: {
    width: '100%',
    height: 220,
  },
  mediaPlaceholder: {
    width: '100%',
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  mediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.card,
  },
  mediaBtnLabel: {
    fontSize: 13,
    color: colors.accentDark,
    letterSpacing: 0.5,
  },
  field: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  multiline: { minHeight: 120, textAlignVertical: 'top' },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  uploadingText: {
    fontSize: 13,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
});
