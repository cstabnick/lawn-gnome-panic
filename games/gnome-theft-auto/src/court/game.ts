// Drainpipe Court pickup game: GBA GJAM's JamSimulation run 2v2 (player + Pansy vs two regulars, or Swish + Lintel).
// Pure: no three.js scene, no DOM. court/runtime.ts creates it, steps it with the player's control and draws its view.
import { GNORMAN_LOOK, type GnomeLook } from '@lawn/gnome';
import {
  JamSimulation,
  type GnomePlayerProfile,
  type MatchConfig,
  type PlayerControlInput,
  type SimCallbacks,
} from '@lawn/jam';
import { SPORTS_CAST } from '../sports/types';
import {
  COURT_PEOPLE,
  COURT_SCALE,
  PICKUP,
  simToWorld,
  type CourtControl,
  type CourtEvent,
  type CourtGameResult,
  type CourtGnomeView,
  type CourtPersonId,
  type CourtSoundId,
  type Opponents,
  type PickupOpts,
  type PickupView,
} from './types';

/** Fixed sim step, 60 Hz (GJAM steps the sim once per frame; a fixed step keeps headless runs repeatable). */
const STEP = 1 / 60;
/** Shot charge (seconds of shootHold) that reads as a full meter. */
const CHARGE_FULL = 0.4;

export interface PickupGame {
  sim: JamSimulation;
  target: number;
  opponents: Opponents;
  /** Seconds played. */
  t: number;
  groundY: number;
  done: boolean;
  won: boolean;
  /** Events raised by the sim callbacks during the current sub-step. */
  events: CourtEvent[];
  /** Fractional time left over from the last stepPickup. */
  acc: number;
  /** A dunk sound came during the current sub-step. */
  dunkSound: boolean;
  result: CourtGameResult | null;
}

interface Regular { name: string; look: Partial<GnomeLook>; stats: [number, number, number, number] }

/** Passers-by who join a game when the regulars are not about (speed, threePt, dunk, defense). */
const REGULARS: Regular[] = [
  { name: 'Sorrel Dribblesby', look: { hat: 0xc04a3a, shirt: 0x3a6ac0, pants: 0x4a4a4a, beard: 0x8a6a3a }, stats: [50, 48, 45, 50] },
  { name: 'Clem Hookshot', look: { hat: 0x3a8a8a, shirt: 0xe8e0c8, pants: 0x5a4a3a, beard: 0xb0b0b0 }, stats: [45, 55, 48, 45] },
  { name: 'Teasel Brick', look: { hat: 0x8a5a2a, shirt: 0x7a3a3a, pants: 0x3a3a50, beard: 0x2a2a2a }, stats: [48, 45, 55, 52] },
  { name: 'Ivy Layup', look: { hat: 0x5aa05a, shirt: 0xf0c0d0, pants: 0x4a6a8a, beard: null }, stats: [55, 50, 46, 48] },
];

function fullLook(partial: Partial<GnomeLook>): GnomeLook {
  return { ...GNORMAN_LOOK, ...partial };
}

function profile(id: string, name: string, number: number, look: GnomeLook,
  s: { speed: number; threePt: number; dunk: number; defense: number }): GnomePlayerProfile {
  return { id, name, nickname: name.split(' ')[0], number, look, stats: { ...s } };
}

function personProfile(id: 'cardoon' | 'lintel' | 'pansy'): GnomePlayerProfile {
  const p = COURT_PEOPLE[id as CourtPersonId];
  return profile(id, p.name, p.number, fullLook(SPORTS_CAST[id].look), p.stats);
}

function regularProfile(r: Regular, number: number): GnomePlayerProfile {
  return profile(`regular-${number}`, r.name, number, fullLook(r.look),
    { speed: r.stats[0], threePt: r.stats[1], dunk: r.stats[2], defense: r.stats[3] });
}

function awayRoster(opponents: Opponents, seed: number): [GnomePlayerProfile, GnomePlayerProfile] {
  if (opponents === 'swish') return [personProfile('cardoon'), personProfile('lintel')];
  const n = REGULARS.length;
  const s = Math.abs(Math.floor(seed));
  const a = s % n;
  const b = (a + 1 + Math.floor(s / n) % (n - 1)) % n;
  return [regularProfile(REGULARS[a], 4), regularProfile(REGULARS[b], 9)];
}

function idle(): PlayerControlInput {
  return { moveX: 0, moveZ: 0, turbo: false, shootDown: false, shootPressed: false, shootReleased: false,
    passPressed: false, fakePressed: false };
}

const SOUND_MAP: Partial<Record<string, CourtSoundId>> = {
  bounce: 'jam-bounce', swish: 'jam-swish', swish3: 'jam-swish', clang: 'jam-clang', dunk: 'jam-dunk',
  dunkFire: 'jam-dunk', whistle: 'jam-whistle', buzzer: 'jam-whistle', cheer: 'jam-cheer',
};

