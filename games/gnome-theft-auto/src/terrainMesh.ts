// three.js side of the terrain: the chunked ground mesh, draped road ribbons, and helpers that put objects on the
// ground. Heights come from terrain.ts. Nothing here runs while the terrain is flat except the helpers, which are then
// no-ops (or set y = lift), so the flat world is unchanged.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { TERRAIN, WORLD_HALF } from './config';
import { REGIONS, regionAt, type RegionBiome } from './levels';
import { GRID_N, heightAt, heightGrid, normalAt, terrainFlat } from './terrain';
import { paintedGroundAt } from './terrainPaint';
import { TILE, groundTexture, planarUv, type GroundKind } from './textures';

const UP = new THREE.Vector3(0, 1, 0);
const tmpN = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();

/**
 * Put `obj` on the ground at (x, z): position = (x, heightAt + lift, z). With `lean`, also tilt it onto the ground
 * normal, keeping the yaw it already has (set rotation.y first, call this once). On level ground (normal straight up)
 * the rotation is left untouched, so flat-world objects keep their exact Euler rotation.
 */
export function placeOnGround(obj: THREE.Object3D, x: number, z: number, lift = 0, lean = false): void {
  obj.position.set(x, heightAt(x, z) + lift, z);
  if (!lean) return;
  const n = normalAt(x, z);
  if (n.y >= 0.99999) return;
  tmpQ.setFromUnitVectors(UP, tmpN.set(n.x, n.y, n.z));
  obj.quaternion.premultiply(tmpQ);
}

/**
 * Add the ground height under every vertex to its y (a world-space geometry: flat decals, ribbons, strips laid on the
 * ground at their lift). No-op while the terrain is flat. Recomputes nothing else (normals stay as they were).
 */
export function addGroundToGeometry(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  if (terrainFlat()) return geo;
  const p = geo.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + heightAt(p.getX(i), p.getZ(i)));
  p.needsUpdate = true;
  return geo;
}

/**
 * A road ribbon `width` wide along a polyline, draped on the ground at `lift`, with mitred joins and a vertex row
 * every `step` metres. Each row has RIBBON_COLUMNS vertices across (not just the two edges), so where the ground across
 * the road is not dead level (bends and junctions on sloping land) it cannot bulge up through the ribbon between them.
 * Faces up; normals from the ground.
 */
/** Vertices across a draped ribbon: edges plus three inside (2.5 m apart on a 10 m road). */
const RIBBON_COLUMNS = 5;

