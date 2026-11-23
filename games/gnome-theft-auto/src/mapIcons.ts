// Map icons for the places of Gnome Theft Auto: one coloured round badge with a white glyph per place, on the minimap and
// the big map. Canvas only: nothing here touches the DOM at import time.
import type { Blip } from './types';

export type PlaceKind = 'shop' | 'speedway' | 'glaze' | 'hospital' | 'salvage' | 'whirligig' | 'casino' | 'mart'
  | 'tower' | 'stage' | 'airfield';

/** Legend name and badge colour per place (the legend lists them in this order). */
export const PLACE_STYLE: Readonly<Record<PlaceKind, { name: string; color: string }>> = {
  shop: { name: 'Ammu-Gnation (gun mods)', color: '#4b5d2a' },
  glaze: { name: "Pay 'n' Glaze", color: '#ff3b9a' },
  hospital: { name: 'Glaze Clinic Hospital', color: '#e53935' },
  salvage: { name: 'Side-Valve Salvage', color: '#f08a24' },
  speedway: { name: 'Lost & Found Speedway', color: '#222222' },
  whirligig: { name: 'The Whirligig', color: '#ff4fd8' },
  casino: { name: 'The Gnomecino', color: '#1f7a4a' },
  mart: { name: 'Clay-Mart', color: '#2f6fd6' },
  tower: { name: 'Thorne Tower', color: '#8a7f6a' },
  stage: { name: 'Turfton Amphitheater', color: '#7b4bd6' },
  airfield: { name: 'Airfield', color: '#3aa7e0' },
};

/** Places that pin to the minimap's rim when they are off it (services you drive to). */
export const RIM_PLACES: ReadonlySet<PlaceKind> = new Set<PlaceKind>(['shop', 'glaze', 'hospital', 'salvage']);

const PLACE_SET: ReadonlySet<string> = new Set<string>(Object.keys(PLACE_STYLE));
const OUTLINE = '#0c0f13';
const WHITE = '#ffffff';
const TAU = Math.PI * 2;

export function isPlace(b: Blip): b is Blip & { kind: PlaceKind } {
  return b.kind !== undefined && PLACE_SET.has(b.kind);
}

/**
 * A name wanting a spot on the big map. (x, y): the badge or marker centre, CSS px. side: 'below' (a place's name) or
 * 'above' (a quest's). prio: lower lays out first and so wins a contested spot. pad: extra vertical room (a bobbing pin).
 */
export interface MapLabelWish { text: string; x: number; y: number; side: 'below' | 'above'; size: number; prio: number; pad?: number }
/** Where a label was put: text centre x and baseline y, and its box [x0, y0, x1, y1]. */
export interface MapLabelSpot { text: string; x: number; y: number; box: [number, number, number, number]; wish: MapLabelWish }

/** Baseline gap from the badge centre: a place's name sits under its badge, a quest's over its marker. */
const LABEL_BELOW = 20;
const LABEL_ABOVE = 14;
/** Keep labels this far inside the map's edge. */
const LABEL_MARGIN = 2;

/**
 * Lay out big-map names in priority order: each one is shifted to stay inside [0, w] x [0, h] (a name by the left or
 * right edge slides in, one that would leave the top or bottom flips to the badge's other side), then skipped if it
 * overlaps a name already placed (downtown is crowded; the legend still names every badge). `measure`: text width in px.
 */
