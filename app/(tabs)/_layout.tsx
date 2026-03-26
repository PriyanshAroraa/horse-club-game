import { Tabs } from 'expo-router';
import HorseTabBar from '../../components/HorseTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <HorseTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        animation: 'fade',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="challenges"
        options={{
          title: 'Tasks',
        }}
      />
      <Tabs.Screen
        name="stable"
        options={{
          title: 'Stable',
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: 'Market',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
        }}
      />
    </Tabs>
  );
}
