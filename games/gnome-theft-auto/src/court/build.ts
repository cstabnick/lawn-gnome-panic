// Drainpipe Court, built (batch 3 E19): the asphalt, the chalk lines GBA GJAM plays on (sim metres x COURT_SCALE), the
// two drainpipe hoops (rims exactly on COURT.hoops), the scoreboard, ball cage, Old Burdock's bench, the rules sign, a
// pointer to the laundrette, lamps and the park railing. Returns the colliders; the runtime pushes them into world.boxes.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { COURT_HALF_X, COURT_HALF_Z, HOOP_X, THREE_PT_RADIUS } from '@lawn/jam';
import { mulberry32 } from '@lawn/level';
import { buildPrefab } from '@lawn/prefabs';
import { buildStaticCells } from '../cull';
import { planPieces, prefabBox, type HomePiece } from '../homes/pieces';
import { heightAt } from '../terrain';
import type { Box } from '../types';
import { BALL_CAGE, COURT, COURT_ORIGIN, COURT_SCALE, COURT_SITE, OLD_BENCH, SCOREBOARD } from './types';

export interface CourtBuild { boxes: Box[]; groundY: number; group: THREE.Group }

const HOOP_SCALE = 0.8;
const LINE_W = 0.06;
const RUNOFF = 2;
const POLE_R = 0.2;
// GJAM's key (4.1 long, 4.44 wide), free-throw circle and centre circle, and the corner line offset, in sim metres.
const KEY_LEN = 4.1, KEY_HALF_W = 2.22, FT_R = 1.44, CENTRE_R = 1.64, CORNER_INSET = 0.9;

type P = [number, number];
const toWorld = (sx: number, sz: number): P => [COURT_ORIGIN.x + sx * COURT_SCALE, COURT_ORIGIN.z + sz * COURT_SCALE];

/** Sim-space polyline of an arc (angles from +x on the x/z plane). */
function arc(cx: number, cz: number, r: number, a0: number, a1: number, n = 24): P[] {
  const out: P[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
  }
  return out;
}

/** The chalk: every line of the court as polylines in sim metres. */
function chalkLines(): P[][] {
  const hx = COURT_HALF_X, hz = COURT_HALF_Z;
  const lines: P[][] = [];
  lines.push([[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz], [-hx, -hz]]);
  lines.push([[0, -hz], [0, hz]]);
  lines.push(arc(0, 0, CENTRE_R, 0, Math.PI * 2, 40));
  const cz = hz - CORNER_INSET;
  const dx = Math.sqrt(THREE_PT_RADIUS * THREE_PT_RADIUS - cz * cz);
  const half = Math.acos(dx / THREE_PT_RADIUS);
  for (const s of [-1, 1]) {
    const keyEnd = s * (hx - KEY_LEN);
    lines.push([[s * hx, -KEY_HALF_W], [keyEnd, -KEY_HALF_W], [keyEnd, KEY_HALF_W], [s * hx, KEY_HALF_W]]);
    // Free-throw circle: the half out in the court.
    lines.push(s < 0 ? arc(keyEnd, 0, FT_R, -Math.PI / 2, Math.PI / 2) : arc(keyEnd, 0, FT_R, Math.PI / 2, Math.PI * 1.5));
    // Three-point arc round the hoop, joined to straight corner lines out to the baseline.
    const a = s < 0 ? arc(s * HOOP_X, 0, THREE_PT_RADIUS, -half, half, 32) : arc(s * HOOP_X, 0, THREE_PT_RADIUS, Math.PI - half, Math.PI + half, 32);
    lines.push([[s * hx, a[0][1]], ...a, [s * hx, a[a.length - 1][1]]]);
  }
  return lines;
}

/** Thin quads along polylines (sim polylines, drawn in world metres), slightly uneven in width, as one geometry at height y. */
function ribbons(lines: P[][], y: number, rnd: () => number): THREE.BufferGeometry {
  const pos: number[] = [];
  for (const line of lines) {
    const pts = line.map(([x, z]) => toWorld(x, z));
    for (let i = 0; i + 1 < pts.length; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      if (len < 1e-4) continue;
      const tx = (bx - ax) / len, tz = (bz - az) / len;
      const w = (LINE_W * (0.85 + rnd() * 0.3)) / 2;
      const nx = -tz * w, nz = tx * w;
      const ex = tx * w, ez = tz * w; // overlap the joins
      const A: P = [ax - ex + nx, az - ez + nz], B: P = [ax - ex - nx, az - ez - nz];
      const C: P = [bx + ex - nx, bz + ez - nz], D: P = [bx + ex + nx, bz + ez + nz];
      for (const q of [A, B, C, A, C, D]) pos.push(q[0], y, q[1]);
    }
  }
  return geo(pos);
}

function geo(pos: number[]): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

const rectPos = (x0: number, z0: number, x1: number, z1: number, y: number): number[] =>
  [x0, y, z0, x0, y, z1, x1, y, z1, x0, y, z0, x1, y, z1, x1, y, z0];

