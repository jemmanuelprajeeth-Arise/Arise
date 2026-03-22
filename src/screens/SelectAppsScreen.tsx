/**
 * SelectAppsScreen.tsx — Tron Amber Theme
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getInstalledApps, InstalledApp } from '../services/BlockerService';
import { useAriseStore } from '../store/useAriseStore';
import { C, F } from '../theme/tron';
import { TronDivider, Label, TronButton, CornerBrackets } from '../components/TronUI';

const MAX = 5;

export default function SelectAppsScreen() {
  const navigation = useNavigation<any>();
  const mode = useAriseStore(s => s.mode);
  const M = mode === 'hunter' ? { session: 'DUNGEON' } : { session: 'FOCUS BLOCK' };

  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInstalledApps()
      .then(list => setApps([...list].sort((a, b) => {
        if (a.isAllowed !== b.isAllowed) return a.isAllowed ? -1 : 1;
        if (a.isBlocked !== b.isBlocked) return a.isBlocked ? 1 : -1;
        return a.appName.localeCompare(b.appName);
      })))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (pkg: string) => {
    if (selected.includes(pkg)) setSelected(s => s.filter(p => p !== pkg));
    else if (selected.length < MAX) setSelected(s => [...s, pkg]);
  };

  const renderItem = ({ item }: { item: InstalledApp }) => {
    const isSel = selected.includes(item.packageName);
    const isFull = selected.length >= MAX && !isSel;
    const locked = item.isBlocked || item.isAllowed;
    return (
      <TouchableOpacity
        style={[styles.row, isSel && styles.rowSel, (locked || isFull) && styles.rowDim]}
        onPress={() => !locked && !isFull && toggle(item.packageName)}
        disabled={locked}
        activeOpacity={0.75}
      >
        <View style={[styles.checkBox, isSel && styles.checkBoxSel, item.isAllowed && styles.checkBoxAlways]}>
          {(isSel || item.isAllowed) && <Text style={styles.checkMark}>✓</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.appName, (locked && !item.isAllowed) && { color: C.ghost }]}>
            {item.appName}
          </Text>
          {item.isBlocked && <Text style={styles.blockedTag}>🚫  BLOCKED — ADDICTIVE CONTENT</Text>}
          {item.isAllowed && <Text style={styles.allowedTag}>✓  ALWAYS ACTIVE</Text>}
        </View>
        {item.isBlocked && <Text style={styles.lockIcon}>🔒</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← BACK</Text>
        </TouchableOpacity>
        <View style={[styles.counter, selected.length >= MAX && styles.counterFull]}>
          <Text style={[styles.counterText, selected.length >= MAX && { color: C.amber }]}>
            {selected.length} / {MAX}
          </Text>
        </View>
      </View>
      <TronDivider />

      <View style={styles.titleBlock}>
        <Label>ACTIVE NODE SELECTION</Label>
        <Text style={styles.title}>ALLOWED APPS</Text>
        <Text style={styles.sub}>
          Select up to {MAX} apps that stay active during your {M.session}.{'\n'}
          Phone calls are always permitted.
        </Text>
      </View>
      <TronDivider />

      {loading
        ? <ActivityIndicator style={{ marginTop: 60 }} color={C.amber} size="large" />
        : <FlatList
            data={apps}
            keyExtractor={i => i.packageName}
            renderItem={renderItem}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
          />
      }

      <TronDivider />
      <View style={styles.footer}>
        <TronButton
          label="CONTINUE →"
          onPress={() => navigation.navigate('SetDuration', { selectedApps: selected })}
          disabled={selected.length === 0}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: C.bg },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, paddingHorizontal: 20 },
  back:         { fontFamily: F.orb, fontSize: 8, color: C.muted, letterSpacing: 1.5 },
  counter:      { borderWidth: 1, borderColor: C.border, paddingHorizontal: 10, paddingVertical: 4 },
  counterFull:  { borderColor: C.amber, backgroundColor: C.amberFF },
  counterText:  { fontFamily: F.orb, fontSize: 9, color: C.muted, letterSpacing: 1.2 },
  titleBlock:   { padding: 20, paddingBottom: 16 },
  title:        { fontFamily: F.orb, fontSize: 26, fontWeight: '900', color: C.text, letterSpacing: 2, marginTop: 8, marginBottom: 6 },
  sub:          { fontFamily: F.mono, fontSize: 10, color: C.muted, lineHeight: 16 },
  row:          { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.dim, padding: 14, marginBottom: 6 },
  rowSel:       { borderColor: C.amber, backgroundColor: C.amberFF },
  rowDim:       { opacity: 0.35 },
  checkBox:     { width: 20, height: 20, borderWidth: 1.5, borderColor: C.faint, alignItems: 'center', justifyContent: 'center' },
  checkBoxSel:  { backgroundColor: C.amber, borderColor: C.amber },
  checkBoxAlways: { backgroundColor: C.green, borderColor: C.green },
  checkMark:    { fontSize: 10, color: C.bg, fontWeight: '700' },
  appName:      { fontFamily: F.orb, fontSize: 11, fontWeight: '600', color: C.text, letterSpacing: 0.5 },
  blockedTag:   { fontFamily: F.orb, fontSize: 7, color: C.red, letterSpacing: 1, marginTop: 3 },
  allowedTag:   { fontFamily: F.orb, fontSize: 7, color: C.green, letterSpacing: 1, marginTop: 3 },
  lockIcon:     { fontSize: 14, opacity: 0.4 },
  footer:       { padding: 20 },
});
