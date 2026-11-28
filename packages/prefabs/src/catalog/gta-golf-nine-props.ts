// Gnome Theft Auto: Hedgeworth Links to nine holes (batch 3 E32): Bottom Garden props and storytelling pieces, per hole.
// Everything here is life-size metres (the potting shed is 8 x 6 x 2.6 m), like the other Hedgeworth scenery.
import type { Part, PrefabDef, Vec3 } from '../types';

const DEG = Math.PI / 180;

/** Euler rotation (degrees) of Ry(yaw) * Rx(tilt): tips a part's local +y over toward the compass direction `yaw`. */
function radialRot(yaw: number, tilt: number): Vec3 {
  const sa = Math.sin(yaw * DEG), ca = Math.cos(yaw * DEG);
  const st = Math.sin(tilt * DEG), ct = Math.cos(tilt * DEG);
  return [Math.atan2(st, ca * ct) / DEG, Math.asin(sa * ct) / DEG, Math.atan2(-sa * st, ca) / DEG];
}

// ---- The potting shed: 8 m along x, 6 m along z, 2.6 m tall, flat felt roof, door on +z, window on the north (-z) wall.
const shedParts: Part[] = [
  { s: 'box', d: [8, 2.5, 6], at: [0, 1.25, 0], c: 'tint' },                                   // walls
  { s: 'box', d: [8.04, 0.18, 6.04], at: [0, 0.09, 0], c: 'stone-dark' },                       // brick plinth, just proud
  { s: 'box', d: [8.5, 0.2, 6.5], at: [0, 2.48, 0], c: 'wood-dark' },                           // fascia, under the felt
  { s: 'box', d: [8.2, 0.04, 6.2], at: [0, 2.58, 0], c: 0x2f3338 },                            // tarred felt, top at 2.6
  { s: 'box', d: [0.2, 2.5, 0.2], at: [3.98, 1.25, 2.98], c: 'trim', mirror: true },            // corner boards, front
  { s: 'box', d: [0.2, 2.5, 0.2], at: [3.98, 1.25, -2.98], c: 'trim', mirror: true },           // and back
  // door, on +z, with a frame, a handle and a step
  { s: 'box', d: [1.7, 2.1, 0.06], at: [1.6, 1.05, 3.02], c: 'trim' },
  { s: 'box', d: [1.4, 1.95, 0.08], at: [1.6, 1.0, 3.05], c: 'wood-dark' },
  { s: 'box', d: [0.05, 1.95, 0.09], at: [1.6, 1.0, 3.06], c: 'wood' },
  { s: 'ball', d: [0.06], at: [2.05, 1.0, 3.1], c: 'brass', seg: 6 },
  { s: 'box', d: [1.9, 0.14, 0.6], at: [1.6, 0.07, 3.3], c: 'stone' },
  // window on the north wall, with a sill and cross bars
  { s: 'box', d: [2.1, 1.3, 0.05], at: [-1, 1.5, -3.02], c: 'trim' },
  { s: 'box', d: [1.8, 1.0, 0.06], at: [-1, 1.5, -3.04], c: 'glass', alpha: 0.6 },
  { s: 'box', d: [0.06, 1.0, 0.08], at: [-1, 1.5, -3.06], c: 'trim' },
  { s: 'box', d: [1.8, 0.06, 0.08], at: [-1, 1.5, -3.06], c: 'trim' },
  { s: 'box', d: [2.3, 0.08, 0.2], at: [-1, 0.82, -3.1], c: 'stone' },
  // west wall: gutter, downpipe, water butt
  { s: 'cyl', d: [0.07, 0.07, 6.3], at: [-4.3, 2.4, 0], rot: [90, 0, 0], c: 'iron', seg: 6 },
  { s: 'cyl', d: [0.05, 0.05, 2.3], at: [-4.18, 1.2, 2.5], c: 'iron', seg: 6 },
  { s: 'cyl', d: [0.4, 0.34, 0.9], at: [-4.5, 0.45, 2.5], c: 'green', seg: 10 },
  { s: 'cyl', d: [0.41, 0.41, 0.06], at: [-4.5, 0.93, 2.5], c: 'wood-dark', seg: 10 },
  // front wall: a shelf of pots, a lantern, a coiled hose on a hook
  { s: 'box', d: [1.6, 0.06, 0.3], at: [-2.2, 1.0, 3.15], c: 'wood' },
  { s: 'cyl', d: [0.14, 0.1, 0.2], at: [-2.7, 1.13, 3.15], c: 'terracotta', seg: 8 },
  { s: 'cyl', d: [0.12, 0.09, 0.17], at: [-2.2, 1.11, 3.15], c: 'terracotta', seg: 8 },
  { s: 'cyl', d: [0.14, 0.1, 0.2], at: [-1.7, 1.13, 3.15], c: 'terracotta', seg: 8 },
  { s: 'ring', d: [0.28, 0.04], at: [-3.2, 1.7, 3.1], c: 'green', seg: 10 },
  { s: 'box', d: [0.5, 0.05, 0.05], at: [-1.5, 1.95, 3.1], c: 'wood-dark' },
  // east wall (the ladder leans at its middle, a sign plate hangs south of it): a short rail with tool pegs to the north
  { s: 'box', d: [0.06, 0.08, 1.6], at: [4.04, 1.6, -1.6], c: 'wood-dark' },
  { s: 'box', d: [0.07, 0.9, 0.05], at: [4.08, 1.2, -2.2], c: 'iron-dark' },
  { s: 'box', d: [0.07, 0.8, 0.05], at: [4.08, 1.25, -1.6], c: 'wood' },
  { s: 'box', d: [0.07, 0.7, 0.05], at: [4.08, 1.3, -1.0], c: 'iron-dark' },
  // roof: a stove pipe and a skylight hatch (to the side of the tee)
  { s: 'cyl', d: [0.1, 0.1, 0.7], at: [-3.5, 2.95, -2.4], c: 'iron-dark', seg: 8 },
  { s: 'cyl', d: [0.16, 0.12, 0.08], at: [-3.5, 3.34, -2.4], c: 'iron', seg: 8 },
];

