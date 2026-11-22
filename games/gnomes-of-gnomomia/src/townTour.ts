// Dev demo of a town walk (?townwalk=<town>): the player gnome tours every waypoint of a town with the real walkTo,
// along the same nearest-neighbour route the sim checks (src/sim/townWalk.ts). Main.ts calls updateTownTour each frame.
import { UI } from './config';
import { say } from './events';
import { player, teleportPlayer, walkTo } from './player';
import { townRoute, townStartPoint } from './sim/townWalk';
import { townById, townWaypoints, type TownWaypoint } from './towns';

/** Move on after this long even when the waypoint was not reached. */
const LEG_TIMEOUT_S = 20;
/** Arrived when this close to the target. */
const ARRIVE_M = 1.6;
/** Doors and exits teleport a gnome who stops on them: aim this far short, on the side the gnome comes from. */
const DOOR_SHORT_M = 2.5;

let route: TownWaypoint[] = [];
let leg = -1;
let legTime = 0;
let target = { x: 0, z: 0 };

function startLeg(): void {
  leg = (leg + 1) % route.length;
  legTime = 0;
  const wp = route[leg];
  target = { x: wp.x, z: wp.z };
  if (wp.kind === 'door' || wp.kind === 'exit') {
    const dx = player.position.x - wp.x;
    const dz = player.position.z - wp.z;
    const d = Math.hypot(dx, dz);
    if (d > 0.01) target = { x: wp.x + (dx / d) * DOOR_SHORT_M, z: wp.z + (dz / d) * DOOR_SHORT_M };
  }
  walkTo(target.x, target.z);
}

/** Teleports the player to the town's centre (its shrine when it has one) and starts the tour. The caller loads the
 * town's zone first. False for an unknown town or one with no waypoints. */
export function startTownTour(townId: string): boolean {
  const town = townById(townId);
  if (!town) return false;
  const r = townRoute(town, 'scripted', () => 0, 0);
  if (r.length === 0) return false;
  route = r.slice(0, -1); // the route ends back at its first waypoint; the tour loops by itself
  const s = townStartPoint(town, townWaypoints(town));
  teleportPlayer(s.x, s.z);
  leg = -1;
  say(`Town walk: ${town.name}, ${route.length} stops.`, UI.quest);
  startLeg();
  return true;
}

/** Per frame while a tour runs: next waypoint on arrival, on an empty path or after LEG_TIMEOUT_S. */
export function updateTownTour(dt: number): void {
  if (route.length === 0 || player.dead) return;
  legTime += dt;
  const d = Math.hypot(player.position.x - target.x, player.position.z - target.z);
  if (d <= ARRIVE_M || player.path.length === 0 || legTime >= LEG_TIMEOUT_S) startLeg();
}
