// The Columbarium (roadmap 7.8): the niche wall with its stepped ledges, the Walkway colonnade, the Garden of
// Remembrance and the Rose Gate. Placed by the district stamper; routes that share a block are added here.
import { HAVEN_NAME } from '../../sim/regions';
import type { ContainerType } from '../../sim/types';
import { createStamper } from '../stamp';
import type { BlockDef, ClimbRouteDef, DistrictMap, Side } from '../types';

const s = createStamper('columbarium');
const extra: ClimbRouteDef[] = [];
const climb = (blockId: string, side: Side, kind: ClimbRouteDef['kind'], at: number): void => {
  extra.push({ id: `${blockId}-${side}-${kind}-${at}`, block: blockId, side, kind, at });
};

// ---------- Parapet and niches ----------
const wall = s.block('niche-wall', 'niche-wall', 0, 700, -3480, -3360, 70);
s.block('fence', 'fence', 0.1, 1400, -3484, -3479.5, 30);
for (let k = 0; k < 12; k++) climb(wall.id, 's', 'rope', 30 + 60 * k);

// Stepped ledges: [row, top, z0]. Rows 1-2 sit in the Low Niches, rows 3-6 in the High Niches.
const LEDGES: [number, number, number][] = [[1, 4, -3150], [2, 9, -3190], [3, 25, -3220], [4, 35, -3262], [5, 45, -3312], [6, 55, -3362]];
const ledge: BlockDef[] = LEDGES.map(([row, h, z0]) => s.block(`ledge-${row}`, 'niche-wall', 0, 700, z0, z0 + 12, h));
climb(ledge[2].id, 's', 'ladder', 60);

s.spot('parapet-npc-1', 'npc', 'parapet', 200, 70, -3420);
s.spot('parapet-npc-2', 'npc', 'parapet', 400, 70, -3420);
s.container('parapet-bin', 'bin', 'parapet', 100, 70, -3420);
s.container('parapet-sack', 'sack', 'parapet', 300, 70, -3420);
s.container('parapet-crate', 'crate', 'parapet', 500, 70, -3420);
s.prop('lamp', 250, 70, -3420);
s.prop('lamp', 450, 70, -3420);

const row4 = ledge[3];
s.haven({
  id: 'columbarium', name: HAVEN_NAME.columbarium, region: 'niches-high',
  rect: { x0: 0, x1: 700, z0: -3262, z1: -3250 }, minY: s.top(row4) - 0.5,
});
s.spot('haven-fire', 'fire', 'niches-high', 350, 35, -3256);
s.spot('haven-bed', 'bed', 'niches-high', 450, 35, -3256);
s.spot('haven-board', 'board', 'niches-high', 550, 35, -3256);
[100, 180, 260, 620, 660, 690].forEach((x, i) => s.spot(`haven-npc-${i + 1}`, 'npc', 'niches-high', x, 35, -3256));
[[150, 25, -3214], [450, 25, -3214], [600, 25, -3214], [150, 45, -3306], [400, 45, -3306], [600, 45, -3306]]
  .forEach(([x, y, z], i) => s.container(`high-vase-${i + 1}`, 'vase', 'niches-high', x, y, z));

s.hatless('niches-low', [[100, 0, -3164], [250, 0, -3164], [400, 0, -3164], [550, 0, -3164],
  [100, 0, -3100], [250, 0, -3100], [400, 0, -3100], [550, 0, -3100]]);
s.spot('low-npc-1', 'npc', 'niches-low', 150, 4, -3144);
s.spot('low-npc-2', 'npc', 'niches-low', 550, 4, -3144);
[[300, 4, -3144], [450, 4, -3144], [200, 9, -3184], [600, 9, -3184]]
  .forEach(([x, y, z], i) => s.container(`low-vase-${i + 1}`, 'vase', 'niches-low', x, y, z));

// ---------- Walkway colonnade ----------
const pillarsN: BlockDef[] = [];
for (let x = 710, k = 0; x <= 1390; x += 20, k++) {
  pillarsN.push(s.block(`pillar-n-${k}`, 'stone', x - 1.5, x + 1.5, -3451.5, -3448.5, 20.2));
  s.block(`pillar-s-${k}`, 'stone', x - 1.5, x + 1.5, -3081.5, -3078.5, 20.2);
}
const roofN = s.block('roof-n', 'roof', 700, 1400, -3453, -3447, 2, 20);
s.block('roof-s', 'roof', 700, 1400, -3083, -3077, 2, 20);
climb(pillarsN[20].id, 'n', 'letters', 1);
s.spot('walk-npc-1', 'npc', 'walkway', 900, s.top(roofN), -3450);
s.spot('walk-npc-2', 'npc', 'walkway', 1200, s.top(roofN), -3450);
[[760, -3300], [1000, -3300], [1240, -3300], [760, -3200], [1100, -3200]]
  .forEach(([x, z]) => s.prop('market-stall', x, 0, z));