// ---- Giant rhubarb: red stalks fanned from a crown, each carrying a huge crinkled leaf, and a bolted seed plume.
const rhubarbParts: Part[] = [{ s: 'cyl', d: [0.14, 0.18, 0.12], at: [0, 0.06, 0], c: 'leaf-dark', seg: 8 }];
for (let i = 0; i < 7; i++) {
  const a = i * 51 + 8;
  const el = 62 + (i % 3) * 8;          // elevation of the stalk
  const len = 1.15 + (i % 2) * 0.2;
  const dx = Math.sin(a * DEG) * Math.cos(el * DEG), dz = Math.cos(a * DEG) * Math.cos(el * DEG), dy = Math.sin(el * DEG);
  rhubarbParts.push({
    s: 'cyl', d: [0.05, 0.075, len], at: [dx * len / 2, 0.1 + dy * len / 2, dz * len / 2], rot: radialRot(a, 90 - el), c: 'tint', seg: 6,
  });
  const tip: Vec3 = [dx * len, 0.1 + dy * len, dz * len];
  const rot = radialRot(a, 10 + (i % 3) * 10);
  const lx = tip[0] + Math.sin(a * DEG) * 0.28, lz = tip[2] + Math.cos(a * DEG) * 0.28;
  rhubarbParts.push({ s: 'ball', d: [0.5], at: [lx, tip[1] + 0.04, lz], rot, scale: [1, 0.09, 1.12], c: 'leaf', seg: 8 });
  // crinkle: two darker lobes folded over the leaf, and a pale vein down the middle
  rhubarbParts.push({ s: 'ball', d: [0.34], at: [lx + Math.sin((a + 40) * DEG) * 0.3, tip[1] + 0.1, lz + Math.cos((a + 40) * DEG) * 0.3], rot, scale: [1, 0.12, 1], c: 'leaf-dark', seg: 6 });
  rhubarbParts.push({ s: 'box', d: [0.03, 0.02, 0.7], at: [lx, tip[1] + 0.13, lz], rot: radialRot(a, 10 + (i % 3) * 10), c: 'trim' });
}
// the seed plume: a tall stem topped with a cream froth
rhubarbParts.push({ s: 'cyl', d: [0.03, 0.045, 1.9], at: [0.05, 0.95, -0.05], c: 'tint', seg: 6 });
for (const [x, y, z] of [[0.05, 1.95, -0.05], [0.14, 1.85, 0], [-0.04, 1.8, -0.12], [0.12, 1.75, -0.14]] as const) {
  rhubarbParts.push({ s: 'ball', d: [0.11], at: [x, y, z], scale: [1, 1.2, 1], c: 0xefe3c0, seg: 6 });
}

// ---- Giant sunflower: a thick stem, two big leaves, a seed disc and a ring of petals (modelled 2.8 m, scaled in game).
const sunflowerParts: Part[] = [
  { s: 'cyl', d: [0.05, 0.075, 2.3], at: [0, 1.15, 0], c: 'leaf-dark', seg: 6 },
  { s: 'ball', d: [0.3], at: [0.3, 1.0, 0], rot: [0, 0, -20], scale: [1, 0.1, 0.7], c: 'leaf', seg: 8 },
  { s: 'ball', d: [0.26], at: [-0.28, 1.55, 0.04], rot: [0, 0, 20], scale: [1, 0.1, 0.7], c: 'leaf', seg: 8 },
  { s: 'cyl', d: [0.3, 0.3, 0.1], at: [0, 2.3, 0.06], rot: [90, 0, 0], c: 'wood-dark', seg: 12 },
  { s: 'cyl', d: [0.14, 0.14, 0.04], at: [0, 2.3, 0.12], rot: [90, 0, 0], c: 'bark', seg: 10 },
  { s: 'ball', d: [0.08], at: [0, 2.3, 0.16], c: 'honey', seg: 6 },
];
for (let i = 0; i < 16; i++) {
  const a = i * 22.5;
  const r = 0.43;
  sunflowerParts.push({
    s: 'ball', d: [0.15], at: [r * Math.sin(a * DEG), 2.3 + r * Math.cos(a * DEG), 0.03 + (i % 2) * 0.02],
    rot: [0, 0, -a], scale: [0.4, 1, 0.12], c: i % 2 ? 'yellow' : 'honey', seg: 6,
  });
}

