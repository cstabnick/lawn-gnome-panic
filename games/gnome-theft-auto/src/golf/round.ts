// Hedgeworth's round as pure state. One player, four holes, @lawn/golf for the swing and the ball. World metres for the
// ball and aim; the flight itself is the package result in the golf frame (golf/course.ts). No three.js, no DOM.
import {
  CLUB_ORDER, CLUBS, LIES,
  estimateCarry, playableLie, powerFor, restingSpot, scoreName, seaMowerCatch, seededWindFrom, simulateShot,
  swingStep, swingTap, type ClubId, type Lie,
} from '@lawn/golf';
import { courseGroundY, golfEnv, golfStart, golfToWorld, HOLES_YD, lieAtWorld, yardsBetween } from './course';
import type { CardView, HudView, RoundEvent, RoundState } from './types';
import { HOLES, MAX_STROKES, MAX_WIND, POND_NAME } from './types';

const BANNER_SECONDS = 3;
const BALL_REST_LIFT = 0.04;
const TURN_RATE = 0.9;
const PUTT_TURN_RATE = 0.35;

/** A new round on hole `hole` (default 0), ball on its tee. */
export function newRound(seed: number, hole = 0): RoundState {
  const h = HOLES[hole];
  const s: RoundState = {
    seed, hole, strokes: 0, scores: HOLES.map(() => null), ball: { x: h.tee.x, z: h.tee.z }, lie: 'tee', club: 'DR',
    aimYaw: 0, wind: { yaw: 0, mph: 0 }, phase: 'walk', swing: { stage: 'idle', marker: 0, power: 0 }, flight: null,
    banner: '', bannerT: 0, birdieRun: 0,
  };
  startHole(s, hole);
  s.birdieRun = 0;
  return s;
}

/** Wrap an angle to -PI..PI. */
function wrapAngle(a: number): number {
  const t = (a + Math.PI) % (2 * Math.PI);
  return (t < 0 ? t + 2 * Math.PI : t) - Math.PI;
}

/** Yaw that points from (ax, az) to (bx, bz) (yaw 0 faces +z). */
function yawBetween(ax: number, az: number, bx: number, bz: number): number {
  return Math.atan2(bx - ax, bz - az);
}

/** Ball to pin in gnome yards, world metres in. */
export function pinYards(s: RoundState): number {
  return yardsBetween(s.ball, HOLES[s.hole].pin);
}

/** Put the ball on hole `hole`'s tee, aimed at the first corner (or the pin on a straight hole). */
export function startHole(s: RoundState, hole: number): void {
  const h = HOLES[hole];
  s.hole = hole;
  s.strokes = 0;
  s.ball = { x: h.tee.x, z: h.tee.z };
  s.lie = 'tee';
  s.phase = 'walk';
  s.wind = seededWindFrom(s.seed, hole, MAX_WIND);
  const target = h.path.length > 2 ? h.path[1] : h.pin;
  s.aimYaw = yawBetween(s.ball.x, s.ball.z, target.x, target.z);
  s.club = defaultClub('tee', yardsBetween(s.ball, target));
  s.swing = { stage: 'idle', marker: 0, power: 0 };
  s.flight = null;
  s.banner = `Hole ${h.number}: ${h.name} · Par ${h.par}`;
  s.bannerT = BANNER_SECONDS;
}

/** Walk up to the ball and take the stance: club and aim follow the pin. Only from 'walk'. */
export function addressBall(s: RoundState): void {
  if (s.phase !== 'walk') return;
  s.phase = 'aim';
  s.club = defaultClub(s.lie, pinYards(s));
  const pin = HOLES[s.hole].pin;
  s.aimYaw = yawBetween(s.ball.x, s.ball.z, pin.x, pin.z);
}

/** Step back from the ball. Only from 'aim'. */
export function leaveBall(s: RoundState): void {
  if (s.phase === 'aim') s.phase = 'walk';
}

export function setAim(s: RoundState, yaw: number): void { s.aimYaw = yaw; }

/** Turn the aim: dir +1 turns left (yaw grows), -1 right. Slower with the putter. Only in 'aim'. */
export function turnAim(s: RoundState, dir: number, dt: number): void {
  if (s.phase !== 'aim') return;
  const rate = s.club === 'PT' ? PUTT_TURN_RATE : TURN_RATE;
  s.aimYaw = wrapAngle(s.aimYaw + dir * rate * dt);
}

