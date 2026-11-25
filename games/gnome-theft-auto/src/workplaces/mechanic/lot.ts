// E24 mechanic: the client lot at Turfton's Pay 'n' Glaze. A work-order board, a waiting bench, a parking spot for the
// client's car and a few small stories told with props. All spots sit on clear, dry, flat ground (findSafeSpot).
import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import type { World } from '../../types';
import { PAY_N_GLAZE } from '../../config';
import { coastSign } from '../../coast/sign';
import { registerCull } from '../../cull';
import { circleClearOfStreets } from '../../parking';
import { boxesBlocked, findSafeSpot } from '../../lockup/safeSpot';
import type { SpotProbe } from '../../lockup/types';
import { heightAt, slopeAt, waterAt } from '../../terrain';

export interface ClientLot {
  /** The work-order board: stand here on foot for the "Take a work order" prompt. */
  board: { x: number; z: number };
  /** Where a client's car is parked (clear ground, facing the bay). */
  car: { x: number; z: number; yaw: number };
  /** Where the client stands waiting, and faces. */
  client: { x: number; z: number; yaw: number };
}

const CAR_TARGET = { x: 102, z: 130 };
const BOARD_TARGET = { x: 82, z: 130 };
const CAR_RADIUS = 3.5;
/** Keep clear of the bay circle by this much, and of the drive-through strip in front of it. */
const BAY_MARGIN = 3;
const STRIP_HALF = 5;

let built: ClientLot | null = null;

function place(scene: THREE.Scene, id: string, x: number, z: number, yaw: number, lift = 0): THREE.Object3D | null {
  if (!getPrefab(id)) return null;
  const o = buildPrefab(id);
  o.position.set(x, heightAt(x, z) + lift, z);
  o.rotation.y = yaw;
  scene.add(o);
  registerCull(o, 'prop');
  return o;
}

