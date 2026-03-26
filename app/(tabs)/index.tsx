import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getHorseRaceScore, useGameStore } from '../../lib/store';
import HorseVisual from '../../components/HorseVisual';
import TabSwipeView from '../../components/TabSwipeView';

const LEAGUE_COLORS = {
  bronze: '#d97706',
  silver: '#94a3b8',
  gold: '#f7c948',
  elite: '#8b5cf6',
  champion: '#ef4444',
} as const;

export default function HomeScreen() {
  const router = useRouter();
  const {
    coins,
    trophies,
    league,
    stable,
    dailyChallenges,
    betHistory,
    stableUpgrades,
    horseStates,
    getHorseJockey,
  } = useGameStore();

  const featuredHorse = stable[0];
  const featuredState = featuredHorse ? horseStates[featuredHorse.id] : null;
  const completedChallenges = dailyChallenges.filter((item) => item.completed).length;
  const netCoins = betHistory.reduce((sum, bet) => sum + bet.payout + bet.prizeBonus - bet.amount, 0);
  const totalWins = stable.reduce((sum, horse) => sum + horse.wins, 0);
  const nextUpgrade =
    Object.entries(stableUpgrades).sort((a, b) => a[1].level - b[1].level)[0]?.[1] ?? stableUpgrades.barn;
  const featuredJockey = featuredHorse ? getHorseJockey(featuredHorse.id) : null;
  const powerStandings = stable
    .map((horse) => ({
      horse,
      jockey: getHorseJockey(horse.id),
      score: getHorseRaceScore(horse, getHorseJockey(horse.id)),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <TabSwipeView route="index">
      <LinearGradient colors={['#07111f', '#0b1627', '#101827']} style={styles.root}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>Horse Club</Text>
              <Text style={styles.title}>Racing HQ</Text>
            </View>
            <View style={styles.wallet}>
              <Ionicons name="cash-outline" size={16} color="#f7c948" />
              <Text style={styles.walletText}>{coins.toLocaleString()}</Text>
            </View>
          </View>

          <LinearGradient colors={['#13243d', '#0f1c2f']} style={styles.hero}>
            <View style={styles.heroGlow} />
            <View style={styles.heroTop}>
              <View style={styles.leagueChip}>
                <View style={[styles.leagueDot, { backgroundColor: LEAGUE_COLORS[league] }]} />
                <Text style={styles.leagueText}>{league}</Text>
              </View>
              <View style={styles.trophyChip}>
                <Ionicons name="trophy-outline" size={16} color="#f7c948" />
                <Text style={styles.trophyText}>{trophies}</Text>
              </View>
            </View>

            <View style={styles.heroBody}>
              <View style={styles.heroCopy}>
                <Text style={styles.heroLabel}>Stable leader</Text>
                <Text style={styles.heroName}>{featuredHorse?.name ?? 'No horse selected'}</Text>
                <Text style={styles.heroMeta}>
                  {featuredHorse ? `${featuredHorse.trackPref} / ${featuredHorse.distancePref}` : 'Build your stable'}
                </Text>
                <Text style={styles.heroSub}>
                  {featuredState
                    ? `Level ${featuredState.level} / energy ${Math.round(featuredState.energy)} / jockey ${featuredJockey?.name ?? 'Unassigned'}`
                    : 'Pick up a horse from the market to begin.'}
                </Text>
              </View>
              <View style={styles.heroHorse}>
                <HorseVisual color={featuredHorse?.color ?? '#f59e0b'} size={180} mode="hero" label="stable lead" />
              </View>
            </View>

            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.primaryAction} onPress={() => router.push('/race')}>
                <Ionicons name="flag-outline" size={18} color="#111827" />
                <Text style={styles.primaryActionText}>Race now</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryAction} onPress={() => router.push('/stable')}>
                <Text style={styles.secondaryActionText}>Open stable</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{totalWins}</Text>
              <Text style={styles.metricLabel}>Wins</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={[styles.metricValue, netCoins >= 0 ? styles.good : styles.bad]}>
                {netCoins >= 0 ? '+' : ''}
                {netCoins}
              </Text>
              <Text style={styles.metricLabel}>Net coins</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{stable.length}</Text>
              <Text style={styles.metricLabel}>Horses</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today</Text>
              <TouchableOpacity onPress={() => router.push('/challenges')}>
                <Text style={styles.sectionLink}>View all</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.panel}>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="target-variant" size={18} color="#f7c948" />
                <Text style={styles.infoLabel}>Challenges complete</Text>
                <Text style={styles.infoValue}>
                  {completedChallenges}/{dailyChallenges.length}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="flash-outline" size={18} color="#f97316" />
                <Text style={styles.infoLabel}>Best next move</Text>
                <Text style={styles.infoValue}>{nextUpgrade.label} upgrade</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={18} color="#60a5fa" />
                <Text style={styles.infoLabel}>Recent races logged</Text>
                <Text style={styles.infoValue}>{betHistory.length}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Loop</Text>
            <View style={styles.panel}>
              <Text style={styles.loopLine}>Care for a horse, run a race, upgrade your stable, then scout the market.</Text>
              <Text style={styles.loopLine}>Traits and weather now matter, so rotating horses gives you a better edge.</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stable Standings</Text>
            <View style={styles.panel}>
              {powerStandings.map((entry, index) => (
                <View key={entry.horse.id} style={styles.standingRow}>
                  <Text style={styles.standingRank}>#{index + 1}</Text>
                  <View style={styles.standingInfo}>
                    <Text style={styles.standingName}>{entry.horse.name}</Text>
                    <Text style={styles.standingMeta}>
                      {entry.jockey.name} / {Math.round(entry.score)} rating
                    </Text>
                  </View>
                  <View style={[styles.standingSwatch, { backgroundColor: entry.horse.color }]} />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </TabSwipeView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, paddingTop: 48, paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  eyebrow: { color: '#7f8da3', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 },
  title: { color: '#f8fafc', fontSize: 30, fontWeight: '900', marginTop: 4 },
  wallet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#111827',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  walletText: { color: '#f8fafc', fontSize: 14, fontWeight: '900' },
  hero: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#1b2a41',
    padding: 18,
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroGlow: {
    position: 'absolute',
    right: -30,
    top: -20,
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: '#1d4ed833',
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leagueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 999,
    backgroundColor: '#0b1220aa',
    borderWidth: 1,
    borderColor: '#1c2c45',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  leagueDot: { width: 8, height: 8, borderRadius: 999 },
  leagueText: { color: '#e2e8f0', fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  trophyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: '#0b1220aa',
    borderWidth: 1,
    borderColor: '#1c2c45',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  trophyText: { color: '#f7c948', fontSize: 12, fontWeight: '900' },
  heroBody: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  heroCopy: { flex: 1, paddingRight: 10 },
  heroLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 },
  heroName: { color: '#f8fafc', fontSize: 26, fontWeight: '900', marginTop: 6 },
  heroMeta: { color: '#93c5fd', fontSize: 13, marginTop: 4, textTransform: 'capitalize' },
  heroSub: { color: '#cbd5e1', fontSize: 13, marginTop: 8, lineHeight: 18 },
  heroHorse: { alignItems: 'center', justifyContent: 'center' },
  heroActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  primaryAction: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#f59e0b',
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionText: { color: '#111827', fontWeight: '900', fontSize: 15 },
  secondaryAction: {
    borderRadius: 16,
    backgroundColor: '#101825',
    borderWidth: 1,
    borderColor: '#23344c',
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  secondaryActionText: { color: '#e2e8f0', fontWeight: '800', fontSize: 14 },
  metricsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  metricCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 14,
  },
  metricValue: { color: '#f8fafc', fontSize: 21, fontWeight: '900' },
  metricLabel: { color: '#7f8da3', fontSize: 11, marginTop: 5, textTransform: 'uppercase', letterSpacing: 0.8 },
  good: { color: '#10b981' },
  bad: { color: '#ef4444' },
  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { color: '#94a3b8', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 },
  sectionLink: { color: '#f7c948', fontSize: 12, fontWeight: '800' },
  panel: {
    borderRadius: 20,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 16,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoLabel: { color: '#dbe4f0', fontSize: 14, fontWeight: '600', flex: 1, marginLeft: 10 },
  infoValue: { color: '#f8fafc', fontSize: 13, fontWeight: '900' },
  loopLine: { color: '#cbd5e1', fontSize: 13, lineHeight: 19, marginBottom: 8 },
  standingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  standingRank: { color: '#f7c948', fontSize: 13, fontWeight: '900', width: 28 },
  standingInfo: { flex: 1 },
  standingName: { color: '#f8fafc', fontSize: 14, fontWeight: '800' },
  standingMeta: { color: '#94a3b8', fontSize: 12, marginTop: 3 },
  standingSwatch: { width: 14, height: 14, borderRadius: 999 },
});
