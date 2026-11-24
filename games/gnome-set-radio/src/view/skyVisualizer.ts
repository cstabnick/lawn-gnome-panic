import * as THREE from 'three';
import type { GsrLevelDoc } from '../levels/schema';
import { getToonGradientMap } from './toon';

export interface SkyVisualizer {
  group: THREE.Group;
  update(t: number, beatPulse: number, hype: number, comboMult: number): void;
  dispose(): void;
}

interface SpeakerStackEntry {
  holder: THREE.Group;
  baseY: number;
  phase: number;
  topWoofer: THREE.Mesh;
  bottomWoofer: THREE.Mesh;
  wooferBaseZ: number;
  shockwaves: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; offset: number }[];
  trimMat: THREE.MeshStandardMaterial;
}

interface EqBarEntry {
  mesh: THREE.Mesh;
  mat: THREE.MeshStandardMaterial;
  phase: number;
  freqBand: number;
  baseColor: THREE.Color;
}

interface SpotlightEntry {
  pivot: THREE.Group;
  mat: THREE.MeshBasicMaterial;
  baseAzimuth: number;
  sweepSpeed: number;
  phase: number;
}

interface VibeMotifEntry {
  obj: THREE.Object3D;
  radius: number;
  baseY: number;
  speed: number;
  phase: number;
  spinAxis: THREE.Vector3;
  mat: THREE.MeshStandardMaterial;
  baseColor: THREE.Color;
}

const OVERDRIVE_GOLD = new THREE.Color('#ffd740');

