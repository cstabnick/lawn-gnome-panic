// The Rockery: rock-garden mountains. Flintdelve (the mining town) is cut into the rock, the Spigot
// is the source of the Hose, the Shard Mine and the Kiln hold the old Shard. Negative z is north.
import type { ZoneDef } from '../../config';

export const ZONE: ZoneDef = {
  id: 'rockery',
  name: 'The Rockery',
  levels: [19, 24],
  half: 120,
  spawn: { x: -52, z: -52 },
  shrine: { x: 0, z: 20, name: 'the Flintdelve forge' },
  regions: [
    { id: 'flintdelve', name: 'Flintdelve', x: 0, z: 20, r: 22 },
    { id: 'spigot', name: 'The Spigot', x: -90, z: -60, r: 14 },
    { id: 'marble-pits', name: 'Marble Pits', x: -80, z: 40, r: 18 },
    { id: 'shard-mine', name: 'Shard Mine', x: 40, z: -20, r: 20 },
    { id: 'mudtooth-deeps', name: 'Mudtooth Deeps', x: 60, z: 50, r: 18 },
    { id: 'kiln', name: 'The Kiln', x: 0, z: -80, r: 18 },
    { id: 'kiln-back', name: 'Kiln Back Chambers', x: 0, z: -102, r: 8 },
    { id: 'raft-dock', name: 'Raft Dock', x: -40, z: 40, r: 5 },
  ],
  // The Spigot's pool, at the foot of the metal tap.
  lakes: [{ x: -90, z: -45, r: 10 }],
  // Door yaw points at the centre of each group (yaw 0 faces +z).
  houses: [
    // Flintdelve: fourteen stone houses in a ring cut into the rock, clear of the forge.
    { x: 16, z: 20, r: 3.2, yaw: -1.57, style: 'stone' },
    { x: 14.4, z: 26.9, r: 3.2, yaw: -2.02, style: 'stone' },
    { x: 10, z: 32.5, r: 3.2, yaw: -2.47, style: 'stone' },
    { x: 3.6, z: 35.6, r: 3.2, yaw: -2.91, style: 'stone' },
    { x: -3.6, z: 35.6, r: 3.2, yaw: 2.91, style: 'stone' },
    { x: -10, z: 32.5, r: 3.2, yaw: 2.47, style: 'stone' },
    { x: -14.4, z: 26.9, r: 3.2, yaw: 2.02, style: 'stone' },
    { x: -16, z: 20, r: 3.2, yaw: 1.57, style: 'stone' },
    { x: -14.4, z: 13.1, r: 3.2, yaw: 1.12, style: 'stone' },
    { x: -10, z: 7.5, r: 3.2, yaw: 0.67, style: 'stone' },
    { x: -3.6, z: 4.4, r: 3.2, yaw: 0.23, style: 'stone' },
    { x: 3.6, z: 4.4, r: 3.2, yaw: -0.23, style: 'stone' },
    { x: 10, z: 7.5, r: 3.2, yaw: -0.67, style: 'stone' },
    { x: 14.4, z: 13.1, r: 3.2, yaw: -1.12, style: 'stone' },
    // Shard Mine: two stone houses at the minehead.
    { x: 34, z: -14, r: 3.2, yaw: 2.36, style: 'stone' },
    { x: 46, z: -26, r: 3.2, yaw: -0.79, style: 'stone' },
    // The Kiln: the big stone dome, set back from the kiln's centre.
    { x: 0, z: -91, r: 6, yaw: 0, style: 'stone' },
    // Raft Dock: the log hut by the leaf-raft.
    { x: -34, z: 36, r: 3.2, yaw: -0.98, style: 'log' },
  ],
  theme: { ground: 0x8a8478, groundAlt: 0x9c9488, flora: 'rock', floraDensity: 0.8, fog: 0xbab3a6, sky: 0xc9d3dc, hilliness: 2.5 },
  exits: [
    { to: 'keep', x: 110, z: 110, r: 4, arriveX: -52, arriveZ: -52, label: 'Road back to Birdbath Keep' },
    { to: 'verge', x: 60, z: -115, r: 4, arriveX: -80, arriveZ: 100, label: 'Rockery pass to the Verge', when: { quest: { id: 'c6-who-holds-the-valve', status: 'done' } } },
  ],
};
