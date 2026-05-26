import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemorials } from '../state/MemorialContext';
import MainTabs from './MainTabs';
import MemorialSelectionScreen from '../screens/MemorialSelectionScreen';
import MemorialCreationScreen from '../screens/MemorialCreationScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { activeMemorial } = useMemorials();

  return (
    <Stack.Navigator
      initialRouteName={activeMemorial ? 'Main' : 'MemorialSelection'}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#f5eddf' },
      }}
    >
      <Stack.Screen name="MemorialSelection" component={MemorialSelectionScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen
        name="MemorialCreation"
        component={MemorialCreationScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
