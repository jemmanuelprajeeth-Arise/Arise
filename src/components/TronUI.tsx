/**
 * src/components/TronUI.tsx
 * Reusable Tron-themed UI primitives used across all screens.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { C, F } from '../theme/tron';

// ─── Corner Brackets ──────────────────────────────────────────
export function CornerBrackets({ size = 12, color = C.amber }: { size?: number; color?: string }) {
  const bStyle: ViewStyle = { position: 'absolute', width: size, height: size };
  const lineH: ViewStyle = { position: 'absolute', height: 1.5, width: size, backgroundColor: color };
  const lineV: ViewStyle = { position: 'absolute', width: 1.5, height: size, backgroundColor: color };
  return (
    <>
      {/* Top Left */}
      <View style={[bStyle, { top: 0, left: 0 }]}>
        <View style={[lineH, { top: 0, left: 0 }]} />
        <View style={[lineV, { top: 0, left: 0 }]} />
      </View>
      {/* Top Right */}
      <View style={[bStyle, { top: 0, right: 0 }]}>
        <View style={[lineH, { top: 0, right: 0 }]} />
        <View style={[lineV, { top: 0, right: 0 }]} />
      </View>
      {/* Bottom Left */}
      <View style={[bStyle, { bottom: 0, left: 0 }]}>
        <View style={[lineH, { bottom: 0, left: 0 }]} />
        <View style={[lineV, { bottom: 0, left: 0 }]} />
      </View>
      {/* Bottom Right */}
      <View style={[bStyle, { bottom: 0, right: 0 }]}>
        <View style={[lineH, { bottom: 0, right: 0 }]} />
        <View style={[lineV, { bottom: 0, right: 0 }]} />
      </View>
    </>
  );
}

// ─── Tron Divider ─────────────────────────────────────────────
export function TronDivider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />;
}

// ─── Screen Label ─────────────────────────────────────────────
export function Label({ children, color, style }: {
  children: React.ReactNode; color?: string; style?: TextStyle;
}) {
  return (
    <Text style={[styles.label, color ? { color } : {}, style]}>
      {children}
    </Text>
  );
}

// ─── Amber Progress Bar ───────────────────────────────────────
export function AmberBar({ pct, height = 3 }: { pct: number; height?: number }) {
  return (
    <View style={[styles.barTrack, { height }]}>
      <View style={[styles.barFill, { width: `${Math.min(100, Math.max(0, pct))}%` }]} />
      {[25, 50, 75].map(t => (
        <View key={t} style={[styles.barTick, { left: `${t}%` }]} />
      ))}
    </View>
  );
}

// ─── XP Badge ─────────────────────────────────────────────────
export function AmberBadge({ children, dim }: { children: React.ReactNode; dim?: boolean }) {
  return (
    <View style={[styles.badge, dim && styles.badgeDim]}>
      <Text style={[styles.badgeText, dim && styles.badgeTextDim]}>{children}</Text>
    </View>
  );
}

