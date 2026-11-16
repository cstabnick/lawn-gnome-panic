// Terrain: the open world's shape as pure data, no three.js. One height field over every zone, the ridge between zones
// and the road passes through it, where a walker may stand (ground, decks and ramps), colliders, flora placement per
// chunk, ground colours and the theme at a point. world.ts draws it; player, entities, camera and pathfinding query it.
//
// Every position here is a world position (content.ts moved each zone by its origin from src/data/layout.ts).
import { TUNING, WORLD, type Deck, type ZoneDef, type ZoneExit, type ZoneId } from './config';
import { OBJECTS, ZONES } from './content';
import { FURNITURE_RADIUS } from './data/interiors';
import { checkCondition } from './quests';

// ---------------------------------------------------------------- helpers

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function distToSeg(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax, dz = bz - az;
  const len2 = dx * dx + dz * dz;
  const t = len2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / len2)) : 0;
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}

function mulberry32(a: number): () => number {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const ALL: readonly ZoneDef[] = Object.values(ZONES);
const OUTDOOR: readonly ZoneDef[] = ALL.filter((z) => !z.indoor);
const INDOOR: readonly ZoneDef[] = ALL.filter((z) => z.indoor);
/** Every instance (the Deeps, house interiors) lies south of this; overworld queries skip them all. */
const INSTANCES_FROM_Z = WORLD.instanceZ - 400;

const INTERIORS: readonly ZoneDef[] = INDOOR.filter((z) => z.interior);
/** The building interior whose dark surroundings (x, z) lies in (within 300 m of its square), or null. */
function interiorNear(x: number, z: number): ZoneDef | null {
  if (z <= INSTANCES_FROM_Z) return null;
  for (const def of INTERIORS) if (zoneRectDistance(def.id, x, z) < 300) return def;
  return null;
}

/** For a building interior: (x, z) relative to the room centre, and whether it is on the room's floor. */
function roomLocal(def: ZoneDef, x: number, z: number): { lx: number; lz: number; inRoom: boolean } {
  const o = origin(def);
  const lx = x - o.x, lz = z - o.z;
  const inf = def.interior!;
  return { lx, lz, inRoom: Math.abs(lx) <= inf.hw + 0.4 && Math.abs(lz) <= inf.hd + 0.4 };
}

function origin(def: ZoneDef): { x: number; z: number } {
  return def.origin ?? { x: 0, z: 0 };
}

/** Signed distance from (x, z) to a zone's square: negative inside (how deep), positive outside. */
export function zoneRectDistance(id: ZoneId, x: number, z: number): number {
  const def = ZONES[id];
  const o = origin(def);
  return Math.max(Math.abs(x - o.x), Math.abs(z - o.z)) - def.half;
}

/** The zone whose square contains (x, z), or null in the Wilds between zones. */
export function zoneAt(x: number, z: number): ZoneId | null {
  for (const def of z > INSTANCES_FROM_Z ? ALL : OUTDOOR) if (zoneRectDistance(def.id, x, z) <= 0) return def.id;
  return null;
}

/** The outdoor zone nearest to (x, z) (the one containing it, if any). For themes and flora in the Wilds. */
function nearestOutdoor(x: number, z: number): ZoneDef {
  let best = OUTDOOR[0];
  let bestD = Infinity;
  for (const def of OUTDOOR) {
    const d = zoneRectDistance(def.id, x, z);
    if (d < bestD) { bestD = d; best = def; }
  }
  return best;
}

/** The zone to draw and dress (x, z) as: the containing zone, else the nearest outdoor zone. */
export function themeZoneAt(x: number, z: number): ZoneDef {
  const id = zoneAt(x, z);
  return id ? ZONES[id] : nearestOutdoor(x, z);
}

// ---------------------------------------------------------------- roads and passes

export interface RoadSeg { ax: number; az: number; bx: number; bz: number }

/** A road between two outdoor zones: from `a`'s exit to `b`'s exit. Open when both exits' conditions hold. */
export interface Pass { from: ZoneId; to: ZoneId; a: ZoneExit; b: ZoneExit }

let roads: RoadSeg[] | null = null;
let passList: Pass[] = [];
/** Segments the ridge is cut along: every pass, plus the in-zone road from the shrine to each pass exit. */
let cutRoads: RoadSeg[] = [];

function initRoads(): void {
  if (roads) return;
  roads = [];
  passList = [];
  cutRoads = [];
  for (const def of ALL) {
    const s = def.shrine;
    const far = (x: number, z: number) => Math.hypot(x - s.x, z - s.z) > 1;
    for (const r of def.regions) if (far(r.x, r.z)) roads.push({ ax: s.x, az: s.z, bx: r.x, bz: r.z });
    for (const e of def.exits) if (far(e.x, e.z)) roads.push({ ax: s.x, az: s.z, bx: e.x, bz: e.z });
  }
  for (const def of OUTDOOR) {
    for (const a of def.exits) {
      const other = ZONES[a.to];
      if (a.to === def.id || other.indoor) continue;
      // Each pair once: from the zone that sorts first.
      if (def.id > a.to) continue;
      const b = other.exits.find((e) => e.to === def.id);
      if (!b) continue;
      passList.push({ from: def.id, to: a.to, a, b });
      const seg = { ax: a.x, az: a.z, bx: b.x, bz: b.z };
      roads.push(seg);
      cutRoads.push(seg);
      for (const [zone, e] of [[def, a], [other, b]] as const) {
        cutRoads.push({ ax: zone.shrine.x, az: zone.shrine.z, bx: e.x, bz: e.z });
      }
    }
  }
}

/** Every road: shrine to region, shrine to exit, and the passes between zones. For drawing and for keeping flora off. */
export function roadSegments(): readonly RoadSeg[] {
  initRoads();
  return roads!;
}

/** The roads between zones. A pass is open when checkCondition holds for both its exits' `when`. */
export function passes(): readonly Pass[] {
  initRoads();
  return passList;
}

export function passOpen(p: Pass): boolean {
  return checkCondition(p.a.when) && checkCondition(p.b.when);
}

export function distToRoad(x: number, z: number): number {
  let best = Infinity;
  for (const s of roadSegments()) best = Math.min(best, distToSeg(x, z, s.ax, s.az, s.bx, s.bz));
  return best;
}

function distToCut(x: number, z: number): number {
  initRoads();
  let best = Infinity;
  for (const s of cutRoads) best = Math.min(best, distToSeg(x, z, s.ax, s.az, s.bx, s.bz));
  return best;
}

/** Distance to the nearest open pass road (Infinity when none is open). */
function distToOpenPass(x: number, z: number): number {
  let best = Infinity;
  for (const p of passes()) {
    if (!passOpen(p)) continue;
    best = Math.min(best, distToSeg(x, z, p.a.x, p.a.z, p.b.x, p.b.z));
  }
  return best;
}

// ---------------------------------------------------------------- height

/** A zone's own rolling ground at a world point, without the edge ridge: hills, flat regions, the burrow, lakes. */
function zoneGround(def: ZoneDef, x: number, z: number): number {
  const o = origin(def);
  const lx = x - o.x, lz = z - o.z;
  let h = def.theme.hilliness * (1.6 * Math.sin(lx * 0.045 + 1.1) * Math.cos(lz * 0.038 - 0.6) + 0.8 * Math.sin((lx + lz) * 0.09) + 0.5 * Math.sin(lx * 0.13 - lz * 0.11));
  for (const r of def.regions) {
    const d = Math.hypot(x - r.x, z - r.z);
    if (d > r.r + 10) continue;
    h *= smoothstep(r.r * 0.8, r.r + 10, d);
    if (r.id === 'burrow') h += 2.5 * Math.exp(-(d * d) / (9 * 9)) - 2 * Math.exp(-(d * d) / (3 * 3));
  }
  for (const lake of def.lakes) {
    const dl = Math.hypot(x - lake.x, z - lake.z);
    if (dl > lake.r * 3) continue;
    h -= 4 * Math.exp(-(dl * dl) / (lake.r * lake.r * 0.6));
  }
  return h;
}

/** The Wilds between zones: plain rolling ground (the ridge is added on top). */
function wildGround(x: number, z: number): number {
  return 1.6 * Math.sin(x * 0.045 + 1.1) * Math.cos(z * 0.038 - 0.6) + 0.8 * Math.sin((x + z) * 0.09) + 0.5 * Math.sin(x * 0.13 - z * 0.11);
}

/** Ground height at (x, z). Deterministic. Zones blend into their neighbours; a ridge rises along every zone's edge
 * (WORLD.ridge high, over the last 28 m) and between zones, except along a pass road, which cuts through it. */
export function heightAt(x: number, z: number): number {
  // Instances stand alone: their own ground plus the edge ridge. A building interior is a flat floor with a dark pit
  // round it (its own walls stand at the room's edge; interiors.ts draws them).
  if (z > INSTANCES_FROM_Z) {
    const room = interiorNear(x, z);
    if (room) return roomLocal(room, x, z).inRoom ? 0 : -3;
    for (const def of INDOOR) {
      const d = zoneRectDistance(def.id, x, z);
      if (d > WORLD.blend) continue;
      return zoneGround(def, x, z) + WORLD.ridge * (1 - smoothstep(0, 28, -d));
    }
  }
  let sumW = 0;
  let sumH = 0;
  let inner = -Infinity;
  for (const def of OUTDOOR) {
    const d = zoneRectDistance(def.id, x, z);
    inner = Math.max(inner, -d);
    if (d >= WORLD.blend) continue;
    const w = 1 - smoothstep(0, WORLD.blend, d);
    sumW += w;
    sumH += w * zoneGround(def, x, z);
  }
  const wildW = Math.max(0, 1 - sumW);
  const base = (sumH + wildW * wildGround(x, z)) / (sumW + wildW);
  const ridgeT = 1 - smoothstep(0, 28, inner);
  if (ridgeT <= 0) return base;
  const cut = smoothstep(WORLD.roadHalfWidth, WORLD.roadHalfWidth + 7, distToCut(x, z));
  // Out here a road is a causeway: never below 0.4 m, so low wild ground cannot flood it. Scaled by ridgeT, so lakes
  // deep inside a zone (Thatchford's river beside its north road) are left alone.
  const causeway = ridgeT * (1 - cut) * Math.max(0, 0.4 - base);
  return base + WORLD.ridge * ridgeT * cut + causeway;
}

// ---------------------------------------------------------------- decks (raised floors) and ramps

interface DeckInfo { deck: Deck; top: number; minX: number; maxX: number; minZ: number; maxZ: number; ramp: { minX: number; maxX: number; minZ: number; maxZ: number; along: 'x' | 'z'; start: number; dir: 1 | -1; len: number } }
let deckInfos: DeckInfo[] | null = null;

function initDecks(): DeckInfo[] {
  if (deckInfos) return deckInfos;
  deckInfos = [];
  for (const def of ALL) {
    for (const d of def.decks ?? []) {
      const top = heightAt(d.x, d.z) + d.y;
      const minX = d.x - d.w / 2, maxX = d.x + d.w / 2, minZ = d.z - d.d / 2, maxZ = d.z + d.d / 2;
      const len = 2 * d.y;
      const hw = 1.2;
      let ramp: DeckInfo['ramp'];
      switch (d.stair) {
        case 's': ramp = { minX: d.x - hw, maxX: d.x + hw, minZ: maxZ, maxZ: maxZ + len, along: 'z', start: maxZ, dir: 1, len }; break;
        case 'n': ramp = { minX: d.x - hw, maxX: d.x + hw, minZ: minZ - len, maxZ: minZ, along: 'z', start: minZ, dir: -1, len }; break;
        case 'e': ramp = { minX: maxX, maxX: maxX + len, minZ: d.z - hw, maxZ: d.z + hw, along: 'x', start: maxX, dir: 1, len }; break;
        default: ramp = { minX: minX - len, maxX: minX, minZ: d.z - hw, maxZ: d.z + hw, along: 'x', start: minX, dir: -1, len }; break;
      }
      deckInfos.push({ deck: d, top, minX, maxX, minZ, maxZ, ramp });
    }
  }
  return deckInfos;
}

/** Every deck with its floor height (world y) and the box its ramp covers. For drawing. */
export function deckLayout(): readonly { deck: Deck; top: number; ramp: { minX: number; maxX: number; minZ: number; maxZ: number } }[] {
  return initDecks();
}

/** Height of a ramp at (x, z), or null when (x, z) is not on it. Runs from the deck's floor down to the ground. */
function rampY(info: DeckInfo, x: number, z: number): number | null {
  const r = info.ramp;
  if (x < r.minX || x > r.maxX || z < r.minZ || z > r.maxZ) return null;
  const p = r.along === 'z' ? z : x;
  const t = Math.min(1, Math.max(0, ((p - r.start) * r.dir) / r.len));
  return info.top + (heightAt(x, z) - info.top) * t;
}

/** Every height a walker could stand at on (x, z), lowest first: the ground, then deck floors and ramps above it. */
export function surfacesAt(x: number, z: number): number[] {
  const out = [heightAt(x, z)];
  for (const info of initDecks()) {
    if (x >= info.minX && x <= info.maxX && z >= info.minZ && z <= info.maxZ) out.push(info.top);
    const ry = rampY(info, x, z);
    if (ry !== null && ry - out[0] > 0.05) out.push(ry);
  }
  return out.sort((a, b) => a - b);
}

/** True when (x, z) at ground level is inside a ramp's solid body (taller than a step above the ground). */
function inRampBody(x: number, z: number): boolean {
  for (const info of initDecks()) {
    const ry = rampY(info, x, z);
    if (ry !== null && ry - heightAt(x, z) > 0.3) return true;
  }
  return false;
}

// ---------------------------------------------------------------- colliders

interface Circle { x: number; z: number; r: number }
const BUCKET = 8;
const colliders = new Map<number, Circle[]>();
const bucketKey = (i: number, j: number) => i * 1_000_003 + j;

/** Adds a ground-level collision circle (blocks walkers within WORLD.groundBand of the ground). world.ts calls this for
 * props it builds (camp tents, standing stones, signposts); terrain adds houses, shrines, walls, deck posts and flora. */
export function addCollider(x: number, z: number, r: number): void {
  for (let i = Math.floor((x - r) / BUCKET); i <= Math.floor((x + r) / BUCKET); i++) {
    for (let j = Math.floor((z - r) / BUCKET); j <= Math.floor((z + r) / BUCKET); j++) {
      const key = bucketKey(i, j);
      let list = colliders.get(key);
      if (!list) { list = []; colliders.set(key, list); }
      list.push({ x, z, r });
    }
  }
}

/** A building interior: the room's walls, its furniture, and its bookshelves and lecterns (which are objects). */
function addInteriorColliders(def: ZoneDef): void {
  const inf = def.interior!;
  const o = origin(def);
  for (let x = -inf.hw; x <= inf.hw; x += 0.75) { addCollider(o.x + x, o.z - inf.hd - 0.4, 0.5); addCollider(o.x + x, o.z + inf.hd + 0.4, 0.5); }
  for (let z = -inf.hd; z <= inf.hd; z += 0.75) { addCollider(o.x - inf.hw - 0.4, o.z + z, 0.5); addCollider(o.x + inf.hw + 0.4, o.z + z, 0.5); }
  for (const f of inf.layout) {
    const r = FURNITURE_RADIUS[f.kind] * (f.scale ?? 1);
    if (r > 0) addCollider(o.x + f.x, o.z + f.z, r);
  }
  for (const ob of Object.values(OBJECTS)) {
    if (ob.zone !== def.id) continue;
    if (ob.model === 'bookshelf') addCollider(ob.x, ob.z, 0.5);
    else if (ob.model === 'lectern') addCollider(ob.x, ob.z, 0.35);
  }
}

let staticDone = false;
function initStaticColliders(): void {
  if (staticDone) return;
  staticDone = true;
  for (const def of ALL) {
    for (const h of def.houses) addCollider(h.x, h.z, h.r * 0.9);
    if (def.interior) {
      addInteriorColliders(def);
      continue;
    }
    addCollider(def.shrine.x, def.shrine.z, 1.2);
    for (const w of def.walls ?? []) {
      const dx = w.x2 - w.x1, dz = w.z2 - w.z1;
      const n = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 1.5));
      for (let i = 0; i <= n; i++) addCollider(w.x1 + (dx * i) / n, w.z1 + (dz * i) / n, 1);
    }
    if (def.indoor) {
      // The ring wall round an instance.
      const o = origin(def);
      const h = def.half - 0.75;
      const ring: [number, number, number, number][] = [[-h, -h, h, -h], [h, -h, h, h], [h, h, -h, h], [-h, h, -h, -h]];
      for (const [x1, z1, x2, z2] of ring) {
        const n = Math.ceil(Math.hypot(x2 - x1, z2 - z1) / 1.5);
        for (let i = 0; i <= n; i++) addCollider(o.x + x1 + ((x2 - x1) * i) / n, o.z + z1 + ((z2 - z1) * i) / n, 1);
      }
    }
  }
  for (const info of initDecks()) {
    for (const px of [info.minX + 0.3, info.maxX - 0.3]) for (const pz of [info.minZ + 0.3, info.maxZ - 0.3]) addCollider(px, pz, 0.35);
  }
}

