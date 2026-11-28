// World changes W08, W17 (E18): Side-Valve seized; after the Even Cut (rules: ../registry.ts).
// Side-Valve block centre (-150, 90); the bay door (a quest walk-in, stage 'side-valve-bay') is at (-150, 72) and the
// shopfront wall is at about z = 77 facing the apron (south, -z). W08 boards ONLY the west half of the frontage so the
// walk-in at x = -150 stays open; props sit >= 3 m from the stage marks. Props have no colliders.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { buildPrefab } from '@lawn/prefabs';
import { createGnomeModel, GNORMAN_LOOK } from '@lawn/gnome';
import { coastSign } from '../../coast/sign';
import { registerWorldChange, type WorldChangeCtx } from '../registry';

const FRONT_Z = 76.9; // outside face of the bay wall (awnings are drawn at z 76.8)
const BEIGE = 0xd9c8a5;

function put(ctx: WorldChangeCtx, root: THREE.Group, g: THREE.Object3D, x: number, z: number, yaw = 0, s = 1, dy = 0): THREE.Object3D {
  g.position.set(x, ctx.groundY(x, z) + dy, z);
  g.rotation.y = yaw;
  g.scale.setScalar(s);
  root.add(g);
  return g;
}

function gnome(ctx: WorldChangeCtx, root: THREE.Group, x: number, z: number, yaw: number, hat: number, shirt: number, dy = 0): THREE.Object3D {
  const m = createGnomeModel({ ...GNORMAN_LOOK, hat, shirt });
  return put(ctx, root, m.object, x, z, yaw, 1, dy);
}

/** Recolour a prefab instance: every mesh material cloned, colour set (and optionally glowing). */
function tint(g: THREE.Object3D, color: number, glow = false): THREE.MeshStandardMaterial[] {
  const mats: THREE.MeshStandardMaterial[] = [];
  g.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
    mat.color.setHex(color);
    if (glow && mat.emissive) mat.emissive.setHex(color);
    mesh.material = mat;
    mats.push(mat);
  });
  return mats;
}

// W08: boards on the west half of the bay front, a seal, a red SEIZED banner, two beige-vested guards (static).
registerWorldChange('W08', (ctx) => {
  const root = new THREE.Group();
  root.name = 'world-change-W08';
  for (const x of [-157.5, -155.4, -153.3]) put(ctx, root, buildPrefab('plank-wall'), x, FRONT_Z, Math.PI);
  const seal = coastSign('HOA SEAL\nSEIZED PENDING AUDIT', { w: 2.2, h: 1.3, bg: 0xf2ead8, fg: 0xa11d1d });
  put(ctx, root, seal, -155.4, FRONT_Z - 0.2, Math.PI, 1, 0.9);
  const banner = coastSign('SEIZED', { w: 7, h: 1.3, bg: 0xb3201a, fg: 0xf8f0e0 });
  put(ctx, root, banner, -150, FRONT_Z - 0.3, Math.PI, 1, 4.2);
  const g1 = gnome(ctx, root, -160.5, 74.5, Math.PI / 2 + 0.4, BEIGE, BEIGE);
  const g2 = gnome(ctx, root, -145.5, 75.2, Math.PI, BEIGE, BEIGE);
  const base = [g1.position.y, g2.position.y];
  return {
    root,
    update(_dt, t) {
      g1.position.y = base[0] + 0.015 * Math.sin(t * 1.3);
      g2.position.y = base[1] + 0.015 * Math.sin(t * 1.1 + 1);
    },
  };
});

// The downtown meridian (x = 0): the Combine ran z -240 .. 60. Cross roads at z = -180..180 step 60 (10 m wide).
const MERIDIAN = { z0: -240, z1: 60 };
const nearCross = (z: number): boolean => Math.abs(z - Math.round(z / 60) * 60) < 8;

