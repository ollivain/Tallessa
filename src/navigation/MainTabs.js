import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useI18n } from '../i18n';
import { colors, radii, shadows, typography } from '../theme/designSystem';
import { useTheme } from '../state/ThemeContext';
import HomeScreen from '../screens/HomeScreen';
import MemoryWallScreen from '../screens/MemoryWallScreen';
import LettersScreen from '../screens/LettersScreen';
import CalendarScreen from '../screens/CalendarScreen';
import MemorialDayScreen from '../screens/MemorialDayScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

// PWA bottom nav icons (in order): home, heart(wall/memories), mail, calendar, settings
const ICONS = {
  Home: 'home',
  Wall: 'heart',
  Letters: 'mail',
  Calendar: 'calendar',
  Settings: 'settings',
};

export default function MainTabs() {
  const { t } = useI18n();

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, tabBarStyle: { position: 'absolute' } }}
      tabBar={(props) => <PaperTabBar {...props} />}
    >
      <Tab.Screen name="Home"     component={HomeScreen}      options={{ title: t('tab.home') }} />
      <Tab.Screen name="Wall"     component={MemoryWallScreen} options={{ title: t('tab.wall') }} />
      <Tab.Screen name="Letters"  component={LettersScreen}   options={{ title: t('tab.letters') }} />
      <Tab.Screen name="Calendar" component={CalendarScreen}  options={{ title: t('tab.calendar') }} />
      <Tab.Screen name="Memorial" component={MemorialDayScreen} options={{ title: t('tab.memorial'), tabBarHidden: true }} />
      <Tab.Screen name="Settings" component={SettingsScreen}  options={{ title: t('tab.settings') }} />
    </Tab.Navigator>
  );
}

// Fully custom tab bar with warm-cream paper container and rounded active tab.
function PaperTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { themeColors } = useTheme();
  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 7) }]}>
      <View style={styles.row}>
        {state.routes
          .filter((route) => !descriptors[route.key].options.tabBarHidden)
          .map((route) => {
          const index = state.routes.indexOf(route);
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
          const color = focused ? themeColors.tabActiveText : colors.tabInactiveText;

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
                focused && [styles.itemActive, { backgroundColor: themeColors.tabActiveBg }],
                pressed && styles.itemPressed,
              ]}
            >
              <Feather
                name={iconName}
                size={24}
                color={color}
                style={focused ? styles.iconActive : null}
              />
              <Text
                style={[styles.label, focused && [styles.labelActive, { color: themeColors.tabActiveText }]]}
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

// All numeric values mirror PWA .bottom-nav rules in styles.css:
//   .bottom-nav        → padding 6 6 max(7,safe-bottom), border-radius 24 24 0 0,
//                        background rgba(255,250,240,0.78), max-width 452,
//                        margin 0 auto, box-shadow 0 -8px 26px rgba(55,48,35,.08)
//   .bottom-nav button → min-height 44, border-radius 15, font-size 0.68rem,
//                        font-weight 650 → '600' (RN parity approximation)
//   .is-active         → background rgba(88,98,68,0.10), inset 0 0 0 1px hairline,
//                        font-weight 800, icon scale 1.06
const styles = StyleSheet.create({
  outer: {
    position:            'absolute',
    bottom:              0,
    left:                0,
    right:               0,
    backgroundColor:     colors.tabBg,
    borderTopLeftRadius:  radii.card,   // PWA 24px
    borderTopRightRadius: radii.card,
    borderTopWidth:      1,
    borderTopColor:      colors.tabBorderTop,
    paddingTop:          6,
    paddingHorizontal:   6,
    // PWA `.bottom-nav { max-width: 452px; margin: 0 auto }`
    maxWidth:            452,
    alignSelf:           'center',
    width:               '100%',
    ...shadows.tabBar,
  },
  row: {
    flexDirection:  'row',
    alignItems:     'stretch',
    justifyContent: 'space-between',
  },
  item: {
    flex:              1,
    minHeight:         44,
    paddingVertical:   5,
    paddingHorizontal: 2,
    marginHorizontal:  1,
    borderRadius:      radii.navItem,   // PWA 15px
    alignItems:        'center',
    justifyContent:    'center',
    gap:               2,
    backgroundColor:   'transparent',
  },
  itemActive: {
    backgroundColor: colors.tabActiveBg,
    // PWA `box-shadow: inset 0 0 0 1px rgba(88,98,68,0.08)` approximated
    // with a hairline border on the active tab.
    borderWidth:     1,
    borderColor:     colors.hairline,
  },
  itemPressed: {
    opacity: 0.7,
  },
  // PWA `.bottom-nav button.is-active .nav-icon { transform: translateY(-1px) scale(1.06) }`
  iconActive: {
    transform: [{ translateY: -1 }, { scale: 1.05 }],
  },
  label: {
    fontSize:      typography.sizes.navLabel,
    // PWA font-weight 650 → '600' as RN parity approximation
    fontWeight:    typography.weights.semibold,
    color:         colors.tabInactiveText,
    letterSpacing: 0,
    lineHeight:    13,
  },
  labelActive: {
    color:      colors.tabActiveText,
    fontWeight: typography.weights.heavy,
  },
});