// ---------------------------------------------------------------- flora (per chunk, deterministic)

export type FloraKind = 'pine' | 'broad' | 'grass' | 'clover' | 'hedge' | 'boulder' | 'pipe' | 'stubble' | 'rock';
/** One flora instance: kind, world position (y is the ground), uniform scale s, and turn about y (rad). */
export interface Flora { kind: FloraKind; x: number; y: number; z: number; s: number; rot: number }

const floraCache = new Map<number, Flora[]>();

/** Trees, rocks and the like may not sit here: near a region, road, lake, house or deck, or in water. */
function clearOfFeatures(def: ZoneDef, x: number, z: number, onRoads: boolean): boolean {
  if (def.regions.some((r) => Math.hypot(x - r.x, z - r.z) < r.r + 5)) return false;
  if (def.lakes.some((l) => Math.hypot(x - l.x, z - l.z) < l.r + 5)) return false;
  if (def.houses.some((h) => Math.hypot(x - h.x, z - h.z) < h.r + 2)) return false;
  if (onRoads && distToRoad(x, z) < 3.5) return false;
  for (const info of initDecks()) {
    if (x > info.ramp.minX - 3 && x < info.ramp.maxX + 3 && z > info.ramp.minZ - 3 && z < info.ramp.maxZ + 3) return false;
    if (x > info.minX - 3 && x < info.maxX + 3 && z > info.minZ - 3 && z < info.maxZ + 3) return false;
  }
  return heightAt(x, z) >= TUNING.waterLevel + 0.5;
}

