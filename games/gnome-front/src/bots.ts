// src/bots.ts: bot soldiers for both teams. Every non-player soldier plays conquest. Bots form squads of four: the lowest-id
// alive member picks a flag for the squad and the others follow in formation. Hurt or reloading bots take cover, bots steer
// around obstacles, keep the range their weapon likes, and drive vehicles. Aiming and shooting live in botAim.ts.
import * as THREE from 'three';
import { ARENA_HALF, BASES, TUNING, weaponOf } from './config';
import type { ClassId, FlagState, Game, Obstacle, Soldier, Team, Vehicle, VehicleControl } from './config';
import { moveSoldier } from './soldiers';
import { spawnPoints } from './conquest';
import { botCombat, resetBotCombat } from './botAim';
import type { BotCombatInfo } from './botAim';
import { driveVehicle, enterVehicle, exitVehicle, nearestEnterable } from './vehicles';

const SQUAD_SIZE = 4;
const FORMATION_BEHIND = 4;     // units behind the leader
const FORMATION_SIDE = 4;       // units between slots, side to side
const FORMATION_ARRIVE = 3;     // within this of the formation point a member matches the leader's movement
const LEADER_FAR = 60;          // members this far from their leader head for the goal directly
const REGOAL_S = 2;             // leader re-picks its flag this often
const THREAT_RANGE = 20;        // enemies this close to a flag make the leader keep it
const WANDER_S = 3;
const SPRINT_DIST = 20;
const ARRIVE_DIST = 1.2;
const TURN_RATE = 6;            // rad/s
const STRAFE_MIN_S = 1;
const STRAFE_EXTRA_S = 1.5;
const GOAL_DRIFT = 0.3;
const SNIPER_CAP = 3;           // at most this many bots per team with nextClassId 'sniper'
const OBSTACLE_LOOK = 4;        // units ahead checked for obstacles
const OBSTACLE_TURN = (35 * Math.PI) / 180;
const COVER_HP = 45;            // take cover when hurt below this and hit recently
const COVER_EXIT_HP = 85;       // leave cover at this health
const COVER_RANGE = 25;
const COVER_RELOAD_RANGE = 25;  // take cover to reload when the target is this close
const COVER_RUN_MAX_S = 5;
const COVER_HOLD_S = 6;
const COVER_COOLDOWN_S = 3;
const COVER_PAD = 0.9;          // gap between cover and the obstacle edge
const RUNOVER_RANGE = 30;
const RUNOVER_ARC = (60 * Math.PI) / 180;
const MATE_AHEAD = 6;           // do not drive into teammates on foot this close ahead
const HOP_OFF_HP = 0.25;        // a mower driver leaves when its vehicle is below this fraction of maxHp
const CLASS_WEIGHTS: readonly { id: ClassId; w: number }[] = [
  { id: 'rifleman', w: 35 },
  { id: 'gunner', w: 25 },
  { id: 'sniper', w: 15 },
  { id: 'brawler', w: 25 },
];

type CoverMode = 'none' | 'run' | 'hold' | 'retreat';

interface Brain {
  goal: FlagState | null;
  goalT: number;
  wasOwned: boolean;       // the leader's goal was ours last frame
  wanderFor: FlagState | null;
  wander: THREE.Vector3;   // x, z: point to walk to while at the goal
  wanderT: number;
  strafeDir: 1 | -1;
  strafeT: number;
  wantVehicle: boolean;
  lastPos: THREE.Vector3;
  stuckT: number;
  unstickT: number;
  unstickDir: number;
  unstickJumped: boolean;
  moveX: number;           // this frame's wish (unit or zero), read by squad members
  moveZ: number;
  coverMode: CoverMode;
  coverX: number;
  coverZ: number;
  coverT: number;
  coverCd: number;
  vStuckT: number;
  reverseT: number;
}

interface Move { wx: number; wz: number; sprint: boolean }

interface Squad { team: Team; leader: Soldier | null; members: Soldier[] }
interface SquadSeat { squad: Squad; slot: number }
interface SquadState { squads: Squad[]; seats: Map<number, SquadSeat> }

const STILL: Move = { wx: 0, wz: 0, sprint: false };

