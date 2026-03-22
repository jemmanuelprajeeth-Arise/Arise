/**
 * PermissionSetupScreen.tsx
 *
 * First screen after onboarding. Walks the user through granting
 * the 3 Android permissions required for blocking to work.
 * Cannot skip — all permissions are required.
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, AppState, AppStateStatus,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  checkAllPermissions,
  requestUsageStatsPermission,
  requestOverlayPermission,
  requestAccessibilityPermission,
  PermissionStatus,
} from '../services/BlockerService';

const T = {
  bg:      '#F8F7F4',
  surface: '#FFFFFF',
  border:  '#E8E6E1',
  text:    '#111111',
  muted:   '#888888',
  faint:   '#CCCCCC',
  accent:  '#D4580A',
  accentL: '#FDF0E8',
  danger:  '#B83232',
  success: '#1A7A4A',
  successL:'#F0FAF4',
};

interface Permission {
  key:     keyof Omit<PermissionStatus, 'allGranted'>;
  title:   string;
  desc:    string;
  why:     string;
  action:  () => void;
}

export default function PermissionSetupScreen() {
  const navigation = useNavigation<any>();
  const [status, setStatus] = useState<PermissionStatus>({
    usageStats: false, overlay: false, accessibility: false, allGranted: false,
  });

  const permissions: Permission[] = [
    {
      key:    'usageStats',
      title:  'Usage Access',
      desc:   'Lets Arise detect which app is in the foreground.',
      why:    'Without this, Arise cannot know when you open a blocked app.',
      action: requestUsageStatsPermission,
    },
    {
      key:    'overlay',
      title:  'Draw Over Other Apps',
      desc:   'Lets Arise show the block screen over other apps.',
      why:    'Without this, Arise cannot cover blocked apps with the wall screen.',
      action: requestOverlayPermission,
    },
    {
      key:    'accessibility',
      title:  'Accessibility Service (Optional)',
      desc:   'Extra layer of protection as a fallback blocker.',
      why:    'Highly recommended but not strictly required. Improves reliability.',
      action: requestAccessibilityPermission,
    },
  ];

  const refresh = useCallback(async () => {
    const s = await checkAllPermissions();
    setStatus(s);
    if (s.usageStats && s.overlay) {
      // Minimum required — proceed
    }
  }, []);

  // Re-check every time user comes back from settings
  useFocusEffect(useCallback(() => {
    refresh();
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]));

  const canProceed = status.usageStats && status.overlay;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: T.bg }} contentContainerStyle={{ paddingBottom: 40 }}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.label}>Setup required</Text>
        <Text style={styles.title}>Grant Permissions</Text>
        <Text style={styles.subtitle}>
          Arise needs system permissions to actually block apps.
          These are the same permissions used by parental control apps.
        </Text>
      </View>

      <View style={styles.divider}/>

      {/* Permission cards */}
      <View style={{ padding: 24 }}>
        {permissions.map((perm, i) => {
          const granted = status[perm.key];
          const isOptional = perm.key === 'accessibility';
          return (
            <View key={perm.key} style={[
              styles.card,
              granted && { borderColor: T.success },
            ]}>
              {/* Status + title row */}
              <View style={styles.cardRow}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: granted ? T.success : T.faint },
                ]}/>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>
                    {perm.title}
                    {isOptional && (
                      <Text style={{ fontSize: 12, color: T.muted }}> — optional</Text>
                    )}
                  </Text>
                  <Text style={styles.cardDesc}>{perm.desc}</Text>
                </View>
                {granted && <Text style={{ fontSize: 18 }}>✓</Text>}
              </View>

              {/* Why needed */}
              {!granted && (
                <Text style={styles.cardWhy}>{perm.why}</Text>
              )}

              {/* Grant button */}
              {!granted && (
                <TouchableOpacity
                  style={[styles.grantBtn, isOptional && styles.grantBtnOutline]}
                  onPress={perm.action}
                >
                  <Text style={[
                    styles.grantBtnText,
                    isOptional && { color: T.muted },
                  ]}>
                    {isOptional ? 'Enable (Recommended)' : 'Grant Permission →'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.divider}/>

      {/* Privacy note */}
      <View style={{ padding: 24 }}>
        <Text style={styles.privacyTitle}>Your privacy is protected</Text>
        <Text style={styles.privacyText}>
          Arise only uses these permissions during active sessions.
          No app usage data is ever uploaded to our servers.
          Everything stays on your device.
        </Text>
      </View>

      <View style={styles.divider}/>

      {/* Continue button */}
      <View style={{ padding: 24 }}>
        <TouchableOpacity
          style={[styles.continueBtn, !canProceed && styles.continueBtnDisabled]}
          disabled={!canProceed}
          onPress={() => navigation.replace('Home')}
        >
          <Text style={styles.continueBtnText}>
            {canProceed ? 'Continue to Arise →' : 'Grant required permissions to continue'}
          </Text>
        </TouchableOpacity>

        {!canProceed && (
          <Text style={styles.requiredNote}>
            Usage Access and Draw Over Apps are required. Accessibility is optional.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 32,
    paddingTop: 52,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: T.muted,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: T.text,
    lineHeight: 38,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: T.muted,
    lineHeight: 22,
    fontWeight: '300',
  },
  divider: {
    height: 1,
    backgroundColor: T.border,
  },
  card: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: T.text,
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 13,
    color: T.muted,
    lineHeight: 18,
    fontWeight: '300',
  },
  cardWhy: {
    fontSize: 12,
    color: T.accent,
    lineHeight: 17,
    marginBottom: 12,
    fontWeight: '300',
    paddingLeft: 22,
  },
  grantBtn: {
    backgroundColor: T.text,
    padding: 13,
    borderRadius: 8,
    alignItems: 'center',
  },
  grantBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: T.border,
  },
  grantBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  privacyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: T.text,
    marginBottom: 6,
  },
  privacyText: {
    fontSize: 13,
    color: T.muted,
    lineHeight: 20,
    fontWeight: '300',
  },
  continueBtn: {
    backgroundColor: T.text,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueBtnDisabled: {
    backgroundColor: T.faint,
  },
  continueBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  requiredNote: {
    fontSize: 12,
    color: T.muted,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 18,
  },
});
