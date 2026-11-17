// Cel-shaded metro train car that replaces the snowboard when the "denshattack" cheatcode is active.
import * as THREE from 'three';
import { PALETTE } from '../config';
import { GRADIENT, addOutline, toonMat } from './toon';

export const TRAIN_HALF_LEN = 1.45;
export const TRAIN_HALF_W = 0.38;
/** Local Y of the train roof top inside boardPivot. */
export const TRAIN_ROOF_Y = 0.79;
/** Extra vertical offset for riderPivot so the gnome stands on the train roof. */
export const TRAIN_RIDER_OFFSET = 0.77;

function makeSideBannerTexture(): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = 512;
  cv.height = 64;
  const g = cv.getContext('2d');
  if (g) {
    g.fillStyle = '#2de2e6';
    g.fillRect(0, 0, 512, 64);
    g.fillStyle = '#ff3fa4';
    g.fillRect(0, 44, 512, 20);
    g.font = 'italic 900 32px Arial, Helvetica, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineWidth = 5;
    g.strokeStyle = '#17072e';
    g.strokeText('METRO · DENSHATTACK', 256, 24);
    g.fillStyle = '#ffe14d';
    g.fillText('METRO · DENSHATTACK', 256, 24);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function outlinedBox(
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  outline = 0.02,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  addOutline(mesh, outline);
  return mesh;
}

export function makeTrainCar(): THREE.Group {
  const g = new THREE.Group();
  const bodyW = TRAIN_HALF_W * 2;
  const bodyL = TRAIN_HALF_LEN * 2;
  const bodyH = 0.56;
  const bodyY = 0.42; // spans 0.14..0.70

  // Main brushed-steel metro body.
  const bodyMat = toonMat(0xe8eef5);
  const body = outlinedBox(bodyW, bodyH, bodyL, bodyMat, 0.025);
  body.position.y = bodyY;
  g.add(body);

  // Rounded/chamfered roof cap (top at y = 0.79).
  const roofMat = toonMat(0xcfd9e6);
  const roof = outlinedBox(bodyW * 0.88, 0.09, bodyL * 0.96, roofMat, 0.02);
  roof.position.y = 0.745;
  g.add(roof);

  // Side livery stripes with DENSHATTACK metro banner.
  const bannerMat = new THREE.MeshToonMaterial({ map: makeSideBannerTexture(), gradientMap: GRADIENT });
  const stripeGeo = new THREE.PlaneGeometry(bodyL * 0.94, 0.14);
  for (const side of [-1, 1]) {
    const stripe = new THREE.Mesh(stripeGeo, bannerMat);
    stripe.position.set(side * (TRAIN_HALF_W + 0.004), 0.30, 0);
    stripe.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    g.add(stripe);
  }

  // Front & rear accent bumper stripes.
  const accentMat = toonMat(PALETTE.pink, { emissive: PALETTE.pink, emissiveIntensity: 0.25 });
  for (const end of [-1, 1]) {
    const bumper = outlinedBox(bodyW + 0.02, 0.10, 0.04, accentMat, 0.015);
    bumper.position.set(0, 0.24, end * TRAIN_HALF_LEN);
    g.add(bumper);
  }

  // Illuminated passenger windows along both sides + sliding door seams.
  const winMat = toonMat(PALETTE.yellow, { emissive: PALETTE.yellow, emissiveIntensity: 0.55 });
  const frameMat = toonMat(PALETTE.ink);
  const winGeo = new THREE.BoxGeometry(0.02, 0.19, 0.28);
  const frameGeo = new THREE.BoxGeometry(0.015, 0.23, 0.32);
  const doorGeo = new THREE.BoxGeometry(0.014, 0.44, 0.02);
  const winZ = [-0.95, -0.48, 0, 0.48, 0.95];
  for (const side of [-1, 1]) {
    for (const z of winZ) {
      const frame = new THREE.Mesh(frameGeo, frameMat);
      frame.position.set(side * (TRAIN_HALF_W + 0.002), 0.52, z);
      const pane = new THREE.Mesh(winGeo, winMat);
      pane.position.set(side * (TRAIN_HALF_W + 0.005), 0.52, z);
      g.add(frame, pane);
    }
    for (const dz of [-0.72, 0.72]) {
      const seam = new THREE.Mesh(doorGeo, frameMat);
      seam.position.set(side * (TRAIN_HALF_W + 0.003), 0.39, dz);
      g.add(seam);
    }
  }

  // Front (+z) and rear (-z) cab windshields, headlights, and tail lights.
  const glassMat = toonMat(0x1b1035);
  const headMat = toonMat(0xfff5b8, { emissive: 0xffe14d, emissiveIntensity: 0.9 });
  const tailMat = toonMat(0xff2d4b, { emissive: 0xff2d4b, emissiveIntensity: 0.85 });
  const signMat = toonMat(PALETTE.cyan, { emissive: PALETTE.cyan, emissiveIntensity: 0.7 });
  for (const end of [-1, 1]) {
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.76, 0.22, 0.02), glassMat);
    windshield.position.set(0, 0.53, end * (TRAIN_HALF_LEN + 0.003));
    g.add(windshield);

    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.055, 0.02), signMat);
    sign.position.set(0, 0.67, end * (TRAIN_HALF_LEN + 0.004));
    g.add(sign);

    const lightMat = end > 0 ? headMat : tailMat;
    for (const lx of [-0.23, 0.23]) {
      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.025, 10), lightMat);
      lamp.rotation.x = Math.PI / 2;
      lamp.position.set(lx, 0.35, end * (TRAIN_HALF_LEN + 0.006));
      g.add(lamp);
    }
  }

  // Roof AC units (placed fore and aft so the gnome has a clear deck in the center).
  const acMat = toonMat(0x98a6b8);
  for (const az of [-0.95, 0.95]) {
    const ac = outlinedBox(0.46, 0.08, 0.38, acMat, 0.015);
    ac.position.set(0, 0.82, az);
    g.add(ac);
  }

  // Undercarriage chassis and bogie wheels.
  const chassisMat = toonMat(0x261844);
  const chassis = outlinedBox(bodyW * 0.92, 0.06, bodyL * 0.96, chassisMat, 0.015);
  chassis.position.y = 0.11;
  g.add(chassis);

  const wheelMat = toonMat(0x8d99ae);
  const wheelGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.06, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  const axleZ = [-1.05, -0.75, 0.75, 1.05];
  for (const wz of axleZ) {
    for (const wx of [-0.28, 0.28]) {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(wx, 0.075, wz);
      addOutline(w, 0.012);
      g.add(w);
    }
  }

  return g;
}
