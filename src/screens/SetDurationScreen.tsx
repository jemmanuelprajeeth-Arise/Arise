/**
 * SetDurationScreen.tsx — Tron Amber Theme
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { startSession } from '../services/BlockerService';
import { useAriseStore } from '../store/useAriseStore';
import { calculateXP } from '../utils/xp';
import { isNightTime, todayString } from '../utils/time';
import { C, F } from '../theme/tron';
import { TronDivider, Label, TronButton, AmberBar } from '../components/TronUI';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Route = RouteProp<RootStackParamList, 'SetDuration'>;

export function SetDurationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const { selectedApps } = route.params;
  const { lastSessionDate, mode } = useAriseStore();

  const [hours, setHours] = useState(1);
  const [mins, setMins] = useState(0);

  const M = mode === 'hunter'
    ? { enter: '⚔  ENTER DUNGEON', xp: 'XP', breakName: 'DUNGEON BREAK' }
    : { enter: '◈  START FOCUS BLOCK', xp: 'CREDITS', breakName: 'EMERGENCY OVERRIDE' };

  const totalSec = hours * 3600 + mins * 60;
  const alreadyToday = lastSessionDate === todayString();
  const night = isNightTime();
  const preview = calculateXP({ durationSec: totalSec, sessionTotal: totalSec, breakUsed: false, breakAfterHr4: false, isNight: night, alreadyToday });

  const handleStart = async () => {
    if (totalSec < 900) return;
    const endTime = Date.now() + totalSec * 1000;
    await startSession({ durationSeconds: totalSec, allowedPackages: selectedApps });
    useAriseStore.getState().startSession(totalSec, selectedApps, endTime);
    navigation.replace('ActiveSession', { durationSec: totalSec, allowedPackages: selectedApps, endTime });
  };

  return (
    <SafeAreaView style={ss.screen}>
      <View style={ss.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={ss.back}>← BACK</Text>
        </TouchableOpacity>
        <Label>SESSION DURATION</Label>
      </View>
      <TronDivider />

      <View style={{ padding: 20 }}>
        <Text style={ss.title}>SET DURATION</Text>
        <Text style={ss.sub}>Maximum session: 5 hours</Text>
      </View>
      <TronDivider />

      {/* Picker */}
      <View style={ss.pickerRow}>
        {[
          { label: 'HRS', val: hours, set: setHours, min: 0, max: 5, step: 1 },
          { label: 'MIN', val: mins, set: setMins, min: 0, max: 45, step: 15 },
        ].map(({ label, val, set, min, max, step }, idx) => (
          <View key={label} style={[ss.pickerCol, idx === 0 && ss.pickerColBorder]}>
            <Label>{label}</Label>
            <TouchableOpacity onPress={() => set(v => Math.min(max, v + step))} style={ss.pickerBtn}>
              <Text style={ss.pickerBtnTxt}>+</Text>
            </TouchableOpacity>
            <Text style={ss.pickerNum}>{String(val).padStart(2, '0')}</Text>
            <TouchableOpacity onPress={() => set(v => Math.max(min, v - step))} style={ss.pickerBtn}>
              <Text style={ss.pickerBtnTxt}>−</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <TronDivider />

      {totalSec >= 900 && (
        <>
          <View style={ss.previewBlock}>
            {alreadyToday
              ? <Text style={ss.previewMuted}>TRAINING MODE — {M.xp} ALREADY EARNED TODAY</Text>
              : <>
                  <Label>{night ? 'NIGHT RATE — AFTER 9PM' : `${M.xp} REWARD`}</Label>
                  <View style={ss.previewRow}>
                    <Text style={ss.previewNum}>+{preview.xp}</Text>
                    <Text style={ss.previewUnit}>{M.xp}</Text>
                  </View>
                </>
            }
          </View>
          <TronDivider />
        </>
      )}

      <View style={ss.breakCostRow}>
        <Text style={ss.breakCostLabel}>{M.breakName} COST</Text>
        <Text style={ss.breakCostVal}>₹200  OR  21,000 {M.xp}</Text>
      </View>
      <TronDivider />

      <View style={{ padding: 20 }}>
        <TronButton label={M.enter} onPress={handleStart} disabled={totalSec < 900} />
        {totalSec < 900 && <Text style={ss.minNote}>MINIMUM SESSION: 15 MINUTES</Text>}
      </View>
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: C.bg },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, paddingHorizontal: 20 },
  back:          { fontFamily: F.orb, fontSize: 8, color: C.muted, letterSpacing: 1.5 },
  title:         { fontFamily: F.orb, fontSize: 26, fontWeight: '900', color: C.text, letterSpacing: 2, marginBottom: 6 },
  sub:           { fontFamily: F.mono, fontSize: 10, color: C.muted, letterSpacing: 1 },
  pickerRow:     { flexDirection: 'row' },
  pickerCol:     { flex: 1, alignItems: 'center', paddingVertical: 28, gap: 16 },
  pickerColBorder: { borderRightWidth: 1, borderRightColor: C.border },
  pickerBtn:     { width: 44, height: 44, borderWidth: 1, borderColor: C.border, backgroundColor: C.dim, alignItems: 'center', justifyContent: 'center' },
  pickerBtnTxt:  { fontFamily: F.orb, fontSize: 20, color: C.text },
  pickerNum:     { fontFamily: F.mono, fontSize: 60, fontWeight: '400', color: C.amber, lineHeight: 64 },
  previewBlock:  { padding: 20 },
  previewMuted:  { fontFamily: F.orb, fontSize: 8, color: C.muted, letterSpacing: 1.2 },
  previewRow:    { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 8 },
  previewNum:    { fontFamily: F.orb, fontSize: 44, fontWeight: '900', color: C.amber, lineHeight: 48 },
  previewUnit:   { fontFamily: F.orb, fontSize: 14, color: C.muted },
  breakCostRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingHorizontal: 20 },
  breakCostLabel: { fontFamily: F.orb, fontSize: 8, color: C.muted, letterSpacing: 1.2 },
  breakCostVal:  { fontFamily: F.orb, fontSize: 9, color: C.red, fontWeight: '700', letterSpacing: 1 },
  minNote:       { fontFamily: F.orb, fontSize: 8, color: C.muted, textAlign: 'center', marginTop: 8, letterSpacing: 1 },
});

export default SetDurationScreen;
