// The Bell Chapel (roadmap 7.8): the Spire with its bell, the Nave (the Kiln Sisters' infirmary), the Vestry,
// Chapel Rise and the Catacombs. Placed by the district stamper; routes that share a block are added here.
import { HAVEN_NAME } from '../../sim/regions';
import { DISTRICT_PREFIX } from '../../sim/regionsFull';
import type { ContainerType } from '../../sim/types';
import { createStamper } from '../stamp';
import type { ClimbRouteDef, DistrictMap, Side } from '../types';

const s = createStamper('bell-chapel');
const extra: ClimbRouteDef[] = [];
const climb = (blockId: string, side: Side, kind: ClimbRouteDef['kind'], at: number): void => {
  extra.push({ id: `${blockId}-${side}-${kind}-${at}`, block: blockId, side, kind, at });
};

// ---------- The Spire ----------
const tower = s.block('spire-tower', 'spire', 310, 390, -2690, -2610, 120);
s.block('spire-tip', 'spire', 345, 355, -2655, -2645, 190.1, 119.9);
climb(tower.id, 's', 'ladder', 40);
s.prop('chapel-bell', 330, 120, -2650);
s.spot('spire-bell', 'bell', 'the-spire', 330, 120, -2650);
s.spot('spire-npc-1', 'npc', 'the-spire', 370, 120, -2630);
s.spot('spire-npc-2', 'npc', 'the-spire', 320, 120, -2620);
const SPIRE: [number, number, ContainerType][] = [[200, -2750, 'chest'], [500, -2750, 'grave-goods'], [200, -2550, 'grave-goods'],
  [500, -2550, 'chest'], [150, -2650, 'chest'], [550, -2650, 'grave-goods'], [420, -2780, 'chest'], [280, -2520, 'grave-goods']];
SPIRE.forEach(([x, z, type], i) => s.container(`spire-${i + 1}`, type, 'the-spire', x, 0, z));

// ---------- The Nave: four chapel walls, a roof and a door sill with ladders each side ----------
s.block('nave-n', 'chapel', 100, 600, -2480, -2476, 60);
s.block('nave-w', 'chapel', 100, 104, -2480, -2120, 60.2);
s.block('nave-e', 'chapel', 596, 600, -2480, -2120, 60.4);
s.block('nave-sw', 'chapel', 100, 330, -2124, -2120, 60.6);
s.block('nave-se', 'chapel', 370, 600, -2124, -2120, 60.6);
const navesill = s.block('nave-sill', 'stone', 329.9, 370.1, -2123.9, -2120.1, 2.2);
climb(navesill.id, 'n', 'ladder', 10);
climb(navesill.id, 's', 'ladder', 10);
s.block('nave-roof', 'roof', 96, 604, -2484, -2116, 2.2, 59.8);
for (let k = 0; k < 6; k++) {
  const z0 = -2440 + 30 * k;
  s.block(`pew-${k}-w`, 'bench', 150, 325, z0, z0 + 3, 2);
  s.block(`pew-${k}-e`, 'bench', 375, 550, z0, z0 + 3, 2);
}
s.prop('altar', 350, 0, -2460);
s.haven({
  id: 'infirmary', name: HAVEN_NAME.infirmary, region: 'the-nave',
  rect: { x0: 104, x1: 596, z0: -2476, z1: -2124 }, minY: -0.5,
});
s.spot('infirmary-bed', 'bed', 'the-nave', 180, 0, -2180);
s.spot('infirmary-fire', 'fire', 'the-nave', 350, 0, -2180);
s.spot('infirmary-board', 'board', 'the-nave', 520, 0, -2180);
[150, 200, 260, 440, 500, 560].forEach((x, i) => s.spot(`infirmary-npc-${i + 1}`, 'npc', 'the-nave', x, 0, -2160));
s.hatless('the-nave', [[50, 0, -2400], [650, 0, -2400], [50, 0, -2200], [650, 0, -2200]]);
const NAVE: [number, number, ContainerType][] = [[40, -2450, 'grave-goods'], [660, -2450, 'crate'], [40, -2250, 'chest'],
  [660, -2250, 'grave-goods'], [250, -2110, 'crate'], [450, -2110, 'chest'], [40, -2350, 'grave-goods'], [660, -2350, 'crate']];
NAVE.forEach(([x, z, type], i) => s.container(`nave-${i + 1}`, type, 'the-nave', x, 0, z));

