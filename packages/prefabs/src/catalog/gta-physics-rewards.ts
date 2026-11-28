// Gnome Theft Auto: the physics rewards (E27). The Skipping-Stone Pendant (neck) and the Shrub Disguise (head).
// Ids are a contract with the achievement catalog: do not rename them.
import type { PrefabDef } from '../types';

export const GTA_PHYSICS_REWARDS: PrefabDef[] = [
  // ---- Skipping-Stone Pendant: a flat pebble on a cord, for the gnome who skimmed the loch ----------------------------
  {
    id: 'skipping-stone-pendant', name: 'Skipping-Stone Pendant', category: 'armor', uses: ['wear-neck'],
    wear: { at: [0, -0.04, 0.1] },
    tags: ['pendant', 'pebble', 'stone', 'skip', 'skipping', 'water', 'cord', 'neck', 'loch', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: the Skipping-Stone Pendant. A flat, smooth grey pebble (stone) on a thin brown cord loop (leather), with a small blue water-drop bead (water) beside it. Worn on the neck, about 0.12 across.',
    examine: [
      'A flat grey pebble, worn smooth by the water, strung on a cord so it hangs just below the collar.',
      'Saying: a stone skipped seven times is a stone that has been loved. Gnomes will tell you it was eleven, every time.',
      'Tip: keep it dry on the way in. A wet pebble is a heavy pebble, and it pulls the cord down into the collar.',
      'Joke: the bead beside it is not a drop of the loch. It is a drop of the loch that has been told to stay put.',
      'Someone has scratched a small number into the pebble. The number is the one that was not quite enough.',
    ],
    parts: [
      { s: 'ring', d: [0.06, 0.006], at: [0, 0.06, 0.04], c: 'leather', seg: 10, name: 'cord' },
      { s: 'ball', d: [0.04], at: [0, 0.02, 0.06], scale: [1, 0.4, 1], c: 'stone', seg: 8, name: 'pebble' },
      { s: 'ball', d: [0.012], at: [0.045, 0.06, 0.05], c: 'water', seg: 6, name: 'bead' },
    ],
  },

  // ---- Shrub Disguise: a leafy bush worn on the head, for the gnome who flattened the flower beds ----------------------
  {
    id: 'shrub-disguise', name: 'Shrub Disguise', category: 'armor', uses: ['wear-head'],
    tags: ['bush', 'shrub', 'disguise', 'hat', 'head', 'leaf', 'rose', 'twig', 'camouflage', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: the Shrub Disguise. Four overlapping leafy balls (leaf, moss, grass) worn on the head like a round bush, with one pink rose (pink) and a twig (wood-dark) sticking out. Plain green, about 0.35 across.',
    examine: [
      'A round leafy bush, four clumps of green pinned together, with a pink rose stuck in the front as a finishing touch.',
      'Saying: a bush that moves is a bush that has somewhere to be. Gnomes wearing these have been seen walking very slowly, on purpose.',
      'Tip: water the leaves before you put it on. Dry leaves rattle, and a rattling shrub gets looked at twice.',
      'Joke: the rose is real. It was in the flower bed. The flower bed is now a patch of bare soil, and no one has asked why.',
      'A twig has been pushed into the side for balance. Nobody remembers putting it there, and it has grown a leaf.',
    ],
    parts: [
      // Sits on the ground like the other hats (the lowest clump touches y 0).
      { s: 'ball', d: [0.11], at: [0, 0.11, 0], scale: [1, 0.8, 1], c: 'leaf', seg: 8, name: 'clump-a' },
      { s: 'ball', d: [0.095], at: [0.09, 0.1, 0.03], c: 'moss', seg: 8, name: 'clump-b' },
      { s: 'ball', d: [0.09], at: [-0.085, 0.09, -0.02], c: 'leaf-dark', seg: 8, name: 'clump-c' },
      { s: 'ball', d: [0.08], at: [0, 0.18, -0.04], c: 'grass', seg: 8, name: 'clump-d' },
      { s: 'ball', d: [0.035], at: [0.05, 0.22, 0.1], c: 'pink', seg: 6, name: 'rose' },
      { s: 'cyl', d: [0.006, 0.006, 0.12], at: [-0.06, 0.25, 0.06], rot: [0, 0, -40], c: 'wood-dark', seg: 6, name: 'twig' },
    ],
  },
];
