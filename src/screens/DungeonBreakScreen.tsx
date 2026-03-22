/**
 * DungeonBreakScreen.tsx — Tron Amber Theme
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, BackHandler } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { triggerDungeonBreak } from '../services/BlockerService';
import { useAriseStore } from '../store/useAriseStore';
import { C, F } from '../theme/tron';
import { TronDivider, Label, TronButton, CornerBrackets, StreakGrid } from '../components/TronUI';
import { getLevel, getLevelProgress, STREAK_DAYS, STREAK_BONUS_XP } from '../utils/xp';
import { formatDuration, todayString, isNightTime } from '../utils/time';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Route = RouteProp<RootStackParamList, 'DungeonBreak'>;
const XP_COST = 21000;
const TIMER_SECS = 300;
const QUOTES = [
  "You said you would. Don't let yourself down.",
  "Every time you resist, you get stronger.",
  "The scroll will still be there. Your focus won't.",
  "Discipline is choosing what you want MOST.",
  "Your future self is watching. Make them proud.",
  "Boredom is where ideas are born. Stay.",
];

export function DungeonBreakScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const { elapsedSec, sessionTotal } = route.params;
  const { xp, mode, deductXp } = useAriseStore();

  const M = mode === 'hunter'
    ? { title: 'EXIT THE DUNGEON?', breakName: 'DUNGEON BREAK', returnBtn: '← RETURN TO DUNGEON', xp: 'XP' }
    : { title: 'END YOUR FOCUS BLOCK?', breakName: 'EMERGENCY OVERRIDE', returnBtn: '← RETURN TO FOCUS BLOCK', xp: 'CREDITS' };

  const canXP = xp >= XP_COST;
  const [phase, setPhase] = useState<'confirm' | 'timer'>('confirm');
  const [timerLeft, setTimerLeft] = useState(TIMER_SECS);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => phase === 'timer');
    return () => sub.remove();
  }, [phase]);

  useEffect(() => {
    if (phase !== 'timer') return;
    tickRef.current = setInterval(() => {
      setTimerLeft(t => {
        if (t <= 1) { clearInterval(tickRef.current); done(); return 0; }
        if (t % 60 === 0) setQuoteIdx(i => (i + 1) % QUOTES.length);
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [phase]);

  const payAndBreak = async () => {
    await triggerDungeonBreak();
    setPhase('timer');
  };

  const spendXP = async () => {
    deductXp(XP_COST);
    await triggerDungeonBreak();
    setPhase('timer');
  };

  const done = () => {
    clearInterval(tickRef.current);
    navigation.replace('Complete', { durationSec: elapsedSec, xpEarned: 0, breakUsed: true });
  };

  const skipTimer = () => done();

  const prog = 1 - timerLeft / TIMER_SECS;

  // ── Timer Phase ──
  if (phase === 'timer') return (
    <SafeAreaView style={styles.screen}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <CornerBrackets size={14} color={C.purple} />
        <Label style={{ color: C.purple, marginBottom: 16 }}>REFLECTION PERIOD</Label>
        <Text style={[styles.reflTimer, { color: C.text }]}>{timerLeft}</Text>
        <Text style={[styles.reflSub]}>SECONDS</Text>
        <View style={styles.reflTrack}>
          <View style={[styles.reflFill, { width: `${prog * 100}%` as any }]} />
        </View>
        <View style={styles.quoteBox}>
          <Text style={styles.quote}>"{QUOTES[quoteIdx]}"</Text>
        </View>
      </View>
      <View style={{ padding: 20, gap: 8 }}>
        <TronButton label={M.returnBtn} onPress={() => { clearInterval(tickRef.current); navigation.goBack(); }} />
        <TronButton label="SKIP TIMER — ₹50 EXTRA" onPress={skipTimer} variant="danger" />
      </View>
      <Text style={styles.autoNote}>AUTO-EXITS WHEN TIMER REACHES ZERO</Text>
    </SafeAreaView>
  );

  // ── Confirm Phase ──
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← BACK TO SESSION</Text>
        </TouchableOpacity>
      </View>
      <TronDivider />

      <View style={{ padding: 20 }}>
        <Label style={{ color: C.red, marginBottom: 10 }}>{M.breakName}</Label>
        <Text style={styles.breakTitle}>{M.title}</Text>
        <Text style={styles.breakSub}>
          Paying starts a 5-minute reflection timer. You can still return to the session from there — for free.
        </Text>
      </View>
      <TronDivider />

      {/* Cash option */}
      <View style={styles.optCard}>
        <View style={styles.optRow}>
          <View>
            <Text style={styles.optTitle}>CASH EXIT</Text>
            <Text style={styles.optDesc}>Starts 5-min reflection timer</Text>
          </View>
          <Text style={styles.optPrice}>₹200</Text>
        </View>
        <TronButton label="PAY ₹200 → START TIMER" onPress={payAndBreak} variant="danger" />
      </View>

      {/* XP option */}
      <View style={[styles.optCard, !canXP && { opacity: 0.35 }]}>
        <View style={styles.optRow}>
          <View>
            <Text style={[styles.optTitle, !canXP && { color: C.ghost }]}>{M.xp} EXIT</Text>
            <Text style={styles.optDesc}>
              {canXP ? `${xp.toLocaleString()} available` : `Need ${(XP_COST - xp).toLocaleString()} more`}
            </Text>
          </View>
          <Text style={[styles.optXP, !canXP && { color: C.ghost }]}>21,000</Text>
        </View>
        <TronButton
          label={canXP ? `SPEND ${M.xp} → START TIMER` : `NOT ENOUGH ${M.xp}`}
          onPress={spendXP}
          disabled={!canXP}
          variant="outline"
        />
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// CompleteScreen — Tron Amber Theme
// ─────────────────────────────────────────────────────────────

