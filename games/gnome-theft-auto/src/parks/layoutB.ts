// Park layouts B (docs/roadmaps/gta-parks-and-fringe.md, issue 1I): Mallard Mere, Clayfoot Rose Garden, Pure-Loam
// Allotments. Every position is block-local (u along +x, v along +z from the block centre); see kit.ts.
import type { ParkCtx } from './kit';
import { bench, dressAt, floorPatch, gnome, lamp, localRect, noticeboard, patch, perimeter, pond, put, tree, wishSpot } from './kit';
import type { Rect } from '../cityScenery/site';

/** Yaw that faces block-local (pu, pv) from (u, v) (0 faces +v). */
const faceYaw = (u: number, v: number, pu: number, pv: number): number => Math.atan2(pu - u, pv - v);

/** Block-local point at radius r and angle a round (cu, cv); a = 0 is +v, a grows towards +u. */
const polar = (cu: number, cv: number, r: number, a: number): { u: number; v: number } =>
  ({ u: cu + r * Math.sin(a), v: cv + r * Math.cos(a) });

// ---- Mallard Mere ----------------------------------------------------------------------------------------------------

const MERE = { u: -2, v: -2 };
const MERE_POND_R = 8;
const LOOP_R = 12.5;
const LOOP_W = 2;
const LOOP_SEGS = 28;

/** Facing along the loop at angle a (direction of increasing a). */
const loopYaw = (a: number): number => Math.atan2(Math.cos(a), -Math.sin(a));

/**
 * Claims the dog-walk loop's ring area as four strips round the pond's claimed square (not the whole bounding square,
 * which the pond already covers). Returns false (nothing claimed) when any strip is taken.
 */
function claimLoopArea(c: ParkCtx): boolean {
  const { u: pu, v: pv } = MERE;
  const R = LOOP_R + LOOP_W / 2; // outer edge of the ring's bounding square
  const I = MERE_POND_R + 0.1;         // inner edge, a little off the pond so the strips never touch it
  const strips: Rect[] = [
    localRect(c, pu - R, pv + I, pu + R, pv + R),
    localRect(c, pu - R, pv - R, pu + R, pv - I),
    localRect(c, pu - R, pv - I + 0.1, pu - I, pv + I - 0.1),
    localRect(c, pu + I, pv - I + 0.1, pu + R, pv + I - 0.1),
  ];
  if (!strips.every((r) => c.site.patchFree(r))) return false;
  for (const r of strips) c.site.claimPatch(r);
  return true;
}

