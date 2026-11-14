// Round flow: holes, strokes, penalties and the phase machine. Systems read GameState and call these
// functions; only this file changes state.phase (except controls.ts, which moves 'aim' <-> 'swing').
import * as THREE from 'three';
import { CART_SEATS, CLUB_ORDER, CONSUMABLES, CONVOY_GAP, DISC, HOLES, LIES, PARTY, ROUND, type ClubId, type DiscState, type GameMode, type GameState, type Golfer, type HoleDef, type PartySpots, type Ride, type Shot, type Spot } from './config';
import { setCarts, type CartObstacle } from './obstacles';
import { distToPath, heightAt, lieAt } from './course';
import { estimateCarry, simulateShot } from './physics';
import { canFlail, continueThrow, simulateThrow, type DiscFlight } from './discPhysics';

export function currentHole(state: GameState): HoleDef {
  return HOLES[state.holeIndex];
}

/** Horizontal yards from the ball to the pin. */
export function distanceToPin(state: GameState): number {
  const pin = currentHole(state).pin;
  return Math.hypot(pin.x - state.ball.x, pin.z - state.ball.z);
}

/** Yaw from (x, z) toward (tx, tz). */
export function yawTo(x: number, z: number, tx: number, tz: number): number {
  return Math.atan2(tx - x, tz - z);
}

/** Party spots around a ball for a shot along `yaw`; the mower and partner swap to the right side if the left is water. */
export function partySpots(ball: THREE.Vector3, yaw: number): PartySpots {
  const dir = { x: Math.sin(yaw), z: Math.cos(yaw) };
  const left = { x: Math.cos(yaw), z: -Math.sin(yaw) };
  const place = (side: number, back: number, facing: number): Spot => {
    const x = ball.x + left.x * side - dir.x * back;
    const z = ball.z + left.z * side - dir.z * back;
    return { x, y: Math.max(0, heightAt(x, z)), z, facing };
  };
  let s = 1;
  if (lieAt(ball.x + left.x * PARTY.mower.side, ball.z + left.z * PARTY.mower.side) === 'water') s = -1;
  const golfer = place(PARTY.golfer.side, PARTY.golfer.back, yaw - Math.PI / 2);
  const mower = place(PARTY.mower.side * s, PARTY.mower.back, yaw);
  const partner = place(PARTY.partner.side * s, PARTY.partner.back, yawTo(mower.x, mower.z, ball.x, ball.z));
  partner.facing = yawTo(partner.x, partner.z, ball.x, ball.z);
  return { golfer, mower, partner };
}

/** Default aim: at the pin when it is within reach of the driver, else at the next fairway corner ahead. */
export function defaultAim(state: GameState): number {
  const hole = currentHole(state);
  const b = state.ball;
  const reach = estimateCarry('DR', state.lie) + 25;
  if (distanceToPin(state) <= reach) return yawTo(b.x, b.z, hole.pin.x, hole.pin.z);
  const here = distToPath(hole, b.x, b.z).along;
  let walked = 0;
  for (let i = 0; i < hole.path.length - 1; i++) {
    const a = hole.path[i];
    const c = hole.path[i + 1];
    walked += Math.hypot(c.x - a.x, c.z - a.z);
    if (walked > here + 20) return yawTo(b.x, b.z, c.x, c.z);
  }
  return yawTo(b.x, b.z, hole.pin.x, hole.pin.z);
}

/** Club suggestion: putter on the green, else the shortest club whose carry reaches the target distance. */
export function defaultClub(state: GameState): ClubId {
  if (state.lie === 'green') return 'PT';
  const dist = distanceToPin(state);
  if (state.lie === 'fringe' && dist < 12) return 'PT';
  let pick: ClubId = 'DR';
  for (const c of CLUB_ORDER) {
    if (c === 'PT') continue;
    if (c === 'DR' && state.lie !== 'tee') continue;
    if (estimateCarry(c, state.lie) >= dist - 4) pick = c;
  }
  if (pick === 'DR' && state.lie !== 'tee') pick = '3W';
  return pick;
}