export function buildDrainpipeCourt(scene: THREE.Scene): CourtBuild {
  const groundY = heightAt(COURT_ORIGIN.x, COURT_ORIGIN.z);
  const group = new THREE.Group();
  group.name = 'drainpipe-court';
  const rnd = mulberry32(0xd2a1c0);

  // Asphalt slab (court + 2 m run-off) with a few repair patches on it.
  const x0 = COURT.x - COURT.halfX - RUNOFF, x1 = COURT.x + COURT.halfX + RUNOFF;
  const z0 = COURT.z - COURT.halfZ - RUNOFF, z1 = COURT.z + COURT.halfZ + RUNOFF;
  const slab = new THREE.Mesh(geo(rectPos(x0, z0, x1, z1, groundY + 0.02)),
    flatLayer(new THREE.MeshLambertMaterial({ color: 0x35373b, side: THREE.DoubleSide }), LAYER.area));
  slab.name = 'court-asphalt';
  group.add(slab);
  const patchPos: number[] = [];
  const patchPlan: [number, number, number, number][] = [[-6, -2, 2.4, 1.6], [1.5, 2.2, 1.8, 2.6], [5.5, -3, 2.2, 1.2], [-3, 3.4, 1.6, 1.1]];
  for (const [u, v, w, d] of patchPlan) {
    patchPos.push(...rectPos(COURT.x + u - w / 2, COURT.z + v - d / 2, COURT.x + u + w / 2, COURT.z + v + d / 2, groundY + 0.025));
  }
  const patches = new THREE.Mesh(geo(patchPos),
    flatLayer(new THREE.MeshLambertMaterial({ color: 0x2b2d31, side: THREE.DoubleSide }), LAYER.road));
  patches.name = 'court-patches';
  group.add(patches);

  // Chalk lines.
  const chalk = new THREE.Mesh(ribbons(chalkLines(), groundY + 0.03, rnd),
    flatLayer(new THREE.MeshLambertMaterial({ color: 0xece8dc, side: THREE.DoubleSide }), LAYER.marking));
  chalk.name = 'court-chalk';
  group.add(chalk);

  const boxes: Box[] = [];

  // Hoops: rim centre sits at hoop x/z, 2.44 m up. Base 0.32 m behind the rim, along the facing direction.
  for (const hoop of COURT.hoops) {
    const dir = hoop.side === 'left' ? 1 : -1;
    const obj = buildPrefab('drainpipe-hoop', { lights: false });
    obj.name = `drainpipe-hoop-${hoop.side}`;
    obj.scale.setScalar(HOOP_SCALE);
    obj.rotation.y = (dir * Math.PI) / 2;
    const bx = hoop.x - dir * 0.32;
    obj.position.set(bx, groundY, hoop.z);
    group.add(obj);
    boxes.push({ minX: bx - POLE_R, maxX: bx + POLE_R, minZ: hoop.z - POLE_R, maxZ: hoop.z + POLE_R, h: groundY + 3.05 * HOOP_SCALE * 1.2, shape: 'round' });
  }

  // Props and park furniture, each a collider.
  const rb = prefabBox('civic-railing');
  const railLen = rb.max.x - rb.min.x;
  const pieces: HomePiece[] = [
    { prefab: 'chalk-scoreboard', x: SCOREBOARD.x, z: SCOREBOARD.z, yaw: SCOREBOARD.yaw, solid: true },
    { prefab: 'ball-cage', x: BALL_CAGE.x, z: BALL_CAGE.z, yaw: BALL_CAGE.yaw, solid: true, y: 0.01 },
    { prefab: 'old-court-bench', x: OLD_BENCH.x, z: OLD_BENCH.z, yaw: OLD_BENCH.yaw, solid: true },
    { prefab: 'court-rules-sign', x: -102, z: 38, yaw: (3 * Math.PI) / 4, solid: true },
    { prefab: 'laundrette-sign', x: -104, z: 30, yaw: Math.PI / 2, solid: true },
    { prefab: 'mushroom-lamp', x: -105, z: 20.5, yaw: 0, scale: 1.4, solid: true },
    { prefab: 'mushroom-lamp', x: -76, z: 39.5, yaw: 0, scale: 1.4, solid: true },
  ];
  // Park railing along the north and south edges of the site (east side open to Gnorwin).
  const runLen = COURT_SITE.maxX - COURT_SITE.minX;
  const n = Math.floor(runLen / railLen);
  const startX = COURT_SITE.minX + (runLen - n * railLen) / 2 + railLen / 2;
  for (const z of [COURT_SITE.minZ + 0.3, COURT_SITE.maxZ - 0.3]) {
    for (let k = 0; k < n; k++) pieces.push({ prefab: 'civic-railing', x: startX + k * railLen, z, yaw: 0, solid: true });
  }
  const plan = planPieces(pieces);
  if (plan.missing.length) console.warn(`drainpipe court: missing prefabs: ${plan.missing.join(', ')}`);
  if (plan.placements.length) group.add(buildStaticCells(plan.placements, { lights: false, name: 'drainpipe-court-props', cls: 'building' }));
  boxes.push(...plan.boxes);

  scene.add(group);
  return { boxes, groundY, group };
}
