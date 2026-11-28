import * as THREE from 'three';
import type { GsrLevelId } from '../levels/loader';

export interface BossAnimator {
  update(
    t: number,
    beatPulse: number,
    bossActive: boolean,
    bossWavePhase: number,
    hitRecoil: number,
    overridePos?: { x: number; y: number; z: number },
  ): void;
}

const HARMONIC_8_COLORS = [
  0xffd740,
  0xff9100,
  0xff5722,
  0x00e5ff,
  0x69f0ae,
  0xff4ecd,
  0xff1744,
  0xb388ff,
] as const;

export function createBossAnimator(
  areaId: GsrLevelId,
  bossRoot: THREE.Object3D,
  group: THREE.Group,
  baseX: number,
  baseY: number,
  baseZ: number,
  track: <T extends { dispose(): void }>(x: T) => T,
): BossAnimator {
  const baseScale = bossRoot.scale.clone();
  const baseRotY = bossRoot.rotation.y;

  const stageGroup = new THREE.Group();
  stageGroup.position.set(baseX, baseY, baseZ);
  stageGroup.scale.setScalar(1.55);
  group.add(stageGroup);

  const makeGlowMat = (color: number, opacity = 0.9, emissiveIntensity = 0.95): THREE.MeshStandardMaterial =>
    track(
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity,
        roughness: 0.25,
        metalness: 0.25,
        transparent: opacity < 1,
        opacity,
      }),
    );

  let pianoRingGroup: THREE.Group | null = null;
  const pianoKeys: THREE.Mesh[] = [];

  let drumRingLower: THREE.Mesh | null = null;
  let drumRingUpper: THREE.Mesh | null = null;

  const sparkPillars: { mesh: THREE.Mesh; phase: number; radius: number; angle: number }[] = [];
  let forgeRing: THREE.Mesh | null = null;

  const mistRings: { mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial; phase: number }[] = [];

  let pixelRingGroup: THREE.Group | null = null;
  const pixelCubes: THREE.Mesh[] = [];

  let laserBarGroup: THREE.Group | null = null;
  let laserBeamMat: THREE.MeshStandardMaterial | null = null;
  let discoFloorRing: THREE.Mesh | null = null;

  let citationRingA: THREE.Mesh | null = null;
  let citationRingB: THREE.Mesh | null = null;
  let megaphoneProp: THREE.Group | null = null;

  let sonarHaloA: THREE.Group | null = null;
  let sonarHaloB: THREE.Group | null = null;

  let tonearmPivot: THREE.Group | null = null;
  let harmonicHaloGroup: THREE.Group | null = null;
  const harmonicNodes: THREE.Mesh[] = [];

  switch (areaId) {
    case 'velvet-keys': {
      pianoRingGroup = new THREE.Group();
      pianoRingGroup.position.y = 1.35;
      stageGroup.add(pianoRingGroup);

      const ringGeo = track(new THREE.TorusGeometry(2.45, 0.06, 8, 36));
      const ringMat = makeGlowMat(0xffd740, 0.95, 0.9);
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      pianoRingGroup.add(ring);

      const keyGeo = track(new THREE.BoxGeometry(0.24, 0.1, 0.48));
      const ivoryMat = makeGlowMat(0xfff8e7, 1, 0.45);
      const ebonyMat = track(
        new THREE.MeshStandardMaterial({
          color: 0x160c24,
          emissive: 0xffd740,
          emissiveIntensity: 0.35,
          roughness: 0.3,
        }),
      );
      const keyCount = 12;
      for (let i = 0; i < keyCount; i++) {
        const a = (i / keyCount) * Math.PI * 2;
        const isBlack = i % 2 === 1;
        const key = new THREE.Mesh(keyGeo, isBlack ? ebonyMat : ivoryMat);
        key.position.set(Math.cos(a) * 2.45, isBlack ? 0.1 : 0, Math.sin(a) * 2.45);
        key.rotation.y = -a + Math.PI / 2;
        pianoRingGroup.add(key);
        pianoKeys.push(key);
      }
      break;
    }

    case 'bongo-basin': {
      const lowerGeo = track(new THREE.TorusGeometry(2.45, 0.085, 10, 36));
      const upperGeo = track(new THREE.TorusGeometry(1.85, 0.07, 10, 32));
      const amberMat = makeGlowMat(0xffa000, 0.92, 0.95);
      const coralMat = makeGlowMat(0xff6d00, 0.9, 1.0);

      drumRingLower = new THREE.Mesh(lowerGeo, amberMat);
      drumRingLower.rotation.x = Math.PI / 2;
      drumRingLower.position.y = 0.45;
      stageGroup.add(drumRingLower);

      drumRingUpper = new THREE.Mesh(upperGeo, coralMat);
      drumRingUpper.rotation.x = Math.PI * 0.38;
      drumRingUpper.position.y = 1.45;
      stageGroup.add(drumRingUpper);
      break;
    }

    case 'chrome-kiln': {
      const forgeGeo = track(new THREE.TorusGeometry(2.35, 0.1, 8, 32));
      const forgeMat = makeGlowMat(0xff5722, 0.95, 1.1);
      forgeRing = new THREE.Mesh(forgeGeo, forgeMat);
      forgeRing.rotation.x = Math.PI / 2;
      forgeRing.position.y = 0.18;
      stageGroup.add(forgeRing);

      const pillarGeo = track(new THREE.CylinderGeometry(0.11, 0.2, 1.4, 8));
      const pillarMat = makeGlowMat(0xff6d00, 0.85, 1.25);
      const count = 6;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const radius = 2.35;
        const mesh = new THREE.Mesh(pillarGeo, pillarMat);
        mesh.position.set(Math.cos(angle) * radius, 0.7, Math.sin(angle) * radius);
        stageGroup.add(mesh);
        sparkPillars.push({ mesh, phase: i / count, radius, angle });
      }
      break;
    }

    case 'neon-birdbath': {
      const ringGeo = track(new THREE.TorusGeometry(2.1, 0.055, 8, 36));
      for (let i = 0; i < 3; i++) {
        const mat = makeGlowMat(i % 2 === 0 ? 0x00e5ff : 0x80deea, 0.78, 0.95);
        const mesh = new THREE.Mesh(ringGeo, mat);
        mesh.rotation.x = Math.PI / 2;
        mesh.position.y = 0.5 + i * 0.9;
        stageGroup.add(mesh);
        mistRings.push({ mesh, mat, phase: i / 3 });
      }
      break;
    }

    case 'mulch-alley': {
      pixelRingGroup = new THREE.Group();
      pixelRingGroup.position.y = 1.5;
      stageGroup.add(pixelRingGroup);

      const baseGeo = track(new THREE.TorusGeometry(2.2, 0.05, 4, 16));
      const baseMat = makeGlowMat(0x69f0ae, 0.85, 0.9);
      const baseRing = new THREE.Mesh(baseGeo, baseMat);
      baseRing.rotation.x = Math.PI / 2;
      pixelRingGroup.add(baseRing);

      const cubeGeo = track(new THREE.BoxGeometry(0.32, 0.32, 0.32));
      const cubeColors = [0x69f0ae, 0xffd740, 0xff4ecd, 0x00e5ff];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const mat = makeGlowMat(cubeColors[i % cubeColors.length]!, 1, 0.95);
        const cube = new THREE.Mesh(cubeGeo, mat);
        cube.position.set(Math.cos(a) * 2.2, 0, Math.sin(a) * 2.2);
        pixelRingGroup.add(cube);
        pixelCubes.push(cube);
      }
      break;
    }

    case 'tupperware-mall': {
      const floorGeo = track(new THREE.TorusGeometry(2.5, 0.06, 8, 32));
      const floorMat = makeGlowMat(0xff4ecd, 0.85, 0.85);
      discoFloorRing = new THREE.Mesh(floorGeo, floorMat);
      discoFloorRing.rotation.x = Math.PI / 2;
      discoFloorRing.position.y = 0.16;
      stageGroup.add(discoFloorRing);

      laserBarGroup = new THREE.Group();
      laserBarGroup.position.y = 1.2;
      stageGroup.add(laserBarGroup);

      const beamGeo = track(new THREE.BoxGeometry(4.6, 0.09, 0.12));
      laserBeamMat = makeGlowMat(0xff1744, 0.92, 1.35);
      const beam = new THREE.Mesh(beamGeo, laserBeamMat);
      laserBarGroup.add(beam);

      const podGeo = track(new THREE.BoxGeometry(0.24, 0.24, 0.24));
      const podMat = makeGlowMat(0x00e5ff, 1, 0.9);
      for (const sx of [-2.3, 2.3]) {
        const pod = new THREE.Mesh(podGeo, podMat);
        pod.position.x = sx;
        laserBarGroup.add(pod);
      }
      break;
    }

    case 'hoa-citadel': {
      const citGeoA = track(new THREE.TorusGeometry(2.3, 0.065, 8, 32));
      const citGeoB = track(new THREE.TorusGeometry(1.75, 0.05, 8, 28));
      const goldMat = makeGlowMat(0xffd740, 0.95, 0.95);
      const brassMat = makeGlowMat(0xffab00, 0.85, 0.85);

      citationRingA = new THREE.Mesh(citGeoA, goldMat);
      citationRingA.rotation.x = Math.PI / 2;
      citationRingA.position.y = 0.4;
      stageGroup.add(citationRingA);

      citationRingB = new THREE.Mesh(citGeoB, brassMat);
      citationRingB.rotation.x = Math.PI / 2;
      citationRingB.position.y = 2.05;
      stageGroup.add(citationRingB);

      megaphoneProp = new THREE.Group();
      megaphoneProp.position.set(0, 1.65, 1.25);
      const hornGeo = track(new THREE.ConeGeometry(0.32, 0.65, 12, 1, true));
      const hornMat = makeGlowMat(0xffd740, 0.95, 0.8);
      const horn = new THREE.Mesh(hornGeo, hornMat);
      horn.rotation.x = -Math.PI / 2;
      megaphoneProp.add(horn);
      bossRoot.add(megaphoneProp);
      break;
    }

    case 'subsoil-relay': {
      const makeTuningHalo = (radius: number, color: number): THREE.Group => {
        const g = new THREE.Group();
        const haloGeo = track(new THREE.TorusGeometry(radius, 0.055, 8, 36));
        const prongGeo = track(new THREE.BoxGeometry(0.1, 0.65, 0.1));
        const mat = makeGlowMat(color, 0.9, 1.1);

        const ring = new THREE.Mesh(haloGeo, mat);
        ring.rotation.x = Math.PI / 2;
        g.add(ring);

        for (const side of [-1, 1]) {
          const prongA = new THREE.Mesh(prongGeo, mat);
          prongA.position.set(side * radius, 0.35, -0.14);
          const prongB = new THREE.Mesh(prongGeo, mat);
          prongB.position.set(side * radius, 0.35, 0.14);
          g.add(prongA, prongB);
        }
        return g;
      };

      sonarHaloA = makeTuningHalo(2.35, 0xb388ff);
      sonarHaloA.position.y = 1.65;
      stageGroup.add(sonarHaloA);

      sonarHaloB = makeTuningHalo(1.85, 0x00e5ff);
      sonarHaloB.position.y = 2.25;
      stageGroup.add(sonarHaloB);
      break;
    }

    case 'zero-hz-zenith': {
      const platterGeo = track(new THREE.TorusGeometry(2.6, 0.075, 8, 40));
      const platterMat = makeGlowMat(0xff4ecd, 0.88, 0.9);
      const platter = new THREE.Mesh(platterGeo, platterMat);
      platter.rotation.x = Math.PI / 2;
      platter.position.y = 0.18;
      stageGroup.add(platter);

      tonearmPivot = new THREE.Group();
      tonearmPivot.position.set(2.3, 1.35, -1.6);
      stageGroup.add(tonearmPivot);

      const postGeo = track(new THREE.CylinderGeometry(0.16, 0.22, 1.35, 12));
      const armGeo = track(new THREE.BoxGeometry(0.12, 0.1, 2.65));
      const stylusGeo = track(new THREE.ConeGeometry(0.16, 0.42, 8));
      const armMat = makeGlowMat(0xffd740, 1, 0.85);
      const stylusMat = makeGlowMat(0x00e5ff, 1, 1.3);

      const post = new THREE.Mesh(postGeo, armMat);
      post.position.y = -0.6;
      const arm = new THREE.Mesh(armGeo, armMat);
      arm.position.set(0, 0.05, 1.25);
      const stylus = new THREE.Mesh(stylusGeo, stylusMat);
      stylus.rotation.x = Math.PI;
      stylus.position.set(0, -0.18, 2.5);
      tonearmPivot.add(post, arm, stylus);

      harmonicHaloGroup = new THREE.Group();
      harmonicHaloGroup.position.y = 2.15;
      stageGroup.add(harmonicHaloGroup);

      const nodeGeo = track(new THREE.OctahedronGeometry(0.24));
      for (let i = 0; i < HARMONIC_8_COLORS.length; i++) {
        const a = (i / HARMONIC_8_COLORS.length) * Math.PI * 2;
        const mat = makeGlowMat(HARMONIC_8_COLORS[i]!, 0.98, 1.1);
        const node = new THREE.Mesh(nodeGeo, mat);
        node.position.set(Math.cos(a) * 2.55, 0, Math.sin(a) * 2.55);
        harmonicHaloGroup.add(node);
        harmonicNodes.push(node);
      }
      break;
    }
  }

  return {
    update(t, beatPulse, bossActive, bossWavePhase, hitRecoil, overridePos) {
      const cx = overridePos ? overridePos.x : baseX;
      const cy = overridePos ? overridePos.y : baseY;
      const cz = overridePos ? overridePos.z : baseZ;
      stageGroup.position.set(cx, cy, cz);
      const activity = bossActive ? 1.0 : 0.45;
      const waveBoost = bossWavePhase * 0.25;

      let dx = 0;
      let dy = 0;
      let dz = 0;
      let rx = 0;
      let ry = 0;
      let rz = 0;
      let sx = 1;
      let sy = 1;
      let sz = 1;

      switch (areaId) {
        case 'velvet-keys': {
          const bow = Math.sin(t * 2.6);
          dy = Math.abs(bow) * (0.24 * activity) + beatPulse * 0.14;
          rx = bow * 0.22 + beatPulse * 0.14;
          rz = Math.sin(t * 1.3) * 0.1;
          ry = Math.sin(t * 0.9) * 0.35;

          if (pianoRingGroup) {
            pianoRingGroup.rotation.y = t * (0.55 + activity * 0.7) + bossWavePhase * 0.6;
            pianoRingGroup.position.y = 1.35 + Math.sin(t * 2.2) * 0.14 + beatPulse * 0.12;
            pianoKeys.forEach((key, idx) => {
              const baseKeyY = idx % 2 === 1 ? 0.1 : 0;
              key.position.y = baseKeyY + Math.sin(t * 5.2 + idx * 0.52) * (0.14 + beatPulse * 0.16);
            });
          }
          break;
        }

        case 'bongo-basin': {
          const hop = Math.abs(Math.sin(t * 5.2));
          const poly = Math.abs(Math.sin(t * 7.8));
          dy = hop * (0.45 + 0.5 * activity) + beatPulse * 0.2;
          ry = Math.sin(t * 2.6) * 0.4;
          if (hop < 0.16) {
            const slam = 1 - hop / 0.16;
            sy = 1 - slam * 0.18;
            sx = 1 + slam * 0.12;
            sz = 1 + slam * 0.12;
          }

          if (drumRingLower) {
            drumRingLower.rotation.z = t * 1.2;
            const s = 1 + poly * 0.14 + beatPulse * 0.18 + waveBoost;
            drumRingLower.scale.set(s, s, 1);
          }
          if (drumRingUpper) {
            drumRingUpper.rotation.z = -t * 1.85;
            drumRingUpper.rotation.y = t * 0.9;
            drumRingUpper.position.y = 1.45 + poly * 0.25;
            const s = 1 + hop * 0.12 + beatPulse * 0.16;
            drumRingUpper.scale.set(s, s, 1);
          }
          break;
        }

        case 'chrome-kiln': {
          const rpm = bossActive ? 5.0 : 1.8;
          ry = t * rpm + bossWavePhase * 0.9;
          dy = Math.abs(Math.sin(t * 6.4)) * 0.18 + beatPulse * 0.18;
          rx = Math.sin(t * 8.0) * 0.06 * activity;

          if (forgeRing) {
            const s = 1 + beatPulse * 0.14 + waveBoost;
            forgeRing.scale.set(s, s, 1);
          }
          for (const p of sparkPillars) {
            const cycle = (t * (0.9 + 0.55 * activity) + p.phase) % 1;
            const rise = cycle * 3.4;
            const pulse = Math.sin(cycle * Math.PI);
            p.mesh.position.set(
              Math.cos(p.angle + t * 0.4) * p.radius,
              0.4 + rise,
              Math.sin(p.angle + t * 0.4) * p.radius,
            );
            p.mesh.scale.set(0.75 + beatPulse * 0.35, 0.5 + pulse * 1.15, 0.75 + beatPulse * 0.35);
          }
          break;
        }

        case 'neon-birdbath': {
          const orbitAngle = t * (0.85 + 0.45 * activity);
          const orbitRad = bossActive ? 0.95 : 0.35;
          dx = Math.cos(orbitAngle) * orbitRad;
          dz = Math.sin(orbitAngle) * orbitRad;
          dy = 0.68 + Math.sin(t * 1.9) * 0.3 + beatPulse * 0.14;
          ry = -orbitAngle + Math.sin(t * 1.2) * 0.25;
          rz = Math.sin(orbitAngle) * 0.12;

          for (const mr of mistRings) {
            const c = (t * 0.55 + mr.phase) % 1;
            mr.mesh.position.y = 0.35 + c * 2.85;
            const s = 0.72 + c * 0.58 + beatPulse * 0.14;
            mr.mesh.scale.set(s, s, 1);
            mr.mat.opacity = 0.85 * Math.sin(c * Math.PI);
          }
          break;
        }

        case 'mulch-alley': {
          const st = Math.floor(t * 8) / 8;
          dy = Math.abs(Math.sin(st * 6.0)) * (0.38 + 0.38 * activity) + beatPulse * 0.14;
          ry = Math.sin(st * 3.2) * 0.55;
          rz = ((Math.floor(t * 8) % 2) * 2 - 1) * 0.08 * activity;

          if (pixelRingGroup) {
            pixelRingGroup.rotation.y = st * (1.1 + 0.8 * activity);
            pixelCubes.forEach((cube, idx) => {
              cube.position.y = Math.sin(st * 6.4 + idx * 0.8) * 0.45;
              cube.rotation.x = st * 2.5 + idx;
              cube.rotation.y = st * 2.5;
              const cs = 1 + beatPulse * 0.28;
              cube.scale.setScalar(cs);
            });
          }
          break;
        }

        case 'tupperware-mall': {
          dy = Math.abs(Math.sin(t * 4.4)) * (0.28 + 0.22 * activity) + beatPulse * 0.22;
          rz = Math.sin(t * 2.2) * 0.16;
          ry = Math.sin(t * 1.3) * 0.55;

          if (discoFloorRing) {
            const s = 1 + beatPulse * 0.16 + waveBoost;
            discoFloorRing.scale.set(s, s, 1);
          }
          if (laserBarGroup && laserBeamMat) {
            const sweep = Math.sin(t * (2.6 + activity));
            laserBarGroup.position.y = 1.6 + sweep * 1.15;
            laserBarGroup.rotation.y = t * (0.9 + 0.7 * activity);
            const useCyan = Math.sin(t * 4.4) > 0;
            laserBeamMat.color.setHex(useCyan ? 0x00e5ff : 0xff1744);
            laserBeamMat.emissive.setHex(useCyan ? 0x00e5ff : 0xff1744);
            laserBeamMat.emissiveIntensity = 1.15 + beatPulse * 0.65;
          }
          break;
        }

        case 'hoa-citadel': {
          const marchRate = bossActive ? 1.2 : 0.7;
          const phase = t * marchRate;
          const step = Math.floor(phase);
          const frac = phase - step;
          const snap = Math.min(1, frac * 4.5);
          ry = (step + snap) * (Math.PI / 2);
          dy = Math.abs(Math.sin(t * 4.8)) * 0.2 + beatPulse * 0.1;
          rx = -0.14 + Math.sin(t * 2.4) * 0.12;

          if (megaphoneProp) {
            megaphoneProp.rotation.x = -0.22 + Math.sin(t * 4.8) * 0.18 + beatPulse * 0.12;
            const ms = 1 + beatPulse * 0.16;
            megaphoneProp.scale.setScalar(ms);
          }
          if (citationRingA) {
            citationRingA.rotation.z = t * 0.9;
            const sa = 1 + beatPulse * 0.12 + waveBoost;
            citationRingA.scale.set(sa, sa, 1);
          }
          if (citationRingB) {
            citationRingB.rotation.z = -t * 1.1;
            citationRingB.rotation.x = Math.PI / 2 + Math.sin(t * 1.6) * 0.18;
          }
          break;
        }

        case 'subsoil-relay': {
          dy = 1.05 + Math.sin(t * 1.25) * 0.36 + beatPulse * 0.14;
          rz = Math.sin(t * 0.9) * 0.09;
          ry = Math.sin(t * 0.65) * 0.4;

          if (sonarHaloA) {
            sonarHaloA.rotation.y = t * (0.75 + 0.45 * activity);
            sonarHaloA.rotation.x = Math.sin(t * 0.7) * 0.28;
            const sa = 1 + beatPulse * 0.15 + waveBoost;
            sonarHaloA.scale.setScalar(sa);
          }
          if (sonarHaloB) {
            sonarHaloB.rotation.y = -t * (0.95 + 0.55 * activity);
            sonarHaloB.rotation.z = Math.cos(t * 0.8) * 0.28;
            const sb = 1 + beatPulse * 0.18 + waveBoost;
            sonarHaloB.scale.setScalar(sb);
          }
          break;
        }

        case 'zero-hz-zenith': {
          ry = t * (0.8 + 1.1 * activity) + bossWavePhase * 0.5;
          dy = 0.45 + Math.sin(t * 2.1) * 0.25 + beatPulse * 0.2;
          rx = Math.sin(t * 1.4) * 0.08;

          if (tonearmPivot) {
            tonearmPivot.rotation.y = -0.35 + Math.sin(t * 1.35) * 0.55;
            tonearmPivot.rotation.x = -0.06 + beatPulse * 0.14;
          }
          if (harmonicHaloGroup) {
            harmonicHaloGroup.rotation.y = -t * (0.7 + 0.6 * activity);
            harmonicHaloGroup.rotation.z = Math.sin(t * 0.9) * 0.16;
            const hs = 1 + beatPulse * 0.15 + waveBoost;
            harmonicHaloGroup.scale.setScalar(hs);
            harmonicNodes.forEach((node, idx) => {
              node.position.y = Math.sin(t * 3.4 + idx * (Math.PI / 4)) * 0.35;
              node.rotation.y = t * 2.2 + idx;
            });
          }
          break;
        }
      }

      const recoil = Math.max(0, Math.min(1, hitRecoil));
      if (recoil > 0) {
        ry += recoil * Math.PI * 2.2;
        rx += Math.sin(recoil * Math.PI) * 0.45;
        rz += Math.cos(recoil * Math.PI * 2) * 0.34 * recoil;
        sy *= 1 - recoil * 0.34;
        sx *= 1 + recoil * 0.24;
        sz *= 1 + recoil * 0.24;
        dy += Math.sin(recoil * Math.PI) * 0.4;
      }

      bossRoot.position.set(cx + dx, cy + dy, cz + dz);
      bossRoot.rotation.set(rx, baseRotY + ry, rz);
      bossRoot.scale.set(baseScale.x * sx, baseScale.y * sy, baseScale.z * sz);
    },
  };
}
