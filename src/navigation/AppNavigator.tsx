/**
 * src/navigation/AppNavigator.tsx
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAriseStore } from '../store/useAriseStore';

import OnboardingScreen      from '../screens/OnboardingScreen';
import PermissionSetupScreen from '../screens/PermissionSetupScreen';
import HomeScreen            from '../screens/HomeScreen';
import SelectAppsScreen      from '../screens/SelectAppsScreen';
import { SetDurationScreen } from '../screens/SetDurationScreen';
import ActiveSessionScreen   from '../screens/ActiveSessionScreen';
import { DungeonBreakScreen, CompleteScreen } from '../screens/DungeonBreakScreen';

export type RootStackParamList = {
  Onboarding:      undefined;
  PermissionSetup: undefined;
  Home:            undefined;
  SelectApps:      undefined;
  SetDuration:     { selectedApps: string[] };
  ActiveSession:   { durationSec: number; allowedPackages: string[]; endTime: number };
  DungeonBreak:    { elapsedSec: number; sessionTotal: number };
  Complete:        { durationSec: number; xpEarned: number; breakUsed: boolean };
  Stats:           undefined;
  XPStore:         undefined;
  Settings:        undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const hasOnboarded = useAriseStore(s => s.hasOnboarded);
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: '#050402' } }}
        initialRouteName={hasOnboarded ? 'Home' : 'Onboarding'}
      >
        <Stack.Screen name="Onboarding"      component={OnboardingScreen} />
        <Stack.Screen name="PermissionSetup" component={PermissionSetupScreen} />
        <Stack.Screen name="Home"            component={HomeScreen} />
        <Stack.Screen name="SelectApps"      component={SelectAppsScreen} />
        <Stack.Screen name="SetDuration"     component={SetDurationScreen} />
        <Stack.Screen name="ActiveSession"   component={ActiveSessionScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="DungeonBreak"    component={DungeonBreakScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="Complete"        component={CompleteScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
