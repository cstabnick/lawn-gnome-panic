// 28 lore-rich micro-details and ambient vignettes scattered across Turfton and the four outer biomes.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { CITY_HALF, HIGHWAYS, ROAD_LINES } from './config';
import { placeOnGround } from './terrainMesh';
import type { Box, Hud } from './types';

export interface DetailProp {
  id: string;
  scale?: number;
  dx?: number;
  dy?: number;
  dz?: number;
  yaw?: number;
  tiltX?: number;
  spin?: number;
  bob?: number;
}

export interface WorldDetail {
  id: string;
  x: number;
  z: number;
  radius?: number;
  toast: string;
  props: readonly DetailProp[];
}

export const WORLD_DETAILS: readonly WorldDetail[] = [
  // ---- Turfton Downtown & Districts (10) ----
  {
    id: 'toaster-altar',
    x: -74,
    z: 74,
    toast: 'Porcelain Shrine: A cursed toaster sits on a crate, still warm. Nobody agrees if it is an altar.',
    props: [
      { id: 'brick-stack', scale: 1.2, dy: 0 },
      { id: 'cursed-toaster', scale: 1.1, dy: 0.52, yaw: 0.4 },
      { id: 'porcelain-lantern', scale: 0.85, dx: 0.8, dz: 0.3 },
    ],
  },
  {
    id: 'park-flowerpot-keys',
    x: -18,
    z: 22,
    toast: 'Spare Keys: Three brass mower keys tucked inside a terracotta flowerpot.',
    props: [
      { id: 'flower-pot', scale: 1.1, dy: 0 },
      { id: 'toadstool-seat', scale: 1.0, dx: 1.1, dz: -0.4 },
    ],
  },
  {
    id: 'park-disc-golf',
    x: -44,
    z: 18,
    toast: 'Turfton Park: Someone chained a disc-golf basket to a tree stump for "precision acorn tossing."',
    props: [
      { id: 'tree-stump', scale: 1.1 },
      { id: 'disc-golf-basket', scale: 1.15, dx: 1.4, dz: 0.5 },
    ],
  },
  {
    id: 'greenhouse-neon-flamingo',
    x: 88,
    z: 28,
    toast: 'Greenhouse Strip: Two plastic flamingos guarding a suspiciously bright mushroom lamp.',
    props: [
      { id: 'lawn-flamingo', scale: 1.2, dx: -0.7, yaw: 0.5 },
      { id: 'lawn-flamingo', scale: 1.2, dx: 0.7, yaw: -0.5 },
      { id: 'mushroom-lamp', scale: 1.1, dz: -0.4 },
    ],
  },
  {
    id: 'patio-putting-hazard',
    x: 168,
    z: -168,
    toast: 'Patio Heights Country Club: An HOA-approved porcelain cat watching a golden remote.',
    props: [
      { id: 'porcelain-cat', scale: 1.15, yaw: -0.3 },
      { id: 'golden-remote', scale: 1.2, dx: 0.8, dy: 0.15, bob: 1 },
      { id: 'lawn-sprinkler', scale: 1.0, dx: -1.6, dz: 0.8, spin: 3.2 },
    ],
  },
  {
    id: 'city-hall-caliper-post',
    x: 16,
    z: -78,
    toast: 'City Hall Lawn: A sign reading "GRASS HEIGHT OVER 2 INCHES WILL BE CITED."',
    props: [
      { id: 'signpost', scale: 1.2, yaw: 0.2 },
      { id: 'picket-fence', scale: 1.1, dx: 1.3, dz: -0.2 },
    ],
  },
  {
    id: 'clay-mart-returns',
    x: -132,
    z: 132,
    toast: 'Clay-Mart Loading Dock: A brick stack of unsold "Some Assembly Required" kits.',
    props: [
      { id: 'brick-stack', scale: 1.4 },
      { id: 'wheelbarrow', scale: 1.2, dx: 1.6, dz: 0.4, yaw: 0.9 },
    ],
  },
  {
    id: 'gnomecino-lucky-duck',
    x: 78,
    z: -44,
    toast: 'Gnomecino Alley: A lucky rubber duck left behind after Tuesday\'s half-price acorn-poker.',
    props: [
      { id: 'picnic-table', scale: 1.1, yaw: 0.3 },
      { id: 'rubber-duck', scale: 1.3, dy: 0.78, bob: 0.7 },
    ],
  },
  {
    id: 'amphitheater-pretzel-stall',
    x: -74,
    z: -102,
    toast: 'Amphitheater Steps: An abandoned acorn-pretzel stall still smelling of warm cinnamon.',
    props: [
      { id: 'market-stall', scale: 1.2, yaw: 0.8 },
      { id: 'flower-pot', scale: 1.0, dx: 1.8, dz: 0.9 },
    ],
  },
  {
    id: 'hospital-denture-bench',
    x: 18,
    z: 48,
    toast: 'Glaze Clinic Courtyard: Someone left a pair of porcelain dentures on the bench.',
    props: [
      { id: 'toadstool-seat', scale: 1.2 },
      { id: 'grandpa-dentures', scale: 1.3, dy: 0.55, bob: 0.5 },
    ],
  },

  // ---- Mossy Wood & Compost Heap (6) ----
  {
    id: 'unmowed-glaze-shrine',
    x: -366,
    z: 24,
    toast: 'Mossy Wood Shrine: An ancient glaze shrine draped in clover.',
    props: [
      { id: 'glaze-shrine', scale: 1.3 },
      { id: 'stepping-stone', scale: 1.1, dz: 1.5 },
      { id: 'mushroom-lamp', scale: 1.0, dx: -1.2, dz: 0.4 },
    ],
  },
  {
    id: 'moss-giant-flower-ring',
    x: -280,
    z: 92,
    toast: 'Fescue Clearing: Giant wildflowers blooming out of a cracked terracotta pot.',
    props: [
      { id: 'giant-flower', scale: 1.4 },
      { id: 'giant-flower', scale: 1.1, dx: 1.3, dz: 0.8, yaw: 1.1 },
      { id: 'toadstool-seat', scale: 1.0, dx: -1.1, dz: 0.6 },
    ],
  },
  {
    id: 'compost-campfire',
    x: -238,
    z: -74,
    toast: 'Compost Heap Edge: A warm pine-cone campfire where Local 404 takes union breaks.',
    props: [
      { id: 'campfire', scale: 1.3 },
      { id: 'tree-stump', scale: 1.0, dx: -1.4, dz: 0.4 },
      { id: 'tree-stump', scale: 1.0, dx: 1.3, dz: -0.6 },
    ],
  },
  {
    id: 'porch-lantern-memorial',
    x: -542,
    z: 26,
    toast: 'Porch Trail: A row of porcelain lanterns marking the safe path for escaped figurines.',
    props: [
      { id: 'porcelain-lantern', scale: 1.2, dx: -1.0 },
      { id: 'porcelain-lantern', scale: 1.2, dx: 1.0, dz: 0.8 },
      { id: 'garden-rock', scale: 1.1, dz: -0.7 },
    ],
  },
  {
    id: 'moss-wishing-well',
    x: -410,
    z: -110,
    toast: 'Mossy Wood Well: Echoes faintly with 88.7 Fescue Public Radio.',
    props: [
      { id: 'village-well', scale: 1.2 },
      { id: 'stepping-stone', scale: 1.0, dx: 1.5, dz: 1.0 },
    ],
  },
  {
    id: 'fence-overlook-gnome',
    x: -574,
    z: -120,
    toast: 'Fence-Line Overlook: A weathered statue staring through the knot-hole at the Tall Ones\' yard.',
    props: [
      { id: 'gnome-statue', scale: 1.3, yaw: -Math.PI / 2 },
      { id: 'mailbox', scale: 1.1, dx: 1.2, dz: 1.1 },
    ],
  },

  // ---- Cloverfield Farms & Southern Canal (6) ----
  {
    id: 'canal-rubber-ducks',
    x: -42,
    z: 230,
    toast: 'Southern Drainage Canal: Three rubber ducks bobbing past Baroness Brenda\'s border.',
    props: [
      { id: 'rubber-duck', scale: 1.5, dx: -1.2, bob: 1.4, yaw: 0.4 },
      { id: 'rubber-duck', scale: 1.2, dx: 0.5, dz: 1.1, bob: 1.7, yaw: -0.6 },
      { id: 'rubber-duck', scale: 1.4, dx: 1.6, dz: -0.5, bob: 1.2, yaw: 1.2 },
    ],
  },
  {
    id: 'cloverfield-mailbox-row',
    x: -36,
    z: 290,
    toast: 'Cloverfield Lane: Mailboxes stuffed with unpaid HOA grass-height citations.',
    props: [
      { id: 'mailbox', scale: 1.2, dx: -0.8 },
      { id: 'mailbox', scale: 1.2, dx: 0.8, yaw: 0.2 },
      { id: 'picket-fence', scale: 1.1, dz: -0.8 },
    ],
  },
  {
    id: 'cloverfield-hay-picnic',
    x: 42,
    z: 312,
    toast: 'Cloverfield Pasture: Hay bales stacked into a suspiciously cozy sniper blind.',
    props: [
      { id: 'hay-bale', scale: 1.3 },
      { id: 'hay-bale', scale: 1.2, dx: 1.4, dz: 0.3, yaw: 0.4 },
      { id: 'lawn-sprinkler', scale: 1.0, dx: -1.6, dz: 1.1, spin: 2.8 },
    ],
  },
  {
    id: 'biscuit-tennis-ball',
    x: 112,
    z: 392,
    toast: 'Rim of Biscuit\'s Nap: A dog-sized tennis ball wedged beside a garden rock.',
    props: [
      { id: 'tennis-ball', scale: 2.8, dy: 0.7 },
      { id: 'garden-rock', scale: 1.3, dx: 1.8, dz: -0.6 },
    ],
  },
  {
    id: 'canal-brenda-throne',
    x: 12,
    z: 228,
    toast: 'Sovereign Republic of New Puddle: Baroness Brenda\'s zip-tied flamingo guard.',
    props: [
      { id: 'lawn-flamingo', scale: 1.3, dx: -0.9, yaw: 0.4 },
      { id: 'toadstool-seat', scale: 1.2 },
      { id: 'porcelain-lantern', scale: 1.0, dx: 1.0, dz: 0.3 },
    ],
  },
  {
    id: 'south-gravestone-joke',
    x: -115,
    z: 425,
    toast: 'Old Orchard Edge: A gravestone reading "HERE LIES MY FIRST LAWNMOWER — 2004–2004."',
    props: [
      { id: 'gravestone', scale: 1.3, yaw: 0.2 },
      { id: 'flower-pot', scale: 1.0, dx: 0.9, dz: 0.7 },
    ],
  },

  // ---- Frostbite Fells (3) ----
  {
    id: 'fells-frozen-birdbath',
    x: 34,
    z: -378,
    toast: 'Frostbite Fells: A miniature birdbath frozen solid with a rubber duck perched on the rim.',
    props: [
      { id: 'birdbath', scale: 1.4 },
      { id: 'rubber-duck', scale: 1.0, dx: 0.3, dy: 1.15, yaw: 0.5 },
    ],
  },
  {
    id: 'fells-theo-woodpile',
    x: 64,
    z: -304,
    toast: 'Thermos Theo\'s Camp: A warm campfire and a stack of pine-cone fuel.',
    props: [
      { id: 'campfire', scale: 1.4 },
      { id: 'tree-stump', scale: 1.1, dx: 1.5, dz: 0.4 },
      { id: 'mushroom-lamp', scale: 1.0, dx: -1.3, dz: -0.5 },
    ],
  },
  {
    id: 'fells-shrine-stones',
    x: -46,
    z: -508,
    toast: 'Kiln-Resin Trail: Stepping stones dusted with frost leading to Father Loam\'s shrine.',
    props: [
      { id: 'stepping-stone', scale: 1.2, dz: 1.2 },
      { id: 'stepping-stone', scale: 1.2, dx: 0.4, dz: -0.2 },
      { id: 'glaze-shrine', scale: 1.15, dx: -1.2, dz: -1.0 },
    ],
  },

  // ---- The Dust Flats (3) ----
  {
    id: 'dust-tumbleweed-corral',
    x: 312,
    z: -42,
    toast: 'Dust Flats: A restless tumbleweed rolling in circles around a saguaro.',
    props: [
      { id: 'saguaro', scale: 1.3 },
      { id: 'tumbleweed', scale: 1.2, dx: 1.8, dy: 0.4, spin: 2.1 },
    ],
  },
  {
    id: 'dust-airfield-sign',
    x: 530,
    z: -124,
    toast: 'Desert Airfield: Wind-Sock Wally\'s "NO LOW PASSES OVER THE CHILI POT" signpost.',
    props: [
      { id: 'signpost', scale: 1.2, yaw: -0.8 },
      { id: 'barrel-cactus', scale: 1.1, dx: 1.3, dz: 0.6 },
    ],
  },
  {
    id: 'dust-lost-pencil',
    x: 245,
    z: 185,
    toast: 'Alkali Pan: Another Tall-One pencil stub jutting out of the sand like an obelisk.',
    props: [
      { id: 'tall-one-pencil', scale: 0.55, tiltX: 0.35, yaw: 0.6 },
      { id: 'garden-rock', scale: 1.2, dx: 1.4, dz: 0.9 },
    ],
  },
];

