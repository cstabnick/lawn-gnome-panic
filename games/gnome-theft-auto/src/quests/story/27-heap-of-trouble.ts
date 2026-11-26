// Story row 27 "Heap of Trouble" (docs/design/gnome-theft-auto/story-outline.md): Ash-Shovel Ernie, stoker at the Compost Heap,
// has watched the welded plates leave the furnace yard at night in four directions. Tansy wants to know where. The player
// tails one plate van north up the Ring Road, cracks its escort at the last lay-by before the snow line, and reads the bill
// of lading in the lead van: a cutting deck, a sealed crate, a place name, never the whole route. The rest of the convoy
// goes on north over the snow line. Plants act III's four parts; answers none. Scenes: cutscene/scenes/story/m27-heap-of-trouble.ts.
// Fallback used: the outline says the player tails in a Zero-Turn; the engine gives the player whatever ride is near (or a
// loaner ride-on), and nothing in the objective kinds forces a vehicle, so the quest does not name one.
import type { GnomeLook } from '@lawn/gnome';
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const HOA_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xc9b99b };
const VAN_DRIVER_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xc9b99b, beard: 0x6b6b6b };

/** The last lay-by before the snow line, on the road north (stage `snow-line-lay-by`). */
const LAY_BY: [number, number] = [22, -1000];

const HEAP_OF_TROUBLE: QuestDef = {
  id: 'm27-heap-of-trouble',
  title: 'Heap of Trouble',
  giver: 'compost-heap',
  prereq: 'm26-the-knot-hole',
  chapter: 2,
  rewardAcorns: 350,
  radioBulletin: 'm27-heap-of-trouble',
  cutscene: { kind: 'script', script: 'm27-heap-of-trouble-intro' },
  outro: { kind: 'script', script: 'm27-heap-of-trouble-outro' },
  // The tail is covert: nobody is hunting the player until the escort at the lay-by notices them.
  hoaSteps: { 0: 'off' },
  objectives: [
    {
      kind: 'chase-follow',
      text: 'Tail the plate van north up the Ring Road. Do not get close',
      leaderName: 'Plate van',
      leaderKind: 'hoa-van',
      leaderLook: VAN_DRIVER_LOOK,
      // Out of the forge track, west to the Ring Road, round the north-west leg, then up the north road to the last lay-by.
      waypoints: [
        [-250, -22], [-320, 20], [-400, 0], [-340, -190], [-260, -320], [-130, -390], [0, -400], [-40, -470],
        [-20, -570], [-10, -660], [30, -760], [20, -870], [10, -960], LAY_BY,
      ],
      speed: 12,
      maxDist: 70,
      hint: 'The plate van, on the Ring Road',
    },
    {
      kind: 'crack',
      text: 'Crack the two HOA escorts at the last lay-by before the snow line',
      targets: [
        { id: 'plates-escort-1', name: 'HOA Escort Rivet', near: [16, -1002], hint: 'The snow-line lay-by', look: HOA_LOOK },
        { id: 'plates-escort-2', name: 'HOA Escort Bolt', near: [27, -996], hint: 'The snow-line lay-by', look: HOA_LOOK },
      ],
    },
    {
      kind: 'inspect',
      text: 'Read the bill of lading in the lead van',
      verb: 'Read',
      hint: 'The clipboard in the lead van',
      points: [
        {
          at: [20.5, -1004.5],
          label: 'The bill of lading',
          note: 'One cutting deck. One sealed crate. A place name, Mittenholt. The page with the route is torn off.',
          prop: 'hoa-clipboard',
          radius: 4,
        },
      ],
    },
  ],
  doneText: 'One van, one deck, one crate, one place name, and a torn page. The rest of the plates are still out there, going north.',
};

export const STORY: StoryFile = {
  quests: [HEAP_OF_TROUBLE],
  comms: {
    'm27-heap-of-trouble': {
      0: brief(
        ['ernie', 'Plates leave the Heap after dark now. Four ways, four vans. Hmm, hm.'],
        ['ernie', 'Tail one van north up the Ring Road. Three hundred fifty acorns, hm.'],
      ),
      1: call(['tansy', 'It has stopped. Two escorts on the van. Crack them quietly.']),
      2: call(['tansy', 'Read the paper in the cab. Which way did it go?']),
    },
  },
  plans: { 'm27-heap-of-trouble': { suite: 'story', expect: 'pass' } },
  bulletins: {
    'm27-heap-of-trouble': [
      'Compost Heap stoker Ash-Shovel Ernie says the furnace is running hot and the plates are running late, in four directions at once.',
      'The HOA describes its night deliveries of scrap plate as routine and seasonal. Roads north are open, with light flurries at the snow line.',
    ],
  },
  givers: {
    'compost-heap': {
      id: 'compost-heap',
      name: 'The Compost Heap furnace',
      label: 'Talk to Ash-Shovel Ernie',
      x: -246.2,
      z: -57,
      exit: { x: -244.5, z: -58.6, yaw: Math.PI },
      room: 'street',
      letter: 'E',
    },
  },
};
