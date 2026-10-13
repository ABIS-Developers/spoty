# SPEC 02 — Add to home screen (minimal PWA)

> **Status:** Implemented
> **Depends on:** SPEC 01
> **Date:** 2026-10-12
> **Objective:** Make Spoty saveable to the phone's home screen as an app-like shortcut (own icon, name and no browser bar) and suggest doing so with a dismissible banner after login.

---

## Why this spec exists

The admin uses the app mostly from a phone. Today it only lives in a browser tab. The goal is to open it from an icon like a conventional Android or iOS app, without a native build and without changing how the web app works. That is a minimal PWA: a web app manifest, icons and a few `<head>` tags. No service worker and no offline mode.

---

## Scope

**In:**

- A web app manifest at `public/manifest.webmanifest` with name `Spoty`, `display: standalone`, the theme colors and the icons.
- `<head>` tags in `index.html`: manifest link, `theme-color`, Apple touch icon and Apple web-app meta tags, and the new favicon.
- A simple generated icon: a white "S" on the olive-900 background. Exported as SVG (favicon) and PNG (192, 512, maskable 512, Apple 180).
- The template `public/vite.svg` is removed and replaced by the new icon.
- An install banner shown only after the PIN login, inside `AppShell`, and only on phones.
- Android / Chrome variant: an "Instalar" button that opens the browser's native install dialog (`beforeinstallprompt`).
- iOS variant: no native dialog exists, so the banner shows the steps "Compartir → Agregar a inicio" with icons.
- The banner is never shown when the app is already running from the home screen (standalone mode).
- Closing the banner hides it for 7 days on that device (`localStorage`).
- Banner texts in Spanish. Code, identifiers and comments in English.

**Out of scope (for future specs):**

- Service worker, offline mode, caching of the app shell or of data.
- Push notifications.
- Native builds (Capacitor, TWA, App Store / Play Store).
- Keeping the PIN session alive after the standalone app is closed. The session stays in `sessionStorage` as decided in SPEC 01.
- Showing the banner on the PIN screen.
- Showing the banner on desktop browsers.
- A permanent "Instalar app" entry in the sidebar or tab bar.
- App shortcuts (long-press menu), share target, splash screen customization beyond manifest colors.

---

## Data model

No backend data. Only a client-side store and one `localStorage` key.

```ts
// src/features/install/store/installStore.ts
type InstallState = {
  // Event captured from `beforeinstallprompt`. null on iOS and when not offered.
  deferredPrompt: BeforeInstallPromptEvent | null;
  // true after `appinstalled` fires or once the native dialog is accepted.
  installed: boolean;
};

// Minimal typing; the event is not in lib.dom.d.ts.
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
```

```ts
// localStorage
// key:   "install-banner:dismissedAt:v1"
// value: ISO date string of the last close, e.g. "2026-10-12T15:04:05.000Z"
// The banner is hidden while now < dismissedAt + 7 days.
const INSTALL_BANNER_DISMISS_DAYS = 7;
```

Banner visibility rule (all must be true):

1. The user is logged in. Guaranteed by mounting it in `AppShell`.
2. The app is not running standalone: `matchMedia("(display-mode: standalone)")` is false and `navigator.standalone` (iOS) is not true.
3. The device is a phone: `matchMedia("(pointer: coarse)")` and the `lg` breakpoint is not active.
4. Not dismissed in the last 7 days.
5. Platform variant available: `deferredPrompt !== null` (Android / Chrome) **or** the device is iOS/iPadOS (iPhone/iPad user agent, or `MacIntel` with `maxTouchPoints > 1`).
6. `installed` is false.

Manifest values:

```json
{
  "name": "Spoty",
  "short_name": "Spoty",
  "lang": "es",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#faf7f0",
  "theme_color": "#2b3520",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

Colors come from `src/index.css`: `#2b3520` is `olive-900` (the mobile header), `#faf7f0` is `beige-50`.

---

## Implementation plan

1. **Icons.** Create `public/icons/icon.svg`: a square `#2b3520` background with a bold white "S" drawn as a path (no font dependency). The "S" stays inside the central 80% so the maskable version is not cropped. Export `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` and `apple-touch-icon.png` (180×180) into `public/icons/` with a one-off command (e.g. `pnpm dlx @vite-pwa/assets-generator` or equivalent). No new dependency in `package.json`. Commit the PNGs. Delete `public/vite.svg`.
2. **Manifest and head tags.** Add `public/manifest.webmanifest` with the values above. In `index.html`: replace the `vite.svg` favicon with `/icons/icon.svg`, and add `<link rel="manifest" href="/manifest.webmanifest">`, `<meta name="theme-color" content="#2b3520">`, `<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">`, `<meta name="apple-mobile-web-app-capable" content="yes">`, `<meta name="mobile-web-app-capable" content="yes">`, `<meta name="apple-mobile-web-app-title" content="Spoty">` and `<meta name="apple-mobile-web-app-status-bar-style" content="default">`. Manual test: Chrome DevTools → Application → Manifest shows no errors and the icons render. At this point "Agregar a inicio" already works manually on both platforms.
3. **Feature skeleton and platform helpers.** Create `src/features/install/` with `index.ts`, `texts.ts` and `lib/platform.ts` (`isStandalone()`, `isIos()`, `isPhone()`), plus `lib/dismissal.ts` (`isDismissed(now)`, `dismiss(now)`). Every `localStorage` access is wrapped in `try/catch`. If storage fails, the banner counts as not dismissed.
4. **Install store and early listeners.** Create `store/installStore.ts` (Zustand) and an `initInstallListeners()` function that listens to `beforeinstallprompt` (calls `preventDefault()` and stores the event) and `appinstalled` (sets `installed: true`, clears the event). Call it in `src/main.tsx` before rendering, so the event is not lost while the user is on the PIN screen.
5. **Banner component.** Create `components/InstallBanner.tsx` with the visibility rule above. Android variant: text plus an "Instalar" button that calls `deferredPrompt.prompt()`, awaits `userChoice` and clears the event (the event can only be used once). iOS variant: text with the steps using the `lucide-react` icons `Share` and `SquarePlus`. Both variants have a close button (`X`, with an accessible label) that calls `dismiss()`. Style it with Tailwind and the existing theme tokens, matching existing cards. Respect the bottom tab bar and `env(safe-area-inset-bottom)`.
6. **Mount it.** Render `<InstallBanner />` inside `AppShell` at the top of `<main>`, so it only exists after login.

