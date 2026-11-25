// E25 garbage: the Turfton Bin Depot beside the Compost Heap (site 'bin-depot'): yard, office, lorry bay, tipping
// ramp toward the heap, Mags Wheelie and a crew gnome, and three small stories told with props.
import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import type { GnomeModel } from '@lawn/gnome';
import { anchorOf, siteRect } from '../../sites';
import type { World } from '../../types';
import { coastSign } from '../../coast/sign';
import { registerCull } from '../../cull';
import { gnomeState, makeGnome, randomTownLook } from '../../gnomes';
import { heightAt } from '../../terrain';

export interface Depot {
  /** Where the Bin Lorry is parked for a round (facing out of the gate). */
  lorry: { x: number; z: number; yaw: number };
  /** The "Start a bin round" spot (on foot, by the office). */
  start: { x: number; z: number };
  /** Drive the full lorry here to tip the load into the heap and end the round. */
  tip: { x: number; z: number };
}

/** Half-width of the clear drive from the gate to the lorry bay and on to the tip. */
const DRIVE_HALF = 3.5;

interface Resident { model: GnomeModel; x: number; z: number; yaw: number; swing: number }

let built: Depot | null = null;
let mags: Resident | null = null;
let crew: Resident | null = null;
let clock = 0;

/** Distance from a point to a segment. */
function distSeg(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax, dz = bz - az;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}

function place(scene: THREE.Scene, id: string, x: number, z: number, yaw: number, lift = 0, scale = 1): THREE.Object3D | null {
  if (!getPrefab(id)) return null;
  const o = buildPrefab(id);
  o.position.set(x, heightAt(x, z) + lift, z);
  o.rotation.y = yaw;
  if (scale !== 1) o.scale.setScalar(scale);
  scene.add(o);
  registerCull(o, 'prop');
  return o;
}

/** A painted sign; `y` overrides the ground height (for a sign fixed to a wall or roof). */
function sign(scene: THREE.Scene, text: string, x: number, z: number, yaw: number, w: number, h: number, post: number, y?: number): void {
  const s = coastSign(text, { w, h, post });
  s.position.set(x, y ?? heightAt(x, z), z);
  s.rotation.y = yaw;
  scene.add(s);
  registerCull(s, 'prop');
}

