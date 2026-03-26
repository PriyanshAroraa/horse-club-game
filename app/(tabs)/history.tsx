import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../../lib/store';
import TabSwipeView from '../../components/TabSwipeView';

export default function HistoryScreen() {
  const { betHistory, coins, trophies, league } = useGameStore();

  const totalBet = betHistory.reduce((sum, bet) => sum + bet.amount, 0);
  const totalWon = betHistory.reduce((sum, bet) => sum + bet.payout + bet.prizeBonus, 0);
  const wins = betHistory.filter((bet) => bet.won).length;
  const net = totalWon - totalBet;

  return (
    <TabSwipeView route="history">
      <View style={styles.root}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Race History</Text>
            <Text style={styles.subtitle}>
              {league} league / {trophies} trophies
            </Text>
          </View>
          <View style={styles.coinsBox}>
            <Ionicons name="cash-outline" size={16} color="#f7c948" />
            <Text style={styles.coinsText}>{coins.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{betHistory.length}</Text>
            <Text style={styles.summaryLabel}>Races</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, styles.good]}>{wins}</Text>
            <Text style={styles.summaryLabel}>Wins</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, net >= 0 ? styles.good : styles.bad]}>
              {net >= 0 ? '+' : ''}
              {net}
            </Text>
            <Text style={styles.summaryLabel}>Net</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {betHistory.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No races logged yet</Text>
              <Text style={styles.emptySub}>Run a race to start building your stable story.</Text>
            </View>
          ) : (
            betHistory.map((bet, index) => (
              <View key={`${bet.raceId}-${bet.date}-${index}`} style={[styles.row, bet.won ? styles.rowWin : styles.rowLose]}>
                <View style={styles.rowLeft}>
                  <Text style={styles.rowTitle}>{bet.raceName}</Text>
                  <Text style={styles.rowHorse}>
                    {bet.horseName} / {bet.amount} coins / {bet.odds}x
                  </Text>
                  <Text style={styles.rowMeta}>
                    {new Date(bet.date).toLocaleDateString()} / trophies {bet.trophiesDelta > 0 ? '+' : ''}
                    {bet.trophiesDelta}
                  </Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={[styles.rowPayout, bet.won ? styles.good : styles.bad]}>
                    {bet.won ? `+${(bet.payout + bet.prizeBonus).toLocaleString()}` : `-${bet.amount.toLocaleString()}`}
                  </Text>
                  {bet.won ? <Text style={styles.prizeText}>prize {bet.prizeBonus}</Text> : null}
                </View>
              </View>
            ))
          )}
          <View style={{ height: 34 }} />
        </ScrollView>
      </View>
    </TabSwipeView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#08101b', paddingTop: 48, paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { color: '#f8fafc', fontSize: 28, fontWeight: '900' },
  subtitle: { color: '#7f8da3', fontSize: 12, marginTop: 4, textTransform: 'capitalize' },
  coinsBox: {
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
  coinsText: { color: '#f8fafc', fontSize: 14, fontWeight: '900' },
  summary: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#111827',
    padding: 14,
  },
  summaryValue: { color: '#f8fafc', fontSize: 21, fontWeight: '900' },
  summaryLabel: { color: '#7f8da3', fontSize: 11, marginTop: 5, textTransform: 'uppercase', letterSpacing: 0.8 },
  good: { color: '#10b981' },
  bad: { color: '#ef4444' },
  list: { paddingBottom: 120 },
  empty: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#111827',
    padding: 22,
    marginTop: 10,
  },
  emptyTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '900' },
  emptySub: { color: '#94a3b8', fontSize: 13, marginTop: 6, lineHeight: 18 },
  row: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowWin: { backgroundColor: '#09261d', borderColor: '#10b98155' },
  rowLose: { backgroundColor: '#111827', borderColor: '#1f2937' },
  rowLeft: { flex: 1, paddingRight: 10 },
  rowTitle: { color: '#f8fafc', fontSize: 15, fontWeight: '900' },
  rowHorse: { color: '#cbd5e1', fontSize: 13, marginTop: 6 },
  rowMeta: { color: '#7f8da3', fontSize: 12, marginTop: 8 },
  rowRight: { alignItems: 'flex-end', justifyContent: 'center' },
  rowPayout: { fontSize: 20, fontWeight: '900' },
  prizeText: { color: '#f7c948', fontSize: 11, marginTop: 6, fontWeight: '800' },
});
