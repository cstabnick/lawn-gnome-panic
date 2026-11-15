// The garden around the track: sky, fog and lights, ground, the mown track (a striped ribbon with edge trim), the
// start/finish arch, long grass, hedges, props and hay bales on the outside of the sharpest bends. The full game and
// the party slice both call buildTrack into a fresh scene. Every geometry and material is created inside buildTrack
// (nothing at import time). All randomness is seeded (no Math.random), so the garden is the same on every load.
import * as THREE from 'three';
import { TRACK } from '../config';
import { TRACK_POINTS, TRACK_LENGTH, pointAt, projectOnTrack, headingOf } from '../track';

const TAU = Math.PI * 2;

/** Seeded PRNG (mulberry32): returns numbers in [0, 1). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvasTexture(w: number, h: number, paint: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d');
  if (g) paint(g);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** A flat strip along the centreline: left edge at offset oLeft, right edge at oRight (oLeft > oRight), at height y. */
function ribbon(oLeft: number, oRight: number, y: number, colorAt?: (i: number) => THREE.Color): THREE.BufferGeometry {
  const n = TRACK_POINTS.length;
  const pos = new Float32Array(n * 6);
  const col = new Float32Array(n * 6);
  TRACK_POINTS.forEach((p, i) => {
    const lx = p.tz, lz = -p.tx; // left of the tangent
    pos.set([p.x + lx * oLeft, y, p.z + lz * oLeft, p.x + lx * oRight, y, p.z + lz * oRight], i * 6);
    if (colorAt) {
      const c = colorAt(i);
      col.set([c.r, c.g, c.b, c.r, c.g, c.b], i * 6);
    }
  });
  const idx: number[] = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n; // the last quad closes the loop back to point 0
    idx.push(2 * i, 2 * i + 1, 2 * j, 2 * i + 1, 2 * j + 1, 2 * j);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  if (colorAt) g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Signed turn (radians, + = left) of the track over a 15 m window centred on s. */
function turnAt(s: number): number {
  const a = pointAt(s - 7.5), b = pointAt(s + 7.5);
  const d = headingOf(b.tx, b.tz) - headingOf(a.tx, a.tz);
  return Math.atan2(Math.sin(d), Math.cos(d));
}

export function buildTrack(scene: THREE.Scene): void {
  const rand = mulberry32(0x1a2b3c);
  const half = TRACK.width / 2;
  const { minX, maxX, minZ, maxZ } = TRACK.bounds;
  const group = new THREE.Group();
  group.name = 'track';

  // Distance from (x, z) to the nearest centreline point.
  const distToTrack = (x: number, z: number): number => {
    const h = projectOnTrack(x, z);
    return Math.hypot(h.x - x, h.z - z);
  };
  // A random spot inside the bounds (inset from the hedges), at least `clear` from the centreline; null if none found.
  const spot = (inset: number, clear: number): { x: number; z: number } | null => {
    for (let t = 0; t < 4000; t++) {
      const x = minX + inset + rand() * (maxX - minX - 2 * inset);
      const z = minZ + inset + rand() * (maxZ - minZ - 2 * inset);
      if (distToTrack(x, z) >= clear) return { x, z };
    }
    return null;
  };
  // Calls make() for `count` props; `radius` adds to the clearance so big props stay off the track.
  const scatter = (count: number, radius: number, make: (x: number, z: number, yaw: number) => void): void => {
    for (let k = 0; k < count; k++) {
      const s = spot(2, half + 0.8 + radius);
      if (s) make(s.x, s.z, rand() * TAU);
    }
  };

  // Sky, fog and light.
  scene.background = new THREE.Color(0x8fd0ff);
  scene.fog = new THREE.Fog(0x8fd0ff, 60, 170);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x4a7a3a, 1.2));
  const sun = new THREE.DirectionalLight(0xfff2d6, 2.2);
  sun.position.set(30, 60, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -80; sc.right = 80; sc.top = 80; sc.bottom = -80; sc.far = 200;
  sc.updateProjectionMatrix();
  scene.add(sun, sun.target);

  // Ground: long, darker grass.
  const grassTex = canvasTexture(256, 256, (g) => {
    g.fillStyle = '#3f8a2e';
    g.fillRect(0, 0, 256, 256);
    g.lineWidth = 1;
    for (let i = 0; i < 900; i++) {
      const x = rand() * 256, y = rand() * 256, len = 4 + rand() * 6;
      g.strokeStyle = rand() < 0.5 ? '#56a13b' : '#2f6e25';
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (rand() - 0.5) * 4, y - len);
      g.stroke();
    }
  });
  grassTex.wrapS = THREE.RepeatWrapping;
  grassTex.wrapT = THREE.RepeatWrapping;
  grassTex.repeat.set(60, 60);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshLambertMaterial({ map: grassTex }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  group.add(ground);

  // The mown track: mowing stripes every 6 m of track, then white-ish edge trim just inside each edge.
  const LIGHT = new THREE.Color(0x8fd16a), DARK = new THREE.Color(0x76bd55);
  const stripeColor = (i: number): THREE.Color => (Math.floor(TRACK_POINTS[i].s / 6) % 2 === 0 ? LIGHT : DARK);
  const trackMat = new THREE.MeshLambertMaterial({
    vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  });
  const track = new THREE.Mesh(ribbon(half, -half, 0.01, stripeColor), trackMat);
  track.receiveShadow = true;
  group.add(track);

  const trimMat = new THREE.MeshLambertMaterial({
    color: 0xe8f0d0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
  for (const [a, b] of [[half, half - 0.25], [-half + 0.25, -half]] as const) {
    const trim = new THREE.Mesh(ribbon(a, b, 0.015), trimMat);
    trim.receiveShadow = true;
    group.add(trim);
  }

  // Start/finish line and banner arch. The group is rotated to the track heading: local +z is forward, local +x is left.
  const start = pointAt(TRACK.startS);
  const startGroup = new THREE.Group();
  startGroup.position.set(start.x, 0, start.z);
  startGroup.rotation.y = headingOf(start.tx, start.tz);
  group.add(startGroup);

  const checkerTex = canvasTexture(128, 32, (g) => {
    for (let cx = 0; cx < 8; cx++) {
      for (let cy = 0; cy < 2; cy++) {
        g.fillStyle = (cx + cy) % 2 ? '#ffffff' : '#111111';
        g.fillRect(cx * 16, cy * 16, 16, 16);
      }
    }
  });
  checkerTex.magFilter = THREE.NearestFilter;
  const checker = new THREE.Mesh(
    new THREE.PlaneGeometry(TRACK.width, 1.2),
    new THREE.MeshLambertMaterial({ map: checkerTex, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }),
  );
  checker.rotation.x = -Math.PI / 2;
  checker.position.y = 0.02;
  checker.receiveShadow = true;
  startGroup.add(checker);

  const bannerTex = canvasTexture(512, 128, (g) => {
    g.fillStyle = '#1d6b2a';
    g.fillRect(0, 0, 512, 128);
    g.fillStyle = '#ffffff';
    g.font = 'bold 84px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('LAWN PRIX', 256, 68);
  });
  const plainMat = new THREE.MeshLambertMaterial({ color: 0x1d6b2a });
  const bannerMat = new THREE.MeshLambertMaterial({ map: bannerTex });
  // Box face order: +x, -x, +y, -y, +z, -z. The text is on the two long faces.
  const crossbar = new THREE.Mesh(
    new THREE.BoxGeometry(TRACK.width + 1.5, 0.7, 0.15),
    [plainMat, plainMat, plainMat, plainMat, bannerMat, bannerMat],
  );
  crossbar.position.y = 4.6;
  crossbar.castShadow = true;
  startGroup.add(crossbar);
  const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 4.6, 8);
  const postMat = new THREE.MeshLambertMaterial({ color: 0xe8e8e8 });
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(side * (half + 0.6), 2.3, 0);
    post.castShadow = true;
    startGroup.add(post);
  }

  // Long grass tufts off the track (600 instances).
  const tuftMat = new THREE.MeshLambertMaterial({ color: 0x4f9a35 });
  const tufts = new THREE.InstancedMesh(new THREE.ConeGeometry(0.18, 0.7, 4), tuftMat, 600);
  const dummy = new THREE.Object3D();
  let placed = 0;
  for (let k = 0; k < 600; k++) {
    const s = spot(1.5, half + 0.8);
    if (!s) continue;
    dummy.position.set(s.x, 0.35, s.z);
    dummy.rotation.set(0, rand() * TAU, 0);
    dummy.scale.setScalar(0.8 + rand() * 0.6);
    dummy.updateMatrix();
    tufts.setMatrixAt(placed++, dummy.matrix);
  }
  tufts.count = placed;
  group.add(tufts);

  // Hedge boundary: four long boxes around the bounds.
  const hedgeMat = new THREE.MeshLambertMaterial({ color: 0x2e6b2a });
  const hedge = (w: number, d: number, x: number, z: number): void => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 1.6, d), hedgeMat);
    m.position.set(x, 0.8, z);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
  };
  const midX = (minX + maxX) / 2, midZ = (minZ + maxZ) / 2;
  hedge(maxX - minX, 1.4, midX, minZ);
  hedge(maxX - minX, 1.4, midX, maxZ);
  hedge(1.4, maxZ - minZ, minX, midZ);
  hedge(1.4, maxZ - minZ, maxX, midZ);

  // Props off the track.
  const bedMat = new THREE.MeshLambertMaterial({ color: 0x6b4a2b });
  const bedGeo = new THREE.BoxGeometry(2.4, 0.35, 1.4);
  const flowerGeo = new THREE.SphereGeometry(0.14, 6, 4);
  const flowerMats = [0xf2c230, 0xf05aa0, 0xffffff, 0xd8342c, 0x8a4fd0]
    .map((hex) => new THREE.MeshLambertMaterial({ color: hex }));
  scatter(10, 1.3, (x, z, yaw) => {
    const bed = new THREE.Group();
    bed.position.set(x, 0, z);
    bed.rotation.y = yaw;
    const soil = new THREE.Mesh(bedGeo, bedMat);
    soil.position.y = 0.175;
    soil.receiveShadow = true;
    bed.add(soil);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        const f = new THREE.Mesh(flowerGeo, flowerMats[Math.floor(rand() * flowerMats.length)]);
        f.position.set(-1.05 + c * 0.7, 0.36, -0.35 + r * 0.35);
        bed.add(f);
      }
    }
    group.add(bed);
  });

  const potGeo = new THREE.CylinderGeometry(0.35, 0.25, 0.6, 8);
  const potMat = new THREE.MeshLambertMaterial({ color: 0xc8643c });
  scatter(4, 0.35, (x, z) => {
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.set(x, 0.3, z);
    pot.castShadow = true;
    group.add(pot);
  });

  const trunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 2.2, 6);
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6b4a2b });
  const canopyGeo = new THREE.IcosahedronGeometry(2.4, 0);
  const canopyMat = new THREE.MeshLambertMaterial({ color: 0x2f7d32 });
  scatter(6, 2.4, (x, z) => {
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, 1.1, z);
    trunk.castShadow = true;
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(x, 3.4, z);
    canopy.castShadow = true;
    group.add(trunk, canopy);
  });

  // Hay bales on the outside of the four sharpest bends: three per bend, just outside the outer edge.
  const corners: { s: number; turn: number }[] = [];
  const sharpest = TRACK_POINTS.map((p) => ({ s: p.s, turn: turnAt(p.s) }))
    .sort((u, v) => Math.abs(v.turn) - Math.abs(u.turn));
  for (const c of sharpest) {
    if (corners.length === 4) break;
    const apart = corners.every((k) => {
      const d = Math.abs(c.s - k.s);
      return Math.min(d, TRACK_LENGTH - d) >= 30;
    });
    if (apart) corners.push(c);
  }
  const baleGeo = new THREE.BoxGeometry(1.2, 0.8, 0.8);
  const baleMat = new THREE.MeshLambertMaterial({ color: 0xe0c060 });
  for (const c of corners) {
    const side = c.turn > 0 ? -1 : 1; // a left bend has its outer edge on the right
    for (let k = -1; k <= 1; k++) {
      const p = pointAt(c.s + k * 1.4);
      const lat = side * (half + 1.4);
      const bale = new THREE.Mesh(baleGeo, baleMat);
      bale.position.set(p.x + p.tz * lat, 0.4, p.z - p.tx * lat);
      bale.rotation.y = headingOf(p.tx, p.tz);
      bale.castShadow = true;
      group.add(bale);
    }
  }

  scene.add(group);
}