function randomWind(): { yaw: number; mph: number } {
  return { yaw: Math.random() * Math.PI * 2, mph: Math.round(Math.random() * ROUND.maxWind) };
}

/** Online: the same wind for everyone on a hole, from the round seed. */
export function seededWind(seed: number, hole: number): { yaw: number; mph: number } {
  let a = (seed ^ Math.imul(hole + 1, 2654435761)) >>> 0;
  const rnd = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { yaw: rnd() * Math.PI * 2, mph: Math.round(rnd() * ROUND.maxWind) };
}

// ---------------------------------------------------------------------
// Online hooks. online.ts sets these; round.ts calls them when the local player acts, so it can relay.
// ---------------------------------------------------------------------

export type LocalShot =
  | { kind: 'golf'; shot: Shot }
  | { kind: 'disc'; power: number; releaseError: number; dizzy: boolean };

export const hooks: {
  /** I just played a shot (not called for replays of someone else's). state.ball/lie/wind are still the start. */
  onShot: ((state: GameState, shot: LocalShot) => void) | null;
  /** I flailed mid-air at flight time t. */
  onFlail: ((state: GameState, t: number) => void) | null;
  /** A flight finished on this client (anyone's ball): state is now 'result' or 'holed'. */
  onFlightDone: ((state: GameState) => void) | null;
} = { onShot: null, onFlail: null, onFlightDone: null };

/** May the local player aim and swing right now? Solo: always. Online: race always; together only on my turn. */
export function canAct(state: GameState): boolean {
  const o = state.online;
  if (!o) return true;
  if (!o.started) return false;
  return o.format === 'race' || o.turn === o.me;
}

/** Is the ball on screen mine (so its score is mine)? */
export function isMyBall(state: GameState): boolean {
  const o = state.online;
  return !o || o.format === 'race' || o.turn === o.me;
}

/** Together mode: golfers still in the match, in join order, with their cart (0..) and seat (0..CART_SEATS-1). */
export function convoySeats(state: GameState): { golfer: Golfer; cart: number; seat: number }[] {
  const o = state.online;
  if (!o) return [];
  return o.golfers.filter((g) => !g.left).map((golfer, i) => ({ golfer, cart: Math.floor(i / CART_SEATS), seat: i % CART_SEATS }));
}

/** Number of carts on screen: 1 solo and race (my own), ceil(golfers / CART_SEATS) together (and in the lobby). */
export function cartCount(state: GameState): number {
  const o = state.online;
  if (!o || (o.started && o.format === 'race')) return 1;
  return Math.max(1, Math.ceil(o.golfers.filter((g) => !g.left).length / CART_SEATS));
}

/** Together mode: switch the screen to golfer g's ball (their turn). Drives the convoy there unless it is already there. */
export function beginTurn(state: GameState, g: Golfer): void {
  // No drive when the convoy is already parked by this ball (several tee shots in a row, or balls side by side).
  const m = state.party.mower;
  const near = Math.hypot(g.ball.x - m.x, g.ball.z - m.z) < 12;
  state.strokes = g.strokes;
  state.flight = null;
  state.drive = null;
  if (near && state.phase !== 'drive') {
    state.ball.set(g.ball.x, g.ball.y, g.ball.z);
    prepareShot(state);
    if (state.strokes === 0) {
      state.lie = 'tee';
      state.club = defaultClub(state);
    }
    state.party = { ...state.party, golfer: partySpots(state.ball, state.aimYaw).golfer };
    if (state.phase !== 'intro') setPhase(state, 'aim');
    return;
  }
  const from = state.party;
  state.ball.set(g.ball.x, g.ball.y, g.ball.z);
  prepareShot(state);
  if (state.strokes === 0) {
    state.lie = 'tee';
    state.club = defaultClub(state);
  }
  const to = partySpots(state.ball, state.aimYaw);
  const path = planDrive(from.mower, to.mower);
  const duration = Math.min(ROUND.driveMax, Math.max(ROUND.driveMin, pathLength(path) / ROUND.driveSpeed));
  state.drive = { from, to, duration, path };
  setPhase(state, 'drive');
}

