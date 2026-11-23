// Every gnome DayG shows (the player, NPC gnomes from the sim's look seeds, the Hatless) comes from @lawn/gnome through
// makeGnome, scaled to GNOME_HEIGHT. A Hatless is the same model with the hat off and moss on top (no separate model).
import * as THREE from 'three';
import { createGnomeModel, getMyGnome, type EquipSlot, type GnomeLook, type GnomeModel } from '@lawn/gnome';
import { COLORS, GNOME_HEIGHT } from '../config';

/** DayG's own default: a dusty brown coat, grey-green hat, white beard. */
export const FALLBACK_LOOK: GnomeLook = {
  hat: 0x6f7d66, shirt: 0x7a6248, pants: 0x4a3b2c, skin: 0xe8b88a, boots: 0x2a2420, beard: 0xf2f2ee,
  hair: null, freckles: false, dress: false, glasses: false, bowlCut: null,
};

export function playerLook(): GnomeLook { return getMyGnome()?.look ?? FALLBACK_LOOK; }

// Earthy palettes for the people of the Yard (NPC looks are deterministic from the sim's look seed).
const HATS = [0x8a3b2e, 0x6f7d66, 0x9a7b3c, 0x5b4a6e, 0x7a4f2a, 0x4e6a5a, 0xa0623a, 0x6b5b3e, 0x8c8470, 0x3f5470];
const COATS = [0x7a6248, 0x5e6b4a, 0x8b6f47, 0x4f5a62, 0x6d4c3d, 0x9a8a6a, 0x5a4a3a, 0x6a7258, 0x7d5a44, 0x4a5246];
const TROUSERS = [0x4a3b2c, 0x3d4436, 0x5a4b3a, 0x33393e, 0x5c4a34, 0x463a30, 0x3e4a3c, 0x55483e, 0x2f3530];
const SKINS = [0xe8b88a, 0xf1c27d, 0xd9a273, 0xc68e5e, 0xa86f48, 0x8a5a3a];
const BOOTS = [0x2a2420, 0x3b2e22, 0x4a3a2a, 0x222222, 0x35302a];
const BEARDS: (number | null)[] = [0xf2f2ee, 0xdedad0, 0xb8b0a0, 0x8a7a66, 0x5a4a3a, 0xc9b38a, null];
const HAIRS = [0x5a4a3a, 0x8a6a44, 0xc9b38a, 0x3a2e24, 0xb0a898];

