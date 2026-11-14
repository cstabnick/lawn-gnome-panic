// Game flow: whose turn it is, the phase machine, and what each ball counted as.
// tickGame runs once a frame before every system. Systems read state; they change it only through these functions.
import {
  LOOKS, NPC_TUNING, ROUND, THROW,
  type BallResult, type GameState, type LookId, type Mode, type NpcId, type Player, type ResultKind, type ThrowInput,
} from './config';
import { simulateThrow } from './physics';
import { NPCS, npcThrow } from './npc';
import { pickCartoon } from './cartoons/index';
import { cursor, frameMarks, isSplit } from './scoring';
import type { GnomeLook as SharedGnomeLook } from '@lawn/gnome';

/** Set by net.ts: called once for every throw bowled on this device in an online game. */
export const hooks: {
  onLocalThrow: ((turn: number, input: ThrowInput, downMask: number) => void) | null;
} = { onLocalThrow: null };

interface RemoteThrow {
  netId: number;
  turn: number;
  input: ThrowInput;
  down: number;
}
const pending: RemoteThrow[] = [];
let serial = 0;
/** The throw a CPU bowler has decided on for this turn (made when their 'aim' starts). */
let npcPlan: { turn: number; input: ThrowInput; fromX: number; fromYaw: number } | null = null;

const allUp = (): boolean[] => Array.from({ length: 10 }, () => true);

export function newState(): GameState {
  return {
    phase: 'title',
    phaseTime: 0,
    time: 0,
    mode: 'local',
    players: [],
    current: 0,
    frame: 0,
    ballInFrame: 0,
    standing: allUp(),
    aimX: 0,
    aimYaw: 0,
    input: null,
    sim: null,
    rollTime: 0,
    result: null,
    turn: 0,
    net: { status: 'off', message: '', code: null, waiting: 0, startsInS: 0 },
  };
}

function setPhase(state: GameState, phase: GameState['phase']): void {
  state.phase = phase;
  state.phaseTime = 0;
}

/** A player record for newGame. `npc` makes it a CPU bowler (local games only). */
export function makePlayer(name: string, look: LookId, color: number, local = true, netId = -1, npc: NpcId | null = null, customLook?: SharedGnomeLook): Player {
  const p: Player = { name: name.slice(0, 16) || LOOKS[look].name, look, color, rolls: [], local, netId, gone: false, npc };
  // Only set the key when there is a custom gnome: tests compare whole player records.
  // The shared look leaves bowlCut optional; the bowling look wants it as number | null.
  if (customLook !== undefined) p.customLook = { ...customLook, bowlCut: customLook.bowlCut ?? null };
  return p;
}

/** A CPU bowler's player record, from the roster in npc.ts. */
export function makeNpcPlayer(id: NpcId): Player {
  const n = NPCS[id];
  return makePlayer(n.name, n.look, n.color, true, -1, id);
}

/** Starts a fresh game with these players (bowling in this order). */
export function newGame(state: GameState, players: Player[], mode: Mode): void {
  pending.length = 0;
  npcPlan = null;
  state.mode = mode;
  state.players = players.map((p) => ({ ...p, rolls: [], gone: false }));
  state.current = 0;
  state.frame = 0;
  state.ballInFrame = 0;
  state.standing = allUp();
  state.aimX = 0;
  state.aimYaw = 0;
  state.input = null;
  state.sim = null;
  state.rollTime = 0;
  state.result = null;
  state.turn = 0;
  setPhase(state, 'intro');
}

/** Back to the title menu (net.ts leaves the match itself when it sees this). */
export function toTitle(state: GameState): void {
  pending.length = 0;
  state.players = [];
  state.sim = null;
  state.input = null;
  state.result = null;
  state.standing = allUp();
  setPhase(state, 'title');
}

/** Online lobby (menu.ts shows the waiting screen). */
export function toLobby(state: GameState): void {
  setPhase(state, 'lobby');
}

export function currentPlayer(state: GameState): Player | null {
  return state.players[state.current] ?? null;
}

