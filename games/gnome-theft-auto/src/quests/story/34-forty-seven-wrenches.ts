// Story row 34: Forty-Seven Wrenches. Pip throws a party at Side-Valve for the rezoned Green and sends the player for the
// guests (the first L58 passenger run: Granny, Juniper and John Bodega, each from their own door). The party is the act's
// warm high point: Tansy counts the wrenches aloud, tells the story of the empty hook and stops short of the forty-eighth.
// The outro is Cam's tin-can call to Vesper, the act's closing threat. W07 (party bunting) turns on when this is done.
import { SIDE_VALVE } from '../../config';
import { homeDoor } from '../../homes/data';
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const ID = 'm34-forty-seven-wrenches';
/** Where the guests step out: the apron's edge off the z = 60 road, a short walk from the bay door. */
const DROP: [number, number] = [-148, 63];

const QUEST: QuestDef = {
  id: ID,
  title: 'Forty-Seven Wrenches',
  giver: 'side-valve',
  prereq: 'm33-the-bench-lock',
  chapter: 2,
  rewardAcorns: 400,
  radioBulletin: ID,
  hoa: 'off',
  cutscene: { kind: 'script', script: 'm34-forty-seven-wrenches-intro' },
  outro: { kind: 'script', script: 'm34-forty-seven-wrenches-outro' },
  objectives: [
    {
      kind: 'passenger',
      text: 'Fetch Granny from her farmhouse and drive her to Side-Valve Salvage',
      who: 'granny',
      name: 'Granny Gnertrude',
      pickup: homeDoor('granny'),
      dropAt: DROP,
      radius: 8,
      hint: "Granny's farmhouse, then Side-Valve Salvage",
      banter: [
        'Granny: "Mind the bumps, sugar. The crust has opinions."',
        'Granny: "A party is just a heist where everyone is invited."',
        'Granny: "Tansy lent me money once. I am bringing pie by way of interest."',
      ],
      onBoard: 'Granny: "I baked two. One is for the crew. One is for the driver."',
      onDrop: 'Granny: "Lovely bunting. Somebody fell off a ladder for it."',
    },
    {
      kind: 'passenger',
      text: 'Fetch Councilwoman Vance from her terrace on Kerb Row',
      who: 'juniper',
      name: 'Councilwoman Vance',
      pickup: homeDoor('juniper'),
      dropAt: DROP,
      radius: 8,
      hint: "Juniper's terrace on Kerb Row, then Side-Valve Salvage",
      banter: [
        'Juniper: "I have not been to a party since the vote. It was a short party."',
        'Juniper: "Reginald was invited too. He sent a form."',
        'Juniper: "The Green is rezoned. Legally, we are all very small landlords."',
      ],
      onBoard: 'Juniper: "I am told there will be pie. I am here for the minutes."',
      onDrop: 'Juniper: "Bunting. Unlicensed. I shall allow it."',
    },
    {
      kind: 'passenger',
      text: 'Fetch John Bodega from his shop',
      who: 'bodega',
      name: 'John Bodega',
      pickup: homeDoor('bodega'),
      dropAt: DROP,
      radius: 8,
      hint: 'Bodega & Sons, then Side-Valve Salvage',
      banter: [
        'John: "Closed sign is up. Closed sign is two acorns. Not for sale."',
        'John: "Asphalt is minding the till. The till is minding Asphalt."',
        'John: "Party. Cups. Cups are free. I priced them anyway."',
      ],
      onBoard: 'John: "Step is swept. Shop is shut. Drive."',
      onDrop: 'John: "Bunting. Eleven flags. Nine are crooked."',
    },
    {
      kind: 'visit',
      text: 'Join the party at the bay',
      at: [SIDE_VALVE.bay.x, SIDE_VALVE.bay.z],
      radius: 7,
      hint: 'Side-Valve Salvage bay',
      scene: 'm34-forty-seven-wrenches-mid',
    },
  ],
  doneText: 'The Green is open, the pie is eaten, and the bay is hung with bunting. The cigar box stayed shut. Someone is still sweeping.',
};

export const STORY: StoryFile = {
  quests: [QUEST],
  comms: {
    [ID]: {
      0: brief(
        ['pip', 'Party! The Green is rezoned, so Tansy gets a party. Fetch Granny first!'],
        ['pip', 'Then Juniper, then John. Pie is mandatory. It pays 400 Acorns.'],
      ),
      1: call(
        ['granny', 'Made it, sugar. Juniper next. Her terrace is on Kerb Row.'],
      ),
      2: call(
        ['pip', 'Last guest! John, from his shop. He will say the step is swept.'],
      ),
      3: call(
        ['tansy', 'Forty-seven. Come and count them. It is not a party. It is inventory.'],
      ),
    },
  },
  bulletins: {
    [ID]: [
      'Turfton FM reports a party at Side-Valve Salvage, on the rezoned Green. The guest list included one councillor, one shopkeeper and one pie.',
      'The pie has been described as "load-bearing". The salvage yard confirms it still has forty-seven wrenches. It declined to say how many it had before.',
    ],
  },
  plans: { [ID]: { suite: 'story', expect: 'pass' } },
};
