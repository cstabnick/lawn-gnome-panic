// Special paint sprays: decals drawn in code onto a canvas and laid on thin planes over the body's panels.
// STUB (see the issue that owns this file).
import * as THREE from 'three';
import type { DecalId, Loadout, VehicleMounts } from './types';

/** The few CanvasRenderingContext2D members the draw functions use, so they can be tested with a fake. */
export type Ctx2D = Pick<
  CanvasRenderingContext2D,
  'save' | 'restore' | 'beginPath' | 'moveTo' | 'lineTo' | 'closePath' | 'fill' | 'stroke' | 'rect' | 'arc' | 'quadraticCurveTo' | 'bezierCurveTo'
  | 'translate' | 'rotate' | 'scale' | 'fillRect' | 'clearRect' | 'fillText' | 'fillStyle' | 'strokeStyle' | 'lineWidth' | 'font' | 'textAlign' | 'textBaseline' | 'globalAlpha' | 'lineJoin' | 'lineCap'
>;

/** Which kind of panel a spray is being drawn for: a flank is wider than tall, the hood is nearly square, the tail is a short strip. */
export type DecalPanelKind = 'side' | 'top' | 'rear';

/** Draw spray `id` filling a w x h canvas (transparent background) in `color`, using `accent` for secondary marks and `n` for the 'number' spray. Pure: same inputs, same calls. */
export function drawDecal(_ctx: Ctx2D, _id: DecalId, _w: number, _h: number, _color: string, _accent: string, _n: number, _panel: DecalPanelKind): void {
  /* stub */
}

/** A group of planes (one per mounts.panels entry) showing the loadout's spray, slightly off the body so it never z-fights; null when decal is 'none'. Textures are cached per (decal, colour, number, panel kind). With no DOM (tests) the planes are plain-coloured. */
export function buildDecals(_mounts: VehicleMounts, _loadout: Loadout): THREE.Group | null {
  return null;
}
