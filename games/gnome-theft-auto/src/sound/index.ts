// World sound: everything the player hears that is not their own vehicle, gun or the radio.
//
// Public API for other modules:
//   playAt(id, { x, z }, opts?)   positional one-shot (falloff, pan, distance muffling, voice budget)
//   play2d(id, opts?)             centred one-shot (stingers, shop bell)
//   duck(key, level?, fade?) / unduck(key, fade?)   lower world + ambience, e.g. duck('cutscene') during a scene
//   setAmbienceOverride(biome | 'silent' | null)    force or silence the region bed
//   registerSound(id, recipe)     add a sound (e.g. gun-mod variants) that playAt / play2d can then play
//   setWorldVolume / setAmbienceVolume (0..1, saved), soundStats()
// app.ts creates one createWorldSound() and calls update() once a frame.
import type { Critter } from '../critters';
import type { BiomeId, Npc, Vehicle, World } from '../types';
import { createAmbience } from './ambience';
import { duck, play2d, setListener, unduck } from './bus';
import { createLifeSounds } from './watchLife';
import { createVehicleSounds } from './watchVehicles';

export {
  duck, getAmbienceVolume, getListener, getWorldVolume, hasSound, MAX_VOICES, play2d, playAt, registerSound,
  setAmbienceOverride, setAmbienceVolume, setListener, setWorldVolume, soundStats, unduck, type PlayOpts,
} from './bus';
export { ALL_SOUNDS, type Recipe, type SoundInfo, type WorldSoundId } from './ids';
export { mountSoundOptions } from './volumeUi';

export interface WorldSoundFrame {
  dt: number;
  /** Seconds since start. */
  time: number;
  /** The ears: the player's (or their vehicle's) position and the camera yaw. */
  listener: { x: number; z: number; yaw: number };
  player: { x: number; y: number; z: number; onFoot: boolean; grounded: boolean; airborne: boolean };
  playerVehicle: Vehicle | null;
  vehicles: readonly Vehicle[];
  heat: number;
  ambulances: readonly { x: number; z: number }[];
  world: World;
  critters: readonly Critter[];
  npcs: readonly Npc[];
  biome: BiomeId;
  night: number;
  timeLabel: string;
  district: string | null;
  eventKind: string | null;
  /** A cutscene is playing: world and ambience duck. */
  cutscene: boolean;
  /** A shop or garage panel is open: the bell rings on open and the world quietens. */
  shopOpen: boolean;
}

export interface WorldSound {
  update(f: WorldSoundFrame): void;
}

const PEOPLE_RADIUS = 25;

export function createWorldSound(): WorldSound {
  const ambience = createAmbience();
  const vehicleSounds = createVehicleSounds();
  const life = createLifeSounds();
  let wasCutscene = false;
  let wasShop = false;

  return {
    update(f) {
      setListener(f.listener.x, f.listener.z, f.listener.yaw);
      if (f.cutscene !== wasCutscene) {
        if (f.cutscene) duck('cutscene', 0.3);
        else unduck('cutscene');
        wasCutscene = f.cutscene;
      }
      if (f.shopOpen !== wasShop) {
        if (f.shopOpen) {
          play2d('shop-bell');
          duck('shop', 0.45);
        } else {
          play2d('door-creak', { gain: 0.6 });
          unduck('shop');
        }
        wasShop = f.shopOpen;
      }
      let people = 0;
      const r2 = PEOPLE_RADIUS * PEOPLE_RADIUS;
      for (const n of f.npcs) {
        const dx = n.x - f.listener.x;
        const dz = n.z - f.listener.z;
        if (dx * dx + dz * dz < r2) people++;
      }
      ambience.update({
        dt: f.dt, x: f.listener.x, z: f.listener.z, biome: f.biome, night: f.night, timeLabel: f.timeLabel,
        district: f.district, people, airborne: f.player.airborne || !!f.playerVehicle?.spec.flies,
      });
      vehicleSounds.update({
        dt: f.dt, vehicles: f.vehicles, playerVehicle: f.playerVehicle, playerX: f.listener.x, playerZ: f.listener.z,
        heat: f.heat, ambulances: f.ambulances,
      });
      life.update({
        dt: f.dt, time: f.time, player: f.player, world: f.world, critters: f.critters, npcs: f.npcs, night: f.night,
        eventKind: f.eventKind,
      });
    },
  };
}