/** Small seeded generator (mulberry32) so a look seed always gives the same gnome. */
function seeded(seed: number): () => number {
  let a = (Math.floor(seed) ^ 0x9e3779b9) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T>(list: readonly T[], r: () => number): T => list[Math.floor(r() * list.length) % list.length];

export function npcLook(seed: number): GnomeLook {
  const r = seeded(seed);
  const hat = pick(HATS, r), shirt = pick(COATS, r), pants = pick(TROUSERS, r);
  const skin = pick(SKINS, r), boots = pick(BOOTS, r);
  const beard = pick(BEARDS, r);
  const hair = beard === null || r() < 0.2 ? { color: pick(HAIRS, r), style: 'pigtails' as const } : null;
  return { hat, shirt, pants, skin, boots, beard, hair, freckles: r() < 0.2, dress: r() < 0.15, glasses: r() < 0.15, bowlCut: null };
}

const _a = new THREE.Color();
const _b = new THREE.Color();
function lerpHex(hex: number, toward: number, t: number): number {
  return _a.setHex(hex).lerp(_b.setHex(toward), t).getHex();
}

/** npcLook(seed) with every colour lerped 50% toward grey-green. */
export function hatlessLook(seed: number): GnomeLook {
  const l = npcLook(seed);
  const g = (hex: number): number => lerpHex(hex, COLORS.moss, 0.5);
  return {
    ...l, hat: g(l.hat), shirt: g(l.shirt), pants: g(l.pants), skin: g(l.skin), boots: g(l.boots),
    beard: l.beard === null ? null : g(l.beard), hair: l.hair ? { ...l.hair, color: g(l.hair.color) } : null,
  };
}

/** Uniform scale that makes a bare model GNOME_HEIGHT tall; measured once on the first model and cached. */
let scaleFactor = 0;
function measureScale(look: GnomeLook): number {
  if (scaleFactor > 0) return scaleFactor;
  const ref = createGnomeModel({ ...look, equipment: undefined });
  ref.object.updateMatrixWorld(true);
  const h = new THREE.Box3().setFromObject(ref.object, true).getSize(new THREE.Vector3()).y;
  scaleFactor = h > 0 ? GNOME_HEIGHT / h : 1;
  ref.object.traverse((o) => {
    if (o instanceof THREE.Mesh) o.geometry.dispose();
  });
  return scaleFactor;
}

const ARMS_FORWARD = 0.45; // Hatless: arms hang slightly forward (rad)
let clumpGeo: THREE.SphereGeometry | null = null;
let clumpMats: THREE.MeshStandardMaterial[] | null = null;

function mossify(model: GnomeModel): void {
  if (model.hat) model.hat.visible = false;
  model.setEquipmentOverride?.('head', true);
  const moss = new THREE.Color(COLORS.moss);
  const cloned = new Map<THREE.Material, THREE.Material>();
  model.object.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const tint = (m: THREE.Material): THREE.Material => {
      let c = cloned.get(m);
      if (!c) {
        c = m.clone();
        const col = (c as THREE.Material & { color?: THREE.Color }).color;
        if (col instanceof THREE.Color) col.lerp(moss, 0.35);
        cloned.set(m, c);
      }
      return c;
    };
    o.material = Array.isArray(o.material) ? o.material.map(tint) : tint(o.material);
  });
  // Moss clumps: small squashed grey-green spheres on the shoulders and head (model units, before the scale).
  clumpGeo ??= new THREE.SphereGeometry(0.06, 8, 6);
  clumpMats ??= [
    new THREE.MeshStandardMaterial({ color: COLORS.moss, roughness: 1 }),
    new THREE.MeshStandardMaterial({ color: COLORS.mossDark, roughness: 1 }),
  ];
  const spots: [number, number, number, number][] = [
    [0.2, 0.66, 0.02, 1.1], [-0.21, 0.67, -0.03, 0.9], [0.13, 0.69, -0.08, 0.7],
    [0.04, 0.96, -0.02, 1.2], [-0.09, 0.93, 0.05, 0.8], [0.1, 0.9, -0.1, 0.9], [-0.06, 0.84, -0.15, 0.8],
  ];
  spots.forEach(([x, y, z, s], i) => {
    const clump = new THREE.Mesh(clumpGeo!, clumpMats![i % 2]);
    clump.position.set(x, y, z);
    clump.scale.set(s, s * 0.5, s);
    clump.castShadow = true;
    model.rig.add(clump);
  });
}

export function makeGnome(look: GnomeLook, opts?: { hatless?: boolean; overrideEquipment?: EquipSlot[] }): GnomeModel {
  const s = measureScale(look);
  const model = createGnomeModel(look, { overrideEquipment: opts?.overrideEquipment });
  model.object.scale.setScalar(s);
  if (!opts?.hatless) return model;
  mossify(model);
  const baseUpdate = model.update.bind(model);
  model.arms.left.rotation.x -= ARMS_FORWARD;
  model.arms.right.rotation.x -= ARMS_FORWARD;
  model.update = (p, dt) => {
    // Undo last frame's offset first: the model lerps some poses from the current angle.
    model.arms.left.rotation.x += ARMS_FORWARD;
    model.arms.right.rotation.x += ARMS_FORWARD;
    baseUpdate(p, dt);
    model.arms.left.rotation.x -= ARMS_FORWARD;
    model.arms.right.rotation.x -= ARMS_FORWARD;
  };
  return model;
}
