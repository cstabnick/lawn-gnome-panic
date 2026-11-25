// E25 firefighter: Turfton Fire Station No. 1 on the Mossy Wood edge (site 'fire-station'): the engine house with its
// bays opening east onto the apron, the bell post, a hose tower, Chief Hydra Pumpwell, a yard hydrant and three small
// stories told with props.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import type { GnomeLook, GnomeModel } from '@lawn/gnome';
import { coastSign } from '../../coast/sign';
import { registerCull } from '../../cull';
import { HYDRANT_SPOTS } from '../../destructibles';
import { gnomeState, makeGnome, randomTownLook } from '../../gnomes';
import { anchorOf } from '../../sites';
import { heightAt } from '../../terrain';
import type { World } from '../../types';

export interface Station {
  /** Where the Pumper is parked for a shift (in the bay, facing out). */
  engine: { x: number; z: number; yaw: number };
  /** The "Answer the bell" spot (on foot). */
  bell: { x: number; z: number };
  /** Hydrants the station adds (its yard); the runtime adds HYDRANT_SPOTS and one per call. */
  hydrants: { x: number; z: number }[];
}

/** Every fixed hydrant in the world the engine can refill at (downtown kerb hydrants). */
export function cityHydrants(): { x: number; z: number }[] {
  return HYDRANT_SPOTS.map(([x, z]) => ({ x, z }));
}

interface Resident {
  model: GnomeModel;
  x: number;
  z: number;
  yaw: number;
  sitting: boolean;
  /** Seconds, for the idle sway. */
  t: number;
}

const E = Math.PI / 2;
// The house is 18 m wide (local x) and 6 m deep, bays on local +z. Turned by PI/2 the bays open east (+x). Its centre
// is picked so the second bay (local x = -4.5) lines up with the engine anchor row (z 135).
const HOUSE = { x: -230, z: 130.5 };

let built: Station | null = null;
let residents: Resident[] = [];

function place(scene: THREE.Scene, id: string, x: number, z: number, yaw: number, lift = 0, scale = 1): THREE.Object3D | null {
  if (!getPrefab(id)) return null;
  const o = buildPrefab(id);
  o.position.set(x, heightAt(x, z) + lift, z);
  o.rotation.y = yaw;
  if (scale !== 1) o.scale.setScalar(scale);
  scene.add(o);
  registerCull(o, 'prop');
  return o;
}

function box(world: World, x0: number, x1: number, z0: number, z1: number, h: number): void {
  world.boxes.push({ minX: x0, maxX: x1, minZ: z0, maxZ: z1, h });
}

/** A small solid prop: square collider of half-size r at (x, z). */
function solid(world: World, x: number, z: number, r: number, h: number): void {
  box(world, x - r, x + r, z - r, z + r, h);
}

/** A flat concrete pad, lifted 0.012 m on the area layer. */
function pad(scene: THREE.Scene, x0: number, x1: number, z0: number, z1: number): void {
  const mat = flatLayer(new THREE.MeshStandardMaterial({ color: 0x8d8f91, roughness: 0.95 }), LAYER.area);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), mat);
  m.rotation.x = -Math.PI / 2;
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  m.position.set(cx, heightAt(cx, cz) + 0.012, cz);
  m.receiveShadow = true;
  scene.add(m);
  registerCull(m, 'prop');
}

function sign(scene: THREE.Scene, text: string, x: number, z: number, yaw: number, o: { w?: number; h?: number; post?: number; lift?: number } = {}): void {
  const s = coastSign(text, { w: o.w ?? 1.8, h: o.h ?? 0.6, post: o.post ?? 1.0 });
  s.position.set(x, heightAt(x, z) + (o.lift ?? 0), z);
  s.rotation.y = yaw;
  scene.add(s);
  registerCull(s, 'prop');
}

function resident(scene: THREE.Scene, x: number, z: number, yaw: number, sitting: boolean, look: GnomeLook): void {
  const model = makeGnome(scene, look);
  residents.push({ model, x, z, yaw, sitting, t: Math.random() * 6 });
  model.update(gnomeState(x, heightAt(x, z) + (sitting ? 0.3 : 0), z, yaw, 0, sitting), 0);
}

