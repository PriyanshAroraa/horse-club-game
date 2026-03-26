import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { HorseStats } from '../lib/simulation';
import HorseVisual from './HorseVisual';

interface Props {
  horse: HorseStats;
  selected?: boolean;
  odds?: number;
  onPress?: () => void;
  compact?: boolean;
}

function StatBar({ value, color }: { value: number; color: string }) {
  return (
    <View style={styles.statBarBg}>
      <View style={[styles.statBarFill, { width: `${value}%`, backgroundColor: color }]} />
    </View>
  );
}

export default function HorseCard({ horse, selected, odds, onPress, compact }: Props) {
  const winRate = horse.races > 0 ? Math.round((horse.wins / horse.races) * 100) : 0;

  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected, { borderColor: horse.color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <HorseVisual color={horse.color} size={54} mode="card" />
        <View style={styles.nameBlock}>
          <Text style={styles.name}>{horse.name}</Text>
          <Text style={styles.sub}>{horse.trackPref} / {horse.distancePref}</Text>
          <Text style={styles.trait}>{horse.trait.replace('_', ' ')}</Text>
        </View>
        {odds !== undefined ? (
          <View style={styles.oddsBadge}>
            <Text style={styles.oddsText}>{odds}x</Text>
          </View>
        ) : (
          <View style={styles.recordBadge}>
            <Text style={styles.recordText}>{horse.wins}W / {horse.races}R</Text>
            {horse.races > 0 && <Text style={styles.winRate}>{winRate}%</Text>}
          </View>
        )}
      </View>

      {!compact && (
        <View style={styles.stats}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>SPD</Text>
            <StatBar value={horse.speed} color="#f59e0b" />
            <Text style={styles.statVal}>{horse.speed}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>STA</Text>
            <StatBar value={horse.stamina} color="#10b981" />
            <Text style={styles.statVal}>{horse.stamina}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>ACC</Text>
            <StatBar value={horse.acceleration} color="#6366f1" />
            <Text style={styles.statVal}>{horse.acceleration}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>CON</Text>
            <StatBar value={horse.consistency} color="#ec4899" />
            <Text style={styles.statVal}>{horse.consistency}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#374151',
  },
  cardSelected: {
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameBlock: {
    flex: 1,
    marginLeft: 10,
  },
  name: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '700',
  },
  sub: {
    color: '#9ca3af',
    fontSize: 11,
    textTransform: 'capitalize',
  },
  trait: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  oddsBadge: {
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  oddsText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 14,
  },
  recordBadge: {
    alignItems: 'flex-end',
  },
  recordText: {
    color: '#9ca3af',
    fontSize: 11,
  },
  winRate: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '700',
  },
  stats: {
    gap: 5,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    color: '#6b7280',
    fontSize: 10,
    width: 28,
    fontWeight: '600',
  },
  statBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  statVal: {
    color: '#d1d5db',
    fontSize: 10,
    width: 24,
    textAlign: 'right',
  },
});