export function CompleteScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'Complete'>>();
  const { durationSec, xpEarned, breakUsed } = route.params;
  const { xp, streak, mode, lastSessionDate, addXp, incrementStreak, setLastSessionDate, addSession } = useAriseStore();

  const M = mode === 'hunter'
    ? { hero: breakUsed ? 'SESSION\nENDED.' : 'YOU\nAROSE.', xp: 'XP' }
    : { hero: breakUsed ? 'BLOCK\nENDED.' : 'BLOCK\nCOMPLETE.', xp: 'CREDITS' };

  const today = todayString();
  const alreadyToday = lastSessionDate === today;

  useEffect(() => {
    if (xpEarned > 0 && !alreadyToday) {
      addXp(xpEarned);
      incrementStreak();
      setLastSessionDate(today);
      if (streak + 1 === STREAK_DAYS) addXp(STREAK_BONUS_XP);
    }
    addSession({
      id: String(Date.now()), date: today, durationSec,
      xpEarned, breakUsed, breakMethod: breakUsed ? 'inr' : null,
      isNight: isNightTime(), apps: [],
    });
  }, []);

  const newXp = xp + (alreadyToday ? 0 : xpEarned);
  const heroLines = M.hero.split('\n');

  return (
    <SafeAreaView style={cs.screen}>
      <ScrollView contentContainerStyle={cs.content}>
        <Label style={{ marginBottom: 12 }}>{breakUsed ? `${M.xp === 'XP' ? 'DUNGEON' : 'OVERRIDE'} BREAK USED` : (mode === 'hunter' ? 'DUNGEON CLEARED' : 'BLOCK COMPLETE')}</Label>

        {/* Hero text */}
        <Text style={cs.hero}>
          {heroLines.map((line, i, arr) => (
            i === arr.length - 1
              ? <Text key={i} style={breakUsed ? { color: C.red } : { color: C.amber }}>{line}</Text>
              : <Text key={i}>{line}{'\n'}</Text>
          ))}
        </Text>
        <Text style={cs.duration}>{formatDuration(durationSec)}</Text>

        {/* XP earned card */}
        {xpEarned > 0 && !alreadyToday && (
          <View style={cs.card}>
            <Label style={{ marginBottom: 10 }}>{M.xp} EARNED</Label>
            <View style={cs.xpRow}>
              <Text style={cs.xpNum}>+{xpEarned}</Text>
              <Text style={cs.xpUnit}>{M.xp}</Text>
            </View>
            <View style={{ marginTop: 14 }}>
              <View style={cs.lvlBar}>
                <View style={[cs.lvlFill, { width: `${getLevelProgress(newXp) * 100}%` as any }]} />
              </View>
              <Text style={cs.lvlLabel}>LEVEL {getLevel(newXp)}</Text>
            </View>
            {streak + 1 === STREAK_DAYS && (
              <View style={cs.bonusBanner}>
                <Text style={cs.bonusText}>🏆  21-DAY {mode === 'hunter' ? 'STREAK' : 'CONSISTENCY'} COMPLETE — +{STREAK_BONUS_XP} BONUS {M.xp}</Text>
              </View>
            )}
          </View>
        )}

        {/* Streak dots */}
        {xpEarned > 0 && !alreadyToday && (
          <View style={cs.card}>
            <View style={cs.streakHeader}>
              <Label>21-DAY STREAK</Label>
              <Text style={cs.streakDay}>DAY {streak + 1}</Text>
            </View>
            <StreakGrid count={streak + 1} />
          </View>
        )}

        {/* Buttons */}
        <View style={{ gap: 8, marginTop: 12 }}>
          <TronButton label="RETURN TO BASE" onPress={() => navigation.replace('Home')} />
          <TronButton label="START ANOTHER SESSION" onPress={() => navigation.replace('SelectApps')} variant="ghost" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: C.bg },
  header:      { flexDirection: 'row', padding: 18, paddingHorizontal: 20 },
  back:        { fontFamily: F.orb, fontSize: 8, color: C.muted, letterSpacing: 1.5 },
  breakTitle:  { fontFamily: F.orb, fontSize: 22, fontWeight: '900', color: C.text, letterSpacing: 1.5, lineHeight: 28, marginBottom: 8 },
  breakSub:    { fontFamily: F.mono, fontSize: 11, color: C.muted, lineHeight: 18 },
  optCard:     { margin: 16, marginBottom: 0, borderWidth: 1, borderColor: C.border, backgroundColor: C.dim, padding: 16 },
  optRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  optTitle:    { fontFamily: F.orb, fontSize: 11, fontWeight: '700', color: C.text, letterSpacing: 1.5, marginBottom: 2 },
  optDesc:     { fontFamily: F.mono, fontSize: 10, color: C.muted },
  optPrice:    { fontFamily: F.orb, fontSize: 26, fontWeight: '900', color: C.red, lineHeight: 28 },
  optXP:       { fontFamily: F.orb, fontSize: 20, fontWeight: '700', color: C.amber, lineHeight: 24 },
  reflTimer:   { fontFamily: F.mono, fontSize: 90, fontWeight: '400', lineHeight: 92, letterSpacing: 2 },
  reflSub:     { fontFamily: F.orb, fontSize: 8, color: C.muted, letterSpacing: 2, marginBottom: 20 },
  reflTrack:   { width: 160, height: 2, backgroundColor: C.faint, overflow: 'hidden', marginBottom: 32 },
  reflFill:    { height: '100%', backgroundColor: C.purple },
  quoteBox:    { borderWidth: 1, borderColor: C.border, padding: 16, marginHorizontal: 8 },
  quote:       { fontFamily: F.mono, fontStyle: 'italic', fontSize: 13, color: C.muted, lineHeight: 20, textAlign: 'center' },
  autoNote:    { fontFamily: F.orb, fontSize: 7, color: C.ghost, textAlign: 'center', padding: 14, letterSpacing: 1 },
});

