// The world landscape (terrain pass): big shapes that cross region borders, so the map stops being a flat board you can
// see across from anywhere. A mountain at the north edge, ridges along the region seams, rolling hills, and a rim of
// high ground round the world's edge. Data in src/data/landscape.json (world coordinates); this file is the generator.
//
// Everything here is masked to 0 where the game needs level ground: Turfton and its ring, every highway (a ridge that
// meets a road is cut through, so roads keep their grades), every trail, all water (river banks stay where the water
// epic put them), the flat sites (fort, airfield, every `reserve` marker, the Speedway) and the regions' `calm` spots.
// terrain.ts adds macroAt to the natural height with the tilt and the region landforms; the road, site and city
// flatten passes and the water carving run on top as before.
//
// Pure: no three.js, no DOM.
import landscapeJson from '../data/landscape.json';
import { AIRFIELD, BASE, CITY_HALF, WORLD_HALF } from '../config';
import { REGION_DOCS, REGION_IDS, LAYOUT, trails } from '../levels';
import { reservedRects } from '../sites';
import { roadDistAt, waterDistAt } from './fields';
import { distToPolyline, fbm, nearestOnPolyline, ridged, smoothstep } from './noise';

/** One landscape feature, world coordinates. */
export interface LandscapeFeature {
  id: string;
  /**
   * 'mountain': a peak at points[0], base radius r, height h, with ridged shoulders.
   * 'ridge': a long hill along the polyline `points`, half width r, crest height h (tapers at both ends).
   * 'hill': a rounded hill at points[0], radius r, height h.
   */
  kind: 'mountain' | 'ridge' | 'hill';
  points: [number, number][];
  r: number;
  h: number;
  /** Noise seed for this feature's own wobble (default: its index). */
  seed?: number;
}

export interface LandscapeDoc {
  format: 'gta-landscape';
  version: number;
  params: {
    /** Macro relief is 0 within roadClear of a highway centre line, full by roadClear + roadFade. */
    roadClear: number; roadFade: number;
    /** The same for trails. */
    trailClear: number; trailFade: number;
    /** The same for any water (river bank, loch or sea edge). */
    waterClear: number; waterFade: number;
    /** The same for flat sites (reserve markers, the fort, the airfield) and calm spots, measured from their edge. */
    siteClear: number; siteFade: number;
    /** The same for Turfton, measured from the city square's edge. */
    cityClear: number; cityFade: number;
    /** The world rim: rimHeight metres at the edge, falling to 0 over rimWidth metres inwards, wobbled by noise. */
    rimHeight: number; rimWidth: number;
    /** Gentle rolling everywhere outside the masks: amplitude (m) and scale (m). */
    roll: number; rollScale: number;
  };
  features: LandscapeFeature[];
}

export const LANDSCAPE = landscapeJson as unknown as LandscapeDoc;

interface Rect { minX: number; maxX: number; minZ: number; maxZ: number }

/** Every flat site the macro relief keeps off: reserve markers, the fort, the airfield and each region's calm spots. */
function keepFlat(): Rect[] {
  const out: Rect[] = [];
  out.push({ minX: BASE.minX, maxX: BASE.maxX, minZ: BASE.minZ, maxZ: BASE.maxZ });
  const hx = Math.abs(Math.sin(AIRFIELD.yaw)) * AIRFIELD.length / 2 + Math.abs(Math.cos(AIRFIELD.yaw)) * AIRFIELD.width / 2;
  const hz = Math.abs(Math.cos(AIRFIELD.yaw)) * AIRFIELD.length / 2 + Math.abs(Math.sin(AIRFIELD.yaw)) * AIRFIELD.width / 2;
  out.push({ minX: AIRFIELD.x - hx, maxX: AIRFIELD.x + hx, minZ: AIRFIELD.z - hz, maxZ: AIRFIELD.z + hz });
  for (const p of AIRFIELD.planeSpots) out.push({ minX: p.x - 8, maxX: p.x + 8, minZ: p.z - 8, maxZ: p.z + 8 });
  // Reserve markers and flat slots (sites.ts); a slot with natural ground (flat: false) keeps its hills.
  for (const r of reservedRects({ flatOnly: true })) out.push({ minX: r.minX, maxX: r.maxX, minZ: r.minZ, maxZ: r.maxZ });
  for (const id of REGION_IDS) {
    const o = LAYOUT.regions.find((r) => r.id === id)!.origin;
    for (const f of REGION_DOCS[id].data.terrain?.features ?? []) {
      if (f.kind !== 'calm' || f.r === undefined || f.points.length === 0) continue;
      const [x, z] = [f.points[0][0] + o.x, f.points[0][1] + o.z];
      out.push({ minX: x - f.r, maxX: x + f.r, minZ: z - f.r, maxZ: z + f.r });
    }
  }
  return out;
}

const SITES = keepFlat();
const TRAILS = trails();
const TRAIL_BOUNDS = TRAILS.map((t) => {
  const xs = t.points.map((p) => p[0]), zs = t.points.map((p) => p[1]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) };
});
const P = LANDSCAPE.params;

