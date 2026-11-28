import * as THREE from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import { LAYER, flatLayer } from '@lawn/depth';
import type { GsrLevelId } from '../levels/loader';
import type { SkaterState } from '../sim/skater';

export type GraffitiShape =
  | 'starburst'
  | 'comic-bubble'
  | 'stencil-circle'
  | 'vinyl-badge'
  | 'diamond-crest'
  | 'slash-banner'
  | 'splatter-cloud'
  | 'octagon';

export interface GraffitiDesign {
  id: string;
  label: string;
  primary: string;
  secondary: string;
  bg: string;
  motif: 'keys' | 'vinyl' | 'sax' | 'bongo' | 'crown' | 'wave' | 'anvil' | 'flame' | 'gear' | 'fountain' | 'wing' | 'ring' | 'arcade' | 'cart' | 'gavel' | 'reel' | 'needle';
  shape: GraffitiShape;
}

export const REGIONAL_GRAFFITI: Record<GsrLevelId, [GraffitiDesign, GraffitiDesign, GraffitiDesign]> = {
  'velvet-keys': [
    { id: 'vk-keys', label: 'IVORY KEYS', primary: '#ff4ecd', secondary: '#ffd740', bg: '#1b0933', motif: 'keys', shape: 'slash-banner' },
    { id: 'vk-vinyl', label: 'DORIAN SPIN', primary: '#00e5ff', secondary: '#ff4ecd', bg: '#140829', motif: 'vinyl', shape: 'vinyl-badge' },
    { id: 'vk-sax', label: 'PLAZA BRASS', primary: '#ffd740', secondary: '#00e5ff', bg: '#260b3d', motif: 'sax', shape: 'starburst' },
  ],
  'bongo-basin': [
    { id: 'bb-bongo', label: 'RIP-SKIN', primary: '#ff9100', secondary: '#ffd740', bg: '#2b1208', motif: 'bongo', shape: 'splatter-cloud' },
    { id: 'bb-crown', label: 'KORA CROWN', primary: '#ff5252', secondary: '#00e5ff', bg: '#240b18', motif: 'crown', shape: 'diamond-crest' },
    { id: 'bb-wave', label: 'TUMBAO WAVE', primary: '#00e5ff', secondary: '#ff9100', bg: '#131b2e', motif: 'wave', shape: 'comic-bubble' },
  ],
  'chrome-kiln': [
    { id: 'ck-anvil', label: 'GLAZE GRIND', primary: '#76ff03', secondary: '#ff6d00', bg: '#1a1118', motif: 'anvil', shape: 'octagon' },
    { id: 'ck-flame', label: 'ACID KILN', primary: '#ff6d00', secondary: '#ffd740', bg: '#260d0a', motif: 'flame', shape: 'starburst' },
    { id: 'ck-gear', label: 'PHRYGIAN COG', primary: '#00e5ff', secondary: '#76ff03', bg: '#101d24', motif: 'gear', shape: 'stencil-circle' },
  ],
  'neon-birdbath': [
    { id: 'nb-fountain', label: 'SPLASH APEX', primary: '#00e5ff', secondary: '#ff4ecd', bg: '#0c1836', motif: 'fountain', shape: 'splatter-cloud' },
    { id: 'nb-wing', label: 'LYDIAN WING', primary: '#69f0ae', secondary: '#00e5ff', bg: '#0e2421', motif: 'wing', shape: 'diamond-crest' },
    { id: 'nb-ring', label: 'MIST HALO', primary: '#ff4ecd', secondary: '#ffd740', bg: '#1f0b33', motif: 'ring', shape: 'stencil-circle' },
  ],
  'mulch-alley': [
    { id: 'ma-token', label: 'TOKEN SHARK', primary: '#ff5252', secondary: '#ffd740', bg: '#240b18', motif: 'arcade', shape: 'comic-bubble' },
    { id: 'ma-crt', label: '8-BIT BOOTLEG', primary: '#00e5ff', secondary: '#ff5252', bg: '#120824', motif: 'arcade', shape: 'octagon' },
    { id: 'ma-crown', label: 'HIGH SCORE', primary: '#ffd740', secondary: '#ff5252', bg: '#1f0c18', motif: 'crown', shape: 'starburst' },
  ],
  'tupperware-mall': [
    { id: 'tm-cart', label: '100% OFF', primary: '#4dd0e1', secondary: '#ff8a80', bg: '#142238', motif: 'cart', shape: 'slash-banner' },
    { id: 'tm-wave', label: 'SKY-MALL 97', primary: '#ff8a80', secondary: '#fff59d', bg: '#29122e', motif: 'wave', shape: 'comic-bubble' },
    { id: 'tm-ring', label: 'CLEARANCE', primary: '#fff59d', secondary: '#4dd0e1', bg: '#1c1836', motif: 'ring', shape: 'vinyl-badge' },
  ],
  'hoa-citadel': [
    { id: 'hc-gavel', label: 'NO BYLAWS', primary: '#ffd740', secondary: '#69f0ae', bg: '#1b2e1d', motif: 'gavel', shape: 'octagon' },
    { id: 'hc-crown', label: 'NEON LAWN', primary: '#69f0ae', secondary: '#ffd740', bg: '#142419', motif: 'crown', shape: 'diamond-crest' },
    { id: 'hc-wing', label: 'CITATION ZERO', primary: '#ff5252', secondary: '#ffd740', bg: '#261414', motif: 'wing', shape: 'slash-banner' },
  ],
  'subsoil-relay': [
    { id: 'sr-reel', label: '108.0 DUB', primary: '#7c4dff', secondary: '#ffab40', bg: '#120824', motif: 'reel', shape: 'vinyl-badge' },
    { id: 'sr-wave', label: 'SUBSOIL BASS', primary: '#ffab40', secondary: '#7c4dff', bg: '#1c1026', motif: 'wave', shape: 'splatter-cloud' },
    { id: 'sr-ring', label: 'FORK PHASE', primary: '#00e5ff', secondary: '#7c4dff', bg: '#0d0c24', motif: 'ring', shape: 'stencil-circle' },
  ],
  'zero-hz-zenith': [
    { id: 'zh-needle', label: 'ZERO-HZ', primary: '#ffd740', secondary: '#ffffff', bg: '#111118', motif: 'needle', shape: 'diamond-crest' },
    { id: 'zh-vinyl', label: 'DEAD WAX', primary: '#ffffff', secondary: '#ffd740', bg: '#181822', motif: 'vinyl', shape: 'vinyl-badge' },
    { id: 'zh-wing', label: 'ALL 8 BANDS', primary: '#00e5ff', secondary: '#ff4ecd', bg: '#141024', motif: 'wing', shape: 'starburst' },
  ],
};

