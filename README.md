# Tallessa / Withen

A private, offline-first memorial app. The app works fully without any
server — memories live locally. If a Supabase project is configured,
signed-in users also get cross-device cloud sync.

* **Finnish UI brand**: Tallessa
* **English (default) UI brand**: Withen
* **Web/PWA stack**: vanilla HTML/CSS/ES modules, no build step. Serve as static files.
* **Mobile stack (in progress)**: React Native + Expo. Navigation shell and
  all main screens implemented. Data persists locally via `AsyncStorage`.
* **Backend (optional)**: Supabase Storage for state JSON + memory videos.

---

## Mobile app (Expo, in progress)

A React Native / Expo project lives alongside the web app in this same
repository. It is not a WebView wrapper — it is a native app that will be
ported feature-by-feature from the web/PWA version.

### Prerequisites

* Node.js 20+ and npm
* The **Expo Go** app installed on your phone (iOS App Store / Google Play)
* Phone and dev machine on the same Wi‑Fi network

### Run it

```bash
npm install
npx expo start
```

Expo will open a dev server and show a QR code in the terminal (and a
browser tab).

#### iOS (Expo Go)

1. Open the **Camera** app on your iPhone.
2. Point it at the QR code in the terminal.
3. Tap the notification to open the project in Expo Go.

#### Android (Expo Go)

1. Open the **Expo Go** app on your Android device.
2. Tap **Scan QR code** and scan the QR code from the terminal.

If the QR code doesn't work (e.g. corporate Wi‑Fi blocking LAN traffic),
run `npx expo start --tunnel` instead.

### Local storage (AsyncStorage)

All mobile data is stored on-device using
`@react-native-async-storage/async-storage`. No server is required.

| Key | Contents |
|---|---|
| `tallessa.mobile.v1.memorials` | JSON array of all memorial spaces (with nested memories, letters, events) |
| `tallessa.mobile.v1.activeId` | ID of the currently open memorial space |
| `tallessa.mobile.v1.settings` | User settings (`{ language: "fi" \| "en" }`) |

**Testing persistence in Expo Go:**

1. `npx expo start` → open in Expo Go on your phone.
2. Create a memorial space, add a memory, add a letter.
3. Press the home button to background the app, or shake and reload.
4. Re-open — the memorial and its content should still be there.
5. Change language in Settings (FI ↔ EN), close fully, re-open — language
   should match your choice.
6. To reset to a clean slate: Settings → *Tyhjennä kaikki data*.

### Mobile project layout

