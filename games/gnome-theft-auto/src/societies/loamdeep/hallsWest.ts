// Loamdeep's west halls (E17 issue B9): the Mother's Hall, Rootway Hall and Postern Hall, the entry tunnel and the
// west galleries. Local coordinates (origin at the room centre). Spots and lamps are never built on: the one exception
// is Old Mother Tumblesoil's chair, which is the tumblesoil spot itself.
import * as THREE from 'three';
import { getPrefab } from '@lawn/prefabs';
import type { InteriorKit, PutOpts } from '../../interiors/types';
import { LOAMDEEP } from '../config';

const N = Math.PI, E = Math.PI / 2, W = -Math.PI / 2;

type Obj = THREE.Object3D;

export function buildHallsWest(kit: InteriorKit): void {
  const place = (id: string, x: number, z: number, yaw = 0, opts?: PutOpts): Obj | null =>
    getPrefab(id) ? kit.put(id, x, z, yaw, opts) : null;
  const topOf = (o: Obj | null): number => {
    if (!o) return 0;
    return new THREE.Box3().setFromObject(o).max.y;
  };
  const arch = (x: number, z: number, yaw: number): void => {
    place('root-arch', x, z, yaw, { solid: false });
  };

  // ---- Tunnel mouths (root arches, turned to span their tunnel) -------------------------------------------------
  arch(0, 26, 0);        // entry -> the Mother's Hall
  arch(-30, 18, E);      // westGallery, Rootway end
  arch(-12, 18, E);      // westGallery, Mother's end
  arch(-40, 12, 0);      // westRise, Rootway end
  arch(-40, -22, 0);     // westRise, Postern end
  arch(-30, -30, E);     // northWest, Postern end

  // ---- The Mother's Hall (x -12..12, z 6..26) -------------------------------------------------------------------
  place('mother-chair', LOAMDEEP.spots.tumblesoil[0], LOAMDEEP.spots.tumblesoil[1], 0);
  place('moss-rug', 0, 19, 0, { solid: false });
  const table = place('mole-table-round', -6, 12, 0, { tint: 0xb9b5ad }); // patient dust on the table
  const tableTop = topOf(table);
  place('mole-stool', -7.6, 12, E);
  place('mole-stool', -4.4, 12, W);
  place('grub-bread', -6, 12, 0, { solid: false, y: tableTop });
  // Vignette 1: a gnome-sized chair at the table, laid for a visit that has not come.
  place('chair', -6, 9.2, 0);
  place('reed-tea-cup', -6.5, 11.6, 0, { solid: false, y: tableTop, tint: 0x9d9a95 });
  place('serving-tray', -5.4, 12.4, 0, { solid: false, y: tableTop, tint: 0xb9b5ad });
  kit.sign('FOR WHEN THE GNOMES VISIT', -6, tableTop + 0.12, 12.9, 0, { w: 0.5, h: 0.22 });
  place('mole-bunk-nook', 10, 9, W);
  place('mole-bunk-nook', -10, 9, E);
  place('mole-lamp-lit', -8, 6.4, 0, { solid: false, y: 1.5 });
  place('mole-lamp-lit', 8, 6.4, 0, { solid: false, y: 1.5 });
  place('mole-lamp-lit', -8, 25.6, N, { solid: false, y: 1.5 });
  place('mole-lamp-lit', 8, 25.6, N, { solid: false, y: 1.5 });
  kit.sign('OUR MOTHER\n(she asked for no portrait)', -4, 1.9, 6.03, 0, { w: 1.6, h: 0.5 });
  kit.sign('WE DIG WHERE WE ARE ASKED', 6, 1.9, 25.97, N, { w: 1.8, h: 0.4 });

  // ---- Rootway Hall (x -50..-30, z 12..28) ---------------------------------------------------------------------
  const crates: [number, number][] = [[-48.5, 26.5], [-46, 26.5], [-43.5, 26.5], [-35.5, 26.5], [-33, 26.5], [-48.5, 20], [-48.5, 17.5]];
  const crateTop: number[] = crates.map(([x, z]) => topOf(place('root-crate', x, z, 0)));
  // Stacked bundles on three of the crates, and a loose bundle on the floor.
  place('root-bundle', -46, 26.5, 0, { solid: false, y: crateTop[1] });
  place('root-bundle', -35.5, 26.5, 0, { solid: false, y: crateTop[3] });
  place('root-bundle', -48.5, 20, 0, { solid: false, y: crateTop[5] });
  place('root-bundle', -37, 20, 0, { solid: false });
  kit.sign('ROOTS: SORTED BY SMELL\nAsk Old Tamp, do not sniff yourself', -46, 1.8, 12.03, 0, { w: 2.6, h: 0.8 });
  kit.sign('LOANED, NOT EATEN (we eat grubs)', -29.97, 1.8, 24, W, { w: 2.4, h: 0.5 });
  // Vignette 3: a gnome's lost spade, cleaned and hung on the north wall.
  place('ranch-spade', -34, 12.3, 0, { solid: false, y: 1.3 });
  kit.sign('FOUND IN OUR CEILING.\nRETURN TO OWNER, GENTLY.', -34, 0.85, 12.03, 0, { w: 1.6, h: 0.5 });

  // ---- Postern Hall (x -50..-30, z -38..-22) -------------------------------------------------------------------
  // The pigeonholes sit south-west of the sorting desk (LOAMDEEP.spots.sortingDesk), not on it. 2.0 m, not 1.6 m: the
  // unit's own box is 1.8 m wide, and at 1.6 m its collider comes within 1.0 m of the desk.
  const desk = LOAMDEEP.spots.sortingDesk;
  const pigeon = place('post-pigeonholes', desk[0] - 2 * Math.SQRT1_2, desk[1] + 2 * Math.SQRT1_2, 0);
  if (pigeon) {
    const pb = new THREE.Box3().setFromObject(pigeon);
    const cx = (pb.min.x + pb.max.x) / 2;
    // Vignette 2: one whole pigeonhole stuffed with letters addressed upward.
    kit.sign('TO: THE SURFACE', cx, 1.2, pb.max.z + 0.03, 0, { w: 0.8, h: 0.3 });
  }
  place('post-sack', -45, -26, 0);
  place('post-sack', -44, -24.2, 0);
  place('post-sack', -46.2, -29.5, 0);
  const counter = place('mole-table-round', -36, -35, 0);
  const counterTop = topOf(counter);
  place('sealed-letter', -36.3, -35.2, 0, { solid: false, y: counterTop });
  // Vignette 2 (cont.): a returned letter, stamped.
  kit.sign('NO SUCH BURROW', -35.4, counterTop + 0.2, -35.2, 0, { w: 0.6, h: 0.25 });
  kit.sign('POSTERN HALL\nAll post sorted by Mister Sift (eventually)', -44, 1.8, -37.95, 0, { w: 2.6, h: 0.9 });
  kit.sign('LETTERS TO THE SURFACE: 0 answered, 412 sent', -29.95, 1.8, -25, W, { w: 2.4, h: 0.6 });

  // ---- The entry tunnel (x -2..2, z 26..45) --------------------------------------------------------------------
  kit.sign('LOAMDEEP', 0, 3.2, 26.03, 0, { w: 1.6, h: 0.4 });
  kit.sign('PLEASE MIND THE CEILING (it minds you)', -1.97, 1.8, 36, E, { w: 2.2, h: 0.5 });
  place('moss-rug', 0, 42.5, 0, { solid: false }); // boot scraper at the door end

  // ---- The west galleries -------------------------------------------------------------------------------------
  place('mole-lamp-lit', -24, 16.3, 0, { solid: false, y: 1.5 });
  place('mole-lamp-lit', -16, 19.7, N, { solid: false, y: 1.5 });
  place('root-bundle', -22, 19.2, 0, { solid: false });
  place('mole-lamp-lit', -24, -31.7, 0, { solid: false, y: 1.5 });
  place('mole-lamp-lit', -18, -28.3, N, { solid: false, y: 1.5 });
}