/** Placement attempts per 64 m chunk for each theme, before floraDensity (the old per-zone counts scaled to a chunk). */
const FLORA_TRIES: Record<ZoneDef['theme']['flora'], number> = {
  mushroom: 23, grass: 64, clover: 36, hedge: 9, rock: 11, pipe: 11, stubble: 50,
};
const COLLIDER_R: Partial<Record<FloraKind, number>> = { pine: 0.6, broad: 0.6, hedge: 1.2, boulder: 0.9, pipe: 0.5, rock: 0.8 };

/** The flora of chunk (ci, cj): the same every call (seeded by the chunk). The first call also adds its colliders. */
export function chunkFlora(ci: number, cj: number): readonly Flora[] {
  const key = bucketKey(ci, cj);
  const cached = floraCache.get(key);
  if (cached) return cached;
  initStaticColliders();
  const out: Flora[] = [];
  floraCache.set(key, out);
  const rng = mulberry32((ci * 73856093) ^ (cj * 19349663) ^ 7);
  const C = WORLD.chunk;
  const x0 = ci * C, z0 = cj * C;
  // No flora in or round a building interior (its floor and the dark pit around it).
  if (interiorNear(x0 + C / 2, z0 + C / 2) || interiorNear(x0, z0) || interiorNear(x0 + C, z0 + C)) return out;
  const inside = (x: number, z: number) => {
    const id = zoneAt(x, z);
    return id !== null || OUTDOOR.some((d) => zoneRectDistance(d.id, x, z) < WORLD.blend * 2);
  };
  const centre = themeZoneAt(x0 + C / 2, z0 + C / 2);
  const tries = Math.round(FLORA_TRIES[centre.theme.flora] * centre.theme.floraDensity);
  for (let i = 0; i < tries; i++) {
    const x = x0 + rng() * C, z = z0 + rng() * C;
    const def = themeZoneAt(x, z);
    const roll = rng(), s0 = rng(), rot = rng() * Math.PI * 2;
    if (!inside(x, z) || !clearOfFeatures(def, x, z, true)) continue;
    let kind: FloraKind;
    let s = 1;
    switch (def.theme.flora) {
      case 'mushroom': kind = roll < 0.5 ? 'pine' : 'broad'; s = 0.9 + s0 * 0.8; break;
      case 'grass': kind = 'grass'; break;
      case 'clover': kind = 'clover'; break;
      case 'hedge': kind = 'hedge'; break;
      case 'rock': kind = 'boulder'; s = 1.2 + s0; break;
      case 'pipe': kind = 'pipe'; break;
      default: kind = 'stubble'; break;
    }
    out.push({ kind, x, y: heightAt(x, z), z, s, rot });
  }
  // Scattered rocks everywhere (about five a chunk).
  for (let i = 0; i < 5; i++) {
    const x = x0 + rng() * C, z = z0 + rng() * C;
    const s = 0.4 + rng() * 1.0, rot = rng() * Math.PI * 2;
    if (!inside(x, z) || !clearOfFeatures(themeZoneAt(x, z), x, z, true)) continue;
    out.push({ kind: 'rock', x, y: heightAt(x, z), z, s, rot });
  }
  for (const f of out) {
    const r = COLLIDER_R[f.kind];
    if (r) addCollider(f.x, f.z, r * (f.kind === 'hedge' || f.kind === 'pipe' ? 1 : f.s));
  }
  return out;
}

