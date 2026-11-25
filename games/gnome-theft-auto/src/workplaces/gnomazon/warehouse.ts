// E25 Gnomazon: Fulfilment Centre FC-1 in the Dust Flats (site 'gnomazon-fc'): the big shed, loading docks and lot
// outside (buildWarehouseOutside), and the packing floor interior GNOMAZON_FLOOR_ID (defined at import; workplaces/
// index.ts imports this file once). Everything is a prefab; the stories are told with props and signs.
import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { anchorOf } from '../../sites';
import { coastSign } from '../../coast/sign';
import { registerCull } from '../../cull';
import { heightAt } from '../../terrain';
import { defineInterior } from '../../interiors/registry';
import type { InteriorKit, InteriorTheme } from '../../interiors/types';
import type { World } from '../../types';
import { GNOMAZON_FLOOR_ID, GNOMAZON_START_EVENT } from './types';

/** The building's front door (world): the interior's door prompt is here. */
export function warehouseDoor(): { x: number; z: number; yaw: number } {
  const d = anchorOf('gnomazon-fc', 'door');
  return { x: d.x, z: d.z, yaw: d.yaw ?? 0 };
}

// The shed (the half-size prefab at scale 1.6: 40 x 20.8 x 7.2 m) turned to face east: its front is at
// x = SHED.x + 10.4, the glass door ~5 m south of SHED.z (the door anchor), the docks to the north (the dock anchor).
const SHED = { x: 269, z: 92 };
const SHED_SCALE = 1.6;

let built = false;

function topOf(obj: THREE.Object3D): number {
  return new THREE.Box3().setFromObject(obj).max.y;
}

/** A prefab on the ground at (x, z), turned yaw, lifted by `lift`, optionally scaled; skipped (null) if missing. */
function place(scene: THREE.Scene, id: string, x: number, z: number, yaw: number, lift = 0, scale?: number): THREE.Object3D | null {
  if (!getPrefab(id)) return null;
  const o = buildPrefab(id, scale ? { scale } : undefined);
  o.position.set(x, heightAt(x, z) + lift, z);
  o.rotation.y = yaw;
  scene.add(o);
  registerCull(o, 'prop');
  return o;
}

/** A solid collider from an object's world bounds. */
function collide(world: World, o: THREE.Object3D | null): void {
  if (!o) return;
  o.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(o);
  world.boxes.push({ minX: b.min.x, maxX: b.max.x, minZ: b.min.z, maxZ: b.max.z, h: b.max.y - heightAt((b.min.x + b.max.x) / 2, (b.min.z + b.max.z) / 2) });
}

function sign(scene: THREE.Scene, text: string, x: number, z: number, yaw: number, w = 2, h = 0.7, colors: { bg?: number; fg?: number } = {}): void {
  const s = coastSign(text, { w, h, post: 1.1, ...colors });
  s.position.set(x, heightAt(x, z), z);
  s.rotation.y = yaw;
  scene.add(s);
  registerCull(s, 'prop');
}

