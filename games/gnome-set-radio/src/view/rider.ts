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
  triggerAirJump(): void;
  dispose(): void;
}

const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;

export function createRiderView(): RiderView {
  const root = new THREE.Group();
  const mine = getMyGnome();
  const model = createGnomeModel(mine?.look ?? DEFAULT_GSR_LOOK);
  // Raise the gnome model slightly so the inline wheels kiss the ground
  model.object.position.y = 0.08;
  root.add(model.object);

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x222633, roughness: 0.4, metalness: 0.6 });
  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: 0x00e5ff,
    emissiveIntensity: 0.9,
    roughness: 0.2,
  });

  const wheels: THREE.Mesh[] = [];
  const makeSkate = (): THREE.Group => {
    const g = new THREE.Group();
    g.position.set(0, -0.30, 0.02);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.34), frameMat);
    rail.position.y = 0.03;
    g.add(rail);
    for (const wz of [-0.12, -0.04, 0.04, 0.12]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.035, 10), wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(0, -0.008, wz);
      g.add(w);
      wheels.push(w);
    }
    return g;
  };
  if (model.legs) {
    model.legs.left.add(makeSkate());
    model.legs.right.add(makeSkate());
  }

  // Spray burst particles
  const sparkGroup = new THREE.Group();
  root.add(sparkGroup);
  const sparks: { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number }[] = [];
  const sparkGeo = new THREE.SphereGeometry(0.08, 6, 6);

  let sprayAnimT = 0;
  let flipT = -1;
  let wasGrounded = true;
  let squashY = 1;
  let idleTime = 0;

  function triggerSpray(colorHex = '#ff4ecd'): void {
    sprayAnimT = 0.45;
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

  function triggerAirJump(): void {
    flipT = 0;
    squashY = 1.18;
  }

  function update(s: SkaterState, dt: number): void {
    idleTime += dt;
    const k = 1 - Math.exp(-14 * dt);
    const spd = Math.hypot(s.vx, s.vz);

    root.position.set(s.x, s.y + 0.05, s.z);
    root.rotation.order = 'YXZ';
    root.rotation.y = s.yaw + s.trickSpin;
    root.rotation.z = -s.lean - s.roll * 0.6;
    root.rotation.x = s.grinding ? 0.06 : s.pitch * 0.7;

    // Wheel spin & emissive intensity
    const wheelSpin = spd * dt * 12;
    for (const w of wheels) w.rotation.x += wheelSpin;
    wheelMat.emissiveIntensity = s.boosting || s.grinding ? 1.5 : 0.85;

    // Landing & jump squash-and-stretch
    if (!wasGrounded && s.grounded) squashY = 0.82;
    else if (wasGrounded && !s.grounded) squashY = 1.14;
    wasGrounded = s.grounded;
    squashY = lerp(squashY, 1.0, 1 - Math.exp(-10 * dt));
    const xzScale = 1 / Math.sqrt(squashY);
    model.rig.scale.set(xzScale, squashY, xzScale);

    // Double-jump front flip
    let flipX = 0;
    if (flipT >= 0) {
      flipT += dt;
      const u = Math.min(1, flipT / 0.44);
      const eased = u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u);
      flipX = eased * Math.PI * 2;
      if (u >= 1 || s.grounded) flipT = -1;
    }

    // Joint animation targets
    let legLx = 0;
    let legLz = 0;
    let legRx = 0;
    let legRz = 0;
    let armLx = 0;
    let armLz = 0.12;
    let armRx = 0;
    let armRz = -0.12;
    let rigRx = flipX;
    let rigRy = 0;
    let rigY = 0;

    if (s.grinding) {
      // Sideways Jet Set Radio grind stance with balancing arms
      const bal = Math.sin(idleTime * 9) * 0.16;
      rigRy = 0.62;
      rigRx += 0.14;
      rigY = -0.05;
      legLx = -0.45;
      legRx = 0.45;
      legLz = 0.12;
      legRz = -0.12;
      armLx = -0.35;
      armRx = -0.35;
      armLz = 1.15 + bal;
      armRz = -1.15 + bal;
    } else if (s.wallRiding) {
      rigRy = -0.4;
      rigRx += 0.18;
      legLx = 0.4;
      legRx = -0.4;
      armLx = -1.9;
      armRx = -0.6;
      armLz = 0.7;
      armRz = -0.5;
    } else if (!s.grounded) {
      // Mid-air tuck / trick grab
      if (s.trickSpin > 0.2) {
        rigRx += 0.35;
        legLx = -0.65;
        legRx = -0.45;
        armLx = -2.2;
        armRx = 0.55;
        armLz = 0.4;
      } else {
        legLx = 0.45;
        legRx = -0.35;
        armLx = -1.75;
        armRx = -1.75;
        armLz = 0.55;
        armRz = -0.55;
      }
    } else if (spd > 1.2) {
      // Athletic inline skating push-off & hard carve lean
      const stride = Math.sin(s.stridePhase);
      const speedNorm = Math.min(1, spd / 20);
      const carve = Math.max(-1, Math.min(1, s.carveSlip * 2.2 - s.lean * 1.8));
      rigRx += 0.14 + speedNorm * 0.24;
      rigRy = carve * 0.26;
      rigY = Math.abs(stride) * 0.045 * speedNorm - 0.03 * speedNorm;

      legLx = stride * 0.68 * speedNorm + carve * 0.22;
      legRx = -stride * 0.68 * speedNorm - carve * 0.22;
      legLz = Math.max(0, stride) * 0.26 * speedNorm + Math.abs(carve) * 0.15;
      legRz = -Math.max(0, -stride) * 0.26 * speedNorm - Math.abs(carve) * 0.15;

      armLx = -stride * 0.65 * speedNorm - 0.2;
      armRx = stride * 0.65 * speedNorm - 0.2;
      armLz = 0.28 + Math.abs(carve) * 0.45;
      armRz = -0.28 - Math.abs(carve) * 0.45;
    } else {
      // Idle skate stance
      const sway = Math.sin(idleTime * 2.6);
      rigY = Math.abs(sway) * 0.02;
      armLx = sway * 0.08;
      armRx = -sway * 0.08;
      legLz = 0.06;
      legRz = -0.06;
    }

    // Spray-paint arm gesture override
    if (sprayAnimT > 0) {
      sprayAnimT = Math.max(0, sprayAnimT - dt);
      armRx = -1.45 + Math.sin(sprayAnimT * 42) * 0.25;
      armRz = -0.22;
    }

    if (model.legs) {
      model.legs.left.rotation.x = lerp(model.legs.left.rotation.x, legLx, k);
      model.legs.left.rotation.z = lerp(model.legs.left.rotation.z, legLz, k);
      model.legs.right.rotation.x = lerp(model.legs.right.rotation.x, legRx, k);
      model.legs.right.rotation.z = lerp(model.legs.right.rotation.z, legRz, k);
    }
    model.arms.left.rotation.x = lerp(model.arms.left.rotation.x, armLx, k);
    model.arms.left.rotation.z = lerp(model.arms.left.rotation.z, armLz, k);
    model.arms.right.rotation.x = lerp(model.arms.right.rotation.x, armRx, k);
    model.arms.right.rotation.z = lerp(model.arms.right.rotation.z, armRz, k);
    model.rig.rotation.x = flipT >= 0 ? flipX : lerp(model.rig.rotation.x, rigRx, k);
    model.rig.rotation.y = lerp(model.rig.rotation.y, rigRy, k);
    model.rig.position.y = lerp(model.rig.position.y, rigY, k);

    // Update spray particles
    for (let i = sparks.length - 1; i >= 0; i--) {
      const sp = sparks[i]!;
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
    triggerAirJump,
    dispose() {
      frameMat.dispose();
      wheelMat.dispose();
      sparkGeo.dispose();
    },
  };
}
