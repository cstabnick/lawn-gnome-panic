import { createStamper } from '../stamp';
import type { BlockDef, DistrictMap } from '../types';

// The Lawn Section (roadmap 7.9, regions.md 9): flat, open, a crossing. Route ids use the district prefix `ls-`.
const s = createStamper('lawn-section');

// The Plaques: 6 x 3 flat plaques on a 12 gm pitch, flower vases on four of them.
const plaques: BlockDef[] = [];
for (let i = 0; i < 6; i++) {
  for (let j = 0; j < 3; j++) {
    const x0 = 812 + 12 * i, z0 = -1560 + 12 * j;
    plaques.push(s.block(`plaque-${i}-${j}`, 'plaque', x0, x0 + 6, z0, z0 + 6, 0.6));
  }
}
[0, 6, 10, 15].forEach((k, n) => s.containerOnTop(`vase-${n}`, 'vase', 'the-plaques', plaques[k]));
s.hatless('the-plaques', [[821, 0, -1551], [833, 0, -1551], [821, 0, -1539], [833, 0, -1539]]);
s.spot('npc-plaques-1', 'npc', 'the-plaques', 809, 0, -1400);
s.spot('npc-plaques-2', 'npc', 'the-plaques', 1190, 0, -1000);

// The Sprinkler Field: sprinkler heads every 30 gm, dirty puddles, a few bins.
for (let i = 0; i < 13; i++) {
  for (let j = 0; j < 23; j++) {
    const x0 = 1215 + 30 * i, z0 = -1575 + 30 * j;
    s.block(`sprinkler-${i}-${j}`, 'pipe', x0, x0 + 1, z0, z0 + 1, 1);
  }
}
s.hatless('sprinkler-field', [[1230, 0, -1560], [1260, 0, -1530], [1290, 0, -1500], [1320, 0, -1470]]);
s.spot('npc-sprinkler-1', 'npc', 'sprinkler-field', 1390, 0, -1000);
s.spot('npc-sprinkler-2', 'npc', 'sprinkler-field', 1550, 0, -1200);
s.container('bin-sprinkler-1', 'bin', 'sprinkler-field', 1412, 0, -1100);
s.container('bin-sprinkler-2', 'bin', 'sprinkler-field', 1442, 0, -1100);
s.container('bin-sprinkler-3', 'bin', 'sprinkler-field', 1472, 0, -1100);
s.water({ id: 'w-puddle-sprinkler-1', kind: 'puddle', clean: false, x: 1300, y: 0, z: -1000 });
s.water({ id: 'w-puddle-sprinkler-2', kind: 'puddle', clean: false, x: 1500, y: 0, z: -1300 });

// The Bench Line: a gravel path with benches along it, lookouts on top.
s.path({ id: 'gravel-bench-line', kind: 'gravel', points: [[1000, -880], [1000, -220]], width: 4 });
for (let k = 0; k < 4; k++) {
  const b = s.block(`bench-${k}`, 'bench', 1010, 1014, -850 + 60 * k, -840 + 60 * k, 2);
  s.spotOnTop(`npc-bench-${k}`, 'npc', 'bench-line', b);
}
s.hatless('bench-line', [[1040, 0, -850], [1040, 0, -790], [1060, 0, -730], [1040, 0, -670]]);
s.container('bin-bench-1', 'bin', 'bench-line', 1150, 0, -500);
s.container('bin-bench-2', 'bin', 'bench-line', 1150, 0, -600);
s.container('bin-bench-3', 'bin', 'bench-line', 1150, 0, -700);

// The Irrigation: three 12-wide north-south lanes, 8 deep, valve boxes between them, ladders out at the ends.
s.pit('lane-1', { x0: 1220, x1: 1232, z0: -880, z1: -220 }, 8);
s.pit('lane-2', { x0: 1270, x1: 1282, z0: -880, z1: -220 }, 8);
s.pit('lane-3', { x0: 1320, x1: 1332, z0: -880, z1: -220 }, 8);
s.route({ id: 'ls-lane-1' }, 'n', 'ladder', 6);   // north end of lane 1
s.route({ id: 'ls-lane-2' }, 's', 'ladder', 6);   // south end of lane 2
s.block('valve-1', 'pipe', 1240, 1244, -600, -596, 1);
s.block('valve-2', 'pipe', 1290, 1294, -400, -396, 1);
s.block('valve-3', 'pipe', 1340, 1344, -700, -696, 1);
s.hatless('the-irrigation', [[1226, -8, -800], [1276, -8, -700], [1326, -8, -600], [1226, -8, -400]]);
s.spot('npc-irrigation-1', 'npc', 'the-irrigation', 1205, 0, -500);
s.spot('npc-irrigation-2', 'npc', 'the-irrigation', 1390, 0, -300);
s.container('crate-irrigation-1', 'crate', 'the-irrigation', 1240, 0, -850);
s.container('crate-irrigation-2', 'crate', 'the-irrigation', 1240, 0, -820);
s.container('crate-irrigation-3', 'crate', 'the-irrigation', 1240, 0, -790);

// Mower Tracks: mown stripes (grass paths 20 wide), nothing tall.
s.path({ id: 'mown-1', kind: 'grass', points: [[1430, -880], [1430, -220]], width: 20 });
s.path({ id: 'mown-2', kind: 'grass', points: [[1530, -880], [1530, -220]], width: 20 });
s.hatless('mower-tracks', [[1410, 0, -850], [1470, 0, -800], [1510, 0, -700], [1580, 0, -600]]);
s.spot('npc-mower-1', 'npc', 'mower-tracks', 1420, 0, -500);
s.spot('npc-mower-2', 'npc', 'mower-tracks', 1580, 0, -300);
s.container('bin-mower-1', 'bin', 'mower-tracks', 1450, 0, -700);
s.container('bin-mower-2', 'bin', 'mower-tracks', 1450, 0, -650);
s.container('bin-mower-3', 'bin', 'mower-tracks', 1450, 0, -600);

// Inner gates: closed while the east stage is closed (west border with the Lawn's neighbours, north border with the Reeds' side).
s.gate('gate-west', 798, 802, -1600, -200, 6);
s.gate('gate-north', 800, 1600, -1602, -1598, 6);

export const LAWN_SECTION_MAP: DistrictMap = s.done();