/** Makes sure flora colliders exist around (x, z) before a blocking test. */
function ensureFloraAround(x: number, z: number): void {
  const C = WORLD.chunk;
  const i0 = Math.floor((x - 3) / C), i1 = Math.floor((x + 3) / C);
  const j0 = Math.floor((z - 3) / C), j1 = Math.floor((z + 3) / C);
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) if (!floraCache.has(bucketKey(i, j))) chunkFlora(i, j);
}

// ---------------------------------------------------------------- walking

/** True when a closed pass's gate stands at (x, z): the 4.5 m round each end of a pass that is not open yet. */
function atClosedGate(x: number, z: number): boolean {
  for (const p of passes()) {
    if (passOpen(p)) continue;
    if (Math.hypot(x - p.a.x, z - p.a.z) < 4.5 || Math.hypot(x - p.b.x, z - p.b.z) < 4.5) return true;
  }
  return false;
}

/** True where a walker on the ground may not stand: outside every zone (except on an open pass road), within 2 m of a
 * zone's edge, in water, at a closed gate, inside a ramp, or inside a house, tree, rock, wall or shrine. */
export function isBlocked(x: number, z: number): boolean {
  const id = zoneAt(x, z);
  const deepInside = id !== null && zoneRectDistance(id, x, z) <= -2;
  if (id !== null && ZONES[id].interior) {
    const { lx, lz } = roomLocal(ZONES[id], x, z);
    const inf = ZONES[id].interior!;
    if (Math.abs(lx) > inf.hw - 0.35 || Math.abs(lz) > inf.hd - 0.35) return true;
  }
  if (!deepInside && distToOpenPass(x, z) > WORLD.roadHalfWidth) return true;
  if (atClosedGate(x, z)) return true;
  if (heightAt(x, z) < TUNING.waterLevel + 0.1) return true;
  initStaticColliders();
  ensureFloraAround(x, z);
  const list = colliders.get(bucketKey(Math.floor(x / BUCKET), Math.floor(z / BUCKET)));
  if (list) {
    for (const c of list) {
      const dx = x - c.x, dz = z - c.z;
      if (dx * dx + dz * dz < c.r * c.r) return true;
    }
  }
  return inRampBody(x, z);
}

