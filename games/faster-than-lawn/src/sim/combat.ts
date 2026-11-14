// Combat rules: commands the player/AI issue, and the per-frame step. Pure, no Phaser.
import { TUNING } from '../config';
import { WEAPONS } from './data';
import {
  crewInRoom, effectivePower, evasion, freePower, isManned, jumpReady, shieldMax, weaponChargeTime,
} from './queries';
import type { CombatState, Projectile, ShipState, SystemId } from './types';

export function createCombat(player: ShipState, enemy: ShipState): CombatState {
  return { player, enemy, projectiles: [], jumpChargeMs: 0, elapsedMs: 0, nextId: 1, log: [], outcome: 'ongoing' };
}

/** Set a non-weapons system's allocated power. Returns true if it changed. */
export function setSystemPower(ship: ShipState, id: Exclude<SystemId, 'weapons'>, power: number): boolean {
  const sys = ship.systems[id];
  const upper = Math.min(sys.level - sys.damage, sys.power + freePower(ship));
  const next = Math.max(0, Math.min(power, upper));
  if (next === sys.power) return false;
  sys.power = next;
  return true;
}

/** Power or unpower weapon `index`. Returns true if it changed. */
export function toggleWeaponPower(ship: ShipState, index: number): boolean {
  const w = ship.weapons[index];
  if (!w) return false;
  const def = WEAPONS[w.defId];
  const sys = ship.systems.weapons;
  if (w.powered) {
    w.powered = false;
    w.chargeMs = 0;
    sys.power -= def.power;
    return true;
  }
  if (sys.power + def.power <= sys.level - sys.damage && freePower(ship) >= def.power) {
    w.powered = true;
    sys.power += def.power;
    return true;
  }
  return false;
}

/** Aim weapon `index` at a room on the opposing ship, or null to hold fire. */
export function setWeaponTarget(ship: ShipState, index: number, roomId: number | null): void {
  const w = ship.weapons[index];
  if (w) w.targetRoomId = roomId;
}

/** Send a crew member walking to a room on their own ship. */
export function moveCrew(ship: ShipState, crewId: number, roomId: number): void {
  const crew = ship.crew.find((c) => c.id === crewId && c.hp > 0);
  const to = ship.rooms[roomId];
  if (!crew || !to) return;
  if (crew.moveMsLeft <= 0 && crew.roomId === roomId) return;
  const from = crew.moveMsLeft > 0 ? crew.fromRoomId : crew.roomId;
  const fromRoom = ship.rooms[from];
  if (!fromRoom) return;
  const dist = Math.abs(fromRoom.x - to.x) + Math.abs(fromRoom.y - to.y);
  crew.fromRoomId = from;
  crew.roomId = roomId;
  crew.moveMsTotal = Math.max(1, dist) * TUNING.crewMoveMsPerTile;
  crew.moveMsLeft = crew.moveMsTotal;
}

/** Player escape-jump. Sets outcome 'fled' and returns true if the jump was ready. */
export function jumpAway(state: CombatState): boolean {
  if (state.outcome === 'ongoing' && jumpReady(state)) {
    state.outcome = 'fled';
    return true;
  }
  return false;
}

/** Advance the fight by dtMs. Mutates state and appends to state.log. Does nothing once outcome !== 'ongoing'. */
export function stepCombat(state: CombatState, dtMs: number, rng: () => number = Math.random): void {
  if (state.outcome !== 'ongoing') return;
  state.elapsedMs += dtMs;
  for (const ship of [state.player, state.enemy]) {
    const other = ship === state.player ? state.enemy : state.player;
    walkCrew(ship, dtMs);
    capPowerToDamage(ship);
    updateShields(ship, dtMs);
    fireWeapons(state, ship, other, dtMs);
    burnRooms(ship, dtMs);
    repairRooms(state, ship, dtMs);
    healCrew(ship, dtMs);
  }
  resolveProjectiles(state, dtMs, rng);
  removeDeadCrew(state);
  chargeJump(state, dtMs);
  updateOutcome(state);
}

