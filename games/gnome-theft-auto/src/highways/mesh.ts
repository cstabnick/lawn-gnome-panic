// Skyway meshes (Epic H2, docs/roadmaps/gta-highways.md): every skyway's deck, rails, embankment and viaduct sides, column
// bents, lane markings and open-end barrier, in one group. The geometry decisions come from deck.ts and colliders.ts, so
// what is drawn matches what the bodies collide with. Built in the game, not as a prefab (infrastructure, like roads).
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { heightAt } from '../terrain';
import { undersideMat } from '../undersides';
import { type Bent, skywayBents } from './colliders';
import { branchTrim, deckContactsAt, deckSamples, railGaps, skywayDefs, skywayLength } from './deck';
import { footConnectors } from './roads';
import { SKYWAY, kindOf, type SkywayDef } from './skyways';

type V3 = { x: number; y: number; z: number };

/** A cross-section of a deck: the centre line point, its deck top, and the unit travel and right-of-travel vectors. */
interface Frame {
  x: number; y: number; z: number;
  dx: number; dz: number;
  /** Right of travel (dirZ, -dirX). */
  rx: number; rz: number;
  along: number;
  land: number;
  solid: boolean;
}

const RAIL_WIDTH = 0.3;
const DASH_LIFT = 0.02;

/**
 * A centre-line turn sharper than this (radians) is mitred at its joint. Set well below the 20 degrees of the issue:
 * averaging a 19 degree joint leaked the previous leg's direction into the first 2 m past it (a 0.9 m rail shift).
 */
const MITRE_TURN = (1 * Math.PI) / 180;

/** A sharp joint of a skyway: its distance along, the mitred travel direction, and cos(turn / 2). */
interface Joint { along: number; dx: number; dz: number; cosHalf: number }

/** The joints where a skyway's centre line turns by more than MITRE_TURN (same lengths as deck.ts's legs). */
function jointsOf(def: SkywayDef): Joint[] {
  const pts = def.points;
  const out: Joint[] = [];
  let along = 0;
  for (let k = 1; k + 1 < pts.length; k++) {
    const l1 = Math.hypot(pts[k].x - pts[k - 1].x, pts[k].z - pts[k - 1].z) || 1e-9;
    along += l1;
    const ax = (pts[k].x - pts[k - 1].x) / l1;
    const az = (pts[k].z - pts[k - 1].z) / l1;
    const l2 = Math.hypot(pts[k + 1].x - pts[k].x, pts[k + 1].z - pts[k].z) || 1e-9;
    const bx = (pts[k + 1].x - pts[k].x) / l2;
    const bz = (pts[k + 1].z - pts[k].z) / l2;
    const dot = Math.max(-1, Math.min(1, ax * bx + az * bz));
    if (Math.acos(dot) <= MITRE_TURN) continue;
    const sx = ax + bx;
    const sz = az + bz;
    const l = Math.hypot(sx, sz) || 1;
    out.push({ along, dx: sx / l, dz: sz / l, cosHalf: Math.sqrt((1 + dot) / 2) });
  }
  return out;
}

/**
 * Frames at every 2 m sample. Interior samples average their neighbours' directions, so gentle bends mitre with no gap.
 * A sharp joint gets one frame with the bisector direction and a right vector scaled by 1 / cos(turn / 2) (a true mitre);
 * the 2 m frames within (width / 2 + 0.6) of it are dropped, since their averaged directions would fold the edges.
 */
function framesOf(def: SkywayDef): Frame[] {
  const s = deckSamples(def.id, 2);
  const joints = jointsOf(def);
  const zone = def.width / 2 + 0.6;
  const out: Frame[] = [];
  s.forEach((p, i) => {
    const j = joints.find((q) => Math.abs(p.along - q.along) <= zone);
    if (j) {
      if (Math.abs(p.along - j.along) < 1e-6) {
        out.push({
          x: p.x, y: p.y, z: p.z, dx: j.dx, dz: j.dz,
          rx: j.dz / j.cosHalf, rz: -j.dx / j.cosHalf, along: p.along, land: p.land, solid: p.solid,
        });
      }
      return;
    }
    const a = s[Math.max(0, i - 1)];
    const b = s[Math.min(s.length - 1, i + 1)];
    let dx = a.dirX + b.dirX;
    let dz = a.dirZ + b.dirZ;
    const l = Math.hypot(dx, dz);
    if (l < 1e-9) { dx = p.dirX; dz = p.dirZ; } else { dx /= l; dz /= l; }
    out.push({ x: p.x, y: p.y, z: p.z, dx, dz, rx: dz, rz: -dx, along: p.along, land: p.land, solid: p.solid });
  });
  return out;
}

