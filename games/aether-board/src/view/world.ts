// The ethereal plane, drawn: sky, fog, light, cel-shaded islands, kickers, rails, ley-lines, the gate, decor.
import * as THREE from 'three';
import { PALETTE, ISLAND_TOPS } from '../config';
import { GRADIENT, toonMat, addOutline } from './toon';
import { surfaceY, kickerHeight, groundAt } from '../world';
import type { Island, Kicker, Rail, World } from '../world';

export interface WorldView {
  update(dt: number, t: number, camPos: THREE.Vector3, flow: number): void;
}

type V3 = [number, number, number];

/** Shared clock and flow: every shader reads these, so update() sets them once. */
const U = { time: { value: 0 }, flow: { value: 0 } };

const glowMat = new THREE.MeshBasicMaterial({
  color: PALETTE.cyan, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false,
});

// ---------------------------------------------------------------- helpers

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Linear colour of a hex, times k. */
function rgb(hex: number, k = 1): V3 {
  const c = new THREE.Color(hex);
  return [c.r * k, c.g * k, c.b * k];
}

const yAt = (isl: Island, x: number, z: number): number => surfaceY(isl, x, z) ?? isl.baseY;

/** Collects triangles; each is wound so its normal points along the given want direction. */
class Builder {
  private p: V3[] = [];
  private c: V3[] = [];
  private tris: number[] = [];

  vert(p: V3, c: V3): number {
    this.p.push(p);
    this.c.push(c);
    return this.p.length - 1;
  }

  tri(a: number, b: number, c: number, want: V3): void {
    const A = this.p[a];
    const B = this.p[b];
    const C = this.p[c];
    const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2];
    const vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    if (nx * want[0] + ny * want[1] + nz * want[2] < 0) this.tris.push(a, c, b);
    else this.tris.push(a, b, c);
  }

  /** flat: hard-edged normals (one vertex per corner). */
  build(flat: boolean): THREE.BufferGeometry {
    const pos = new Float32Array(this.p.length * 3);
    const col = new Float32Array(this.c.length * 3);
    this.p.forEach((p, i) => pos.set(p, i * 3));
    this.c.forEach((c, i) => col.set(c, i * 3));
    let g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setIndex(this.tris);
    if (flat) g = g.toNonIndexed();
    g.computeVertexNormals();
    return g;
  }
}

// ---------------------------------------------------------------- islands

/** Polar grid top of one island, lit by its ISLAND_TOPS colour with noise and a darker outer ring. */
function buildTop(isl: Island): THREE.Mesh {
  const RINGS = 32;
  const SEG = 72;
  const b = new Builder();
  const rnd = rng(isl.id * 7919 + 17);
  const base = ISLAND_TOPS[isl.color % ISLAND_TOPS.length];
  const up: V3 = [0, 1, 0];
  const centre = b.vert([isl.cx, yAt(isl, isl.cx, isl.cz), isl.cz], rgb(base, 1 + (rnd() * 2 - 1) * 0.06));
  const rows: number[][] = [];
  for (let i = 1; i <= RINGS; i++) {
    const rr = isl.r * 0.998 * (i / RINGS);
    const row: number[] = [];
    for (let j = 0; j < SEG; j++) {
      const th = (j / SEG) * Math.PI * 2;
      const x = isl.cx + Math.cos(th) * rr;
      const z = isl.cz + Math.sin(th) * rr;
      const k = (1 + (rnd() * 2 - 1) * 0.06) * (rr / isl.r > 0.92 ? 0.75 : 1);
      row.push(b.vert([x, yAt(isl, x, z), z], rgb(base, k)));
    }
    rows.push(row);
  }
  for (let j = 0; j < SEG; j++) b.tri(centre, rows[0][(j + 1) % SEG], rows[0][j], up);
  for (let i = 0; i < RINGS - 1; i++) {
    for (let j = 0; j < SEG; j++) {
      const a = rows[i][j];
      const bb = rows[i][(j + 1) % SEG];
      const c = rows[i + 1][j];
      const d = rows[i + 1][(j + 1) % SEG];
      b.tri(a, bb, c, up);
      b.tri(bb, d, c, up);
    }
  }
  return new THREE.Mesh(b.build(false), toonMat(0xffffff, { vertexColors: true }));
}

