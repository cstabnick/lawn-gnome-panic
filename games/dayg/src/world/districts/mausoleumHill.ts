// Mausoleum Hill and the New Hill (roadmap 7.10, regions.md section 11): crypts, the Great Crypt, obelisks, the back
// stair into the catacombs, open grave pits, the spoil heap, and the parked digger. Blockout level.
import { createStamper } from '../stamp';
import type { DistrictMap } from '../types';

const s = createStamper('mausoleum-hill');

// crypt-row (1400..2200, z -2800..-2300): ten crypts in two rows, tops 45 + 2.3 * i (the last top is 65.7).
const CR = 'crypt-row';
for (let i = 0; i < 10; i++) {
  const row = i < 5 ? 0 : 1;
  const col = i % 5;
  const x0 = 1430 + col * 150;
  const z0 = row === 0 ? -2790 : -2420;
  const top = Math.round((45 + i * 2.3) * 10) / 10;
  const b = s.block(`crypt-${i}`, 'crypt', x0, x0 + 40, z0, z0 + 30, top);
  s.prop('crypt-door', x0 + 20, 0, z0 + 31);
  if (i % 2 === 0) s.route(b, 's', 'letters', 20);
  s.containerOnTop(`crypt-chest-${i}`, 'chest', CR, b);
  if (i === 0 || i === 9) s.spotOnTop(`cr-npc-${i}`, 'npc', CR, b, -12, 0);
}
s.hatless(CR, [[1500, 0, -2600], [1700, 0, -2600], [1900, 0, -2600], [2100, 0, -2600]]);

// great-crypt (1800..2200, z -3480..-2800): a 300 x 300 crypt to y 70 under a dome block to y 80.
const GC = 'great-crypt';
const gcrypt = s.block('gc-crypt', 'crypt', 1850, 2150, -3420, -3120, 70);
s.route(gcrypt, 'w', 'rope', 150);
const dome = s.block('gc-dome', 'roof', 1900, 2100, -3370, -3170, 10.1, 69.9);
s.containerOnTop('gc-dome-chest', 'chest', GC, dome);
for (const [dx, dz] of [[-130, -130], [130, -130], [-130, 130], [130, 130]]) {
  s.containerOnTop(`gc-chest-${dx}-${dz}`, 'chest', GC, gcrypt, dx, dz);
}
s.spotOnTop('gc-npc-1', 'npc', GC, gcrypt, -130, 0);
s.spotOnTop('gc-npc-2', 'npc', GC, gcrypt, 130, 0);
s.container('gc-ground-1', 'chest', GC, 1815, 0, -3260);
s.container('gc-ground-2', 'chest', GC, 2185, 0, -3260);
s.container('gc-ground-3', 'chest', GC, 1960, 0, -3450);
s.container('gc-ground-4', 'chest', GC, 2040, 0, -3450);
s.hatless(GC, [[1820, 0, -3380], [1820, 0, -3160], [2180, 0, -3380], [2180, 0, -3160]]);

// obelisk-garden (1400..1800, z -3480..-3100): three obelisks 4 x 4 x 33 with letters routes.
const OG = 'obelisk-garden';
const obelisks = [[1500, -3380], [1650, -3380], [1575, -3230]].map(([cx, cz], i) => {
  const b = s.block(`obelisk-${i}`, 'obelisk', cx - 2, cx + 2, cz - 2, cz + 2, 33);
  s.route(b, 's', 'letters', 2);
  return b;
});
s.spotOnTop('og-npc-1', 'npc', OG, obelisks[0]);
s.spotOnTop('og-npc-2', 'npc', OG, obelisks[1]);
s.container('og-grave-goods-1', 'grave-goods', OG, 1450, 0, -3200);
s.container('og-grave-goods-2', 'grave-goods', OG, 1600, 0, -3200);
s.container('og-grave-goods-3', 'grave-goods', OG, 1720, 0, -3150);
s.hatless(OG, [[1430, 0, -3300], [1450, 0, -3150], [1700, 0, -3300], [1760, 0, -3430]]);

