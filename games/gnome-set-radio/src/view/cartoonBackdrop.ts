import * as THREE from 'three';
import type { GsrLevelDoc } from '../levels/schema';
import { getToonGradientMap } from './toon';

export interface CartoonBackdrop {
  group: THREE.Group;
  update(t: number, beatPulse: number, hype: number, comboMult: number): void;
  dispose(): void;
}

const COMIC_WORDS: Record<string, readonly string[]> = {
  'velvet-keys': ['JAZZ!', 'GROOVE!', 'SWING!', 'DORIAN!'],
  'bongo-basin': ['BOOM!', 'RIP!', 'THUMP!', 'ROLL!'],
  'chrome-kiln': ['SMELT!', 'ACID!', '303!', 'CLANK!'],
  'neon-birdbath': ['SPLASH!', 'FLOW!', 'MIST!', 'DRIFT!'],
  'mulch-alley': ['1-UP!', 'TILT!', 'COIN!', 'CHIP!'],
  'tupperware-mall': ['SALE!', 'VAPOR!', 'DING!', 'CHILL!'],
  'hoa-citadel': ['CITED!', 'BRASS!', 'BYLAW!', 'MARCH!'],
  'subsoil-relay': ['108.0!', 'DUB!', 'ECHO!', 'DEEP!'],
  'zero-hz-zenith': ['ENCORE!', 'UNITY!', 'SYNC!', 'SHINE!'],
};

