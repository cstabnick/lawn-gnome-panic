// Story row 49: Loamdeep. The Burrowfolk are asked for nothing and now they are asking, for the first time in their lives. Intro
// (day): the round door swings open on a lit hall and Old Mother Tumblesoil asks three small jobs of the player while Nubbin
// is dragged in by his own post sack. Mid (night): DJ Moleman at his decks plays one whole track, and the Burrowfolk agree
// without a word. Outro (night): a supper table on the grass, one root set on it, "we dig where we are asked, and nobody ever
// asks". Moleman never speaks and is never explained. His decks are an interior, so the mid plays on a cutscene-only set on
// the grass by the mound (scene props), the way a film cuts to a room. Moles are shot at their own eye line (batch-3 notes 6.5).
// Notes: docs/design/gnome-theft-auto/direction/scenes/m49-loamdeep-{intro,mid,outro}.md
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, shot } from '../../direct';
import { markOf, spot, up } from './kit';

// ---- Stage marks (quests/stages/story/s49-loamdeep.ts) -------------------------------------------------------------------
const WELCOME = 'burrow-door-welcome';
const W_TUMBLESOIL = markOf(WELCOME, 'tumblesoil');
const W_NUBBIN = markOf(WELCOME, 'nubbin');
const W_PLAYER = markOf(WELCOME, 'player');

const SET = 'moleman-set-night';
const S_MOLEMAN = markOf(SET, 'dj moleman');
const S_PLAYER = markOf(SET, 'player');
const S_TUMBLESOIL = markOf(SET, 'tumblesoil');
const S_NUBBIN = markOf(SET, 'nubbin');
const S_PIM = markOf(SET, 'pim');
const S_POD = markOf(SET, 'pod');

const SUPPER = 'burrow-door-supper';
const U_TUMBLESOIL = markOf(SUPPER, 'tumblesoil');
const U_NUBBIN = markOf(SUPPER, 'nubbin');
const U_PLAYER = markOf(SUPPER, 'player');

/** The round door's step: where Tumblesoil stands behind it and comes out from (on the mound's east face, E17 door.ts). */
const DOOR_AT: Vec2 = [-993.2, 300.3];
/** The supper table (a slice of root, 1.2 m across, top at 0.45 m) and the spot the root is set down on. */
const TABLE_AT: Vec2 = [-989.1, 300.95];
const TABLE_TOP = 0.46;

const OLD_TALK = coverage('tumblesoil', 'nubbin', 1);
const OLD_YOU = coverage('tumblesoil', 'player', -1);
const NUB_YOU = coverage('nubbin', 'player', 1);
const MOLE_YOU = coverage('moleman', 'player', 1);
const SUP_OLD = coverage('tumblesoil', 'player', 1);
const SUP_NUB = coverage('nubbin', 'tumblesoil', -1);