/** Build the outside once (idempotent). Pushes colliders into world.boxes. */
export function buildWarehouseOutside(scene: THREE.Scene, world: World): void {
  if (built) return;
  built = true;
  const EAST = Math.PI / 2;
  const WEST = -Math.PI / 2;

  // The shed: front (logo, door, docks) to the east, toward the road.
  if (place(scene, 'gnomazon-warehouse', SHED.x, SHED.z, EAST, 0, SHED_SCALE)) {
    world.boxes.push({ minX: SHED.x - 10.4, maxX: SHED.x + 10.4, minZ: SHED.z - 20, maxZ: SHED.z + 20, h: 7.2 });
  }

  // The lot south of the door: parked vans nose-in, with the associate parking sign.
  collide(world, place(scene, 'gta-crepe-van', 290.5, 106, WEST));
  collide(world, place(scene, 'gta-crepe-van', 290.5, 109.5, WEST));
  collide(world, place(scene, 'caravan', 284, 109, WEST));
  sign(scene, 'ASSOCIATE PARKING\n(ALL 4 SPACES)', 287, 103, EAST, 2.4, 0.9);

  // Big signs along the front, clear of the door and the docks.
  sign(scene, 'GNOMAZON FC-1 -\nEVERYTHING, EVENTUALLY', 288, 100.5, EAST, 5, 1.5, { bg: 0x263238, fg: 0xff8a3d });
  sign(scene, 'NOW HIRING (ALWAYS)', 293, 100.5, EAST, 3, 0.8, { bg: 0xff8a3d, fg: 0x263238 });
  sign(scene, 'SAFETY IS OUR #2 PRIORITY', 287, 73.5, EAST, 3.4, 0.8, { bg: 0xfdd835, fg: 0x263238 });

  // Returns pile by the docks, with one opened box and its hat on a traffic cone.
  collide(world, place(scene, 'gnomazon-returns-pile', 285.5, 77, EAST));
  place(scene, 'gnomazon-box-open', 287.6, 79.8, 0.5);
  const cone = place(scene, 'site-cone', 287.4, 81.2, 0);
  if (cone) place(scene, 'pointy-hat', 287.4, 81.2, 0, topOf(cone) - heightAt(287.4, 81.2), 0.5);
  place(scene, 'gnomazon-box-m', 288.6, 78.6, 0.9);

  // Vignette 1: the drone stuck in the hedge, its box on the ground.
  const bush = place(scene, 'round-bush', 292.5, 75.5, 0);
  collide(world, bush);
  if (bush) {
    const drone = place(scene, 'gnomazon-delivery-drone', 292.5, 75.5, 0.6, topOf(bush) - heightAt(292.5, 75.5) - 0.25);
    if (drone) drone.rotation.z = 0.35;
  }
  place(scene, 'gnomazon-box-s', 293.8, 77.4, 0.4);

  // Vignette 2: a lonely picnic bench, the pilot break area, one cold cup.
  const table = place(scene, 'picnic-table', 291.5, 92, EAST);
  collide(world, table);
  if (table) place(scene, 'espresso-cup', 291.5, 92, 0, topOf(table) - heightAt(291.5, 92));
  sign(scene, 'BREAK AREA (PILOT)', 291.5, 88.5, EAST, 2, 0.6);
}

// ---- the packing floor interior -------------------------------------------------------------------------------------

/** Cool warehouse: pale grey floor, grey walls, orange trim, white light. */
const WAREHOUSE_THEME: InteriorTheme = { floor: 0xb4b8bc, wall: 0x9aa1a8, trim: 0xff7a1a, ceiling: 0xdde1e4, light: 0xffffff };
const PAPER = { bg: 0xf5f0e1, fg: 0x263238 };
const ORANGE = { bg: 0xff7a1a, fg: 0x263238 };

function putIf(kit: InteriorKit, id: string, x: number, z: number, yaw = 0, opts?: Parameters<InteriorKit['put']>[4]): THREE.Object3D | null {
  if (!getPrefab(id)) return null;
  return kit.put(id, x, z, yaw, opts);
}

const door = warehouseDoor();

