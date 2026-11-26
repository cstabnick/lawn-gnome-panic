// Story row 24: The Burrow Door. The laugh after the tablet. Two gnomes with spades prod a log in the last pines of Mossy Wood
// while Nubbin, a small formal mole, hides under it and corrects their zoology from underneath. At dusk the player carries him
// home to the Burrow Door, where Old Mother Tumblesoil thanks them by the light of a mole lantern, and DJ Moleman's bass comes
// up through the boards. Moleman is never seen and never explained. Moles are shot at their own eye line (batch-3 notes 6.5).
// Notes: docs/design/gnome-theft-auto/direction/scenes/m24-the-burrow-door-{intro,outro}.md
import type { ScriptActor, SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, exchangeLooks } from '../../direct';
import { carMark, markOf, spot, up } from './kit';

type Look = NonNullable<ScriptActor['look']>;

/** Two gardeners with spades (the quest's targets wear the same colours). */
const DIGGER_LOOK: Look = { hat: 0x7a5a32, shirt: 0x5b6b3a, beard: 0xcfc6b0 };

// ---- Stage marks (quests/stages/story/s24-the-burrow-door.ts) --------------------------------------------------------------
const LOG = 'mole-log';
const DOOR = 'burrow-door-dusk';
const NUBBIN_LOG = markOf(LOG, 'nubbin');
const GUS = markOf(LOG, 'digger-a');
const DAB = markOf(LOG, 'digger-b');
const LOG_PLAYER = markOf(LOG, 'player');

const TUMBLESOIL = markOf(DOOR, 'tumblesoil');
const DOOR_NUBBIN = markOf(DOOR, 'nubbin');
const DOOR_PLAYER = markOf(DOOR, 'player');
const BUGGY = carMark(DOOR, 'door-buggy');

/** The round door's step: where Tumblesoil stands behind it and comes out from (on the mound's east face, E17 door.ts). */
const DOOR_AT: Vec2 = [-993.2, 300.3];

const DIG = coverage('gus', 'dab', 1);
const MOLE_TALK = coverage('nubbin', 'player', 1);
const OLD_TALK = coverage('tumblesoil', 'nubbin', 1);
const OLD_YOU = coverage('tumblesoil', 'player', -1);