// ---- The opening ribbon: two brass posts 6 m apart, a red ribbon swagged between them and a bow in the middle.
const ribbonParts: Part[] = [
  { s: 'cyl', d: [0.035, 0.04, 0.95], at: [3, 0.475, 0], c: 'brass', seg: 8, mirror: true },
  { s: 'cyl', d: [0.12, 0.14, 0.06], at: [3, 0.03, 0], c: 'brass', seg: 8, mirror: true },
  { s: 'ball', d: [0.065], at: [3, 0.98, 0], c: 'brass', seg: 8, mirror: true },
];
{
  const seg = 8, top = 0.88, sag = 0.14;
  for (let i = 0; i < seg; i++) {
    const t0 = i / seg, t1 = (i + 1) / seg;
    const x0 = -2.95 + t0 * 5.9, x1 = -2.95 + t1 * 5.9;
    const y0 = top - sag * Math.sin(Math.PI * t0), y1 = top - sag * Math.sin(Math.PI * t1);
    const len = Math.hypot(x1 - x0, y1 - y0);
    ribbonParts.push({ s: 'box', d: [len + 0.01, 0.09, 0.012], at: [(x0 + x1) / 2, (y0 + y1) / 2, 0], rot: [0, 0, Math.atan2(y1 - y0, x1 - x0) / DEG], c: 'red' });
  }
  // the bow: two loops, a knot and two tails
  ribbonParts.push({ s: 'ball', d: [0.16], at: [-0.17, top - sag + 0.05, 0.01], scale: [1, 0.7, 0.3], rot: [0, 0, 18], c: 'red', seg: 8 });
  ribbonParts.push({ s: 'ball', d: [0.16], at: [0.17, top - sag + 0.05, 0.01], scale: [1, 0.7, 0.3], rot: [0, 0, -18], c: 'red', seg: 8 });
  ribbonParts.push({ s: 'ball', d: [0.06], at: [0, top - sag + 0.04, 0.02], c: 'wax', seg: 6 });
  ribbonParts.push({ s: 'box', d: [0.07, 0.4, 0.012], at: [-0.08, top - sag - 0.18, 0.015], rot: [0, 0, 8], c: 'red' });
  ribbonParts.push({ s: 'box', d: [0.07, 0.36, 0.012], at: [0.09, top - sag - 0.16, 0.015], rot: [0, 0, -10], c: 'red' });
}

// ---- Ceremonial scissors: oversized, resting open on a velvet cushion on a little table.
const scissorParts: Part[] = [
  { s: 'box', d: [1.0, 0.04, 0.6], at: [0, 0.62, 0], c: 'wood' },                                   // table top
  { s: 'box', d: [0.05, 0.6, 0.05], at: [0.44, 0.3, 0.24], c: 'wood-dark', mirror: true },        // legs, front
  { s: 'box', d: [0.05, 0.6, 0.05], at: [0.44, 0.3, -0.24], c: 'wood-dark', mirror: true },       // back
  { s: 'box', d: [0.86, 0.1, 0.46], at: [0, 0.69, 0], c: 'wax' },                                  // cushion
  { s: 'ball', d: [0.045], at: [0.43, 0.69, 0.23], c: 'gold', seg: 6, mirror: true },              // tassels
  { s: 'ball', d: [0.045], at: [0.43, 0.69, -0.23], c: 'gold', seg: 6, mirror: true },
  { s: 'box', d: [0.5, 0.012, 0.07], at: [-0.12, 0.75, 0.09], rot: [0, 12, 0], c: 'steel' },       // blades
  { s: 'box', d: [0.5, 0.012, 0.07], at: [-0.12, 0.756, -0.09], rot: [0, -12, 0], c: 'silver' },
  { s: 'ring', d: [0.085, 0.012], at: [0.28, 0.75, 0.16], rot: [90, 0, 0], c: 'gold', seg: 10 },   // handles
  { s: 'ring', d: [0.085, 0.012], at: [0.28, 0.756, -0.16], rot: [90, 0, 0], c: 'gold', seg: 10 },
  { s: 'ball', d: [0.025], at: [0.05, 0.765, 0], c: 'brass', seg: 6 },                              // pivot
  { s: 'box', d: [0.2, 0.01, 0.1], at: [0.1, 0.785, 0], rot: [0, 0, 0], c: 'paper' },             // the little card
];

// ---- Turf rolls: a pallet and a pyramid of six rolls.
const turfParts: Part[] = [
  { s: 'box', d: [1.3, 0.1, 0.9], at: [0, 0.05, 0], c: 'wood' },
  { s: 'box', d: [0.06, 0.02, 0.92], at: [0, 0.106, 0], c: 'wood-dark', mirror: true },
];
for (const [x, y] of [[-0.42, 0.4], [0, 0.4], [0.42, 0.4], [-0.21, 0.78], [0.21, 0.78], [0, 1.16]] as const) {
  turfParts.push({ s: 'cyl', d: [0.2, 0.2, 0.86], at: [x, y, 0], rot: [0, 0, 90], c: 'grass', seg: 10 });
  turfParts.push({ s: 'cyl', d: [0.13, 0.13, 0.9], at: [x, y, 0], rot: [0, 0, 90], c: 'dirt', seg: 8 });
}
turfParts.push({ s: 'box', d: [1.34, 0.03, 0.04], at: [0, 0.62, 0.2], c: 'iron-dark' });
turfParts.push({ s: 'box', d: [0.5, 0.35, 0.02], at: [0.5, 0.35, 0.47], c: 'paper' });

