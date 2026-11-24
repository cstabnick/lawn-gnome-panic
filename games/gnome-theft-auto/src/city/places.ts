// Place names for any map point, as gnomes say them (lore R-147): a Turfton district, "the Ring Blocks" for the rest of
// the grid, else the region. Pure: the journal and the Kerbside Exchange board label every job with it.
import { CITY_HALF } from '../config';
import { DISTRICT_NAMES, districtAt } from '../districts';
import { regionAt } from '../levels';

/** Region display names. A region missing here (a new one) shows its id, title-cased. */
const REGION_NAMES: Readonly<Record<string, string>> = {
  turfton: 'Turfton',
  'dust-flats': 'The Dust Flats',
  'mossy-wood': 'Mossy Wood',
  'frostbite-fells': 'Frostbite Fells',
  'cloverfield-farms': 'Cloverfield Farms',
  'loch-moss': 'Loch Moss',
  'tallgrass-commons': 'Tallgrass Commons',
};

function titleCase(id: string): string {
  return id.split('-').map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');
}

/** True inside Turfton's street grid. */
export function inTurfton(x: number, z: number): boolean {
  return Math.abs(x) <= CITY_HALF && Math.abs(z) <= CITY_HALF;
}

/** "Old Brick Quarter", "Ring Blocks", "The Dust Flats"... for a world point. */
export function placeName(x: number, z: number): string {
  const d = districtAt(x, z);
  if (d) return DISTRICT_NAMES[d];
  if (inTurfton(x, z)) return 'Ring Blocks';
  const r: string = regionAt(x, z);
  return REGION_NAMES[r] ?? titleCase(r);
}