/** Row 49 intro: a sack that has grown, a door that has not been shut, and a first ask. Day. */
const INTRO: SceneScript = {
  id: 'm49-loamdeep-intro',
  stage: { kind: 'world' },
  music: 'fescue',
  ambience: 'forest',
  sky: 'noon',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m49-loamdeep-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, at: W_PLAYER.at, yaw: W_PLAYER.yaw },
    { id: 'nubbin', preset: 'nubbin', at: W_NUBBIN.at, yaw: W_NUBBIN.yaw },
    { id: 'tumblesoil', preset: 'tumblesoil', hidden: true, at: DOOR_AT, yaw: W_TUMBLESOIL.yaw },
  ],
  props: [
    // The lit hall: two brass lamps either side of the doorway, and the post that is eleven days late.
    { id: 'lamp-a', prefab: 'mole-lamp-lit', at: up(-993.6, 298.7, 0.95), yaw: Math.PI / 2 },
    { id: 'lamp-b', prefab: 'mole-lamp-lit', at: up(-993.6, 302.0, 0.95), yaw: Math.PI / 2 },
    { id: 'sack', prefab: 'post-sack', at: [W_NUBBIN.at[0] + 0.5, W_NUBBIN.at[1] + 0.9], yaw: 0.6 },
  ],
  steps: [
    // Hook: ground level at the round door, a squeak, a sack that will not go over the step.
    cut(spot(WELCOME, 'door')),
    { do: 'sfx', id: 'squeak', at: 'nubbin', gain: 0.35, async: true },
    { do: 'gesture', who: 'nubbin', name: 'lean', s: 1.6, async: true },
    { do: 'wait', s: 1.0 },
    { do: 'sfx', id: 'clatter', at: 'nubbin', gain: 0.35, async: true },
    cut(NUB_YOU.single('nubbin', 'mcu')),
    { do: 'say', who: 'nubbin', text: 'Oh dear. Eleven days late, and the sack has grown.' },
    // Setup: the door opens the rest of the way on a lit hall; she comes out into the day.
    cut(spot(WELCOME, 'step')),
    { do: 'sfx', id: 'door-creak', at: up(DOOR_AT[0], DOOR_AT[1], 0.5), gain: 0.45, async: true },
    { do: 'spawn', id: 'tumblesoil' },
    { do: 'walk', who: 'tumblesoil', path: [[W_TUMBLESOIL.at[0], W_TUMBLESOIL.at[1]]], speed: 0.9 },
    cut(OLD_TALK.single('tumblesoil', 'mcu')),
    { do: 'say', who: 'tumblesoil', text: 'Nubbin. Our guest first, dear, and then the post.' },
    cut(OLD_YOU.single('tumblesoil', 'mcu')),
    { do: 'say', who: 'tumblesoil', text: 'Dear one. This door has not been shut since you carried him home.' },
    cut(OLD_YOU.single('player', 'mcu')),
    { do: 'gesture', who: 'player', name: 'tipHat', s: 1.0, async: true },
    { do: 'say', who: 'player', text: 'I heard there were jobs.' },
    // The turn: three jobs, and then the thing she is not used to saying.
    cut(OLD_YOU.single('tumblesoil', 'mcu')),
    { do: 'say', who: 'tumblesoil', text: 'Three small ones. Roots, lamps, the post. Then the Burrowfolk are yours.' },
    cut(OLD_YOU.single('player', 'mcu')),
    beat('pause'),
    cut(OLD_YOU.single('tumblesoil', 'ms', { height: 'low' })),
    { do: 'say', who: 'tumblesoil', text: 'I have never asked anyone for anything. It feels like a draught.' },
    // Button: Nubbin takes the sack in first, and the sack takes Nubbin.
    cut(NUB_YOU.single('nubbin', 'mcu')),
    { do: 'say', who: 'nubbin', text: 'Most kind, Ma\'am. I shall take the sack in first.' },
    cut(spot(WELCOME, 'wide')),
    { do: 'despawn', id: 'sack' },
    { do: 'sfx', id: 'clatter', at: 'nubbin', gain: 0.4, async: true },
    { do: 'walk', who: 'nubbin', path: [[DOOR_AT[0] + 0.9, DOOR_AT[1] + 0.2]], speed: 2.0, async: true },
    { do: 'wait', s: 1.4 },
    { do: 'sfx', id: 'thud', at: up(DOOR_AT[0], DOOR_AT[1], 0.3), gain: 0.5, async: true },
    { do: 'shake', amp: 0.025, s: 0.35 },
    { do: 'wait', s: 1.2 },
  ],
};