// ---- The opening marquee: a small white party tent, 4 x 4 m, bunting along the ridge and at the front gable.
const marqueeParts: Part[] = [
  { s: 'cyl', d: [0.04, 0.04, 2.2], at: [1.95, 1.1, 1.95], c: 'wood-light', seg: 6, mirror: true },
  { s: 'cyl', d: [0.04, 0.04, 2.2], at: [1.95, 1.1, -1.95], c: 'wood-light', seg: 6, mirror: true },
  { s: 'cyl', d: [0.035, 0.035, 0.8], at: [0, 2.6, 1.95], c: 'wood-light', seg: 6 },
  { s: 'cyl', d: [0.035, 0.035, 0.8], at: [0, 2.6, -1.95], c: 'wood-light', seg: 6 },
  { s: 'cyl', d: [0.03, 0.03, 4.1], at: [0, 2.98, 0], rot: [90, 0, 0], c: 'wood-light', seg: 6 },
  { s: 'box', d: [2.2, 0.04, 4.3], at: [1.0, 2.6, 0], rot: [0, 0, 20], c: 'white' },
  { s: 'box', d: [2.2, 0.04, 4.3], at: [-1.0, 2.6, 0], rot: [0, 0, -20], c: 'white' },
  { s: 'box', d: [0.04, 0.32, 4.3], at: [2.07, 2.02, 0], c: 'red' },
  { s: 'box', d: [0.04, 0.32, 4.3], at: [-2.07, 2.02, 0], c: 'red' },
  { s: 'box', d: [4.0, 0.03, 4.0], at: [0, 0.07, 0], c: 'wool' },                                   // groundsheet
  { s: 'box', d: [0.04, 1.4, 1.6], at: [-1.98, 1.5, -1.0], c: 'white' },                           // half-drawn side wall
];
// Stepped gable triangles close the roof's two ends above the eaves.
for (const z of [2.1, -2.1]) {
  [[3.7, 0.24, 2.36], [2.5, 0.24, 2.6], [1.3, 0.22, 2.83]].forEach(([w, h, y]) => {
    marqueeParts.push({ s: 'box', d: [w, h, 0.04], at: [0, y, z], c: 'white' });
  });
}
for (let i = 0; i < 7; i++) {
  const x = -1.8 + i * 0.6;
  const y = 2.15 + (1 - Math.abs(x) / 2) * 0.62;
  for (const z of [2.12, -2.12]) {
    marqueeParts.push({ s: 'cone', d: [0.1, 0.24], at: [x, y - 0.12, z], rot: [180, 0, 0], c: i % 3 === 0 ? 'red' : i % 3 === 1 ? 'yellow' : 'glaze-blue', seg: 3 });
  }
}

// ---- The giant birdbath: a stone pedestal, a wide bowl brimming with the Drip, a sparrow on the rim.
const birdbathParts: Part[] = [
  { s: 'cyl', d: [1.35, 1.5, 0.35], at: [0, 0.175, 0], c: 0x8f8a80, seg: 12 },
  { s: 'cyl', d: [0.9, 1.05, 0.5], at: [0, 0.6, 0], c: 0xb5b0a4, seg: 12 },
  { s: 'cyl', d: [0.55, 0.75, 1.9], at: [0, 1.8, 0], c: 0xc2bdb1, seg: 12 },
  { s: 'cyl', d: [0.75, 0.55, 0.25], at: [0, 2.85, 0], c: 0xa59f93, seg: 12 },
  { s: 'cyl', d: [2.5, 0.8, 0.9], at: [0, 3.45, 0], c: 0xcfcabd, seg: 16 },
  { s: 'ring', d: [2.46, 0.12], at: [0, 3.9, 0], rot: [90, 0, 0], c: 'stone-dark', seg: 14 },
  { s: 'cyl', d: [2.3, 2.3, 0.04], at: [0, 3.78, 0], c: 'water', alpha: 0.85, seg: 16 },
  { s: 'ball', d: [0.35], at: [0.5, 0.2, 0.6], scale: [1, 0.4, 1], c: 'moss', seg: 6 },
  { s: 'ball', d: [0.3], at: [-0.7, 0.28, -0.7], scale: [1, 0.4, 1], c: 'moss', seg: 6 },
  { s: 'box', d: [0.05, 0.6, 0.14], at: [0.55, 1.4, 0.45], rot: [0, 25, 0], c: 'moss' },
  // the sparrow on the rim: a body, a head, a tail and a beak
  { s: 'ball', d: [0.12], at: [0, 4.07, 2.4], scale: [1, 0.9, 1.4], c: 'wood', seg: 6 },
  { s: 'ball', d: [0.08], at: [0, 4.2, 2.52], c: 'wood-light', seg: 6 },
  { s: 'cone', d: [0.025, 0.07], at: [0, 4.2, 2.62], rot: [90, 0, 0], c: 'honey', seg: 4 },
  { s: 'box', d: [0.06, 0.02, 0.2], at: [0, 4.06, 2.22], rot: [10, 0, 0], c: 'wood-dark' },
  // a lost golf ball in the bowl
  { s: 'ball', d: [0.07], at: [0.9, 3.82, -0.5], c: 'white', seg: 8 },
];

