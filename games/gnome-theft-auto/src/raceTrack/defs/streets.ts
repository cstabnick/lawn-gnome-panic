// E26 street routes: race tracks laid over the existing roads (relief 'none': the terrain, the surfaces and the map are
// left alone). Data only; createTrack (../trackDef.ts) does the geometry. Every centre line follows real road centre
// lines (the grid roads of Turfton, the HIGHWAYS polylines, the Skyway deck); streetTracks.test.ts proves it.
import type { TrackControl, TrackDef } from '../trackDef';

type Pt = readonly [number, number];

/** A grid corner at (x, z) eased by two control points `d` m up and down the roads, so the line stays inside the junction. */
function corner(prev: Pt, at: Pt, next: Pt, d = 8): Pt[] {
  const toward = (a: Pt, b: Pt): Pt => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return [a[0] + ((b[0] - a[0]) / len) * d, a[1] + ((b[1] - a[1]) / len) * d];
  };
  return [toward(at, prev), toward(at, next)];
}

/**
 * Waypoints of a grid route (plain points are straight-through, `true` as a third value marks a corner to ease), with extra
 * control points on every straight longer than 45 m so the spline cannot bulge off the road.
 */
function route(wp: readonly (readonly [number, number, boolean?])[], closed: boolean): TrackControl[] {
  const raw: Pt[] = [];
  const n = wp.length;
  wp.forEach((w, i) => {
    const prev = wp[(i + n - 1) % n], next = wp[(i + 1) % n];
    if (w[2] && (closed || (i > 0 && i < n - 1))) raw.push(...corner([prev[0], prev[1]], [w[0], w[1]], [next[0], next[1]]));
    else raw.push([w[0], w[1]]);
  });
  const out: Pt[] = [];
  raw.forEach((p, i) => {
    out.push(p);
    const q = raw[i + 1] ?? (closed ? raw[0] : undefined);
    if (!q) return;
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const k = Math.floor(len / 45);
    for (let j = 1; j <= k; j++) out.push([p[0] + ((q[0] - p[0]) * j) / (k + 1), p[1] + ((q[1] - p[1]) * j) / (k + 1)]);
  });
  return out.map(([x, z]) => ({ x, z }));
}

const pts = (a: readonly Pt[]): TrackControl[] => a.map(([x, z]) => ({ x, z }));

const STREET = { shoulder: 0, fade: 0, surface: 'asphalt', relief: 'none', jumps: [] } as const;

/**
 * Downtown Turfton: east along the z = -120 road (the long straight the grid sits on), down the x = 120 road, west on
 * z = 60, then the jog north (x = 0), west (z = 0) and south (x = -60) that makes the chicane, and back up x = -120.
 */
export const KERB_ROW_CIRCUIT: TrackDef = {
  ...STREET, id: 'kerb-row-circuit', name: 'Kerb Row Circuit', closed: true, width: 10, barrierOffset: 6, gates: 10, startOffset: 60,
  control: route([
    [-100, -120], [120, -120, true], [120, 60, true], [0, 60, true], [0, 0, true], [-60, 0, true], [-60, 120, true],
    [-120, 120, true], [-120, -120, true],
  ], true),
};

/** From the West Road at the Skyway's foot up the ramp, east along the deck and down the east ramp. Deck width 11. */
export const SKYWAY_SPRINT: TrackDef = {
  ...STREET, id: 'skyway-sprint', name: 'The Skyway Sprint', closed: false, width: 11, barrierOffset: 6.5, gates: 10, startOffset: 45,
  control: pts([
    [-300, 8.6], [-250, -20], [-232, -14.9], [-224, -12.6], [-220.7, -17], [-219.4, -27], [-219, -38], [-219, -48],
    [-218.3, -55.5], [-214, -59.2], [-207, -60], [-188, -60], [-130, -60], [-70, -60], [0, -60], [80, -60], [160, -60],
    [240, -60], [300, -60], [360, -60], [400, -46], [440, -46], [480, -46], [535, -46], [550, -31], [550, 0], [550, 24],
  ]),
};

/** The Carburettors' illicit time trial: round the ring highways (ring-ne, north, ring-nw, west, ring-sw, south, ring-se). */
export const RING_ROAD_RUN: TrackDef = {
  ...STREET, id: 'ring-road-run', name: 'The Ring Road Run', closed: true, width: 10, barrierOffset: 6, gates: 12, startOffset: 40,
  control: route([
    // Start on the long leg of ring-nw heading south-south-west, then the West Road link, ring-sw, the South Road bend,
    // ring-se, ring-ne, the North Road bend and ring-nw again.
    [-346, -171], [-400, 0, true], [-320, 20, true], [-300, 150], [-200, 290], [-40, 320], [10, 390], [60, 450, true],
    [200, 400], [320, 250], [300, 40], [335, -90], [250, -230], [40, -330], [0, -400, true], [-130, -390], [-260, -320],
    [-340, -190],
  ], true),
};

/** Pardonlin: pont-nord west to the Boulevard, south, pont-sud east to Rue D, north up Rue Haute, back along Rue A. */
export const PARDONLIN_BOUCLE: TrackDef = {
  ...STREET, id: 'pardonlin-boucle', name: 'La Boucle de Pardonlin', closed: true, width: 7, barrierOffset: 4.5, gates: 10, startOffset: 85,
  control: route([
    [-1696, -160], [-1705, -30], [-1700, 110], [-1695, 250, true], [-1580, 250], [-1525, 262], [-1466, 250, true], [-1458, 110],
    [-1462, -30], [-1465, -170], [-1455, -300, true], [-1520, -310], [-1578, -300], [-1700, -300, true], [-1695, -170],
  ], true),
};

/** From the anthill roundabout's south side down the East Band, then west along the South Band. */
export const SALTBUCKET_DASH: TrackDef = {
  ...STREET, id: 'saltbucket-dash', name: 'The Saltbucket Dash', closed: false, width: 10, barrierOffset: 6, gates: 10, startOffset: 60,
  control: pts([
    [941, 62], [943, 120], [945, 200], [948, 300], [950, 400], [950, 500], [950, 600], [950, 700], [950, 800], [950, 890],
    [950, 935], [947, 957], [925, 967], [875, 980], [800, 1000], [700, 1000], [600, 1000], [500, 1000], [400, 1000],
    [320, 992], [250, 984], [150, 975],
  ]),
};
