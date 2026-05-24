import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useI18n } from '../i18n';
import { colors } from '../theme/colors';
import HomeScreen from '../screens/HomeScreen';
import MemoryWallScreen from '../screens/MemoryWallScreen';
import LettersScreen from '../screens/LettersScreen';
import CalendarScreen from '../screens/CalendarScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const ICONS = {
  Home: 'home',
  Wall: 'image',
  Letters: 'mail',
  Calendar: 'calendar',
  Settings: 'settings',
};

export default function MainTabs() {
  const { t } = useI18n();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accentDark,
        tabBarInactiveTintColor: colors.textSoft,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.divider,
          borderTopWidth: 1,
          height: 64,
          paddingTop: 6,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          letterSpacing: 0.5,
        },
        tabBarIcon: ({ color, size }) => (
          <Feather name={ICONS[route.name] ?? 'circle'} size={size - 2} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('tab.home') }} />
      <Tab.Screen name="Wall" component={MemoryWallScreen} options={{ title: t('tab.wall') }} />
      <Tab.Screen name="Letters" component={LettersScreen} options={{ title: t('tab.letters') }} />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ title: t('tab.calendar') }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t('tab.settings') }}
      />
    </Tab.Navigator>
  );
}
