// Park layouts A (docs/roadmaps/gta-parks-and-fringe.md, issue 1H): Gnorwin Clayfoot Park (additions round the
// existing fountain), Bandstand Green, Kilnside Rec. Block-local metres (kit.ts): u along +x, v along +z from the
// block centre. Every piece goes through the Site, so anything that does not fit is skipped.
import { heightAt } from '../terrain';
import type { MarkTile } from '../cityScenery/types';
import {
  bench, floorPatch, gnome, lamp, localRect, noticeboard, patch, perimeter, put, tree, wishSpot, type ParkCtx,
} from './kit';

/** Yaw that turns a piece at (u, v) to face the block-local point (pu, pv). */
function faceTo(u: number, v: number, pu: number, pv: number): number {
  return Math.atan2(pu - u, pv - v);
}

/** A flat painted mark, w along local x and h along local z, lying on the ground (no yaw). */
function paint(c: ParkCtx, tile: MarkTile, u: number, v: number, w: number, h: number): void {
  const p = c.at(u, v);
  c.plan.marks.push({ tile, x: p.x, y: heightAt(p.x, p.z) + 0.03, z: p.z, yaw: 0, w, h, upright: false });
}

export function layoutGnorwin(c: ParkCtx): void {
  gnome(c, 0, 3, -10.5, faceTo(3, -10.5, 0, -14), 'Wren Kettleby', 'feed-birds', 'The pigeons are on a waiting list for the fountain.');
  gnome(c, 1, -3, -10.5, faceTo(-3, -10.5, 0, -14), 'Hollis Trowelby', 'scratch-head', 'Third cone this week. Who keeps putting them back?');
  gnome(c, 2, -13, 0, faceTo(-13, 0, 0, 0), 'Dottie Pennyroyal', 'sit-ground', 'Sandwich cut in four, one for Gnorwin.');

  // Gnorwin's coned statue already stands just north of the fountain (easterEggs.ts CLAYFOOT_STATUE): no monument here.
  wishSpot(c, 0, 0, 5.2);
  for (const [u, v] of [[-6.5, -6.5], [6.5, -6.5], [-4.5, 13.5], [4.5, 13.5]]) bench(c, u, v, faceTo(u, v, 0, 0));
  for (const [u, v] of [[-4, -18], [4, -18], [-17, 4], [17, -4], [4, 17], [-4, 17]]) lamp(c, u, v);
  put(c, 'flower-bed', -3.5, -17, { yaw: 0 });
  put(c, 'flower-bed', 3.5, -17, { yaw: 0 });
  put(c, 'rose-bush', -2, -11, { tint: 0xd93636 });
  put(c, 'rose-bush', 2, -11, { tint: 0xd93636 });
  noticeboard(c, 12, 17.5, Math.PI);
}

export function layoutBandstandGreen(c: ParkCtx): void {
  gnome(c, 0, 2.6, 1.8, 0, 'Lark Strummel', 'busk-guitar', 'Three chords and a Turfton tune, one Acorn a song.');
  put(c, 'bandstand', 0, -4, { yaw: 0, solid: true });
  perimeter(c, 'hedgerow', 6);
  patch(c, -1.5, -19, 1.5, -9, 'gravel');
  patch(c, -1.5, 1.5, 1.5, 19, 'gravel');
  patch(c, -18.8, -2.8, -5, 0.2, 'gravel');
  patch(c, 5, -2.8, 18.8, 0.2, 'gravel');
  for (const [u, v] of [[-7, 6], [7, 6], [-4, 9.5], [4, 9.5]]) bench(c, u, v, faceTo(u, v, 0, -4));
  // Placed before the picnic tables (they would otherwise take their spots).
  gnome(c, 2, -11, 11, faceTo(-11, 11, 0, -4), 'Sorrel Pottage', 'sit-ground', 'The bandstand has been shut since the Hat Watch came back.');
  gnome(c, 3, -3.5, 12.5, faceTo(-3.5, 12.5, 0, -4), 'Fennel Washboard', 'feed-birds', 'The ducks get the crusts, the pigeons get the rest.');
  put(c, 'picnic-table', -14, 8, { scale: 1.6, solid: true });
  put(c, 'picnic-table', -14, 14, { scale: 1.6, solid: true });
  put(c, 'picnic-table', -8.5, 15, { scale: 1.6, solid: true });
  put(c, 'park-pavilion', 12, -13, { yaw: 0, solid: true });
  for (const [u, v] of [[-15, -15], [-10, -16], [-15, -10], [-9, -11], [-12, -7]]) tree(c, u, v, 'broadleaf-tree', 6 + 2 * c.rnd());
  // The stallholder is placed before the stalls.
  gnome(c, 1, 11.5, 13, Math.PI, 'Bramble Oddsock', 'vendor-call', 'Fresh marrowfat, half price before City Hall notices.');
  for (const u of [8, 11.5, 15]) put(c, 'market-stall', u, 15.5, { scale: 1.6, solid: true, yaw: Math.PI });
  lamp(c, 2.8, -11);
  lamp(c, -2.8, -11);
  lamp(c, 2.8, 4);
  lamp(c, -2.8, 4);
  noticeboard(c, 4.5, -17.5, 0);
  put(c, 'flower-bed', -8, -17.5, { yaw: 0 });
  put(c, 'flower-bed', 8, -17.5, { yaw: 0 });
  put(c, 'flower-bed', 17, 5, { yaw: Math.PI / 2 });
}

