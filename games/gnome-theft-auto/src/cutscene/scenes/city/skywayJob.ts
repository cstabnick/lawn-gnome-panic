// city-skyway-robbery: the intro (city-skyway-robbery-intro, at the Kerbside Exchange) and the payoff (city-skyway-robbery-outro,
// at the Clay-Mart returns yard). Grout (the client) hires the player to take the strike-fund ledger off the HOA van; the job
// itself is the Skyway run (quests/cityQuests.ts). Stages: quests/stages/turftonC.ts (kerb-exchange), turftonB.ts (clay-mart-lot).
import type { SceneScript } from '../../script';
import { markOf, stageCut } from '../side/kit';
import { beat, coverage, cut, shot } from '../../direct';

const EXCHANGE = 'kerb-exchange';
const YARD = 'clay-mart-lot';
const DOT = markOf(EXCHANGE, 'dot');
const EXCHANGE_PLAYER = markOf(EXCHANGE, 'player');
const CLIENT = markOf(EXCHANGE, 'client');
const YARD_PLAYER = markOf(YARD, 'player');
const YARD_GROUT = markOf(YARD, 'grout');
const YARD_BURT = markOf(YARD, 'burt');

// Grout and the player, every single on one side of the line between them (the 180-degree rule).
const TALK = coverage('grout', 'you', 1);
// Dot and the player at the desk, the same rule on their own line.
const DOT_TALK = coverage('dot', 'you', 1);

export const SKYWAY_JOB_INTRO: SceneScript = {
  id: 'city-skyway-robbery-intro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'noon',
  title: 'The Skyway Job',
  music: 'heist',
  ambience: 'street',
  actors: [
    { id: 'you', player: true, at: EXCHANGE_PLAYER.at, yaw: EXCHANGE_PLAYER.yaw },
    { id: 'grout', preset: 'grout', at: CLIENT.at, yaw: CLIENT.yaw },
    { id: 'dot', preset: 'dot', at: DOT.at, yaw: DOT.yaw },
  ],
  steps: [
    // Establishing: the board, the desk and the stop. Dot points at the board while Grout steps up.
    { do: 'cam', shot: stageCut(EXCHANGE, 'wide') },
    { do: 'gesture', who: 'dot', name: 'point', s: 1.2, async: true },
    { do: 'wait', s: 1.5 },
    cut(TALK.single('grout', 'mcu')),
    { do: 'say', who: 'grout', text: 'Strike\'s over. The HOA seized the strike-fund ledger.' },
    cut(TALK.single('grout', 'mcu')),
    { do: 'say', who: 'grout', text: 'They\'re moving it to Fort Sandpit by the ground road.' },
    cut(TALK.ots('you')),
    { do: 'say', who: 'you', text: 'Why the ground road?' },
    cut(TALK.single('grout', 'mcu')),
    { do: 'say', who: 'grout', text: 'The HOA won\'t drive a union road. Principle, apparently.' },
    cut(TALK.ots('you')),
    { do: 'say', who: 'you', text: 'Then we take the Skyway.' },
    cut(TALK.single('grout', 'mcu')),
    { do: 'say', who: 'grout', text: 'Beat the van to the east off-ramp. Simple.' },
    // Dot, from behind her desk, with the kerb-side vehicle as her pointing point.
    cut(DOT_TALK.single('dot', 'mcu')),
    { do: 'say', who: 'dot', text: 'Zero-Turn\'s at the kerb. Racing stripe. Don\'t scratch it.' },
    cut(DOT_TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Scratch it, and I\'m walking.' },
    cut(TALK.single('grout', 'mcu')),
    { do: 'say', who: 'grout', text: 'Go on, then.' },
    beat('pause'),
  ],
};

export const SKYWAY_JOB_OUTRO: SceneScript = {
  id: 'city-skyway-robbery-outro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  title: 'The Skyway Job',
  music: 'turfton',
  ambience: 'crowd',
  actors: [
    { id: 'you', player: true, at: YARD_PLAYER.at, yaw: Math.PI / 2, held: 'ledger' },
    { id: 'grout', preset: 'grout', at: YARD_GROUT.at, yaw: YARD_GROUT.yaw },
    { id: 'burt', preset: 'burt', at: YARD_BURT.at, yaw: YARD_BURT.yaw, held: 'espresso-cup' },
  ],
  // The ledger van the player drove in, pulled up on the x = -120 road (spawned fresh if the player came on foot).
  vehicles: [{ id: 'hoa-van', kind: 'hoa-van', from: 'player', at: [-122.5, 150], yaw: 0 }],
  steps: [
    // Establishing: the yard at golden hour, the van pulled up, and the hand-over at once.
    { do: 'cam', shot: stageCut(YARD, 'wide') },
    { do: 'give', from: 'you', to: 'grout', prop: 'ledger', s: 1.2 },
    cut(TALK.single('grout', 'mcu')),
    { do: 'say', who: 'grout', text: 'Ledger. Every penny of the strike fund.' },
    cut(TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Took the Skyway. Beat them to the off-ramp.' },
    cut(TALK.single('grout', 'mcu')),
    { do: 'say', who: 'grout', text: 'I won\'t open it here. Not in front of anyone.' },
    cut(TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Then how do you know it is all there?' },
    cut(TALK.single('grout', 'mcu', { height: 'low' })),
    { do: 'say', who: 'grout', text: 'I know which pages hurt.' },
    // The button: Grout's line, then Burt raises his coffee from the van step.
    cut(TALK.single('grout', 'mcu')),
    { do: 'say', who: 'grout', text: 'The Skyway\'s paid for, brother. Every lane of it.' },
    cut(shot('burt', 'mcu', { toward: 'grout' })),
    { do: 'gesture', who: 'burt', name: 'cheer', s: 1.6 },
    beat('pause'),
  ],
};

export const SKYWAY_JOB_SCENES: SceneScript[] = [SKYWAY_JOB_INTRO, SKYWAY_JOB_OUTRO];
