import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useGameStore } from '../../lib/store';
import TabSwipeView from '../../components/TabSwipeView';

export default function ChallengesScreen() {
  const router = useRouter();
  const { dailyChallenges, coins, refreshChallenges } = useGameStore();

  useEffect(() => {
    refreshChallenges();
  }, [refreshChallenges]);

  const completed = dailyChallenges.filter((challenge) => challenge.completed).length;
  const totalReward = dailyChallenges.reduce((sum, challenge) => sum + challenge.reward, 0);
  const earned = dailyChallenges
    .filter((challenge) => challenge.completed)
    .reduce((sum, challenge) => sum + challenge.reward, 0);

  return (
    <TabSwipeView route="challenges">
      <View style={styles.root}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Daily Challenges</Text>
            <Text style={styles.subtitle}>Your short session loop lives here</Text>
          </View>
          <View style={styles.coinChip}>
            <Ionicons name="cash-outline" size={16} color="#f7c948" />
            <Text style={styles.coinText}>{coins.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Today's progress</Text>
            <Text style={styles.progressValue}>
              {completed}/{dailyChallenges.length}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${dailyChallenges.length ? (completed / dailyChallenges.length) * 100 : 0}%` },
              ]}
            />
          </View>
          <Text style={styles.progressSub}>
            {earned.toLocaleString()} of {totalReward.toLocaleString()} coins earned today
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {dailyChallenges.map((challenge) => {
            const pct = Math.min(1, challenge.progress / challenge.target);
            const timeLeft = Math.max(0, challenge.expiresAt - Date.now());
            const hours = Math.floor(timeLeft / 3600000);
            const mins = Math.floor((timeLeft % 3600000) / 60000);
            return (
              <View
                key={challenge.id}
                style={[styles.challengeCard, challenge.completed && styles.challengeCardDone]}
              >
                <View style={styles.challengeTop}>
                  <View style={styles.challengeCopy}>
                    <Text style={[styles.challengeTitle, challenge.completed && styles.challengeTitleDone]}>
                      {challenge.desc}
                    </Text>
                    <Text style={styles.challengeTimer}>
                      {challenge.completed ? 'Completed' : `${hours}h ${mins}m remaining`}
                    </Text>
                  </View>
                  <View style={styles.rewardBadge}>
                    <Text style={styles.rewardText}>+{challenge.reward}</Text>
                  </View>
                </View>

                <View style={styles.progressTrackSmall}>
                  <View style={[styles.progressFillSmall, { width: `${pct * 100}%` }, challenge.completed && styles.progressFillDone]} />
                </View>
                <Text style={styles.challengeProgress}>
                  {challenge.progress} / {challenge.target}
                </Text>
              </View>
            );
          })}

          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color="#f7c948" />
              <Text style={styles.tipsTitle}>Loop tips</Text>
            </View>
            <Text style={styles.tipLine}>Feed and groom before racing if your horse mood drops.</Text>
            <Text style={styles.tipLine}>Upgrade the barn and trainer to speed up your daily cycle.</Text>
            <Text style={styles.tipLine}>Use the market after races to turn winnings into stronger horses.</Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.raceBtn} onPress={() => router.push('/race')}>
            <Text style={styles.raceBtnText}>Race now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TabSwipeView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#08101b', paddingTop: 48 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: '#f8fafc', fontSize: 28, fontWeight: '900' },
  subtitle: { color: '#7f8da3', fontSize: 12, marginTop: 4 },
  coinChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  coinText: { color: '#f8fafc', fontSize: 14, fontWeight: '900' },
  progressCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#111827',
    padding: 16,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { color: '#cbd5e1', fontSize: 15, fontWeight: '700' },
  progressValue: { color: '#f8fafc', fontSize: 16, fontWeight: '900' },
  progressTrack: { height: 12, borderRadius: 999, backgroundColor: '#1f2937', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: '#f59e0b' },
  progressSub: { color: '#7f8da3', fontSize: 12, marginTop: 10 },
  list: { paddingHorizontal: 16, paddingBottom: 120 },
  challengeCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#111827',
    padding: 16,
    marginBottom: 12,
  },
  challengeCardDone: { backgroundColor: '#09261d', borderColor: '#10b98155' },
  challengeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  challengeCopy: { flex: 1, paddingRight: 12 },
  challengeTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '800' },
  challengeTitleDone: { color: '#10b981' },
  challengeTimer: { color: '#7f8da3', fontSize: 12, marginTop: 5 },
  rewardBadge: { borderRadius: 12, backgroundColor: '#1f2937', paddingHorizontal: 12, paddingVertical: 8 },
  rewardText: { color: '#f7c948', fontSize: 16, fontWeight: '900' },
  progressTrackSmall: { height: 8, borderRadius: 999, backgroundColor: '#1f2937', overflow: 'hidden' },
  progressFillSmall: { height: '100%', borderRadius: 999, backgroundColor: '#6366f1' },
  progressFillDone: { backgroundColor: '#10b981' },
  challengeProgress: { color: '#94a3b8', fontSize: 11, marginTop: 6, fontWeight: '700' },
  tipsCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#111827',
    padding: 16,
    marginTop: 4,
  },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  tipsTitle: { color: '#f8fafc', fontSize: 14, fontWeight: '900' },
  tipLine: { color: '#cbd5e1', fontSize: 13, lineHeight: 18, marginBottom: 8 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    backgroundColor: '#08101b',
    borderTopWidth: 1,
    borderTopColor: '#101827',
  },
  raceBtn: {
    borderRadius: 18,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    paddingVertical: 16,
  },
  raceBtnText: { color: '#111827', fontSize: 17, fontWeight: '900' },
});