/** Build the station once (idempotent) and return its spots. Pushes colliders into world.boxes. */
export function buildStation(scene: THREE.Scene, world: World): Station {
  if (built) return built;
  const e = anchorOf('fire-station', 'engine');
  const d = anchorOf('fire-station', 'door');
  const y = anchorOf('fire-station', 'yard');
  const hydrants: { x: number; z: number }[] = [];
  residents = [];

  // The house: wall piers as thin boxes around the two bays (openings z 123.75..128.25 and 132.75..137.25), so the
  // engine drives in and out. The lintel above the bays starts at 3.4 m, clear of the Pumper.
  place(scene, 'fire-station-house', HOUSE.x, HOUSE.z, E);
  for (const [a, b] of [[121.5, 123.75], [128.25, 132.75], [137.25, 139.5]]) box(world, HOUSE.x - 3, HOUSE.x + 3, a, b, 3.4);
  // The apron: from the bays east to the site edge, then on to the road at the north-east corner.
  pad(scene, -227, -217, 123, 147);
  pad(scene, -217, -213.5, 122, 136);

  // Bell post by the side door.
  place(scene, 'fire-bell-post', d.x, d.z, E);
  solid(world, d.x, d.z, 0.2, 2.2);
  const bell = { x: d.x, z: d.z + 2 };

  // Yard: hose tower, boot rack, hydrant, callbox, practice shed.
  const tower = { x: -243, z: 127 };
  place(scene, 'fire-hose-drying-tower', tower.x, tower.z, 0);
  solid(world, tower.x, tower.z, 1, 7);
  const rack = { x: -237, z: 128 };
  place(scene, 'fire-boot-rack', rack.x, rack.z, -E);
  box(world, rack.x - 0.4, rack.x + 0.4, rack.z - 0.85, rack.z + 0.85, 0.9);
  const hy = { x: -238, z: 139 };
  place(scene, 'kerb-hydrant', hy.x, hy.z, 0);
  solid(world, hy.x, hy.z, 0.25, 0.8);
  hydrants.push(hy);
  place(scene, 'fire-callbox', -224.5, 122.5, E);
  solid(world, -224.5, 122.5, 0.2, 1.4);

  // Story 1: the practice shed, scorched and patched, a bucket chain leading to it, one bucket knocked over.
  place(scene, 'fire-practice-shed', y.x, y.z, y.yaw ?? 0);
  box(world, y.x - 1.4, y.x + 1.4, y.z - 1.1, y.z + 1.1, 2);
  place(scene, 'fire-scorch-mark', y.x, y.z + 2.2, 0.4, 0.02);
  place(scene, 'fire-scorch-mark', y.x - 1.6, y.z + 0.3, 1.9, 0.02, 0.7);
  for (const [bx, bz, by] of [[y.x + 7, y.z + 3, 0], [y.x + 4.7, y.z + 3.1, 0.5], [y.x + 2.5, y.z + 2.9, 1.2]]) {
    place(scene, 'bucket-and-spade', bx, bz, by);
  }
  const tip = place(scene, 'bucket-and-spade', y.x + 3.6, y.z + 4.6, 2);
  if (tip) { tip.rotation.z = Math.PI / 2; tip.position.y += 0.15; }

  // Story 2: the station kitchen table outside, chilli on its stove, five bowls, one chair pulled out in a hurry.
  const kt = { x: -249, z: 142 };
  place(scene, 'table', kt.x, kt.z, 0);
  box(world, kt.x - 0.65, kt.x + 0.65, kt.z - 0.45, kt.z + 0.45, 0.6);
  place(scene, 'fire-chili-pot', kt.x + 1.5, kt.z, 0);
  solid(world, kt.x + 1.5, kt.z, 0.35, 0.6);
  for (let i = 0; i < 5; i++) place(scene, 'glaze-extra-plate', kt.x - 0.46 + i * 0.23, kt.z + (i % 2 ? 0.12 : -0.12), 0, 0.6, 0.5);
  for (const [cx, cz, cy] of [[kt.x - 0.4, kt.z - 1.0, 0], [kt.x + 0.4, kt.z - 1.0, 0], [kt.x - 0.4, kt.z + 1.0, Math.PI]]) {
    place(scene, 'chair', cx, cz, cy);
  }
  place(scene, 'chair', kt.x + 0.9, kt.z + 1.7, Math.PI + 0.9); // the one pulled out in a hurry

  // Story 3: the cat's corner at the tower's foot: a saucer of milk, a tiny blanket on a crate, a notice.
  const cat = { x: tower.x + 2.5, z: tower.z - 1.5 };
  place(scene, 'crate', cat.x, cat.z, 0.3, 0, 0.5);
  place(scene, 'round-rug', cat.x, cat.z, 0, 0.26, 0.2);
  place(scene, 'glaze-extra-plate', cat.x + 0.7, cat.z + 0.5, 0, 0, 0.4);
  solid(world, cat.x, cat.z, 0.25, 0.3);
  sign(scene, 'MISSING:\nASPHALT (AGAIN)', tower.x, tower.z + 0.98, 0, { w: 1.3, h: 0.55, post: 0, lift: 1.6 });

  // Signs, each on its own small post collider.
  const signs: [string, number, number, number, number, number][] = [
    ['TURFTON FIRE STATION No. 1', -225.5, 125.5, E, 3.2, 0.8],
    ['WET IS BEST', -225.5, 145, E, 1.8, 0.6],
    ['DAYS SINCE LAST\nBARBECUE: 0', -236.5, 134, E, 2.0, 0.8],
    ['KEEP CLEAR - ENGINE EXITS\n(SOMETIMES IN A HURRY)', -222, 128, E, 2.8, 0.9],
    ['NO SMOKING.\nNOT EVEN A LITTLE.', -247, 138.5, 0, 2.0, 0.8],
  ];
  for (const [text, sx, sz, syaw, w, h] of signs) {
    sign(scene, text, sx, sz, syaw, { w, h });
    solid(world, sx, sz, 0.15, 1.5);
  }

  // Residents: Chief Hydra Pumpwell by the bell, a firefighter on the boot rack.
  resident(scene, d.x - 1.6, d.z + 1.2, E, false, randomTownLook({ hat: 0xd4af37, shirt: 0xc0392b }));
  resident(scene, rack.x, rack.z, -E, true, randomTownLook({ hat: 0xc0392b, shirt: 0x2f64c9 }));

  built = { engine: { x: e.x, z: e.z, yaw: e.yaw ?? E }, bell, hydrants };
  return built;
}

/** Animate the residents: the Chief sways on her heels, hands behind her back. */
export function updateStation(dt: number): void {
  for (const r of residents) {
    r.t += dt;
    const gy = heightAt(r.x, r.z) + (r.sitting ? 0.3 : 0);
    r.model.update(gnomeState(r.x, gy, r.z, r.yaw, 0, r.sitting), dt);
    if (!r.sitting) {
      // Arms behind the back (after update(), which animates them).
      r.model.arms.left.rotation.set(0.55, 0, 0.1);
      r.model.arms.right.rotation.set(0.55, 0, -0.1);
      r.model.object.rotation.y = r.yaw + Math.sin(r.t * 0.5) * 0.15;
    }
  }
}
