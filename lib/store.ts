import { create } from 'zustand';
import { Distance, HorseStats, TrackType, describeTrait } from './simulation';
import { STARTER_HORSES, RACE_CONFIGS } from './horses';

export type RaceConfig = typeof RACE_CONFIGS[number];
export type HorseMood = 'happy' | 'tired' | 'hungry' | 'injured' | 'excited';
export type LeagueKey = 'bronze' | 'silver' | 'gold' | 'elite' | 'champion';
export type StableUpgradeKey = 'barn' | 'trainer' | 'scout';
export type JockeyId = 'mara' | 'cole' | 'ines' | 'toma' | 'suri';

export interface Jockey {
  id: JockeyId;
  name: string;
  color: string;
  bonus: number;
  specialtyTrack: TrackType;
  specialtyDistance: Distance;
  skill: string;
}

export interface HorseState {
  id: string;
  energy: number;
  mood: HorseMood;
  xp: number;
  level: number;
  hunger: number;
  cleanliness: number;
  isTraining: boolean;
  trainingEndsAt: number | null;
  lastCaredAt: number;
  bonusSpeed: number;
  bonusStamina: number;
  bonusAcceleration: number;
}

export interface DailyChallenge {
  id: string;
  desc: string;
  target: number;
  progress: number;
  reward: number;
  type:
    | 'win_races'
    | 'place_bets'
    | 'feed_horse'
    | 'train_horse'
    | 'earn_coins'
    | 'upgrade_stable';
  completed: boolean;
  expiresAt: number;
}

export interface MarketHorse extends HorseStats {
  price: number;
  forSale: boolean;
}

export interface BetRecord {
  raceId: string;
  raceName: string;
  horseId: string;
  horseName: string;
  amount: number;
  odds: number;
  won: boolean;
  payout: number;
  prizeBonus: number;
  trophiesDelta: number;
  date: number;
}

interface StableUpgradeState {
  level: number;
  label: string;
  desc: string;
}

interface GameState {
  coins: number;
  trophies: number;
  league: LeagueKey;
  stable: HorseStats[];
  horseStates: Record<string, HorseState>;
  selectedHorseId: string | null;
  betHistory: BetRecord[];
  currentRaceConfig: RaceConfig | null;
  currentBet: { horseId: string; amount: number; odds: number } | null;
  dailyChallenges: DailyChallenge[];
  market: MarketHorse[];
  stableUpgrades: Record<StableUpgradeKey, StableUpgradeState>;
  jockeys: Jockey[];
  horseJockeys: Record<string, JockeyId>;
  lastDailyRefresh: number;

  feedHorse: (id: string) => void;
  groomHorse: (id: string) => void;
  restHorse: (id: string) => void;
  startTraining: (id: string, type: 'speed' | 'stamina' | 'acceleration') => void;
  collectTraining: (id: string) => void;
  tickHorseState: (id: string) => void;

  selectHorse: (id: string) => void;
  setRace: (race: RaceConfig) => void;
  placeBet: (horseId: string, amount: number, odds: number) => void;
  clearBet: () => void;
  settleRace: (winnerIds: string[]) => void;
  addCoins: (amount: number) => void;
  updateHorseStats: (id: string, won: boolean) => void;
  buyHorse: (horse: MarketHorse) => void;
  sellHorse: (id: string) => void;
  refreshChallenges: () => void;
  progressChallenge: (type: DailyChallenge['type'], amount?: number) => void;
  upgradeStable: (key: StableUpgradeKey) => void;
  getUpgradeCost: (key: StableUpgradeKey) => number;
  getMarketPrice: (horse: MarketHorse) => number;
  assignJockey: (horseId: string, jockeyId: JockeyId) => void;
  getHorseJockey: (horseId: string) => Jockey;
}