export function layoutMapLabels(
  wishes: readonly MapLabelWish[], measure: (text: string, size: number) => number, w: number, h: number,
): MapLabelSpot[] {
  const order = wishes.map((wish, i) => ({ wish, i })).sort((a, b) => a.wish.prio - b.wish.prio || a.i - b.i);
  const out: MapLabelSpot[] = [];
  for (const { wish } of order) {
    const half = measure(wish.text, wish.size) / 2 + 2;
    const pad = wish.pad ?? 0;
    const asc = wish.size - 1;
    const baseFor = (side: 'below' | 'above'): number => (side === 'below' ? wish.y + LABEL_BELOW : wish.y - LABEL_ABOVE);
    let y = baseFor(wish.side);
    const fits = (b: number): boolean => b - asc - pad >= LABEL_MARGIN && b + 3 + pad <= h - LABEL_MARGIN;
    if (!fits(y)) {
      const flipped = baseFor(wish.side === 'below' ? 'above' : 'below');
      y = fits(flipped) ? flipped : Math.min(h - LABEL_MARGIN - 3 - pad, Math.max(LABEL_MARGIN + asc + pad, y));
    }
    const x = Math.min(w - LABEL_MARGIN - half, Math.max(LABEL_MARGIN + half, wish.x));
    const box: [number, number, number, number] = [x - half, y - asc - pad, x + half, y + 3 + pad];
    if (out.some(({ box: [a0, b0, a1, b1] }) => !(box[2] < a0 || box[0] > a1 || box[3] < b0 || box[1] > b1))) continue;
    out.push({ text: wish.text, x, y, box, wish });
  }
  return out;
}

/** A closed polygon through points given in glyph units (-1..1 across the glyph), filled. */
function glyphPoly(g: CanvasRenderingContext2D, x: number, y: number, s: number, pts: [number, number][]): void {
  g.beginPath();
  pts.forEach(([u, v], i) => (i === 0 ? g.moveTo(x + u * s, y + v * s) : g.lineTo(x + u * s, y + v * s)));
  g.closePath();
  g.fill();
}

/** A rectangle in glyph units, filled. */
function glyphRect(g: CanvasRenderingContext2D, x: number, y: number, s: number, u: number, v: number, w: number, h: number): void {
  g.fillRect(x + u * s, y + v * s, w * s, h * s);
}