const WALK: [number, number, ContainerType][] = [[880, -3260, 'sack'], [1120, -3260, 'crate'], [1360, -3260, 'bin'],
  [880, -3140, 'vase'], [1240, -3140, 'sack'], [1000, -3120, 'crate'], [760, -3120, 'bin'], [1360, -3200, 'vase']];
WALK.forEach(([x, z, type], i) => s.container(`walk-${i + 1}`, type, 'walkway', x, 0, z));
s.hatless('walkway', [[760, 0, -3380], [1000, 0, -3380], [1240, 0, -3380], [1000, 0, -3220]]);

// ---------- Garden of Remembrance ----------
const beds: BlockDef[] = [];
for (let i = 0; i < 4; i++) {
  for (let j = 0; j < 3; j++) {
    const x0 = 60 + 230 * i, z0 = -3030 + 75 * j;
    beds.push(s.block(`bed-${i}-${j}`, 'hedge', x0, x0 + 150, z0, z0 + 50, 1.5));
  }
}
s.spot('garden-npc-1', 'npc', 'garden-of-remembrance', 135, 1.5, -3005);
s.spot('garden-npc-2', 'npc', 'garden-of-remembrance', 595, 1.5, -2855);
s.path({ id: 'path-ew-1', kind: 'gravel', points: [[0, -2967.5], [1400, -2967.5]], width: 6 });
s.path({ id: 'path-ew-2', kind: 'gravel', points: [[0, -2892.5], [1000, -2892.5]], width: 6 });
s.path({ id: 'path-ns', kind: 'gravel', points: [[480, -3050], [480, -2800]], width: 6 });
s.block('fountain', 'stone', 925, 975, -3015, -2985, 1.2);
s.water({ id: 'fountain-water', kind: 'standpipe', clean: true, x: 950, y: 1.2, z: -3000 });
s.prop('flowering-bush', 380, 0, -2810);
s.prop('flowering-bush', 880, 0, -2810);
s.hatless('garden-of-remembrance', [[455, 0, -2930], [455, 0, -2850], [505, 0, -3010], [700, 0, -2930]]);
const GARDEN: [number, number, ContainerType][] = [[460, -3040, 'grave-goods'], [520, -2810, 'crate'], [20, -2900, 'chest'],
  [20, -3000, 'grave-goods'], [20, -2850, 'crate'], [980, -2850, 'chest'], [980, -3040, 'grave-goods'], [700, -2810, 'crate']];
GARDEN.forEach(([x, z, type], i) => s.container(`garden-${i + 1}`, type, 'garden-of-remembrance', x, 0, z));

// ---------- The Rose Gate ----------
s.block('rose-pillar-n', 'gatehouse', 1195, 1205, -2980, -2972, 30);
s.block('rose-pillar-s', 'gatehouse', 1195, 1205, -2963, -2955, 30);
const beam = s.block('rose-beam', 'beam', 1194, 1206, -2981, -2954, 2.2, 28);
s.spot('rose-npc-1', 'npc', 'rose-gate', 1200, s.top(beam), -2972);
s.spot('rose-npc-2', 'npc', 'rose-gate', 1200, s.top(beam), -2962);
s.container('rose-sack', 'sack', 'rose-gate', 1100, 0, -2900);
s.container('rose-vase', 'vase', 'rose-gate', 1300, 0, -2900);
s.container('rose-bin', 'bin', 'rose-gate', 1300, 0, -3030);
s.hatless('rose-gate', [[1100, 0, -2990], [1300, 0, -2990], [1100, 0, -3030], [1300, 0, -2820]]);

// Inner gate on the west border (x = 0), closed while the north stage is closed.
s.gate('west-gate', -1, 1, -3480, -2799.9, 30.2);

const map: DistrictMap = s.done();
map.routes.push(...extra);
export const COLUMBARIUM_MAP: DistrictMap = map;
