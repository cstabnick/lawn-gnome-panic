// Speed and impact effects: speed lines, wind streaks, landing bursts, grind sparks, boost trail, flashes.
// Everything is generated in code. All pools are allocated once in createFx; update() allocates nothing.
import * as THREE from 'three';
import { PALETTE, type PhysEvent, type Player } from '../config';
import { forwardOf } from '../physics';

export interface Fx {
  update(p: Player, pos: THREE.Vector3, dt: number, events: PhysEvent[]): void;
}

const STREAKS = 90;
const PARTS = 600;
const RINGS = 6;
const RING_TIME = 0.45;
const BOX = 20; // streak box half-size (m) around the rider
const SNOW = 1200; // pooled snow grains
const TRACK_N = 400; // board track samples kept (ring)
const TRACK_STEP = 0.35; // m between track samples
const TRACK_HALF = 0.17; // half width of a track (the board is ~0.34 m across)
const TRACK_LIFE = 8; // s until a track fades out
const BOARD_HALF = 0.2; // m from the board centre line to its edge

const rnd = (a: number, b: number): number => a + Math.random() * (b - a);
const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
const clampBox = (v: number): number => Math.max(-BOX + 1, Math.min(BOX - 1, v));
const hex = (n: number): string => '#' + n.toString(16).padStart(6, '0');
const fadeOf = (age: number): number => (age >= TRACK_LIFE ? 0 : 1 - Math.max(0, age) / TRACK_LIFE);

interface Flash { el: HTMLDivElement; t: number; dur: number; peak: number; on: boolean }
interface Ring { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; age: number }

