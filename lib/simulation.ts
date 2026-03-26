export type TrackType = 'dirt' | 'turf' | 'synthetic';
export type Distance = 'sprint' | 'mile' | 'long';
export type Weather = 'sunny' | 'overcast' | 'rain' | 'windy';
export type HorseTrait =
  | 'fast_start'
  | 'mud_runner'
  | 'closer'
  | 'steady_heart'
  | 'crowd_favorite'
  | 'iron_will';

export interface HorseStats {
  id: string;
  name: string;
  emoji: string;
  color: string;
  speed: number;
  stamina: number;
  acceleration: number;
  consistency: number;
  trackPref: TrackType;
  distancePref: Distance;
  jockeyBonus: number;
  wins: number;
  races: number;
  trait: HorseTrait;
  rarity: 'common' | 'rare' | 'elite';
}

export interface RaceHorse extends HorseStats {
  position: number;
  currentSpeed: number;
  lane: number;
  finished: boolean;
  finishTime?: number;
}

export interface RaceConfig {
  track: TrackType;
  distance: Distance;
  weather: Weather;
  horses: HorseStats[];
}

export interface RaceFrame {
  tick: number;
  horses: { id: string; position: number; lane: number; finished: boolean }[];
  finished: boolean;
  results?: string[];
}

const DISTANCE_TICKS: Record<Distance, number> = {
  sprint: 80,
  mile: 140,
  long: 200,
};

const TRACK_MODIFIER: Record<TrackType, (h: HorseStats) => number> = {
  dirt: (h) => (h.trackPref === 'dirt' ? 1.08 : 0.95),
  turf: (h) => (h.trackPref === 'turf' ? 1.08 : 0.95),
  synthetic: (h) => (h.trackPref === 'synthetic' ? 1.05 : 1.0),
};

const DISTANCE_MODIFIER: Record<Distance, (h: HorseStats) => number> = {
  sprint: (h) => 0.6 + (h.acceleration / 100) * 0.4 + (h.distancePref === 'sprint' ? 0.05 : 0),
  mile: (h) => 0.5 + ((h.speed + h.stamina) / 200) * 0.5 + (h.distancePref === 'mile' ? 0.05 : 0),
  long: (h) => 0.4 + (h.stamina / 100) * 0.6 + (h.distancePref === 'long' ? 0.05 : 0),
};

const WEATHER_MODIFIER: Record<Weather, (h: HorseStats, track: TrackType) => number> = {
  sunny: () => 1,
  overcast: () => 1.01,
  rain: (h, track) => {
    if (h.trait === 'mud_runner') return 1.12;
    if (track === 'dirt' && h.trackPref === 'dirt') return 1.05;
    if (h.consistency < 68) return 0.94;
    return 0.98;
  },
  windy: (h) => (h.stamina > 78 ? 1.04 : 0.97),
};

export function describeTrait(trait: HorseTrait): string {
  const descriptions: Record<HorseTrait, string> = {
    fast_start: 'Explodes out of the gate and gains an edge early.',
    mud_runner: 'Thrives in messy conditions and sloppy tracks.',
    closer: 'Finds an extra gear in the final stretch.',
    steady_heart: 'Less variance, more reliable race pace.',
    crowd_favorite: 'Carries extra momentum under pressure.',
    iron_will: 'Resists stamina fade in longer or tougher races.',
  };
  return descriptions[trait];
}

