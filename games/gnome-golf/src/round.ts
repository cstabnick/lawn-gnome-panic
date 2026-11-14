// Round flow: holes, strokes, penalties and the phase machine. Systems read GameState and call these
// functions; only this file changes state.phase (except controls.ts, which moves 'aim' <-> 'swing').
import * as THREE from 'three';
import { CLUB_ORDER, CONSUMABLES, HOLES, LIES, PARTY, ROUND, type ClubId, type GameState, type HoleDef, type PartySpots, type Shot, type Spot } from './config';
import { distToPath, heightAt, lieAt } from './course';
import { estimateCarry, simulateShot } from './physics';

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
}

export function startHole(state: GameState, index: number): void {
  state.holeIndex = index;
  const hole = currentHole(state);
  state.strokes = 0;
  state.penalties = 0;
  state.flight = null;
  state.lastShot = null;
  state.drive = null;
  state.wind = randomWind();
  state.ball.set(hole.tee.x, 0, hole.tee.z);
  prepareShot(state);
  state.lie = 'tee';
  state.club = defaultClub(state);
  state.party = partySpots(state.ball, state.aimYaw);
  state.banner = `Hole ${index + 1} · Par ${hole.par}`;
  setPhase(state, 'intro');
}

export function newRound(state: GameState): void {
  state.scores = HOLES.map(() => null);
  state.cigarillos = CONSUMABLES.cigarillosPerRound;
  state.smokeShots = 0;
  state.beers = CONSUMABLES.beersPerRound;
  state.beersDrunk = 0;
  state.drinkTime = -1;
  startHole(state, 0);
}

export function newState(): GameState {
  const state: GameState = {
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
  };
  // Park the camera's subject at hole 1 for the title screen.
  const hole = HOLES[0];
  state.ball.set(hole.tee.x, heightAt(hole.tee.x, hole.tee.z), hole.tee.z);
  state.aimYaw = yawTo(hole.tee.x, hole.tee.z, hole.path[1].x, hole.path[1].z);
  state.party = partySpots(state.ball, state.aimYaw);
  return state;
}

/** Skip the hole intro (tap during 'intro'). */
export function skipIntro(state: GameState): void {
  if (state.phase === 'intro') setPhase(state, 'aim');
}

/** Called by controls.ts when the swing meter completes. Plays the shot and starts the flight. */
export function takeShot(state: GameState, shot: Shot): void {
  const hole = currentHole(state);
  state.lastShot = shot;
  state.strokes++;
  state.flight = simulateShot(state.ball, shot, state.lie, state.wind, hole.pin);
  state.swing = { stage: 'idle', marker: 0, power: 0 };
  if (state.smokeShots > 0) state.smokeShots--;
  setPhase(state, 'flight');
}

/** Score name for strokes relative to par. */
export function scoreName(strokes: number, par: number): string {
  if (strokes === 1) return 'Hole in one!';
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
    state.scores[state.holeIndex] = state.strokes;
    state.banner = scoreName(state.strokes, hole.par);
    setPhase(state, 'holed');
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
    state.banner = 'Splash! +1 penalty, drop';
  } else {
    state.ball.copy(f.end);
    state.banner = `${LIES[f.endLie].name} · ${fmtYards(f.total)}`;
  }
  if (state.strokes >= ROUND.maxStrokes) {
    state.scores[state.holeIndex] = state.strokes;
    state.banner = 'Picked up';
    setPhase(state, 'holed');
    return;
  }
  setPhase(state, 'result');
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
      if (state.phaseTime >= ROUND.resultSeconds) {
        const from = state.party;
        prepareShot(state);
        const to = partySpots(state.ball, state.aimYaw);
        const dist = Math.hypot(to.mower.x - from.mower.x, to.mower.z - from.mower.z);
        const duration = Math.min(ROUND.driveMax, Math.max(ROUND.driveMin, dist / ROUND.driveSpeed));
        state.drive = { from, to, duration };
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


/**
 * Where the mower is right now: parked at state.party.mower, or (phase 'drive') moving from drive.from.mower
 * to drive.to.mower with ease-in-out, facing its travel direction and turning to the parked facing at the end.
 * party.ts draws the mower here and camera.ts follows it, so both agree.
 */
export function mowerPose(state: GameState): Spot & { speed: number } {
  const d = state.drive;
  if (state.phase !== 'drive' || !d) return { ...state.party.mower, speed: 0 };
  const u = Math.min(1, state.phaseTime / d.duration);
  const e = u * u * (3 - 2 * u);
  const a = d.from.mower;
  const b = d.to.mower;
  const x = a.x + (b.x - a.x) * e;
  const z = a.z + (b.z - a.z) * e;
  const travel = Math.hypot(b.x - a.x, b.z - a.z) < 0.5 ? b.facing : yawTo(a.x, a.z, b.x, b.z);
  const k = u < 0.8 ? 0 : (u - 0.8) / 0.2;
  // Shortest-way blend from travel heading to the parked heading.
  let diff = b.facing - travel;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  const facing = travel + diff * k;
  const speed = (Math.hypot(b.x - a.x, b.z - a.z) / d.duration) * 6 * u * (1 - u);
  return { x, y: Math.max(0, heightAt(x, z)), z, facing, speed };
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