/** The frame at a distance along the centre line (linear between the frames around it). */
function frameAt(fs: Frame[], along: number): Frame {
  let k = 0;
  while (k < fs.length - 2 && fs[k + 1].along < along) k++;
  const a = fs[k];
  const b = fs[k + 1];
  const span = b.along - a.along;
  const t = span > 1e-9 ? Math.max(0, Math.min(1, (along - a.along) / span)) : 0;
  const dx = a.dx + (b.dx - a.dx) * t;
  const dz = a.dz + (b.dz - a.dz) * t;
  const l = Math.hypot(dx, dz) || 1;
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
    dx: dx / l, dz: dz / l, rx: a.rx + (b.rx - a.rx) * t, rz: a.rz + (b.rz - a.rz) * t,
    along, land: a.land + (b.land - a.land) * t, solid: a.solid,
  };
}

/** The frames from distance a to b along the centre line, both ends included. */
function sliceFrames(fs: Frame[], a: number, b: number): Frame[] {
  const out = [frameAt(fs, a)];
  for (const f of fs) if (f.along > a && f.along < b) out.push(f);
  out.push(frameAt(fs, b));
  return out;
}

/** The point `o` metres to the right of a frame (negative = left), at height y. */
const at = (f: Frame, o: number, y: number): V3 => ({ x: f.x + f.rx * o, y, z: f.z + f.rz * o });

/** Collects triangles over shared vertex lines. Each strip(a, b) joins two polylines with quads. */
class Soup {
  readonly pos: number[] = [];
  readonly idx: number[] = [];

  line(pts: readonly V3[]): number[] {
    return pts.map((p) => {
      this.pos.push(p.x, p.y, p.z);
      return this.pos.length / 3 - 1;
    });
  }

  strip(a: number[], b: number[]): void {
    for (let i = 0; i + 1 < a.length; i++) {
      this.idx.push(a[i], a[i + 1], b[i], a[i + 1], b[i + 1], b[i]);
    }
  }

  geometry(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setIndex(this.idx);
    g.computeVertexNormals();
    return g;
  }
}

/** A box of size w x h x d (d along the travel direction when yaw = atan2(dirX, dirZ)), centred on (x, y, z). */
function boxAt(w: number, h: number, d: number, x: number, y: number, z: number, yaw: number): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  g.rotateY(yaw);
  g.translate(x, y, z);
  return g;
}

/** Deck slab: one ribbon with two groups (0 = asphalt top, 1 = concrete sides and bottom). Returns the geometry. */
function deckGeometry(def: SkywayDef, fs: Frame[]): THREE.BufferGeometry {
  const hw = def.width / 2 + 0.4;
  const soup = new Soup();
  const bottomY = (f: Frame) => (f.solid ? f.land - 0.5 : f.y - SKYWAY.slab);

  soup.strip(soup.line(fs.map((f) => at(f, -hw, f.y))), soup.line(fs.map((f) => at(f, hw, f.y))));
  const topCount = soup.idx.length;

  const topLeft = soup.line(fs.map((f) => at(f, -hw, f.y)));
  const topRight = soup.line(fs.map((f) => at(f, hw, f.y)));
  const botLeft = soup.line(fs.map((f) => at(f, -hw, bottomY(f))));
  const botRight = soup.line(fs.map((f) => at(f, hw, bottomY(f))));
  soup.strip(topRight, botRight); // right side
  soup.strip(botLeft, topLeft); // left side
  soup.strip(botRight, botLeft); // underside

  const geo = soup.geometry();
  geo.addGroup(0, topCount, 0);
  geo.addGroup(topCount, soup.idx.length - topCount, 1);
  return geo;
}

