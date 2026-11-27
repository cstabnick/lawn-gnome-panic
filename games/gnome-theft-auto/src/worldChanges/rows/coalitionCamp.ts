// World change W16 (E22, row 64 m64-all-hats): the coalition camp at the Dust Flats overlook; the Bathtub Queen moored at
// New Puddle. Props and ambient stand-ins only, no colliders (rules: ../registry.ts).
//
// The camp: centre (246, 82), on the rise north-west of the Overlook safehouse stage (centre (276,44), r 18). Every stage
// mark, camera sightline, walk and set prop there is 25 m or more away, so nothing of it stands in a story scene.
//   ring (R 9): seven doors facing the middle, one per faction, a small story at each door.
//   middle: the long crate-table (plates, one pie), the hat-rail behind it with its beacon, the campfire to the south-west.
//   edges: the coalition flag on the rise to the north, two gnomes arguing over a map between two tents, one asleep on a
//   crate behind the tents, one feeding the fire, Granny's cook at her pie table.
// New Puddle: the Queen's whole hull (3 m, prefab `bathtub-queen`) fits the marina, so she floats at scale 2 between the
// two docks (x 600 and 640, z 770..782, src/waterworks.ts) south of the three moored boats, flying a crew-colour flag.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { createGnomeModel, GNORMAN_LOOK } from '@lawn/gnome';
import { bodyLevel } from '../../water';
import { registerWorldChange, type WorldChangeCtx } from '../registry';

type Put = (o: THREE.Object3D, x: number, z: number, yaw?: number, y?: number) => THREE.Object3D;

function placer(root: THREE.Group, ctx: WorldChangeCtx): Put {
  return (o, x, z, yaw = 0, y = 0) => {
    o.position.set(x, ctx.groundY(x, z) + y, z);
    o.rotation.y = yaw;
    root.add(o);
    return o;
  };
}

/** Camp centre and ring radius. */
export const CAMP = { x: 246, z: 82, ring: 9 } as const;
/** Faction slots: angle in degrees from +x towards +z, round the ring. */
const FACTIONS = [
  { name: 'carburettors', tint: 0xff7a1a, deg: 30 },
  { name: 'underspanners', tint: 0x6f86a3, deg: 81 },
  { name: 'unmowed', tint: 0x4f9a3a, deg: 133 },
  { name: 'burrowfolk', tint: 0x7a5230, deg: 184 },
  { name: 'spade-guard', tint: 0x6b6e2a, deg: 236 },
  { name: 'flock', tint: 0xf08cb4, deg: 287 },
  { name: 'granny', tint: 0xc23030, deg: 339 },
] as const;
const PUDDLE_SEA = 'water/puddle-sea';
const QUEEN = { x: 626, z: 797 } as const;

type XZ = [number, number];
/** The point `r` from the camp centre at `deg`, `off` along the ring. */
function polar(deg: number, r: number, off = 0): XZ {
  const a = (deg * Math.PI) / 180;
  const t = a + Math.PI / 2;
  return [CAMP.x + Math.cos(a) * r + Math.cos(t) * off, CAMP.z + Math.sin(a) * r + Math.sin(t) * off];
}
/** Yaw that turns an object's +z (its front) towards (tx, tz). */
const faceTo = (x: number, z: number, tx: number, tz: number): number => Math.atan2(tx - x, tz - z);
const gnome = (hat: number, shirt: number): THREE.Object3D => createGnomeModel({ ...GNORMAN_LOOK, hat, shirt }).object;

