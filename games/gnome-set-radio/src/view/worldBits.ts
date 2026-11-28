import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { COMPETITIONS } from '../data/competitions';
import { groundHeightAt, type GsrLevelId } from '../levels/loader';
import type { GsrLevelDoc } from '../levels/schema';

export interface WorldBitsSystem {
  scratchPads: { x: number; y: number; z: number }[];
  boothPos: { x: number; y: number; z: number };
  compRings: THREE.Group[];
  setCompetitionState(unlocked: boolean, active: boolean, collectedRings?: Set<number>): void;
  update(t: number, beatPulse: number): void;
  dispose(): void;
}

interface ScratchPadVisual {
  disc: THREE.Mesh;
  ring: THREE.Mesh;
  arm: THREE.Group;
  ringMat: THREE.MeshStandardMaterial;
}

function createVinylTexture(accentColor: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d')!;

  const cx = 128;
  const cy = 128;

  // Vinyl base
  g.fillStyle = '#11121b';
  g.beginPath();
  g.arc(cx, cy, 126, 0, Math.PI * 2);
  g.fill();

  // Concentric grooves
  for (let r = 48; r <= 118; r += 8) {
    g.strokeStyle = r % 16 === 0 ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.07)';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.stroke();
  }

  // Cue scratch stripe so spinning is unmistakable
  g.fillStyle = '#00e5ff';
  g.fillRect(cx + 38, cy - 5, 76, 10);
  g.fillStyle = '#ff4ecd';
  g.fillRect(cx - 114, cy - 4, 52, 8);

  // Center label
  g.fillStyle = accentColor;
  g.beginPath();
  g.arc(cx, cy, 38, 0, Math.PI * 2);
  g.fill();

  g.fillStyle = '#ffd740';
  g.beginPath();
  g.arc(cx, cy, 14, 0, Math.PI * 2);
  g.fill();

  // Spindle hole
  g.fillStyle = '#11121b';
  g.beginPath();
  g.arc(cx, cy, 5, 0, Math.PI * 2);
  g.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function drawBoothLabel(canvas: HTMLCanvasElement, text: string, unlocked: boolean, active: boolean): void {
  const g = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;
  g.clearRect(0, 0, w, h);

  g.fillStyle = unlocked ? 'rgba(26, 14, 8, 0.92)' : 'rgba(18, 10, 30, 0.9)';
  g.strokeStyle = active ? '#00e5ff' : unlocked ? '#ffd740' : '#9e8bb8';
  g.lineWidth = 8;
  g.beginPath();
  g.roundRect(8, 8, w - 16, h - 16, 22);
  g.fill();
  g.stroke();

  g.fillStyle = active ? '#00e5ff' : unlocked ? '#ffd740' : '#d6c8eb';
  g.font = '900 28px system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, w * 0.5, h * 0.5 + 2, w - 48);
}

