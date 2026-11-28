// The Double Pot: Thorne Even-Estates sales floor (E05 showcase interior), door in the Double Pot Tunnel, with a lift
// up to the helipad on the tunnel roof slab (rooftopsBuild.ts registers the slab as rooftop 'double-pot-slab').
// The lift kiosk on the slab (buildDoublePotRoof) and the "Take the lift down" spot (installDoublePotRoofLift).
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { defineInterior } from '../registry';
import { addInteractSpot } from '../../interactables';
import { enterInterior } from '../runtime';

export const DOUBLE_POT_INTERIOR = 'double-pot-sales';
/**
 * Where the lift puts the player on the slab (world, y = slab top): 5.5 m in front of the kiosk's door, facing north
 * toward the helipad, so the follow camera (about 4.6 m behind) sits in the open between the player and the kiosk.
 */
export const DOUBLE_POT_ROOF_ARRIVAL = { x: 120, y: 9, z: -77.5, yaw: Math.PI } as const;
/** The lift kiosk's footprint on the slab (world): against the south parapet, its door on the north face. `top` is its roof y. */
export const DOUBLE_POT_ROOF_KIOSK = { minX: 118.8, maxX: 121.2, minZ: -72.0, maxZ: -70.0, top: 11.7 } as const;
/** The "Take the lift down" spot, just in front of the kiosk door. */
export const DOUBLE_POT_ROOF_LIFT = { x: 120, y: 9, z: -72.6 } as const;

const BEIGE_TINT = 0xd8c8a8;
const SWATCHES: { color: number; x: number; z: number }[] = [
  { color: 0xe53935, x: 6.0, z: 5.2 },
  { color: 0x43a047, x: 6.1, z: 5.9 },
  { color: 0x1e88e5, x: 7.5, z: 5.3 },
  { color: 0xfdd835, x: 7.6, z: 6.0 },
];

let liftInstalled = false;

/** Adds the "Take the lift down" spot on the slab once (it leads back into the sales floor). */
export function installDoublePotRoofLift(): void {
  if (liftInstalled) return;
  liftInstalled = true;
  addInteractSpot({
    x: DOUBLE_POT_ROOF_LIFT.x,
    z: DOUBLE_POT_ROOF_LIFT.z,
    y: DOUBLE_POT_ROOF_LIFT.y,
    prompt: 'Take the lift down',
    run: () => enterInterior(DOUBLE_POT_INTERIOR),
  });
}

/** The Thorne lift housing on the helipad slab, scaled to the kiosk footprint, door facing north. */
export function buildDoublePotRoof(scene: THREE.Scene): void {
  const obj = buildPrefab('even-lift-kiosk', { lights: false });
  obj.name = 'double-pot-lift-kiosk';
  const bb = new THREE.Box3().setFromObject(obj);
  const wx = bb.max.x - bb.min.x;
  const k = wx > 0 ? (DOUBLE_POT_ROOF_KIOSK.maxX - DOUBLE_POT_ROOF_KIOSK.minX) / wx : 1;
  obj.scale.setScalar(k);
  const cx = (DOUBLE_POT_ROOF_KIOSK.minX + DOUBLE_POT_ROOF_KIOSK.maxX) / 2;
  const cz = (DOUBLE_POT_ROOF_KIOSK.minZ + DOUBLE_POT_ROOF_KIOSK.maxZ) / 2;
  obj.position.set(cx, DOUBLE_POT_ROOF_LIFT.y + 0.02 - bb.min.y * k, cz);
  obj.rotation.y = Math.PI;
  scene.add(obj);
  installDoublePotRoofLift();
}

