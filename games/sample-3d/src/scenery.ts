import type { DayNightState } from './config';
import * as THREE from 'three';
import type { Scenery, WorldTheme } from './config';
import { ARENA_HALF } from './config';

/** Sky dome, clouds, trees and neighbouring yards outside the lawn. */

const SKY_RADIUS = 2000;
const HEDGE_HALF = ARENA_HALF + 6;          // hedge centre line on the west, east and south
const TREE_BAND_MIN = ARENA_HALF + 25;
const TREE_BAND_MAX = ARENA_HALF + 110;
const TREE_COUNT = 80;
const NEIGHBOUR_X = ARENA_HALF + 180;
const NEIGHBOUR_Z = -40;
const NEIGHBOUR_FENCE_Z = ARENA_HALF + 80;
const FENCE_SPAN = ARENA_HALF + 270;
const CLOUD_COUNT = 14;
const CLOUD_SPREAD = 900;
const CLOUD_WRAP = 1000;
const MOTE_COUNT = 60;
const MOTE_HALF = [15, 5, 15] as const;     // half extents of the fluff box around the focus
const STAR_COUNT = 900;
const STAR_RADIUS = 1800;                   // inside the sky dome (SKY_RADIUS)

/** Deterministic PRNG so the scenery is the same every run. */
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const dummy = new THREE.Object3D();

/** Writes one instance's matrix: position, scale, and yaw. */
function place(
  mesh: THREE.InstancedMesh, i: number,
  x: number, y: number, z: number,
  sx: number, sy: number, sz: number, rotY = 0,
): void {
  dummy.position.set(x, y, z);
  dummy.rotation.set(0, rotY, 0);
  dummy.scale.set(sx, sy, sz);
  dummy.updateMatrix();
  mesh.setMatrixAt(i, dummy.matrix);
}

/** A gable roof: a triangular prism with its ridge running along z. */
function gableRoof(w: number, h: number, d: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, 0);
  shape.lineTo(w / 2, 0);
  shape.lineTo(0, h);
  shape.closePath();
  const geom = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
  geom.translate(0, 0, -d / 2);
  return geom;
}

function neighbourHouse(sign: number, bodyColor: number): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(90, 36, 70), new THREE.MeshStandardMaterial({ color: bodyColor }));
  body.position.y = 18;
  g.add(body);
  const roof = new THREE.Mesh(gableRoof(96, 22, 74), new THREE.MeshStandardMaterial({ color: 0x5d4037 }));
  roof.position.y = 36;
  g.add(roof);
  // Two windows on the face that looks onto the lawn.
  const glass = new THREE.MeshStandardMaterial({ color: 0x90caf9 });
  for (const dz of [-18, 18]) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.4, 10, 12), glass);
    win.position.set(-sign * (45 + 0.05), 20, dz);
    g.add(win);
  }
  g.position.set(sign * NEIGHBOUR_X, 0, NEIGHBOUR_Z);
  return g;
}

const SKY_VERT = `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const SKY_FRAG = `
uniform vec3 uHorizon;
uniform vec3 uZenith;
uniform vec3 uSun;
uniform vec3 uWarm;
uniform float uNight;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float h = clamp(d.y, 0.0, 1.0);
  vec3 col = mix(uHorizon, uZenith, pow(h, 0.6));
  float s = max(dot(d, uSun), 0.0);
  float day = 1.0 - uNight;
  col += uWarm * (0.8 * pow(s, 64.0) + 0.25 * pow(s, 6.0)) * day;
  col += vec3(1.0, 0.97, 0.85) * smoothstep(0.9990, 0.9996, s) * day;
  // Night: a small cool moon disc and a faint halo around uSun (which points at the moon).
  col += vec3(0.6, 0.7, 1.0) * pow(s, 200.0) * uNight;
  col += vec3(0.6, 0.7, 1.0) * (0.15 * pow(s, 8.0) * uNight);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

