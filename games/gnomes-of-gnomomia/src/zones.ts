// Zones: which map is built and loaded, where the player arrives, and the exits that move the player between maps.
import type * as THREE from 'three';
import { UI, type ZoneDef, type ZoneId } from './config';
import { ZONES } from './content';
import { bus, say } from './events';
import { spawnZoneEntities } from './entities';
import { spawnZoneObjects } from './objects';
import { player, teleportPlayer } from './player';
import { checkCondition } from './quests';
import { state } from './state';
import { buildWorld, clearWorld, updateExitVisibility } from './world';

/** Seconds after arriving in a zone (or a hatch) before an exit can fire again, so the player doesn't bounce. */
const ARRIVE_COOLDOWN = 1;

let sceneRef: THREE.Scene | null = null;
let cooldown = 0;

/** The definition of the zone the player is in. */
export function currentZone(): ZoneDef {
  return ZONES[state.zone];
}

/** Tears down the current map, builds `id`, spawns its people and objects, and places the player at (x, z) or the zone's spawn. */
export function loadZone(id: ZoneId, x?: number, z?: number): void {
  const scene = sceneRef;
  if (!scene) throw new Error('initZones first');
  const def = ZONES[id];
  clearWorld(scene);
  buildWorld(scene, def);
  spawnZoneEntities(scene, id);
  spawnZoneObjects(scene, id);
  state.zone = id;
  teleportPlayer(x ?? def.spawn.x, z ?? def.spawn.z);
  cooldown = ARRIVE_COOLDOWN;
  bus.emit('zone-changed', { zone: id });
  say(`You arrive in ${def.name}.`, UI.quest);
}

/** Keeps the scene the zones are built into, and loads the zone in state (mossbottom by default). Call once. */
export function initZones(scene: THREE.Scene): void {
  sceneRef = scene;
  loadZone(state.zone);
}

/** Per-frame zone work: exit rings follow their conditions, and walking into an exit moves the player. */
export function updateZones(dt: number): void {
  if (cooldown > 0) cooldown = Math.max(0, cooldown - dt);
  updateExitVisibility();
  if (cooldown > 0) return;
  const here = currentZone();
  for (const exit of here.exits) {
    if (!checkCondition(exit.when)) continue;
    if (Math.hypot(player.position.x - exit.x, player.position.z - exit.z) > exit.r) continue;
    if (exit.to === here.id) {
      // A hatch: move inside the same map, with no rebuild and no banner.
      teleportPlayer(exit.arriveX, exit.arriveZ);
      cooldown = ARRIVE_COOLDOWN;
    } else {
      loadZone(exit.to, exit.arriveX, exit.arriveZ);
    }
    return;
  }
}
