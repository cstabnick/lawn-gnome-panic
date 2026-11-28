// The fixed places of Gnome Theft Auto as minimap and big-map blips (drawn by mapIcons.ts): the hospital, Side-Valve
// Salvage, the Gnomecino, Clay-Mart, Thorne Tower, the Turfton Amphitheater and the airfield.
import { AIRFIELD, AMPHITHEATER, CLAY_MART, GNOMECINO, HOSPITAL, SIDE_VALVE, THORNE_TOWER } from './config';
import { PLACE_STYLE, type PlaceKind } from './mapIcons';
import { ESTATES, LOCKUP } from './lockup/config';
import { LODGE } from './hunting/species';
import { HIDE } from './birding/types';
import { SHOP } from './fishing/types';
import { footConnectors } from './highways/roads';
import { skywayDefs } from './highways/deck';
import { kindOf, SKYWAY_SITES } from './highways/skyways';
import { landmarkPlaces } from './towers';
import { TOWN } from './outskirts/town';
import { CAMPUS, OBSERVATORY, ROOTWELL_FIELD } from './campus/types';
import { BURROW_DOOR, UNDERSPAN, WADERS_REST } from './societies/config';
import { PARKS } from './parks/blocks';
import { EDGE_LABELS, EDGE_NAMES, type EdgeId } from './fringe/belt';
import type { Blip } from './types';

/** A ramp's compass point from its skyway's middle: west/east when the foot lies further along x, else north/south (-z). */
function compassOf(from: { x: number; z: number }, to: { x: number; z: number }): string {
  const dx = to.x - from.x, dz = to.z - from.z;
  if (Math.abs(dx) > Math.abs(dz)) return dx < 0 ? 'west' : 'east';
  return dz < 0 ? 'north' : 'south';
}

export function placeBlips(): Blip[] {
  const at = (kind: PlaceKind, x: number, z: number, label: string): Blip =>
    ({ x, z, color: PLACE_STYLE[kind].color, kind, label });
  const defs = skywayDefs();
  // Each road ramp foot, named by its skyway and the compass point it lies at from the skyway's middle.
  const ramps: Blip[] = footConnectors().map((c) => {
    const def = defs.find((d) => d.id === c.skyway)!;
    const first = def.points[0], last = def.points[def.points.length - 1];
    const mid = { x: (first.x + last.x) / 2, z: (first.z + last.z) / 2 };
    return at('onramp', c.foot.x, c.foot.z, `${def.name} ramp (${compassOf(mid, c.foot)})`);
  });
  const stunts: Blip[] = defs
    .filter((d) => kindOf(d) === 'stunt')
    .map((d) => at('onramp', d.points[0].x, d.points[0].z, 'The Unfinished Span'));
  return [
    at('hospital', HOSPITAL.x, HOSPITAL.z, 'Glaze Clinic Hospital'),
    at('exchange', -9, 45, 'Kerbside Exchange'),
    at('salvage', SIDE_VALVE.bay.x, SIDE_VALVE.bay.z, 'Side-Valve Salvage'),
    at('casino', GNOMECINO.x, GNOMECINO.z, 'The Gnomecino'),
    at('mart', CLAY_MART.x, CLAY_MART.z, 'Clay-Mart'),
    at('tower', THORNE_TOWER.x, THORNE_TOWER.z, 'Thorne Tower'),
    at('stage', AMPHITHEATER.x, AMPHITHEATER.z, 'Turfton Amphitheater'),
    at('airfield', AIRFIELD.x, AIRFIELD.z, 'Airfield'),
    at('skyway', 316, -60, 'Turfton Skyway'),
    at('hangar', ESTATES.hangar.x, ESTATES.hangar.z, ESTATES.hangar.name),
    at('boathouse', ESTATES.boathouse.x, ESTATES.boathouse.z, ESTATES.boathouse.name),
    at('lockup', LOCKUP.sites[0].x, LOCKUP.sites[0].z, 'Side-Valve Lock-Up'),
    at('lodge', LODGE.x, LODGE.z, 'Tuft & Tally Lodge'),
    at('hide', HIDE.x, HIDE.z, 'Reedwatch Hide'),
    at('tackle', SHOP.x, SHOP.z, 'The Bent Pin'),
    at('town', TOWN.blip.x, TOWN.blip.z, TOWN.name),
    ...ramps,
    ...stunts,
    at('skyway', 255, -130, 'East Beltway'),
    ...SKYWAY_SITES.map((s) => at('works', s.x, s.z, s.name)),
    // One blip per park name: Founders' Green is three PARKS rows (L92).
    ...PARKS.filter((p, i) => PARKS.findIndex((q) => q.name === p.name) === i).map((p) => at('park', p.x, p.z, p.name)),
    ...(Object.keys(EDGE_NAMES) as EdgeId[]).map((id) => at('edge', EDGE_LABELS[id].x, EDGE_LABELS[id].z, EDGE_NAMES[id])),
    // Pardonlin, the Unmown and the roads between them (E28). Kinds reuse existing ones: town, park, edge, skyway.
    at('town', -1600, -100, 'Pardonlin'),
    at('park', -1000, -1600, 'The Unmown'),
    at('park', -1560, -1150, 'Unmown Ranger Station'),
    at('park', -1600, 1040, 'Pardonlin Basin'),
    at('edge', -1400, -30, 'The Grand Wicket'),
    at('edge', -1400, -500, 'North Wicket'),
    at('edge', -1400, 1000, 'Harbour Wicket'),
    at('skyway', -1555, -30, 'The Hatwheel'),
    at('skyway', -950, -30, 'Trellis Cross'),
    at('skyway', 940, 40, 'The Anthill Ring'),
    // Rootwell (E13): the university, the Anthill Observatory, Rootwell Field (kind 'airfield') and Pinwheel Ridge.
    at('campus', CAMPUS.quadCentre.x, CAMPUS.quadCentre.z, 'Rootwell University'),
    at('observatory', OBSERVATORY.dome.x, OBSERVATORY.dome.z, 'The Anthill Observatory'),
    at('airfield', ROOTWELL_FIELD.runway.x, ROOTWELL_FIELD.runway.z, 'Rootwell Field'),
    at('windfarm', 850, -1200, 'Pinwheel Ridge'),
    // E17 societies (societies/config.ts): kinds reuse existing ones.
    at('town', UNDERSPAN.hogweed.x, UNDERSPAN.hogweed.z, 'The Underspan'),
    at('town', WADERS_REST.centre.x, WADERS_REST.centre.z, "Wader's Rest"),
    at('home', BURROW_DOOR.door.x, BURROW_DOOR.door.z, 'The Burrow Door (Loamdeep)'),
  ];
}

/** Downtown's named towers (src/towers/landmarks.ts, the ones marked poi), as tower blips with their names. */
export function landmarkBlips(): Blip[] {
  return landmarkPlaces().filter((l) => l.poi)
    .map((l) => ({ x: l.x, z: l.z, color: PLACE_STYLE.tower.color, kind: 'tower' as const, label: l.name }));
}