export function createSkyVisualizer(doc: GsrLevelDoc): SkyVisualizer {
  const group = new THREE.Group();
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(x: T): T => {
    disposables.push(x);
    return x;
  };

  const accentHex = doc.data.accentColor || '#00e5ff';
  const skyBotHex = doc.data.skyBottom || '#ff4ecd';
  const accentColor = new THREE.Color(accentHex);
  const skyBotColor = new THREE.Color(skyBotHex);
  const toonMap = getToonGradientMap();

  // =========================================================================
  // 1. 6 Monumental Floating Skybox Speaker Stacks (r = 95..112m, y = 16..34m)
  // =========================================================================
  const speakerStacks: SpeakerStackEntry[] = [];
  const cabinetGeo = track(new THREE.BoxGeometry(9.6, 15.6, 6.4));
  const cabinetMat = track(
    new THREE.MeshToonMaterial({
      color: '#191428',
      gradientMap: toonMap,
    }),
  );

  // Outer glowing trim bars (avoid coplanar faces by standing proud around perimeter)
  const trimVertGeo = track(new THREE.BoxGeometry(0.55, 16.2, 0.7));
  const trimHorizGeo = track(new THREE.BoxGeometry(10.2, 0.55, 0.7));
  const baffleRingGeo = track(new THREE.TorusGeometry(2.8, 0.28, 8, 24));
  const wooferConeGeo = track(new THREE.ConeGeometry(2.45, 1.35, 18));
  wooferConeGeo.rotateX(Math.PI / 2); // cone tip points toward +Z (inward to arena)
  const dustCapGeo = track(new THREE.SphereGeometry(0.75, 12, 10));
  const wooferMat = track(
    new THREE.MeshToonMaterial({
      color: '#2a223d',
      gradientMap: toonMap,
    }),
  );
  const shockwaveGeo = track(new THREE.TorusGeometry(3.2, 0.22, 8, 28));

  const stackCount = 6;
  const lookTarget = new THREE.Vector3(0, 8, 0);
  for (let i = 0; i < stackCount; i++) {
    const angle = (i / stackCount) * Math.PI * 2 + 0.24;
    const radius = 95 + (i % 3) * 8.5; // 95, 103.5, 112m
    const baseY = 16 + (i % 3) * 8.5; // 16, 24.5, 33m (inside 16..34m)

    const holder = new THREE.Group();
    holder.position.set(Math.cos(angle) * radius, baseY, Math.sin(angle) * radius);
    holder.lookAt(lookTarget);

    const cabinet = new THREE.Mesh(cabinetGeo, cabinetMat);
    holder.add(cabinet);

    const trimMat = track(
      new THREE.MeshStandardMaterial({
        color: accentHex,
        emissive: accentHex,
        emissiveIntensity: 0.9,
        roughness: 0.25,
      }),
    );

    // Glowing front perimeter frame offset cleanly in front of cabinet z=+3.2
    const trimZ = 3.32;
    for (const sx of [-4.85, 4.85]) {
      const vBar = new THREE.Mesh(trimVertGeo, trimMat);
      vBar.position.set(sx, 0, trimZ);
      holder.add(vBar);
    }
    for (const sy of [-7.85, 7.85]) {
      const hBar = new THREE.Mesh(trimHorizGeo, trimMat);
      hBar.position.set(0, sy, trimZ);
      holder.add(hBar);
    }

    // Twin woofer assemblies (upper & lower)
    const baffleZ = 3.36;
    const wooferBaseZ = 3.65;

    const topBaffle = new THREE.Mesh(baffleRingGeo, trimMat);
    topBaffle.position.set(0, 3.6, baffleZ);
    holder.add(topBaffle);

    const bottomBaffle = new THREE.Mesh(baffleRingGeo, trimMat);
    bottomBaffle.position.set(0, -3.6, baffleZ);
    holder.add(bottomBaffle);

    const topWoofer = new THREE.Mesh(wooferConeGeo, wooferMat);
    topWoofer.position.set(0, 3.6, wooferBaseZ);
    const topCap = new THREE.Mesh(dustCapGeo, trimMat);
    topCap.position.set(0, 0, 0.55);
    topWoofer.add(topCap);
    holder.add(topWoofer);

    const bottomWoofer = new THREE.Mesh(wooferConeGeo, wooferMat);
    bottomWoofer.position.set(0, -3.6, wooferBaseZ);
    const bottomCap = new THREE.Mesh(dustCapGeo, trimMat);
    bottomCap.position.set(0, 0, 0.55);
    bottomWoofer.add(bottomCap);
    holder.add(bottomWoofer);

    // Expanding acoustic shockwave rings (visible at comboMult >= 3)
    const shockwaves: SpeakerStackEntry['shockwaves'] = [];
    for (let s = 0; s < 2; s++) {
      const swMat = track(
        new THREE.MeshBasicMaterial({
          color: accentHex,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        }),
      );
      const swMesh = new THREE.Mesh(shockwaveGeo, swMat);
      swMesh.position.set(0, 0, 4.5);
      swMesh.visible = false;
      holder.add(swMesh);
      shockwaves.push({ mesh: swMesh, mat: swMat, offset: s * 0.5 });
    }

    group.add(holder);
    speakerStacks.push({
      holder,
      baseY,
      phase: i * 1.1,
      topWoofer,
      bottomWoofer,
      wooferBaseZ,
      shockwaves,
      trimMat,
    });
  }

  // =========================================================================
  // 2. 20-Bar Horizon 3D Equalizer Spectrum Ring (r = 118m)
  // =========================================================================
  const eqBars: EqBarEntry[] = [];
  const eqCount = 20;
  const eqRadius = 118;
  const eqBarGeo = track(new THREE.BoxGeometry(6.8, 1, 2.4));
  eqBarGeo.translate(0, 0.5, 0); // anchor bottom at y = 0 for upward scaling

  for (let i = 0; i < eqCount; i++) {
    const angle = (i / eqCount) * Math.PI * 2;
    const blend = 0.5 + 0.5 * Math.sin((i / eqCount) * Math.PI * 2);
    const barColor = accentColor.clone().lerp(skyBotColor, blend);
    const mat = track(
      new THREE.MeshStandardMaterial({
        color: barColor,
        emissive: barColor,
        emissiveIntensity: 0.75,
        transparent: true,
        opacity: 0.72,
        roughness: 0.25,
        depthWrite: false,
      }),
    );

    const mesh = new THREE.Mesh(eqBarGeo, mat);
    mesh.position.set(Math.cos(angle) * eqRadius, 2, Math.sin(angle) * eqRadius);
    mesh.lookAt(0, 2, 0);
    mesh.scale.y = 8;
    group.add(mesh);

    eqBars.push({
      mesh,
      mat,
      phase: (i / eqCount) * Math.PI * 4,
      freqBand: 1 + (i % 5) * 0.7,
      baseColor: barColor,
    });
  }

  // =========================================================================
  // 3. Combo-Reactive Sky Vibe Motifs
  //    (a) Overhead rotating neon soundwave rings + sweeping concert spotlight cones
  // =========================================================================
  const overheadGroup = new THREE.Group();
  overheadGroup.position.set(0, 56, 0);
  group.add(overheadGroup);

  const overheadRings: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; baseColor: THREE.Color; speedX: number; speedY: number }[] = [];
  const ringRadii = [28, 39, 50];
  for (let i = 0; i < ringRadii.length; i++) {
    const baseCol = i % 2 === 0 ? accentColor.clone() : skyBotColor.clone();
    const rGeo = track(new THREE.TorusGeometry(ringRadii[i]!, 0.36 + i * 0.08, 8, 48));
    const rMat = track(
      new THREE.MeshBasicMaterial({
        color: baseCol,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    const rMesh = new THREE.Mesh(rGeo, rMat);
    rMesh.rotation.x = Math.PI / 2 + (i - 1) * 0.24;
    rMesh.rotation.z = i * 0.32;
    rMesh.visible = false;
    overheadGroup.add(rMesh);
    overheadRings.push({
      mesh: rMesh,
      mat: rMat,
      baseColor: baseCol,
      speedX: (i % 2 === 0 ? 1 : -1) * 0.22,
      speedY: (i % 2 === 0 ? 1 : -1) * (0.35 + i * 0.14),
    });
  }

  // Sweeping concert spotlight cones anchored around high perimeter & aimed downward/across sky
  const spotlights: SpotlightEntry[] = [];
  const coneLen = 84;
  const coneGeo = track(new THREE.ConeGeometry(9.5, coneLen, 16, 1, true));
  coneGeo.translate(0, -coneLen * 0.5, 0); // apex at local origin

  const spotCount = 6;
  for (let i = 0; i < spotCount; i++) {
    const az = (i / spotCount) * Math.PI * 2;
    const pivot = new THREE.Group();
    pivot.position.set(Math.cos(az) * 78, 54, Math.sin(az) * 78);

    const sMat = track(
      new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? accentHex : skyBotHex,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    const cone = new THREE.Mesh(coneGeo, sMat);
    pivot.add(cone);
    pivot.visible = false;
    group.add(pivot);

    spotlights.push({
      pivot,
      mat: sMat,
      baseAzimuth: az,
      sweepSpeed: 0.7 + (i % 3) * 0.28,
      phase: i * 1.05,
    });
  }

  //    (b) Regional floating beat-synced vibe shapes orbiting the upper sky
  const vibeMotifs: VibeMotifEntry[] = [];
  const area = doc.data.areaNumber;
  const motifCount = 12;

  for (let i = 0; i < motifCount; i++) {
    const holder = new THREE.Group();
    const isAlt = i % 2 === 1;
    const baseCol = isAlt ? skyBotColor.clone() : accentColor.clone();
    const mat = track(
      new THREE.MeshStandardMaterial({
        color: baseCol,
        emissive: baseCol,
        emissiveIntensity: 0.7,
        roughness: 0.25,
        transparent: area === 4,
        opacity: area === 4 ? 0.72 : 1,
      }),
    );

    buildRegionalVibeShape(area, holder, mat, track);

    const radius = 48 + (i % 4) * 11;
    const baseY = 34 + (i % 3) * 8.5;
    const speed = (i % 2 === 0 ? 1 : -1) * (0.14 + (i % 3) * 0.04);
    const phase = (i / motifCount) * Math.PI * 2;

    group.add(holder);
    vibeMotifs.push({
      obj: holder,
      radius,
      baseY,
      speed,
      phase,
      spinAxis: new THREE.Vector3(0.4 + (i % 3) * 0.2, 1, 0.25).normalize(),
      mat,
      baseColor: baseCol,
    });
  }

  const tmpColor = new THREE.Color();

  return {
    group,
    update(t, beatPulse, hype, comboMult) {
      const clampedCombo = Math.max(1, comboMult);
      const comboNorm = Math.min(1, (clampedCombo - 1) / 6); // 0 at 1x, 1 at 7x+
      const overdrive = clampedCombo >= 7 ? Math.min(1, (clampedCombo - 6) / 2) : 0;
      const hypeBoost = Math.max(0, Math.min(1, hype));

      // 1. Floating Skybox Speaker Stacks
      const wooferStroke = beatPulse * (0.85 + comboNorm * 0.9 + hypeBoost * 0.4);
      const showShockwaves = clampedCombo >= 3;
      for (let i = 0; i < speakerStacks.length; i++) {
        const st = speakerStacks[i]!;
        st.holder.position.y = st.baseY + Math.sin(t * 1.15 + st.phase) * 1.35 + beatPulse * 0.45;
        st.topWoofer.position.z = st.wooferBaseZ + wooferStroke;
        st.bottomWoofer.position.z = st.wooferBaseZ + wooferStroke;

        const wooferSquash = 1 + beatPulse * 0.12;
        st.topWoofer.scale.set(wooferSquash, wooferSquash, 1 + beatPulse * 0.25);
        st.bottomWoofer.scale.set(wooferSquash, wooferSquash, 1 + beatPulse * 0.25);

        tmpColor.copy(accentColor).lerp(OVERDRIVE_GOLD, overdrive * 0.85);
        st.trimMat.color.copy(tmpColor);
        st.trimMat.emissive.copy(tmpColor);
        st.trimMat.emissiveIntensity = 0.85 + beatPulse * 0.65 + comboNorm * 0.7;

        for (const sw of st.shockwaves) {
          sw.mesh.visible = showShockwaves;
          if (!showShockwaves) continue;
          const cycle = (t * (0.9 + comboNorm * 0.5) + sw.offset + st.phase * 0.15) % 1;
          sw.mesh.position.z = 4.2 + cycle * 22;
          sw.mesh.scale.setScalar(1 + cycle * (2.6 + comboNorm * 1.6));
          sw.mat.color.copy(tmpColor);
          sw.mat.opacity = Math.max(0, (1 - cycle) * (0.45 + comboNorm * 0.35));
        }
      }

      // 2. 20-Bar Horizon 3D Equalizer Spectrum Ring
      // Ambient low bounce at 1x -> towering full-sky equalizer at 5x+
      const eqScaleBase = 4 + Math.min(1, (clampedCombo - 1) / 4) * 34; // ~4m at 1x, ~38m+ at 5x
      const eqAmplitude = 5 + Math.min(1, (clampedCombo - 1) / 4) * 26;
      for (let i = 0; i < eqBars.length; i++) {
        const bar = eqBars[i]!;
        const wave =
          0.5 +
          0.5 * Math.sin(t * (2.8 + bar.freqBand * 0.8) + bar.phase) *
            Math.cos(t * 1.4 - bar.phase * 0.5);
        const h = Math.max(2.5, eqScaleBase + wave * eqAmplitude + beatPulse * (6 + comboNorm * 16));
        bar.mesh.scale.y = h;

        tmpColor.copy(bar.baseColor).lerp(OVERDRIVE_GOLD, overdrive * 0.75);
        bar.mat.color.copy(tmpColor);
        bar.mat.emissive.copy(tmpColor);
        bar.mat.emissiveIntensity = 0.55 + beatPulse * 0.55 + comboNorm * 1.15;
        bar.mat.opacity = 0.45 + comboNorm * 0.38 + beatPulse * 0.12;
      }

      // 3a. Overhead rotating neon soundwave rings + sweeping concert spotlight cones
      const motifVis = clampedCombo >= 2 ? Math.min(1, (clampedCombo - 1.5) / 1.5) : 0;
      const tier4Boost = clampedCombo >= 4 ? Math.min(1, (clampedCombo - 3) / 3) : 0;
      const spinMul = 1 + tier4Boost * 1.6 + overdrive * 0.8;

      for (let i = 0; i < overheadRings.length; i++) {
        const ring = overheadRings[i]!;
        ring.mesh.visible = motifVis > 0.01;
        if (!ring.mesh.visible) continue;
        ring.mesh.rotation.z += 0.008 * ring.speedY * spinMul;
        ring.mesh.rotation.y = t * ring.speedY * spinMul;
        ring.mesh.rotation.x = Math.PI / 2 + Math.sin(t * 0.6 + i) * 0.25 * (1 + tier4Boost);
        const pulseScale = 1 + beatPulse * (0.05 + tier4Boost * 0.08);
        ring.mesh.scale.setScalar(pulseScale);

        tmpColor.copy(ring.baseColor).lerp(OVERDRIVE_GOLD, overdrive * 0.9);
        ring.mat.color.copy(tmpColor);
        ring.mat.opacity = motifVis * (0.35 + tier4Boost * 0.35 + beatPulse * 0.22);
      }

      for (let i = 0; i < spotlights.length; i++) {
        const sp = spotlights[i]!;
        sp.pivot.visible = motifVis > 0.01;
        if (!sp.pivot.visible) continue;

        const sweep = Math.sin(t * sp.sweepSpeed * spinMul + sp.phase);
        const tilt = 0.42 + Math.cos(t * sp.sweepSpeed * 0.7 * spinMul + sp.phase) * 0.28;
        sp.pivot.rotation.y = sp.baseAzimuth + Math.PI + sweep * 0.65;
        sp.pivot.rotation.x = tilt;

        const baseSpotCol = i % 2 === 0 ? accentColor : skyBotColor;
        tmpColor.copy(baseSpotCol).lerp(OVERDRIVE_GOLD, overdrive * 0.92);
        sp.mat.color.copy(tmpColor);
        sp.mat.opacity = motifVis * (0.14 + tier4Boost * 0.16 + beatPulse * 0.08 + overdrive * 0.1);
      }

      // 3b. Regional floating beat-synced vibe shapes orbiting the upper sky
      for (let i = 0; i < vibeMotifs.length; i++) {
        const vm = vibeMotifs[i]!;
        const ang = t * vm.speed * (1 + comboNorm * 0.65) + vm.phase;
        vm.obj.position.set(
          Math.cos(ang) * vm.radius,
          vm.baseY + Math.sin(t * 1.9 + vm.phase) * 2.4 + beatPulse * 1.1,
          Math.sin(ang) * vm.radius,
        );
        vm.obj.rotation.set(
          t * 0.7 * vm.spinAxis.x,
          t * 1.1 * vm.spinAxis.y + vm.phase,
          t * 0.6 * vm.spinAxis.z,
        );
        const sc = 0.9 + beatPulse * (0.22 + comboNorm * 0.25) + comboNorm * 0.35;
        vm.obj.scale.setScalar(sc);

        tmpColor.copy(vm.baseColor).lerp(OVERDRIVE_GOLD, overdrive * 0.8);
        vm.mat.color.copy(tmpColor);
        vm.mat.emissive.copy(tmpColor);
        vm.mat.emissiveIntensity = 0.65 + beatPulse * 0.55 + comboNorm * 0.85;
      }
    },
    dispose() {
      for (const d of disposables) d.dispose();
    },
  };
}

function buildRegionalVibeShape(
  areaNumber: number,
  holder: THREE.Group,
  mat: THREE.MeshStandardMaterial,
  track: <T extends { dispose(): void }>(x: T) => T,
): void {
  switch (areaNumber) {
    case 1: {
      // Floating eighth-note / synth key silhouette
      const head = new THREE.Mesh(track(new THREE.SphereGeometry(1.1, 10, 10)), mat);
      head.scale.set(1.2, 0.85, 0.7);
      const stem = new THREE.Mesh(track(new THREE.BoxGeometry(0.32, 3.2, 0.32)), mat);
      stem.position.set(0.85, 1.4, 0);
      const flag = new THREE.Mesh(track(new THREE.BoxGeometry(1.3, 0.45, 0.32)), mat);
      flag.position.set(1.4, 2.8, 0);
      flag.rotation.z = -0.35;
      holder.add(head, stem, flag);
      break;
    }
    case 2: {
      // Bongo rings
      const outer = new THREE.Mesh(track(new THREE.TorusGeometry(1.8, 0.28, 8, 18)), mat);
      const inner = new THREE.Mesh(track(new THREE.CylinderGeometry(1.35, 1.15, 0.45, 14)), mat);
      inner.rotation.x = Math.PI / 2;
      holder.add(outer, inner);
      break;
    }
    case 3: {
      // Kiln sparks / jagged octahedron crystals
      const shard = new THREE.Mesh(track(new THREE.OctahedronGeometry(1.6)), mat);
      shard.scale.set(0.7, 1.7, 0.7);
      holder.add(shard);
      break;
    }
    case 4: {
      // Birdbath mist bubbles
      const bubble = new THREE.Mesh(track(new THREE.SphereGeometry(1.65, 14, 12)), mat);
      const halo = new THREE.Mesh(track(new THREE.TorusGeometry(2.15, 0.14, 6, 20)), mat);
      halo.rotation.x = Math.PI / 2;
      holder.add(bubble, halo);
      break;
    }
    case 5: {
      // Pixel arcade cubes
      const cubeA = new THREE.Mesh(track(new THREE.BoxGeometry(2.1, 2.1, 2.1)), mat);
      const cubeB = new THREE.Mesh(track(new THREE.BoxGeometry(1.0, 1.0, 1.0)), mat);
      cubeB.position.set(1.4, 1.4, 0);
      holder.add(cubeA, cubeB);
      break;
    }
    case 6: {
      // Pastel mall diamonds
      const gem = new THREE.Mesh(track(new THREE.OctahedronGeometry(1.75)), mat);
      gem.scale.set(0.85, 1.45, 0.85);
      holder.add(gem);
      break;
    }
    case 7: {
      // Citadel stars (crossed 4-sided cones)
      const coneA = new THREE.Mesh(track(new THREE.ConeGeometry(1.1, 3.2, 4)), mat);
      const coneB = new THREE.Mesh(track(new THREE.ConeGeometry(1.1, 3.2, 4)), mat);
      coneB.rotation.z = Math.PI;
      holder.add(coneA, coneB);
      break;
    }
    case 8: {
      // Subsoil sonar rings
      const outer = new THREE.Mesh(track(new THREE.TorusGeometry(2.1, 0.18, 8, 22)), mat);
      const inner = new THREE.Mesh(track(new THREE.TorusGeometry(1.1, 0.18, 8, 18)), mat);
      holder.add(outer, inner);
      break;
    }
    default: {
      // Zenith vinyl halos
      const disc = new THREE.Mesh(track(new THREE.CylinderGeometry(1.85, 1.85, 0.22, 18)), mat);
      const halo = new THREE.Mesh(track(new THREE.TorusGeometry(2.45, 0.18, 8, 24)), mat);
      halo.rotation.x = Math.PI / 2;
      holder.add(disc, halo);
      break;
    }
  }
}
