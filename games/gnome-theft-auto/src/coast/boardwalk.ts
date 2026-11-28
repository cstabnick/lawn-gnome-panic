// Saltbucket Boardwalk (E11 issue 2A; FX11 split the pier, the stalls and the promenade dressing into their own modules).
// The plank promenade: deck, south railing, stairs, lamps, benches, joke signs and the beach dressing. Geometry is merged
// per material and per 60 m chunk along x (deckKit.ts Bins) so the cull system can drop far parts.
import * as THREE from 'three';
import type { Box } from '../types';
import { heightAt } from '../terrain';
import { addRooftop, rooftopById } from '../interiors/rooftops';
import { COAST } from './config';
import { Bins, deckSlabs, place, railLine, signAt, solid } from './deckKit';
import { lightPool } from './nightLights';
import { buildPier } from './pier';
import { buildStalls } from './stalls';
import { buildPromenade } from './promenade';

/** Stairs down to the sand (x centres), their width, and the south railing's z. */
export const STAIR_X = [-120, 0, 120] as const;
export const STAIR_W = 4;
const RAIL_INSET = 0.7;

/** The lamp posts' x positions (both long edges, every lampStep m) and their z rows (north, south). */
export function boardwalkLamps(): { xs: number[]; zs: [number, number] } {
  const bw = COAST.boardwalk, R = bw.rect;
  const xs: number[] = [];
  for (let x = R.minX + bw.lampStep / 2; x < R.maxX; x += bw.lampStep) xs.push(x);
  return { xs, zs: [R.minZ + 2.6, R.maxZ - 2.8] };
}

