import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { createGnomeModel, getMyGnome, GNORMAN_LOOK, type GnomeLook, type GnomeModel } from '@lawn/gnome';
import type { SkaterState, TrickAnimKind } from '../sim/skater';

const DEFAULT_GSR_LOOK: GnomeLook = {
  ...GNORMAN_LOOK,
  hat: 0xff4ecd,
  shirt: 0x00e5ff,
};

export interface RiderView {
  root: THREE.Group;
  model: GnomeModel;
  setCosmetics(opts: { trailId: string | null; rideId: string | null }): void;
  update(s: SkaterState, dt: number, beatPulse?: number, surfaceY?: number): void;
  triggerSpray(colorHex?: string): void;
  triggerAirJump(): void;
  triggerTrick(kind: TrickAnimKind): void;
  triggerCelebrate(): void;
  dispose(): void;
}

const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;

export function createRiderView(scene: THREE.Scene): RiderView {
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
  const skateGroups: THREE.Group[] = [];
  const makeSkate = (): THREE.Group => {
    const g = new THREE.Group();
    g.position.set(0, -0.3, 0.02);
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
    skateGroups.push(g);
    return g;
  };
  if (model.legs) {
    model.legs.left.add(makeSkate());
    model.legs.right.add(makeSkate());
  }

  // Hovering Aether Board (unlocked by beating Tier 9)
  const aetherBoard = new THREE.Group();
  const boardDeckMat = new THREE.MeshStandardMaterial({
    color: 0x160c2e,
    emissive: 0x00e5ff,
    emissiveIntensity: 0.45,
    roughness: 0.25,
    metalness: 0.55,
  });
  const boardTrimMat = new THREE.MeshStandardMaterial({
    color: 0xffd740,
    emissive: 0xff4ecd,
    emissiveIntensity: 1.0,
    roughness: 0.2,
  });
  const boardDeck = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.055, 1.32), boardDeckMat);
  const boardNose = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.28, 4), boardTrimMat);
  boardNose.rotation.x = Math.PI / 2;
  boardNose.rotation.y = Math.PI / 4;
  boardNose.position.set(0, 0.02, 0.78);
  const boardTrim = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.025, 1.24), boardTrimMat);
  boardTrim.position.y = -0.02;
  aetherBoard.add(boardDeck, boardNose, boardTrim);
  aetherBoard.position.set(0, -0.06, 0);
  aetherBoard.visible = false;
  model.rig.add(aetherBoard);

  let activeTrailId: string | null = null;
  let activeRideId: string | null = null;
  const TRAIL_COLOR_MAP: Record<string, number> = {
    'ivory-notes': 0xffd740,
    'molten-acid': 0x76ff03,
    'pixel-8bit': 0xff5252,
    'golden-bylaw': 0xffd740,
    'subsoil-dub': 0xb388ff,
  };
  const RIDE_COLOR_MAP: Record<string, number> = {
    'solar-flame': 0xff6d00,
    'prism-mist': 0xff66ff,
    'vapor-chrome': 0xff80ab,
    'aether-board': 0xffd740,
  };

  // Stylized spray-paint can attached to right arm
  const canGroup = new THREE.Group();
  const canBodyGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.19, 10);
  const canBodyMat = new THREE.MeshStandardMaterial({ color: 0xff4ecd, emissive: 0xff4ecd, emissiveIntensity: 0.45, roughness: 0.3 });
  const canBody = new THREE.Mesh(canBodyGeo, canBodyMat);
  const canCapGeo = new THREE.CylinderGeometry(0.025, 0.03, 0.04, 8);
  const canCapMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  const canCap = new THREE.Mesh(canCapGeo, canCapMat);
  canCap.position.y = 0.11;
  canGroup.add(canBody, canCap);
  canGroup.position.set(0, -0.26, 0.08);
  canGroup.rotation.x = Math.PI * 0.5;
  model.arms.right.add(canGroup);

  // World-space contact drop-shadow + neon landing ring
  const shadowGroup = new THREE.Group();
  const shadowGeo = new THREE.CircleGeometry(0.55, 20);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = flatLayer(
    new THREE.MeshBasicMaterial({ color: 0x090414, transparent: true, opacity: 0.48, depthWrite: false }),
    LAYER.marker,
  );
  const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
  const landRingGeo = new THREE.RingGeometry(0.58, 0.72, 24);
  landRingGeo.rotateX(-Math.PI / 2);
  const landRingMat = flatLayer(
    new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    LAYER.marker,
  );
  const landRing = new THREE.Mesh(landRingGeo, landRingMat);
  shadowGroup.add(shadowDisc, landRing);
  scene.add(shadowGroup);

  // Twin neon skate ribbon trails in world space
  const TRAIL_PTS = 18;
  const makeTrail = () => {
    const pos = new Float32Array(TRAIL_PTS * 3);
    const geo = new THREE.BufferGeometry();
    const attr = new THREE.BufferAttribute(pos, 3);
    geo.setAttribute('position', attr);
    const mat = new THREE.LineBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const line = new THREE.Line(geo, mat);
    line.frustumCulled = false;
    scene.add(line);
    return { pos, geo, attr, mat, line };
  };
  const trailL = makeTrail();
  const trailR = makeTrail();
  let trailPrimed = false;

  // Spray burst particles
  const sparkGroup = new THREE.Group();
  root.add(sparkGroup);
  const sparks: { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number }[] = [];
  const sparkGeo = new THREE.SphereGeometry(0.08, 6, 6);
  const sparkMats = new Map<string, THREE.MeshBasicMaterial>();

  let sprayAnimT = 0;
  let trickAnimKind: TrickAnimKind | null = null;
  let trickAnimT = -1;
  let celebrateT = 0;
  let wasGrounded = true;
  let squashY = 1;
  let idleTime = 0;
  let wallTilt = 0;

  function triggerSpray(colorHex = '#ff4ecd'): void {
    sprayAnimT = 0.45;
    canBodyMat.color.set(colorHex);
    canBodyMat.emissive.set(colorHex);
    let mat = sparkMats.get(colorHex);
    if (!mat) {
      mat = new THREE.MeshBasicMaterial({ color: colorHex });
      sparkMats.set(colorHex, mat);
    }
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

  function triggerTrick(kind: TrickAnimKind): void {
    trickAnimKind = kind;
    trickAnimT = 0;
    squashY = kind === 'groundSpin' ? 0.86 : 1.15;
  }

  function triggerAirJump(): void {
    triggerTrick('frontflip');
  }

  function triggerCelebrate(): void {
    celebrateT = 0.48;
    squashY = 1.16;
  }

  function update(s: SkaterState, dt: number, beatPulse = 0, surfaceY = s.y): void {
    idleTime += dt;
    const k = 1 - Math.exp(-14 * dt);
    const spd = Math.hypot(s.vx, s.vz);

    // Update contact drop-shadow & landing ring
    const heightAbove = Math.max(0, s.y - surfaceY);
    shadowGroup.position.set(s.x, surfaceY + 0.09, s.z);
    const shadowScale = Math.max(0.45, 1 - heightAbove * 0.055);
    shadowDisc.scale.setScalar(shadowScale);
    shadowMat.opacity = Math.max(0.14, 0.5 - heightAbove * 0.04);
    landRing.scale.setScalar(shadowScale * (1 + (s.grounded ? 0 : 0.25)));
    landRingMat.opacity = s.grounded ? 0.22 : Math.min(0.9, 0.45 + heightAbove * 0.05);
    landRingMat.color.setHex(s.grinding ? 0xffd740 : s.boosting ? 0xff4ecd : 0x00e5ff);

    // Update twin skate trails
    const rx = Math.cos(s.yaw) * 0.18;
    const rz = -Math.sin(s.yaw) * 0.18;
    const lx = s.x + rx;
    const lz = s.z + rz;
    const rrx = s.x - rx;
    const rrz = s.z - rz;
    const ty = s.y + 0.07;
    if (!trailPrimed || Math.hypot(s.x - trailL.pos[0]!, s.z - trailL.pos[2]!) > 6) {
      trailPrimed = true;
      for (let i = 0; i < TRAIL_PTS; i++) {
        const o = i * 3;
        trailL.pos[o] = lx; trailL.pos[o + 1] = ty; trailL.pos[o + 2] = lz;
        trailR.pos[o] = rrx; trailR.pos[o + 1] = ty; trailR.pos[o + 2] = rrz;
      }
    } else {
      for (let i = TRAIL_PTS - 1; i > 0; i--) {
        const dst = i * 3;
        const src = (i - 1) * 3;
        trailL.pos[dst] = trailL.pos[src]!; trailL.pos[dst + 1] = trailL.pos[src + 1]!; trailL.pos[dst + 2] = trailL.pos[src + 2]!;
        trailR.pos[dst] = trailR.pos[src]!; trailR.pos[dst + 1] = trailR.pos[src + 1]!; trailR.pos[dst + 2] = trailR.pos[src + 2]!;
      }
      trailL.pos[0] = lx; trailL.pos[1] = ty; trailL.pos[2] = lz;
      trailR.pos[0] = rrx; trailR.pos[1] = ty; trailR.pos[2] = rrz;
    }
    trailL.attr.needsUpdate = true;
    trailR.attr.needsUpdate = true;
    const customTrailCol = activeTrailId ? TRAIL_COLOR_MAP[activeTrailId] : undefined;
    const trailCol = s.grinding
      ? 0xffd740
      : s.boosting || s.speedMode
        ? customTrailCol ?? 0xff4ecd
        : Math.abs(s.carveSlip) > 0.2
          ? 0x69f0ae
          : customTrailCol ?? 0x00e5ff;
    const trailAlpha = spd > 3.5 ? Math.min(0.85, (spd - 3.5) / 14) : 0;
    trailL.mat.color.setHex(trailCol);
    trailR.mat.color.setHex(trailCol);
    trailL.mat.opacity = trailAlpha;
    trailR.mat.opacity = trailAlpha;

    const wallTarget = s.wallRiding ? -s.wallSide * (Math.PI * 0.42) : 0;
    wallTilt = lerp(wallTilt, wallTarget, 1 - Math.exp(-16 * dt));

    root.position.set(
      s.x - (s.wallRiding ? s.wallNormalX * 0.16 : 0),
      s.y + 0.05,
      s.z - (s.wallRiding ? s.wallNormalZ * 0.16 : 0),
    );
    root.rotation.order = 'YXZ';
    root.rotation.y = s.yaw + s.trickSpin;
    root.rotation.z = s.wallRiding ? wallTilt : -s.lean - s.roll * 0.6 + wallTilt;
    root.rotation.x = s.grinding ? 0.06 : s.pitch * 0.7;

    // Wheel spin & emissive intensity (prismatic shimmer for prism-mist skates)
    const wheelSpin = spd * dt * 12;
    for (const w of wheels) w.rotation.x += wheelSpin;
    wheelMat.emissiveIntensity = s.boosting || s.grinding ? 1.5 : 0.85;
    if (activeRideId === 'prism-mist') {
      const hue = (performance.now() * 0.00045) % 1;
      wheelMat.color.setHSL(hue, 0.95, 0.62);
      wheelMat.emissive.setHSL(hue, 0.95, 0.55);
    }

    // Landing & jump squash-and-stretch
    if (!wasGrounded && s.grounded) squashY = 0.82;
    else if (wasGrounded && !s.grounded) squashY = 1.14;
    wasGrounded = s.grounded;
    squashY = lerp(squashY, 1.0, 1 - Math.exp(-10 * dt));
    const xzScale = 1 / Math.sqrt(squashY);
    model.rig.scale.set(xzScale, squashY, xzScale);

    // Joint animation targets
    let legLx = 0;
    let legLz = 0;
    let legRx = 0;
    let legRz = 0;
    let armLx = 0;
    let armLz = 0.12;
    let armRx = 0;
    let armRz = -0.12;
    let rigRx = 0;
    let rigRy = 0;
    let rigRz = 0;
    let rigY = 0;

    if (s.danceMove === 'headspin') {
      // 1. Inverted Headspin balanced on hat tip!
      rigRx = Math.PI;
      rigRy = s.danceTimer * 13;
      rigY = 0.72 + beatPulse * 0.04;
      legLx = 0.35 + Math.sin(s.danceTimer * 12) * 0.25;
      legRx = -0.35 - Math.sin(s.danceTimer * 12) * 0.25;
      legLz = 0.55;
      legRz = -0.55;
      armLz = 1.1;
      armRz = -1.1;
    } else if (s.danceMove === 'windmill') {
      // 2. Windmill Flare on upper back/shoulders with sweeping scissoring legs!
      rigRx = Math.PI * 0.56;
      rigRy = s.danceTimer * 8.5;
      rigRz = Math.sin(s.danceTimer * 8.5) * 0.35;
      rigY = 0.26;
      legLx = Math.sin(s.danceTimer * 8.5) * 0.65;
      legRx = -Math.sin(s.danceTimer * 8.5) * 0.65;
      legLz = 0.68;
      legRz = -0.68;
      armLx = -0.9;
      armRx = 0.4;
      armLz = 0.85;
      armRz = -0.85;
    } else if (s.danceMove === 'airfreeze') {
      // 3. Levitating Hollowback Aether Halo Freeze!
      rigRx = Math.PI * 0.84;
      rigRy = s.danceTimer * 3.8;
      rigRz = 0.36;
      rigY = 0.96 + Math.sin(idleTime * 6) * 0.14 + beatPulse * 0.08;
      legLx = -0.95;
      legRx = 0.25;
      legLz = 0.32;
      legRz = -0.25;
      armLx = -2.6;
      armLz = 0.2;
      armRx = -0.7;
      armRz = -1.25;
    } else if (s.speedMode) {
      // Speed Mode (Tuck): gnome leans forward and balls up to preserve momentum
      rigRx = 0.86;
      rigY = -0.22 + beatPulse * 0.02;
      rigRy = activeRideId === 'aether-board' ? 0.72 : 0;
      legLx = -0.68;
      legRx = -0.58;
      legLz = 0.08;
      legRz = -0.08;
      armLx = 1.05;
      armRx = 1.05;
      armLz = 0.28;
      armRz = -0.28;
    } else if (activeRideId === 'aether-board' && !s.wallRiding && s.grounded) {
      // Hovering Aether Board stance
      const carve = Math.max(-1, Math.min(1, s.carveSlip * 2.2 - s.lean * 1.8));
      rigRy = 0.88 + carve * 0.22;
      rigRx = 0.1 + Math.min(0.22, spd / 80);
      rigY = 0.08 + Math.sin(idleTime * 5) * 0.04 + beatPulse * 0.03;
      legLx = -0.22;
      legRx = 0.22;
      armLx = -0.35;
      armRx = -0.35;
      armLz = 0.95 + carve * 0.25;
      armRz = -0.95 + carve * 0.25;
    } else if (s.grinding) {
      // Sideways Jet Set Radio grind stance with balancing arms
      const bal = Math.sin(idleTime * 9) * 0.16;
      rigRy = 0.62;
      rigRx = 0.14;
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
      rigRy = 0.32 * (s.wallSide || 1);
      rigRx = 0.14;
      rigY = Math.abs(wallTilt) * 0.28;
      legLx = 0.4;
      legRx = -0.4;
      armLx = -1.9;
      armRx = -0.6;
      armLz = 0.7;
      armRz = -0.5;
    } else if (!s.grounded) {
      legLx = 0.45;
      legRx = -0.35;
      armLx = -1.75;
      armRx = -1.75;
      armLz = 0.55;
      armRz = -0.55;
    } else if (s.braking && spd > 1.5) {
      // Hockey-stop / T-stop brake stance
      rigRx = -0.14;
      rigRy = 0.72;
      rigY = -0.06;
      legLx = 0.38;
      legRx = -0.45;
      legLz = 0.25;
      legRz = -0.35;
      armLx = -0.75;
      armRx = 0.45;
      armLz = 0.85;
      armRz = -0.65;
    } else if (spd > 1.2) {
      // Athletic inline skating push-off & hard carve lean
      const stride = Math.sin(s.stridePhase);
      const speedNorm = Math.min(1, spd / 20);
      const carve = Math.max(-1, Math.min(1, s.carveSlip * 2.2 - s.lean * 1.8));
      rigRx = 0.14 + speedNorm * 0.24;
      rigRy = carve * 0.26;
      rigY = Math.abs(stride) * 0.045 * speedNorm - 0.03 * speedNorm + beatPulse * 0.025;

      legLx = stride * 0.68 * speedNorm + carve * 0.22;
      legRx = -stride * 0.68 * speedNorm - carve * 0.22;
      legLz = Math.max(0, stride) * 0.26 * speedNorm + Math.abs(carve) * 0.15;
      legRz = -Math.max(0, -stride) * 0.26 * speedNorm - Math.abs(carve) * 0.15;

      armLx = -stride * 0.65 * speedNorm - 0.2;
      armRx = stride * 0.65 * speedNorm - 0.2;
      armLz = 0.28 + Math.abs(carve) * 0.45;
      armRz = -0.28 - Math.abs(carve) * 0.45;
    } else {
      // Idle skate stance with subtle music beat bob
      const sway = Math.sin(idleTime * 2.6);
      rigY = Math.abs(sway) * 0.02 + beatPulse * 0.035;
      rigRx = beatPulse * 0.06;
      armLx = sway * 0.08;
      armRx = -sway * 0.08;
      legLz = 0.06;
      legRz = -0.06;
    }

    // Active trick animation overrides
    let directRigRx = false;
    if (trickAnimT >= 0 && trickAnimKind) {
      trickAnimT += dt;
      const dur = trickAnimKind === 'grindHop' ? 0.36 : 0.44;
      const u = Math.min(1, trickAnimT / dur);
      const eased = u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u);

      if (trickAnimKind === 'frontflip') {
        rigRx = eased * Math.PI * 2;
        directRigRx = true;
        legLx = -0.75;
        legRx = -0.75;
        armLx = -2.2;
        armRx = -2.2;
      } else if (trickAnimKind === 'spin360') {
        armLz = 1.25;
        armRz = -1.25;
        legLx = -0.35;
        legRx = 0.35;
      } else if (trickAnimKind === 'grab') {
        rigRx = 0.48;
        rigRz = 0.28;
        legLx = -0.85;
        legRx = -0.85;
        armRx = 0.75;
        armRz = -0.3;
        armLx = -2.5;
        armLz = 0.45;
      } else if (trickAnimKind === 'cork') {
        rigRx = eased * Math.PI * 2;
        rigRz = Math.sin(u * Math.PI) * 0.95;
        directRigRx = true;
        armLz = 1.1;
        armRz = -1.1;
      } else if (trickAnimKind === 'grindHop') {
        rigY += Math.sin(u * Math.PI) * 0.42;
        rigRy += eased * Math.PI;
        legLx = -0.6;
        legRx = 0.2;
      } else if (trickAnimKind === 'groundSpin') {
        rigY -= 0.08;
        rigRx = 0.28;
        armLz = 1.05;
        armRz = -1.05;
      }

      if (u >= 1) {
        trickAnimT = -1;
        trickAnimKind = null;
      }
    }

    // Celebration fist-pump override
    if (celebrateT > 0) {
      celebrateT = Math.max(0, celebrateT - dt);
      const pump = Math.sin(celebrateT * 28) * 0.22;
      armLx = -2.5 + pump;
      armRx = -2.5 - pump;
      armLz = 0.35;
      armRz = -0.35;
      rigY += Math.abs(pump) * 0.14;
    }

    // Spray-paint arm gesture override
    if (sprayAnimT > 0) {
      sprayAnimT = Math.max(0, sprayAnimT - dt);
      armRx = -1.45 + Math.sin(sprayAnimT * 42) * 0.25;
      armRz = -0.22;
      canGroup.scale.setScalar(1.15);
    } else {
      canGroup.scale.setScalar(0.85);
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
    model.rig.rotation.x = directRigRx ? rigRx : lerp(model.rig.rotation.x, rigRx, k);
    const directRigRy = s.danceMove !== null;
    model.rig.rotation.y = directRigRy
      ? ((((rigRy + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI
      : lerp(model.rig.rotation.y, rigRy, k);
    model.rig.rotation.z = lerp(model.rig.rotation.z, rigRz, k);
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
    setCosmetics({ trailId, rideId }) {
      activeTrailId = trailId;
      activeRideId = rideId;
      const isBoard = rideId === 'aether-board';
      aetherBoard.visible = isBoard;
      for (const sg of skateGroups) sg.visible = !isBoard;
      const col = rideId && RIDE_COLOR_MAP[rideId] ? RIDE_COLOR_MAP[rideId]! : 0x00e5ff;
      wheelMat.color.setHex(col);
      wheelMat.emissive.setHex(col);
    },
    update,
    triggerSpray,
    triggerAirJump,
    triggerTrick,
    triggerCelebrate,
    dispose() {
      scene.remove(shadowGroup);
      scene.remove(trailL.line);
      scene.remove(trailR.line);
      frameMat.dispose();
      wheelMat.dispose();
      boardDeckMat.dispose();
      boardTrimMat.dispose();
      canBodyGeo.dispose();
      canBodyMat.dispose();
      canCapGeo.dispose();
      canCapMat.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      landRingGeo.dispose();
      landRingMat.dispose();
      trailL.geo.dispose();
      trailL.mat.dispose();
      trailR.geo.dispose();
      trailR.mat.dispose();
      sparkGeo.dispose();
      for (const m of sparkMats.values()) m.dispose();
      sparkMats.clear();
    },
  };
}