function gaussian(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function getTraitModifier(h: HorseStats, progress: number, config: Pick<RaceConfig, 'track' | 'distance' | 'weather'>): number {
  switch (h.trait) {
    case 'fast_start':
      return progress < 0.18 ? 1.12 : 1;
    case 'mud_runner':
      return config.weather === 'rain' || config.track === 'dirt' ? 1.08 : 1;
    case 'closer':
      return progress > 0.72 ? 1.12 : 1;
    case 'steady_heart':
      return 1.01;
    case 'crowd_favorite':
      return 1.03;
    case 'iron_will':
      return config.distance === 'long' || progress > 0.7 ? 1.06 : 1;
    default:
      return 1;
  }
}

export function getHorsePower(h: HorseStats, config: Pick<RaceConfig, 'track' | 'distance' | 'weather'>): number {
  const base =
    h.speed * 0.32 +
    h.stamina * 0.26 +
    h.acceleration * 0.19 +
    h.consistency * 0.13 +
    h.jockeyBonus * 2.2;

  return (
    base *
    TRACK_MODIFIER[config.track](h) *
    DISTANCE_MODIFIER[config.distance](h) *
    WEATHER_MODIFIER[config.weather](h, config.track) *
    getTraitModifier(h, 0.5, config)
  );
}

export function simulateRace(config: RaceConfig): RaceFrame[] {
  const { track, distance, weather, horses } = config;
  const maxTicks = DISTANCE_TICKS[distance];
  const frames: RaceFrame[] = [];

  const raceHorses: RaceHorse[] = horses.map((h, i) => ({
    ...h,
    position: 0,
    currentSpeed: 0,
    lane: i,
    finished: false,
  }));

  const results: string[] = [];

  for (let tick = 0; tick <= maxTicks + 60; tick++) {
    for (const h of raceHorses) {
      if (h.finished) continue;

      const progress = h.position;
      const trackMod = TRACK_MODIFIER[track](h);
      const distMod = DISTANCE_MODIFIER[distance](h);
      const weatherMod = WEATHER_MODIFIER[weather](h, track);
      const jockeyMod = 1 + h.jockeyBonus * 0.0035;
      const traitMod = getTraitModifier(h, progress, config);

      let targetSpeed: number;
      if (progress < 0.15) {
        targetSpeed = (h.acceleration / 100) * 0.72 + 0.18;
      } else if (progress < 0.7) {
        targetSpeed = (h.speed / 100) * 0.84 + 0.12;
      } else {
        const ironWillBoost = h.trait === 'iron_will' ? 0.18 : 0;
        const fade = 1 - ((1 - h.stamina / 100) * (progress - 0.7) * (2.35 - ironWillBoost));
        targetSpeed = (h.speed / 100) * 0.85 * Math.max(fade, 0.34);
      }

      targetSpeed *= trackMod * distMod * weatherMod * jockeyMod * traitMod;

      const varianceBase = 0.08 + (1 - h.consistency / 100) * 0.18;
      const variance = h.trait === 'steady_heart' ? varianceBase * 0.65 : varianceBase;
      const noise = gaussian() * variance;
      targetSpeed = Math.max(0.01, targetSpeed + noise);

      h.currentSpeed = h.currentSpeed * 0.75 + targetSpeed * 0.25;
      h.position += h.currentSpeed * (1 / maxTicks) * 1.05;

      if (h.position >= 1.0) {
        h.position = 1.0;
        h.finished = true;
        h.finishTime = tick;
        results.push(h.id);
      }
    }

    frames.push({
      tick,
      horses: raceHorses.map((h) => ({
        id: h.id,
        position: h.position,
        lane: h.lane,
        finished: h.finished,
      })),
      finished: raceHorses.every((h) => h.finished),
      results: raceHorses.every((h) => h.finished) ? [...results] : undefined,
    });

    if (raceHorses.every((h) => h.finished)) break;
  }

  const unfinished = raceHorses.filter((h) => !h.finished);
  if (unfinished.length > 0) {
    unfinished.forEach((h) => {
      h.finished = true;
      results.push(h.id);
    });
    frames.push({
      tick: frames.length,
      horses: raceHorses.map((h) => ({ id: h.id, position: h.position, lane: h.lane, finished: true })),
      finished: true,
      results: [...results],
    });
  }

  return frames;
}

export function calculateOdds(horses: HorseStats[], track: TrackType, distance: Distance, weather: Weather = 'sunny'): Record<string, number> {
  const scores: Record<string, number> = {};
  let total = 0;

  for (const h of horses) {
    const score = getHorsePower(h, { track, distance, weather });
    scores[h.id] = score;
    total += score;
  }

  const odds: Record<string, number> = {};
  for (const h of horses) {
    const prob = scores[h.id] / total;
    odds[h.id] = Math.max(1.1, Math.round((1 / prob) * 0.87 * 10) / 10);
  }

  return odds;
}
