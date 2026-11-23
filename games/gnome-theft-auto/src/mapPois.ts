// The fixed places of Gnome Theft Auto as minimap and big-map blips (drawn by mapIcons.ts): the hospital, Side-Valve
// Salvage, the Gnomecino, Clay-Mart, Thorne Tower, the Turfton Amphitheater and the airfield.
import { AIRFIELD, AMPHITHEATER, CLAY_MART, GNOMECINO, HOSPITAL, SIDE_VALVE, THORNE_TOWER } from './config';
import { PLACE_STYLE, type PlaceKind } from './mapIcons';
import { ESTATES } from './lockup/config';
import type { Blip } from './types';

export function placeBlips(): Blip[] {
  const at = (kind: PlaceKind, x: number, z: number, label: string): Blip =>
    ({ x, z, color: PLACE_STYLE[kind].color, kind, label });
  return [
    at('hospital', HOSPITAL.x, HOSPITAL.z, 'Glaze Clinic Hospital'),
    at('salvage', SIDE_VALVE.bay.x, SIDE_VALVE.bay.z, 'Side-Valve Salvage'),
    at('casino', GNOMECINO.x, GNOMECINO.z, 'The Gnomecino'),
    at('mart', CLAY_MART.x, CLAY_MART.z, 'Clay-Mart'),
    at('tower', THORNE_TOWER.x, THORNE_TOWER.z, 'Thorne Tower'),
    at('stage', AMPHITHEATER.x, AMPHITHEATER.z, 'Turfton Amphitheater'),
    at('airfield', AIRFIELD.x, AIRFIELD.z, 'Airfield'),
    at('skyway', 316, -60, 'Turfton Skyway'),
    at('hangar', ESTATES.hangar.x, ESTATES.hangar.z, ESTATES.hangar.name),
    at('boathouse', ESTATES.boathouse.x, ESTATES.boathouse.z, ESTATES.boathouse.name),
  ];
}
