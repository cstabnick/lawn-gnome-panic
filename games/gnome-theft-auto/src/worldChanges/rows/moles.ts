// World changes W06, W13 (E18): the moles come up: the Burrow Door lantern and sign; the root stall on Bodega's street.
// W13's stall is visual only (no buy hook). Props have no colliders (rules: ../registry.ts).
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { registerWorldChange, type WorldChangeCtx } from '../registry';
import { coastSign } from '../../coast/sign';

const DOOR = { x: -1000, z: 300 };
const SOIL = 0x4a3524;

/** Place an object on the ground at (x, z), scaled, facing yaw. */
function put(ctx: WorldChangeCtx, root: THREE.Group, g: THREE.Object3D, x: number, z: number, yaw = 0, s = 1, dy = 0): THREE.Object3D {
  g.position.set(x, ctx.groundY(x, z) + dy, z);
  g.rotation.y = yaw;
  g.scale.setScalar(s);
  root.add(g);
  return g;
}

/** A low dark mound of soil (the sand-mound prefab, shrunk and recoloured). */
function molehill(ctx: WorldChangeCtx, root: THREE.Group, x: number, z: number, s = 0.1): void {
  const m = buildPrefab('sand-mound');
  m.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
    mat.color.setHex(SOIL);
    mesh.material = mat;
  });
  put(ctx, root, m, x, z, 0, s);
}

function mole(ctx: WorldChangeCtx, root: THREE.Group, id: string, x: number, z: number, yaw: number, dy = 0): THREE.Object3D {
  return put(ctx, root, buildPrefab(id), x, z, yaw, 1, dy);
}

registerWorldChange('W06', (ctx) => {
  const root = new THREE.Group();
  // The lantern: camp lantern post, glass recoloured to a green flame.
  const lantern = buildPrefab('camp-lantern-post');
  const glows: THREE.MeshStandardMaterial[] = [];
  lantern.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    if (mat.emissive && mat.emissive.getHex() !== 0) {
      const c = mat.clone();
      c.emissive.setHex(0x3dff6a);
      c.color.setHex(0x9dffb0);
      mesh.material = c;
      glows.push(c);
    }
  });
  put(ctx, root, lantern, DOOR.x - 6, DOOR.z + 5, 0);
  // The board at the west edge, facing east toward the wood.
  const sign = coastSign('MOLES ARE NEIGHBOURS', { w: 2.6, h: 1.2, bg: 0xd9c9a0, fg: 0x2f4a22, post: 1.0 });
  put(ctx, root, sign, DOOR.x - 8, DOOR.z + 7, Math.PI / 2 - 0.3);
  // Molehill and the young mole beside the sign.
  const hx = DOOR.x - 8;
  const hz = DOOR.z + 9.5;
  molehill(ctx, root, hx, hz, 0.1);
  const pup = mole(ctx, root, 'mole-pup', hx, hz, Math.PI / 2, -0.45);
  const baseY = pup.position.y;
  return {
    root,
    update(_dt, t) {
      const k = (t % 8) / 8;
      const up = k > 0.55 && k < 0.85 ? Math.sin(((k - 0.55) / 0.3) * Math.PI) : 0;
      pup.position.y = baseY + 0.5 * up;
      const n = ctx.night();
      for (const m of glows) m.emissiveIntensity = 0.8 + 1.6 * n;
    },
  };
});

registerWorldChange('W13', (ctx) => {
  const root = new THREE.Group();
  // The stall beside Bodega & Sons (door at (-78, 90), front facing the x = -60 road): 12 m south of the door,
  // off the road lanes and the pavement mark.
  const sx = -76;
  const sz = 102;
  const yaw = Math.PI / 2;
  put(ctx, root, buildPrefab('wooden-cart'), sx, sz, yaw, 0.8);
  for (const [dx, dz, s] of [[0.0, -0.3, 0.12], [0.1, 0.35, 0.09], [-0.2, 0.0, 0.1]] as const) {
    put(ctx, root, buildPrefab('giant-spotted-toadstool'), sx + dx, sz + dz, 0, s, 0.55);
  }
  put(ctx, root, buildPrefab('soil-sack'), sx + 0.4, sz - 1.0, 0.4);
  put(ctx, root, coastSign('ROOTS. HONEST.', { w: 1.6, h: 0.6, bg: 0xd9c9a0, fg: 0x4a2f1a, post: 0 }), sx + 1.05, sz, yaw, 1, 0.5);
  mole(ctx, root, 'burrowfolk-mole', sx - 1.3, sz, yaw);
  // Molehills with moles in plain sight: Mossy Wood edge by the Burrow Door, and Tallgrass Commons.
  const spots: Array<[number, number]> = [[DOOR.x - 14, DOOR.z - 6], [DOOR.x - 12, DOOR.z + 16], [-722, 424], [-714, 416]];
  spots.forEach(([x, z], i) => {
    molehill(ctx, root, x, z, 0.1);
    mole(ctx, root, i % 2 ? 'mole-pup' : 'burrowfolk-mole', x + 1.4, z, i * 1.3, 0);
  });
  return { root };
});