// ---- The tea trestle: a long table with a white cloth, six untouched cups, a pot and a cake under a glass cloche.
const trestleParts: Part[] = [
  { s: 'box', d: [2.4, 0.04, 0.8], at: [0, 0.76, 0], c: 'wood-light' },
  { s: 'box', d: [2.44, 0.5, 0.84], at: [0, 0.72, 0], c: 'white' },
  { s: 'box', d: [2.44, 0.02, 0.84], at: [0, 0.97, 0], c: 'white' },
  { s: 'box', d: [0.05, 0.74, 0.7], at: [1.0, 0.37, 0], rot: [0, 0, 8], c: 'wood-dark' },
  { s: 'box', d: [0.05, 0.74, 0.7], at: [-1.0, 0.37, 0], rot: [0, 0, -8], c: 'wood-dark' },
  { s: 'cyl', d: [0.3, 0.3, 0.03], at: [-0.4, 1.0, 0], c: 'silver', seg: 12 },                         // cake stand
  { s: 'cyl', d: [0.24, 0.24, 0.14], at: [-0.4, 1.09, 0], c: 'pink', seg: 12 },                        // cake
  { s: 'cyl', d: [0.24, 0.24, 0.03], at: [-0.4, 1.17, 0], c: 'white', seg: 12 },
  { s: 'ball', d: [0.035], at: [-0.4, 1.2, 0], c: 'ruby', seg: 6 },
  { s: 'ball', d: [0.3], at: [-0.4, 1.0, 0], scale: [1, 1.1, 1], c: 'glass', alpha: 0.28, seg: 10 },    // cloche
  { s: 'ball', d: [0.03], at: [-0.4, 1.34, 0], c: 'brass', seg: 6 },
  { s: 'ball', d: [0.11], at: [0.3, 1.1, 0], scale: [1, 0.85, 1], c: 'white', seg: 8 },                  // teapot
  { s: 'cone', d: [0.025, 0.1], at: [0.42, 1.12, 0], rot: [0, 0, -70], c: 'white', seg: 5 },
  { s: 'ball', d: [0.03], at: [0.3, 1.2, 0], c: 'gold', seg: 5 },
];
for (let i = 0; i < 6; i++) {
  const x = 0.72 + (i % 2) * 0.4 - 0.4 * 0, z = -0.2 + Math.floor(i / 2) * 0.2;
  trestleParts.push({ s: 'cyl', d: [0.06, 0.04, 0.07], at: [x, 1.035, z], c: 'white', seg: 8 });
}

// ---- The halfway table (the Turn): a tea urn, cups, a biscuit tin and an honesty box with a coin slot.
const halfwayParts: Part[] = [
  { s: 'box', d: [1.8, 0.05, 0.8], at: [0, 0.8, 0], c: 'wood' },
  { s: 'box', d: [0.06, 0.78, 0.7], at: [0.8, 0.39, 0], c: 'wood-dark' },
  { s: 'box', d: [0.06, 0.78, 0.7], at: [-0.8, 0.39, 0], c: 'wood-dark' },
  { s: 'box', d: [1.9, 0.012, 0.9], at: [0, 0.83, 0], c: 0x6aa07a },                                      // green baize runner
  { s: 'cyl', d: [0.17, 0.17, 0.5], at: [-0.5, 1.1, 0], c: 'silver', seg: 12 },                          // urn
  { s: 'cyl', d: [0.12, 0.17, 0.08], at: [-0.5, 1.39, 0], c: 'silver', seg: 12 },
  { s: 'ball', d: [0.04], at: [-0.5, 1.47, 0], c: 'brass', seg: 6 },
  { s: 'cyl', d: [0.02, 0.02, 0.1], at: [-0.5, 1.0, 0.2], rot: [90, 0, 0], c: 'brass', seg: 6 },        // tap
  { s: 'ball', d: [0.05], at: [-0.5, 0.9, 0.3], c: 'brass', seg: 6 },
  { s: 'cyl', d: [0.14, 0.14, 0.02], at: [-0.5, 0.855, 0.32], c: 'white', seg: 12 },                     // drip tray
  { s: 'box', d: [0.38, 0.28, 0.28], at: [0.45, 0.97, 0], c: 'iron-dark' },                              // honesty box
  { s: 'box', d: [0.12, 0.012, 0.025], at: [0.45, 1.115, 0], c: 'black' },                               // slot
  { s: 'box', d: [0.3, 0.14, 0.015], at: [0.45, 0.99, 0.15], c: 'paper' },                               // label
  { s: 'box', d: [0.04, 0.04, 0.3], at: [0.45, 0.985, -0.01], c: 'brass' },                              // hasp
  { s: 'box', d: [0.24, 0.1, 0.18], at: [0.0, 0.88, -0.05], c: 'red' },                                  // biscuit tin
  { s: 'box', d: [0.26, 0.03, 0.2], at: [0.0, 0.945, -0.05], c: 'gold' },
];
for (let i = 0; i < 4; i++) {
  halfwayParts.push({ s: 'cyl', d: [0.06, 0.04, 0.07], at: [-0.15 + i * 0.02, 0.86 + i * 0.07, 0.3], c: 'white', seg: 8 }); // a stack of cups
}
for (let i = 0; i < 3; i++) {
  halfwayParts.push({ s: 'cyl', d: [0.06, 0.04, 0.07], at: [0.95 + (i % 2) * 0.0, 0.86, 0.1 - i * 0.18], c: 'cloth', seg: 8 });
}

// ---- A folding chair (the opening nobody held): slatted seat and back, tubular legs.
const chairParts: Part[] = [
  { s: 'box', d: [0.48, 0.04, 0.46], at: [0, 0.46, 0], c: 'wood-light' },
  { s: 'box', d: [0.46, 0.34, 0.03], at: [0, 0.72, -0.22], rot: [-8, 0, 0], c: 'wood-light' },
  { s: 'box', d: [0.03, 0.46, 0.03], at: [0.2, 0.23, 0.19], rot: [0, 0, 6], c: 'iron', mirror: true },
  { s: 'box', d: [0.03, 0.46, 0.03], at: [0.2, 0.23, -0.19], rot: [0, 0, 6], c: 'iron', mirror: true },
  { s: 'box', d: [0.44, 0.02, 0.02], at: [0, 0.2, 0.19], c: 'iron' },
  { s: 'box', d: [0.44, 0.02, 0.02], at: [0, 0.2, -0.19], c: 'iron' },
  { s: 'box', d: [0.5, 0.03, 0.05], at: [0, 0.49, 0.22], c: 'red' },                                      // a ribbon sash on the seat front
];

