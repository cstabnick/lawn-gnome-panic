// Story row 25: One Leg to Stand On. Wader's Rest at dusk: the Flock of the One Leg stand on one leg before the Standing Lady,
// Brother Godwit wobbles and owes two cups, and Mother Saxifrage Wader offers Driftwood's raft for one sermon on one leg.
// After the sermon (the hold game, E17) she says the one line that is never explained, looking straight at the player: the
// Even Cut, on the longest day. Back at the trailer Driftwood has his raft, with a feather he did not order, and the player does
// not laugh. Funny first, ominous on the last line (the mid scene); nothing answers it.
// Notes: docs/design/gnome-theft-auto/direction/scenes/m25-one-leg-to-stand-on-{intro,mid,outro}.md
import type { ScriptActor, SceneScript } from '../../script';
import { beat, coverage, cut, exchangeLooks, shot } from '../../direct';
import { carMark, markOf, spot, up } from './kit';

type Look = NonNullable<ScriptActor['look']>;

/** The Flock wear grey (the Standing Lady alone is pink): same colours as societies/flock/life.ts. */
const GREY: Look = { hat: 0x9aa0a8, shirt: 0x8d9096, pants: 0x6f7378 };

// ---- Stage marks (quests/stages/story/s25-one-leg-to-stand-on.ts) -------------------------------------------------------------
const CIRCLE = 'waders-circle';
const HITCH = 'driftwood-hitch';
const MOTHER = markOf(CIRCLE, 'saxifrage');
const GODWIT = markOf(CIRCLE, 'godwit');
const CIRCLE_PLAYER = markOf(CIRCLE, 'player');
const DRIFTWOOD = markOf(HITCH, 'driftwood');
const HITCH_PLAYER = markOf(HITCH, 'player');
const COMBINE = carMark(HITCH, 'hitch-combine');

/** The raft, towed to a stop behind the combine (east of the hitch), nose to the trailer. */
const RAFT_AT: [number, number] = [43.5, 458.6];

const SAX = coverage('saxifrage', 'player', 1);
const SAX_GOD = coverage('saxifrage', 'godwit', -1);
const DRIFT = coverage('driftwood', 'player', 1);

/** Row 25 intro: the Flock on one leg, Godwit's thought, and the terms of the raft. Dusk. */
const INTRO: SceneScript = {
  id: 'm25-one-leg-to-stand-on-intro',
  stage: { kind: 'world' },
  music: 'mystery',
  ambience: 'water',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m25-one-leg-to-stand-on-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, at: CIRCLE_PLAYER.at, yaw: CIRCLE_PLAYER.yaw },
    { id: 'saxifrage', preset: 'saxifrage', at: MOTHER.at, yaw: MOTHER.yaw },
    { id: 'godwit', name: 'Godwit', look: GREY, held: 'reed-tea-cup', at: GODWIT.at, yaw: GODWIT.yaw },
  ],
  steps: [
    // Hook: the whole Flock on one leg before a barn-sized pink flamingo, and one of them is going.
    cut(spot(CIRCLE, 'lady')),
    { do: 'gesture', who: 'godwit', name: 'one-leg', s: 2.2, async: true },
    { do: 'sfx', id: 'creak', at: 'godwit', gain: 0.35, async: true },
    { do: 'wait', s: 1.8 },
    { do: 'gesture', who: 'godwit', name: 'flinch', s: 0.9, async: true },
    { do: 'sfx', id: 'clink', at: 'godwit', gain: 0.4, async: true },
    { do: 'wait', s: 1.0 },
    // Setup: the sermon's first rule, applied to a cup of tea.
    ...exchangeLooks('saxifrage', 'godwit', 0.1),
    cut(SAX_GOD.single('saxifrage', 'mcu')),
    { do: 'say', who: 'saxifrage', text: 'Brother Godwit. You have had a thought.' },
    { do: 'intro', who: 'saxifrage' },
    cut(SAX_GOD.single('godwit', 'mcu')),
    { do: 'say', who: 'godwit', text: 'I have, Mother. I am holding the cup.' },
    cut(SAX_GOD.single('saxifrage', 'mcu')),
    { do: 'say', who: 'saxifrage', text: 'Then it is owed two. So it is stood.' },
    { do: 'stinger', id: 'comic' },
    // The turn: she finds the gnome on two legs.
    { do: 'face', who: 'saxifrage', at: 'player', s: 0.6 },
    cut(SAX.single('saxifrage', 'mcu', { height: 'low' })),
    { do: 'say', who: 'saxifrage', text: 'A gnome on two legs. Both on the ground. How brave.' },
    cut(SAX.single('player', 'mcu')),
    { do: 'say', who: 'player', text: "I am here for Driftwood's raft." },
    cut(SAX.single('saxifrage', 'mcu', { height: 'low' })),
    { do: 'say', who: 'saxifrage', text: 'Stand one sermon on one leg, and the raft is yours. So it is stood.' },
    cut(SAX.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'How long is a sermon?' },
    // Button: the objective in her voice, over her shoulder, with Godwit going again behind her.
    cut(SAX.single('saxifrage', 'ms', { height: 'low' })),
    { do: 'gesture', who: 'saxifrage', name: 'beckon', s: 1.2, async: true },
    { do: 'say', who: 'saxifrage', text: 'As long as the Lady needs. Come. Find your leg, and do not let go.' },
    { do: 'gesture', who: 'godwit', name: 'flinch', s: 0.9, async: true },
    { do: 'sfx', id: 'clink', at: 'godwit', gain: 0.4 },
  ],
};

