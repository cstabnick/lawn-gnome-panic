// Saucer Court (E10-B2): the player's block of flats as three low wings round the Tall-One saucer courtyard, open to
// the street on the south. Pure piece list + a builder. Site: SAUCER_COURT (homes/types.ts); lore: saucer-court.md.
// Euro apartment block local bounds: x -5..5, z -4.03..4.80 (front +z), so a yaw turns the front toward the courtyard.
import * as THREE from 'three';
import { DEFAULT_LOOK } from '../config';
import { makeGnome } from '../gnomes';
import { heightAt } from '../terrain';
import type { Box } from '../types';
import { buildPieces, litWindow, textPlate, type HomePiece } from './pieces';
import { SAUCER_COURT } from './types';

const HALF_PI = Math.PI / 2;
const CREAM = 0xefe0c0;
const CREAM_DARK = 0xe8d2b0;

// Wing faces onto the courtyard (world): west wall x, east wall x, north wall z (two blocks, the second a touch proud).
const WEST_FACE = 18.9;
const EAST_FACE = 41.1;
const NORTH_FACE_A = 78.6;
const NORTH_FACE_B = 78.8;

export function saucerCourtPieces(): HomePiece[] {
  const p: HomePiece[] = [];
  // Wings: blocks 10 m wide on a 10.5 m pitch (0.5 m gaps), inside the site rectangle.
  [74.25, 84.75, 95.25, 105.75].forEach((z, i) => {
    p.push({ prefab: 'euro-apartment-block', x: 14.1, z, yaw: HALF_PI, tint: i === 2 ? CREAM_DARK : CREAM });
    p.push({ prefab: 'euro-apartment-block', x: 45.9, z, yaw: -HALF_PI, tint: i === 1 ? CREAM_DARK : CREAM });
  });
  // North wing: two blocks overlapping 0.4 m, fronts 0.2 m apart so their faces never share a plane.
  p.push({ prefab: 'euro-apartment-block', x: 25.2, z: NORTH_FACE_A - 4.8, yaw: 0, tint: CREAM });
  p.push({ prefab: 'euro-apartment-block', x: 34.8, z: NORTH_FACE_B - 4.8, yaw: 0, tint: CREAM_DARK });

  // The saucer (a missing prefab is skipped with a warning), a rubber duck stranded in the dry bowl.
  p.push({ prefab: 'courtyard-saucer', x: SAUCER_COURT.saucer.x, z: SAUCER_COURT.saucer.z, yaw: 0, size: 15, solid: false });
  p.push({ prefab: 'rubber-duck', x: 30.6, z: 97.4, yaw: 2.4, y: 0.35, solid: false });

  // Stairwell door, set into the north wall, and the buzzer panel beside it.
  p.push({ prefab: 'panelled-door', x: SAUCER_COURT.stairDoor.x, z: 78.8, yaw: 0, solid: false });
  p.push({ prefab: 'buzzer-panel', x: 31.3, z: 79.6, yaw: 0, solid: false });

  // 1. Nobody sweeps the courtyard: an overflowing bin on the rim, a broom that was never used.
  p.push({ prefab: 'litter-bin', x: 39.2, z: 95, yaw: HALF_PI, solid: false });
  p.push({ prefab: 'parcel-box', x: 39.9, z: 94.1, yaw: 0.6, solid: false });
  p.push({ prefab: 'parcel-box', x: 39.7, z: 96.2, yaw: 2.1, solid: false });
  p.push({ prefab: 'broom', x: 39.9, z: 95.4, yaw: 0, solid: false });
  // 2. The saucer never held water: a hose into the dry bowl and a deck chair waiting for it to fill.
  p.push({ prefab: 'hose-reel', x: 25.5, z: 88.4, yaw: 0, size: 1.1, solid: false });
  p.push({ prefab: 'deck-chair', x: 30, z: 88.2, yaw: 0, solid: false });
  // 3. Moving day: the player's crates by the stairwell, a bedroll on top, a bike chained to the rack.
  p.push({ prefab: 'crate', x: 25, z: 79.8, yaw: 0.1 });
  p.push({ prefab: 'crate', x: 25.8, z: 79.8, yaw: -0.15 });
  p.push({ prefab: 'crate', x: 25, z: 79.8, yaw: 0.5, y: 0.6, solid: false });
  p.push({ prefab: 'bedroll', x: 25.8, z: 79.8, yaw: HALF_PI, y: 0.6, solid: false });
  p.push({ prefab: 'parcel-box', x: 25, z: 79.8, yaw: 0.3, y: 1.2, solid: false });
  p.push({ prefab: 'euro-bike-rack', x: 34.5, z: 79.9, yaw: 0, y: 0.02 });
  p.push({ prefab: 'push-mower-bike', x: 34.5, z: 79.9, yaw: HALF_PI, solid: false });
  // 4. Hyssop's watch post: her chair by the door and a stop sign leaning on it.
  p.push({ prefab: 'chair', x: 28.5, z: 79.7, yaw: 0, solid: false });
  p.push({ prefab: 'signpost', x: 29.1, z: 79.5, yaw: 0, solid: false });
  // 5. Washing between the wings, a row of mailboxes by the street entrance.
  p.push({ prefab: 'euro-washing-line', x: 21, z: 88, yaw: HALF_PI, solid: false });
  p.push({ prefab: 'euro-washing-line', x: 39, z: 90, yaw: HALF_PI, solid: false });
  [106.6, 107.4, 108.2].forEach((z) => p.push({ prefab: 'mailbox', x: 19.7, z, yaw: HALF_PI, solid: false }));
  // Street-entrance sign post.
  p.push({ prefab: 'signpost', x: 21.5, z: 109.4, yaw: 0, solid: false });
  return p;
}