/** Online: put the round into a phase decided elsewhere (the host's card / final, or the lobby's title). */
export function forcePhase(state: GameState, phase: GameState['phase']): void {
  setPhase(state, phase);
}

/** Every parked cart a shot from here could hit: the convoy (or my cart), plus race opponents' parked carts on my hole. */
export function collisionCarts(state: GameState): CartObstacle[] {
  const out: CartObstacle[] = [];
  const n = cartCount(state);
  for (let k = 0; k < n; k++) {
    const p = cartPose(state, k);
    out.push({ x: p.x, y: p.y, z: p.z, yaw: p.facing });
  }
  const o = state.online;
  if (o && o.format === 'race') {
    for (const g of o.golfers) {
      if (g.id === o.me || g.left || !g.race || g.race.hole !== state.holeIndex || g.race.riding) continue;
      const c = g.race.cart;
      out.push({ x: c.x, y: c.y, z: c.z, yaw: c.facing });
    }
  }
  return out;
}

function setPhase(state: GameState, phase: GameState['phase']): void {
  state.phase = phase;
  state.phaseTime = 0;
}

/** Ready the ball for the next shot at state.ball: lie, aim, club, party spots. */
function prepareShot(state: GameState): void {
  state.lie = lieAt(state.ball.x, state.ball.z);
  if (state.lie === 'water') state.lie = 'rough';
  state.ball.y = heightAt(state.ball.x, state.ball.z);
  state.aimYaw = defaultAim(state);
  state.club = defaultClub(state);
  state.swing = { stage: 'idle', marker: 0, power: 0 };
  state.disc = freshDisc(state.disc.tilt);
}

/** Per-throw Gnome Disc state; the tilt carries over from throw to throw. */
function freshDisc(tilt = 0): DiscState {
  return { tilt, held: 0, orbit: 0, power: 0, releaseError: 0, flails: DISC.flailsPerThrow, lastFlail: -1, dizzy: false };
}

export function startHole(state: GameState, index: number): void {
  state.holeIndex = index;
  const hole = currentHole(state);
  state.strokes = 0;
  state.penalties = 0;
  state.flight = null;
  state.lastShot = null;
  state.drive = null;
  state.wind = state.online ? seededWind(state.online.seed, index) : randomWind();
  state.ball.set(hole.tee.x, 0, hole.tee.z);
  prepareShot(state);
  state.lie = 'tee';
  state.club = defaultClub(state);
  state.party = partySpots(state.ball, state.aimYaw);
  state.banner = `Hole ${index + 1} · Par ${hole.par}`;
  setPhase(state, 'intro');
}

export function newRound(state: GameState, mode?: GameMode): void {
  if (mode) state.mode = mode;
  state.scores = HOLES.map(() => null);
  state.cigarillos = CONSUMABLES.cigarillosPerRound;
  state.smokeShots = 0;
  state.beers = CONSUMABLES.beersPerRound;
  state.beersDrunk = 0;
  state.drinkTime = -1;
  startHole(state, 0);
}

const RIDE_KEY = 'gnome-golf.ride';

/** The saved ride; the mower when nothing is saved or storage is blocked. Debug: #350z forces the 350Z. */
function loadRide(): Ride {
  if (typeof location !== 'undefined' && location.hash.includes('350z')) return '350z';
  try {
    return localStorage.getItem(RIDE_KEY) === '350z' ? '350z' : 'mower';
  } catch {
    return 'mower';
  }
}