/** How a skyway is dressed: a road (asphalt, rails, lane lines) or a site ramp (planks, timber rails). */
interface Style {
  top: THREE.Material;
  sides: THREE.Material;
  rail: THREE.Material;
  railWidth: number;
  railHeight: number;
}

/** The stretches of one rail side inside [u, v] that are not open (a crack or junction gap). */
function railRuns(id: string, side: 1 | -1, u: number, v: number): [number, number][] {
  const out: [number, number][] = [];
  let at0 = u;
  for (const g of railGaps(id)) {
    if (g.side !== side || g.to <= at0 || g.from >= v) continue;
    if (g.from > at0) out.push([at0, g.from]);
    at0 = Math.max(at0, g.to);
  }
  if (at0 < v) out.push([at0, v]);
  return out.filter(([a, b]) => b - a > 0.05);
}

/** Two rails along the deck from u to v, each style.railWidth wide, standing on the deck top; open across every gap. */
function railGeometry(def: SkywayDef, fs: Frame[], u: number, v: number, style: Style): THREE.BufferGeometry {
  const soup = new Soup();
  const half = def.width / 2;
  const top = (f: Frame) => f.y + style.railHeight;
  for (const side of [-1, 1] as const) {
    const outer = side * (half + style.railWidth);
    const inner = side * half;
    for (const [a, b] of railRuns(def.id, side, u, v)) {
      const f = sliceFrames(fs, a, b);
      const outerBot = soup.line(f.map((p) => at(p, outer, p.y)));
      const outerTop = soup.line(f.map((p) => at(p, outer, top(p))));
      const innerTop = soup.line(f.map((p) => at(p, inner, top(p))));
      const innerBot = soup.line(f.map((p) => at(p, inner, p.y)));
      soup.strip(outerBot, outerTop);
      soup.strip(outerTop, innerTop);
      soup.strip(innerTop, innerBot);
    }
  }
  return soup.geometry();
}

const STUB_LEN = 0.6;
const STUB_TILT = (25 * Math.PI) / 180;

/**
 * Broken rail stubs at each crack: a 0.6 m piece hanging into the gap from each end, 0.05 m clear of the standing rail,
 * leaning outwards 25 degrees about the deck direction and 0.15 m lower than the rail top.
 */
function crackStubGeometry(def: SkywayDef, fs: Frame[], style: Style): THREE.BufferGeometry | null {
  const parts: THREE.BufferGeometry[] = [];
  const half = def.width / 2;
  for (const g of railGaps(def.id)) {
    if (g.kind !== 'crack') continue;
    for (const [end, dir] of [[g.from, 1], [g.to, -1]] as const) {
      const f = frameAt(fs, end + dir * (0.05 + STUB_LEN / 2));
      const p = at(f, g.side * (half + style.railWidth / 2), 0);
      const geo = new THREE.BoxGeometry(style.railWidth, style.railHeight, STUB_LEN);
      geo.rotateZ(-g.side * STUB_TILT);
      geo.rotateY(Math.atan2(f.dx, f.dz));
      geo.translate(p.x, f.y + style.railHeight / 2 - 0.15, p.z);
      parts.push(geo);
    }
  }
  return parts.length > 0 ? mergeGeometries(parts, false) : null;
}

/** Dashed centre line and solid edge lines over u..v, drawn as flat quads a hair above the deck top. */
function addMarkings(yellow: Soup, white: Soup, def: SkywayDef, fs: Frame[], u: number, v: number): void {
  for (let a = Math.ceil(u / 6) * 6; a < v; a += 6) {
    const b = Math.min(a + 3, v);
    const f = sliceFrames(fs, a, b);
    yellow.strip(
      yellow.line(f.map((p) => at(p, -0.125, p.y + DASH_LIFT))),
      yellow.line(f.map((p) => at(p, 0.125, p.y + DASH_LIFT))),
    );
  }
  const f = sliceFrames(fs, u, v);
  const edge = def.width / 2 - 0.6;
  for (const side of [-1, 1]) {
    const c = side * edge;
    white.strip(
      white.line(f.map((p) => at(p, c - 0.1, p.y + DASH_LIFT))),
      white.line(f.map((p) => at(p, c + 0.1, p.y + DASH_LIFT))),
    );
  }
}