const brainsByGame = new WeakMap<Game, Map<number, Brain>>();

function makeBrain(s: Soldier): Brain {
  return {
    goal: null,
    goalT: 0,
    wasOwned: false,
    wanderFor: null,
    wander: new THREE.Vector3(),
    wanderT: 0,
    strafeDir: Math.random() < 0.5 ? 1 : -1,
    strafeT: 0,
    wantVehicle: Math.random() < TUNING.botVehicleChance,
    lastPos: s.pos.clone(),
    stuckT: 1.5,
    unstickT: 0,
    unstickDir: 0,
    unstickJumped: false,
    moveX: 0,
    moveZ: 0,
    coverMode: 'none',
    coverX: 0,
    coverZ: 0,
    coverT: 0,
    coverCd: 0,
    vStuckT: 0,
    reverseT: 0,
  };
}

/** The brain map for this game. The first call subscribes to spawn and kill events. */
function brainsFor(game: Game): Map<number, Brain> {
  const existing = brainsByGame.get(game);
  if (existing) return existing;
  const created = new Map<number, Brain>();
  brainsByGame.set(game, created);
  game.on((e) => {
    if (e.type === 'spawn' && !e.soldier.isPlayer) {
      created.set(e.soldier.id, makeBrain(e.soldier));
      resetBotCombat(e.soldier);
    } else if (e.type === 'kill' && !e.victim.isPlayer) {
      e.victim.nextClassId = pickNextClass(game, e.victim);
    }
  });
  return created;
}

function brainOf(game: Game, s: Soldier): Brain {
  const map = brainsFor(game);
  let b = map.get(s.id);
  if (!b) {
    b = makeBrain(s);
    map.set(s.id, b);
  }
  return b;
}

/** Weighted class pick for a bot's next life, never letting a team hold more than SNIPER_CAP sniper picks. */
function pickNextClass(game: Game, victim: Soldier): ClassId {
  let snipers = 0;
  for (const x of game.soldiers) {
    if (x !== victim && x.team === victim.team && !x.isPlayer && x.nextClassId === 'sniper') snipers++;
  }
  const pool = CLASS_WEIGHTS.filter((c) => c.id !== 'sniper' || snipers < SNIPER_CAP);
  const total = pool.reduce((a, c) => a + c.w, 0);
  let r = Math.random() * total;
  for (const c of pool) {
    r -= c.w;
    if (r < 0) return c.id;
  }
  return 'rifleman';
}

/** Splits each team's bots into squads of four, in game.soldiers order, and finds each squad's leader. */
function buildSquads(game: Game): SquadState {
  const squads: Squad[] = [];
  const seats = new Map<number, SquadSeat>();
  for (const team of [0, 1] as const) {
    const bots = game.soldiers.filter((x) => x.team === team && !x.isPlayer);
    for (let i = 0; i < bots.length; i += SQUAD_SIZE) {
      const members = bots.slice(i, i + SQUAD_SIZE);
      let leader: Soldier | null = null;
      for (const m of members) {
        if (m.alive && (leader === null || m.id < leader.id)) leader = m;
      }
      const squad: Squad = { team, leader, members };
      squads.push(squad);
      members.forEach((m, slot) => seats.set(m.id, { squad, slot }));
    }
  }
  return { squads, seats };
}

/** Thinks and acts for every alive non-player soldier. */
export function updateBots(game: Game, dt: number): void {
  const sq = buildSquads(game);
  for (const s of game.soldiers) {
    if (s.isPlayer || !s.alive) continue;
    const seat = sq.seats.get(s.id);
    if (!seat) continue;
    updateBot(game, s, brainOf(game, s), seat, sq, dt);
  }
}

function updateBot(game: Game, s: Soldier, b: Brain, seat: SquadSeat, sq: SquadState, dt: number): void {
  b.moveX = 0;
  b.moveZ = 0;

  const leader = seat.squad.leader;
  if (leader === s) {
    updateLeaderGoal(game, s, b, seat.squad, sq, dt);
  } else if (leader) {
    b.goal = brainOf(game, leader).goal;
  } else {
    b.goal = null;
  }

  const info = botCombat(game, s, dt);

  if (s.vehicle) {
    driveBot(game, s, s.vehicle, b, info, dt);
    return;
  }

  if (b.wantVehicle && b.goal && horizDist(s.pos.x, s.pos.z, b.goal.def.x, b.goal.def.z) > 40) {
    const v = nearestEnterable(game, s);
    if (v) {
      enterVehicle(game, s, v);
      return;
    }
  }

  footBot(game, s, b, seat, info, dt);
}

