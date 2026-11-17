import type { HouseLights, WorldTheme } from './config';
import * as THREE from 'three';
import { HOUSE_FRONT_Z } from './config';

type V3 = [number, number, number];

/** The giant house and patio north of the lawn. Static: adds meshes and returns. */
export function buildHouse(scene: THREE.Scene): HouseLights {
  const F = HOUSE_FRONT_Z;   // front wall, z = -256
  const C = F - 30;          // centre z of the house (walls run from F back to F-60)
  const siding = 0xf4e8d0;

  const house = new THREE.Group();
  scene.add(house);

  const matCache = new Map<string, THREE.MeshStandardMaterial>();
  const std = (color: number, opts: THREE.MeshStandardMaterialParameters = {}): THREE.MeshStandardMaterial => {
    const key = `${color}|${JSON.stringify(opts)}`;
    let m = matCache.get(key);
    if (!m) {
      m = new THREE.MeshStandardMaterial({ color, ...opts });
      matCache.set(key, m);
    }
    return m;
  };

  const add = (geo: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number, cast = false): THREE.Mesh => {
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    house.add(mesh);
    return mesh;
  };

  const instanced = (geo: THREE.BufferGeometry, material: THREE.Material, positions: V3[], cast = false): THREE.InstancedMesh => {
    const im = new THREE.InstancedMesh(geo, material, positions.length);
    const m = new THREE.Matrix4();
    positions.forEach(([x, y, z], i) => {
      m.makeTranslation(x, y, z);
      im.setMatrixAt(i, m);
    });
    im.instanceMatrix.needsUpdate = true;
    im.castShadow = cast;
    im.receiveShadow = true;
    house.add(im);
    return im;
  };

  const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture => {
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const g = cv.getContext('2d');
    if (g) draw(g);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };

  // ---- Patio: 2 rows of stone slabs, x -70..70, between the lawn and the house ----
  const slabPos: V3[] = [];
  for (let j = 0; j < 2; j++) {
    for (let i = 0; i < 53; i++) slabPos.push([-67.6 + i * 2.6, 0.05, F + 1.3 + j * 2.6]);
  }
  const slabs = instanced(
    new THREE.BoxGeometry(2.45, 0.1, 2.45),
    new THREE.MeshStandardMaterial({ color: 0xbdb5a6, roughness: 0.95 }),
    slabPos,
  );
  const tint = new THREE.Color();
  for (let i = 0; i < slabPos.length; i++) slabs.setColorAt(i, tint.setScalar(0.92 + Math.random() * 0.14));
  if (slabs.instanceColor) slabs.instanceColor.needsUpdate = true;

  // ---- Walls, foundation, siding lines ----
  const sidingMat = std(siding);
  add(new THREE.BoxGeometry(96, 38, 60), sidingMat, 0, 19, C, true);
  add(new THREE.BoxGeometry(97, 2.5, 61), std(0x8d8d8d), 0, 1.25, C, true);
  const sidingLines: V3[] = [];
  for (let k = 1; k <= 15; k++) sidingLines.push([0, 2.5 * k, F + 0.05]);
  instanced(new THREE.BoxGeometry(96.2, 0.3, 0.15), std(0xdccbaa), sidingLines);

  // ---- Roof: gable along x, eaves at y 38, ridge at y 60, overhang 3 ----
  const run = 33;
  const rise = 22;
  const slope = Math.atan2(rise, run);
  const slopeLen = Math.hypot(run, rise);
  const roofGeo = new THREE.BoxGeometry(102, 1.2, slopeLen);
  const roofMat = std(0x6d4c41);
  const roofFront = add(roofGeo, roofMat, 0, 49, C + run / 2, true);
  roofFront.rotation.x = slope;
  const roofBack = add(roofGeo, roofMat, 0, 49, C - run / 2, true);
  roofBack.rotation.x = -slope;
  add(new THREE.BoxGeometry(102, 1.6, 2.2), std(0x5d4037), 0, 60.4, C, true);

  // Gable ends (triangular prisms closing the wall ends)
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-30, 38);
  gableShape.lineTo(30, 38);
  gableShape.lineTo(0, 60);
  gableShape.closePath();
  const gableGeo = new THREE.ExtrudeGeometry(gableShape, { depth: 1, bevelEnabled: false });
  for (const x of [48, -49]) {
    const gable = add(gableGeo, sidingMat, x, 0, C, true);
    gable.rotation.y = Math.PI / 2;
  }

  // ---- Chimney ----
  add(new THREE.BoxGeometry(7, 26, 7), std(0xa0522d), 28, 55, C + 10, true);
  add(new THREE.BoxGeometry(8.5, 1.2, 8.5), std(0x5d4037), 28, 68.6, C + 10, false);

  // ---- Steps (3 tiers of 0.85, descending toward the lawn) ----
  for (let k = 0; k < 3; k++) {
    const h = 0.85 * (3 - k);
    add(new THREE.BoxGeometry(18, h, 2.2), std(0xbfbfbf), 0, h / 2, F + 1.1 + 2.2 * k, true);
  }

  // ---- Front door ----
  add(new THREE.BoxGeometry(12, 21.6, 0.2), std(0xffffff), 0, 13.05, F + 0.1);      // trim behind the door
  add(new THREE.BoxGeometry(10, 21, 0.5), std(0x7b1f1f), 0, 13.05, F + 0.3);        // door
  add(new THREE.SphereGeometry(0.45, 12, 8), std(0xd4af37, { metalness: 0.8, roughness: 0.3 }), 3.5, 13, F + 0.7);
  add(new THREE.BoxGeometry(4, 4, 0.15), std(0x9fd8ff, { metalness: 0.2, roughness: 0.1, emissive: 0x223344 }), 0, 18, F + 0.65);

  const matTex = canvasTex(512, 128, (g) => {
    g.fillStyle = '#6b4a2e';
    g.fillRect(0, 0, 512, 128);
    g.fillStyle = '#e8d9a8';
    g.font = 'bold 40px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('GO AWAY, GNOMES', 256, 64);
  });
  const doormat = add(new THREE.PlaneGeometry(8, 1.8), new THREE.MeshStandardMaterial({ map: matTex, roughness: 1 }), 0, 2.56, F + 1.1);
  doormat.rotation.x = -Math.PI / 2;

  // ---- Windows: 4 ground floor, 5 upper, with the upper ones shuttered ----
  const windows: { x: number; y: number; upper: boolean }[] = [
    ...[-33, -15, 15, 33].map((x) => ({ x, y: 15, upper: false })),
    ...[-36, -18, 0, 18, 36].map((x) => ({ x, y: 30, upper: true })),
  ];
  const glassMat = std(0x9fd8ff, { metalness: 0.2, roughness: 0.1, emissive: 0x223344 });
  const whiteMat = std(0xffffff);
  // Night glow: lit windows, and the TV window, each get their own emissive material so setNight can drive them.
  const glowMat = new THREE.MeshStandardMaterial({ color: 0x9fd8ff, metalness: 0.2, roughness: 0.1, emissive: 0xffc46b, emissiveIntensity: 0 });
  const tvMat = new THREE.MeshStandardMaterial({ color: 0x9fd8ff, metalness: 0.2, roughness: 0.1, emissive: 0x6fa8ff, emissiveIntensity: 0 });
  const glassAt = (idx: number[]): V3[] => idx.map((i): V3 => [windows[i].x, windows[i].y, F + 0.65]);
  instanced(new THREE.BoxGeometry(11, 13, 0.6), whiteMat, windows.map((w): V3 => [w.x, w.y, F + 0.3]));
  instanced(new THREE.BoxGeometry(9, 11, 0.3), glassMat, glassAt([0, 8]));                 // two dark rooms
  instanced(new THREE.BoxGeometry(9, 11, 0.3), glowMat, glassAt([1, 2, 3, 4, 6, 7]));      // lit rooms
  add(new THREE.BoxGeometry(9, 11, 0.3), tvMat, windows[5].x, windows[5].y, F + 0.65);     // TV room (upper x=-18)
  instanced(new THREE.BoxGeometry(0.5, 11, 0.3), whiteMat, windows.map((w): V3 => [w.x, w.y, F + 0.85]));
  instanced(new THREE.BoxGeometry(9, 0.5, 0.3), whiteMat, windows.map((w): V3 => [w.x, w.y, F + 0.85]));
  const shutters: V3[] = [];
  for (const w of windows) {
    if (!w.upper) continue;
    shutters.push([w.x - 7.5, w.y, F + 0.3], [w.x + 7.5, w.y, F + 0.3]);
  }
  instanced(new THREE.BoxGeometry(3.5, 13, 0.6), std(0x1e88e5), shutters);

  // Cat curtain in the upper window at x = 18
  const curtainTex = canvasTex(128, 156, (g) => {
    g.fillStyle = '#fff3d6';
    g.fillRect(0, 0, 128, 156);
    g.fillStyle = 'rgba(0,0,0,0.05)';
    for (let x = 0; x < 128; x += 16) g.fillRect(x, 0, 8, 156);
    g.fillStyle = '#2b2b2b';
    g.strokeStyle = '#2b2b2b';
    g.beginPath();
    g.ellipse(64, 128, 26, 20, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.arc(64, 96, 16, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(50, 88); g.lineTo(52, 70); g.lineTo(60, 84); g.closePath(); g.fill();
    g.beginPath();
    g.moveTo(78, 88); g.lineTo(76, 70); g.lineTo(68, 84); g.closePath(); g.fill();
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(90, 132);
    g.quadraticCurveTo(115, 130, 108, 108);
    g.stroke();
  });
  add(new THREE.PlaneGeometry(9, 11), new THREE.MeshStandardMaterial({ map: curtainTex, roughness: 0.9 }), 18, 30, F + 0.82);

  // ---- Gutters, downpipe ----
  const gutterMat = std(0xe0e0e0);
  add(new THREE.BoxGeometry(102, 0.8, 0.8), gutterMat, 0, 37.2, F + 2.8);
  add(new THREE.BoxGeometry(102, 0.8, 0.8), gutterMat, 0, 37.2, F - 62.8);
  add(new THREE.CylinderGeometry(0.4, 0.4, 37, 8), gutterMat, -46, 18.5, F + 0.6);

  // ---- Silly touches ----
  // Hose reel on the wall, with green coils
  const reelX = -38;
  const reelY = 5;
  const reel = add(new THREE.CylinderGeometry(2.2, 2.2, 1.4, 16), std(0x8a9399, { metalness: 0.4, roughness: 0.5 }), reelX, reelY, F + 1.6);
  reel.rotation.x = Math.PI / 2;
  add(new THREE.BoxGeometry(1, 3, 0.8), std(0x555555), reelX, reelY, F + 0.5);
  for (const dz of [1.0, 1.6, 2.2]) {
    add(new THREE.TorusGeometry(2.3, 0.45, 8, 20), std(0x2e7d32), reelX, reelY, F + dz);
  }

  // Air-conditioner unit with a grille
  add(new THREE.BoxGeometry(7, 6, 3), std(0xdddddd), 40, 5, F + 1.5);
  add(new THREE.BoxGeometry(5, 4, 0.2), std(0x555555), 40, 5, F + 3.1);

  // House number plaque beside the door
  const plaqueTex = canvasTex(192, 96, (g) => {
    g.fillStyle = '#f5f5f5';
    g.fillRect(0, 0, 192, 96);
    g.strokeStyle = '#333333';
    g.lineWidth = 6;
    g.strokeRect(3, 3, 186, 90);
    g.fillStyle = '#b71c1c';
    g.font = 'bold 64px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('404', 96, 50);
  });
  add(new THREE.PlaneGeometry(3, 1.6), new THREE.MeshStandardMaterial({ map: plaqueTex, roughness: 0.6 }), -7.8, 17, F + 0.1);

  // ---- Porch lamp beside the door, with a pool of light on the steps (night only) ----
  const lampGlowMat = new THREE.MeshStandardMaterial({ color: 0xffd27a, emissive: 0xffd27a, emissiveIntensity: 0 });
  add(new THREE.BoxGeometry(1.6, 2.4, 1.2), std(0x222222), 8, 13, F + 0.6);
  add(new THREE.SphereGeometry(0.5, 12, 8), lampGlowMat, 8, 13, F + 1.5);
  const poolMat = new THREE.MeshBasicMaterial({
    color: 0xffc46b, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0,
  });
  const pool = new THREE.Mesh(new THREE.CircleGeometry(10, 32), poolMat);
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, 0.08, F + 9);   // on the patio at the foot of the steps (a raised disc floated past the steps)
  house.add(pool);

  // The TV window flips between two blues every 0.15-0.4 s, driven by performance.now().
  let tvNextFlip = 0;
  let tvOn = false;

  return {
    setTheme(theme: WorldTheme) {
      const desertOn = theme === 'desert';
      sidingMat.color.setHex(desertOn ? 0xe0b083 : siding);
      roofMat.color.setHex(desertOn ? 0xb5523b : 0x6d4c41);
    },
    setNight(night01: number) {
      glowMat.emissiveIntensity = night01 * 1.4;

      const now = performance.now();
      if (now >= tvNextFlip) {
        tvOn = !tvOn;
        tvMat.emissive.setHex(tvOn ? 0x9fc8ff : 0x6fa8ff);
        tvNextFlip = now + 150 + Math.random() * 250;
      }
      tvMat.emissiveIntensity = night01 * 1.2;

      lampGlowMat.emissiveIntensity = night01 * 2;
      poolMat.opacity = night01 * 0.35;
    },
  };
}