/** Consecutive equal stretches of at most CHUNK metres covering a..b, so each big ribbon culls on its own. */
const CHUNK = 120;
function chunksOf(a: number, b: number): [number, number][] {
  const n = Math.max(1, Math.ceil((b - a) / CHUNK));
  const len = (b - a) / n;
  return Array.from({ length: n }, (_, k): [number, number] => [a + k * len, k === n - 1 ? b : a + (k + 1) * len]);
}

function hasTris(g: THREE.BufferGeometry): boolean {
  return (g.getIndex()?.count ?? 0) > 0;
}

function addMesh(group: THREE.Group, geo: THREE.BufferGeometry, mat: THREE.Material, name: string): void {
  if (!hasTris(geo)) return;
  const m = new THREE.Mesh(geo, mat);
  m.name = name;
  group.add(m);
}

/** One column bent: its columns and the cap beam across them (the beam's top sits 0.05 below the deck underside). */
function bentGeometries(b: Bent): THREE.BufferGeometry[] {
  const cs = SKYWAY.columnSize;
  const out: THREE.BufferGeometry[] = [];
  const y0 = b.land - 0.3;
  const y1 = b.deckY - SKYWAY.slab;
  for (const c of b.columns) out.push(boxAt(cs, y1 - y0, cs, c.x, (y0 + y1) / 2, c.z, 0));
  const [c0, c1] = b.columns;
  // 0.1 past each column face, so the beam ends never share a plane with a column side.
  const span = Math.hypot(c1.x - c0.x, c1.z - c0.z) + cs + 0.2;
  const beamTop = b.deckY - SKYWAY.slab - 0.05;
  out.push(boxAt(span, 0.8, 0.9, b.x, beamTop - 0.4, b.z, Math.atan2(b.dirX, b.dirZ)));
  return out;
}

const SLIP_WIDTH = 8;

/** Flat asphalt strips from each road ramp foot to the highway it joins, one merged geometry, on the land. */
function slipRoadGeometry(): THREE.BufferGeometry {
  const soup = new Soup();
  for (const c of footConnectors()) {
    const dx0 = c.to.x - c.foot.x;
    const dz0 = c.to.z - c.foot.z;
    const len = Math.hypot(dx0, dz0);
    if (len < 1e-6) continue;
    const dx = dx0 / len;
    const dz = dz0 / len;
    const n = Math.max(1, Math.ceil(len / 2));
    const left: V3[] = [];
    const right: V3[] = [];
    for (let i = 0; i <= n; i++) {
      const x = c.foot.x + (dx0 * i) / n;
      const z = c.foot.z + (dz0 * i) / n;
      const y = heightAt(x, z) + 0.012; // under the highway asphalt and its markings where they overlap (they draw over it)
      left.push({ x: x - (dz * SLIP_WIDTH) / 2, y, z: z + (dx * SLIP_WIDTH) / 2 });
      right.push({ x: x + (dz * SLIP_WIDTH) / 2, y, z: z - (dx * SLIP_WIDTH) / 2 });
    }
    soup.strip(soup.line(left), soup.line(right));
  }
  return soup.geometry();
}