// back-stair (1400..1800, z -3100..-2800): a DEEP pit 15 down; stone steps 0.45 high each step down from the rim.
const BS = 'back-stair';
const BS_PIT = 'mh-back-stair-pit';
s.pit('back-stair-pit', { x0: 1404, x1: 1796, z0: -3096, z1: -2804 }, 15);
for (let k = 0; k < 33; k++) {
  const x0 = 1404 + k * 1.5;
  s.block(`stair-${k}`, 'stone', x0, x0 + 1.6, -2960, -2940, 15 - (k + 1) * 0.45, -15);
}
s.route({ id: BS_PIT }, 'n', 'ladder', 150);
s.spot('bs-npc-1', 'npc', BS, 1600, 0, -3098);
s.spot('bs-npc-2', 'npc', BS, 1600, 0, -2802);
s.container('bs-cache-1', 'camp-cache', BS, 1500, -15, -2880);
s.container('bs-cache-2', 'camp-cache', BS, 1600, -15, -2880);
s.container('bs-cache-3', 'camp-cache', BS, 1700, -15, -2880);
s.hatless(BS, [[1480, -15, -3050], [1560, -15, -3050], [1640, -15, -3050], [1720, -15, -3050]]);

// new-hill (1400..2200, z -2300..-1900): open grave pits 8 x 20 x 20 deep in two rows, and the spoil heap.
const NH = 'new-hill';
const graveFloors: [number, number, number][] = [];
for (let r = 0; r < 2; r++) {
  for (let i = 0; i < 9; i++) {
    const x0 = 1420 + i * 90;
    const z0 = r === 0 ? -2270 : -2230;
    s.pit(`grave-${r}-${i}`, { x0, x1: x0 + 8, z0, z1: z0 + 20 }, 20);
    graveFloors.push([x0 + 4, -20, z0 + 10]);
  }
}
const heap = s.block('heap', 'heap', 1950, 2070, -2000, -1930, 15);
s.route(heap, 'w', 'ivy', 20);
s.spotOnTop('nh-npc-1', 'npc', NH, heap, -30, 0);
s.spotOnTop('nh-npc-2', 'npc', NH, heap, 30, 0);
for (let i = 0; i < 8; i++) s.container(`sack-${i}`, 'sack', NH, 1420 + i * 90, 0, -1915);
s.hatless(NH, [[1450, 0, -2000], [1600, 0, -1950], [1800, 0, -2000], [1800, 0, -1950], ...graveFloors]);

// diggers-rest (1400..2200, z -1900..-1600): a parked mini digger, Tall size, with a ladder.
const DR = 'diggers-rest';
const digger = s.block('digger', 'mower', 1700, 1760, -1790, -1760, 25);
s.route(digger, 'w', 'ladder', 10);
s.spotOnTop('dr-npc-1', 'npc', DR, digger, -15, 0);
s.spotOnTop('dr-npc-2', 'npc', DR, digger, 15, 0);
s.containerOnTop('digger-chest', 'chest', DR, digger);
for (let i = 0; i < 7; i++) s.container(`dr-chest-${i}`, 'chest', DR, 1420 + i * 100, 0, -1650);
s.hatless(DR, [[1450, 0, -1850], [1550, 0, -1850], [2050, 0, -1850], [2150, 0, -1700]]);

// Outer fence on the full map's north and east edges (inside the boundary, so it overlaps the district).
s.block('fence-north', 'fence', 1400, 2196.1, -3480, -3476, 30);
s.block('fence-east', 'fence', 2196, 2200, -3480, -1600, 30);

// Inner gate on the west edge (x 1400), closed while the east stage is closed (sits just outside the district).
s.gate('gate-west', 1396, 1400.1, -3480, -1600, 30);

export const MAUSOLEUM_HILL_MAP: DistrictMap = s.done();