defineInterior({
  id: GNOMAZON_FLOOR_ID,
  name: 'Gnomazon FC-1',
  prompt: 'Clock in at Gnomazon',
  door,
  exit: { x: door.x + 2, z: door.z, yaw: Math.PI / 2 },
  size: { w: 36, d: 24, h: 8 },
  theme: WAREHOUSE_THEME,
  ambience: 'silent',
  build(kit) {
    kit.room();
    kit.door(17.8, 8, -Math.PI / 2);

    // --- Shelving: two rows with a 3 m aisle between ---------------------------------------------------------------
    for (let i = 0; i < 6; i++) {
      const x = -15.5 + i * 2.6;
      putIf(kit, 'gnomazon-shelf-rack', x, -10.5, 0);
      putIf(kit, 'gnomazon-shelf-rack', x, -6.5, Math.PI);
    }

    // --- Two conveyor lines end to end, four packing stations facing them -------------------------------------------
    putIf(kit, 'gnomazon-conveyor', 4, -2.6, 0);
    putIf(kit, 'gnomazon-conveyor', 8.4, -2.6, 0);
    const stationX = [2.5, 5.0, 7.5, 10.0];
    for (const x of stationX) putIf(kit, 'gnomazon-packing-station', x, -0.8, 0);

    // Station 1 is the player's.
    kit.spot({
      id: 'gnomazon-pack',
      x: stationX[0],
      z: 0.5,
      prompt: 'Clock in (pack parcels)',
      run() {
        window.dispatchEvent(new CustomEvent(GNOMAZON_START_EVENT));
      },
    });

    // --- Associates ---------------------------------------------------------------------------------------------------
    const vest = (shirt: number) => ({ hat: 0xff7a1a, shirt, beard: 0xd7d7d7 });
    kit.npc({ id: 'gnz-assoc-1', name: 'Associate Bramwell', x: stationX[1], z: 0.5, yaw: Math.PI, look: vest(0x4fc3f7), line: 'Day 900 of my seasonal contract.' });
    kit.npc({ id: 'gnz-assoc-2', name: 'Associate Tansy', x: stationX[2], z: 0.5, yaw: Math.PI, look: vest(0xf06292), line: 'I packed a box inside a box once. Kippy loved it.' });
    kit.npc({ id: 'gnz-assoc-3', name: 'Associate Digby', x: stationX[3], z: 0.5, yaw: Math.PI, look: vest(0xaed581), line: 'The break room is coming soon. I have seen the plans. It is a chair.' });
    kit.npc({ id: 'gnz-assoc-4', name: 'Associate Pim', x: -8.6, z: -8.5, yaw: Math.PI / 2, look: vest(0xffd54f), line: 'This tote is going to the right shelf. Probably.' });
    putIf(kit, 'gnomazon-tote', -7.7, -8.5, Math.PI / 2, { solid: false });

    // --- KPI-9 and the wall screen ------------------------------------------------------------------------------------
    putIf(kit, 'kpi-9-manager-bot', 6.2, 3.6, Math.PI);
    kit.block(6.4, 2.2, 0.15, 8, -11.9, { y: 2.4, color: 0x0d3b1f, emissive: 0x0b6b30, solid: false });
    kit.sign('UNITS PER HOUR: GREAT!', 8, 3.5, -11.8, 0, { w: 6, h: 1.8, bg: 0x0d3b1f, fg: 0x69f0ae });

    // --- Signs ----------------------------------------------------------------------------------------------------------
    kit.sign('SMILE: YOU ARE ON KPI', -9, 4.6, -11.95, 0, { w: 4.4, h: 0.9, ...ORANGE });
    kit.sign('IF IT FITS, IT SHIPS.\nIF IT DOES NOT FIT, ALSO SHIPS.', -17.95, 3.2, 1, Math.PI / 2, { w: 5.2, h: 1.3, ...PAPER });
    kit.sign('ASSOCIATE OF THE MONTH:\nKPI-9', 17.95, 3.0, -4, -Math.PI / 2, { w: 3.6, h: 1.3, bg: 0x263238, fg: 0xffd54f });
    putIf(kit, 'gnomazon-break-room-sign', -10, 9.5, Math.PI, { solid: false });
    kit.sign('BREAK ROOM:\nCOMING SOON', -10, 1.9, 9.4, Math.PI, { w: 1.4, h: 0.5, ...PAPER });

    // --- Vignette 1: the box-in-a-box tower on a pallet -----------------------------------------------------------------
    const pallet = putIf(kit, 'pallet-stack', -14, 5, 0);
    let y = pallet ? topOf(pallet) : 0.15;
    for (const s of [1.3, 0.95, 0.65, 0.4]) {
      const b = putIf(kit, 'gnomazon-box-open', -14, 5, s * 3, { y, solid: false, size: s });
      if (b) y += 0.02 * s;
    }
    putIf(kit, 'gnomazon-box-s', -14, 5, 0.3, { y, solid: false, size: 0.15 });

    // --- Vignette 2: the birthday at station 4 --------------------------------------------------------------------------
    const cake = putIf(kit, 'acorn-cake', 10.45, -0.8, 0, { y: 0.9, solid: false, size: 0.18 });
    if (cake) putIf(kit, 'candle', 10.45, -0.8, 0, { y: topOf(cake), solid: false, size: 0.1, by: 'h' });
    kit.sign('HAPPY BIRTHDAY', 10, 1.9, -1.2, 0, { w: 1.5, h: 0.3, bg: 0xf06292, fg: 0xffffff });

    // --- Vignette 3: the suggestion box -----------------------------------------------------------------------------------
    putIf(kit, 'gnomazon-box-m', 15, -9, 0.2, { size: 0.9 });
    putIf(kit, 'gnomazon-box-s', 15.1, -8.9, 0.5, { y: 0.9, solid: false });
    putIf(kit, 'gnomazon-tape-gun', 14.5, -9, 0.7, { y: 0.9, solid: false });
    kit.sign('SUGGESTIONS', 15, 0.45, -8.5, 0.2, { w: 0.6, h: 0.2, ...PAPER });
  },
});
