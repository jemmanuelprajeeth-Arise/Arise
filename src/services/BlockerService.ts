/**
 * BlockerService.ts
 *
 * The TypeScript service layer that calls the native Android/iOS
 * blocking modules. All React Native screens talk to this service —
 * never directly to NativeModules.
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { BlockerBridge } = NativeModules;
const emitter = new NativeEventEmitter(BlockerBridge);

// ─── Package mappings ────────────────────────────────────────

export const ALWAYS_ALLOWED_PACKAGES: Record<string, string> = {
  'com.android.dialer':              'Phone Calls',
  'com.google.android.dialer':       'Phone Calls',
  'com.samsung.android.incallui':    'Phone Calls',
};

export const HARD_BLOCKED_PACKAGES: Record<string, string> = {
  'com.instagram.android':           'Instagram',
  'com.zhiliaoapp.musically':        'TikTok',
  'com.snapchat.android':            'Snapchat',
  'com.facebook.katana':             'Facebook',
  'com.twitter.android':             'Twitter/X',
  'com.reddit.frontpage':            'Reddit',
  'com.crunchyroll.crunchyroid':     'Crunchyroll',
  'com.mx.browser.takatak':          'MX TakaTak',
  'in.mohalla.video':                'Moj',
  'com.josh.android':                'Josh',
  'com.sharechat.android':           'ShareChat',
};

// YouTube: allowed but note that Shorts cannot technically be
// blocked at package level — it shares the com.google.android.youtube
// package. This is a known limitation; note it in the UI.
export const YOUTUBE_PACKAGE = 'com.google.android.youtube';

// ─── Permission utilities ────────────────────────────────────

export interface PermissionStatus {
  usageStats:    boolean;
  overlay:       boolean;
  accessibility: boolean;
  allGranted:    boolean;
}

export async function checkAllPermissions(): Promise<PermissionStatus> {
  if (Platform.OS !== 'android') {
    // iOS handled separately via FamilyControls
    return { usageStats: true, overlay: true, accessibility: true, allGranted: true };
  }
  const [usageStats, overlay, accessibility] = await Promise.all([
    BlockerBridge.hasUsageStatsPermission(),
    BlockerBridge.hasOverlayPermission(),
    BlockerBridge.hasAccessibilityPermission(),
  ]);
  return {
    usageStats,
    overlay,
    accessibility,
    allGranted: usageStats && overlay,  // accessibility is optional fallback
  };
}

export function requestUsageStatsPermission() {
  BlockerBridge.requestUsageStatsPermission();
}

export function requestOverlayPermission() {
  BlockerBridge.requestOverlayPermission();
}

export function requestAccessibilityPermission() {
  BlockerBridge.requestAccessibilityPermission();
}

// ─── Session control ─────────────────────────────────────────

export interface StartSessionParams {
  durationSeconds:  number;
  allowedPackages:  string[];  // user-selected packages (package names)
}

export async function startSession(params: StartSessionParams): Promise<void> {
  const { durationSeconds, allowedPackages } = params;

  // Validate duration
  if (durationSeconds < 900 || durationSeconds > 18000) {
    throw new Error('Duration must be between 15 minutes and 5 hours');
  }

  // Strip any hard-blocked packages that somehow got in
  const safePackages = allowedPackages.filter(
    pkg => !(pkg in HARD_BLOCKED_PACKAGES)
  );

  if (Platform.OS === 'android') {
    await BlockerBridge.startSession(durationSeconds, safePackages);
  } else {
    // iOS: use FamilyControls shield
    await BlockerBridge.startFamilyControlsSession(durationSeconds, safePackages);
  }
}

export async function stopSession(): Promise<void> {
  if (Platform.OS === 'android') {
    await BlockerBridge.stopSession();
  } else {
    await BlockerBridge.stopFamilyControlsSession();
  }
}

export async function triggerDungeonBreak(): Promise<void> {
  if (Platform.OS === 'android') {
    await BlockerBridge.triggerDungeonBreak();
  } else {
    await BlockerBridge.stopFamilyControlsSession();
  }
}

export async function isSessionActive(): Promise<boolean> {
  if (Platform.OS === 'android') {
    return BlockerBridge.isSessionActive();
  }
  return false;
}

export async function getSessionEndTime(): Promise<number> {
  if (Platform.OS === 'android') {
    return BlockerBridge.getSessionEndTime();
  }
  return 0;
}

// ─── App listing ─────────────────────────────────────────────

export interface InstalledApp {
  packageName: string;
  appName:     string;
  isBlocked:   boolean;  // true = in hard block list
  isAllowed:   boolean;  // true = always allowed (phone calls)
}

export async function getInstalledApps(): Promise<InstalledApp[]> {
  if (Platform.OS !== 'android') return getMockApps();
  const raw: Array<{ packageName: string; appName: string }> =
    await BlockerBridge.getInstalledUserApps();

  return raw.map(app => ({
    ...app,
    isBlocked: app.packageName in HARD_BLOCKED_PACKAGES,
    isAllowed: app.packageName in ALWAYS_ALLOWED_PACKAGES,
  }));
}

function getMockApps(): InstalledApp[] {
  // For iOS simulator / dev — return a curated list
  return [
    { packageName: 'com.whatsapp',            appName: 'WhatsApp',     isBlocked: false, isAllowed: false },
    { packageName: 'com.phonepe.app',          appName: 'PhonePe',      isBlocked: false, isAllowed: false },
    { packageName: 'com.google.android.apps.maps', appName: 'Maps',    isBlocked: false, isAllowed: false },
    { packageName: 'com.spotify.music',        appName: 'Spotify',      isBlocked: false, isAllowed: false },
    { packageName: 'net.one97.paytm',          appName: 'Paytm',        isBlocked: false, isAllowed: false },
    { packageName: 'com.google.android.apps.nbu.paisa.user', appName: 'Google Pay', isBlocked: false, isAllowed: false },
    { packageName: 'com.instagram.android',    appName: 'Instagram',    isBlocked: true,  isAllowed: false },
    { packageName: 'com.snapchat.android',     appName: 'Snapchat',     isBlocked: true,  isAllowed: false },
    { packageName: 'com.zhiliaoapp.musically', appName: 'TikTok',       isBlocked: true,  isAllowed: false },
  ];
}

// ─── Event listeners ─────────────────────────────────────────

export function onSessionCompleted(callback: () => void) {
  return emitter.addListener('onSessionCompleted', callback);
}

export function onSessionBroke(callback: () => void) {
  return emitter.addListener('onSessionBroke', callback);
}
