// React Native / Expo media uploader for Supabase Storage.
//
// We deliberately avoid the browser pipeline (`new File()`, `Blob`,
// `FileReader`, `URL.createObjectURL`) because RN's implementations are
// incomplete and flaky on Android for video-sized payloads. Instead we use
// `FileSystem.uploadAsync` which streams the file straight from disk to the
// Supabase Storage REST endpoint — no need to load the whole file into JS
// memory.
//
// Path layout matches the web app's per-owner namespace so the same RLS
// policies (see README §"Storage policies") cover both clients:
//   memories/<owner-id>/<year>/<uuid>.<ext>
//
// `owner-id` is the auth user id when signed in, or a per-device UUID
// stored in AsyncStorage when anonymous.

import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_BUCKET,
  isSupabaseConfigured,
  getSupabaseClient,
  getAuthTokenOrAnonKey,
  buildPublicUrl,
} from './supabase';

const DEVICE_ID_KEY = 'tallessa.mobile.v1.deviceId';
const MEDIA_ROOT = 'memories';

// Stable upload error codes — UIs map these to localised messages so we
// don't bake user-facing strings into this module.
export const UploadError = {
  NOT_CONFIGURED: 'supabase-not-configured',
  NO_OWNER: 'no-owner-id',
  MISSING_FILE: 'missing-file',
  NETWORK: 'network-error',
  UPLOAD_FAILED: 'upload-failed',
};

function randomId() {
  // crypto.randomUUID is available in modern Hermes; fall back to a
  // 32-char hex string so older runtimes still produce unique-looking ids.
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  let s = '';
  for (let i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16);
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

async function getOrCreateDeviceId() {
  try {
    let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = randomId();
      await AsyncStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

async function getCurrentOwnerId() {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data } = await client.auth.getUser();
      if (data?.user?.id) return data.user.id;
    } catch {
      // fall through to device id
    }
  }
  return getOrCreateDeviceId();
}

function sanitizeExtension(ext, fallback) {
  const clean = String(ext || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean || fallback;
}

function extensionFromUri(uri) {
  if (!uri) return '';
  const clean = uri.split('?')[0].split('#')[0];
  const dot = clean.lastIndexOf('.');
  if (dot === -1 || dot < clean.length - 6) return '';
  return clean.slice(dot + 1);
}

function guessMimeType(type, ext) {
  if (type === 'video') {
    if (ext === 'mov') return 'video/quicktime';
    if (ext === 'webm') return 'video/webm';
    if (ext === 'm4v') return 'video/x-m4v';
    return 'video/mp4';
  }
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic' || ext === 'heif') return 'image/heic';
  if (ext === 'gif') return 'image/gif';
  return 'image/jpeg';
}

function buildStoragePath(ownerId, ext) {
  const year = new Date().getFullYear();
  return `${MEDIA_ROOT}/${ownerId}/${year}/${randomId()}.${ext}`;
}

function encodeStoragePath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

/**
 * Uploads a picked media asset to Supabase Storage and returns a stable
 * descriptor the caller can store in app state.
 *
 * @param {{ uri: string, type: 'image' | 'video', mimeType?: string }} asset
 * @returns {Promise<{ path: string, publicUrl: string|null, ownerId: string, contentType: string }>}
 *
 * Throws an Error whose `.message` is one of `UploadError.*`. UIs should
 * map these codes to localised strings.
 */
export async function uploadMedia(asset) {
  if (!isSupabaseConfigured()) {
    throw new Error(UploadError.NOT_CONFIGURED);
  }
  if (!asset?.uri) {
    throw new Error(UploadError.MISSING_FILE);
  }

  const ownerId = await getCurrentOwnerId();
  if (!ownerId) {
    throw new Error(UploadError.NO_OWNER);
  }

  // Validate the file actually exists on disk before we open a network
  // connection — gives a clearer error than a 0-byte upload would.
  let info;
  try {
    info = await FileSystem.getInfoAsync(asset.uri);
  } catch (e) {
    console.warn('[uploadMedia] getInfoAsync failed:', e);
    throw new Error(UploadError.MISSING_FILE);
  }
  if (!info?.exists || !info?.size) {
    throw new Error(UploadError.MISSING_FILE);
  }

  const ext = sanitizeExtension(
    extensionFromUri(asset.uri),
    asset.type === 'video' ? 'mp4' : 'jpg',
  );
  const path = buildStoragePath(ownerId, ext);
  const contentType = asset.mimeType || guessMimeType(asset.type, ext);
  const token = await getAuthTokenOrAnonKey();
  const url = `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(SUPABASE_BUCKET)}/${encodeStoragePath(path)}`;

  let result;
  try {
    result = await FileSystem.uploadAsync(url, asset.uri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': contentType,
        'Cache-Control': '31536000',
        'x-upsert': 'false',
      },
    });
  } catch (e) {
    console.warn('[uploadMedia] network error:', e);
    throw new Error(UploadError.NETWORK);
  }

  if (result.status < 200 || result.status >= 300) {
    console.warn('[uploadMedia] supabase rejected upload', result.status, result.body);
    throw new Error(UploadError.UPLOAD_FAILED);
  }

  return {
    path,
    publicUrl: buildPublicUrl(path),
    ownerId,
    contentType,
  };
}

/**
 * Best-effort delete. Refuses to touch anything outside the current
 * owner's namespace so a corrupted state.json can't delete other users'
 * files. Returns true on success, false on any failure.
 */
export async function deleteUploadedMedia(path) {
  if (!isSupabaseConfigured() || !path) return false;
  const ownerId = await getCurrentOwnerId();
  if (!ownerId) return false;
  const parts = path.split('/').filter(Boolean);
  if (parts.length < 3 || parts[0] !== MEDIA_ROOT) return false;
  // Allow legacy `memories/<year>/<file>` paths (no owner segment) too.
  const owned = /^\d{4}$/.test(parts[1]) || parts[1] === ownerId;
  if (!owned) return false;

  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.storage.from(SUPABASE_BUCKET).remove([path]);
    return !error;
  } catch (e) {
    console.warn('[uploadMedia] delete failed:', e);
    return false;
  }
}
