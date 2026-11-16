// Drainpipe Deeps: indoor dungeon under the Keep. Three wings (Gutters, Cistern, Backflow) split by walls;
// hatches open each wing as the story reaches it. Layout from src/data/README.md (zone layouts table).
import type { ZoneDef } from '../../config';

export const ZONE: ZoneDef = {
  id: 'deeps',
  name: 'The Drainpipe Deeps',
  levels: [10, 25],
  half: 100,
  indoor: true,
  spawn: { x: 0, z: 90 },
  shrine: { x: 0, z: 90, name: 'the Gutter landing' },
  regions: [
    { id: 'gutters', name: 'The Gutters', x: 0, z: 65, r: 25 },
    { id: 'clogmaw-den', name: 'Clogmaw Den', x: 0, z: 42, r: 9 },
    { id: 'cistern', name: 'The Cistern', x: 0, z: 8, r: 26 },
    { id: 'vesh-pool', name: "Mother Vesh's Pool", x: 0, z: -14, r: 9 },
    { id: 'backflow', name: 'The Backflow', x: 0, z: -55, r: 24 },
    { id: 'great-valve', name: 'The Great Valve', x: 0, z: -86, r: 9 },
  ],
  lakes: [
    { x: 0, z: 65, r: 8 },    // ankle water in the Gutters
    { x: 0, z: 8, r: 14 },    // cistern pool, walkway round it
    { x: -20, z: -55, r: 8 }, // flooded rust in the Backflow
    { x: 20, z: -55, r: 8 },
  ],
  houses: [
    { x: -70, z: 24, r: 3, yaw: 0, style: 'stone' },
    { x: -40, z: 24, r: 3, yaw: 0, style: 'stone' },
    { x: 40, z: 24, r: 3, yaw: 0, style: 'stone' },
    { x: 70, z: 24, r: 3, yaw: 0, style: 'stone' },
    { x: -60, z: -18, r: 3, yaw: 0, style: 'stone' },
    { x: 60, z: -18, r: 3, yaw: 0, style: 'stone' },
  ],
  walls: [
    // z=30: between the Gutters and the Cistern (solid: only the hatches cross it)
    { x1: -100, z1: 30, x2: 100, z2: 30 },
    // z=-24: between the Cistern and the Backflow (solid)
    { x1: -100, z1: -24, x2: 100, z2: -24 },
  ],
  theme: { ground: 0x4a4438, groundAlt: 0x5a5040, flora: 'pipe', floraDensity: 0.6, fog: 0x1d1a16, sky: 0x0d0c0a, hilliness: 0 },
  exits: [
    // back up to the Keep's deeps-stairs
    { to: 'keep', x: 0, z: 97, r: 4, arriveX: -30, arriveZ: 26, label: 'Back up to the Keep' },
    // hatch in the z=30 wall, opens when c5-valve-maps is active or done
    { to: 'deeps', x: 0, z: 33, r: 1.5, arriveX: 0, arriveZ: 24, label: 'Hatch (north)',
      when: { not: { quest: { id: 'c5-valve-maps', status: 'none' } } } },
    // hatch in the z=-24 wall, opens when c6-down-the-drains is active or done
    { to: 'deeps', x: 0, z: -21, r: 1.5, arriveX: 0, arriveZ: -30, label: 'Hatch (Backflow)',
      when: { not: { quest: { id: 'c6-down-the-drains', status: 'none' } } } },
    // reverse hatches, always open
    { to: 'deeps', x: 0, z: 27, r: 1.5, arriveX: 0, arriveZ: 36, label: 'Hatch (south)' },
    { to: 'deeps', x: 0, z: -27, r: 1.5, arriveX: 0, arriveZ: -18, label: 'Hatch (Cistern)' },
  ],
};
