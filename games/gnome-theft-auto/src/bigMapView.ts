// The big map's camera: pure maths, no DOM. The picture is mirrored in x like the minimap (facing north, east is on the
// right), so a larger world x lands further left on the screen.

/** The world point at the screen centre, and the zoom: screen px per world unit. */
export interface MapView { cx: number; cz: number; scale: number }
/** The map square: w x h screen px, the world half-size, and the zoom range. */
export interface MapViewport { w: number; h: number; half: number; minScale: number; maxScale: number }

const clampNum = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

/** The scale at which a w x h square shows the whole world. */
export function fitScale(w: number, h: number, half: number): number {
  return Math.min(w, h) / (2 * half);
}

/** The whole world in view, centred. */
export function fitView(vp: MapViewport): MapView {
  return { cx: 0, cz: 0, scale: vp.minScale };
}

/** Scale kept in [minScale, maxScale]; the centre kept so the world edge never leaves a gap bigger than the viewport allows. */
export function clampView(v: MapView, vp: MapViewport): MapView {
  const scale = clampNum(v.scale, vp.minScale, vp.maxScale);
  // Half the world visible across each axis; when the world is smaller than the viewport on an axis it stays centred there.
  const lx = Math.max(0, vp.half - vp.w / (2 * scale));
  const lz = Math.max(0, vp.half - vp.h / (2 * scale));
  return { cx: clampNum(v.cx, -lx, lx), cz: clampNum(v.cz, -lz, lz), scale };
}

export function worldToScreen(v: MapView, vp: MapViewport, x: number, z: number): { sx: number; sy: number } {
  return { sx: vp.w / 2 + (v.cx - x) * v.scale, sy: vp.h / 2 + (v.cz - z) * v.scale };
}

export function screenToWorld(v: MapView, vp: MapViewport, sx: number, sy: number): { x: number; z: number } {
  return { x: v.cx - (sx - vp.w / 2) / v.scale, z: v.cz - (sy - vp.h / 2) / v.scale };
}

/** Zoom by `factor` about the screen point (sx, sy): the world point under it stays put (unless the edge clamp stops it). */
export function zoomAt(v: MapView, vp: MapViewport, sx: number, sy: number, factor: number): MapView {
  const at = screenToWorld(v, vp, sx, sy);
  const scale = clampNum(v.scale * factor, vp.minScale, vp.maxScale);
  return clampView({ cx: at.x + (sx - vp.w / 2) / scale, cz: at.z + (sy - vp.h / 2) / scale, scale }, vp);
}

/** Drag the map by (dsx, dsy) screen px: the picture follows the finger. */
export function panBy(v: MapView, vp: MapViewport, dsx: number, dsy: number): MapView {
  return clampView({ cx: v.cx + dsx / v.scale, cz: v.cz + dsy / v.scale, scale: v.scale }, vp);
}