export function layoutMallardMere(c: ParkCtx): void {
  const { u: pu, v: pv } = MERE;

  // 1. Townsgnomes: two dog walkers on the loop, a duck feeder by the water.
  const walkerA = polar(pu, pv, LOOP_R, 1.2);
  gnome(c, 0, walkerA.u, walkerA.v, loopYaw(1.2), 'Dunstan Puddleby', 'look-around',
    'Walkies on the loop. Mind the lead, mind the ducks.');
  const walkerB = polar(pu, pv, LOOP_R, 4.0);
  gnome(c, 1, walkerB.u, walkerB.v, loopYaw(4.0), 'Hettie Mallow', 'tap-foot',
    'The dog is fine. The dog does not agree.');
  // The feeder stands at radius 10, inside the square pond() claims (its corner, outside the water). gnome() would refuse
  // that spot, so the feeder is added here without the claim; nothing else is placed on that spot (lamps are at 10.2 on
  // other angles).
  const feeder = polar(pu, pv, 10, 2.4);
  const feederAt = c.at(feeder.u, feeder.v);
  c.plan.gnomes.push({
    id: `park-${c.park.id}-2`, name: 'Marjory Reedwell', x: feederAt.x, z: feederAt.z,
    yaw: faceYaw(feeder.u, feeder.v, pu, pv), look: {}, bubble: 'Bread is for ducks, not for the Hat Watch.', idle: 'feed-birds',
  });

  // 2. Hedge fence, then the pond (4 ducks).
  perimeter(c, 'hedgerow', 6);
  pond(c, pu, pv, MERE_POND_R, 4);

  // 3. Reeds round the water and a duck house on it.
  for (const a of [0.3, 1.5, 2.6, 3.9, 5.2]) {
    const p = polar(pu, pv, 7.2, a);
    dressAt(c, 'reed-bed', p.u, p.v, { yaw: a });
  }
  dressAt(c, 'duck-house', 0.5, -3.5, { yaw: 0.6 });

  // 4. The dog-walk loop: a gravel ribbon round the pond. Claimed only as strips outside the pond (the bounding square
  // overlaps the pond's claim), and skipped when a strip is taken. Its walk points are every 4th loop point.
  const centre = c.at(pu, pv);
  if (claimLoopArea(c)) {
    const points: [number, number][] = [];
    for (let k = 0; k <= LOOP_SEGS; k++) {
      const p = polar(pu, pv, LOOP_R, (k * 2 * Math.PI) / LOOP_SEGS);
      const w = c.at(p.u, p.v);
      points.push([w.x, w.z]);
    }
    c.plan.patches.push({ kind: 'gravel', shape: 'ribbon', x: centre.x, z: centre.z, w: LOOP_W, d: LOOP_W, yaw: 0, points });
    for (let k = 0; k < LOOP_SEGS; k += 4) c.plan.walk.push({ x: points[k][0], z: points[k][1] });
  }

  // 5. Benches facing the pond, outside the loop.
  for (const a of [0.8, 2.4, 3.9, 5.5]) {
    const p = polar(pu, pv, 15.2, a);
    bench(c, p.u, p.v, faceYaw(p.u, p.v, pu, pv));
  }

  // 6. Lamps between the pond and the loop.
  for (const a of [0.2, 1.8, 3.4, 5.0]) {
    const p = polar(pu, pv, 10.2, a);
    lamp(c, p.u, p.v);
  }

  // 7. Trees in the corners and on the middles of two sides.
  for (const [u, v] of [[-16.5, -16.5], [16.5, -16.5], [-16.5, 16.5], [16.5, 16.5], [17, 0], [0, 17.5]] as const) {
    tree(c, u, v, 'broadleaf-tree', 7 + 2 * c.rnd());
  }

  // 8. Wildflowers (no collider) and the noticeboard.
  for (const [u, v] of [[-17, 8], [12, 17], [17, -9]] as const) put(c, 'wildflower-patch', u, v);
  noticeboard(c, 4.5, -17.5, 0);
}

// ---- Clayfoot Rose Garden --------------------------------------------------------------------------------------------

const MAZE = { cols: 7, rows: 4, u0: -14, v0: -18, cell: 4 };

/** A perfect maze over MAZE (recursive backtracker on c.rnd()). openE[i][j]: the wall between cells (i, j) and (i+1, j)
 *  is gone; openS[i][j]: the wall between (i, j) and (i, j+1) is gone. */
function carveMaze(rnd: () => number): { openE: boolean[][]; openS: boolean[][] } {
  const { cols, rows } = MAZE;
  const seen = Array.from({ length: cols }, () => Array<boolean>(rows).fill(false));
  const openE = Array.from({ length: cols }, () => Array<boolean>(rows).fill(false));
  const openS = Array.from({ length: cols }, () => Array<boolean>(rows).fill(false));
  const stack: [number, number][] = [[3, 3]];
  seen[3][3] = true;
  while (stack.length > 0) {
    const [i, j] = stack[stack.length - 1];
    const next: [number, number, 'e' | 'w' | 'n' | 's'][] = [];
    if (i + 1 < cols && !seen[i + 1][j]) next.push([i + 1, j, 'e']);
    if (i - 1 >= 0 && !seen[i - 1][j]) next.push([i - 1, j, 'w']);
    if (j + 1 < rows && !seen[i][j + 1]) next.push([i, j + 1, 's']);
    if (j - 1 >= 0 && !seen[i][j - 1]) next.push([i, j - 1, 'n']);
    if (next.length === 0) {
      stack.pop();
      continue;
    }
    const [ni, nj, dir] = next[Math.floor(rnd() * next.length)];
    if (dir === 'e') openE[i][j] = true;
    else if (dir === 'w') openE[i - 1][j] = true;
    else if (dir === 's') openS[i][j] = true;
    else openS[i][j - 1] = true;
    seen[ni][nj] = true;
    stack.push([ni, nj]);
  }
  return { openE, openS };
}