/** True when a walker standing at height y on (x, z) is blocked. At ground level that is isBlocked; above it, the walker
 * needs a deck floor or ramp within WORLD.step of y (railings keep them from stepping off a deck's edge). */
export function isBlockedAt(x: number, z: number, y: number): boolean {
  const ground = heightAt(x, z);
  if (y - ground <= WORLD.step) return isBlocked(x, z);
  return !surfacesAt(x, z).some((s) => s - ground > WORLD.step * 0.5 && Math.abs(s - y) <= WORLD.step);
}

/** Where a walker at height fromY ends up stepping onto (x, z): the surface within WORLD.step of fromY (the closest),
 * or null when there is none or it is blocked. Walking up a ramp onto a deck is a series of such steps. */
export function standY(x: number, z: number, fromY: number): number | null {
  let best: number | null = null;
  for (const s of surfacesAt(x, z)) {
    if (Math.abs(s - fromY) > WORLD.step) continue;
    if (best === null || Math.abs(s - fromY) < Math.abs(best - fromY)) best = s;
  }
  if (best === null || isBlockedAt(x, z, best)) return null;
  return best;
}

// ---------------------------------------------------------------- looks

/** Ground colour at (x, z): roads, lake sand, the burrow and barrows, else the theme's two greens. */
export function groundColourAt(x: number, z: number): number {
  // A building interior: its floor in two shades of the room's palette, and dark all round it.
  const room = interiorNear(x, z);
  if (room) {
    if (!roomLocal(room, x, z).inRoom) return 0x0d0a07;
    const floor = room.interior!.palette.floor;
    if (Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1 < 0.5) return floor;
    const r = Math.round(((floor >> 16) & 255) * 0.94), g = Math.round(((floor >> 8) & 255) * 0.94), b = Math.round((floor & 255) * 0.94);
    return (r << 16) | (g << 8) | b;
  }
  const def = themeZoneAt(x, z);
  if (distToRoad(x, z) < 2.2) return 0x9b7a4c;
  for (const lake of def.lakes) {
    if (Math.hypot(x - lake.x, z - lake.z) < lake.r * 1.5 && heightAt(x, z) < TUNING.waterLevel + 0.6) return 0xd8c78a;
  }
  for (const r of def.regions) {
    if ((r.id === 'burrow' || r.id === 'barrows') && Math.hypot(x - r.x, z - r.z) <= r.r) return r.id === 'burrow' ? 0x6b5038 : 0x6f8a55;
  }
  const t = Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1;
  const { ground, groundAlt } = def.theme;
  if (t < 1 / 3) return ground;
  if (t < 2 / 3) {
    // ground darkened by 3.5%.
    const r = Math.round(((ground >> 16) & 255) * 0.965), g = Math.round(((ground >> 8) & 255) * 0.965), b = Math.round((ground & 255) * 0.965);
    return (r << 16) | (g << 8) | b;
  }
  return groundAlt;
}

/** Name of the region containing (x, z) (within r + 6 of a region of the zone there), or 'the Wilds'. */
export function regionNameAt(x: number, z: number): string {
  const id = zoneAt(x, z);
  if (!id) return 'the Wilds';
  for (const r of ZONES[id].regions) if (Math.hypot(x - r.x, z - r.z) <= r.r + 6) return r.name;
  return 'the Wilds';
}
