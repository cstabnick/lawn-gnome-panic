// Espalier End, the Trellisdown hamlet (E31): a genteel estate-gardeners' hamlet where everything is trained, clipped
// and espaliered. Ring of cottages round a small green, a pump, three little stories (the Topiary Contest, the Pear
// Incident, the Feud), a notice board and two residents.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import type { Box } from '../types';
import type { AmbientGnomeDef } from '../ambientGnomes';
import { heightAt } from '../terrain';
import { textPlate } from '../homes/pieces';
import { HAMLETS } from './config';
import { placePieces, prefabBounds, type Piece } from './place';

const CX = HAMLETS.find((h) => h.id === 'espalier-end')?.x ?? -1080;
const CZ = HAMLETS.find((h) => h.id === 'espalier-end')?.z ?? -420;
const GREEN_R = 10;
const RING_R = 36;
const HOUSE_COUNT = 10;

const CREAMS = [0xf2e6c8, 0xe9dcb8, 0xf5eedb];
const SAGES = [0xb7c9a8, 0xa9bd9a, 0xc4d2b4];
const TRIM = [0x6b7f5e, 0x7a6a50, 0x5d7260];

/** Yaw that turns a piece's front (+z) toward the centre. */
function faceCentre(x: number, z: number): number { return Math.atan2(CX - x, CZ - z); }

/** Lowest ground under the four footprint corners of a house (yaw, scale applied). */
function lowestCorner(id: string, x: number, z: number, yaw: number, s: number): number {
  const b = prefabBounds(id), c = Math.cos(yaw), sn = Math.sin(yaw);
  let lo = Infinity;
  for (const x0 of [b.min.x, b.max.x]) for (const z0 of [b.min.z, b.max.z]) {
    lo = Math.min(lo, heightAt(x + (x0 * c + z0 * sn) * s, z + (-x0 * sn + z0 * c) * s));
  }
  return lo;
}

/** World offset of a local (lx, lz) on a piece at (x, z) turned by yaw. */
function local(x: number, z: number, yaw: number, lx: number, lz: number): [number, number] {
  return [x + lx * Math.cos(yaw) + lz * Math.sin(yaw), z - lx * Math.sin(yaw) + lz * Math.cos(yaw)];
}