/** Jagged crystal underside, a rim band, and crystal shards stuck in the cone. */
function buildUnderside(isl: Island): THREE.Group {
  const SEG = 24;
  const g = new THREE.Group();
  const rnd = rng(isl.id * 104729 + 3);
  const base = ISLAND_TOPS[isl.color % ISLAND_TOPS.length];
  const tipY = isl.baseY - isl.r * 1.1;
  const rimY: number[] = [];
  for (let j = 0; j < SEG; j++) {
    const th = (j / SEG) * Math.PI * 2;
    rimY.push(yAt(isl, isl.cx + Math.cos(th) * isl.r * 0.998, isl.cz + Math.sin(th) * isl.r * 0.998));
  }
  const topAvg = rimY.reduce((s, y) => s + y, 0) / SEG;

  // Cone: levels 0..3 are rings (level 0 at the rim), then the tip.
  const cone = new Builder();
  const lv: number[][] = [];
  for (let k = 0; k < 4; k++) {
    const row: number[] = [];
    const col = k % 2 === 0 ? PALETTE.purple : PALETTE.lilac;
    const f = k / 4;
    for (let j = 0; j < SEG; j++) {
      const th = (j / SEG) * Math.PI * 2;
      const cs = Math.cos(th);
      const sn = Math.sin(th);
      const top = rimY[j] - 0.2;
      if (k === 0) {
        row.push(cone.vert([isl.cx + cs * isl.r, top, isl.cz + sn * isl.r], rgb(col)));
      } else {
        const rad = isl.r * (1 - f) * (0.85 + 0.3 * rnd());
        const y = top + (tipY - top) * f + (rnd() * 2 - 1) * 1.5;
        row.push(cone.vert([isl.cx + cs * rad, y, isl.cz + sn * rad], rgb(col)));
      }
    }
    lv.push(row);
  }
  const tip = cone.vert([isl.cx, tipY, isl.cz], rgb(PALETTE.purple));
  const depth = topAvg - tipY;
  for (let j = 0; j < SEG; j++) {
    const j1 = (j + 1) % SEG;
    const m = ((j + 0.5) / SEG) * Math.PI * 2;
    const want: V3 = [Math.cos(m) * depth, -isl.r, Math.sin(m) * depth];
    for (let k = 0; k < 3; k++) {
      cone.tri(lv[k][j], lv[k][j1], lv[k + 1][j], want);
      cone.tri(lv[k][j1], lv[k + 1][j1], lv[k + 1][j], want);
    }
    cone.tri(lv[3][j], lv[3][j1], tip, want);
  }
  const coneMesh = new THREE.Mesh(cone.build(true), toonMat(0xffffff, { vertexColors: true }));
  addOutline(coneMesh, 0.35);
  g.add(coneMesh);

  // Rim band: a 1.2 m open ring under the rim edge, darkened island colour.
  const band = new Builder();
  const bandCol = rgb(base, 0.6);
  const top: number[] = [];
  const bot: number[] = [];
  for (let j = 0; j < SEG; j++) {
    const th = (j / SEG) * Math.PI * 2;
    const x = isl.cx + Math.cos(th) * isl.r;
    const z = isl.cz + Math.sin(th) * isl.r;
    top.push(band.vert([x, rimY[j], z], bandCol));
    bot.push(band.vert([x, rimY[j] - 1.2, z], bandCol));
  }
  for (let j = 0; j < SEG; j++) {
    const j1 = (j + 1) % SEG;
    const m = ((j + 0.5) / SEG) * Math.PI * 2;
    const want: V3 = [Math.cos(m), 0, Math.sin(m)];
    band.tri(top[j], bot[j], top[j1], want);
    band.tri(top[j1], bot[j], bot[j1], want);
  }
  const bandMesh = new THREE.Mesh(band.build(false), toonMat(0xffffff, { vertexColors: true }));
  addOutline(bandMesh, 0.05);
  g.add(bandMesh);

  // Crystal shards stuck into the cone.
  const n = 4 + Math.floor(rnd() * 4);
  for (let s = 0; s < n; s++) {
    const t = 0.15 + rnd() * 0.6;
    const ang = rnd() * Math.PI * 2;
    const rad = isl.r * (1 - t) * 0.95;
    const y = topAvg - 0.2 - t * (topAvg - 0.2 - tipY);
    const size = 1.2 + rnd() * 1.3;
    const colr = s % 2 === 0 ? PALETTE.cyan : PALETTE.pink;
    const geo = new THREE.OctahedronGeometry(size, 0);
    geo.scale(0.4, 1, 0.4);
    const m = new THREE.Mesh(geo, toonMat(colr, { emissive: colr, emissiveIntensity: 0.8 }));
    m.position.set(isl.cx + Math.cos(ang) * rad, y, isl.cz + Math.sin(ang) * rad);
    m.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
    addOutline(m, 0.06);
    g.add(m);
  }
  return g;
}