// ---------------------------------------------------------------------
// Squads and goals
// ---------------------------------------------------------------------

/** The squad leader re-picks its flag every REGOAL_S, or at once when it has just become ours and nothing threatens it. */
function updateLeaderGoal(game: Game, s: Soldier, b: Brain, squad: Squad, sq: SquadState, dt: number): void {
  b.goalT -= dt;
  const owned = b.goal !== null && b.goal.owner === s.team;
  const becameOwned = owned && !b.wasOwned;
  b.wasOwned = owned;
  const threatened = b.goal !== null && enemyNear(game, s.team, b.goal, THREAT_RANGE);
  if (b.goal === null || b.goalT <= 0 || (becameOwned && !threatened)) {
    b.goal = pickFlag(game, s, squad, sq);
    b.goalT = REGOAL_S;
    b.wasOwned = b.goal !== null && b.goal.owner === s.team;
  }
}

function pickFlag(game: Game, s: Soldier, squad: Squad, sq: SquadState): FlagState | null {
  let best: FlagState | null = null;
  let bestScore = Infinity;
  for (const f of game.flags) {
    let score = horizDist(s.pos.x, s.pos.z, f.def.x, f.def.z) / 10;
    if (f.owner === null) {
      score -= 3;
    } else if (f.owner !== s.team) {
      score -= 6;
    } else {
      // Ours: under attack only while it is not fully held and enemies stand on it.
      const enemyCapturing = Math.abs(f.progress) < 0.98 && enemyNear(game, s.team, f, TUNING.captureRadius + 2);
      score += enemyCapturing ? -8 : 8;
    }
    for (const other of sq.squads) {
      if (other === squad || other.team !== s.team || other.leader === null) continue;
      if (brainOf(game, other.leader).goal === f) score += 4;
    }
    score += Math.random() * 2;
    if (score < bestScore) {
      bestScore = score;
      best = f;
    }
  }
  return best;
}

function enemyNear(game: Game, team: Team, f: FlagState, range: number): boolean {
  return game.soldiers.some(
    (e) => e.team !== team && e.alive && horizDist(e.pos.x, e.pos.z, f.def.x, f.def.z) < range,
  );
}

/** Where a bot on foot walks when it is not fighting: the goal, a wander point at the goal, or a hold point (snipers). */
function goalDest(b: Brain, s: Soldier, squad: Squad, dt: number): { x: number; z: number } | null {
  const goal = b.goal;
  if (!goal) return null;
  const alive = squad.members.filter((m) => m.alive).length;
  if (s.classId === 'sniper' && alive > 1) return holdPoint(s.team, goal);
  if (b.wanderFor !== goal) {
    b.wanderFor = goal;
    b.wanderT = 0;
  }
  if (horizDist(s.pos.x, s.pos.z, goal.def.x, goal.def.z) < TUNING.captureRadius * 0.7) {
    b.wanderT -= dt;
    if (b.wanderT <= 0) {
      pickWander(b, goal);
      b.wanderT = WANDER_S;
    }
    return { x: b.wander.x, z: b.wander.z };
  }
  return { x: goal.def.x, z: goal.def.z };
}

/** Snipers hold just outside the flag, on the side of their own base. */
function holdPoint(team: Team, goal: FlagState): { x: number; z: number } {
  const base = BASES[team];
  const dx = base.x - goal.def.x;
  const dz = base.z - goal.def.z;
  const len = Math.hypot(dx, dz) || 1;
  const r = TUNING.captureRadius + 12;
  return { x: goal.def.x + (dx / len) * r, z: goal.def.z + (dz / len) * r };
}

function pickWander(b: Brain, goal: FlagState): void {
  const a = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * TUNING.captureRadius * 0.7;
  b.wander.set(goal.def.x + Math.cos(a) * r, 0, goal.def.z + Math.sin(a) * r);
}