/** Row 49 mid: DJ Moleman at his decks, no words, one track; the family nods as one. Night. */
const MID: SceneScript = {
  id: 'm49-loamdeep-mid',
  stage: { kind: 'world' },
  music: 'mystery',
  ambience: 'cave',
  sky: 'night',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m49-loamdeep-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, at: S_PLAYER.at, yaw: S_PLAYER.yaw },
    { id: 'moleman', preset: 'dj moleman', at: S_MOLEMAN.at, yaw: S_MOLEMAN.yaw },
    { id: 'tumblesoil', preset: 'tumblesoil', at: S_TUMBLESOIL.at, yaw: S_TUMBLESOIL.yaw },
    { id: 'nubbin', preset: 'nubbin', at: S_NUBBIN.at, yaw: S_NUBBIN.yaw },
    { id: 'pim', preset: 'nubbin', name: 'Pim', scale: 0.8, look: { hat: 0x7a7e88, shirt: 0x7a7e88 }, at: S_PIM.at, yaw: S_PIM.yaw },
    { id: 'pod', preset: 'nubbin', name: 'Pod', scale: 0.8, look: { hat: 0x626672, shirt: 0x626672 }, at: S_POD.at, yaw: S_POD.yaw },
  ],
  props: [
    // The cutscene-only burrow: decks, rug, dug-in speakers, crates of records and four lamps on toadstool stools.
    { id: 'decks', prefab: 'moleman-decks', at: [-987.5, 308.15], yaw: Math.PI },
    { id: 'rug', prefab: 'moss-rug', at: [-987.5, 305.9], yaw: 0 },
    { id: 'speaker-a', prefab: 'dug-speaker', at: [-990.7, 308.9], yaw: Math.PI },
    { id: 'speaker-b', prefab: 'dug-speaker', at: [-984.3, 308.9], yaw: Math.PI },
    { id: 'crate-a', prefab: 'root-crate', at: [-983.6, 310.2], yaw: -Math.PI / 2 },
    { id: 'crate-b', prefab: 'root-crate', at: [-983.6, 311.3], yaw: -Math.PI / 2 },
    { id: 'stool-a', prefab: 'mole-stool', at: [-991.8, 303.2], yaw: 0 },
    { id: 'stool-b', prefab: 'mole-stool', at: [-983.2, 303.2], yaw: 0 },
    { id: 'stool-c', prefab: 'mole-stool', at: [-991.6, 310.9], yaw: 0 },
    { id: 'stool-d', prefab: 'mole-stool', at: [-983.4, 311.9], yaw: 0 },
    { id: 'lamp-a', prefab: 'mole-lamp-lit', at: up(-991.8, 303.2, 0.4), yaw: 0 },
    { id: 'lamp-b', prefab: 'mole-lamp-lit', at: up(-983.2, 303.2, 0.4), yaw: 0 },
    { id: 'lamp-c', prefab: 'mole-lamp-lit', at: up(-991.6, 310.9, 0.4), yaw: 0 },
    { id: 'lamp-d', prefab: 'mole-lamp-lit', at: up(-983.4, 311.9, 0.4), yaw: 0 },
  ],
  steps: [
    // Hook: ground level at the record. A needle finds the groove; one bass note you feel in the lens.
    cut(spot(SET, 'decks')),
    { do: 'sfx', id: 'static', at: up(-987.5, 308.15, 0.5), gain: 0.35, async: true },
    { do: 'wait', s: 1.1 },
    { do: 'sfx', id: 'thud', at: up(-987.5, 308.15, 0.4), gain: 0.45, async: true },
    { do: 'shake', amp: 0.02, s: 0.3 },
    { do: 'wait', s: 0.9 },
    // He looks up over his spectacles. No words, ever.
    cut(MOLE_YOU.single('moleman', 'mcu')),
    { do: 'gesture', who: 'moleman', name: 'nod', s: 0.9, async: true },
    { do: 'wait', s: 0.9 },
    { do: 'intro', who: 'moleman' },
    cut(MOLE_YOU.single('player', 'mcu')),
    { do: 'gesture', who: 'player', name: 'tipHat', s: 1.0, async: true },
    { do: 'say', who: 'player', text: 'Evening.' },
    // He points at the floor: the rug, the grass, the ground the player is standing on. Then the needle drops.
    cut(MOLE_YOU.single('moleman', 'ms')),
    { do: 'gesture', who: 'moleman', name: 'point', s: 1.2, async: true },
    { do: 'wait', s: 1.0 },
    { do: 'sfx', id: 'thud', at: up(-987.5, 305.9, 0.2), gain: 0.55, async: true },
    { do: 'music', track: 'heist', fade: 0.4 },
    { do: 'shake', amp: 0.03, s: 0.35 },
    // The track: the whole family, in a ring of lamplight, nods on the one.
    cut(spot(SET, 'wide')),
    { do: 'gesture', who: 'nubbin', name: 'nod', s: 1.6, async: true },
    { do: 'gesture', who: 'pim', name: 'nod', s: 1.6, async: true },
    { do: 'gesture', who: 'pod', name: 'nod', s: 1.6, async: true },
    { do: 'sfx', id: 'thud', at: up(-987.5, 305.9, 0.2), gain: 0.5, async: true },
    { do: 'shake', amp: 0.025, s: 0.3 },
    { do: 'wait', s: 1.6 },
    cut(spot(SET, 'crowd')),
    { do: 'gesture', who: 'player', name: 'nod', s: 1.4, async: true },
    { do: 'sfx', id: 'thud', at: up(-987.5, 305.9, 0.2), gain: 0.5, async: true },
    { do: 'shake', amp: 0.025, s: 0.3 },
    { do: 'wait', s: 1.5 },
    // The turn: she lifts her root cane and sets it down on the beat. That is the Burrowfolk saying yes.
    cut(shot('tumblesoil', 'ms', { toward: 'moleman', height: 'low' })),
    { do: 'gesture', who: 'tumblesoil', name: 'stomp', s: 0.8, async: true },
    { do: 'wait', s: 0.5 },
    { do: 'sfx', id: 'thud', at: 'tumblesoil', gain: 0.65, async: true },
    { do: 'shake', amp: 0.04, s: 0.4 },
    { do: 'wait', s: 1.4 },
    { do: 'music', track: null, fade: 0.9 },
    beat('pause'),
    cut(SUP_OLD.single('tumblesoil', 'mcu')),
    { do: 'say', who: 'tumblesoil', text: 'He played it to the end, dear one. For anyone else, he stops at the chorus.' },
    cut(SUP_OLD.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Is that a yes?' },
    cut(SUP_OLD.single('tumblesoil', 'mcu')),
    { do: 'say', who: 'tumblesoil', text: 'From him it is a whole supper.' },
    // Button: the next record goes on, and the lamps jump in their glass on the very first beat.
    cut(spot(SET, 'decks')),
    { do: 'sfx', id: 'static', at: up(-987.5, 308.15, 0.5), gain: 0.3, async: true },
    { do: 'wait', s: 0.9 },
    { do: 'sfx', id: 'thud', at: up(-987.5, 308.15, 0.4), gain: 0.55, async: true },
    { do: 'shake', amp: 0.03, s: 0.4 },
    { do: 'wait', s: 1.3 },
  ],
};

