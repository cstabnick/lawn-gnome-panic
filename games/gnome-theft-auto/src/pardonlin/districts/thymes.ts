// The Thymes through Pardonlin (FX09, D9 item 4): quay walls, stairs, moored boats, bouquinistes, bridge parapets.
// Pure data, like the district plans; plans.ts hands each piece to the district it stands in (the river corridor
// x -1626..-1595 belongs to Teacup Row and the Quays).
//
// How it hangs together. WATER.courses.thymes sinks the water 1.8 m below the lowest bank and leaves a 2 m earth ramp
// from the waterline (8 m from the centre line) up to the quay ground (10 m). The quay walls (`pl-quay-wall`, 4.2 m
// pieces) stand with their water-side face 7.7 m from the centre line and a body 2.4 m deep, so they cover the whole
// ramp and their coping lies 6 cm above the quay ground. Everything that stands on the quay or the coping is placed with
// a `y` that is measured from the ground under it (the ramp, below the coping), so it is worked out here from the wall's
// top. The quay surface is a 'quay' band patch along each bank, cut where the bridge roads cross.
import type { AmbientGnomeDef } from '../../ambientGnomes';
import { heightAt, waterAt } from '../../terrain';
import { bridges } from '../../water';
import { districtAt, pathPoints } from '../layout';
import { ribbonRows, runsOf, type GroundPatch } from '../groundPlan';
import type { DistrictPlan, PlanProp, PlanSign, Vignette } from '../plan';

const PI = Math.PI;

// ---- Geometry ----------------------------------------------------------------------------------------------------------
/** Distance from the river's centre line to the water-side face of a quay wall (the water's edge is at 8). */
export const FACE = 7.7;
/** Wall piece length, spacing along the river (a little less than the length, so the ends overlap) and height. */
const PIECE = 4.2, STEP = 3.9, WALL_H = 3.2;
/** Coping stands this far above the quay ground (6 cm: tools/zfight.mjs flags a 3 cm gap as flicker beyond 220 m). */
const LIFT = 0.06;
/** The tall dressed-stone walls and the railing run through the town; the mossy low bank before and after it. */
export const TOWN_Z = { from: -540, to: 760 } as const;
/** The whole walled stretch (the Jardin's low bank starts below the source's tap). */
const WALL_Z = { from: -850, to: 955 } as const;

const rows = ribbonRows(pathPoints('thymes'), 0.5);

interface Frame { x: number; z: number; tx: number; tz: number }

/** The point `d` metres east of the river's centre line (negative: west) at arclength `s`, and the river's direction. */
function frame(s: number, d: number): Frame {
  let lo = 0, hi = rows.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (rows[mid].s <= s) lo = mid; else hi = mid;
  }
  const a = rows[lo], b = rows[hi];
  const t = b.s > a.s ? Math.max(0, Math.min(1, (s - a.s) / (b.s - a.s))) : 0;
  const nx = a.nx + (b.nx - a.nx) * t, nz = a.nz + (b.nz - a.nz) * t;
  const x = a.x + (b.x - a.x) * t + nx * d, z = a.z + (b.z - a.z) * t + nz * d;
  const p = rows[Math.max(0, lo - 2)], q = rows[Math.min(rows.length - 1, hi + 2)];
  const l = Math.hypot(q.x - p.x, q.z - p.z) || 1;
  return { x, z, tx: (q.x - p.x) / l, tz: (q.z - p.z) / l };
}

/** Arclength of the river's centre line at world z (the river runs north to south, so z only increases). */
export function sAtZ(z: number): number {
  let lo = 0, hi = rows.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (rows[mid].z <= z) lo = mid; else hi = mid;
  }
  return rows[lo].s;
}

/** The river's bridges: road z (they are all east-west here), deck centre and the span's geometry. */
interface Span { id: string; x: number; z: number; yaw: number; length: number; width: number; deck: number }
function spans(): Span[] {
  heightAt(-1600, 100); // builds the terrain, and with it the water and its bridges, when nothing has yet
  return bridges().filter((b) => b.course === 'thymes').map((b) => ({ id: b.road, x: b.x, z: b.z, yaw: b.yaw, length: b.length, width: b.width, deck: b.deck }));
}

type Side = 1 | -1;
const SIDES: readonly Side[] = [1, -1];