export function drapedRibbon(points: readonly (readonly [number, number])[], width: number, lift: number, step = 2): THREE.BufferGeometry {
  const pos: number[] = [];
  const nrm: number[] = [];
  const idx: number[] = [];
  const half = width / 2;
  // Unit direction of each segment.
  const dirs = points.slice(0, -1).map(([ax, az], k) => {
    const [bx, bz] = points[k + 1];
    const l = Math.hypot(bx - ax, bz - az) || 1;
    return [(bx - ax) / l, (bz - az) / l] as const;
  });
  // Side offset (left of travel) at each vertex: the mitre of its two segments, limited at sharp turns.
  const sideAt = (k: number): [number, number] => {
    const a = dirs[Math.max(0, k - 1)];
    const b = dirs[Math.min(dirs.length - 1, k)];
    let mx = a[0] + b[0], mz = a[1] + b[1];
    const ml = Math.hypot(mx, mz) || 1;
    mx /= ml; mz /= ml;
    const cos = Math.max(0.5, mx * b[0] + mz * b[1]);
    return [(-mz * half) / cos, (mx * half) / cos];
  };
  const pushRow = (x: number, z: number, sx: number, sz: number): void => {
    for (let c = 0; c < RIBBON_COLUMNS; c++) {
      const s = 1 - (2 * c) / (RIBBON_COLUMNS - 1);
      const px = x + sx * s, pz = z + sz * s;
      const n = normalAt(px, pz);
      pos.push(px, heightAt(px, pz) + lift, pz);
      nrm.push(n.x, n.y, n.z);
    }
  };
  let rows = 0;
  for (let k = 0; k + 1 < points.length; k++) {
    const [ax, az] = points[k];
    const [bx, bz] = points[k + 1];
    const [sax, saz] = sideAt(k);
    const [sbx, sbz] = sideAt(k + 1);
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.ceil(len / step));
    for (let s = k === 0 ? 0 : 1; s <= n; s++) {
      const t = s / n;
      pushRow(ax + (bx - ax) * t, az + (bz - az) * t, sax + (sbx - sax) * t, saz + (sbz - saz) * t);
      rows++;
    }
  }
  // Rows r and r+1, columns c (left) and c+1 (right): wind (L0, R0, L1) and (R0, R1, L1); the check below flips every
  // face if that came out pointing down.
  const C = RIBBON_COLUMNS;
  for (let r = 0; r + 1 < rows; r++) {
    for (let c = 0; c + 1 < C; c++) {
      const l0 = r * C + c, r0 = l0 + 1, l1 = l0 + C, r1 = l1 + 1;
      idx.push(l0, r0, l1, r0, r1, l1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  // Planar uv (x, -z), so it merges with PlaneGeometry strips (mergeGeometries needs the same attributes).
  const uv: number[] = [];
  for (let i = 0; i < pos.length; i += 3) uv.push(pos[i], -pos[i + 2]);
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  // Make sure the first face points up (the left/right naming depends on the axis convention): flip all if not.
  if (idx.length >= 3) {
    const a = new THREE.Vector3().fromArray(pos, idx[0] * 3);
    const b = new THREE.Vector3().fromArray(pos, idx[1] * 3);
    const c = new THREE.Vector3().fromArray(pos, idx[2] * 3);
    const up = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).y;
    if (up < 0) {
      for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
      g.setIndex(idx);
    }
  }
  return g;
}

// ---- The chunked ground mesh ----------------------------------------------------------------------------------------
/** Texture kind of each biome's ground (same as world.ts's flat ground). */
export const GROUND_KIND: Record<RegionBiome, GroundKind> = {
  desert: 'sand', forest: 'forest', tundra: 'snow', farmland: 'farm', city: 'grass', loch: 'moss', parkland: 'meadow',
  highland: 'meadow', coast: 'sand', campus: 'grass', estate: 'grass',
};

export interface TerrainChunks {
  /** Holds every chunk mesh (named 'terrain-chunks'). */
  group: THREE.Group;
  /** Show only the chunks near (x, z) (call each frame with the player or camera position). */
  update(x: number, z: number): void;
}

/**
 * Build the ground as TERRAIN.chunk-metre chunks on the height grid (one mesh per chunk and ground kind; each triangle
 * takes its cell's paint, else the kind of the region at its centre), on LAYER.ground. Returns null while the terrain is flat (world.ts then
 * keeps its flat ground planes).
 */
export function buildTerrainChunks(scene: THREE.Scene): TerrainChunks | null {
  const g = heightGrid();
  if (!g) return null;
  const N = GRID_N;
  const S = TERRAIN.step;
  const H = WORLD_HALF;
  const per = Math.round(TERRAIN.chunk / S);
  const chunksPerSide = Math.ceil((N - 1) / per);
  const group = new THREE.Group();
  group.name = 'terrain-chunks';
  const materials = new Map<GroundKind, THREE.Material>();
  const matOf = (kind: GroundKind): THREE.Material => {
    let m = materials.get(kind);
    if (!m) {
      m = flatLayer(new THREE.MeshStandardMaterial({ color: 0xffffff, map: groundTexture(kind), roughness: 1 }), LAYER.ground);
      materials.set(kind, m);
    }
    return m;
  };
  const chunks: { mesh: THREE.Mesh; cx: number; cz: number }[] = [];
  const n = new THREE.Vector3();
  for (let cj = 0; cj < chunksPerSide; cj++) {
    for (let ci = 0; ci < chunksPerSide; ci++) {
      const i0 = ci * per, j0 = cj * per;
      const i1 = Math.min(N - 1, i0 + per), j1 = Math.min(N - 1, j0 + per);
      const w = i1 - i0 + 1;
      const pos = new Float32Array(w * (j1 - j0 + 1) * 3);
      const nrm = new Float32Array(pos.length);
      for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) {
          const k = ((j - j0) * w + (i - i0)) * 3;
          const x = -H + i * S, z = -H + j * S;
          pos[k] = x; pos[k + 1] = g[j * N + i]; pos[k + 2] = z;
          const nn = normalAt(x, z);
          n.set(nn.x, nn.y, nn.z);
          nrm[k] = n.x; nrm[k + 1] = n.y; nrm[k + 2] = n.z;
        }
      }
      // Two triangles per cell, split along (i, j)-(i+1, j+1) like heightAt, wound to face up; grouped by ground kind.
      const byKind = new Map<GroundKind, number[]>();
      for (let j = j0; j < j1; j++) {
        for (let i = i0; i < i1; i++) {
          const a = (j - j0) * w + (i - i0), b = a + 1, d = a + w, c = d + 1;
          const x = -H + (i + 0.5) * S, z = -H + (j + 0.5) * S;
          // Triangle (a, c, b) holds the cell's (+x, -z) half, (a, d, c) its (-x, +z) half.
          // The cell's paint (terrainPaint.ts) when it has one, else the region's own ground.
          const painted = paintedGroundAt(x, z);
          const k1 = painted ?? GROUND_KIND[REGIONS[regionAt(x + S / 6, z - S / 6)].data.region];
          const k2 = painted ?? GROUND_KIND[REGIONS[regionAt(x - S / 6, z + S / 6)].data.region];
          let l1 = byKind.get(k1); if (!l1) byKind.set(k1, (l1 = []));
          l1.push(a, c, b);
          let l2 = byKind.get(k2); if (!l2) byKind.set(k2, (l2 = []));
          l2.push(a, d, c);
        }
      }
      // A chunk that is dead level and one ground kind (Turfton, flat sites, land with no relief yet) is one quad: same
      // look, a thousandth of the triangles. Its border vertices all share that height, so the seams with its neighbours
      // still match.
      let level = true;
      for (let k = 4; k < pos.length && level; k += 3) level = pos[k] === pos[1];
      const quad = level && byKind.size === 1;
      for (const [kind, index] of byKind) {
        const geo = new THREE.BufferGeometry();
        if (quad) {
          const x0 = -H + i0 * S, x1 = -H + i1 * S, z0 = -H + j0 * S, z1 = -H + j1 * S, y = pos[1];
          geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([x0, y, z0, x1, y, z0, x1, y, z1, x0, y, z1]), 3));
          geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]), 3));
          geo.setIndex([0, 2, 1, 0, 3, 2]);
        } else {
          geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
          geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
          geo.setIndex(index);
        }
        planarUv(geo, TILE[kind]);
        geo.computeBoundingSphere();
        geo.computeBoundingBox();
        const mesh = new THREE.Mesh(geo, matOf(kind));
        mesh.receiveShadow = true;
        mesh.matrixAutoUpdate = false;
        group.add(mesh);
        chunks.push({ mesh, cx: -H + (i0 + i1) / 2 * S, cz: -H + (j0 + j1) / 2 * S });
      }
    }
  }
  scene.add(group);
  const reach = TERRAIN.chunkViewDistance + TERRAIN.chunk * 0.71;
  return {
    group,
    update(x, z) {
      for (const c of chunks) c.mesh.visible = Math.hypot(c.cx - x, c.cz - z) <= reach;
    },
  };
}
