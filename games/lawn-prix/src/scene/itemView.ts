// Item boxes (spinning seed crates, hidden while respawning) and acorns in flight, drawn from RaceState.
// The view only: nothing here feeds back into the simulation.
import * as THREE from 'three';
import { ITEMS, type RaceState } from '../config';
import { boxSpots } from '../items';
import type { Track } from '../track';

export interface ItemView {
  update(race: Readonly<RaceState>, dt: number): void;
  dispose(): void;
}

const BOX_SIZE = 0.9;
const BOX_Y = 0.9;
const POP_S = 0.25;
const ACORN_Y = 0.5;
const SMOOTH_RATE = 20; // 1/s: pooled acorns chase their target (snapshot screens)
const SNAP_DIST = 4; // m: farther than this, or newly shown, snap instead of lerp

/** A white "?" on a transparent canvas, used as the face of every item box. */
function questionTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  if (g) {
    g.clearRect(0, 0, 128, 128);
    g.font = 'bold 96px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineWidth = 10;
    g.strokeStyle = 'rgba(40, 20, 60, 0.85)';
    g.strokeText('?', 64, 70);
    g.fillStyle = '#ffffff';
    g.fillText('?', 64, 70);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createItemView(scene: THREE.Scene, track: Track): ItemView {
  const group = new THREE.Group();
  scene.add(group);

  // Shared geometries and materials (every box and acorn uses the same ones).
  const boxGeo = new THREE.BoxGeometry(BOX_SIZE, BOX_SIZE, BOX_SIZE);
  const faceGeo = new THREE.BoxGeometry(BOX_SIZE * 1.02, BOX_SIZE * 1.02, BOX_SIZE * 1.02);
  const boxMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, transparent: true, opacity: 0.75, roughness: 0.4, emissive: 0x000000,
  });
  const qTex = questionTexture();
  const faceMat = new THREE.MeshBasicMaterial({ map: qTex, transparent: true, depthWrite: false });
  const tint = new THREE.Color();
  const white = new THREE.Color(0xffffff);

  const bodyGeo = new THREE.SphereGeometry(0.15, 14, 10);
  bodyGeo.scale(1, 1.25, 1);
  const capGeo = new THREE.SphereGeometry(0.1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  capGeo.translate(0, 0.17, 0);
  const stemGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.6, 3);
  stemGeo.translate(0, 0.02, 0);
  const shadowGeo = new THREE.CircleGeometry(0.3, 16);
  shadowGeo.rotateX(-Math.PI / 2);
  const acornMat = new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.6 });
  const capMat = new THREE.MeshStandardMaterial({ color: 0x4a2e16, roughness: 0.8 });
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x3b2412 });
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false });

  // Item boxes.
  const spots = boxSpots(track);
  const boxes = spots.map((p, j) => {
    const root = new THREE.Group();
    root.position.set(p.x, BOX_Y, p.z);
    const spin = new THREE.Group();
    root.add(spin);
    spin.add(new THREE.Mesh(boxGeo, boxMat));
    spin.add(new THREE.Mesh(faceGeo, faceMat));
    group.add(root);
    return { root, spin, phase: j * 0.7, pop: 1, shown: true };
  });

  // Acorn pool: each entry is an acorn, its ground shadow, and its displayed position.
  const pool = Array.from({ length: ITEMS.maxAcorns }, () => {
    const acorn = new THREE.Group();
    acorn.rotation.order = 'YXZ';
    acorn.add(new THREE.Mesh(bodyGeo, acornMat));
    acorn.add(new THREE.Mesh(capGeo, capMat));
    acorn.add(new THREE.Mesh(stemGeo, stemMat));
    acorn.visible = false;
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.visible = false;
    group.add(acorn);
    group.add(shadow);
    return { acorn, shadow, x: 0, z: 0, tumble: 0, live: false };
  });

  let time = 0;

  return {
    update(race, dt) {
      time += dt;
      const ease = 1 - Math.exp(-dt * SMOOTH_RATE);

      // Boxes: hidden while taken, pop in when back, spin and bob, and cycle the rainbow tint.
      tint.setHSL((time * 0.15) % 1, 0.9, 0.6);
      boxMat.color.copy(tint).lerp(white, 0.35);
      boxMat.emissive.setHSL((time * 0.15) % 1, 1, 0.22);
      boxes.forEach((b, j) => {
        const shown = race.boxes[j] <= race.t;
        if (shown && !b.shown) b.pop = 0;
        b.shown = shown;
        b.root.visible = shown;
        if (!shown) return;
        b.pop = Math.min(1, b.pop + dt / POP_S);
        const e = b.pop * b.pop * (3 - 2 * b.pop);
        b.root.scale.setScalar(Math.max(e, 0.0001));
        b.spin.rotation.y += dt * 2;
        b.spin.rotation.x = Math.sin(time * 1.5 + b.phase) * 0.3;
        b.root.position.y = BOX_Y + Math.sin(time * 3 + b.phase) * 0.12;
      });

      // Acorns: lerp pooled entries toward the race's acorns, tumble with their speed.
      pool.forEach((p, i) => {
        const a = race.acorns[i];
        if (!a) {
          p.acorn.visible = false;
          p.shadow.visible = false;
          p.live = false;
          return;
        }
        const d = Math.hypot(a.x - p.x, a.z - p.z);
        if (!p.live || d > SNAP_DIST) {
          p.x = a.x;
          p.z = a.z;
        } else {
          p.x += (a.x - p.x) * ease;
          p.z += (a.z - p.z) * ease;
        }
        p.live = true;
        const speed = Math.hypot(a.vx, a.vz);
        p.tumble += dt * speed * 0.5;
        p.acorn.visible = true;
        p.acorn.position.set(p.x, ACORN_Y, p.z);
        p.acorn.rotation.set(p.tumble, speed > 0.01 ? Math.atan2(a.vx, a.vz) : 0, 0);
        p.shadow.visible = true;
        p.shadow.position.set(p.x, 0.03, p.z);
      });
    },
    dispose() {
      scene.remove(group);
      // Geometries and materials are shared by every box and acorn; dispose each once.
      boxGeo.dispose();
      faceGeo.dispose();
      boxMat.dispose();
      faceMat.dispose();
      qTex.dispose();
      bodyGeo.dispose();
      capGeo.dispose();
      stemGeo.dispose();
      shadowGeo.dispose();
      acornMat.dispose();
      capMat.dispose();
      stemMat.dispose();
      shadowMat.dispose();
      group.clear();
    },
  };
}
