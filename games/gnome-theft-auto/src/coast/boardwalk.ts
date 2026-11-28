// Saltbucket Boardwalk (E11 issue 2A; FX11 split the pier, the stalls and the promenade dressing into their own modules).
// The plank promenade: deck, south railing, stairs, lamps, benches, joke signs and the beach dressing. Geometry is merged
// per material and per 60 m chunk along x (deckKit.ts Bins) so the cull system can drop far parts.
import * as THREE from 'three';
import type { Box } from '../types';
import { heightAt } from '../terrain';
import { addRooftop, rooftopById } from '../interiors/rooftops';
import { COAST } from './config';
import { Bins, deckSlabs, place, railLine, signAt, solid } from './deckKit';
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

  // ---- Deck: 0.3 m boxes, top 22 cm proud of the (flat) ground, bottom below it; two wood tones every 1.2 m ----------
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
  const huts: [number, number][] = [[-300, 1158], [-268, 1160], [-236, 1158], [-204, 1160]];
  const hutTints = [0x4fa3d9, 0xf2a93b, 0xe8453c, 0x6bbf59];
  huts.forEach(([x, z], i) => solid(boxes, place(scene, 'beach-hut', x, z, 0, 2.2, 0, hutTints[i])));
  for (const [x, z] of [[-110, 1166], [-70, 1172], [-15, 1160], [75, 1176], [190, 1168]] as const) place(scene, 'beach-umbrella', x, z, 0.3, 2);
  for (const [x, z] of [[-107, 1169], [-67, 1175], [-12, 1163], [78, 1179], [193, 1171]] as const) place(scene, 'deck-chair', x, z, 3.3, 2);
  solid(boxes, place(scene, 'lifeguard-chair', 60, 1170, 0, 2.2));
  for (const [x, z] of [[-200, 1180], [-40, 1168], [100, 1160], [225, 1165]] as const) {
    place(scene, 'sandcastle', x, z, 0.2, 2);
    place(scene, 'bucket-and-spade', x + 3, z + 1.5, 1.1, 2);
  }

  bins.flush(scene);
}