/** A kicker ramp: the top grid sampled from the physics surface, lip and side walls down to the island. */
function buildKicker(isl: Island, k: Kicker): THREE.Mesh {
  const fx = Math.sin(k.yaw);
  const fz = Math.cos(k.yaw);
  const nu = Math.max(1, Math.ceil(k.len / 0.5));
  const nv = Math.max(1, Math.ceil(k.width / 0.5));
  const hw = k.width / 2;
  const base = k.big ? PALETTE.pink : PALETTE.cyan;
  const stripe = k.big ? PALETTE.yellow : 0xffffff;
  const b = new Builder();
  const xz = (u: number, v: number): [number, number] => [k.x + fx * u + fz * v, k.z + fz * u - fx * v];
  const top = (u: number, v: number): V3 => {
    const [x, z] = xz(u, v);
    return [x, yAt(isl, x, z) + 0.03, z];
  };
  // Surface without this kicker: the bottom of the walls.
  const low = (u: number, v: number): V3 => {
    const [x, z] = xz(u, v);
    return [x, yAt(isl, x, z) - kickerHeight(k, x, z), z];
  };
  const UP: V3 = [0, 1, 0];

  const grid: number[][] = [];
  for (let i = 0; i <= nu; i++) {
    const u = (k.len * i) / nu;
    const colr = Math.floor(i / 2) % 2 === 1 ? stripe : base;
    const row: number[] = [];
    for (let j = 0; j <= nv; j++) row.push(b.vert(top(u, -hw + (k.width * j) / nv), rgb(colr)));
    grid.push(row);
  }
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      b.tri(grid[i][j], grid[i][j + 1], grid[i + 1][j], UP);
      b.tri(grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j], UP);
    }
  }

  // A vertical strip of walls along a line of (u, v) points.
  const wallCol = rgb(base, 0.9);
  const strip = (uv: [number, number][], want: V3): void => {
    const T = uv.map(([u, v]) => b.vert(top(u, v), wallCol));
    const B = uv.map(([u, v]) => b.vert(low(u, v), wallCol));
    for (let i = 0; i < uv.length - 1; i++) {
      b.tri(T[i], B[i], T[i + 1], want);
      b.tri(T[i + 1], B[i], B[i + 1], want);
    }
  };
  const alongU = (v: number): [number, number][] =>
    Array.from({ length: nu + 1 }, (_, i) => [(k.len * i) / nu, v] as [number, number]);
  strip(alongU(-hw), [-fz, 0, fx]);
  strip(alongU(hw), [fz, 0, -fx]);
  strip(Array.from({ length: nv + 1 }, (_, j) => [k.len, -hw + (k.width * j) / nv] as [number, number]), [fx, 0, fz]);

  const mesh = new THREE.Mesh(b.build(false), toonMat(0xffffff, { vertexColors: true }));
  addOutline(mesh, 0.06);
  return mesh;
}

