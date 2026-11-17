// 3D slot machine bank in the lounge: @lawn/prefabs cabinets, spinning canvas-textured reel drums,
// animated pull levers, jackpot dome flash, and raycast picking.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { getSlotSpec } from './catalog';
import type { SlotPlacement, SlotState, SlotSymbol } from './types';

export const SLOT_PLACEMENTS: readonly SlotPlacement[] = [
  { id: 'slot-1', machineType: 'classic-3bar', x: 4.15, z: -0.35, yaw: -Math.PI / 2, tint: 'red', trim: 'brass' },
  { id: 'slot-2', machineType: 'classic-3bar', x: 4.15, z: 0.55, yaw: -Math.PI / 2, tint: 'blue', trim: 'gold' },
  { id: 'slot-3', machineType: 'classic-3bar', x: 4.15, z: 1.45, yaw: -Math.PI / 2, tint: 'emerald', trim: 'brass' },
];

interface ReelRig {
  mesh: THREE.Mesh;
  angle: number;
  targetAngle: number;
  speed: number;
}

interface MachineRig {
  placement: SlotPlacement;
  root: THREE.Group;
  reels: ReelRig[];
  leverPivot: THREE.Group;
  leverPull: number;
  domeMat: THREE.MeshStandardMaterial;
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

function buildReelTexture(symbols: readonly SlotSymbol[]): THREE.CanvasTexture {
  const w = 128;
  const slotH = 128;
  const h = slotH * symbols.length;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d') as CanvasRenderingContext2D;

  ctx.fillStyle = '#faf5e8';
  ctx.fillRect(0, 0, w, h);

  symbols.forEach((sym, i) => {
    const y0 = i * slotH;
    // Divider line
    ctx.fillStyle = '#d4c8aa';
    ctx.fillRect(0, y0, w, 4);
    ctx.fillRect(0, y0 + slotH - 4, w, 4);

    const cx = w / 2;
    const cy = y0 + slotH / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (sym.id === 'BAR3') {
      ctx.fillStyle = '#1d1d22';
      for (const dy of [-28, 0, 28]) {
        ctx.fillRect(18, cy + dy - 10, w - 36, 20);
        ctx.fillStyle = '#ffd54f';
        ctx.font = 'bold 16px system-ui, sans-serif';
        ctx.fillText('BAR', cx, cy + dy + 1);
        ctx.fillStyle = '#1d1d22';
      }
    } else if (sym.id === 'BAR') {
      ctx.fillStyle = '#1d1d22';
      ctx.fillRect(14, cy - 22, w - 28, 44);
      ctx.strokeStyle = '#ffd54f';
      ctx.lineWidth = 3;
      ctx.strokeRect(16, cy - 20, w - 32, 40);
      ctx.fillStyle = '#ffd54f';
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.fillText('BAR', cx, cy + 2);
    } else if (sym.id === '7') {
      ctx.fillStyle = '#d92626';
      ctx.font = '900 76px Georgia, serif';
      ctx.fillText('7', cx, cy + 4);
      ctx.strokeStyle = '#ffd54f';
      ctx.lineWidth = 3;
      ctx.strokeText('7', cx, cy + 4);
    } else {
      ctx.fillStyle = sym.color;
      ctx.font = '62px system-ui, sans-serif';
      ctx.fillText(sym.glyph, cx, cy + 4);
    }
  });

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
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

  // Red velvet carpet runner beneath the slot bank
  const rug = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.012, 2.95),
    new THREE.MeshStandardMaterial({ color: 0x6b1420, roughness: 0.92 }),
  );
  rug.position.set(3.95, 0.006, 0.55);
  rug.receiveShadow = true;
  bankGroup.add(rug);

  // Warm overhead light for the slot bank
  const bankLight = new THREE.PointLight(0xffd28a, 3.8, 7, 1.4);
  bankLight.position.set(3.4, 2.35, 0.55);
  bankGroup.add(bankLight);

  const machines = new Map<string, MachineRig>();
  const pickables: THREE.Object3D[] = [];
  const texCache = new Map<string, THREE.CanvasTexture>();

  for (const p of SLOT_PLACEMENTS) {
    const spec = getSlotSpec(p.machineType);
    const root = new THREE.Group();
    root.position.set(p.x, 0, p.z);
    root.rotation.y = p.yaw;
    bankGroup.add(root);

    // Base prefab cabinet (without lights to keep total scene lights fast)
    const prefab = buildPrefab(spec.prefabId, {
      tint: p.tint ?? spec.tint,
      trim: p.trim ?? spec.trim,
      lights: false,
    });
    root.add(prefab);

    // Textured reel drums overlaid in the reel window
    let reelTex = texCache.get(spec.id);
    if (!reelTex) {
      reelTex = buildReelTexture(spec.symbols);
      texCache.set(spec.id, reelTex);
    }
    const drumGeo = new THREE.CylinderGeometry(0.072, 0.072, 0.102, 21, 1, false);
    const drumMat = new THREE.MeshStandardMaterial({ map: reelTex, roughness: 0.35 });
    const sideMat = new THREE.MeshStandardMaterial({ color: 0xd4c8aa, roughness: 0.5 });

    const symbolAngles = new Map<string, number>();
    const n = spec.symbols.length;
    spec.symbols.forEach((sym, idx) => {
      // Three.js CylinderGeometry UVs map u=0..1 around Y; align symbol idx to face +z
      const angle = ((idx + 0.5) / n) * Math.PI * 2;
      symbolAngles.set(sym.id, angle);
    });

    const reels: ReelRig[] = [];
    const xs = [-0.125, 0, 0.125];
    for (let i = 0; i < spec.reelCount; i++) {
      const drum = new THREE.Mesh(drumGeo, [drumMat, sideMat, sideMat]);
      drum.rotation.z = Math.PI / 2;
      // Rotate cylinder around its local Y (which is world X after z=90deg)
      const pivot = new THREE.Group();
      pivot.position.set(xs[i] ?? 0, 0.88, 0.178);
      pivot.add(drum);
      root.add(pivot);
      const initAngle = symbolAngles.get(spec.symbols[i % n].id) ?? 0;
      drum.rotation.y = initAngle;
      reels.push({ mesh: drum, angle: initAngle, targetAngle: initAngle, speed: 0 });
    }

    // Marquee plaque
    const marqueeMat = new THREE.MeshBasicMaterial({ map: buildMarqueeTexture(spec.name) });
    const marquee = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.11), marqueeMat);
    marquee.position.set(0, 1.19, 0.153);
    root.add(marquee);

    // Animated pull lever on right side
    const leverPivot = new THREE.Group();
    leverPivot.position.set(0.33, 0.72, 0);
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.017, 0.017, 0.34, 8),
      new THREE.MeshStandardMaterial({ color: 0xcfd6de, metalness: 0.6, roughness: 0.3 }),
    );
    shaft.position.set(0, 0.17, 0);
    const knob = new THREE.Mesh(
      new THREE.SphereGeometry(0.046, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xd92626, roughness: 0.25 }),
    );
    knob.position.set(0, 0.35, 0);
    leverPivot.add(shaft, knob);
    root.add(leverPivot);

    // Jackpot topper dome
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0xe0245e,
      emissive: 0x550018,
      emissiveIntensity: 0.6,
      roughness: 0.25,
    });
    const dome = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.066, 0.085, 10), domeMat);
    dome.position.set(0, 1.325, -0.04);
    root.add(dome);

    root.traverse((obj) => {
      obj.userData.slotMachineId = p.id;
    });
    pickables.push(root);

    machines.set(p.id, {
      placement: p,
      root,
      reels,
      leverPivot,
      leverPull: 0,
      domeMat,
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
        // Lever spring-back animation
        if (m.leverPull > 0) {
          m.leverPull = Math.max(0, m.leverPull - dt * 2.6);
        }
        const pullAngle = Math.sin(m.leverPull * Math.PI) * 0.95;
        m.leverPivot.rotation.x = 0.22 + pullAngle;

        if (id !== activeId) {
          m.domeMat.emissiveIntensity = 0.4;
          continue;
        }

        // Active machine reels
        for (let i = 0; i < m.reels.length; i++) {
          const r = m.reels[i];
          const target = m.symbolAngles.get(st.reels[i]) ?? 0;
          if (st.phase === 'spinning' && !st.stopped[i]) {
            r.speed = Math.min(22, r.speed + dt * 65);
            r.angle = (r.angle + r.speed * dt) % (Math.PI * 2);
          } else {
            r.speed = 0;
            // Ease smoothly to exact target symbol angle
            let diff = (target - r.angle) % (Math.PI * 2);
            if (diff > Math.PI) diff -= Math.PI * 2;
            if (diff < -Math.PI) diff += Math.PI * 2;
            r.angle += diff * Math.min(1, dt * 18);
          }
          r.mesh.rotation.y = r.angle;
        }

        // Dome flash on win / jackpot
        if (st.phase === 'payout' && st.lastWin > 0) {
          const pulse = 0.5 + 0.5 * Math.sin(flashT * (st.jackpot ? 22 : 12));
          m.domeMat.emissive.setHex(st.jackpot ? 0xffcc33 : 0xff3060);
          m.domeMat.emissiveIntensity = 0.6 + pulse * 1.8;
        } else {
          m.domeMat.emissive.setHex(0x550018);
          m.domeMat.emissiveIntensity = st.phase === 'spinning' ? 1.1 : 0.45;
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
      const p = m.placement;
      // Forward vector of machine (+z rotated by yaw)
      const fwdX = Math.sin(p.yaw);
      const fwdZ = Math.cos(p.yaw);
      const rightX = Math.cos(p.yaw);
      const rightZ = -Math.sin(p.yaw);
      // Slight 3/4 angle so both the reels and the side lever are clearly visible
      const pos = new THREE.Vector3(
        p.x + fwdX * 1.32 + rightX * 0.22,
        1.12,
        p.z + fwdZ * 1.32 + rightZ * 0.22,
      );
      const look = new THREE.Vector3(p.x, 0.86, p.z);
      return { pos, look };
    },

    gnomeSpot(machineId: string): { pos: THREE.Vector3; facing: number } {
      const m = machines.get(machineId) ?? machines.values().next().value!;
      const p = m.placement;
      const fwdX = Math.sin(p.yaw);
      const fwdZ = Math.cos(p.yaw);
      const rightX = Math.cos(p.yaw);
      const rightZ = -Math.sin(p.yaw);
      const pos = new THREE.Vector3(
        p.x + fwdX * 0.82 - rightX * 0.36,
        0,
        p.z + fwdZ * 0.82 - rightZ * 0.36,
      );
      const facing = Math.atan2(p.x - pos.x, p.z - pos.z);
      return { pos, facing };
    },
  };
}