// ---- A ball net: a long-handled pond net for fishing wet balls out of the Drip.
const netParts: Part[] = [
  { s: 'cyl', d: [0.015, 0.018, 1.9], at: [0, 0.95, 0], c: 'wood', seg: 6 },
  { s: 'ring', d: [0.2, 0.012], at: [0, 1.98, 0.0], rot: [0, 0, 0], c: 'iron', seg: 12 },
  { s: 'ball', d: [0.2], at: [0, 1.88, 0], scale: [1, 0.9, 0.32], c: 'cloth', alpha: 0.45, seg: 8 },
  { s: 'cyl', d: [0.02, 0.02, 0.2], at: [0, 0.1, 0], c: 'red', seg: 6 },                                    // rubber grip
];

// ---- A member's tam: a tartan bonnet with a bobble, lost in the maze.
const tamParts: Part[] = [
  { s: 'cyl', d: [0.2, 0.17, 0.07], at: [0, 0.07, 0], c: 'tint', seg: 12 },
  { s: 'cyl', d: [0.17, 0.17, 0.05], at: [0, 0.025, 0], c: 'black', seg: 12 },
  { s: 'ball', d: [0.2], at: [0, 0.1, 0], scale: [1, 0.35, 1], c: 'tint', seg: 10 },
  { s: 'cyl', d: [0.205, 0.205, 0.012], at: [0, 0.07, 0], c: 'trim', seg: 12 },
  { s: 'ball', d: [0.035], at: [0, 0.145, 0], c: 'red', seg: 6 },
];

// ---- A garden sign: two posts, a blank board for the game's text plate and a little roof. 1.9 x 1.0 board, 2.05 m tall.
const gardenSignParts: Part[] = [
  { s: 'box', d: [0.1, 1.9, 0.1], at: [0.9, 0.95, 0], c: 'wood-dark', mirror: true },
  { s: 'box', d: [1.9, 1.0, 0.06], at: [0, 1.4, 0], c: 'tint' },
  { s: 'box', d: [2.1, 0.06, 0.3], at: [0, 1.96, 0.02], rot: [-6, 0, 0], c: 'wood-dark' },
  { s: 'box', d: [0.12, 0.12, 0.12], at: [0.9, 1.93, 0], c: 'wood', mirror: true },
];