defineInterior({
  id: DOUBLE_POT_INTERIOR,
  name: 'Thorne Even-Estates sales floor',
  door: { x: 112.4, z: -84, yaw: -Math.PI / 2 },
  exit: { x: 113.2, z: -84, yaw: Math.PI / 2 },
  size: { w: 18, d: 14, h: 4.5 },
  theme: 'office',
  ambience: 'silent',
  build(kit) {
    kit.room();
    kit.door(8.8, 0, -Math.PI / 2);

    // Floor and the scale model on its plinth (the luxury: every home identical).
    kit.put('rug', -1, 0, 0, { solid: false, size: 7, tint: BEIGE_TINT });
    kit.block(2.4, 0.9, 2.4, -2, 0, { color: 0xe0d6c2 });
    kit.put('gnome-cottage', -2, 0, 0, { y: 0.9, size: 1.8, tint: BEIGE_TINT, solid: false });
    for (const x of [-2.7, -2.0, -1.3]) {
      kit.put('gnome-cottage', x, 0.8, 0, { y: 0.9, size: 0.6, tint: BEIGE_TINT, solid: false });
    }

    // Sales desk, the ledger, the chair behind it and the sales gnome.
    kit.block(3, 1.0, 1, 3, -4.6, { color: 0xbcae94 });
    kit.put('ledger', 3, -4.6, 0, { y: 1.0, solid: false });
    kit.put('chair', 3, -5.6, 0);
    kit.npc({
      id: 'sales',
      name: 'Even-Estates sales gnome',
      x: 3.8,
      z: -5.6,
      yaw: 0,
      look: { hat: BEIGE_TINT, shirt: 0xbcae94, beard: 0xeeeeee },
      line: 'Every home identical. That is the luxury. Sign here, here, and here, also here.',
    });

    // Posters.
    const poster = { bg: 0xf3ecdc, fg: 0x5d4e37 };
    kit.sign('THORNE EVEN-ESTATES\nEVERY LAWN THE SAME LENGTH', -5, 2.6, -6.95, 0, { w: 3, h: 1, ...poster });
    kit.sign('HOA RULE 1: BEIGE.\nRULE 2: SEE RULE 1.', 1, 2.6, -6.95, 0, { w: 2.4, h: 0.9, ...poster });
    kit.sign('NOW SELLING PHASE 3\n(PHASES 1 AND 2 PENDING)', -3, 2.4, 6.95, Math.PI, { w: 2.8, h: 0.9, ...poster });

    // Vignette 1: the bin of rejected colours.
    kit.put('barrel', 6.8, 5.6, 0);
    for (const s of SWATCHES) {
      kit.block(0.25, 0.04, 0.35, s.x, s.z, { color: s.color, solid: false });
    }
    kit.sign('REJECTED COLOURS', 6.8, 1.8, 6.95, Math.PI, { w: 1.4, h: 0.4, ...poster });

    // Vignette 2: the lawn measured to the millimetre.
    kit.put('rug', 5.5, 2, 0, { solid: false, size: 1.6, tint: 0x6b8e23 });
    kit.put('brass-calipers', 5.5, 2, 0, { y: 0.02, solid: false });
    kit.put('tall-one-pencil', 6.9, 2, 0, { solid: false, size: 1.6, by: 'h' });

    // Vignette 3: the waiting area, one chair turned to face the wall.
    kit.put('chair', 0.5, 6.2, Math.PI);
    kit.put('chair', 1.5, 6.2, Math.PI);
    kit.put('chair', 2.5, 6.2, 0);

    // Windows (the west wall holds the lift).
    kit.window(-7.5, -6.95, 0);
    kit.window(6.5, -6.95, 0);

    // The lift on the west wall, to the helipad.
    kit.block(0.15, 2.4, 1.6, -8.85, 0, { color: 0xb0bec5, solid: false });
    kit.sign('LIFT: ROOF / HELIPAD', -8.9, 2.9, 0, Math.PI / 2, { w: 1.4, h: 0.35, ...poster });
    kit.stairsTo(-8.0, 0, DOUBLE_POT_ROOF_ARRIVAL, 'Take the lift to the Thorne Helipad');
  },
});