export function buildScenery(scene: THREE.Scene): Scenery {
  const rnd = makeRng(4242);
  const rand = (lo: number, hi: number) => lo + (hi - lo) * rnd();

  // ---- Sky dome ----------------------------------------------------------
  const skyMat = new THREE.ShaderMaterial({
    uniforms: {
      uHorizon: { value: new THREE.Color(0xcfe9ff) },
      uZenith: { value: new THREE.Color(0x5aa9ff) },
      uSun: { value: new THREE.Vector3(0.5, 0.6, 0.3).normalize() },
      uWarm: { value: new THREE.Color(0xfff2c0) },
      uNight: { value: 0 },
    },
    vertexShader: SKY_VERT,
    fragmentShader: SKY_FRAG,
    side: THREE.BackSide,
    depthWrite: false,
    toneMapped: false,
    fog: false,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(SKY_RADIUS, 32, 16), skyMat);
  sky.renderOrder = -1;
  sky.frustumCulled = false;
  scene.add(sky);

  // ---- Stars -------------------------------------------------------------
  // Own PRNG, so the rest of the scenery is unchanged. Uniform directions on the upper hemisphere.
  const starRng = makeRng(9001);
  const starPos = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; ) {
    const x = starRng() * 2 - 1;
    const y = starRng();
    const z = starRng() * 2 - 1;
    const len = Math.hypot(x, y, z);
    if (len > 1 || len < 0.001 || y / len <= 0.05) continue;
    starPos[i * 3] = (x / len) * STAR_RADIUS;
    starPos[i * 3 + 1] = (y / len) * STAR_RADIUS;
    starPos[i * 3 + 2] = (z / len) * STAR_RADIUS;
    i++;
  }
  const starGeom = new THREE.BufferGeometry();
  starGeom.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 3,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: false,
  });
  const stars = new THREE.Points(starGeom, starMat);
  stars.frustumCulled = false;
  stars.visible = false;
  scene.add(stars);

  // ---- Clouds ------------------------------------------------------------
  const cloudDayColor = new THREE.Color(0xffffff);
  const cloudNightColor = new THREE.Color(0x2a3350);
  const cloudGeom = new THREE.SphereGeometry(1, 16, 12);
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: false, fog: false });
  const clouds: { group: THREE.Group; speed: number }[] = [];
  for (let c = 0; c < CLOUD_COUNT; c++) {
    const group = new THREE.Group();
    const puffs = 4 + Math.floor(rnd() * 4);
    for (let p = 0; p < puffs; p++) {
      const puff = new THREE.Mesh(cloudGeom, cloudMat);
      puff.scale.setScalar(rand(12, 28));
      puff.position.set(rand(-30, 30), rand(-6, 6), rand(-14, 14));
      group.add(puff);
    }
    group.position.set(rand(-CLOUD_SPREAD, CLOUD_SPREAD), rand(180, 260), rand(-CLOUD_SPREAD, CLOUD_SPREAD));
    scene.add(group);
    clouds.push({ group, speed: rand(2, 4) });
  }

  // ---- Trees beyond the west, east and south fences ----------------------
  const trees: {
    x: number; z: number; trunkR: number; trunkH: number;
    canopies: { x: number; y: number; z: number; r: number; color: number }[];
  }[] = [];
  const CANOPY_COLORS = [0x2e7d32, 0x33691e, 0x388e3c];
  let canopyTotal = 0;
  for (let i = 0; i < TREE_COUNT; i++) {
    const side = Math.floor(rnd() * 3); // 0 west, 1 east, 2 south
    const dist = rand(TREE_BAND_MIN, TREE_BAND_MAX);
    const along = rand(-(ARENA_HALF + 110), ARENA_HALF + 110);
    const x = side === 0 ? -dist : side === 1 ? dist : along;
    const z = side === 2 ? dist : along;
    const trunkH = rand(30, 45);
    const count = 3 + Math.floor(rnd() * 2);
    const canopies = [];
    for (let k = 0; k < count; k++) {
      canopies.push({
        x: x + rand(-10, 10),
        y: trunkH + rand(0, 8),
        z: z + rand(-10, 10),
        r: rand(14, 22),
        color: CANOPY_COLORS[Math.floor(rnd() * CANOPY_COLORS.length)],
      });
    }
    canopyTotal += count;
    trees.push({ x, z, trunkR: rand(3, 4.5), trunkH, canopies });
  }

  const trunks = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(1, 1, 1, 8),
    new THREE.MeshStandardMaterial({ color: 0x5d4037 }),
    TREE_COUNT,
  );
  const canopySpheres = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0xffffff }),
    canopyTotal,
  );
  let ci = 0;
  trees.forEach((t, i) => {
    place(trunks, i, t.x, t.trunkH / 2, t.z, t.trunkR, t.trunkH, t.trunkR);
    for (const c of t.canopies) {
      place(canopySpheres, ci, c.x, c.y, c.z, c.r, c.r, c.r);
      canopySpheres.setColorAt(ci, new THREE.Color(c.color));
      ci++;
    }
  });
  for (const m of [trunks, canopySpheres]) {
    m.instanceMatrix.needsUpdate = true;
    m.frustumCulled = false;
    scene.add(m);
  }

  // ---- Hedges just outside the west, east and south fences ---------------
  const hedgeSegs = Math.ceil((2 * HEDGE_HALF) / 12);
  const segLen = (2 * HEDGE_HALF) / hedgeSegs;
  const hedgeMat = new THREE.MeshStandardMaterial({ color: 0x2f7a2f });
  const hedgeBodies = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), hedgeMat, hedgeSegs * 3);
  const hedgeTops = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), hedgeMat, hedgeSegs * 3);
  let hi = 0;
  for (let i = 0; i < hedgeSegs; i++) {
    const t = -HEDGE_HALF + (i + 0.5) * segLen;
    // West and east: the row runs along z.
    for (const x of [-HEDGE_HALF, HEDGE_HALF]) {
      place(hedgeBodies, hi, x, 4.5, t, 6, 9, segLen);
      place(hedgeTops, hi, x, 9, t, 3, 3, 3);
      hi++;
    }
    // South: the row runs along x.
    place(hedgeBodies, hi, t, 4.5, HEDGE_HALF, 6, 9, segLen, Math.PI / 2);
    place(hedgeTops, hi, t, 9, HEDGE_HALF, 3, 3, 3);
    hi++;
  }
  for (const m of [hedgeBodies, hedgeTops]) {
    m.instanceMatrix.needsUpdate = true;
    m.frustumCulled = false;
    scene.add(m);
  }

  // ---- Neighbours --------------------------------------------------------
  scene.add(neighbourHouse(-1, 0xd7ccc8));
  scene.add(neighbourHouse(1, 0xb3e5fc));

  const plankCount = Math.floor((2 * FENCE_SPAN) / 3) + 1;
  const neighbourFence = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x8d6e63 }),
    plankCount,
  );
  for (let i = 0; i < plankCount; i++) {
    place(neighbourFence, i, -FENCE_SPAN + i * 3, 4.5, NEIGHBOUR_FENCE_Z, 2.2, 9, 0.6);
  }
  neighbourFence.instanceMatrix.needsUpdate = true;
  neighbourFence.frustumCulled = false;
  scene.add(neighbourFence);

  // ---- Desert backdrop: mesas and saguaros in the tree bands (hidden until setTheme('desert')) ----
  // Own PRNG, so the lawn scenery's random sequence is unchanged.
  const desertRng = makeRng(777);
  const dRand = (lo: number, hi: number) => lo + (hi - lo) * desertRng();
  // Same side layout as the trees: 0 west, 1 east, 2 south.
  const bandPoint = (dMin: number, dMax: number, alongHalf: number): [number, number] => {
    const side = Math.floor(desertRng() * 3);
    const dist = dRand(dMin, dMax);
    const along = dRand(-alongHalf, alongHalf);
    return side === 0 ? [-dist, along] : side === 1 ? [dist, along] : [along, dist];
  };
  const desert = new THREE.Group();
  desert.visible = false;
  scene.add(desert);

  const MESA_COUNT = 12 + Math.floor(desertRng() * 7);     // 12..18
  const mesaBody = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(1, 1, 1, 7),
    new THREE.MeshStandardMaterial({ color: 0xc8703f }),
    MESA_COUNT,
  );
  const mesaCap = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(1, 1, 1, 7),
    new THREE.MeshStandardMaterial({ color: 0xd99a62 }),
    MESA_COUNT,
  );
  for (let i = 0; i < MESA_COUNT; i++) {
    const [x, z] = bandPoint(TREE_BAND_MIN + 40, TREE_BAND_MAX + 250, ARENA_HALF + 200);
    const r = dRand(30, 80);
    const h = dRand(25, 70);
    const capH = Math.max(3, h * 0.12);
    const rot = dRand(0, Math.PI * 2);
    place(mesaBody, i, x, h / 2, z, r, h, r, rot);
    place(mesaCap, i, x, h - capH / 2, z, r * 1.04, capH, r * 1.04, rot);
  }

  const CACTUS_COUNT = 60 + Math.floor(desertRng() * 21);  // 60..80
  const cactusMat = new THREE.MeshStandardMaterial({ color: 0x4f8f4a });
  const cactusTrunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 8), cactusMat, CACTUS_COUNT);
  const cactusArms = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 8), cactusMat, CACTUS_COUNT * 2);
  for (let i = 0; i < CACTUS_COUNT; i++) {
    const [x, z] = bandPoint(TREE_BAND_MIN, TREE_BAND_MAX, ARENA_HALF + 110);
    const r = dRand(1.5, 2.5);
    const h = dRand(20, 35);
    place(cactusTrunks, i, x, h / 2, z, r, h, r);
    // Two upright arms, offset sideways by about 3, at different heights.
    const armR = r * 0.6;
    const armHA = dRand(8, 12);
    const armHB = dRand(8, 12);
    place(cactusArms, i * 2, x - 3, h * 0.45 + armHA / 2, z, armR, armHA, armR);
    place(cactusArms, i * 2 + 1, x + 3, h * 0.6 + armHB / 2, z, armR, armHB, armR);
  }
  for (const m of [mesaBody, mesaCap, cactusTrunks, cactusArms]) {
    m.instanceMatrix.needsUpdate = true;
    m.frustumCulled = false;
    desert.add(m);
  }

  // ---- Dandelion fluff ---------------------------------------------------
  const moteTexCanvas = document.createElement('canvas');
  moteTexCanvas.width = 64;
  moteTexCanvas.height = 64;
  const moteCtx = moteTexCanvas.getContext('2d');
  if (moteCtx) {
    const grad = moteCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.6)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    moteCtx.fillStyle = grad;
    moteCtx.fillRect(0, 0, 64, 64);
  }
  const moteTex = new THREE.CanvasTexture(moteTexCanvas);

  // Positions are relative to the fluff box centre (focus + 5 up).
  const moteBase = new Float32Array(MOTE_COUNT * 3);
  const moteVel = new Float32Array(MOTE_COUNT * 3);
  const motePhase = new Float32Array(MOTE_COUNT);
  for (let i = 0; i < MOTE_COUNT; i++) {
    for (let k = 0; k < 3; k++) {
      moteBase[i * 3 + k] = rand(-MOTE_HALF[k], MOTE_HALF[k]);
      moteVel[i * 3 + k] = rand(-0.3, 0.3) * (k === 1 ? 0.5 : 1);
    }
    motePhase[i] = rand(0, Math.PI * 2);
  }
  const moteOut = new Float32Array(MOTE_COUNT * 3);
  const moteAttr = new THREE.BufferAttribute(moteOut, 3);
  const moteGeom = new THREE.BufferGeometry();
  moteGeom.setAttribute('position', moteAttr);
  const motes = new THREE.Points(
    moteGeom,
    new THREE.PointsMaterial({
      map: moteTex,
      color: 0xffffff,
      size: 0.15,
      transparent: true,
      depthWrite: false,
    }),
  );
  motes.frustumCulled = false;
  // Dandelion fluff disabled: nearly static points read as dust on the screen, worst in top-down.
  // The update below still runs on it (60 points, negligible); re-add to the scene to bring it back.
  void motes;

  let time = 0;

  return {
    setTheme(theme: WorldTheme) {
      const desertOn = theme === 'desert';
      desert.visible = desertOn;
      trunks.visible = !desertOn;
      canopySpheres.visible = !desertOn;
      hedgeBodies.visible = !desertOn;
      hedgeTops.visible = !desertOn;
    },
    setSky(s: DayNightState) {
      skyMat.uniforms.uHorizon.value.copy(s.skyHorizon);
      skyMat.uniforms.uZenith.value.copy(s.skyZenith);
      skyMat.uniforms.uSun.value.copy(s.lightDir);
      skyMat.uniforms.uNight.value = s.night01;
      starMat.opacity = s.night01 * 0.9;
      stars.visible = s.night01 >= 0.02;
      cloudMat.color.copy(cloudDayColor).lerp(cloudNightColor, s.night01);
    },
    update(dt: number, focus: THREE.Vector3) {
      time += dt;

      sky.position.set(focus.x, 0, focus.z);
      stars.position.set(focus.x, 0, focus.z);

      for (const c of clouds) {
        c.group.position.x += c.speed * dt;
        if (c.group.position.x > CLOUD_WRAP) c.group.position.x = -CLOUD_WRAP;
      }

      for (let i = 0; i < MOTE_COUNT; i++) {
        const o = i * 3;
        for (let k = 0; k < 3; k++) {
          moteBase[o + k] += moteVel[o + k] * dt;
          const h = MOTE_HALF[k];
          // Leaving one side of the box re-places the mote on the opposite side.
          if (moteBase[o + k] > h) moteBase[o + k] -= 2 * h;
          else if (moteBase[o + k] < -h) moteBase[o + k] += 2 * h;
        }
        const wobX = Math.sin(time * 0.9 + motePhase[i]) * 0.4;
        const wobY = Math.cos(time * 0.7 + motePhase[i]) * 0.3;
        moteOut[o] = focus.x + moteBase[o] + wobX;
        moteOut[o + 1] = focus.y + 5 + moteBase[o + 1] + wobY;
        moteOut[o + 2] = focus.z + moteBase[o + 2] + wobX * 0.5;
      }
      moteAttr.needsUpdate = true;
    },
  };
}