/** Slot k sits FORMATION_BEHIND units behind the leader and (k - 1.5) * FORMATION_SIDE to the side, in the leader's frame. */
function formationPoint(leader: Soldier, slot: number): { x: number; z: number } {
  const fx = Math.sin(leader.yaw);
  const fz = Math.cos(leader.yaw);
  const rx = -fz; // right = (-cos yaw, sin yaw)
  const rz = fx;
  const side = (slot - 1.5) * FORMATION_SIDE;
  return {
    x: leader.pos.x - fx * FORMATION_BEHIND + rx * side,
    z: leader.pos.z - fz * FORMATION_BEHIND + rz * side,
  };
}

// ---------------------------------------------------------------------
// On foot
// ---------------------------------------------------------------------

function footBot(
  game: Game,
  s: Soldier,
  b: Brain,
  seat: SquadSeat,
  info: BotCombatInfo,
  dt: number,
): void {
  updateCover(game, s, b, info, dt);

  let mv: Move;
  const target = info.target;
  if (b.coverMode !== 'none') {
    mv = coverMove(s, b);
  } else if (target) {
    mv = fightMove(s, b, target, info.targetDist, dt);
  } else {
    mv = advanceMove(game, s, b, seat, dt);
  }

  let wx = mv.wx;
  let wz = mv.wz;
  if (wx !== 0 || wz !== 0) {
    const steered = steerAroundObstacles(game, s, wx, wz);
    wx = steered.wx;
    wz = steered.wz;
  }

  // Stuck check: every 1.5 s, did we get anywhere while trying to move?
  let jump = false;
  const wl = Math.hypot(wx, wz);
  b.stuckT -= dt;
  if (b.stuckT <= 0) {
    b.stuckT = 1.5;
    const moved = horizDist(s.pos.x, s.pos.z, b.lastPos.x, b.lastPos.z);
    if (wl > 0 && moved < 0.8 && b.unstickT <= 0) {
      b.unstickT = 1;
      b.unstickDir = Math.random() * Math.PI * 2;
      b.unstickJumped = false;
    }
    b.lastPos.copy(s.pos);
  }
  if (b.unstickT > 0) {
    wx = Math.sin(b.unstickDir);
    wz = Math.cos(b.unstickDir);
    if (!b.unstickJumped) {
      jump = true;
      b.unstickJumped = true;
    }
    b.unstickT -= dt;
  }

  b.moveX = wx;
  b.moveZ = wz;

  if (!target) {
    s.ads = false;
    s.pitch = 0;
    // Face the threat so botCombat can find the shooter; otherwise face the way we walk.
    if (info.threat) turnToward(s, bearing(s.pos.x, s.pos.z, info.threat.x, info.threat.z), dt);
    else if (wl > 0.01) turnToward(s, Math.atan2(wx, wz), dt);
  }

  moveSoldier(game, s, wx, wz, mv.sprint, jump, dt);
}

/** Range keeping with a target: advance past the band, back off inside it, otherwise strafe and drift to the goal. */
function fightMove(s: Soldier, b: Brain, target: Soldier, dist: number, dt: number): Move {
  const [minR, maxR] = weaponOf(s).botRange;
  const dx = target.pos.x - s.pos.x;
  const dz = target.pos.z - s.pos.z;
  const len = Math.max(dist, 0.001);
  const ux = dx / len;
  const uz = dz / len;
  if (dist > maxR) return { wx: ux, wz: uz, sprint: false };
  if (dist < minR) return { wx: -ux, wz: -uz, sprint: false };

  b.strafeT -= dt;
  if (b.strafeT <= 0) {
    b.strafeDir = b.strafeDir === 1 ? -1 : 1;
    b.strafeT = STRAFE_MIN_S + Math.random() * STRAFE_EXTRA_S;
  }
  // Right of facing is (-cos yaw, 0, sin yaw)
  let wx = -Math.cos(s.yaw) * b.strafeDir;
  let wz = Math.sin(s.yaw) * b.strafeDir;
  if (b.goal) {
    const gx = b.goal.def.x - s.pos.x;
    const gz = b.goal.def.z - s.pos.z;
    const gl = Math.hypot(gx, gz);
    if (gl > 0.001) {
      wx += (gx / gl) * GOAL_DRIFT;
      wz += (gz / gl) * GOAL_DRIFT;
    }
  }
  return unitMove(wx, wz, false);
}

