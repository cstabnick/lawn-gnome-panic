// Cel-shaded giant metro train car that replaces the snowboard when the "denshattack" cheatcode is active.
import * as THREE from 'three';
import { PALETTE } from '../config';
import { GRADIENT, addOutline, toonMat } from './toon';

export const TRAIN_HALF_LEN = 5.5; // 11 m long
export const TRAIN_HALF_W = 1.25;  // 2.5 m wide
/** Local Y of the train roof top inside boardPivot. */
export const TRAIN_ROOF_Y = 2.65;
/** Extra vertical offset for riderPivot so the gnome stands on the train roof. */
export const TRAIN_RIDER_OFFSET = 2.63;

function makeSideBannerTexture(): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = 1024;
  cv.height = 128;
  const g = cv.getContext('2d');
  if (g) {
    g.fillStyle = '#2de2e6';
    g.fillRect(0, 0, 1024, 128);
    g.fillStyle = '#ff3fa4';
    g.fillRect(0, 88, 1024, 40);
    g.font = 'italic 900 64px Arial, Helvetica, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineWidth = 10;
    g.strokeStyle = '#17072e';
    g.strokeText('METRO · DENSHATTACK', 512, 46);
    g.fillStyle = '#ffe14d';
    g.fillText('METRO · DENSHATTACK', 512, 46);
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
  outline = 0.05,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  addOutline(mesh, outline);
  return mesh;
}

export function makeTrainCar(): THREE.Group {
  const g = new THREE.Group();
  const bodyW = TRAIN_HALF_W * 2;
  const bodyL = TRAIN_HALF_LEN * 2;
  const bodyH = 1.95;
  const bodyY = 1.42; // spans 0.445..2.395

  // Main brushed-steel metro body.
  const bodyMat = toonMat(0xe8eef5);
  const body = outlinedBox(bodyW, bodyH, bodyL, bodyMat, 0.06);
  body.position.y = bodyY;
  g.add(body);

  // Rounded/chamfered roof cap (top at y = 2.65).
  const roofMat = toonMat(0xcfd9e6);
  const roof = outlinedBox(bodyW * 0.88, 0.26, bodyL * 0.97, roofMat, 0.05);
  roof.position.y = 2.52;
  g.add(roof);

  // Side livery stripes with DENSHATTACK metro banner.
  const bannerMat = new THREE.MeshToonMaterial({ map: makeSideBannerTexture(), gradientMap: GRADIENT });
  const stripeGeo = new THREE.PlaneGeometry(bodyL * 0.95, 0.46);
  for (const side of [-1, 1]) {
    const stripe = new THREE.Mesh(stripeGeo, bannerMat);
    stripe.position.set(side * (TRAIN_HALF_W + 0.015), 0.98, 0);
    stripe.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    g.add(stripe);
  }

  // Front & rear accent bumper stripes.
  const accentMat = toonMat(PALETTE.pink, { emissive: PALETTE.pink, emissiveIntensity: 0.25 });
  for (const end of [-1, 1]) {
    const bumper = outlinedBox(bodyW + 0.08, 0.34, 0.14, accentMat, 0.04);
    bumper.position.set(0, 0.72, end * TRAIN_HALF_LEN);
    g.add(bumper);
  }

  // Illuminated passenger windows along both sides + sliding door seams.
  const winMat = toonMat(PALETTE.yellow, { emissive: PALETTE.yellow, emissiveIntensity: 0.55 });
  const frameMat = toonMat(PALETTE.ink);
  const winGeo = new THREE.BoxGeometry(0.06, 0.68, 1.05);
  const frameGeo = new THREE.BoxGeometry(0.04, 0.80, 1.18);
  const doorGeo = new THREE.BoxGeometry(0.04, 1.68, 0.06);
  const winZ = [-3.8, -1.9, 0, 1.9, 3.8];
  for (const side of [-1, 1]) {
    for (const z of winZ) {
      const frame = new THREE.Mesh(frameGeo, frameMat);
      frame.position.set(side * (TRAIN_HALF_W + 0.01), 1.76, z);
      const pane = new THREE.Mesh(winGeo, winMat);
      pane.position.set(side * (TRAIN_HALF_W + 0.02), 1.76, z);
      g.add(frame, pane);
    }
    for (const dz of [-2.85, 2.85]) {
      const seam = new THREE.Mesh(doorGeo, frameMat);
      seam.position.set(side * (TRAIN_HALF_W + 0.015), 1.34, dz);
      g.add(seam);
    }
  }

  // Front (+z) and rear (-z) cab windshields, destination signs, headlights, and tail lights.
  const glassMat = toonMat(0x1b1035);
  const headMat = toonMat(0xfff5b8, { emissive: 0xffe14d, emissiveIntensity: 0.9 });
  const tailMat = toonMat(0xff2d4b, { emissive: 0xff2d4b, emissiveIntensity: 0.85 });
  const signMat = toonMat(PALETTE.cyan, { emissive: PALETTE.cyan, emissiveIntensity: 0.7 });
  for (const end of [-1, 1]) {
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.78, 0.76, 0.06), glassMat);
    windshield.position.set(0, 1.76, end * (TRAIN_HALF_LEN + 0.015));
    g.add(windshield);

    const sign = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.20, 0.06), signMat);
    sign.position.set(0, 2.26, end * (TRAIN_HALF_LEN + 0.02));
    g.add(sign);

    const lightMat = end > 0 ? headMat : tailMat;
    for (const lx of [-0.76, 0.76]) {
      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 12), lightMat);
      lamp.rotation.x = Math.PI / 2;
      lamp.position.set(lx, 1.12, end * (TRAIN_HALF_LEN + 0.025));
      g.add(lamp);
    }
  }

  // Roof AC units (fore and aft so the gnome stands cleanly on the center roof).
  const acMat = toonMat(0x98a6b8);
  for (const az of [-3.4, 3.4]) {
    const ac = outlinedBox(1.5, 0.28, 1.3, acMat, 0.04);
    ac.position.set(0, 2.78, az);
    g.add(ac);
  }

  // Undercarriage chassis and bogie wheels.
  const chassisMat = toonMat(0x261844);
  const chassis = outlinedBox(bodyW * 0.92, 0.22, bodyL * 0.96, chassisMat, 0.04);
  chassis.position.y = 0.36;
  g.add(chassis);

  const wheelMat = toonMat(0x8d99ae);
  const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.18, 14);
  wheelGeo.rotateZ(Math.PI / 2);
  const axleZ = [-4.0, -2.9, 2.9, 4.0];
  for (const wz of axleZ) {
    for (const wx of [-0.92, 0.92]) {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(wx, 0.24, wz);
      addOutline(w, 0.03);
      g.add(w);
    }
  }

  return g;
}
