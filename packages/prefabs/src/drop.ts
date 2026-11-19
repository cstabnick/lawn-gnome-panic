// A prefab lying in the world as a pickup: it hovers, turns slowly, and sits over a soft glow disc in a rarity colour.
import * as THREE from 'three';
import { buildPrefab } from './build';
import { colorOf, type Swatch } from './palette';
import { getPrefab } from './registry';

export interface DropOptions {
  /** Glow disc colour (rarity). Omit for no disc. */
  glow?: Swatch | number;
  tint?: Swatch | number;
  /** Largest side of the model after fitting. Default 0.45. */
  fit?: number;
}

export interface Drop {
  object: THREE.Group;
  /** Call every frame. */
  update(dt: number): void;
}

const discGeo = new THREE.CircleGeometry(0.32, 20);
const discMatCache = new Map<number, THREE.MeshBasicMaterial>();

function discMaterial(colorHex: number): THREE.MeshBasicMaterial {
  let mat = discMatCache.get(colorHex);
  if (!mat) {
    mat = new THREE.MeshBasicMaterial({
      color: colorHex, transparent: true, opacity: 0.45, depthWrite: false,
    });
    discMatCache.set(colorHex, mat);
  }
  return mat;
}

export function createDrop(id: string, opts: DropOptions = {}): Drop {
  const def = getPrefab(id);
  if (!def) throw new Error(`Unknown prefab: ${id}`);
  const root = new THREE.Group();
  root.name = `${id}:drop`;
  const model = buildPrefab(def, { tint: opts.tint });
  // Fit to a pickup size so a barrel and a ring both read at a glance.
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const k = (opts.fit ?? 0.45) / Math.max(size.x, size.y, size.z, 0.001);
  model.scale.setScalar(k);
  model.position.y = -box.min.y * k;
  const spin = new THREE.Group();
  spin.add(model);
  root.add(spin);
  if (opts.glow !== undefined) {
    const disc = new THREE.Mesh(discGeo, discMaterial(colorOf(opts.glow)));
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.02;
    root.add(disc);
  }
  let t = Math.random() * 10;
  return {
    object: root,
    update(dt) {
      t += dt;
      spin.rotation.y = t * 1.2;
      spin.position.y = 0.12 + 0.05 * Math.sin(t * 3);
    },
  };
}
