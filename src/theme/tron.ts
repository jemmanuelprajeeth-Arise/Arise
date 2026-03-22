/**
 * src/theme/tron.ts
 * Arise — Tron Legacy Amber Design System
 * All color tokens, typography, spacing, and shared style helpers.
 */

// ─── Color Tokens ─────────────────────────────────────────────
export const C = {
  // Backgrounds
  bg:       '#050402',   // deepest black
  surf:     '#0C0906',   // card surface
  surf2:    '#110D08',   // elevated surface
  dim:      '#1A0E05',   // subtle fill
  faint:    '#3A2210',   // disabled / ghost fill

  // Borders
  border:   '#1E1208',   // default 1px border
  borderHi: '#3A2010',   // hover / selected border

  // Text
  text:     '#EAC878',   // primary text (warm gold)
  muted:    '#7A5C28',   // secondary text
  ghost:    '#3A2210',   // placeholder / disabled text

  // Brand accent — amber orange
  amber:    '#FF7A00',   // primary accent
  amberB:   '#FFB030',   // bright highlight
  amberFF:  '#120A00',   // amber fill background
  amberD:   '#CC5500',   // darker amber

  // Danger — only for Dungeon Break / exit
  red:      '#CC2200',
  redB:     '#FF4422',
  redF:     '#1A0500',

  // Success — session complete
  green:    '#00AA44',
  greenF:   '#001A0A',

  // Purple — reflection timer
  purple:   '#AA66FF',
  purpleF:  '#0A001A',
} as const;

// ─── Typography ───────────────────────────────────────────────
export const F = {
  orb:  "'Orbitron', 'Courier New', monospace",
  mono: "'Share Tech Mono', 'Courier New', monospace",
} as const;

// ─── Spacing ──────────────────────────────────────────────────
export const S = {
  screenH:  24,   // horizontal screen padding
  cardP:    14,   // card inner padding
  gap:       8,   // standard gap
  gapL:     12,   // large gap
} as const;

// ─── Shared StyleSheet fragments (use with spread) ────────────
export const shared = {
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },
  label: {
    fontFamily: F.orb,
    fontSize: 7.5,
    letterSpacing: 1.8,
    textTransform: 'uppercase' as const,
    color: C.muted,
  },
  heroTitle: {
    fontFamily: F.orb,
    fontSize: 32,
    fontWeight: '900' as const,
    color: C.text,
    letterSpacing: 2,
  },
  mono: {
    fontFamily: F.mono,
    color: C.text,
  },
  card: {
    backgroundColor: C.dim,
    borderWidth: 1,
    borderColor: C.border,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
  },
  amberText: {
    color: C.amber,
    fontFamily: F.orb,
  },
  btn: {
    backgroundColor: C.amber,
    paddingVertical: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  btnText: {
    fontFamily: F.orb,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 2,
    color: C.bg,
  },
  ghostBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 12,
    alignItems: 'center' as const,
  },
  ghostBtnText: {
    fontFamily: F.orb,
    fontSize: 9,
    letterSpacing: 1.5,
    color: C.muted,
  },
  dangerBtn: {
    backgroundColor: C.redF,
    borderWidth: 1,
    borderColor: C.red + '44',
    paddingVertical: 14,
    alignItems: 'center' as const,
  },
  dangerBtnText: {
    fontFamily: F.orb,
    fontSize: 10,
    letterSpacing: 2,
    color: C.red,
    fontWeight: '700' as const,
  },
} as const;

// ─── XP thresholds ────────────────────────────────────────────
export const LEVEL_XP = 5000;
export const BREAK_XP = 21000;
export const STREAK_GOAL = 21;
export const STREAK_PENALTY = 4000;
export const STREAK_BONUS = 2000;
