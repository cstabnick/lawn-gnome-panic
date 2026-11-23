// The Shed and the Mower Yard (roadmap 7.10, regions.md section 12): the dark shed floor, the shelves with the Shelf
// Wrights' haven, the fuel store, the giant mower, and the back gate. Blockout level.
import { HAVEN_NAME } from '../../sim/regions';
import { createStamper } from '../stamp';
import type { BlockDef, DistrictMap } from '../types';

const s = createStamper('shed');

// The shed: four walls (4 thick, 80 tall) around x 800..1600, z -196..196, a roof at y 80, a wide door gap on the west.
// Walls that meet overlap by 0.1 so no two faces are shared.
s.block('wall-north', 'shed', 800, 1600, -196, -192, 80);
s.block('wall-south', 'shed', 800, 1600, 192, 196, 80);
s.block('wall-east', 'shed', 1596, 1600, -192.1, 192.1, 80);
s.block('wall-west-a', 'shed', 800, 804, -192.1, -40, 80);
s.block('wall-west-b', 'shed', 800, 804, 40, 192.1, 80);
s.block('roof', 'roof', 801, 1599, -195, 195, 2.1, 79.9); // inset from the walls' outer faces (no shared side plane)

// shed-floor (800..1300, z -200..200): giant tool handles and sacks; one sack guarantees a pinch of salt.
const SF = 'shed-floor';
const handles = [[900, -120], [1000, 120], [1100, -120], [1200, 120]].map(([x, z], i) =>
  s.block(`handle-${i}`, 'beam', x - 1.5, x + 1.5, z - 1.5, z + 1.5, 60));
s.spotOnTop('sf-npc-1', 'npc', SF, handles[0]);
s.spotOnTop('sf-npc-2', 'npc', SF, handles[3]);
s.container('sack-salt', 'sack', SF, 950, 0, 0, ['salt-pinch']);
s.container('sack-1', 'sack', SF, 1050, 0, 0);
s.container('sack-2', 'sack', SF, 1150, 0, 0);
s.container('sack-3', 'sack', SF, 1250, 0, 0);
s.container('sack-4', 'sack', SF, 1020, 0, -60);
s.hatless(SF, [[850, 0, -120], [850, 0, 120], [1050, 0, -150], [1250, 0, 150]]);
// Inner gate on the west edge (x 800), closed while the south-west stage is closed.
s.gate('gate-west', 796, 800.1, -200, 400, 30);

// the-shelves (1300..1600, z -200..200): four shelves on the east wall at tops 15, 30, 45, 60, with rope routes.
const SH = 'the-shelves';
const shelfTops = [15, 30, 45, 60];
const shelves = shelfTops.map((top) => s.block(`shelf-${top}`, 'shelf', 1556, 1595.9, -150, 150, 1, top - 1));
shelves.forEach((b, i) => {
  if (i < 3) s.route(b, 'w', 'rope', 50);
  s.containerOnTop(`shelf-chest-${shelfTops[i]}`, 'chest', SH, b);
});
s.haven({ id: 'shelves', name: HAVEN_NAME.shelves, region: SH, rect: { x0: 1556, x1: 1595.9, z0: -150, z1: 150 }, minY: 29.5 });
s.spot('bed-1', 'bed', SH, 1565, 30, -120);
s.spot('board-1', 'board', SH, 1565, 30, -60);
s.spot('fire-1', 'fire', SH, 1565, 30, 0);
[-135, -105, 90, 110, 130, 145].forEach((z, i) => s.spot(`sh-npc-${i + 1}`, 'npc', SH, 1565, 30, z));

// fuel-store (1600..2200, z -200..200): fuel cans as bins with a chest on each, and a burnt patch.
const FS = 'fuel-store';
const bins: BlockDef[] = [];
for (const z of [-150, 100]) {
  for (let i = 0; i < 4; i++) {
    const x = 1650 + i * 50;
    bins.push(s.block(`bin-${x}-${z + 150}`, 'bin', x, x + 6, z, z + 6, 10));
  }
}
bins.forEach((b, i) => s.containerOnTop(`bin-chest-${i}`, 'chest', FS, b));
s.spotOnTop('fs-npc-1', 'npc', FS, bins[0]);
s.spotOnTop('fs-npc-2', 'npc', FS, bins[4]);
s.path({ id: 'burnt-patch', kind: 'gravel', points: [[1700, -60], [1850, 0], [2050, 60]], width: 40 });
s.hatless(FS, [[1700, 0, -60], [1700, 0, 60], [1900, 0, -60], [2100, 0, 60]]);

// mower-yard (800..1800, z 200..520): the giant mower with two deck flanges at y 20, a ladder up the west flange.
const MY = 'mower-yard';
s.block('mower', 'mower', 900, 1100, 300, 420, 40);
const deckW = s.block('deck-west', 'beam', 880, 900.1, 280, 440, 1, 20);
const deckE = s.block('deck-east', 'beam', 1099.9, 1120, 280, 440, 1, 20);
s.route(deckW, 'w', 'ladder', 60);
s.containerOnTop('deck-chest-w', 'chest', MY, deckW);
s.containerOnTop('deck-chest-e', 'chest', MY, deckE);
s.spotOnTop('my-npc-1', 'npc', MY, deckW, 0, -50);
s.spotOnTop('my-npc-2', 'npc', MY, deckE, 0, -50);
[[830, 240], [1170, 240], [830, 490], [1170, 490], [1000, 250], [1000, 490]].forEach(([x, z], i) =>
  s.container(`my-chest-${i}`, 'chest', MY, x, 0, z));
s.hatless(MY, [[850, 0, 350], [1150, 0, 350], [940, 0, 470], [1060, 0, 470]]);

// back-gate (1800..2200, z 200..520): two gatehouse posts either side of a gap in the east fence.
const BG = 'back-gate';
const postN = s.block('gate-post-n', 'gatehouse', 2172, 2186, 326, 340, 30);
const postS = s.block('gate-post-s', 'gatehouse', 2172, 2186, 380, 394, 30);
s.spotOnTop('bg-npc-1', 'npc', BG, postN);
s.spotOnTop('bg-npc-2', 'npc', BG, postS);
s.container('crate-1', 'crate', BG, 1850, 0, 260);
s.container('crate-2', 'crate', BG, 1950, 0, 460);
s.container('crate-3', 'crate', BG, 2050, 0, 260);
s.hatless(BG, [[1850, 0, 350], [1950, 0, 320], [1950, 0, 420], [2050, 0, 400]]);

// Outer fence: the east edge for z -200..520 (the back gate's gap at z 340..380) and the south edge for x 800..2200.
s.block('fence-east-fuel', 'fence', 2196, 2200, -200, 200.1, 30);
s.block('fence-east-north', 'fence', 2196, 2200, 200, 340, 30);
s.block('fence-east-south', 'fence', 2196, 2200, 380, 516.1, 30);
s.block('fence-south', 'fence', 800, 2196.1, 516, 520, 30);

export const SHED_MAP: DistrictMap = s.done();
