/**
 * HomeScreen.tsx — Tron Amber Theme
 * Main dashboard: XP, streak, week stats, enter session CTA.
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAriseStore } from '../store/useAriseStore';
import { C, F } from '../theme/tron';
import { todayString, daysBetween, formatDuration } from '../utils/time';
import { getLevel, getLevelProgress, STREAK_PENALTY } from '../utils/xp';
import {
  TronDivider, Label, AmberBar, StatBox,
  StreakGrid, TronButton, SessionRow, AmberBadge,
} from '../components/TronUI';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const {
    xp, streak, mode, sessions, totalFocusSec,
    lastSessionDate, applyStreakPenalty,
  } = useAriseStore();

  const [blinkOn, setBlinkOn] = useState(true);
  const [penaltyApplied, setPenaltyApplied] = useState(false);
  const [time, setTime] = useState(new Date());

  const M = mode === 'hunter'
    ? { enter: '⚔  ENTER DUNGEON', xp: 'XP', streak: 'STREAK', session: 'DUNGEON' }
    : { enter: '◈  START FOCUS BLOCK', xp: 'CREDITS', streak: 'CONSISTENCY', session: 'FOCUS BLOCK' };

  // Clock
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Blink
  useEffect(() => {
    const id = setInterval(() => setBlinkOn(b => !b), 900);
    return () => clearInterval(id);
  }, []);

  // Streak penalty check
  useEffect(() => {
    if (!lastSessionDate) return;
    const today = todayString();
    if (lastSessionDate !== today) {
      const diff = daysBetween(lastSessionDate, today);
      if (diff > 1 && streak > 0) {
        applyStreakPenalty();
        setPenaltyApplied(true);
      }
    }
  }, []);

  const level = getLevel(xp);
  const lvlPct = getLevelProgress(xp) * 100;
  const alreadyToday = lastSessionDate === todayString();

  // Week stats
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const weekSessions = sessions.filter(s => new Date(s.date) >= weekAgo);
  const weekFocusSec = weekSessions.reduce((a, s) => a + s.durationSec, 0);
  const weekXP = weekSessions.reduce((a, s) => a + s.xpEarned, 0);

  const totalH = Math.floor(totalFocusSec / 3600);
  const totalM = Math.floor((totalFocusSec % 3600) / 60);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* ── Penalty Banner ── */}
        {penaltyApplied && (
          <View style={styles.penaltyBanner}>
            <Text style={styles.penaltyText}>
              ⚠  {M.streak} BROKEN — {STREAK_PENALTY.toLocaleString()} {M.xp} DEDUCTED
            </Text>
          </View>
        )}

        {/* ── Status Bar ── */}
        <View style={styles.topBar}>
          <View style={styles.liveRow}>
            <View style={[styles.liveDot, { opacity: blinkOn ? 1 : 0.15 }]} />
            <Text style={styles.liveText}>SYSTEM ONLINE</Text>
          </View>
          <Text style={styles.clock}>
            {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </Text>
        </View>
        <TronDivider />

        {/* ── App Identity ── */}
        <View style={styles.identity}>
          <View style={styles.identityRow}>
            <Text style={styles.appName}>ARISE</Text>
            <AmberBadge dim={mode === 'focus'}>
              {mode === 'hunter' ? '⚔ HUNTER' : '◈ FOCUS'}
            </AmberBadge>
          </View>
          <Text style={styles.identitySub}>
            {mode === 'hunter' ? 'HUNTER MODE' : 'FOCUS MODE'} · LV {level} OPERATOR
          </Text>
        </View>
        <TronDivider />

        {/* ── XP + Level Bar ── */}
        <View style={styles.xpBlock}>
          <View style={styles.xpRow}>
            <View style={styles.xpLeft}>
              <Text style={styles.xpNum}>{xp.toLocaleString()}</Text>
              <Text style={styles.xpLabel}>{M.xp}</Text>
            </View>
            <AmberBadge>LV {level}</AmberBadge>
          </View>
          <AmberBar pct={lvlPct} height={4} />
          <View style={styles.xpBarLabels}>
            <Label>LEVEL {level}</Label>
            <Label>{(5000 - (xp % 5000)).toLocaleString()} TO NEXT</Label>
          </View>
        </View>
        <TronDivider />

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          <StatBox label={M.streak} value={`${streak}/21`} highlight />
          <StatBox label="SESSIONS" value={sessions.length} />
          <StatBox label="ALL TIME" value={totalH > 0 ? `${totalH}h` : `${totalM}m`} />
        </View>
        <TronDivider />

        {/* ── 21-Day Streak Grid ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Label>21-DAY {M.streak} GRID</Label>
            <Text style={[styles.streakStatus, { color: streak >= 21 ? C.green : C.muted }]}>
              {streak >= 21 ? 'COMPLETE ✓' : `${21 - streak} TO GO`}
            </Text>
          </View>
          <StreakGrid count={streak} />
        </View>
        <TronDivider />

        {/* ── This Week ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Label>THIS WEEK</Label>
            <TouchableOpacity onPress={() => navigation.navigate('Stats')}>
              <Text style={styles.seeAll}>SEE ALL →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.weekRow}>
            <StatBox label="SESSIONS" value={weekSessions.length} />
            <StatBox label="FOCUS" value={weekFocusSec >= 3600 ? `${Math.floor(weekFocusSec / 3600)}h` : `${Math.floor(weekFocusSec / 60)}m`} />
            <StatBox label={M.xp} value={weekXP > 0 ? `+${weekXP}` : '—'} />
          </View>
        </View>
        <TronDivider />

        {/* ── Today status ── */}
        {alreadyToday && (
          <>
            <View style={styles.todayBanner}>
              <Text style={styles.todayText}>✓  {M.xp} EARNED TODAY — RESETS AT MIDNIGHT</Text>
            </View>
            <TronDivider />
          </>
        )}

        {/* ── Recent History ── */}
        {sessions.length > 0 && (
          <>
            <View style={styles.section}>
              <Label style={{ marginBottom: 12 }}>RECENT SESSIONS</Label>
              {sessions.slice(0, 4).map(s => (
                <SessionRow
                  key={s.id}
                  date={s.date}
                  duration={formatDuration(s.durationSec)}
                  xp={s.xpEarned}
                  breakUsed={s.breakUsed}
                  modeName={M.xp}
                />
              ))}
            </View>
            <TronDivider />
          </>
        )}

        {/* ── CTA ── */}
        <View style={styles.ctaBlock}>
          <TronButton label={M.enter} onPress={() => navigation.navigate('SelectApps')} />
          <View style={styles.ctaSecRow}>
            <TouchableOpacity style={styles.ctaSecBtn} onPress={() => navigation.navigate('Stats')}>
              <Text style={styles.ctaSecText}>STATS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctaSecBtn} onPress={() => navigation.navigate('XPStore')}>
              <Text style={styles.ctaSecText}>{M.xp} STORE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctaSecBtn} onPress={() => navigation.navigate('Settings')}>
              <Text style={styles.ctaSecText}>⚙</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen:          { flex: 1, backgroundColor: C.bg },
  penaltyBanner:   { backgroundColor: C.redF, padding: 10, paddingHorizontal: 20 },
  penaltyText:     { fontFamily: F.orb, fontSize: 8, color: C.red, letterSpacing: 1.5 },
  topBar:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingHorizontal: 20 },
  liveRow:         { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot:         { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.amber },
  liveText:        { fontFamily: F.orb, fontSize: 7.5, color: C.amber, letterSpacing: 2 },
  clock:           { fontFamily: F.mono, fontSize: 12, color: C.muted },
  identity:        { padding: 20, paddingBottom: 16 },
  identityRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  appName:         { fontFamily: F.orb, fontSize: 34, fontWeight: '900', color: C.text, letterSpacing: 3 },
  identitySub:     { fontFamily: F.mono, fontSize: 9, color: C.muted, letterSpacing: 1.5 },
  xpBlock:         { padding: 20, paddingBottom: 16 },
  xpRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 },
  xpLeft:          { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  xpNum:           { fontFamily: F.orb, fontSize: 30, fontWeight: '900', color: C.amber, lineHeight: 32 },
  xpLabel:         { fontFamily: F.orb, fontSize: 10, color: C.muted, letterSpacing: 1.5 },
  xpBarLabels:     { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  statsRow:        { flexDirection: 'row', gap: 8, padding: 16, paddingHorizontal: 20 },
  section:         { padding: 20 },
  sectionHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  streakStatus:    { fontFamily: F.orb, fontSize: 8, letterSpacing: 1.2 },
  seeAll:          { fontFamily: F.orb, fontSize: 8, color: C.amber, letterSpacing: 1.2 },
  weekRow:         { flexDirection: 'row', gap: 8 },
  todayBanner:     { backgroundColor: C.amberFF, padding: 10, paddingHorizontal: 20 },
  todayText:       { fontFamily: F.orb, fontSize: 8, color: C.amber, letterSpacing: 1.5 },
  ctaBlock:        { padding: 20 },
  ctaSecRow:       { flexDirection: 'row', gap: 8, marginTop: 8 },
  ctaSecBtn:       { flex: 1, borderWidth: 1, borderColor: C.border, paddingVertical: 10, alignItems: 'center' },
  ctaSecText:      { fontFamily: F.orb, fontSize: 8, color: C.muted, letterSpacing: 1.5 },
});