/** Swap between the mower cart and the 350Z (the title-screen cheat). Remembered across visits. */
export function toggleRide(state: GameState): Ride {
  state.ride = state.ride === '350z' ? 'mower' : '350z';
  try {
    localStorage.setItem(RIDE_KEY, state.ride);
  } catch {
    // Storage blocked: the choice lasts until reload.
  }
  return state.ride;
}

export function newState(): GameState {
  const state: GameState = {
    online: null,
    mode: 'golf',
    disc: freshDisc(),
    phase: 'title',
    phaseTime: 0,
    time: 0,
    holeIndex: 0,
    strokes: 0,
    scores: HOLES.map(() => null),
    ball: new THREE.Vector3(),
    lie: 'tee',
    aimYaw: 0,
    club: 'DR',
    wind: { yaw: 0, mph: 0 },
    swing: { stage: 'idle', marker: 0, power: 0 },
    flight: null,
    lastShot: null,
    banner: '',
    penalties: 0,
    drive: null,
    party: partySpots(new THREE.Vector3(), 0),
    view: 'behind',
    cigarillos: CONSUMABLES.cigarillosPerRound,
    smokeShots: 0,
    beers: CONSUMABLES.beersPerRound,
    beersDrunk: 0,
    drinkTime: -1,
    ride: loadRide(),
  };
  // Park the camera's subject at hole 1 for the title screen.
  const hole = HOLES[0];
  state.ball.set(hole.tee.x, heightAt(hole.tee.x, hole.tee.z), hole.tee.z);
  state.aimYaw = yawTo(hole.tee.x, hole.tee.z, hole.path[1].x, hole.path[1].z);
  state.party = partySpots(state.ball, state.aimYaw);
  return state;
}

/** Debug: move the ball (and the party) to (x, z) and set up the next shot from there. */
export function placeBall(state: GameState, x: number, z: number): void {
  state.ball.set(x, 0, z);
  prepareShot(state);
  state.party = partySpots(state.ball, state.aimYaw);
}

/** Skip the hole intro (tap during 'intro'). */
export function skipIntro(state: GameState): void {
  if (state.phase === 'intro') setPhase(state, 'aim');
}

/** Called by controls.ts when the swing meter completes. Plays the shot and starts the flight. */
export function takeShot(state: GameState, shot: Shot, replay = false): void {
  const hole = currentHole(state);
  if (!replay) hooks.onShot?.(state, { kind: 'golf', shot });
  setCarts(collisionCarts(state));
  state.lastShot = shot;
  state.strokes++;
  state.flight = simulateShot(state.ball, shot, state.lie, state.wind, hole.pin);
  state.swing = { stage: 'idle', marker: 0, power: 0 };
  if (state.smokeShots > 0) state.smokeShots--;
  setPhase(state, 'flight');
}

/**
 * Gnome Disc: Disco lets go. `releaseError` is how far (radians) the gnome's orbit was past the aim line when
 * he let go; the throw leaves that far off line, scaled by DISC.releaseSpread.
 */
export function takeThrow(state: GameState, power: number, releaseError: number, dizzy = false, replay = false): void {
  const hole = currentHole(state);
  if (!replay) hooks.onShot?.(state, { kind: 'disc', power, releaseError, dizzy });
  setCarts(collisionCarts(state));
  const off = Math.max(-DISC.maxReleaseOffset, Math.min(DISC.maxReleaseOffset, releaseError * DISC.releaseSpread));
  state.strokes++;
  state.disc.power = power;
  state.disc.releaseError = releaseError;
  state.disc.dizzy = dizzy;
  state.disc.flails = DISC.flailsPerThrow;
  state.disc.lastFlail = -1;
  state.lastShot = { club: state.club, power, accuracy: 0, yaw: state.aimYaw + off };
  state.flight = simulateThrow({
    from: state.ball, yaw: state.aimYaw + off, power, tilt: state.disc.tilt, lie: state.lie, wind: state.wind, pin: hole.pin,
  });
  if (state.smokeShots > 0) state.smokeShots--;
  setPhase(state, 'flight');
}

