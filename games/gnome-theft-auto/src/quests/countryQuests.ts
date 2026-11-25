// Countryside side quests (E16): Chard Levelright's night round of the Even-Estates sites and Farmer Bramble's lost deed.
// Places come from the country and farm contracts (country/types.ts, farm/types.ts). Tone: lore apocrypha/chard-levelright,
// windfall-croft. Every visit target is open ground in front of a door or at a yard edge, never inside a footprint.
import { COUNTRY_QUESTS, EVEN_ESTATES } from '../country/types';
import { CROFT } from '../farm/types';
import type { QuestDef } from './types';

const CHARD = 'Chard Levelright';
const CHARD_LOOK = { hat: 0xd9c8a5, shirt: 0xe07a1f, beard: 0x9a9a9a };
const BRAMBLE = 'Farmer Bramble';
const BRAMBLE_LOOK = { hat: 0x6a5a3a, shirt: 0x8fb339, beard: 0xa8a090 };

const [plot1, plot2, plot3] = EVEN_ESTATES;
// The middle show-home of a site: the spot 3 m out along its door's facing.
const front = (home: { x: number; z: number; d: number; yaw: number }): [number, number] => [
  home.x + Math.sin(home.yaw) * (home.d / 2 + 3),
  home.z + Math.cos(home.yaw) * (home.d / 2 + 3),
];
const home1 = front(plot1.homes[1]);
const home2 = front(plot2.homes[1]);
// Plot 3's yard: stand 5 m west of its centre, clear of the 10 m wide yard and the caravan.
const yard3: [number, number] = [plot3.yard.x - plot3.yard.w / 2 - 4, plot3.yard.z];

export const COUNTRY_QUESTS_DEFS: readonly QuestDef[] = [
  {
    id: COUNTRY_QUESTS.nightShift,
    title: 'Night Shift at Levelright',
    giver: 'chard',
    rewardAcorns: 250,
    hoa: 'off',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: CHARD, text: 'Short of hands. The ones I have talk to the Tattler.', look: CHARD_LOOK },
        { speaker: 'You', text: 'And I do not?' },
        { speaker: CHARD, text: 'No. You are plumb.', look: CHARD_LOOK },
        { speaker: CHARD, text: 'Walk the night round. All three sites. Every show-home gets looked at.', look: CHARD_LOOK },
        { speaker: CHARD, text: "Same window lit in every one. If one's different, I want to know.", look: CHARD_LOOK },
      ],
    },
    objectives: [
      {
        kind: 'visit',
        text: "Check Plot 1's show-homes",
        at: home1,
        radius: 3,
        hint: 'Even-Estates Plot 1, the show-home row',
        toastOnEnter: 'The same window is lit in all three houses, as ordered. Nobody is home in any of them.',
      },
      {
        kind: 'visit',
        text: "Go to Plot 2's gate",
        at: [plot2.gate.x, plot2.gate.z],
        radius: 4,
        hint: 'Even-Estates Plot 2, east of town',
        toastOnEnter: 'The night watch at Plot 2 looks at you, then at the Tattler van, then at you again.',
      },
      {
        kind: 'visit',
        text: "Check Plot 2's middle show-home",
        at: home2,
        radius: 3,
        hint: "Plot 2's show-home row",
        toastOnEnter: 'One house has a doormat and a milk bottle. Nobody ordered either.',
      },
      {
        kind: 'visit',
        text: "Look over Plot 3's yard",
        at: yard3,
        radius: 5,
        hint: 'Even-Estates Plot 3, far east',
        toastOnEnter: 'The bucket crane has a pigeon in the bucket. That is not in the plans either.',
      },
      {
        kind: 'visit',
        text: 'Report back to Chard at Plot 1',
        at: [plot1.gate.x - 4, plot1.gate.z],
        radius: 5,
        hint: "Plot 1's west gate",
        toastOnEnter: `${CHARD}: "Well?"`,
      },
    ],
    outro: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: 'You', text: 'Plot 2 has a doormat. And a milk bottle. The pigeon at Plot 3 is fine.', },
        { speaker: CHARD, text: 'A doormat.', look: CHARD_LOOK },
        { speaker: CHARD, text: '...Somebody wanted to live there.', look: CHARD_LOOK },
      ],
    },
    doneText: 'Chard paid in exact acorns and did not ask who the houses were for. He looked at the Plot 2 road for a while.',
  },
  {
    id: COUNTRY_QUESTS.croftDeed,
    title: 'The Croft by the Silo',
    giver: 'bramble',
    rewardAcorns: 200,
    hoa: 'off',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: BRAMBLE, text: "Don't look up. Just listen.", look: BRAMBLE_LOOK },
        { speaker: BRAMBLE, text: "Windfall Croft's got a For Sale board. Nobody knows who's selling.", look: BRAMBLE_LOOK },
        { speaker: BRAMBLE, text: 'Old owner left in a hurry. The deed went with the apples.', look: BRAMBLE_LOOK },
        { speaker: BRAMBLE, text: "I reckon it's still on the land. I'm not the one to dig.", look: BRAMBLE_LOOK },
        { speaker: BRAMBLE, text: 'Go and look. Quietly.', look: BRAMBLE_LOOK },
      ],
    },
    objectives: [
      {
        kind: 'visit',
        text: "Check the farmhouse door",
        at: [CROFT.farmhouse.x - CROFT.farmhouse.d / 2 - 1.5 - 3, CROFT.farmhouse.z], // door at x 121.5, 3 m out
        radius: 3,
        hint: "Windfall Croft's farmhouse",
        toastOnEnter: 'The letterbox is full of bank letters. None of them is the deed.',
      },
      {
        kind: 'visit',
        text: 'Look in the barn',
        at: [CROFT.barn.x - CROFT.barn.d / 2 - 1.5 - 4.5, CROFT.barn.z], // doors at x 121.5, 4.5 m out
        radius: 3,
        hint: "Windfall Croft's barn doors",
        toastOnEnter: 'The hayloft has a nest, a lantern and a tin. The tin holds one note: "the oak spot".',
      },
      {
        kind: 'visit',
        text: 'Dig by the oak',
        at: [CROFT.oak.x, CROFT.oak.z],
        radius: 3,
        hint: "The oak spot, Windfall Croft",
        toastOnEnter: 'Under a stone, an oilskin packet: the deed, made out to "whoever minds the oak".',
      },
      {
        kind: 'visit',
        text: 'Take the deed to Bramble',
        at: [CROFT.gate.x - 3, CROFT.gate.z + 10],
        radius: 6,
        hint: "Bramble, outside the croft's west gate",
        toastOnEnter: `${BRAMBLE} does not look up.`,
      },
    ],
    outro: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: BRAMBLE, text: 'Hm.', look: BRAMBLE_LOOK },
        { speaker: BRAMBLE, text: "Don't look up. Just listen.", look: BRAMBLE_LOOK },
        { speaker: BRAMBLE, text: '...', look: BRAMBLE_LOOK },
        { speaker: BRAMBLE, text: 'Nothing. I like to be ready. Here.', look: BRAMBLE_LOOK },
        { speaker: BRAMBLE, text: 'The bank still sells it. But the oak spot is for whoever plants there. Old Gnertrude\'s husband kept a copy in his silo, I\'d say.', look: BRAMBLE_LOOK },
      ],
    },
    doneText: 'The deed says the oak is for whoever plants. Bramble said that is how it should be, and left.',
  },
];