export function layoutClayfootRose(c: ParkCtx): void {
  const { cols, rows, u0, v0, cell } = MAZE;

  // 1. Townsgnomes: the head gardener, a visitor, and the lost gnome in the maze centre (which decides the statue cell).
  gnome(c, 0, 10, 4.5, Math.PI, 'Rosa Thornbury', 'water',
    'Deadheading is a form of prayer. I am very devout.');
  gnome(c, 1, -9.5, 14, 0, 'Ivy Dunnock', 'photo-snap',
    'The roses are better than the Yard\'s. Do not tell the Yard.');
  const lost = gnome(c, 2, 0, -11, 0, 'Barnaby Hedgewick', 'think',
    'Left at the boxwood. Or was it right?');

  // 2. Railings round the garden.
  perimeter(c, 'civic-railing', 6);

  // 3. The hedge maze: horizontal walls (between rows) then vertical walls (between columns). The entrance is the gap in
  // the south wall at column 3, the exit the gap in the north wall at column 3.
  const { openE, openS } = carveMaze(c.rnd);
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j <= rows; j++) {
      if (j === 0 || j === rows) {
        if (i === 3) continue; // the exit (north, j = 0) and the entrance (south, j = rows)
      } else if (openS[i][j - 1]) {
        continue;
      }
      put(c, 'hedgerow', u0 + cell * i + cell / 2, v0 + cell * j, { yaw: 0, solid: true, pad: -0.6 });
    }
  }
  for (let i = 0; i <= cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (i === 0 || i === cols || !openE[i - 1][j]) {
        put(c, 'hedgerow', u0 + cell * i, v0 + cell * j + cell / 2, { yaw: Math.PI / 2, solid: true, pad: -0.6 });
      }
    }
  }
  // The statue sits in the centre of cell (3, 1), or (3, 2) when the lost gnome stands there.
  const statueRow = lost ? 2 : 1;
  put(c, 'gnome-statue', u0 + cell * 3 + cell / 2, v0 + cell * statueRow + cell / 2, { height: 1.6, solid: true });

  // 4. The wishing fountain, and its wish spot 4.3 m in front.
  put(c, 'stone-fountain', 0, 10, { scale: 2.4, solid: true });
  wishSpot(c, 0, 10, 4.3);

  // 5. Gravel paths: the two north-south paths and the two east-west paths.
  patch(c, -1.5, 0, 1.5, 6.4, 'gravel');
  patch(c, -1.5, 13.6, 1.5, 19, 'gravel');
  patch(c, -19, 8.5, -3.6, 11.5, 'gravel');
  patch(c, 3.6, 8.5, 19, 11.5, 'gravel');

  // 6. Rose arches over the paths (no collider).
  dressAt(c, 'rose-arch', 0, 3.5, { yaw: 0 });
  dressAt(c, 'rose-arch', 0, 16.5, { yaw: 0 });
  dressAt(c, 'rose-arch', -11, 10, { yaw: Math.PI / 2 });
  dressAt(c, 'rose-arch', 11, 10, { yaw: Math.PI / 2 });

  // 7. The Clayfoot Twins, facing the fountain.
  put(c, 'gnome-statue', -4.5, 6.2, { height: 2.2, solid: true, yaw: faceYaw(-4.5, 6.2, 0, 10) });
  put(c, 'gnome-statue', 4.5, 6.2, { height: 2.2, solid: true, yaw: faceYaw(4.5, 6.2, 0, 10) });

  // 8. Benches facing the fountain, and lamps.
  bench(c, -5.5, 14.5, faceYaw(-5.5, 14.5, 0, 10));
  bench(c, 5.5, 14.5, faceYaw(5.5, 14.5, 0, 10));
  for (const [u, v] of [[-3, 2.5], [3, 2.5], [-3, 17.5], [3, 17.5]] as const) lamp(c, u, v);

  // 9. Rose beds in the quadrants between the paths. Rows get colours in turn; every 4th bush is yellow.
  const roseRows = [1.5, 3.5, 5.5, 14, 16, 18];
  const roseColours = [0xd93636, 0xf07ab0, 0xf4f1de];
  let bush = 0;
  roseRows.forEach((v, row) => {
    for (const sign of [-1, 1]) {
      for (let k = 0; k < 6; k++) {
        const u = sign * (4.5 + 2.2 * k);
        const tint = bush % 4 === 3 ? 0xf2c94c : roseColours[row % 3];
        put(c, 'rose-bush', u, v, { cls: 'detail', tint });
        bush++;
      }
    }
  });

  // 10. The noticeboard.
  noticeboard(c, 4.5, 18.3, Math.PI);
}