/** Build the lot's props once (idempotent) and return its spots. Pushes colliders into world.boxes. */
export function buildClientLot(scene: THREE.Scene, world: World): ClientLot {
  if (built) return built;
  const bay = PAY_N_GLAZE.bay;
  // Everything placed so far (x, z, r), so clusters never overlap each other.
  const taken: { x: number; z: number; r: number }[] = [];
  const blockedBy = boxesBlocked(world.boxes, world.half);
  const probe: SpotProbe = {
    ground: heightAt,
    water: (x, z) => waterAt(x, z)?.depth ?? 0,
    slope: slopeAt,
    blocked: (x, z, r) => {
      if (blockedBy(x, z, r) || !circleClearOfStreets(x, z, r)) return true;
      if (Math.hypot(x - bay.x, z - bay.z) < bay.radius + BAY_MARGIN + r) return true;
      // The drive-through strip: from the street down to the bay.
      if (Math.abs(x - bay.x) < STRIP_HALF + r && z > 118 - r && z < bay.z) return true;
      return taken.some((t) => Math.hypot(x - t.x, z - t.z) < t.r + r);
    },
  };
  const find = (tx: number, tz: number, radius: number) => {
    const s = findSafeSpot(tx, tz, probe, { radius, minDist: 0, maxDist: 25, maxSlope: 0.25, maxWater: 0 });
    if (s) taken.push({ x: s.x, z: s.z, r: radius });
    return s;
  };

  // The client car spot, then the board, then the bench and the client's standing place beside the car.
  const carSpot = find(CAR_TARGET.x, CAR_TARGET.z, CAR_RADIUS) ?? { x: CAR_TARGET.x, y: 0, z: CAR_TARGET.z, yaw: 0 };
  const carYaw = Math.atan2(bay.x - carSpot.x, bay.z - carSpot.z);
  const boardSpot = find(BOARD_TARGET.x, BOARD_TARGET.z, 2.2) ?? { x: BOARD_TARGET.x, y: 0, z: BOARD_TARGET.z, yaw: 0 };
  const benchSpot = find(carSpot.x - 2.5 - CAR_RADIUS, carSpot.z, 2.2);
  const benchX = benchSpot?.x ?? carSpot.x - 6, benchZ = benchSpot?.z ?? carSpot.z;
  const benchYaw = Math.atan2(carSpot.x - benchX, carSpot.z - benchZ);

  // Board faces the street (north, -z); collider is a small box.
  place(scene, 'glaze-work-order-board', boardSpot.x, boardSpot.z, Math.PI);
  world.boxes.push({ minX: boardSpot.x - 1, maxX: boardSpot.x + 1, minZ: boardSpot.z - 0.4, maxZ: boardSpot.z + 0.4, h: 2.2 });
  // Bench faces the car; the client stands 1.6 m in front of it, facing the car too.
  place(scene, 'glaze-client-bench', benchX, benchZ, benchYaw);
  world.boxes.push({ minX: benchX - 1, maxX: benchX + 1, minZ: benchZ - 0.6, maxZ: benchZ + 0.6, h: 0.9 });
  const cx = benchX + Math.sin(benchYaw) * 1.6, cz = benchZ + Math.cos(benchYaw) * 1.6;
  // Impatient client: a newspaper and an empty cup on the bench, a key board above it with one key gone.
  const bench = { x: benchX, z: benchZ };
  if (getPrefab('newspaper')) place(scene, 'newspaper', bench.x + 0.4, bench.z, benchYaw + 0.3, 0.45);
  if (getPrefab('espresso-cup')) place(scene, 'espresso-cup', bench.x - 0.5, bench.z, 0, 0.45);
  place(scene, 'glaze-key-hook-board', bench.x - Math.sin(benchYaw) * 0.7, bench.z - Math.cos(benchYaw) * 0.7, benchYaw, 1.1);

  // Before and after: a primer-grey panel on a tyre stack, next to a gleaming pink-rimmed tyre.
  const ba = find(boardSpot.x - 6, boardSpot.z + 4, 2);
  if (ba) {
    place(scene, 'glaze-tyre-stack', ba.x, ba.z, 0.4);
    place(scene, 'mower-scrap-panel', ba.x + 0.15, ba.z - 0.3, 0.4, 0.9);
    place(scene, 'glaze-tyre-glow', ba.x + 1.3, ba.z + 0.2, 0.9);
    world.boxes.push({ minX: ba.x - 0.7, maxX: ba.x + 0.7, minZ: ba.z - 0.7, maxZ: ba.z + 0.7, h: 1.2 });
  }
  // The colour argument: a swatch wall, two knocked-over pink cones and a mud bucket.
  const sw = find(carSpot.x + 9, carSpot.z + 2, 2.6);
  if (sw) {
    place(scene, 'glaze-swatch-wall', sw.x, sw.z, Math.PI);
    world.boxes.push({ minX: sw.x - 1.3, maxX: sw.x + 1.3, minZ: sw.z - 0.3, maxZ: sw.z + 0.3, h: 2 });
    for (const [dx, dz, yaw] of [[-0.9, -1.4, 1.2], [0.6, -1.9, 2.4]] as const) {
      const o = place(scene, 'glaze-traffic-cone-pink', sw.x + dx, sw.z + dz, yaw, 0.12);
      if (o) o.rotation.z = Math.PI / 2;
    }
    place(scene, 'glaze-mud-bucket', sw.x + 1.6, sw.z - 1.1, 0);
  }
  // Oil drums, off to the side.
  const drums = find(boardSpot.x + 6, boardSpot.z + 5, 1.6);
  if (drums) {
    place(scene, 'glaze-oil-drum', drums.x, drums.z, 0);
    place(scene, 'glaze-oil-drum', drums.x + 0.9, drums.z + 0.3, 1);
    world.boxes.push({ minX: drums.x - 0.5, maxX: drums.x + 1.4, minZ: drums.z - 0.5, maxZ: drums.z + 0.8, h: 1 });
  }

  // Signs.
  const signs: [string, number, number, number][] = [
    ['WORK ORDERS - ASK FOR CASS', boardSpot.x, boardSpot.z - 0.7, Math.PI],
    ['CLIENT CARS ONLY.\nYES, EVEN YOURS.', carSpot.x + 2, carSpot.z + 4.6, Math.PI],
  ];
  for (const [text, x, z, yaw] of signs) {
    const s = coastSign(text, { w: 1.8, h: 0.6, post: 1.0 });
    s.position.set(x, heightAt(x, z), z);
    s.rotation.y = yaw;
    scene.add(s);
    registerCull(s, 'prop');
  }

  built = {
    board: { x: boardSpot.x, z: boardSpot.z + 1.5 },
    car: { x: carSpot.x, z: carSpot.z, yaw: carYaw },
    client: { x: cx, z: cz, yaw: Math.atan2(carSpot.x - cx, carSpot.z - cz) },
  };
  return built;
}