/** Step through the clubs (clamped, no wrap). Only in 'aim'. */
export function cycleClub(s: RoundState, delta: number): void {
  if (s.phase !== 'aim') return;
  const i = CLUB_ORDER.indexOf(s.club) + delta;
  s.club = CLUB_ORDER[Math.max(0, Math.min(CLUB_ORDER.length - 1, i))];
}

/** The shortest club that reaches `yards` from `lie`: the putter on the green, never the driver off the tee. */
export function defaultClub(lie: Lie, yards: number): ClubId {
  if (lie === 'green') return 'PT';
  let pick: ClubId = 'DR';
  for (let i = CLUB_ORDER.length - 1; i >= 0; i--) {
    const c = CLUB_ORDER[i];
    if (c === 'PT') continue;
    if (estimateCarry(c, lie, 1) >= yards) { pick = c; break; }
  }
  if (pick === 'DR' && lie !== 'tee') return '3W';
  return pick;
}

/** Start or lock the three-tap swing meter. Returns the events (swing-start, shot on the third tap). */
export function tapSwing(s: RoundState): RoundEvent[] {
  if (s.phase === 'aim' && s.swing.stage === 'idle') {
    swingTap(s.swing);
    s.phase = 'swing';
    return [{ kind: 'swing-start' }];
  }
  if (s.phase === 'swing') {
    const ev = swingTap(s.swing);
    if (ev?.kind === 'fire') return fire(s, ev.power, ev.accuracy);
  }
  return [];
}

/** Take the shot: one stroke, the flight starts from the ball. */
function fire(s: RoundState, power: number, accuracy: number): RoundEvent[] {
  s.strokes += 1;
  const pin = HOLES_YD[s.hole].pin;
  const result = simulateShot(golfEnv(), golfStart(s.ball.x, s.ball.z), { club: s.club, power, accuracy, yaw: s.aimYaw }, s.lie, s.wind, pin);
  s.flight = { result, t: 0, from: { ...s.ball } };
  s.swing = { stage: 'idle', marker: 0, power: 0 };
  s.phase = 'flight';
  return [{ kind: 'shot', club: s.club, power, accuracy }];
}

/** Advance the banner, the swing meter and the flight. Returns the events of this step. */
export function tickRound(s: RoundState, dt: number): RoundEvent[] {
  const events: RoundEvent[] = [];
  s.bannerT -= dt;
  if (s.phase === 'swing') {
    const ev = swingStep(s.swing, dt, s.club);
    if (ev?.kind === 'fire') events.push(...fire(s, ev.power, ev.accuracy));
  } else if (s.phase === 'flight' && s.flight) {
    const f = s.flight;
    const prevT = f.t;
    f.t += dt;
    for (const e of f.result.events) {
      if (e.kind === 'bounce' && e.t > prevT && e.t <= f.t) events.push({ kind: 'bounce', lie: e.lie, speed: e.speed });
    }
    if (f.t >= f.result.duration) finishFlight(s, events);
  }
  return events;
}

/** The shot has stopped: holed, in the water (back to where it was struck), or at rest. */
function finishFlight(s: RoundState, events: RoundEvent[]): void {
  const f = s.flight;
  if (!f) return;
  const r = f.result;
  s.flight = null;
  const end = golfToWorld(r.end);
  if (r.holed) {
    s.ball = { x: end.x, z: end.z };
    s.lie = 'green';
    scoreHole(s, events);
    return;
  }
  if (r.endLie === 'water') {
    const spot = restingSpot(f.from, r);
    const mower = seaMowerCatch(r);
    s.ball = { x: spot.x, z: spot.z };
    s.lie = playableLie(lieAtWorld, spot.x, spot.z);
    s.strokes += spot.penalty;
    s.banner = mower ? 'A pond mower got it! +1, hit it again' : `Splash in ${POND_NAME}! +1, hit it again`;
    s.bannerT = BANNER_SECONDS;
    events.push({ kind: 'water', mower });
  } else {
    s.ball = { x: end.x, z: end.z };
    s.lie = playableLie(lieAtWorld, end.x, end.z);
    const yards = Math.round(r.total);
    s.banner = `${LIES[s.lie].name} · ${yards} yd`;
    s.bannerT = BANNER_SECONDS;
    events.push({ kind: 'rest', lie: s.lie, yards });
  }
  s.phase = 'walk';
  if (s.strokes >= MAX_STROKES) pickUp(s, events);
}

