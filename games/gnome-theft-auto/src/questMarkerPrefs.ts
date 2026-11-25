// Quest beam height, kept per browser: 'low' (about a third of the old height) or 'tall' (the original 90 m giver
// beams and 40 m objective beacons). trackBeam sizes a beam to the setting and keeps it sized; changing the setting
// re-applies every tracked beam. The row sits under Map and markers in the Options registry (optionsRegistry.ts).
import type * as THREE from 'three';
import { registerOption } from './optionsRegistry';

export type MarkerHeight = 'low' | 'tall';
export const MARKER_SCALE: Record<MarkerHeight, number> = { low: 0.35, tall: 1 };

const KEY = 'gta.markerHeight';

function read(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}
function write(value: string): void {
  try { localStorage.setItem(KEY, value); } catch { /* per-session only */ }
}

let pref: MarkerHeight = read() === 'tall' ? 'tall' : 'low';

interface TrackedBeam { beam: THREE.Object3D; groundY: number; full: number }
const tracked = new Set<TrackedBeam>();

function apply(t: TrackedBeam): void {
  t.beam.scale.y = MARKER_SCALE[pref];
  t.beam.position.y = t.groundY + getMarkerHeight(t.full) / 2;
}

export const getMarkerHeightPref = (): MarkerHeight => pref;

/** The beam length for a beam whose full ("tall") length is `full` metres. */
export function getMarkerHeight(full = 90): number {
  return full * MARKER_SCALE[pref];
}

/** Sizes `beam` (built with a cylinder of height `full`) to the current setting, standing on `groundY`, and keeps it
 *  updated when the setting changes (forgotten once the mesh has no parent after a change). */
export function trackBeam(beam: THREE.Object3D, groundY: number, full: number): void {
  const t: TrackedBeam = { beam, groundY, full };
  tracked.add(t);
  apply(t);
}

export function setMarkerHeightPref(h: MarkerHeight): void {
  pref = h;
  write(h);
  for (const t of tracked) {
    if (t.beam.parent === null) tracked.delete(t);
    else apply(t);
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('gta:marker-height'));
}

registerOption({
  section: 'map', id: 'marker-height', label: 'Quest markers', kind: 'cycle', watch: 'gta:marker-height',
  desc: 'How tall the beams over quest givers and objectives stand. Tall shows them from across town.',
  values: [{ id: 'low', label: 'Low' }, { id: 'tall', label: 'Tall' }],
  get: () => pref,
  set: (id) => setMarkerHeightPref(id as MarkerHeight),
});
