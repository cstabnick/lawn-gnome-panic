// Every computer-controlled gnome: the guide, the shopkeepers and the townsfolk. Shopkeepers and the guide stand
// (one-point path); townsfolk walk a closed loop. Positions are binding (see docs/roadmaps/club-gnome-oakcount.md 2J).
import type { NpcDef } from './config';

export const NPCS: readonly NpcDef[] = [
  // ------------------------------------------------------------ the guide and the shopkeepers (standing)
  {
    id: 'chicory-waymark',
    name: 'Chicory Waymark',
    map: 'town',
    path: [{ x: 2.6, z: 6.6 }],
    facing: -1.8,
    look: {
      hat: 0xf5d000, shirt: 0x4fb3e8, pants: 0x4a3b2a, skin: 0xf1c27d, boots: 0x3a2a1a,
      beard: 0xf4f4f4, hair: null, freckles: false, dress: false, glasses: true,
    },
    color: 0xffe066,
    lines: [
      'Welcome! Shops line the edges; the fountain keeps the middle.',
      'Acorns buy gear at the Market. Chips are for the Gnomecino.',
      'Mind the mowers. They cross the square and never look down.',
    ],
    counter: 'guide',
  },
  {
    id: 'clary-tillbox',
    name: 'Clary Tillbox',
    map: 'gnomecino',
    path: [{ x: 2, z: -8.4 }],
    facing: 0,
    look: {
      hat: 0x8a1c1c, shirt: 0x2b2b3a, pants: 0x2a2a2a, skin: 0xf1c27d, boots: 0x111111,
      beard: null, hair: { color: 0xc9c9c9, style: 'bun' }, freckles: false, dress: false, glasses: false,
      equipment: { head: 'dealer-visor' },
    },
    color: 0xfff3b0,
    lines: [
      'Acorns in, chips out. Every chip is counted twice.',
      'The house always wins, but the house is very polite about it.',
      'Slots are by the pillar, blackjack by the tables.',
    ],
    counter: 'counter-cashier',
  },
  {
    id: 'fennel-brassbell',
    name: 'Fennel Brassbell',
    map: 'gnomecino',
    path: [{ x: 7, z: -8.4 }],
    facing: 0,
    look: {
      hat: 0x222222, shirt: 0xb8860b, pants: 0x3d2b1f, skin: 0xe8b48a, boots: 0x111111,
      beard: 0xb0b0b0, hair: null, freckles: false, dress: false, glasses: false,
      equipment: { head: 'high-roller-top-hat' },
    },
    color: 0xffd98a,
    lines: [
      'Chips in, prizes out. Mind the glass on the cabinet.',
      'Nothing here is free, but the good hats are worth the wait.',
      'The top hat is for high rollers. Everyone else, admire it.',
    ],
    counter: 'counter-prizes',
  },
  {
    id: 'marjoram-crate',
    name: 'Marjoram Crate',
    map: 'market',
    path: [{ x: -3, z: -5.3 }],
    facing: 0,
    look: {
      hat: 0x7a4b2a, shirt: 0x3f7d3a, pants: 0x5a4a3a, skin: 0xf1c27d, boots: 0x222222,
      beard: null, hair: { color: 0x8b5a2b, style: 'bun' }, freckles: false, dress: false, glasses: false,
    },
    color: 0xc5f0a4,
    lines: [
      'Gear for acorns. Try it on in the dressing room first.',
      'Everything here is sturdy, except the prices.',
      'Lost your hat? I have six more in the back.',
    ],
    counter: 'counter-market',
  },
  {
    id: 'poppy-thimble',
    name: 'Poppy Thimble',
    map: 'market',
    path: [{ x: 7.6, z: -2.6 }],
    facing: -1.5708,
    look: {
      hat: 0xf2a7c3, shirt: 0xf4e1d2, pants: 0x7b5ea7, skin: 0xf1c27d, boots: 0x333333,
      beard: null, hair: { color: 0xe07a5f, style: 'braid' }, freckles: false, dress: true, glasses: false,
    },
    color: 0xffc2de,
    lines: [
      'The dressing room is through the curtain. Take your time.',
      'A dress suits most gnomes. Trousers suit most too, to be fair.',
      'Mirrors are free. Looking at the price tags is not.',
    ],
    counter: 'counter-dressing',
  },
  {
    id: 'lavender-shearwell',
    name: 'Lavender Shearwell',
    map: 'salon',
    path: [{ x: 0, z: -4.4 }],
    facing: 0,
    look: {
      hat: 0xb39ddb, shirt: 0xd7c4f0, pants: 0x4a3f5c, skin: 0xf1c27d, boots: 0x222222,
      beard: null, hair: { color: 0x6a1b9a, style: 'curls' }, freckles: false, dress: false, glasses: false,
    },
    color: 0xe1d2ff,
    lines: [
      'New hair for acorns. Curls are a commitment, dear.',
      'Sit down, close your eyes, and mind the scissors.',
      'Bring a friend. The second chair is lonely otherwise.',
    ],
    counter: 'counter-salon',
  },
  {
    id: 'hazel-dovetail',
    name: 'Hazel Dovetail',
    map: 'row',
    path: [{ x: 12.6, z: -1.6 }],
    facing: 0.4,
    look: {
      hat: 0x5d4037, shirt: 0x8b6b43, pants: 0x3e2f23, skin: 0xe0a878, boots: 0x222222,
      beard: 0x6b4a2e, hair: null, freckles: false, dress: false, glasses: false,
    },
    color: 0xf0d2a8,
    lines: [
      'The sawdust is ready. The shop is not, but it is nearly.',
      'A chair you build yourself sits better. Trust me.',
      'Benches belong in the Yard, not the house. I make both.',
    ],
    counter: 'counter-furniture',
  },

  // ------------------------------------------------------------ townsfolk (walking loops)
  {
    id: 'thistle-mugsworth',
    name: 'Thistle Mugsworth',
    map: 'town',
    path: [{ x: -4.5, z: -2.2 }, { x: 4.5, z: -2.2 }, { x: 4.5, z: 2.2 }, { x: -4.5, z: 2.2 }],
    facing: 0,
    look: {
      hat: 0x6aa84f, shirt: 0xc0504d, pants: 0x4a4a6a, skin: 0xf1c27d, boots: 0x222222,
      beard: 0xe6e6e6, hair: null, freckles: false, dress: false, glasses: false,
    },
    color: 0xd9f7c4,
    lines: [
      'Lovely day for it. Any day is lovely if the mower stays off.',
      'I have crossed this square for forty years. It still surprises me.',
      'Does anyone know where the best acorns fall? Nobody will say.',
    ],
  },
  {
    id: 'clover-pegg',
    name: 'Clover Pegg',
    map: 'town',
    path: [{ x: -8.5, z: -2.5 }, { x: -6, z: -2.5 }, { x: -6, z: 2.5 }, { x: -8.5, z: 2.5 }],
    facing: 0,
    look: {
      hat: 0x9c27b0, shirt: 0x26a69a, pants: 0x5d4037, skin: 0xf1c27d, boots: 0x222222,
      beard: null, hair: { color: 0xf0c040, style: 'pigtails' }, freckles: true, dress: false, glasses: false,
    },
    color: 0xd6c8ff,
    lines: [
      'The bench is free, if you can get a seat before the pigeons.',
      'The gnomecino smells of cheese and luck. Mostly cheese.',
      'I lost an acorn on that bench once. It is probably still there.',
    ],
  },
  {
    id: 'burdock-ladle',
    name: 'Burdock Ladle',
    map: 'town',
    path: [{ x: 11.5, z: -3 }, { x: 16, z: -3 }, { x: 16, z: 0.5 }, { x: 11.5, z: 0.5 }],
    facing: 0,
    look: {
      hat: 0x795548, shirt: 0x607d8b, pants: 0x37474f, skin: 0xd9a066, boots: 0x111111,
      beard: 0x8d6e63, hair: null, freckles: false, dress: false, glasses: true,
    },
    color: 0xc9dce6,
    lines: [
      'The fountain splashes a bit more on Thursdays. Nobody knows why.',
      'Watch the road. The mowers do not check for gnomes.',
      'I am waiting for the bowling alley to open. Since spring.',
    ],
  },
  {
    id: 'primrose-kettleby',
    name: 'Primrose Kettleby',
    map: 'park',
    path: [{ x: -3, z: 3 }, { x: 3, z: 3 }, { x: 3, z: 6 }, { x: -3, z: 6 }],
    facing: 0,
    look: {
      hat: 0xff8a65, shirt: 0xfff176, pants: 0x9ccc65, skin: 0xf1c27d, boots: 0x333333,
      beard: null, hair: { color: 0x4e342e, style: 'long' }, freckles: true, dress: true, glasses: false,
    },
    color: 0xffe0c2,
    lines: [
      'The park is quiet today. The field lab is only a little smoky.',
      'Pick the crocuses, leave the daisies. Daisies complain.',
      'I packed a picnic. It has one biscuit in it, and it is mine.',
    ],
  },
  {
    id: 'dill-spindle',
    name: 'Dill Spindle',
    map: 'park',
    path: [{ x: -14, z: -5 }, { x: -6, z: -5 }, { x: -6, z: -3 }, { x: -14, z: -3 }],
    facing: 0,
    look: {
      hat: 0x2e7d32, shirt: 0x1565c0, pants: 0x5d4037, skin: 0xe0a878, boots: 0x222222,
      beard: 0xbdbdbd, hair: null, freckles: false, dress: false, glasses: false,
    },
    color: 0xbfe3ff,
    lines: [
      'Golf is a lot of walking for a very small ball.',
      'The dock is over there. I have never once been on it.',
      'Someone left a spoon on the bench. It is mine now.',
    ],
  },
  {
    id: 'rosemary-brickwell',
    name: 'Rosemary Brickwell',
    map: 'row',
    path: [{ x: -6, z: 6 }, { x: 6, z: 6 }, { x: 6, z: 9 }, { x: -6, z: 9 }],
    facing: 0,
    look: {
      hat: 0xad1457, shirt: 0x90a4ae, pants: 0x424242, skin: 0xf1c27d, boots: 0x222222,
      beard: null, hair: { color: 0x3e2723, style: 'mullet' }, freckles: false, dress: false, glasses: true,
    },
    color: 0xffc4d8,
    lines: [
      'Two shops, one furniture house, and a great deal of pavement.',
      'Mind the path down to town. It is steeper than it looks.',
      'My hedge is taller than your hat. Please stop climbing it.',
    ],
  },
  {
    id: 'sage-bucketby',
    name: 'Sage Bucketby',
    map: 'gnomecino',
    path: [{ x: -2, z: 3 }, { x: 3, z: 3 }, { x: 3, z: 5 }, { x: -2, z: 5 }],
    facing: 0,
    look: {
      hat: 0x00838f, shirt: 0xfdd835, pants: 0x6d4c41, skin: 0xd9a066, boots: 0x111111,
      beard: 0xf5f5f5, hair: null, freckles: false, dress: false, glasses: false,
    },
    color: 0xb8f2ea,
    lines: [
      'I come for the pool table. I do not play pool.',
      'The blackjack tables are loud. The slots are louder, but nicer.',
      'Sit on a stool, not a barrel. Barrels are for the cellar.',
    ],
  },
];