/** Row 25 mid (after the sermon): the last words. Funny for two lines, then the line that is never explained. Dusk. */
const MID: SceneScript = {
  id: 'm25-one-leg-to-stand-on-mid',
  stage: { kind: 'world' },
  music: 'mystery',
  ambience: 'water',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m25-one-leg-to-stand-on-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, at: CIRCLE_PLAYER.at, yaw: CIRCLE_PLAYER.yaw },
    { id: 'saxifrage', preset: 'saxifrage', at: MOTHER.at, yaw: MOTHER.yaw },
  ],
  steps: [
    // Hook: she is pleased, and loud about it.
    cut(SAX.single('saxifrage', 'ms')),
    { do: 'sfx', id: 'cloth', at: 'saxifrage', gain: 0.35, async: true },
    { do: 'gesture', who: 'saxifrage', name: 'cheer', s: 1.4, async: true },
    { do: 'say', who: 'saxifrage', text: 'Well stood, friend. The raft waits at the east gate, with a feather on.' },
    cut(SAX.single('player', 'mcu')),
    { do: 'sfx', id: 'flutter', at: 'saxifrage', gain: 0.3, async: true },
    { do: 'say', who: 'player', text: 'Why a feather?' },
    cut(SAX.single('saxifrage', 'mcu', { height: 'low' })),
    { do: 'say', who: 'saxifrage', text: 'Do not ask about the feather.' },
    // The turn: the music goes, she stops being a hostess, and looks at the one person in the circle.
    beat('beat'),
    { do: 'sfx', id: 'creak', at: up(-1130, -668, 3), gain: 0.3, async: true },
    { do: 'music', track: null, fade: 0.8 },
    { do: 'face', who: 'saxifrage', at: 'player', s: 0.5 },
    cut(SAX.single('saxifrage', 'mcu')),
    { do: 'wait', s: 1.0 },
    { do: 'say', who: 'saxifrage', text: 'On the longest day comes the Even Cut.' },
    cut(SAX.single('player', 'mcu')),
    beat('pause'),
    cut(SAX.single('saxifrage', 'mcu')),
    { do: 'say', who: 'saxifrage', text: 'I do not know why I know it. So it is stood.' },
    // Button: the player's face, and nothing said.
    cut(SAX.single('player', 'mcu')),
    { do: 'sfx', id: 'rustle', at: 'player', gain: 0.25, async: true },
    { do: 'wait', s: 2.4 },
  ],
};

/** Row 25 outro: the raft comes home with a feather; Driftwood misses the point; the player does not. Golden hour. */
const OUTRO: SceneScript = {
  id: 'm25-one-leg-to-stand-on-outro',
  stage: { kind: 'world' },
  music: 'turfton-dusk',
  ambience: 'wind',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m25-one-leg-to-stand-on-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, at: HITCH_PLAYER.at, yaw: HITCH_PLAYER.yaw },
    { id: 'driftwood', preset: 'driftwood', at: DRIFTWOOD.at, yaw: DRIFTWOOD.yaw },
  ],
  vehicles: [
    { id: 'combine', kind: COMBINE.kind, from: 'player', at: COMBINE.at, yaw: COMBINE.yaw },
  ],
  props: [
    { id: 'raft', prefab: 'walnut-dinghy', at: up(RAFT_AT[0], RAFT_AT[1], 0), yaw: Math.PI / 2, size: 3.4 },
    { id: 'plume', prefab: 'flamingo-plume', at: up(RAFT_AT[0] + 0.6, RAFT_AT[1], 1.1), yaw: 0.4, size: 0.9 },
    { id: 'cup', prefab: 'reed-tea-cup', at: up(RAFT_AT[0] - 0.4, RAFT_AT[1] + 0.2, 0.62), yaw: 0 },
  ],
  steps: [
    // Hook: the raft, with a pink plume tied to its tiller, and a man seeing it for the first time.
    cut(spot(HITCH, 'raft')),
    { do: 'sfx', id: 'creak', at: up(RAFT_AT[0], RAFT_AT[1], 0.5), gain: 0.4, async: true },
    { do: 'walk', who: 'driftwood', path: [[RAFT_AT[0] - 3.4, RAFT_AT[1] - 2.2]], speed: 1.5, async: true },
    { do: 'wait', s: 2.4 },
    { do: 'face', who: 'driftwood', at: 'player', s: 0.4 },
    cut(DRIFT.single('driftwood', 'mcu')),
    { do: 'say', who: 'driftwood', text: 'My raft. She has a feather. Why has my raft got a feather?' },
    cut(DRIFT.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'They blessed it.' },
    cut(DRIFT.single('driftwood', 'mcu')),
    { do: 'say', who: 'driftwood', text: 'She was blessed already. The canal did that.' },
    // The turn: the favour, and the question he asks the way he asks the tide.
    cut(DRIFT.single('driftwood', 'mcu')),
    { do: 'say', who: 'driftwood', text: 'Did you stand the whole sermon? What did she preach?' },
    cut(DRIFT.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'The Even Cut. On the longest day.' },
    cut(DRIFT.single('driftwood', 'ms', { height: 'low' })),
    { do: 'gesture', who: 'driftwood', name: 'lean', s: 1.4, async: true },
    { do: 'say', who: 'driftwood', text: 'Longest day. Good light for sailing, that.' },
    // Button: he rocks, humming, delighted with the raft; the player looks west and does not laugh.
    cut(shot('player', 'mcu', { toward: 'driftwood' })),
    { do: 'music', track: null, fade: 1.2 },
    { do: 'sfx', id: 'rustle', at: 'player', gain: 0.25, async: true },
    { do: 'wait', s: 2.6 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm25-one-leg-to-stand-on-intro': INTRO,
  'm25-one-leg-to-stand-on-mid': MID,
  'm25-one-leg-to-stand-on-outro': OUTRO,
};