function walkCrew(ship: ShipState, dtMs: number): void {
  for (const c of ship.crew) {
    if (c.moveMsLeft <= 0) continue;
    c.moveMsLeft = Math.max(0, c.moveMsLeft - dtMs);
    if (c.moveMsLeft === 0) c.fromRoomId = c.roomId;
  }
}

function poweredWeaponPower(ship: ShipState): number {
  let sum = 0;
  for (const w of ship.weapons) if (w.powered) sum += WEAPONS[w.defId].power;
  return sum;
}

function capPowerToDamage(ship: ShipState): void {
  for (const sys of Object.values(ship.systems)) {
    if (sys.id === 'weapons') continue;
    sys.power = Math.min(sys.power, Math.max(0, sys.level - sys.damage));
  }
  const guns = ship.systems.weapons;
  const cap = Math.max(0, guns.level - guns.damage);
  let sum = poweredWeaponPower(ship);
  while (sum > cap) {
    let last = -1;
    for (let i = ship.weapons.length - 1; i >= 0; i--) {
      if (ship.weapons[i].powered) { last = i; break; }
    }
    if (last < 0) break;
    ship.weapons[last].powered = false;
    ship.weapons[last].chargeMs = 0;
    sum = poweredWeaponPower(ship);
  }
  guns.power = sum;
}

function updateShields(ship: ShipState, dtMs: number): void {
  const max = shieldMax(ship);
  if (ship.shieldLayers > max) ship.shieldLayers = max;
  if (ship.shieldLayers < max) {
    ship.shieldChargeMs += dtMs * (isManned(ship, 'shields') ? 1.25 : 1);
    if (ship.shieldChargeMs >= TUNING.shieldRechargeMs) {
      ship.shieldLayers += 1;
      ship.shieldChargeMs = 0;
    }
  } else {
    ship.shieldChargeMs = 0;
  }
}

function fireWeapons(state: CombatState, ship: ShipState, other: ShipState, dtMs: number): void {
  for (let i = 0; i < ship.weapons.length; i++) {
    const w = ship.weapons[i];
    if (!w.powered) continue;
    const def = WEAPONS[w.defId];
    const chargeTime = weaponChargeTime(ship, w);
    w.chargeMs = Math.min(w.chargeMs + dtMs, chargeTime);
    const target = w.targetRoomId;
    if (w.chargeMs < chargeTime || target === null || !other.rooms[target]) continue;
    if (def.kind === 'lobber') {
      if (ship.pinecones < 1) continue;
      ship.pinecones -= 1;
    }
    for (let s = 0; s < def.shots; s++) {
      const id = state.nextId++;
      const travel = TUNING.projectileTravelMs + s * 150;
      state.projectiles.push({
        id, from: ship.side, defId: def.id, targetRoomId: target, travelMsLeft: travel, travelMsTotal: travel,
      });
      state.log.push({ type: 'fired', from: ship.side, defId: def.id, weaponIndex: i, projectileId: id });
    }
    w.chargeMs = 0;
  }
}

function burnRooms(ship: ShipState, dtMs: number): void {
  for (const room of ship.rooms) {
    if (room.fire <= 0) continue;
    const n = crewInRoom(ship, room.id).length;
    room.fire -= TUNING.fireExtinguishPerCrewPerSec * n * dtMs / 1000;
    for (const c of ship.crew) {
      if (c.roomId === room.id) c.hp -= TUNING.fireCrewDps * dtMs / 1000;
    }
    room.fireTickMs += dtMs;
    if (room.fireTickMs >= TUNING.fireDamageIntervalMs) {
      room.fireTickMs -= TUNING.fireDamageIntervalMs;
      if (room.system) {
        const sys = ship.systems[room.system];
        sys.damage = Math.min(sys.level, sys.damage + 1);
      }
    }
    if (room.fire <= 0) {
      room.fire = 0;
      room.fireTickMs = 0;
    }
  }
}