export function buildBoardwalk(scene: THREE.Scene, boxes: Box[]): void {
  const bw = COAST.boardwalk;
  const R = bw.rect;
  const bins = new Bins();
  const cx = (R.minX + R.maxX) / 2, cz = (R.minZ + R.maxZ) / 2;
  const y0 = heightAt(cx, cz);
  const deckTop = y0 + bw.deckLift;

  // The promenade is a walkable deck: bodies stand on the planks (22 cm above the flat ground; a step is 2 m), not in them.
  if (!rooftopById('saltbucket-boardwalk')) {
    addRooftop({ id: 'saltbucket-boardwalk', name: 'Saltbucket Boardwalk', minX: R.minX, maxX: R.maxX, minZ: R.minZ, maxZ: R.maxZ, y: deckTop, solid: false, parapet: false });
  }

  // ---- Deck: 0.3 m boxes, top 22 cm proud of the (flat) ground, bottom below it; thin boards painted on by the texture ----------
  deckSlabs(bins, R.minX, R.maxX, deckTop, R.minZ, R.maxZ, 'woodA', 'x');

  // ---- South railing with stair gaps, and the stairs themselves -----------------------------------------------------
  const railZ = R.maxZ - RAIL_INSET;
  const runs: [number, number][] = [];
  let from = R.minX;
  for (const sx of STAIR_X) {
    runs.push([from, sx - STAIR_W / 2]);
    from = sx + STAIR_W / 2;
  }
  runs.push([from, R.maxX]);
  for (const [a, b] of runs) railLine(bins, boxes, a, railZ, b, railZ, deckTop, 1.0, deckTop + 1.0);
  for (const sx of STAIR_X) {
    for (let i = 0; i < 3; i++) {
      const top = y0 + [0.17, 0.13, 0.09][i];
      const z0 = R.maxZ - 0.05 + i * 0.8;
      bins.box('step', sx - STAIR_W / 2, sx + STAIR_W / 2, top - 0.35, top, z0, R.maxZ + (i + 1) * 0.8);
    }
  }

  // ---- Stalls (stalls.ts) and the promenade's south row and dressing (promenade.ts) -------------------------------
  buildStalls(scene, boxes, deckTop);
  buildPromenade(scene, boxes, deckTop);

  // ---- Lamps (both long edges) and benches (south edge, facing the sea, every second gap) ---------------------------
  const { xs: lampXs, zs: lampZs } = boardwalkLamps();
  for (const x of lampXs) {
    for (const z of lampZs) {
      const lamp = place(scene, 'boardwalk-lamp', x, z, 0, 2.2, bw.deckLift);
      // A warm pool of light on the planks under the lamp (night only), kept inside the deck edge.
      scene.add(lightPool(x, deckTop, z, Math.min(4.2, z - R.minZ, R.maxZ - z, x - R.minX, R.maxX - x), 0xffd08a, 0.85));
      if (lamp) boxes.push({ minX: x - 0.3, maxX: x + 0.3, minZ: z - 0.3, maxZ: z + 0.3, h: deckTop + 5.4 });
    }
  }
  // Benches sit between lamps; stairs are at -120 / 0 / 120 (gap midpoints with an even index), so use the odd ones.
  for (let i = 0; i < lampXs.length - 1; i++) {
    if (i % 2 === 1) continue;
    const bx = (lampXs[i] + lampXs[i + 1]) / 2;
    if (STAIR_X.some((sx) => Math.abs(sx - bx) < STAIR_W)) continue;
    place(scene, 'park-bench', bx, R.maxZ - 2.2, 0, 2, bw.deckLift);
  }

  // ---- Joke signs ---------------------------------------------------------------------------------------------------
  const gY = (x: number, z: number): number => heightAt(x, z);
  const ent = bw.entrance;
  signAt(scene, 'SALTBUCKET BOARDWALK\nEst. the day the bucket sank', ent.x - 6, gY(ent.x - 6, ent.z), ent.z, Math.PI, { w: 5, h: 1.5, post: 1.6 });
  signAt(scene, 'NO GULLS\n(they cannot read, but we live in hope)', -112, deckTop, R.maxZ - 1.5, 0, { w: 3.6, h: 1.1, post: 1.2 });
  signAt(scene, 'THE SALTWATER\nIt is real. Stop asking.', 20, gY(20, 1160), 1160, Math.PI, { w: 3.6, h: 1.1, post: 1.4 });
  signAt(scene, 'LONG SPOON PIER\nWalk it slow. The bowl end sways.', COAST.pier.spur.minX - 5, deckTop, COAST.pier.spur.minZ - 3, -Math.PI / 2, { w: 4, h: 1.2, post: 1.4 });
  signAt(scene, 'MIND THE STAIRS\nThere are three. We counted.', 6, deckTop, R.maxZ - 1.5, 0, { w: 3.2, h: 1.0, post: 1.2 });
  signAt(scene, 'PLEASE DO NOT FEED THE SEA\nIt is full.', -150, gY(-150, 1176), 1176, Math.PI, { w: 4, h: 1.1, post: 1.4 });

  // ---- Long Spoon Pier (pier.ts) ---------------------------------------------------------------------------------------
  buildPier(scene, boxes, deckTop);

  // ---- Beach dressing (z 1145..1185; x 132..168 stays clear for the Last Tube) ----------------------------------------
  // Hand-placed groups: every one has its own yaw, scale and offsets (G3#29). Chairs under Burnt Ned (-105.5, 1171) and
  // Bev Nell (-66, 1177.5) face north (yaw ~pi) like their lean-back; the rest look at the sea or the sun.
  const hutAt = (x: number, z: number, yaw: number, tint: number, scale: number): void => {
    solid(boxes, place(scene, 'beach-hut', x, z, yaw, scale, 0, tint));
  };
  hutAt(-298, 1157, 0.07, 0x4fa3d9, 2.3);
  const tideHut = { x: -261, z: 1164.5, yaw: -0.12, scale: 2.1 }; // set back from the row
  hutAt(tideHut.x, tideHut.z, tideHut.yaw, 0xf2a93b, tideHut.scale);
  hutAt(-229, 1156.5, 0.55, 0xe8453c, 2.2); // door turned to the sun, towels drying beside it
  place(scene, 'towel-line', -233.8, 1161, 0.12, 2.1);
  hutAt(-196, 1160.5, -0.06, 0x6bbf59, 2.15);
  // The tide table (G3#23): fixed on the tide hut's west wall, 3 cm proud, facing out.
  {
    const nx = -Math.cos(tideHut.yaw), nz = Math.sin(tideHut.yaw); // the west wall's outward normal
    const half = 0.7 * tideHut.scale + 0.07;
    const sx = tideHut.x + nx * half, sz = tideHut.z + nz * half;
    signAt(scene, 'TIDE TABLE\nHigh 06:12 (approx.)\nLow 12:30 (approx.)\nHigh 18:40 (approx.)',
      sx, gY(sx, sz) + 0.6, sz, Math.atan2(nx, nz), { w: 1.7, h: 1.0, post: 0 });
  }

  // Umbrellas and chairs, in pairs and families.
  place(scene, 'beach-umbrella', -110.5, 1165.5, 0.3, 2.1);
  place(scene, 'deck-chair', -107.2, 1169.2, 3.25, 2);
  place(scene, 'deck-chair', -112.9, 1168.1, 2.85, 1.9);
  place(scene, 'beach-umbrella', -69.2, 1171.4, -0.5, 1.95, 0, 0x2fa8a0);
  place(scene, 'deck-chair', -66.8, 1175.3, 3.45, 2.05);
  // The family with the windbreak, the blanket and the ball.
  place(scene, 'windbreak', -12.5, 1159.5, 0.14, 2, 0, 0xe8453c);
  place(scene, 'beach-umbrella', -21.8, 1163.4, -0.4, 2.2, 0, 0xf08bb4);
  place(scene, 'picnic-blanket-spread', -16.8, 1166.4, 0.5, 1.7);
  place(scene, 'beach-ball', -13.2, 1167.6, 0, 1.6);
  place(scene, 'deck-chair', -22.3, 1168.2, 0.2, 2);
  place(scene, 'deck-chair', -19.4, 1169.9, -0.18, 1.88);
  // A lone chair turned to the sun, under its own umbrella.
  place(scene, 'beach-umbrella', 74.6, 1174.8, 1.1, 2.15, 0, 0x5ac8a8);
  place(scene, 'deck-chair', 80.4, 1180.2, 5.1, 2.1);
  solid(boxes, place(scene, 'lifeguard-chair', 60, 1170, 0.05, 2.2));
  // A couple at the east end.
  place(scene, 'beach-umbrella', 188.2, 1165.9, -0.25, 1.9);
  place(scene, 'deck-chair', 191.6, 1169.6, 0.25, 2);
  place(scene, 'deck-chair', 194.5, 1168.7, -0.45, 1.95);

  // Sandcastles, each with its bucket at its own spot.
  place(scene, 'sandcastle', -200, 1180, 0.2, 1.9);
  place(scene, 'bucket-and-spade', -196.8, 1181.9, 2.4, 2);
  place(scene, 'sandcastle', -40, 1168, 2.1, 2.2);
  place(scene, 'bucket-and-spade', -43.4, 1166.6, 0.4, 1.9);
  place(scene, 'bucket-and-spade', -37.2, 1170.6, 4.0, 2.1, 0, 0x4fa3d9); // two buckets
  place(scene, 'sandcastle', 100, 1160, -0.7, 2);
  const knocked = place(scene, 'bucket-and-spade', 102.2, 1163.9, 0.9, 2, 0.2); // knocked over
  if (knocked) knocked.rotation.z = 1.25;
  place(scene, 'sandcastle', 225, 1165, 1.4, 2.1);
  place(scene, 'bucket-and-spade', 222.3, 1167.4, -0.8, 1.8, 0, 0xf2a93b);

  bins.flush(scene);
}