| Path | Purpose |
|---|---|
| `App.js`, `app.config.js` style files at repo root | Expo config (`package.json`, `app.json`, `babel.config.js`) |
| `src/expo-entry.js` | Registers the root component. Used because Windows is case-insensitive and `App.js` would collide with the web `app.js`. |
| `src/App.js` | Root React Native component, sets up safe-area + status bar. |
| `src/screens/HomeScreen.js` | First boot screen. |
| `src/theme/colors.js` | Shared color palette (matches the PWA's `manifest.webmanifest` brand colors). |

### Media (photos & videos)

The mobile app uses native pickers instead of the web's `<input type="file">`
+ `FileReader` + `URL.createObjectURL` pipeline. Picked files are copied into
the app's sandboxed document directory (`FileSystem.documentDirectory +
tallessa-media/`) so they survive even if the user later removes the
original from the device gallery.

| Capability | Library | Where |
|---|---|---|
| Image / video gallery picker | `expo-image-picker` | `src/lib/media.js` |
| In-app file copy | `expo-file-system` | `src/lib/media.js` |
| Video playback in previews & cards | `expo-av` (`Video`) | `src/screens/MemoryWallScreen.js` |

Permission UX: the picker requests photo library access on first use. If
the user declines, an alert offers an "Open settings" deep link instead of
crashing. The iOS `NSPhotoLibraryUsageDescription` strings are configured
via the `expo-image-picker` plugin block in `app.json`.

> **TODO — automatic video trim.** The web app trims uploads to a short
> clip (≤ 10 s) using a canvas/MediaRecorder pipeline that is not
> portable to React Native. The mobile app currently passes
> `videoMaxDuration` as a *hint* to the OS picker (iOS honors it,
> Android often does not) but does **not** re-encode the file afterwards.
> Frame-accurate trim should be added later via a native module like
> `react-native-video-processing` or `ffmpeg-kit-react-native`.

### Mobile Supabase setup (optional — media upload)

The mobile app talks to Supabase Storage from React Native using a separate
client (`src/lib/supabase.js`). It does **not** read the web app's
`supabase-config.js` — env vars are the only configuration surface.

**Set up:**

1. Copy `.env.example` → `.env` in the repo root.
2. Fill in:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<public anon key from Supabase dashboard>
   EXPO_PUBLIC_SUPABASE_BUCKET=memories
   ```

3. Restart Expo (`npx expo start --clear`) so the new env vars are inlined
   into the bundle.

Without these values, `isSupabaseConfigured()` returns false and the app
keeps working in pure offline mode — picked media is stored locally only.

> ⚠️ **NEVER** put the Supabase **service_role** key in `.env`, in any
> file under this repo, or in any string the app reads at runtime. The
> service_role key bypasses RLS and would let any user read or overwrite
> any other user's data. Only the `EXPO_PUBLIC_SUPABASE_ANON_KEY` is safe
> to ship.

**Bucket and policies you must create in Supabase yourself.** See the
"Supabase deployment checklist" section below for the SQL — the same
policies cover both the web app and the mobile app, because both write
to the same `memories/<owner-id>/<year>/<uuid>.<ext>` path layout.

Minimum you need:

* A storage bucket named `memories` (or whatever you set
  `EXPO_PUBLIC_SUPABASE_BUCKET` to).
* INSERT policy that allows the current user to write under
  `memories/<auth.uid()>/...`.
* SELECT policy that grants public read on `memories/%` (or signed URLs
  if you want stronger privacy).

If the bucket doesn't exist or the INSERT policy is missing, uploads
fail with a localised "Upload failed" alert (`media.uploadErrorGeneric`)
and the memory is saved locally only. The client never tries to create
the bucket or change policies for you — those are Supabase-side
operations and the app intentionally has no permission to perform them.

### Mobile media upload pipeline

Picked media goes through this flow on iOS/Android:

1. `expo-image-picker` returns a local `file://` URI.
2. `persistAssetToAppStorage()` copies it into the sandboxed
   `tallessa-media/` folder (`src/lib/media.js`).
3. When the user saves the memory, `uploadMedia()` in
   `src/lib/uploadMedia.js` streams the file straight to Supabase
   Storage's REST endpoint via `FileSystem.uploadAsync` — no
   `Blob`/`FileReader`/`URL.createObjectURL`, which are flaky on RN for
   video-sized payloads.
4. On success the memory record gets `mediaRemoteUrl` + `mediaRemotePath`
   in addition to the local `mediaUri`. On failure the alert appears and
   the memory is saved with the local URI only.

Anonymous uploads use a device UUID stored in AsyncStorage
(`tallessa.mobile.v1.deviceId`) as the owner namespace. Once auth is
added, the same code path switches to `auth.uid()` automatically.

### What's NOT yet ported to mobile

The Expo app is still missing pieces from the web/PWA build. Still to do:

* Letters, calendar entries beyond their basic shell screens
* Supabase cloud sync of *state JSON* (media upload works; appstate sync
  is still device-local)
* Auth (`auth.js`) — UI for sign in / sign out
* Per-view background images / full theming pass (`styles.css`,
  `assets/bg-*.png`)
* Automatic video trim (see TODO above)
* PWA-specific code (service worker, manifest) stays web-only by design

The old web app under `index.html`, `app.js`, `styles.css`, `storage.js`,
`service-worker.js`, `manifest.webmanifest` is still the production version
and is unaffected by the mobile bootstrap.

---

## Local development (web/PWA)

```bash
python -m http.server 8080
# then open http://localhost:8080
```

The PWA service worker (`service-worker.js`) caches the app shell. After
editing any cached file, bump `CACHE_NAME` so iOS/Android clients pick up the
new build.

---

## Supabase deployment checklist (READ BEFORE PUBLISHING)

> ⚠️ **The client cannot verify your Supabase project's Row Level Security
> (RLS) and Storage policies.** Misconfigured policies are the single biggest
> security risk for this app — they can expose every user's memorial data to
> every other user. Treat this checklist as a hard prerequisite for going
> live, not a "nice to have".

### 1. Frontend keys

* `supabase-config.js` MUST contain only the project URL, the **anon** public
  key, and the storage bucket name.
* The Supabase **service role** key is a god-mode credential. **Never** put
  it in any file that ships to the browser, into the service worker, into
  `index.html`, or into the cache list. The codebase intentionally has no
  reference to it.
* The anon key is safe to ship (it is, by design, a public token) — but only
  when RLS is enabled on every table and storage object you care about. With
  RLS off, the anon key is the same as service role for anonymous reads.

### 2. Storage bucket layout

The app writes to exactly one bucket (default name: `memories`). Inside the
bucket it uses two top-level prefixes:

| Prefix | Contents | Written by |
|---|---|---|
| `state/<owner-id>/appstate.json` | The user's full app state (memorials, memories, letters, calendar). One file per owner. | `storage.js` → `pushToSupabase()` |
| `memories/<owner-id>/<year>/<uuid>.<ext>` | Memory videos (≤ 10 s clips, ≤ ~50 MB each). | `app.js` → `uploadMemoryVideo()` |

`<owner-id>` is the authenticated user's `auth.uid()` when signed in, or a
per-browser device UUID stored in `localStorage` when anonymous.

### 3. Required Storage policies (this is the critical part)

In the Supabase dashboard → Storage → Policies for the `memories` bucket, set
**at minimum** the following. Adjust to taste, but never weaken them.

#### a) State JSON — only the owner can read or write their own state

```sql
-- SELECT
(bucket_id = 'memories'
  AND name LIKE 'state/' || auth.uid()::text || '/%')

-- INSERT / UPDATE / DELETE
(bucket_id = 'memories'
  AND name LIKE 'state/' || auth.uid()::text || '/%')
```

This guarantees that even if someone steals an owner-id string, they cannot
read or overwrite another user's state without that user's auth token.

#### b) Memory videos — only the owner can write or delete their own videos

```sql
-- INSERT / UPDATE / DELETE
(bucket_id = 'memories'
  AND name LIKE 'memories/' || auth.uid()::text || '/%')
```

#### c) Memory videos — read access (pick ONE of the two)

**Public read (current default).** Convenient: `getPublicUrl()` works without
extra round-trips. Acceptable because the path contains a random v4 UUID
which is unguessable. Anyone who somehow obtains the URL can view the
video, however.

```sql
-- SELECT
bucket_id = 'memories' AND name LIKE 'memories/%'
```

**Private read (recommended for personal memorial content).** Switch the
client to `createSignedUrl()` and refresh URLs on demand. With this policy,
even the URL alone is not enough.

```sql
-- SELECT
(bucket_id = 'memories'
  AND name LIKE 'memories/' || auth.uid()::text || '/%')
```

#### d) Anonymous uploads (until login UI exists)

Today the app lets anonymous users upload videos (their state.json is
local-only, but the videos go to Supabase). If you want to **prevent abuse
of your bucket** as an anonymous file host, add a final policy that requires
`auth.role() = 'authenticated'` on `INSERT`. The client will surface the
rejection as `msg.video.uploadFailed`.

### 4. Database tables

The app currently uses Supabase Storage only — no Postgres tables, no RPC.
If you later add tables, enable RLS on each one (`alter table ... enable
row level security;`) and write `auth.uid() = user_id` policies before
inserting any production data.

### 5. CORS and bucket size limits

* Allow your production origin in the Supabase project's CORS settings.
* Set the bucket's file size limit ≥ 60 MB (the client tries to keep clips
  under `MAX_STANDARD_VIDEO_SIZE` in `app.js`, currently ~50 MB after trim).