function repairRooms(state: CombatState, ship: ShipState, dtMs: number): void {
  for (const room of ship.rooms) {
    if (!room.system) continue;
    const sys = ship.systems[room.system];
    if (sys.damage <= 0) {
      room.repairMs = 0;
      continue;
    }
    if (room.fire !== 0) continue;
    const n = crewInRoom(ship, room.id).length;
    if (n === 0) continue;
    room.repairMs += dtMs * n;
    if (room.repairMs >= TUNING.repairMsPerPoint) {
      sys.damage -= 1;
      room.repairMs = 0;
      state.log.push({ type: 'repaired', side: ship.side, roomId: room.id });
    }
  }
}

function healCrew(ship: ShipState, dtMs: number): void {
  const p = effectivePower(ship.systems.medbay);
  if (p <= 0) return;
  const room = ship.rooms.find((r) => r.system === 'medbay');
  if (!room) return;
  for (const c of crewInRoom(ship, room.id)) {
    c.hp = Math.min(c.maxHp, c.hp + TUNING.medbayHealPerSecPerPower * p * dtMs / 1000);
  }
}

function resolveProjectiles(state: CombatState, dtMs: number, rng: () => number): void {
  const live: Projectile[] = [];
  for (const p of state.projectiles) {
    p.travelMsLeft -= dtMs;
    if (p.travelMsLeft > 0) {
      live.push(p);
      continue;
    }
    const target = p.from === 'player' ? state.enemy : state.player;
    const room = target.rooms[p.targetRoomId];
    if (!room) continue;
    const def = WEAPONS[p.defId];
    if (rng() < evasion(target)) {
      state.log.push({ type: 'miss', target: target.side, roomId: room.id });
    } else if (def.kind === 'blaster' && target.shieldLayers > 0) {
      target.shieldLayers -= 1;
      target.shieldChargeMs = 0;
      state.log.push({ type: 'shieldBlock', target: target.side, roomId: room.id });
    } else {
      target.hull = Math.max(0, target.hull - def.damage);
      if (room.system) {
        const sys = target.systems[room.system];
        sys.damage = Math.min(sys.level, sys.damage + def.damage);
      }
      for (const c of target.crew) {
        if (c.roomId === room.id) c.hp -= TUNING.crewDamagePerHit * def.damage;
      }
      state.log.push({ type: 'hit', target: target.side, roomId: room.id, damage: def.damage });
      if (room.fire === 0 && rng() < def.fireChance) {
        room.fire = 100;
        state.log.push({ type: 'fireStarted', side: target.side, roomId: room.id });
      }
    }
  }
  state.projectiles.length = 0;
  state.projectiles.push(...live);
}

function removeDeadCrew(state: CombatState): void {
  for (const ship of [state.player, state.enemy]) {
    const dead = ship.crew.filter((c) => c.hp <= 0);
    if (dead.length === 0) continue;
    ship.crew = ship.crew.filter((c) => c.hp > 0);
    for (const c of dead) {
      state.log.push({ type: 'crewDied', side: ship.side, crewId: c.id, name: c.name });
    }
  }
}

function chargeJump(state: CombatState, dtMs: number): void {
  const p = state.player;
  if (isManned(p, 'pilot') && effectivePower(p.systems.pilot) >= 1 && effectivePower(p.systems.engines) >= 1) {
    state.jumpChargeMs = Math.min(TUNING.jumpChargeMs, state.jumpChargeMs + dtMs);
  }
}

function updateOutcome(state: CombatState): void {
  if (state.enemy.hull <= 0 || state.enemy.crew.length === 0) {
    state.outcome = 'won';
  } else if (state.player.hull <= 0 || state.player.crew.length === 0) {
    state.outcome = 'lost';
  }
}
