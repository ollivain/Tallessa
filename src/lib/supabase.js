// React Native / Expo compatible Supabase client.
//
// SECURITY: only the public *anon* key is ever read here. Never reference
// the Supabase service_role key in any file shipped to a device — it
// bypasses RLS and would give an attacker full database/storage access.
//
// Env vars come from Expo's `process.env.EXPO_PUBLIC_*` mechanism, which
// inlines the value at bundle time. They are NOT secrets — anyone with the
// app can read them. Keep them limited to URL, anon key, and bucket name.

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const SUPABASE_BUCKET = process.env.EXPO_PUBLIC_SUPABASE_BUCKET || 'memories';

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_BUCKET);
}

let _client = null;

/**
 * Returns the shared Supabase client, or null if env vars are missing.
 * Callers should check `isSupabaseConfigured()` first and surface a
 * localised "not configured" message instead of crashing.
 */
export function getSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  if (_client) return _client;

  _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // No URL session detection on native — there is no browser URL to read.
      detectSessionInUrl: false,
    },
  });
  return _client;
}

/**
 * Returns the current auth JWT (used as Bearer token for Storage REST calls).
 * Falls back to the anon key for anonymous uploads. The bucket's RLS policies
 * decide whether anonymous writes are allowed — see README §"Storage policies".
 */
export async function getAuthTokenOrAnonKey() {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data } = await client.auth.getSession();
    return data?.session?.access_token || SUPABASE_ANON_KEY;
  } catch {
    return SUPABASE_ANON_KEY;
  }
}

/**
 * Builds the public URL for an object in the configured bucket.
 * Only works when the bucket / object is publicly readable. Otherwise use
 * `client.storage.from(bucket).createSignedUrl(path, ttl)`.
 */
export function buildPublicUrl(path) {
  if (!isSupabaseConfigured() || !path) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${encodeStoragePath(path)}`;
}

function encodeStoragePath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}
