// Hedgeworth Links side quests (E15): Thrift Hosepipe's lost balls and molehills, Basil Divot's lesson and Dame Peony's
// Members' Cup. They read the golf save (gta-golf-v1) through probes (city/probes.ts). Names and secrets: lore R-193..R-195.
import { CLUBHOUSE_INTERIOR, GOLF_QUESTS as IDS, HEDGEWORTH_CAST, HOLES, KICKED_BOARD, PEOPLE_SPOTS, YARD } from '../golf/types';
import type { QuestDef } from './types';

const THRIFT = HEDGEWORTH_CAST.thrift.name;
const BASIL = HEDGEWORTH_CAST.basil.name;
const PEONY = HEDGEWORTH_CAST.peony.name;
const THRIFT_LOOK = HEDGEWORTH_CAST.thrift.look;
const BASIL_LOOK = HEDGEWORTH_CAST.basil.look;
const PEONY_LOOK = HEDGEWORTH_CAST.peony.look;

const BOARD: [number, number] = [KICKED_BOARD.x, KICKED_BOARD.z];
/** The middle of the course, for "somewhere in the rough". */
const COURSE_CENTRE: [number, number] = [(YARD.minX + YARD.maxX) / 2, (YARD.minZ + YARD.maxZ) / 2];
const FIRST_TEE: [number, number] = [HOLES[0].tee.x, HOLES[0].tee.z];
const NINTH_GREEN: [number, number] = [HOLES[3].green.x, HOLES[3].green.z];
/** Where Thrift stands, between his shed door and the ninth green. */
const SHED_DOOR: [number, number] = [PEOPLE_SPOTS.thrift.x, PEOPLE_SPOTS.thrift.z];
const BASIL_SPOT: [number, number] = [PEOPLE_SPOTS.basil.x, PEOPLE_SPOTS.basil.z];
/** Inside the clubhouse, by the honours board on the north wall (local to the room centre). */
const HONOURS_BOARD: [number, number] = [4, -4];

