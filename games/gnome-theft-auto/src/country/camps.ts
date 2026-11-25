// The hunter camps in the empty country (L72): little shacks, tents and stands so the sparse parts are less sparse.
// Pure data. Spots probed for dry open ground, 30 m+ from a road, clear of reserved sites; camps.test.ts re-checks them.
import type { CampDef } from './types';

const N = Math.PI, E = Math.PI / 2, W = -Math.PI / 2;

export const CAMPS: readonly CampDef[] = [
  // west-estates
  { id: 'camp-west-1', name: 'The Thermos Stand', kind: 'stand', x: -1340, z: -740, yaw: E,
    loot: { acorns: 12, prompt: 'Check the thermos' } },
  { id: 'camp-west-2', name: "Teasel's Tent", kind: 'tent', x: -1340, z: 110, yaw: E, sleeper: true,
    loot: { item: 'seed-cake', n: 1, prompt: 'Look in the pack' } },
  { id: 'camp-west-3', name: 'Wet Boots Rack', kind: 'drying', x: -1340, z: 360, yaw: 0,
    loot: { acorns: 8, prompt: 'Lift the bedroll' } },
  // north-highlands
  { id: 'camp-north-1', name: "Old Burdock's Shack", kind: 'shack', x: -1340, z: -1140, yaw: 0, sleeper: true,
    loot: { acorns: 25, prompt: 'Check the biscuit tin' } },
  { id: 'camp-north-2', name: 'Cutback Hide Social Club', kind: 'camp', x: -1090, z: -1290, yaw: 0, sleeper: true,
    loot: { item: 'cheese-wedge', n: 1, prompt: 'Lift the tea cosy' } },
  { id: 'camp-north-3', name: 'Cutback Hide', kind: 'stand', x: -840, z: -1240, yaw: N,
    loot: { acorns: 10, prompt: 'Look in the flask pouch' } },
  { id: 'camp-north-4', name: 'Damp Socks Camp', kind: 'tent', x: -40, z: -1390, yaw: 0,
    loot: { item: 'crab-apple', n: 2, prompt: 'Check the sock bag' } },
  { id: 'camp-north-5', name: "Comfrey's Shack", kind: 'shack', x: 260, z: -1440, yaw: E,
    loot: { acorns: 18, prompt: 'Check the tin on the sill' } },
  { id: 'camp-north-6', name: 'The Long Wait', kind: 'camp', x: 760, z: -1540, yaw: 0, sleeper: true,
    loot: { item: 'seed-cake', n: 2, prompt: 'Look in the hamper' } },
  { id: 'camp-north-7', name: 'Frost Pocket Rack', kind: 'drying', x: 1160, z: -1090, yaw: W,
    loot: { acorns: 6, prompt: 'Lift the bedroll' } },
  { id: 'camp-north-8', name: "Mallow's Tent", kind: 'tent', x: 1360, z: -1340, yaw: W, sleeper: true,
    loot: { acorns: 15, prompt: 'Look in the pack' } },
  // loch-moss
  { id: 'camp-loch-1', name: 'Quackless Blind', kind: 'blind', x: -840, z: -440, yaw: 0,
    loot: { acorns: 9, prompt: 'Check the decoy box' } },
  { id: 'camp-loch-2', name: 'The Patient Stand', kind: 'stand', x: -490, z: -740, yaw: E,
    loot: { item: 'crab-apple', n: 1, prompt: 'Check the lunch tin' } },
  // tallgrass-commons
  { id: 'camp-tall-1', name: "Yarrow's Tent", kind: 'tent', x: -840, z: 560, yaw: E, sleeper: true,
    loot: { item: 'seed-cake', n: 1, prompt: 'Look in the pack' } },
  { id: 'camp-tall-2', name: 'Tuft Drying Yard', kind: 'drying', x: -640, z: 660, yaw: 0,
    loot: { acorns: 14, prompt: 'Lift the bedroll' } },
  // cloverfield-farms
  { id: 'camp-clover-1', name: 'Hay Bale Hide', kind: 'drying', x: -390, z: 560, yaw: N,
    loot: { acorns: 11, prompt: 'Check the biscuit tin' } },
  { id: 'camp-clover-2', name: "Wicker's Shack", kind: 'shack', x: 410, z: 460, yaw: W, sleeper: true,
    loot: { item: 'cheese-wedge', n: 1, prompt: 'Lift the tea cosy' } },
  // dust-flats
  { id: 'camp-dust-1', name: 'Dry Spell Camp', kind: 'camp', x: 760, z: 560, yaw: N,
    loot: { acorns: 20, prompt: 'Check the kettle bag' } },
  { id: 'camp-dust-2', name: 'Last Cup Camp', kind: 'camp', x: 860, z: 210, yaw: E,
    loot: { item: 'crab-apple', n: 2, prompt: 'Look in the cooler' } },
  // east-campus
  { id: 'camp-east-1', name: "Plantain's Tent", kind: 'tent', x: 910, z: -640, yaw: W,
    loot: { acorns: 7, prompt: 'Look in the pack' } },
  { id: 'camp-east-2', name: 'The Gutter Stand', kind: 'stand', x: 1310, z: -840, yaw: N,
    loot: { acorns: 16, prompt: 'Check the thermos' } },
  { id: 'camp-east-3', name: 'Late Lecture Camp', kind: 'camp', x: 1360, z: 310, yaw: W,
    loot: { item: 'seed-cake', n: 1, prompt: 'Check the biscuit tin' } },
  // south-shore
  { id: 'camp-south-1', name: 'Reedy Blind', kind: 'blind', x: -1090, z: 960, yaw: N,
    loot: { acorns: 13, prompt: 'Check the decoy box' } },
  { id: 'camp-south-2', name: "Old Pellitory's Shack", kind: 'shack', x: -440, z: 1060, yaw: N,
    loot: { acorns: 22, prompt: 'Look in the biscuit tin' } },
  { id: 'camp-south-3', name: 'Tide Table Blind', kind: 'blind', x: 610, z: 960, yaw: N,
    loot: { item: 'crab-apple', n: 1, prompt: 'Look in the pack' } },
  { id: 'camp-south-4', name: "Thimble's Tent", kind: 'tent', x: 1210, z: 1060, yaw: N,
    loot: { acorns: 5, prompt: 'Lift the tent flap' } },
];
