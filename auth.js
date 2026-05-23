/**
 * auth.js — Supabase Auth wrapper for Tallessa / Withen.
 *
 * STATUS: DORMANT SCAFFOLDING.
 *   The app currently runs anonymously and stores everything in localStorage.
 *   No UI in index.html calls any of the functions below except onAuthChange()
 *   (used silently by app.js to scope cloud sync per user when/if a user is
 *   signed in). Because no UI calls signInWithEmail/signOut, no user can
 *   currently sign in — and that is intentional until the login screen is
 *   designed.
 *
 * SAFETY GUARANTEES (do not break these when finishing the login flow):
 *   - The app must keep working with localStorage when Supabase is unreachable
 *     or the user is signed out. storage.js already enforces this: both
 *     schedulePush() and syncFromCloud() early-return when currentUserId is
 *     null, so anonymous use never hits the network for state sync.
 *   - No function here throws to top-level. getCurrentUser/signOut/onAuthChange
 *     all swallow errors and return safe defaults so missing Supabase config
 *     can never surface a broken UI.
 *
 * TO ENABLE LOGIN LATER (checklist for whoever picks this up):
 *   1. Add a login screen / settings-row UI in index.html + styles.css.
 *   2. Wire a submit handler that calls signInWithEmail(email, password) and
 *      shows the thrown error string inline.
 *   3. Add a "Kirjaudu ulos" / "Sign out" button that calls signOut().
 *   4. Add translation keys for the button labels and error messages.
 *   5. (Optional) Implement signInWithGoogle/signInWithApple using
 *      supabase.auth.signInWithOAuth({ provider: "google" | "apple" }).
 *      Apple requires extra Supabase project configuration.
 *   6. Add a friendly "signed in as <email>" indicator if desired.
 */

import { getSupabaseClient, isSupabaseConfigured } from "./storage.js?v=20260523-i18nv9";
import { t } from "./i18n.js?v=20260523-i18nv9";

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
 * DORMANT: not called by any current UI. Wire up from a login form submit
 * handler when the login screen exists. The throw is safe — callers should
 * wrap in try/catch and surface error.message inline next to the form.
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
 * DORMANT: not called by any current UI. Wire up from a "Sign out" /
 * "Kirjaudu ulos" button in settings when the login screen exists.
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