/** A round badge of radius r centred on (x, y): the place's colour, a 1.5 px dark outline (#0c0f13), a white glyph. */
export function drawPlaceIcon(g: CanvasRenderingContext2D, x: number, y: number, r: number, kind: PlaceKind): void {
  const color = PLACE_STYLE[kind].color;
  g.save();
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.fillStyle = color;
  g.fill();
  g.strokeStyle = OUTLINE;
  g.lineWidth = 1.5;
  g.stroke();
  if (kind === 'shop') {
    // Ammu-Gnation: an orange ring just inside the rim.
    g.beginPath();
    g.arc(x, y, r - 2, 0, TAU);
    g.strokeStyle = '#ff7a1a';
    g.lineWidth = 1.5;
    g.stroke();
  }
  // The glyph fills about 60% of the badge: its unit is 0.6 r, so -1..1 spans 1.2 r.
  const s = r * 0.6;
  const lw = Math.max(1.5, r * 0.2);
  g.fillStyle = WHITE;
  g.strokeStyle = WHITE;
  g.lineWidth = lw;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  switch (kind) {
    case 'shop': {
      // A pistol, side view: barrel, then the grip under the back of it.
      glyphRect(g, x, y, s, -1, -0.45, 1.9, 0.35);
      glyphPoly(g, x, y, s, [[0, -0.1], [0.45, -0.1], [0.3, 0.9], [-0.05, 0.9]]);
      break;
    }
    case 'glaze': {
      // A spray can: body, cap, and three spray dots.
      glyphRect(g, x, y, s, -0.5, -0.3, 1, 1.4);
      glyphRect(g, x, y, s, -0.3, -0.65, 0.6, 0.35);
      for (const [u, v] of [[0.85, -0.6], [1.0, -0.15], [0.8, 0.3]]) {
        g.beginPath();
        g.arc(x + u * s, y + v * s, 0.26 * s, 0, TAU);
        g.fill();
      }
      break;
    }
    case 'hospital': {
      glyphRect(g, x, y, s, -0.25, -1, 0.5, 2);
      glyphRect(g, x, y, s, -1, -0.25, 2, 0.5);
      break;
    }
    case 'salvage': {
      // A wrench: a shaft and an open jaw at its end.
      g.beginPath();
      g.moveTo(x - 0.6 * s, y + 0.6 * s);
      g.lineTo(x + 0.2 * s, y - 0.2 * s);
      g.lineWidth = lw * 1.4;
      g.stroke();
      g.beginPath();
      g.arc(x + 0.45 * s, y - 0.45 * s, 0.45 * s, Math.PI * 0.2, Math.PI * 1.8);
      g.stroke();
      break;
    }
    case 'speedway': {
      // A chequered flag on a pole: a 3 x 2 chequer.
      g.lineWidth = lw * 1.2;
      g.beginPath();
      g.moveTo(x - 0.8 * s, y - 1 * s);
      g.lineTo(x - 0.8 * s, y + 1 * s);
      g.stroke();
      const x0 = -0.8, y0 = -1, cw = 0.55, ch = 0.5;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 2; j++) {
          if ((i + j) % 2 === 0) glyphRect(g, x, y, s, x0 + i * cw, y0 + j * ch, cw, ch);
        }
      }
      g.strokeRect(x + x0 * s, y + y0 * s, 3 * cw * s, 2 * ch * s);
      break;
    }
    case 'whirligig': {
      // A three-blade propeller.
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + (i * TAU) / 3;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + Math.cos(a) * 0.95 * s, y + Math.sin(a) * 0.95 * s);
        g.lineWidth = lw * 1.8;
        g.stroke();
      }
      g.beginPath();
      g.arc(x, y, 0.2 * s, 0, TAU);
      g.fill();
      break;
    }
    case 'casino': {
      // A poker chip: a ring, four notches on it, a centre dot.
      g.beginPath();
      g.arc(x, y, 0.7 * s, 0, TAU);
      g.lineWidth = lw * 0.9;
      g.stroke();
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        g.beginPath();
        g.moveTo(x + Math.cos(a) * 0.85 * s, y + Math.sin(a) * 0.85 * s);
        g.lineTo(x + Math.cos(a) * 1.0 * s, y + Math.sin(a) * 1.0 * s);
        g.lineWidth = lw * 1.4;
        g.stroke();
      }
      g.beginPath();
      g.arc(x, y, 0.25 * s, 0, TAU);
      g.fill();
      break;
    }
    case 'mart': {
      // A shopping bag: body, and a handle arc above it.
      glyphRect(g, x, y, s, -0.7, -0.3, 1.4, 1.3);
      g.beginPath();
      g.arc(x, y - 0.3 * s, 0.4 * s, Math.PI, Math.PI * 2);
      g.lineWidth = lw;
      g.stroke();
      break;
    }
    case 'tower': {
      // A tall tower with window dots (the dots take the badge colour).
      glyphRect(g, x, y, s, -0.4, -0.6, 0.8, 1.6);
      glyphRect(g, x, y, s, -0.5, -0.9, 1.0, 0.3);
      g.fillStyle = color;
      for (const v of [-0.3, 0.05, 0.4]) {
        glyphRect(g, x, y, s, -0.2, v, 0.15, 0.2);
        glyphRect(g, x, y, s, 0.05, v, 0.15, 0.2);
      }
      break;
    }
    case 'stage': {
      // A music note: head, stem, and a flag.
      g.beginPath();
      g.arc(x - 0.4 * s, y + 0.6 * s, 0.35 * s, 0, TAU);
      g.fill();
      g.beginPath();
      g.moveTo(x - 0.05 * s, y + 0.6 * s);
      g.lineTo(x - 0.05 * s, y - 0.9 * s);
      g.quadraticCurveTo(x + 0.6 * s, y - 0.5 * s, x + 0.5 * s, y - 0.05 * s);
      g.lineWidth = lw;
      g.stroke();
      break;
    }
    case 'airfield': {
      // A plane seen from above: fuselage, wings, tailplane.
      glyphRect(g, x, y, s, -0.14, -0.95, 0.28, 1.9);
      glyphPoly(g, x, y, s, [[0, -0.3], [1, 0.2], [1, 0.45], [0, 0.1], [-1, 0.45], [-1, 0.2]]);
      glyphPoly(g, x, y, s, [[0, 0.6], [0.45, 0.85], [0.45, 0.95], [0, 0.8], [-0.45, 0.95], [-0.45, 0.85]]);
      break;
    }
  }
  g.restore();
}