function isNearRoad(x: number, z: number, margin = 6.0): boolean {
  if (Math.abs(x) <= CITY_HALF && Math.abs(z) <= CITY_HALF) {
    for (const r of ROAD_LINES) {
      if (Math.abs(x - r) < margin || Math.abs(z - r) < margin) return true;
    }
  }
  for (const hw of HIGHWAYS) {
    for (let i = 0; i < hw.points.length - 1; i++) {
      const [ax, az] = hw.points[i];
      const [bx, bz] = hw.points[i + 1];
      const dx = bx - ax, dz = bz - az;
      const lenSq = dx * dx + dz * dz;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (lenSq || 1)));
      if (Math.hypot(x - (ax + t * dx), z - (az + t * dz)) < margin) return true;
    }
  }
  return false;
}

export function createWorldDetails(scene: THREE.Scene, hud: Hud, boxes: readonly Box[] = []): { update(dt: number, px: number, pz: number): void } {
  const animated: { mesh: THREE.Object3D; baseY: number; spin?: number; bob?: number; phase: number }[] = [];
  const cooldowns = new Map<string, number>();
  let elapsed = 0;

  for (let i = 0; i < WORLD_DETAILS.length; i++) {
    const d = WORLD_DETAILS[i];
    if (isNearRoad(d.x, d.z, 6.0)) continue;
    if (boxes.some((b) => d.x + 1.2 > b.minX && d.x - 1.2 < b.maxX && d.z + 1.2 > b.minZ && d.z - 1.2 < b.maxZ)) {
      continue;
    }
    const group = new THREE.Group();
    placeOnGround(group, d.x, d.z);
    for (const p of d.props) {
      const mesh = buildPrefab(p.id, { lights: false });
      if (p.scale) mesh.scale.setScalar(p.scale);
      mesh.position.set(p.dx ?? 0, p.dy ?? 0, p.dz ?? 0);
      if (p.yaw) mesh.rotation.y = p.yaw;
      if (p.tiltX) mesh.rotation.x = p.tiltX;
      mesh.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) o.castShadow = true;
      });
      group.add(mesh);
      if (p.spin || p.bob) {
        animated.push({ mesh, baseY: p.dy ?? 0, spin: p.spin, bob: p.bob, phase: i * 0.7 });
      }
    }
    scene.add(group);
  }

  return {
    update(dt: number, px: number, pz: number) {
      elapsed += dt;
      for (const a of animated) {
        if (a.spin) a.mesh.rotation.y += a.spin * dt;
        if (a.bob) a.mesh.position.y = a.baseY + Math.sin(elapsed * 2.4 * a.bob + a.phase) * 0.08;
      }
      for (const d of WORLD_DETAILS) {
        const cd = (cooldowns.get(d.id) ?? 0) - dt;
        if (cd > 0) {
          cooldowns.set(d.id, cd);
          continue;
        }
        if (Math.hypot(px - d.x, pz - d.z) <= (d.radius ?? 5.5)) {
          cooldowns.set(d.id, 35);
          hud.toast(d.toast, 4500);
          break;
        }
      }
    },
  };
}