/** No target: squad leaders walk to the goal; members hold formation, or walk to their leader when it is far. */
function advanceMove(game: Game, s: Soldier, b: Brain, seat: SquadSeat, dt: number): Move {
  const leader = seat.squad.leader;
  let dest: { x: number; z: number } | null = null;
  if (leader !== null && leader !== s && horizDist(s.pos.x, s.pos.z, leader.pos.x, leader.pos.z) <= LEADER_FAR) {
    const f = formationPoint(leader, seat.slot);
    if (horizDist(s.pos.x, s.pos.z, f.x, f.z) > FORMATION_ARRIVE) {
      dest = f;
    } else {
      // In formation: match the leader's movement.
      const lb = brainOf(game, leader);
      return { wx: lb.moveX, wz: lb.moveZ, sprint: false };
    }
  } else {
    dest = goalDest(b, s, seat.squad, dt);
  }
  if (!dest) return STILL;
  const dx = dest.x - s.pos.x;
  const dz = dest.z - s.pos.z;
  const d = Math.hypot(dx, dz);
  if (d < ARRIVE_DIST) return STILL;
  return { wx: dx / d, wz: dz / d, sprint: d > SPRINT_DIST };
}

// ---------------------------------------------------------------------
// Cover
// ---------------------------------------------------------------------

function wantsCover(s: Soldier, info: BotCombatInfo): boolean {
  if (info.underFire && s.hp < COVER_HP) return true;
  return s.reloadT > 0 && info.target !== null && info.targetDist < COVER_RELOAD_RANGE;
}

function updateCover(game: Game, s: Soldier, b: Brain, info: BotCombatInfo, dt: number): void {
  b.coverCd -= dt;
  switch (b.coverMode) {
    case 'none':
      if (b.coverCd <= 0 && wantsCover(s, info)) startCover(game, s, b, info);
      break;
    case 'run': {
      b.coverT -= dt;
      const d = horizDist(s.pos.x, s.pos.z, b.coverX, b.coverZ);
      if (d < ARRIVE_DIST || b.coverT <= 0) {
        b.coverMode = 'hold';
        b.coverT = COVER_HOLD_S;
      }
      break;
    }
    case 'hold':
      b.coverT -= dt;
      if (s.hp >= COVER_EXIT_HP || b.coverT <= 0) endCover(b);
      break;
    case 'retreat':
      b.coverT -= dt;
      if (b.coverT <= 0 || horizDist(s.pos.x, s.pos.z, b.coverX, b.coverZ) < 3) endCover(b);
      break;
  }
}

function endCover(b: Brain): void {
  b.coverMode = 'none';
  b.coverCd = COVER_COOLDOWN_S;
}

function startCover(game: Game, s: Soldier, b: Brain, info: BotCombatInfo): void {
  const threat = info.threat ?? (info.target ? { x: info.target.pos.x, z: info.target.pos.z } : null);
  if (!threat) return;
  const spot = findCover(game, s, threat);
  if (spot) {
    b.coverMode = 'run';
    b.coverX = spot.x;
    b.coverZ = spot.z;
    b.coverT = COVER_RUN_MAX_S;
    return;
  }
  const home = nearestOf(spawnPoints(game, s.team), s.pos.x, s.pos.z);
  b.coverMode = 'retreat';
  b.coverX = home.x;
  b.coverZ = home.z;
  b.coverT = COVER_HOLD_S;
}