const cs = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: C.bg },
  content:      { padding: 24, paddingTop: 48 },
  hero:         { fontFamily: F.orb, fontSize: 52, fontWeight: '900', color: C.text, lineHeight: 56, letterSpacing: 1, marginBottom: 8, marginTop: 12 },
  duration:     { fontFamily: F.mono, fontSize: 11, color: C.muted, marginBottom: 28, letterSpacing: 1.5 },
  card:         { borderWidth: 1, borderColor: C.border, backgroundColor: C.dim, padding: 18, marginBottom: 10 },
  xpRow:        { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  xpNum:        { fontFamily: F.orb, fontSize: 48, fontWeight: '900', color: C.amber, lineHeight: 50 },
  xpUnit:       { fontFamily: F.orb, fontSize: 14, color: C.muted, letterSpacing: 1.5 },
  lvlBar:       { height: 3, backgroundColor: C.faint, overflow: 'hidden' },
  lvlFill:      { height: '100%', backgroundColor: C.amber },
  lvlLabel:     { fontFamily: F.orb, fontSize: 7.5, color: C.muted, marginTop: 5, letterSpacing: 1.2 },
  bonusBanner:  { marginTop: 12, backgroundColor: C.amberFF, borderWidth: 1, borderColor: C.amber, padding: 10 },
  bonusText:    { fontFamily: F.orb, fontSize: 8, color: C.amber, letterSpacing: 1, lineHeight: 13 },
  streakHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  streakDay:    { fontFamily: F.orb, fontSize: 10, fontWeight: '700', color: C.amber, letterSpacing: 1 },
});

export default DungeonBreakScreen;
