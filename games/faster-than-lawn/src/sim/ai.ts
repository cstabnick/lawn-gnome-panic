// Enemy mower brain. Pure, no Phaser.
import { TUNING } from '../config';
import { moveCrew, setSystemPower, setWeaponTarget, toggleWeaponPower } from './combat';
import { aliveCrew, roomIdOfSystem } from './queries';
import type { CombatState, Crew, Room, ShipState, SystemId } from './types';

export interface EnemyBrain {
  retargetMs: number;  // counts down; when <= 0 the AI re-picks weapon targets
  thinkMs: number;     // counts down; when <= 0 the AI re-plans crew (every 1000 ms)
}

export function createEnemyBrain(): EnemyBrain {
  return { retargetMs: 0, thinkMs: 0 };
}

const POWER_ORDER: Exclude<SystemId, 'weapons'>[] = ['pilot', 'shields', 'engines', 'medbay'];
const DAMAGE_ORDER: SystemId[] = ['weapons', 'shields', 'pilot', 'engines', 'medbay'];
const MANNING_ORDER: Exclude<SystemId, 'medbay'>[] = ['pilot', 'weapons', 'shields', 'engines'];

/** Manhattan distance between the top-left corners of two rooms on the same ship. */
function tileDist(ship: ShipState, fromRoomId: number, toRoomId: number): number {
  const a: Room = ship.rooms[fromRoomId];
  const b: Room = ship.rooms[toRoomId];
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/** Ordered job rooms: fires, then damaged systems, then manning. */
function buildJobs(ship: ShipState): number[] {
  const jobs: number[] = [];
  const addJob = (roomId: number): void => {
    if (roomId >= 0 && !jobs.includes(roomId)) jobs.push(roomId);
  };
  for (const room of ship.rooms) {
    if (room.fire > 0) addJob(room.id);
  }
  for (const id of DAMAGE_ORDER) {
    if (ship.systems[id].damage > 0) addJob(roomIdOfSystem(ship, id));
  }
  for (const id of MANNING_ORDER) {
    if (ship.systems[id].level > 0) addJob(roomIdOfSystem(ship, id));
  }
  return jobs;
}

function planCrew(ship: ShipState): void {
  // Wounded crew go to the medbay first (if it is usable) and sit out the job assignment.
  const medbayRoomId = roomIdOfSystem(ship, 'medbay');
  const medbayUsable =
    ship.systems.medbay.level > 0 && medbayRoomId >= 0 && ship.rooms[medbayRoomId].fire === 0;

  const free: Crew[] = [];
  for (const crew of aliveCrew(ship)) {
    if (medbayUsable && crew.hp < 0.35 * crew.maxHp) {
      moveCrew(ship, crew.id, medbayRoomId);
    } else {
      free.push(crew);
    }
  }

  // Each job takes the nearest unassigned crew member.
  for (const job of buildJobs(ship)) {
    if (free.length === 0) break;
    let best = 0;
    let bestDist = Infinity;
    free.forEach((crew, i) => {
      const d = tileDist(ship, crew.roomId, job);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    const [crew] = free.splice(best, 1);
    if (crew.roomId !== job) moveCrew(ship, crew.id, job);
  }
}

/** Weighted random pick of a player room: weapons and shields 3, other systems 1, corridors never. */
function pickTargetRoom(state: CombatState, rng: () => number): number | null {
  const candidates = state.player.rooms.filter((r) => r.system !== null);
  if (candidates.length === 0) return null;
  const weight = (r: Room): number => (r.system === 'weapons' || r.system === 'shields' ? 3 : 1);
  const total = candidates.reduce((sum, r) => sum + weight(r), 0);
  let roll = rng() * total;
  for (const r of candidates) {
    roll -= weight(r);
    if (roll < 0) return r.id;
  }
  return candidates[candidates.length - 1].id;
}

/** Called every unpaused frame, before stepCombat. Issues commands for state.enemy. */
export function stepEnemyAI(state: CombatState, brain: EnemyBrain, dtMs: number, rng: () => number = Math.random): void {
  if (state.outcome !== 'ongoing') return;
  const ship = state.enemy;

  brain.thinkMs -= dtMs;
  if (brain.thinkMs <= 0) {
    brain.thinkMs = 1000;

    for (const id of POWER_ORDER) {
      const sys = ship.systems[id];
      if (sys.level > 0) setSystemPower(ship, id, sys.level);
    }
    for (let i = 0; i < ship.weapons.length; i++) {
      if (!ship.weapons[i].powered) toggleWeaponPower(ship, i);
    }

    planCrew(ship);
  }

  brain.retargetMs -= dtMs;
  if (brain.retargetMs <= 0) {
    brain.retargetMs = TUNING.aiRetargetMs;
    for (let i = 0; i < ship.weapons.length; i++) {
      setWeaponTarget(ship, i, pickTargetRoom(state, rng));
    }
  }
}
