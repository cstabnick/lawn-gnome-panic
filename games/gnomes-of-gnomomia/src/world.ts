// World: draws the open world around the player. Terrain streams in 64 m chunks (two levels of detail), instanced flora
// fills the near chunks, the sun's shadow box follows the player, and the sky and fog blend to the theme of the zone
// the player is in. terrain.ts holds the data; dressing.ts holds the set pieces (houses, gates, decks, ...).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { WORLD, type ZoneId } from './config';
import { ZONES } from './content';
import { buildDressing, updateDressing } from './dressing';
import { onSettingsChange, settings } from './settings';
import { buildChunkBuffers, chunkFlora, groundColourAt, heightAt, themeZoneAt, zoneAt, zoneRectDistance, type Flora, type FloraKind } from './terrain';

// Phones (coarse pointer) get a smaller sun shadow map to keep the frame rate up.
const COARSE = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

// ---------------------------------------------------------------- state

let root: THREE.Group | null = null;
let hemi: THREE.HemisphereLight | null = null;
let sun: THREE.DirectionalLight | null = null;
let bgColour: THREE.Color | null = null;
let fog: THREE.Fog | null = null;
let dressingWalk: THREE.Object3D[] = [];
let themeSnapped = false;
let first = true;

interface Chunk {
  cx: number;
  cz: number;
  lod: number;
  group: THREE.Group;
  terrain: THREE.Mesh;
  flora: THREE.InstancedMesh[];
}
/** Built chunks, by key. */
const built = new Map<number, Chunk>();
let walkDirty = true;
let walkCache: THREE.Object3D[] = [];

const ZONE_IDS = Object.keys(ZONES) as ZoneId[];
const tmpColour = new THREE.Color();

// ---------------------------------------------------------------- flora parts (shared geometry and material)

interface FloraMeshDef { geo: THREE.BufferGeometry; cast: boolean }
let floraByKind: Map<FloraKind, FloraMeshDef> | null = null;
const floraMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });

function tintGeo(src: THREE.BufferGeometry, colour: number): THREE.BufferGeometry {
  const g = src.index ? src.toNonIndexed() : src;
  if (g !== src) src.dispose();
  for (const attr of Object.keys(g.attributes)) {
    if (attr !== 'position' && attr !== 'normal') g.deleteAttribute(attr);
  }
  if (!g.getAttribute('normal')) g.computeVertexNormals();
  tmpColour.setHex(colour);
  const count = g.getAttribute('position').count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    colors[i * 3] = tmpColour.r;
    colors[i * 3 + 1] = tmpColour.g;
    colors[i * 3 + 2] = tmpColour.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return g;
}

