// The Underspan's and the Flock's side quests (E17 issue Q2): Hogweed's Updraft and scrap run, the Flock's errands and
// the Long Vigil. Places: societies/config.ts (UNDERSPAN, WORKSHOP_ROOM, WADERS_REST, TENT_ROOM, SOCIETY_*).
import {
  SOCIETY_ACH,
  SOCIETY_CAST,
  SOCIETY_INTERIORS,
  SOCIETY_PROBES,
  SOCIETY_QUESTS,
  TENT_ROOM,
  UNDERSPAN,
  WADERS_REST,
  WORKSHOP_ROOM,
} from '../societies/config';
import { SKYWAY_SITES } from '../highways/skyways';
import type { QuestDef } from './types';

const HOGWEED = SOCIETY_CAST.hogweed;
const HOGWEED_LOOK = { hat: 0x6b4a2e, shirt: 0x8a5a3a, beard: 0xd2691e, glasses: true };
const SAXIFRAGE = SOCIETY_CAST.saxifrage;
const SAXIFRAGE_LOOK = { hat: 0xb8b8c0, shirt: 0x8d9096, beard: 0xd8d8dc };

const yard = (id: string) => SKYWAY_SITES.find((s) => s.id === id)!;
const BELTWAY_YARD = yard('beltway-works');
const AIRFIELD_YARD = yard('airfield-works');

