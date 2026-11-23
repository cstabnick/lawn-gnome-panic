// Equip contact sheet (dev page, lab/equip.html on the dev server): every wearable or holdable @lawn/prefabs item on a
// gnome, through the same buildGear() every game uses, one tile each, so grip, orientation, scale and clipping can be
// checked by eye (and screenshotted in headless Edge).
//   lab/equip.html?slot=hand&pose=both&from=0&n=40&cols=8&size=180
//   slot: hand | head | back | neck (default hand). pose (hand only): rest | aim | both. ids=a,b,c picks items.
//   view: side (from the gnome's right) | front | back | three (3/4 front-right, default).
import * as THREE from 'three';
import { allPrefabs, type PrefabDef } from '@lawn/prefabs';
import { buildGear, createGnomeModel, SLOT_USE, type EquipSlot, type GnomeModel } from '@lawn/gnome';
import { DEFAULT_LOOK, GUNS } from '../config';
import { poseGunArms } from '../gunHold';

/** Held as a gun in GTA (the gun pose): every GUNS prefab. Other games hold everything else in the plain hand placement. */
const GUN_PREFABS = new Set(Object.values(GUNS).map((g) => g.prefab));

const q = new URLSearchParams(location.search);
const slot = (q.get('slot') ?? 'hand') as EquipSlot;
const pose = q.get('pose') ?? 'both';
const from = Number(q.get('from') ?? 0);
const n = Number(q.get('n') ?? 40);
const cols = Number(q.get('cols') ?? 8);
const size = Number(q.get('size') ?? 180);
const view = q.get('view') ?? 'three';
const pick = q.get('ids')?.split(',').filter(Boolean);

const fits = (d: PrefabDef): boolean => d.uses.includes(SLOT_USE[slot] as never);
const defs = pick
  ? pick.map((id) => allPrefabs().find((d) => d.id === id)).filter((d): d is PrefabDef => !!d)
  : allPrefabs().filter(fits).sort((a, b) => a.id.localeCompare(b.id)).slice(from, from + n);
const poses: ('rest' | 'aim')[] = slot !== 'hand' ? ['rest'] : pose === 'both' ? ['rest', 'aim'] : [pose as 'rest' | 'aim'];

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(size, size);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeef3ea);
scene.add(new THREE.HemisphereLight(0xffffff, 0x667755, 1.6));
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(2, 4, 3);
scene.add(sun);
const ground = new THREE.Mesh(new THREE.CircleGeometry(0.8, 24), new THREE.MeshLambertMaterial({ color: 0xb9c8ad }));
ground.rotation.x = -Math.PI / 2;
scene.add(ground);
const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 50);
const eye: Record<string, [number, number, number]> = {
  side: [-2.6, 0.75, 0.15], front: [0, 0.75, 2.6], back: [0, 0.9, -2.6], three: [-1.9, 0.95, 1.8],
};
camera.position.set(...(eye[view] ?? eye.three));
camera.lookAt(0, slot === 'head' ? 0.75 : 0.5, 0);

const sheet = document.getElementById('sheet')!;
sheet.style.gridTemplateColumns = `repeat(${cols}, ${size}px)`;

function idle(model: GnomeModel): void {
  model.update({
    position: new THREE.Vector3(), velocity: new THREE.Vector3(), facing: 0, grounded: true, jumpsUsed: 0, sitting: false,
  }, 1);
}

const results: { id: string; pose: string; error?: string }[] = [];
for (const def of defs) {
  for (const p of poses) {
    let error: string | undefined;
    // Worn the way every game and the Gnome Creator wear gear: look.equipment (the model hides its own hat under a head item).
    const model = createGnomeModel({ ...DEFAULT_LOOK, equipment: { [slot]: def.id } });
    scene.add(model.object);
    idle(model);
    try {
      let worn = false;
      model.object.traverse((o) => { if (o.userData.gearSlot === slot) worn = true; });
      if (!worn) buildGear(slot, def); // the model skipped it: build it here so a broken prefab throws its own error
      const held = model.arms.right.children.find((c) => c.userData.gearSlot === 'hand') ?? null;
      if (slot === 'hand' && GUN_PREFABS.has(def.id)) poseGunArms(model, def.id, { aiming: p === 'aim', pitch: 0 }, held);
      else if (slot === 'hand' && p === 'aim') model.arms.right.rotation.set(-Math.PI / 2, 0, 0);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
    renderer.render(scene, camera);
    const tile = document.createElement('div');
    tile.className = 'tile';
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    c.getContext('2d')!.drawImage(renderer.domElement, 0, 0);
    const label = document.createElement('span');
    label.textContent = `${def.id}${poses.length > 1 ? ` (${p})` : ''}${error ? ' ERROR' : ''}`;
    tile.append(c, label);
    sheet.append(tile);
    scene.remove(model.object);
    results.push({ id: def.id, pose: p, error });
  }
}
(window as unknown as { __equipSheet: unknown }).__equipSheet = {
  total: allPrefabs().filter(fits).length, shown: results.length, results,
};
document.body.dataset.ready = '1';
