import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useI18n } from '../i18n';
import { colors, radii, shadows } from '../theme/designSystem';
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
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <PaperTabBar {...props} />}
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

// Fully custom tab bar so we can render the warm-cream paper container and
// the rounded "card" highlight on the active tab (matching the web `.bottom-
// nav button.is-active` style). React Navigation's standard `tabBarStyle`
// can't deliver the rounded-pill active background on its own.
function PaperTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label = options.title ?? route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          const iconName = ICONS[route.name] ?? 'circle';
          const color = focused ? colors.tabActiveText : colors.tabInactiveText;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed }) => [
                styles.item,
                focused && styles.itemActive,
                pressed && styles.itemPressed,
              ]}
            >
              <Feather
                name={iconName}
                size={20}
                color={color}
                style={focused ? styles.iconActive : null}
              />
              <Text
                style={[styles.label, focused && styles.labelActive]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: colors.tabBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 250, 240, 0.62)',
    paddingTop: 6,
    paddingHorizontal: 6,
    ...shadows.tabBar,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  item: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 6,
    paddingHorizontal: 2,
    marginHorizontal: 2,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: 'transparent',
  },
  itemActive: {
    backgroundColor: colors.tabActiveBg,
    borderWidth: 1,
    borderColor: 'rgba(88, 98, 68, 0.10)',
  },
  itemPressed: {
    opacity: 0.7,
  },
  iconActive: {
    transform: [{ translateY: -1 }, { scale: 1.05 }],
  },
  label: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.tabInactiveText,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: colors.tabActiveText,
    fontWeight: '800',
  },
});
