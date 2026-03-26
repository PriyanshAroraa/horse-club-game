import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../../lib/store';
import HorseVisual from '../../components/HorseVisual';
import TabSwipeView from '../../components/TabSwipeView';

export default function MarketScreen() {
  const { coins, market, stable, horseStates, buyHorse, sellHorse, getMarketPrice, stableUpgrades } = useGameStore();
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [preview, setPreview] = useState<string | null>(null);

  const availableForSale = market.filter((horse) => horse.forSale && !stable.find((owned) => owned.id === horse.id));

  function handleBuy(id: string) {
    const horse = market.find((item) => item.id === id);
    if (!horse) return;
    const price = getMarketPrice(horse);
    if (coins < price) {
      Alert.alert('Not enough coins', `You need ${price.toLocaleString()} coins.`);
      return;
    }
    Alert.alert(`Buy ${horse.name}?`, `Final price: ${price.toLocaleString()} coins`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Buy', onPress: () => buyHorse(horse) },
    ]);
  }

  function handleSell(id: string) {
    if (stable.length <= 1) {
      Alert.alert('Last horse locked', 'You need at least one horse in the stable.');
      return;
    }
    const horse = stable.find((item) => item.id === id);
    if (!horse) return;
    const price = Math.floor(1000 + horse.wins * 100 + horse.races * 20);
    Alert.alert(`Sell ${horse.name}?`, `You will receive ${price.toLocaleString()} coins.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sell', style: 'destructive', onPress: () => sellHorse(id) },
    ]);
  }

  return (
    <TabSwipeView route="market">
      <View style={styles.root}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Horse Market</Text>
            <Text style={styles.subtitle}>Scout rare bloodlines and flip underused racers</Text>
          </View>
          <View style={styles.coinsBox}>
            <Ionicons name="cash-outline" size={16} color="#f7c948" />
            <Text style={styles.coinsText}>{coins.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Scout level {stableUpgrades.scout.level}</Text>
          <Text style={styles.tipCopy}>
            Every scout upgrade reduces market buy prices and improves your decision making.
          </Text>
        </View>

        <View style={styles.tabs}>
          {(['buy', 'sell'] as const).map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.tab, tab === item && styles.tabActive]}
              onPress={() => setTab(item)}
            >
              <Text style={[styles.tabText, tab === item && styles.tabTextActive]}>
                {item === 'buy' ? 'Buy horses' : 'Sell horses'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {tab === 'buy'
            ? availableForSale.map((horse) => {
                const price = getMarketPrice(horse);
                const canAfford = coins >= price;
                const isOpen = preview === horse.id;
                return (
                  <View key={horse.id} style={[styles.card, { borderColor: `${horse.color}55` }]}>
                    <TouchableOpacity onPress={() => setPreview(isOpen ? null : horse.id)}>
                      <View style={styles.cardTop}>
                        <HorseVisual color={horse.color} size={82} mode="card" />
                        <View style={styles.cardInfo}>
                          <Text style={[styles.cardName, { color: horse.color }]}>{horse.name}</Text>
                          <Text style={styles.cardMeta}>
                            {horse.trackPref} / {horse.distancePref} / {horse.rarity}
                          </Text>
                          <Text style={styles.cardMeta}>Trait: {horse.trait.replace('_', ' ')}</Text>
                          <Text style={styles.cardRecord}>{horse.wins} wins / {horse.races} races</Text>
                        </View>
                      </View>
                    </TouchableOpacity>

                    {isOpen ? (
                      <View style={styles.previewPanel}>
                        <View style={styles.statChip}>
                          <Text style={styles.statValue}>{horse.speed}</Text>
                          <Text style={styles.statLabel}>SPD</Text>
                        </View>
                        <View style={styles.statChip}>
                          <Text style={styles.statValue}>{horse.stamina}</Text>
                          <Text style={styles.statLabel}>STA</Text>
                        </View>
                        <View style={styles.statChip}>
                          <Text style={styles.statValue}>{horse.acceleration}</Text>
                          <Text style={styles.statLabel}>ACC</Text>
                        </View>
                        <View style={styles.statChip}>
                          <Text style={styles.statValue}>{horse.consistency}</Text>
                          <Text style={styles.statLabel}>CON</Text>
                        </View>
                      </View>
                    ) : null}

                    <View style={styles.buyRow}>
                      <View>
                        <Text style={styles.priceLabel}>Final price</Text>
                        <Text style={[styles.priceValue, !canAfford && styles.priceValuePoor]}>{price.toLocaleString()}</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.buyBtn, !canAfford && styles.buyBtnDisabled]}
                        onPress={() => handleBuy(horse.id)}
                      >
                        <Text style={[styles.buyBtnText, !canAfford && styles.buyBtnTextDisabled]}>
                          {canAfford ? 'Buy' : 'Too expensive'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            : stable.map((horse) => {
                const state = horseStates[horse.id];
                const price = Math.floor(1000 + horse.wins * 100 + horse.races * 20);
                return (
                  <View key={horse.id} style={[styles.card, { borderColor: `${horse.color}55` }]}>
                    <View style={styles.cardTop}>
                      <HorseVisual color={horse.color} size={76} mode="card" />
                      <View style={styles.cardInfo}>
                        <Text style={[styles.cardName, { color: horse.color }]}>{horse.name}</Text>
                        <Text style={styles.cardMeta}>
                          Level {state?.level ?? 1} / {horse.trackPref} / {horse.distancePref}
                        </Text>
                        <Text style={styles.cardRecord}>{horse.wins} wins / {horse.races} races</Text>
                      </View>
                    </View>

                    <View style={styles.buyRow}>
                      <View>
                        <Text style={styles.priceLabel}>Sell value</Text>
                        <Text style={styles.sellValue}>{price.toLocaleString()}</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.sellBtn, stable.length <= 1 && styles.sellBtnDisabled]}
                        onPress={() => handleSell(horse.id)}
                      >
                        <Text style={styles.sellBtnText}>Sell</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

          <View style={{ height: 34 }} />
        </ScrollView>
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
  subtitle: { color: '#7f8da3', fontSize: 12, marginTop: 4, maxWidth: 220 },
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
  tipCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1d4ed8',
    backgroundColor: '#0d1d37',
    padding: 14,
  },
  tipTitle: { color: '#dbeafe', fontSize: 14, fontWeight: '900' },
  tipCopy: { color: '#93c5fd', fontSize: 13, lineHeight: 18, marginTop: 6 },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#111827',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 4,
  },
  tab: { flex: 1, alignItems: 'center', borderRadius: 12, paddingVertical: 10 },
  tabActive: { backgroundColor: '#1b2942' },
  tabText: { color: '#7f8da3', fontSize: 13, fontWeight: '800' },
  tabTextActive: { color: '#f8fafc' },
  list: { paddingHorizontal: 16, paddingBottom: 120 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: '#111827',
    padding: 16,
    marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardName: { fontSize: 18, fontWeight: '900' },
  cardMeta: { color: '#94a3b8', fontSize: 12, marginTop: 4, textTransform: 'capitalize' },
  cardRecord: { color: '#64748b', fontSize: 12, marginTop: 5 },
  previewPanel: {
    marginTop: 14,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 16,
    backgroundColor: '#0f172a',
    padding: 12,
  },
  statChip: { alignItems: 'center', flex: 1 },
  statValue: { color: '#f8fafc', fontSize: 18, fontWeight: '900' },
  statLabel: { color: '#7f8da3', fontSize: 11, marginTop: 4, fontWeight: '800' },
  buyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { color: '#7f8da3', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  priceValue: { color: '#f7c948', fontSize: 20, fontWeight: '900', marginTop: 4 },
  priceValuePoor: { color: '#ef4444' },
  sellValue: { color: '#10b981', fontSize: 20, fontWeight: '900', marginTop: 4 },
  buyBtn: { borderRadius: 14, backgroundColor: '#f59e0b', paddingHorizontal: 16, paddingVertical: 12 },
  buyBtnDisabled: { backgroundColor: '#293244' },
  buyBtnText: { color: '#111827', fontSize: 13, fontWeight: '900' },
  buyBtnTextDisabled: { color: '#94a3b8' },
  sellBtn: { borderRadius: 14, backgroundColor: '#ef4444', paddingHorizontal: 16, paddingVertical: 12 },
  sellBtnDisabled: { backgroundColor: '#293244' },
  sellBtnText: { color: '#fff', fontSize: 13, fontWeight: '900' },
});