// ---- Pure-Loam Allotments --------------------------------------------------------------------------------------------

export function layoutPureLoam(c: ParkCtx): void {
  // 1. Townsgnomes at work, and the stallholder.
  gnome(c, 0, -11.5, -13, 0, 'Sorrel Hoeworth', 'rake', 'Rakes are the only tools the Co-op lets us keep.');
  gnome(c, 1, -1.5, 3, 0, 'Juniper Barrowfield', 'dig', 'The worms are the Co-op\'s. The carrots are mine.');
  gnome(c, 2, 3.5, -9, 0, 'Bramble Wattlesby', 'water', 'Rain is free. Acorns are not.');
  gnome(c, 3, 16.6, 14.5, -Math.PI / 2, 'Parsnip Mudge', 'vendor-call',
    'No chemicals, no engines, just dirt. Two Acorns a cabbage.');

  // 2. Wattle fence round the allotments, and the dirt floor everything stands on.
  perimeter(c, 'wattle-fence', 4);
  floorPatch(c, -17.5, -17.5, 10.5, 17.5, 'dirt');

  // 3. Raised beds in a grid, with a cold frame and water butt on every fifth cell.
  const us = [-14, -9, -4, 1, 6];
  const vs = [-15, -11, -7, -3, 1, 5, 9, 13];
  us.forEach((u, iu) => {
    vs.forEach((v, iv) => {
      put(c, 'allotment-bed', u, v, { cls: 'detail', yaw: 0 });
      if ((iu + iv) % 5 === 0) {
        put(c, 'cold-frame', u, v + 1.9);
        put(c, 'water-butt', u + 2.1, v + 1.9);
      }
    });
  });

  // 4. Sheds, compost, bee skeps and a scarecrow on the east side.
  put(c, 'garden-shed', 14.5, -14, { scale: 2.5, yaw: -Math.PI / 2, solid: true });
  put(c, 'garden-shed', 14.5, -7, { scale: 2.5, yaw: -Math.PI / 2, solid: true });
  put(c, 'compost-bin', 15, 0.5, { scale: 4, solid: true });
  for (const u of [13, 15.2, 17.4]) put(c, 'bee-skep', u, 6, { scale: 1.4, solid: true });
  put(c, 'scarecrow', 3.5, 3, { height: 2.5 });

  // 5. The produce stall row.
  for (const v of [11, 14.5, 18]) put(c, 'market-stall', 14.5, v, { scale: 1.6, yaw: -Math.PI / 2, solid: true });

  // 6. Lamps, the noticeboard and two trees.
  lamp(c, 12, -2);
  lamp(c, 12, 17);
  noticeboard(c, -4, -18.6, 0);
  tree(c, 17.5, -18, 'broadleaf-tree', 6);
  tree(c, -18, 18, 'broadleaf-tree', 6);
}
