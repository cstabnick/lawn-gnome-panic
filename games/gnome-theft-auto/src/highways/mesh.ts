// Skyway meshes (Epic H2, docs/roadmaps/gta-highways.md): every skyway's deck, rails, embankment and viaduct sides, column
// bents, lane markings and open-end barrier, in one group. The geometry decisions come from deck.ts and colliders.ts, so
// what is drawn matches what the bodies collide with. Built in the game, not as a prefab (infrastructure, like roads).
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { skywayBents } from './colliders';
import { deckSamples, skywayDefs } from './deck';
import { SKYWAY, type SkywayDef } from './skyways';

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

/** Frames at every 2 m sample. Interior samples average their neighbours' directions, so the corners mitre with no gap. */
function framesOf(def: SkywayDef): Frame[] {
  const s = deckSamples(def.id, 2);
  return s.map((p, i) => {
    const a = s[Math.max(0, i - 1)];
    const b = s[Math.min(s.length - 1, i + 1)];
    let dx = a.dirX + b.dirX;
    let dz = a.dirZ + b.dirZ;
    const l = Math.hypot(dx, dz);
    if (l < 1e-9) { dx = p.dirX; dz = p.dirZ; } else { dx /= l; dz /= l; }
    return { x: p.x, y: p.y, z: p.z, dx, dz, rx: dz, rz: -dx, along: p.along, land: p.land, solid: p.solid };
  });
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
    dx: dx / l, dz: dz / l, rx: dz / l, rz: -dx / l,
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

/** Two rails along the deck, each RAIL_WIDTH wide, standing on the deck top: a ribbon of outer, top and inner faces. */
function railGeometry(def: SkywayDef, fs: Frame[]): THREE.BufferGeometry {
  const soup = new Soup();
  const half = def.width / 2;
  for (const side of [-1, 1]) {
    const outer = side * (half + RAIL_WIDTH);
    const inner = side * half;
    const top = (f: Frame) => f.y + SKYWAY.railHeight;
    const outerBot = soup.line(fs.map((f) => at(f, outer, f.y)));
    const outerTop = soup.line(fs.map((f) => at(f, outer, top(f))));
    const innerTop = soup.line(fs.map((f) => at(f, inner, top(f))));
    const innerBot = soup.line(fs.map((f) => at(f, inner, f.y)));
    soup.strip(outerBot, outerTop);
    soup.strip(outerTop, innerTop);
    soup.strip(innerTop, innerBot);
  }
  return soup.geometry();
}

/** Dashed centre line and solid edge lines, drawn as flat quads a hair above the deck top. */
function addMarkings(yellow: Soup, white: Soup, def: SkywayDef, fs: Frame[]): void {
  const length = fs[fs.length - 1].along;
  for (let a = 0; a < length; a += 6) {
    const b = Math.min(a + 3, length);
    const f = sliceFrames(fs, a, b);
    yellow.strip(
      yellow.line(f.map((p) => at(p, -0.125, p.y + DASH_LIFT))),
      yellow.line(f.map((p) => at(p, 0.125, p.y + DASH_LIFT))),
    );
  }
  const edge = def.width / 2 - 0.6;
  for (const side of [-1, 1]) {
    const c = side * edge;
    white.strip(
      white.line(fs.map((f) => at(f, c - 0.1, f.y + DASH_LIFT))),
      white.line(fs.map((f) => at(f, c + 0.1, f.y + DASH_LIFT))),
    );
  }
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

  const yellow = new Soup();
  const white = new Soup();
  const barrierBoards: THREE.BufferGeometry[] = [];
  const barrierPosts: THREE.BufferGeometry[] = [];

  for (const def of skywayDefs()) {
    const fs = framesOf(def);

    const deck = new THREE.Mesh(deckGeometry(def, fs), [asphalt, concrete]);
    deck.name = `${def.id}-deck`;
    deck.castShadow = true;
    deck.receiveShadow = true;
    group.add(deck);

    const rails = new THREE.Mesh(railGeometry(def, fs), railMat);
    rails.name = `${def.id}-rails`;
    group.add(rails);

    addMarkings(yellow, white, def, fs);

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

  const yellowMesh = new THREE.Mesh(yellow.geometry(), yellowMat);
  yellowMesh.name = 'skyway-lane-dashes';
  group.add(yellowMesh);
  const whiteMesh = new THREE.Mesh(white.geometry(), whiteMat);
  whiteMesh.name = 'skyway-lane-edges';
  group.add(whiteMesh);

  // Column bents and their cap beams, one merged mesh. A beam's top sits 0.05 below the deck underside.
  const pillars: THREE.BufferGeometry[] = [];
  const cs = SKYWAY.columnSize;
  for (const b of skywayBents()) {
    const y0 = b.land - 0.3;
    const y1 = b.deckY - SKYWAY.slab;
    for (const c of b.columns) pillars.push(boxAt(cs, y1 - y0, cs, c.x, (y0 + y1) / 2, c.z, 0));
    const [c0, c1] = b.columns;
    // 0.1 past each column face, so the beam ends never share a plane with a column side.
    const span = Math.hypot(c1.x - c0.x, c1.z - c0.z) + cs + 0.2;
    const beamTop = b.deckY - SKYWAY.slab - 0.05;
    pillars.push(boxAt(span, 0.8, 0.9, b.x, beamTop - 0.4, b.z, Math.atan2(b.dirX, b.dirZ)));
  }
  if (pillars.length > 0) {
    const columns = new THREE.Mesh(mergeGeometries(pillars, false) ?? new THREE.BufferGeometry(), concrete);
    columns.name = 'skyway-columns';
    columns.castShadow = true;
    columns.receiveShadow = true;
    group.add(columns);
  }

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
