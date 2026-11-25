// Region ambience beds (city hum, forest, tundra wind, desert, farmland, water, crowds) and their spot sounds.
// Beds are fixed looping noise layers, built once into the ambience bus and cross-faded by target gain. Spot sounds
// are one-shot positional plays on the ambience bus, fired on random timers by biome and time of day.
import { BIRD_AMBIENCE_IDS, getBirdSounds } from '../birdPrefs';
import { waterAt } from '../terrain';
import type { BiomeId } from '../types';
import type { RegionId } from '../levels';
import type { WeatherState } from '../weather/types';
import { getAmbienceOverride, busOut, playAt } from './bus';
import { noise } from './synth';

export interface AmbienceFrame {
  dt: number;
  /** Listener position. */
  x: number;
  z: number;
  biome: BiomeId;
  /** 0 day .. 1 night (atmosphere.nightFactor()). */
  night: number;
  /** atmosphere.timeLabel(): 'Morning' | 'Noon' | 'Golden Hour' | 'Dusk' | 'Neon Night' | 'Dawn'. */
  timeLabel: string;
  /** districts.ts districtAt(x, z) id, or null outside the city districts. */
  district: string | null;
  /** How many gnomes (NPCs) are within 25 m: crowd density. */
  people: number;
  /** True while flying or parachuting (wind rushes, ground beds thin out). */
  airborne: boolean;
  /** The weather heard here (weather/index.ts getWeather), or null indoors / with weather off: rain and snow beds. */
  weather?: WeatherState | null;
  /** levels.ts regionAt(x, z): picks the batch-3 region beds and spot sounds. */
  region?: RegionId;
}

export interface Ambience {
  update(f: AmbienceFrame): void;
}

type LayerKey = 'wind' | 'hum' | 'leaves' | 'water' | 'crowd' | 'night';
type Mix = Record<LayerKey, number>;

const LAYER_KEYS: LayerKey[] = ['wind', 'hum', 'leaves', 'water', 'crowd', 'night'];
const ZERO_MIX: Mix = { wind: 0, hum: 0, leaves: 0, water: 0, crowd: 0, night: 0 };

/** Day gain table per biome (the base before night, crowd, water and airborne adjustments). */
const DAY: Record<BiomeId, Partial<Mix>> = {
  city: { hum: 0.035, wind: 0.01 },
  forest: { leaves: 0.03, wind: 0.015 },
  parkland: { leaves: 0.02, wind: 0.012 },
  tundra: { wind: 0.06 },
  desert: { wind: 0.03 },
  farmland: { wind: 0.018, leaves: 0.01 },
  loch: { wind: 0.02, water: 0.035 },
  highland: { wind: 0.05 },
  coast: { wind: 0.03, water: 0.04 },
  campus: { hum: 0.015, leaves: 0.015, wind: 0.01 },
  estate: { leaves: 0.02, wind: 0.012 },
  continental: { hum: 0.025, water: 0.015, leaves: 0.01 },
  preserve: { leaves: 0.035, wind: 0.02, water: 0.01 },
};

const clamp01 = (v: number): number => (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0);

/**
 * Target gain per bed layer for the given conditions. Pure: no audio, no world access.
 * `wet` is the fraction (0..1) of water samples around the listener; `people` is the crowd count within 25 m.
 */
export function bedMix(
  biome: BiomeId, night: number, people: number, inDistrict: boolean, wet: number, airborne: boolean,
): Record<LayerKey, number> {
  const base = DAY[biome] ?? {};
  const n = clamp01(night);
  const p = Number.isFinite(people) ? Math.max(0, people) : 0;
  const m: Mix = {
    wind: base.wind ?? 0,
    hum: (base.hum ?? 0) * (1 - 0.4 * n),
    leaves: base.leaves ?? 0,
    water: 0.04 * clamp01(wet) + (base.water ?? 0),
    crowd: inDistrict ? Math.min(0.05, p * 0.006) : Math.min(0.02, p * 0.004),
    night: biome === 'city' || biome === 'tundra' ? 0 : 0.012 * n,
  };
  if (airborne) {
    for (const k of LAYER_KEYS) m[k] = k === 'wind' ? m[k] * 1.8 : m[k] * 0.25;
  }
  return m;
}

/**
 * One bed layer: looping noise -> filter -> amp (optionally LFO-modulated) -> level -> the ambience bus. The filter and
 * gains live for the page; the sources (noise, LFO, the hum's sawtooth) only run while the layer is audible, since a
 * silent running source still costs audio-thread CPU on a phone.
 */
