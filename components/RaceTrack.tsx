import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { RaceFrame } from '../lib/simulation';
import HorseVisual from './HorseVisual';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TRACK_WIDTH = SCREEN_WIDTH - 24;
const LANE_HEIGHT = 74;
const FINISH_RATIO = 0.84;

interface RaceTrackHorse {
  id: string;
  name: string;
  color: string;
  jockeyColor: string;
}

interface Props {
  frames: RaceFrame[];
  playing: boolean;
  horses: RaceTrackHorse[];
  highlightedHorseId?: string;
  onFinish?: (results: string[]) => void;
}

function HorseLane({
  horse,
  horseIdx,
  frames,
  playing,
  highlighted,
  isFirst,
  onFinish,
}: {
  horse: RaceTrackHorse;
  horseIdx: number;
  frames: RaceFrame[];
  playing: boolean;
  highlighted: boolean;
  isFirst: boolean;
  onFinish?: (results: string[]) => void;
}) {
  const translateX = useSharedValue(0);
  const tickRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [finished, setFinished] = useState(false);
  const finishedRef = useRef(false);
  const maxX = TRACK_WIDTH * FINISH_RATIO - 96;

  useEffect(() => {
    if (!playing || frames.length === 0) return;
    tickRef.current = 0;
    translateX.value = 0;
    setFinished(false);
    finishedRef.current = false;

    timerRef.current = setInterval(() => {
      const frame = frames[tickRef.current];
      if (!frame) {
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }

      const horseFrame = frame.horses.find((item) => item.id === horse.id);
      if (horseFrame) {
        translateX.value = withTiming(horseFrame.position * maxX, {
          duration: 100,
          easing: Easing.linear,
        });
        if (horseFrame.finished && !finishedRef.current) {
          finishedRef.current = true;
          setFinished(true);
        }
      }

      if (frame.finished && isFirst) {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeout(() => onFinish?.(frame.results ?? []), 300);
      }

      tickRef.current += 1;
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [frames, horse.id, isFirst, maxX, onFinish, playing, translateX]);

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={[styles.lane, horseIdx % 2 === 0 ? styles.laneEven : styles.laneOdd, highlighted && styles.laneHighlight]}>
      <View style={[styles.dirtStripe, { top: '24%' }]} />
      <View style={[styles.dirtStripe, { top: '52%' }]} />
      <View style={[styles.dirtStripe, { top: '79%' }]} />

      <View style={[styles.laneBadge, { backgroundColor: horse.color }]}>
        <Text style={styles.laneBadgeText}>{horseIdx + 1}</Text>
      </View>

      <Animated.View style={[styles.runnerWrap, slideStyle]}>
        <View style={styles.runnerRow}>
          <View style={[styles.jockeyCap, { backgroundColor: horse.jockeyColor }]} />
          <HorseVisual color={horse.color} size={58} mode="track" />
        </View>
        {playing && !finished ? (
          <View style={styles.speedTrail}>
            <View style={styles.speedLine} />
            <View style={[styles.speedLine, { width: 18, opacity: 0.16 }]} />
            <View style={[styles.speedLine, { width: 12, opacity: 0.1 }]} />
          </View>
        ) : null}
      </Animated.View>

      <Text style={[styles.horseName, { color: horse.color }]} numberOfLines={1}>
        {horse.name}
      </Text>

      {finished ? (
        <View style={[styles.doneBadge, { backgroundColor: horse.color }]}>
          <Text style={styles.doneBadgeText}>DONE</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function RaceTrack({ frames, playing, horses, highlightedHorseId, onFinish }: Props) {
  if (frames.length === 0 || horses.length === 0) return null;
  const finishX = TRACK_WIDTH * FINISH_RATIO;

  return (
    <View style={styles.shell}>
      <View style={styles.topBanner}>
        <Text style={styles.bannerText}>RACECOURSE LIVE</Text>
        <Text style={styles.bannerSub}>1200m straight / rail set</Text>
      </View>

      <View style={styles.container}>
        <View style={styles.railTop}>
          {Array.from({ length: 18 }).map((_, i) => (
            <View key={i} style={styles.railPost} />
          ))}
        </View>

        <View style={[styles.finishLine, { left: finishX }]}>
          <Text style={styles.finishFlag}>FINISH</Text>
          <View style={styles.finishPole} />
        </View>

        {[0.25, 0.5, 0.75].map((ratio) => (
          <View key={ratio} style={[styles.distMark, { left: finishX * ratio }]}>
            <Text style={styles.distMarkText}>{Math.round(ratio * 100)}%</Text>
          </View>
        ))}

        {horses.map((horse, index) => (
          <HorseLane
            key={horse.id}
            horse={horse}
            horseIdx={index}
            frames={frames}
            playing={playing}
            highlighted={highlightedHorseId === horse.id}
            isFirst={index === 0}
            onFinish={index === 0 ? onFinish : undefined}
          />
        ))}

        <View style={styles.railBottom}>
          {Array.from({ length: 18 }).map((_, i) => (
            <View key={i} style={styles.railPost} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#7a5833',
    backgroundColor: '#442d16',
  },
  topBanner: {
    backgroundColor: '#2a1c0f',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#5b4024',
  },
  bannerText: { color: '#f8fafc', fontSize: 13, fontWeight: '900', letterSpacing: 1.3 },
  bannerSub: { color: '#d6c0a6', fontSize: 11, marginTop: 4 },
  container: {
    width: TRACK_WIDTH,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: '#a17642',
  },
  railTop: {
    height: 14,
    backgroundColor: '#efe7d7',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#d2c29a',
  },
  railBottom: {
    height: 14,
    backgroundColor: '#efe7d7',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: '#d2c29a',
  },
  railPost: { width: 3, height: 14, backgroundColor: '#bfa678' },
  lane: {
    height: LANE_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: '#8b6235',
    position: 'relative',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  laneEven: { backgroundColor: '#b98b4d' },
  laneOdd: { backgroundColor: '#ae7f43' },
  laneHighlight: { backgroundColor: '#c29557' },
  dirtStripe: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#00000018' },
  laneBadge: {
    position: 'absolute',
    left: 6,
    top: '50%',
    width: 22,
    height: 22,
    borderRadius: 999,
    marginTop: -11,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  laneBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  runnerWrap: {
    position: 'absolute',
    left: 30,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 3,
  },
  runnerRow: { flexDirection: 'row', alignItems: 'center' },
  jockeyCap: {
    width: 12,
    height: 12,
    borderRadius: 999,
    marginRight: -6,
    zIndex: 2,
    borderWidth: 1,
    borderColor: '#fff',
  },
  speedTrail: {
    position: 'absolute',
    left: -28,
    top: '50%',
    marginTop: -2,
    gap: 3,
  },
  speedLine: { width: 24, height: 3, borderRadius: 4, backgroundColor: '#f8e6b8', opacity: 0.22 },
  horseName: {
    position: 'absolute',
    right: 8,
    width: 84,
    textAlign: 'right',
    fontSize: 10,
    fontWeight: '800',
  },
  doneBadge: {
    position: 'absolute',
    right: 96,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  doneBadgeText: { color: '#fff', fontSize: 8, fontWeight: '900', letterSpacing: 0.4 },
  finishLine: { position: 'absolute', top: 0, bottom: 0, width: 4, zIndex: 10, alignItems: 'center' },
  finishFlag: {
    position: 'absolute',
    top: 6,
    left: -16,
    color: '#f8fafc',
    fontSize: 8,
    fontWeight: '900',
    transform: [{ rotate: '-90deg' }],
  },
  finishPole: { flex: 1, width: 4, backgroundColor: '#fbbf24' },
  distMark: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: '#ffffff24', zIndex: 1 },
  distMarkText: { position: 'absolute', top: 4, left: 3, width: 26, color: '#fff7', fontSize: 7, fontWeight: '700' },
});
