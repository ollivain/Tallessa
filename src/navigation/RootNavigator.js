import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemorials } from '../state/MemorialContext';
import { colors } from '../theme/designSystem';
import MainTabs from './MainTabs';
import MemorialSelectionScreen from '../screens/MemorialSelectionScreen';
import MemorialCreationScreen from '../screens/MemorialCreationScreen';

const Stack = createNativeStackNavigator();

// PWA parity: the PWA renders every screen full-bleed against the same cream
// background (--cream / #f2e8d7). Earlier the RN stack used iOS's native
// modal presentation for MemorialCreation, which framed it as a sheet with
// a rounded top edge — visually it looked like the *whole app* sat inside a
// big card. Switching every route to `card` presentation, and matching the
// stack's content background to the PWA cream, removes that wrapper effect.
export default function RootNavigator() {
  const { activeMemorial } = useMemorials();

  return (
    <Stack.Navigator
      initialRouteName={activeMemorial ? 'Main' : 'MemorialSelection'}
      screenOptions={{
        headerShown: false,
        // PWA cream — same colour as designSystem.colors.background so the
        // edges of every screen blend into one continuous surface.
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="MemorialSelection" component={MemorialSelectionScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen
        name="MemorialCreation"
        component={MemorialCreationScreen}
        // No `presentation: 'modal'` here on purpose: native modal
        // presentation gives the screen an iOS sheet look with rounded top
        // corners, which made the entire app feel like a card. The default
        // `card` presentation slides the screen in full-bleed.
      />
    </Stack.Navigator>
  );
}
