import { createStamper } from '../stamp';
import type { DistrictMap } from '../types';

// Yew Walk (roadmap 7.11): Upper Walk, the Yews, Lower Walk. Blockout level.
const s = createStamper('yew-walk');

// ---- Upper Walk (x 0..440, z -1600..0): gravel avenue at x 380, benches, bins, headstone rows.
s.path({ id: 'upper-avenue', kind: 'gravel', points: [[380, 0], [380, -1600]], width: 14 });
for (let j = 0; j < 10; j++) {
  s.headstoneRow('uw', 10, -1560 + 160 * j, {
    width: 8, depth: 4, gaps: [14, 16, 18], heights: [3, 5, 7, 9], skipX0: 340, skipX1: 400, xEnd: 430, row: j,
  });
}
for (let k = 0; k < 8; k++) {
  const z = -150 - 200 * k;
  s.block(`upper-bench-${k}`, 'bench', 355, 359, z, z + 10, 4);
  s.block(`upper-bin-${k}`, 'bin', 394, 397, z - 100, z - 97, 4);
}
// Hatless in the gaps between headstone rows.
s.hatless('upper-walk', [[100, 0, -1480], [200, 0, -1320], [80, 0, -1160], [250, 0, -840], [120, 0, -520], [300, 0, -200]]);
s.spot('upper-npc-1', 'npc', 'upper-walk', 345, 0, -1000);
s.spot('upper-npc-2', 'npc', 'upper-walk', 420, 0, -700);
s.spot('upper-npc-3', 'npc', 'upper-walk', 345, 0, -1480);
s.spot('upper-npc-4', 'npc', 'upper-walk', 420, 0, -300);
for (let k = 0; k < 8; k++) {
  const types = ['vase', 'bin', 'sack', 'crate'] as const;
  s.container(`upper-c-${k}`, types[k % 4], 'upper-walk', k % 2 === 0 ? 60 : 300, 0, -200 - 170 * k);
}

// ---- The Yews (x 440..800, z -1600..0): two lines of clipped yews, each with a branch platform.
for (let line = 0; line < 2; line++) {
  const cx = line === 0 ? 500 : 740;
  for (let k = 0; k < 13; k++) {
    const cz = -1560 + 120 * k;
    const yew = s.block(`yew-${line}-${k}`, 'yew', cx - 30, cx + 30, cz - 30, cz + 30, 130);
    s.route(yew, 'w', 'rope', 30);
    const beam = s.block(`yew-beam-${line}-${k}`, 'beam', cx - 35, cx + 35, cz - 35, cz + 35, 2, 38);
    s.spotOnTop(`yew-npc-${line}-${k}`, 'npc', 'the-yews', beam, line === 0 ? -32 : 32, 0);
    if ((line + k) % 2 === 0) s.containerOnTop(`yew-c-${line}-${k}`, 'chest', 'the-yews', beam, 0, 32);
  }
}

// ---- Lower Walk (x 440..800, z 0..400): gravel path from the Forecourt corner, benches, bins.
s.path({ id: 'lower-avenue', kind: 'gravel', points: [[440, 400], [620, 0]], width: 14 });
for (let k = 0; k < 4; k++) {
  const z = 40 + 80 * k;
  s.block(`lower-bench-${k}`, 'bench', 455, 459, z, z + 10, 4);
  s.block(`lower-bin-${k}`, 'bin', 780, 783, z + 20, z + 23, 4);
}
s.hatless('lower-walk', [[470, 0, 250], [700, 0, 300], [720, 0, 120], [760, 0, 20], [470, 0, 100], [560, 0, 360]]);
s.spot('lower-npc-1', 'npc', 'lower-walk', 480, 0, 200);
s.spot('lower-npc-2', 'npc', 'lower-walk', 740, 0, 200);
s.spot('lower-npc-3', 'npc', 'lower-walk', 700, 0, 40);
s.spot('lower-npc-4', 'npc', 'lower-walk', 560, 0, 320);
s.container('lower-c-0', 'crate', 'lower-walk', 470, 0, 280);
s.container('lower-c-1', 'sack', 'lower-walk', 720, 0, 140);
s.container('lower-c-2', 'bin', 'lower-walk', 760, 0, 300);

export const YEW_WALK_MAP: DistrictMap = s.done();
