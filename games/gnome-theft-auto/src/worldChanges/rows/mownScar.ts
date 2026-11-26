// World change W14 (E21, row 52 m52-the-test-cut): the mown scar across Hedgeworth Links. The Grand Combine's deck cut
// its test line here: from the middle of the course, past the south end of the hedge between the ninth and the middle
// (now cut clean, its stub left standing on the far side), across the ninth fairway south of the green, to the Kicked
// Board, where it stopped a yard from the fence, pointing at Turfton. What it leaves: a dead-straight scalped lane in
// perfectly even stripes (a little too clean), the gala's nearest-the-pin flag snapped in two on the ninth, the hedge
// stub and its clippings, the Flock standing beside the lane on one leg, a stack of turf rolls and Thrift's watering
// can by the ninth (he means to mend it), and two HOA signs at the ends. Flat things take draw layers
// (docs/rendering.md); props have no colliders (rules: ../registry.ts). The scenes of row 52 use the same line
// (cutscene/scenes/story/m52-the-test-cut.ts LINE_A / LINE_B).
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { createGnomeModel, type GnomeLook } from '@lawn/gnome';
import { buildPrefab } from '@lawn/prefabs';
import { coastSign } from '../../coast/sign';
import { registerWorldChange, type WorldChangeCtx } from '../registry';

/** The test line (world x, z), metres; the lane's full width. Kept clear of every green, tee, bunker, pond and building. */
export const TEST_LINE = { a: [-1172, 703.5] as const, b: [-1004, 641] as const, width: 8 } as const;

const LEN = Math.hypot(TEST_LINE.b[0] - TEST_LINE.a[0], TEST_LINE.b[1] - TEST_LINE.a[1]);
const DX = (TEST_LINE.b[0] - TEST_LINE.a[0]) / LEN;
const DZ = (TEST_LINE.b[1] - TEST_LINE.a[1]) / LEN;
/** The lane's heading (yaw 0 = +z), east-north-east. */
const YAW = Math.atan2(DX, DZ);
/** A point `t` metres along the line, `side` metres off it (+ = south side, - = north side). */
const at = (t: number, side = 0): [number, number] => [TEST_LINE.a[0] + DX * t - DZ * side, TEST_LINE.a[1] + DZ * t + DX * side];

/** Scalped turf, the stripes the deck left in it, and the windrows of clippings along both edges. */
const SCALP = 0xc8c48c;
const STRIPE = 0xb3b277;
const WINDROW = 0x7f9a46;
const CLIPPINGS = 0x5c8a3a;
/** Lifts follow the layers (scar on decal, its stripes and windrows one up): never a lower layer above a higher one. */
const LIFT = 0.035;
const LIFT_UP = 0.045;
const STRIPE_BAND = 4;

/** The south end of the hedge between the ninth and the middle (golf/types.ts HEDGES[3].b), and its direction. */
const HEDGE_END: [number, number] = [-1150, 690];
const HEDGE_DIR: [number, number] = [-40 / Math.hypot(40, 90), 90 / Math.hypot(40, 90)];

const FLOCK: Partial<GnomeLook> = { shirt: 0x8d9096, pants: 0x6f7378, hat: 0x9aa0a8, skin: 0xf1c27d, beard: 0xd8d8dc };
const BASE: GnomeLook = {
  hat: 0xd93636, shirt: 0x3b6ea5, pants: 0x2c3e50, skin: 0xf1c27d, boots: 0x222222, beard: 0xdddddd,
  hair: null, freckles: false, dress: false, glasses: false, bowlCut: null,
};

function flatMat(color: number, layer: number): THREE.MeshBasicMaterial {
  return flatLayer(new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }), layer);
}

/** A strip along the line from t0 to t1 between side offsets s0 and s1, on the ground plus `lift`. */
function strip(ctx: WorldChangeCtx, t0: number, t1: number, s0: number, s1: number, lift: number, mat: THREE.Material, name: string): THREE.Mesh {
  const steps = Math.max(1, Math.ceil((t1 - t0) / 2));
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = t0 + ((t1 - t0) * i) / steps;
    for (const s of [s0, (s0 + s1) / 2, s1]) {
      const [x, z] = at(t, s);
      pos.push(x, ctx.groundY(x, z) + lift, z);
    }
    if (i > 0) {
      const r0 = (i - 1) * 3, r1 = i * 3;
      for (let k = 0; k < 2; k++) idx.push(r0 + k, r1 + k, r0 + k + 1, r0 + k + 1, r1 + k, r1 + k + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = name;
  return mesh;
}

function put(ctx: WorldChangeCtx, root: THREE.Group, g: THREE.Object3D, x: number, z: number, yaw = 0, s = 1, dy = 0): THREE.Object3D {
  g.position.set(x, ctx.groundY(x, z) + dy, z);
  g.rotation.y = yaw;
  g.scale.multiplyScalar(s);
  root.add(g);
  return g;
}

/** A low heap of hedge clippings (the sand-mound prefab, shrunk and recoloured leaf green, like moles.ts' molehills). */
function clippings(ctx: WorldChangeCtx, root: THREE.Group, x: number, z: number, s: number): void {
  const m = buildPrefab('sand-mound');
  m.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
    mat.color.setHex(CLIPPINGS);
    mesh.material = mat;
  });
  put(ctx, root, m, x, z, x * 0.37, s);
}

