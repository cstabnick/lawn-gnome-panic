// The world-sound bus: listener, one-shot positional plays under a voice budget, world/ambience volumes and ducking.
//   audio.ts master <- duck <- world  (other vehicles, gunfire, critters, footsteps, events)
//                           <- ambience (region beds and their spot sounds)
// Silent until audio.ts unlockAudio() has created the AudioContext.
import { getAudioOutput } from '../audio';
import type { BiomeId } from '../types';
import type { Recipe, SoundInfo, WorldSoundId } from './ids';
import { RECIPES } from './recipes/index';
import { admit, duckLevel, spatial } from './spatial';

const COARSE = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
/** Most one-shot voices at once (phones fewer). Loops (loops.ts) and beds (ambience.ts) are separate, fixed pools. */
export const MAX_VOICES = COARSE ? 8 : 14;
const WORLD_KEY = 'gta.vol.world';
const AMB_KEY = 'gta.vol.ambience';

/** Default audible range in metres per id (anything not listed: 60). */
const MAX_DIST: Partial<Record<string, number>> = {
  'gun-pistol': 220, 'gun-shotgun': 240, 'gun-hoa': 160, explosion: 300, ricochet: 40, 'bullet-whiz': 25,
  'crash-light': 70, 'crash-heavy': 110, 'tyre-squeal': 80, 'horn-car': 90, 'horn-truck': 130, 'horn-bike': 40,
  'horn-boat': 160, 'horn-hoa': 110, 'siren-whoop': 140, backfire: 90, 'door-slam': 35,
  moo: 70, baa: 55, oink: 40, cluck: 35, squirrel: 35, bear: 80, 'bee-buzz': 18, owl: 90, crow: 90, gull: 90,
  'bell-toll': 400, 'crowd-cheer': 70, 'crowd-murmur': 45, 'shop-bell': 30, 'water-lap': 30,
  'splash-small': 35, 'splash-big': 90, 'event-start': 1000, 'event-end': 1000,
};
/** Shortest gap between two plays of the same id, seconds (anything not listed: 0.04). */
const MIN_GAP: Partial<Record<string, number>> = { 'gun-hoa': 0.09, 'tyre-squeal': 0.25, 'crowd-murmur': 1.5 };

export interface PlayOpts {
  /** Extra linear gain, default 1. */
  gain?: number;
  /** Audible range in metres (default per id, else 60). */
  maxDist?: number;
  /** 0..1 handed to the recipe as info.param (default 0.5). */
  param?: number;
  /** 'ambience' puts it under the Ambience volume instead of World (spot birds, wind gusts). */
  bus?: 'world' | 'ambience';
}

interface Bus { ctx: AudioContext; duck: GainNode; world: GainNode; ambience: GainNode }
interface Voice { end: number; loud: number; gain: GainNode }

let bus: Bus | null = null;
let worldVol = loadVol(WORLD_KEY);
let ambVol = loadVol(AMB_KEY);
const ducks = new Map<string, number>();
const extra = new Map<string, Recipe>();
const lastPlay = new Map<string, number>();
const voices: Voice[] = [];
let lx = 0;
let lz = 0;
let lyaw = 0;
let ambOverride: BiomeId | 'silent' | null = null;
const counts = { played: 0, dropped: 0, culled: 0 };

function loadVol(key: string): number {
  try {
    const v = Number(localStorage.getItem(key));
    return localStorage.getItem(key) === null || !Number.isFinite(v) ? 1 : Math.max(0, Math.min(1, v));
  } catch {
    return 1;
  }
}

function saveVol(key: string, v: number): void {
  try {
    localStorage.setItem(key, String(v));
  } catch {
    /* storage blocked: the volume still applies to this page */
  }
}

function ensure(): Bus | null {
  const o = getAudioOutput();
  if (!o) return null;
  if (bus && bus.ctx === o.ctx) return bus;
  const duck = o.ctx.createGain();
  duck.gain.value = duckLevel(ducks.values());
  const world = o.ctx.createGain();
  world.gain.value = worldVol;
  const ambience = o.ctx.createGain();
  ambience.gain.value = ambVol;
  world.connect(duck);
  ambience.connect(duck);
  duck.connect(o.master);
  bus = { ctx: o.ctx, duck, world, ambience };
  return bus;
}

/** The AudioContext and the two bus inputs, or null before audio is unlocked. Loops and beds connect their voices here. */
export function busOut(): { ctx: AudioContext; world: GainNode; ambience: GainNode } | null {
  return ensure();
}

/** Where the ears are: call once a frame with the player's (or vehicle's) position and the camera yaw. */
export function setListener(x: number, z: number, yaw: number): void {
  lx = x;
  lz = z;
  lyaw = yaw;
}

export function getListener(): { x: number; z: number; yaw: number } {
  return { x: lx, z: lz, yaw: lyaw };
}

/** Add or replace a recipe at runtime (another module's sound variants, e.g. gun mods). Built-in ids may be overridden. */
export function registerSound(id: string, recipe: Recipe): void {
  extra.set(id, recipe);
}

function recipeOf(id: string): Recipe | undefined {
  return extra.get(id) ?? RECIPES[id as WorldSoundId];
}

export function hasSound(id: string): boolean {
  return recipeOf(id) !== undefined;
}