---

## Acceptance criteria

- [x] `pnpm build` passes and `dist/` contains `manifest.webmanifest` and `icons/` with the 4 PNGs and the SVG.
- [x] `public/vite.svg` no longer exists and `index.html` does not reference it.
- [x] Chrome DevTools → Application → Manifest shows name `Spoty`, `display: standalone`, theme `#2b3520` and all icons with no errors or warnings about missing icons.
- [x] On Android Chrome, after login, the banner appears with an "Instalar" button. Tapping it opens the native install dialog.
- [x] After installing on Android, the "Spoty" icon appears on the home screen and in the app drawer.
- [x] On iPhone Safari, after login, the banner shows the "Compartir → Agregar a inicio" steps. Following them adds a "Spoty" icon to the home screen.
- [x] Opening the app from the home screen icon (Android and iOS) shows no browser address bar.
- [x] Opened from the home screen icon, the banner never appears.
- [x] The banner never appears on the PIN screen.
- [x] The banner never appears on a desktop browser.
- [x] Closing the banner hides it. Reloading the page within 7 days does not show it again.
- [x] Setting `install-banner:dismissedAt:v1` to a date 8 days ago and reloading shows the banner again.
- [x] With `localStorage` blocked (e.g. it throws), the app does not crash and the banner still shows.
- [x] Banner text is in Spanish. The close button has an accessible label.
- [x] `tsc --noEmit` and `pnpm lint` pass.

---

## Decisions

- **Yes:** minimal PWA (manifest + icons + head tags). The user wants a home-screen shortcut that behaves like an app, "web without changing anything". **No:** native builds (Capacitor / TWA / stores).
- **Yes:** `display: standalone`. It hides the browser bar, which gives the "app" feel. **No:** `browser`, which is just a bookmark.
- **No:** service worker. It is not required for "Add to home screen" and Chrome on Android no longer requires one to offer install. Skipping it avoids stale-cache bugs after deploys. Offline mode would get its own spec.
- **Yes:** a custom banner. iOS has no install dialog, so without instructions nobody finds the option. **No:** relying only on the browser's own hints.
- **Yes:** the banner shows only after login, inside `AppShell`. The PIN screen stays untouched, and people without the PIN do not see it.
- **Yes:** the banner shows only on phones. The user asked for phone home screens. **No:** desktop install prompts.
- **Yes:** a dismissal that lasts 7 days, stored in `localStorage` with a versioned key. It reminds without nagging. `localStorage` is fine here because it holds no sensitive data (unlike the PIN in SPEC 01).
- **Yes:** `beforeinstallprompt` is captured in `main.tsx` at startup. The browser can fire it before login, and it would otherwise be lost.
- **Yes:** a generated icon, a white "S" on olive-900, named "Spoty". The user has no logo and asked for something simple.
- **Yes:** the "S" is drawn as an SVG path. The icon does not depend on installed fonts.
- **Yes:** PNGs are generated once and committed. **No:** a new build-time dependency such as `vite-plugin-pwa`.
- **Yes:** the code lives in a new feature `src/features/install/`, following the feature-based architecture of SPEC 01.
- **Yes:** `start_url: "/"`. It works with `HashRouter`, and the app redirects from there.
- **Kept from SPEC 01:** the PIN session stays in `sessionStorage`. Closing the standalone app asks for the PIN again. Changing that touches security and goes in its own spec.
- **No:** automated tests. Testing conventions were not adopted for this spec (decided at implementation start).

---

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| Some browsers (Firefox Android, some Samsung Internet versions) never fire `beforeinstallprompt` | No banner appears there. Adding to the home screen still works manually from the browser menu. This is accepted. |
| Amplify Hosting serves `.webmanifest` with the wrong `Content-Type` | Verify the response header after deploy. If it is wrong, add a custom header `application/manifest+json` in the Amplify console. |
| iOS changes the Share sheet wording or icons | The steps are in `texts.ts` and easy to update. |
| The standalone app asks for the PIN every time the OS kills it | This is expected by design (SPEC 01). It is documented above. |
| iPadOS reports itself as `MacIntel` | Detect it with `maxTouchPoints > 1`. iPad is still excluded by the phone check when it hits the `lg` breakpoint. |

---

## What is **not** in this spec

- Service worker, offline mode or caching.
- Push notifications.
- Native or store builds.
- Persistent PIN session.
- The banner on the PIN screen or on desktop.
- A permanent install entry in the navigation.

Each one of those, if it lands, goes in its own spec.