### 6. After deployment — verify

From an unauthenticated browser, run this in the console:

```js
const c = await import('https://esm.sh/@supabase/supabase-js@2')
  .then(m => m.createClient(window.TallessaSupabase.url, window.TallessaSupabase.anonKey));
// Should return an error (or empty), NOT another user's state:
await c.storage.from('memories').download('state/some-other-uuid/appstate.json');
// Should return [], NOT a directory listing of every user's folder:
await c.storage.from('memories').list('state');
```

If either call returns real data, your RLS is too permissive.

---

## Security model in code (defence in depth)

Even with RLS done right, the client also enforces:

* **Per-owner namespacing**: `createMediaStoragePath()` in `storage.js`
  always builds `memories/<owner-id>/<year>/<uuid>.<ext>`. There is no
  code path that writes to a different layout.
* **Delete guard**: `deleteSupabaseFile()` in `app.js` refuses to call
  `.remove()` on a path that doesn't belong to the current owner — checked
  via `isOwnedMediaPath()`. Legacy unprefixed paths from older clients are
  still cleanable.
* **Auth-gated state sync**: `schedulePush()` and `syncFromCloud()` in
  `storage.js` early-return when `currentUserId` is null. Anonymous users
  never push or pull state.json from the network.
* **Graceful Supabase failure**: every Supabase call is in a `try/catch`.
  Failures surface a localised toast (`msg.cloud.saveFailed`,
  `msg.video.uploadFailed`, etc.) and the app keeps working from
  `localStorage`.
* **No service role**: no admin key, JWT secret, or webhook secret is
  referenced anywhere in the codebase.

If you change any of the above, re-read this section and the bullet under
"Required Storage policies" — they're designed to fail closed together.

---

## What works without Supabase

Everything except cross-device sync and video uploads:

* Creating memorial spaces, memories, letters, calendar entries
* Switching themes, language, names
* Adding images (stored as data URLs inside the local state)
* PWA install + offline use

If `supabase-config.js` is missing or has empty fields, `isSupabaseConfigured()`
returns false and every cloud call short-circuits silently. The UI shows
`msg.supabase.notConfigured` only when the user explicitly tries something
that requires it (currently: uploading a video memory).

---

## Authentication (status: dormant scaffolding)

The Supabase Auth wrapper exists in `auth.js` (`signInWithEmail`, `signOut`,
`onAuthChange`) but no UI calls it yet. The app runs anonymously by design.
See the header comment in `auth.js` for the 6-step checklist to enable a
real login flow later. None of the dormant code is reachable from the UI,
so users cannot click a button that does nothing.
