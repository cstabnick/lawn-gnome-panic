// Gnome Theft Auto (E14): Rutbottom Dirt Bowl, Capwood toadstools and Capwood Run scenery and the dirt bike.
import type { Part, PrefabDef } from '../types';

const STEM = 'mushroom-stem';
const TIMBER = 'wood';
const TIMBER_DARK = 'wood-dark';
const CAP_TINT = 0xc8382e;
const BOLETE_TINT = 0xb5652a;
const PAVILION_TINT = 0xf0e6c8;
const FLAG_TINT = 0xff7a00;
const SPORE = 0xc9a46a;
const PUFF = 0xf2ecd8;
const GILL = 0x9c7a50;

/** White spots scattered over a dome: `rings` is [distance from the cap's axis, spot count] pairs. */
function domeSpots(capR: number, cy: number, ry: number, rings: readonly (readonly [number, number])[]): Part[] {
  const out: Part[] = [];
  rings.forEach(([rho, n], ring) => {
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + ring * 0.7;
      const y = cy + ry * Math.sqrt(1 - (rho / capR) ** 2);
      out.push({ s: 'ball', d: [0.32], at: [Math.cos(a) * rho, y - 0.02, Math.sin(a) * rho], scale: [1, 0.3, 1], c: 'white', seg: 6 });
    }
  });
  return out;
}

/** A small toadstool standing on a mound (its stem starts inside the mound), cap top at height h. */
function mushroom(x: number, z: number, h: number): Part[] {
  const capR = 0.35 + h * 0.12;
  const stemR = 0.08 + h * 0.04;
  const capY = h - 0.5 * capR;
  return [
    { s: 'cyl', d: [stemR, stemR * 1.2, capY - 0.3], at: [x, 0.3 + (capY - 0.3) / 2, z], c: STEM, seg: 8 },
    { s: 'ball', d: [capR], at: [x, capY, z], scale: [1, 0.5, 1], c: 'tint', seg: 8 },
    { s: 'ball', d: [capR * 0.2], at: [x + capR * 0.4, capY + capR * 0.44, z], scale: [1, 0.3, 1], c: 'white', seg: 6 },
  ];
}

const TALL_CAP_Y = 9;
const TALL_CAP_R = 4.5;
const TALL_CAP_RY = 1.89;

const CAPWOOD_TALL: PrefabDef = {
  id: 'capwood-toadstool-tall', name: 'Capwood Tall Cap', category: 'prop', uses: ['place'],
  tags: ['toadstool', 'mushroom', 'giant', 'capwood', 'gta', 'forest', 'tall', 'cap'], emoji: [],
  tint: CAP_TINT,
  footprint: { r: 0.8, h: 10 },
  about: 'Gnome Theft Auto (E14): the Capwood Tall Cap. Life-size giant toadstool, 9 m stem with a skirt ring at 6 m and a domed cap of radius 4.5 m. Gnomes walk under it. Tint recolours the cap.',
  examine: [
    'A toadstool nine metres tall, with a pale stem, a skirt ring halfway up and a domed red cap big enough to hold the rain off a village.',
    'Gnome saying: the cap is the roof and the stem is the wall, and that is how the forest has always been built.',
    'Tip: the gills under the cap are dry even in the wet, so a gnome may shelter there, provided it does not touch the skirt.',
    'Joke: Warden Chanterelle Stook fines anyone who bruises a cap, and this one has been bruised by three generations of tent pegs.',
    'Gnomes say a Tall One woodpile is buried under the forest, and each cap grows over one log of it.',
  ],
  parts: [
    { s: 'cyl', d: [0.7, 0.8, 9], at: [0, 4.5, 0], c: STEM, seg: 12 },
    { s: 'cyl', d: [0.95, 0.95, 0.3], at: [0, 6, 0], c: STEM, seg: 12 },
    { s: 'cyl', d: [4.3, 4.0, 0.2], at: [0, 8.3, 0], c: GILL, seg: 14 },
    { s: 'ball', d: [TALL_CAP_R], at: [0, TALL_CAP_Y, 0], scale: [1, 0.42, 1], c: 'tint', seg: 14 },
    ...domeSpots(TALL_CAP_R, TALL_CAP_Y, TALL_CAP_RY, [[1.6, 5], [3.1, 6], [4.0, 2]]),
  ],
};

