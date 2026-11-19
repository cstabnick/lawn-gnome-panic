// Cel-shaded giant metro train car that replaces the snowboard when the "denshattack" cheatcode is active.
// The car body, windows, lights, roof units and bogies come from the aether-train-car prefab, built at 4x (the prefab
// is a quarter of the real car). The DENSHATTACK livery stays here: it is a canvas texture, which prefabs cannot hold.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { GRADIENT } from './toon';

export const TRAIN_HALF_LEN = 5.5; // 11 m long
export const TRAIN_HALF_W = 1.25;  // 2.5 m wide
/** Local Y of the train roof top inside boardPivot. */
export const TRAIN_ROOF_Y = 2.65;
/** Extra vertical offset for riderPivot so the gnome stands on the train roof. */
export const TRAIN_RIDER_OFFSET = 2.63;

/** The prefab is authored at a quarter size; this scales it to the 11 m car. */
const TRAIN_PREFAB_SCALE = 4;

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

export function makeTrainCar(): THREE.Group {
  const g = new THREE.Group();

  // Body, roof, windows, lights, roof units and bogies.
  const car = buildPrefab('aether-train-car', { scale: TRAIN_PREFAB_SCALE });
  g.add(car);

  // Side livery stripes with DENSHATTACK metro banner.
  const bannerMat = new THREE.MeshToonMaterial({ map: makeSideBannerTexture(), gradientMap: GRADIENT });
  const stripeGeo = new THREE.PlaneGeometry(TRAIN_HALF_LEN * 2 * 0.95, 0.46);
  for (const side of [-1, 1]) {
    const stripe = new THREE.Mesh(stripeGeo, bannerMat);
    stripe.position.set(side * (TRAIN_HALF_W + 0.015), 0.98, 0);
    stripe.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    g.add(stripe);
  }

  return g;
}
