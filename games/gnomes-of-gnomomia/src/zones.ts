// Zones in the open world. Nothing is torn down or rebuilt: the zone the player is "in" is the one whose square they
// stand in (state.zone keeps the last one while they cross the Wilds), the people and objects of every zone near the
// player are live, and the only exits that still move the player are those into and out of instances (the Deeps) and
// the hatches inside them. Exits between outdoor zones are roads now (terrain.ts).
import type * as THREE from 'three';
import { UI, WORLD, type ZoneDef, type ZoneId } from './config';
import { ZONES } from './content';
import { bus, say } from './events';
import { setActiveEntityZones } from './entities';
import { setActiveObjectZones } from './objects';
import { player, teleportPlayer } from './player';
import { checkCondition } from './quests';
import { state } from './state';
import { zoneAt, zoneRectDistance } from './terrain';

/** Seconds after a teleport before an exit can fire again, so the player doesn't bounce. */
const ARRIVE_COOLDOWN = 1;

let sceneRef: THREE.Scene | null = null;
let cooldown = 0;
const active = new Set<ZoneId>();

/** The definition of the zone the player is in. */
export function currentZone(): ZoneDef {
  return ZONES[state.zone];
}

/** True for an exit that teleports: into or out of an instance, or a hatch inside one. */
export function isTeleportExit(from: ZoneId, to: ZoneId): boolean {
  return from === to || !!ZONES[from].indoor || !!ZONES[to].indoor;
}

/** Re-reads the player's zone and the set of live zones; spawns and despawns people and objects to match. */
function refresh(announce: boolean): void {
  const x = player.position.x, z = player.position.z;
  const here = zoneAt(x, z);
  if (here && here !== state.zone) {
    state.zone = here;
    bus.emit('zone-changed', { zone: here });
    if (announce) say(`You enter ${ZONES[here].name}.`, UI.quest);
  }
  let changed = false;
  for (const def of Object.values(ZONES)) {
    const d = zoneRectDistance(def.id, x, z);
    const want = def.id === state.zone || d < WORLD.activeRadius || (active.has(def.id) && d < WORLD.inactiveRadius);
    if (want !== active.has(def.id)) {
      if (want) active.add(def.id);
      else active.delete(def.id);
      changed = true;
    }
  }
  if (changed && sceneRef) {
    setActiveEntityZones(sceneRef, active);
    setActiveObjectZones(sceneRef, active);
  }
}

/** The zones whose people and objects are live (the player's zone and every zone near them). */
export function activeZones(): ReadonlySet<ZoneId> {
  return active;
}

/** Puts the player at (x, z) (world), or at zone `id`'s spawn, and brings the zones there to life. Used for loading a
 * save, dialogue travel, the dev ?zone= switch and teleport exits. Nothing is rebuilt: the world is always there. */
export function loadZone(id: ZoneId, x?: number, z?: number): void {
  const def = ZONES[id];
  teleportPlayer(x ?? def.spawn.x, z ?? def.spawn.z);
  cooldown = ARRIVE_COOLDOWN;
  if (state.zone !== id) {
    state.zone = id;
    bus.emit('zone-changed', { zone: id });
  }
  say(`You arrive in ${def.name}.`, UI.quest);
  refresh(false);
}

/** Keeps the scene that people and objects are spawned into, and brings the player's surroundings to life. Call once. */
export function initZones(scene: THREE.Scene): void {
  sceneRef = scene;
  refresh(false);
}

/** Per frame: follow the player across zone borders, keep nearby zones live, and fire teleport exits. */
export function updateZones(dt: number): void {
  if (cooldown > 0) cooldown = Math.max(0, cooldown - dt);
  refresh(true);
  if (cooldown > 0) return;
  const here = currentZone();
  for (const exit of here.exits) {
    if (!isTeleportExit(here.id, exit.to)) continue;
    if (!checkCondition(exit.when)) continue;
    if (Math.hypot(player.position.x - exit.x, player.position.z - exit.z) > exit.r) continue;
    if (exit.to === here.id) {
      teleportPlayer(exit.arriveX, exit.arriveZ);
      cooldown = ARRIVE_COOLDOWN;
    } else {
      loadZone(exit.to, exit.arriveX, exit.arriveZ);
    }
    return;
  }
}

/** Teleports the player to a safe, unblocked spot beside the current zone's shrine. */
export function unstuckPlayer(): void {
  if (player.dead) {
    say('Wait until you respawn before using Unstuck.', UI.textDim);
    return;
  }
  const shrine = currentZone().shrine;
  teleportPlayer(shrine.x, shrine.z);
  say(`You are unstuck and returned to ${shrine.name}.`, UI.quest);
}