const CAPWOOD_SQUAT: PrefabDef = {
  id: 'capwood-toadstool-squat', name: 'Capwood Squat Cap', category: 'prop', uses: ['place'],
  tags: ['toadstool', 'bolete', 'mushroom', 'capwood', 'gta', 'squat', 'flat', 'cap'], emoji: [],
  tint: BOLETE_TINT,
  footprint: { r: 1, h: 3.2 },
  about: 'Gnome Theft Auto (E14): the Capwood Squat Cap. A short brown bolete with a flat wide cap of radius 3.2 m and a few cracks on top. Tint recolours the cap.',
  examine: [
    'A short brown toadstool with a cap as wide as a cart and cracks across its top like a dry lawn in August.',
    'Gnome saying: a squat cap keeps its own counsel, and the rain runs off it without asking.',
    'Tip: it is a fine table for a picnic, but a poor one for a fight, since the cap tips when a gnome sits on the rim.',
    'Joke: the cracks are not from age. Three rally drivers have tried to park on it, and the cap is still waiting for an apology.',
    'The underside is sponge-coloured and smells of cellar, which is how the Capwood gnomes know it has been there a long time.',
  ],
  parts: [
    { s: 'cyl', d: [0.8, 0.9, 2.6], at: [0, 1.3, 0], c: STEM, seg: 10 },
    { s: 'ball', d: [3.2], at: [0, 2.6, 0], scale: [1, 0.2, 1], c: 'tint', seg: 12 },
    { s: 'box', d: [1.2, 0.04, 0.1], at: [0.5, 3.2, 0.8], rot: [0, 30, 0], c: 'bark' },
    { s: 'box', d: [0.9, 0.04, 0.1], at: [-1.1, 3.18, -0.6], rot: [0, -20, 0], c: 'bark' },
    { s: 'box', d: [0.8, 0.04, 0.1], at: [0.2, 3.16, -1.6], rot: [0, 75, 0], c: 'bark' },
  ],
};

const CAPWOOD_CLUSTER: PrefabDef = {
  id: 'capwood-toadstool-cluster', name: 'Capwood Cap Cluster', category: 'prop', uses: ['place'],
  tags: ['toadstool', 'mushroom', 'cluster', 'capwood', 'gta', 'moss', 'mound'], emoji: [],
  tint: CAP_TINT,
  footprint: { r: 1.7, h: 2.4 },
  about: 'Gnome Theft Auto (E14): the Capwood Cap Cluster. Five small toadstools of mixed heights (0.6 to 2.2 m) on one mossy mound of radius 1.6 m. Tint recolours the caps.',
  examine: [
    'Five toadstools of different heights standing on a mossy mound, as if they were arguing about who was tallest.',
    'Gnome saying: one cap is a mushroom, two are a family, and five are a committee that has forgotten the meeting.',
    'Tip: the moss on the mound is soft enough to sleep on, but it is wet, and wet gnomes are noticed by the wardens.',
    'Joke: Warden Chanterelle Stook counted the caps twice, got six, and fined the mound for showing off.',
    'The tallest cap has a ring of smaller caps round its stem, which gnomes say is where the old woodpile has been seen to grow.',
  ],
  parts: [
    { s: 'ball', d: [1.6], at: [0, 0.56, 0], scale: [1, 0.35, 1], c: 'moss', seg: 12 },
    ...mushroom(0, 0, 2.2),
    ...mushroom(-0.9, 0.4, 1.6),
    ...mushroom(0.8, -0.5, 1.1),
    ...mushroom(0.7, 0.9, 0.6),
    ...mushroom(-0.5, -0.9, 0.9),
  ],
};

const CAPWOOD_PUFFBALL: PrefabDef = {
  id: 'capwood-puffball', name: 'Capwood Puffball', category: 'prop', uses: ['place'],
  tags: ['puffball', 'mushroom', 'spores', 'capwood', 'gta', 'round', 'puff'], emoji: [],
  footprint: { r: 1.1, h: 2.3 },
  about: 'Gnome Theft Auto (E14): the Capwood Puffball. A round off-white puffball of radius 1.1 m on the ground, with a small hole on top and a puff of tan spores above it. Fixed colours.',
  examine: [
    'A round white ball the size of a shed, with a small hole at the top and a faint dust hanging above it like breath on a cold day.',
    'Gnome saying: when the puffball sighs, the forest sneezes, and the spores go looking for somewhere new to sleep.',
    'Tip: do not stand under the hole when the puffball is ripe. The spores are not dangerous, but they do get into the beard.',
    'Joke: the Warden fined a gnome for kicking one, on the grounds that it made a noise, and the noise was the puffball apologising.',
    'Some puffballs are hollow. Those are the ones that have been used for a long time to store the spores of an older forest.',
  ],
  parts: [
    { s: 'ball', d: [1.1], at: [0, 0.99, 0], scale: [1, 0.9, 1], c: PUFF, seg: 12 },
    { s: 'cyl', d: [0.25, 0.25, 0.04], at: [0, 1.97, 0], c: 0x6b5a40, seg: 10 },
    { s: 'ball', d: [0.12], at: [0, 2.22, 0], c: SPORE, alpha: 0.6, seg: 8 },
    { s: 'ball', d: [0.1], at: [0.14, 2.42, 0.08], c: SPORE, alpha: 0.6, seg: 8 },
    { s: 'ball', d: [0.09], at: [-0.12, 2.5, -0.06], c: SPORE, alpha: 0.6, seg: 8 },
  ],
};

