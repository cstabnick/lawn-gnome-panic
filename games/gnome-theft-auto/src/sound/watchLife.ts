// Watches living things each frame: the player's and nearby gnomes' footsteps by surface, splashes, critter calls,
// world event stingers.
import type { Critter, CritterKind, CritterMode } from '../critters';
import { surfaceAt, type SurfaceKind } from '../surfaces';
import { swimState, type SwimState } from '../swim';
import type { Npc, World } from '../types';
import { play2d, playAt } from './bus';
import type { CritterSoundId, StepSoundId } from './ids';

export interface LifeSoundFrame {
  dt: number;
  /** Seconds since start. */
  time: number;
  player: { x: number; y: number; z: number; onFoot: boolean; grounded: boolean; airborne: boolean };
  world: World;
  critters: readonly Critter[];
  npcs: readonly Npc[];
  /** 0 day .. 1 night. */
  night: number;
  /** worldEvents.activeEvent()?.kind ?? null. */
  eventKind: string | null;
}

export interface LifeSounds {
  update(f: LifeSoundFrame): void;
}

const STRIDE = 0.85;
const TELEPORT = 5;
const FAST = 6;
const NPC_PERIOD = 0.15;
const NPC_RANGE2 = 14 * 14;
const NPC_WALK = 0.42;
const NPC_FLEE = 0.26;
const NPC_FORGET = 5;
const CRIT_PERIOD = 0.25;
const CRIT_RANGE2 = 45 * 45;
const BEE_RANGE2 = 15 * 15;
const NIGHT = 0.6;

const CRITTER_CALL: Record<CritterKind, CritterSoundId> = {
  cow: 'moo',
  sheep: 'baa',
  pig: 'oink',
  hen: 'cluck',
  squirrel: 'squirrel',
  'polar-bear': 'bear',
  bee: 'bee-buzz',
  // E31 small wildlife (stand-ins from the existing set where there is no own call).
  hare: 'squirrel',
  hedgehog: 'squirrel',
  fox: 'crow',
  frog: 'frog',
  duck: 'bird-chirp',
  crab: 'critter-thud',
  butterfly: 'cricket',
  dragonfly: 'cricket',
  deer: 'deer-bark',
  stag: 'deer-bark',
  fawn: 'deer-bark',
  goat: 'goat-bleat',
};

/** The call a critter makes (alarmed or calm). */
export function critterCall(kind: CritterKind): CritterSoundId {
  return CRITTER_CALL[kind];
}

/** The footstep sound for a surface. */
export function stepId(kind: SurfaceKind): StepSoundId {
  return `step-${kind}` as StepSoundId;
}

/** How many steps land when moving `moved` metres with `carry` metres left over from before, and what is left over. */
export function strideSteps(carry: number, moved: number, stride: number): { steps: number; carry: number } {
  const total = carry + moved;
  if (!(stride > 0) || total < stride) return { steps: 0, carry: total };
  const steps = Math.floor(total / stride);
  return { steps, carry: total - steps * stride };
}

/** Seconds between calm calls, [min, max]. */
function callRange(kind: CritterKind): [number, number] {
  if (kind === 'bee') return [2, 4];
  if (kind === 'polar-bear') return [15, 30];
  return [6, 16];
}

function randIn([lo, hi]: [number, number]): number {
  return lo + Math.random() * (hi - lo);
}

interface CritterEntry { mode: CritterMode; next: number; stamp: number }
interface GnomeEntry { next: number; seen: number }