/** True when a person on this device may aim and throw right now (never for a CPU bowler). */
export function canBowlHere(state: GameState): boolean {
  const p = currentPlayer(state);
  return state.phase === 'aim' && p !== null && p.local && !p.gone && p.npc === null;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** Moves the aim (only during 'aim' on the bowling device). Values are clamped. */
export function setAim(state: GameState, x: number, yaw: number): void {
  if (!canBowlHere(state)) return;
  state.aimX = clamp(x, -THROW.xRange, THROW.xRange);
  state.aimYaw = clamp(yaw, -THROW.aimRange, THROW.aimRange);
}

export function pinsToMask(down: readonly boolean[]): number {
  let m = 0;
  for (let i = 0; i < 10; i++) if (down[i]) m |= 1 << i;
  return m;
}

export function maskToPins(mask: number): boolean[] {
  return Array.from({ length: 10 }, (_, i) => (mask & (1 << i)) !== 0);
}

function clampInput(i: ThrowInput): ThrowInput {
  return {
    x: clamp(i.x, -THROW.xRange, THROW.xRange),
    aim: clamp(i.aim, -THROW.aimRange, THROW.aimRange),
    speed: clamp(i.speed, THROW.speedMin, THROW.speedMax),
    spin: clamp(i.spin, -1, 1),
  };
}

function startThrow(state: GameState, input: ThrowInput, downOverride: number | null): void {
  state.input = input;
  state.sim = simulateThrow(input, state.standing);
  if (downOverride !== null) {
    // Online: the bowler's own simulation is the truth (float maths can differ a hair between browsers).
    const d = maskToPins(downOverride);
    state.sim.down = state.standing.map((up, i) => up && d[i]);
  }
  state.rollTime = 0;
  setPhase(state, 'approach');
}

/**
 * The local bowler lets go (controls.ts calls this at the end of a swipe). Returns false if it is not
 * this device's turn. The run-up ('approach') starts now; the ball leaves the hand THROW.approachSeconds later.
 */
export function throwBall(state: GameState, input: ThrowInput): boolean {
  if (!canBowlHere(state)) return false;
  const turn = state.turn;
  const inp = clampInput(input);
  startThrow(state, inp, null);
  if (state.mode === 'online' && hooks.onLocalThrow && state.sim) hooks.onLocalThrow(turn, inp, pinsToMask(state.sim.down));
  return true;
}

/** net.ts: another player's throw arrived. It is played when the game reaches that turn. */
export function queueRemoteThrow(state: GameState, netId: number, turn: number, input: ThrowInput, down: number): void {
  if (turn < state.turn) return;
  if (pending.some((p) => p.turn === turn)) return;
  pending.push({ netId, turn, input: clampInput(input), down });
}

/** net.ts: an online player left. Their remaining turns are skipped. */
export function removePlayer(state: GameState, netId: number): void {
  const p = state.players.find((q) => q.netId === netId);
  if (p) p.gone = true;
}

/** Strikes in a row ending with this player's last ball. */
export function strikeStreak(p: Player): number {
  const marks = frameMarks(p.rolls).flat();
  let n = 0;
  for (let i = marks.length - 1; i >= 0 && marks[i] === 'X'; i--) n++;
  return n;
}

function classify(state: GameState, p: Player, wasFresh: boolean, count: number): ResultKind {
  const standingNow = state.standing;
  if (wasFresh && count === 10) {
    const s = strikeStreak(p);
    return s >= 4 ? 'hambone' : s === 3 ? 'turkey' : s === 2 ? 'double' : 'strike';
  }
  if (!wasFresh && standingNow.every((up) => !up)) return 'spare';
  if (count === 0) return state.sim?.gutter ? 'gutter' : 'miss';
  if (wasFresh && isSplit(standingNow)) return 'split';
  if (wasFresh && count === 9) return 'nine';
  return 'pins';
}

function finishBall(state: GameState): void {
  const p = currentPlayer(state);
  const sim = state.sim;
  if (!p || !sim) return;
  const before = cursor(p.rolls);
  let count = 0;
  for (let i = 0; i < 10; i++) {
    if (state.standing[i] && sim.down[i]) {
      count++;
      state.standing[i] = false;
    }
  }
  p.rolls.push(count);
  const kind = classify(state, p, before.fresh, count);
  const streak = before.fresh && count === 10 ? strikeStreak(p) : 0;
  // Seeded by the turn so every device in an online game picks the same cartoon.
  const cartoon = pickCartoon(kind, state.turn * 7919 + count * 31 + streak);
  state.turn++;
  const result: BallResult = { kind, count, player: state.current, serial: ++serial, cartoon, streak };
  state.result = result;
  setPhase(state, 'result');
}

function allDone(state: GameState): boolean {
  return state.players.every((p) => p.gone || cursor(p.rolls).done);
}

/** After the result screen: the same bowler again, the next bowler, or the end. */
function nextBall(state: GameState): void {
  const p = currentPlayer(state);
  if (p && !p.gone) {
    const c = cursor(p.rolls);
    if (!c.done && c.frame === state.frame) {
      state.ballInFrame = c.ball;
      if (c.fresh) state.standing = allUp();
      state.sim = null;
      state.input = null;
      setPhase(state, 'aim');
      return;
    }
  }
  nextBowler(state);
}

function nextBowler(state: GameState): void {
  state.sim = null;
  state.input = null;
  if (allDone(state)) {
    setPhase(state, 'final');
    return;
  }
  const n = state.players.length;
  for (let k = 1; k <= n; k++) {
    const i = (state.current + k) % n;
    const q = state.players[i];
    if (q.gone || cursor(q.rolls).done) continue;
    state.current = i;
    const c = cursor(q.rolls);
    state.frame = c.frame;
    state.ballInFrame = c.ball;
    state.standing = allUp();
    state.aimX = 0;
    state.aimYaw = 0;
    setPhase(state, 'intro');
    return;
  }
  setPhase(state, 'final');
}

/** How long the 'result' phase lasts for this result. */
export function resultSeconds(r: BallResult | null): number {
  if (r?.cartoon) return ROUND.cartoonSeconds;
  const big = r !== null && ['strike', 'double', 'turkey', 'hambone'].includes(r.kind);
  return big ? ROUND.bigResultSeconds : ROUND.resultSeconds;
}

const smooth = (t: number): number => t * t * (3 - 2 * t);

/** A CPU bowler's 'aim': decide the throw, slide the aim to it for NPC_TUNING.thinkSeconds, then bowl. */
function tickNpc(state: GameState, id: NpcId): void {
  if (!npcPlan || npcPlan.turn !== state.turn) {
    npcPlan = { turn: state.turn, input: clampInput(npcThrow(NPCS[id], state.standing, Math.random)), fromX: state.aimX, fromYaw: state.aimYaw };
  }
  const k = smooth(Math.min(1, state.phaseTime / (NPC_TUNING.thinkSeconds * 0.8)));
  state.aimX = npcPlan.fromX + (npcPlan.input.x - npcPlan.fromX) * k;
  state.aimYaw = npcPlan.fromYaw + (npcPlan.input.aim - npcPlan.fromYaw) * k;
  if (state.phaseTime >= NPC_TUNING.thinkSeconds) {
    const input = npcPlan.input;
    npcPlan = null;
    startThrow(state, input, null);
  }
}

export function tickGame(state: GameState, dt: number): void {
  state.time += dt;
  state.phaseTime += dt;
  switch (state.phase) {
    case 'intro':
      if (state.phaseTime >= ROUND.introSeconds) setPhase(state, 'aim');
      break;
    case 'aim': {
      const p = currentPlayer(state);
      if (!p || p.gone) {
        nextBowler(state);
        break;
      }
      if (p.npc !== null) {
        tickNpc(state, p.npc);
        break;
      }
      if (!p.local) {
        const i = pending.findIndex((r) => r.turn === state.turn);
        if (i >= 0) {
          const r = pending[i];
          pending.splice(i, 1);
          startThrow(state, r.input, r.down);
        }
      }
      break;
    }
    case 'approach':
      if (state.phaseTime >= THROW.approachSeconds) {
        setPhase(state, 'roll');
        state.rollTime = 0;
      }
      break;
    case 'roll':
      state.rollTime += dt;
      if (!state.sim || state.rollTime >= state.sim.duration + ROUND.settleSeconds) finishBall(state);
      break;
    case 'result':
      if (state.phaseTime >= resultSeconds(state.result)) nextBall(state);
      break;
    default:
      break;
  }
  // Drop stale remote throws (a turn already played).
  for (let i = pending.length - 1; i >= 0; i--) if (pending[i].turn < state.turn) pending.splice(i, 1);
}
