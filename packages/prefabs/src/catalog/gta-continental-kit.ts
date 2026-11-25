// Gnome Theft Auto, E28 world II: the kit for Pardonlin (the continental riverside town) and the Unmown (the preserve).
// Traffic podium, stop-go paddle, the Wicket gate and customs hut, the roundabout planter, a lost suitcase and two signs.
import type { PrefabDef } from '../types';

export const GTA_CONTINENTAL_KIT: readonly PrefabDef[] = [
  {
    id: 'traffic-podium', name: 'Traffic Podium', category: 'prop', uses: ['place'],
    tags: ['traffic', 'warden', 'podium', 'drum', 'stripes', 'pardonlin', 'gta', 'roundabout', 'town', 'continental'], emoji: [],
    footprint: { r: 0.8, h: 0.6 },
    about: 'Gnome Theft Auto: a traffic warden\'s round drum podium in Pardonlin. Life-size metres, front on +z. A stone step, a red drum with two white stripes and a white cap.',
    examine: [
      'A round drum of red paint with two white stripes, standing on a grey step, with a flat white top for a warden to stand on.',
      'Saying: the warden who stands on the drum is always right, and always a little higher than everyone else.',
      'Tip: the step is there so you can climb up. The drum is not there so you can climb on it.',
      'Joke: the podium is painted by a committee, which is why the stripes never quite agree on their width.',
      'A small brass plaque on the side says ORDER, but somebody has scratched a second word under it and then given up.',
    ],
    parts: [
      { s: 'cyl', d: [1.3, 1.3, 0.1], at: [0, 0.05, 0], c: 'stone', seg: 12 },                 // step
      { s: 'cyl', d: [0.7, 0.7, 0.6], at: [0, 0.4, 0], c: 'red', seg: 12 },                     // drum
      { s: 'cyl', d: [0.71, 0.71, 0.1], at: [0, 0.25, 0], c: 'white', seg: 12 },                // stripes
      { s: 'cyl', d: [0.71, 0.71, 0.1], at: [0, 0.55, 0], c: 'white', seg: 12 },
      { s: 'cyl', d: [0.75, 0.75, 0.05], at: [0, 0.725, 0], c: 'white', seg: 12 },              // cap
      { s: 'box', d: [0.12, 0.08, 0.02], at: [0, 0.4, 0.71], c: 'brass' },                     // plaque
    ],
  },
  {
    id: 'stop-go-paddle', name: 'Stop-Go Paddle', category: 'tool', uses: ['hold'],
    tags: ['paddle', 'stop', 'go', 'warden', 'sign', 'stick', 'traffic', 'hand', 'pardonlin'], emoji: [],
    about: 'A traffic warden\'s round stop-go paddle on a stick: red on one side, green on the other, with a white rim. Held low, grip at the stick.',
    examine: [
      'A round paddle on a short wooden stick, red on one face and green on the other, with a white rim around the edge.',
      'Saying: red means stop, green means go, and the warden decides which face is which, depending on the day.',
      'Tip: hold it by the stick, never by the face. The face is the part that gets argued with.',
      'Joke: the paddle has only two sides, and the Pardonlin wardens have never once agreed on which one is the front.',
      'Turn it round to show the other colour. The gnomes of the Hatwheel use this trick to make a jam go faster.',
    ],
    parts: [
      { s: 'cyl', d: [0.025, 0.025, 0.7], at: [0, 0.35, 0], c: 'wood', seg: 6 },                // stick
      { s: 'cyl', d: [0.18, 0.18, 0.02], at: [0, 0.8, 0.01], rot: [90, 0, 0], c: 'red', seg: 12 },   // red face
      { s: 'cyl', d: [0.18, 0.18, 0.02], at: [0, 0.8, -0.01], rot: [90, 0, 0], c: 'green', seg: 12 }, // green face
      { s: 'ring', d: [0.18, 0.015], at: [0, 0.8, 0], c: 'white', seg: 12 },                    // white rim
    ],
    grip: [0, 0.15, 0],
  },
  {
    id: 'wicket-gate', name: 'The Wicket', category: 'prop', uses: ['place'],
    tags: ['wicket', 'gate', 'border', 'iron', 'posts', 'finial', 'pardonlin', 'gta', 'fence', 'continental'], emoji: [],
    footprint: { r: 3.5, h: 3.2 },
    about: 'Gnome Theft Auto: the Wicket, the iron gate between Trellisdown and Pardonlin. Life-size metres, front on +z. Two tall stone posts with brass ball finials and one wrought-iron leaf swung back, 6 m between posts.',
    examine: [
      'Two tall stone posts with brass balls on top, and one iron gate leaf swung back on its hinge as if it has been waiting.',
      'Saying: the Wicket opens for anyone with a ticket, and a ticket is anything you can convince the gatekeeper is one.',
      'Tip: the leaf swings back by itself in a breeze. Do not lean on it to see how far it goes; it always goes further.',
      'Joke: the gate has no lock, only a very strict expression, which works better than most locks.',
      'The scroll in the middle of the leaf is meant to be a fern. The gnomes who made it were not sure what ferns look like.',
    ],
    parts: [
      { s: 'box', d: [0.6, 2.8, 0.6], at: [3.2, 1.4, 0], c: 'stone' },                          // posts
      { s: 'box', d: [0.6, 2.8, 0.6], at: [-3.2, 1.4, 0], c: 'stone' },
      { s: 'ball', d: [0.22], at: [3.2, 2.92, 0], c: 'brass', seg: 8 },                         // finials
      { s: 'ball', d: [0.22], at: [-3.2, 2.92, 0], c: 'brass', seg: 8 },
      { s: 'box', d: [2.8, 0.06, 0.06], at: [-2.5, 2.7, -1.212], rot: [0, 60, 0], c: 'iron-dark' }, // leaf top rail
      { s: 'box', d: [2.8, 0.06, 0.06], at: [-2.5, 0.3, -1.212], rot: [0, 60, 0], c: 'iron-dark' }, // leaf bottom rail
      { s: 'box', d: [2.8, 0.04, 0.04], at: [-2.5, 1.5, -1.212], rot: [0, 60, 0], c: 'iron-dark' }, // leaf middle bar
      { s: 'cyl', d: [0.03, 0.03, 2.6], at: [-3.15, 1.5, -0.087], c: 'iron-dark', seg: 6 },      // leaf uprights
      { s: 'cyl', d: [0.03, 0.03, 2.6], at: [-2.75, 1.5, -0.779], c: 'iron-dark', seg: 6 },
      { s: 'cyl', d: [0.03, 0.03, 2.6], at: [-2.35, 1.5, -1.472], c: 'iron-dark', seg: 6 },
      { s: 'cyl', d: [0.03, 0.03, 2.6], at: [-1.95, 1.5, -2.165], c: 'iron-dark', seg: 6 },
      { s: 'ring', d: [0.25, 0.02], at: [-2.5, 1.5, -1.212], rot: [0, 60, 0], c: 'brass', seg: 10 }, // scroll
    ],
  },
  {
    id: 'customs-hut', name: 'Customs Hut', category: 'prop', uses: ['place'],
    tags: ['customs', 'hut', 'booth', 'sentry', 'barrier', 'boom', 'stripes', 'lamp', 'pardonlin', 'gta', 'continental'], emoji: [],
    footprint: { r: 1.6, h: 2.9 },
    about: 'Gnome Theft Auto: a striped customs booth at the Wicket, life-size, front on +z. A white box with red stripes and a red roof, a window, a lamp on top and a red-and-white boom barrier raised beside it.',
    examine: [
      'A small booth painted white with red stripes, a red roof, one little window and a lamp on a post above the door.',
      'Saying: a customs officer will search your bag for anything interesting, and then keep it for the bag.',
      'Tip: the barrier only goes up for a gnome holding a stamp. Hold the stamp up at the window so the officer can see it.',
      'Joke: the booth has one window, and the officer has been asked to look through it at least twice a day.',
      'The lamp is lit whenever the booth is busy, which is never, so the gnomes who wait by the barrier stand in the dark.',
    ],
    parts: [
      { s: 'box', d: [2, 2.4, 2], at: [0, 1.2, 0], c: 'white' },                            // body
      { s: 'box', d: [2.3, 0.2, 2.3], at: [0, 2.5, 0], c: 'red' },                           // roof
      { s: 'box', d: [0.25, 2.4, 0.03], at: [-0.6, 1.2, 1.01], c: 'red' },                   // front stripes
      { s: 'box', d: [0.25, 2.4, 0.03], at: [0.6, 1.2, 1.01], c: 'red' },
      { s: 'box', d: [0.8, 0.6, 0.04], at: [0, 1.5, 1.01], c: 'glass' },                     // window
      { s: 'cyl', d: [0.03, 0.03, 0.12], at: [0, 2.66, 0], c: 'iron', seg: 6 },              // lamp post
      { s: 'ball', d: [0.1], at: [0, 2.8, 0], c: 'yellow', glow: true, seg: 8 },             // lamp
      { s: 'cyl', d: [0.07, 0.07, 1.2], at: [2.2, 0.6, 1.2], c: 'white', seg: 8 },           // barrier post
      { s: 'box', d: [1.0, 0.12, 0.12], at: [2.7, 1.1, 1.2], c: 'red' },                      // boom, red half
      { s: 'box', d: [1.0, 0.12, 0.12], at: [3.7, 1.1, 1.2], c: 'white' },                    // boom, white half
    ],
  },
  {
    id: 'roundabout-planter', name: 'Roundabout Planter', category: 'prop', uses: ['place'],
    tags: ['roundabout', 'planter', 'flowers', 'flowerbed', 'circle', 'box', 'kerb', 'garden', 'pardonlin', 'gta', 'town'], emoji: [],
    footprint: { r: 1, h: 0.6 },
    about: 'Gnome Theft Auto: a round raised flower bed for the middle of a roundabout. Life-size metres at radius 1, scaled by the level. A stone kerb ring, dark soil, a ring of flowers and a clipped box ball in the middle.',
    examine: [
      'A round stone bed full of dark soil, with a ring of bright flowers round the edge and a neat clipped ball of box in the middle.',
      'Saying: the flowers in the roundabout are planted by the council, watered by the rain and claimed by the first driver who stops.',
      'Tip: do not sit on the kerb. It is the only thing in Pardonlin that is harder than the drivers.',
      'Joke: the box ball has been clipped so often that it is now more of a thought than a bush.',
      'Each spring the flowers are arranged to spell a word. The word changes with the mayor, and nobody has yet been able to read it.',
    ],
    parts: [
      { s: 'cyl', d: [1.0, 1.0, 0.3], at: [0, 0.15, 0], c: 'stone', seg: 16 },                 // kerb
      { s: 'ring', d: [1.0, 0.03], at: [0, 0.3, 0], rot: [90, 0, 0], c: 'chalk', seg: 16 },     // kerb cap
      { s: 'cyl', d: [0.88, 0.88, 0.05], at: [0, 0.3, 0], c: 'dirt', seg: 16 },                // soil
      { s: 'ball', d: [0.07], at: [0.6, 0.42, 0], c: 'red', seg: 6 },                          // flowers
      { s: 'ball', d: [0.07], at: [0.3, 0.42, 0.52], c: 'yellow', seg: 6 },
      { s: 'ball', d: [0.07], at: [-0.3, 0.42, 0.52], c: 'petal', seg: 6 },
      { s: 'ball', d: [0.07], at: [-0.6, 0.42, 0], c: 'orange', seg: 6 },
      { s: 'ball', d: [0.07], at: [-0.3, 0.42, -0.52], c: 'purple', seg: 6 },
      { s: 'ball', d: [0.07], at: [0.3, 0.42, -0.52], c: 'pink', seg: 6 },
      { s: 'ball', d: [0.25], at: [0, 0.52, 0], scale: [1, 0.8, 1], c: 'leaf-dark', seg: 10 }, // box ball
    ],
  },
  {
    id: 'lost-suitcase', name: 'Lost Suitcase', category: 'prop', uses: ['place'],
    tags: ['suitcase', 'case', 'luggage', 'lost', 'map', 'travel', 'leather', 'pardonlin', 'gta', 'station'], emoji: [],
    footprint: { r: 0.5, h: 0.4 },
    about: 'Gnome Theft Auto: a battered leather travel case, half open, with a folded map sticking out of the front. Life-size metres, front on +z, about 0.6 m wide.',
    examine: [
      'A battered leather case, half open, with a folded paper map pushed out of the front as though someone was in a hurry.',
      'Saying: a case left on the platform belongs to whoever is still waiting for the train, which is nobody.',
      'Tip: lift the lid slowly. The hinge has opinions about how far it should go, and so does the map.',
      'Joke: the label says Return, which is the only word on it nobody has yet believed.',
      'Inside there is one spare sock, a tin of sardines and a second map that is exactly the same as the first.',
    ],
    parts: [
      { s: 'box', d: [0.6, 0.22, 0.4], at: [0, 0.11, 0], c: 'leather' },                            // case base
      { s: 'box', d: [0.6, 0.03, 0.4], at: [0, 0.373, -0.071], rot: [-50, 0, 0], c: 'leather-dark' }, // lid, half open
      { s: 'box', d: [0.04, 0.22, 0.02], at: [-0.18, 0.11, 0.205], c: 'leather-dark' },          // straps
      { s: 'box', d: [0.04, 0.22, 0.02], at: [0.18, 0.11, 0.205], c: 'leather-dark' },
      { s: 'box', d: [0.36, 0.02, 0.22], at: [0.1, 0.2, 0.2], c: 'paper' },                       // folded map
    ],
  },
  {
    id: 'wicket-sign', name: "Pardonlin's Welcome", category: 'prop', uses: ['place'],
    tags: ['sign', 'welcome', 'board', 'hat', 'stamp', 'wicket', 'pardonlin', 'gta', 'town', 'continental'], emoji: [],
    tint: 'parchment', trim: 'wood-dark',
    footprint: { r: 1.2, h: 2.1 },
    about: 'Gnome Theft Auto: the Welcome board at the Wicket. Life-size metres, front on +z. A parchment board (tint) on two wooden posts (trim) with a painted black hat and a big red stamp mark.',
    examine: [
      'A parchment board on two wooden posts, with a black painted hat on the left and a big red stamp mark on the right.',
      'Saying: whoever reads the board and smiles is allowed through, and whoever smiles at the hat is allowed twice.',
      'Tip: the stamp mark is wet. Do not press your thumb on it, unless you wish to be officially welcome.',
      'Joke: the hat is painted on because the real one was taken by the last visitor to read the sign.',
      'Pardonlin has a motto, written in small letters along the bottom, and the letters have been worn away by a great many polite gnomes.',
    ],
    parts: [
      { s: 'cyl', d: [0.06, 0.06, 1.9], at: [-0.9, 0.95, -0.15], c: 'trim', seg: 6 },        // posts
      { s: 'cyl', d: [0.06, 0.06, 1.9], at: [0.9, 0.95, -0.15], c: 'trim', seg: 6 },
      { s: 'box', d: [2.2, 0.9, 0.12], at: [0, 1.6, 0], c: 'tint' },                           // board
      { s: 'cyl', d: [0.18, 0.2, 0.22], at: [-0.5, 1.72, 0.07], c: 'black', seg: 10 },        // painted hat crown
      { s: 'cyl', d: [0.32, 0.32, 0.03], at: [-0.5, 1.6, 0.07], c: 'black', seg: 12 },        // painted hat brim
      { s: 'ring', d: [0.22, 0.03], at: [0.5, 1.6, 0.07], c: 'red', seg: 12 },                // stamp mark
    ],
  },
  {
    id: 'unmown-sign', name: 'The Unmown', category: 'prop', uses: ['place'],
    tags: ['sign', 'board', 'preserve', 'mower', 'flower', 'wild', 'unmown', 'rustic', 'gta', 'nature'], emoji: [],
    tint: 'wood-light', trim: 'wood',
    footprint: { r: 0.6, h: 1.7 },
    about: 'Gnome Theft Auto: the rustic sign at the edge of the Unmown. Life-size metres, front on +z. A wooden board (tint) on one post, with a crossed-out green mower and a painted flower.',
    examine: [
      'A rough wooden board on a single post, with a mower painted on it and a red cross drawn firmly over the top.',
      'Saying: the Unmown is not to be mown, and the mower is not to be asked why, as it will explain itself at length.',
      'Tip: the flower is the only thing painted on the sign that is still growing. Water it and the Unmown will take the hint.',
      'Joke: the sign was painted by someone who had never seen a mower, and was rather pleased with the cross.',
      'Below the board a smaller sign reads keep off the grass, which is a little late, since you are standing in it.',
    ],
    parts: [
      { s: 'cyl', d: [0.07, 0.07, 1.6], at: [0, 0.8, -0.1], c: 'trim', seg: 8 },                // post
      { s: 'box', d: [1.2, 0.5, 0.06], at: [0, 1.4, 0], c: 'tint' },                          // board
      { s: 'box', d: [0.36, 0.1, 0.02], at: [-0.2, 1.36, 0.04], c: 'green' },                 // mower body
      { s: 'ring', d: [0.05, 0.015], at: [-0.1, 1.3, 0.05], c: 'black', seg: 8 },             // mower wheels
      { s: 'ring', d: [0.05, 0.015], at: [-0.3, 1.3, 0.05], c: 'black', seg: 8 },
      { s: 'box', d: [0.66, 0.04, 0.02], at: [-0.2, 1.4, 0.06], rot: [0, 0, 45], c: 'red' },  // crossed out
      { s: 'box', d: [0.66, 0.04, 0.02], at: [-0.2, 1.4, 0.06], rot: [0, 0, -45], c: 'red' },
      { s: 'ball', d: [0.05], at: [0.4, 1.45, 0.05], c: 'petal', seg: 6 },                    // painted flower
      { s: 'ball', d: [0.02], at: [0.4, 1.35, 0.05], c: 'leaf', seg: 6 },
    ],
  },
];