// ---------------------------------------------------------------- rails and ley-lines

const VERT_UV = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

const LEY_FRAG = /* glsl */ `
  uniform float time;
  uniform float len;
  varying vec2 vUv;
  void main() {
    vec3 cyan = vec3(0.18, 0.89, 0.9);
    vec3 pink = vec3(1.0, 0.25, 0.64);
    vec3 base = mix(cyan, pink, vUv.x);
    float ph = fract(vUv.x * len / 6.0 - time * 1.5);
    float band = smoothstep(0.0, 0.2, ph) * (1.0 - smoothstep(0.2, 0.5, ph));
    vec3 col = base * (0.9 + 0.5 * band) + vec3(1.0) * band * 0.6;
    gl_FragColor = vec4(col, 1.0);
  }`;

function buildRail(w: World, rail: Rail): THREE.Group {
  const grp = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3(rail.pts);
  const segs = Math.max(16, rail.pts.length * 2);
  if (!rail.ley) {
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, segs, 0.08, 8), toonMat(PALETTE.yellow));
    addOutline(tube, 0.03);
    grp.add(tube);
    // Support posts every 4 m, down to the island under each point.
    const postMat = toonMat(0x3b1d6b);
    for (let i = 0; i < rail.pts.length; i += 4) {
      const p = rail.pts[i];
      const ground = groundAt(w, p.x, p.z, p.y);
      const gy = ground ? ground.y : p.y - 1.1;
      const h = p.y - gy;
      if (h < 0.05) continue;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, h, 6), postMat);
      post.position.set(p.x, (p.y + gy) / 2, p.z);
      grp.add(post);
    }
  } else {
    const core = new THREE.Mesh(
      new THREE.TubeGeometry(curve, segs, 0.22, 8),
      new THREE.ShaderMaterial({
        uniforms: { time: U.time, len: { value: rail.len } },
        vertexShader: VERT_UV,
        fragmentShader: LEY_FRAG,
        fog: false,
      }),
    );
    const glow = new THREE.Mesh(new THREE.TubeGeometry(curve, segs, 0.7, 8), glowMat);
    grp.add(core, glow);
  }
  return grp;
}

// ---------------------------------------------------------------- gate

const GATE_FRAG = /* glsl */ `
  uniform float time;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0;
    float a = atan(p.y, p.x);
    float sw = sin(a * 3.0 + r * 9.0 - time * 3.0);
    vec3 c = mix(vec3(1.0, 0.25, 0.64), vec3(0.18, 0.89, 0.9), 0.5 + 0.5 * sin(a * 2.0 - time));
    c = mix(c, vec3(1.0, 0.88, 0.3), smoothstep(0.6, 1.0, sw));
    float alpha = (0.35 + 0.35 * sw) * (1.0 - smoothstep(0.7, 1.0, r));
    gl_FragColor = vec4(c, alpha);
  }`;

// ---------------------------------------------------------------- sky