const TOWER_LEGS: readonly (readonly [number, number])[] = [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]];

const RUTBOTTOM_TOWER: PrefabDef = {
  id: 'rutbottom-starter-tower', name: "Starter's Tower", category: 'prop', uses: ['place'],
  tags: ['tower', 'starter', 'flag', 'timber', 'rutbottom', 'gta', 'dirt', 'marshal'], emoji: [],
  footprint: { r: 2.4, h: 8 },
  about: "Gnome Theft Auto (E14): Starter's Tower, the Rutbottom Dirt Bowl's timber start tower. Six metres of legs and braces, a 3 m cabin with an open front, a ladder at the back, a chequered flag and a blank board under the cabin for the game to write on.",
  examine: [
    'A timber tower on four legs, with a cabin on top and a chequered flag flapping above it, built by someone who was never asked about safety.',
    'Marshal Clary Mudguard says the flag drops when she has counted down, and not a moment before, so keep your eyes on the cabin.',
    'Tip: the ladder is quicker than the stairs and the rail is quicker than the ladder, though only one of them is attached to the tower.',
    'Joke: the cabin roof has been repainted four times, each time in the colour of whichever driver last hit it.',
    'Under the cabin hangs a board with nothing on it yet. Clary says the berm remembers, so the board is kept blank for the time being.',
  ],
  parts: [
    ...TOWER_LEGS.map(([x, z]): Part => ({ s: 'box', d: [0.3, 6.1, 0.3], at: [x, 3.05, z], c: TIMBER })),
    { s: 'box', d: [2.4, 0.14, 0.14], at: [0, 2.0, 1.2], c: TIMBER_DARK },
    { s: 'box', d: [2.4, 0.14, 0.14], at: [0, 2.0, -1.2], c: TIMBER_DARK },
    { s: 'box', d: [0.14, 0.14, 2.4], at: [1.2, 2.0, 0], c: TIMBER_DARK },
    { s: 'box', d: [0.14, 0.14, 2.4], at: [-1.2, 2.0, 0], c: TIMBER_DARK },
    { s: 'box', d: [2.4, 0.14, 0.14], at: [0, 4.2, 1.2], c: TIMBER_DARK },
    { s: 'box', d: [2.4, 0.14, 0.14], at: [0, 4.2, -1.2], c: TIMBER_DARK },
    { s: 'box', d: [0.14, 0.14, 2.4], at: [1.2, 4.2, 0], c: TIMBER_DARK },
    { s: 'box', d: [0.14, 0.14, 2.4], at: [-1.2, 4.2, 0], c: TIMBER_DARK },
    { s: 'box', d: [3.2, 0.2, 3.2], at: [0, 6.1, 0], c: TIMBER },
    { s: 'box', d: [3, 2.6, 0.2], at: [0, 7.4, -1.4], c: TIMBER },
    { s: 'box', d: [0.2, 2.6, 2.6], at: [1.4, 7.4, 0], c: TIMBER },
    { s: 'box', d: [0.2, 2.6, 2.6], at: [-1.4, 7.4, 0], c: TIMBER },
    { s: 'box', d: [3, 0.1, 0.1], at: [0, 7.3, 1.45], c: TIMBER_DARK },
    { s: 'box', d: [1.9, 0.12, 3.4], at: [0.95, 8.95, 0], rot: [0, 0, -12], c: 'iron' },
    { s: 'box', d: [1.9, 0.12, 3.4], at: [-0.95, 8.95, 0], rot: [0, 0, 12], c: 'iron' },
    { s: 'cyl', d: [0.05, 0.05, 2.4], at: [0, 10.35, -0.5], c: TIMBER_DARK, seg: 6 },
    { s: 'box', d: [0.5, 0.3, 0.03], at: [0.27, 10.85, -0.5], c: 'black' },
    { s: 'box', d: [0.5, 0.3, 0.03], at: [0.77, 10.85, -0.5], c: 'white' },
    { s: 'box', d: [0.5, 0.3, 0.03], at: [0.27, 11.15, -0.5], c: 'white' },
    { s: 'box', d: [0.5, 0.3, 0.03], at: [0.77, 11.15, -0.5], c: 'black' },
    ...[0.5, 1.1, 1.7, 2.3, 2.9, 3.5, 4.1, 4.7, 5.3].map((y): Part => ({ s: 'box', d: [0.6, 0.07, 0.07], at: [0, y, -1.45], c: TIMBER_DARK })),
    { s: 'box', d: [0.1, 6.2, 0.1], at: [-0.3, 3.1, -1.45], c: TIMBER_DARK },
    { s: 'box', d: [0.1, 6.2, 0.1], at: [0.3, 3.1, -1.45], c: TIMBER_DARK },
    { s: 'box', d: [2.4, 0.5, 0.08], at: [0, 5.4, 1.7], c: 'chalk' },
  ],
};