/** Gnome Disc: a mid-air flail. Only while the gnome is still airborne and has flails left. Keeps the flight clock running. */
export function flailThrow(state: GameState, at?: number): boolean {
  const f = state.flight as DiscFlight | null;
  if (state.mode !== 'disc' || state.phase !== 'flight' || !f || state.disc.flails <= 0 || !('vels' in f)) return false;
  const t = at ?? state.phaseTime;
  if (!canFlail(f, t)) return false;
  if (at === undefined) hooks.onFlail?.(state, t);
  setCarts(collisionCarts(state));
  state.flight = continueThrow(f, t, state.wind, currentHole(state).pin);
  state.disc.flails--;
  state.disc.lastFlail = state.time;
  return true;
}

/** Score name for strokes relative to par. */
export function scoreName(strokes: number, par: number, mode: GameMode = 'golf'): string {
  if (strokes === 1) return mode === 'disc' ? 'ACE! Gnome in the chains!' : 'Hole in one!';
  const d = strokes - par;
  const names: Record<string, string> = { '-3': 'Albatross!', '-2': 'Eagle!', '-1': 'Birdie!', '0': 'Par', '1': 'Bogey', '2': 'Double bogey', '3': 'Triple bogey' };
  return names[String(d)] ?? `+${d}`;
}

function fmtYards(y: number): string {
  return `${Math.round(y)} yd`;
}

function finishFlight(state: GameState): void {
  const f = state.flight;
  if (!f) return;
  const hole = currentHole(state);
  if (f.holed) {
    state.ball.copy(f.end);
    if (isMyBall(state)) state.scores[state.holeIndex] = state.strokes;
    state.banner = scoreName(state.strokes, hole.par, state.mode);
    setPhase(state, 'holed');
    hooks.onFlightDone?.(state);
    return;
  }
  if (f.endLie === 'water') {
    state.strokes++;
    state.penalties++;
    const drop = f.dropPoint ?? state.ball.clone();
    // Walk the drop back toward the shot's start until it is dry land.
    const from = state.ball.clone();
    const p = drop.clone();
    for (let i = 0; i < 60 && lieAt(p.x, p.z) === 'water'; i++) p.lerp(from, 0.08);
    state.ball.set(p.x, heightAt(p.x, p.z), p.z);
    state.banner = state.mode === 'disc' ? 'Gnome overboard! +1, drop' : 'Splash! +1 penalty, drop';
  } else {
    state.ball.copy(f.end);
    state.banner = `${LIES[f.endLie].name} · ${fmtYards(f.total)}`;
  }
  if (state.strokes >= ROUND.maxStrokes) {
    if (isMyBall(state)) state.scores[state.holeIndex] = state.strokes;
    state.banner = 'Picked up';
    setPhase(state, 'holed');
    hooks.onFlightDone?.(state);
    return;
  }
  setPhase(state, 'result');
  hooks.onFlightDone?.(state);
}

/** Next hole, or the final card after the last one (called from the scorecard button). */
export function nextHole(state: GameState): void {
  if (state.holeIndex + 1 >= HOLES.length) {
    setPhase(state, 'final');
    return;
  }
  startHole(state, state.holeIndex + 1);
}

/** Total strokes and to-par over the holes played so far. */
export function roundTotals(state: GameState): { strokes: number; toPar: number; played: number } {
  let strokes = 0;
  let par = 0;
  let played = 0;
  state.scores.forEach((s, i) => {
    if (s === null) return;
    strokes += s;
    par += HOLES[i].par;
    played++;
  });
  return { strokes, toPar: strokes - par, played };
}

function together(state: GameState): boolean {
  return state.online !== null && state.online.started && state.online.format === 'together';
}

