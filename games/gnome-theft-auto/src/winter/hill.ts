// Winter sports (E12): Snowdrop Slope's scenery: the Woolly Sock Lodge, the Bootlace Tow (pylons, rope, moving
// handles), the Wool Run's start hut, gates and finish banner, the Tea-Tray Run's lane, signs, vignettes and residents.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { gnomeState, makeGnome } from '../gnomes';
import { buildPieces, prefabBox, textPlate, type HomePiece } from '../homes/pieces';
import { homeOf, registerHome } from '../homes/data';
import { heightAt } from '../terrain';
import type { Box } from '../types';
import { buildSlopeLife } from './slopeLife';
import { handlePositions } from './tow';
import { LODGE, SLED_STACK, COCOA_HATCH, SKI_RACK, TOW, WOOL_RUN, NURSERY_RUN, TEA_TRAY_RUN, RUNS, type RunDef } from './types';

export interface SnowdropScenery {
  /** Colliders for world.boxes (lodge, pylons, racks; never the gates or flags). */
  boxes: Box[];
  /** Every frame: tow handles move, residents fidget. t = seconds since start. px, pz: the player. */
  update(dt: number, t: number, px: number, pz: number): void;
}

const HALF_PI = Math.PI / 2;
const ROPE_Y = 2.2;
const BLUE = 0x2a6fdb;
const RED = 0xc0392b;
const ORANGE = 0xe67e22;
const YELLOW = 0xf1c40f;
const GREEN = 0x2e9e5b;
const SNOW_LUMP = 0xf4f8ff;
const NUMBER_WORDS = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE'];
const PLATE_BG = 0xf2e8c8;

/** How far a prefab reaches along its own front (+z), metres at scale s (1 m when it is not in the catalogue yet). */
function front(id: string, s = 1): number {
  return getPrefab(id) ? prefabBox(id).max.z * s : 1;
}

/** The lodge's bounds in the world (door faces +x, so local +z is east and local -x is south). */
function lodgeBounds(): { east: number; south: number; north: number } {
  if (!getPrefab('woolly-sock-lodge')) return { east: LODGE.x + 6, south: LODGE.z + 7, north: LODGE.z - 7 };
  const b = prefabBox('woolly-sock-lodge');
  const longest = Math.max(b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z);
  const s = longest > 0 ? LODGE.size / longest : 1;
  return { east: LODGE.x + b.max.z * s, south: LODGE.z - b.min.x * s, north: LODGE.z - b.max.x * s };
}

/** A plate on a piece's front face (the way its yaw looks), `lateral` metres to its right. */
function plateOn(p: HomePiece, text: string, y: number, w: number, h: number, bg = PLATE_BG, lateral = 0): THREE.Mesh {
  const d = front(p.prefab, p.scale ?? 1) + 0.05;
  const sn = Math.sin(p.yaw), cs = Math.cos(p.yaw);
  return textPlate(text, p.x + sn * d + cs * lateral, y, p.z + cs * d - sn * lateral, p.yaw, { w, h, bg });
}

function pylonPoint(k: number): { x: number; z: number } {
  const f = k / (TOW.pylons - 1);
  return { x: TOW.base.x + (TOW.top.x - TOW.base.x) * f, z: TOW.base.z + (TOW.top.z - TOW.base.z) * f };
}

