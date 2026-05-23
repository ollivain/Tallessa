/**
 * auth.js — Supabase Auth wrapper for Tallessa
 *
 * The app works fully without authentication (anonymous/device-scoped storage).
 * These functions are wired up in app.js so that when a user is signed in,
 * cloud data is scoped to their user ID instead of the anonymous device ID.
 *
 * TODO (future login UI): Import showLoginScreen() and call it from onAuthChange
 *   when the app transitions to mandatory authentication.
 * TODO (future login UI): Add a login/logout button in the settings screen.
 * TODO (future providers): Add signInWithGoogle() / signInWithApple() using
 *   supabase.auth.signInWithOAuth({ provider: "google" }).
 */

import { getSupabaseClient, isSupabaseConfigured } from "./storage.js?v=20260523-i18nv4";
import { t } from "./i18n.js?v=20260523-i18nv4";

/**
 * Returns the currently signed-in Supabase user, or null if anonymous.
 * Never throws — safe to call at any time.
 */
export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await getSupabaseClient();
    const { data } = await supabase.auth.getUser();
    return data?.user ?? null;
  } catch {
    return null;
  }
}

/**
 * Sign in with email + password.
 * Throws a localised error string on failure so the caller can show it.
 *
 * TODO (login UI): Call this from the login form submit handler.
 */
export async function signInWithEmail(email, password) {
  if (!isSupabaseConfigured()) {
    throw new Error(t("msg.auth.unavailable"));
  }
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data.user;
}

/**
 * Sign out the current user. Falls back to no-op if not configured.
 *
 * TODO (login UI): Call this from a "Kirjaudu ulos" button in settings.
 */
export async function signOut() {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = await getSupabaseClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.warn("Tallessa: uloskirjautuminen epäonnistui", error);
  }
}

/**
 * Subscribe to auth state changes. Fires immediately with the current user
 * (or null), then again whenever the user signs in or out.
 *
 * @param {(user: import("@supabase/supabase-js").User | null, event: string) => void} callback
 * @returns {{ unsubscribe: () => void }} — call to stop listening
 *
 * If Supabase is not configured the callback is fired once with null and a
 * no-op unsubscribe is returned, so callers need no special-casing.
 */
export async function onAuthChange(callback) {
  if (!isSupabaseConfigured()) {
    callback(null, "INITIAL_SESSION");
    return { unsubscribe: () => {} };
  }

  try {
    const supabase = await getSupabaseClient();

    // Fire once immediately with the persisted session (if any)
    const { data } = await supabase.auth.getUser();
    callback(data?.user ?? null, "INITIAL_SESSION");

    // Subscribe to future sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return; // already fired above
      callback(session?.user ?? null, event);
    });

    return subscription;
  } catch (error) {
    console.warn("Tallessa: auth-kuuntelijaa ei voitu rekisteröidä", error);
    callback(null, "INITIAL_SESSION");
    return { unsubscribe: () => {} };
  }
}