function start(b: Bus, id: string, recipe: Recipe, gain: number, pan: number, cutoff: number, info: SoundInfo, into: GainNode): boolean {
  const c = b.ctx;
  const now = c.currentTime;
  const minGap = MIN_GAP[id] ?? 0.04;
  if (now - (lastPlay.get(id) ?? -Infinity) < minGap) return false;

  for (let i = voices.length - 1; i >= 0; i--) if (voices[i].end <= now) voices.splice(i, 1);
  const verdict = admit(gain, voices.map((v) => v.loud), MAX_VOICES);
  if (verdict === 'drop') {
    counts.dropped++;
    return false;
  }
  if (verdict === 'steal') {
    let qi = 0;
    for (let i = 1; i < voices.length; i++) if (voices[i].loud < voices[qi].loud) qi = i;
    const q = voices.splice(qi, 1)[0];
    q.gain.gain.setTargetAtTime(0, now, 0.02);
  }
  lastPlay.set(id, now);

  const g = c.createGain();
  g.gain.value = gain;
  const chain: AudioNode[] = [g];
  let tail: AudioNode = g;
  if (cutoff < 12000) {
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = cutoff;
    tail.connect(f);
    tail = f;
    chain.push(f);
  }
  if (Math.abs(pan) > 0.02 && typeof c.createStereoPanner === 'function') {
    const p = c.createStereoPanner();
    p.pan.value = pan;
    tail.connect(p);
    tail = p;
    chain.push(p);
  }
  tail.connect(into);
  let dur = 1;
  try {
    dur = recipe(c, g, now, info);
  } catch {
    /* a broken recipe must never break the frame */
  }
  dur = Math.min(10, Math.max(0.05, Number.isFinite(dur) ? dur : 1));
  voices.push({ end: now + dur, loud: gain, gain: g });
  counts.played++;
  setTimeout(() => {
    for (const n of chain) n.disconnect();
  }, (dur + 0.3) * 1000);
  return true;
}

/**
 * Play world sound `id` at world position (x, z): distance falloff, stereo pan, far sounds duller. Culled past its
 * range, dropped when the voice budget is full of louder sounds. Returns true when it started.
 */
export function playAt(id: WorldSoundId | (string & {}), pos: { x: number; z: number }, opts: PlayOpts = {}): boolean {
  const b = ensure();
  if (!b) return false;
  const recipe = recipeOf(id);
  if (!recipe) return false;
  const maxDist = opts.maxDist ?? MAX_DIST[id] ?? 60;
  const s = spatial(pos.x, pos.z, lx, lz, lyaw, maxDist);
  const gain = s.gain * (opts.gain ?? 1);
  if (gain < 0.008) {
    counts.culled++;
    return false;
  }
  const info: SoundInfo = { dist: s.dist, rand: Math.random(), param: opts.param ?? 0.5 };
  return start(b, id, recipe, gain, s.pan, s.cutoff, info, opts.bus === 'ambience' ? b.ambience : b.world);
}

/** Play world sound `id` without position (centred, full range): event stingers, the shop bell as you walk in. */
export function play2d(id: WorldSoundId | (string & {}), opts: PlayOpts = {}): boolean {
  const b = ensure();
  if (!b) return false;
  const recipe = recipeOf(id);
  if (!recipe) return false;
  const info: SoundInfo = { dist: 0, rand: Math.random(), param: opts.param ?? 0.5 };
  return start(b, id, recipe, opts.gain ?? 1, 0, 20000, info, opts.bus === 'ambience' ? b.ambience : b.world);
}

function applyDuck(fade: number): void {
  if (!bus) return;
  bus.duck.gain.setTargetAtTime(duckLevel(ducks.values()), bus.ctx.currentTime, Math.max(0.01, fade / 3));
}

/**
 * Lower world + ambience to `level` (0..1, default 0.25) over `fade` seconds, under a `key` (e.g. 'cutscene').
 * Several keys may duck at once; the deepest wins. Player sounds, music and the radio are not ducked.
 */
export function duck(key = 'default', level = 0.25, fade = 0.35): void {
  ducks.set(key, level);
  applyDuck(fade);
}

/** Lift the duck held under `key`. */
export function unduck(key = 'default', fade = 0.6): void {
  ducks.delete(key);
  applyDuck(fade);
}

export function getWorldVolume(): number { return worldVol; }
export function getAmbienceVolume(): number { return ambVol; }

/** 0..1, saved in localStorage ('gta.vol.world'). */
export function setWorldVolume(v: number): void {
  worldVol = Math.max(0, Math.min(1, v));
  saveVol(WORLD_KEY, worldVol);
  if (bus) bus.world.gain.setTargetAtTime(worldVol, bus.ctx.currentTime, 0.05);
}

/** 0..1, saved in localStorage ('gta.vol.ambience'). */
export function setAmbienceVolume(v: number): void {
  ambVol = Math.max(0, Math.min(1, v));
  saveVol(AMB_KEY, ambVol);
  if (bus) bus.ambience.gain.setTargetAtTime(ambVol, bus.ctx.currentTime, 0.05);
}

/** Force the ambience bed: a biome's bed anywhere, 'silent' (interiors, menus), or null to follow the player again. */
export function setAmbienceOverride(bed: BiomeId | 'silent' | null): void {
  ambOverride = bed;
}

export function getAmbienceOverride(): BiomeId | 'silent' | null {
  return ambOverride;
}

/** Debug and perf numbers: live one-shot voices and totals since load. */
export function soundStats(): { voices: number; max: number; played: number; dropped: number; culled: number } {
  const now = bus?.ctx.currentTime ?? 0;
  return { voices: voices.filter((v) => v.end > now).length, max: MAX_VOICES, ...counts };
}