/** Build the depot once (idempotent) and return its spots. Pushes colliders into world.boxes. */
export function buildDepot(scene: THREE.Scene, world: World): Depot {
  if (built) return built;
  const rect = siteRect('bin-depot');
  const gate = anchorOf('bin-depot', 'gate');
  const l = anchorOf('bin-depot', 'lorry');
  const o = anchorOf('bin-depot', 'office');
  const t = anchorOf('bin-depot', 'tip');
  const box = (cx: number, cz: number, hx: number, hz: number, h: number) =>
    world.boxes.push({ minX: cx - hx, maxX: cx + hx, minZ: cz - hz, maxZ: cz + hz, h });

  // The drive: gate -> lorry bay -> straight west to the tip's x -> south onto the ramp.
  const drive: [number, number][] = [[gate.x, gate.z], [l.x, l.z], [t.x, l.z], [t.x, t.z]];
  const onDrive = (x: number, z: number, r: number) => {
    for (let i = 0; i < drive.length - 1; i++) {
      if (distSeg(x, z, drive[i][0], drive[i][1], drive[i + 1][0], drive[i + 1][1]) < DRIVE_HALF + r) return true;
    }
    return false;
  };

  // Buildings: the shed on the north side with its bay facing the yard, the office cabin at its anchor.
  const shedX = -240, shedZ = rect.minZ + 3;
  place(scene, 'bin-depot-shed', shedX, shedZ, 0);
  box(shedX, shedZ, 5, 3, 4);
  place(scene, 'bin-depot-office', o.x, o.z, 0);
  box(o.x, o.z, 1.5, 1.25, 2.6);
  // The round board on the office's east wall; the spill counter on its roof.
  place(scene, 'bin-round-board', o.x + 1.52, o.z, Math.PI / 2, 1.4);
  sign(scene, 'DAYS WITHOUT A\nSPILL: 0', o.x, o.z, 0, 1.8, 0.6, 0.1, heightAt(o.x, o.z) + 2.6);

  // The tipping ramp: its high end (+z, the kerb stop) faces the heap. The lorry stops at the top.
  place(scene, 'bin-tipping-ramp', t.x, t.z - 1.1, 0);

  // Fence along the north edge (round the shed), the west edge and the east edge either side of the gate.
  const fz = rect.minZ + 0.4, fx = rect.minX + 0.4, ex = rect.maxX - 0.4;
  for (let x = rect.minX + 2; x < rect.maxX; x += 4) {
    if (Math.abs(x - shedX) < 7) continue;
    place(scene, 'wooden-fence', x, fz, 0, 0, 2);
  }
  box((rect.minX + shedX - 5) / 2, fz, (shedX - 5 - rect.minX) / 2, 0.2, 1.2);
  box((rect.maxX + shedX + 5) / 2, fz, (rect.maxX - shedX - 5) / 2, 0.2, 1.2);
  for (let z = rect.minZ + 2; z < rect.maxZ; z += 4) {
    place(scene, 'wooden-fence', fx, z, Math.PI / 2, 0, 2);
    if (!onDrive(ex, z, 2)) place(scene, 'wooden-fence', ex, z, Math.PI / 2, 0, 2);
  }
  box(fx, (rect.minZ + rect.maxZ) / 2, 0.2, (rect.maxZ - rect.minZ) / 2, 1.2);

  // Bin wash rack, and a row of clean bins.
  const rackX = -246, rackZ = -101;
  place(scene, 'bin-wash-rack', rackX, rackZ, 0);
  box(rackX, rackZ, 1.3, 0.4, 2);
  const row = { x: -229, z: -104 };
  place(scene, 'bin-row-depot', row.x, row.z, 0);
  box(row.x, row.z, 2.3, 0.4, 0.9);

  // Story 1, the overflow: a bin with its lid jammed open on a mountain of bags, a broom abandoned against it.
  const ov = { x: -259, z: -96 };
  place(scene, 'bin-bag-pile', ov.x, ov.z, 0.3, 0, 1.6);
  place(scene, 'bin-bag-pile', ov.x + 1.2, ov.z + 0.7, 2, 0, 1.2);
  place(scene, 'bin-bag-pile', ov.x - 0.6, ov.z + 1.1, 4, 0, 1);
  const bin = place(scene, 'gta-wheelie-bin', ov.x + 0.1, ov.z + 0.1, 0.5, 0.9);
  if (bin) {
    bin.rotation.x = -0.25;
    const lid = bin.getObjectByName('lid');
    if (lid) lid.rotation.x = -1.3;
  }
  const bro = place(scene, 'broom', ov.x + 1.6, ov.z - 1.0, 0.8, 0.6);
  if (bro) bro.rotation.z = 0.35;
  box(ov.x + 0.4, ov.z + 0.5, 2.2, 1.9, 1.3);

  // Story 2, lost property: the bin, a chair, a claim board and a trophy on top.
  const lp = { x: -259, z: -106 };
  place(scene, 'lost-property-bin', lp.x, lp.z, 0.2);
  box(lp.x, lp.z, 0.5, 0.5, 1.1);
  place(scene, 'trophy-cup', lp.x + 0.05, lp.z, 0, 1.1, 0.8);
  place(scene, 'chair', lp.x + 1.6, lp.z + 0.3, -1.2);
  sign(scene, 'CLAIM BY FRIDAY', lp.x - 0.1, lp.z + 1.7, 0.3, 1.3, 0.45, 0.5);

  // Story 3, Mags' tea break: a deckchair facing the steaming heap, a flask and a mug on a crate, a newspaper.
  const tb = { x: -236, z: -86 };
  place(scene, 'deck-chair', tb.x, tb.z, 0);
  box(tb.x, tb.z, 0.5, 0.5, 0.9);
  place(scene, 'crate', tb.x + 1.4, tb.z + 0.2, 0.3);
  box(tb.x + 1.4, tb.z + 0.2, 0.45, 0.45, 0.8);
  place(scene, 'honeydew-flask', tb.x + 1.25, tb.z + 0.2, 0, 0.8);
  place(scene, 'cocoa-mug', tb.x + 1.6, tb.z + 0.1, 0.5, 0.8);
  place(scene, 'pl-newspaper', tb.x + 1.4, tb.z + 0.5, 0.4, 0.82);

  // Signs.
  sign(scene, 'TURFTON BIN DEPOT\nWE TAKE IT AWAY', gate.x - 1, gate.z - 8, Math.PI / 2, 3, 1, 1.2);
  sign(scene, 'BIN DAY IS EVERY DAY', -232, -102, 0, 2.4, 0.7, 1.0);
  sign(scene, 'THE HEAP IS NOT A SLIDE\nby order of the HOA', -242, -84.5, Math.PI, 2.6, 0.9, 0.8);
  sign(scene, 'LIDS DOWN, CHINS UP', fx + 0.7, -101, Math.PI / 2, 2.2, 0.6, 0.8);

  // Residents: Mags Wheelie by the office in hi-vis (yellow shirt, green hat), a crew gnome hosing at the rack.
  const mx = o.x + 2.6, mz = o.z + 1.8;
  mags = {
    model: makeGnome(scene, { ...randomTownLook(), shirt: 0xf2e30c, hat: 0x2f9a3a }),
    x: mx, z: mz, yaw: Math.atan2(gate.x - mx, gate.z - mz), swing: 0,
  };
  crew = {
    model: makeGnome(scene, { ...randomTownLook(), shirt: 0xf08a24, hat: 0xf2c230 }),
    x: rackX, z: rackZ + 1.6, yaw: Math.PI, swing: 0.6,
  };

  built = {
    lorry: { x: l.x, z: l.z, yaw: l.yaw ?? 0 },
    start: { x: o.x, z: o.z + 2.2 },
    tip: { x: t.x, z: t.z },
  };
  return built;
}

/** Animate Mags (idling) and the crew gnome (hosing: turning slowly side to side). Call every frame. */
export function updateDepot(dt: number): void {
  if (!built) return;
  clock += dt;
  for (const r of [mags, crew]) {
    if (!r) continue;
    const yaw = r.yaw + (r.swing ? Math.sin(clock * 0.9) * r.swing : 0);
    r.model.update(gnomeState(r.x, heightAt(r.x, r.z), r.z, yaw, 0), dt);
  }
}
