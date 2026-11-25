// Loamdeep's east and north halls (E17 issue B10): Lamplight Hall, Hearth Hall and Under-Chorus Hall, the east
// galleries and the tunnel mouths. Local coordinates (origin at the room centre). Every id is guarded with getPrefab
// (E17 prefabs land in parallel), so a missing one is skipped.
import * as THREE from 'three';
import { getPrefab } from '@lawn/prefabs';
import { LAYER, flatLayer } from '@lawn/depth';
import type { InteriorKit, PutOpts } from '../../interiors/types';
import { LOAMDEEP } from '../config';

const N = Math.PI;
const E = Math.PI / 2;
const W = -Math.PI / 2;

/** kit.put, unless the prefab id is not in the library yet. */
function put(kit: InteriorKit, id: string, x: number, z: number, yaw = 0, opts?: PutOpts): void {
  if (!getPrefab(id)) return;
  kit.put(id, x, z, yaw, opts);
}

export function buildHallsEast(kit: InteriorKit): void {
  const { spots } = LOAMDEEP;

  // ---- Tunnel mouths (root arches, not solid: they frame the opening) ----------------------------------------------
  put(kit, 'root-arch', 12, 18, E, { solid: false }); // eastGallery, west end (Mother's Hall side)
  put(kit, 'root-arch', 30, 18, E, { solid: false }); // eastGallery, Lamplight end
  put(kit, 'root-arch', 40, 12, 0, { solid: false }); // eastRise, Lamplight end
  put(kit, 'root-arch', 40, -22, 0, { solid: false }); // eastRise, Hearth end
  put(kit, 'root-arch', 30, -30, E, { solid: false }); // northEast, Hearth end
  put(kit, 'root-arch', 14, -30, E, { solid: false }); // northEast, Under-Chorus end
  put(kit, 'root-arch', 0, -18, 0, { solid: false }); // mothersNorth, Under-Chorus end

  // ---- Lamplight Hall (x 30..50, z 12..28) --------------------------------------------------------------------------
  // Oil barrels in the south-west corner, clear of the walking line from the gallery mouth to the rise.
  put(kit, 'lamp-oil-barrel', 32, 23);
  put(kit, 'lamp-oil-barrel', 33.6, 24);
  put(kit, 'lamp-oil-barrel', 32, 25.2);
  // The spare lamps on a table in the north-east corner.
  put(kit, 'mole-table-round', 45, 14);
  for (const x of [44.4, 45, 45.6]) put(kit, 'mole-lamp', x, 14, 0, { y: 0.45, solid: false });
  // Tapers in a pot, well away from the taper spot.
  put(kit, 'pot', 44.4, 21);
  put(kit, 'lamp-taper', 44.2, 21, 0, { y: 0.6, solid: false });
  put(kit, 'lamp-taper', 44.6, 21, 0.3, { y: 0.6, solid: false });
  // The lamp-keeper's chart, and one lamp knocked crooked beside a tiny ladder.
  kit.sign('LAMPLIGHT HALL\nKeepers of the Lamps\nMistress Delve presiding', 49.6, 1.9, 16, W, { w: 2.2, h: 1.0 });
  kit.sign('A LAMP LIT IS A PROMISE KEPT.\nA LAMP UNLIT IS A NOTE TO SELF.', 40, 1.9, 27.6, N, { w: 2.6, h: 0.7 });
  kit.sign('LAMPS LIT THIS WEEK\n|||| |||| ||', 34, 1.5, 27.6, N, { w: 1.2, h: 0.7 });
  put(kit, 'mole-lamp', 46.4, 26.6, 0.6);
  put(kit, 'ladder', 48.2, 26.4, 0.2, { size: 0.9, by: 'h' });

  // ---- Hearth Hall (x 30..50, z -38..-22) ----------------------------------------------------------------------------
  put(kit, 'grub-oven', 48.4, -28, W);
  kit.sign('GRUBS, NOT ROOTS\nSUPPER AT THE THIRD BELL.\nALL WELCOME. EVEN GNOMES.', 49.6, 2.3, -28, W, { w: 2.2, h: 0.9 });
  // Two tables, each with a stool either side. The second sits clear of the hearth root-drop spot (40, -26).
  const tables: [number, number][] = [[40, -33], [44, -26]];
  for (const [tx, tz] of tables) {
    put(kit, 'mole-table-round', tx, tz);
    put(kit, 'mole-stool', tx - 0.95, tz);
    put(kit, 'mole-stool', tx + 0.95, tz);
  }
  // The place set for DJ Moleman, kept warm under a cloche.
  put(kit, 'shell-plate', 40, -33.1, 0, { y: 0.45, size: 0.3 });
  put(kit, 'pot-lid-shield', 40, -33.1, 0, { y: 0.5, size: 0.35, solid: false });
  kit.sign('COUSIN (DJ)', 40, 0.62, -32.3, 0, { w: 0.5, h: 0.18 });
  put(kit, 'grub-bread', 43.8, -26.1, 0, { y: 0.45, solid: false });
  put(kit, 'grub-jar', 44.3, -25.8, 0, { y: 0.45, solid: false });
  put(kit, 'grub-jar', 40.2, -33.6, 0, { y: 0.45, solid: false });
  put(kit, 'grub-bread', 39.8, -32.9, 0, { y: 0.45, solid: false });
  // The three dig faces on the north wall, each with its sign above.
  for (const [x] of spots.digFaces) {
    put(kit, 'dig-face', x, -37.8, 0, { solid: false });
    kit.sign('DIG HERE, IF IT PLEASES YOU', x, 2.2, -37.5, 0, { w: 1.4, h: 0.3 });
  }

  // ---- Under-Chorus Hall (x -14..14, z -42..-18) ---------------------------------------------------------------------
  const [s0, s1] = spots.speakers;
  put(kit, 'dug-speaker', s0[0], s0[1], 0);
  put(kit, 'dug-speaker', s1[0], s1[1], 0);
  // A ring of moss rugs round the dance floor, leaving its centre clear.
  const [dfx, dfz] = spots.danceFloor;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    put(kit, 'moss-rug', dfx + 4.2 * Math.sin(a), dfz + 4.2 * Math.cos(a), a, { solid: false });
  }
  // The cable from the decks spot north into the wall: a thin dark run lying on the floor.
  kit.block(0.05, 0.02, 3, 0, -40.5, { y: 0.03, color: 0x1a1a1a, solid: false });
  kit.sign('UNDER-CHORUS HALL\nfeel the floor', 13.6, 1.6, -30, W, { w: 1.8, h: 0.8 });
  kit.sign('WELCOME HOME, COUSIN', -13.6, 1.2, -22, E, { w: 1.6, h: 0.45 });
  put(kit, 'rolled-scroll', -12.8, -19.3, 0, { solid: false });
  // Tiny dancing footprints worn into the floor, circling the music.
  const footMat = flatLayer(new THREE.MeshStandardMaterial({ color: 0x5a4030, roughness: 0.95 }), LAYER.decal);
  const footGeo = new THREE.PlaneGeometry(0.07, 0.11);
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5;
    const r = 2.2;
    const m = new THREE.Mesh(footGeo, footMat);
    m.rotation.order = 'YXZ';
    m.rotation.set(-Math.PI / 2, a + Math.PI / 2 + (i % 2 ? 0.25 : -0.25), 0);
    m.position.set(dfx + r * Math.cos(a), 0.03, dfz + r * Math.sin(a));
    m.castShadow = false;
    kit.group.add(m);
  }

  // ---- Galleries: lamps on the walls (not the lamp tunnels: the Lamplighter job owns those) ---------------------------
  // eastGallery z 16..20
  for (const x of [16, 24]) put(kit, 'mole-lamp-lit', x, 16.2, 0, { y: 1.6, solid: false });
  for (const x of [20, 28]) put(kit, 'mole-lamp-lit', x, 19.8, N, { y: 1.6, solid: false });
  // northEast z -32..-28
  for (const x of [18, 26]) put(kit, 'mole-lamp-lit', x, -31.8, 0, { y: 1.6, solid: false });
  for (const x of [22, 28]) put(kit, 'mole-lamp-lit', x, -28.2, N, { y: 1.6, solid: false });
}