/** How much macro relief shows at (x, z): 0 on roads, trails, water, sites and Turfton; 1 in open country. */
export function macroMaskAt(x: number, z: number): number {
  const cd = Math.max(Math.abs(x), Math.abs(z)) - CITY_HALF;
  let m = smoothstep(P.cityClear, P.cityClear + P.cityFade, cd);
  if (m <= 0) return 0;
  m *= smoothstep(P.roadClear, P.roadClear + P.roadFade, roadDistAt(x, z));
  if (m <= 0) return 0;
  m *= smoothstep(P.waterClear, P.waterClear + P.waterFade, waterDistAt(x, z));
  if (m <= 0) return 0;
  const reach = P.siteClear + P.siteFade;
  for (const r of SITES) {
    const dx = Math.max(r.minX - x, 0, x - r.maxX), dz = Math.max(r.minZ - z, 0, z - r.maxZ);
    if (dx >= reach || dz >= reach) continue;
    m *= smoothstep(P.siteClear, reach, Math.hypot(dx, dz));
    if (m <= 0) return 0;
  }
  const treach = P.trailClear + P.trailFade;
  for (let i = 0; i < TRAILS.length; i++) {
    // Cheap skip: a point outside the trail's box grown by the fade reach is past the fade (same result, far faster).
    const tb = TRAIL_BOUNDS[i];
    if (x < tb.minX - treach || x > tb.maxX + treach || z < tb.minZ - treach || z > tb.maxZ + treach) continue;
    // E13: the Anthill road climbs the mound it would otherwise erase (the kernel skips it too: trail meta slot 7).
    if (TRAILS[i].id === 'trail/anthill-road') continue;
    const d = distToPolyline(x, z, TRAILS[i].points);
    if (d < treach) m *= smoothstep(P.trailClear, treach, d);
    if (m <= 0) return 0;
  }
  return m;
}

/** Bounding boxes of the features (for a cheap skip). */
const BOUNDS = LANDSCAPE.features.map((f) => {
  const xs = f.points.map((p) => p[0]), zs = f.points.map((p) => p[1]);
  const pad = f.r * 1.3;
  return { minX: Math.min(...xs) - pad, maxX: Math.max(...xs) + pad, minZ: Math.min(...zs) - pad, maxZ: Math.max(...zs) + pad };
});

/** One feature's height at (x, z), unmasked. */
export function featureHeightAt(f: LandscapeFeature, x: number, z: number, index = 0): number {
  const seed = f.seed ?? 500 + index * 17;
  if (f.kind === 'hill') {
    const [cx, cz] = f.points[0];
    // A lumpy outline: the radius wobbles by +-20 % with the bearing.
    const wob = 1 + 0.2 * fbm((x - cx) / (f.r * 0.8), (z - cz) / (f.r * 0.8), seed, 2);
    const u = Math.hypot(x - cx, z - cz) / (f.r * wob);
    if (u >= 1) return 0;
    const s = 1 - u * u;
    return f.h * s * s;
  }
  if (f.kind === 'mountain') {
    const [cx, cz] = f.points[0];
    const wob = 1 + 0.25 * fbm((x - cx) / (f.r * 0.6), (z - cz) / (f.r * 0.6), seed, 3);
    const u = Math.hypot(x - cx, z - cz) / (f.r * wob);
    if (u >= 1) return 0;
    // Concave flanks (steeper near the top), with ridged shoulders running down them.
    const base = Math.pow(1 - u, 1.7);
    const ribs = 0.75 + 0.25 * ridged(x / (f.r * 0.35), z / (f.r * 0.35), seed + 3, 2);
    return f.h * base * ribs * smoothstep(1, 0.85, u);
  }
  // Ridge: distance to the spine, crest tapering to 0 at both ends.
  const { d, s, len } = nearestOnPolyline(x, z, f.points);
  const wob = 1 + 0.25 * fbm(x / 90, z / 90, seed, 2);
  const u = d / (f.r * wob);
  if (u >= 1) return 0;
  const t = len > 0 ? s / len : 0.5;
  const taper = smoothstep(0, 0.18, t) * smoothstep(1, 0.82, t);
  const crest = 0.8 + 0.2 * fbm(s / 70, 0, seed + 7, 2);
  const across = (1 - u * u) * (1 - u * u);
  return f.h * taper * crest * across;
}

/** The world rim and rolling ground, unmasked. */
function backgroundAt(x: number, z: number): number {
  const edge = WORLD_HALF - Math.max(Math.abs(x), Math.abs(z));
  let h = 0;
  if (edge < P.rimWidth) {
    const w = 0.6 + 0.4 * fbm(x / 130, z / 130, 911, 3);
    h += P.rimHeight * w * smoothstep(P.rimWidth, 0, edge);
  }
  if (P.roll > 0) h += P.roll * fbm(x / P.rollScale, z / P.rollScale, 733, 3);
  return h;
}

/** The macro relief at (x, z), metres, masked (terrain.ts adds it to the natural height). */
export function macroAt(x: number, z: number): number {
  const m = macroMaskAt(x, z);
  if (m <= 0) return 0;
  // Features overlap by taking the higher, so two hills merge into one massif instead of stacking.
  let top = 0;
  for (let i = 0; i < LANDSCAPE.features.length; i++) {
    const b = BOUNDS[i];
    if (x < b.minX || x > b.maxX || z < b.minZ || z > b.maxZ) continue;
    top = Math.max(top, featureHeightAt(LANDSCAPE.features[i], x, z, i));
  }
  const h = backgroundAt(x, z) + top;
  return h === 0 ? 0 : h * m;
}