/** groundY: the court's ground height (heightAt(COURT_ORIGIN)). myLook: the player's gnome (null: GNORMAN_LOOK). */
export function newPickup(myLook: GnomeLook | null, groundY: number, opts: PickupOpts = {}): PickupGame {
  const opponents = opts.opponents ?? 'regulars';
  const config: MatchConfig = {
    homeTeamId: 'home',
    awayTeamId: 'away',
    homeRoster: [
      profile('player', 'You', 1, fullLook(myLook ?? GNORMAN_LOOK), { speed: 65, threePt: 60, dunk: 60, defense: 60 }),
      personProfile('pansy'),
    ],
    awayRoster: awayRoster(opponents, opts.seed ?? 0),
    opponentMode: 'ai',
    difficulty: PICKUP.difficulty[opponents],
    quarterSeconds: PICKUP.quarterSeconds,
  };
  const game = { target: opts.target ?? PICKUP.target, opponents, t: 0, groundY, done: false, won: false,
    events: [], acc: 0, dunkSound: false, result: null } as unknown as PickupGame;
  // The sim's constructor already fires callbacks (tipoff whistle), before game.sim is set.
  const ballAt = () => (game.sim ? simToWorld(game.sim.ball.pos.x, game.sim.ball.pos.z) : simToWorld(0, 0));
  const cb: SimCallbacks = {
    onAnnounce: () => {},
    onSound: (kind) => {
      if (kind === 'dunk' || kind === 'dunkFire') game.dunkSound = true;
      const id = SOUND_MAP[kind];
      if (id) game.events.push({ kind: 'sound', id, ...ballAt() });
    },
    onRimShake: (side, strength) => { game.events.push({ kind: 'rim', side, strength }); },
    onCameraPunch: () => {},
    onBurst: (pos, type) => {
      const w = simToWorld(pos.x, pos.z);
      game.events.push({ kind: 'burst', x: w.x, y: groundY + pos.y * COURT_SCALE, z: w.z, type });
    },
    onAchievement: () => {},
    onMatchEnd: () => {},
  };
  game.sim = new JamSimulation(config, cb);
  game.events.length = 0;
  return game;
}

/** Advance by dt seconds (the sim stepped at the fixed rate GJAM uses; edge inputs only on the first sub-step). */
export function stepPickup(g: PickupGame, dt: number, ctl: CourtControl): CourtEvent[] {
  const out: CourtEvent[] = [];
  if (g.done) return out;
  const sim = g.sim;
  g.acc += Math.min(dt, 0.25);
  let first = true;
  while (g.acc >= STEP - 1e-9 && !g.done) {
    g.acc -= STEP;
    const p1: PlayerControlInput = { ...ctl };
    if (!first) { p1.shootPressed = false; p1.shootReleased = false; p1.passPressed = false; p1.fakePressed = false; }
    first = false;
    const before: [number, number] = [sim.score[0], sim.score[1]];
    const pts = sim.players.map((p) => p.box.pts);
    g.dunkSound = false;
    sim.step(STEP, p1, idle());
    g.t += STEP;
    for (const e of g.events.splice(0)) out.push(e);
    for (const team of [0, 1] as const) {
      const d = sim.score[team] - before[team];
      if (d !== 2 && d !== 3) continue;
      const scorer = sim.players.findIndex((p, i) => p.team === team && p.box.pts > pts[i]);
      out.push({ kind: 'score', team, points: d, dunk: g.dunkSound, byPlayer: team === 0 && scorer === 0 });
    }
    const [h, a] = sim.score;
    let won: boolean | null = null;
    if (h >= g.target || a >= g.target) won = h > a;
    else if (sim.phase === 'finished') won = h > a;
    else if (g.t >= PICKUP.maxSeconds && h !== a) won = h > a;
    if (won !== null) {
      g.done = true;
      g.won = won;
      g.result = { won, score: [h, a], target: g.target, opponents: g.opponents };
      out.push({ kind: 'end', won, score: [h, a] });
    }
  }
  return out;
}

export function pickupView(g: PickupGame): PickupView {
  const sim = g.sim;
  const gnomes: CourtGnomeView[] = sim.players.map((p) => {
    const w = simToWorld(p.pos.x, p.pos.z);
    return {
      x: w.x, y: g.groundY + p.pos.y * COURT_SCALE, z: w.z, yaw: p.facing,
      speed: Math.hypot(p.vel.x, p.vel.z) * COURT_SCALE,
      hasBall: sim.ball.carrier === p.index,
      air: !p.grounded,
      slot: p.index as 0 | 1 | 2 | 3,
      name: p.profile.name,
    };
  });
  const bw = simToWorld(sim.ball.pos.x, sim.ball.pos.z);
  const me = sim.players[sim.p1ControlIdx];
  const phase = sim.phase === 'quarterBreak' ? 'live' : sim.phase;
  return {
    gnomes,
    ball: { x: bw.x, y: g.groundY + sim.ball.pos.y * COURT_SCALE, z: bw.z },
    score: [sim.score[0], sim.score[1]],
    target: g.target,
    t: g.t,
    phase: g.done ? 'finished' : phase,
    charge: me.isShooting ? Math.max(0, Math.min(1, me.shootHold / CHARGE_FULL)) : 0,
    turbo: me.turbo,
    controlled: sim.p1ControlIdx as 0 | 1,
  };
}

export function pickupResult(g: PickupGame): CourtGameResult | null {
  return g.result;
}

export function disposePickup(g: PickupGame): void {
  g.sim.dispose();
}