/** The nearest obstacle within COVER_RANGE whose far side (from the threat) is clear: a point just behind it. */
function findCover(game: Game, s: Soldier, threat: { x: number; z: number }): { x: number; z: number } | null {
  const cands = game.obstacles
    .filter((o) => horizDist(s.pos.x, s.pos.z, o.x, o.z) <= COVER_RANGE)
    .sort((a, c) => horizDist(s.pos.x, s.pos.z, a.x, a.z) - horizDist(s.pos.x, s.pos.z, c.x, c.z));
  for (const o of cands) {
    let ux = o.x - threat.x;
    let uz = o.z - threat.z;
    let len = Math.hypot(ux, uz);
    if (len < 0.01) {
      ux = o.x - s.pos.x;
      uz = o.z - s.pos.z;
      len = Math.hypot(ux, uz);
    }
    if (len < 0.01) continue;
    const d = o.r + COVER_PAD;
    const cx = o.x + (ux / len) * d;
    const cz = o.z + (uz / len) * d;
    if (Math.abs(cx) > ARENA_HALF || Math.abs(cz) > ARENA_HALF) continue;
    if (game.obstacles.some((p) => p !== o && horizDist(cx, cz, p.x, p.z) < p.r + TUNING.soldierRadius)) continue;
    return { x: cx, z: cz };
  }
  return null;
}

function coverMove(s: Soldier, b: Brain): Move {
  if (b.coverMode === 'hold') return STILL;
  const dx = b.coverX - s.pos.x;
  const dz = b.coverZ - s.pos.z;
  const d = Math.hypot(dx, dz);
  if (d < ARRIVE_DIST) return STILL;
  return { wx: dx / d, wz: dz / d, sprint: true };
}

// ---------------------------------------------------------------------
// Obstacle steering
// ---------------------------------------------------------------------

/** Looks OBSTACLE_LOOK units ahead along (wx, wz) and turns the wish away from any obstacle in the way (up to 3 turns). */
function steerAroundObstacles(game: Game, s: Soldier, wx: number, wz: number): { wx: number; wz: number } {
  let dx = wx;
  let dz = wz;
  for (let attempt = 0; attempt < 3; attempt++) {
    const hit = blockingObstacle(game, s.pos.x, s.pos.z, dx, dz);
    if (!hit) break;
    const cross = dx * (hit.z - s.pos.z) - dz * (hit.x - s.pos.x);
    const sign = cross > 0 ? -1 : 1;
    const c = Math.cos(sign * OBSTACLE_TURN);
    const sn = Math.sin(sign * OBSTACLE_TURN);
    const nx = dx * c - dz * sn;
    const nz = dx * sn + dz * c;
    dx = nx;
    dz = nz;
  }
  return { wx: dx, wz: dz };
}

function blockingObstacle(game: Game, x: number, z: number, dx: number, dz: number): Obstacle | null {
  for (const o of game.obstacles) {
    const R = o.r + TUNING.soldierRadius + 0.3;
    const t = clamp((o.x - x) * dx + (o.z - z) * dz, 0, OBSTACLE_LOOK);
    const cx = x + dx * t - o.x;
    const cz = z + dz * t - o.z;
    if (cx * cx + cz * cz < R * R) return o;
  }
  return null;
}

// ---------------------------------------------------------------------
// In a vehicle
// ---------------------------------------------------------------------

function driveBot(game: Game, s: Soldier, v: Vehicle, b: Brain, info: BotCombatInfo, dt: number): void {
  // A badly damaged mower is abandoned.
  if (v.def.kind !== 'combine' && v.hp < HOP_OFF_HP * v.def.maxHp) {
    exitVehicle(game, s);
    b.wantVehicle = false;
    return;
  }

  if (!info.target) {
    turnToward(s, v.yaw, dt);
    s.pitch = 0;
    s.ads = false;
  }

  let ctl: VehicleControl = { throttle: 0, steer: 0 };
  const goal = b.goal;
  const mate = nearestMateAhead(game, s, v);
  const victim = mate ? null : nearestRunOver(game, s, v);
  if (mate) {
    // Swerve to the side away from the teammate.
    const fx = Math.sin(v.yaw);
    const fz = Math.cos(v.yaw);
    const rx = -fz;
    const rz = fx;
    const lateral = (mate.pos.x - v.pos.x) * rx + (mate.pos.z - v.pos.z) * rz;
    const side = lateral >= 0 ? -1 : 1;
    ctl = steerToward(v, v.pos.x + fx * 8 + rx * 8 * side, v.pos.z + fz * 8 + rz * 8 * side);
    ctl.throttle = 0.5;
  } else if (victim) {
    ctl = steerToward(v, victim.pos.x, victim.pos.z);
  } else if (goal) {
    const dGoal = horizDist(v.pos.x, v.pos.z, goal.def.x, goal.def.z);
    if (dGoal < TUNING.captureRadius * 0.6) {
      if (v.def.kind !== 'combine') {
        exitVehicle(game, s);
        b.wantVehicle = false;
        return;
      }
      // The Combine circles the flag until it is owned; the leader then picks a new goal.
      ctl = { throttle: 0.5, steer: 0.6 };
    } else {
      ctl = steerToward(v, goal.def.x, goal.def.z);
      if (dGoal < 6) ctl.throttle = 0;
    }
  }

  // Stuck: barely moving while asked to drive, so reverse for a while.
  if (b.reverseT <= 0 && ctl.throttle > 0 && Math.abs(v.speed) < 1) {
    b.vStuckT += dt;
    if (b.vStuckT >= 2) {
      b.vStuckT = 0;
      b.reverseT = 1.5;
    }
  } else {
    b.vStuckT = 0;
  }
  if (b.reverseT > 0) {
    b.reverseT -= dt;
    ctl = { throttle: -1, steer: -ctl.steer };
  }

  driveVehicle(v, ctl);
}