/** The tangent-and-side dependent yaw of a piece whose local +z faces the water (a wall, stairs). */
function yawToWater(f: Frame, side: Side): number {
  return Math.atan2(-side * f.tz, side * f.tx);
}
/** Yaw of a piece whose local +x runs along the river and whose local +z faces away from the water (a bouquiniste box). */
function yawFromWater(f: Frame, side: Side): number {
  return yawToWater(f, side) + PI;
}
/** Yaw of a piece whose local +x runs along the river (a railing, a trough). */
function yawAlong(f: Frame): number {
  return Math.atan2(-f.tz, f.tx);
}
/** A boat's yaw: nose along the river for the east bank, against it for the west, so local +x (the rope side) faces the wall. */
function yawMoored(f: Frame, side: Side): number {
  return Math.atan2(side * f.tx, side * f.tz);
}
/** `frame(s, side * d)`, moved toward the river (down to 0.8 m) until a district holds it (see the wall loop below). */
function inside(s: number, side: Side, d: number): Frame {
  let f = frame(s, side * d), dd = d;
  while (!districtAt(f.x, f.z) && dd > d - 0.8) { dd -= 0.1; f = frame(s, side * dd); }
  return f;
}
/** World position of local (lx, lz) of a piece standing at (x, z) with this yaw. */
function loc(x: number, z: number, yaw: number, lx: number, lz: number): [number, number] {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return [x + lx * c + lz * s, z - lx * s + lz * c];
}

// ---- The plan ----------------------------------------------------------------------------------------------------------
type PropOpts = Partial<Omit<PlanProp, 'id' | 'x' | 'z'>>;

const base = { skin: 0xf1c27d, boots: 0x222222, pants: 0x2c3e50 } as const;

