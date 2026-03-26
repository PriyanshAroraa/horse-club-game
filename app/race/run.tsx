import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { getHorseRaceScore, useGameStore } from '../../lib/store';
import { RaceFrame, simulateRace } from '../../lib/simulation';
import RaceTrack from '../../components/RaceTrack';

type Phase = 'intro' | 'countdown' | 'racing' | 'results';

function CountdownOverlay({ count }: { count: number }) {
  const scale = useSharedValue(1.15);

  useEffect(() => {
    scale.value = withSequence(withTiming(1.02, { duration: 180 }), withTiming(1, { duration: 500 }));
  }, [count, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={countdownStyles.overlay}>
      <View style={countdownStyles.box}>
        <Text style={countdownStyles.label}>Starting gate</Text>
        <Animated.Text style={[countdownStyles.number, style]}>
          {count > 0 ? count : 'GO'}
        </Animated.Text>
        <Text style={countdownStyles.sub}>{count > 0 ? 'Riders loaded' : 'Break from the gate'}</Text>
      </View>
    </View>
  );
}

export default function RunRaceScreen() {
  const router = useRouter();
  const {
    stable,
    currentRaceConfig,
    currentBet,
    settleRace,
    clearBet,
    horseStates,
    stableUpgrades,
    getHorseJockey,
  } = useGameStore();

  const raceHorses = useMemo(
    () =>
      stable.slice(0, 6).map((horse) => {
        if (!currentRaceConfig) return horse;
        const jockey = getHorseJockey(horse.id);
        const specialty =
          (jockey.specialtyTrack === currentRaceConfig.track ? 3 : 0) +
          (jockey.specialtyDistance === currentRaceConfig.distance ? 2 : 0);
        return {
          ...horse,
          jockeyBonus: horse.jockeyBonus + jockey.bonus + specialty,
        };
      }),
    [currentRaceConfig, getHorseJockey, stable],
  );
  const parade = useMemo(
    () =>
      raceHorses.map((horse) => ({
        horse,
        jockey: getHorseJockey(horse.id),
        score: getHorseRaceScore(horse, getHorseJockey(horse.id), currentRaceConfig ?? undefined),
      })),
    [currentRaceConfig, getHorseJockey, raceHorses],
  );
  const favorites = useMemo(() => [...parade].sort((a, b) => b.score - a.score).slice(0, 3), [parade]);
  const horseMeta = useMemo(
    () =>
      parade.map((entry) => ({
        id: entry.horse.id,
        name: entry.horse.name,
        color: entry.horse.color,
        jockeyColor: entry.jockey.color,
      })),
    [parade],
  );

  const [phase, setPhase] = useState<Phase>('intro');
  const [countdown, setCountdown] = useState(3);
  const [frames, setFrames] = useState<RaceFrame[]>([]);
  const [results, setResults] = useState<string[]>([]);
  const [livePositions, setLivePositions] = useState<{ id: string; pos: number }[]>([]);
  const [commentary, setCommentary] = useState('The field is circling behind the gate.');
  const [leaderId, setLeaderId] = useState<string | null>(null);

  const liveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef(0);
  const flashOpacity = useSharedValue(0);
  const flashStyle = useAnimatedStyle(() => ({ opacity: flashOpacity.value }));

  useEffect(() => {
    if (!currentRaceConfig || raceHorses.length === 0) return;
    const nextFrames = simulateRace({
      track: currentRaceConfig.track,
      distance: currentRaceConfig.distance,
      weather: currentRaceConfig.weather,
      horses: raceHorses,
    });
    setFrames(nextFrames);
    setLivePositions(raceHorses.map((horse) => ({ id: horse.id, pos: 0 })));
    setLeaderId(favorites[0]?.horse.id ?? null);
  }, [currentRaceConfig, favorites, raceHorses]);

  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      const timer = setTimeout(() => setPhase('racing'), 450);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, countdown]);

  useEffect(() => {
    if (phase !== 'racing' || frames.length === 0) return;
    tickRef.current = 0;
    liveTimerRef.current = setInterval(() => {
      const frame = frames[tickRef.current];
      if (!frame) {
        if (liveTimerRef.current) clearInterval(liveTimerRef.current);
        return;
      }

      const positions = frame.horses.map((horse) => ({ id: horse.id, pos: horse.position }));
      setLivePositions(positions);
      const sorted = [...positions].sort((a, b) => b.pos - a.pos);
      const newLeader = sorted[0]?.id ?? null;
      if (newLeader && newLeader !== leaderId) {
        const leaderHorse = raceHorses.find((horse) => horse.id === newLeader);
        setLeaderId(newLeader);
        setCommentary(`${leaderHorse?.name ?? 'A runner'} surges to the front.`);
      } else if (tickRef.current === 5) {
        setCommentary('The gates burst open and the field settles into stride.');
      } else if (tickRef.current === Math.round(frames.length * 0.45)) {
        setCommentary('Mid-race pressure is building as the leaders hold a narrow margin.');
      } else if (tickRef.current === Math.round(frames.length * 0.8)) {
        setCommentary('Into the final section now. The jockeys are asking for everything.');
      }

      tickRef.current += 1;
    }, 100);

    return () => {
      if (liveTimerRef.current) clearInterval(liveTimerRef.current);
    };
  }, [frames, leaderId, phase, raceHorses]);

  const handleFinish = useCallback(
    (winnerIds: string[]) => {
      if (liveTimerRef.current) clearInterval(liveTimerRef.current);
      setResults(winnerIds);
      settleRace(winnerIds);
      const winningHorse = raceHorses.find((horse) => horse.id === winnerIds[0]);
      setCommentary(`${winningHorse?.name ?? 'Your horse'} hits the wire first.`);

      const won = currentBet && winnerIds[0] === currentBet.horseId;
      flashOpacity.value = withSequence(
        withTiming(0.4, { duration: 160 }),
        withRepeat(withSequence(withTiming(0.05, { duration: 140 }), withTiming(0.28, { duration: 140 })), 2),
        withTiming(0, { duration: 240 }),
      );

      const timer = setTimeout(() => setPhase('results'), won ? 900 : 1100);
      return () => clearTimeout(timer);
    },
    [currentBet, flashOpacity, raceHorses, settleRace],
  );

  if (!currentRaceConfig || raceHorses.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No race selected</Text>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace('/race')}>
          <Text style={styles.secondaryBtnText}>Return to lobby</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const betHorse = currentBet ? raceHorses.find((horse) => horse.id === currentBet.horseId) : null;
  const won = results.length > 0 && currentBet ? results[0] === currentBet.horseId : false;
  const payout = currentBet && won ? Math.floor(currentBet.amount * currentBet.odds) : 0;
  const prizeBonus = won ? currentRaceConfig.prizePool : 0;
  const trophiesDelta = won
    ? currentRaceConfig.trophyReward
    : -Math.max(6, Math.round(currentRaceConfig.trophyReward * 0.3));
  const sortedLive = [...livePositions].sort((a, b) => b.pos - a.pos);
  const selectedJockey = betHorse ? getHorseJockey(betHorse.id) : null;

  return (
    <View style={styles.root}>
      <Animated.View pointerEvents="none" style={[styles.flashOverlay, { backgroundColor: won ? '#10b981' : '#ef4444' }, flashStyle]} />

      <View style={styles.header}>
        <View>
          <Text style={styles.raceName}>{currentRaceConfig.name}</Text>
          <Text style={styles.raceMeta}>
            {currentRaceConfig.track} / {currentRaceConfig.distance} / {currentRaceConfig.weather}
          </Text>
        </View>
        {phase === 'racing' ? (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        ) : (
          <View style={styles.weatherBadge}>
            <Text style={styles.weatherText}>{phase === 'intro' ? 'parade' : currentRaceConfig.weather}</Text>
          </View>
        )}
      </View>

      {currentBet && betHorse ? (
        <View style={styles.betBanner}>
          <View>
            <Text style={styles.betBannerLabel}>Your runner</Text>
            <Text style={styles.betBannerValue}>
              {betHorse.name} / {selectedJockey?.name ?? 'Jockey'} / {currentBet.amount} coins @ {currentBet.odds}x
            </Text>
          </View>
          <Text style={styles.betBannerPotential}>{Math.floor(currentBet.amount * currentBet.odds).toLocaleString()}</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {phase === 'intro' ? (
          <>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Pre-race parade</Text>
              <Text style={styles.copy}>
                The field steps onto the course. Favorites have drawn the most attention, but weather and rider chemistry can flip the order quickly.
              </Text>
              {parade.map((entry, index) => {
                const picked = currentBet?.horseId === entry.horse.id;
                return (
                  <View key={entry.horse.id} style={[styles.paradeRow, picked && styles.paradeRowPicked]}>
                    <View style={[styles.paradeSwatch, { backgroundColor: entry.horse.color }]} />
                    <View style={styles.paradeInfo}>
                      <Text style={styles.paradeName}>
                        Gate {index + 1} / {entry.horse.name}
                      </Text>
                      <Text style={styles.paradeMeta}>
                        {entry.jockey.name} / {entry.horse.trackPref} / {entry.horse.distancePref}
                      </Text>
                    </View>
                    <Text style={styles.paradeScore}>{Math.round(entry.score)}</Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Favorites board</Text>
              {favorites.map((entry, index) => (
                <View key={entry.horse.id} style={styles.favoriteRow}>
                  <Text style={styles.favoriteRank}>#{index + 1}</Text>
                  <View style={styles.favoriteInfo}>
                    <Text style={styles.favoriteName}>{entry.horse.name}</Text>
                    <Text style={styles.favoriteMeta}>{entry.jockey.name} / {entry.jockey.skill}</Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => {
                setCommentary('The field is loading into the gates.');
                setPhase('countdown');
                setCountdown(3);
              }}
            >
              <Text style={styles.primaryBtnText}>Load the gates</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.trackWrap}>
              <RaceTrack
                frames={frames}
                playing={phase === 'racing'}
                horses={horseMeta}
                highlightedHorseId={currentBet?.horseId}
                onFinish={handleFinish}
              />
            </View>

            <View style={styles.commentaryCard}>
              <Text style={styles.commentaryLabel}>Race call</Text>
              <Text style={styles.commentaryText}>{commentary}</Text>
            </View>

            {phase === 'racing' ? (
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>Live standings</Text>
                {sortedLive.map((entry, index) => {
                  const horse = raceHorses.find((item) => item.id === entry.id);
                  const selected = currentBet?.horseId === entry.id;
                  return (
                    <View key={entry.id} style={[styles.liveRow, selected && styles.liveRowSelected]}>
                      <Text style={styles.liveRank}>#{index + 1}</Text>
                      <View style={styles.liveFillTrack}>
                        <View
                          style={[
                            styles.liveFill,
                            { width: `${Math.max(4, entry.pos * 100)}%`, backgroundColor: horse?.color ?? '#6366f1' },
                          ]}
                        />
                        <Text style={styles.liveHorseName}>{horse?.name}</Text>
                      </View>
                      <Text style={styles.livePct}>{Math.round(entry.pos * 100)}%</Text>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {phase === 'results' ? (
              <>
                <View style={[styles.resultHero, won ? styles.resultHeroWin : styles.resultHeroLose]}>
                  <Text style={styles.resultHeadline}>{won ? 'Winning run' : 'Tough finish'}</Text>
                  <Text style={styles.resultMain}>
                    {won ? `+${(payout + prizeBonus).toLocaleString()} coins` : `-${currentBet?.amount ?? 0} coins`}
                  </Text>
                  <Text style={styles.resultSub}>
                    {won ? `Prize ${prizeBonus.toLocaleString()} / trophies +${trophiesDelta}` : `Trophies ${trophiesDelta}`}
                  </Text>
                </View>

                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>Post-race sheet</Text>
                  {results.map((id, index) => {
                    const horse = raceHorses.find((item) => item.id === id);
                    const state = horseStates[id];
                    const selected = currentBet?.horseId === id;
                    const jockey = horse ? getHorseJockey(horse.id) : null;
                    return (
                      <View key={id} style={[styles.resultRow, selected && styles.resultRowSelected]}>
                        <View style={[styles.resultStripe, { backgroundColor: horse?.color ?? '#6366f1' }]} />
                        <View style={styles.resultInfo}>
                          <Text style={styles.resultName}>
                            #{index + 1} {horse?.name}
                          </Text>
                          <Text style={styles.resultMeta}>
                            {jockey?.name ?? 'Jockey'} / Lv {state?.level ?? 1} / {horse?.trackPref}
                          </Text>
                        </View>
                        {selected ? <Text style={styles.resultTag}>your pick</Text> : null}
                      </View>
                    );
                  })}
                </View>

                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>Next recommendation</Text>
                  <View style={styles.progressStat}>
                    <Text style={styles.progressLabel}>Stable trainer</Text>
                    <Text style={styles.progressValue}>Lv {stableUpgrades.trainer.level}</Text>
                  </View>
                  <View style={styles.progressStat}>
                    <Text style={styles.progressLabel}>Barn recovery</Text>
                    <Text style={styles.progressValue}>Lv {stableUpgrades.barn.level}</Text>
                  </View>
                  <View style={styles.progressStat}>
                    <Text style={styles.progressLabel}>Best move</Text>
                    <Text style={styles.progressValue}>{won ? 'Step into a tougher race' : 'Rest and switch jockey'}</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/race')}>
                  <Text style={styles.primaryBtnText}>Next race</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => {
                    clearBet();
                    router.replace('/stable');
                  }}
                >
                  <Text style={styles.secondaryBtnText}>Back to stable</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </>
        )}

        <View style={{ height: 36 }} />
      </ScrollView>

      {phase === 'countdown' ? <CountdownOverlay count={countdown} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#08101b' },
  center: { flex: 1, backgroundColor: '#08101b', alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { color: '#f8fafc', fontSize: 22, fontWeight: '900', marginBottom: 14 },
  flashOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 40 },
  header: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  raceName: { color: '#f8fafc', fontSize: 24, fontWeight: '900' },
  raceMeta: { color: '#7f8da3', fontSize: 12, marginTop: 4, textTransform: 'capitalize' },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ef4444',
    backgroundColor: '#341216',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  liveDot: { width: 7, height: 7, borderRadius: 999, backgroundColor: '#ef4444' },
  liveText: { color: '#ef4444', fontWeight: '900', fontSize: 11, letterSpacing: 1.2 },
  weatherBadge: {
    borderRadius: 999,
    backgroundColor: '#13253f',
    borderWidth: 1,
    borderColor: '#1e3a5f',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  weatherText: { color: '#93c5fd', fontWeight: '800', fontSize: 11, textTransform: 'capitalize' },
  betBanner: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 18,
    backgroundColor: '#111b2a',
    borderWidth: 1,
    borderColor: '#1b2940',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  betBannerLabel: { color: '#7f8da3', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  betBannerValue: { color: '#e2e8f0', fontSize: 13, fontWeight: '700', marginTop: 3, maxWidth: 250 },
  betBannerPotential: { color: '#f59e0b', fontSize: 18, fontWeight: '900' },
  scroll: { paddingHorizontal: 12 },
  panel: {
    borderRadius: 20,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 16,
    marginBottom: 12,
  },
  panelTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '900', marginBottom: 12 },
  copy: { color: '#cbd5e1', fontSize: 13, lineHeight: 19 },
  paradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#0f172a',
    padding: 12,
    marginTop: 10,
  },
  paradeRowPicked: { borderWidth: 1, borderColor: '#f59e0b' },
  paradeSwatch: { width: 14, height: 14, borderRadius: 999, marginRight: 10 },
  paradeInfo: { flex: 1 },
  paradeName: { color: '#f8fafc', fontSize: 14, fontWeight: '800' },
  paradeMeta: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  paradeScore: { color: '#f7c948', fontSize: 15, fontWeight: '900' },
  favoriteRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  favoriteRank: { color: '#f7c948', width: 28, fontWeight: '900', fontSize: 12 },
  favoriteInfo: { flex: 1 },
  favoriteName: { color: '#f8fafc', fontSize: 14, fontWeight: '800' },
  favoriteMeta: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  trackWrap: { marginBottom: 12 },
  commentaryCard: {
    borderRadius: 18,
    backgroundColor: '#0d1d37',
    borderWidth: 1,
    borderColor: '#1d4ed8',
    padding: 14,
    marginBottom: 12,
  },
  commentaryLabel: { color: '#93c5fd', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  commentaryText: { color: '#e0f2fe', fontSize: 14, fontWeight: '700', marginTop: 8, lineHeight: 20 },
  liveRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  liveRowSelected: {
    backgroundColor: '#0d1a2d',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginHorizontal: -6,
  },
  liveRank: { color: '#94a3b8', width: 28, fontWeight: '800', fontSize: 12 },
  liveFillTrack: {
    flex: 1,
    height: 24,
    borderRadius: 10,
    backgroundColor: '#1f2937',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  liveFill: { position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: 10, minWidth: 4 },
  liveHorseName: { color: '#f8fafc', fontSize: 12, fontWeight: '800', paddingLeft: 10 },
  livePct: { color: '#94a3b8', width: 38, textAlign: 'right', fontWeight: '700', fontSize: 12 },
  resultHero: { borderRadius: 22, padding: 22, marginBottom: 12, borderWidth: 1 },
  resultHeroWin: { backgroundColor: '#08291c', borderColor: '#10b981' },
  resultHeroLose: { backgroundColor: '#281217', borderColor: '#ef4444' },
  resultHeadline: { color: '#f8fafc', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.1 },
  resultMain: { color: '#f8fafc', fontSize: 30, fontWeight: '900', marginTop: 8 },
  resultSub: { color: '#cbd5e1', fontSize: 13, marginTop: 6, lineHeight: 18 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#0f172a',
    marginBottom: 8,
    overflow: 'hidden',
  },
  resultRowSelected: { backgroundColor: '#10213a' },
  resultStripe: { width: 5, alignSelf: 'stretch' },
  resultInfo: { flex: 1, paddingHorizontal: 12, paddingVertical: 12 },
  resultName: { color: '#f8fafc', fontSize: 14, fontWeight: '800' },
  resultMeta: { color: '#7f8da3', fontSize: 12, marginTop: 3, textTransform: 'capitalize' },
  resultTag: { marginRight: 12, color: '#f7c948', fontWeight: '900', fontSize: 11, textTransform: 'uppercase' },
  progressStat: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { color: '#cbd5e1', fontSize: 14, fontWeight: '600' },
  progressValue: { color: '#f7c948', fontSize: 14, fontWeight: '800', maxWidth: 150, textAlign: 'right' },
  primaryBtn: {
    backgroundColor: '#f59e0b',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: { color: '#111827', fontSize: 17, fontWeight: '900' },
  secondaryBtn: {
    backgroundColor: '#111827',
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  secondaryBtnText: { color: '#dbe4f0', fontSize: 15, fontWeight: '800' },
});

const countdownStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00000088',
    zIndex: 100,
  },
  box: {
    minWidth: 220,
    borderRadius: 24,
    backgroundColor: '#0d1726',
    borderWidth: 2,
    borderColor: '#f59e0b',
    paddingHorizontal: 28,
    paddingVertical: 30,
    alignItems: 'center',
  },
  label: { color: '#94a3b8', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 },
  number: { color: '#f59e0b', fontSize: 76, fontWeight: '900', lineHeight: 82, marginTop: 6 },
  sub: { color: '#cbd5e1', fontSize: 13, marginTop: 4, fontWeight: '700' },
});