registerWorldChange('W17', (ctx) => {
  const root = new THREE.Group();
  root.name = 'world-change-W17';

  // Shared: Side-Valve open bay (W08 hidden by the runtime): the crew's flag by the bay, west side, clear of marks.
  const flag = buildPrefab('street-banner-pole');
  tint(flag, 0xe07a1f);
  put(ctx, root, flag, -158.5, 78.5, Math.PI);
  put(ctx, root, coastSign('OPEN', { w: 1.4, h: 0.6, bg: 0xf2ead8, fg: 0x2f6a2a, post: 0.5 }), -146.5, 79.5, Math.PI);

  // Shared: a ribbon of fresh green along a trellis row of Trellisdown (row z = -125, east of the path at x -1134):
  // new-growth vine rows laid 1.6 m beside the old row, bright green.
  for (let i = 0; i < 6; i++) {
    const v = buildPrefab('vine-row');
    tint(v, 0x6fd34a);
    put(ctx, root, v, -1127.5 + i * 5, -126.6, 0);
  }

  // Shared: the Standing Lady in the open at Wader's Rest: a half-size one at the camp's east edge, out past the
  // circle (the real Lady stays on her mound at (-1130, -668)), turned toward the way out.
  put(ctx, root, buildPrefab('standing-lady'), -1098, -648, -Math.PI / 2, 0.5);

  const neon: THREE.MeshStandardMaterial[] = [];
  const glowSnacks: THREE.MeshStandardMaterial[] = [];
  const A = new THREE.Group();
  const B = new THREE.Group();
  A.name = 'W17-ending-A';
  B.name = 'W17-ending-B';
  root.add(A, B);

  // Ending A: a flat clover ribbon down the meridian line (decal layer, drivable), wild clover and daisy patches on
  // both verges (never on the carriageway), and one gnome sitting in it on a bench.
  const cloverMat = flatLayer(new THREE.MeshLambertMaterial({ color: 0x4f9a3a }), LAYER.decal);
  for (let z = MERIDIAN.z0; z < MERIDIAN.z1; z += 10) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 9.6), cloverMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(0, ctx.groundY(0, z + 5) + 0.03, z + 5);
    A.add(m);
  }
  for (let z = MERIDIAN.z0 + 4; z < MERIDIAN.z1; z += 7) {
    if (nearCross(z)) continue;
    const side = Math.round(z / 7) % 2 === 0 ? 1 : -1;
    put(ctx, A, buildPrefab('wildflower-patch'), side * 7.5, z, (Math.abs(z) * 0.37) % 6.28, 1.1);
  }
  put(ctx, A, buildPrefab('park-bench'), 9, -90, -Math.PI / 2);
  gnome(ctx, A, 9, -90, -Math.PI / 2, 0x6fa84a, 0xe6d56a, 0.45);
  put(ctx, A, buildPrefab('wildflower-patch'), 7.5, -86, 0.5, 1.3);

  // Ending B: a grid of glowing neon tiles (flat emissive squares) down the same line, brightest at night, and a
  // stall selling glowing snacks on the east verge between the z = -120 and z = -60 roads.
  const palette = [0x25f4ff, 0xff3df0, 0x7dff3a];
  let n = 0;
  for (let z = MERIDIAN.z0; z < MERIDIAN.z1; z += 4) {
    for (const x of [-1.5, 1.5]) {
      const mat = flatLayer(new THREE.MeshStandardMaterial({
        color: 0x101018, emissive: palette[n++ % palette.length], emissiveIntensity: 0.8, roughness: 0.4,
      }), LAYER.decal);
      neon.push(mat);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), mat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, ctx.groundY(x, z + 2) + 0.03, z + 2);
      B.add(m);
    }
  }
  const stall = buildPrefab('food-cart');
  glowSnacks.push(...tint(stall, 0x7dff3a, true));
  put(ctx, B, stall, 9, -90, -Math.PI / 2);
  put(ctx, B, coastSign('GLOWING SNACKS\nNOT FOOD', { w: 2.2, h: 0.9, bg: 0x101018, fg: 0x7dff3a, post: 1.0 }), 9, -87, -Math.PI / 2);

  const setEnding = (): void => {
    const b = ctx.ending() === 'B';
    A.visible = !b;
    B.visible = b;
  };
  setEnding();
  return {
    root,
    update() {
      setEnding();
      const night = ctx.night();
      for (const m of neon) m.emissiveIntensity = 0.5 + 2.2 * night;
      for (const m of glowSnacks) m.emissiveIntensity = 0.2 + 0.9 * night;
    },
  };
});