export function createWorldBits(
  doc: GsrLevelDoc,
  group: THREE.Group,
  track: <T extends { dispose(): void }>(x: T) => T,
): WorldBitsSystem {
  const comp = COMPETITIONS[doc.id as GsrLevelId] ?? COMPETITIONS['velvet-keys'];
  const accent = doc.data.accentColor || '#ff4ecd';

  // 1. 2 Interactive Turntable Scratch Launch Pads at [-14, 18] and [14, 18]
  const scratchCoords: [number, number][] = [
    [-14, 18],
    [14, 18],
  ];
  const scratchPads: { x: number; y: number; z: number }[] = [];
  const scratchVisuals: ScratchPadVisual[] = [];

  const vinylTex = track(createVinylTexture(accent));
  const discGeo = track(new THREE.CircleGeometry(2.35, 32));
  discGeo.rotateX(-Math.PI / 2);
  const discMat = track(
    flatLayer(
      new THREE.MeshBasicMaterial({
        map: vinylTex,
      }),
      LAYER.marking,
    ),
  );

  const ringGeo = track(new THREE.TorusGeometry(2.48, 0.11, 8, 32));
  ringGeo.rotateX(Math.PI / 2);

  const pivotGeo = track(new THREE.CylinderGeometry(0.2, 0.24, 0.36, 10));
  const armBarGeo = track(new THREE.BoxGeometry(0.1, 0.08, 1.85));
  const stylusGeo = track(new THREE.BoxGeometry(0.22, 0.14, 0.34));
  const pivotMat = track(new THREE.MeshStandardMaterial({ color: '#1b1d28', metalness: 0.7, roughness: 0.3 }));

  scratchCoords.forEach(([px, pz], idx) => {
    const py = groundHeightAt(doc, px, pz);
    scratchPads.push({ x: px, y: py, z: pz });

    const padGroup = new THREE.Group();
    padGroup.position.set(px, py, pz);

    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.y = 0.14;
    padGroup.add(disc);

    const ringColor = idx === 0 ? '#00e5ff' : '#ff4ecd';
    const ringMat = track(
      new THREE.MeshStandardMaterial({
        color: ringColor,
        emissive: ringColor,
        emissiveIntensity: 0.95,
        roughness: 0.2,
      }),
    );
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.13;
    padGroup.add(ring);

    const arm = new THREE.Group();
    arm.position.set(2.1, 0.22, 1.9);
    arm.rotation.y = -0.55;

    const pivot = new THREE.Mesh(pivotGeo, pivotMat);
    arm.add(pivot);

    const bar = new THREE.Mesh(armBarGeo, ringMat);
    bar.position.set(0, 0.12, -0.88);
    arm.add(bar);

    const stylus = new THREE.Mesh(stylusGeo, ringMat);
    stylus.position.set(0, 0.08, -1.78);
    arm.add(stylus);

    padGroup.add(arm);
    group.add(padGroup);
    scratchVisuals.push({ disc, ring, arm, ringMat });
  });

  // 2. Encore Trophy Booth at COMPETITIONS[doc.id].boothPos
  const bx = comp.boothPos[0];
  const bz = comp.boothPos[2];
  const by = comp.boothPos[1] === 0 ? groundHeightAt(doc, bx, bz) : comp.boothPos[1];
  const boothPos = { x: bx, y: by, z: bz };

  const boothGroup = new THREE.Group();
  boothGroup.position.set(bx, by, bz);

  const goldMat = track(
    new THREE.MeshStandardMaterial({
      color: '#ffd740',
      emissive: '#ffb300',
      emissiveIntensity: 0.75,
      metalness: 0.65,
      roughness: 0.22,
    }),
  );
  const darkBaseMat = track(new THREE.MeshStandardMaterial({ color: '#1b1d28', metalness: 0.5, roughness: 0.4 }));

  // Base apron ring (flatLayer so zero z-fighting with ground)
  const boothFloorGeo = track(new THREE.RingGeometry(2.1, 2.75, 28));
  boothFloorGeo.rotateX(-Math.PI / 2);
  const boothFloorMat = track(
    flatLayer(
      new THREE.MeshBasicMaterial({
        color: '#ffd740',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.78,
      }),
      LAYER.marker,
    ),
  );
  const boothFloor = new THREE.Mesh(boothFloorGeo, boothFloorMat);
  boothFloor.position.y = 0.14;
  boothGroup.add(boothFloor);

  // Glowing golden arch
  const boothPillarGeo = track(new THREE.CylinderGeometry(0.18, 0.24, 3.2, 10));
  for (const sx of [-2.2, 2.2]) {
    const pillar = new THREE.Mesh(boothPillarGeo, darkBaseMat);
    pillar.position.set(sx, 1.6, 0);
    boothGroup.add(pillar);
  }
  const boothArchGeo = track(new THREE.TorusGeometry(2.2, 0.16, 8, 24, Math.PI));
  const boothArch = new THREE.Mesh(boothArchGeo, goldMat);
  boothArch.position.set(0, 3.18, 0);
  boothGroup.add(boothArch);

  // Pedestal (two tapered cylinders, slightly overlapped cleanly in height)
  const pedLower = new THREE.Mesh(track(new THREE.CylinderGeometry(1.05, 1.25, 0.48, 16)), darkBaseMat);
  pedLower.position.y = 0.24;
  boothGroup.add(pedLower);

  const pedUpper = new THREE.Mesh(track(new THREE.CylinderGeometry(0.76, 0.9, 0.54, 16)), goldMat);
  pedUpper.position.y = 0.72;
  boothGroup.add(pedUpper);

  // Rotating golden trophy star/crown
  const trophyGroup = new THREE.Group();
  trophyGroup.position.set(0, 1.75, 0);

  const starCore = new THREE.Mesh(track(new THREE.OctahedronGeometry(0.55, 0)), goldMat);
  starCore.scale.set(1, 1.25, 1);
  trophyGroup.add(starCore);

  const crownBand = new THREE.Mesh(track(new THREE.TorusGeometry(0.58, 0.08, 8, 18)), goldMat);
  crownBand.rotation.x = Math.PI / 2;
  crownBand.position.y = -0.18;
  trophyGroup.add(crownBand);

  const spikeGeo = track(new THREE.ConeGeometry(0.11, 0.36, 6));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const spike = new THREE.Mesh(spikeGeo, goldMat);
    spike.position.set(Math.cos(a) * 0.56, 0.06, Math.sin(a) * 0.56);
    trophyGroup.add(spike);
  }
  boothGroup.add(trophyGroup);

  // Floating CanvasTexture Sprite label
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 768;
  labelCanvas.height = 128;
  drawBoothLabel(labelCanvas, '🔒 CLEAR BOSS FOR ENCORE COMP', false, false);

  const labelTex = new THREE.CanvasTexture(labelCanvas);
  labelTex.colorSpace = THREE.SRGBColorSpace;
  const labelMat = new THREE.SpriteMaterial({ map: labelTex, transparent: true, depthTest: false });
  const labelSprite = new THREE.Sprite(labelMat);
  labelSprite.scale.set(7.8, 1.3, 1);
  labelSprite.position.set(0, 5.9, 0);
  labelSprite.renderOrder = 19;
  boothGroup.add(labelSprite);

  group.add(boothGroup);

  // 3. Competition Golden Rings
  const compRings: THREE.Group[] = [];
  const ringPosList = comp.ringPositions ?? [];
  if (ringPosList.length > 0) {
    const compRingGeo = track(new THREE.TorusGeometry(1.75, 0.14, 8, 22));
    const compRingMat = track(
      new THREE.MeshStandardMaterial({
        color: '#ffd740',
        emissive: '#ffaa00',
        emissiveIntensity: 1.0,
        metalness: 0.45,
        roughness: 0.2,
      }),
    );

    for (const [rx, ry, rz] of ringPosList) {
      const rGroup = new THREE.Group();
      rGroup.position.set(rx, ry, rz);
      rGroup.visible = false;

      const torus = new THREE.Mesh(compRingGeo, compRingMat);
      rGroup.add(torus);

      group.add(rGroup);
      compRings.push(rGroup);
    }
  }

  let curUnlocked = false;
  let curActive = false;

  return {
    scratchPads,
    boothPos,
    compRings,

    setCompetitionState(unlocked, active, collectedRings) {
      if (unlocked !== curUnlocked || active !== curActive) {
        curUnlocked = unlocked;
        curActive = active;
        const label = unlocked ? `🏆 ENCORE COMP: ${comp.title.toUpperCase()}` : '🔒 CLEAR BOSS FOR ENCORE COMP';
        drawBoothLabel(labelCanvas, label, unlocked, active);
        labelTex.needsUpdate = true;
      }

      for (let i = 0; i < compRings.length; i++) {
        compRings[i].visible = active && !(collectedRings?.has(i) ?? false);
      }
    },

    update(t, beatPulse) {
      for (let i = 0; i < scratchVisuals.length; i++) {
        const sv = scratchVisuals[i];
        sv.disc.rotation.y = t * (i === 0 ? 2.4 : -2.4);
        sv.ring.scale.setScalar(1 + beatPulse * 0.07);
        sv.ringMat.emissiveIntensity = 0.8 + beatPulse * 0.65;
        sv.arm.rotation.y = -0.55 + Math.sin(t * 4.5 + i) * 0.04;
      }

      trophyGroup.rotation.y = t * 1.4;
      trophyGroup.position.y = 1.75 + Math.sin(t * 2.6) * 0.14;
      trophyGroup.scale.setScalar(1 + beatPulse * 0.1);
      goldMat.emissiveIntensity = (curActive ? 1.15 : curUnlocked ? 0.85 : 0.45) + beatPulse * 0.4;

      for (let i = 0; i < compRings.length; i++) {
        const rg = compRings[i];
        if (!rg.visible) continue;
        rg.rotation.y = t * 1.8 + i * 0.6;
        rg.scale.setScalar(1 + beatPulse * 0.09);
      }
    },

    dispose() {
      labelTex.dispose();
      labelMat.dispose();
    },
  };
}