const START_CHAIR: readonly number[] = [-0.9, 0.9];

const START_PAVILION: PrefabDef = {
  id: 'capwood-start-pavilion', name: 'Rally Start Pavilion', category: 'prop', uses: ['place'],
  tags: ['pavilion', 'canvas', 'tent', 'start', 'table', 'capwood', 'gta', 'rally'], emoji: [],
  tint: PAVILION_TINT,
  footprint: { r: 3.6, h: 3.2 },
  about: 'Gnome Theft Auto (E14): the Rally Start Pavilion. An open canvas pavilion 6 by 4 m on four poles, with an orange valance, a trestle table with a clock and a rolled map, and two folding chairs. Tint recolours the canvas.',
  examine: [
    'An open canvas pavilion with an orange stripe along its front, held up by four poles and a great deal of optimism.',
    'Gnome saying: the start is the only part of the rally anyone agrees on, which is why the pavilion has the clock.',
    'Tip: the folding chairs fold in the middle of the sitting, so choose one with a seat you have already measured.',
    'Joke: the clock has been five minutes fast since the first race, and the marshal says that is how the race starts early.',
    'The map on the table shows a route through Capwood, drawn by someone who has never been there and is very proud of the lines.',
  ],
  parts: [
    { s: 'box', d: [6.2, 0.08, 4.2], at: [0, 2.84, 0], c: 'tint' },
    { s: 'box', d: [6.2, 0.4, 0.08], at: [0, 2.6, 2.1], c: 'orange' },
    ...[[-2.9, -1.9], [2.9, -1.9], [-2.9, 1.9], [2.9, 1.9]].map(([x, z]): Part => ({ s: 'cyl', d: [0.06, 0.06, 2.85], at: [x, 1.425, z], c: TIMBER_DARK, seg: 6 })),
    { s: 'box', d: [1.4, 0.08, 0.7], at: [0, 0.9, -0.8], c: TIMBER },
    ...[-0.6, 0.6].flatMap((x): Part[] => [-0.25, 0.25].map((dz): Part => ({ s: 'box', d: [0.07, 0.9, 0.07], at: [x, 0.45, -0.8 + dz], c: TIMBER_DARK }))),
    { s: 'box', d: [0.25, 0.25, 0.12], at: [0.4, 1.0, -0.8], c: 'black' },
    { s: 'cyl', d: [0.1, 0.1, 0.02], rot: [90, 0, 0], at: [0.4, 1.06, -0.72], c: 'chalk', seg: 12 },
    { s: 'cyl', d: [0.05, 0.05, 0.5], rot: [0, 0, 90], at: [-0.4, 0.99, -0.8], c: 'paper', seg: 8 },
    ...START_CHAIR.flatMap((x): Part[] => [
      { s: 'box', d: [0.5, 0.05, 0.5], at: [x, 0.45, 0.3], c: TIMBER },
      { s: 'box', d: [0.5, 0.5, 0.05], at: [x, 0.72, 0.55], c: TIMBER },
      ...[[-0.2, 0.2], [0.2, 0.2], [-0.2, -0.2], [0.2, -0.2]].map(([dx, dz]): Part => ({ s: 'box', d: [0.05, 0.45, 0.05], at: [x + dx, 0.225, 0.3 + dz], c: TIMBER_DARK })),
    ]),
  ],
};