const SKY_FRAG = /* glsl */ `
  uniform float time;
  uniform float flow;
  varying vec3 vDir;

  float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }

  float ribbon(float y, float az, float yc, float w, float ph) {
    float wave = yc + 0.08 * sin(az * 3.0 + ph + time * 0.15);
    float q = (y - wave) / w;
    return exp(-q * q) * (0.6 + 0.4 * sin(az * 7.0 - time * 0.4 + ph));
  }

  void main() {
    vec3 d = normalize(vDir);
    float y = d.y;
    vec3 peach = vec3(1.0, 0.839, 0.647);
    vec3 pink = vec3(1.0, 0.31, 0.627);
    vec3 purple = vec3(0.482, 0.184, 0.969);
    vec3 violet = vec3(0.169, 0.039, 0.478);
    vec3 cyan = vec3(0.176, 0.886, 0.902);
    vec3 teal = vec3(0.024, 0.188, 0.42);
    vec3 lime = vec3(0.714, 1.0, 0.231);

    vec3 c;
    if (y >= 0.0) {
      c = y < 0.06 ? mix(peach, pink, y / 0.06)
        : y < 0.35 ? mix(pink, purple, (y - 0.06) / 0.29)
        : mix(purple, violet, clamp((y - 0.35) / 0.65, 0.0, 1.0));
    } else {
      c = y > -0.06 ? mix(peach, cyan, -y / 0.06)
        : mix(cyan, teal, clamp((-y - 0.06) / 0.44, 0.0, 1.0));
    }

    // Stars: one per hashed cell of the direction, above the horizon.
    vec3 g = d * 160.0;
    float r = hash(floor(g));
    float core = 1.0 - smoothstep(0.0, 0.3, length(fract(g) - 0.5));
    float star = step(0.985, r) * core * (0.7 + 0.3 * sin(time * 2.0 + r * 60.0));
    c += vec3(1.0, 0.97, 0.9) * star * smoothstep(0.25, 0.5, y);

    // Aurora ribbons.
    float az = atan(d.z, d.x);
    float k = 0.6 + 0.8 * flow;
    float up = smoothstep(0.12, 0.3, y);
    c += (pink * ribbon(y, az, 0.5, 0.06, 0.0)
        + cyan * ribbon(y, az, 0.6, 0.05, 2.1)
        + lime * ribbon(y, az, 0.42, 0.04, 4.2)) * 0.9 * k * up;

    // Aether sun, low and ahead.
    vec3 sunDir = normalize(vec3(0.35, 0.14, 0.92));
    float a = 1.0 - dot(d, sunDir);
    float disc = 1.0 - smoothstep(0.0022, 0.0028, a);
    float halo = exp(-a * 40.0) * 0.9 + exp(-a * 6.0) * 0.3;
    c = mix(c, vec3(1.0, 0.97, 0.85), disc);
    c += vec3(1.0, 0.82, 0.6) * halo;

    float l = dot(c, vec3(0.299, 0.587, 0.114));
    c = mix(vec3(l), c, 1.0 + 0.25 * flow);
    gl_FragColor = vec4(c, 1.0);
  }`;

const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

// ---------------------------------------------------------------- view

