// 3D slot machine bank in the lounge: @lawn/prefabs cabinets, spinning canvas-textured reel drums,
// animated pull levers, jackpot dome flash, and raycast picking.
import * as THREE from 'three';
import {
  buildPrefab,
  getPrefab,
  getPrefabInteractTarget,
  getPrefabPart,
  getPrefabParts,
  type PrefabDef,
} from '@lawn/prefabs';
import { getSlotSpec } from './catalog';
import type { SlotPlacement, SlotState, SlotSymbol } from './types';

export const SLOT_PLACEMENTS: readonly SlotPlacement[] = [
  { id: 'slot-1', machineType: 'classic-3bar', x: 4.15, z: -0.35, yaw: -Math.PI / 2, tint: 'red', trim: 'brass' },
  { id: 'slot-2', machineType: 'classic-3bar', x: 4.15, z: 0.55, yaw: -Math.PI / 2, tint: 'blue', trim: 'gold' },
  { id: 'slot-3', machineType: 'classic-3bar', x: 4.15, z: 1.45, yaw: -Math.PI / 2, tint: 'emerald', trim: 'brass' },
];

interface ReelRig {
  pivot: THREE.Object3D;
  angle: number;
  targetAngle: number;
  speed: number;
}

interface MachineRig {
  placement: SlotPlacement;
  def: PrefabDef;
  root: THREE.Group;
  reels: ReelRig[];
  leverPivot: THREE.Object3D | null;
  leverPull: number;
  beaconMat: THREE.MeshStandardMaterial | null;
  beaconBaseColor: number;
  symbolAngles: Map<string, number>;
}

export interface SlotsView {
  sync(activeId: string, st: SlotState, dt: number): void;
  triggerPull(machineId: string): void;
  pick(raycaster: THREE.Raycaster): string | null;
  /** World-space position & lookAt for the camera when playing a given machine. */
  cameraTarget(machineId: string): { pos: THREE.Vector3; look: THREE.Vector3 };
  /** World-space standing spot & facing for the player's gnome next to the machine. */
  gnomeSpot(machineId: string): { pos: THREE.Vector3; facing: number };
}

/**
 * Rotation around X (in radians) that brings symbol `index` (out of `count`) to face +z upright.
 * Matches `buildReelDrumGeometry`: symbol `index` is at canvas `y = (index + 0.5) / count`, i.e. `v = 1 - (index + 0.5) / count`.
 */
export function reelSymbolAngle(index: number, count: number): number {
  return (1 - (index + 0.5) / count) * Math.PI * 2;
}

/**
 * Builds a horizontal-axis cylinder geometry (along X) whose lateral UVs map a vertical reel strip
 * upright onto the +z front face: `u` runs left-to-right (-x -> +x) and `v` wraps bottom-to-top around X.
 */
export function buildReelDrumGeometry(radius: number, width: number, segments = 32): THREE.CylinderGeometry {
  const geo = new THREE.CylinderGeometry(radius, radius, width, segments, 1, false);
  const uv = geo.attributes.uv;
  const norm = geo.attributes.normal;
  for (let i = 0; i < uv.count; i++) {
    // Lateral surface vertices have near-zero Y normal before rotation
    if (Math.abs(norm.getY(i)) < 0.5) {
      const oldU = uv.getX(i);
      const oldV = uv.getY(i);
      uv.setXY(i, 1 - oldV, oldU);
    }
  }
  uv.needsUpdate = true;
  geo.rotateZ(Math.PI / 2);
  return geo;
}