/** Row 49 outro: a table on the grass, a root set on it, and the ground says yes. Night. */
const OUTRO: SceneScript = {
  id: 'm49-loamdeep-outro',
  stage: { kind: 'world' },
  music: 'turfton-dusk',
  ambience: 'night',
  sky: 'night',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m49-loamdeep-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, at: U_PLAYER.at, yaw: U_PLAYER.yaw },
    { id: 'nubbin', preset: 'nubbin', at: U_NUBBIN.at, yaw: U_NUBBIN.yaw },
    { id: 'tumblesoil', preset: 'tumblesoil', held: 'root-bundle', at: U_TUMBLESOIL.at, yaw: U_TUMBLESOIL.yaw },
  ],
  props: [
    // The supper: a root-slice table dragged out onto the grass, a lit lamp on each side of it, grub bread and a jar.
    { id: 'table', prefab: 'mole-table-round', at: TABLE_AT, yaw: 0 },
    { id: 'bread', prefab: 'grub-bread', at: up(TABLE_AT[0] + 0.25, TABLE_AT[1] + 0.2, TABLE_TOP), yaw: 0.4 },
    { id: 'jar', prefab: 'grub-jar', at: up(TABLE_AT[0] - 0.05, TABLE_AT[1] - 0.3, TABLE_TOP), yaw: 0 },
    { id: 'stool-a', prefab: 'mole-stool', at: [TABLE_AT[0], TABLE_AT[1] + 1.4], yaw: 0 },
    { id: 'stool-b', prefab: 'mole-stool', at: [TABLE_AT[0] + 0.2, TABLE_AT[1] - 1.5], yaw: 0 },
    { id: 'lamp-a', prefab: 'mole-lamp-lit', at: up(TABLE_AT[0] - 1.0, TABLE_AT[1] - 1.6, 0.4), yaw: 0 },
    { id: 'lamp-stool-a', prefab: 'mole-stool', at: [TABLE_AT[0] - 1.0, TABLE_AT[1] - 1.6], yaw: 0 },
    { id: 'lamp-b', prefab: 'mole-lamp-lit', at: up(-993.6, 298.6, 0.95), yaw: Math.PI / 2 },
    { id: 'lamp-c', prefab: 'mole-lamp-lit', at: up(-993.6, 302.0, 0.95), yaw: Math.PI / 2 },
    { id: 'root', prefab: 'root-bundle', at: up(TABLE_AT[0] - 0.1, TABLE_AT[1], TABLE_TOP), yaw: 0.9, hidden: true },
  ],
  steps: [
    // Hook: ground level along the lit lamps to the open door; a napkin tucked in too early.
    cut(spot(SUPPER, 'lamps')),
    { do: 'sfx', id: 'clink', at: 'nubbin', gain: 0.3, async: true },
    { do: 'wait', s: 0.9 },
    cut(SUP_NUB.single('nubbin', 'mcu')),
    { do: 'say', who: 'nubbin', text: 'Is it supper? It feels very much like supper.' },
    // Setup: not yet. The table comes first, and the root.
    cut(SUP_OLD.single('tumblesoil', 'mcu')),
    { do: 'say', who: 'tumblesoil', text: 'Presently, dear. First, the table.' },
    cut(shot('tumblesoil', 'ms', { toward: 'player', side: 70 })),
    { do: 'gesture', who: 'tumblesoil', name: 'bow', s: 1.2, async: true },
    { do: 'wait', s: 0.6 },
    { do: 'hold', who: 'tumblesoil', prop: null },
    { do: 'spawn', id: 'root' },
    { do: 'sfx', id: 'thud', at: up(TABLE_AT[0], TABLE_AT[1], TABLE_TOP), gain: 0.4, async: true },
    { do: 'wait', s: 1.0 },
    // The sincere beat: no gag on top of it.
    cut(SUP_OLD.single('tumblesoil', 'mcu')),
    { do: 'say', who: 'tumblesoil', text: 'We dig where we are asked, dear one. And nobody ever asks.' },
    cut(SUP_OLD.single('player', 'mcu')),
    beat('pause'),
    { do: 'say', who: 'player', text: 'I am asking.' },
    cut(SUP_OLD.single('tumblesoil', 'mcu')),
    beat('beat'),
    { do: 'say', who: 'tumblesoil', text: 'Then we shall dig. Ask on the day, and the ground will be ready.' },
    // The turn: the ground answers. One bass note through the table, and the root rolls to the player's side.
    { do: 'music', track: null, fade: 0.6 },
    { do: 'sfx', id: 'thud', at: up(TABLE_AT[0], TABLE_AT[1], 0.2), gain: 0.6, async: true },
    { do: 'shake', amp: 0.035, s: 0.4 },
    cut(shot('player', 'mcu', { toward: 'tumblesoil' })),
    { do: 'wait', s: 0.8 },
    // Button: Nubbin interprets, and the lamps jump once more.
    cut(SUP_NUB.single('nubbin', 'mcu')),
    { do: 'say', who: 'nubbin', text: 'That is a yes, Ma\'am. He is very loud about it.' },
    { do: 'sfx', id: 'thud', at: up(TABLE_AT[0], TABLE_AT[1], 0.2), gain: 0.6, async: true },
    { do: 'shake', amp: 0.03, s: 0.35 },
    cut(spot(SUPPER, 'wide')),
    { do: 'wait', s: 1.6 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm49-loamdeep-intro': INTRO,
  'm49-loamdeep-mid': MID,
  'm49-loamdeep-outro': OUTRO,
};