/** Advances timed phases. Called once per frame by main.ts before the systems. */
export function tickRound(state: GameState, dt: number): void {
  state.time += dt;
  state.phaseTime += dt;
  if (state.drinkTime >= 0) {
    state.drinkTime += dt;
    if (state.drinkTime >= CONSUMABLES.drinkSeconds) state.drinkTime = -1;
  }
  switch (state.phase) {
    case 'intro':
      if (state.phaseTime >= ROUND.introSeconds) setPhase(state, 'aim');
      break;
    case 'flight':
      if (state.flight && state.phaseTime >= state.flight.duration + 0.3) finishFlight(state);
      break;
    case 'result':
      if (together(state)) break; // the host's next 'turn' moves everyone on
      if (state.phaseTime >= ROUND.resultSeconds) {
        const from = state.party;
        prepareShot(state);
        const to = partySpots(state.ball, state.aimYaw);
        const path = planDrive(from.mower, to.mower);
        const duration = Math.min(ROUND.driveMax, Math.max(ROUND.driveMin, pathLength(path) / ROUND.driveSpeed));
        state.drive = { from, to, duration, path };
        state.flight = null;
        setPhase(state, 'drive');
      }
      break;
    case 'drive':
      if (state.drive && state.phaseTime >= state.drive.duration) {
        state.party = state.drive.to;
        state.drive = null;
        setPhase(state, 'aim');
      }
      break;
    case 'holed':
      if (together(state)) break; // the host decides: next turn, or the card when everyone is done
      if (state.phaseTime >= ROUND.holedSeconds) setPhase(state, 'card');
      break;
    default:
      break;
  }
}

/** Re-place the party when the aim changes during 'aim' (so the golfer always addresses the ball square to the line). */
export function setAim(state: GameState, yaw: number): void {
  state.aimYaw = yaw;
  const spots = partySpots(state.ball, yaw);
  // The mower and partner stay parked; only the golfer turns with the aim.
  state.party = { ...state.party, golfer: spots.golfer };
}

/** Step the club up (-1, longer) or down (+1, shorter) the bag. */
export function cycleClub(state: GameState, delta: number): void {
  const i = CLUB_ORDER.indexOf(state.club);
  const n = Math.max(0, Math.min(CLUB_ORDER.length - 1, i + delta));
  state.club = CLUB_ORDER[n];
}

/** Display distance: feet on and around the green, yards elsewhere. */
export function fmtDistance(yards: number, lie: GameState['lie']): string {
  if ((lie === 'green' || lie === 'fringe') && yards <= 31) return `${Math.round(yards * 3)} ft`;
  return `${Math.round(yards)} yd`;
}


// ---------------------------------------------------------------------
// Mower route: grid A* around water (impassable), greens and bunkers (avoided), then smoothed.
// ---------------------------------------------------------------------

const ROUTE_CELL = 4; // yards per grid cell
const ROUTE_PAD = 120; // search area margin around the start and goal, yards
const ROUTE_MAX_CELLS = 220; // per side

type XZ = { x: number; z: number };

/** Extra cost of driving over a lie (Infinity = never). */
function routeCost(x: number, z: number): number {
  if (heightAt(x, z) < 0.25) return Infinity;
  const lie = lieAt(x, z);
  if (lie === 'water') return Infinity;
  if (lie === 'green') return 12;
  if (lie === 'sand') return 8;
  if (lie === 'fringe') return 3;
  return 1;
}

/** A straight drive is fine if every point along it (every 2 yd) is cheap ground. */
function clearLine(a: XZ, b: XZ): boolean {
  const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 2));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    if (routeCost(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t) > 1) return false;
  }
  return true;
}

export function pathLength(path: XZ[]): number {
  let len = 0;
  for (let i = 1; i < path.length; i++) len += Math.hypot(path[i].x - path[i - 1].x, path[i].z - path[i - 1].z);
  return len;
}