/** Row 24 intro: a nose under a log; two spades that cannot find it; a mole who corrects them. Day. */
const INTRO: SceneScript = {
  id: 'm24-the-burrow-door-intro',
  stage: { kind: 'world' },
  music: 'warm',
  ambience: 'forest',
  sky: 'noon',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m24-the-burrow-door-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, at: LOG_PLAYER.at, yaw: LOG_PLAYER.yaw },
    { id: 'nubbin', preset: 'nubbin', at: NUBBIN_LOG.at, yaw: NUBBIN_LOG.yaw },
    { id: 'gus', name: 'Gus', look: DIGGER_LOOK, held: 'ranch-spade', at: GUS.at, yaw: GUS.yaw },
    { id: 'dab', name: 'Dab', look: { ...DIGGER_LOOK, hat: 0x6a4a28 }, held: 'ranch-spade', at: DAB.at, yaw: DAB.yaw },
  ],
  steps: [
    // Hook: ground level, a nose and two spectacles under a log; a spade bites the soil somewhere close.
    cut(spot(LOG, 'log-low')),
    { do: 'gesture', who: 'nubbin', name: 'sit', s: 0.1, async: true },
    { do: 'sfx', id: 'shovel', at: up(GUS.at[0], GUS.at[1], 0.2), gain: 0.5, async: true },
    { do: 'wait', s: 0.9 },
    { do: 'sfx', id: 'squeak', at: 'nubbin', gain: 0.35, async: true },
    cut(MOLE_TALK.single('nubbin', 'mcu')),
    { do: 'say', who: 'nubbin', text: 'Oh dear. Oh dear, oh dear, oh dear.' },
    { do: 'intro', who: 'nubbin' },
    // Setup: the spade gnome, and a theory of moles.
    { do: 'sfx', id: 'rustle', at: 'gus', gain: 0.4, async: true },
    ...exchangeLooks('gus', 'dab', 0.1),
    cut(DIG.single('gus', 'ms', { height: 'low' })),
    { do: 'gesture', who: 'gus', name: 'point', s: 1.3, async: true },
    { do: 'say', who: 'gus', text: 'Root-eater is under here somewhere. I can smell the roots he ate.' },
    cut(DIG.single('dab', 'mcu')),
    { do: 'say', who: 'dab', text: 'Gus. That is a log.' },
    cut(DIG.single('gus', 'mcu')),
    { do: 'say', who: 'gus', text: 'Logs have moles, Dab.' },
    // The turn: the log answers.
    { do: 'sfx', id: 'squeak', at: 'nubbin', gain: 0.4, async: true },
    cut(MOLE_TALK.single('nubbin', 'mcu')),
    { do: 'say', who: 'nubbin', text: 'We eat grubs. The grubs eat the roots. It is on the sign.' },
    cut(DIG.two('fs')),
    beat('beat'),
    { do: 'face', who: 'gus', at: 'dab', s: 0.5 },
    { do: 'say', who: 'gus', text: 'Did the log say something?' },
    cut(DIG.single('dab', 'mcu')),
    { do: 'say', who: 'dab', text: 'Logs do not talk, Gus.' },
    { do: 'stinger', id: 'comic' },
    cut(DIG.single('gus', 'mcu')),
    { do: 'say', who: 'gus', text: 'Then I am hearing things.' },
    cut(DIG.single('dab', 'ms', { height: 'low' })),
    { do: 'say', who: 'dab', text: 'Check the other log.' },
    { do: 'sfx', id: 'crunch', at: 'dab', gain: 0.4, async: true },
    { do: 'walk', who: 'gus', path: [[GUS.at[0] + 6, GUS.at[1] + 1]], speed: 1.5, async: true },
    { do: 'walk', who: 'dab', path: [[DAB.at[0] + 5, DAB.at[1] + 1.5]], speed: 1.5, async: true },
    { do: 'wait', s: 2.2 },
    // Button: the nose comes back out, and asks the player for help in the smallest possible voice.
    cut(MOLE_TALK.single('nubbin', 'mcu')),
    { do: 'face', who: 'nubbin', at: 'player', s: 0.4 },
    { do: 'say', who: 'nubbin', text: 'If you please, they have been at it since breakfast.' },
    cut(MOLE_TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Stay under the log.' },
    cut(MOLE_TALK.single('nubbin', 'mcu')),
    { do: 'say', who: 'nubbin', text: 'Most kind. I am small. They are not.' },
    { do: 'sfx', id: 'rustle', at: 'nubbin', gain: 0.4 },
  ],
};

