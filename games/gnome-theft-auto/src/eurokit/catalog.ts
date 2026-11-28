// The European kit (E29, docs/roadmaps/gta-batch-3/E29/contracts.md): every building's outer footprint, so streets can be
// packed (street.ts planStreetRow), plus the furniture and garden prefab ids by group. Data only.
//
// Building frame (prefab-local, life-size metres, 1 unit = one gnome height): front door faces +z; the body fills
// x in [-width/2, width/2] and z in [-depth/2, depth/2], height up to `height`. Nothing goes past +-width/2 on x (party
// walls), except a corner building's +x side, which may reach `sideApron` past +width/2. In front, awnings, steps,
// balconies and pavement tables may reach `apron` past +depth/2. Walls take the tint, roofs the trim.

export type EuroRole =
  /** Packs side by side in a terrace row. */
  | 'terrace'
  /** Ends a row: shopfront on +z and on +x (the street corner). */
  | 'corner'
  /** Stands on its own on a pavement or square (kiosk, booth). */
  | 'freestanding'
  /** A big building on its own plot (church, hall, opera). */
  | 'landmark';

export interface EuroBuilding {
  id: string;
  name: string;
  role: EuroRole;
  width: number;
  depth: number;
  height: number;
  /** How far front parts reach past +depth/2. */
  apron: number;
  /** Corner only: how far +x side parts reach past +width/2. */
  sideApron?: number;
}

export const EURO_BUILDINGS: readonly EuroBuilding[] = [
  { id: 'euro-townhouse-mansard', name: 'Mansard Townhouse', role: 'terrace', width: 4, depth: 6, height: 9.6, apron: 0.6 },
  { id: 'euro-townhouse-tall', name: 'Tall Townhouse', role: 'terrace', width: 3.4, depth: 6, height: 11.8, apron: 0.6 },
  { id: 'euro-half-timbered', name: 'Half-Timbered House', role: 'terrace', width: 5, depth: 6, height: 8.4, apron: 0.5 },
  { id: 'euro-corner-cafe', name: 'Corner Cafe', role: 'corner', width: 6, depth: 6, height: 7.6, apron: 2.6, sideApron: 1.6 },
  { id: 'euro-bakery', name: 'Bakery', role: 'terrace', width: 4.5, depth: 6, height: 7.2, apron: 1.4 },
  { id: 'euro-bistro', name: 'Bistro', role: 'terrace', width: 5, depth: 6, height: 7.4, apron: 2.2 },
  { id: 'euro-tabac-kiosk', name: 'Tabac Kiosk', role: 'freestanding', width: 2.4, depth: 2.4, height: 3.2, apron: 0.8 },
  { id: 'euro-post-booth', name: 'Post and Natter Booth', role: 'freestanding', width: 1.2, depth: 1.2, height: 2.8, apron: 0.1 },
  { id: 'euro-steeple-church', name: 'Steeple Church', role: 'landmark', width: 8, depth: 14, height: 22, apron: 1 },
  { id: 'euro-apartment-block', name: 'Balcony Apartments', role: 'terrace', width: 10, depth: 8, height: 14, apron: 1 },
  { id: 'euro-market-hall', name: 'Covered Market Hall', role: 'landmark', width: 12, depth: 10, height: 8, apron: 0.4 },
  { id: 'euro-canal-boathouse', name: 'Canal Boathouse', role: 'landmark', width: 6, depth: 8, height: 5.5, apron: 2.5 },
  { id: 'euro-opera-hall', name: 'Opera Hall', role: 'landmark', width: 16, depth: 14, height: 13, apron: 3 },
  { id: 'euro-shopfront-cheese', name: 'Cheese Shop', role: 'terrace', width: 3.6, depth: 6, height: 8.8, apron: 1.2 },
  { id: 'euro-shopfront-chemist', name: 'Chemist', role: 'terrace', width: 3.6, depth: 6, height: 8.8, apron: 1.2 },
  { id: 'euro-shopfront-antiques', name: 'Antiques Shop', role: 'terrace', width: 3.6, depth: 6, height: 8.8, apron: 1.2 },
];

/** Street furniture (gta-euro-street.ts, gta-euro-street-b.ts). Tiles are on a 2 m grid (slab 1.96 square, 0.08 thick). */
export const EURO_FURNITURE: readonly string[] = [
  'euro-cobble-tile', 'euro-paving-tile', 'euro-bollard', 'euro-lamp-post', 'euro-flower-trough', 'euro-iron-railing',
  'euro-fountain', 'euro-bike-rack', 'euro-cafe-chair', 'euro-cafe-table', 'euro-chalkboard-sign', 'euro-poster-board',
  'euro-street-sign',
];

/** European plants and backyard dressing (gta-euro-garden.ts, gta-euro-garden-b.ts). */
export const EURO_GARDEN: readonly string[] = [
  'euro-topiary-spiral', 'euro-topiary-lollipop', 'euro-box-hedge', 'euro-geranium-pot', 'euro-geranium-bed',
  'euro-espalier-pear', 'euro-plane-tree', 'euro-ivy-wall', 'euro-vine-pergola', 'euro-boules-court',
  'euro-washing-line', 'euro-bistro-set', 'euro-rose-arch', 'euro-water-butt',
];

/** Wall and roof paints the street composer deals out to terrace pieces (pastel render, slate, zinc, terracotta). */
export const EURO_WALL_TINTS: readonly number[] = [0xf1e3c6, 0xe8c9a8, 0xd9e2d3, 0xf3d6cf, 0xcfd8e3, 0xe6dcb8, 0xf5efe4];
export const EURO_ROOF_TINTS: readonly number[] = [0x5a6470, 0x7b8691, 0x9a5a3c, 0x4a4f57];

/** The building with this id, or undefined. */
export function euroBuilding(id: string): EuroBuilding | undefined {
  return EURO_BUILDINGS.find((b) => b.id === id);
}