export const GTA_GOLF_NINE_PROPS: readonly PrefabDef[] = [
  {
    id: 'garden-sign', name: 'Garden Sign', category: 'prop', uses: ['place'],
    tags: ['sign', 'board', 'garden', 'notice', 'post', 'gta', 'golf', 'hedgeworth'], emoji: [],
    tint: 'wood-light',
    about: 'Gnome Theft Auto: a wide garden sign: two oak posts, a blank board 1.9 x 1.0 m (the game puts a text plate on its +z face, at y 1.4, 0.04 m out) and a little tilted roof. Tint is the board.',
    examine: [
      'A wide board on two oak posts with a little roof, painted over so many times that the words have started to rise out of the wood.',
      'The roof keeps the drizzle off the lettering. The lettering has opinions about the drizzle, and none of them are polite.',
      'Tip: read it before you hit. It will not change, but you will feel better having been told.',
      'Joke: every sign in the Bottom Garden was put up by Thrift, who can spell and has chosen not to.',
      'The board is blank until the game writes on it. Basil says that is the best kind of sign.',
    ],
    parts: gardenSignParts,
  },
  {
    id: 'potting-shed', name: 'Potting Shed', category: 'prop', uses: ['place'],
    tags: ['shed', 'potting', 'roof', 'tee', 'garden', 'felt', 'gta', 'golf', 'hedgeworth'], emoji: [],
    tint: 0x7d9a76, trim: 0xe9e2cd,
    footprint: { r: 2, h: 2.6 },
    about: 'Gnome Theft Auto: the Tall One\'s potting shed, life-size metres: 8 m along x, 6 m along z, 2.6 m tall, with a flat felt roof (hole 7\'s tee), a door and step on +z, a window on the north wall, a gutter, water butt and downpipe on the west. Tint is the wall paint, trim the frames.',
    examine: [
      'A long green shed with a flat felt roof, a gutter, a water butt and a door a Tall One could use. Thrift has nothing to say about the roof, which is a first.',
      'The roof is flat so the golfers cannot roll off it. Most of them find a way.',
      'The window faces north, where the light is. Nothing grows inside. Everything is on its way to being somewhere else.',
      'Painted the colour of a tired lettuce, to blend in. It does not blend in. It has stood out for years.',
      'The whole shed hums faintly when the wind is in the west. Basil calls it the opening hymn. Peony calls it the pump.',
    ],
    parts: shedParts,
  },
  {
    id: 'giant-rhubarb', name: 'Giant Rhubarb', category: 'prop', uses: ['place'],
    tags: ['rhubarb', 'plant', 'leaf', 'giant', 'stalk', 'garden', 'red', 'gta', 'golf'], emoji: [],
    tint: 0xb8323f, trim: 0xe8d8a8,
    about: 'Giant rhubarb: seven red stalks fanned from a crown, each carrying a huge crinkled leaf with a pale vein, and a bolted seed plume. About 2.8 m across; the game scales it up. Tint is the stalk colour.',
    examine: [
      'Seven red stalks, each holding up a leaf the size of a picnic table. The plume in the middle has bolted, and will not apologise.',
      'The Tall One planted it as a treat. It has been growing for longer than the club has been waiting.',
      'Tip: the leaves are not for eating. The stalks are, with sugar. The hole is not for eating, but Basil has tried.',
      'A ball that lands under a leaf is not lost, only unavailable until the rhubarb is in a better mood.',
      'It rustles when nobody is near. Members say it is the wind. The rhubarb says it is applause.',
    ],
    parts: rhubarbParts,
  },
  {
    id: 'giant-sunflower', name: 'Giant Sunflower', category: 'prop', uses: ['place'],
    tags: ['sunflower', 'flower', 'plant', 'giant', 'yellow', 'garden', 'gta', 'golf'], emoji: [],
    about: 'Giant sunflower: a thick stem, two broad leaves, a seed disc and sixteen petals in two yellows, facing +z. Modelled 2.8 m tall; the game scales it to about 4.5 m.',
    examine: [
      'A stem as thick as a post, topped with a face the size of a cartwheel, looking vaguely south and vaguely pleased about it.',
      'Sunflowers follow the sun. This one has followed it round the rhubarb patch twice and is now facing the clubhouse for spite.',
      'Tip: the seeds are for the birds. The petals are for the photographs. The shade is for the golfers who miss the green.',
      'It is taller than the shed and has no handicap.',
      'Peony says it was planted to mark the green from a distance. It marks very little else.',
    ],
    parts: sunflowerParts,
  },
  {
    id: 'opening-ribbon', name: 'Opening Ribbon', category: 'prop', uses: ['place'],
    tags: ['ribbon', 'opening', 'ceremony', 'posts', 'brass', 'red', 'bow', 'gta', 'golf'], emoji: [],
    footprint: { r: 3, h: 1 },
    about: 'Gnome Theft Auto: an opening ribbon strung between two brass posts 6 m apart: a red ribbon in eight swagged lengths, a bow with two tails in the middle. Posts 1 m tall.',
    examine: [
      'Two brass posts, six metres apart, and a red ribbon swagged between them with a bow that has been waiting a very long time.',
      'The ribbon has never been cut. It has, however, faded: the red is now what Peony calls "an established red".',
      'Tip: do not drive through it. It is not that it would hurt. It is that Peony would find out.',
      'Joke: the ribbon was bought for one opening and has since attended four rehearsals.',
      'The bow is tied with a proper sailor knot. Thrift did it, and then gave the ribbon a stern look.',
    ],
    parts: ribbonParts,
  },
  {
    id: 'ceremonial-scissors', name: 'Ceremonial Scissors', category: 'prop', uses: ['place'],
    tags: ['scissors', 'ceremony', 'cushion', 'opening', 'table', 'velvet', 'gta', 'golf'], emoji: [],
    footprint: { r: 0.55, h: 0.85 },
    about: 'Gnome Theft Auto: Peony\'s oversized ceremonial scissors, open on a red velvet cushion with gold tassels on a little table, a card tucked beneath the pivot. About 1 m wide.',
    examine: [
      'A pair of oversized scissors, open, on a red velvet cushion, ready for a moment that has been postponed for several seasons.',
      'The card beneath the pivot says: "Cut here. After the speech." Nobody has written the speech.',
      'Tip: the blades are sharper than they look, and the look is already quite sharp.',
      'Joke: Peony keeps them oiled. She keeps nothing else oiled, which is how the opening ended up here.',
      'The cushion has a faint dent in the shape of a gnome who sat on it once, and was asked, very politely, to leave.',
    ],
    parts: scissorParts,
  },
  {
    id: 'turf-roll-stack', name: 'Turf Roll Stack', category: 'prop', uses: ['place'],
    tags: ['turf', 'roll', 'sod', 'grass', 'pallet', 'stack', 'new', 'gta', 'golf'], emoji: [],
    footprint: { r: 0.7, h: 1.4 },
    about: 'Gnome Theft Auto: a pallet with six rolls of new turf stacked in a pyramid, strapped, with a delivery note tucked in.',
    examine: [
      'Six rolls of new turf on a pallet, strapped and waiting, the grass side tight inside and the root side proud of its own situation.',
      'Delivered for the opening. It has been watered by the dew, unrolled by nobody, and is still green, which Thrift puts down to loyalty.',
      'Tip: it is not a seat. It looks like a seat. Several members have learned otherwise.',
      'Joke: they ordered nine holes of turf and were sent six rolls. Peony says that is "a start".',
      'The delivery note says: "Please sign here." Nobody has signed, and the note has begun to look hopeful.',
    ],
    parts: turfParts,
  },
  {
    id: 'opening-marquee', name: 'Opening Marquee', category: 'prop', uses: ['place'],
    tags: ['tent', 'marquee', 'party', 'white', 'bunting', 'opening', 'gta', 'golf'], emoji: [],
    footprint: { r: 2, h: 3 },
    about: 'Gnome Theft Auto: a small white party marquee, 4 x 4 m, a ridge 3 m high, red valances, six poles, bunting on both gable ends and a half-drawn side wall. Open at the front and back; no collider.',
    examine: [
      'A small white marquee, with red valances and bunting along the ridge, put up for a party that arrived in the planning stage and stayed there.',
      'The bunting has faded in the sun and the guests have faded in the memory, but the tent holds, which is more than can be said for the speech.',
      'Tip: it will keep the drizzle off a tea trestle. It will not keep the awkwardness off the opening.',
      'Joke: it was the best tent in Hedgeworth for a week, and it has been waiting ever since for a worse week to be better than.',
      'One side wall is half drawn, in case a guest turns up. None has.',
    ],
    parts: marqueeParts,
  },
  {
    id: 'giant-birdbath', name: 'Giant Birdbath', category: 'prop', uses: ['place'],
    tags: ['birdbath', 'stone', 'bowl', 'water', 'pedestal', 'giant', 'drip', 'gta', 'golf'], emoji: [],
    footprint: { r: 1.2, h: 4.5 },
    about: 'Gnome Theft Auto: the Drip\'s giant stone birdbath, life-size metres: a stepped pedestal and a 5 m bowl 4 m up, brimming, with a sparrow on the rim, moss at the foot and a lost golf ball in the water.',
    examine: [
      'A stone birdbath the size of a tower, with a bowl you could row in, standing in the middle of the Drip as if it were never anywhere else.',
      'Sparrows bathe in it at dawn and watch the golfers at noon. They keep score. They are never asked.',
      'Tip: the pedestal is solid. A ball that hits it is not lost, just offended.',
      'Joke: the Hosepipe Pond overflows into the Drip and the Drip overflows into the birdbath. Thrift calls this "a system".',
      'There is a golf ball in the bowl. It has been there so long that the sparrows have named it.',
    ],
    parts: birdbathParts,
  },
  {
    id: 'tea-trestle', name: 'Tea Trestle', category: 'prop', uses: ['place'],
    tags: ['table', 'trestle', 'tea', 'cups', 'cake', 'cloche', 'party', 'opening', 'gta', 'golf'], emoji: [],
    about: 'Gnome Theft Auto: a trestle with a white cloth, six untouched teacups, a teapot and a pink cake under a glass cloche on a silver stand. 2.4 m long, 1 m tall.',
    examine: [
      'A trestle laid for a party: six teacups in a tidy row, a teapot, and a pink cake under a glass dome that has never been lifted.',
      'The cups have not been touched and the tea has not been poured. The cake is perfect, because nobody has had the nerve.',
      'Tip: do not lift the cloche. It is guarding a speech, and the speech is shy.',
      'Joke: the cake has outlasted two committee meetings and one very serious sandwich.',
      'The cloth is ironed to a razor edge. Someone does this once a week and has never been seen.',
    ],
    parts: trestleParts,
  },
  {
    id: 'halfway-table', name: 'Halfway Table', category: 'prop', uses: ['place'],
    tags: ['table', 'tea', 'urn', 'honesty', 'box', 'cups', 'turn', 'gta', 'golf'], emoji: [],
    about: 'Gnome Theft Auto: the halfway table at the Turn: a green baize runner, a silver tea urn with a tap and a drip tray, stacked cups, a biscuit tin and an iron honesty box with a coin slot and a paper label. 1.8 m long.',
    examine: [
      'A small table at the Turn with a silver urn, a stack of cups, a biscuit tin and an iron honesty box with a label that has been read exactly once.',
      'The urn is hot, which is a mystery, as nobody has been seen to light it.',
      'Tip: put something in the honesty box. The box would like to say "thank you" and has, so far, only been able to rattle.',
      'Joke: the box has a slot for coins and a rule for everything else. The rule is: do not look at the other members.',
      'The biscuits are shortbread. The shortbread is always three short of a full tin. Nobody asks.',
    ],
    parts: halfwayParts,
  },
  {
    id: 'folding-chair', name: 'Folding Chair', category: 'furniture', uses: ['place'],
    tags: ['chair', 'folding', 'seat', 'opening', 'ceremony', 'wooden', 'gta', 'golf'], emoji: [],
    footprint: { r: 0.3, h: 0.9 },
    about: 'Gnome Theft Auto: a slatted wooden folding chair with a red ribbon sash on the seat, set out for guests who did not come. 0.9 m tall.',
    examine: [
      'A slatted folding chair with a red sash tied across the seat, set out in a row for guests who are still on their way.',
      'The sash says RESERVED. For whom, it does not say, and the chair has stopped wondering.',
      'Tip: it folds. It also unfolds. It has been doing the latter for rather longer than anybody would like.',
      'Joke: the row has the best view of the ribbon in Hedgeworth, and the worst view of anything else.',
      'One leg wobbles. A committee has been formed to look into this, and has not yet met.',
    ],
    parts: chairParts,
  },
  {
    id: 'ball-net', name: 'Ball Net', category: 'tool', uses: ['place'],
    tags: ['net', 'pond', 'ball', 'long', 'handle', 'drip', 'gta', 'golf'], emoji: [],
    about: 'Gnome Theft Auto: a long-handled pond net with a red rubber grip, a pale mesh bag and an iron hoop, for fishing wet balls out of the Drip. 2 m long, stands upright.',
    examine: [
      'A long wooden handle, an iron hoop and a pale mesh bag, made for fishing wet balls out of the Drip, and a little ashamed of it.',
      'It reaches further than your arm and rather less far than your dignity.',
      'Tip: the bag is deeper than it looks. So is the Drip. Do not test either.',
      'Joke: the net has recovered more golf balls than any member has recovered strokes.',
      'The red grip is new. The net is not. Thrift will not say which of them he replaced.',
    ],
    parts: netParts,
  },
  {
    id: 'golf-tam', name: "Member's Tam", category: 'trinket', uses: ['place'],
    tags: ['tam', 'bonnet', 'hat', 'tartan', 'member', 'maze', 'lost', 'gta', 'golf'], emoji: [],
    tint: 0x2f6b3f, trim: 0xb8323f,
    about: "Gnome Theft Auto: a member's tartan tam with a red bobble, lying where its owner left it in the maze. Tint is the tartan ground, trim the check line.",
    examine: [
      'A tartan tam with a red bobble, left on the grass by a member who went round the hedge and has not yet come out the other side.',
      'It is warm, which is worrying. It is also slightly damp, which is less so.',
      'Tip: leave it where it lies. It is a marker, and the maze has several things it would like to keep an eye on.',
      'Joke: the club has lost four members to the maze, and recovered three of them by their hats.',
      'The label inside reads "Property of the clubhouse. If found, please return the member."',
    ],
    parts: tamParts,
  },
];