/** Plates and windows for the court (world positions). */
function details(): THREE.Object3D[] {
  const out: THREE.Object3D[] = [];
  const dark = { bg: 0x2b2116, fg: 0xd4af37 };
  const paper = { bg: 0xe9e2c8, fg: 0x3a3226 };
  // Over the door and the buzzer name plates, on the north wall's second block (face z 78.8).
  out.push(textPlate('SAUCER COURT\nSTAIRS 1-3', 30.2, 2.6, NORTH_FACE_B + 0.05, 0, { w: 0.8, h: 0.35, ...dark }));
  out.push(textPlate('3A  H. DOORMAT\n3B  (YOU)', 31.6, 1.7, NORTH_FACE_B + 0.05, 0, { w: 0.8, h: 0.35, ...dark }));
  // Hyssop's notice on the door (door front z 78.94).
  out.push(textPlate('STAIRWELL RULES\n1. WIPE FEET  2. NO RUNNING\n3. NO LODGERS  4. I AM WATCHING', 30, 1.4, 78.99, 0, { w: 0.9, h: 0.5, ...paper }));
  // Signage jokes.
  out.push(textPlate('SAUCER COURT\nresidents only\n(and the bank)', 21.5, 0.72, 109.5, 0, { w: 0.6, h: 0.4, ...dark }));
  out.push(textPlate('COURTYARD CLEANING ROTA:\nMON: nobody  TUE: nobody\nWED: nobody  THU: nobody...', WEST_FACE + 0.05, 1.8, 87, HALF_PI, { w: 0.95, h: 0.55, ...paper }));
  // Windows on the courtyard faces, some at each floor.
  [74.25, 84.75, 95.25, 105.75].forEach((z, i) => {
    out.push(litWindow(WEST_FACE + 0.03, 3.5 + (i % 2) * 4.5, z, HALF_PI));
    out.push(litWindow(EAST_FACE - 0.03, 8 + (i % 2) * -4.5, z, -HALF_PI));
  });
  out.push(litWindow(WEST_FACE + 0.03, 12, 84.75, HALF_PI));
  out.push(litWindow(EAST_FACE - 0.03, 12, 95.25, -HALF_PI));
  // North wall: Hyssop's ground-floor window (3A), then Flat 3B's two windows on the first floor above the door.
  const hw = SAUCER_COURT.hyssopWindow;
  out.push(litWindow(hw.x, 1.7, NORTH_FACE_A + 0.03, 0));
  out.push(litWindow(27.8, 5.5, NORTH_FACE_A + 0.03, 0));
  out.push(litWindow(32.2, 5.5, NORTH_FACE_B + 0.03, 0));
  out.push(litWindow(24, 9.5, NORTH_FACE_A + 0.03, 0));
  out.push(litWindow(36, 9.5, NORTH_FACE_B + 0.03, 0));
  return out;
}

/** Build Saucer Court into the scene; returns its colliders (the lead pushes them into world.boxes). */
export function buildSaucerCourt(scene: THREE.Scene): Box[] {
  const boxes = buildPieces(scene, saucerCourtPieces(), 'saucer-court');
  const group = new THREE.Group();
  group.name = 'saucer-court-details';
  for (const o of details()) group.add(o);
  scene.add(group);

  // Hyssop Doormat: retired lollipop-crossing warden, hi-vis coat, white beard, red hat. A figure, no collider.
  const life = new THREE.Group();
  life.name = 'saucer-court-life';
  const m = makeGnome(life, { ...DEFAULT_LOOK, hat: 0xd93636, shirt: 0xf2d22e, beard: 0xffffff });
  m.object.position.set(27.6, heightAt(27.6, 79.7), 79.7);
  m.object.rotation.y = 0;
  scene.add(life);
  return boxes;
}