registerWorldChange('W16', (ctx) => {
  const root = new THREE.Group();
  root.name = 'world-change-W16';
  const put = placer(root, ctx);
  const mid: XZ = [CAMP.x, CAMP.z];
  /** Place `o` at (x, z) with its front to (tx, tz). */
  const face = (o: THREE.Object3D, [x, z]: XZ, [tx, tz]: XZ, y = 0) => put(o, x, z, faceTo(x, z, tx, tz), y);
  const topOf = (o: THREE.Object3D): number => new THREE.Box3().setFromObject(o).max.y;

  // 1. The ring: a tent per faction, door to the middle; Granny's slot is her red-check pie table instead.
  for (const f of FACTIONS) {
    const at = polar(f.deg, CAMP.ring);
    if (f.name === 'granny') face(buildPrefab('table', { trim: f.tint, scale: 1.5 }), at, mid);
    else face(buildPrefab('hq-tent', { tint: f.tint, scale: 1.8 }), at, mid);
  }

  // 2. A small story at each door.
  const inner = CAMP.ring - 2.4;
  // Carburettors: a tow tube stood against the tent as a doormat, a crate of spare plugs beside it.
  put(buildPrefab('tow-tube', { tint: 0xff7a1a, scale: 0.9 }), ...polar(30, inner, -0.8), 0.3);
  put(buildPrefab('crate', { scale: 1.1 }), ...polar(30, inner, 1.2), 0.4);
  // Underspanners: two crates stacked crooked.
  const [ux, uz] = polar(81, inner, 1.5);
  const lower = put(buildPrefab('crate', { scale: 1.1 }), ux, uz, 0.2);
  put(buildPrefab('crate', { scale: 0.9 }), ux + 0.05, uz, 0.9, topOf(lower) - ctx.groundY(ux, uz));
  // The Unmowed: a log bench outside the door, a lantern on the ground by it.
  face(buildPrefab('log-bench', { scale: 1.1 }), polar(133, inner - 0.2), polar(133, CAMP.ring + 3));
  put(buildPrefab('mole-lantern'), ...polar(133, inner, 1.5), 0);
  // Burrowfolk: a lantern each side of the flap, so the tent can be found in the dark.
  for (const off of [-1.3, 1.3]) put(buildPrefab('mole-lantern'), ...polar(184, inner, off), off);
  // Spade Guard: an empty camp stool with a flag leaned beside it: somebody is on watch, and has gone for tea.
  face(buildPrefab('camp-stool', { scale: 1.3 }), polar(236, inner, -0.4), mid);
  put(buildPrefab('team-banner', { tint: 0x6b6e2a, scale: 0.35 }), ...polar(236, inner, 0.7), 0.5);
  // The Flock: a pink flamingo posted at the flap, as a doorbell.
  face(buildPrefab('lawn-flamingo', { scale: 1.3 }), polar(287, inner, 1.2), mid);

  // 3. The middle: the long table with plates and one pie, the hat-rail behind it, the dark beacon, the flag on the rise.
  const table = put(buildPrefab('crate-table'), CAMP.x, CAMP.z, 0);
  const tb = new THREE.Box3().setFromObject(table);
  const alongX = tb.max.x - tb.min.x >= tb.max.z - tb.min.z;
  const len = alongX ? tb.max.x - tb.min.x : tb.max.z - tb.min.z;
  const onTable = (t: number, s: number): XZ => {
    const along = (t - 0.5) * len * 0.8;
    const side = s * 0.18;
    return alongX ? [CAMP.x + along, CAMP.z + side] : [CAMP.x + side, CAMP.z + along];
  };
  const lift = (x: number, z: number): number => tb.max.y - ctx.groundY(x, z);
  // Four mismatched plates, and one pie in the middle with a slice already gone.
  for (const [t, s, yaw] of [[0.1, -1, 0.3], [0.3, 1, 1.1], [0.7, -1, 2.0], [0.9, 1, 0.6]] as const) {
    const [px, pz] = onTable(t, s);
    put(buildPrefab('pie-tin', { scale: 0.7 }), px, pz, yaw, lift(px, pz));
  }
  const [pieX, pieZ] = onTable(0.5, 0);
  put(buildPrefab('diner-pie-of-the-day', { scale: 2.2 }), pieX, pieZ, 0.4, lift(pieX, pieZ));

  const rail: XZ = [CAMP.x - 1, CAMP.z + 5.6];
  face(buildPrefab('hat-rail', { scale: 1.5 }), rail, mid);
  // Unlit: no point light, and the flame and spark balls hidden (the beacon is lit later, by the story).
  const beacon = buildPrefab('hatbrim-beacon', { lights: false });
  beacon.traverse((o) => { if (o.name === 'glow' || o.name === 'heart') o.visible = false; });
  face(beacon, [rail[0] + 2.6, rail[1] + 0.2], mid);
  face(buildPrefab('coalition-flag', { scale: 2 }), [CAMP.x, CAMP.z + 14], mid);

  // 4. The fire to the south-west, a log pile and a second log stacked on it.
  const fire = polar(217, 6.8);
  put(buildPrefab('campfire', { scale: 1.5 }), ...fire, 0);
  put(buildPrefab('timber-log', { scale: 1.4 }), fire[0] - 2.0, fire[1] + 1.4, 0.3);
  put(buildPrefab('timber-log', { scale: 1.4 }), fire[0] - 2.1, fire[1] + 1.7, 0.45, 0.2);

  // 5. Ambient faction gnomes: stand-ins, idle motion only, nothing blocks.
  const idle: Array<(t: number) => void> = [];

  // Two arguing over a map on a crate between the Carburettor and Underspanner tents: orange against grey-blue.
  const mapAt = polar(55, CAMP.ring + 1.6);
  const mapCrate = put(buildPrefab('crate', { scale: 1.1 }), mapAt[0], mapAt[1], 0.2);
  put(buildPrefab('folded-map', { scale: 1.2 }), mapAt[0], mapAt[1], 0.5, topOf(mapCrate) - ctx.groundY(mapAt[0], mapAt[1]));
  const arguers: THREE.Object3D[] = [];
  for (const [side, hat, shirt] of [[-1, 0xff7a1a, 0x7a3a10], [1, 0x6f86a3, 0x2f3f55]] as const) {
    const g = gnome(hat, shirt);
    const spot: XZ = [mapAt[0] + Math.cos(((55 + 90) * Math.PI) / 180) * side, mapAt[1] + Math.sin(((55 + 90) * Math.PI) / 180) * side];
    face(g, spot, mapAt);
    arguers.push(g);
  }
  const argueYaw = arguers.map((g) => g.rotation.y);
  const argueY = arguers.map((g) => g.position.y);
  idle.push((t) => {
    arguers.forEach((g, i) => {
      g.rotation.y = argueYaw[i] + Math.sin(t * 3 + i * Math.PI) * 0.22;
      g.position.y = argueY[i] + Math.abs(Math.sin(t * 5.5 + i * 1.9)) * 0.07;
    });
  });

  // One asleep on a crate behind the tents, out of the row, breathing.
  const sleepAt = polar(108, CAMP.ring + 2.6);
  const crate = put(buildPrefab('crate', { scale: 1.6 }), sleepAt[0], sleepAt[1], 0.3);
  const sleeper = new THREE.Group();
  const sg = gnome(0x2f8f4e, 0x3a5a2a);
  sg.position.set(-0.45, 0, 0);
  sleeper.add(sg);
  sleeper.rotation.z = -Math.PI / 2;
  put(sleeper, sleepAt[0], sleepAt[1], 0.3, topOf(crate) - ctx.groundY(sleepAt[0], sleepAt[1]) + 0.2);
  idle.push((t) => { sleeper.scale.y = 1 + Math.sin(t * 1.4) * 0.025; });

  // One feeding the fire: leaning over it, rocking forward each time the log goes in.
  const stoker = gnome(0x8a4fc9, 0x4a2f6a);
  face(stoker, [fire[0] + 1.0, fire[1] - 0.9], fire);
  idle.push((t) => { stoker.rotation.x = 0.18 + Math.max(0, Math.sin(t * 2.2)) * 0.3; });

  // Granny's cook (a red hat) behind her pie table, cutting a slice every few seconds.
  const tableAt = polar(339, CAMP.ring);
  const cook = gnome(0xc23030, 0xe8e0cc);
  face(cook, polar(339, CAMP.ring + 1.9), tableAt);
  const cookY = cook.position.y;
  idle.push((t) => { cook.position.y = cookY + Math.abs(Math.sin(t * 4 + 0.5)) * 0.05; });
  face(buildPrefab('diner-pie-of-the-day', { scale: 2.2 }), polar(339, CAMP.ring, 0.2), mid, 0.7);

  // 6. New Puddle: the Bathtub Queen afloat between the two marina docks, a crew-colour flag on her mast.
  const sea = bodyLevel(PUDDLE_SEA);
  const queen = buildPrefab('bathtub-queen', { scale: 2 });
  queen.position.set(QUEEN.x, (sea ?? ctx.groundY(QUEEN.x, QUEEN.z)) - 0.1, QUEEN.z);
  queen.rotation.y = Math.PI;
  const flag = buildPrefab('team-banner', { tint: 0xc43a2a, scale: 0.25 });
  flag.position.set(0, 2.5, 0.2);
  queen.add(flag);
  root.add(queen);
  const queenY = queen.position.y;
  idle.push((t) => { queen.position.y = queenY + Math.sin(t * 0.9) * 0.04; });

  return {
    root,
    update(_dt, t) { for (const f of idle) f(t); },
  };
});
