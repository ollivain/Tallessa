# Tallessa — Mobile

A quiet place for cherished memories. Expo / React Native app for iOS and Android.

The project root also contains a legacy web prototype (HTML/CSS/JS) — see [Legacy web](#legacy-web) below.

---

## What is this?

Tallessa (Finnish: "within", "kept safe") is a private memorial app where you can create memorial spaces for loved ones, add memories with photos and videos, write letters, and track meaningful dates.

The **mobile app** lives in `src/` and is built with Expo SDK 52 / React Native 0.76. It targets iOS 15+ and Android 10+ (API 29+).

---

## Getting started

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli` (or use `npx expo`)
- For iOS: Xcode 15+ on macOS, or an iPhone with the Expo Go app
- For Android: Android Studio with an emulator, or a physical device with Expo Go

### Install

```bash
npm install
```

### Environment variables

Copy the example and fill in your Supabase values:

```bash
cp .env.example .env
```

`.env` contents:

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
EXPO_PUBLIC_SUPABASE_BUCKET=memories
```

The app works fully offline without Supabase — media will be stored only on the device. Cloud upload is silently skipped when env vars are missing.

### Start the dev server

```bash
npm start
# or
npx expo start
```

---

## Testing on iOS

### With Expo Go (fastest)

1. Run `npm start`
2. Open the Expo Go app on your iPhone
3. Scan the QR code shown in the terminal

### With iOS Simulator (macOS only)

```bash
npm run ios
# or press 'i' in the expo start terminal
```

### With EAS Build (production-like)

```bash
npx eas build --platform ios --profile development
```

Note: EAS Build requires an Expo account and `eas.json`. You'll also need to add `assets/icon.png` (1024×1024) and `assets/splash.png` (1284×2778) before building — see [Before publishing](#before-publishing).

---

## Testing on Android

### With Expo Go

1. Run `npm start`
2. Open the Expo Go app on your Android device
3. Scan the QR code, or press 'a' in the terminal to open an emulator

### With Android Emulator

```bash
npm run android
# or press 'a' in the expo start terminal
```

### With EAS Build

```bash
npx eas build --platform android --profile development
```

---

## Supabase setup

### Storage bucket

1. Create a Supabase project at supabase.com
2. Go to **Storage → New bucket** and create a bucket named `memories` (or your chosen name)
3. Set the bucket to **Public** if you want media to be accessible without signed URLs, or keep it private and adjust the app to use signed URLs

### RLS policies

The app uses path-based ownership: `memories/<owner-id>/<year>/<uuid>.<ext>`

Suggested policies for the `memories` bucket:

```sql
-- Allow anonymous/authenticated insert into own namespace
CREATE POLICY "users can upload their own media"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'memories' AND
  (storage.foldername(name))[1] = 'memories'
);

-- Allow reading all objects (public bucket)
CREATE POLICY "public read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'memories');
```

> The app uses the public anon key only. Never put the `service_role` key in the app.

---

## Architecture

```
src/
  App.js                    — root component, loads state from AsyncStorage
  expo-entry.js             — Expo entry point
  navigation/
    RootNavigator.js        — switches between memorial selection and main app
    MainTabs.js             — bottom tab navigator (5 tabs)
  screens/
    MemorialSelectionScreen — list / choose a memorial space
    MemorialCreationScreen  — create a new memorial (modal)
    HomeScreen              — dashboard with latest memory and quick links
    MemoryWallScreen        — photo/video/text memories + add modal
    LettersScreen           — personal letters + compose modal
    CalendarScreen          — date-based events + add modal
    SettingsScreen          — language, memorial switch, developer tools
  components/
    ScreenHeader            — shared header with title/subtitle/divider
    PrimaryButton           — two-variant button (primary / secondary)
    LoadingScreen           — splash-like loading state
  state/
    MemorialContext.js      — global state (memorials, activeId, CRUD actions)
  storage/
    storage.js              — AsyncStorage persistence (multiGet/multiSet)
  lib/
    supabase.js             — Supabase client (env-based, null-safe)
    uploadMedia.js          — FileSystem.uploadAsync → Supabase Storage
    media.js                — expo-image-picker wrapper with permission handling
  i18n/
    index.js                — I18nProvider + useI18n hook
    strings.js              — Finnish and English translations
  theme/
    colors.js               — design token palette
```

**Data flow:** `AsyncStorage` → `App.js` → `MemorialContext` → screens. All writes go through context actions which trigger AsyncStorage saves via `useEffect`.

---

## Known limitations

- **Date input is free text** — Calendar and creation screens accept any string. No date picker or format validation. Entering invalid dates will silently display incorrectly.
- **Video trimming is iOS-only** — `videoMaxDuration` is honored by iOS's native picker; Android ignores it and may let users pick arbitrarily long videos.
- **No authentication UI** — Supabase auth client is initialized but there is no sign-in screen. All uploads use a stable per-device UUID as the owner identifier.
- **Media is device-local by default** — Without Supabase configured, no cloud backup exists. Uninstalling the app will permanently delete all media.
- **No image viewer / detail screen** — Memory cards show thumbnails inline; there is no full-screen viewer yet.
- **No delete / edit for memories, letters, events** — Only creation is implemented.
- **New Architecture enabled** — `newArchEnabled: true` in app.json. Verify that all native modules are compatible before building for release.

---

## Before publishing

The following are required before building a release binary:

1. **App icon** — Add `assets/icon.png` (1024×1024 px, no transparency). Add to `app.json`:
   ```json
   "icon": "./assets/icon.png"
   ```

2. **Splash screen** — Add `assets/splash.png` and configure in `app.json`:
   ```json
   "splash": {
     "image": "./assets/splash.png",
     "resizeMode": "contain",
     "backgroundColor": "#f5eddf"
   }
   ```

3. **Android adaptive icon** — Add `assets/adaptive-icon.png` (1024×1024) and update `app.json`:
   ```json
   "android": {
     "adaptiveIcon": {
       "foregroundImage": "./assets/adaptive-icon.png",
       "backgroundColor": "#f5eddf"
     }
   }
   ```

4. **EAS configuration** — Create `eas.json` with build profiles.

5. **Privacy policy** — Required for App Store and Google Play. Media permissions must be justified.

---

## Potential bugs and risks

| Area | Risk | Severity |
|------|------|----------|
| Media upload | If Supabase is not configured, cloud upload is skipped silently — users may not realize there is no cloud backup | Medium |
| Video | Android doesn't honor `videoMaxDuration` — users can pick very long videos that may fail to upload or exhaust device storage | Medium |
| Supabase RLS | Bucket policies must be tightened before launch — a permissive policy allows any device to read all uploaded files | High |
| AsyncStorage | No data migration path if storage schema changes in future versions (v1 suffix is in place as a safety valve) | Low |
| New Architecture | `newArchEnabled: true` — some third-party native modules may not support the new architecture yet | Medium |
| iOS memory | Large video files are copied to the app sandbox before upload — may exhaust storage on low-memory devices | Low |
| Android back button | Hardware back closes modals via `onRequestClose` but there is no guard against losing unsaved content | Low |
| No error boundary | An unhandled JS exception crashes the whole app — no React error boundary is in place | Medium |
| Portrait image | Memorial portrait photo is stored device-local only — not uploaded to Supabase | Low |

---

## What's next (suggested roadmap)

- [ ] Add app icon, splash screen, and adaptive icon assets
- [ ] Date picker for calendar events and memorial birth/death dates
- [ ] Full-screen image/video viewer
- [ ] Delete and edit actions for memories, letters, events
- [ ] Authentication UI (sign-in with email / magic link)
- [ ] EAS Build setup for TestFlight / Play Store internal testing
- [ ] React error boundary at app root
- [ ] Video trimming on Android (ffmpeg-kit or similar)
- [ ] Push notifications for memorial dates (expo-notifications)
- [ ] Portrait image upload to Supabase

---

## Legacy web

The project root contains the original web prototype:

| File | Purpose |
|------|---------|
| `index.html` | Main HTML entry point |
| `app.js` | Application logic |
| `auth.js` | Web auth |
| `storage.js` | localStorage-based storage |
| `calendar.js`, `memories.js`, `letters.js` | Feature modules |
| `ui.js`, `styles.css` | UI layer |
| `translations.js`, `i18n.js` | Localisation |
| `service-worker.js`, `manifest.webmanifest` | PWA support |

The web version is **not maintained** and is kept for reference only. The Expo app in `src/` is the active version. None of the web files are imported by the mobile app.
