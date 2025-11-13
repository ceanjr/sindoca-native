import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';

function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.tabBarContainer}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={80} tint="light" style={styles.tabBar}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel ?? options.title ?? route.name;
            const isFocused = state.index === index;

            const onPress = () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            // Ícones para cada tab
            const icons: Record<string, any> = {
              index: 'home',
              galeria: 'images',
              razoes: 'heart',
              musica: 'musical-notes',
              menu: 'ellipsis-horizontal',
            };

            const iconName = icons[route.name] || 'circle';

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                style={styles.tab}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconContainer,
                    isFocused && styles.iconContainerActive,
                  ]}
                >
                  <Ionicons
                    name={iconName}
                    size={22}
                    color={isFocused ? Colors.primary : Colors.textSecondary}
                  />
                </View>
                <Text
                  style={[styles.label, isFocused && styles.labelActive]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </BlurView>
      ) : (
        <View style={[styles.tabBar, styles.tabBarAndroid]}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel ?? options.title ?? route.name;
            const isFocused = state.index === index;

            const onPress = () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const icons: Record<string, any> = {
              index: 'home',
              galeria: 'images',
              razoes: 'heart',
              musica: 'musical-notes',
              menu: 'ellipsis-horizontal',
            };

            const iconName = icons[route.name] || 'circle';

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                style={styles.tab}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconContainer,
                    isFocused && styles.iconContainerActive,
                  ]}
                >
                  <Ionicons
                    name={iconName}
                    size={22}
                    color={isFocused ? Colors.primary : Colors.textSecondary}
                  />
                </View>
                <Text
                  style={[styles.label, isFocused && styles.labelActive]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
        }}
      />
      <Tabs.Screen
        name="galeria"
        options={{
          title: 'Galeria',
        }}
      />
      <Tabs.Screen
        name="razoes"
        options={{
          title: 'Razões',
        }}
      />
      <Tabs.Screen
        name="musica"
        options={{
          title: 'Música',
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 24,
    marginHorizontal: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  tabBarAndroid: {
    backgroundColor: `${Colors.white}F5`, // 95% opacity
    borderWidth: 1,
    borderColor: `${Colors.border}50`,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  iconContainerActive: {
    backgroundColor: `${Colors.primary}15`,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
