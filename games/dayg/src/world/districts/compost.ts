import { createStamper } from '../stamp';
import type { DistrictMap } from '../types';
import type { ContainerType, RegionId } from '../../sim/types';

// The Compost Heaps (docs/design/dayg/regions.md, section 4): compost bays, grass heaps, leaf-bin cages, the Wormways.
// Blockout only. Units are gm, ground is y = 0. Every spot and container sits in a gap, never inside a block.

const WARM_BAYS: RegionId = 'warm-bays';
const CLIPPING: RegionId = 'clipping-hills';
const LEAF_BINS: RegionId = 'leaf-bins';
const WORMWAYS: RegionId = 'wormways';

const T1: ContainerType[] = ['vase', 'bin', 'sack', 'crate'];

function pick<T>(xs: readonly T[], k: number): T {
  return xs[((k % xs.length) + xs.length) % xs.length];
}

export function buildCompost(): DistrictMap {
  const s = createStamper('compost');

  // The Warm Bays: three U-shaped compost bays (back wall 40 tall, sides 39.5 so the tops differ), hatless inside.
  const bayHatless: [number, number, number][] = [];
  const bayX = [-1700, -1460, -1220];
  const bayZ = -3300;
  bayX.forEach((bx, b) => {
    s.block(`bay-${b}-back`, 'bay', bx, bx + 120, bayZ, bayZ + 4, 40);
    s.block(`bay-${b}-west`, 'bay', bx, bx + 4, bayZ + 3, bayZ + 60, 39.5);
    s.block(`bay-${b}-east`, 'bay', bx + 116, bx + 120, bayZ + 3, bayZ + 60, 39.5);
    bayHatless.push([bx + 20, 0, bayZ + 20], [bx + 60, 0, bayZ + 20], [bx + 100, 0, bayZ + 20], [bx + 60, 0, bayZ + 45]);
    bayHatless.push([bx + 60, 0, bayZ + 80]);
    s.container(`bay-${b}-box-w`, pick(T1, b), WARM_BAYS, bx + 30, 0, bayZ + 100);
    s.container(`bay-${b}-box-e`, pick(T1, b + 1), WARM_BAYS, bx + 90, 0, bayZ + 100);
  });
  s.hatless(WARM_BAYS, bayHatless);
  s.container('bay-loose-a', 'sack', WARM_BAYS, -1040, 0, -3050);
  s.container('bay-loose-b', 'bin', WARM_BAYS, -1000, 0, -3050);

  // Clipping Hills: grass heaps 10-25 tall on an 80 gm grid, ivy routes up the north faces, two npc spots on tops.
  const clipHatless: [number, number, number][] = [];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 3; j++) {
      const cx0 = -820 + i * 200;
      const cz0 = -3440 + j * 220;
      const h = [10, 14, 18, 22, 25, 12, 16, 20, 24, 11, 13, 17][(i * 3 + j) % 12];
      const heap = s.block(`grass-${i}-${j}`, 'heap', cx0, cx0 + 80, cz0, cz0 + 80, h);
      s.route(heap, 'n', 'ivy', 40);
      if ((i === 0 && j === 0) || (i === 2 && j === 1)) s.spotOnTop(`squat-${i}-${j}`, 'npc', CLIPPING, heap, 0, 0);
      clipHatless.push([cx0 + 140, 0, cz0 + 110]);
      s.container(`clip-box-${i}-${j}`, pick(T1, i + j), CLIPPING, cx0 + 140, 0, cz0 + 190);
    }
  }
  s.hatless(CLIPPING, clipHatless);

  // Leaf Bins: wire-mesh cages (fence boxes 20 x 20 x 15) on a 70 gm grid, ivy routes on some, fuel bins in the gaps.
  const binHatless: [number, number, number][] = [];
  for (let i = 0; i < 12; i++) {
    for (let j = 0; j < 8; j++) {
      const x0 = -860 + i * 70;
      const z0 = -2740 + j * 70;
      if ((i + j) % 3 !== 0) {
        const cage = s.block(`cage-${i}-${j}`, 'fence', x0, x0 + 20, z0, z0 + 20, 15);
        if ((i + j) % 4 === 1) s.route(cage, 's', 'ivy', 10);
        if ((i === 1 && j === 0) || (i === 4 && j === 1)) s.spotOnTop(`leaf-npc-${i}-${j}`, 'npc', LEAF_BINS, cage, 0, 0);
      }
      if (i % 3 === 0 && j % 2 === 0) binHatless.push([x0 + 45, 0, z0 + 35]);
      if (i % 2 === 0 && j % 3 === 1 && j < 7) s.container(`bin-${i}-${j}`, 'bin', LEAF_BINS, x0 + 45, 0, z0 + 55);
    }
  }
  s.hatless(LEAF_BINS, binHatless);

  // The Wormways: DEEP (floor -10). Six 12-wide tunnels joined by links at alternating ends, as one serpentine of
  // touching pit rects; ladders out at three places; the Greybearded's npc spots and camp caches on the floor.
  const wormHatless: [number, number, number][] = [];
  for (let k = 0; k < 6; k++) {
    const z = -2780 + k * 100;
    s.pit(`tunnel-${k}`, { x0: -1796, x1: -904, z0: z, z1: z + 12 }, 10);
    if (k < 5) {
      const west = k % 2 === 0;
      s.pit(`link-${k}`, west ? { x0: -1796, x1: -1784, z0: z, z1: z + 112 } : { x0: -916, x1: -904, z0: z, z1: z + 112 }, 10);
    }
    for (const x of [-1650, -1400, -1150, -950]) wormHatless.push([x, -10, z + 6]);
    s.container(`cache-${k}-a`, 'camp-cache', WORMWAYS, -1550, -10, z + 6);
    s.container(`cache-${k}-b`, 'camp-cache', WORMWAYS, -1250, -10, z + 6);
  }
  s.hatless(WORMWAYS, wormHatless);
  for (const [x, z] of [[-1600, -2671], [-1500, -2671], [-1300, -2671], [-1200, -2671], [-1050, -2671], [-1000, -2671]]) {
    s.spot(`greybeard-${x}-${z}`, 'npc', WORMWAYS, x, -10, z);
  }
  s.route({ id: 'cp-tunnel-0' }, 'n', 'ladder', 400);
  s.route({ id: 'cp-tunnel-3' }, 's', 'ladder', 400);
  s.route({ id: 'cp-tunnel-5' }, 'n', 'ladder', 200);

  // Outer fence on the west edge (z -3480..-2199.5, 30 tall; overlaps the wreathwood part by 0.5 gm) and the north edge.
  s.block('fence-west', 'fence', -1803, -1799, -3480, -2199.5, 30);
  s.block('fence-north', 'fence', -1797, 0, -3483, -3479, 30);

  return s.done();
}

export const COMPOST_MAP: DistrictMap = buildCompost();