const texCache = new Map<string, THREE.CanvasTexture>();

export function getGraffitiTexture(design: GraffitiDesign): THREE.CanvasTexture {
  const existing = texCache.get(design.id);
  if (existing) return existing;

  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d')!;

  // Spray splatter backdrop
  g.clearRect(0, 0, 256, 256);
  g.save();
  g.translate(128, 128);
  g.rotate(-0.08);

  // Outer silhouette shape (8 distinct graffiti styles!)
  g.fillStyle = design.bg;
  g.strokeStyle = design.primary;
  g.lineWidth = 9;
  g.beginPath();
  if (design.shape === 'starburst') {
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const r = i % 2 === 0 ? 116 : 82;
      if (i === 0) g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.closePath();
  } else if (design.shape === 'stencil-circle' || design.shape === 'vinyl-badge') {
    g.arc(0, 0, 102, 0, Math.PI * 2);
  } else if (design.shape === 'diamond-crest') {
    g.moveTo(0, -112); g.lineTo(112, 0); g.lineTo(0, 112); g.lineTo(-112, 0); g.closePath();
  } else if (design.shape === 'octagon') {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const r = 108;
      if (i === 0) g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.closePath();
  } else if (design.shape === 'slash-banner') {
    g.moveTo(-116, -78); g.lineTo(116, -94); g.lineTo(96, 84); g.lineTo(-96, 98); g.closePath();
  } else if (design.shape === 'splatter-cloud') {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const r = 92 + ((i * 37) % 24);
      if (i === 0) g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else g.quadraticCurveTo(Math.cos(a - 0.25) * (r + 18), Math.sin(a - 0.25) * (r + 18), Math.cos(a) * r, Math.sin(a) * r);
    }
    g.closePath();
  } else {
    // comic-bubble
    g.roundRect(-108, -90, 216, 180, 34);
    g.moveTo(-40, 88); g.lineTo(-64, 116); g.lineTo(-14, 88);
  }
  g.fill();
  g.stroke();

  // Halftone pop-art dot accent + spray splatter dots
  g.fillStyle = design.secondary;
  g.globalAlpha = 0.25;
  for (let gx = -64; gx <= 64; gx += 22) {
    for (let gy = -60; gy <= 20; gy += 22) {
      g.beginPath();
      g.arc(gx, gy, 3.2, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.globalAlpha = 1;

  // Drips & spray mist flecks
  g.fillStyle = design.primary;
  for (const dx of [-68, -22, 38, 76]) {
    const h = 16 + (Math.abs(dx * 3) % 22);
    g.fillRect(dx, 82, 7, h);
    g.beginPath();
    g.arc(dx + 3.5, 82 + h, 4.5, 0, Math.PI * 2);
    g.fill();
  }

  // Motif artwork
  g.fillStyle = design.secondary;
  g.strokeStyle = design.primary;
  g.lineWidth = 5;
  switch (design.motif) {
    case 'keys':
      for (let i = -2; i <= 2; i++) {
        g.fillStyle = '#ffffff';
        g.fillRect(i * 30 - 12, -55, 24, 72);
        if (i < 2) {
          g.fillStyle = '#140824';
          g.fillRect(i * 30 + 6, -55, 14, 42);
        }
      }
      break;
    case 'vinyl':
    case 'ring':
      g.beginPath(); g.arc(0, -14, 52, 0, Math.PI * 2); g.fillStyle = design.secondary; g.fill(); g.stroke();
      g.beginPath(); g.arc(0, -14, 18, 0, Math.PI * 2); g.fillStyle = design.bg; g.fill();
      break;
    case 'crown':
      g.beginPath();
      g.moveTo(-60, 20); g.lineTo(-50, -45); g.lineTo(-18, -10); g.lineTo(0, -56);
      g.lineTo(18, -10); g.lineTo(50, -45); g.lineTo(60, 20); g.closePath();
      g.fill(); g.stroke();
      break;
    case 'flame':
      g.beginPath();
      g.moveTo(0, -68); g.quadraticCurveTo(56, -15, 34, 28);
      g.lineTo(-34, 28); g.quadraticCurveTo(-56, -15, 0, -68);
      g.fill(); g.stroke();
      break;
    case 'wing':
      g.beginPath();
      g.moveTo(-76, -34); g.lineTo(-10, -14); g.lineTo(10, -14); g.lineTo(76, -34);
      g.lineTo(48, 22); g.lineTo(-48, 22); g.closePath();
      g.fill(); g.stroke();
      break;
    case 'arcade':
      g.fillRect(-50, -56, 100, 74);
      g.strokeRect(-50, -56, 100, 74);
      g.fillStyle = design.bg;
      g.fillRect(-34, -42, 68, 44);
      break;
    case 'cart':
      g.strokeRect(-54, -48, 108, 56);
      g.beginPath(); g.arc(-32, 22, 12, 0, Math.PI * 2); g.arc(32, 22, 12, 0, Math.PI * 2); g.fill();
      break;
    case 'gavel':
      g.fillRect(-52, -52, 104, 34);
      g.fillRect(-10, -18, 20, 44);
      break;
    case 'reel':
      g.beginPath(); g.arc(-34, -14, 28, 0, Math.PI * 2); g.arc(34, -14, 28, 0, Math.PI * 2); g.fill(); g.stroke();
      break;
    case 'sax':
      g.beginPath();
      g.moveTo(-22, -56); g.lineTo(-6, -56); g.lineTo(-6, 12);
      g.quadraticCurveTo(22, 26, 36, -6); g.lineTo(54, -14);
      g.lineTo(40, 28); g.quadraticCurveTo(-18, 42, -22, 10); g.closePath();
      g.fill(); g.stroke();
      break;
    case 'bongo':
      g.fillRect(-46, -44, 38, 52); g.strokeRect(-46, -44, 38, 52);
      g.fillRect(8, -34, 34, 42); g.strokeRect(8, -34, 34, 42);
      break;
    case 'wave':
      g.lineWidth = 9;
      g.beginPath();
      for (let x = -64; x <= 64; x += 8) {
        const y = -16 + Math.sin(x * 0.1) * 24;
        if (x === -64) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();
      g.lineWidth = 5;
      break;
    case 'anvil':
      g.beginPath();
      g.moveTo(-58, -38); g.lineTo(58, -38); g.lineTo(32, -8);
      g.lineTo(44, 24); g.lineTo(-44, 24); g.lineTo(-32, -8); g.closePath();
      g.fill(); g.stroke();
      break;
    case 'gear':
      g.beginPath();
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const r = i % 2 === 0 ? 50 : 36;
        if (i === 0) g.moveTo(Math.cos(a) * r, -14 + Math.sin(a) * r);
        else g.lineTo(Math.cos(a) * r, -14 + Math.sin(a) * r);
      }
      g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.arc(0, -14, 16, 0, Math.PI * 2); g.fillStyle = design.bg; g.fill();
      break;
    case 'fountain':
      g.fillRect(-42, 8, 84, 16);
      g.beginPath();
      g.moveTo(0, 8); g.quadraticCurveTo(-48, -48, -54, -18);
      g.moveTo(0, 8); g.quadraticCurveTo(48, -48, 54, -18);
      g.moveTo(0, 8); g.lineTo(0, -56);
      g.stroke();
      break;
    case 'needle':
      g.beginPath();
      g.moveTo(0, -64); g.lineTo(44, 18); g.lineTo(0, 4); g.lineTo(-44, 18); g.closePath();
      g.fill(); g.stroke();
      break;
    default:
      g.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const r = i % 2 === 0 ? 58 : 26;
        if (i === 0) g.moveTo(Math.cos(a) * r, -16 + Math.sin(a) * r);
        else g.lineTo(Math.cos(a) * r, -16 + Math.sin(a) * r);
      }
      g.closePath(); g.fill(); g.stroke();
      break;
  }

  // Bold stencil label
  g.font = '900 26px "Arial Black", Impact, sans-serif';
  g.textAlign = 'center';
  g.fillStyle = '#120624';
  g.fillText(design.label, 3, 66);
  g.fillStyle = '#ffffff';
  g.fillText(design.label, 0, 63);
  g.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  texCache.set(design.id, tex);
  return tex;
}

export interface GraffitiSystem {
  sprayAt(skater: SkaterState, design: GraffitiDesign, worldGroup: THREE.Group): { hit: boolean; x: number; y: number; z: number };
  clear(): void;
  dispose(): void;
}

export function createGraffitiSystem(scene: THREE.Scene): GraffitiSystem {
  const decals: THREE.Mesh[] = [];
  const fallbackGeo = new THREE.PlaneGeometry(2.3, 2.3);
  const raycaster = new THREE.Raycaster();
  const group = new THREE.Group();
  const upVec = new THREE.Vector3(0, 1, 0);
  const dummy = new THREE.Object3D();
  const decalSize = new THREE.Vector3(2.3, 2.3, 1.4);
  scene.add(group);

  const placeDecal = (hitMesh: THREE.Mesh, point: THREE.Vector3, normal: THREE.Vector3, design: GraffitiDesign): void => {
    const tex = getGraffitiTexture(design);
    const mat = flatLayer(
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      LAYER.decal,
    );

    dummy.position.copy(point);
    dummy.up.copy(Math.abs(normal.y) > 0.95 ? new THREE.Vector3(0, 0, 1) : upVec);
    dummy.lookAt(point.clone().add(normal));
    dummy.rotateZ((Math.random() - 0.5) * 0.24);

    let geo: THREE.BufferGeometry = new DecalGeometry(hitMesh, point, dummy.rotation, decalSize);
    const posAttr = geo.getAttribute('position');
    if (!posAttr || posAttr.count === 0) {
      geo.dispose();
      geo = fallbackGeo;
    }

    const mesh = new THREE.Mesh(geo, mat);
    if (geo === fallbackGeo) {
      mesh.position.copy(point).addScaledVector(normal, 0.045);
      mesh.rotation.copy(dummy.rotation);
    }
    group.add(mesh);
    decals.push(mesh);

    if (decals.length > 48) {
      const old = decals.shift()!;
      group.remove(old);
      if (old.geometry !== fallbackGeo) old.geometry.dispose();
      (old.material as THREE.Material).dispose();
    }
  };

  return {
    sprayAt(s, design, worldGroup) {
      const sprayables: THREE.Object3D[] = [];
      worldGroup.traverse((o) => {
        if (o.userData?.sprayable && (o as THREE.Mesh).isMesh) sprayables.push(o);
      });

      const fwd = new THREE.Vector3(Math.sin(s.yaw), 0, Math.cos(s.yaw)).normalize();
      const origin = new THREE.Vector3(s.x, s.y + 0.85, s.z);

      // Try forward wall/prop spray first, then downward ground/roof/ramp spray (never mid-air!)
      raycaster.set(origin, fwd);
      raycaster.far = 4.6;
      let hits = raycaster.intersectObjects(sprayables, false);
      if (hits.length === 0) {
        raycaster.set(new THREE.Vector3(s.x, s.y + 0.9, s.z), new THREE.Vector3(0, -1, 0));
        raycaster.far = 2.4;
        hits = raycaster.intersectObjects(sprayables, false);
      }

      if (hits.length > 0) {
        const hit = hits[0]!;
        const n = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize() : new THREE.Vector3(0, 1, 0);
        placeDecal(hit.object as THREE.Mesh, hit.point, n, design);
        return { hit: true, x: hit.point.x, y: hit.point.y, z: hit.point.z };
      }

      return { hit: false, x: s.x, y: s.y, z: s.z };
    },
    clear() {
      for (const m of decals) {
        group.remove(m);
        if (m.geometry !== fallbackGeo) m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      }
      decals.length = 0;
    },
    dispose() {
      scene.remove(group);
      fallbackGeo.dispose();
      for (const m of decals) {
        if (m.geometry !== fallbackGeo) m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      }
      decals.length = 0;
    },
  };
}
