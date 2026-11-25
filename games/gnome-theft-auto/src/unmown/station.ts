// The Unmown Ranger Station (E31): the building, its yard, the walk-in interior.
// Site: x -1585..-1535, z -1170..-1130 (config STATION). The hut is centred about (-1560, -1148) facing +z (the lane).
import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import type { Box } from '../types';
import { heightAt } from '../terrain';
import { buildStaticCells } from '../cull';
import { textPlate } from '../homes/pieces';
import { defineInterior, interiorById } from '../interiors/registry';

export const RANGER_STATION_INTERIOR = 'unmown-ranger-station';

const HUT = { x: -1560, z: -1148 };

const RULES = 'UNMOWN PRESERVE RULES\n1. No mowing.\n2. No thinking about mowing.\n3. Hats off to the herons.\n4. The HOA may visit on Tuesdays,\nbut may not enjoy it.';

/** Rectangle collider from a centre and half sizes. */
function rect(boxes: Box[], x: number, z: number, hw: number, hd: number, h: number): void {
  boxes.push({ minX: x - hw, maxX: x + hw, minZ: z - hd, maxZ: z + hd, h });
}

function defineStationInterior(): void {
  if (interiorById(RANGER_STATION_INTERIOR)) return;
  defineInterior({
    id: RANGER_STATION_INTERIOR,
    name: 'Unmown Ranger Station',
    door: { x: HUT.x, z: HUT.z + 6.9, yaw: Math.PI },
    exit: { x: HUT.x, z: HUT.z + 9.5, yaw: 0 },
    size: { w: 10, d: 7, h: 3.2 },
    theme: 'burrow',
    ambience: 'silent',
    build(kit) {
      kit.room();
      kit.door(0, 3.5, Math.PI);
      kit.put('rug', 0, 2.2, 0, { solid: false, size: 1.8, tint: 0x6b8e23 });

      // Counter along the north side with the Head Ranger behind it.
      kit.block(4, 1.0, 0.8, 0, -1.6, { color: 0x6d4c41 });
      kit.put('espresso-cup', -1.2, -1.6, 0.4, { y: 1.0, solid: false, size: 0.15 });
      kit.npc({
        id: 'burdock',
        name: 'Head Ranger Burdock Haybright',
        x: 0, z: -2.6, yaw: 0,
        look: { hat: 0x6b7a3a, shirt: 0x4e6b3a, beard: 0xb0a58c },
        line: 'Welcome to the Unmown. Please sign the book, wipe your boots, and do not, under any circumstances, mention hedge trimmers.',
      });

      // Display case with the Last Blade, specimen shelf, notice.
      kit.put('unmown-display-case', 3.2, -2.8, 0);
      kit.sign('THE LAST BLADE\nPlease do not sharpen.', 3.2, 2.0, -3.45, 0, { w: 1.6, h: 0.5 });
      const shelf = kit.put('bookshelf', -4.5, -1.5, Math.PI / 2);
      const top = new THREE.Box3().setFromObject(shelf).max.y;
      for (let i = 0; i < 3; i++) kit.put('specimen-jar', -4.5, -2.1 + i * 0.6, Math.PI / 2, { y: top, solid: false });
      kit.sign('WHERE THE GRASS IS\n(EVERYWHERE)', -4.95, 2.0, 1.5, Math.PI / 2, { w: 1.8, h: 0.8, bg: 0xf5f0e1, fg: 0x263238 });

      // Tea corner, ranger chair with hat, hat box.
      const side = kit.put('side-table', 4.2, 1.0, 0);
      kit.put('espresso-cup', 4.2, 1.0, 0, { y: new THREE.Box3().setFromObject(side).max.y, solid: false, size: 0.18 });
      kit.put('chair', 2.4, 1.2, -0.6);
      kit.put('ranger-campaign-hat', 2.4, 1.2, -0.6, { y: 0.55, solid: false, size: 0.4 });
      kit.put('lost-hat-box', -3.4, 2.6, 0.3);
      kit.sign('LOST PROPERTY\n(HOA HATS)', -3.4, 1.3, 3.45, Math.PI, { w: 1.0, h: 0.4 });
      kit.window(4.95, -1, -Math.PI / 2, 1.4, 1.0, 1.2);
    },
  });
}