// ---------- The Vestry: a small chapel with its own door sill ----------
s.block('vest-n', 'chapel', 780, 920, -2400, -2396, 30);
s.block('vest-w', 'chapel', 780, 784, -2400, -2240, 30.2);
s.block('vest-e', 'chapel', 916, 920, -2400, -2240, 30.4);
s.block('vest-sw', 'chapel', 780, 840, -2244, -2240, 30.6);
s.block('vest-se', 'chapel', 870, 920, -2244, -2240, 30.6);
const vestsill = s.block('vest-sill', 'stone', 839.9, 870.1, -2243.9, -2240.1, 2.2);
climb(vestsill.id, 'n', 'ladder', 10);
climb(vestsill.id, 's', 'ladder', 10);
const vestRoof = s.block('vest-roof', 'roof', 776, 924, -2404, -2236, 2.2, 29.8);
s.spot('vestry-npc-1', 'npc', 'the-vestry', 830, s.top(vestRoof), -2320);
s.spot('vestry-npc-2', 'npc', 'the-vestry', 880, s.top(vestRoof), -2320);
s.hatless('the-vestry', [[740, 0, -2350], [960, 0, -2350], [740, 0, -2250], [850, 0, -2130]]);
[[800, -2380], [840, -2380], [880, -2380], [800, -2300], [840, -2300], [880, -2300], [800, -2260], [880, -2260]]
  .forEach(([x, z], i) => s.container(`vestry-chest-${i + 1}`, 'chest', 'the-vestry', x, 0, z));

// ---------- Chapel Rise: open grass, a gravel path up to the nave, headstones ----------
s.path({ id: 'path-nave', kind: 'gravel', points: [[350, -2100], [350, -1600]], width: 6 });
const rowA = s.headstoneRow('cr', 60, -1900, { width: 6, depth: 2, gaps: [8, 12], heights: [2, 2.6, 3], xEnd: 330, row: 0 });
const rowB = s.headstoneRow('cr', 60, -1800, { width: 6, depth: 2, gaps: [10, 8], heights: [2.2, 2.8], xEnd: 330, row: 1 });
s.spotOnTop('rise-npc-1', 'npc', 'chapel-rise', rowA[0]);
s.spotOnTop('rise-npc-2', 'npc', 'chapel-rise', rowB[0]);
s.hatless('chapel-rise', [[500, 0, -1900], [600, 0, -1900], [700, 0, -1900], [800, 0, -1900],
  [500, 0, -1700], [650, 0, -1700], [800, 0, -1700], [900, 0, -1800]]);
const RISE: [number, number, ContainerType][] = [[550, -2000, 'crate'], [650, -2000, 'grave-goods'], [750, -2000, 'chest'],
  [850, -2000, 'crate'], [550, -1800, 'grave-goods'], [700, -1650, 'chest'], [850, -1650, 'crate'], [400, -1700, 'grave-goods']];
RISE.forEach(([x, z, type], i) => s.container(`rise-${i + 1}`, type, 'chapel-rise', x, 0, z));

// ---------- The Catacombs: a pit 30 deep with pillars, coffin shelves and three ladders out ----------
const pitId = `${DISTRICT_PREFIX['bell-chapel']}-catacombs`;
s.pit('catacombs', { x0: 1004, x1: 1396, z0: -2796, z1: -1604 }, 30);
climb(pitId, 'n', 'ladder', 200);
climb(pitId, 's', 'ladder', 200);
climb(pitId, 'e', 'ladder', 600);
let pn = 0;
for (const cx of [1040, 1200, 1360]) {
  for (const cz of [-2700, -2400, -2100, -1800]) {
    s.block(`cat-pillar-${pn++}`, 'stone', cx - 1.5, cx + 1.5, cz - 1.5, cz + 1.5, 29.8, -30);
  }
}
[-2650, -2350, -2050, -1750].forEach((z0, k) => s.block(`shelf-${k}`, 'shelf', 1060, 1180, z0, z0 + 8, 2, -30));
s.hatless('the-catacombs', [[1300, -30, -2700], [1300, -30, -2450], [1300, -30, -2200], [1300, -30, -1950],
  [1300, -30, -1700], [1020, -30, -2250], [1020, -30, -1900], [1240, -30, -2250]]);
const CATA: [number, number][] = [[1240, -2650], [1240, -2350], [1240, -2050], [1240, -1750],
  [1100, -2500], [1100, -2200], [1100, -1900], [1280, -2100]];
CATA.forEach(([x, z], i) => s.container(`cata-${i + 1}`, 'camp-cache', 'the-catacombs', x, -30, z));
s.spot('cata-npc-1', 'npc', 'the-catacombs', 1120, -28, -2646);
s.spot('cata-npc-2', 'npc', 'the-catacombs', 1120, -28, -2046);
s.water({ id: 'puddle', kind: 'puddle', clean: false, x: 1300, y: -30, z: -2300 });

// Inner gates on the west and south borders, closed while the north stage is closed.
s.gate('west-gate', -1, 1, -2800, -1600, 30);
s.gate('south-gate', 0, 800, -1601, -1599, 30.4);

const map: DistrictMap = s.done();
map.routes.push(...extra);
export const BELL_CHAPEL_MAP: DistrictMap = map;