interface Layer {
  level: GainNode;
  filter: BiquadFilterNode;
  last: number;
  /** Seconds the target has been 0 (the sources stop after SLEEP_AFTER). */
  quiet: number;
  running: boolean;
  start(): void;
  stop(): void;
}

/** The level fades with a 1.2 s time constant: after this long at target 0 it is inaudible, so the sources can stop. */
const SLEEP_AFTER = 6;

function buildLayers(ctx: AudioContext, out: AudioNode): Record<LayerKey, Layer> {
  const make = (filter: BiquadFilterType, freq: number, q: number, lfoHz: number, depth: number, humHz = 0): Layer => {
    const level = ctx.createGain();
    level.gain.value = 0;
    level.connect(out);
    const amp = ctx.createGain();
    amp.gain.value = 1 - depth * 0.5;
    amp.connect(level);
    const f = ctx.createBiquadFilter();
    f.type = filter;
    f.frequency.value = freq;
    f.Q.value = q;
    f.connect(amp);
    let srcs: AudioScheduledSourceNode[] = [];
    const layer: Layer = {
      level, filter: f, last: 0, quiet: 0, running: false,
      start() {
        if (layer.running) return;
        layer.running = true;
        const src = ctx.createBufferSource();
        src.buffer = noise(ctx);
        src.loop = true;
        src.connect(f);
        src.start(ctx.currentTime, Math.random() * 0.9);
        srcs = [src];
        if (lfoHz > 0 && depth > 0) {
          const lfo = ctx.createOscillator();
          lfo.type = 'sine';
          lfo.frequency.value = lfoHz;
          const lg = ctx.createGain();
          lg.gain.value = depth * 0.5;
          lfo.connect(lg).connect(amp.gain);
          lfo.start();
          lfo.onended = () => lg.disconnect();
          srcs.push(lfo);
        }
        if (humHz > 0) {
          // A low sawtooth through the same lowpass, so only the electric buzz is left.
          const o = ctx.createOscillator();
          o.type = 'sawtooth';
          o.frequency.value = humHz;
          const og = ctx.createGain();
          og.gain.value = 0.25;
          o.connect(og).connect(f);
          o.start();
          o.onended = () => og.disconnect();
          srcs.push(o);
        }
      },
      stop() {
        if (!layer.running) return;
        layer.running = false;
        for (const sn of srcs) {
          try { sn.stop(); } catch { /* already stopped */ }
          sn.disconnect();
        }
        srcs = [];
      },
    };
    return layer;
  };

  return {
    wind: make('lowpass', 380, 0.7, 0.13, 0.5),
    hum: make('lowpass', 160, 0.7, 0, 0, 60),
    leaves: make('bandpass', 2500, 0.7, 0.3, 0.5),
    water: make('lowpass', 500, 0.7, 0.25, 0.5),
    crowd: make('bandpass', 700, 1.2, 0.6, 0.5),
    night: make('highpass', 5500, 0.7, 18, 1),
  };
}

/** Spot-sound choice for the current biome and time. Returns null when nothing fits. */
interface Spot { id: string; near?: [number, number]; gain?: number }

function pickSpot(biome: BiomeId, night: boolean, people: number, wetNear: boolean): Spot | null {
  const r = Math.random();
  if (wetNear && r < 0.4 && biome === 'loch') return { id: 'water-lap' };
  switch (biome) {
    case 'forest':
    case 'parkland':
      if (night) return r < 0.5 ? { id: 'owl' } : { id: 'cricket' };
      return r < 0.15 ? { id: 'crow' } : r < 0.575 ? { id: 'bird-song' } : { id: 'bird-chirp' };
    case 'farmland':
      if (night) return r < 0.5 ? { id: 'cricket' } : { id: 'frog' };
      if (r < 0.6) return { id: 'bird-chirp' };
      return r < 0.8 ? { id: 'moo', gain: 0.5 } : { id: 'crow' };
    case 'loch':
      return night ? { id: 'frog' } : { id: 'gull' };
    case 'desert':
      if (night) return r < 0.85 ? { id: 'cricket' } : { id: 'wind-gust' };
      return { id: 'cicada' };
    case 'tundra':
      return r < 0.85 ? { id: 'wind-gust' } : { id: 'crow' };
    case 'city':
      if (r < 0.3) return { id: 'horn-car', near: [35, 60], gain: 0.4 };
      return people > 3 ? { id: 'crowd-murmur' } : null;
  }
  return null;
}

