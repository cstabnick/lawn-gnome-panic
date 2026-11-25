// Park layouts C (E01 2B, source item L92): the two blocks joined to Gnorwin Clayfoot Park, together Founders' Green.
// Block-local metres (kit.ts). Each block keeps its reserved site rectangle empty (the basketball court, the skate park:
// epic E19); the layout only dresses the margins and opens the side that faces Gnorwin. Every piece goes through the
// Site, so anything that does not fit (the rectangle is reserved) is skipped.
import { bench, lamp, patch, perimeter, tree, type ParkCtx } from './kit';

/** West of Gnorwin (-90, 30): the court site (hw 20, hd 14) fills the middle, so the dressing runs along north and south. */
export function layoutGnorwinCourts(c: ParkCtx): void {
  // The east side faces Gnorwin: left open.
  perimeter(c, 'civic-railing', 6, ['e']);
  // Paving from Gnorwin's side along both margins.
  patch(c, 4, -18.2, 21, -16.2, 'gravel');
  patch(c, 4, 16.2, 21, 18.2, 'gravel');
  for (const u of [-12, -4, 4, 12]) {
    bench(c, u, -15, 0, false);
    bench(c, u, 15, Math.PI, false);
  }
  for (const [u, v] of [[-17, -18], [-6, -18.5], [8, 19], [17, 19], [-17, 18], [-6, 18.5]]) lamp(c, u, v);
  for (const [u, v] of [[-18, -17], [-9, -18], [9, -19], [-18, 17], [-9, 18], [14, 18.5]]) tree(c, u, v, 'broadleaf-tree', 6 + 2 * c.rnd());
}

/** South of Gnorwin (-30, 90): the skate-park site (hw 20, hd 20) is nearly the whole block, so only the rim is dressed. */
export function layoutGnorwinSkate(c: ParkCtx): void {
  // The north side faces Gnorwin: left open.
  perimeter(c, 'civic-railing', 6, ['n']);
  patch(c, -1.5, -21, 1.5, -18, 'gravel');
  for (const [u, v] of [[-20.6, -18], [20.6, -18], [-20.6, 18], [20.6, 18], [0, 20.6]]) lamp(c, u, v);
  for (const [u, v] of [[-20.6, 0], [20.6, 0], [-20.6, 10], [20.6, -10]]) tree(c, u, v, 'broadleaf-tree', 6 + 2 * c.rnd());
  for (const [u, v] of [[-10, -20.6], [10, -20.6]]) bench(c, u, v, 0, false);
}
