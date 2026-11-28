// Map icons for the places of Gnome Theft Auto: one coloured round badge with a white glyph per place, on the minimap and
// the big map. Canvas only: nothing here touches the DOM at import time.
import type { Blip } from './types';

export type PlaceKind = 'shop' | 'speedway' | 'glaze' | 'hospital' | 'salvage' | 'whirligig' | 'casino' | 'mart'
  | 'tower' | 'stage' | 'airfield' | 'skyway' | 'hangar' | 'boathouse'
  | 'lockup' | 'lodge' | 'hide' | 'tackle' | 'onramp' | 'works' | 'exchange' | 'town' | 'park' | 'edge'
  | 'dealer-car' | 'dealer-boat' | 'dealer-air' | 'home' | 'ski' | 'bears' | 'icefish' | 'golf' | 'campus' | 'observatory' | 'windfarm'
  | 'court' | 'skate' | 'story';

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
  skyway: { name: 'Skyway', color: '#8a8f9c' },
  hangar: { name: 'Hangar Two (your aircraft)', color: '#2b5f8a' },
  boathouse: { name: 'Mossbank Boathouse (your boats)', color: '#2a8f8a' },
  lockup: { name: 'Side-Valve Lock-Up', color: '#c4661f' },
  lodge: { name: 'Tuft & Tally Lodge', color: '#7a9a3a' },
  hide: { name: 'Reedwatch Hide', color: '#5a9a8a' },
  tackle: { name: 'The Bent Pin', color: '#3f8fb0' },
  onramp: { name: 'Skyway ramp', color: '#6f7684' },
  works: { name: 'Local 404 work site', color: '#e0a100' },
  exchange: { name: 'Kerbside Exchange (jobs)', color: '#ffb347' },
  town: { name: 'Pebblewick (town)', color: '#b8743a' },
  park: { name: 'Park', color: '#3f9a4a' },
  edge: { name: 'City edge', color: '#6b4a2e' },
  'dealer-car': { name: "Burl's Forecourt (buy vehicles)", color: '#d1495b' },
  'dealer-boat': { name: "Driftwood's Boat Yard (buy boats)", color: '#1f8fa6' },
  'dealer-air': { name: "Wally's Wing Lot (buy aircraft)", color: '#5b6fd1' },
  home: { name: 'Homes (visited)', color: '#c97b4a' },
  ski: { name: 'Snowdrop Slope (ski, sled)', color: '#3a7bd5' },
  bears: { name: 'Polar bears (very chill)', color: '#9fb8c8' },
  icefish: { name: 'Pail Pond (ice fishing)', color: '#4fb3c8' },
  golf: { name: 'Hedgeworth Links (golf)', color: '#4caf50' },
  campus: { name: 'Rootwell University', color: '#8b1e2b' },
  observatory: { name: 'Observatory', color: '#2b3f7a' },
  windfarm: { name: 'Pinwheel Ridge', color: '#e0a21b' },
  court: { name: 'Drainpipe Court (basketball)', color: '#e0702a' },
  skate: { name: 'The Gutter Bowls (skate park)', color: '#3a7ac0' },
  story: { name: 'Story place', color: '#e6b422' },
};

