// Pebblewick, the minor town on the eastern outskirts (roadmap docs/roadmaps/gta-outskirts-town.md): the one object
// app.ts talks to. It builds the town (build.ts), runs its townsfolk (npcs.ts), counters (shops.ts), set pieces and
// easter eggs (sights.ts) and the Pebblewick Hopper bus (bus.ts), and keeps the town's save (save.ts).
// The layout is data in town.ts; the streets, reserve, quest givers and walk points live in the Dust Flats level
// document. The side quests are ordinary quests (quests/outskirtsQuests.ts), the street events are in
// events/catalog/pebblewick.ts.
//
// Online: like the Bent Pin and the Tuft & Tally Lodge, the town's keepers, shops and set pieces are local to each
// browser (purchases use the player's own Acorns). The buildings are static data, identical on every client; the
// townsfolk follow the time of day, so every client sees them in the same places.
//
// Debug: ?pebblewick puts the player at the bus stop on the first frame; ?pebblewick=square on the market square;
// ?pebblewick=combine by the Old Chrome Combine.
import type * as THREE from 'three';
import type { TimeLabel } from '../atmosphere';
import type { Economy } from '../economy';
import type { Blip, Box, Hud, Player, Sfx, Vehicle, World } from '../types';
import { buildTown } from './build';
import { createTownBus } from './bus';
import { createTownNpcs } from './npcs';
import { createOutskirtsStore } from './save';
import { createTownShops } from './shops';
import { createTownSights } from './sights';
import { registerTownSounds } from './sounds';
import { COUNTERS, SIGHTS, TOWN, TOWN_ACHIEVEMENTS } from './town';

export interface OutskirtsDeps {
  scene: THREE.Scene;
  ui: HTMLElement;
  world: World;
  hud: Hud;
  economy: Economy;
  /** The game's vehicle list. */
  vehicles: readonly Vehicle[];
  play(sfx: Sfx): void;
  unlock(id: string): void;
  increment(id: string, by?: number): void;
  /** Put the player on foot at (x, z) facing yaw and swing the camera behind them. */
  teleport(x: number, z: number, yaw: number): void;
  /** Storage for the town save (tests); default localStorage. */
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
}

/** What app.ts hands the town each frame. */
export interface OutskirtsFrame {
  dt: number;
  playerX: number;
  playerZ: number;
  timeLabel: TimeLabel;
  /** 0 noon .. 1 deep night. */
  night: number;
}

export interface Outskirts {
  /** Every collider the town adds (app.ts pushes them into world.boxes once). */
  readonly boxes: readonly Box[];
  blips(): Blip[];
  /** The E prompt for the player on foot, or null. */
  prompt(player: Player): string | null;
  /** E pressed while prompt() was not null. True when handled. */
  interact(player: Player): boolean;
  /** A town sheet (a counter or the notice board) is open. */
  isOpen(): boolean;
  close(): void;
  update(f: OutskirtsFrame): void;
}

/** The ?pebblewick debug flag: where to put the player, or null. */
function debugSpot(): { x: number; z: number; yaw: number } | null {
  if (typeof location === 'undefined') return null;
  const q = new URLSearchParams(location.search);
  if (!q.has('pebblewick')) return null;
  const v = q.get('pebblewick');
  if (v === 'square') return { x: TOWN.blip.x, z: TOWN.blip.z, yaw: Math.PI / 2 };
  if (v === 'combine') return { x: SIGHTS.combine.x - 6, z: SIGHTS.combine.z, yaw: Math.PI / 2 };
  return { x: TOWN.busStop.arriveX, z: TOWN.busStop.arriveZ, yaw: TOWN.busStop.arriveYaw };
}

export function createOutskirts(deps: OutskirtsDeps): Outskirts {
  registerTownSounds();
  const store = createOutskirtsStore(deps.storage);
  const town = buildTown(deps.scene);
  const npcs = createTownNpcs(deps.scene);
  let player: Player | null = null;
  const shops = createTownShops({
    ui: deps.ui, hud: deps.hud, economy: deps.economy, store, vehicles: deps.vehicles, play: deps.play,
    keeperIn: (id) => {
      const c = COUNTERS.find((k) => k.id === id);
      return !!c && npcs.presentAt(c.keeper, 0);
    },
    heal(amount) {
      if (player && player.health > 0) player.health = Math.min(1, player.health + amount);
    },
    onBought(id) {
      if (store.markShop(id)) deps.increment(TOWN_ACHIEVEMENTS.regular, 1);
    },
  });
  const sights = createTownSights({
    ui: deps.ui, hud: deps.hud, economy: deps.economy, store, npcs, play: deps.play, unlock: deps.unlock,
  });
  const bus = createTownBus({
    scene: deps.scene, ui: deps.ui, world: deps.world, hud: deps.hud, economy: deps.economy, play: deps.play,
    teleport: deps.teleport,
  });
  let jump = debugSpot();
  let night = 0;

  return {
    boxes: [...town.boxes, ...bus.boxes],
    blips: () => bus.blips(),
    prompt(p) {
      player = p;
      if (bus.busy()) return null;
      return bus.prompt(p.x, p.z) ?? shops.prompt(p.x, p.z) ?? sights.prompt(p.x, p.z, night);
    },
    interact(p) {
      player = p;
      if (bus.busy()) return false;
      if (bus.prompt(p.x, p.z)) return bus.interact(p.x, p.z);
      if (shops.prompt(p.x, p.z)) return shops.interact(p.x, p.z);
      if (sights.prompt(p.x, p.z, night)) return sights.interact(p.x, p.z, night);
      return false;
    },
    isOpen: () => shops.isOpen() || sights.isOpen(),
    close() {
      shops.close();
      sights.close();
    },
    update(f) {
      night = f.night;
      if (jump) {
        deps.teleport(jump.x, jump.z, jump.yaw);
        jump = null;
      }
      npcs.update(f.dt, f.playerX, f.playerZ, f.timeLabel);
      sights.update({ dt: f.dt, px: f.playerX, pz: f.playerZ, time: f.timeLabel, night: f.night });
      bus.update(f.dt);
    },
  };
}
