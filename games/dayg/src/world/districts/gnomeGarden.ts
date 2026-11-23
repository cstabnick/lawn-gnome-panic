import { createStamper } from '../stamp';
import type { DistrictMap } from '../types';

// Gnome Garden (roadmap 7.11): the Pile, Ornament Lawn, Solar Walk, the Birdbath, Windchime Hedge. Blockout level.
// Outer fence: west edge x = -1800 (z -400..520) and south edge z = 520 (x -1800..200). Each fence overlaps the map edge by
// 0.5 gm so the district test sees it on the region. No inner gates (south-west stage).
const s = createStamper('gnome-garden');

// ---- The Pile (x -1200..-600, z -400..100): a ring of broken-ornament heaps around a pit.
const PIT = { x0: -1000, x1: -800, z0: -250, z1: -50 };
s.pit('pile-pit', PIT, 8);
s.route({ id: 'gg-pile-pit' }, 'n', 'ladder', 100);
for (let i = 0; i < 10; i++) {
  for (let j = 0; j < 8; j++) {
    const cx = -1170 + 60 * i;
    const cz = -370 + 60 * j;
    const x0 = cx - 20, x1 = cx + 20, z0 = cz - 20, z1 = cz + 20;
    const inPit = x0 < PIT.x1 + 15 && x1 > PIT.x0 - 15 && z0 < PIT.z1 + 15 && z1 > PIT.z0 - 15;
    if (inPit || (i + j) % 4 === 0) continue;
    const h = 6 + ((i * 7 + j * 5) % 15);
    const heap = s.block(`pile-heap-${i}-${j}`, 'ornament', x0, x1, z0, z1, h);
    if (h >= 12 && i % 3 === 0) s.containerOnTop(`pile-top-${i}-${j}`, 'grave-goods', 'the-pile', heap);
  }
}
// Hatless in the gaps between heaps (rows z -340 and 80), clear of the pit.
for (let k = 0; k < 8; k++) s.spot(`pile-h-${k}`, 'hatless', 'the-pile', -1140 + 60 * k, 0, -340);
s.spot('pile-h-8', 'hatless', 'the-pile', -1140, 0, 80);
s.spot('pile-h-9', 'hatless', 'the-pile', -1080, 0, 80);
for (let k = 0; k < 6; k++) s.container(`pile-g-${k}`, 'grave-goods', 'the-pile', -1020 + 60 * k, 0, 80);
s.container('pile-pit-1', 'grave-goods', 'the-pile', -950, -8, -200);
s.container('pile-pit-2', 'grave-goods', 'the-pile', -900, -8, -120);
s.container('pile-pit-3', 'grave-goods', 'the-pile', -850, -8, -200);

// ---- Ornament Lawn (x -600..0, z -400..100): five giant gnome statues, a resin frog, lookouts on the statues.
for (let k = 0; k < 5; k++) {
  const cx = -540 + 120 * k;
  const statue = s.block(`statue-${k}`, 'ornament', cx - 4, cx + 4, -254, -246, 20);
  s.prop('gnome-statue', cx, 0, -250);
  s.route(statue, 's', 'letters', 2);
  s.spotOnTop(`statue-look-${k}`, 'npc', 'ornament-lawn', statue);
}
s.block('frog', 'ornament', -240, -230, -100, -92, 6);
s.hatless('ornament-lawn', [[-480, 0, -190], [-360, 0, -190], [-240, 0, -190], [-120, 0, -190], [-30, 0, -190]]);
for (let k = 0; k < 4; k++) {
  s.container(`lawn-c-a-${k}`, 'vase', 'ornament-lawn', -560 + 120 * k, 0, -360);
  s.container(`lawn-c-b-${k}`, 'crate', 'ornament-lawn', -560 + 120 * k, 0, 40);
}

