import * as THREE from 'three';
import { createGnomeModel, getMyGnome, GNORMAN_LOOK, type GnomeLook, type GnomeModel } from '@lawn/gnome';
import type { SkaterState } from '../sim/skater';

const DEFAULT_GSR_LOOK: GnomeLook = {
  ...GNORMAN_LOOK,
  hat: 0xff4ecd,
  shirt: 0x00e5ff,
};

export interface RiderView {
  root: THREE.Group;
  model: GnomeModel;
  update(s: SkaterState, dt: number): void;
  triggerSpray(colorHex?: string): void;
  dispose(): void;
}

export function createRiderView(): RiderView {
  const root = new THREE.Group();
  const mine = getMyGnome();
  const model = createGnomeModel(mine?.look ?? DEFAULT_GSR_LOOK);
  root.add(model.object);

  // Attach inline rollerblade frames + glowing wheels under the gnome's boots
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x222633, roughness: 0.4, metalness: 0.6 });
  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: 0x00e5ff,
    emissiveIntensity: 0.9,
    roughness: 0.2,
  });

  const makeSkate = (xOff: number): THREE.Group => {
    const g = new THREE.Group();
    g.position.set(xOff, 0.04, 0);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.34), frameMat);
    rail.position.y = 0.04;
    g.add(rail);
    for (const wz of [-0.12, -0.04, 0.04, 0.12]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.035, 10), wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(0, 0.0, wz);
      g.add(w);
    }
    return g;
  };
  const leftSkate = makeSkate(-0.11);
  const rightSkate = makeSkate(0.11);
  root.add(leftSkate, rightSkate);

  // Spray burst particles
  const sparkGroup = new THREE.Group();
  root.add(sparkGroup);
  const sparks: { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number }[] = [];
  const sparkGeo = new THREE.SphereGeometry(0.08, 6, 6);

  function triggerSpray(colorHex = '#ff4ecd'): void {
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });
    for (let i = 0; i < 12; i++) {
      const m = new THREE.Mesh(sparkGeo, mat);
      m.position.set(0, 0.9, 0.35);
      sparkGroup.add(m);
      const a = Math.random() * Math.PI * 2;
      const spd = 2.5 + Math.random() * 4.5;
      sparks.push({
        mesh: m,
        vx: Math.cos(a) * spd,
        vy: 1.5 + Math.random() * 3.5,
        vz: Math.sin(a) * spd,
        life: 0.45 + Math.random() * 0.25,
      });
    }
  }

  function update(s: SkaterState, dt: number): void {
    root.position.set(s.x, s.y + 0.05, s.z);
    root.rotation.order = 'YXZ';
    root.rotation.y = s.yaw + s.trickSpin;
    root.rotation.z = -s.lean - s.roll * 0.6;
    root.rotation.x = s.grinding ? 0.08 : s.pitch * 0.7;

    // Stride animation on skates
    const stride = s.grounded && !s.grinding ? Math.sin(s.stridePhase) * 0.12 : 0;
    leftSkate.position.z = stride;
    rightSkate.position.z = -stride;
    leftSkate.position.y = 0.04 + Math.max(0, stride * 0.25);
    rightSkate.position.y = 0.04 + Math.max(0, -stride * 0.25);

    // Update spray particles
    for (let i = sparks.length - 1; i >= 0; i--) {
      const sp = sparks[i];
      sp.life -= dt;
      if (sp.life <= 0) {
        sparkGroup.remove(sp.mesh);
        sparks.splice(i, 1);
      } else {
        sp.vy -= 9 * dt;
        sp.mesh.position.x += sp.vx * dt;
        sp.mesh.position.y += sp.vy * dt;
        sp.mesh.position.z += sp.vz * dt;
        sp.mesh.scale.setScalar(Math.max(0.1, sp.life * 2));
      }
    }
  }

  return {
    root,
    model,
    update,
    triggerSpray,
    dispose() {
      frameMat.dispose();
      wheelMat.dispose();
      sparkGeo.dispose();
    },
  };
}
