/**
 * ActiveSessionScreen.tsx — Tron Amber Theme
 * The hero screen. Large timer, amber progress, Dungeon Break only exit.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, BackHandler,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { onSessionCompleted, onSessionBroke } from '../services/BlockerService';
import { useAriseStore } from '../store/useAriseStore';
import { formatTimer, isNightTime, todayString } from '../utils/time';
import { calculateXP } from '../utils/xp';
import { C, F } from '../theme/tron';
import { TronDivider, Label, AmberBar, AmberBadge, CornerBrackets } from '../components/TronUI';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Route = RouteProp<RootStackParamList, 'ActiveSession'>;

export default function ActiveSessionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const { durationSec, allowedPackages, endTime } = route.params;
  const { mode, lastSessionDate } = useAriseStore();

  const M = mode === 'hunter'
    ? { breakBtn: '⚡  DUNGEON BREAK — ₹200', label: 'DUNGEON ACTIVE', xp: 'XP' }
    : { breakBtn: '🔓  EMERGENCY OVERRIDE — ₹200', label: 'FOCUS BLOCK ACTIVE', xp: 'CREDITS' };

  const [remaining, setRemaining] = useState(Math.max(0, Math.floor((endTime - Date.now()) / 1000)));
  const [blink, setBlink] = useState(true);
  const tickRef = useRef<ReturnType<typeof setInterval>>();
  const blinkRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    tickRef.current = setInterval(() => {
      const rem = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setRemaining(rem);
      if (rem === 0) finish(false);
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, []);

  useEffect(() => {
    blinkRef.current = setInterval(() => setBlink(b => !b), 800);
    return () => clearInterval(blinkRef.current);
  }, []);

  useEffect(() => {
    const c = onSessionCompleted(() => finish(false));
    const b = onSessionBroke(() => finish(true));
    return () => { c.remove(); b.remove(); };
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const finish = (breakUsed: boolean) => {
    clearInterval(tickRef.current);
    const elapsed = durationSec - remaining;
    const result = calculateXP({
      durationSec: elapsed,
      sessionTotal: durationSec,
      breakUsed,
      breakAfterHr4: elapsed >= 14400 && breakUsed,
      isNight: isNightTime(),
      alreadyToday: lastSessionDate === todayString(),
    });
    useAriseStore.getState().endSession();
    navigation.replace('Complete', { durationSec: breakUsed ? elapsed : durationSec, xpEarned: result.xp, breakUsed });
  };

  const elapsed = durationSec - remaining;
  const pct = durationSec > 0 ? (elapsed / durationSec) * 100 : 0;
  const night = isNightTime();
  const alreadyToday = lastSessionDate === todayString();
  const liveXP = alreadyToday ? 0 : calculateXP({ durationSec: elapsed, sessionTotal: durationSec, breakUsed: false, breakAfterHr4: false, isNight: night, alreadyToday }).xp;

  const MILESTONES = [
    { sec: 900,   label: '15M', xp: 100 },
    { sec: 1800,  label: '30M', xp: 200 },
    { sec: 3600,  label: '1H',  xp: 400 },
    { sec: 7200,  label: '2H',  xp: 500 },
    { sec: 10800, label: '3H',  xp: 600 },
    { sec: 14400, label: '4H',  xp: 700 },
    { sec: 18000, label: '5H',  xp: 1000 },
  ].filter(m => m.sec <= durationSec);

  return (
    <SafeAreaView style={styles.screen}>
      {/* Status bar */}
      <View style={styles.topBar}>
        <View style={styles.liveRow}>
          <View style={[styles.liveDot, { opacity: blink ? 1 : 0.1 }]} />
          <Text style={styles.liveLabel}>{M.label}</Text>
        </View>
        <View style={styles.rightRow}>
          {night && <AmberBadge dim>🌙 NIGHT</AmberBadge>}
          <AmberBadge>{Math.round(pct)}%</AmberBadge>
        </View>
      </View>
      <TronDivider />

      {/* Hero timer */}
      <View style={styles.timerBlock}>
        <Label style={{ marginBottom: 12 }}>TIME REMAINING</Label>
        <Text style={styles.timerText}>{formatTimer(remaining)}</Text>
        <Text style={styles.timerSub}>remaining of {formatTimer(durationSec)}</Text>
      </View>

      {/* Progress */}
      <View style={styles.progressBlock}>
        <AmberBar pct={pct} height={5} />
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>0:00</Text>
          <Text style={styles.progressLabel}>{formatTimer(durationSec)}</Text>
        </View>
      </View>
      <TronDivider />

      {/* Milestones */}
      <View style={styles.milestones}>
        <Label style={{ marginBottom: 8 }}>MILESTONES</Label>
        <View style={styles.milestoneRow}>
          {MILESTONES.map(m => (
            <View key={m.sec} style={[styles.milestone, elapsed >= m.sec && styles.milestoneActive]}>
              <Text style={[styles.milestoneLabel, elapsed >= m.sec && { color: C.amber }]}>{m.label}</Text>
              <Text style={[styles.milestoneXP, elapsed >= m.sec && { color: C.amberB }]}>{m.xp}</Text>
            </View>
          ))}
        </View>
      </View>
      <TronDivider />

      {/* Live XP + active apps */}
      <View style={styles.infoRow}>
        <View style={styles.infoBlock}>
          <Label style={{ marginBottom: 4 }}>{M.xp} ON TRACK</Label>
          <Text style={styles.liveXP}>{alreadyToday ? '—' : `+${liveXP}`}</Text>
        </View>
        <View style={[styles.infoBlock, { borderLeftWidth: 1, borderLeftColor: C.border }]}>
          <Label style={{ marginBottom: 4 }}>ACTIVE NODES</Label>
          <View style={styles.appChips}>
            {allowedPackages.slice(0, 3).map(pkg => (
              <View key={pkg} style={styles.chip}>
                <Text style={styles.chipText}>{pkg.split('.').pop()?.toUpperCase().slice(0, 5)}</Text>
              </View>
            ))}
            {allowedPackages.length > 3 && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>+{allowedPackages.length - 3}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      <TronDivider />

      {/* Dungeon Break */}
      <View style={styles.breakBlock}>
        <TouchableOpacity
          style={styles.breakBtn}
          onPress={() => navigation.navigate('DungeonBreak', { elapsedSec: elapsed, sessionTotal: durationSec })}
          activeOpacity={0.8}
        >
          <Text style={styles.breakBtnText}>{M.breakBtn}</Text>
        </TouchableOpacity>
        <Text style={styles.breakHint}>THE ONLY EXIT FROM THIS {mode === 'hunter' ? 'DUNGEON' : 'FOCUS BLOCK'}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen:          { flex: 1, backgroundColor: C.bg },
  topBar:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingHorizontal: 20 },
  liveRow:         { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot:         { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.amber },
  liveLabel:       { fontFamily: F.orb, fontSize: 7.5, color: C.amber, letterSpacing: 2 },
  rightRow:        { flexDirection: 'row', gap: 6, alignItems: 'center' },
  timerBlock:      { paddingVertical: 36, alignItems: 'center' },
  timerText:       { fontFamily: F.mono, fontSize: 72, fontWeight: '400', color: C.text, letterSpacing: 2, lineHeight: 76 },
  timerSub:        { fontFamily: F.orb, fontSize: 8, color: C.muted, letterSpacing: 1.5, marginTop: 8 },
  progressBlock:   { paddingHorizontal: 20, paddingBottom: 12 },
  progressLabels:  { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  progressLabel:   { fontFamily: F.orb, fontSize: 7, color: C.ghost },
  milestones:      { padding: 16, paddingHorizontal: 20 },
  milestoneRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  milestone:       { borderWidth: 1, borderColor: C.border, backgroundColor: C.dim, paddingHorizontal: 8, paddingVertical: 6, alignItems: 'center' },
  milestoneActive: { borderColor: C.amber, backgroundColor: C.amberFF },
  milestoneLabel:  { fontFamily: F.orb, fontSize: 8, color: C.ghost, letterSpacing: 1, fontWeight: '700' },
  milestoneXP:     { fontFamily: F.orb, fontSize: 7, color: C.ghost, letterSpacing: 0.5, marginTop: 2 },
  infoRow:         { flexDirection: 'row' },
  infoBlock:       { flex: 1, padding: 16, paddingHorizontal: 20 },
  liveXP:          { fontFamily: F.orb, fontSize: 22, fontWeight: '700', color: C.amber },
  appChips:        { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  chip:            { borderWidth: 1, borderColor: C.border, paddingHorizontal: 6, paddingVertical: 2 },
  chipText:        { fontFamily: F.orb, fontSize: 6.5, color: C.muted, letterSpacing: 0.8 },
  breakBlock:      { padding: 20 },
  breakBtn:        { backgroundColor: C.redF, borderWidth: 1, borderColor: C.red + '55', paddingVertical: 15, alignItems: 'center' },
  breakBtnText:    { fontFamily: F.orb, fontSize: 10, fontWeight: '700', color: C.red, letterSpacing: 2 },
  breakHint:       { fontFamily: F.orb, fontSize: 7, color: C.ghost, textAlign: 'center', marginTop: 8, letterSpacing: 1 },
});