export const GOLF_QUESTS: readonly QuestDef[] = [
  {
    id: IDS.lostBalls,
    title: 'Lost Balls',
    giver: 'thrift',
    rewardAcorns: 250,
    hoa: 'off',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: THRIFT, text: '(sets down the watering can) You came through the board. Nobody comes through the board.', look: THRIFT_LOOK },
        { speaker: 'You', text: 'It was loose.' },
        { speaker: THRIFT, text: 'It is loose on purpose. Keeps the balls in. Mostly it keeps them out.', look: THRIFT_LOOK },
        { speaker: THRIFT, text: 'The ones that fly over the fence do not come back. The ones that stay, the grass carries about. Has done for years.', look: THRIFT_LOOK },
        { speaker: THRIFT, text: 'Find me five in the rough. Do not tell the pro. He counts them, and he is wrong.', look: THRIFT_LOOK },
      ],
    },
    objectives: [
      {
        kind: 'probe',
        text: 'Get into Hedgeworth: the loose board in the east fence',
        probe: 'golf-board-broken',
        absolute: true,
        count: 1,
        at: BOARD,
        hint: 'The Kicked Board, by the road (drive through or kick it)',
      },
      {
        kind: 'probe',
        text: 'Find 5 lost balls in the rough',
        probe: 'golf-balls-found',
        count: 5,
        at: COURSE_CENTRE,
        hint: 'Balls lie in the long grass round the course (E to pick one up)',
      },
      {
        kind: 'visit',
        text: 'Take the balls back to Thrift by his shed',
        at: SHED_DOOR,
        radius: 4,
        hint: "Thrift's shed, by the ninth green",
        toastOnEnter: `${THRIFT}: "Five. Hm. The grass did not give you the sixth."`,
      },
    ],
    outro: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: THRIFT, text: '(counts them twice, lips moving) Five. Good. One is warm.', look: THRIFT_LOOK },
        { speaker: THRIFT, text: "Don't tell the pro where you found the third.", look: THRIFT_LOOK },
      ],
    },
    doneText: 'Thrift has his five balls back. Hedgeworth is open to you whenever the board is.',
  },
  {
    id: IDS.lesson,
    title: 'A Lesson from the Pro',
    giver: 'basil',
    rewardAcorns: 300,
    prereq: IDS.lostBalls,
    hoa: 'off',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: BASIL, text: 'Champ! Word is a stranger came through the board. (tips the tam) Not a mole, I hope.', look: BASIL_LOOK },
        { speaker: 'You', text: 'Do you have moles?' },
        { speaker: BASIL, text: 'No. Never. Do not say it near the ninth. (taps the tee, twice, under his breath)', look: BASIL_LOOK },
        { speaker: BASIL, text: 'Let me see the swing, champ. Par or better, any hole. I want to see it with my own eyes.', look: BASIL_LOOK },
      ],
    },
    objectives: [
      {
        kind: 'probe',
        text: 'Make par or better on any Hedgeworth hole',
        probe: 'golf-par-holes',
        count: 1,
        at: FIRST_TEE,
        hint: 'Tee off at any hole (E at a tee)',
      },
      {
        kind: 'visit',
        text: 'Show Basil the card at the first tee',
        at: BASIL_SPOT,
        radius: 4,
        hint: "Basil's first tee, by his cottage",
        toastOnEnter: `${BASIL}: "Par. Well. Let us call it technique."`,
      },
    ],
    outro: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: BASIL, text: '(pats his sock, once, then looks away) Lucky. Very lucky. As they say.', look: BASIL_LOOK },
        { speaker: BASIL, text: 'Same time next week, champ. Bring your own ball.', look: BASIL_LOOK },
      ],
    },
    doneText: 'Basil has seen your par. He has not said where he keeps his spare ball.',
  },
  {
    id: IDS.ninthGreen,
    title: 'The Ninth Green',
    giver: 'thrift',
    rewardAcorns: 300,
    prereq: IDS.lostBalls,
    hoa: 'off',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: THRIFT, text: '(low, glancing at the cottage) Something is breathing under the ninth green.', look: THRIFT_LOOK },
        { speaker: 'You', text: 'Breathing?' },
        { speaker: THRIFT, text: 'Gently. It heaves up now and then. Little hills. Four of them.', look: THRIFT_LOOK },
        { speaker: THRIFT, text: 'The pro must not see the hills. He does his rounds soon. Pat them flat. Softly.', look: THRIFT_LOOK },
      ],
    },
    objectives: [
      {
        kind: 'visit',
        text: 'Go to the ninth green',
        at: NINTH_GREEN,
        radius: 10,
        hint: 'The Ninth, beside the shed',
        toastOnEnter: `${THRIFT} (whispering): "Gently. They are asleep."`,
      },
      {
        kind: 'probe',
        text: 'Pat all four molehills flat before Basil does his rounds',
        probe: 'golf-molehills',
        absolute: true,
        count: 4,
        at: NINTH_GREEN,
        hint: 'The little hills round the ninth green (E to pat one flat)',
      },
      {
        kind: 'visit',
        text: 'Tell Thrift at the shed door',
        at: SHED_DOOR,
        radius: 4,
        hint: "Thrift's shed",
        toastOnEnter: `${THRIFT}: "Flat. Good. You have a light hand."`,
      },
    ],
    outro: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: THRIFT, text: "(shows a small round hole by the shed wall, a thimble of tea beside it) Tunnel mouth. That is a mole's teacup.", look: THRIFT_LOOK },
        { speaker: THRIFT, text: 'They are no trouble, the little ones. Not like you.', look: THRIFT_LOOK },
      ],
    },
    doneText: 'The ninth green is flat. Thrift has not mentioned who is under it.',
  },
  {
    id: IDS.membersCup,
    title: "Members' Cup",
    giver: 'peony',
    rewardAcorns: 450,
    prereq: IDS.lesson,
    hoa: 'off',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: PEONY, text: "I run the Members' Cup on the first of the month. One plays all four holes. One signs the card.", look: PEONY_LOOK },
        { speaker: 'You', text: 'Are you playing?' },
        { speaker: PEONY, text: '(a short pause, a tap of the driver on the flagstone) One has a committee to chair, my dear.', look: PEONY_LOOK },
        { speaker: PEONY, text: 'One does not concede a hole. One plays them all, 1, 2, 3 and 9. The bank will want to see a full card.', look: PEONY_LOOK },
      ],
    },
    objectives: [
      {
        kind: 'probe',
        text: 'Play a full round: holes 1, 2, 3 and 9',
        probe: 'golf-rounds',
        count: 1,
        at: FIRST_TEE,
        hint: 'Start a round at the first tee (E at a tee) and finish all four holes',
      },
      {
        kind: 'visit',
        text: 'Sign the card at the honours board',
        at: HONOURS_BOARD,
        radius: 2.5,
        hint: 'Inside the clubhouse, on the north wall',
        interior: CLUBHOUSE_INTERIOR,
        toastOnEnter: `${PEONY}: "Sign it, my dear. In ink."`,
      },
    ],
    outro: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: PEONY, text: "(writes the score herself on the board, under 'A MOLE (DISPUTED)') There. The committee is satisfied.", look: PEONY_LOOK },
        { speaker: PEONY, text: 'We shall not mention the mortgage. It is in the other room.', look: PEONY_LOOK },
      ],
    },
    doneText: 'Your score is on the honours board. Peony has not played a hole herself, and will say it is policy.',
  },
];
