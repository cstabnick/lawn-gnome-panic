// city-kerbside-rounds: the intro (city-kerbside-rounds-intro, at the Kerbside Exchange) and the payoff (city-kerbside-rounds-outro).
// Dot Pennywort punches the player's ticket at her desk and explains the board; the payoff is the same desk in golden light,
// the last punch and the name pinned up. Stage marks and cameras come from quests/stages/turftonC.ts ('kerb-exchange').
import type { SceneScript } from '../../script';
import { markOf, stageCut } from '../side/kit';
import { beat, coverage, cut, exchangeLooks } from '../../direct';

const EXCHANGE = 'kerb-exchange';
const DOT = markOf(EXCHANGE, 'dot');
const PLAYER = markOf(EXCHANGE, 'player');

// Dot behind the desk, the player across it: every single on one side of the line between them.
const TALK = coverage('dot', 'you', 1);

export const KERBSIDE_ROUNDS_INTRO: SceneScript = {
  id: 'city-kerbside-rounds-intro',
  stage: { kind: 'world' },
  world: 'live',
  title: 'Kerbside Rounds',
  music: 'turfton',
  ambience: 'street',
  actors: [
    { id: 'you', player: true, at: PLAYER.at, yaw: PLAYER.yaw },
    { id: 'dot', preset: 'dot', at: DOT.at, yaw: DOT.yaw },
  ],
  steps: [
    // Hook: the ticket punch clacks before a word is said, on the wide establishing shot of the board and the bus stop.
    { do: 'cam', shot: stageCut(EXCHANGE, 'wide') },
    { do: 'sfx', id: 'punch' },
    { do: 'wait', s: 1.2 },
    ...exchangeLooks('dot', 'you'),
    cut(TALK.single('dot', 'mcu')),
    { do: 'say', who: 'dot', text: 'Kerb-sitter. Sit at my desk, I punch you in.' },
    cut(TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Heard you hand out jobs. Anything that pays?' },
    cut(TALK.single('dot', 'mcu')),
    { do: 'say', who: 'dot', text: 'Every job in Turfton comes past this desk. Every one.' },
    // The board: Dot points at the slips, then the close board shot holds on them.
    { do: 'gesture', who: 'dot', name: 'point', s: 1.4, async: true },
    cut(stageCut(EXCHANGE, 'board')),
    { do: 'wait', s: 1.5 },
    cut(TALK.single('dot', 'mcu')),
    { do: 'say', who: 'dot', text: 'First job: a Tattler round. Three districts, no dawdling.' },
    cut(TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Where do I start?' },
    cut(TALK.single('dot', 'mcu')),
    { do: 'say', who: 'dot', text: 'Bodega in the Old Brick Quarter. Then Nina on the Greenhouse Strip.' },
    cut(TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'And the last stop?' },
    cut(TALK.single('dot', 'mcu')),
    { do: 'say', who: 'dot', text: 'City Hall, Downtown. Pin a notice, then back to me.' },
    // The button: Dot holds out the ticket, the punch goes, and the line lands on her face.
    cut(TALK.single('dot', 'mcu')),
    { do: 'say', who: 'dot', text: 'Fares, please.' },
    { do: 'sfx', id: 'punch' },
    beat('pause'),
  ],
};

export const KERBSIDE_ROUNDS_OUTRO: SceneScript = {
  id: 'city-kerbside-rounds-outro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  music: 'turfton-dusk',
  ambience: 'street',
  actors: [
    { id: 'you', player: true, at: PLAYER.at, yaw: PLAYER.yaw },
    { id: 'dot', preset: 'dot', at: DOT.at, yaw: DOT.yaw },
  ],
  steps: [
    // The last hole of the ticket goes through, on the golden wide shot of the desk.
    { do: 'cam', shot: stageCut(EXCHANGE, 'wide') },
    { do: 'sfx', id: 'punch' },
    { do: 'wait', s: 1.2 },
    ...exchangeLooks('dot', 'you'),
    cut(TALK.single('dot', 'mcu')),
    { do: 'say', who: 'dot', text: 'Last hole punched. Your name goes up on the board now.' },
    // The name pinned up: the board close, then a beat before the next line.
    cut(stageCut(EXCHANGE, 'board')),
    { do: 'wait', s: 1.5 },
    cut(TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'So I am on the books?' },
    // Mabel's taxi horn from off-screen: the air brakes up the road, and Dot looks towards the sound.
    { do: 'sfx', id: 'handbrake-release' },
    cut(TALK.single('dot', 'mcu')),
    { do: 'say', who: 'dot', text: 'That is Mabel, always early, never on time.' },
    cut(TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Are there more jobs?' },
    cut(TALK.single('dot', 'mcu')),
    { do: 'say', who: 'dot', text: 'Every open job in Turfton is on the board now. Check your phone.' },
    beat('pause'),
  ],
};

export const KERBSIDE_ROUNDS_SCENES: SceneScript[] = [KERBSIDE_ROUNDS_INTRO, KERBSIDE_ROUNDS_OUTRO];