/** The pure plan: the houses first (so they claim their ground), then the dressing and the stories. */
export function planEspalierEnd(): Piece[] {
  const out: Piece[] = [];
  // Houses: a ring round the green, fronts to the centre, in creams and sages.
  for (let i = 0; i < HOUSE_COUNT; i++) {
    const a = (10 + i * 36) * Math.PI / 180;
    const x = CX + RING_R * Math.sin(a), z = CZ + RING_R * Math.cos(a);
    const yaw = faceCentre(x, z);
    const thatched = i % 3 === 1;
    const id = thatched ? 'thatched-cottage' : 'gnome-cottage';
    const scale = thatched ? 1.1 : 1.25;
    const tint = (i % 2 ? SAGES : CREAMS)[i % 3];
    out.push({ id, x, z, yaw, scale, tint, trim: TRIM[i % 3], y: lowestCorner(id, x, z, yaw, scale), solid: true });
  }
  // Each house: a flower bed and clipped pair at the gate, a washing line behind, a water butt at the side.
  for (let i = 0; i < HOUSE_COUNT; i++) {
    const h = out[i], yaw = h.yaw ?? 0;
    const [gx, gz] = local(h.x, h.z, yaw, 0, 6.3);
    out.push({ id: 'flower-bed', x: gx, z: gz, yaw, scale: 0.8 });
    const [tx, tz] = local(h.x, h.z, yaw, 2.6, 5.6);
    out.push({ id: i % 2 ? 'euro-topiary-spiral' : 'euro-topiary-lollipop', x: tx, z: tz });
    const [ux, uz] = local(h.x, h.z, yaw, -2.6, 5.6);
    out.push({ id: i % 2 ? 'euro-topiary-lollipop' : 'euro-topiary-spiral', x: ux, z: uz });
    const [wx, wz] = local(h.x, h.z, yaw, 0, -6.2);
    out.push({ id: 'euro-washing-line', x: wx, z: wz, yaw: yaw + Math.PI });
    const [bx, bz] = local(h.x, h.z, yaw, 4.4, 0.5);
    out.push({ id: 'euro-water-butt', x: bx, z: bz, yaw });
    if (i % 3 === 0) {
      const [ex, ez] = local(h.x, h.z, yaw, -4.6, -1);
      out.push({ id: 'euro-espalier-pear', x: ex, z: ez, yaw: yaw + Math.PI / 2 });
    }
    if (i % 4 === 1) {
      const [rx, rz] = local(h.x, h.z, yaw, 0, 9);
      out.push({ id: 'euro-rose-arch', x: rx, z: rz, yaw });
    }
  }

  // The centre: pump, benches round it, a picnic table, the phone box and the notice board.
  out.push({ id: 'village-pump', x: CX, z: CZ, yaw: 0, solid: true });
  for (const [dx, dz] of [[4.5, 0], [-4.5, 0], [0, 4.5]] as const) {
    out.push({ id: 'bench', x: CX + dx, z: CZ + dz, yaw: faceCentre(CX + dx, CZ + dz) + Math.PI });
  }
  out.push({ id: 'hamlet-picnic-table', x: CX - 6.5, z: CZ - 6.5, yaw: 0.6 });
  out.push({ id: 'hamlet-phone-box', x: CX + 8, z: CZ + 10, yaw: faceCentre(CX + 8, CZ + 10), solid: true });
  out.push({ id: 'rules-board', x: CX + 12, z: CZ - 6, yaw: faceCentre(CX + 12, CZ - 6), solid: true });
  out.push({ id: 'litter-bin', x: CX + 6, z: CZ - 4, yaw: 0 });
  out.push({ id: 'mailbox', x: CX - 8, z: CZ + 9, yaw: faceCentre(CX - 8, CZ + 9) });
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3 + 0.3;
    out.push({ id: 'euro-geranium-pot', x: CX + 8.5 * Math.sin(a), z: CZ + 8.5 * Math.cos(a) });
  }

  // By the road: the bus shelter, signs, the shrine, a milestone.
  out.push({ id: 'bus-shelter', x: -1050, z: -478, yaw: Math.PI, solid: true });
  out.push({ id: 'wayside-shrine', x: -1100, z: -480, yaw: Math.PI, solid: true });
  out.push({ id: 'milestone', x: -1005, z: -484, yaw: Math.PI });
  out.push({ id: 'hamlet-sign', x: -1020, z: -488, yaw: Math.PI, solid: true });
  out.push({ id: 'hamlet-sign', x: -1140, z: -488, yaw: Math.PI, solid: true });
  out.push({ id: 'mailbox', x: -1046, z: -474, yaw: Math.PI });

  // Plot edges: a drystone wall run to the south, a hedgerow run to the west.
  for (let i = 0; i < 6; i++) out.push({ id: 'drystone-wall', x: CX - 10 + i * 3.06, z: CZ + 46, yaw: 0, solid: true });
  for (let i = 0; i < 5; i++) out.push({ id: 'hedgerow', x: CX - 46, z: CZ - 10 + i * 4, yaw: Math.PI / 2, solid: true });
  for (let i = 0; i < 4; i++) out.push({ id: 'drystone-wall', x: CX + 44, z: CZ - 14 + i * 3.06, yaw: Math.PI / 2, solid: true });

  // Vignette 1, the Topiary Contest: four clipped entries on plinths with rosette pots, the winner a hedge clipped into a
  // ride-on mower, and a half-clipped fifth with the ladder and shears abandoned beside it.
  const contest: ReadonlyArray<readonly [string, number]> = [
    ['euro-topiary-spiral', 1], ['euro-topiary-lollipop', 1], ['boxwood-ball', 1], ['ride-on-mower', 0.5],
  ];
  contest.forEach(([id, s], i) => {
    const x = CX - 9 + i * 3.6, z = CZ + 16;
    out.push({ id: 'dayg-story-statue-plinth', x, z, solid: true });
    out.push({ id, x, z, lift: 1.31, scale: s, tint: id === 'ride-on-mower' ? 0x3d7a3a : undefined, trim: id === 'ride-on-mower' ? 0x2d5a2c : undefined, yaw: id === 'ride-on-mower' ? Math.PI / 2 : 0 });
    out.push({ id: 'euro-geranium-pot', x: x + 0.1, z: z + 1.2, tint: i === 3 ? 0xd4af37 : 0xc0392b });
  });
  out.push({ id: 'gba-trophy', x: CX + 5.4, z: CZ + 17.3, yaw: Math.PI });
  out.push({ id: 'boxwood-ball', x: CX + 7, z: CZ + 16, scale: 1.2 });
  out.push({ id: 'hedge-shears', x: CX + 7.1, z: CZ + 16.2, lift: 1.2, yaw: 0.8 });
  out.push({ id: 'ladder', x: CX + 8.2, z: CZ + 16, yaw: Math.PI / 2 });

  // Vignette 2, the Pear Incident: a ladder against an espalier wall, a toppled basket, pears rolled down the slope into
  // the road verge.
  const WX = -1033, WZ = -462;
  for (let i = 0; i < 4; i++) out.push({ id: 'euro-espalier-pear', x: WX + i * 2.5, z: WZ, yaw: Math.PI, solid: true });
  out.push({ id: 'ladder', x: WX + 3.2, z: WZ - 0.45, yaw: Math.PI });
  out.push({ id: 'chore-basket', x: WX + 1.2, z: WZ - 2.2, yaw: 2.4 });
  for (let i = 0; i < 9; i++) {
    out.push({ id: 'crab-apple', x: WX + 1.3 + Math.sin(i * 1.7) * (0.4 + i * 0.12), z: WZ - 2.8 - i * 2.4, scale: 1.4 });
  }

  // Vignette 3, the Feud: two neighbouring gardens, a box hedge between them clipped to two different heights, a tape on top.
  const fa = (100 * Math.PI) / 180, fx = CX + 34 * Math.sin(fa), fz = CZ + 34 * Math.cos(fa);
  out.push({ id: 'euro-box-hedge', x: fx, z: fz - 1.1, yaw: Math.PI / 2, scale: 1, solid: true });
  out.push({ id: 'euro-box-hedge', x: fx, z: fz + 1.9, yaw: Math.PI / 2, scale: 1.5, solid: true });
  out.push({ id: 'dayg-story-quarantine-tape', x: fx, z: fz - 1.1, lift: 0.83, yaw: Math.PI / 2, scale: 0.6 });
  out.push({ id: 'flower-bed', x: fx + 2.8, z: fz - 1, yaw: Math.PI / 2, scale: 0.7 });
  out.push({ id: 'flower-bed', x: fx - 2.8, z: fz + 1.5, yaw: Math.PI / 2, scale: 0.7 });
  return out;
}