export const SOCIETY_QUEST_DEFS: readonly QuestDef[] = [
  {
    id: SOCIETY_QUESTS.verticality,
    title: 'Unauthorised Verticality',
    giver: 'hogweed',
    rewardAcorns: 300,
    hoa: 'off',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: HOGWEED, text: "You! Yes! No, wait. Hold still. The Updraft, Mk. 7, it is a hose and an umbrella and a hose, and the umbrella goes UP, and the hose is the important part, or the umbrella, I have not decided, which is the sort of thing we decide when it is built.", look: HOGWEED_LOOK },
        { speaker: 'You', text: 'Built from what?' },
        { speaker: HOGWEED, text: 'Three parts nobody will give me. A wheel, an umbrella and a garden hose. Permission is a prototype nobody tested. Get me the parts. Tell them nothing.', look: HOGWEED_LOOK },
      ],
    },
    objectives: [
      {
        kind: 'visit',
        text: 'Borrow a bicycle wheel from the Beltway Works yard',
        at: [BELTWAY_YARD.x, BELTWAY_YARD.z],
        radius: 6,
        hint: 'Beltway Works yard',
        toastOnEnter: 'A Local 404 note is taped to the wheel: "PROPERTY OF THE UNION. ASK FIRST." You ask the wheel. It says nothing.',
      },
      {
        kind: 'visit',
        text: 'Borrow an umbrella from the Local 404 Works yard',
        at: [AIRFIELD_YARD.yard.minX + 3, AIRFIELD_YARD.z], // the open west side of the yard, clear of the platform
        radius: 6,
        hint: 'Local 404 Works yard',
        toastOnEnter: 'The umbrella is on a hook marked "FOR EMERGENCIES ONLY". You are not sure this is not one.',
      },
      {
        kind: 'visit',
        text: 'Dig a garden hose out of the scrap heap',
        at: [UNDERSPAN.scrapHeap.x - 5, UNDERSPAN.scrapHeap.z - 1], // beside the heap
        radius: 4,
        hint: 'The scrap heap, the Underspan',
        toastOnEnter: 'Under a bathtub, under a traffic cone, under a sorry-looking hedge trimmer: one hose, still coiled.',
      },
      {
        kind: 'visit',
        text: "Hand the parts in at Hogweed's bench",
        at: [WORKSHOP_ROOM.bench[0], WORKSHOP_ROOM.bench[1] + 1.5],
        radius: 2.5,
        interior: SOCIETY_INTERIORS.workshop,
        hint: "Hogweed's Workshop",
        toastOnEnter: 'Hogweed takes the parts, holds them up to the light, and says "Yes. Mostly yes." He is already assembling.',
      },
      {
        kind: 'probe',
        text: 'Ride the Updraft onto the Roost',
        probe: SOCIETY_PROBES.updraft,
        count: 1,
        hint: "Hogweed's Workshop",
      },
    ],
    outro: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: HOGWEED, text: 'It goes UP! Up is the good direction! Something is falling. Catch it. No, it is a citation.', look: HOGWEED_LOOK },
        { speaker: 'HOA Inspector', text: 'Unauthorised verticality. Forty acorns.' },
        { speaker: HOGWEED, text: 'Unauthorised verticality! That is the good one!', look: HOGWEED_LOOK },
      ],
    },
    doneText: 'The Updraft works. Probably. Hogweed has framed the citation and hung it over the bench.',
  },
  {
    id: SOCIETY_QUESTS.scrapRun,
    title: 'The Scrap Run',
    giver: 'hogweed',
    prereq: SOCIETY_QUESTS.verticality,
    rewardAcorns: 450,
    hoa: 'off',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: HOGWEED, text: "The workshop is out of parts. Out. Of. Parts. Local 404 have a flatbed at the works yard full of offcuts. They are definitely not using them.", look: HOGWEED_LOOK },
        { speaker: 'You', text: 'Local 404 will not like that.' },
        { speaker: HOGWEED, text: "Local 404 are our cousins. Estranged. We do not speak of the Span. Bring the flatbed here, gently. Then we will give it back. Improved.", look: HOGWEED_LOOK },
      ],
    },
    objectives: [
      {
        kind: 'steal-deliver',
        text: 'Borrow the Local 404 flatbed and take it to the Underspan',
        vehicleKind: 'mulch-spreader',
        spawnAt: [AIRFIELD_YARD.yard.minX + 3, AIRFIELD_YARD.z, 0],
        dropAt: [580, -26],
        radius: 6,
        hint: 'The Underspan, beside the Span',
        heatOnEnter: 0.5,
        banter: ['Hogweed (radio): "Gently! The offcuts have feelings!"'],
      },
      {
        kind: 'visit',
        text: 'Unload the offcuts at Hogweed Sprocket',
        at: [UNDERSPAN.hogweed.x, UNDERSPAN.hogweed.z],
        radius: 4,
        hint: 'Hogweed Sprocket, the Underspan',
        toastOnEnter: 'Hogweed strokes the offcuts one by one and names each. "You are a good drainpipe. You are a bad hinge."',
      },
    ],
    outro: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: HOGWEED, text: "We'll give it back. Improved.", look: HOGWEED_LOOK },
      ],
    },
    doneText: 'The offcuts are in the workshop and the flatbed is parked under the Span, where it can be returned any time.',
  },
  {
    id: SOCIETY_QUESTS.flockErrands,
    title: 'Errands for the Flock',
    giver: 'saxifrage',
    rewardAcorns: 250,
    achievement: SOCIETY_ACH.birdsOfAFeather,
    hoa: 'off',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: SAXIFRAGE, text: 'You are a stander. I can see it in your feet. Not both feet. One is plenty.', look: SAXIFRAGE_LOOK },
        { speaker: 'You', text: 'I can stand on one leg for a while.' },
        { speaker: SAXIFRAGE, text: 'A while is what we have. Do a few errands for the Flock, and you may stand with us. So it is stood.', look: SAXIFRAGE_LOOK },
      ],
    },
    objectives: [
      {
        kind: 'visit',
        text: 'Bring in the grey washing',
        at: [WADERS_REST.washingLine.x, WADERS_REST.washingLine.z - 3],
        radius: 4,
        hint: 'The washing line, Wader\'s Rest',
        toastOnEnter: 'One sock is pink. You put it back and say nothing.',
      },
      {
        kind: 'visit',
        text: `Fetch a cup of reed tea for ${SOCIETY_CAST.godwit}`,
        at: [WADERS_REST.teaUrn.x + 3, WADERS_REST.teaUrn.z],
        radius: 4,
        hint: 'The tea urn, Wader\'s Rest',
        toastOnEnter: 'Brother Godwit has wobbled again. He accepts the tea with both hands and one foot.',
      },
      {
        kind: 'probe',
        text: 'Stand through a sermon on one leg in the circle',
        probe: SOCIETY_PROBES.sermon,
        count: 1,
        at: [WADERS_REST.circle.x, WADERS_REST.circle.z],
        hint: 'the ritual circle',
      },
      {
        kind: 'visit',
        text: 'Bow to the Lady\'s shrine',
        at: [TENT_ROOM.shrine[0], TENT_ROOM.shrine[1] - 2],
        radius: 2.5,
        interior: SOCIETY_INTERIORS.tent,
        hint: "Mother Saxifrage's tent",
        toastOnEnter: 'You bow. Your leg is very grateful.',
      },
    ],
    outro: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: SAXIFRAGE, text: 'You are one of the Flock now. Here is your hood. It is grey.', look: SAXIFRAGE_LOOK },
        { speaker: SAXIFRAGE, text: 'Pink is for the Lady only, so it is stood.', look: SAXIFRAGE_LOOK },
      ],
    },
    doneText: 'You are one of the Flock of the One Leg. You have a grey hood. Nobody has asked you to sit down yet.',
  },
  {
    id: SOCIETY_QUESTS.flockVigil,
    title: 'The Long Vigil',
    giver: 'saxifrage',
    prereq: SOCIETY_QUESTS.flockErrands,
    rewardAcorns: 300,
    hoa: 'off',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: SAXIFRAGE, text: 'Tonight the Flock keep the Long Vigil. On one leg, until dawn. It is, unfortunately, a Tuesday.', look: SAXIFRAGE_LOOK },
        { speaker: 'You', text: 'Is there a rule about Tuesdays?' },
        { speaker: SAXIFRAGE, text: 'No sitting. It is foretold. The Even Cut comes on the longest day, and we must be standing for it. So it is stood.', look: SAXIFRAGE_LOOK },
      ],
    },
    objectives: [
      {
        kind: 'probe',
        text: 'Stand the vigil sermon (it is longer at night)',
        probe: SOCIETY_PROBES.sermon,
        count: 1,
        at: [WADERS_REST.circle.x, WADERS_REST.circle.z],
        hint: 'the ritual circle',
      },
      {
        kind: 'choice',
        text: 'Stand until dawn, or sit down on the Tuesday bench',
        optionA: {
          label: 'Keep standing',
          at: [WADERS_REST.circle.x, WADERS_REST.circle.z],
          endingText: 'You stand until dawn. Your leg has opinions. So it is stood.',
          bonusAcorns: 150,
        },
        optionB: {
          label: 'Sit down on the Tuesday bench',
          at: [WADERS_REST.tuesdayBench.x, WADERS_REST.tuesdayBench.z - 2], // in front of the bench, toward the circle
          endingText: 'You sit. The Flock gasp, then pour you a cup of reed tea. You have left the Flock, gently. They wave with one hand and stand on one leg.',
          achievement: SOCIETY_ACH.satDown,
        },
      },
    ],
    doneText: 'The vigil is over. Whatever you chose, the Flock have already started on the washing.',
  },
];