/** One of the Flock on one leg beside the lane (left leg drawn up, as the 'one-leg' idle), facing it. */
function onOneLeg(ctx: WorldChangeCtx, root: THREE.Group, x: number, z: number, yaw: number, look: Partial<GnomeLook>): THREE.Object3D {
  const m = createGnomeModel({ ...BASE, ...look });
  if (m.legs) m.legs.left.rotation.x = -1.4;
  m.arms.left.rotation.z = 0.35;
  m.arms.right.rotation.z = -0.35;
  m.object.position.set(x, ctx.groundY(x, z), z);
  m.object.rotation.y = yaw;
  m.object.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
  root.add(m.object);
  return m.rig;
}

registerWorldChange('W14', (ctx) => {
  const root = new THREE.Group();
  root.name = 'W14-mown-scar';
  const half = TEST_LINE.width / 2;

  // ---- The lane: scalped turf on the decal layer, even stripes and two windrows one layer up --------------------------
  root.add(strip(ctx, 0, LEN, -half, half, LIFT, flatMat(SCALP, LAYER.decal), 'W14-scar'));
  const stripeMat = flatMat(STRIPE, LAYER.decal + 1);
  for (let k = 0; k * STRIPE_BAND < LEN; k += 2) {
    const t0 = k * STRIPE_BAND;
    root.add(strip(ctx, t0, Math.min(LEN, t0 + STRIPE_BAND), -half + 0.4, half - 0.4, LIFT_UP, stripeMat, `W14-stripe-${k / 2}`));
  }
  const rowMat = flatMat(WINDROW, LAYER.decal + 1);
  root.add(strip(ctx, 0, LEN, -half - 0.5, -half + 0.05, LIFT_UP, rowMat, 'W14-windrow-n'));
  root.add(strip(ctx, 0, LEN, half - 0.05, half + 0.5, LIFT_UP, rowMat, 'W14-windrow-s'));

  // ---- The cut hedge: the real hedge ends at the lane's north edge; its stub stands on the south side, cut to the knee --
  const stubFrom = TEST_LINE.width + 1.0;
  const hedgeYaw = Math.atan2(-HEDGE_DIR[1], HEDGE_DIR[0]);
  for (const along of [2, 6]) {
    const d = stubFrom + along;
    const stub = buildPrefab('hedge-wall');
    stub.scale.set(1, 0.32, 1);
    put(ctx, root, stub, HEDGE_END[0] + HEDGE_DIR[0] * d, HEDGE_END[1] + HEDGE_DIR[1] * d, hedgeYaw);
  }
  clippings(ctx, root, HEDGE_END[0] + HEDGE_DIR[0] * 1.2 + 1.2, HEDGE_END[1] + HEDGE_DIR[1] * 1.2, 0.14);
  clippings(ctx, root, HEDGE_END[0] + HEDGE_DIR[0] * (stubFrom - 0.6) - 1.4, HEDGE_END[1] + HEDGE_DIR[1] * (stubFrom - 0.6), 0.12);
  // A chunk of the hedge the deck threw aside, lying on its flank just off the lane.
  const [cx, cz] = at(30, -half - 2.6);
  const chunk = buildPrefab('hedgerow');
  put(ctx, root, chunk, cx, cz, YAW + 0.5, 0.7, 0.15);
  chunk.rotation.z = 1.2;

  // ---- The gala's nearest-the-pin flag on the ninth, snapped: the stub in the turf, the top lying beside it ----------
  const [fx, fz] = at(96, -1.5);
  const stubFlag = buildPrefab('golf-flagstick');
  stubFlag.scale.set(1, 0.3, 1);
  put(ctx, root, stubFlag, fx, fz, 0);
  const topFlag = buildPrefab('golf-flagstick');
  put(ctx, root, topFlag, fx + 1.1, fz + 0.4, YAW, 0.9, 0.06);
  topFlag.rotation.z = 1.45;

  // ---- The Flock, beside the lane on one leg, where they stood in its path (north side, facing it) ---------------------
  // The side vector (+ = south) is (-DZ, DX); facing it from the north side is yaw atan2(-DZ, DX).
  const faceLane = Math.atan2(-DZ, DX);
  const flock: THREE.Object3D[] = [];
  [56, 59, 62, 65].forEach((t, i) => {
    const [x, z] = at(t, -half - 3.2);
    flock.push(onOneLeg(ctx, root, x, z, faceLane, i === 1 ? { ...FLOCK, hat: 0xb8b8c0 } : FLOCK));
  });

  // ---- By the ninth: Thrift means to mend it --------------------------------------------------------------------------
  const [rx, rz] = at(104, -half - 2.2);
  put(ctx, root, buildPrefab('turf-roll-stack'), rx, rz, YAW, 1);
  const [wx, wz] = at(103, -half + 0.8);
  put(ctx, root, buildPrefab('watering-can'), wx, wz, YAW + 2.2, 1);

  // ---- The HOA's signs at both ends ------------------------------------------------------------------------------------
  const signOpts = { w: 2.4, h: 0.9, bg: 0xe8dcc0, fg: 0x2b2116, post: 0.9 };
  const [ax, az] = at(-2.5, half + 1.5);
  put(ctx, root, coastSign('HOA TEST LINE. KEEP OFF.', signOpts), ax, az, YAW + Math.PI);
  const [bx, bz] = at(LEN - 4, -half - 1.5);
  put(ctx, root, coastSign('TEST CONCLUDED. THANK YOU.', signOpts), bx, bz, YAW + Math.PI);

  return {
    root,
    update(_dt, t) {
      // The Flock wobble on their one leg, each a little out of step with the next.
      flock.forEach((rig, i) => { rig.rotation.z = 0.025 * Math.sin(t * 1.6 + i * 1.3); });
    },
  };
});
