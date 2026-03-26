import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons, FontAwesome6 } from '@expo/vector-icons';

const TAB_META: Record<string, { label: string; iconSet: 'ion' | 'mc' | 'fa'; icon: string; activeIcon?: string }> = {
  index: { label: 'Home', iconSet: 'ion', icon: 'home-outline', activeIcon: 'home' },
  challenges: { label: 'Tasks', iconSet: 'mc', icon: 'target-variant', activeIcon: 'target' },
  stable: { label: 'Stable', iconSet: 'mc', icon: 'horse', activeIcon: 'horse-variant' },
  market: { label: 'Market', iconSet: 'ion', icon: 'storefront-outline', activeIcon: 'storefront' },
  history: { label: 'History', iconSet: 'fa', icon: 'chart-column', activeIcon: 'medal' },
};

function TabIcon({
  iconSet,
  icon,
  active,
}: {
  iconSet: 'ion' | 'mc' | 'fa';
  icon: string;
  active: boolean;
}) {
  const color = active ? '#f7c948' : '#8090a7';
  const size = active ? 23 : 20;

  if (iconSet === 'mc') {
    return <MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={size} color={color} />;
  }
  if (iconSet === 'fa') {
    return <FontAwesome6 name={icon as keyof typeof FontAwesome6.glyphMap} size={size - 1} color={color} />;
  }
  return <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={size} color={color} />;
}

export default function HorseTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.outer}>
      <View style={styles.inner}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const options = descriptors[route.key].options;
          const meta = TAB_META[route.name];
          if (!meta) return null;

          const iconName = isFocused && meta.activeIcon ? meta.activeIcon : meta.icon;
          const center = route.name === 'stable';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              activeOpacity={0.9}
              style={[
                styles.item,
                center && styles.centerItem,
                isFocused && styles.itemActive,
                center && isFocused && styles.centerItemActive,
              ]}
            >
              <View style={[styles.iconWrap, center && styles.centerIconWrap, isFocused && styles.iconWrapActive]}>
                <TabIcon iconSet={meta.iconSet} icon={iconName} active={isFocused} />
              </View>
              <Text style={[styles.label, isFocused && styles.labelActive]}>{meta.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: '#08101d',
    borderTopColor: '#182538',
    borderTopWidth: 1,
    paddingTop: 6,
    paddingBottom: 10,
    paddingHorizontal: 8,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 6,
    minHeight: 58,
  },
  centerItem: {
    marginTop: -14,
  },
  itemActive: {
    transform: [{ translateY: -3 }, { scale: 1.06 }],
  },
  centerItemActive: {
    transform: [{ translateY: -6 }, { scale: 1.12 }],
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#101b2b',
    borderWidth: 1,
    borderColor: '#1c2a3f',
    marginBottom: 4,
  },
  centerIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: '#121f32',
    borderColor: '#2a3c57',
  },
  iconWrapActive: {
    backgroundColor: '#17283e',
    borderColor: '#f59e0b55',
    shadowColor: '#f59e0b',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  label: {
    color: '#8090a7',
    fontSize: 10,
    fontWeight: '800',
  },
  labelActive: {
    color: '#f7c948',
  },
});
