// World changes W01, W09 (E18): Saucer Court: flat 3B is home (lit window, buzzer plate); Pip moves in.
// The flat doors are inside (E10), so everything stands on the north wing's courtyard face (stair door x 30, faces z 78.6/78.8).
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { coastSign } from '../../coast/sign';
import { registerWorldChange, type WorldChangeCtx } from '../registry';

const FACE_A = 78.6;
const FACE_B = 78.8;

function pane(color: number, emissive: number, x: number, y: number, z: number, name: string): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 1.3, 0.04),
    new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: 0, roughness: 0.9 }),
  );
  m.name = name;
  m.position.set(x, y, z);
  return m;
}

/** Place an object on the ground at x, z (y from the terrain) plus a height lift. */
function put(ctx: WorldChangeCtx, g: THREE.Object3D, x: number, z: number, lift: number, yaw = 0): THREE.Object3D {
  g.position.set(x, ctx.groundY(x, z) + lift, z);
  g.rotation.y = yaw;
  return g;
}

registerWorldChange('W01', (ctx) => {
  const root = new THREE.Group();
  root.name = 'wc-W01';
  // Brass buzzer plate "3B" on the buzzer panel (x 31.3, z 79.6), just proud of its face.
  const plate = coastSign('3B', { w: 0.12, h: 0.06, bg: 0xb08d3c, fg: 0x2b2116 });
  root.add(put(ctx, plate, 31.3, 79.72, 0.93));
  // Flat 3B's window (x 32.2, 5.5 m up): warm light from dusk.
  const lit = pane(0xffd9a0, 0xffb04a, 32.2, ctx.groundY(32.2, FACE_B) + 5.5, FACE_B + 0.07, 'flat-3b-lit-window');
  root.add(lit);
  // Curtains (a dim pane) on a few other windows.
  const curtains: Array<[number, number, number]> = [[27.8, 5.5, FACE_A], [24, 9.5, FACE_A], [36, 9.5, FACE_B]];
  for (const [x, y, face] of curtains) {
    root.add(pane(0x6b5a4a, 0x000000, x, ctx.groundY(x, face) + y, face + 0.07, 'curtain'));
  }
  const mat = lit.material as THREE.MeshStandardMaterial;
  return {
    root,
    update() { mat.emissiveIntensity = 1.2 * ctx.night(); },
  };
});

registerWorldChange('W09', (ctx) => {
  const root = new THREE.Group();
  root.name = 'wc-W09';
  // Pip's red toolbox by the stair door (3 m clear of the door and the exit mark).
  root.add(put(ctx, buildPrefab('glaze-extra-toolbox'), 33.2, 79.4, 0, 0.2));
  // Hammock slung across flat 3B's window, seen from the courtyard.
  root.add(put(ctx, buildPrefab('fennel-hammock'), 32.2, 79.5, 4.6, Math.PI / 2));
  // Hyssop's note on the wall by flat 3A's stair door (the flat doors themselves are inside).
  root.add(put(ctx, coastSign('NO LODGERS', { w: 0.5, h: 0.22, bg: 0xffffff, fg: 0x111111 }), 28.4, FACE_B + 0.06, 1.5));
  return { root };
});
