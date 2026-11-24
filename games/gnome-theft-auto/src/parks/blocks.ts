// Turfton's park blocks (docs/roadmaps/gta-parks-and-fringe.md, lore: docs/lore/entries/apocrypha/turfton-parks.md).
// Pure data, no three.js: world.ts reads it to leave these blocks out of the garden layout, src/parks/ lays them out.
// Gnorwin Clayfoot Park (-30, 30) is not here: world.ts builds its fountain and tables already (PARK_CENTRE) and the
// parks module only adds to it.

export type ParkId = 'gnorwin' | 'bandstand-green' | 'kilnside-rec' | 'mallard-mere' | 'clayfoot-rose' | 'pure-loam';

export interface ParkDef {
  id: ParkId;
  /** Shown on the map and the park's noticeboard. */
  name: string;
  /** Block centre (a city block between two grid roads; the block is 60 x 60 between road centre lines). */
  x: number;
  z: number;
}

export const PARKS: readonly ParkDef[] = [
  { id: 'gnorwin', name: 'Gnorwin Clayfoot Park', x: -30, z: 30 },
  { id: 'bandstand-green', name: 'Bandstand Green', x: -30, z: -150 },
  { id: 'kilnside-rec', name: 'Kilnside Rec', x: -150, z: -30 },
  { id: 'mallard-mere', name: 'Mallard Mere', x: -30, z: 150 },
  { id: 'clayfoot-rose', name: 'Clayfoot Rose Garden', x: 150, z: 30 },
  { id: 'pure-loam', name: 'Pure-Loam Allotments', x: 150, z: 90 },
];

/** True when the city block centred at (cx, cz) is one of the five newer parks (no garden layout there). */
export function isParkBlock(cx: number, cz: number): boolean {
  return PARKS.some((p) => p.id !== 'gnorwin' && p.x === cx && p.z === cz);
}