const JOCKEYS: Jockey[] = [
  { id: 'mara', name: 'Mara Vale', color: '#ef4444', bonus: 3, specialtyTrack: 'dirt', specialtyDistance: 'sprint', skill: 'Sharp gate breaks and aggressive early pace.' },
  { id: 'cole', name: 'Cole Mercer', color: '#0ea5e9', bonus: 4, specialtyTrack: 'synthetic', specialtyDistance: 'mile', skill: 'Smooth tempo control through technical middle splits.' },
  { id: 'ines', name: 'Ines Sol', color: '#f59e0b', bonus: 5, specialtyTrack: 'turf', specialtyDistance: 'long', skill: 'Late patience and strong closing timing.' },
  { id: 'toma', name: 'Toma Redd', color: '#10b981', bonus: 2, specialtyTrack: 'dirt', specialtyDistance: 'mile', skill: 'Reliable under changing track conditions.' },
  { id: 'suri', name: 'Suri Knox', color: '#8b5cf6', bonus: 4, specialtyTrack: 'turf', specialtyDistance: 'sprint', skill: 'Confident rail runs and calm under pressure.' },
];

function defaultHorseState(id: string): HorseState {
  return {
    id,
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
}

function calcMood(hs: HorseState): HorseMood {
  if (hs.energy < 20) return 'tired';
  if (hs.hunger < 25) return 'hungry';
  if (hs.cleanliness < 20) return 'injured';
  if (hs.energy > 80 && hs.hunger > 70) return 'excited';
  return 'happy';
}

function leagueFromTrophies(trophies: number): LeagueKey {
  if (trophies >= 600) return 'champion';
  if (trophies >= 350) return 'elite';
  if (trophies >= 200) return 'gold';
  if (trophies >= 80) return 'silver';
  return 'bronze';
}

function makeChallenges(): DailyChallenge[] {
  const tomorrow = Date.now() + 86400000;
  return [
    { id: 'c1', desc: 'Win 1 race today', target: 1, progress: 0, reward: 300, type: 'win_races', completed: false, expiresAt: tomorrow },
    { id: 'c2', desc: 'Place 3 bets', target: 3, progress: 0, reward: 150, type: 'place_bets', completed: false, expiresAt: tomorrow },
    { id: 'c3', desc: 'Feed your horse 2 times', target: 2, progress: 0, reward: 100, type: 'feed_horse', completed: false, expiresAt: tomorrow },
    { id: 'c4', desc: 'Complete a training session', target: 1, progress: 0, reward: 250, type: 'train_horse', completed: false, expiresAt: tomorrow },
    { id: 'c5', desc: 'Earn 500 coins from races and bets', target: 500, progress: 0, reward: 400, type: 'earn_coins', completed: false, expiresAt: tomorrow },
    { id: 'c6', desc: 'Upgrade your stable once', target: 1, progress: 0, reward: 250, type: 'upgrade_stable', completed: false, expiresAt: tomorrow },
  ];
}

const MARKET_HORSES: MarketHorse[] = [
  { id: 'blazer', name: 'Desert Blazer', emoji: '🌵', color: '#DC8A0E', speed: 92, stamina: 68, acceleration: 88, consistency: 72, trackPref: 'dirt', distancePref: 'sprint', jockeyBonus: 8, wins: 12, races: 30, trait: 'mud_runner', rarity: 'rare', price: 2500, forSale: true },
  { id: 'neptune', name: 'Neptune', emoji: '🌊', color: '#0EA5E9', speed: 75, stamina: 95, acceleration: 60, consistency: 92, trackPref: 'turf', distancePref: 'long', jockeyBonus: 9, wins: 8, races: 20, trait: 'iron_will', rarity: 'elite', price: 3000, forSale: true },
  { id: 'phantom', name: 'Phantom Strike', emoji: '👻', color: '#8B5CF6', speed: 96, stamina: 50, acceleration: 95, consistency: 45, trackPref: 'synthetic', distancePref: 'sprint', jockeyBonus: 5, wins: 18, races: 28, trait: 'fast_start', rarity: 'elite', price: 4500, forSale: true },
  { id: 'duchess', name: 'Duchess Rose', emoji: '🌹', color: '#F43F5E', speed: 82, stamina: 82, acceleration: 78, consistency: 88, trackPref: 'turf', distancePref: 'mile', jockeyBonus: 10, wins: 22, races: 40, trait: 'steady_heart', rarity: 'elite', price: 5000, forSale: true },
];

const TRAINING_DURATION = 30000;
const TRAINING_COST = 200;
const FEED_COST = 50;
const GROOM_COST = 75;

export const useGameStore = create<GameState>((set, get) => ({
  coins: 1000,
  trophies: 0,
  league: 'bronze',
  stable: STARTER_HORSES,
  horseStates: Object.fromEntries(STARTER_HORSES.map((h) => [h.id, defaultHorseState(h.id)])),
  selectedHorseId: STARTER_HORSES[0].id,
  betHistory: [],
  currentRaceConfig: null,
  currentBet: null,
  dailyChallenges: makeChallenges(),
  market: MARKET_HORSES,
  stableUpgrades: {
    barn: { level: 0, label: 'Barn', desc: 'Boosts care actions and passive recovery.' },
    trainer: { level: 0, label: 'Trainer', desc: 'Improves training gains and lowers training cost.' },
    scout: { level: 0, label: 'Scout', desc: 'Unlocks better market prices and race intel.' },
  },
  jockeys: JOCKEYS,
  horseJockeys: {
    thunderbolt: 'mara',
    midnight: 'ines',
    crimson: 'suri',
    stormy: 'cole',
    golden: 'toma',
    shadow: 'cole',
  },
  lastDailyRefresh: Date.now(),

  feedHorse: (id) => {
    const { coins, horseStates, stableUpgrades } = get();
    if (coins < FEED_COST) return;
    const hs = horseStates[id];
    if (!hs) return;
    const barnBoost = stableUpgrades.barn.level * 4;
    const updated = {
      ...hs,
      hunger: Math.min(100, hs.hunger + 35 + barnBoost),
      energy: Math.min(100, hs.energy + 10 + Math.floor(barnBoost / 2)),
    };
    updated.mood = calcMood(updated);
    set({ coins: coins - FEED_COST, horseStates: { ...horseStates, [id]: updated } });
    get().progressChallenge('feed_horse');
  },

  groomHorse: (id) => {
    const { coins, horseStates, stableUpgrades } = get();
    if (coins < GROOM_COST) return;
    const hs = horseStates[id];
    if (!hs) return;
    const updated = {
      ...hs,
      cleanliness: Math.min(100, hs.cleanliness + 40 + stableUpgrades.barn.level * 5),
      mood: 'happy' as HorseMood,
    };
    set({ coins: coins - GROOM_COST, horseStates: { ...horseStates, [id]: updated } });
  },

  restHorse: (id) => {
    const { horseStates, stableUpgrades } = get();
    const hs = horseStates[id];
    if (!hs) return;
    const updated = {
      ...hs,
      energy: Math.min(100, hs.energy + 40 + stableUpgrades.barn.level * 5),
      mood: 'happy' as HorseMood,
    };
    set({ horseStates: { ...horseStates, [id]: updated } });
  },

  startTraining: (id, type) => {
    const { coins, horseStates, stableUpgrades } = get();
    const trainerLevel = stableUpgrades.trainer.level;
    const cost = Math.max(120, TRAINING_COST - trainerLevel * 20);
    if (coins < cost) return;
    const hs = horseStates[id];
    if (!hs || hs.isTraining || hs.energy < 30) return;
    const updated = {
      ...hs,
      isTraining: true,
      trainingEndsAt: Date.now() + Math.max(15000, TRAINING_DURATION - trainerLevel * 3000),
      energy: Math.max(0, hs.energy - 30),
      mood: 'tired' as HorseMood,
    };
    set({ coins: coins - cost, horseStates: { ...horseStates, [id]: updated } });
  },

  collectTraining: (id) => {
    const { horseStates, stable, stableUpgrades } = get();
    const hs = horseStates[id];
    if (!hs || !hs.isTraining) return;
    if (hs.trainingEndsAt && Date.now() < hs.trainingEndsAt) return;
    const xpGain = 50 + Math.floor(Math.random() * 30) + stableUpgrades.trainer.level * 12;
    const statGain = 1 + Math.floor(stableUpgrades.trainer.level / 2);
    const newXp = hs.xp + xpGain;
    const newLevel = Math.floor(newXp / 100) + 1;
    const leveledUp = newLevel > hs.level;
    const updated = {
      ...hs,
      isTraining: false,
      trainingEndsAt: null,
      xp: newXp,
      level: newLevel,
      bonusSpeed: hs.bonusSpeed + statGain,
      bonusStamina: hs.bonusStamina + (leveledUp ? statGain : 0),
      bonusAcceleration: hs.bonusAcceleration + (leveledUp ? 1 : 0),
      mood: 'happy' as HorseMood,
    };
    const updatedStable = stable.map((h) => (
      h.id === id ? { ...h, speed: Math.min(99, h.speed + 1), stamina: Math.min(99, h.stamina + (leveledUp ? 1 : 0)) } : h
    ));
    set({ horseStates: { ...horseStates, [id]: updated }, stable: updatedStable });
    get().progressChallenge('train_horse');
  },

  tickHorseState: (id) => {
    const { horseStates, stableUpgrades } = get();
    const hs = horseStates[id];
    if (!hs) return;
    const decayReduction = stableUpgrades.barn.level;
    const updated = {
      ...hs,
      hunger: Math.max(0, hs.hunger - Math.max(1, 2 - Math.floor(decayReduction / 2))),
      cleanliness: Math.max(0, hs.cleanliness - Math.max(1, 1 - Math.floor(decayReduction / 3))),
    };
    updated.mood = calcMood(updated);
    set({ horseStates: { ...horseStates, [id]: updated } });
  },

  selectHorse: (id) => set({ selectedHorseId: id }),

  setRace: (race) => set({ currentRaceConfig: race }),

  placeBet: (horseId, amount, odds) => {
    const { coins } = get();
    if (amount > coins) return;
    set({ currentBet: { horseId, amount, odds } });
    get().progressChallenge('place_bets');
  },

  clearBet: () => set({ currentBet: null }),

  settleRace: (winnerIds) => {
    const { currentBet, currentRaceConfig, coins, betHistory, horseStates } = get();
    if (!currentBet || !currentRaceConfig) return;

    const won = winnerIds[0] === currentBet.horseId;
    const payout = won ? Math.floor(currentBet.amount * currentBet.odds) : 0;
    const prizeBonus = won ? currentRaceConfig.prizePool : 0;
    const net = payout + prizeBonus - currentBet.amount;
    const trophiesDelta = won ? currentRaceConfig.trophyReward : -Math.max(6, Math.round(currentRaceConfig.trophyReward * 0.3));
    const nextTrophies = Math.max(0, get().trophies + trophiesDelta);

    const record: BetRecord = {
      raceId: currentRaceConfig.id,
      raceName: currentRaceConfig.name,
      horseId: currentBet.horseId,
      horseName: get().stable.find((h) => h.id === currentBet.horseId)?.name ?? '',
      amount: currentBet.amount,
      odds: currentBet.odds,
      won,
      payout,
      prizeBonus,
      trophiesDelta,
      date: Date.now(),
    };

    const hs = horseStates[currentBet.horseId];
    if (hs) {
      const updatedHs = {
        ...hs,
        energy: Math.max(0, hs.energy - 25),
        xp: hs.xp + (won ? 30 : 15),
      };
      updatedHs.mood = calcMood(updatedHs);
      set({ horseStates: { ...horseStates, [currentBet.horseId]: updatedHs } });
    }

    set({
      coins: coins + net,
      trophies: nextTrophies,
      league: leagueFromTrophies(nextTrophies),
      betHistory: [record, ...betHistory].slice(0, 50),
      currentBet: null,
    });
    get().updateHorseStats(currentBet.horseId, won);
    if (won) get().progressChallenge('win_races');
    if (net > 0) get().progressChallenge('earn_coins', net);
  },

  addCoins: (amount) => set((s) => ({ coins: s.coins + amount })),

  updateHorseStats: (id, won) =>
    set((s) => ({
      stable: s.stable.map((h) => (
        h.id === id ? { ...h, races: h.races + 1, wins: h.wins + (won ? 1 : 0) } : h
      )),
    })),

  buyHorse: (horse) => {
    const { coins, stable, horseStates, market } = get();
    const finalPrice = get().getMarketPrice(horse);
    if (coins < finalPrice) return;
    const { price, forSale, ...horseStats } = horse;
    set({
      coins: coins - finalPrice,
      stable: [...stable, horseStats],
      horseStates: { ...horseStates, [horse.id]: defaultHorseState(horse.id) },
      market: market.map((m) => (m.id === horse.id ? { ...m, forSale: false } : m)),
    });
  },

  sellHorse: (id) => {
    const { stable, horseStates, coins } = get();
    if (stable.length <= 1) return;
    const horse = stable.find((h) => h.id === id);
    if (!horse) return;
    const sellPrice = Math.floor(1000 + horse.wins * 100 + horse.races * 20);
    const newHorseStates = { ...horseStates };
    delete newHorseStates[id];
    set({
      coins: coins + sellPrice,
      stable: stable.filter((h) => h.id !== id),
      horseStates: newHorseStates,
      selectedHorseId: stable.find((h) => h.id !== id)?.id ?? null,
    });
  },

  refreshChallenges: () => {
    const { lastDailyRefresh } = get();
    if (Date.now() - lastDailyRefresh < 86400000) return;
    set({ dailyChallenges: makeChallenges(), lastDailyRefresh: Date.now() });
  },

  progressChallenge: (type, amount = 1) => {
    const { dailyChallenges, coins } = get();
    let coinsEarned = 0;
    const updated = dailyChallenges.map((c) => {
      if (c.completed || c.type !== type) return c;
      const newProgress = c.type === 'earn_coins' ? c.progress + amount : c.progress + 1;
      const completed = newProgress >= c.target;
      if (completed && !c.completed) coinsEarned += c.reward;
      return { ...c, progress: Math.min(newProgress, c.target), completed };
    });
    set({ dailyChallenges: updated, coins: coins + coinsEarned });
  },

  upgradeStable: (key) => {
    const { stableUpgrades, coins } = get();
    const cost = get().getUpgradeCost(key);
    if (coins < cost) return;
    set({
      coins: coins - cost,
      stableUpgrades: {
        ...stableUpgrades,
        [key]: { ...stableUpgrades[key], level: stableUpgrades[key].level + 1 },
      },
    });
    get().progressChallenge('upgrade_stable');
  },

  getUpgradeCost: (key) => {
    const level = get().stableUpgrades[key].level;
    const base = key === 'barn' ? 400 : key === 'trainer' ? 550 : 700;
    return base + level * (base * 0.65);
  },

  getMarketPrice: (horse) => {
    const discount = get().stableUpgrades.scout.level * 0.05;
    return Math.max(500, Math.round(horse.price * (1 - discount)));
  },

  assignJockey: (horseId, jockeyId) =>
    set((state) => ({
      horseJockeys: {
        ...state.horseJockeys,
        [horseId]: jockeyId,
      },
    })),

  getHorseJockey: (horseId) => {
    const assigned = get().horseJockeys[horseId] ?? 'mara';
    return get().jockeys.find((jockey) => jockey.id === assigned) ?? JOCKEYS[0];
  },
}));

export function getTraitSummary(horse: HorseStats) {
  return describeTrait(horse.trait);
}

export function getHorseRaceScore(
  horse: HorseStats,
  jockey: Jockey,
  race?: Pick<RaceConfig, 'track' | 'distance'>,
) {
  const trackBoost = race && jockey.specialtyTrack === race.track ? 3 : 0;
  const distanceBoost = race && jockey.specialtyDistance === race.distance ? 2 : 0;
  const specialtyBoost = trackBoost + distanceBoost;

  return (
    horse.speed * 0.34 +
    horse.stamina * 0.26 +
    horse.acceleration * 0.18 +
    horse.consistency * 0.12 +
    horse.wins * 1.5 +
    horse.races * 0.15 +
    jockey.bonus * 4 +
    specialtyBoost
  );
}