export function createLifeSounds(): LifeSounds {
  // Player
  let hasPrev = false;
  let px = 0;
  let py = 0;
  let pz = 0;
  let carry = 0;
  let prevSwim: SwimState = 'dry';
  // Gnomes
  let npcAcc = 0;
  const gnomes = new Map<number, GnomeEntry>();
  // Critters
  let critAcc = 0;
  let stamp = 0;
  const critters = new Map<number, CritterEntry>();
  // Events
  let prevEvent: string | null = null;

  function playerFeet(f: LifeSoundFrame, moved: number, dt: number): void {
    const p = f.player;
    const moving = p.onFoot && p.grounded && !p.airborne;
    if (!moving || !hasPrev || moved > TELEPORT || dt <= 0) {
      carry = 0;
      return;
    }
    const speed = moved / dt;
    const water = swimState(p.x, p.y, p.z) === 'wade';
    const kind: SurfaceKind = water ? 'water' : surfaceAt(p.x, p.z, f.world).kind;
    const r = strideSteps(carry, moved, STRIDE);
    carry = r.carry;
    const param = speed > FAST ? 1 : 0.5;
    for (let i = 0; i < Math.min(r.steps, 2); i++) playAt(stepId(kind), { x: p.x, z: p.z }, { param });
  }

  function playerSplashes(f: LifeSoundFrame, moved: number, dt: number): void {
    const p = f.player;
    const sw = swimState(p.x, p.y, p.z);
    if (!p.onFoot) {
      prevSwim = sw;
      return;
    }
    if (sw !== prevSwim && hasPrev) {
      const speed = dt > 0 ? moved / dt : 0;
      const fall = dt > 0 ? Math.abs(p.y - py) / dt : 0;
      if (prevSwim === 'dry' && (sw === 'wade' || sw === 'bob')) {
        const big = sw === 'bob' && (speed > FAST || fall > FAST);
        playAt(big ? 'splash-big' : 'splash-small', { x: p.x, z: p.z });
      } else if (prevSwim === 'bob' && sw === 'dry') {
        playAt('step-water', { x: p.x, z: p.z }, { param: 1 });
      }
    }
    prevSwim = sw;
  }

  function gnomeStep(n: Npc, step: number, f: LifeSoundFrame): void {
    let e = gnomes.get(n.id);
    if (!e) {
      e = { next: Math.random() * NPC_WALK, seen: f.time };
      gnomes.set(n.id, e);
    }
    e.seen = f.time;
    e.next -= step;
    if (e.next > 0) return;
    e.next = n.state === 'flee' ? NPC_FLEE : NPC_WALK;
    playAt(stepId(surfaceAt(n.x, n.z, f.world).kind), { x: n.x, z: n.z }, { gain: 0.4 });
  }

  function gnomeFootsteps(f: LifeSoundFrame, step: number): void {
    let a: Npc | null = null;
    let b: Npc | null = null;
    let da = Infinity;
    let db = Infinity;
    for (const n of f.npcs) {
      if (n.state !== 'walk' && n.state !== 'flee') continue;
      const dx = n.x - f.player.x;
      const dz = n.z - f.player.z;
      const d = dx * dx + dz * dz;
      if (d > NPC_RANGE2) continue;
      if (d < da) {
        b = a;
        db = da;
        a = n;
        da = d;
      } else if (d < db) {
        b = n;
        db = d;
      }
    }
    if (a) gnomeStep(a, step, f);
    if (b) gnomeStep(b, step, f);
    for (const [id, e] of gnomes) if (f.time - e.seen > NPC_FORGET) gnomes.delete(id);
  }

  function critterPass(f: LifeSoundFrame, step: number): void {
    stamp++;
    const quietNight = f.night >= NIGHT;
    for (const c of f.critters) {
      const dx = c.x - f.player.x;
      const dz = c.z - f.player.z;
      const d2 = dx * dx + dz * dz;
      let e = critters.get(c.id);
      if (!e) {
        e = { mode: c.mode, next: randIn(callRange(c.kind)), stamp };
        critters.set(c.id, e);
      }
      e.stamp = stamp;
      const prev = e.mode;
      e.mode = c.mode;
      if (d2 > CRIT_RANGE2) continue;
      const pos = { x: c.x, z: c.z };
      if (prev !== c.mode) {
        if (c.mode === 'flee' || c.mode === 'chase') playAt(critterCall(c.kind), pos, { param: 1 });
        else if (c.mode === 'down') playAt('critter-thud', pos);
      }
      if (c.mode === 'idle' || c.mode === 'wander') {
        if (c.kind === 'bee' && d2 > BEE_RANGE2) continue;
        const quiet = quietNight && (c.kind === 'cow' || c.kind === 'sheep' || c.kind === 'hen');
        e.next -= quiet ? step * 0.5 : step;
        if (e.next <= 0) {
          playAt(critterCall(c.kind), pos);
          e.next = randIn(callRange(c.kind));
        }
      }
    }
    for (const [id, e] of critters) if (e.stamp !== stamp) critters.delete(id);
  }

  function worldEvents(f: LifeSoundFrame): void {
    if (f.eventKind === prevEvent) return;
    if (f.eventKind === null) play2d('event-end');
    else if (prevEvent === null) play2d('event-start');
    if (f.eventKind === 'hoa-raid') play2d('horn-hoa');
    prevEvent = f.eventKind;
  }

  return {
    update(f) {
      const { dt, player: p } = f;
      worldEvents(f);

      const moved = hasPrev ? Math.hypot(p.x - px, p.z - pz) : 0;
      playerFeet(f, moved, dt);
      playerSplashes(f, moved, dt);
      hasPrev = true;
      px = p.x;
      py = p.y;
      pz = p.z;

      npcAcc += dt;
      if (npcAcc >= NPC_PERIOD) {
        const step = npcAcc;
        npcAcc = 0;
        if (f.npcs.length > 0) gnomeFootsteps(f, step);
        else gnomes.clear();
      }

      critAcc += dt;
      if (critAcc >= CRIT_PERIOD) {
        const step = critAcc;
        critAcc = 0;
        if (f.critters.length > 0) critterPass(f, step);
        else critters.clear();
      }
    },
  };
}