/** World position and yaw for a text plate on a board: `lz` in front of the piece along its front. */
function plateOn(x: number, z: number, yaw: number, ly: number, lz: number): [number, number, number] {
  const [px, pz] = local(x, z, yaw, 0, lz);
  return [px, ly, pz];
}

function build(scene: THREE.Scene, boxes: Box[]): void {
  const plan = planEspalierEnd();
  const placed = placePieces(scene, boxes, plan, 'espalier-end');

  // The green: a disc laid over the ground, lifted and on a draw layer so it never flickers.
  const geo = new THREE.CircleGeometry(GREEN_R, 28);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, heightAt(CX + pos.getX(i), CZ + pos.getZ(i)) + 0.05);
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color: 0x7fa65a, roughness: 1 });
  flatLayer(mat, LAYER.area);
  const green = new THREE.Mesh(geo, mat);
  green.position.set(CX, 0, CZ);
  green.name = 'espalier-green';
  scene.add(green);

  const hasSign = (p: Piece) => placed.includes(p);
  // Name signs, one each side of where the road enters, facing the traffic.
  for (const p of plan) {
    if (p.id !== 'hamlet-sign' || !hasSign(p)) continue;
    const yaw = p.yaw ?? 0, y = heightAt(p.x, p.z);
    const [x, , z] = plateOn(p.x, p.z, yaw, 0, 0.09);
    const t = textPlate('ESPALIER END\nTwinned with nowhere, by request', x, y + 1.45, z, yaw, { w: 1.7, h: 0.6, bg: 0xf4efe0, fg: 0x2f4a2a });
    scene.add(t);
  }
  const shelter = plan.find((p) => p.id === 'bus-shelter');
  if (shelter && hasSign(shelter)) {
    const yaw = (shelter.yaw ?? 0) + Math.PI, y = heightAt(shelter.x, shelter.z);
    const [x, , z] = plateOn(shelter.x, shelter.z, shelter.yaw ?? 0, 0, -0.95);
    scene.add(textPlate('TIMETABLE\nBuses: in principle.\nNext bus: see previous bus.', x, y + 1.5, z, yaw, { w: 1.1, h: 0.7, bg: 0xfff4c2, fg: 0x2b2116 }));
  }
  const board = plan.find((p) => p.id === 'rules-board');
  if (board && hasSign(board)) {
    const yaw = board.yaw ?? 0, y = heightAt(board.x, board.z);
    const [x, , z] = plateOn(board.x, board.z, yaw, 0, 0.09);
    scene.add(textPlate(
      'NOTICES\nTOPIARY CONTEST: entries must not resemble the judges.\nLOST: one pear. Answers to nothing.\nThe hedge between No. 3 and No. 4 is 1.2 m. It is ALSO 1.4 m. Mediation Tuesday.',
      x, y + 1.45, z, yaw, { w: 1.3, h: 0.82, bg: 0xe8dcc0, fg: 0x2b2116 },
    ));
  }
}

/** Builds Espalier End. Pushes its colliders into `boxes`. Runs once from living/build.ts during the world build (also in tests: no DOM). */
export function buildEspalierEnd(scene: THREE.Scene, boxes: Box[]): void {
  build(scene, boxes);
}

/** The people of Espalier End (ambient gnomes with a speech bubble). living/runtime.ts shows them. */
export function espalierPeople(): AmbientGnomeDef[] {
  return [
    {
      id: 'espalier-judge', name: 'Judge Quince', x: CX - 3.5, z: CZ + 19.5, yaw: Math.PI, idle: 'think',
      look: { hat: 0x3f5a3a, shirt: 0xf2e6c8, pants: 0x4b4b3c, skin: 0xe8b99a, boots: 0x3a2a1a, beard: 0xe8e8e0, glasses: true },
      bubble: 'Points off for symmetry. Symmetry is for the HOA.',
    },
    {
      id: 'espalier-picker', name: 'Pip Pearsley', x: -1031.8, z: -464.3, yaw: 0.6, idle: 'scratch-head',
      look: { hat: 0xc9a227, shirt: 0x8a9a5b, pants: 0x5b4a32, skin: 0xd9a37e, boots: 0x4a3222, beard: null, glasses: false },
      bubble: 'Nine pears, one basket, and a hill with opinions.',
    },
  ];
}
