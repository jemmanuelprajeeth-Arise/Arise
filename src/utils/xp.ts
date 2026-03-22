/**
 * src/utils/xp.ts — XP calculation logic
 */

export const LEVEL_XP     = 5000;
export const BREAK_XP     = 21000;
export const STREAK_DAYS  = 21;
export const STREAK_PENALTY = 4000;
export const STREAK_BONUS_XP = 2000;

export interface XPResult { xp: number; reason: string; }

export function calculateXP(p: {
  durationSec: number; sessionTotal: number; breakUsed: boolean;
  breakAfterHr4: boolean; isNight: boolean; alreadyToday: boolean;
}): XPResult {
  if (p.alreadyToday)                             return { xp: 0,    reason: 'Already earned today' };
  if (p.breakUsed && p.sessionTotal < 18000)      return { xp: 0,    reason: 'Break used — no XP' };
  if (p.isNight)                                  return { xp: 50,   reason: 'Night session (after 9PM)' };
  if (p.sessionTotal >= 18000 && !p.breakUsed)    return { xp: 1000, reason: '5-hour clean run ★' };
  if (p.sessionTotal >= 18000 && p.breakAfterHr4) return { xp: 800,  reason: '5 hours, break after hr 4' };
  const s = p.breakUsed ? p.durationSec : p.sessionTotal;
  if (s >= 18000) return { xp: 800, reason: '5 hours' };
  if (s >= 14400) return { xp: 700, reason: '4 hours' };
  if (s >= 10800) return { xp: 600, reason: '3 hours' };
  if (s >= 7200)  return { xp: 500, reason: '2 hours' };
  if (s >= 3600)  return { xp: 400, reason: '1 hour'  };
  if (s >= 1800)  return { xp: 200, reason: '30 minutes' };
  if (s >= 900)   return { xp: 100, reason: '15 minutes' };
  return { xp: 0, reason: 'Too short' };
}

export const getLevel         = (xp: number) => Math.floor(xp / LEVEL_XP) + 1;
export const getLevelProgress = (xp: number) => (xp % LEVEL_XP) / LEVEL_XP;
export const xpToNextLevel    = (xp: number) => LEVEL_XP - (xp % LEVEL_XP);