/** A thin strip lying on the snow along a polyline, following the ground. */
function skiTrack(pts: [number, number][], width: number): THREE.Mesh {
  const pos: number[] = [];
  const idx: number[] = [];
  pts.forEach(([x, z], i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const l = Math.hypot(dx, dz) || 1;
    const nx = (-dz / l) * width / 2, nz = (dx / l) * width / 2;
    for (const sgn of [-1, 1]) {
      const px = x + nx * sgn, pz = z + nz * sgn;
      pos.push(px, heightAt(px, pz) + 0.04, pz);
    }
    if (i > 0) { const k = i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  const m = new THREE.MeshBasicMaterial({ color: 0x4a4f55, side: THREE.DoubleSide });
  flatLayer(m, LAYER.marking);
  const mesh = new THREE.Mesh(g, m);
  mesh.name = 'ski-track';
  return mesh;
}

/** Groomer stripes: faint parallel bands (0.5 m wide, 1 m apart) lying on the snow along a polyline, `width` m across. */
function corduroy(pts: [number, number][], width: number): THREE.Mesh {
  const pos: number[] = [];
  const idx: number[] = [];
  const bands = Math.floor(width);
  let base = 0;
  for (let k = 0; k < bands; k++) {
    const off = -width / 2 + (k + 0.5) * (width / bands);
    pts.forEach(([x, z], i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const dx = b[0] - a[0], dz = b[1] - a[1];
      const l = Math.hypot(dx, dz) || 1;
      const nx = -dz / l, nz = dx / l;
      for (const e of [off - 0.25, off + 0.25]) {
        const px = x + nx * e, pz = z + nz * e;
        pos.push(px, heightAt(px, pz) + 0.03, pz);
      }
      if (i > 0) { const q = base + i * 2; idx.push(q - 2, q - 1, q, q - 1, q + 1, q); }
    });
    base += pts.length * 2;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  const m = new THREE.MeshBasicMaterial({ color: 0xc4d6f0, transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide });
  flatLayer(m, LAYER.area);
  const mesh = new THREE.Mesh(g, m);
  mesh.name = 'corduroy';
  mesh.frustumCulled = false;
  return mesh;
}

/** The run's line down the hill: start, every gate, finish, eased between them (sampled every `step` m of z). */
function runLine(run: RunDef, step: number): [number, number][] {
  const way = [run.start, ...run.gates, run.finish];
  const out: [number, number][] = [];
  for (let i = 0; i < way.length - 1; i++) {
    const a = way[i], b = way[i + 1];
    const n = Math.max(1, Math.round((b.z - a.z) / step));
    for (let k = 0; k < n; k++) {
      const f = k / n;
      out.push([a.x + (b.x - a.x) * (f * f * (3 - 2 * f)), a.z + (b.z - a.z) * f]);
    }
  }
  out.push([run.finish.x, run.finish.z]);
  return out;
}

/** The curved run-out corral south of the finish lines: bales and fence sections along a bow, `n`+1 samples of it. */
function corralLine(x0: number, x1: number, zEnd: number, bow: number, n = 240): { x: number; z: number; s: number }[] {
  const out: { x: number; z: number; s: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x0 + (x1 - x0) * t, z = zEnd - bow * Math.sin(Math.PI * t);
    const prev = out[i - 1];
    out.push({ x, z, s: prev ? prev.s + Math.hypot(x - prev.x, z - prev.z) : 0 });
  }
  return out;
}

/** The rope: the up line and the return line 0.8 m beside it (as tow.ts), sampled along the ground. */
function buildRope(): THREE.LineSegments {
  const dx = TOW.top.x - TOW.base.x, dz = TOW.top.z - TOW.base.z;
  const len = Math.hypot(dx, dz);
  const sx = (-dz / len) * 0.8, sz = (dx / len) * 0.8;
  const pos: number[] = [];
  const steps = (TOW.pylons - 1) * 8;
  const at = (i: number, off: number): [number, number, number] => {
    const f = i / steps;
    const x = TOW.base.x + dx * f + sx * off, z = TOW.base.z + dz * f + sz * off;
    return [x, heightAt(x, z) + ROPE_Y, z];
  };
  for (let i = 0; i < steps; i++) {
    for (const off of [0, 1]) pos.push(...at(i, off), ...at(i + 1, off));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const rope = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x2a2a2a }));
  rope.name = 'bootlace-tow-rope';
  rope.frustumCulled = false;
  return rope;
}

/** A prefab tipped forward by `pitch` radians (a one-off pose for a vignette); null while the prefab is missing. */
function tilted(id: string, x: number, z: number, y: number, yaw: number, pitch: number, scale = 1, tint?: number): THREE.Object3D | null {
  if (!getPrefab(id)) return null;
  const o = buildPrefab(id, tint === undefined ? { lights: false } : { lights: false, tint });
  const grp = new THREE.Group();
  o.rotation.x = pitch;
  grp.add(o);
  grp.position.set(x, heightAt(x, z) + y, z);
  grp.rotation.y = yaw;
  grp.scale.setScalar(scale);
  return grp;
}

export function buildSnowdropSlope(scene: THREE.Scene): SnowdropScenery {
  const life = new THREE.Group();
  life.name = 'snowdrop-slope';
  const lb = lodgeBounds();
  const g = (x: number, z: number): number => heightAt(x, z);

  const pieces: HomePiece[] = [];
  const add = (p: HomePiece): HomePiece => { pieces.push(p); return p; };

  // The lodge and its porch (the porch spots stay clear: nothing there is solid).
  add({ prefab: 'woolly-sock-lodge', x: LODGE.x, z: LODGE.z, yaw: LODGE.yaw, size: LODGE.size });
  const rack = add({ prefab: 'ski-rack', x: SKI_RACK.x, z: SKI_RACK.z, yaw: HALF_PI, solid: false });
  [0, 0.06, 0.12].forEach((y, i) => add({
    prefab: 'tea-tray-sled', x: SLED_STACK.x, z: SLED_STACK.z, yaw: [0.1, -0.12, 0.2][i], y, solid: false,
  }));
  const hatch = add({ prefab: 'crate', x: COCOA_HATCH.x - 1.4, z: COCOA_HATCH.z, yaw: HALF_PI, solid: false });
  const sockRack = add({ prefab: 'sock-rack', x: lb.east - 1, z: lb.south + 3, yaw: HALF_PI, solid: false });
  add({ prefab: 'crate', x: sockRack.x + 1.1, z: sockRack.z + 0.2, yaw: 0.4, solid: false });
  add({ prefab: 'piste-map-board', x: lb.east - 1, z: lb.north - 3.5, yaw: HALF_PI, solid: false });
  add({ prefab: 'bench', x: LODGE.x + 2, z: lb.north - 1.2, yaw: Math.PI });
  add({ prefab: 'woodpile', x: LODGE.x - 3, z: lb.north - 1.2, yaw: Math.PI });

  // The Bootlace Tow.
  const towYaw = Math.atan2(TOW.top.x - TOW.base.x, TOW.top.z - TOW.base.z);
  for (let k = 0; k < TOW.pylons; k++) {
    const p = pylonPoint(k);
    add({ prefab: 'tow-pylon', x: p.x, z: p.z, yaw: towYaw });
  }
  add({ prefab: 'lost-mittens', x: TOW.base.x + 2.2, z: TOW.base.z + 1, yaw: 0.7, solid: false });
  const baseSign = add({ prefab: 'signpost', x: TOW.base.x + 3.2, z: TOW.base.z + 3, yaw: 0, solid: false });

  // Every skis run: a start hut, slalom flags at every gate (the Nursery's are smaller, yellow and green).
  const skisRuns = RUNS.filter((r) => r.ride === 'snow-skis');
  const huts: { run: RunDef; piece: HomePiece }[] = [];
  const hutSpots: { x: number; z: number }[] = [];
  for (const run of skisRuns) {
    const hx = run.start.x - 16;
    let hz = run.start.z - 4;
    while (hutSpots.some((h) => Math.hypot(h.x - hx, h.z - hz) < 6)) hz += 9;
    hutSpots.push({ x: hx, z: hz });
    huts.push({ run, piece: add({ prefab: 'start-hut', x: hx, z: hz, yaw: 0 }) });
    const small = run.id === 'nursery';
    run.gates.forEach((gate, i) => {
      const tint = small ? (i % 2 === 0 ? YELLOW : GREEN) : (i % 2 === 0 ? BLUE : RED);
      for (const side of [-1, 1]) {
        add({ prefab: 'slalom-flag', x: gate.x + side * gate.half, z: gate.z, yaw: 0, tint, scale: small ? 0.8 : 1, solid: false });
      }
    });
  }
  // One finish banner per distinct finish line.
  const banners: HomePiece[] = [];
  for (const run of RUNS) {
    if (banners.some((b) => Math.hypot(b.x - run.finish.x, b.z - run.finish.z) < 3)) continue;
    banners.push(add({ prefab: 'finish-banner', x: run.finish.x, z: run.finish.z, yaw: Math.PI, solid: false }));
  }

  // The top station at the tow's top: a hut beside the line, facing it.
  const topHut = add({ prefab: 'start-hut', x: TOW.top.x + 7, z: TOW.top.z + 2, yaw: -HALF_PI, tint: 0x8a5a3c });

  // The Tea-Tray Run.
  const tt = TEA_TRAY_RUN;
  for (let z = tt.start.z; z <= tt.finish.z + 0.1; z += 30) {
    for (const side of [-1, 1]) add({ prefab: 'slalom-flag', x: tt.start.x + side * 9, z, yaw: 0, tint: ORANGE, solid: false });
  }
  const teaSign = add({ prefab: 'signpost', x: tt.start.x + 11, z: tt.start.z - 4, yaw: 0, solid: false });

  // Piste poles every 30 m along both edges of the Wool Run corridor (blue) and the Tea-Tray lane (red); an orange
  // snow fence along the lane's west side. Skipped while the prefabs are missing from the catalogue.
  const wool = WOOL_RUN;
  const woolX0 = Math.min(wool.start.x - wool.start.half, ...wool.gates.map((q) => q.x - q.half)) - 4;
  const woolX1 = Math.max(wool.start.x + wool.start.half, ...wool.gates.map((q) => q.x + q.half)) + 4;
  for (let z = wool.start.z; z <= wool.finish.z; z += 30) {
    for (const x of [woolX0, woolX1]) add({ prefab: 'piste-pole', x, z, yaw: 0, tint: BLUE, solid: false });
  }
  for (let z = tt.start.z + 15; z <= tt.finish.z; z += 30) {
    for (const side of [-1, 1]) add({ prefab: 'piste-pole', x: tt.start.x + side * 10.5, z, yaw: 0, tint: RED, solid: false });
  }
  for (let z = tt.start.z + 2; z <= tt.finish.z; z += 4) {
    add({ prefab: 'snow-fence', x: tt.start.x - 12, z, yaw: HALF_PI, tint: ORANGE, solid: false });
  }

  // The run-out corral: a bow of hay bales and fence sections south of the finish lines, well short of the band road.
  const finX0 = Math.min(...RUNS.map((r) => r.finish.x - r.finish.half)) - 3;
  const finX1 = Math.max(...RUNS.map((r) => r.finish.x + r.finish.half)) + 3;
  const arc = corralLine(finX0, finX1, -976, 20);
  const kinds: [string, number][] = [['hay-bale', 1.6], ['hay-bale', 1.6], ['hay-bale', 1.6], ['snow-fence', 4]];
  let sAt = 0, ki = 0;
  while (sAt < arc[arc.length - 1].s - 2) {
    const [id, len] = kinds[ki++ % kinds.length];
    const mid = sAt + len / 2;
    const j = Math.min(arc.length - 2, Math.max(1, arc.findIndex((q) => q.s >= mid)));
    const p0 = arc[j - 1], p1 = arc[j + 1], c = arc[j];
    sAt += len;
    const yaw = Math.atan2(-(p1.z - p0.z), p1.x - p0.x);
    if (id === 'hay-bale') add({ prefab: id, x: c.x, z: c.z, yaw, scale: 3 });
    else add({ prefab: id, x: c.x, z: c.z, yaw, tint: ORANGE, solid: true });
  }

  // The foot sign and the vignette props.
  const footSign = add({ prefab: 'signpost', x: -400, z: -1004, yaw: 0, solid: false });
  add({ prefab: 'snowman', x: -425, z: -1052, yaw: 0.3, solid: false });
  add({ prefab: 'hay-bale', x: -388, z: -1029, yaw: 0.2, solid: false });

  // A low snow berm on the lodge's uphill (north) side.
  [[-3.5, -3.4, 0.55], [0.4, -3.8, 0.7], [4, -3.3, 0.5]].forEach(([dx, dz, k], i) => add({
    prefab: 'snowman', x: LODGE.x + dx, z: lb.north + dz - 0.4, yaw: i, scale: k, tint: SNOW_LUMP, solid: false,
  }));

  // Pine clumps on the west and east margins, clear of the runs, the tow line and the lodge.
  const clumps: [number, number][] = [[-472, -1075], [-468, -1170], [-472, -1255], [-256, -1060], [-254, -1160], [-258, -1255]];
  clumps.forEach(([cx, cz], ci) => {
    const n = 3 + (ci % 3);
    for (let k = 0; k < n; k++) {
      const ang = k * 2.4 + ci;
      const r = k === 0 ? 0 : 2.6 + (k % 2) * 1.4;
      add({
        prefab: 'snow-pine', x: cx + Math.cos(ang) * r, z: cz + Math.sin(ang) * r * 1.2, yaw: ang * 1.7,
        scale: 0.8 + ((ci * 3 + k * 5) % 7) * 0.08,
      });
    }
  });

  const boxes = buildPieces(scene, pieces, 'snowdrop-slope');

  // Signs with jokes.
  life.add(plateOn(footSign, 'SNOWDROP SLOPE\nGRADIENT: YES', 1.9, 1.4, 0.55));
  life.add(plateOn(baseSign, 'THE BOOTLACE TOW\nHOLD ON. LET GO.\nIN THAT ORDER.', 1.9, 1.4, 0.7));
  for (const { run, piece } of huts) {
    const n = run.gates.length;
    const text = run.id === 'nursery'
      ? 'THE NURSERY\nLEARNERS. GENTLE. PROBABLY.'
      : `THE WOOL RUN\n${NUMBER_WORDS[n] ?? String(n)} GATES. NO EXCUSES.`;
    life.add(plateOn(piece, text, 1.9, 1.5, 0.55));
  }
  life.add(plateOn(topHut, 'TOP OF THE BOOTLACE', 1.9, 1.3, 0.4));
  life.add(textPlate('THE WOOLLY SOCK LODGE\nBOOTS ON THE RACK.\nTROUBLES IN THE STOVE.', lb.east + 0.05, g(lb.east, LODGE.z + 3) + 1.9,
    LODGE.z + 3, LODGE.yaw, { w: 1.5, h: 0.7, bg: PLATE_BG }));
  life.add(plateOn(hatch, 'HOT COCOA 6 ACORNS', 1.1, 1.0, 0.3));
  life.add(plateOn(rack, 'SKIS 8 / TEA TRAYS 4', 1.5, 1.1, 0.35));
  life.add(plateOn(teaSign, 'THE TEA-TRAY RUN\nROSE SIDE UP', 1.9, 1.3, 0.5));
  const base = TOW.base;
  life.add(textPlate('LOST & FOUND\n(MOSTLY LEFT)', base.x + 2.2, g(base.x + 2.2, base.z + 2.2) + 0.5, base.z + 2.2, 0,
    { w: 0.8, h: 0.35, bg: PLATE_BG }));
  // The finish banners read "FINISH" from above (facing north) and from below.
  for (const b of banners) {
    for (const side of [1, -1]) {
      life.add(textPlate('FINISH', b.x, g(b.x, b.z) + 3.4, b.z + side * 0.06, side > 0 ? 0 : Math.PI, { w: 6, h: 0.9, bg: 0xf5f5f5 }));
    }
  }

  // Vignette 1: the snowman with one ski, and a flattened LEARNERS plate beside it.
  const ski = tilted('snow-skis', -425.4, -1052, 1.2, 0.5, Math.PI / 3);
  if (ski) life.add(ski);
  const flat = new THREE.Group();
  const flatPlate = textPlate('LEARNERS', 0, 0, 0, 0, { w: 1.1, h: 0.4, bg: 0xf2c94c });
  flatPlate.rotation.x = -HALF_PI;
  flat.add(flatPlate);
  flat.position.set(-423, g(-423, -1049.6) + 0.06, -1049.6);
  flat.rotation.y = 0.8;
  life.add(flat);
  // Vignette 2: the sled jammed nose-first into the hay bale, one mitten in the tray.
  const jam = tilted('tea-tray-sled', -388, -1031, 0.35, Math.PI, -0.5);
  if (jam) life.add(jam);
  const mitten = tilted('lost-mittens', -388, -1031.6, 0.7, 0.3, 0, 0.4);
  if (mitten) life.add(mitten);
  // Vignette 3 is the sock rack above: one huge sock and a crate under it. Vignette 4: a knocked-over flag by
  // gate 3 and the ski tracks that swerved round it.
  const gate3 = WOOL_RUN.gates[Math.min(2, WOOL_RUN.gates.length - 1)];
  if (gate3) {
    const down = tilted('slalom-flag', gate3.x + gate3.half + 3, gate3.z - 1, 0.25, 0.4, 1.4, 1, RED);
    if (down) life.add(down);
    const rel = (pts: [number, number][]): [number, number][] => pts.map(([x, z]) => [gate3.x + x, gate3.z + z]);
    life.add(skiTrack(rel([[1, -15], [2, -7], [4, -2], [7, 2], [10, 7], [12, 15]]), 0.18));
    life.add(skiTrack(rel([[-1.4, -15], [-0.4, -7], [1.6, -2], [4.6, 2], [7.6, 7], [9.6, 15]]), 0.18));
    life.add(skiTrack(rel([[2.2, -16], [3.2, -8], [5.4, -1], [8.6, 4], [11.2, 10]]), 0.18));
  }
  // Groomer stripes down the Wool Run's line.
  life.add(corduroy(runLine(WOOL_RUN, 4), 10));

  // The rope and its handles.
  life.add(buildRope());
  const handles = new THREE.Group();
  handles.name = 'bootlace-tow-handles';
  const hs: THREE.Object3D[] = [];
  if (getPrefab('tow-handle')) {
    for (let i = 0; i < TOW.handles; i++) { const h = buildPrefab('tow-handle', { lights: false }); hs.push(h); handles.add(h); }
  }
  life.add(handles);

  // Gentian Bootlace teaches two learners the snowplough.
  const door: [number, number, number] = [lb.east + 1.5, LODGE.z, HALF_PI];
  const home = homeOf('gentian');
  if (home) registerHome({ ...home, door });
  const lastGate = NURSERY_RUN.gates[NURSERY_RUN.gates.length - 1] ?? NURSERY_RUN.finish;
  const classX = lastGate.x + lastGate.half + 6, classZ = lastGate.z + 8;
  const gentian = makeGnome(life, {
    hat: 0xc0392b, shirt: 0x2e5e4e, pants: 0x3b3a4a, skin: 0xe0ac69, boots: 0x222222, beard: 0xd8d8d8, hair: null,
    freckles: false, dress: false, glasses: false, bowlCut: null,
    ...(getPrefab('bobble-beanie') ? { equipment: { head: 'bobble-beanie' } } : {}),
  });
  gentian.object.name = 'snowdrop-gentian';
  const learnerLook = (hat: number, shirt: number) => ({
    hat, shirt, pants: 0x3b3a4a, skin: 0xf1c27d, boots: 0x222222, beard: null, hair: null,
    freckles: true, dress: false, glasses: false, bowlCut: null,
  });
  const learners = [
    { m: makeGnome(life, learnerLook(0xff9f1c, 0xff4fa0)), x: classX - 3, z: classZ - 1.2 },
    { m: makeGnome(life, learnerLook(0x2ec4b6, 0xffd60a)), x: classX - 3, z: classZ + 1.2 },
  ];
  gentian.object.position.set(classX, g(classX, classZ), classZ);
  gentian.object.rotation.y = -HALF_PI;
  for (const l of learners) {
    l.m.object.position.set(l.x, g(l.x, l.z), l.z);
    l.m.object.rotation.y = HALF_PI;
  }
  scene.add(life);
  const slopeLife = buildSlopeLife(life);

  let handlesOn = true;
  return {
    boxes,
    update(dt, t, px, pz) {
      slopeLife.update(dt, t, px, pz);
      const nearTow = Math.hypot(px - (TOW.base.x + TOW.top.x) / 2, pz - (TOW.base.z + TOW.top.z) / 2) < 350;
      if (nearTow !== handlesOn) { handles.visible = nearTow; handlesOn = nearTow; }
      if (nearTow && hs.length) {
        const ps = handlePositions(t, hs.length);
        for (let i = 0; i < hs.length && i < ps.length; i++) {
          hs[i].position.set(ps[i].x, g(ps[i].x, ps[i].z) + ROPE_Y - 0.45, ps[i].z);
        }
      }
      if (Math.hypot(px - classX, pz - classZ) > 250) return;
      // Learners shuffle sideways (knees-in snowplough); Gentian raises an arm every 6 s.
      learners.forEach((l, i) => {
        const z = l.z + Math.sin(t * 0.9 + i * 2.1) * 0.3;
        l.m.object.position.set(l.x, g(l.x, z), z);
        l.m.update(gnomeState(l.x, g(l.x, z), z, HALF_PI, 0), dt);
      });
      gentian.update(gnomeState(classX, g(classX, classZ), classZ, -HALF_PI, 0), dt);
      const phase = t % 6;
      if (phase < 1.2) gentian.arms.right.rotation.x = -2.4 + Math.sin(phase * 8) * 0.15;
    },
  };
}