const SPOT_BIRD_BIOMES: BiomeId[] = ['forest', 'parkland', 'farmland'];

export function createAmbience(): Ambience {
  let layers: Record<LayerKey, Layer> | null = null;
  let windCut = 380;
  let wet = 0;
  let waterTimer = 0;
  let spotTimer = 3 + Math.random() * 6;
  let gunTimer = 30 + Math.random() * 20;
  let prevLabel: string | null = null;

  /** Fraction of 9 points (centre + 8 on a 14 m ring) that are in water. */
  function sampleWet(x: number, z: number): number {
    let hits = waterAt(x, z) ? 1 : 0;
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4;
      if (waterAt(x + Math.cos(a) * 14, z + Math.sin(a) * 14)) hits++;
    }
    return hits / 9;
  }

  /** A random point `lo..hi` metres from the listener. */
  function around(f: AmbienceFrame, lo: number, hi: number): { x: number; z: number } {
    const a = Math.random() * Math.PI * 2;
    const d = lo + Math.random() * (hi - lo);
    return { x: f.x + Math.cos(a) * d, z: f.z + Math.sin(a) * d };
  }

  return {
    update(f: AmbienceFrame) {
      const out = busOut();
      if (!out) return;
      if (!layers) layers = buildLayers(out.ctx, out.ambience);
      const now = out.ctx.currentTime;

      const override = getAmbienceOverride();
      const silent = override === 'silent';
      const biome: BiomeId = override && override !== 'silent' ? override : f.biome;

      waterTimer -= f.dt;
      if (waterTimer <= 0) {
        waterTimer = 0.5;
        wet = sampleWet(f.x, f.z);
      }

      const mix = silent ? ZERO_MIX : bedMix(biome, f.night, f.people, f.district !== null, wet, f.airborne);
      for (const k of LAYER_KEYS) {
        const layer = layers[k];
        const target = mix[k];
        if (target > 0) {
          layer.quiet = 0;
          layer.start();
        } else if (layer.running) {
          layer.quiet += f.dt;
          if (layer.quiet > SLEEP_AFTER) layer.stop();
        }
        // A tiny target (< 0.002) still has to reach exactly 0, or a stopped layer would never be asked to fade.
        if (Math.abs(target - layer.last) < 0.002 && !(target === 0 && layer.last !== 0)) continue;
        layer.last = target;
        layer.level.gain.setTargetAtTime(target, now, 1.2);
      }
      const cut = biome === 'desert' ? 300 : biome === 'tundra' ? 700 : 380;
      if (cut !== windCut) {
        windCut = cut;
        layers.wind.filter.frequency.setTargetAtTime(cut, now, 1.2);
      }

      // The label change check runs every frame so a Noon crossing is never missed.
      const turnedNoon = f.timeLabel === 'Noon' && prevLabel !== null && prevLabel !== 'Noon';
      prevLabel = f.timeLabel;
      if (silent || f.airborne) return;

      if (turnedNoon && biome === 'city') {
        playAt('bell-toll', { x: 0, z: 0 }, { bus: 'ambience', maxDist: 600 });
      }

      if (biome === 'city' && f.timeLabel === 'Neon Night') {
        gunTimer -= f.dt;
        if (gunTimer <= 0) {
          gunTimer = 30 + Math.random() * 20;
          const dist = 120 + Math.random() * 60;
          const a = Math.random() * Math.PI * 2;
          playAt('gun-pistol', { x: f.x + Math.cos(a) * dist, z: f.z + Math.sin(a) * dist },
            { bus: 'ambience', maxDist: 220, gain: 0.5 });
        }
      }

      spotTimer -= f.dt;
      if (spotTimer > 0) return;
      const dawn = f.timeLabel === 'Dawn' || f.timeLabel === 'Morning';
      spotTimer = (3 + Math.random() * 6) * (dawn && SPOT_BIRD_BIOMES.includes(biome) ? 0.5 : 1);

      const spot = pickSpot(biome, f.night >= 0.5, f.people, wet > 0);
      if (!spot || (!getBirdSounds() && BIRD_AMBIENCE_IDS.includes(spot.id))) return;
      const [lo, hi] = spot.near ?? [15, 45];
      playAt(spot.id, around(f, lo, hi), { bus: 'ambience', gain: spot.gain });
    },
  };
}
