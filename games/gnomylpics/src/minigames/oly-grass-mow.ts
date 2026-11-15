// Grass Mowing: a Gnome Party slice of gnomylpics. Four gnomes push mowers round one shared 20x20 lawn for 40 s.
// Every patch of tall grass you cut first is yours and turns your colour. Rocks block the way, mowers bump each other.
// Most patches wins.
//
// Rules that keep a slice working in the party (packages/party/README.md):
//  - init/step/cpu/result are pure: no DOM, no three objects in the state, and only the rng argument for randomness.
//  - State S and input I are plain JSON. S stays under 2 KB.
//  - CPU memory (targets, skill) lives in S and step() updates it.
import * as THREE from 'three';
import type { MinigameDef } from '@lawn/party';
import { soleWinner } from '@lawn/party';
import { cpuSkill } from '../olympic/run';
import { placesFrom } from '../olympic/rank';
import { addRacers, addSkyAndLights, createBoard } from '../olympic/field';

// ---- constants ----
const N = 20; // cells per side; cell (i, j) centre: x = i - N/2 + 0.5, z = j - N/2 + 0.5 (1 m cells)
const SPEED = 3.4; // m/s at full stick
const TURN = 5; // rad/s
const CUT_R = 0.65; // cells whose centre is within this of the mower centre get cut
const MOWER_R = 0.45; // mowers push apart below 2 * MOWER_R
const ROCKS = 6;
const ROUND_S = 40; // meta.maxSeconds = 40 too
const START: [number, number][] = [[-8, -8], [8, -8], [-8, 8], [8, 8]]; // seat start (x, z)
const EDGE = N / 2 - 0.4; // mowers stay within +-EDGE
const TALL_H = 0.45; // metres
const CUT_H = 0.08;
const GRASS_COLOR = 0x2e7d32;
const CUT_BASE = 0x8bc34a;
const CUT_MIX = 0.35;
const HINT_S = 4;

// ---- types ----
interface I {
  x: number;
  y: number;
}
interface Mower {
  x: number;
  z: number;
  h: number;
  cut: number;
}
interface S {
  t: number;
  /** N*N chars, index j * N + i: '.' tall grass, '#' rock, '0'..'3' cut by that seat. */
  cells: string;
  m: Mower[];
  /** CPU target cell index per seat, -1 for none. */
  tgt: number[];
  skill: number[];
}

// ---- pure helpers ----
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const centre = (c: number): number => c - N / 2 + 0.5;
const cellI = (x: number): number => clamp(Math.floor(x + N / 2), 0, N - 1);
const cellJ = (z: number): number => clamp(Math.floor(z + N / 2), 0, N - 1);
const cellIdx = (x: number, z: number): number => cellJ(z) * N + cellI(x);
const r3 = (v: number): number => Math.round(v * 1000) / 1000;

/** Wraps an angle to -PI..PI. */
function wrap(a: number): number {
  let d = (a + Math.PI) % (2 * Math.PI);
  if (d < 0) d += 2 * Math.PI;
  return d - Math.PI;
}