/** Builds the ranger station on its site and defines its interior. Pushes its colliders into `boxes`. Runs once from living/build.ts during the world build (also in tests: no DOM). */
export function buildRangerStation(scene: THREE.Scene, boxes: Box[]): void {
  const gy = (x: number, z: number): number => heightAt(x, z);

  // ---- The hut -----------------------------------------------------------------------------------------------------
  if (getPrefab('unmown-ranger-hut')) {
    const hut = buildPrefab('unmown-ranger-hut', { lights: false });
    hut.position.set(HUT.x, gy(HUT.x, HUT.z), HUT.z);
    scene.add(hut);
  }
  // Walls and plinth (the porch is walkable), and the two porch posts.
  rect(boxes, HUT.x, HUT.z, 6.1, 4.1, 4.4);
  rect(boxes, HUT.x - 5.5, HUT.z + 5.8, 0.15, 0.15, 3);
  rect(boxes, HUT.x + 5.5, HUT.z + 5.8, 0.15, 0.15, 3);
  scene.add(textPlate('UNMOWN RANGER STATION\nPlease do not mow', HUT.x, gy(HUT.x, HUT.z) + 3.6, HUT.z + 6.09, 0, { w: 2.9, h: 0.55, bg: 0x3e5a2a, fg: 0xf3ead2 }));

  // ---- Yard dressing -----------------------------------------------------------------------------------------------
  const spots: { id: string; x: number; z: number; yaw?: number; scale?: number; tint?: number }[] = [
    { id: 'bird-feeder', x: -1548, z: -1146 },
    { id: 'log-bench', x: -1570, z: -1137, yaw: 0.2 },
    { id: 'log-bench', x: -1550, z: -1137, yaw: -0.2 },
    { id: 'rules-board', x: -1545, z: -1133 },
    { id: 'trail-fingerpost', x: -1560, z: -1168 },
    { id: 'bird-box', x: -1583, z: -1146 },
    { id: 'insect-hotel', x: -1580, z: -1162 },
    { id: 'woodpile', x: -1540, z: -1158 },
    { id: 'reel-mower', x: -1578, z: -1153, yaw: 0.5, tint: 0x8a4b2a },
    { id: 'reel-mower', x: -1575, z: -1157, yaw: 2.2, tint: 0x8a4b2a },
    { id: 'groan-velvet-rope', x: -1574, z: -1150, yaw: 0 },
    { id: 'groan-velvet-rope', x: -1574, z: -1160, yaw: 0 },
    { id: 'trail-fingerpost', x: -1572, z: -1148, scale: 0.4 },
    { id: 'lost-hat-box', x: -1565, z: -1141, yaw: 0.3 },
  ];
  const flowers: [number, number][] = [[-1583, -1139], [-1538, -1140], [-1537, -1150], [-1584, -1167], [-1550, -1164], [-1568, -1166], [-1542, -1167]];
  const placements = [
    ...spots.map((s) => ({ id: s.id, x: s.x, y: gy(s.x, s.z), z: s.z, yaw: s.yaw, scale: s.scale, tint: s.tint })),
    ...flowers.map(([x, z]) => ({ id: 'wildflower-patch', x, y: gy(x, z), z })),
  ];
  scene.add(buildStaticCells(placements, { name: 'unmown-station' }));

  // Signs on the yard pieces: the rules on the board, the paper tag on the little stake by the mower pile.
  scene.add(textPlate(RULES, -1545, gy(-1545, -1133) + 1.45, -1133 + 0.08, 0, { w: 1.3, h: 0.85, bg: 0xe8dcc0, fg: 0x2b2118 }));
  scene.add(textPlate('CONFISCATED\nMOWERS', -1572, gy(-1572, -1148) + 1.0, -1148 + 0.2, 0, { w: 0.36, h: 0.2, bg: 0xf5f0e1, fg: 0x8a2b1a }));

  // Colliders for the solid yard pieces.
  rect(boxes, -1578, -1153, 0.8, 1.2, 1.0);
  rect(boxes, -1575, -1157, 0.8, 1.2, 1.0);
  rect(boxes, -1545, -1133, 0.8, 0.2, 2.2);
  rect(boxes, -1540, -1158, 1.0, 0.6, 1.0);
  rect(boxes, -1565, -1141, 0.5, 0.4, 0.5);
  rect(boxes, -1548, -1146, 0.3, 0.3, 1.8);
  rect(boxes, -1580, -1162, 0.5, 0.3, 1.3);
  rect(boxes, -1560, -1168, 0.2, 0.2, 2.4);

  defineStationInterior();
}
