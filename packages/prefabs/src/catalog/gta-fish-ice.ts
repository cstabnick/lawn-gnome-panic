// Gnome Theft Auto ice fishing (E12): the cold-water fish of Pail Pond and the Fells ponds, landed through a hole in the
// ice (games/gnome-theft-auto src/fishing/species.ts, waters ['ice']). Modelled 1 unit long, nose toward +z, centred.
// Shared fish convention: 1.0 long along z, nose at z = +0.5, tail at z = -0.5, x = 0 is the middle. The body is an
// ellipsoid (ball scaled [width, height, 1]) whose underside sits at y = 0, so every fish stands on the ground for the
// library test; the game places a fish by its own rule and scales it by length.
import type { PrefabDef } from '../types';

export const GTA_FISH_ICE: readonly PrefabDef[] = [
  {
    id: 'fish-pail-perch', name: 'Pail Perch', category: 'prop', uses: ['place'],
    tags: ['fish', 'perch', 'pail', 'tin', 'grey', 'ice', 'gta', 'fishing'], emoji: [],
    about: 'A grey-green pail perch, 1 long, with tin-bright bands along its flanks and grey fins.',
    examine: [
      'A grey-green perch with bands of bright tin along its flanks, as if it was made from a pail and never got over it.',
      'Pond rhyme: round the pail, round the pond, round the perch, and back to the pail.',
      'Darts about under the ice, so keep the line short and the hole clear of slush.',
      'It thinks the world is round and tin, and nobody has yet had the heart to tell it otherwise.',
      'Measured, carded and let go back into its pail with a small, offended wiggle.',
    ],
    parts: [
      { s: 'ball', d: [0.5], at: [0, 0.14, 0], scale: [0.22, 0.28, 1], c: 0x6f7d72, seg: 7 },
      { s: 'box', d: [0.23, 0.03, 0.8], at: [0, 0.14, 0], c: 0xc4cad0 },
      { s: 'box', d: [0.2, 0.025, 0.7], at: [0, 0.26, 0], c: 0xb8c0c8 },
      { s: 'box', d: [0.01, 0.1, 0.22], at: [0, 0.3, 0.02], c: 0x6f7d72 },
      { s: 'box', d: [0.02, 0.24, 0.12], at: [0, 0.14, -0.44], c: 0x6f7d72 },
      { s: 'box', d: [0.09, 0.012, 0.04], at: [0.1, 0.1, 0.18], c: 0xd6dde3, mirror: true },
      { s: 'ball', d: [0.025], at: [0.08, 0.17, 0.36], c: 'black', seg: 5, mirror: true },
    ],
  },
  {
    id: 'fish-woolly-minnow', name: 'Woolly Minnow', category: 'prop', uses: ['place'],
    tags: ['fish', 'minnow', 'woolly', 'fluffy', 'grey', 'ice', 'gta', 'fishing'], emoji: [],
    about: 'A tiny fluffy grey minnow, 1 long in the model, with woolly fins and a knitted look.',
    examine: [
      'A slim grey minnow in a fluffy coat of fin, knitted on by nobody and kept on out of pride.',
      'Sock rhyme: one for the toe, one for the heel, and one for the minnow that swam off with the wool.',
      'Light as a sock and quick to tire, so reel it gently and let it wander up the hole.',
      'It will not discuss the jumper, and it will not be asked again.',
      'Carded on a small card, measured twice, and let go before it catches a chill.',
    ],
    parts: [
      { s: 'ball', d: [0.5], at: [0, 0.08, 0], scale: [0.13, 0.13, 1], c: 0x9ea6ad, seg: 7 },
      { s: 'box', d: [0.14, 0.14, 0.12], at: [0, 0.1, -0.4], c: 0xb7bec4 },
      { s: 'box', d: [0.22, 0.02, 0.1], at: [0, 0.2, -0.36], c: 0xd0d6db },
      { s: 'box', d: [0.02, 0.1, 0.16], at: [0, 0.16, 0.02], c: 0xb7bec4 },
      { s: 'box', d: [0.12, 0.012, 0.1], at: [0.07, 0.07, 0.12], c: 0xd0d6db, mirror: true },
      { s: 'ball', d: [0.02], at: [0.04, 0.1, 0.3], c: 'black', seg: 5, mirror: true },
    ],
  },
  {
    id: 'fish-lantern-burbot', name: 'Lantern Burbot', category: 'prop', uses: ['place'],
    tags: ['fish', 'burbot', 'lantern', 'glow', 'brown', 'barbel', 'ice', 'gta', 'fishing'], emoji: [],
    about: 'A long brown burbot, 1 long, with a pale glowing barbel on its chin like a lantern.',
    examine: [
      'A long brown burbot with a single pale barbel hanging from its chin, glowing faintly like a lantern in a cellar.',
      'Lantern saying: the burbot carries its own light, and sulks when it is not admired for it.',
      'Sulks in the dark under the ice, so give it a long while and do not rush the reel.',
      'Gnomes say a burbot lit from within is the only fish that can read a card upside down.',
      'Measured by lantern-light, carded and let go, and it glows a little brighter with the praise.',
    ],
    parts: [
      { s: 'ball', d: [0.5], at: [0, 0.12, 0], scale: [0.18, 0.2, 1], c: 0x6b4a2b, seg: 7 },
      { s: 'box', d: [0.08, 0.06, 0.7], at: [0, 0.03, 0], c: 0x8f6a3c },
      { s: 'box', d: [0.02, 0.18, 0.14], at: [0, 0.12, -0.44], c: 0x6b4a2b },
      { s: 'box', d: [0.01, 0.06, 0.2], at: [0, 0.2, 0.02], c: 0x4f3620 },
      { s: 'box', d: [0.01, 0.01, 0.16], at: [0, 0.04, 0.44], c: 0xe9e2c4, glow: true },
      { s: 'ball', d: [0.03], at: [0, 0.0, 0.4], c: 0xe9e2c4, seg: 5, glow: true },
      { s: 'ball', d: [0.025], at: [0.08, 0.14, 0.3], c: 'black', seg: 5, mirror: true },
    ],
  },
  {
    id: 'fish-frostjaw-char', name: 'Frostjaw Char', category: 'prop', uses: ['place'],
    tags: ['fish', 'char', 'frostjaw', 'steel', 'blue', 'frost', 'ice', 'gta', 'fishing'], emoji: [],
    about: 'A steel-blue char, 1 long, with a frost-white jaw and a hard, silver-edged look.',
    examine: [
      'A steel-blue char with a jaw as white as frost on a windowpane and a silver edge to every fin.',
      'Fells rhyme: the char bites with frost, and the frost bites back, and the gnome sits down in the snow.',
      'Runs hard for the hole on the first pull, so keep the tip high and the clip gentle.',
      'It leaves a small snowman on the bank as a receipt, which the gnomes count as a fair trade.',
      'Carded in the snow, let go in the snow, and never once asked to be cold.',
    ],
    parts: [
      { s: 'ball', d: [0.5], at: [0, 0.12, 0], scale: [0.2, 0.23, 1], c: 0x4a6f8f, seg: 7 },
      { s: 'box', d: [0.12, 0.05, 0.6], at: [0, 0.03, 0], c: 0xb9d6e8 },
      { s: 'box', d: [0.02, 0.2, 0.14], at: [0, 0.12, -0.44], c: 0x4a6f8f },
      { s: 'box', d: [0.01, 0.07, 0.22], at: [0, 0.22, 0.04], c: 0x3a5a76 },
      { s: 'box', d: [0.12, 0.05, 0.14], at: [0, 0.04, 0.32], c: 'white' },
      { s: 'box', d: [0.08, 0.01, 0.04], at: [0.1, 0.09, 0.18], c: 0xc9e3f2, mirror: true },
      { s: 'ball', d: [0.025], at: [0.08, 0.14, 0.34], c: 'black', seg: 5, mirror: true },
    ],
  },
];