const FORD_SIGN: PrefabDef = {
  id: 'capwood-ford-sign', name: 'Ford Sign', category: 'prop', uses: ['place'],
  tags: ['sign', 'ford', 'water', 'warning', 'depth', 'capwood', 'gta', 'post'], emoji: [],
  footprint: { r: 0.4, h: 2.2 },
  about: 'Gnome Theft Auto (E14): the Ford Sign. A 1.8 m post with a white triangular warning sign with a red border, showing a mower in wavy water, and a striped depth gauge (0 to 1 m) beside it.',
  examine: [
    'A white triangle with a red border, showing a small mower going through blue waves, which is more honest than most road signs.',
    'Gnome saying: the cap-water is thick and slow, and it will never flood an engine, though it will hold one very firmly.',
    'Tip: read the depth gauge before you splash. A gauge stripe is about a boot, and the second stripe is about a boot and a bucket.',
    'Joke: the sign has been stolen four times, and each time the thief returned it, having found the water deeper than the sign said.',
    'Cap-water is the colour of weak tea and never runs cold, which is why the Capwood gnomes say the fords are older than the forest.',
  ],
  parts: [
    { s: 'cyl', d: [0.05, 0.05, 1.8], at: [0, 0.9, 0], c: TIMBER_DARK, seg: 6 },
    { s: 'cyl', d: [0.55, 0.55, 0.04], rot: [-90, 0, 0], at: [0, 1.5, 0.05], c: 'red', seg: 3 },
    { s: 'cyl', d: [0.44, 0.44, 0.03], rot: [-90, 0, 0], at: [0, 1.5, 0.085], c: 'white', seg: 3 },
    { s: 'box', d: [0.6, 0.1, 0.03], at: [0, 1.34, 0.1], c: 'water' },
    { s: 'box', d: [0.3, 0.12, 0.2], at: [0, 1.5, 0.22], c: 'red' },
    { s: 'box', d: [0.06, 1.1, 0.06], at: [0.4, 0.55, 0], c: 'black' },
    ...[0, 1, 2, 3, 4].map((i): Part => ({ s: 'box', d: [0.16, 0.18, 0.02], at: [0.4, 0.09 + 0.2 * i, 0.04], c: i % 2 === 0 ? 'white' : 'red' })),
  ],
};

const STAGE_FLAG: PrefabDef = {
  id: 'capwood-stage-flag', name: 'Stage Flag', category: 'prop', uses: ['place'],
  tags: ['flag', 'stage', 'pole', 'feather', 'number', 'capwood', 'gta', 'rally'], emoji: [],
  tint: FLAG_TINT,
  footprint: { r: 0.3, h: 3.2 },
  about: 'Gnome Theft Auto (E14): the Stage Flag. A 3 m pole with a tall feather flag and a white number board at the base. Tint recolours the flag.',
  examine: [
    'A tall pole with a long orange flag that tapers to a point, like a feather that has been told to stand up straight.',
    'Gnome saying: a stage flag shows where the stage is, and a stage shows where the gnomes are going to be embarrassed.',
    'Tip: the number board at the base is for the drivers to read, so do not stand in front of it while the cars are coming past.',
    'Joke: the flag has been sewn from three old marquees, and the seams are still arguing about which of them was the best.',
    'The feather on top is said to belong to a bird the Capwood gnomes have never seen, which is also what they say about most birds.',
  ],
  parts: [
    { s: 'cyl', d: [0.03, 0.03, 3], at: [0, 1.5, 0], c: TIMBER_DARK, seg: 6 },
    { s: 'wedge', d: [0.04, 1.4, 0.45], rot: [0, 180, 0], at: [0, 2.3, 0.25], c: 'tint' },
    { s: 'box', d: [0.05, 0.55, 0.05], at: [-0.22, 0.275, 0.12], c: TIMBER_DARK },
    { s: 'box', d: [0.05, 0.55, 0.05], at: [0.22, 0.275, 0.12], c: TIMBER_DARK },
    { s: 'box', d: [0.5, 0.4, 0.05], at: [0, 0.7, 0.12], c: 'white' },
  ],
};

export const GTA_DIRT_RALLY: readonly PrefabDef[] = [
  CAPWOOD_TALL,
  CAPWOOD_SQUAT,
  CAPWOOD_CLUSTER,
  CAPWOOD_PUFFBALL,
  RUTBOTTOM_TOWER,
  START_PAVILION,
  FORD_SIGN,
  STAGE_FLAG,
];