/** Row 24 outro: the round door at dusk; Tumblesoil, the lantern, and the bass through the boards. */
const OUTRO: SceneScript = {
  id: 'm24-the-burrow-door-outro',
  stage: { kind: 'world' },
  music: 'turfton-dusk',
  ambience: 'forest',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m24-the-burrow-door-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, at: DOOR_PLAYER.at, yaw: DOOR_PLAYER.yaw },
    // Nubbin has just hopped down from the barrow (behind the player); he trots to his mark.
    { id: 'nubbin', preset: 'nubbin', at: [DOOR_NUBBIN.at[0] + 1.2, DOOR_NUBBIN.at[1] + 1.4], yaw: DOOR_NUBBIN.yaw },
    { id: 'tumblesoil', preset: 'tumblesoil', held: 'mole-lantern', hidden: true, at: DOOR_AT, yaw: TUMBLESOIL.yaw },
  ],
  vehicles: [
    { id: 'buggy', kind: BUGGY.kind, from: 'player', at: BUGGY.at, yaw: BUGGY.yaw },
  ],
  steps: [
    // Hook: a knock, low down, and the door opening a little more than it already is.
    cut(spot(DOOR, 'door')),
    { do: 'sfx', id: 'knock', at: up(DOOR_AT[0], DOOR_AT[1], 0.3), gain: 0.4 },
    { do: 'wait', s: 0.8 },
    { do: 'sfx', id: 'creak', at: up(DOOR_AT[0], DOOR_AT[1], 0.5), gain: 0.45, async: true },
    { do: 'spawn', id: 'tumblesoil' },
    { do: 'walk', who: 'tumblesoil', path: [[TUMBLESOIL.at[0], TUMBLESOIL.at[1]]], speed: 0.9 },
    cut(OLD_TALK.single('tumblesoil', 'mcu')),
    { do: 'say', who: 'tumblesoil', text: 'Nubbin. Late for supper, and in one piece. Both are good.' },
    cut(OLD_TALK.single('tumblesoil', 'ms', { height: 'low' })),
    { do: 'intro', who: 'tumblesoil' },
    // Setup: he trots up and reports, very correctly.
    cut(spot(DOOR, 'wide')),
    { do: 'walk', who: 'nubbin', path: [[DOOR_NUBBIN.at[0], DOOR_NUBBIN.at[1]]], speed: 1.3 },
    cut(OLD_TALK.single('nubbin', 'mcu')),
    { do: 'say', who: 'nubbin', text: 'Yes, Ma\'am. This kind gnome brought me. In a barrow. Gently.' },
    // The warm beat: the old mole turns to the gnome, and says the quiet thing.
    cut(OLD_YOU.single('tumblesoil', 'mcu')),
    { do: 'say', who: 'tumblesoil', text: 'Dear one. Nobody has ever brought one of us home before.' },
    cut(OLD_YOU.single('player', 'mcu')),
    { do: 'gesture', who: 'player', name: 'tipHat', s: 1.0, async: true },
    { do: 'say', who: 'player', text: 'He was no trouble.' },
    cut(OLD_YOU.single('tumblesoil', 'mcu')),
    { do: 'say', who: 'tumblesoil', text: 'Mind the lantern, dear one. It is older than your hat.' },
    // The turn: the ground speaks. A bass note through the boards, and the lantern glass rattles.
    { do: 'music', track: null, fade: 0.6 },
    { do: 'sfx', id: 'thud', at: up(DOOR_AT[0], DOOR_AT[1], 0.3), gain: 0.55 },
    { do: 'shake', amp: 0.03, s: 0.35 },
    cut(OLD_YOU.single('player', 'mcu')),
    { do: 'sfx', id: 'thud', at: up(DOOR_AT[0], DOOR_AT[1], 0.3), gain: 0.55, async: true },
    { do: 'shake', amp: 0.03, s: 0.35 },
    { do: 'say', who: 'player', text: 'Is something... playing?' },
    cut(OLD_YOU.single('tumblesoil', 'mcu')),
    { do: 'say', who: 'tumblesoil', text: 'The Hall\'s heartbeat, dear one. We do not ask it questions.' },
    // Button: Nubbin bows and trots in; the thud lands once more and the lantern jumps in its glass.
    { do: 'walk', who: 'nubbin', path: [[DOOR_AT[0] + 1.4, DOOR_AT[1] + 0.6]], speed: 1.6, async: true },
    { do: 'gesture', who: 'nubbin', name: 'bow', s: 1.0, async: true },
    { do: 'sfx', id: 'thud', at: up(DOOR_AT[0], DOOR_AT[1], 0.3), gain: 0.6, async: true },
    cut(spot(DOOR, 'lantern')),
    { do: 'shake', amp: 0.04, s: 0.4 },
    { do: 'sfx', id: 'clink', at: 'tumblesoil', gain: 0.3, async: true },
    { do: 'wait', s: 1.6 },
    { do: 'sfx', id: 'thud', at: up(DOOR_AT[0], DOOR_AT[1], 0.3), gain: 0.6, async: true },
    cut(spot(DOOR, 'wide')),
    { do: 'shake', amp: 0.025, s: 0.4 },
    { do: 'wait', s: 1.4 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm24-the-burrow-door-intro': INTRO,
  'm24-the-burrow-door-outro': OUTRO,
};