function makeComicCalloutTexture(word: string, accent: string, bg: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = c.getContext('2d')!;

  g.save();
  g.translate(256, 128);
  g.beginPath();
  const spikes = 14;
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const rx = i % 2 === 0 ? 236 : 168;
    const ry = i % 2 === 0 ? 114 : 78;
    const x = Math.cos(a) * rx;
    const y = Math.sin(a) * ry;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
  g.fillStyle = bg;
  g.fill();
  g.lineWidth = 14;
  g.strokeStyle = '#120624';
  g.stroke();

  g.clip();
  g.fillStyle = accent;
  g.globalAlpha = 0.25;
  for (let x = -240; x <= 240; x += 22) {
    for (let y = -120; y <= 120; y += 22) {
      g.beginPath();
      g.arc(x, y, 4.5, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.restore();

  g.save();
  g.translate(256, 146);
  g.rotate(-0.08);
  g.textAlign = 'center';
  g.font = '900 84px "Arial Black", Impact, sans-serif';
  g.lineWidth = 14;
  g.strokeStyle = '#120624';
  g.strokeText(word, 0, 0);
  g.fillStyle = '#ffd740';
  g.fillText(word, 6, -4);
  g.fillStyle = '#ffffff';
  g.fillText(word, 0, 0);
  g.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createCartoonBackdrop(doc: GsrLevelDoc): CartoonBackdrop {
  const group = new THREE.Group();
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(x: T): T => {
    disposables.push(x);
    return x;
  };

  const toonMap = getToonGradientMap();
  const accent = doc.data.accentColor;
  const words = COMIC_WORDS[doc.id] ?? ['GROOVE!', 'SKATE!', 'FLOW!', 'RADIO!'];

  const cloudMat = track(
    new THREE.MeshToonMaterial({
      color: '#ffffff',
      emissive: doc.data.skyBottom,
      emissiveIntensity: 0.18,
      gradientMap: toonMap,
    }),
  );
  const inkMat = track(
    new THREE.MeshBasicMaterial({
      color: '#120624',
      side: THREE.BackSide,
    }),
  );
  const puffGeo = track(new THREE.SphereGeometry(1, 12, 10));

  const clouds: { root: THREE.Group; baseAngle: number; dist: number; baseY: number; speed: number }[] = [];
  const puffOffsets: readonly [number, number, number, number][] = [
    [0, 0, 0, 4.6],
    [-4.2, -0.8, 0.5, 3.4],
    [4.4, -0.6, -0.4, 3.6],
    [-1.8, 1.8, -0.3, 3.1],
    [2.0, 1.5, 0.4, 2.9],
  ];

  for (let i = 0; i < 10; i++) {
    const holder = new THREE.Group();
    const dist = 124 + (i % 3) * 14;
    const baseAngle = (i / 10) * Math.PI * 2 + 0.18;
    const baseY = 16 + (i % 4) * 7.5;
    for (const [ox, oy, oz, rad] of puffOffsets) {
      const puff = new THREE.Mesh(puffGeo, cloudMat);
      puff.position.set(ox, oy, oz);
      puff.scale.setScalar(rad);
      holder.add(puff);
    }
    holder.position.set(Math.cos(baseAngle) * dist, baseY, Math.sin(baseAngle) * dist);
    holder.lookAt(0, baseY, 0);
    group.add(holder);
    clouds.push({ root: holder, baseAngle, dist, baseY, speed: (i % 2 === 0 ? 1 : -1) * 0.012 });
  }

  const callouts: { sprite: THREE.Sprite; baseAngle: number; dist: number; baseY: number; phase: number }[] = [];
  for (let i = 0; i < 4; i++) {
    const word = words[i % words.length]!;
    const tex = track(makeComicCalloutTexture(word, accent, i % 2 === 0 ? accent : doc.data.skyBottom));
    const mat = track(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    const sprite = new THREE.Sprite(mat);
    const dist = 112 + (i % 2) * 14;
    const baseAngle = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
    const baseY = 24 + (i % 2) * 14;
    sprite.position.set(Math.cos(baseAngle) * dist, baseY, Math.sin(baseAngle) * dist);
    sprite.scale.set(22, 11, 1);
    group.add(sprite);
    callouts.push({ sprite, baseAngle, dist, baseY, phase: i * 1.5 });
  }

  const speedArcs: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; speed: number }[] = [];
  const arcGeo = track(new THREE.TorusGeometry(92, 0.38, 6, 36, Math.PI * 0.42));
  for (let i = 0; i < 4; i++) {
    const mat = track(
      new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? accent : '#ffd740',
        transparent: true,
        opacity: 0.35,
      }),
    );
    const mesh = new THREE.Mesh(arcGeo, mat);
    mesh.position.y = 48 + i * 6;
    mesh.rotation.x = Math.PI * 0.46 + (i % 2 === 0 ? 0.14 : -0.14);
    mesh.rotation.z = (i / 4) * Math.PI * 2;
    group.add(mesh);
    speedArcs.push({ mesh, mat, speed: (i % 2 === 0 ? 1 : -1) * (0.14 + i * 0.03) });
  }

  return {
    group,
    update(t, beatPulse, hype, comboMult) {
      for (const c of clouds) {
        const a = c.baseAngle + t * c.speed;
        c.root.position.set(
          Math.cos(a) * c.dist,
          c.baseY + Math.sin(t * 0.5 + c.baseAngle) * 1.6 + beatPulse * 0.6,
          Math.sin(a) * c.dist,
        );
        c.root.lookAt(0, c.root.position.y, 0);
      }

      const comboBoost = Math.min(0.45, Math.max(0, comboMult - 1) * 0.07);
      for (const p of callouts) {
        const a = p.baseAngle + t * 0.025;
        p.sprite.position.set(
          Math.cos(a) * p.dist,
          p.baseY + Math.sin(t * 1.1 + p.phase) * 2.2 + beatPulse * 1.4,
          Math.sin(a) * p.dist,
        );
        const sc = 1 + comboBoost + beatPulse * 0.14;
        p.sprite.scale.set(22 * sc, 11 * sc, 1);
        p.sprite.material.rotation = Math.sin(t * 1.8 + p.phase) * 0.09;
      }

      const arcBright = comboMult >= 3 ? Math.min(0.9, 0.45 + hype * 0.4) : 0.25 + beatPulse * 0.18;
      for (const s of speedArcs) {
        s.mesh.rotation.z += s.speed * 0.016 * (1 + comboBoost * 2);
        s.mat.opacity = arcBright;
      }
    },
    dispose() {
      for (const d of disposables) d.dispose();
    },
  };
}
