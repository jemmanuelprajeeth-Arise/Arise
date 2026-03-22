# ⚔️ Arise — Phone Addiction Blocker

> *Rise from the shadows of addiction.*

Arise locks your phone for a set duration (up to 5 hours), lets you whitelist up to 5 apps, and charges ₹200 to exit early. Built with React Native + native Android Kotlin blocking.

**Design Theme:** Tron Legacy — Dark amber/orange circuits on pure black.

---

## Screenshots

| Onboarding | Home | Active Session | Break |
|-----------|------|----------------|-------|
| Mode select | XP + streak | Live timer | ₹200 exit |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React Native 0.73 (bare workflow) + TypeScript |
| Design | Tron Legacy amber theme — Orbitron + Share Tech Mono |
| Android Blocking | Kotlin — ForegroundService + UsageStatsManager |
| iOS Blocking | Swift — FamilyControls (entitlement required) |
| State | Zustand + MMKV |
| Payments | Razorpay (₹200 break, ₹50 skip) |

---

## Repository Structure

```
Arise/
│
├── 📱 android/                         Native Android (Kotlin)
│   └── app/src/main/
│       ├── AndroidManifest.xml         Permissions declaration
│       ├── java/com/arise/
│       │   ├── blocking/
│       │   │   ├── BlockingService.kt  ★ Core foreground service
│       │   │   ├── WallActivity.kt     ★ Block screen over apps
│       │   │   └── AriseAccessibilityService.kt  Backup blocker
│       │   ├── bridge/
│       │   │   └── BlockerBridge.kt    RN ↔ Native bridge
│       │   └── receivers/
│       │       └── BootReceiver.kt     Restart after reboot
│       └── res/
│           ├── xml/accessibility_service_config.xml
│           └── values/strings.xml
│
├── 🍎 ios/                             Native iOS (Swift)
│   └── Arise/
│       └── BlockerBridge.swift         FamilyControls bridge
│
├── ⚛️  src/                            React Native (TypeScript)
│   ├── theme/
│   │   └── tron.ts                     ★ Full design system
│   │
│   ├── components/
│   │   └── TronUI.tsx                  ★ Shared UI primitives
│   │
│   ├── navigation/
│   │   └── AppNavigator.tsx            Route definitions
│   │
│   ├── screens/
│   │   ├── OnboardingScreen.tsx        ★ 3-step mode select
│   │   ├── PermissionSetupScreen.tsx   Permission grants
│   │   ├── HomeScreen.tsx              ★ Dashboard
│   │   ├── SelectAppsScreen.tsx        App whitelist picker
│   │   ├── SetDurationScreen.tsx       Hour/min picker
│   │   ├── ActiveSessionScreen.tsx     ★ Live timer screen
│   │   ├── DungeonBreakScreen.tsx      ★ ₹200 exit + timer
│   │   └── CompleteScreen.tsx          XP + streak result (in DungeonBreakScreen.tsx)
│   │
│   ├── services/
│   │   └── BlockerService.ts           TS wrapper for native bridge
│   │
│   ├── store/
│   │   └── useAriseStore.ts            Zustand global state
│   │
│   └── utils/
│       ├── xp.ts                       XP calculations
│       └── time.ts                     Time formatting
│
├── 📖 docs/
│   └── ARCHITECTURE.md                 Full technical overview
│
├── ⚙️  .github/
│   └── workflows/
│       └── typecheck.yml               TypeScript CI
│
├── index.js                            RN entry point
├── app.json                            App name
├── package.json                        Dependencies
├── tsconfig.json                       TypeScript config
└── .gitignore
```

---

## Setup

```bash
# Install
npm install

# Android (physical device required for blocking)
npx react-native run-android

# iOS (requires FamilyControls entitlement from Apple)
cd ios && pod install && cd ..
npx react-native run-ios
```

---

## Key Files (★ = most important)

| File | Purpose |
|------|---------|
| `BlockingService.kt` | Polls foreground app every 300ms, shows wall if blocked |
| `WallActivity.kt` | Fullscreen block screen, cannot be dismissed |
| `BlockerBridge.kt` | Exposes native functions to React Native |
| `tron.ts` | All design tokens — colors, fonts, spacing |
| `TronUI.tsx` | Shared components: buttons, bars, grids |
| `useAriseStore.ts` | Global state: XP, streak, sessions, mode |

---

## Roadmap

- [x] Core Android blocking architecture
- [x] React Native ↔ Native bridge  
- [x] Tron Legacy design system
- [x] All screens (Onboarding → Complete)
- [x] Dual mode: Hunter + Focus
- [ ] Razorpay integration (₹200 break payment)
- [ ] iOS FamilyControls implementation
- [ ] Push notifications (streak reminders)
- [ ] Play Store submission
- [ ] **Arise: Bastion** — digital wellness extension

---

## Permissions Required (Android)

| Permission | Purpose |
|-----------|---------|
| `PACKAGE_USAGE_STATS` | Detect foreground app |
| `SYSTEM_ALERT_WINDOW` | Draw wall screen over apps |
| `FOREGROUND_SERVICE` | Keep blocker alive |
| `QUERY_ALL_PACKAGES` | List installed apps |

---

*Built with discipline. Designed for focus.*