const def: MinigameDef<S, I> = {
  meta: {
    id: 'oly-grass-mow',
    title: 'Grass Mowing',
    game: 'gnomylpics',
    goal: 'Mow more of the lawn than anyone in 40 seconds.',
    controls: 'Steer with WASD or the arrows (or drag on the screen).',
    maxSeconds: ROUND_S,
  },

  init(seats, rng) {
    const cells = new Array<string>(N * N).fill('.');
    const starts = START.map(([x, z]) => ({ i: cellI(x), j: cellJ(z) }));
    let placed = 0;
    let guard = 0;
    while (placed < ROCKS && guard < 10000) {
      guard++;
      const i = Math.floor(rng() * N);
      const j = Math.floor(rng() * N);
      const idx = j * N + i;
      if (cells[idx] !== '.') continue;
      if (starts.some((st) => Math.max(Math.abs(i - st.i), Math.abs(j - st.j)) <= 3)) continue;
      cells[idx] = '#';
      placed++;
    }
    return {
      t: 0,
      cells: cells.join(''),
      m: START.map(([x, z]) => ({ x, z, h: Math.atan2(-x, -z), cut: 0 })),
      tgt: seats.map(() => -1),
      skill: seats.map(() => cpuSkill(rng)),
    };
  },

  step(s, inputs, dt, rng) {
    s.t += dt;
    const cells = s.cells.split('');

    s.m.forEach((mw, k) => {
      const i = inputs[k] ?? { x: 0, y: 0 };
      // The camera looks down from +z, so screen-up is world -z.
      const dx = i.x;
      const dz = -i.y;
      const mag = Math.min(1, Math.hypot(dx, dz));
      if (mag > 0.15) {
        const want = Math.atan2(dx, dz);
        const diff = wrap(want - mw.h);
        mw.h += Math.max(-TURN * dt, Math.min(TURN * dt, diff));

        const ox = mw.x;
        const oz = mw.z;
        const d = SPEED * mag * dt;
        mw.x = clamp(mw.x + Math.sin(mw.h) * d, -EDGE, EDGE);
        mw.z = clamp(mw.z + Math.cos(mw.h) * d, -EDGE, EDGE);
        if (cells[cellIdx(mw.x, mw.z)] === '#') {
          mw.x = ox;
          mw.z = oz;
        }
      }

      // Cut the grass in the 3x3 block around the mower's cell.
      const ci = cellI(mw.x);
      const cj = cellJ(mw.z);
      for (let dj = -1; dj <= 1; dj++) {
        for (let di = -1; di <= 1; di++) {
          const i2 = ci + di;
          const j2 = cj + dj;
          if (i2 < 0 || j2 < 0 || i2 >= N || j2 >= N) continue;
          const idx = j2 * N + i2;
          if (cells[idx] !== '.') continue;
          if (Math.hypot(centre(i2) - mw.x, centre(j2) - mw.z) <= CUT_R) {
            cells[idx] = String(k);
            mw.cut += 1;
          }
        }
      }
    });

    // Push apart mowers that overlap.
    for (let a = 0; a < s.m.length; a++) {
      for (let b = a + 1; b < s.m.length; b++) {
        const A = s.m[a];
        const B = s.m[b];
        const ddx = B.x - A.x;
        const ddz = B.z - A.z;
        const dist = Math.hypot(ddx, ddz);
        if (dist >= 2 * MOWER_R || dist < 1e-9) continue;
        const half = (2 * MOWER_R - dist) / 2;
        const ux = ddx / dist;
        const uz = ddz / dist;
        A.x -= ux * half;
        A.z -= uz * half;
        B.x += ux * half;
        B.z += uz * half;
      }
    }
    // A push must not shove a mower off the lawn.
    for (const mw of s.m) {
      mw.x = clamp(mw.x, -EDGE, EDGE);
      mw.z = clamp(mw.z, -EDGE, EDGE);
    }

    // CPU targets: the nearest uncut grass, sometimes the second nearest.
    s.m.forEach((mw, k) => {
      if (s.tgt[k] >= 0 && cells[s.tgt[k]] === '.') return;
      const cands: { idx: number; d2: number }[] = [];
      for (let idx = 0; idx < N * N; idx++) {
        if (cells[idx] !== '.') continue;
        const cx = centre(idx % N) - mw.x;
        const cz = centre(Math.floor(idx / N)) - mw.z;
        cands.push({ idx, d2: cx * cx + cz * cz });
      }
      if (cands.length === 0) {
        s.tgt[k] = -1;
        return;
      }
      cands.sort((p, q) => p.d2 - q.d2);
      let pick = 0;
      if (cands.length > 1 && rng() < (1 - s.skill[k]) * 0.5) pick = 1;
      s.tgt[k] = cands[pick].idx;
    });

    s.cells = cells.join('');
    s.m.forEach((mw) => {
      mw.x = r3(mw.x);
      mw.z = r3(mw.z);
      mw.h = r3(mw.h);
    });
  },

  cpu(s, seat) {
    const t = s.tgt[seat];
    if (t < 0) return { x: 0, y: 0 };
    const mw = s.m[seat];
    const dx = centre(t % N) - mw.x;
    const dz = centre(Math.floor(t / N)) - mw.z;
    const len = Math.hypot(dx, dz);
    if (len < 1e-9) return { x: 0, y: 0 };
    const f = 0.65 + 0.3 * s.skill[seat];
    return { x: (dx / len) * f, y: -(dz / len) * f };
  },

  result(s, timeUp) {
    if (!timeUp && s.t < ROUND_S && s.cells.includes('.')) return null;
    return placesFrom(
      s.m.map((mw) => mw.cut),
      true,
    );
  },

  report(s, places, seats) {
    // The lawn to cut: every cell that is not a rock.
    const lawn = s.cells.split('').filter((c) => c !== '#').length;
    const w = soleWinner(places);
    const who = w === null ? null : (seats[w]?.name ?? null);
    const cut = w === null ? 0 : s.m[w].cut;
    const headline = !who ? undefined
      : lawn > 0 ? `${who} mowed ${Math.round((cut / lawn) * 100)}% of the lawn` : `${who} mowed ${cut} cells`;
    return {
      headline,
      stats: [
        { key: 'cut', label: 'Cells mowed', format: 'int', better: 'higher' },
        { key: 'share', label: 'Lawn', unit: '%', format: '1dp', better: 'higher' },
      ],
      values: s.m.map((mw) => ({ cut: mw.cut, share: lawn > 0 ? (mw.cut / lawn) * 100 : 0 })),
    };
  },

  createView(ctx) {
    const { scene, camera, ui, seats } = ctx;
    addSkyAndLights(scene);
    camera.position.set(0, 21, 15);
    camera.lookAt(0, 0, 1);

    // Soil under the lawn.
    const soil = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.MeshStandardMaterial({ color: 0x6b4a2b }));
    soil.rotation.x = -Math.PI / 2;
    soil.position.y = -0.02;
    soil.receiveShadow = true;
    scene.add(soil);

    // Low white picket fence round the edge.
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const half = N / 2 + 0.3;
    const post = new THREE.BoxGeometry(0.08, 0.6, 0.08);
    const railX = new THREE.BoxGeometry(2 * half, 0.05, 0.04);
    const railZ = new THREE.BoxGeometry(0.04, 0.05, 2 * half);
    for (let t = -half; t <= half + 1e-6; t += 0.6) {
      for (const [x, z] of [[t, -half], [t, half], [-half, t], [half, t]]) {
        const p = new THREE.Mesh(post, fenceMat);
        p.position.set(x, 0.3, z);
        p.castShadow = true;
        scene.add(p);
      }
    }
    for (const y of [0.2, 0.45]) {
      for (const z of [-half, half]) {
        const r = new THREE.Mesh(railX, fenceMat);
        r.position.set(0, y, z);
        scene.add(r);
      }
      for (const x of [-half, half]) {
        const r = new THREE.Mesh(railZ, fenceMat);
        r.position.set(x, y, 0);
        scene.add(r);
      }
    }

    // The lawn: one instance per cell.
    const grass = new THREE.InstancedMesh(new THREE.BoxGeometry(0.96, 1, 0.96), new THREE.MeshStandardMaterial(), N * N);
    grass.receiveShadow = true;
    scene.add(grass);
    const tallColor = new THREE.Color(GRASS_COLOR);
    const cutColors = seats.map((seat) => new THREE.Color(CUT_BASE).lerp(new THREE.Color(seat.color), CUT_MIX));
    const m4 = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();

    let prev: string[] | null = null;
    let rocksBuilt = false;
    let grassTotal = 1;

    const setCell = (idx: number, c: string): void => {
      const x = centre(idx % N);
      const z = centre(Math.floor(idx / N));
      if (c === '#') {
        pos.set(x, 0, z);
        scl.set(0, 0, 0);
      } else {
        const h = c === '.' ? TALL_H : CUT_H;
        pos.set(x, h / 2, z);
        scl.set(1, h, 1);
      }
      m4.compose(pos, quat, scl);
      grass.setMatrixAt(idx, m4);
      if (c === '.' || c === '#') grass.setColorAt(idx, tallColor);
      else grass.setColorAt(idx, cutColors[Number(c)] ?? tallColor);
    };

    // Mowers: a body in the seat colour, dark wheels, a handle sloping back. Local +z is forward.
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
    const wheelGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.08, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    const mowers = seats.map((seat) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.9), new THREE.MeshStandardMaterial({ color: seat.color }));
      body.position.y = 0.3;
      body.castShadow = true;
      g.add(body);
      for (const [x, z] of [[-0.4, -0.3], [0.4, -0.3], [-0.4, 0.3], [0.4, 0.3]]) {
        const w = new THREE.Mesh(wheelGeo, wheelMat);
        w.position.set(x, 0.16, z);
        g.add(w);
      }
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 1.0), handleMat);
      handle.position.set(0, 0.65, -0.6);
      handle.rotation.x = 0.5;
      g.add(handle);
      scene.add(g);
      return g;
    });

    const racers = addRacers(scene, seats);
    const board = createBoard(ui, seats, ctx.mySeat);

    // Display positions, eased towards the state.
    const disp: ({ x: number; z: number; h: number } | null)[] = seats.map(() => null);
    let first = true;

    return {
      render(s, dt) {
        const cells = s.cells;

        if (!rocksBuilt) {
          rocksBuilt = true;
          for (let idx = 0; idx < N * N; idx++) {
            if (cells[idx] !== '#') continue;
            const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45), new THREE.MeshStandardMaterial({ color: 0x8a8a8a, flatShading: true }));
            rock.position.set(centre(idx % N), 0.3, centre(Math.floor(idx / N)));
            rock.rotation.set(idx * 0.7, idx * 1.3, 0);
            rock.castShadow = true;
            scene.add(rock);
          }
          grassTotal = cells.split('').filter((c) => c !== '#').length;
        }

        // Only update cells whose character changed.
        let changed = false;
        for (let idx = 0; idx < N * N; idx++) {
          const c = cells[idx];
          if (prev && prev[idx] === c) continue;
          setCell(idx, c);
          changed = true;
        }
        if (changed) {
          grass.instanceMatrix.needsUpdate = true;
          if (grass.instanceColor) grass.instanceColor.needsUpdate = true;
        }
        prev = cells.split('');

        const ease = 1 - Math.exp(-dt * 15);
        s.m.forEach((target, k) => {
          let d = disp[k];
          let vx = 0;
          let vz = 0;
          if (!d) {
            d = { x: target.x, z: target.z, h: target.h };
            disp[k] = d;
          } else {
            const ox = d.x;
            const oz = d.z;
            d.x += (target.x - d.x) * ease;
            d.z += (target.z - d.z) * ease;
            d.h += wrap(target.h - d.h) * ease;
            if (dt > 0) {
              vx = (d.x - ox) / dt;
              vz = (d.z - oz) / dt;
            }
          }

          const g = mowers[k];
          g.position.set(d.x, 0, d.z);
          g.rotation.y = d.h;

          // The gnome walks just behind its mower.
          const r = racers[k];
          const gx = d.x - Math.sin(d.h) * 0.85;
          const gz = d.z - Math.cos(d.h) * 0.85;
          r.pose.position.set(gx, 0, gz);
          r.pose.velocity.set(vx, 0, vz);
          r.pose.facing = d.h;
          r.model.update(r.pose, dt);
          r.label.position.set(gx, 1.9, gz);
        });

        seats.forEach((seat, k) => {
          const cut = s.m[k].cut;
          board.set(seat.seat, `${cut}  (${Math.round((cut * 100) / grassTotal)}%)`);
        });
        board.hint(s.t < HINT_S ? 'Steer with WASD / arrows (or drag)' : '');

        if (first) {
          first = false;
          board.banner('MOW!');
        }
      },
      input(pad) {
        return { x: Math.round(pad.x * 100) / 100, y: Math.round(pad.y * 100) / 100 };
      },
    };
  },
};

export default def;
