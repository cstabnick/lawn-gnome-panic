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
    ...PARKS.map((p) => at('park', p.x, p.z, p.name)),
    ...(Object.keys(EDGE_NAMES) as EdgeId[]).map((id) => at('edge', EDGE_LABELS[id].x, EDGE_LABELS[id].z, EDGE_NAMES[id])),
  ];
}

/** Downtown's named towers (src/towers/landmarks.ts, the ones marked poi), as tower blips with their names. */
export function landmarkBlips(): Blip[] {
  return landmarkPlaces().filter((l) => l.poi)
    .map((l) => ({ x: l.x, z: l.z, color: PLACE_STYLE.tower.color, kind: 'tower' as const, label: l.name }));
}
