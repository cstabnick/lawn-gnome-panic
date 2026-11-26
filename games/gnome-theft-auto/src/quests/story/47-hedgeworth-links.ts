// Story row 47 (docs/design/gnome-theft-auto/story-outline.md): Hedgeworth Links. The Combine's deck is to be tried on Dame
// Peony's course, and Vesper holds her mortgage, so Peony will not hear a word against Vesper until the player beats her pro,
// Basil Divot, on one hole from the first tee (E15's golf: the par-holes probe is the hole, par or better wins). Thrift Hosepipe
// then walks the player round the grounds (the hedge arch, the ninth green, his shed). At dusk Basil is still putting the
// last putt he lost by, no mulligans, and Peony nods: the course is theirs for a week, and she has not heard a word about Vesper.
// Peony's arc: from Vesper's tenant to something that listens. A nod, not a speech.
// Scenes: cutscene/scenes/story/m47-hedgeworth-links.ts. Stages: quests/stages/story/s47-hedgeworth-links.ts.
import { HEDGE_ARCHES, HOLES, SHED } from '../../golf/types';
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const ID = 'm47-hedgeworth-links';

/** The first tee (hole 1, "The Mortgage"), where Basil practises, and the lawn below the terrace where he putts at dusk. */
const FIRST_TEE: [number, number] = [HOLES[0].tee.x - 6, HOLES[0].tee.z - 4];
const PUTTING_LAWN: [number, number] = [-1062, 474];
/** Thrift's tour: the hedge arch by the ninth fairway, the ninth green's edge, the shed step. */
const ARCH = HEDGE_ARCHES[2];
const NINTH: [number, number] = [HOLES[3].green.x - 6, HOLES[3].green.z - 10];
const SHED_STEP: [number, number] = [SHED.door.x + 3.5, SHED.door.z + 2];

const QUEST: QuestDef = {
  id: ID,
  title: 'Hedgeworth Links',
  giver: 'peony',
  prereq: 'm46-starfall-at-the-anthill',
  chapter: 3,
  rewardAcorns: 300,
  radioBulletin: ID,
  // A club, a cake nobody will lift and a mortgage: the Hat Watch has never been invited.
  hoa: 'off',
  cutscene: { kind: 'script', script: 'm47-hedgeworth-links-intro' },
  outro: { kind: 'script', script: 'm47-hedgeworth-links-outro' },
  objectives: [
    {
      kind: 'visit',
      text: 'Walk to the first tee and meet Basil Divot, the club pro',
      at: FIRST_TEE,
      radius: 7,
      hint: 'Hedgeworth Links: the first tee, below the clubhouse terrace',
    },
    {
      kind: 'probe',
      text: 'Play the first hole against Basil: par or better wins',
      probe: 'golf-par-holes',
      count: 1,
      at: FIRST_TEE,
      hint: 'The first tee: take a club and play The Mortgage, one hole, no mulligans',
    },
    {
      kind: 'inspect',
      text: "Walk the grounds with Thrift: the hedge arch, the ninth green, his shed",
      verb: 'Look',
      ordered: true,
      hint: "Thrift's tour: the hedge arch by the ninth fairway, then the green, then the shed (the cart path loop is quickest)",
      points: [
        {
          at: [ARCH.x, ARCH.z],
          radius: 4,
          label: "Stop 1 of 3: the hedge arch",
          note: 'Thrift: "The hedge grew the arch. I only told it where. Duck, it is proud of its height."',
        },
        {
          at: NINTH,
          radius: 4,
          label: 'Stop 2 of 3: the ninth green',
          note: 'Thrift: "The ninth. Do not stare at it. She is shy, and so is whoever lives under her."',
        },
        {
          at: SHED_STEP,
          radius: 4,
          label: "Stop 3 of 3: Thrift's shed",
          note: 'Thrift: "My shed. Tea is not offered. Anything that digs is not offered either."',
        },
      ],
    },
    {
      kind: 'visit',
      text: 'Go back to the clubhouse lawn at dusk: Dame Peony is waiting',
      at: PUTTING_LAWN,
      radius: 6,
      hint: 'The lawn below the clubhouse terrace, where Basil is putting',
    },
  ],
  doneText: 'Dame Peony has stopped talking about Vesper, and is listening. The course is yours for a week.',
};

export const STORY: StoryFile = {
  quests: [QUEST],
  comms: {
    [ID]: {
      0: brief(
        ['peony', "Your radio says the Combine's deck will be tried here. So does Vesper's letter."],
        ['peony', 'She holds my mortgage, so not one word against her, my dear.'],
        ['peony', 'Beat Basil Divot on one hole and I shall listen. Three hundred acorns.'],
      ),
      1: call(['basil', 'One hole, champ. No mulligans. Do try not to hit the clubhouse.']),
      2: call(
        ['basil', 'Well hit. As they say. Do not let it go to your hat.'],
        ['thrift', 'Walk with me, if you please. Keep off the damp.'],
      ),
      3: call(['peony', 'Come to the lawn at dusk, my dear. Basil is still putting.']),
    },
  },
  bulletins: {
    [ID]: [
      "Turfton FM: a neighbouring garden's golf club reports a members' dispute settled over a single hole. The mortgage was not discussed. It was, the club adds, 'in the room'.",
      "The Hedgeworth club pro has asked the public to stop saying his putt 'lipped out'. He says it 'considered' the hole, and then declined.",
    ],
  },
  plans: {
    [ID]: { suite: 'story', expect: 'pass' },
  },
};