/** Places that pin to the minimap's rim when they are off it (services you drive to). */
export const RIM_PLACES: ReadonlySet<PlaceKind> = new Set<PlaceKind>(['shop', 'glaze', 'hospital', 'salvage', 'exchange']);

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
    case 'skyway': {
      // A bridge: a horizontal deck bar on two legs.
      glyphRect(g, x, y, s, -1, -0.6, 2, 0.3);
      glyphRect(g, x, y, s, -0.75, -0.3, 0.3, 1.2);
      glyphRect(g, x, y, s, 0.45, -0.3, 0.3, 1.2);
      break;
    }
    case 'hangar': {
      // A hangar front: a curved roof over an open door with a small plane tail inside.
      glyphPoly(g, x, y, s, [[-1, 0.9], [-1, -0.2], [-0.6, -0.75], [0.6, -0.75], [1, -0.2], [1, 0.9], [0.6, 0.9], [0.6, -0.1], [-0.6, -0.1], [-0.6, 0.9]]);
      glyphPoly(g, x, y, s, [[-0.15, 0.9], [0, 0.25], [0.15, 0.9]]);
      break;
    }
    case 'boathouse': {
      // A boathouse: a pitched roof over a slip, and a wave line below.
      glyphPoly(g, x, y, s, [[-1, -0.1], [0, -0.95], [1, -0.1]]);
      glyphRect(g, x, y, s, -0.8, -0.1, 0.25, 0.6);
      glyphRect(g, x, y, s, 0.55, -0.1, 0.25, 0.6);
      glyphRect(g, x, y, s, -1, 0.65, 2, 0.25);
      break;
    }
    case 'lockup': {
      // A garage door: a white box with three coloured slats.
      glyphRect(g, x, y, s, -0.9, -0.8, 1.8, 1.6);
      g.fillStyle = color;
      for (const v of [-0.45, -0.05, 0.35]) glyphRect(g, x, y, s, -0.9, v, 1.8, 0.2);
      break;
    }
    case 'lodge': {
      // A tuft or antler: a stem that forks into two tines.
      g.beginPath();
      g.moveTo(x, y + 1 * s);
      g.lineTo(x, y + 0.1 * s);
      g.lineTo(x - 0.8 * s, y - 0.9 * s);
      g.moveTo(x, y + 0.1 * s);
      g.lineTo(x + 0.8 * s, y - 0.9 * s);
      g.stroke();
      break;
    }
    case 'hide': {
      // Binoculars: two lenses on a bridge.
      g.beginPath();
      g.arc(x - 0.5 * s, y + 0.3 * s, 0.5 * s, 0, TAU);
      g.arc(x + 0.5 * s, y + 0.3 * s, 0.5 * s, 0, TAU);
      g.fill();
      glyphRect(g, x, y, s, -0.2, -0.45, 0.4, 0.4);
      break;
    }
    case 'tackle': {
      // A fish hook: a shank, a J curve at the bottom and a barb at the top.
      g.beginPath();
      g.moveTo(x + 0.3 * s, y - 1 * s);
      g.lineTo(x + 0.3 * s, y + 0.4 * s);
      g.arc(x - 0.1 * s, y + 0.4 * s, 0.4 * s, 0, Math.PI);
      g.moveTo(x + 0.3 * s, y - 0.9 * s);
      g.lineTo(x - 0.4 * s, y - 0.6 * s);
      g.stroke();
      break;
    }
    case 'onramp': {
      // An up-arrow standing on a slope.
      glyphPoly(g, x, y, s, [[0, -1], [0.55, -0.3], [0.15, -0.3], [0.15, 0.5], [-0.15, 0.5], [-0.15, -0.3], [-0.55, -0.3]]);
      g.beginPath();
      g.moveTo(x - 1 * s, y + 0.9 * s);
      g.lineTo(x + 1 * s, y + 0.5 * s);
      g.stroke();
      break;
    }
    case 'works': {
      // A traffic cone: a white triangle with a coloured band and a base.
      glyphPoly(g, x, y, s, [[0, -0.9], [0.45, 0.7], [-0.45, 0.7]]);
      g.fillStyle = color;
      glyphRect(g, x, y, s, -0.3, -0.1, 0.6, 0.25);
      g.fillStyle = WHITE;
      glyphRect(g, x, y, s, -0.6, 0.7, 1.2, 0.2);
      break;
    }
    case 'exchange': {
      // A ticket: a white stub with a notch cut from each end and a tear line.
      glyphRect(g, x, y, s, -1, -0.6, 2, 1.2);
      g.fillStyle = color;
      for (const u of [-1, 1]) {
        g.beginPath();
        g.arc(x + u * s, y, 0.25 * s, 0, TAU);
        g.fill();
      }
      glyphRect(g, x, y, s, 0.35, -0.6, 0.1, 1.2);
      break;
    }
    case 'town': {
      // A water tower: a tank on two legs.
      glyphRect(g, x, y, s, -0.75, -0.95, 1.5, 0.85);
      glyphRect(g, x, y, s, -0.6, -0.1, 0.22, 1.05);
      glyphRect(g, x, y, s, 0.38, -0.1, 0.22, 1.05);
      glyphRect(g, x, y, s, -0.6, 0.35, 1.2, 0.15);
      break;
    }
    case 'park': {
      // A small round tree: a dark green canopy disc on a short brown trunk.
      g.fillStyle = '#1d4d24';
      g.beginPath();
      g.arc(x, y - 0.25 * s, 0.6 * s, 0, TAU);
      g.fill();
      g.fillStyle = '#7a4e2a';
      glyphRect(g, x, y, s, -0.12, 0.3, 0.24, 0.7);
      break;
    }
    case 'edge': {
      // Rough ground: two short diagonal hatch lines.
      g.lineWidth = lw * 0.9;
      for (const u of [-0.35, 0.35]) {
        g.beginPath();
        g.moveTo(x + (u - 0.35) * s, y + 0.8 * s);
        g.lineTo(x + (u + 0.35) * s, y - 0.8 * s);
        g.stroke();
      }
      break;
    }
    case 'dealer-car': {
      // A price tag: a pentagon tag pointing right, with a hole near its flat end (the hole takes the badge colour).
      glyphPoly(g, x, y, s, [[-0.9, -0.5], [0.1, -0.5], [0.9, 0], [0.1, 0.5], [-0.9, 0.5]]);
      g.fillStyle = color;
      g.beginPath();
      g.arc(x - 0.5 * s, y, 0.16 * s, 0, TAU);
      g.fill();
      break;
    }
    case 'dealer-boat': {
      // A sailboat: a triangle sail on a mast over a hull trapezoid.
      glyphPoly(g, x, y, s, [[0, -0.95], [0, 0.05], [-0.75, 0.05]]);
      glyphPoly(g, x, y, s, [[-0.95, 0.2], [0.95, 0.2], [0.6, 0.7], [-0.6, 0.7]]);
      break;
    }
    case 'dealer-air': {
      // A plane seen from above: a fuselage bar crossed by a wing bar, with a small tail bar.
      glyphRect(g, x, y, s, -0.12, -1, 0.24, 2);
      glyphRect(g, x, y, s, -1, -0.15, 2, 0.25);
      glyphRect(g, x, y, s, -0.4, 0.7, 0.8, 0.18);
      break;
    }
    case 'home': {
      // A little house: a square body under a triangle roof, with a door.
      glyphPoly(g, x, y, s, [[0, -1], [1, -0.1], [-1, -0.1]]);
      glyphRect(g, x, y, s, -0.7, -0.1, 1.4, 1);
      g.fillStyle = color;
      glyphRect(g, x, y, s, -0.18, 0.2, 0.36, 0.7);
      break;
    }
    case 'ski': {
      // Two crossed skis.
      g.beginPath();
      g.moveTo(x - 0.8 * s, y - 0.9 * s);
      g.lineTo(x + 0.8 * s, y + 0.9 * s);
      g.moveTo(x + 0.8 * s, y - 0.9 * s);
      g.lineTo(x - 0.8 * s, y + 0.9 * s);
      g.stroke();
      break;
    }
    case 'bears': {
      // A bear's face: a round head with two round ears.
      g.beginPath();
      g.arc(x, y + 0.15 * s, 0.65 * s, 0, TAU);
      g.arc(x - 0.55 * s, y - 0.5 * s, 0.28 * s, 0, TAU);
      g.arc(x + 0.55 * s, y - 0.5 * s, 0.28 * s, 0, TAU);
      g.fill();
      break;
    }
    case 'golf': {
      // A flag on a pole, with a small cup of ground under it.
      glyphRect(g, x, y, s, -0.35, -1, 0.2, 2);
      glyphPoly(g, x, y, s, [[-0.15, -1], [0.95, -0.5], [-0.15, 0]]);
      glyphRect(g, x, y, s, -0.9, 0.8, 1.4, 0.2);
      break;
    }
    case 'icefish': {
      // A fish over a round hole.
      glyphPoly(g, x, y, s, [[-0.9, 0], [0.3, -0.5], [0.3, 0.5]]);
      glyphPoly(g, x, y, s, [[0.3, 0], [0.9, -0.45], [0.9, 0.45]]);
      break;
    }
    case 'campus': {
      // A mortarboard: a flat diamond cap with a tassel line hanging off one corner.
      glyphPoly(g, x, y, s, [[0, -0.7], [1, -0.15], [0, 0.4], [-1, -0.15]]);
      g.fillStyle = color;
      glyphRect(g, x, y, s, 0.55, -0.1, 0.12, 0.8);
      g.fillStyle = WHITE;
      glyphRect(g, x, y, s, 0.5, 0.7, 0.22, 0.2);
      break;
    }
    case 'observatory': {
      // A half-dome with a slit across it, on a base line.
      g.beginPath();
      g.arc(x, y + 0.3 * s, 0.9 * s, Math.PI, 0);
      g.fill();
      g.fillStyle = color;
      glyphRect(g, x, y, s, -0.1, -0.8, 0.2, 0.9);
      g.fillStyle = WHITE;
      glyphRect(g, x, y, s, -1, 0.4, 2, 0.22);
      break;
    }
    case 'windfarm': {
      // A four-vane garden pinwheel: four white triangles turning round the centre.
      glyphPoly(g, x, y, s, [[0, 0], [0, -0.85], [0.6, -0.6]]);
      glyphPoly(g, x, y, s, [[0, 0], [0.85, 0], [0.6, 0.6]]);
      glyphPoly(g, x, y, s, [[0, 0], [0, 0.85], [-0.6, 0.6]]);
      glyphPoly(g, x, y, s, [[0, 0], [-0.85, 0], [-0.6, -0.6]]);
      break;
    }
    case 'court': {
      // A basketball: an orange disc ringed in white, with two dark seam curves.
      g.fillStyle = color;
      g.beginPath();
      g.arc(x, y, 0.95 * s, 0, TAU);
      g.fill();
      g.strokeStyle = WHITE;
      g.lineWidth = Math.max(1, lw * 0.5);
      g.stroke();
      g.strokeStyle = OUTLINE;
      g.beginPath();
      g.arc(x - 1.1 * s, y, 0.9 * s, -0.9, 0.9);
      g.moveTo(x + 1.1 * s + 0.9 * s * Math.cos(Math.PI - 0.9), y + 0.9 * s * Math.sin(Math.PI - 0.9));
      g.arc(x + 1.1 * s, y, 0.9 * s, Math.PI - 0.9, Math.PI + 0.9);
      g.stroke();
      break;
    }
    case 'skate': {
      // A skateboard seen from above: a white bar with four wheel dots.
      glyphRect(g, x, y, s, -0.5, -1, 1, 2);
      g.fillStyle = color;
      for (const [u, v] of [[-0.6, -0.7], [0.6, -0.7], [-0.6, 0.7], [0.6, 0.7]] as const) {
        g.beginPath();
        g.arc(x + u * s, y + v * s, 0.16 * s, 0, TAU);
        g.fill();
      }
      break;
    }
    case 'story': {
      // A ring with a dot: a place the story pointed you to.
      g.beginPath();
      g.arc(x, y, 0.9 * s, 0, TAU);
      g.stroke();
      g.beginPath();
      g.arc(x, y, 0.3 * s, 0, TAU);
      g.fill();
      break;
    }
  }
  g.restore();
}
