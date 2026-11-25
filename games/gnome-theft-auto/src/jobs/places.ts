// Sim jobs: named places a gig can go to (taxi and courier destinations, docks, landing pads, sky sights, drop zones).
// Pure data. Every coordinate is checked by places.test.ts (land places dry, water stops deep, pads flat and dry).
import { AIRFIELD, AMPHITHEATER, BASE, CLAY_MART, GNOMECINO, HOSPITAL, SIDE_VALVE, THORNE_TOWER } from '../config';

export type PlaceArea = 'city' | 'outskirts' | 'loch' | 'sea' | 'canal' | 'desert' | 'farm' | 'forest' | 'fells';

export interface Place {
  id: string;
  name: string;
  x: number;
  z: number;
  area: PlaceArea;
}

/** Taxi / courier / player-cab destinations on land (gen.ts snaps them to the nearest road node). */
export const LAND_PLACES: readonly Place[] = [
  { id: 'central-bus-stop', name: 'Central Bus Stop', x: -6.25, z: 14, area: 'city' },
  { id: 'glaze-clinic', name: 'Glaze Clinic Hospital', x: HOSPITAL.x, z: HOSPITAL.z, area: 'city' },
  { id: 'side-valve-salvage', name: 'Side-Valve Salvage', x: SIDE_VALVE.bay.x, z: SIDE_VALVE.bay.z, area: 'city' },
  { id: 'the-gnomecino', name: 'The Gnomecino', x: GNOMECINO.x, z: GNOMECINO.z, area: 'city' },
  { id: 'thorne-tower', name: 'Thorne Tower', x: THORNE_TOWER.x, z: THORNE_TOWER.z, area: 'city' },
  { id: 'clay-mart', name: 'Clay-Mart', x: CLAY_MART.x, z: CLAY_MART.z, area: 'city' },
  { id: 'turfton-amphitheater', name: 'Turfton Amphitheater', x: AMPHITHEATER.x, z: AMPHITHEATER.z, area: 'city' },
  { id: 'greenhouse-strip', name: 'Greenhouse Strip', x: 90, z: 0, area: 'city' },
  { id: 'patio-heights', name: 'Patio Heights', x: 165, z: -165, area: 'city' },
  { id: 'old-brick-quarter', name: 'Old Brick Quarter', x: -115, z: 85, area: 'city' },
  { id: 'turfton-park', name: 'Turfton Park', x: -70, z: -30, area: 'city' },
  { id: 'clay-mart-industrial', name: 'Clay-Mart Industrial', x: -165, z: 165, area: 'city' },
  { id: 'turfton-skyway-foot', name: 'Turfton Skyway foot', x: 300, z: -40, area: 'city' },
  { id: 'pebblewick-bus-stop', name: 'Pebblewick bus stop', x: 661, z: 48, area: 'outskirts' },
  { id: 'pebblewick-square', name: 'Pebblewick square', x: 674, z: 100, area: 'outskirts' },
  { id: 'fort-sandpit-gate', name: 'Fort Sandpit gate', x: BASE.gateX, z: BASE.gateZ, area: 'desert' },
  { id: 'desert-airfield-gate', name: 'Desert Airfield gate', x: AIRFIELD.x - 40, z: AIRFIELD.z, area: 'desert' },
  { id: 'loch-moss-dock-road', name: 'Loch Moss dock road', x: -722, z: -545, area: 'loch' },
  { id: 'reedwatch-hide', name: 'Reedwatch Hide', x: -630, z: -540, area: 'loch' },
];