/** Every skyway's deck, rails, column bents, lane markings and open-end barrier, in one group named 'skyways'. */
export function buildSkywayMeshes(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'skyways';

  const asphalt = new THREE.MeshStandardMaterial({ color: 0x55555b, roughness: 1 });
  const concrete = new THREE.MeshStandardMaterial({ color: 0xb9b2a4 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0xd8d2c4, side: THREE.DoubleSide });
  const yellowMat = flatLayer(new THREE.MeshBasicMaterial({ color: 0xf2e7a6, side: THREE.DoubleSide }), LAYER.marking);
  const whiteMat = flatLayer(new THREE.MeshBasicMaterial({ color: 0xf4f4f4, side: THREE.DoubleSide }), LAYER.marking);
  const redMat = new THREE.MeshStandardMaterial({ color: 0xd94f3d });
  const plank = new THREE.MeshStandardMaterial({ color: 0x9a7448, roughness: 1 });
  const timber = new THREE.MeshStandardMaterial({ color: 0x6b4f32 });
  // Deck sides and undersides: an emissive floor so a deck seen from below is not a black lid (columns keep the plain ones).
  const concreteDeck = undersideMat(0xb9b2a4);
  const timberDeck = undersideMat(0x6b4f32, { roughness: 1 });
  const slipMat = flatLayer(new THREE.MeshStandardMaterial({ color: 0x55555b, roughness: 1 }), LAYER.tint);
  const road: Style = { top: asphalt, sides: concreteDeck, rail: railMat, railWidth: RAIL_WIDTH, railHeight: SKYWAY.railHeight };
  const site: Style = { top: plank, sides: timberDeck, rail: timber, railWidth: 0.15, railHeight: 0.7 };

  const barrierBoards: THREE.BufferGeometry[] = [];
  const barrierPosts: THREE.BufferGeometry[] = [];
  const bents = skywayBents();

  for (const def of skywayDefs()) {
    const isSite = kindOf(def) === 'site';
    const style = isSite ? site : road;
    const fs = framesOf(def);
    // A branch's first and last metres lie inside its parent's deck: they are drawn by the parent, not here.
    const trim = branchTrim(def.id);
    const a0 = trim.start;
    const a1 = skywayLength(def.id) - trim.end;
    const chunks = chunksOf(a0, a1);

    const pillars: THREE.BufferGeometry[][] = chunks.map(() => []);
    for (const b of bents) {
      if (b.skyway !== def.id) continue;
      const along = deckContactsAt(b.x, b.z).find((c) => c.skyway.id === def.id)?.along ?? a0;
      const k = Math.max(0, chunks.findIndex(([, v]) => along < v));
      pillars[k].push(...bentGeometries(b));
    }

    chunks.forEach(([u, v], k) => {
      const deck = new THREE.Mesh(deckGeometry(def, sliceFrames(fs, u, v)), [style.top, style.sides]);
      deck.name = `${def.id}-deck-${k}`;
      deck.castShadow = true;
      deck.receiveShadow = true;
      group.add(deck);

      addMesh(group, railGeometry(def, fs, u, v, style), style.rail, `${def.id}-rails-${k}`);

      if (!isSite) {
        const yellow = new Soup();
        const white = new Soup();
        addMarkings(yellow, white, def, fs, u, v);
        addMesh(group, yellow.geometry(), yellowMat, `${def.id}-dashes-${k}`);
        addMesh(group, white.geometry(), whiteMat, `${def.id}-edges-${k}`);
      }

      const merged = pillars[k].length > 0 ? mergeGeometries(pillars[k], false) : null;
      if (merged && hasTris(merged)) {
        const columns = new THREE.Mesh(merged, isSite ? timber : concrete);
        columns.name = `${def.id}-columns-${k}`;
        columns.castShadow = true;
        columns.receiveShadow = true;
        group.add(columns);
      }
    });

    const stubs = crackStubGeometry(def, fs, style);
    if (stubs) addMesh(group, stubs, style.rail, `${def.id}-rail-stubs`);

    if (def.openEnd) {
      // Barrier across the deck, one metre short of its end: two boards on two posts.
      const f = frameAt(fs, fs[fs.length - 1].along - 1);
      const yaw = Math.atan2(f.dx, f.dz);
      for (const h of [0.4, 1.0]) {
        barrierBoards.push(boxAt(def.width - 1, 0.6, 0.15, f.x, f.y + h, f.z, yaw));
      }
      for (const side of [-1, 1]) {
        const p = at(f, (side * (def.width - 1)) / 2, f.y);
        // 1.27 tall, so the post tops sit 3 cm under the top board (1.3), never level with it.
        barrierPosts.push(boxAt(0.3, 1.27, 0.3, p.x, f.y + 0.635, p.z, 0));
      }
    }
  }

  // Ramp feet's slip roads: one merged strip per foot, on the land.
  addMesh(group, slipRoadGeometry(), slipMat, 'skyway-slip-roads');

  if (barrierBoards.length > 0) {
    const boards = new THREE.Mesh(mergeGeometries(barrierBoards, false) ?? new THREE.BufferGeometry(), redMat);
    boards.name = 'skyway-barrier-boards';
    group.add(boards);
    const posts = new THREE.Mesh(mergeGeometries(barrierPosts, false) ?? new THREE.BufferGeometry(), railMat);
    posts.name = 'skyway-barrier-posts';
    group.add(posts);
  }

  return group;
}