function merged(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const g = list.length === 1 ? list[0] : mergeGeometries(list, false);
  if (!g) throw new Error('flora parts do not merge');
  if (list.length > 1) {
    for (const part of list) part.dispose();
  }
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

/** One merged, vertex-coloured geometry per flora kind, with offsets baked in. Built once; every chunk shares them. */
function buildFloraDefs(): Map<FloraKind, FloraMeshDef> {
  const trunk = (): THREE.BufferGeometry => new THREE.CylinderGeometry(0.25, 0.35, 1.6, 6).translate(0, 0.8, 0);
  const cone = (r: number, h: number, seg: number, x: number, y: number, z: number): THREE.BufferGeometry =>
    new THREE.ConeGeometry(r, h, seg).translate(x, y, z);
  const m = new Map<FloraKind, FloraMeshDef>();
  m.set('pine', {
    geo: merged([
      tintGeo(trunk(), 0x6b4a2e),
      tintGeo(cone(1.6, 2, 7, 0, 1.8, 0), 0x2f6b2f),
      tintGeo(cone(1.25, 2, 7, 0, 2.8, 0), 0x2f6b2f),
      tintGeo(cone(0.9, 2, 7, 0, 3.7, 0), 0x2f6b2f),
    ]),
    cast: true,
  });
  m.set('broad', {
    geo: merged([
      tintGeo(trunk(), 0x6b4a2e),
      tintGeo(new THREE.IcosahedronGeometry(1.7, 0).translate(0, 3, 0), 0x3f8f3a),
    ]),
    cast: true,
  });
  const blades = [[0.15, 0], [-0.12, 0.1], [0.05, -0.18], [-0.08, -0.05]].map(([x, z]) => tintGeo(cone(0.07, 0.9, 3, x, 0.45, z), 0x7fb84a));
  m.set('grass', { geo: merged(blades), cast: false });
  const leaves = [0, 1, 2].map((k) => {
    const a = (k * Math.PI * 2) / 3;
    return tintGeo(new THREE.IcosahedronGeometry(0.28, 0).scale(1, 0.35, 1).translate(Math.cos(a) * 0.18, 0.1, Math.sin(a) * 0.18), 0x3f9a45);
  });
  m.set('clover', { geo: merged(leaves), cast: false });
  m.set('hedge', { geo: merged([tintGeo(new THREE.BoxGeometry(2.4, 1.5, 2.2).translate(0, 0.75, 0), 0x2d5e2b)]), cast: true });
  m.set('boulder', { geo: merged([tintGeo(new THREE.DodecahedronGeometry(1, 0).translate(0, 0.5, 0), 0x8f8f88)]), cast: true });
  m.set('pipe', { geo: merged([tintGeo(new THREE.CylinderGeometry(0.35, 0.35, 4, 8).translate(0, 2, 0), 0x8a4a2a)]), cast: true });
  const tufts = [[0.12, 0.05], [-0.1, 0.12], [0.03, -0.14], [-0.15, -0.08], [0.1, -0.1]].map(([x, z]) => tintGeo(cone(0.1, 0.5, 3, x, 0.25, z), 0xd9c35a));
  m.set('stubble', { geo: merged(tufts), cast: false });
  m.set('rock', { geo: merged([tintGeo(new THREE.DodecahedronGeometry(1, 0), 0x8a8a80)]), cast: true });
  return m;
}

/** Instance scale of a flora kind of size s. Hedges and pipes are not scaled; boulders and rocks are squashed. */
function scaleFor(kind: FloraKind, s: number): [number, number, number] {
  switch (kind) {
    case 'hedge':
    case 'pipe':
      return [1, 1, 1];
    case 'boulder':
      return [s, 0.8 * s, s];
    case 'rock':
      return [s, 0.7 * s, s];
    default:
      return [s, s, s];
  }
}

const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

/** The flora meshes of one LOD 0 chunk: one merged vertex-coloured InstancedMesh per flora kind. */
function buildFlora(group: THREE.Group, items: readonly Flora[]): THREE.InstancedMesh[] {
  if (!floraByKind) floraByKind = buildFloraDefs();
  const byKind = new Map<FloraKind, Flora[]>();
  for (const f of items) {
    let list = byKind.get(f.kind);
    if (!list) { list = []; byKind.set(f.kind, list); }
    list.push(f);
  }
  const out: THREE.InstancedMesh[] = [];
  for (const [kind, list] of byKind) {
    const def = floraByKind.get(kind);
    if (!def) continue;
    const im = new THREE.InstancedMesh(def.geo, floraMat, list.length);
    list.forEach((f, i) => {
      const [sx, sy, sz] = scaleFor(kind, f.s);
      _p.set(f.x, f.y, f.z);
      _q.setFromAxisAngle(_up, f.rot);
      _s.set(sx, sy, sz);
      im.setMatrixAt(i, _m.compose(_p, _q, _s));
    });
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
    im.castShadow = def.cast;
    im.receiveShadow = true;
    group.add(im);
    out.push(im);
  }
  return out;
}

// ---------------------------------------------------------------- chunks

const keyOf = (ci: number, cj: number): number => (ci + 32768) * 65536 + (cj + 32768);

/** A terrain chunk: one plane of WORLD.chunk metres (32x32 cells at LOD 0, 8x8 at LOD 1), one colour per triangle. */
function buildChunk(ci: number, cj: number, lod: number, cx: number, cz: number): Chunk {
  const C = WORLD.chunk;
  const n = lod === 0 ? 32 : 8;
  let geo: THREE.BufferGeometry;
  const wasmBufs = buildChunkBuffers(cx, cz, C, n);
  if (wasmBufs) {
    geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(wasmBufs.positions, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(wasmBufs.normals, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(wasmBufs.colors, 3));
  } else {
    const indexed = new THREE.PlaneGeometry(C, C, n, n).rotateX(-Math.PI / 2).translate(cx, 0, cz);
    const grid = indexed.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < grid.count; i++) grid.setY(i, heightAt(grid.getX(i), grid.getZ(i)));
    geo = indexed.toNonIndexed();
    indexed.dispose();
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    const colours = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i += 3) {
      const x = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3;
      const z = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
      tmpColour.setHex(groundColourAt(x, z));
      for (let k = 0; k < 3; k++) {
        colours[(i + k) * 3] = tmpColour.r;
        colours[(i + k) * 3 + 1] = tmpColour.g;
        colours[(i + k) * 3 + 2] = tmpColour.b;
      }
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colours, 3));
    geo.computeVertexNormals();
  }
  const terrain = new THREE.Mesh(geo, terrainMat);
  terrain.receiveShadow = true;
  // LOD 1 sits a little low so its seams with LOD 0 neighbours are hidden.
  if (lod === 1) terrain.position.y = -0.1;

  const group = new THREE.Group();
  group.add(terrain);
  const flora = lod === 0 ? buildFlora(group, chunkFlora(ci, cj)) : [];
  return { cx, cz, lod, group, terrain, flora };
}

