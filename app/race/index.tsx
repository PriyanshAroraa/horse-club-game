import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getHorseRaceScore, getTraitSummary, useGameStore } from '../../lib/store';
import { RACE_CONFIGS } from '../../lib/horses';
import { calculateOdds } from '../../lib/simulation';
import HorseCard from '../../components/HorseCard';

const WEATHER_ICON = {
  sunny: 'sunny-outline',
  overcast: 'cloud-outline',
  rain: 'rainy-outline',
  windy: 'flag-outline',
} as const;

type RaceId = (typeof RACE_CONFIGS)[number]['id'];

export default function RaceLobbyScreen() {
  const router = useRouter();
  const { coins, stable, currentBet, setRace, placeBet, clearBet, trophies, league, getHorseJockey } = useGameStore();

  const [selectedRaceId, setSelectedRaceId] = useState<RaceId>(RACE_CONFIGS[0].id);
  const [betHorseId, setBetHorseId] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState('50');

  const race = RACE_CONFIGS.find((r) => r.id === selectedRaceId) ?? RACE_CONFIGS[0];
  const raceHorses = useMemo(
    () =>
      stable.slice(0, 6).map((horse) => {
        const jockey = getHorseJockey(horse.id);
        const specialty =
          (jockey.specialtyTrack === race.track ? 3 : 0) +
          (jockey.specialtyDistance === race.distance ? 2 : 0);
        return {
          ...horse,
          jockeyBonus: horse.jockeyBonus + jockey.bonus + specialty,
        };
      }),
    [getHorseJockey, race.distance, race.track, stable],
  );
  const odds = calculateOdds(raceHorses, race.track, race.distance, race.weather);
  const selectedHorse = stable.find((horse) => horse.id === betHorseId) ?? null;
  const favorites = stable
    .slice(0, 6)
    .map((horse) => ({
      horse,
      jockey: getHorseJockey(horse.id),
      score: getHorseRaceScore(horse, getHorseJockey(horse.id), race),
      odds: odds[horse.id],
    }))
    .sort((a, b) => a.odds - b.odds)
    .slice(0, 3);

  function handlePlaceBet() {
    const amt = parseInt(betAmount, 10);
    if (!betHorseId) return Alert.alert('Pick a horse first');
    if (Number.isNaN(amt) || amt <= 0) return Alert.alert('Invalid bet amount');
    if (amt > coins) return Alert.alert('Not enough coins');
    placeBet(betHorseId, amt, odds[betHorseId]);
  }

  function handleStartRace() {
    if (!currentBet) return Alert.alert('Place a bet first');
    setRace(race);
    router.push('/race/run');
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.title}>Race Lobby</Text>
          <Text style={styles.subtitle}>{league.toUpperCase()} league / {trophies} trophies</Text>
        </View>
        <View style={styles.coins}>
          <Ionicons name="cash-outline" size={16} color="#f59e0b" />
          <Text style={styles.coinsText}>{coins.toLocaleString()}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>Choose Race</Text>
        {RACE_CONFIGS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.raceItem, item.id === selectedRaceId && styles.raceItemSelected]}
            onPress={() => {
              setSelectedRaceId(item.id);
              clearBet();
              setBetHorseId(null);
            }}
          >
            <View style={styles.raceItemLeft}>
              <Text style={styles.raceItemName}>{item.name}</Text>
              <Text style={styles.raceItemMeta}>
                {item.track} / {item.distance} / {item.weather}
              </Text>
              <Text style={styles.raceDescription}>{item.description}</Text>
            </View>
            <View style={styles.raceItemRight}>
              <View style={styles.weatherBadge}>
                <Ionicons name={WEATHER_ICON[item.weather]} size={14} color="#93c5fd" />
                <Text style={styles.weatherText}>{item.weather}</Text>
              </View>
              <Text style={styles.prizeText}>Prize {item.prizePool}</Text>
              <Text style={styles.entryText}>+{item.trophyReward} trophies</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.scoutCard}>
          <View style={styles.scoutHeader}>
            <MaterialCommunityIcons name="binoculars" size={18} color="#f59e0b" />
            <Text style={styles.scoutTitle}>Scout Report</Text>
          </View>
          <Text style={styles.scoutCopy}>
            {(() => {
              if (race.weather === 'rain') {
                return 'Rain adds chaos. Mud runners and reliable horses gain an edge.';
              }
              if (race.distance === 'long') {
                return 'Late stamina matters more than quick bursts in this race.';
              }
              return 'Explosive starts and clean pace control decide this one.';
            })()}
          </Text>
        </View>

        <View style={styles.favoritesCard}>
          <Text style={styles.sectionTitle}>Favorites</Text>
          {favorites.map((entry, index) => (
            <View key={entry.horse.id} style={styles.favoriteRow}>
              <Text style={styles.favoriteRank}>#{index + 1}</Text>
              <View style={styles.favoriteCopy}>
                <Text style={styles.favoriteName}>{entry.horse.name}</Text>
                <Text style={styles.favoriteMeta}>
                  {entry.jockey.name} / {entry.horse.trackPref} / {entry.horse.distancePref}
                </Text>
              </View>
              <Text style={styles.favoriteOdds}>{entry.odds}x</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Pick Your Horse</Text>
        {raceHorses.map((horse) => (
          <HorseCard
            key={horse.id}
            horse={horse}
            selected={betHorseId === horse.id}
            odds={odds[horse.id]}
            onPress={() => setBetHorseId(horse.id)}
            compact
          />
        ))}

        {selectedHorse && (
          <View style={styles.betBox}>
            <Text style={styles.sectionTitle}>Horse Insight</Text>
            <Text style={styles.insightName}>{selectedHorse.name}</Text>
            <Text style={styles.insightCopy}>{getTraitSummary(selectedHorse)}</Text>
            <Text style={styles.insightMeta}>
              Prefers {selectedHorse.trackPref} / {selectedHorse.distancePref} / jockey {getHorseJockey(selectedHorse.id).name}
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Place Bet</Text>
        <View style={styles.betBox}>
          <View style={styles.betRow}>
            <Text style={styles.betLabel}>Amount</Text>
            <TextInput
              style={styles.betInput}
              value={betAmount}
              onChangeText={setBetAmount}
              keyboardType="numeric"
              placeholderTextColor="#6b7280"
            />
          </View>
          {betHorseId && (
            <View style={styles.betRow}>
              <Text style={styles.betLabel}>Potential win</Text>
              <Text style={styles.potentialWin}>
                {Math.floor(parseInt(betAmount || '0', 10) * (odds[betHorseId] ?? 1)).toLocaleString()} + prize
              </Text>
            </View>
          )}
          {currentBet ? (
            <View style={styles.betConfirmed}>
              <Text style={styles.betConfirmedText}>
                Bet placed: {currentBet.amount} on {raceHorses.find((h) => h.id === currentBet.horseId)?.name} @ {currentBet.odds}x
              </Text>
              <TouchableOpacity onPress={clearBet}>
                <Text style={styles.clearBet}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.betBtn} onPress={handlePlaceBet}>
              <Text style={styles.betBtnText}>Place Bet</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.quickBets}>
          {[25, 50, 100, 250, 500].map((amt) => (
            <TouchableOpacity key={amt} style={styles.quickBtn} onPress={() => setBetAmount(String(amt))}>
              <Text style={styles.quickBtnText}>{amt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <TouchableOpacity
        style={[styles.startBtn, !currentBet && styles.startBtnDisabled]}
        onPress={handleStartRace}
      >
        <Text style={styles.startBtnText}>Start Race</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', paddingTop: 56 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  title: { color: '#f9fafb', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#6b7280', fontSize: 12, marginTop: 4, textTransform: 'capitalize' },
  coins: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1f2937', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  coinsText: { color: '#f59e0b', fontWeight: '700', fontSize: 15 },
  scroll: { paddingHorizontal: 16 },
  sectionTitle: { color: '#9ca3af', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginTop: 16, marginBottom: 8, letterSpacing: 1 },
  raceItem: { backgroundColor: '#1f2937', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, borderWidth: 1, borderColor: '#374151' },
  raceItemSelected: { borderColor: '#f59e0b', backgroundColor: '#1a1500' },
  raceItemLeft: { flex: 1, paddingRight: 12 },
  raceItemName: { color: '#f9fafb', fontWeight: '700', fontSize: 15 },
  raceItemMeta: { color: '#93c5fd', fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  raceDescription: { color: '#9ca3af', fontSize: 12, marginTop: 6, lineHeight: 18 },
  raceItemRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  weatherBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#0c1e38', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999 },
  weatherText: { color: '#93c5fd', fontSize: 11, textTransform: 'capitalize' },
  prizeText: { color: '#f59e0b', fontWeight: '700', fontSize: 14, marginTop: 10 },
  entryText: { color: '#10b981', fontSize: 11, marginTop: 4 },
  scoutCard: { backgroundColor: '#0f172a', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#1d4ed8', marginTop: 4 },
  scoutHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  scoutTitle: { color: '#f9fafb', fontWeight: '800', fontSize: 14 },
  scoutCopy: { color: '#93c5fd', fontSize: 13, lineHeight: 18 },
  favoritesCard: { backgroundColor: '#1f2937', borderRadius: 12, padding: 14, marginTop: 12 },
  favoriteRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  favoriteRank: { color: '#f59e0b', width: 30, fontWeight: '900', fontSize: 12 },
  favoriteCopy: { flex: 1 },
  favoriteName: { color: '#f9fafb', fontWeight: '800', fontSize: 14 },
  favoriteMeta: { color: '#94a3b8', fontSize: 12, marginTop: 3, textTransform: 'capitalize' },
  favoriteOdds: { color: '#10b981', fontWeight: '800', fontSize: 14 },
  betBox: { backgroundColor: '#1f2937', borderRadius: 12, padding: 14, marginBottom: 8 },
  insightName: { color: '#f9fafb', fontWeight: '800', fontSize: 15, marginBottom: 4 },
  insightCopy: { color: '#cbd5e1', fontSize: 13, lineHeight: 18 },
  insightMeta: { color: '#6b7280', fontSize: 12, marginTop: 8, textTransform: 'capitalize' },
  betRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  betLabel: { color: '#9ca3af', fontSize: 14 },
  betInput: { backgroundColor: '#374151', color: '#f9fafb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, fontSize: 16, minWidth: 100, textAlign: 'right' },
  potentialWin: { color: '#10b981', fontWeight: '700', fontSize: 16 },
  betBtn: { backgroundColor: '#6366f1', borderRadius: 10, padding: 12, alignItems: 'center' },
  betBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  betConfirmed: { backgroundColor: '#064e3b', borderRadius: 10, padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  betConfirmedText: { color: '#10b981', fontSize: 13, flex: 1 },
  clearBet: { color: '#ef4444', fontSize: 13, fontWeight: '700' },
  quickBets: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  quickBtn: { backgroundColor: '#374151', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  quickBtnText: { color: '#d1d5db', fontWeight: '600', fontSize: 13 },
  startBtn: { position: 'absolute', bottom: 24, left: 16, right: 16, backgroundColor: '#f59e0b', borderRadius: 14, padding: 16, alignItems: 'center' },
  startBtnDisabled: { backgroundColor: '#374151' },
  startBtnText: { color: '#000', fontWeight: '800', fontSize: 17 },
});
