/**
 * useAriseStore.ts — Global state via Zustand + MMKV persistence
 *
 * Install: npm install zustand react-native-mmkv
 * MMKV is 30x faster than AsyncStorage — critical for a focus app.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'arise-store' });

// MMKV adapter for Zustand persist middleware
const mmkvStorage = {
  getItem:    (key: string) => storage.getString(key) ?? null,
  setItem:    (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
};

// ─── Types ───────────────────────────────────────────────────

export type AppMode = 'hunter' | 'focus';

export interface SessionRecord {
  id:          string;
  date:        string;   // YYYY-MM-DD
  durationSec: number;
  xpEarned:    number;
  breakUsed:   boolean;
  breakMethod: 'inr' | 'xp' | null;
  isNight:     boolean;
  apps:        string[];  // package names
}

export interface AriseState {
  // Onboarding
  hasOnboarded:   boolean;
  mode:           AppMode;

  // XP + Level
  xp:             number;
  streak:         number;
  lastSessionDate: string | null;

  // Session (active)
  isSessionActive: boolean;
  sessionEndTime:  number;  // unix ms
  sessionDuration: number;  // seconds
  allowedPackages: string[];

  // History
  sessions:        SessionRecord[];
  totalFocusSec:   number;

  // User's custom block list additions
  userBlockList:   string[];  // package names user added

  // ── Actions ──────────────────────────────────────────────
  setOnboarded:    (mode: AppMode) => void;
  setMode:         (mode: AppMode) => void;
  addXp:           (amount: number) => void;
  deductXp:        (amount: number) => void;
  incrementStreak: () => void;
  resetStreak:     () => void;
  applyStreakPenalty: () => void;
  setLastSessionDate: (date: string) => void;

  startSession:    (durationSec: number, packages: string[], endTime: number) => void;
  endSession:      () => void;

  addSession:      (record: SessionRecord) => void;
  addUserBlock:    (packageName: string) => void;
  removeUserBlock: (packageName: string) => void;
  reset:           () => void;
}

// ─── Constants ───────────────────────────────────────────────

export const XP_FOR_BREAK    = 21000;
export const STREAK_DAYS     = 21;
export const STREAK_PENALTY  = 4000;
export const STREAK_BONUS_XP = 2000;

// ─── Store ───────────────────────────────────────────────────

export const useAriseStore = create<AriseState>()(
  persist(
    (set, get) => ({
      // Defaults
      hasOnboarded:    false,
      mode:            'hunter',
      xp:              0,
      streak:          0,
      lastSessionDate: null,
      isSessionActive: false,
      sessionEndTime:  0,
      sessionDuration: 0,
      allowedPackages: [],
      sessions:        [],
      totalFocusSec:   0,
      userBlockList:   [],

      // ── Onboarding ──
      setOnboarded: (mode) => set({ hasOnboarded: true, mode }),
      setMode:      (mode) => set({ mode }),

      // ── XP ──
      addXp:    (amount) => set(s => ({ xp: s.xp + amount })),
      deductXp: (amount) => set(s => ({ xp: Math.max(0, s.xp - amount) })),

      // ── Streak ──
      incrementStreak: () => set(s => ({ streak: s.streak + 1 })),
      resetStreak:     () => set({ streak: 0 }),
      applyStreakPenalty: () => {
        const { xp } = get();
        set({ streak: 0, xp: Math.max(0, xp - STREAK_PENALTY) });
      },
      setLastSessionDate: (date) => set({ lastSessionDate: date }),

      // ── Session ──
      startSession: (durationSec, packages, endTime) => set({
        isSessionActive: true,
        sessionDuration: durationSec,
        allowedPackages: packages,
        sessionEndTime:  endTime,
      }),
      endSession: () => set({
        isSessionActive: false,
        sessionEndTime:  0,
        allowedPackages: [],
      }),

      // ── History ──
      addSession: (record) => set(s => ({
        sessions:      [record, ...s.sessions].slice(0, 100),
        totalFocusSec: s.totalFocusSec + record.durationSec,
      })),

      // ── User block list ──
      addUserBlock:    (pkg) => set(s => ({
        userBlockList: [...new Set([...s.userBlockList, pkg])],
      })),
      removeUserBlock: (pkg) => set(s => ({
        userBlockList: s.userBlockList.filter(p => p !== pkg),
      })),

      reset: () => set({
        xp: 0, streak: 0, lastSessionDate: null,
        sessions: [], totalFocusSec: 0,
        isSessionActive: false,
      }),
    }),
    {
      name:    'arise-global',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

// ─── XP calculation ──────────────────────────────────────────

export function calculateXP(params: {
  durationSec:   number;
  totalSec:      number;
  breakUsed:     boolean;
  breakAfterHr4: boolean;
  isNight:       boolean;
  alreadyToday:  boolean;
}): { xp: number; reason: string } {
  const { durationSec, totalSec, breakUsed, breakAfterHr4, isNight, alreadyToday } = params;

  if (alreadyToday)                      return { xp: 0,    reason: 'Already earned today' };
  if (breakUsed && totalSec < 18000)     return { xp: 0,    reason: 'Break used' };
  if (isNight)                           return { xp: 50,   reason: 'Night session' };
  if (totalSec >= 18000 && !breakUsed)   return { xp: 1000, reason: '5-hour clean run' };
  if (totalSec >= 18000 && breakAfterHr4)return { xp: 800,  reason: '5 hours, break after hr 4' };

  const sec = breakUsed ? durationSec : totalSec;
  if (sec >= 18000) return { xp: 800, reason: '5 hours' };
  if (sec >= 14400) return { xp: 700, reason: '4 hours' };
  if (sec >= 10800) return { xp: 600, reason: '3 hours' };
  if (sec >= 7200)  return { xp: 500, reason: '2 hours' };
  if (sec >= 3600)  return { xp: 400, reason: '1 hour' };
  if (sec >= 1800)  return { xp: 200, reason: '30 minutes' };
  if (sec >= 900)   return { xp: 100, reason: '15 minutes' };
  return { xp: 0, reason: 'Too short' };
}

export function getLevel(xp: number): number {
  return Math.floor(xp / 5000) + 1;
}

export function getLevelProgress(xp: number): number {
  return (xp % 5000) / 5000;
}

export function todayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function isNightSession(): boolean {
  const h = new Date().getHours();
  return h >= 21 || h < 9;
}

export function daysBetween(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  return Math.floor(Math.abs(d2.getTime() - d1.getTime()) / 86400000);
}
