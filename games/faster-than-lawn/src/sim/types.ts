// Pure simulation state. No Phaser imports anywhere under src/sim.

export type Side = 'player' | 'enemy';

export type SystemId = 'pilot' | 'engines' | 'shields' | 'weapons' | 'medbay';
export const SYSTEM_IDS: SystemId[] = ['pilot', 'engines', 'shields', 'weapons', 'medbay'];
export const SYSTEM_LABELS: Record<SystemId, string> = {
  pilot: 'SEAT',
  engines: 'ENGINE',
  shields: 'HEDGE',
  weapons: 'GUNS',
  medbay: 'MUSHROOM',
};

export interface SystemState {
  id: SystemId;
  level: number;   // max power bars; 0 = not installed
  power: number;   // bars currently allocated from the reactor (0..level-damage)
  damage: number;  // damaged bars (0..level)
}

export interface Room {
  id: number;               // index into ShipState.rooms
  system: SystemId | null;  // null = plain corridor room
  x: number; y: number;     // tiles, top-left, relative to ship origin
  w: number; h: number;     // tiles
  fire: number;             // 0 = not burning; otherwise fire strength 1..100
  fireTickMs: number;       // time accumulated toward the next fire damage tick
  repairMs: number;         // repair progress toward fixing 1 damage point
}

export interface Crew {
  id: number;
  name: string;
  hp: number;
  maxHp: number;
  roomId: number;        // room the gnome is in, or walking to
  fromRoomId: number;    // room the gnome is walking from (== roomId when standing)
  moveMsLeft: number;    // 0 = standing in roomId
  moveMsTotal: number;   // total walk time of the current walk (for rendering interpolation)
}

export type WeaponKind = 'blaster' | 'lobber'; // blaster: blocked by shields. lobber: ignores shields, costs 1 pinecone per shot.

export interface WeaponDef {
  id: string;
  name: string;
  kind: WeaponKind;
  power: number;       // reactor bars needed while powered
  chargeMs: number;    // time to charge a volley
  shots: number;       // projectiles per volley
  damage: number;      // damage per projectile
  fireChance: number;  // 0..1 chance a hit starts a fire
  cost: number;        // shop price in scrap
}

export interface WeaponState {
  defId: string;
  powered: boolean;
  chargeMs: number;              // 0..def.chargeMs (scaled by manning); fires when full and targeted
  targetRoomId: number | null;   // room on the opposing ship; null = hold fire
}

export interface ShipState {
  side: Side;
  name: string;
  hull: number;
  maxHull: number;
  reactor: number;                          // total power bars
  systems: Record<SystemId, SystemState>;
  rooms: Room[];
  crew: Crew[];
  weapons: WeaponState[];
  shieldLayers: number;                     // current layers up
  shieldChargeMs: number;                   // progress toward the next layer
  pinecones: number;                        // ammo for lobbers
}

export interface Projectile {
  id: number;
  from: Side;               // ship that fired
  defId: string;
  targetRoomId: number;     // room on the other ship
  travelMsLeft: number;
  travelMsTotal: number;
}

export type CombatEvent =
  | { type: 'fired'; from: Side; defId: string; weaponIndex: number; projectileId: number }
  | { type: 'hit'; target: Side; roomId: number; damage: number }
  | { type: 'miss'; target: Side; roomId: number }
  | { type: 'shieldBlock'; target: Side; roomId: number }
  | { type: 'fireStarted'; side: Side; roomId: number }
  | { type: 'crewDied'; side: Side; crewId: number; name: string }
  | { type: 'repaired'; side: Side; roomId: number };

export type CombatOutcome = 'ongoing' | 'won' | 'lost' | 'fled';

export interface CombatState {
  player: ShipState;
  enemy: ShipState;
  projectiles: Projectile[];
  jumpChargeMs: number;     // player's escape-jump charge, 0..TUNING.jumpChargeMs
  elapsedMs: number;
  nextId: number;           // id counter for projectiles
  log: CombatEvent[];       // stepCombat appends; CombatScene empties it after CombatView.update
  outcome: CombatOutcome;   // from the player's point of view
}

export type BeaconKind = 'start' | 'fight' | 'event' | 'shop' | 'empty' | 'exit';

export interface Beacon {
  id: number;
  column: number;      // 0 = start column; higher = closer to the exit
  x: number; y: number; // pixel position on the map screen (1280x720)
  kind: BeaconKind;
  links: number[];     // beacon ids reachable from here (only to column + 1)
  visited: boolean;
  eventId?: string;    // for kind 'event'
}

export interface SectorMap {
  beacons: Beacon[];   // beacons[i].id === i; beacons[0] is the start
  exitId: number;
}
