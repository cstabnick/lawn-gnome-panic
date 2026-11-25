// Founders' Green side quests (E19): Swish Trowelly's regulars at Drainpipe Court and Fennel Gripwax's sessions at the
// Gutter Bowls. They read the sports save (gta-sports-v1) through probes (city/probes.ts). Lore: apocrypha entries
// cardoon-trowelly, fennel-gripwax, the-gutter-bowls, drainpipe-court.
import { BALL_CAGE, COURT_PEOPLE, COURT_PROBES, COURT_QUEST, SCOREBOARD } from '../court/types';
import { BOARD_LIBRARY, SKATE_LINES, SKATE_ORIGIN, SKATE_PROBES, SKATE_QUEST } from '../skate/types';
import { SPORTS_CAST } from '../sports/types';
import type { QuestDef } from './types';

const SWISH = SPORTS_CAST.cardoon.name;
const FENNEL = SPORTS_CAST.fennel.name;
const SWISH_LOOK = SPORTS_CAST.cardoon.look;
const FENNEL_LOOK = SPORTS_CAST.fennel.look;

const CAGE: [number, number] = [BALL_CAGE.x, BALL_CAGE.z];
const BOARD: [number, number] = [SCOREBOARD.x, SCOREBOARD.z];
const SWISH_SPOT: [number, number] = [COURT_PEOPLE.cardoon.spot.x, COURT_PEOPLE.cardoon.spot.z];
const LIBRARY: [number, number] = [BOARD_LIBRARY.x, BOARD_LIBRARY.z];

/** The first gate of a Gutter Bowls line, in world metres. */
function firstGate(id: string): [number, number] {
  const line = SKATE_LINES.find((l) => l.id === id);
  if (!line) throw new Error(`unknown skate line ${id}`);
  return [SKATE_ORIGIN.x + line.gates[0].u, SKATE_ORIGIN.z + line.gates[0].v];
}

export const SPORTS_QUESTS: readonly QuestDef[] = [
  {
    id: COURT_QUEST,
    title: 'Run With the Regulars',
    giver: 'cardoon',
    rewardAcorns: 200,
    hoa: 'off',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: SWISH, text: '(spins the ball on one finger, loses it, pretends he meant to) You stand in the way like you mean it.', look: SWISH_LOOK },
        { speaker: 'You', text: 'Is this your court?' },
        { speaker: SWISH, text: 'Nobody owns it. It has rules, though. I am the nearest thing it has to a rule.', look: SWISH_LOOK },
        { speaker: SWISH, text: 'So. First I watch you shoot. Then you win a game with Pansy, who will not forgive a bad pass.', look: SWISH_LOOK },
        { speaker: SWISH, text: 'Then you play me. Properly. Lintel and me against you two, to seven. Bring shoes.', look: SWISH_LOOK },
      ],
    },
    objectives: [
      {
        kind: 'probe',
        text: 'Sink three in a shootaround',
        probe: COURT_PROBES.shootMakes,
        count: 3,
        at: CAGE,
        hint: 'E at the ball cage for a ball',
      },
      {
        kind: 'probe',
        text: 'Win a pickup game with Pansy',
        probe: COURT_PROBES.wins,
        count: 1,
        at: BOARD,
        hint: 'E at the chalk scoreboard',
      },
      {
        kind: 'probe',
        text: 'Beat Swish and Lintel to 7',
        probe: COURT_PROBES.swishBeaten,
        count: 1,
        at: SWISH_SPOT,
        hint: 'E by Swish to challenge him',
      },
    ],
    outro: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: SWISH, text: '(bounces the ball once, looks at it, hands it over) Seven. You earned that one. I let you have the last bucket, obviously.', look: SWISH_LOOK },
        { speaker: SWISH, text: 'You are a regular now. It costs nothing. It costs everything. Same time tomorrow.', look: SWISH_LOOK },
      ],
    },
    doneText: 'You are a regular at Drainpipe Court. Swish will deny he lost.',
  },
  {
    id: SKATE_QUEST,
    title: 'Gutter Bowls Sessions',
    giver: 'fennel',
    rewardAcorns: 250,
    hoa: 'off',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: FENNEL, text: '(lifts his cap an inch, sets it back) Asphalt got the cap back to me. Good of you. Very quiet of you.', look: FENNEL_LOOK },
        { speaker: 'You', text: 'You feed the strays?' },
        { speaker: FENNEL, text: 'Everything out here is a stray. The pigeons, the boards, me. I keep a list of lines nobody has skated.', look: FENNEL_LOOK },
        { speaker: FENNEL, text: 'There is a rack by the north gate. The Board Library. Take one, leave one. Mind the chalk marks, they are my handwriting.', look: FENNEL_LOOK },
      ],
    },
    objectives: [
      {
        kind: 'probe',
        text: 'Take a board from the Board Library',
        probe: SKATE_PROBES.boardOwned,
        absolute: true,
        count: 1,
        at: LIBRARY,
        hint: 'E at the Board Library, by the north gate',
      },
      {
        kind: 'probe',
        text: 'Skate First Push',
        probe: 'skate-line-first-push',
        absolute: true,
        count: 1,
        at: firstGate('first-push'),
        hint: "Roll through Fennel's chalk marks: the run-up, off the kicker, along the rail",
      },
      {
        kind: 'probe',
        text: 'Skate Round the Kidney',
        probe: 'skate-line-bowl-line',
        absolute: true,
        count: 1,
        at: firstGate('bowl-line'),
        hint: "Follow the chalk marks round the kidney bowl, up the wall at the end",
      },
      {
        kind: 'probe',
        text: 'Skate the Long Gutter',
        probe: 'skate-line-long-gutter-line',
        absolute: true,
        count: 1,
        at: firstGate('long-gutter-line'),
        hint: 'Follow the chalk marks down the long gutter, over the lip, onto the rail',
      },
    ],
    outro: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: FENNEL, text: '(crosses three lines off a very long list) Three. That is three more than the list expected.', look: FENNEL_LOOK },
        { speaker: FENNEL, text: 'Keep the board. Leave one when you find a better one. That is the whole religion.', look: FENNEL_LOOK },
      ],
    },
    doneText: 'Three lines crossed off Fennel\'s list. The Board Library is a little lighter, and so is he.',
  },
];