function buildReelTexture(symbols: readonly SlotSymbol[]): THREE.CanvasTexture {
  const w = 256;
  const slotH = 256;
  const h = slotH * symbols.length;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d') as CanvasRenderingContext2D;

  ctx.fillStyle = '#faf5e8';
  ctx.fillRect(0, 0, w, h);

  symbols.forEach((sym, i) => {
    const y0 = i * slotH;
    // Crisp divider bars
    ctx.fillStyle = '#cbbba0';
    ctx.fillRect(0, y0, w, 8);
    ctx.fillRect(0, y0 + slotH - 8, w, 8);

    const cx = w / 2;
    const cy = y0 + slotH / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (sym.id === 'BAR3') {
      for (const dy of [-56, 0, 56]) {
        ctx.fillStyle = '#1d1d22';
        ctx.fillRect(36, cy + dy - 20, w - 72, 40);
        ctx.fillStyle = '#ffd54f';
        ctx.font = 'bold 30px system-ui, sans-serif';
        ctx.fillText('BAR', cx, cy + dy + 2);
      }
    } else if (sym.id === 'BAR') {
      ctx.fillStyle = '#1d1d22';
      ctx.fillRect(28, cy - 44, w - 56, 88);
      ctx.strokeStyle = '#ffd54f';
      ctx.lineWidth = 6;
      ctx.strokeRect(32, cy - 40, w - 64, 80);
      ctx.fillStyle = '#ffd54f';
      ctx.font = 'bold 54px system-ui, sans-serif';
      ctx.fillText('BAR', cx, cy + 4);
    } else if (sym.id === '7') {
      ctx.fillStyle = '#d92626';
      ctx.font = '900 156px Georgia, serif';
      ctx.fillText('7', cx, cy + 8);
      ctx.strokeStyle = '#ffd54f';
      ctx.lineWidth = 6;
      ctx.strokeText('7', cx, cy + 8);
    } else {
      ctx.fillStyle = sym.color;
      ctx.font = '124px system-ui, sans-serif';
      ctx.fillText(sym.glyph, cx, cy + 8);
    }
  });

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function buildMarqueeTexture(title: string): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 64;
  const ctx = cv.getContext('2d') as CanvasRenderingContext2D;
  ctx.fillStyle = '#240b0e';
  ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = '#ffd54f';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 248, 56);
  ctx.fillStyle = '#ffe57f';
  ctx.font = '900 24px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title.toUpperCase(), 128, 34);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createSlotsView(scene: THREE.Scene): SlotsView {
  const bankGroup = new THREE.Group();
  scene.add(bankGroup);

  // Red velvet carpet runner beneath the slot bank: the 'rug' prefab (2.2 x 1.5), turned to run along z and stretched to 1.3 x 2.95.
  const rug = buildPrefab('rug', { tint: 0x6b1420 });
  rug.rotation.y = Math.PI / 2;
  rug.scale.set(2.95 / 2.2, 1, 1.3 / 1.5);
  rug.position.set(3.95, 0, 0.55);
  rug.traverse((o) => {
    o.receiveShadow = true;
  });
  bankGroup.add(rug);

  // Warm overhead light for the slot bank
  const bankLight = new THREE.PointLight(0xffd28a, 3.8, 7, 1.4);
  bankLight.position.set(3.4, 2.35, 0.55);
  bankGroup.add(bankLight);

  const machines = new Map<string, MachineRig>();
  const pickables: THREE.Object3D[] = [];
  const texCache = new Map<string, THREE.CanvasTexture>();
  const drumGeoCache = new Map<string, THREE.CylinderGeometry>();

  const getDrumGeo = (radius: number, width: number): THREE.CylinderGeometry => {
    const key = `${radius.toFixed(4)}:${width.toFixed(4)}`;
    let geo = drumGeoCache.get(key);
    if (!geo) {
      geo = buildReelDrumGeometry(radius, width, 32);
      drumGeoCache.set(key, geo);
    }
    return geo;
  };

  for (const p of SLOT_PLACEMENTS) {
    const spec = getSlotSpec(p.machineType);
    const def = getPrefab(spec.prefabId);
    if (!def) throw new Error(`Missing slot prefab: ${spec.prefabId}`);

    const root = new THREE.Group();
    root.position.set(p.x, 0, p.z);
    root.rotation.y = p.yaw;
    bankGroup.add(root);

    const prefab = buildPrefab(def, {
      tint: p.tint ?? spec.tint,
      trim: p.trim ?? spec.trim,
      lights: false,
    });
    root.add(prefab);

    // Textured reel drums driven by the prefab's own `reel-*` pivot groups
    let reelTex = texCache.get(spec.id);
    if (!reelTex) {
      reelTex = buildReelTexture(spec.symbols);
      texCache.set(spec.id, reelTex);
    }
    const drumMat = new THREE.MeshStandardMaterial({ map: reelTex, roughness: 0.35 });
    const sideMat = new THREE.MeshStandardMaterial({ color: 0xd4c8aa, roughness: 0.5 });

    const symbolAngles = new Map<string, number>();
    const n = spec.symbols.length;
    spec.symbols.forEach((sym, idx) => {
      symbolAngles.set(sym.id, reelSymbolAngle(idx, n));
    });

    const reels: ReelRig[] = [];
    const reelParts = getPrefabParts(prefab, 'reel-');
    for (let i = 0; i < Math.min(spec.reelCount, reelParts.length); i++) {
      const pivot = reelParts[i];
      let reelMesh: THREE.Mesh | null = null;
      pivot.traverse((c) => {
        if (!reelMesh && c instanceof THREE.Mesh) reelMesh = c;
      });
      if (reelMesh) {
        const mesh = reelMesh as THREE.Mesh;
        const params = (mesh.geometry as THREE.CylinderGeometry).parameters;
        const radius = params?.radiusTop ?? 0.065;
        const width = params?.height ?? 0.1;
        mesh.geometry = getDrumGeo(radius, width);
        mesh.material = [drumMat, sideMat, sideMat];
        mesh.rotation.set(0, 0, 0);
      }
      const initAngle = symbolAngles.get(spec.symbols[i % n].id) ?? 0;
      pivot.rotation.x = initAngle;
      reels.push({ pivot, angle: initAngle, targetAngle: initAngle, speed: 0 });
    }

    // Marquee plaque mounted onto the prefab's named `marquee` part
    const marqueePart = getPrefabPart(prefab, 'marquee');
    if (marqueePart) {
      root.updateMatrixWorld(true);
      const localBox = new THREE.Box3().setFromObject(marqueePart);
      localBox.applyMatrix4(root.matrixWorld.clone().invert());
      const lCenter = localBox.getCenter(new THREE.Vector3());
      const lSize = localBox.getSize(new THREE.Vector3());
      const marqueeMat = new THREE.MeshBasicMaterial({ map: buildMarqueeTexture(spec.name) });
      const marquee = new THREE.Mesh(
        new THREE.PlaneGeometry(Math.max(0.2, lSize.x * 0.94), Math.max(0.08, lSize.y * 0.88)),
        marqueeMat,
      );
      marquee.position.set(lCenter.x, lCenter.y, localBox.max.z + 0.002);
      root.add(marquee);
    }

    // Animated pull lever pivot from the prefab
    const leverPivot = getPrefabPart(prefab, 'lever');

    // Jackpot beacon material cloned per machine from the prefab's `beacon` part
    const beaconObj = getPrefabPart(prefab, 'beacon');
    let beaconMat: THREE.MeshStandardMaterial | null = null;
    let beaconBaseColor = 0xe0245e;
    if (beaconObj instanceof THREE.Mesh) {
      const srcMat = beaconObj.material as THREE.MeshBasicMaterial | THREE.MeshLambertMaterial;
      beaconBaseColor = srcMat.color ? srcMat.color.getHex() : 0xe0245e;
      beaconMat = new THREE.MeshStandardMaterial({
        color: beaconBaseColor,
        emissive: 0x550018,
        emissiveIntensity: 0.6,
        roughness: 0.25,
      });
      beaconObj.material = beaconMat;
    }

    root.traverse((obj) => {
      obj.userData.slotMachineId = p.id;
    });
    pickables.push(root);

    machines.set(p.id, {
      placement: p,
      def,
      root,
      reels,
      leverPivot,
      leverPull: 0,
      beaconMat,
      beaconBaseColor,
      symbolAngles,
    });
  }

  let flashT = 0;

  return {
    triggerPull(machineId: string): void {
      const m = machines.get(machineId);
      if (m) m.leverPull = 1;
    },

    sync(activeId: string, st: SlotState, dt: number): void {
      flashT += dt;
      for (const [id, m] of machines) {
        // Lever spring-back animation around its prefab pivot
        if (m.leverPull > 0) {
          m.leverPull = Math.max(0, m.leverPull - dt * 2.6);
        }
        if (m.leverPivot) {
          m.leverPivot.rotation.x = Math.sin(m.leverPull * Math.PI) * 0.85;
        }

        if (id !== activeId) {
          if (m.beaconMat) {
            m.beaconMat.emissive.setHex(0x550018);
            m.beaconMat.emissiveIntensity = 0.4;
          }
          continue;
        }

        // Active machine reels roll around their X axis
        for (let i = 0; i < m.reels.length; i++) {
          const r = m.reels[i];
          const target = m.symbolAngles.get(st.reels[i]) ?? 0;
          if (st.phase === 'spinning' && !st.stopped[i]) {
            r.speed = Math.min(22, r.speed + dt * 65);
            r.angle = (r.angle + r.speed * dt) % (Math.PI * 2);
          } else {
            r.speed = 0;
            let diff = (target - r.angle) % (Math.PI * 2);
            if (diff > Math.PI) diff -= Math.PI * 2;
            if (diff < -Math.PI) diff += Math.PI * 2;
            r.angle += Math.abs(diff) < 0.001 ? diff : diff * Math.min(1, dt * 18);
          }
          r.pivot.rotation.x = r.angle;
        }

        // Beacon flash on win / jackpot
        if (m.beaconMat) {
          if (st.phase === 'payout' && st.lastWin > 0) {
            const pulse = 0.5 + 0.5 * Math.sin(flashT * (st.jackpot ? 22 : 12));
            m.beaconMat.emissive.setHex(st.jackpot ? 0xffcc33 : 0xff3060);
            m.beaconMat.emissiveIntensity = 0.6 + pulse * 1.8;
          } else {
            m.beaconMat.emissive.setHex(0x550018);
            m.beaconMat.emissiveIntensity = st.phase === 'spinning' ? 1.1 : 0.45;
          }
        }
      }
    },

    pick(raycaster: THREE.Raycaster): string | null {
      const hits = raycaster.intersectObjects(pickables, true);
      for (const h of hits) {
        const id = h.object.userData.slotMachineId;
        if (typeof id === 'string') return id;
      }
      return null;
    },

    cameraTarget(machineId: string): { pos: THREE.Vector3; look: THREE.Vector3 } {
      const m = machines.get(machineId) ?? machines.values().next().value!;
      const target = getPrefabInteractTarget(m.root, m.def);
      if (target) {
        return {
          pos: target.camera ?? target.stand.clone().add(new THREE.Vector3(0, 1.1, 0.3)),
          look: target.lookAt,
        };
      }
      const p = m.placement;
      return {
        pos: new THREE.Vector3(p.x + Math.sin(p.yaw) * 1.1, 1.04, p.z + Math.cos(p.yaw) * 1.1),
        look: new THREE.Vector3(p.x, 0.88, p.z),
      };
    },

    gnomeSpot(machineId: string): { pos: THREE.Vector3; facing: number } {
      const m = machines.get(machineId) ?? machines.values().next().value!;
      const target = getPrefabInteractTarget(m.root, m.def);
      if (target) return { pos: target.stand, facing: target.facing };
      const p = m.placement;
      return {
        pos: new THREE.Vector3(p.x + Math.sin(p.yaw) * 0.82, 0, p.z + Math.cos(p.yaw) * 0.82),
        facing: p.yaw + Math.PI,
      };
    },
  };
}
