import { createStamper } from '../stamp';
import type { BlockDef, DistrictMap } from '../types';

// The Drowned Corner (roadmap 7.9, regions.md 10): a lily pond, reeds, a footbridge toll and a storm drain.
// Route ids use the district prefix `dc-`.
const s = createStamper('drowned-corner');

// The Reeds: single reeds (COVER) on a checkerboard, dirty water.
for (let i = 0; i < 6; i++) {
  for (let j = 0; j < 3; j++) {
    if ((i + j) % 2 !== 0) continue;
    const x0 = 1630 + 60 * i, z0 = -1580 + 100 * j;
    s.block(`reed-${i}-${j}`, 'reed', x0, x0 + 1, z0, z0 + 1, 4);
  }
}
s.hatless('the-reeds', [[1650, 0, -1560], [1770, 0, -1560], [1710, 0, -1410], [1830, 0, -1410]]);
s.spot('npc-reeds-1', 'npc', 'the-reeds', 1620, 0, -1350);
s.spot('npc-reeds-2', 'npc', 'the-reeds', 1950, 0, -1450);
s.container('sack-reeds-1', 'sack', 'the-reeds', 1660, 0, -1450);
s.container('sack-reeds-2', 'sack', 'the-reeds', 1700, 0, -1450);
s.container('sack-reeds-3', 'sack', 'the-reeds', 1740, 0, -1450);
s.water({ id: 'w-puddle-reeds', kind: 'puddle', clean: false, x: 1800, y: 0, z: -1310 });

// Lily Pond: a pit 3 deep with lily pads (stone, top 0.2) to hop between, fishers on two of them.
s.pit('pond', { x0: 1650, x1: 1950, z0: -1250, z1: -750 }, 3);
const pads: BlockDef[] = [];
const padAt: [number, number][] = [
  [1660, -1220], [1670, -1210], [1684, -1196], [1712, -1128], [1740, -1100],
  [1790, -1050], [1830, -1000], [1800, -930], [1760, -870], [1700, -800],
];
padAt.forEach(([x0, z0], k) => pads.push(s.block(`pad-${k}`, 'stone', x0, x0 + 6, z0, z0 + 6, 3.2, -3)));
s.spotOnTop('npc-pond-1', 'npc', 'lily-pond', pads[3]);
s.spotOnTop('npc-pond-2', 'npc', 'lily-pond', pads[6]);
s.containerOnTop('crate-pond-1', 'crate', 'lily-pond', pads[0]);
s.containerOnTop('crate-pond-2', 'crate', 'lily-pond', pads[5]);
s.containerOnTop('crate-pond-3', 'crate', 'lily-pond', pads[8]);
s.hatless('lily-pond', [[1700, -3, -1000], [1900, -3, -1200], [1900, -3, -900], [1700, -3, -850]]);
s.water({ id: 'w-pond', kind: 'puddle', clean: false, x: 1900, y: -3, z: -1100 });

// The Footbridge: a stream pit 3 deep, 20 wide, east-west, with a wooden beam bridge over it and toll-keepers at the ends.
s.pit('stream', { x0: 1600, x1: 2000, z0: -460, z1: -440 }, 3);
s.block('bridge', 'beam', 1790, 1800, -470, -430, 1.5);
s.spot('npc-toll-1', 'npc', 'footbridge', 1800, 0, -480);
s.spot('npc-toll-2', 'npc', 'footbridge', 1800, 0, -420);
s.hatless('footbridge', [[1650, 0, -600], [1700, 0, -540], [1900, 0, -600], [1950, 0, -500]]);
s.container('crate-footbridge-1', 'crate', 'footbridge', 1650, 0, -650);
s.container('crate-footbridge-2', 'crate', 'footbridge', 1660, 0, -650);
s.container('crate-footbridge-3', 'crate', 'footbridge', 1670, 0, -650);

// The Willow: a yew trunk to y 60 with a platform beam (top 40). The Willow Folk's haven is on the platform.
const trunk = s.block('trunk', 'yew', 2090, 2110, -1260, -1240, 60);
const platform = s.block('platform', 'beam', 2040, 2160, -1310, -1190, 2, 38);
s.route(trunk, 'n', 'rope', 10);
s.route(trunk, 'e', 'ladder', 10);   // a second route up the trunk: route ids are per block and kind
s.haven({ id: 'willow', name: 'The Willow', region: 'the-willow', rect: { x0: 2050, x1: 2150, z0: -1300, z1: -1200 }, minY: 39.5 });
s.spot('board-willow', 'board', 'the-willow', 2060, 40, -1200);
s.spot('bed-willow', 'bed', 'the-willow', 2140, 40, -1300);
s.spot('npc-willow-1', 'npc', 'the-willow', 2055, 40, -1300);
s.spot('npc-willow-2', 'npc', 'the-willow', 2145, 40, -1250);
s.containerOnTop('chest-willow-1', 'chest', 'the-willow', platform, -25, -25);
s.containerOnTop('chest-willow-2', 'chest', 'the-willow', platform, 25, -25);
s.containerOnTop('chest-willow-3', 'chest', 'the-willow', platform, 0, 30);
s.water({ id: 'w-puddle-willow', kind: 'puddle', clean: false, x: 2030, y: 0, z: -1000 });

// The Drain Mouth: a pit 6 deep under the storm drain, a culvert across it, smugglers' gate (GATE trait, no blocks).
s.pit('drain', { x0: 2020, x1: 2180, z0: -880, z1: -220 }, 6);
const culvert = s.block('culvert', 'pipe', 2020, 2180, -560, -540, 4, -6);
s.route({ id: 'dc-drain' }, 'n', 'ladder', 40);
s.route(culvert, 's', 'ladder', 80);   // a second ladder: route ids are per block and kind
s.hatless('drain-mouth', [[2050, -6, -800], [2100, -6, -700], [2150, -6, -600], [2050, -6, -400]]);
s.spot('npc-drain-1', 'npc', 'drain-mouth', 2010, 0, -500);
s.spot('npc-drain-2', 'npc', 'drain-mouth', 2190, 0, -500);
s.container('sack-drain-1', 'sack', 'drain-mouth', 2030, -6, -300);
s.container('sack-drain-2', 'sack', 'drain-mouth', 2040, -6, -300);
s.container('sack-drain-3', 'sack', 'drain-mouth', 2050, -6, -300);
s.water({ id: 'w-puddle-drain', kind: 'puddle', clean: false, x: 2100, y: -6, z: -750 });

// Outer fence on the east edge (x = 2200), along the Willow and the Drain Mouth.
s.block('fence-east', 'fence', 2196, 2200, -1600, -200, 6);

export const DROWNED_CORNER_MAP: DistrictMap = s.done();