/** Score the hole from the strokes so far. */
function scoreHole(s: RoundState, events: RoundEvent[]): void {
  const par = HOLES[s.hole].par;
  s.scores[s.hole] = s.strokes;
  s.banner = scoreName(s.strokes, par);
  s.bannerT = BANNER_SECONDS;
  s.phase = 'holed';
  s.birdieRun = s.strokes <= par - 1 ? s.birdieRun + 1 : 0;
  events.push({ kind: 'holed', hole: s.hole, strokes: s.strokes, par, name: s.banner });
}

/** Too many strokes: the hole is picked up and scores MAX_STROKES. */
function pickUp(s: RoundState, events: RoundEvent[]): void {
  s.scores[s.hole] = MAX_STROKES;
  s.banner = 'Picked up';
  s.bannerT = BANNER_SECONDS;
  s.phase = 'holed';
  s.birdieRun = 0;
  events.push({ kind: 'picked-up', hole: s.hole });
}

/** From 'holed': the next unscored hole in index order (wrapping), or the round's end. */
export function nextHole(s: RoundState): RoundEvent[] {
  if (s.phase !== 'holed') return [];
  if (s.scores.every((x) => x !== null)) {
    s.phase = 'done';
    const t = totals(s);
    return [{ kind: 'round-done', total: t.strokes, toPar: t.toPar }];
  }
  for (let k = 1; k <= HOLES.length; k++) {
    const i = (s.hole + k) % HOLES.length;
    if (s.scores[i] === null) {
      startHole(s, i);
      break;
    }
  }
  return [];
}

/** Strokes, to-par and holes played over the holes scored so far. */
export function totals(s: RoundState): { strokes: number; toPar: number; played: number } {
  let strokes = 0;
  let par = 0;
  let played = 0;
  s.scores.forEach((x, i) => {
    if (x === null) return;
    strokes += x;
    par += HOLES[i].par;
    played++;
  });
  return { strokes, toPar: strokes - par, played };
}

/** Where the ball is in the world: along the flight while in the air, else at rest on the ground. */
export function ballWorld(s: RoundState): { x: number; y: number; z: number } {
  if (s.phase === 'flight' && s.flight) {
    const { result, t } = s.flight;
    const pts = result.points;
    if (pts.length > 0) {
      const idx = Math.min(pts.length - 1, Math.max(0, t / result.sampleDt));
      const i0 = Math.floor(idx);
      const i1 = Math.min(pts.length - 1, i0 + 1);
      const f = idx - i0;
      const a = pts[i0];
      const b = pts[i1];
      return golfToWorld({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, z: a.z + (b.z - a.z) * f });
    }
  }
  return { x: s.ball.x, y: courseGroundY(s.ball.x, s.ball.z) + BALL_REST_LIFT, z: s.ball.z };
}

export function hudView(s: RoundState, atBall: boolean): HudView {
  const h = HOLES[s.hole];
  return {
    holeNumber: h.number,
    holeName: h.name,
    par: h.par,
    strokes: s.strokes,
    toPar: totals(s).toPar,
    clubName: CLUBS[s.club].name,
    clubYards: Math.round(estimateCarry(s.club, s.lie)),
    lieName: LIES[s.lie].name,
    pinYards: Math.round(pinYards(s)),
    windRel: wrapAngle(s.wind.yaw - s.aimYaw),
    windMph: s.wind.mph,
    phase: s.phase,
    meter: s.phase === 'swing' ? { ...s.swing } : null,
    banner: s.bannerT > 0 ? s.banner : null,
    atBall,
  };
}

export function cardView(s: RoundState, best: readonly (number | null)[]): CardView {
  const t = totals(s);
  return {
    holes: HOLES.map((h, i) => ({ number: h.number, name: h.name, par: h.par, strokes: s.scores[i], best: best[i] ?? null })),
    total: t.strokes,
    toPar: t.toPar,
    final: s.phase === 'done',
  };
}