/** Shared by every terrain chunk. */
const terrainMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });

function disposeChunk(c: Chunk): void {
  root?.remove(c.group);
  c.terrain.geometry.dispose();
  for (const im of c.flora) im.dispose(); // frees the instance matrices; part geometry and materials are shared
}

interface Wanted { ci: number; cj: number; cx: number; cz: number; dist: number; lod: number }

/** Smallest signed distance from (x, z) to any zone's square. */
function zoneDistanceAt(x: number, z: number): number {
  let best = Infinity;
  for (const id of ZONE_IDS) best = Math.min(best, zoneRectDistance(id, x, z));
  return best;
}

/** Where streamChunks last planned, and whether every chunk it wanted was built then. */
let plannedX = NaN;
let plannedZ = NaN;
let streamSettled = false;
/** Focus movement (m) that makes streamChunks plan again once everything it wanted is built. */
const REPLAN_M = 4;

function streamChunks(focus: THREE.Vector3): void {
  if (!root) return;
  const C = WORLD.chunk;
  const R = WORLD.viewRadius;
  const fx = focus.x, fz = focus.z;
  // Planning walks about 500 chunk cells against every zone: about a fifth of a frame. Skip it while the focus stands
  // (near) still and nothing is left to build.
  if (streamSettled && Math.hypot(fx - plannedX, fz - plannedZ) < REPLAN_M) return;
  plannedX = fx;
  plannedZ = fz;

  // Wanted chunks: centre within viewRadius, and part of the world (not the void).
  const wanted = new Map<number, Wanted>();
  const i0 = Math.floor((fx - R) / C) - 1, i1 = Math.floor((fx + R) / C) + 1;
  const j0 = Math.floor((fz - R) / C) - 1, j1 = Math.floor((fz + R) / C) + 1;
  for (let ci = i0; ci <= i1; ci++) {
    for (let cj = j0; cj <= j1; cj++) {
      const cx = ci * C + C / 2, cz = cj * C + C / 2;
      const dist = Math.hypot(cx - fx, cz - fz);
      if (dist > R) continue;
      if (zoneDistanceAt(cx, cz) >= WORLD.blend + 50) continue;
      wanted.set(keyOf(ci, cj), { ci, cj, cx, cz, dist, lod: dist <= WORLD.nearRadius ? 0 : 1 });
    }
  }

  // Drop chunks well outside the view.
  for (const [k, c] of built) {
    if (Math.hypot(c.cx - fx, c.cz - fz) > R + C) {
      disposeChunk(c);
      built.delete(k);
      walkDirty = true;
    }
  }

  // The first call, or a call where the chunk under the player is missing, builds every near LOD 0 chunk at once so
  // the player never stands on nothing. Everything else is capped at two chunks per frame, nearest first.
  const focusKey = keyOf(Math.floor(fx / C), Math.floor(fz / C));
  const forceNear = first || (wanted.has(focusKey) && !built.has(focusKey));
  first = false;

  const pending: Wanted[] = [];
  for (const w of wanted.values()) {
    const c = built.get(keyOf(w.ci, w.cj));
    if (!c || c.lod !== w.lod) pending.push(w);
  }
  pending.sort((a, b) => a.dist - b.dist);

  let budget = 2;
  streamSettled = true;
  for (const w of pending) {
    const urgent = forceNear && w.lod === 0 && w.dist <= WORLD.nearRadius;
    if (!urgent) {
      if (budget <= 0) {
        streamSettled = false;
        continue;
      }
      budget--;
    }
    const k = keyOf(w.ci, w.cj);
    const old = built.get(k);
    if (old) disposeChunk(old);
    const c = buildChunk(w.ci, w.cj, w.lod, w.cx, w.cz);
    root.add(c.group);
    built.set(k, c);
    walkDirty = true;
  }
}

