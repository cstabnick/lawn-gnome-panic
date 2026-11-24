// Local 404's work sites beside the skyways (docs/roadmaps/gta-skyway-traffic-gps.md): prefab dressing in each site's
// yard (skyways.ts SKYWAY_SITES) and at every crack (rubble, cones, hazard tape, a fallen barrier board), with colliders.
// The plank ramps themselves are site-kind skyways (deck.ts, mesh.ts). Everything here is laid out once, deterministically
// (a seed from the site id), so every client builds the same yard.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { registerCull } from '../cull';
import { heightAt } from '../terrain';
import type { Box } from '../types';
import { deckContactsAt, deckSamples, type DeckSample } from './deck';
import { SKYWAYS, SKYWAY_SITES, type SkywayCrack, type SkywayDef, type SkywaySite } from './skyways';

export interface SkywaySitesBuilt {
  /** Every site's and crack's dressing, one group named 'skyway-sites'. */
  group: THREE.Group;
  /** Colliders for the solid dressing (site office, mixer, portaloo, crane base, barriers); app adds them to world.boxes. */
  boxes: Box[];
}

type Yard = SkywaySite['yard'];
interface Rect { minX: number; maxX: number; minZ: number; maxZ: number }
/** A prefab's extent at its origin (unrotated), from its built bounds. */
interface Extents { minX: number; maxX: number; minZ: number; maxZ: number; maxY: number }
interface Cand { x: number; z: number; yaw: number }
interface Placed { id: string; rect: Rect; x: number; z: number; yaw: number; y: number; top: number }

const SITE_SCALE = 1;
/** A piece keeps this far clear of every deck footprint (its rectangle grown by this), m. */
const DECK_CLEAR = 1.5;
/** Gap kept between two pieces, m. */
const PIECE_GAP = 0.5;
/** A piece counts as touching a yard edge within this distance, m. */
const EDGE_TOUCH = 0.6;
const HALF_PI = Math.PI / 2;
const YAWS = [0, HALF_PI, Math.PI, -HALF_PI];

/** Pieces that stop a body: their colliders go in world.boxes (the crane gets its base only). */
const SOLID = new Set(['site-office', 'site-portaloo', 'site-cement-mixer', 'site-barrier', 'site-tower-crane']);

const extentCache = new Map<string, Extents>();

function extentsOf(id: string): Extents {
  let e = extentCache.get(id);
  if (!e) {
    const b = new THREE.Box3().setFromObject(buildPrefab(id, { scale: SITE_SCALE }));
    e = { minX: b.min.x, maxX: b.max.x, minZ: b.min.z, maxZ: b.max.z, maxY: b.max.y };
    extentCache.set(id, e);
  }
  return e;
}

/** The ground rectangle a prefab covers at origin (x, z) turned by yaw (a multiple of a right angle, so it stays square). */
function rectAt(e: Extents, x: number, z: number, yaw: number): Rect {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const px of [e.minX, e.maxX]) {
    for (const pz of [e.minZ, e.maxZ]) {
      const rx = px * c + pz * s;
      const rz = -px * s + pz * c;
      minX = Math.min(minX, rx); maxX = Math.max(maxX, rx);
      minZ = Math.min(minZ, rz); maxZ = Math.max(maxZ, rz);
    }
  }
  return { minX: x + minX, maxX: x + maxX, minZ: z + minZ, maxZ: z + maxZ };
}

function overlaps(a: Rect, b: Rect, gap: number): boolean {
  return a.minX < b.maxX + gap && b.minX < a.maxX + gap && a.minZ < b.maxZ + gap && b.minZ < a.maxZ + gap;
}

/** True when no deck footprint comes within DECK_CLEAR of the rectangle (sampled every metre over it, grown). */
function deckFree(r: Rect): boolean {
  const w = r.maxX - r.minX + 2 * DECK_CLEAR;
  const d = r.maxZ - r.minZ + 2 * DECK_CLEAR;
  const nx = Math.max(1, Math.ceil(w));
  const nz = Math.max(1, Math.ceil(d));
  for (let i = 0; i <= nx; i++) {
    const x = r.minX - DECK_CLEAR + (w * i) / nx;
    for (let j = 0; j <= nz; j++) {
      const z = r.minZ - DECK_CLEAR + (d * j) / nz;
      if (deckContactsAt(x, z).length > 0) return false;
    }
  }
  return true;
}

