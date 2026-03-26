import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated as RNAnimated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { HorseMood, HorseState, JockeyId, StableUpgradeKey, getTraitSummary, useGameStore } from '../../lib/store';
import HorseVisual from '../../components/HorseVisual';
import TabSwipeView from '../../components/TabSwipeView';

const MOOD_CONFIG: Record<HorseMood, { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }> = {
  happy: { icon: 'happy-outline', label: 'Happy', color: '#10b981' },
  tired: { icon: 'moon-outline', label: 'Tired', color: '#6366f1' },
  hungry: { icon: 'nutrition-outline', label: 'Hungry', color: '#f59e0b' },
  injured: { icon: 'medkit-outline', label: 'Needs care', color: '#ef4444' },
  excited: { icon: 'flame-outline', label: 'Excited', color: '#f97316' },
};

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  const anim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.timing(anim, { toValue: value, duration: 450, useNativeDriver: false }).start();
  }, [anim, value]);

  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statTrack}>
        <RNAnimated.View
          style={[
            styles.statFill,
            {
              width: anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
              backgroundColor: color,
            },
          ]}
        />
      </View>
      <Text style={[styles.statValue, { color }]}>{Math.round(value)}</Text>
    </View>
  );
}

export default function StableScreen() {
  const router = useRouter();
  const {
    stable,
    coins,
    trophies,
    league,
    horseStates,
    selectedHorseId,
    stableUpgrades,
    selectHorse,
    feedHorse,
    groomHorse,
    restHorse,
    startTraining,
    collectTraining,
    tickHorseState,
    upgradeStable,
    getUpgradeCost,
    jockeys,
    horseJockeys,
    assignJockey,
    getHorseJockey,
  } = useGameStore();

  const [view, setView] = useState<'stable' | 'horses'>('stable');
  const [trainingType, setTrainingType] = useState<'speed' | 'stamina' | 'acceleration'>('speed');
  const [toast, setToast] = useState<string | null>(null);
  const toastAnim = useRef(new RNAnimated.Value(0)).current;

  const selectedHorse = stable.find((horse) => horse.id === selectedHorseId) ?? stable[0];
  const hs: HorseState = horseStates[selectedHorse?.id] ?? {
    id: selectedHorse?.id ?? 'horse',
    energy: 100,
    mood: 'happy',
    xp: 0,
    level: 1,
    hunger: 80,
    cleanliness: 90,
    isTraining: false,
    trainingEndsAt: null,
    lastCaredAt: Date.now(),
    bonusSpeed: 0,
    bonusStamina: 0,
    bonusAcceleration: 0,
  };

  const mood = MOOD_CONFIG[hs.mood];
  const trainingCost = Math.max(120, 200 - stableUpgrades.trainer.level * 20);
  const trainingDone = hs.isTraining && hs.trainingEndsAt ? Date.now() >= hs.trainingEndsAt : false;
  const activeJockey = getHorseJockey(selectedHorse.id);
  useEffect(() => {
    const timer = setInterval(() => {
      if (selectedHorse) tickHorseState(selectedHorse.id);
    }, 8000);
    return () => clearInterval(timer);
  }, [selectedHorse, tickHorseState]);

  function showToast(message: string) {
    setToast(message);
    toastAnim.setValue(0);
    RNAnimated.sequence([
      RNAnimated.timing(toastAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      RNAnimated.delay(1200),
      RNAnimated.timing(toastAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }

  function tryUpgrade(key: StableUpgradeKey) {
    const cost = getUpgradeCost(key);
    if (coins < cost) {
      showToast(`Need ${cost} coins`);
      return;
    }
    upgradeStable(key);
    showToast(`${stableUpgrades[key].label} upgraded`);
  }

  return (
    <TabSwipeView route="stable">
      <View style={styles.root}>
        <LinearGradient colors={['#08101b', '#091321', '#0b1523']} style={StyleSheet.absoluteFill} />

        {toast ? (
          <RNAnimated.View
            style={[
              styles.toast,
              {
                opacity: toastAnim,
                transform: [
                  {
                    translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.toastText}>{toast}</Text>
          </RNAnimated.View>
        ) : null}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>My Stable</Text>
              <Text style={styles.subtitle}>
                {league} league / {trophies} trophies
              </Text>
            </View>
            <View style={styles.coinsBox}>
              <Ionicons name="cash-outline" size={16} color="#f7c948" />
              <Text style={styles.coinsVal}>{coins.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.tabs}>
            {(['stable', 'horses'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, view === tab && styles.tabActive]}
                onPress={() => setView(tab)}
              >
                <Text style={[styles.tabText, view === tab && styles.tabTextActive]}>
                  {tab === 'stable' ? 'Stable view' : 'Horse list'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {view === 'stable' ? (
            <>
              <LinearGradient colors={['#12243c', '#0f1b2d']} style={styles.heroCard}>
                <View style={styles.heroGlow} />
                <View style={styles.heroTop}>
                  <View>
                    <Text style={styles.heroName}>{selectedHorse.name}</Text>
                    <Text style={styles.heroMeta}>
                      {selectedHorse.trackPref} / {selectedHorse.distancePref} / {selectedHorse.rarity}
                    </Text>
                  </View>
                  <View style={[styles.moodBadge, { borderColor: mood.color }]}>
                    <Ionicons name={mood.icon} size={14} color={mood.color} />
                    <Text style={[styles.moodText, { color: mood.color }]}>{mood.label}</Text>
                  </View>
                </View>

                <View style={styles.horseStage}>
                  <HorseVisual color={selectedHorse.color} size={210} mode="hero" label={selectedHorse.rarity} />
                </View>

                <Text style={styles.traitTitle}>Trait</Text>
                <Text style={styles.traitCopy}>{getTraitSummary(selectedHorse)}</Text>

                <View style={styles.selectorDots}>
                  {stable.map((horse) => (
                    <TouchableOpacity
                      key={horse.id}
                      style={[
                        styles.selectorDot,
                        horse.id === selectedHorse.id && { width: 18, backgroundColor: horse.color },
                      ]}
                      onPress={() => selectHorse(horse.id)}
                    />
                  ))}
                </View>
              </LinearGradient>

              <View style={styles.panel}>
                <Text style={styles.panelTitle}>Condition</Text>
                <StatBar label="Energy" value={hs.energy} color="#6366f1" />
                <StatBar label="Hunger" value={hs.hunger} color="#f59e0b" />
                <StatBar label="Cleanliness" value={hs.cleanliness} color="#10b981" />
                <View style={styles.levelRow}>
                  <Text style={styles.levelLabel}>Level</Text>
                  <Text style={styles.levelValue}>
                    {hs.level} / xp {hs.xp}
                  </Text>
                </View>
              </View>

              <View style={styles.panel}>
                <View style={styles.panelHeader}>
                  <Text style={styles.panelTitle}>Training</Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (hs.isTraining) {
                        showToast('Horse already training');
                        return;
                      }
                      if (hs.energy < 30) {
                        showToast('Horse is too tired');
                        return;
                      }
                      if (coins < trainingCost) {
                        showToast(`Need ${trainingCost} coins`);
                        return;
                      }
                      startTraining(selectedHorse.id, trainingType);
                      showToast(`${trainingType} training started`);
                    }}
                  >
                    <Text style={styles.panelAction}>Start</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.trainingOptions}>
                  {(['speed', 'stamina', 'acceleration'] as const).map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[styles.trainingCard, trainingType === item && styles.trainingCardActive]}
                      onPress={() => setTrainingType(item)}
                    >
                      <Text style={[styles.trainingCardTitle, trainingType === item && styles.trainingCardTitleActive]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.trainingCopy}>
                  Trainer level {stableUpgrades.trainer.level} reduces cost and improves gains.
                </Text>
                <Text style={styles.trainingCopy}>Current cost: {trainingCost} coins</Text>

                {hs.isTraining ? (
                  <View style={styles.trainingBanner}>
                    <View>
                      <Text style={styles.trainingTitle}>Training active</Text>
                      <Text style={styles.trainingHint}>
                        {trainingDone ? 'Ready to collect' : 'Complete the timer, then claim rewards.'}
                      </Text>
                    </View>
                    {trainingDone ? (
                      <TouchableOpacity
                        style={styles.collectBtn}
                        onPress={() => {
                          collectTraining(selectedHorse.id);
                          showToast('Training rewards collected');
                        }}
                      >
                        <Text style={styles.collectText}>Collect</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : null}
              </View>

              <View style={styles.panel}>
                <Text style={styles.panelTitle}>Care</Text>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => {
                      if (coins < 50) return showToast('Need 50 coins');
                      feedHorse(selectedHorse.id);
                      showToast('Horse fed');
                    }}
                  >
                    <Ionicons name="nutrition-outline" size={22} color="#f59e0b" />
                    <Text style={styles.actionTitle}>Feed</Text>
                    <Text style={styles.actionSub}>50 coins</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => {
                      if (coins < 75) return showToast('Need 75 coins');
                      groomHorse(selectedHorse.id);
                      showToast('Horse groomed');
                    }}
                  >
                    <MaterialCommunityIcons name="brush-variant" size={22} color="#10b981" />
                    <Text style={styles.actionTitle}>Groom</Text>
                    <Text style={styles.actionSub}>75 coins</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => {
                      restHorse(selectedHorse.id);
                      showToast('Horse rested');
                    }}
                  >
                    <Ionicons name="bed-outline" size={22} color="#60a5fa" />
                    <Text style={styles.actionTitle}>Rest</Text>
                    <Text style={styles.actionSub}>Free</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.panel}>
                <Text style={styles.panelTitle}>Jockey</Text>
                <View style={styles.jockeyHero}>
                  <View>
                    <Text style={styles.jockeyName}>{activeJockey.name}</Text>
                    <Text style={styles.jockeyMeta}>
                      {activeJockey.specialtyTrack} / {activeJockey.specialtyDistance} / +{activeJockey.bonus} handling
                    </Text>
                    <Text style={styles.jockeySkill}>{activeJockey.skill}</Text>
                  </View>
                  <View style={[styles.jockeyBadge, { backgroundColor: activeJockey.color }]} />
                </View>
                <View style={styles.jockeyGrid}>
                  {jockeys.map((jockey) => {
                    const active = horseJockeys[selectedHorse.id] === jockey.id;
                    return (
                      <TouchableOpacity
                        key={jockey.id}
                        style={[styles.jockeyCard, active && styles.jockeyCardActive]}
                        onPress={() => {
                          assignJockey(selectedHorse.id, jockey.id as JockeyId);
                          showToast(`${jockey.name} assigned`);
                        }}
                      >
                        <View style={[styles.jockeyDot, { backgroundColor: jockey.color }]} />
                        <Text style={[styles.jockeyCardName, active && styles.jockeyCardNameActive]}>{jockey.name}</Text>
                        <Text style={styles.jockeyCardMeta}>
                          {jockey.specialtyTrack}/{jockey.specialtyDistance}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.panel}>
                <View style={styles.panelHeader}>
                  <Text style={styles.panelTitle}>Stable upgrades</Text>
                  <TouchableOpacity onPress={() => router.push('/market')}>
                    <Text style={styles.panelAction}>Market</Text>
                  </TouchableOpacity>
                </View>
                {(['barn', 'trainer', 'scout'] as StableUpgradeKey[]).map((key) => {
                  const upgrade = stableUpgrades[key];
                  const cost = getUpgradeCost(key);
                  return (
                    <View key={key} style={styles.upgradeRow}>
                      <View style={styles.upgradeCopy}>
                        <Text style={styles.upgradeName}>
                          {upgrade.label} Lv {upgrade.level}
                        </Text>
                        <Text style={styles.upgradeDesc}>{upgrade.desc}</Text>
                      </View>
                      <TouchableOpacity style={styles.upgradeBtn} onPress={() => tryUpgrade(key)}>
                        <Text style={styles.upgradeBtnText}>{cost}</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.raceBtn} onPress={() => router.push('/race')}>
                <Ionicons name="flag-outline" size={20} color="#111827" />
                <Text style={styles.raceBtnText}>Race now</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.listWrap}>
              {stable.map((horse) => {
                const state = horseStates[horse.id] ?? hs;
                const activeMood = MOOD_CONFIG[state.mood];
                const selected = horse.id === selectedHorse.id;
                return (
                  <TouchableOpacity
                    key={horse.id}
                    style={[styles.listCard, selected && { borderColor: horse.color }]}
                    onPress={() => {
                      selectHorse(horse.id);
                      setView('stable');
                    }}
                  >
                    <HorseVisual color={horse.color} size={72} mode="card" />
                    <View style={styles.listInfo}>
                      <Text style={[styles.listName, { color: horse.color }]}>{horse.name}</Text>
                      <Text style={styles.listMeta}>
                        Lv {state.level} / {horse.wins} wins / {horse.races} races
                      </Text>
                      <Text style={styles.listTrait}>{getTraitSummary(horse)}</Text>
                      <View style={styles.listMood}>
                        <Ionicons name={activeMood.icon} size={12} color={activeMood.color} />
                        <Text style={[styles.listMoodText, { color: activeMood.color }]}>{activeMood.label}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </TabSwipeView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#08101b' },
  scroll: { padding: 16, paddingTop: 48, paddingBottom: 120 },
  toast: {
    position: 'absolute',
    top: 54,
    alignSelf: 'center',
    zIndex: 30,
    borderRadius: 999,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  toastText: { color: '#f8fafc', fontSize: 12, fontWeight: '800' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { color: '#f8fafc', fontSize: 28, fontWeight: '900' },
  subtitle: { color: '#7f8da3', fontSize: 12, marginTop: 4, textTransform: 'capitalize' },
  coinsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#111827',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  coinsVal: { color: '#f8fafc', fontSize: 14, fontWeight: '900' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 4,
    marginBottom: 14,
  },
  tab: { flex: 1, alignItems: 'center', borderRadius: 12, paddingVertical: 10 },
  tabActive: { backgroundColor: '#1b2942' },
  tabText: { color: '#7f8da3', fontSize: 13, fontWeight: '800' },
  tabTextActive: { color: '#f8fafc' },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#1b2a41',
    padding: 18,
    overflow: 'hidden',
    marginBottom: 14,
  },
  heroGlow: {
    position: 'absolute',
    left: 20,
    top: 34,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: '#2563eb22',
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroName: { color: '#f8fafc', fontSize: 24, fontWeight: '900' },
  heroMeta: { color: '#93c5fd', fontSize: 13, marginTop: 4, textTransform: 'capitalize' },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: '#0b1220aa',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  moodText: { fontSize: 12, fontWeight: '900' },
  horseStage: { alignItems: 'center', marginVertical: 10 },
  traitTitle: { color: '#94a3b8', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.1 },
  traitCopy: { color: '#e2e8f0', fontSize: 13, marginTop: 6, lineHeight: 18 },
  selectorDots: { flexDirection: 'row', justifyContent: 'center', gap: 7, marginTop: 14 },
  selectorDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: '#f8fafc33' },
  panel: {
    borderRadius: 20,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 16,
    marginBottom: 14,
  },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  panelTitle: { color: '#f8fafc', fontSize: 17, fontWeight: '900', marginBottom: 12 },
  panelAction: { color: '#f7c948', fontSize: 13, fontWeight: '900' },
  statRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  statLabel: { width: 90, color: '#dbe4f0', fontSize: 14, fontWeight: '700' },
  statTrack: { flex: 1, height: 8, borderRadius: 999, backgroundColor: '#1f2937', overflow: 'hidden' },
  statFill: { height: '100%', borderRadius: 999 },
  statValue: { width: 38, textAlign: 'right', marginLeft: 8, fontSize: 13, fontWeight: '900' },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  levelLabel: { color: '#94a3b8', fontSize: 13, fontWeight: '700' },
  levelValue: { color: '#f8fafc', fontSize: 13, fontWeight: '800' },
  trainingOptions: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  trainingCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingVertical: 14,
    alignItems: 'center',
  },
  trainingCardActive: { backgroundColor: '#23180a', borderColor: '#f59e0b' },
  trainingCardTitle: { color: '#94a3b8', fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  trainingCardTitleActive: { color: '#f8fafc' },
  trainingCopy: { color: '#7f8da3', fontSize: 13, lineHeight: 18, marginBottom: 4 },
  trainingBanner: {
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: '#0d1d37',
    borderWidth: 1,
    borderColor: '#1d4ed8',
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trainingTitle: { color: '#dbeafe', fontSize: 14, fontWeight: '900' },
  trainingHint: { color: '#93c5fd', fontSize: 12, marginTop: 4 },
  collectBtn: { borderRadius: 12, backgroundColor: '#f59e0b', paddingHorizontal: 14, paddingVertical: 10 },
  collectText: { color: '#111827', fontSize: 12, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 14,
    alignItems: 'center',
  },
  actionTitle: { color: '#f8fafc', fontSize: 14, fontWeight: '900', marginTop: 8 },
  actionSub: { color: '#7f8da3', fontSize: 11, marginTop: 3 },
  jockeyHero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  jockeyName: { color: '#f8fafc', fontSize: 16, fontWeight: '900' },
  jockeyMeta: { color: '#93c5fd', fontSize: 12, marginTop: 4, textTransform: 'capitalize' },
  jockeySkill: { color: '#cbd5e1', fontSize: 12, lineHeight: 18, marginTop: 6, maxWidth: 240 },
  jockeyBadge: { width: 18, height: 18, borderRadius: 999 },
  jockeyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  jockeyCard: {
    width: '48%',
    borderRadius: 16,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 12,
  },
  jockeyCardActive: { borderColor: '#f59e0b', backgroundColor: '#23180a' },
  jockeyDot: { width: 12, height: 12, borderRadius: 999, marginBottom: 8 },
  jockeyCardName: { color: '#f8fafc', fontSize: 13, fontWeight: '800' },
  jockeyCardNameActive: { color: '#f7c948' },
  jockeyCardMeta: { color: '#94a3b8', fontSize: 11, marginTop: 4, textTransform: 'capitalize' },
  upgradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#0f172a',
    padding: 12,
    marginBottom: 10,
  },
  upgradeCopy: { flex: 1, paddingRight: 12 },
  upgradeName: { color: '#f8fafc', fontSize: 14, fontWeight: '900' },
  upgradeDesc: { color: '#94a3b8', fontSize: 12, marginTop: 4, lineHeight: 17 },
  upgradeBtn: { borderRadius: 12, backgroundColor: '#f59e0b', paddingHorizontal: 14, paddingVertical: 10 },
  upgradeBtnText: { color: '#111827', fontSize: 12, fontWeight: '900' },
  raceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 18,
    backgroundColor: '#f59e0b',
    paddingVertical: 16,
  },
  raceBtnText: { color: '#111827', fontSize: 17, fontWeight: '900' },
  listWrap: { gap: 10 },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 14,
  },
  listInfo: { flex: 1, marginLeft: 10 },
  listName: { fontSize: 17, fontWeight: '900' },
  listMeta: { color: '#94a3b8', fontSize: 12, marginTop: 3 },
  listTrait: { color: '#cbd5e1', fontSize: 12, marginTop: 6, lineHeight: 17 },
  listMood: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  listMoodText: { fontSize: 12, fontWeight: '800' },
});