// ---------------------------------------------------------------- public

/** Builds the world's lights, sky and fog, and the fixed dressing, into the scene. Call once, before initZones. */
export function initWorld(scene: THREE.Scene): void {
  root = new THREE.Group();
  root.name = 'world';
  scene.add(root);

  hemi = new THREE.HemisphereLight(0xcfe8ff, 0x4a6b2a, 1.4);
  root.add(hemi);
  sun = new THREE.DirectionalLight(0xfff1d6, 2.2);
  sun.castShadow = settings.shadows;
  onSettingsChange((s) => {
    if (sun) sun.castShadow = s.shadows;
  });
  const shadowSize = COARSE ? 1024 : 2048;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  sun.shadow.camera.left = -80;
  sun.shadow.camera.bottom = -80;
  sun.shadow.camera.right = 80;
  sun.shadow.camera.top = 80;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 300;
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0005;
  root.add(sun);
  root.add(sun.target);

  bgColour = new THREE.Color(0x9fd0f0);
  scene.background = bgColour;
  fog = new THREE.Fog(0x9fd0f0, WORLD.fogNear, WORLD.fogFar);
  scene.fog = fog;

  dressingWalk = buildDressing(root);
  walkDirty = true;
}

/** Per frame: stream terrain chunks around `focus` (the player), move the sun's shadow box with it, and blend the
 * sky and fog to the theme of the zone there. */
export function updateWorld(dt: number, focus: THREE.Vector3): void {
  if (root && hemi && sun && bgColour && fog) {
    // Sun: its shadow box is 160 m square and centred on the player.
    sun.position.set(focus.x + 60, focus.y + 90, focus.z + 40);
    sun.target.position.copy(focus);
    sun.target.updateMatrixWorld();

    // Theme: indoors is dim and sunless; outdoors is the sky and fog of the zone (or the nearest one, in the Wilds).
    const id = zoneAt(focus.x, focus.z);
    const indoor = id !== null && ZONES[id].indoor === true;
    const def = themeZoneAt(focus.x, focus.z);
    if (indoor) {
      sun.visible = false;
      hemi.color.setHex(0x8a8aa0);
      hemi.groundColor.setHex(0x222222);
      hemi.intensity = 0.45;
      fog.near = 30;
      fog.far = 120;
    } else {
      sun.visible = true;
      hemi.color.setHex(0xcfe8ff);
      hemi.groundColor.setHex(0x4a6b2a);
      hemi.intensity = 1.4;
      fog.near = WORLD.fogNear;
      fog.far = WORLD.fogFar;
    }
    const k = 1 - Math.exp(-2 * dt);
    const snap = !themeSnapped;
    themeSnapped = true;
    tmpColour.setHex(def.theme.sky);
    if (snap) bgColour.copy(tmpColour); else bgColour.lerp(tmpColour, k);
    tmpColour.setHex(def.theme.fog);
    if (snap) fog.color.copy(tmpColour); else fog.color.lerp(tmpColour, k);

    streamChunks(focus);
  }
  updateDressing(focus);
}

/** Meshes a click may land on to walk there: every built terrain chunk, plus deck floors and ramps. */
export function getWalkMeshes(): readonly THREE.Object3D[] {
  if (walkDirty) {
    walkCache = [...[...built.values()].map((c) => c.terrain), ...dressingWalk];
    walkDirty = false;
  }
  return walkCache;
}