export function createWorldView(scene: THREE.Scene, w: World): WorldView {
  scene.background = new THREE.Color(0xff9ad5);
  scene.fog = new THREE.Fog(0xff9ad5, 140, 950);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8b5cff, 1.3));
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.0);
  sun.position.set(0.4, 1, 0.25);
  scene.add(sun);

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1800, 48, 24),
    new THREE.ShaderMaterial({
      uniforms: U,
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    }),
  );
  sky.renderOrder = -1;
  sky.frustumCulled = false;
  scene.add(sky);

  const root = new THREE.Group();
  scene.add(root);

  for (const isl of w.islands) {
    root.add(buildTop(isl), buildUnderside(isl));
    for (const k of isl.kickers) root.add(buildKicker(isl, k));
  }
  for (const rail of w.rails) root.add(buildRail(w, rail));

  // Gate: a hue-cycling torus with a swirling disc in its hole.
  const gate = new THREE.Group();
  gate.position.copy(w.gate.pos);
  gate.rotation.y = w.gate.yaw;
  const ringMat = new THREE.MeshToonMaterial({
    color: 0xffffff, emissive: PALETTE.pink, emissiveIntensity: 1, gradientMap: GRADIENT,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(w.gate.r, 1.4, 12, 64), ringMat);
  addOutline(ring, 0.25);
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(w.gate.r - 1, 48),
    new THREE.ShaderMaterial({
      uniforms: { time: U.time },
      vertexShader: VERT_UV,
      fragmentShader: GATE_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  );
  gate.add(ring, disc);
  root.add(gate);

  // Decor: rocks, crystals and clouds around each gap. Each bobs with its own phase.
  const decorObjs: { obj: THREE.Object3D; y: number; phase: number; rot: number; spin: boolean }[] = [];
  const crystalCols = [PALETTE.pink, PALETTE.cyan, PALETTE.yellow];
  w.decor.forEach((d, i) => {
    const rnd = rng(i * 977 + 5);
    const obj = new THREE.Group();
    obj.position.set(d.x, d.y, d.z);
    if (d.kind === 'rock') {
      const m = new THREE.Mesh(new THREE.DodecahedronGeometry(d.s, 0), toonMat(PALETTE.lilac));
      addOutline(m, 0.08 * d.s);
      obj.add(m);
    } else if (d.kind === 'crystal') {
      const col = crystalCols[i % crystalCols.length];
      const geo = new THREE.OctahedronGeometry(d.s, 0);
      geo.scale(0.4, 1, 0.4);
      const m = new THREE.Mesh(geo, toonMat(col, { emissive: col, emissiveIntensity: 0.8 }));
      addOutline(m, 0.08 * d.s);
      obj.add(m);
    } else {
      for (let c = 0; c < 5; c++) {
        const r = d.s * (0.5 + rnd() * 0.4);
        const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), toonMat(0xfff0fb));
        m.position.set((rnd() * 2 - 1) * d.s * 0.8, (rnd() * 2 - 1) * d.s * 0.2, (rnd() * 2 - 1) * d.s * 0.6);
        obj.add(m);
      }
    }
    root.add(obj);
    decorObjs.push({ obj, y: d.y, phase: rnd() * Math.PI * 2, rot: d.rot, spin: d.kind !== 'cloud' });
  });

  // Sparkles: 700 points in a 160 m box that follows the camera.
  const N = 700;
  const sparkPos = new Float32Array(N * 3);
  const sparkCol = new Float32Array(N * 3);
  const srnd = rng(4242);
  const pal = [PALETTE.pink, PALETTE.cyan, PALETTE.lime, PALETTE.yellow, PALETTE.lilac].map((c) => rgb(c));
  for (let i = 0; i < N; i++) {
    const o = i * 3;
    sparkPos[o] = (srnd() - 0.5) * 160;
    sparkPos[o + 1] = (srnd() - 0.5) * 160;
    sparkPos[o + 2] = (srnd() - 0.5) * 160;
    const c = pal[Math.floor(srnd() * pal.length)];
    sparkCol[o] = c[0];
    sparkCol[o + 1] = c[1];
    sparkCol[o + 2] = c[2];
  }
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
  sparkGeo.setAttribute('color', new THREE.BufferAttribute(sparkCol, 3));
  const sparkles = new THREE.Points(
    sparkGeo,
    new THREE.PointsMaterial({
      size: 0.5, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, sizeAttenuation: true,
    }),
  );
  sparkles.frustumCulled = false;
  root.add(sparkles);

  // Offset from the camera, wrapped into [-80, 80].
  const wrap = (d: number): number => d - 160 * Math.round(d / 160);

  return {
    update(dt, t, camPos, flow) {
      U.time.value = t;
      U.flow.value = flow;
      sky.position.copy(camPos);
      ring.rotation.z = t * 0.4;
      disc.rotation.z = -t * 0.6;
      ringMat.emissive.setHSL((t * 0.08) % 1, 1, 0.5);
      for (const d of decorObjs) {
        d.obj.position.y = d.y + Math.sin(t * 0.35 + d.phase) * 1.5;
        if (d.spin) d.obj.rotation.y = d.rot + t * 0.2;
      }
      for (let i = 0; i < N; i++) {
        const o = i * 3;
        sparkPos[o + 1] += dt * 0.4;
        sparkPos[o] = camPos.x + wrap(sparkPos[o] - camPos.x);
        sparkPos[o + 1] = camPos.y + wrap(sparkPos[o + 1] - camPos.y);
        sparkPos[o + 2] = camPos.z + wrap(sparkPos[o + 2] - camPos.z);
      }
      sparkGeo.attributes.position.needsUpdate = true;
    },
  };
}