/** Boat stops: open water off a dock or shore. */
export const WATER_STOPS: readonly Place[] = [
  { id: 'loch-dock', name: 'Loch Moss Dock', x: -705, z: -578, area: 'loch' },
  { id: 'mossbank', name: 'Mossbank Boathouse', x: -690, z: -588, area: 'loch' },
  { id: 'reedwatch-reeds', name: 'Reedwatch Reeds', x: -635.7, z: -573.7, area: 'loch' },
  { id: 'tessie-isle', name: "Tessie's Isle", x: -734, z: -700, area: 'loch' },
  { id: 'loch-north', name: 'North Loch', x: -690, z: -720, area: 'loch' },
  { id: 'puddle-marina-west', name: 'Puddle Marina West', x: 612, z: 798, area: 'sea' },
  { id: 'puddle-marina-east', name: 'Puddle Marina East', x: 652, z: 798, area: 'sea' },
  { id: 'puddle-bay', name: 'Puddle Bay', x: 630, z: 830, area: 'sea' },
  { id: 'long-spoon-pier', name: 'Long Spoon Pier', x: 318, z: 1245, area: 'sea' },
  { id: 'the-last-tube', name: 'The Last Tube', x: 150, z: 1232, area: 'sea' },
  { id: 'saltcut-mouth', name: 'The Saltcut', x: 745, z: 1230, area: 'sea' },
];

/** The Steamer loop on Loch Moss, in order (ids from WATER_STOPS). */
export const FERRY_LOOP: readonly string[] = ['loch-dock', 'reedwatch-reeds', 'loch-north', 'tessie-isle', 'mossbank'];

/** Landing pads for the copter and the balloon (flat, dry, open), the airfield apron first. */
export const AIR_PADS: readonly Place[] = [
  { id: 'airfield-apron', name: 'Airfield Apron', x: AIRFIELD.x + 25, z: AIRFIELD.z + 25, area: 'desert' },
  { id: 'fort-pad', name: 'Fort Sandpit Pad', x: BASE.padX, z: BASE.padZ, area: 'desert' },
  { id: 'mossbank-green', name: 'Mossbank Green', x: -705, z: -535, area: 'loch' },
  { id: 'pebblewick-field', name: 'Pebblewick Field', x: 745, z: 70, area: 'outskirts' },
  { id: 'turfton-park-lawn', name: 'Turfton Park Lawn', x: -70, z: -60, area: 'city' },
];

/** Landmarks a scenic flight passes over (sky gates). */
export const SKY_SIGHTS: readonly Place[] = [
  { id: 'sight-loch-moss', name: 'Loch Moss', x: -700, z: -680, area: 'loch' },
  { id: 'sight-thorne-tower', name: 'Thorne Tower', x: THORNE_TOWER.x, z: THORNE_TOWER.z, area: 'city' },
  { id: 'sight-turfton-skyway', name: 'Turfton Skyway', x: 316, z: -60, area: 'city' },
  { id: 'sight-pebblewick', name: 'Pebblewick', x: 655, z: 105, area: 'outskirts' },
  { id: 'sight-fort-sandpit', name: 'Fort Sandpit', x: (BASE.minX + BASE.maxX) / 2, z: (BASE.minZ + BASE.maxZ) / 2, area: 'desert' },
  { id: 'sight-birdbath-basin', name: 'Birdbath Basin', x: 0, z: -350, area: 'fells' },
];

/** Cargo drop zones (open ground). */
export const DROP_ZONES: readonly Place[] = [
  { id: 'dust-flats-x', name: 'Dust Flats X', x: 600, z: -150, area: 'desert' },
  { id: 'sandpit-scrub', name: 'Sandpit Scrub', x: 420, z: -250, area: 'desert' },
  { id: 'pebblewick-paddock', name: 'Pebblewick Paddock', x: 700, z: -60, area: 'outskirts' },
];

/** Street names for courier addresses ("12 Fern Row"). */
export const STREETS: readonly string[] = [
  'Fern Row', 'Trowel Lane', 'Pebble Walk', 'Snapdragon Close', 'Clover Crescent', 'Mulch Mews',
  'Thistle Terrace', 'Wheelbarrow Way', 'Bramble Brow', 'Daisychain Drive', 'Compost Court', 'Hollyhock Hill',
];

export function placeById(id: string): Place | undefined {
  return [...LAND_PLACES, ...WATER_STOPS, ...AIR_PADS, ...SKY_SIGHTS, ...DROP_ZONES].find((p) => p.id === id);
}