export function planThymes(): Omit<DistrictPlan, 'id'> {
  const props: PlanProp[] = [];
  const signs: PlanSign[] = [];
  const vignettes: Vignette[] = [];
  const residents: AmbientGnomeDef[] = [];
  const ground: GroundPatch[] = [];
  const prop = (id: string, x: number, z: number, o: PropOpts = {}): void => { props.push({ id, x, z, ...o }); };

  const spanList = spans();
  const deckZ = spanList.map((b) => b.z);
  /** Within `m` metres (along the river) of a bridge. */
  const nearBridge = (z: number, m: number): boolean => deckZ.some((bz) => Math.abs(z - bz) < m);

  // The quay ground height behind a wall at arclength s on a side, with the bridge decks interpolated across.
  const topCache = new Map<string, number>();
  const groundAt = (side: Side, s: number): number => {
    const f = frame(s, side * 12);
    return heightAt(f.x, f.z);
  };
  const quayTop = (side: Side, s: number): number => {
    const key = `${side}:${Math.round(s * 4)}`;
    const hit = topCache.get(key);
    if (hit !== undefined) return hit;
    const z = frame(s, 0).z;
    const b = deckZ.find((bz) => Math.abs(z - bz) < 9);
    let top: number;
    if (b === undefined) top = groundAt(side, s);
    else {
      const sa = sAtZ(b - 9), sb = sAtZ(b + 9);
      const ha = groundAt(side, sa), hb = groundAt(side, sb);
      const t = (s - sa) / (sb - sa);
      top = ha + (hb - ha) * Math.max(0, Math.min(1, t));
    }
    // Under a deck the wall stops below the slab (0.6 m thick), so its coping never shows through the roadway.
    const under = spanList.find((sp) => Math.abs(z - sp.z) < sp.width / 2 + 0.6);
    if (under) top = Math.min(top, under.deck - 0.65 - LIFT);
    topCache.set(key, top);
    return top;
  };
  /** A prop stood on the coping / quay top: `y` for a plan prop whose final y is heightAt(x, z) + y. */
  const onQuay = (side: Side, s: number, x: number, z: number, lift = 0): number => quayTop(side, s) + LIFT + lift - heightAt(x, z);

  // ---- Walls and stairs ------------------------------------------------------------------------------------------------
  const s0 = sAtZ(WALL_Z.from), s1 = sAtZ(WALL_Z.to);
  const stations: number[] = [];
  for (let s = s0 + PIECE / 2; s < s1; s += STEP) stations.push(s);
  const stairZ = new Map<Side, number[]>([[1, [-470, -195, 60, 335, 615]], [-1, [-340, -80, 175, 470, 735]]]);
  const stairAt = new Map<string, number>(); // "side:station" -> stair z
  for (const side of SIDES) {
    for (const z of stairZ.get(side)!) {
      let best = 0, bd = Infinity;
      stations.forEach((s, i) => { const d = Math.abs(frame(s, 0).z - z); if (d < bd) { bd = d; best = i; } });
      stairAt.set(`${side}:${best}`, z);
    }
  }
  /** Where each stair stands, for the vignettes and the railing gaps. */
  const stairs: { side: Side; s: number; x: number; z: number; yaw: number; top: number }[] = [];
  const inTown = (z: number): boolean => z >= TOWN_Z.from && z <= TOWN_Z.to;

  for (const side of SIDES) {
    stations.forEach((s, i) => {
      // Every other piece stands 1 cm proud so the overlapping ends never share a plane.
      // Where the corridor's edge cuts the wall off (x -1626 west of the river near z 400) the piece steps up to 0.8 m
      // into the water, which the face hides, rather than fall out of every district.
      let face = FACE - (i % 2 ? 0.012 : 0);
      let f = frame(s, side * face);
      while (!districtAt(f.x, f.z) && face > FACE - 0.8) { face -= 0.1; f = frame(s, side * face); }
      const top = quayTop(side, s);
      const yaw = yawToWater(f, side);
      const town = inTown(f.z);
      const stair = stairAt.has(`${side}:${i}`);
      const id = stair ? 'pl-quay-stairs' : town ? 'pl-quay-wall' : 'pl-quay-wall-low';
      // The stairs and the Jardin's bank are tinted a little mossier than the town's stone.
      const tint = stair || town ? (i % 5 === 2 ? 0x938e85 : undefined) : (i % 3 === 0 ? 0x8f9078 : i % 3 === 1 ? 0x9a958c : 0x868a74);
      prop(id, f.x, f.z, { yaw, y: top + LIFT - WALL_H - heightAt(f.x, f.z), tint });
      if (stair) stairs.push({ side, s, x: f.x, z: f.z, yaw, top });
    });
  }

  // ---- Railings along the coping, broken at the stairs and the bridge heads --------------------------------------------
  const nearStair = (side: Side, s: number): boolean => stairs.some((st) => st.side === side && Math.abs(st.s - s) < 3.4);
  for (const side of SIDES) {
    const a = sAtZ(TOWN_Z.from) + 1, b = sAtZ(TOWN_Z.to);
    for (let s = a; s < b; s += 2.0) {
      const f = inside(s, side, 8.1);
      if (nearBridge(f.z, 8) || nearStair(side, s)) continue;
      prop('euro-iron-railing', f.x, f.z, { yaw: yawAlong(f), y: onQuay(side, s, f.x, f.z) });
    }
  }

  // ---- Lamps, flower troughs and bollards along the quay -------------------------------------------------------------------
  const free = (side: Side, s: number, m = 3.5): boolean => {
    const z = frame(s, 0).z;
    return !nearBridge(z, 11) && !nearStair(side, s) && !stairs.some((st) => st.side === side && Math.abs(st.s - s) < m + 2);
  };
  for (const side of SIDES) {
    const a = sAtZ(TOWN_Z.from) + 20 + (side === 1 ? 0 : 17), b = sAtZ(TOWN_Z.to);
    let k = 0;
    for (let s = a; s < b; s += 17, k++) {
      if (!free(side, s)) continue;
      const f = inside(s, side, 9.1);
      if (k % 2 === 0) prop('euro-lamp-post', f.x, f.z, { y: onQuay(side, s, f.x, f.z) });
      else prop('euro-flower-trough', f.x, f.z, { yaw: yawAlong(f), y: onQuay(side, s, f.x, f.z), tint: k % 4 === 1 ? 0x2f6b8f : 0xb8473d });
    }
  }

  // ---- Boats moored along the walls ------------------------------------------------------------------------------------------
  interface Berth { id: string; side: Side; z: number; stud: number; draft: number; tint?: number; trim?: number; half: number; scale?: number }
  const berths: Berth[] = [
    { id: 'pl-houseboat', side: 1, z: -245, stud: 2.4, draft: 0.4, half: 4.4, tint: 0xc9503f },
    { id: 'pl-peniche', side: -1, z: -215, stud: 2.3, draft: 0.4, half: 5.8 },
    { id: 'walnut-dinghy', side: 1, z: -140, stud: 1.6, draft: 0.12, half: 1.4, tint: 0x3a6ea5 },
    { id: 'pl-rowboat-sunk', side: -1, z: -112, stud: 1.8, draft: 0.52, half: 2.1 },
    { id: 'pl-swan-pedalo', side: 1, z: 25, stud: 1.6, draft: 0.06, half: 1.6 },
    { id: 'pl-houseboat', side: -1, z: 118, stud: 2.4, draft: 0.4, half: 4.4, tint: 0x3f7f9a },
    { id: 'pl-peniche', side: 1, z: 148, stud: 2.3, draft: 0.4, half: 5.8, tint: 0x8a2f2f, trim: 0xe0b040 },
    { id: 'walnut-dinghy', side: -1, z: 215, stud: 1.6, draft: 0.12, half: 1.4, tint: 0xb8473d },
    { id: 'pl-houseboat', side: 1, z: 395, stud: 2.4, draft: 0.4, half: 4.4, tint: 0xe0b040, trim: 0x2f5d3a },
    { id: 'pl-peniche', side: -1, z: 560, stud: 2.3, draft: 0.4, half: 5.8, tint: 0x3a4a6b },
    { id: 'walnut-dinghy', side: 1, z: 520, stud: 1.6, draft: 0.12, half: 1.4, tint: 0x5a9a5a },
  ];
  interface Moored { id: string; side: Side; x: number; z: number; s: number; yaw: number; surface: number }
  const moored: Moored[] = [];
  for (const b of berths) {
    const s = sAtZ(b.z);
    const d = FACE - b.stud;
    const f = frame(s, b.side * d);
    const w = waterAt(f.x, f.z);
    if (!w) continue;
    const yaw = yawMoored(f, b.side);
    prop(b.id, f.x, f.z, { yaw, y: w.surface - b.draft - heightAt(f.x, f.z), tint: b.tint, trim: b.trim, scale: b.scale });
    moored.push({ id: b.id, side: b.side, x: f.x, z: f.z, s, yaw, surface: w.surface });
    // A bollard at each end on the coping, in line with the boat.
    for (const e of [-b.half - 0.5, b.half + 0.5]) {
      const ff = inside(s + e, b.side, 8.9);
      prop('euro-bollard', ff.x, ff.z, { y: onQuay(b.side, s + e, ff.x, ff.z) });
    }
  }
  const mooredAt = (id: string, z: number): Moored => moored.find((m) => m.id === id && Math.abs(m.z - z) < 40)!;

  // ---- Swans: static ones, by the stairs and under the Pont Neuf, and a nest with cygnets -----------------------------------
  const swan = (x: number, z: number, yaw: number, o: { scale?: number; tint?: number; y?: number } = {}): void => {
    const w = waterAt(x, z);
    const y = o.y ?? (w ? w.surface - 0.03 - heightAt(x, z) : 0);
    prop('bird-swan', x, z, { yaw, y, scale: o.scale ?? 2.0, tint: o.tint });
  };
  const stairNear = (side: Side, z: number) => stairs.reduce((a, b) => (b.side === side && Math.abs(b.z - z) < Math.abs(a.z - z) ? b : a), stairs.find((st) => st.side === side)!);
  // A pair floating off the landing of an east stair, the cob a little behind the pen.
  {
    const st = stairNear(1, -195);
    const [ax, az] = loc(st.x, st.z, st.yaw, -0.6, 2.8);
    const [bx, bz] = loc(st.x, st.z, st.yaw, 0.5, 3.7);
    swan(ax, az, st.yaw + 0.5);
    swan(bx, bz, st.yaw - 0.4, { scale: 1.8 });
  }
  // The nest on the landing of a west stair, the pen sitting by it, the cob watching from the water, three cygnets.
  {
    const st = stairNear(-1, 175);
    const landing = st.top + LIFT - WALL_H + 1.52;
    const at = (lx: number, lz: number): [number, number] => loc(st.x, st.z, st.yaw, lx, lz);
    const onLanding = (x: number, z: number, extra = 0): number => landing + extra - heightAt(x, z);
    const [nx, nz] = at(1.6, 0.55);
    prop('pl-swan-nest', nx, nz, { yaw: st.yaw, y: onLanding(nx, nz) });
    const [px, pz] = at(0.85, 0.8);
    prop('bird-swan', px, pz, { yaw: st.yaw + 0.3, y: onLanding(px, pz, 0.08), scale: 2.0 });
    for (const [lx, lz, tn] of [[1.15, 0.22, 0xb9b2a4], [1.3, 1.15, 0xaaa396], [1.95, 1.05, 0xb9b2a4]] as const) {
      const [cx, cz] = at(lx, lz);
      prop('bird-swan', cx, cz, { yaw: st.yaw + lx * 3, y: onLanding(cx, cz), scale: 0.62, tint: tn });
    }
    const [wx, wz] = at(0.3, 3.4);
    swan(wx, wz, st.yaw + 0.2, { scale: 2.1 });
    vignettes.push({
      id: 'th-swans-nest', name: 'The swans\' nest on the steps', x: nx, z: nz,
      story: 'A swan\'s nest of straw on the bottom landing of the quay stairs, three grey cygnets, a pen sitting very still and a cob on guard in the water: the council has put up no notice, and the swans have put up a much clearer one.',
    });
  }
  // A pair under the Pont Neuf, where the deck keeps the sky off them.
  {
    const b = spanList.find((sp) => sp.id === 'pl-pont-neuf');
    if (b) {
      swan(b.x - 3.2, b.z + 1.8, PI * 0.5, { scale: 1.55 });
      swan(b.x - 1.2, b.z - 1.6, PI * 0.4, { scale: 1.45 });
    }
  }
  // A pair in the Jardin, mid-channel and easy to see from the walk.
  {
    const f = frame(sAtZ(-640), 0);
    swan(f.x - 1.5, f.z, yawAlong(f) + 0.6, { scale: 2.3 });
    swan(f.x + 1.8, f.z + 3.2, yawAlong(f) - 0.2, { scale: 2.1 });
  }

  // ---- The sunk rowboat for sale ---------------------------------------------------------------------------------------------
  {
    const m = mooredAt('pl-rowboat-sunk', -112);
    const sf = frame(m.s + 4.2, -8.9);
    prop('euro-poster-board', sf.x, sf.z, { yaw: yawFromWater(sf, -1), y: onQuay(-1, m.s + 4.2, sf.x, sf.z) });
    signs.push({ kind: 'poster', text: 'FOR SALE. Slightly used. Mostly river.', x: sf.x, z: sf.z, yaw: yawFromWater(sf, -1) });
    const [bx, bz] = [frame(m.s - 3.2, -9.3).x, frame(m.s - 3.2, -9.3).z];
    prop('fishing-rod', bx, bz, { yaw: 0.8, y: onQuay(-1, m.s - 3.2, bx, bz) });
    const cf = frame(m.s + 2.6, -9.6);
    prop('wicker-basket', cf.x, cf.z, { y: onQuay(-1, m.s + 2.6, cf.x, cf.z) });
    vignettes.push({
      id: 'th-rowboat-for-sale', name: 'The sunk rowboat for sale', x: sf.x, z: sf.z,
      story: 'A rowing boat sunk to its edges at the quay, a pennant still flying on its pole, a fishing rod laid on the coping and a poster that says FOR SALE. Slightly used. Mostly river.',
    });
  }

  // ---- The péniche's washing day ----------------------------------------------------------------------------------------------
  {
    const m = mooredAt('pl-peniche', 148);
    const at = (e: number, d: number): { f: Frame; s: number } => ({ f: frame(m.s + e, m.side * d), s: m.s + e });
    for (const [e, d, id, o] of [
      [-3.4, 9.7, 'deck-chair', { yaw: yawFromWater(frame(m.s, 0), m.side) + 0.4 }],
      [-2.4, 9.3, 'wicker-basket', {}],
      [-1.6, 9.5, 'euro-geranium-pot', {}],
      [3.3, 9.6, 'euro-geranium-pot', {}],
      [4.2, 9.4, 'crate', {}],
    ] as const) {
      const { f, s } = at(e, d);
      prop(id, f.x, f.z, { ...(o as PropOpts), y: onQuay(m.side, s, f.x, f.z) });
    }
    const c = at(0, 9.6);
    vignettes.push({
      id: 'th-peniche-washing-day', name: 'The péniche\'s washing day', x: c.f.x, z: c.f.z,
      story: 'A black barge with seven items on a line down its whole length, a deck chair on the quay turned to face the laundry, a basket of what is not yet dry and two geraniums standing guard: it is washing day, and it has been for some time.',
    });
  }

  // ---- Bouquinistes on the Thymes Walk -----------------------------------------------------------------------------------------
  // Green boxes just behind the coping, lids open or shut, facing the walk. [side, z, open?, plaque?]
  const boxes: readonly (readonly [Side, number, boolean, boolean])[] = [
    [1, -284, true, true], [1, -267, true, false], [1, -250, false, false],
    [1, -176, true, false], [1, -159, false, false], [1, -142, true, true],
    [1, 8, true, false], [1, 24, false, false],
    [-1, -283, true, false], [-1, -266, false, true], [-1, -249, true, false],
    [-1, -176, true, true], [-1, -159, true, false], [-1, -142, false, false],
    [-1, 4, true, false], [-1, 21, true, true], [-1, 38, false, false],
  ];
  for (const [side, z, open, plaque] of boxes) {
    const s = sAtZ(z);
    if (nearBridge(frame(s, 0).z, 10)) continue;
    const f = frame(s, side * 11.4);
    const yaw = yawFromWater(f, side);
    const y = onQuay(side, s, f.x, f.z);
    prop(open ? 'pl-bouquiniste' : 'pl-bouquiniste-shut', f.x, f.z, { yaw, y, tint: z % 3 === 0 ? 0x2f5d3a : z % 3 === 1 ? 0x28523a : 0x35633f });
    if (plaque) {
      const [px, pz] = loc(f.x, f.z, yaw, 0, 0.34);
      signs.push({ kind: 'plaque', text: open ? 'BOOKS. Read once,\nby careful owner.' : 'BOOKS (SHUT)\nBack in five minutes.', x: px, z: pz, yaw, y: y + heightAt(f.x, f.z) - heightAt(px, pz) + 0.73, w: 1.5, h: 0.3 });
    }
  }
  // Three sellers stand in front of their boxes, off the quay's edge (residents keep 12.5 m from the river's centre).
  const seller = (id: string, name: string, side: Side, z: number, along: number, idle: AmbientGnomeDef['idle'], look: AmbientGnomeDef['look'], bubble: string): void => {
    const s = sAtZ(z) + along;
    const f = frame(s, side * 14);
    const faceYaw = yawToWater(f, side);
    residents.push({ id, name, x: f.x, z: f.z, yaw: faceYaw + 0.5, look: { ...base, ...look }, bubble, idle });
  };
  seller('pl-th-prosper', 'Prosper Marginalia', 1, -267, 1.6, 'read',
    { hat: 0x2f5d3a, shirt: 0x3a4a6b, beard: 0xcfcfcf, glasses: true },
    'Every book here is a first edition. Of something. I am not saying of what.');
  seller('pl-th-odile', 'Odile Foxing', -1, -266, -1.7, 'vendor-call',
    { hat: 0x7b3f61, shirt: 0xe9d9a6, pants: 0x4a3a2a, beard: null, hair: { color: 0xd0d0d0, style: 'bun' }, dress: true },
    'The green box is shut. The green box is always shut. That is how you know it is the good one.');
  seller('pl-th-gaspard', 'Gaspard Dust-Jacket', 1, -159, -1.7, 'think',
    { hat: 0x8a6a4a, shirt: 0xa84b2a, beard: 0x8a6a4a },
    'I do not sell books. I introduce them. After that you are on your own, and so are they.');
  seller('pl-th-lucien', 'Lucien Bail', -1, -112, -3.0, 'think',
    { hat: 0x4a77a8, shirt: 0xf0e6d0, pants: 0x3b3b3b, beard: 0xdddddd },
    'She is not sunk. She is resting at depth. The price takes that into account.');

  // ---- Bridges: parapets, lamps, boards, and the love locks on the Pont Neuf --------------------------------------------------
  for (const b of spanList) {
    const along = [Math.sin(b.yaw), Math.cos(b.yaw)] as const;
    const sideV = [Math.cos(b.yaw), -Math.sin(b.yaw)] as const;
    const yawP = Math.atan2(-along[1], along[0]);
    const lockSide = b.id === 'pl-pont-neuf' ? -1 : 0;
    const pieces = Math.round(b.length / 3.5);
    for (const sd of [1, -1]) {
      for (let k = 0; k < pieces; k++) {
        const t = (k - (pieces - 1) / 2) * 3.5;
        const x = b.x + along[0] * t + sideV[0] * sd * 5.72, z = b.z + along[1] * t + sideV[1] * sd * 5.72;
        const locks = sd === lockSide && (k === Math.floor(pieces / 2) || k === Math.floor(pieces / 2) - 1);
        prop(locks ? 'pl-padlock-railing' : 'pl-bridge-parapet', x, z, { yaw: yawP, tint: locks ? undefined : 0x9a958c });
      }
    }
    // Lamps on the footways at both ends.
    for (const sd of [1, -1]) for (const e of [-1, 1]) {
      const t = e * (b.length / 2 - 1.2);
      prop('euro-lamp-post', b.x + along[0] * t + sideV[0] * sd * 4.7, b.z + along[1] * t + sideV[1] * sd * 4.7, {});
    }
  }
  const neuf = spanList.find((sp) => sp.id === 'pl-pont-neuf');
  if (neuf) {
    // The padlock railing: the middle two pieces of the north parapet.
    const lx = neuf.x, lz = neuf.z - 5.72;
    const along = [Math.sin(neuf.yaw), Math.cos(neuf.yaw)] as const;
    const pieces = Math.round(neuf.length / 3.5);
    const t = (Math.floor(pieces / 2) - 0.5 - (pieces - 1) / 2) * 3.5;
    const cx = lx + along[0] * t, cz = lz + along[1] * t;
    for (const [dx, id] of [[-2.2, 'brass-key'], [-0.5, 'brass-key'], [1.6, 'brass-key']] as const) {
      prop(id, cx + dx, neuf.z - 4.5 + (dx > 0 ? 0.3 : 0), { yaw: dx * 3, y: 0.02 });
    }
    prop('euro-poster-board', cx + 4.4, neuf.z - 4.3, { yaw: 0 });
    signs.push({ kind: 'poster', text: 'LOVE LOCKS. Please do not lock your love to the bridge. The bridge is spoken for.', x: cx + 4.4, z: neuf.z - 4.3, yaw: 0 });
    vignettes.push({
      id: 'th-love-locks', name: 'The padlock railing on the Pont Neuf', x: cx, z: cz,
      story: 'Two iron railings on the Pont Neuf hung with some eighty small padlocks, three brass keys that missed the river, and a poster that asks everyone to stop: the bridge is spoken for.',
    });
  }
  // The rowing hours, on a board at each of the first three bridges.
  for (const b of spanList.filter((sp) => sp.id !== 'pl-quai-bassin')) {
    const f = frame(sAtZ(b.z - 9.5), 9.4);
    prop('euro-poster-board', f.x, f.z, { yaw: PI / 2, y: onQuay(1, sAtZ(b.z - 9.5), f.x, f.z) });
    signs.push({ kind: 'poster', text: 'ROWING: Sundays, after the bells. Weather permitting, permission permitting.', x: f.x, z: f.z, yaw: PI / 2 });
  }

  // ---- The quay surface -------------------------------------------------------------------------------------------------------
  // Big grey quay flags from the coping out to 21.8 m on each bank (the walks and their blended edges), in runs that stop 12.4 m short of every bridge road, so the band stays 10 m clear even at its far edge where the river leans.
  const bandRows = ribbonRows(pathPoints('thymes'), 2).filter((r) => r.z >= TOWN_Z.from && r.z <= TOWN_Z.to);
  const runs = runsOf(bandRows, (r) => !deckZ.some((bz) => Math.abs(r.z - bz) < 12.4));
  for (const run of runs) {
    const line = run.map((r) => [r.x, r.z] as const);
    ground.push({ kind: 'quay', band: line, from: 10.6, to: 21.8 });
    ground.push({ kind: 'quay', band: line, from: -21.8, to: -10.6 });
  }

  // The bridge approaches: the band stops 12.4 m short of each bridge road, and the roads' own pavements start 13.5 m from
  // the river, so a strip of quay flags (an accent: it lies on the layer above the band, whose cut it overlaps a little)
  // fills the corner on each side of the road between the coping and the pavement.
  for (const b of spanList.filter((sp) => sp.id !== 'pl-quai-bassin')) {
    for (const side of SIDES) for (const sg of [1, -1]) {
      ground.push({ kind: 'quay', accent: true, rect: { x: b.x + side * 11.6, z: b.z + sg * 8.1, w: 2.8, d: 9.8 } });
    }
  }

  return { buildings: [], props, signs, vignettes, residents, ground };
}
