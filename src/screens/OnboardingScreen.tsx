/**
 * OnboardingScreen.tsx — Tron Amber Theme
 * 3-step flow: mode select → how it works → commitment
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAriseStore, AppMode } from '../store/useAriseStore';
import { C, F } from '../theme/tron';
import { CornerBrackets, TronDivider, Label, TronButton } from '../components/TronUI';

type Step = 0 | 1 | 2;

const MODES = [
  {
    key: 'hunter' as AppMode,
    name: 'HUNTER MODE',
    icon: '⚔',
    target: 'GAMERS · STUDENTS',
    desc: 'Dungeons. XP. Dungeon Breaks. Every session is a boss fight against your distractions.',
    vocab: ['DUNGEON', 'XP', 'DUNGEON BREAK', 'STREAK'],
    accentColor: C.amber,
  },
  {
    key: 'focus' as AppMode,
    name: 'FOCUS MODE',
    icon: '◈',
    target: 'PROFESSIONALS · PARENTS',
    desc: 'Focus Blocks. Credits. Emergency Override. Clean, professional language.',
    vocab: ['FOCUS BLOCK', 'CREDITS', 'OVERRIDE', 'CONSISTENCY'],
    accentColor: C.amberB,
  },
];

const HOW_IT_WORKS = [
  { icon: '🔒', title: 'LOCK YOUR PHONE', desc: 'Set a duration up to 5 hours. Choose up to 5 apps to keep active. Everything else is blocked.' },
  { icon: '⚡', title: 'DUNGEON BREAK COSTS ₹200', desc: 'The only way out early. A 5-minute reflection timer follows. Pay ₹50 to skip it. No free exits.' },
  { icon: '⭐', title: 'EARN XP / CREDITS', desc: 'Complete sessions to earn currency. Accumulate 21,000 XP for a free exit next time.' },
  { icon: '🔥', title: 'BUILD YOUR STREAK', desc: 'Complete a session daily for 21 days. Miss one → lose 4,000 XP. Hit 21 → bonus 2,000 XP.' },
];

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const setOnboarded = useAriseStore(s => s.setOnboarded);
  const [step, setStep] = useState<Step>(0);
  const [selected, setSelected] = useState<AppMode | null>(null);

  const handleComplete = () => {
    if (!selected) return;
    setOnboarded(selected);
    navigation.replace('PermissionSetup');
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* Progress bar */}
      <View style={styles.progressRow}>
        {[0, 1, 2].map(i => (
          <View key={i} style={[styles.progressSeg, step >= i && styles.progressSegActive]} />
        ))}
      </View>

      {/* ── STEP 0: Mode Select ── */}
      {step === 0 && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerBlock}>
            <Label>SYSTEM BOOT — SELECT MODE</Label>
            <Text style={styles.heroTitle}>ARISE</Text>
            <Text style={styles.heroSub}>CHOOSE YOUR EXPERIENCE</Text>
            <TronDivider style={{ marginTop: 16 }} />
          </View>

          {MODES.map(opt => {
            const sel = selected === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.modeCard, sel && styles.modeCardSelected]}
                onPress={() => setSelected(opt.key)}
                activeOpacity={0.8}
              >
                {sel && <CornerBrackets size={10} />}
                <View style={styles.modeCardHeader}>
                  <View>
                    <Text style={[styles.modeName, sel && { color: C.amber }]}>{opt.name}</Text>
                    <Text style={styles.modeTarget}>{opt.target}</Text>
                  </View>
                  <Text style={[styles.modeIcon, { opacity: sel ? 1 : 0.35 }]}>{opt.icon}</Text>
                </View>
                <Text style={styles.modeDesc}>{opt.desc}</Text>
                <View style={styles.vocabRow}>
                  {opt.vocab.map(v => (
                    <View key={v} style={[styles.vocabChip, sel && styles.vocabChipActive]}>
                      <Text style={[styles.vocabText, sel && { color: C.amber }]}>{v}</Text>
                    </View>
                  ))}
                </View>
                {sel && (
                  <View style={styles.selectedRow}>
                    <View style={styles.selectedDot} />
                    <Text style={styles.selectedText}>SELECTED</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          <View style={{ marginTop: 8, marginBottom: 24 }}>
            <TronButton label="CONTINUE →" onPress={() => setStep(1)} disabled={!selected} />
            <Text style={styles.switchNote}>SWITCH MODES ANYTIME IN SETTINGS</Text>
          </View>
        </ScrollView>
      )}

      {/* ── STEP 1: How It Works ── */}
      {step === 1 && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerBlock}>
            <Label>HOW ARISE WORKS</Label>
            <Text style={[styles.heroTitle, { fontSize: 26 }]}>SIMPLE.{'\n'}
              <Text style={{ color: C.amber }}>STRICT.</Text>
            </Text>
            <TronDivider style={{ marginTop: 16 }} />
          </View>

          {HOW_IT_WORKS.map((item, i) => (
            <View key={i} style={styles.howCard}>
              <View style={styles.howRow}>
                <View style={styles.howIconBox}>
                  <Text style={styles.howIconNum}>0{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.howTitle}>{item.title}</Text>
                  <Text style={styles.howDesc}>{item.desc}</Text>
                </View>
              </View>
            </View>
          ))}

          <View style={{ marginTop: 8, marginBottom: 24, gap: 8 }}>
            <TronButton label="UNDERSTOOD →" onPress={() => setStep(2)} />
            <TronButton label="← BACK" onPress={() => setStep(0)} variant="ghost" />
          </View>
        </ScrollView>
      )}

      {/* ── STEP 2: Commitment ── */}
      {step === 2 && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerBlock}>
            <Label>PROTOCOL AGREEMENT</Label>
            <Text style={[styles.heroTitle, { fontSize: 26, lineHeight: 32 }]}>
              THIS APP IS{'\n'}
              <Text style={{ color: C.amber, fontStyle: 'italic' }}>NOT GENTLE.</Text>
            </Text>
            <Text style={styles.commitSub}>
              No free exits. No mercy mode. The ₹200 cost is real and intentional —
              because the only way this works is if leaving costs you something.
            </Text>
            <TronDivider style={{ marginTop: 16 }} />
          </View>

          <Label style={{ marginBottom: 12 }}>YOU ARE AGREEING TO</Label>
          {[
            'Lock your phone for the full session duration',
            'Pay ₹200 to exit early — no exceptions',
            'Lose 4,000 XP if you miss a streak day',
            'Complete 21 days for +2,000 bonus XP',
          ].map((t, i) => (
            <View key={i} style={styles.commitItem}>
              <View style={styles.commitNum}>
                <Text style={styles.commitNumText}>0{i + 1}</Text>
              </View>
              <Text style={styles.commitText}>{t}</Text>
            </View>
          ))}

          <View style={{ marginTop: 20, marginBottom: 24, gap: 8, position: 'relative' }}>
            <CornerBrackets size={10} />
            <TronButton
              label={`I'M READY — INITIALIZE ${selected === 'hunter' ? '⚔' : '◈'}`}
              onPress={handleComplete}
            />
            <TronButton label="← BACK" onPress={() => setStep(1)} variant="ghost" />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen:            { flex: 1, backgroundColor: C.bg },
  progressRow:       { flexDirection: 'row', gap: 4, padding: '16px 24px 0', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 0 },
  progressSeg:       { flex: 1, height: 2, backgroundColor: C.faint },
  progressSegActive: { backgroundColor: C.amber },
  scrollContent:     { paddingHorizontal: 20, paddingTop: 0, paddingBottom: 0 },
  headerBlock:       { paddingTop: 24, paddingBottom: 4 },
  heroTitle:         { fontFamily: F.orb, fontSize: 36, fontWeight: '900', color: C.text, letterSpacing: 2, lineHeight: 40, marginTop: 10, marginBottom: 4 },
  heroSub:           { fontFamily: F.mono, fontSize: 10, color: C.muted, letterSpacing: 2, marginTop: 4 },
  modeCard:          { borderWidth: 1, borderColor: C.border, backgroundColor: C.dim, padding: 14, marginTop: 12, position: 'relative' },
  modeCardSelected:  { borderColor: C.amber, backgroundColor: C.amberFF },
  modeCardHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  modeName:          { fontFamily: F.orb, fontSize: 11, fontWeight: '700', color: C.text, letterSpacing: 1.5, marginBottom: 2 },
  modeTarget:        { fontFamily: F.orb, fontSize: 7, color: C.muted, letterSpacing: 1.5 },
  modeIcon:          { fontSize: 22, color: C.amber },
  modeDesc:          { fontFamily: F.mono, fontSize: 10, color: C.muted, lineHeight: 16, marginBottom: 10 },
  vocabRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  vocabChip:         { borderWidth: 1, borderColor: C.faint, paddingHorizontal: 6, paddingVertical: 2 },
  vocabChipActive:   { borderColor: C.amber },
  vocabText:         { fontFamily: F.orb, fontSize: 7, letterSpacing: 1, color: C.faint, textTransform: 'uppercase' },
  selectedRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  selectedDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: C.amber },
  selectedText:      { fontFamily: F.orb, fontSize: 7, color: C.amber, letterSpacing: 1.5 },
  switchNote:        { fontFamily: F.orb, fontSize: 7, color: C.ghost, textAlign: 'center', marginTop: 10, letterSpacing: 1.2 },
  howCard:           { borderWidth: 1, borderColor: C.border, backgroundColor: C.dim, padding: 12, marginTop: 10 },
  howRow:            { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  howIconBox:        { width: 32, height: 32, borderWidth: 1, borderColor: C.amber, backgroundColor: C.amberFF, alignItems: 'center', justifyContent: 'center' },
  howIconNum:        { fontFamily: F.orb, fontSize: 11, fontWeight: '700', color: C.amber },
  howTitle:          { fontFamily: F.orb, fontSize: 10, fontWeight: '700', color: C.text, letterSpacing: 1.2, marginBottom: 4 },
  howDesc:           { fontFamily: F.mono, fontSize: 10, color: C.muted, lineHeight: 16 },
  commitSub:         { fontFamily: F.mono, fontSize: 11, color: C.muted, lineHeight: 18, marginTop: 10 },
  commitItem:        { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.dim, padding: 12, marginBottom: 8 },
  commitNum:         { width: 24, height: 24, borderWidth: 1, borderColor: C.amber, backgroundColor: C.amberFF, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  commitNumText:     { fontFamily: F.orb, fontSize: 9, fontWeight: '700', color: C.amber },
  commitText:        { fontFamily: F.mono, fontSize: 11, color: C.muted, lineHeight: 16, flex: 1 },
});
