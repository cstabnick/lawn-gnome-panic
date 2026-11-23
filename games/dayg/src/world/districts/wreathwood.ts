import { createStamper } from '../stamp';
import type { DistrictMap } from '../types';
import type { ContainerType, RegionId } from '../../sim/types';

// Wreathwood (docs/design/dayg/regions.md, section 3): wreath frames, bouquet heaps, ribbon stalks, foam fields, the Crown.
// Blockout only. Units are gm, ground is y = 0. Every spot and container sits in a gap, never inside a block.

const THE_RINGS: RegionId = 'the-rings';
const PETALFALL: RegionId = 'petalfall';
const RIBBON: RegionId = 'ribbon-halls';
const FOAM: RegionId = 'foam-fields';
const CROWN: RegionId = 'the-crown';

const T1: ContainerType[] = ['vase', 'bin', 'sack', 'crate'];
const T2: ContainerType[] = ['grave-goods', 'crate', 'chest'];

function pick<T>(xs: readonly T[], k: number): T {
  return xs[((k % xs.length) + xs.length) % xs.length];
}

export function buildWreathwood(): DistrictMap {
  const s = createStamper('wreathwood');

  // The Rings: wreath frames (four 6-tall wreath bars round a 40 x 38 hole), a grid with wire tunnels between.
  const ringHatless: [number, number, number][] = [];
  let ringN = 0;
  for (let gx = 0; gx < 5; gx++) {
    for (let gz = 0; gz < 5; gz++) {
      if ((gx * 3 + gz) % 4 === 0) continue;
      const x0 = -1770 + gx * 170;
      const z0 = -1270 + gz * 170;
      const id = `frame-${gx}-${gz}`;
      const north = s.block(`${id}-n`, 'wreath', x0, x0 + 60, z0, z0 + 10, 6);
      s.block(`${id}-s`, 'wreath', x0, x0 + 60, z0 + 50, z0 + 60, 6);
      s.block(`${id}-w`, 'wreath', x0, x0 + 10, z0 + 11, z0 + 49, 6);
      s.block(`${id}-e`, 'wreath', x0 + 50, x0 + 60, z0 + 11, z0 + 49, 6);
      ringHatless.push([x0 + 115, 0, z0 + 115]);
      s.container(`${id}-box`, pick(T1, ringN), THE_RINGS, x0 + 115, 0, z0 + 30);
      if (ringN < 2) s.spotOnTop(`npc-${id}`, 'npc', THE_RINGS, north, 0, 0);
      ringN++;
    }
  }
  s.hatless(THE_RINGS, ringHatless);

  // Petalfall: bouquet heaps 3-8 tall with containers on top (some guaranteed petal bundles), herbalists on four of them.
  const petalHatless: [number, number, number][] = [];
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 3; j++) {
      const x0 = -860 + i * 180;
      const z0 = -1200 + j * 240;
      const h = [3, 5, 8, 4, 6, 7, 3, 8][(i * 2 + j) % 8];
      const heap = s.block(`bouquet-${i}-${j}`, 'heap', x0, x0 + 60, z0, z0 + 60, h);
      s.container(`bouquet-${i}-${j}-box`, pick(T2, i + j), PETALFALL, x0 + 30, s.top(heap), z0 + 30,
        (i + j) % 3 === 0 ? ['petal-bundle'] : undefined);
      if ((i === 0 && j === 0) || (i === 2 && j === 1) || (i === 4 && j === 2) || (i === 3 && j === 0)) {
        s.spotOnTop(`herbalist-${i}-${j}`, 'npc', PETALFALL, heap, 15, 15);
      }
      petalHatless.push([x0 + 120, 0, z0 + 150]);
    }
  }
  s.hatless(PETALFALL, petalHatless);

  // Ribbon Halls: 2 x 2 stalks 30 tall in a grid, ribbon boards (20 x 20, top at 20) on each, rope routes up,
  // ribbon gliders' npc spots on the boards, and ground spots in the gaps.
  const ribbonHatless: [number, number, number][] = [];
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 4; j++) {
      const sx = -840 + i * 160;
      const sz = -2140 + j * 240;
      s.block(`stalk-${i}-${j}`, 'beam', sx, sx + 2, sz, sz + 2, 30);
      const board = s.block(`board-${i}-${j}`, 'beam', sx - 9, sx + 11, sz - 9, sz + 11, 1, 19);
      s.route(board, 'e', 'rope', 10);
      if ((i + j) % 2 === 0) s.spotOnTop(`glider-${i}-${j}`, 'npc', RIBBON, board, 6, 6);
      if (i < 4) {
        ribbonHatless.push([sx + 81, 0, sz + 100]);
        s.container(`gap-${i}-${j}-box`, pick(T2, i + j), RIBBON, sx + 81, 0, sz + 40);
      }
    }
  }
  s.hatless(RIBBON, ribbonHatless);

  // The Crown: one huge wreath on its edge, an arch of two wreath pillars under a top deck at y 60 (40 x 20),
  // one rope route up the west pillar, and the band's hideout (npc spots and T2 chests on the deck).
  const cx = -1100;
  const cz = -1750;
  const pillarW = s.block('crown-pillar-w', 'wreath', cx - 24, cx - 12, cz - 10, cz + 10, 59.5);
  s.block('crown-pillar-e', 'wreath', cx + 12, cx + 24, cz - 10, cz + 10, 59.5);
  const deck = s.block('crown-deck', 'beam', cx - 20, cx + 20, cz - 10, cz + 10, 1, 59);
  s.route(pillarW, 'w', 'rope', 10);
  for (const dz of [-6, 0, 6]) {
    s.spotOnTop(`band-w-${dz + 6}`, 'npc', CROWN, deck, -12, dz);
    s.spotOnTop(`band-e-${dz + 6}`, 'npc', CROWN, deck, 12, dz);
  }
  let crownN = 0;
  for (const dx of [-6, -2, 2, 6]) {
    for (const dz of [-5, 5]) {
      s.containerOnTop(`band-chest-${crownN}`, 'chest', CROWN, deck, dx, dz);
      crownN++;
    }
  }

  // Foam Fields: green florist foam (stone 10 x 10 x 3) on a 60 gm grid, with dirty puddles in the holes.
  const foamHatless: [number, number, number][] = [];
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 14; j++) {
      const ox = -1760 + i * 60;
      const oz = -2160 + j * 60;
      const k = i * 14 + j;
      const hole = (i + j) % 5 === 0;
      if (hole) {
        s.water({ id: `puddle-${i}-${j}`, kind: 'puddle', clean: false, x: ox + 30, y: 0, z: oz + 30 });
      } else {
        const foam = s.block(`foam-${i}-${j}`, 'stone', ox, ox + 10, oz, oz + 10, 3);
        if ((i === 2 && j === 2) || (i === 6 && j === 10)) s.spotOnTop(`foam-npc-${i}-${j}`, 'npc', FOAM, foam);
      }
      if (!hole && k % 7 === 0) foamHatless.push([ox + 30, 0, oz + 30]);
      if (!hole && k % 9 === 4) s.container(`foam-box-${i}-${j}`, pick(T1, k), FOAM, ox + 30, 0, oz + 30 + 20);
    }
  }
  s.hatless(FOAM, foamHatless);

  // Outer fence on the west edge: this district's part (z -2200..-400). The compost part (30 tall) overlaps its first 0.5 gm.
  s.block('fence-west', 'fence', -1803, -1799, -2200, -400, 29.5);

  return s.done();
}

export const WREATHWOOD_MAP: DistrictMap = buildWreathwood();
