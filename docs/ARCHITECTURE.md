# Arise — Production Architecture

## The Hard Truth About App Blockers

A real phone blocker cannot be built with React Native alone.
App blocking requires **native OS-level permissions** that no JavaScript
runtime can access. Here is exactly what each platform needs.

---

## Platform Reality

### Android (Priority 1 — 95% of Indian market)

Android gives you full control via 4 system APIs:

| API | Purpose | Permission Required |
|-----|---------|-------------------|
| `UsageStatsManager` | Detect which app is in foreground | PACKAGE_USAGE_STATS (user must grant) |
| `AccessibilityService` | Intercept & redirect app launches | BIND_ACCESSIBILITY_SERVICE |
| `ForegroundService` | Keep blocker alive in background | FOREGROUND_SERVICE |
| `NotificationListenerService` | Block notifications from blocked apps | BIND_NOTIFICATION_LISTENER_SERVICE |

**How blocking works on Android:**
1. A ForegroundService runs constantly during a session
2. Every 300ms it polls `UsageStatsManager` for the foreground app
3. If the foreground app is not in the allow-list, it immediately launches
   Arise's "wall screen" over it, pushing the blocked app to background
4. The wall screen cannot be dismissed without paying ₹200

### iOS (Secondary — needs Apple entitlement)

Apple provides the **Screen Time API** (iOS 15+):

| Framework | Purpose |
|-----------|---------|
| `FamilyControls` | Requires special Apple entitlement |
| `ManagedSettings` | Actually blocks apps at OS level |
| `DeviceActivityMonitor` | Monitors and triggers blocking |

**Important:** iOS app blocking requires Apple to approve your app
for the `com.apple.developer.family-controls` entitlement.
Apply at: https://developer.apple.com/contact/request/family-controls-distribution

---

## Tech Stack Decision

```
React Native (Bare Workflow)  ←  UI, Logic, XP system, Storage
        ↕  Native Bridge (NativeModules)
Android: Kotlin Services       ←  Actual blocking
iOS:     Swift + FamilyControls ←  Actual blocking
```

**Why React Native bare workflow (not Expo)?**
- Expo managed workflow cannot run background services
- We need direct access to AndroidManifest.xml
- We need to write custom Kotlin/Swift native modules

---

## Project Structure

```
arise/
├── android/
│   └── app/src/main/
│       ├── java/com/arise/
│       │   ├── blocking/
│       │   │   ├── BlockingService.kt       ← Core foreground service
│       │   │   ├── AppBlocker.kt            ← Foreground app detection
│       │   │   └── WallActivity.kt          ← Blocks screen shown to user
│       │   ├── bridge/
│       │   │   └── BlockerBridge.kt         ← RN ↔ Native bridge
│       │   └── receivers/
│       │       └── BootReceiver.kt          ← Restart service on boot
│       ├── res/xml/
│       │   └── accessibility_service_config.xml
│       └── AndroidManifest.xml
├── ios/
│   └── Arise/
│       ├── BlockingExtension/
│       │   └── DeviceActivityMonitorExtension.swift
│       ├── AriseApp.swift
│       └── BlockerBridge.swift              ← RN ↔ Native bridge
├── src/
│   ├── screens/                             ← All React Native screens
│   ├── components/                          ← Shared UI components
│   ├── services/
│   │   ├── BlockerService.ts               ← Calls native bridge
│   │   ├── SessionManager.ts               ← Session state
│   │   └── XPManager.ts                    ← XP + streak logic
│   ├── store/
│   │   └── useAriseStore.ts                ← Zustand global state
│   └── utils/
│       ├── appLists.ts                      ← Allow/block lists
│       └── timeUtils.ts
├── package.json
└── README.md
```

---

## Blocklisted Apps (Cannot be added to allow-list)

These are hardcoded by package name. User cannot override.

```
Instagram:   com.instagram.android
TikTok:      com.zhiliaoapp.musically
Snapchat:    com.snapchat.android
Facebook:    com.facebook.katana
Twitter/X:   com.twitter.android
YouTube:     com.google.android.youtube  ← PARTIAL: allowed but Shorts blocked
Crunchyroll: com.crunchyroll.crunchyroid
Reddit:      com.reddit.frontpage
MX TakaTak:  com.mx.browser.takatak
Moj:         in.mohalla.video
Josh:        com.josh.android
```

## Always Allowed (Cannot be removed)

```
Phone:       com.android.dialer / com.google.android.dialer
Emergency:   android  (system calls)
```