/** Route for the mower from a to b. Falls back to the straight line if no route is found. */
export function planDrive(a: XZ, b: XZ): XZ[] {
  const straight = [{ x: a.x, z: a.z }, { x: b.x, z: b.z }];
  if (clearLine(a, b)) return straight;

  const minX = Math.min(a.x, b.x) - ROUTE_PAD;
  const minZ = Math.min(a.z, b.z) - ROUTE_PAD;
  const nx = Math.min(ROUTE_MAX_CELLS, Math.ceil((Math.max(a.x, b.x) + ROUTE_PAD - minX) / ROUTE_CELL));
  const nz = Math.min(ROUTE_MAX_CELLS, Math.ceil((Math.max(a.z, b.z) + ROUTE_PAD - minZ) / ROUTE_CELL));
  const cx = (i: number): number => minX + (i + 0.5) * ROUTE_CELL;
  const cz = (j: number): number => minZ + (j + 0.5) * ROUTE_CELL;
  const cellOf = (p: XZ): number => {
    const i = Math.max(0, Math.min(nx - 1, Math.floor((p.x - minX) / ROUTE_CELL)));
    const j = Math.max(0, Math.min(nz - 1, Math.floor((p.z - minZ) / ROUTE_CELL)));
    return j * nx + i;
  };
  const cost = new Float32Array(nx * nz).fill(-1); // -1 = not sampled yet
  const costAt = (k: number): number => {
    if (cost[k] < 0) cost[k] = routeCost(cx(k % nx), cz(Math.floor(k / nx)));
    return cost[k];
  };
  const start = cellOf(a);
  const goal = cellOf(b);
  cost[start] = 1;
  cost[goal] = 1;
  const g = new Float32Array(nx * nz).fill(Infinity);
  const came = new Int32Array(nx * nz).fill(-1);
  const closed = new Uint8Array(nx * nz);
  const gx = goal % nx;
  const gz = Math.floor(goal / nx);
  const h = (k: number): number => Math.hypot((k % nx) - gx, Math.floor(k / nx) - gz);
  // Binary heap of [f, k].
  const heap: [number, number][] = [];
  const push = (f: number, k: number): void => {
    heap.push([f, k]);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p][0] <= heap[i][0]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = (): [number, number] => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };
  g[start] = 0;
  push(h(start), start);
  let found = false;
  while (heap.length > 0) {
    const [, k] = pop();
    if (closed[k]) continue;
    closed[k] = 1;
    if (k === goal) {
      found = true;
      break;
    }
    const i = k % nx;
    const j = Math.floor(k / nx);
    for (let dj = -1; dj <= 1; dj++) {
      for (let di = -1; di <= 1; di++) {
        if (di === 0 && dj === 0) continue;
        const ni = i + di;
        const nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= nx || nj >= nz) continue;
        const nk = nj * nx + ni;
        if (closed[nk]) continue;
        const c = costAt(nk);
        if (c === Infinity) continue;
        const step = (di !== 0 && dj !== 0 ? Math.SQRT2 : 1) * c;
        const ng = g[k] + step;
        if (ng < g[nk]) {
          g[nk] = ng;
          came[nk] = k;
          push(ng + h(nk), nk);
        }
      }
    }
  }
  if (!found) return straight;

  // Cells back to front, then pull the string: skip every corner that a clear straight line can cut.
  const cells: XZ[] = [];
  for (let k = goal; k !== -1; k = came[k]) cells.push({ x: cx(k % nx), z: cz(Math.floor(k / nx)) });
  cells.reverse();
  cells[0] = { x: a.x, z: a.z };
  cells[cells.length - 1] = { x: b.x, z: b.z };
  const out: XZ[] = [cells[0]];
  let anchor = 0;
  while (anchor < cells.length - 1) {
    let far = anchor + 1;
    for (let k = cells.length - 1; k > anchor + 1; k--) {
      if (clearLine(cells[anchor], cells[k])) {
        far = k;
        break;
      }
    }
    out.push(cells[far]);
    anchor = far;
  }
  return out;
}