export function layoutKilnsideRec(c: ParkCtx): void {
  gnome(c, 0, -5, -9, Math.PI / 2, 'Jory Mallowtree', 'cheer', 'Goal! Ignore the Hat Watch, that was offside.');
  gnome(c, 1, 6.5, 9.5, 0, 'Rook Sleek', 'idle-swagger', 'That grind rail has been here since before the council.');
  gnome(c, 2, -10, 0.5, Math.PI, 'Ada Tumblewick', 'check-watch', 'Ten more minutes, then we are going home.');

  perimeter(c, 'civic-railing', 6);
  put(c, 'football-goal', -14.8, -9.5, { yaw: Math.PI / 2, solid: true });
  put(c, 'football-goal', 14.8, -9.5, { yaw: -Math.PI / 2, solid: true });

  // The pitch: claimed so nothing stands on it, painted with its lines (none of them overlap).
  c.site.claim(localRect(c, -15, -17.5, 15, -1.5));
  paint(c, 'line', 0, -17, 28, 0.12);
  paint(c, 'line', 0, -2, 28, 0.12);
  paint(c, 'line', -14, -9.5, 0.12, 14.88);
  paint(c, 'line', 14, -9.5, 0.12, 14.88);
  paint(c, 'line', 0, -14, 0.12, 5.88);
  paint(c, 'line', 0, -5, 0.12, 5.88);
  paint(c, 'line', 0, -11, 3, 0.12);
  paint(c, 'line', 0, -8, 3, 0.12);
  paint(c, 'line', -1.5, -9.5, 0.12, 2.88);
  paint(c, 'line', 1.5, -9.5, 0.12, 2.88);

  floorPatch(c, -18, 1, -3, 18, 'pavement');
  put(c, 'swing-set', -14, 5, { yaw: 0, solid: true });
  put(c, 'play-slide', -6, 9, { yaw: 0, solid: true });
  put(c, 'climbing-frame', -13, 13, { solid: true });
  put(c, 'see-saw', -6, 15.5, { yaw: Math.PI / 2 });

  floorPatch(c, 3, 1, 18, 18, 'pavement');
  put(c, 'skate-quarter-pipe', 10.5, 3, { yaw: 0, solid: true });
  put(c, 'skate-quarter-pipe', 10.5, 16, { yaw: Math.PI, solid: true });
  put(c, 'grind-rail', 14, 9.5, { yaw: 0, solid: 0.5 });
  put(c, 'sandwich-board', 4.5, 2, { yaw: 0 });
  paint(c, 'tag-a', 8, 9.5, 2.5, 1.6);
  paint(c, 'tag-c', 16, 13, 2.5, 1.6);

  bench(c, -8, 0, Math.PI);
  bench(c, 8, 0, Math.PI);
  lamp(c, 0, 0);
  lamp(c, -18, -0.5);
  lamp(c, 18, -0.5);

  noticeboard(c, 3.5, -18.3, 0);
  tree(c, -17.5, 17.5, 'city-round-tree', 5);
  tree(c, 17.5, 17.5, 'city-round-tree', 5);
}