function steerToward(v: Vehicle, x: number, z: number): VehicleControl {
  const err = wrapAngle(bearing(v.pos.x, v.pos.z, x, z) - v.yaw);
  return {
    throttle: Math.abs(err) > 1.6 ? 0.4 : 1,
    steer: -clamp(err * 2, -1, 1), // steering right decreases yaw
  };
}

/** A teammate on foot within MATE_AHEAD units in front of the vehicle. */
function nearestMateAhead(game: Game, s: Soldier, v: Vehicle): Soldier | null {
  const fx = Math.sin(v.yaw);
  const fz = Math.cos(v.yaw);
  let best: Soldier | null = null;
  let bestD = MATE_AHEAD;
  for (const m of game.soldiers) {
    if (m === s || m.team !== s.team || !m.alive || m.vehicle) continue;
    const dx = m.pos.x - v.pos.x;
    const dz = m.pos.z - v.pos.z;
    const d = Math.hypot(dx, dz);
    if (d >= bestD || dx * fx + dz * fz <= 0) continue;
    best = m;
    bestD = d;
  }
  return best;
}

function nearestRunOver(game: Game, s: Soldier, v: Vehicle): Soldier | null {
  let best: Soldier | null = null;
  let bestD = RUNOVER_RANGE;
  for (const e of game.soldiers) {
    if (e.team === s.team || !e.alive || e.vehicle) continue;
    const d = horizDist(v.pos.x, v.pos.z, e.pos.x, e.pos.z);
    if (d >= bestD) continue;
    const off = Math.abs(wrapAngle(bearing(v.pos.x, v.pos.z, e.pos.x, e.pos.z) - v.yaw));
    if (off > RUNOVER_ARC) continue;
    best = e;
    bestD = d;
  }
  return best;
}

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

/** Yaw from (ax, az) to (bx, bz): yaw 0 faces +z. */
function bearing(ax: number, az: number, bx: number, bz: number): number {
  return Math.atan2(bx - ax, bz - az);
}

function turnToward(s: Soldier, desired: number, dt: number): void {
  const step = clamp(wrapAngle(desired - s.yaw), -TURN_RATE * dt, TURN_RATE * dt);
  s.yaw = wrapAngle(s.yaw + step);
}

function unitMove(wx: number, wz: number, sprint: boolean): Move {
  const len = Math.hypot(wx, wz);
  if (len < 1e-6) return { wx: 0, wz: 0, sprint };
  return { wx: wx / len, wz: wz / len, sprint };
}

function nearestOf(points: { x: number; z: number }[], x: number, z: number): { x: number; z: number } {
  let best = points[0] ?? { x: 0, z: 0 };
  let bestD = Infinity;
  for (const p of points) {
    const d = horizDist(x, z, p.x, p.z);
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

function horizDist(ax: number, az: number, bx: number, bz: number): number {
  return Math.hypot(bx - ax, bz - az);
}

/** Wraps an angle into -PI..PI. */
function wrapAngle(a: number): number {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}