// ---- Solar Walk (x -1800..0, z 100..400): gravel path east-west, lamps every 40 gm.
s.path({ id: 'solar-gravel', kind: 'gravel', points: [[-1800, 250], [0, 250]], width: 14 });
for (let x = -1780; x <= -20; x += 40) s.prop('lamp', x, 0, 236);
s.hatless('solar-walk', [[-1600, 0, 370], [-1300, 0, 370], [-1000, 0, 370], [-700, 0, 370], [-400, 0, 370], [-100, 0, 370]]);
for (let k = 0; k < 4; k++) s.spot(`solar-npc-${k}`, 'npc', 'solar-walk', -1600 + 300 * k, 0, 220);
for (let k = 0; k < 8; k++) s.container(`solar-c-${k}`, k % 2 === 0 ? 'vase' : 'sack', 'solar-walk', -1700 + 200 * k, 0, 330);

// ---- The Birdbath (x -1800..-1200, z -400..100): stone pedestal, basin on top with clean water, Bath House haven.
s.block('pedestal', 'birdbath', -1505, -1495, -55, -45, 45);
const basin = s.block('basin', 'birdbath', -1520, -1480, -70, -30, 5.1, 44.9);
s.route({ id: 'gg-pedestal' }, 'e', 'ladder', 5);
s.water({ id: 'bath', kind: 'rain-catcher', clean: true, x: -1500, y: s.top(basin), z: -50 });
s.haven({ id: 'bath-house', name: 'The Bath House', region: 'the-birdbath', rect: { x0: -1518, x1: -1482, z0: -68, z1: -32 }, minY: 49.5 });
s.spotOnTop('bath-bed', 'bed', 'the-birdbath', basin, -12, 0);
s.spotOnTop('bath-board', 'board', 'the-birdbath', basin, 12, 0);
s.spotOnTop('bath-fire', 'fire', 'the-birdbath', basin, 0, -12);
const npcOffsets: [number, number][] = [[-14, -14], [14, -14], [-14, 14], [14, 14], [0, -14], [0, 14]];
npcOffsets.forEach(([dx, dz], k) => s.spotOnTop(`bath-npc-${k}`, 'npc', 'the-birdbath', basin, dx, dz));
const types = ['vase', 'sack', 'crate', 'bin'] as const;
for (let k = 0; k < 8; k++) {
  s.container(`bird-c-${k}`, types[k % 4], 'the-birdbath', [-1750, -1650, -1450, -1350][k % 4], 0, k < 4 ? -340 : -220);
}

// ---- Windchime Hedge (x -1800..200, z 400..520): two hedge rows with gaps, soul bells on posts between them.
for (const [name, z0] of [['a', 420], ['b', 480]] as const) {
  for (let k = 0; -1800 + 100 * k + 80 <= 200; k++) {
    const x0 = -1800 + 100 * k;
    s.block(`hedge-${name}-${k}`, 'hedge', x0, x0 + 80, z0, z0 + 8, 8);
  }
}
for (let k = 0; k < 10; k++) {
  const x0 = -1700 + 200 * k;
  s.block(`post-${k}`, 'beam', x0, x0 + 2, 450, 452, 12);
  s.prop('soul-bell', x0 + 1, 12, 451);
}
s.hatless('windchime-hedge', [[-1600, 0, 440], [-1200, 0, 440], [-800, 0, 440], [-300, 0, 440], [0, 0, 440]]);
s.spot('windchime-npc-1', 'npc', 'windchime-hedge', -1000, 0, 440);
s.spot('windchime-npc-2', 'npc', 'windchime-hedge', -400, 0, 440);
for (let k = 0; k < 8; k++) s.container(`windchime-c-${k}`, 'crate', 'windchime-hedge', -1690 + 200 * k, 0, 440);

// ---- Outer fence (edges of the full map): west and south.
s.block('fence-west', 'fence', -1803.5, -1799.5, -400, 519.5, 30);
s.block('fence-south', 'fence', -1799.5, 200, 519.5, 523.5, 29.5);

export const GNOME_GARDEN_MAP: DistrictMap = s.done();
