import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const TAB_ORDER = ['index', 'challenges', 'stable', 'market', 'history'] as const;
const EDGE_ZONE = 28;
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function TabSwipeView({
  route,
  children,
}: {
  route: string;
  children: React.ReactNode;
}) {
  const navigation = useNavigation();
  const currentIndex = TAB_ORDER.indexOf(route as (typeof TAB_ORDER)[number]);
  let startX = 0;

  const gesture = Gesture.Pan()
    .runOnJS(true)
    .maxPointers(1)
    .activeOffsetX([-24, 24])
    .failOffsetY([-18, 18])
    .onBegin((event) => {
      startX = event.x;
    })
    .onEnd((event) => {
      if (currentIndex < 0) return;

      const fromLeftEdge = startX <= EDGE_ZONE;
      const fromRightEdge = startX >= SCREEN_WIDTH - EDGE_ZONE;
      if (!fromLeftEdge && !fromRightEdge) return;

      const fastEnough = Math.abs(event.velocityX) > 450;
      const farEnough = Math.abs(event.translationX) > 70;
      if (!fastEnough && !farEnough) return;

      if (fromRightEdge && event.translationX < 0 && currentIndex < TAB_ORDER.length - 1) {
        navigation.navigate(TAB_ORDER[currentIndex + 1] as never);
      }

      if (fromLeftEdge && event.translationX > 0 && currentIndex > 0) {
        navigation.navigate(TAB_ORDER[currentIndex - 1] as never);
      }
    });

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.root}>{children}</View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
