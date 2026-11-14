import { TUNING } from '../config';
import { ENEMY_SHIP_NAMES, GNOME_NAMES, WEAPONS } from './data';
import type { Crew, Room, ShipState, SystemId, SystemState } from './types';

type RoomSpec = [SystemId | null, number, number, number, number]; // system, x, y, w, h

function makeRooms(specs: RoomSpec[]): Room[] {
  return specs.map(([system, x, y, w, h], id) => ({ id, system, x, y, w, h, fire: 0, fireTickMs: 0, repairMs: 0 }));
}

function makeSystems(levels: Record<SystemId, number>): Record<SystemId, SystemState> {
  const out = {} as Record<SystemId, SystemState>;
  for (const id of Object.keys(levels) as SystemId[]) out[id] = { id, level: levels[id], power: 0, damage: 0 };
  return out;
}

let crewIdCounter = 1;

export function makeCrew(name: string, roomId: number): Crew {
  return {
    id: crewIdCounter++, name, hp: TUNING.crewMaxHp, maxHp: TUNING.crewMaxHp,
    roomId, fromRoomId: roomId, moveMsLeft: 0, moveMsTotal: 0,
  };
}

export function roomOfSystem(ship: ShipState, system: SystemId): Room | undefined {
  return ship.rooms.find((r) => r.system === system);
}

/** Player mower, facing right (seat at the front/right). 5x2 tiles. */
export function makePlayerShip(): ShipState {
  const rooms = makeRooms([
    ['engines', 0, 0, 2, 1],
    ['medbay', 0, 1, 2, 1],
    ['shields', 2, 0, 2, 1],
    ['weapons', 2, 1, 2, 1],
    ['pilot', 4, 0, 1, 2],
  ]);
  const ship: ShipState = {
    side: 'player', name: 'The Dandelion', hull: 30, maxHull: 30, reactor: 8,
    systems: makeSystems({ pilot: 1, engines: 2, shields: 2, weapons: 3, medbay: 1 }),
    rooms,
    crew: [makeCrew('Bramble', 4), makeCrew('Toadstool', 3), makeCrew('Pip', 0)],
    weapons: [
      { defId: 'clippings', powered: false, chargeMs: 0, targetRoomId: null },
      { defId: 'pinecone', powered: false, chargeMs: 0, targetRoomId: null },
    ],
    shieldLayers: 0, shieldChargeMs: 0, pinecones: 8,
  };
  autoPower(ship);
  return ship;
}

function pick<T>(list: T[], rng: () => number): T {
  return list[Math.floor(rng() * list.length)];
}

/** Enemy mower, facing left (seat at the front/left). 5x2 tiles. tier 1..5. */
export function makeEnemyShip(tier: number, rng: () => number = Math.random, isBoss = false): ShipState {
  const t = isBoss ? 6 : tier;
  const rooms = makeRooms([
    ['pilot', 0, 0, 1, 2],
    ['weapons', 1, 0, 2, 1],
    ['shields', 1, 1, 2, 1],
    ['engines', 3, 0, 2, 1],
    [t >= 3 ? 'medbay' : null, 3, 1, 2, 1],
  ]);
  const weaponPool = t <= 1 ? ['clippings', 'blade'] : t <= 3 ? ['clippings', 'blade', 'sprinkler', 'pinecone'] : ['mulcher', 'clippings', 'pinecone', 'sprinkler'];
  const weaponCount = t <= 2 ? 1 : 2;
  const weapons = Array.from({ length: weaponCount }, () => ({ defId: pick(weaponPool, rng), powered: false, chargeMs: 0, targetRoomId: null }));
  const weaponPower = weapons.reduce((s, w) => s + WEAPONS[w.defId].power, 0);
  const crewCount = Math.min(4, 2 + Math.floor(t / 2));
  const names = [...GNOME_NAMES].sort(() => rng() - 0.5);
  const crewRooms = [0, 1, 2, 3];
  const hull = isBoss ? 30 : 8 + t * 3;
  const ship: ShipState = {
    side: 'enemy', name: isBoss ? 'The Grand Zero-Turn' : pick(ENEMY_SHIP_NAMES, rng), hull, maxHull: hull,
    reactor: 4 + t + weaponPower,
    systems: makeSystems({
      pilot: 1,
      engines: Math.min(4, 1 + Math.floor(t / 2)),
      shields: t >= 4 ? 4 : 2,
      weapons: weaponPower,
      medbay: t >= 3 ? 1 : 0,
    }),
    rooms,
    crew: Array.from({ length: crewCount }, (_, i) => makeCrew(names[i], crewRooms[i % crewRooms.length])),
    weapons,
    shieldLayers: 0, shieldChargeMs: 0, pinecones: 3 + t * 2,
  };
  autoPower(ship);
  return ship;
}

/** Fill systems with power in a sensible order, then power weapons. Used for new ships. */
export function autoPower(ship: ShipState): void {
  let free = ship.reactor;
  for (const id of ['pilot', 'shields', 'engines', 'medbay'] as SystemId[]) {
    const s = ship.systems[id];
    const want = Math.min(s.level - s.damage, free);
    s.power = Math.max(0, want);
    free -= s.power;
  }
  let weaponsPower = 0;
  const cap = ship.systems.weapons.level - ship.systems.weapons.damage;
  for (const w of ship.weapons) {
    const p = WEAPONS[w.defId].power;
    if (weaponsPower + p <= cap && p <= free) {
      w.powered = true;
      weaponsPower += p;
      free -= p;
    } else {
      w.powered = false;
    }
  }
  ship.systems.weapons.power = weaponsPower;
}

/** After a fight: put out fires, repair systems, reset charges. Hull and crew hp persist. */
export function cleanUpAfterCombat(ship: ShipState): void {
  for (const r of ship.rooms) { r.fire = 0; r.fireTickMs = 0; r.repairMs = 0; }
  for (const s of Object.values(ship.systems)) s.damage = 0;
  for (const c of ship.crew) { c.fromRoomId = c.roomId; c.moveMsLeft = 0; c.moveMsTotal = 0; }
  for (const w of ship.weapons) { w.chargeMs = 0; w.targetRoomId = null; }
  ship.shieldLayers = 0;
  ship.shieldChargeMs = 0;
}