/** Point and heading at distance d along a path. */
function alongPath(path: XZ[], d: number): { x: number; z: number; yaw: number } {
  let left = Math.max(0, d);
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    const seg = Math.hypot(b.x - a.x, b.z - a.z);
    if (left <= seg || i === path.length - 1) {
      const t = seg > 0 ? Math.min(1, left / seg) : 1;
      return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, yaw: yawTo(a.x, a.z, b.x, b.z) };
    }
    left -= seg;
  }
  const p = path[path.length - 1];
  return { x: p.x, z: p.z, yaw: 0 };
}

/**
 * Where the mower is right now: parked at state.party.mower, or (phase 'drive') moving along drive.path with
 * ease-in-out, facing its travel direction (looking a few yards ahead, so corners turn smoothly) and turning to
 * the parked facing at the end. party.ts draws the mower here and camera.ts follows it, so both agree.
 */
export function mowerPose(state: GameState): Spot & { speed: number } {
  return cartPose(state, 0);
}

/** Together mode: cart k parks CONVOY_GAP * k yards behind the first cart (along its facing). */
export function convoySpot(mower: Spot, k: number): Spot {
  if (k === 0) return mower;
  const x = mower.x - Math.sin(mower.facing) * CONVOY_GAP * k;
  const z = mower.z - Math.cos(mower.facing) * CONVOY_GAP * k;
  return { x, y: Math.max(0, heightAt(x, z)), z, facing: mower.facing };
}

/**
 * Where cart k (0 = the first; together mode has cartCount() carts) is right now, like mowerPose(): parked in the
 * convoy, or driving the same route as cart 0 from its own parked spot to its own new one.
 */
export function cartPose(state: GameState, k: number): Spot & { speed: number } {
  const d = state.drive;
  if (state.phase !== 'drive' || !d) return { ...convoySpot(state.party.mower, k), speed: 0 };
  const u = Math.min(1, state.phaseTime / d.duration);
  const e = u * u * (3 - 2 * u);
  const a = convoySpot(d.from.mower, k);
  const b = convoySpot(d.to.mower, k);
  const route = k === 0 ? d.path : [{ x: a.x, z: a.z }, ...d.path.slice(1, -1), { x: b.x, z: b.z }];
  const total = pathLength(route);
  const here = alongPath(route, total * e);
  const ahead = alongPath(route, total * e + 4);
  const travel = total < 0.5 ? b.facing : Math.hypot(ahead.x - here.x, ahead.z - here.z) > 0.01 ? yawTo(here.x, here.z, ahead.x, ahead.z) : here.yaw;
  const turnIn = u < 0.8 ? 0 : (u - 0.8) / 0.2;
  let diff = b.facing - travel;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  const facing = travel + diff * turnIn;
  const speed = (total / d.duration) * 6 * u * (1 - u);
  return { x: here.x, y: Math.max(0, heightAt(here.x, here.z)), z: here.z, facing, speed };
}

/** Light a cigarillo (phase 'aim', one left, none lit). The swing meter runs slower for the next CONSUMABLES.smokeShots shots. */
export function lightCigarillo(state: GameState): boolean {
  if (state.phase !== 'aim' || state.cigarillos <= 0 || state.smokeShots > 0) return false;
  state.cigarillos--;
  state.smokeShots = CONSUMABLES.smokeShots;
  return true;
}

/** Crack a can of golf water (phase 'aim', one left, not already drinking). No effect on play. */
export function drinkGolfWater(state: GameState): boolean {
  if (state.phase !== 'aim' || state.beers <= 0 || state.drinkTime >= 0) return false;
  state.beers--;
  state.beersDrunk++;
  state.drinkTime = 0;
  return true;
}

/** Swing meter speed multiplier right now (slower while smoking). */
export function meterSpeedScale(state: GameState): number {
  return state.smokeShots > 0 ? CONSUMABLES.smokeMeterScale : 1;
}