/** Seeded random numbers (mulberry32 over an FNV hash of the seed text): the same layout on every client. */
function rngFor(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(list: readonly T[], rnd: () => number): T[] {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Every origin on a 1 m grid over the yard, each in the given yaws. */
function gridCands(yard: Yard, yaws: readonly number[]): Cand[] {
  const out: Cand[] = [];
  for (let x = yard.minX; x <= yard.maxX; x += 1) {
    for (let z = yard.minZ; z <= yard.maxZ; z += 1) {
      for (const yaw of yaws) out.push({ x, z, yaw });
    }
  }
  return out;
}

/**
 * Origins whose piece touches a yard edge, turned to face out of it (a prefab's front is +z). Barriers and cones use these
 * first, so they line the yard's edge.
 */
function edgeCands(yard: Yard, e: Extents): Cand[] {
  const out: Cand[] = [];
  for (let x = yard.minX; x <= yard.maxX; x += 0.5) {
    for (let z = yard.minZ; z <= yard.maxZ; z += 0.5) {
      for (const yaw of YAWS) {
        const r = rectAt(e, x, z, yaw);
        const onEdge =
          (r.minZ - yard.minZ <= EDGE_TOUCH && yaw === Math.PI) ||
          (yard.maxZ - r.maxZ <= EDGE_TOUCH && yaw === 0) ||
          (r.minX - yard.minX <= EDGE_TOUCH && yaw === -HALF_PI) ||
          (yard.maxX - r.maxX <= EDGE_TOUCH && yaw === HALF_PI);
        if (onEdge) out.push({ x, z, yaw });
      }
    }
  }
  return out;
}

/** The first candidate that fits the yard, clears the other pieces and every deck; records it in `occupied`. */
function place(yard: Yard, occupied: Rect[], id: string, cands: readonly Cand[]): Placed | null {
  const e = extentsOf(id);
  for (const c of cands) {
    const r = rectAt(e, c.x, c.z, c.yaw);
    if (r.minX < yard.minX || r.maxX > yard.maxX || r.minZ < yard.minZ || r.maxZ > yard.maxZ) continue;
    if (occupied.some((o) => overlaps(o, r, PIECE_GAP))) continue;
    if (!deckFree(r)) continue;
    // Stand on the highest ground under the piece, so no corner floats.
    const y = Math.max(
      heightAt(c.x, c.z), heightAt(r.minX, r.minZ), heightAt(r.maxX, r.minZ), heightAt(r.minX, r.maxZ), heightAt(r.maxX, r.maxZ),
    );
    occupied.push(r);
    return { id, rect: r, x: c.x, z: c.z, yaw: c.yaw, y, top: y + e.maxY };
  }
  return null;
}

/** A prefab placed in the world: its position, turn and yaw. */
function spawn(p: { id: string; x: number; y: number; z: number; yaw: number }, rotZ = 0): THREE.Group {
  const g = buildPrefab(p.id, { scale: SITE_SCALE });
  g.position.set(p.x, p.y, p.z);
  g.rotation.set(0, p.yaw, rotZ);
  return g;
}

/** The skyway sample nearest to a centre-line distance. */
function nearestSample(samples: readonly DeckSample[], along: number): DeckSample {
  let best = samples[0];
  for (const s of samples) if (Math.abs(s.along - along) < Math.abs(best.along - along)) best = s;
  return best;
}

/** A point `across` metres to the right of the deck's centre line at sample s (negative = left), at the deck top. */
function onDeck(s: DeckSample, across: number): { x: number; z: number; y: number; yaw: number } {
  // Right of travel is (dirZ, -dirX); a prefab's local +z is the travel direction, so yaw = atan2(dirX, dirZ) lines it up.
  return { x: s.x + s.dirZ * across, z: s.z - s.dirX * across, y: s.y, yaw: Math.atan2(s.dirX, s.dirZ) };
}

/** Rubble, cones, hazard tape and a fallen barrier on the deck beside one crack. Decoration only: no colliders. */
function dressCrack(def: SkywayDef, c: SkywayCrack, k: number): THREE.Group {
  const g = new THREE.Group();
  g.name = `skyway-crack-${def.id}-${k}`;
  const samples = deckSamples(def.id, 0.5);
  const half = def.width / 2;
  const from = c.along - c.length / 2;
  const to = c.along + c.length / 2;
  const side = c.side;
  const add = (id: string, p: { x: number; y: number; z: number; yaw: number }, rotZ = 0): void => {
    g.add(spawn({ id, ...p }, rotZ));
  };
  const at = (along: number): DeckSample => nearestSample(samples, along);

  const mid = onDeck(at(c.along), side * (half - 1.5));
  add('site-rubble', mid);
  for (const end of [from - 0.5, to + 0.5]) add('site-cone', onDeck(at(end), side * (half - 1.0)));
  // Tape across the deck at each gap end (its posts 1 m apart across the deck): it never crosses the gap itself.
  for (const end of [from, to]) add('site-hazard-tape', onDeck(at(end), side * (half - 0.5)));
  // A barrier knocked over on its side just past the gap; its lowest point (local x) sits on the deck.
  const bar = onDeck(at(to + 2.5), side * (half - 1.8));
  const lift = -extentsOf('site-barrier').minX;
  add('site-barrier', { x: bar.x, y: bar.y + lift, z: bar.z, yaw: bar.yaw }, Math.PI / 2);

  registerCull(g, 'prop');
  return g;
}

/** The dressing for one work site: an office, mixer, portaloo, crane, plank stack, barriers and cones in the yard. */
function dressSite(site: SkywaySite, root: THREE.Group, boxes: Box[]): void {
  const rnd = rngFor(site.id);
  const yard = site.yard;
  const g = new THREE.Group();
  g.name = `skyway-site-${site.id}`;

  // The badge stays where skyways.ts puts it. Its post is clear of the deck (checked by the test), but its board is
  // allowed to sit closer than DECK_CLEAR: the site's position is fixed data.
  const occupied: Rect[] = [{ minX: site.x - 0.85, maxX: site.x + 0.85, minZ: site.z - 0.15, maxZ: site.z + 0.15 }];
  const signY = heightAt(site.x, site.z);
  g.add(spawn({ id: 'site-sign-local-404', x: site.x, y: signY, z: site.z, yaw: 0 }));

  const grid = gridCands(yard, [0, HALF_PI]);
  const big = ['site-tower-crane', 'site-office', 'site-cement-mixer', 'site-portaloo', 'site-plank-stack'];
  const placed: Placed[] = [];
  for (const id of big) {
    const p = place(yard, occupied, id, shuffled(grid, rnd));
    if (p) placed.push(p);
  }
  const barriers = 4 + Math.floor(rnd() * 3);
  const cones = 6 + Math.floor(rnd() * 5);
  const edgeBarrier = edgeCands(yard, extentsOf('site-barrier'));
  for (let i = 0; i < barriers; i++) {
    const p = place(yard, occupied, 'site-barrier', [...shuffled(edgeBarrier, rnd), ...shuffled(grid, rnd)]);
    if (p) placed.push(p);
  }
  const edgeCone = edgeCands(yard, extentsOf('site-cone'));
  for (let i = 0; i < cones; i++) {
    const p = place(yard, occupied, 'site-cone', [...shuffled(edgeCone, rnd), ...shuffled(grid, rnd)]);
    if (p) placed.push(p);
  }

  for (const p of placed) {
    g.add(spawn(p));
    if (!SOLID.has(p.id)) continue;
    if (p.id === 'site-tower-crane') {
      // The mast is a square at its base; the jib overhangs and is not a collider.
      boxes.push({ minX: p.x - 0.8, maxX: p.x + 0.8, minZ: p.z - 0.8, maxZ: p.z + 0.8, h: p.top });
    } else {
      const r = p.rect;
      boxes.push({ minX: r.minX, maxX: r.maxX, minZ: r.minZ, maxZ: r.maxZ, h: p.top });
    }
  }

  registerCull(g, 'prop');
  root.add(g);
}

export function buildSkywaySites(): SkywaySitesBuilt {
  const group = new THREE.Group();
  group.name = 'skyway-sites';
  const boxes: Box[] = [];
  for (const site of SKYWAY_SITES) dressSite(site, group, boxes);
  for (const def of SKYWAYS) {
    (def.cracks ?? []).forEach((c, k) => group.add(dressCrack(def, c, k)));
  }
  return { group, boxes };
}