// ─── Primary Button ───────────────────────────────────────────
export function TronButton({
  label, onPress, variant = 'primary', disabled = false, style,
}: {
  label: string; onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger' | 'outline';
  disabled?: boolean; style?: ViewStyle;
}) {
  const btnStyles = {
    primary: styles.btnPrimary,
    ghost:   styles.btnGhost,
    danger:  styles.btnDanger,
    outline: styles.btnOutline,
  };
  const txtStyles = {
    primary: styles.btnPrimaryText,
    ghost:   styles.btnGhostText,
    danger:  styles.btnDangerText,
    outline: styles.btnOutlineText,
  };
  return (
    <TouchableOpacity
      style={[styles.btnBase, btnStyles[variant], disabled && styles.btnDisabled, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
    >
      <Text style={[styles.btnBaseText, txtStyles[variant], disabled && styles.btnTextDisabled]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Stat Box ─────────────────────────────────────────────────
export function StatBox({ label, value, highlight }: {
  label: string; value: string | number; highlight?: boolean;
}) {
  return (
    <View style={[styles.statBox, highlight && styles.statBoxHighlight]}>
      {highlight && <CornerBrackets size={8} />}
      <Text style={[styles.statVal, highlight && { color: C.amber }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Session History Row ──────────────────────────────────────
export function SessionRow({ date, duration, xp, breakUsed, modeName }: {
  date: string; duration: string; xp: number; breakUsed: boolean; modeName: string;
}) {
  return (
    <View style={styles.histRow}>
      <View style={[styles.histIcon, { backgroundColor: breakUsed ? C.redF : C.amberFF }]}>
        <Text style={[styles.histIconText, { color: breakUsed ? C.red : C.amber }]}>
          {breakUsed ? '⚡' : '✓'}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.histDuration}>{duration}</Text>
        <Text style={styles.histDate}>{date}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        {xp > 0
          ? <Text style={styles.histXp}>+{xp} {modeName}</Text>
          : <Text style={styles.histNoXp}>—</Text>
        }
        {breakUsed && <Text style={styles.histBreak}>BREAK USED</Text>}
      </View>
    </View>
  );
}

// ─── Streak Dot Grid ─────────────────────────────────────────
export function StreakGrid({ count }: { count: number }) {
  return (
    <View style={styles.streakGrid}>
      {Array.from({ length: 21 }).map((_, i) => (
        <View key={i} style={[styles.streakDot, i < count && styles.streakDotActive]}>
          {i < count && <Text style={styles.streakCheck}>✓</Text>}
        </View>
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  divider:          { height: 1, backgroundColor: C.border },
  label:            { fontFamily: F.orb, fontSize: 7.5, letterSpacing: 1.8, textTransform: 'uppercase', color: C.muted },
  barTrack:         { backgroundColor: C.faint, position: 'relative', overflow: 'hidden' },
  barFill:          { position: 'absolute', top: 0, left: 0, bottom: 0, backgroundColor: C.amber },
  barTick:          { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: C.bg, opacity: 0.6 },
  badge:            { borderWidth: 1, borderColor: C.amber, backgroundColor: C.amberFF, paddingHorizontal: 8, paddingVertical: 3 },
  badgeDim:         { borderColor: C.faint, backgroundColor: C.dim },
  badgeText:        { fontFamily: F.orb, fontSize: 7.5, letterSpacing: 1.2, color: C.amber, textTransform: 'uppercase' },
  badgeTextDim:     { color: C.muted },
  btnBase:          { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  btnBaseText:      { fontFamily: F.orb, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' },
  btnPrimary:       { backgroundColor: C.amber },
  btnPrimaryText:   { color: C.bg, fontWeight: '700' },
  btnGhost:         { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.border },
  btnGhostText:     { color: C.muted },
  btnDanger:        { backgroundColor: C.redF, borderWidth: 1, borderColor: C.red + '55' },
  btnDangerText:    { color: C.red, fontWeight: '700' },
  btnOutline:       { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.amber },
  btnOutlineText:   { color: C.amber },
  btnDisabled:      { opacity: 0.3 },
  btnTextDisabled:  { color: C.muted },
  statBox:          { flex: 1, borderWidth: 1, borderColor: C.border, backgroundColor: C.dim, padding: 10, alignItems: 'center', position: 'relative' },
  statBoxHighlight: { borderColor: C.amber, backgroundColor: C.amberFF },
  statVal:          { fontFamily: F.orb, fontSize: 18, fontWeight: '700', color: C.text, lineHeight: 22, marginBottom: 4 },
  statLabel:        { fontFamily: F.orb, fontSize: 6.5, letterSpacing: 1.2, color: C.muted, textTransform: 'uppercase' },
  histRow:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, gap: 10 },
  histIcon:         { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  histIconText:     { fontSize: 14 },
  histDuration:     { fontFamily: F.orb, fontSize: 12, color: C.text, fontWeight: '600' },
  histDate:         { fontFamily: F.mono, fontSize: 10, color: C.muted, marginTop: 2 },
  histXp:           { fontFamily: F.orb, fontSize: 11, fontWeight: '700', color: C.amber },
  histNoXp:         { fontFamily: F.orb, fontSize: 11, color: C.faint },
  histBreak:        { fontFamily: F.orb, fontSize: 7, color: C.red, letterSpacing: 1, marginTop: 2 },
  streakGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  streakDot:        { width: 20, height: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.faint, alignItems: 'center', justifyContent: 'center' },
  streakDotActive:  { backgroundColor: C.amber, borderColor: C.amberB },
  streakCheck:      { fontFamily: F.orb, fontSize: 6, color: C.bg },
});
