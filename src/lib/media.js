import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Alert, Linking, Platform } from 'react-native';

// Default cap for memory videos. The web app trims uploads to ~10 s clips;
// the mobile picker doesn't trim automatically yet, so we use this as a
// soft hint passed to the gallery picker (iOS honors it via the native UI,
// Android typically ignores it — see TODO in pickVideoFromLibrary).
export const DEFAULT_VIDEO_CLIP_SECONDS = 10;

// expo-file-system gives us a stable per-app sandbox directory. We copy
// picked files there so they survive even if the user later deletes the
// original from the OS gallery (a common surprise on Android).
const MEDIA_DIR = `${FileSystem.documentDirectory}tallessa-media/`;

async function ensureMediaDir() {
  try {
    const info = await FileSystem.getInfoAsync(MEDIA_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(MEDIA_DIR, { intermediates: true });
    }
  } catch (e) {
    console.warn('[media] ensureMediaDir failed:', e);
  }
}

function extensionFromUri(uri, fallback) {
  const clean = uri.split('?')[0].split('#')[0];
  const dot = clean.lastIndexOf('.');
  if (dot === -1 || dot < clean.length - 6) return fallback;
  return clean.slice(dot + 1).toLowerCase();
}

async function persistAssetToAppStorage(asset, type) {
  await ensureMediaDir();
  const ext = extensionFromUri(asset.uri, type === 'video' ? 'mp4' : 'jpg');
  const filename = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const target = `${MEDIA_DIR}${filename}`;
  try {
    await FileSystem.copyAsync({ from: asset.uri, to: target });
    return target;
  } catch (e) {
    console.warn('[media] copy failed, falling back to original uri:', e);
    return asset.uri;
  }
}

async function ensureLibraryPermission(t) {
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (current.granted) return true;
  if (current.canAskAgain) {
    const next = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (next.granted) return true;
  }
  Alert.alert(
    t('media.permissionTitle'),
    t('media.permissionBody'),
    [
      { text: t('media.permissionCancel'), style: 'cancel' },
      {
        text: t('media.permissionOpenSettings'),
        onPress: () => {
          Linking.openSettings().catch(() => {});
        },
      },
    ],
    { cancelable: true },
  );
  return false;
}

/**
 * Opens the OS image picker. Returns a { uri, width, height } object on
 * success, or null if the user cancelled / declined permissions.
 */
export async function pickImageFromLibrary(t) {
  const ok = await ensureLibraryPermission(t);
  if (!ok) return null;

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
      exif: false,
    });
    if (result.canceled || !result.assets?.length) return null;
    const asset = result.assets[0];
    const uri = await persistAssetToAppStorage(asset, 'image');
    return { uri, width: asset.width, height: asset.height, mimeType: asset.mimeType };
  } catch (e) {
    console.warn('[media] pickImageFromLibrary failed:', e);
    Alert.alert(t('media.errorTitle'), t('media.errorBody'));
    return null;
  }
}

/**
 * Opens the OS video picker. Returns { uri, durationMillis } on success
 * or null on cancel / failure.
 *
 * TODO: server-quality trim. The web app trims videos to a configurable
 * clip length using a canvas/MediaRecorder pipeline. On mobile the picker
 * passes `videoMaxDuration` as a hint (iOS uses it, Android typically does
 * not). True frame-accurate trim should be added later via a native module
 * like `react-native-video-processing` or `ffmpeg-kit-react-native`.
 */
export async function pickVideoFromLibrary(t, { maxDurationSeconds = DEFAULT_VIDEO_CLIP_SECONDS } = {}) {
  const ok = await ensureLibraryPermission(t);
  if (!ok) return null;

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: Platform.OS === 'ios',
      videoMaxDuration: maxDurationSeconds,
      quality: 1,
    });
    if (result.canceled || !result.assets?.length) return null;
    const asset = result.assets[0];
    const uri = await persistAssetToAppStorage(asset, 'video');
    return { uri, durationMillis: asset.duration ?? null, mimeType: asset.mimeType };
  } catch (e) {
    console.warn('[media] pickVideoFromLibrary failed:', e);
    Alert.alert(t('media.errorTitle'), t('media.errorBody'));
    return null;
  }
}

/**
 * Opens the OS image picker with multi-selection (up to `limit` images).
 * Returns an array of { uri } objects in selection order, or null on cancel.
 * Used for calendar monthly cover images: pick 12 in Jan → Dec order.
 *
 * Note: allowsEditing cannot be combined with allowsMultipleSelection on iOS.
 */
export async function pickMultipleImagesFromLibrary(t, limit = 12) {
  const ok = await ensureLibraryPermission(t);
  if (!ok) return null;

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: limit,
      quality: 0.80,
      exif: false,
    });
    if (result.canceled || !result.assets?.length) return null;

    // Persist each selected asset to the app's document directory
    const persisted = await Promise.all(
      result.assets.slice(0, limit).map(async (asset) => {
        const uri = await persistAssetToAppStorage(asset, 'image');
        return { uri };
      }),
    );
    return persisted;
  } catch (e) {
    console.warn('[media] pickMultipleImagesFromLibrary failed:', e);
    Alert.alert(t('media.errorTitle'), t('media.errorBody'));
    return null;
  }
}

/**
 * Best-effort delete of a previously persisted media file. Safe to call
 * with any uri — non-app paths are ignored.
 */
export async function removePersistedMedia(uri) {
  if (!uri || !uri.startsWith(MEDIA_DIR)) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (e) {
    console.warn('[media] removePersistedMedia failed:', e);
  }
}