export function createFx(scene: THREE.Scene, camera: THREE.PerspectiveCamera, ui: HTMLElement): Fx {
  // ---- scratch state (reused every frame)
  let clock = 0; // seconds since start, for track fades
  const vSpF = new THREE.Vector3(); // board forward on the ground
  const vSpR = new THREE.Vector3(); // board right (forward x normal)
  const vFwd = new THREE.Vector3(0, 0, 1); // unit velocity direction (kept while slow)
  const vBack = new THREE.Vector3();
  const vTanA = new THREE.Vector3();
  const vTanB = new THREE.Vector3();
  const vRef = new THREE.Vector3();
  const vLast = new THREE.Vector3();
  const vZ = new THREE.Vector3(0, 0, 1);
  let primed = false;
  let grindLey = false;
  let vigOpacity = 0;
  let ringNext = 0;
  let pNext = 0;

  // ---- palette as colours (built once)
  const C = {
    pink: new THREE.Color(PALETTE.pink), cyan: new THREE.Color(PALETTE.cyan),
    lime: new THREE.Color(PALETTE.lime), orange: new THREE.Color(PALETTE.orange),
    yellow: new THREE.Color(PALETTE.yellow), mint: new THREE.Color(PALETTE.mint),
    lilac: new THREE.Color(PALETTE.lilac), white: new THREE.Color(0xffffff),
  };
  const landCols = [C.pink, C.cyan, C.lime, C.orange, C.mint];
  const perfectCols = [C.yellow, C.pink];
  const starCols = [C.yellow, C.pink, C.white];
  const railCols = [C.yellow, C.orange];
  const leyCols = [C.cyan, C.pink];
  const afterCols = [C.pink, C.cyan];
  const LINE_COLS = ['#ffffff', hex(PALETTE.pink), hex(PALETTE.cyan)];

  // ---- DOM: one fixed container in #ui holding the speed-line canvas, flash overlays and the vignette
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:2';
  ui.appendChild(box);

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
  box.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const sizeCanvas = (): void => {
    canvas.width = Math.max(1, Math.ceil(window.innerWidth / 2));
    canvas.height = Math.max(1, Math.ceil(window.innerHeight / 2));
  };
  sizeCanvas();
  window.addEventListener('resize', sizeCanvas);

  const overlay = (bg: string): Flash => {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;inset:0;opacity:0;background:${bg}`;
    box.appendChild(el);
    return { el, t: 0, dur: 1, peak: 0, on: false };
  };
  const flashLand = overlay('#ffd6ee');
  const flashBail = overlay('#ff1f4b');
  const flashWarp = overlay(
    `linear-gradient(120deg, ${hex(PALETTE.pink)}, ${hex(PALETTE.orange)}, ${hex(PALETTE.yellow)}, ` +
      `${hex(PALETTE.lime)}, ${hex(PALETTE.cyan)}, ${hex(PALETTE.lilac)})`,
  );
  const vignette = document.createElement('div');
  vignette.style.cssText = 'position:absolute;inset:0;opacity:0;background:radial-gradient(ellipse at center, ' +
    'rgba(0,0,0,0) 45%, rgba(255,63,164,0.9) 85%, rgba(45,226,230,0.9) 100%)';
  box.appendChild(vignette);

  // ---- wind streaks (3D): head positions kept apart from the line segment buffer
  const sHead = new Float32Array(STREAKS * 3);
  const sPos = new Float32Array(STREAKS * 6);
  const sAttr = new THREE.BufferAttribute(sPos, 3);
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', sAttr);
  const sMat = new THREE.LineBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
  });
  const streaks = new THREE.LineSegments(sGeo, sMat);
  streaks.frustumCulled = false;
  scene.add(streaks);

  // ---- particles (one pooled Points system; dead particles render black, which is invisible when additive)
  const pPos = new Float32Array(PARTS * 3);
  const pVel = new Float32Array(PARTS * 3);
  const pBase = new Float32Array(PARTS * 3);
  const pCol = new Float32Array(PARTS * 3);
  const pGrav = new Float32Array(PARTS);
  const pLife = new Float32Array(PARTS);
  const pMax = new Float32Array(PARTS);
  const pAttr = new THREE.BufferAttribute(pPos, 3);
  const cAttr = new THREE.BufferAttribute(pCol, 3);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', pAttr);
  pGeo.setAttribute('color', cAttr);
  const pMat = new THREE.PointsMaterial({
    size: 0.35, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
  });
  const points = new THREE.Points(pGeo, pMat);
  points.frustumCulled = false;
  scene.add(points);

  // ---- rings (landing): flat additive rings, pooled
  const ringGeo = new THREE.RingGeometry(0.6, 0.9, 32);
  const rings: Ring[] = [];
  for (let i = 0; i < RINGS; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: C.cyan, transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
      depthWrite: false, side: THREE.DoubleSide, fog: false,
    });
    const mesh = new THREE.Mesh(ringGeo, mat);
    mesh.visible = false;
    mesh.frustumCulled = false;
    scene.add(mesh);
    rings.push({ mesh, mat, age: -1 });
  }

  // ---- helpers (no allocations)
  const respawn = (i: number, c: THREE.Vector3): void => {
    const o = i * 3;
    const ahead = rnd(0, 16);
    sHead[o] = c.x + clampBox(vFwd.x * ahead + rnd(-6, 6));
    sHead[o + 1] = c.y + clampBox(vFwd.y * ahead + rnd(-6, 6));
    sHead[o + 2] = c.z + clampBox(vFwd.z * ahead + rnd(-6, 6));
  };

  const stepStreaks = (pos: THREE.Vector3, vel: THREE.Vector3, speed: number, dt: number): void => {
    const len = Math.min(6, speed * 0.08);
    const k = dt * 0.6;
    for (let i = 0; i < STREAKS; i++) {
      const o = i * 3;
      sHead[o] -= vel.x * k;
      sHead[o + 1] -= vel.y * k;
      sHead[o + 2] -= vel.z * k;
      if (Math.abs(sHead[o] - pos.x) > BOX || Math.abs(sHead[o + 1] - pos.y) > BOX || Math.abs(sHead[o + 2] - pos.z) > BOX) {
        respawn(i, pos);
      }
      const hx = sHead[o], hy = sHead[o + 1], hz = sHead[o + 2];
      const v = i * 6;
      sPos[v] = hx; sPos[v + 1] = hy; sPos[v + 2] = hz;
      sPos[v + 3] = hx - vFwd.x * len; sPos[v + 4] = hy - vFwd.y * len; sPos[v + 5] = hz - vFwd.z * len;
    }
    sAttr.needsUpdate = true;
  };

  const emit = (x: number, y: number, z: number, vx: number, vy: number, vz: number,
    grav: number, life: number, c: THREE.Color): void => {
    const i = pNext;
    pNext = (pNext + 1) % PARTS;
    const o = i * 3;
    pPos[o] = x; pPos[o + 1] = y; pPos[o + 2] = z;
    pVel[o] = vx; pVel[o + 1] = vy; pVel[o + 2] = vz;
    pBase[o] = c.r; pBase[o + 1] = c.g; pBase[o + 2] = c.b;
    pGrav[i] = grav; pLife[i] = life; pMax[i] = life;
  };

  const stepParticles = (dt: number): void => {
    const drag = Math.max(0, 1 - 1.2 * dt);
    for (let i = 0; i < PARTS; i++) {
      const o = i * 3;
      if (pLife[i] > 0) {
        pLife[i] -= dt;
        pVel[o] *= drag; pVel[o + 1] = pVel[o + 1] * drag - pGrav[i] * dt; pVel[o + 2] *= drag;
        pPos[o] += pVel[o] * dt; pPos[o + 1] += pVel[o + 1] * dt; pPos[o + 2] += pVel[o + 2] * dt;
        const k = pLife[i] > 0 ? pLife[i] / pMax[i] : 0;
        pCol[o] = pBase[o] * k; pCol[o + 1] = pBase[o + 1] * k; pCol[o + 2] = pBase[o + 2] * k;
      } else {
        pCol[o] = 0; pCol[o + 1] = 0; pCol[o + 2] = 0;
      }
    }
    pAttr.needsUpdate = true;
    cAttr.needsUpdate = true;
  };

  // ground tangent basis for normal n, in vTanA / vTanB
  const tangents = (n: THREE.Vector3): void => {
    if (Math.abs(n.y) < 0.9) vRef.set(0, 1, 0);
    else vRef.set(1, 0, 0);
    vTanA.crossVectors(n, vRef).normalize();
    vTanB.crossVectors(n, vTanA);
  };

  // ---- snow: own pool, since each flake has its own size (a size of 0 draws nothing)
  const SNOW_COLS = [new THREE.Color(0xffffff), new THREE.Color(0xe9dcff)];
  const snPos = new Float32Array(SNOW * 3);
  const snVel = new Float32Array(SNOW * 3);
  const snCol = new Float32Array(SNOW * 3);
  const snSize = new Float32Array(SNOW);
  const snBase = new Float32Array(SNOW);
  const snLife = new Float32Array(SNOW);
  const snMax = new Float32Array(SNOW);
  let snNext = 0;
  const snPA = new THREE.BufferAttribute(snPos, 3).setUsage(THREE.DynamicDrawUsage);
  const snCA = new THREE.BufferAttribute(snCol, 3).setUsage(THREE.DynamicDrawUsage);
  const snSA = new THREE.BufferAttribute(snSize, 1).setUsage(THREE.DynamicDrawUsage);
  const snGeo = new THREE.BufferGeometry();
  snGeo.setAttribute('position', snPA);
  snGeo.setAttribute('aCol', snCA);
  snGeo.setAttribute('aSize', snSA);
  const snUScale = { value: 300 };
  const snMat = new THREE.ShaderMaterial({
    uniforms: { uScale: snUScale },
    vertexShader: [
      'attribute vec3 aCol;',
      'attribute float aSize;',
      'uniform float uScale;',
      'varying vec3 vCol;',
      'void main() {',
      '  vCol = aCol;',
      '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
      '  gl_PointSize = min(9.0, aSize * uScale / max(0.1, -mv.z));', // never a blob up close
      '  gl_Position = projectionMatrix * mv;',
      '}',
    ].join('\n'),
    fragmentShader: [
      'varying vec3 vCol;',
      'void main() {',
      '  vec2 d = gl_PointCoord - vec2(0.5);',
      '  if (dot(d, d) > 0.25) discard;',
      '  gl_FragColor = vec4(vCol, 1.0);',
      '}',
    ].join('\n'),
    depthWrite: false,
  });
  const snow = new THREE.Points(snGeo, snMat);
  snow.frustumCulled = false;
  scene.add(snow);

  const snowEmit = (x: number, y: number, z: number, vx: number, vy: number, vz: number,
    life: number, size: number, c: THREE.Color): void => {
    const i = snNext;
    snNext = (snNext + 1) % SNOW;
    const o = i * 3;
    snPos[o] = x; snPos[o + 1] = y; snPos[o + 2] = z;
    snVel[o] = vx; snVel[o + 1] = vy; snVel[o + 2] = vz;
    snCol[o] = c.r; snCol[o + 1] = c.g; snCol[o + 2] = c.b;
    snLife[i] = life; snMax[i] = life; snBase[i] = size;
  };

  const stepSnow = (dt: number): void => {
    // world size to pixels: pixels per metre at depth 1
    snUScale.value = camera.projectionMatrix.elements[5] * window.innerHeight * Math.min(window.devicePixelRatio, 2) * 0.5;
    const drag = Math.max(0, 1 - 1.6 * dt); // the fan hangs in the air
    for (let i = 0; i < SNOW; i++) {
      const o = i * 3;
      if (snLife[i] > 0) {
        snLife[i] -= dt;
        snVel[o] *= drag; snVel[o + 1] = snVel[o + 1] * drag - 4 * dt; snVel[o + 2] *= drag;
        snPos[o] += snVel[o] * dt; snPos[o + 1] += snVel[o + 1] * dt; snPos[o + 2] += snVel[o + 2] * dt;
        snSize[i] = snLife[i] > 0 ? snBase[i] * Math.min(1, (3 * snLife[i]) / snMax[i]) : 0;
      } else {
        snSize[i] = 0;
      }
    }
    snPA.needsUpdate = true;
    snCA.needsUpdate = true;
    snSA.needsUpdate = true;
  };

  // a burst of flakes around a landing point, thrown in every direction
  const snowBurst = (pos: THREE.Vector3, n: THREE.Vector3, count: number): void => {
    tangents(n);
    for (let i = 0; i < count; i++) {
      const a = rnd(0, Math.PI * 2), s = rnd(1.5, 4), u = rnd(1, 3);
      const ca = Math.cos(a) * s, sa = Math.sin(a) * s;
      snowEmit(pos.x + n.x * 0.05, pos.y + n.y * 0.05, pos.z + n.z * 0.05,
        vTanA.x * ca + vTanB.x * sa + n.x * u,
        vTanA.y * ca + vTanB.y * sa + n.y * u,
        vTanA.z * ca + vTanB.z * sa + n.z * u,
        rnd(0.4, 0.7), rnd(0.06, 0.15), SNOW_COLS[i & 1]);
    }
  };

  // board frame on the ground: vSpF forward, vSpR right (forward x normal)
  const boardAxes = (p: Player): void => {
    forwardOf(p.heading, vSpF);
    vSpF.addScaledVector(p.normal, -vSpF.dot(p.normal)).normalize();
    vSpR.crossVectors(vSpF, p.normal).normalize();
  };

  // snow thrown off the edge that digs in (the side opposite the sideways slide)
  const spray = (p: Player, pos: THREE.Vector3, speed: number): void => {
    if (speed < 6) return;
    boardAxes(p);
    const n = p.normal;
    const side = p.vel.dot(vSpR);
    const carve = clamp01(Math.abs(side) / speed);
    const edge = side > 0 ? -1 : 1;
    // Fine grains, lots of them (big flakes read as blobs near the camera).
    const amount = 22 * clamp01((speed - 6) / 34) * (0.2 + 0.8 * carve);
    const count = Math.floor(amount + Math.random());
    if (count === 0) return;
    const ex = pos.x + n.x * 0.05 + vSpR.x * edge * BOARD_HALF;
    const ey = pos.y + n.y * 0.05 + vSpR.y * edge * BOARD_HALF;
    const ez = pos.z + n.z * 0.05 + vSpR.z * edge * BOARD_HALF;
    for (let i = 0; i < count; i++) {
      const out = rnd(1, 3.5), back = rnd(0.5, 2), up = rnd(1.5, 3.5);
      snowEmit(ex + rnd(-0.06, 0.06), ey + rnd(-0.06, 0.06), ez + rnd(-0.06, 0.06),
        vSpR.x * edge * out - vSpF.x * back + n.x * up + rnd(-0.5, 0.5),
        vSpR.y * edge * out - vSpF.y * back + n.y * up + rnd(-0.5, 0.5),
        vSpR.z * edge * out - vSpF.z * back + n.z * up + rnd(-0.5, 0.5),
        rnd(0.35, 0.7), rnd(0.06, 0.15), SNOW_COLS[i & 1]);
    }
  };

  // ---- board tracks: segment k joins sample k-1 to sample k; four vertices per segment (left and right at each)
  const trPos = new Float32Array(TRACK_N * 12);
  const trCol = new Float32Array(TRACK_N * 16);
  const trT0 = new Float64Array(TRACK_N); // time of the sample before
  const trT1 = new Float64Array(TRACK_N); // time of this sample
  const trJoin = new Uint8Array(TRACK_N); // 1: continues the strip from the sample before
  const trIdx = new Uint16Array(TRACK_N * 6);
  for (let k = 0; k < TRACK_N; k++) {
    const b = k * 4;
    trIdx.set([b, b + 1, b + 2, b + 1, b + 3, b + 2], k * 6);
    for (let m = 0; m < 4; m++) trCol.set([1, 1, 1, 0], (b + m) * 4);
  }
  const trPA = new THREE.BufferAttribute(trPos, 3).setUsage(THREE.DynamicDrawUsage);
  const trCA = new THREE.BufferAttribute(trCol, 4).setUsage(THREE.DynamicDrawUsage);
  const trGeo = new THREE.BufferGeometry();
  trGeo.setAttribute('position', trPA);
  trGeo.setAttribute('color', trCA);
  trGeo.setIndex(new THREE.BufferAttribute(trIdx, 1));
  const trMat = new THREE.MeshBasicMaterial({
    color: 0xffffff, vertexColors: true, transparent: true, opacity: 0.55, depthWrite: false,
    side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1, fog: false,
  });
  const tracks = new THREE.Mesh(trGeo, trMat);
  tracks.frustumCulled = false;
  scene.add(tracks);

  const trLast = new Float64Array(6); // left (0-2) and right (3-5) edge of the last sample
  let trLastT = 0;
  let trHead = 0; // next slot to write
  let trHave = false; // a sample exists that the next one can join
  let trFrame = false; // the last frame was on the ground
  let trSince = 0; // m travelled since the last sample
  const vTrC = new THREE.Vector3(); // board centre, 0.03 m above the surface
  const vTrL = new THREE.Vector3(); // the same point last frame

  const trackSample = (c: THREE.Vector3, join: boolean): void => {
    const k = trHead;
    trHead = (trHead + 1) % TRACK_N;
    const v = k * 12;
    trPos[v + 6] = c.x - vSpR.x * TRACK_HALF; trPos[v + 7] = c.y - vSpR.y * TRACK_HALF; trPos[v + 8] = c.z - vSpR.z * TRACK_HALF;
    trPos[v + 9] = c.x + vSpR.x * TRACK_HALF; trPos[v + 10] = c.y + vSpR.y * TRACK_HALF; trPos[v + 11] = c.z + vSpR.z * TRACK_HALF;
    for (let q = 0; q < 6; q++) trPos[v + q] = join ? trLast[q] : trPos[v + 6 + q];
    for (let q = 0; q < 6; q++) trLast[q] = trPos[v + 6 + q];
    trJoin[k] = join ? 1 : 0;
    trT0[k] = trLastT;
    trT1[k] = clock;
    trLastT = clock;
    trPA.needsUpdate = true;
  };

  // one track step per frame: a sample every TRACK_STEP metres, the strip breaks in the air or after a teleport
  const stepTracks = (p: Player, pos: THREE.Vector3): void => {
    if (p.mode !== 'ground') {
      trHave = false;
      trFrame = false;
      return;
    }
    boardAxes(p);
    vTrC.copy(pos).addScaledVector(p.normal, 0.03);
    let d = 0;
    if (trFrame) {
      d = vTrC.distanceTo(vTrL);
      if (d > 8) trHave = false;
    }
    if (!trHave) {
      trackSample(vTrC, false);
      trHave = true;
      trSince = 0;
    } else {
      trSince += d;
      if (trSince >= TRACK_STEP) {
        trackSample(vTrC, true);
        trSince = 0;
      }
    }
    vTrL.copy(vTrC);
    trFrame = true;
  };

  const updateTracks = (): void => {
    for (let k = 0; k < TRACK_N; k++) {
      const b = k * 16;
      const a0 = trJoin[k] ? fadeOf(clock - trT0[k]) : 0;
      const a1 = trJoin[k] ? fadeOf(clock - trT1[k]) : 0;
      trCol[b + 3] = a0; trCol[b + 7] = a0;
      trCol[b + 11] = a1; trCol[b + 15] = a1;
    }
    trCA.needsUpdate = true;
  };

  const burst = (pos: THREE.Vector3, n: THREE.Vector3, count: number, sMin: number, sMax: number,
    cols: THREE.Color[]): void => {
    tangents(n);
    const off = Math.random() * Math.PI * 2;
    for (let i = 0; i < count; i++) {
      const a = off + (i / count) * Math.PI * 2;
      const s = rnd(sMin, sMax);
      const ca = Math.cos(a) * s, sa = Math.sin(a) * s, up = rnd(0.5, 1.5);
      emit(pos.x + n.x * 0.1, pos.y + n.y * 0.1, pos.z + n.z * 0.1,
        vTanA.x * ca + vTanB.x * sa + n.x * up,
        vTanA.y * ca + vTanB.y * sa + n.y * up,
        vTanA.z * ca + vTanB.z * sa + n.z * up,
        14, rnd(0.5, 0.8), cols[i % cols.length]);
    }
  };

  const ring = (pos: THREE.Vector3, n: THREE.Vector3, c: THREE.Color): void => {
    const r = rings[ringNext];
    ringNext = (ringNext + 1) % RINGS;
    r.age = 0;
    r.mesh.visible = true;
    r.mesh.position.set(pos.x + n.x * 0.06, pos.y + n.y * 0.06, pos.z + n.z * 0.06);
    r.mesh.quaternion.setFromUnitVectors(vZ, n);
    r.mesh.scale.setScalar(1);
    r.mat.color.copy(c);
    r.mat.opacity = 1;
  };

  const stepRings = (dt: number): void => {
    for (const r of rings) {
      if (r.age < 0) continue;
      r.age += dt;
      const k = r.age / RING_TIME;
      if (k >= 1) {
        r.age = -1;
        r.mesh.visible = false;
      } else {
        r.mesh.scale.setScalar(1 + 5 * k);
        r.mat.opacity = 1 - k;
      }
    }
  };

  const flash = (f: Flash, peak: number, dur: number): void => {
    f.peak = peak;
    f.dur = dur;
    f.t = 0;
    f.on = true;
  };

  const stepFlash = (f: Flash, dt: number): void => {
    if (!f.on) return;
    f.t += dt;
    if (f.t >= f.dur) {
      f.on = false;
      f.el.style.opacity = '0';
    } else {
      f.el.style.opacity = String(f.peak * (1 - f.t / f.dur));
    }
  };

  const drawSpeed = (speed: number, boosting: boolean): void => {
    const g = ctx;
    if (!g) return;
    const w = canvas.width, h = canvas.height;
    g.clearRect(0, 0, w, h);
    let n = 0;
    if (speed >= 22) n = Math.round(70 * clamp01((speed - 22) / 33));
    if (boosting) n += 30;
    if (n === 0) return;
    const cx = w / 2, cy = h / 2, hd = Math.sqrt(w * w + h * h) / 2;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const dx = Math.cos(a), dy = Math.sin(a);
      const r0 = rnd(0.75, 1.1);
      const re = Math.max(r0 - rnd(0.15, 0.4), 0.36); // the centre oval stays clear
      const sx = cx + dx * r0 * hd, sy = cy + dy * r0 * hd;
      const tx = cx + dx * re * hd, ty = cy + dy * re * hd;
      const wd = rnd(1.5, 3);
      g.globalAlpha = rnd(0.25, 0.6);
      g.fillStyle = boosting && Math.random() < 0.5 ? LINE_COLS[1 + (i & 1)] : LINE_COLS[0];
      g.beginPath();
      g.moveTo(sx - dy * wd, sy + dx * wd);
      g.lineTo(tx, ty);
      g.lineTo(sx + dy * wd, sy - dx * wd);
      g.closePath();
      g.fill();
    }
    g.globalAlpha = 1;
  };

  return {
    update(p: Player, pos: THREE.Vector3, dt: number, events: PhysEvent[]): void {
      clock += dt;
      const speed = p.vel.length();
      if (speed > 0.01) vFwd.copy(p.vel).multiplyScalar(1 / speed);

      // first frame, or a teleport: scatter the streaks around the new position
      if (!primed || pos.distanceToSquared(vLast) > 64) {
        primed = true;
        for (let i = 0; i < STREAKS; i++) respawn(i, pos);
      }
      vLast.copy(pos);

      stepStreaks(pos, p.vel, speed, dt);
      sMat.opacity = clamp01((speed - 15) / 20) * 0.8;

      for (const e of events) {
        switch (e.e) {
          case 'land':
            burst(pos, p.normal, e.perfect ? 36 : 18, e.perfect ? 7 : 4, e.perfect ? 10 : 7,
              e.perfect ? perfectCols : landCols);
            ring(pos, p.normal, C.cyan);
            snowBurst(pos, p.normal, 25);
            if (e.perfect) {
              ring(pos, p.normal, C.yellow);
              flash(flashLand, 0.22, 0.15);
            }
            break;
          case 'pop': {
            tangents(p.normal);
            for (let i = 0; i < 8; i++) {
              const s = rnd(-1.2, 1.2), t = rnd(-1.2, 1.2);
              const n = p.normal;
              emit(pos.x + n.x * 0.05 + vTanA.x * rnd(-0.4, 0.4),
                pos.y + n.y * 0.05 + vTanA.y * rnd(-0.4, 0.4),
                pos.z + n.z * 0.05 + vTanA.z * rnd(-0.4, 0.4),
                n.x * rnd(0.6, 1.4) + vTanA.x * s + vTanB.x * t,
                n.y * rnd(0.6, 1.4) + vTanA.y * s + vTanB.y * t,
                n.z * rnd(0.6, 1.4) + vTanA.z * s + vTanB.z * t,
                0.5, 0.6, C.lilac);
            }
            break;
          }
          case 'bail': {
            for (let i = 0; i < 30; i++) {
              const z = rnd(-1, 1), a = rnd(0, Math.PI * 2), r = Math.sqrt(1 - z * z);
              const s = rnd(6, 10);
              emit(pos.x, pos.y + 0.5, pos.z,
                r * Math.cos(a) * s, z * s, r * Math.sin(a) * s,
                9, 0.8, starCols[i % starCols.length]);
            }
            flash(flashBail, 0.25, 0.5);
            break;
          }
          case 'grindStart':
            grindLey = e.ley;
            break;
          case 'warp':
            flash(flashWarp, 0.8, 0.7);
            break;
          case 'skyfall':
            flash(flashWarp, 0.55, 0.9);
            break;
        }
      }

      if (p.mode === 'ground') spray(p, pos, speed);
      stepTracks(p, pos);

      if (p.mode === 'grind') {
        tangents(p.normal);
        vBack.copy(p.vel).multiplyScalar(speed > 0.01 ? -1 / speed : 0);
        const cols = grindLey ? leyCols : railCols;
        const n = p.normal;
        for (let i = 0; i < 6; i++) {
          const b = rnd(3, 6), u = rnd(3, 6), s = rnd(-1.5, 1.5);
          emit(pos.x + n.x * 0.1, pos.y + n.y * 0.1, pos.z + n.z * 0.1,
            vBack.x * b + n.x * u + vTanA.x * s,
            vBack.y * b + n.y * u + vTanA.y * s,
            vBack.z * b + n.z * u + vTanA.z * s,
            14, rnd(0.25, 0.4), cols[i & 1]);
        }
      }

      if (p.boosting) {
        const n = p.normal;
        for (let i = 0; i < 4; i++) {
          const b = rnd(0.5, 1.2);
          emit(pos.x + n.x * 0.4 - vFwd.x * b + rnd(-0.2, 0.2),
            pos.y + n.y * 0.4 - vFwd.y * b + rnd(-0.2, 0.2),
            pos.z + n.z * 0.4 - vFwd.z * b + rnd(-0.2, 0.2),
            rnd(-0.3, 0.3), rnd(-0.3, 0.3), rnd(-0.3, 0.3),
            0, 0.4, afterCols[i & 1]);
        }
      }

      stepParticles(dt);
      stepSnow(dt);
      updateTracks();
      stepRings(dt);
      stepFlash(flashLand, dt);
      stepFlash(flashBail, dt);
      stepFlash(flashWarp, dt);

      const vigTarget = p.boosting ? 0.5 : 0;
      vigOpacity += (vigTarget - vigOpacity) * Math.min(1, dt * 6);
      vignette.style.opacity = String(vigOpacity);

      drawSpeed(speed, p.boosting);
    },
  };
}
