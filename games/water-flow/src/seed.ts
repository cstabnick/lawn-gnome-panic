import { DX, MAX_PARTICLES, PARTICLE_SPACING, SceneId } from './config';

export interface CupPose {
  x: number;
  y: number;
  z: number;
  tilt: number; // radians
}

export interface Seeded {
  data: Float32Array; // 20 floats per particle: pos(4) vel(4) C columns(12), positions in grid units
  count: number;
  capacity: number; // how many particles the scene could hold
}

type P = [number, number, number];

function lattice(min: P, max: P, keep: (x: number, y: number, z: number) => boolean): P[] {
  const out: P[] = [];
  const sp = PARTICLE_SPACING;
  const i0 = [0, 1, 2].map((a) => Math.ceil(min[a] / sp - 0.5));
  const i1 = [0, 1, 2].map((a) => Math.floor(max[a] / sp - 0.5));
  for (let i = i0[0]; i <= i1[0]; i++)
    for (let j = i0[1]; j <= i1[1]; j++)
      for (let k = i0[2]; k <= i1[2]; k++) {
        const x = (i + 0.5) * sp;
        const y = (j + 0.5) * sp;
        const z = (k + 0.5) * sp;
        if (keep(x, y, z)) out.push([x, y, z]);
      }
  return out;
}

function fillRegion(scene: SceneId, cup: CupPose): P[] {
  switch (scene) {
    case 0: {
      // Cup interior in cup-local space, then moved to the current cup pose.
      const pts = lattice([-0.2, -0.22, -0.2], [0.2, 0.2, 0.2], (x, y, z) => Math.hypot(x, z) < 0.18 - 0.011 && y > -0.2 + 0.04 + 0.011 && y < 0.2 - 0.03);
      const c = Math.cos(cup.tilt);
      const s = Math.sin(cup.tilt);
      // local -> world is Rz(-tilt)
      const world = pts.map(([x, y, z]): P => [cup.x + c * x + s * y, cup.y - s * x + c * y, cup.z + z]);
      // sort by local height so a small count fills from the cup floor up
      const order = pts.map((p, i) => [p[1], i] as const).sort((a, b) => a[0] - b[0]);
      return order.map(([, i]) => world[i]);
    }
    case 1:
      return sortY(lattice([0.19, 0.462, 0.51], [0.48, 0.8, 1.09], () => true));
    case 2:
      return sortY(
        lattice([0.5, 0.63, 0.5], [1.1, 0.98, 1.1], (x, y, z) => {
          const ri = 0.06 + (0.3 - 0.06) * Math.min(Math.max((y - 0.62) / 0.38, 0), 1);
          return Math.hypot(x - 0.8, z - 0.8) < ri - 0.012;
        }),
      );
    default:
      return sortY(lattice([0.19, 0.087, 0.51], [0.49, 0.85, 1.09], () => true));
  }
}

function sortY(pts: P[]): P[] {
  return pts.sort((a, b) => a[1] - b[1]);
}

export function seedScene(scene: SceneId, wanted: number, cup: CupPose): Seeded {
  const pts = fillRegion(scene, cup);
  const count = Math.min(wanted, pts.length, MAX_PARTICLES);
  const data = new Float32Array(count * 20);
  for (let i = 0; i < count; i++) {
    const o = i * 20;
    data[o] = pts[i][0] / DX;
    data[o + 1] = pts[i][1] / DX;
    data[o + 2] = pts[i][2] / DX;
  }
  return { data, count, capacity: pts.length };
}
