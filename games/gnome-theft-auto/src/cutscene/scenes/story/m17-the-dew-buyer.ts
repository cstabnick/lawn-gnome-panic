// Story row 17: The Dew Buyer. Granny's stolen-back Dew keeps going missing, one tanker a night, always west; the player tails
// it to Trellisdown Vineyard (first reach), where head gardener Chicory Snips feeds it to the frost-pots and the Countess
// glimpses the vines from her terrace with an HOA clipboard. She never sees the player; the clipboard is never read.
// Notes: docs/design/gnome-theft-auto/direction/scenes/m17-the-dew-buyer-{intro,mid,outro}.md
import type { ScriptActor, SceneScript } from '../../script';
import { beat, coverage, cut, shot } from '../../direct';
import { carMark, markOf, pathOf, spot, up } from './kit';

type Look = NonNullable<ScriptActor['look']>;

/** The unmarked tanker's driver (no preset; nobody learns his name). */
const DRIVER_LOOK: Look = { hat: 0x2a2a30, shirt: 0x33343a, beard: null };

// ---- Stage marks (quests/stages/story/s17-the-dew-buyer.ts) --------------------------------------------------------------
const TABLE = 'granny-map-table';
const GATE = 'trellisdown-gate';
const GRANNY = markOf(TABLE, 'granny');
const TABLE_PLAYER = markOf(TABLE, 'player');
const TANKER_PASS = pathOf(TABLE, 'tanker-pass');

const CHICORY_GATE = markOf(GATE, 'chicory', 0);
const GATE_PLAYER = markOf(GATE, 'player', 0);
const CHICORY_POTS = markOf(GATE, 'chicory', 1);
const POTS_PLAYER = markOf(GATE, 'player', 1);
const TANKER = carMark(GATE, 'dew-tanker');
const TANKER_IN = pathOf(GATE, 'tanker-in');

/** The seed-tray table in Granny's yard: scale 1.4, top at 0.84 m. */
const TABLE_AT: [number, number] = [-48, 324];
const TABLE_TOP = 0.86;

const GRANNY_PLAYER = coverage('granny', 'player', 1);
const CHICORY_PLAYER = coverage('chicory', 'player', -1);

/** Row 17 intro: Granny lifts a pie tin off a map; a tanker goes by on cue. Day. */
const INTRO: SceneScript = {
  id: 'm17-the-dew-buyer-intro',
  stage: { kind: 'world' },
  music: 'warm',
  ambience: 'meadow',
  sky: 'noon',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m17-the-dew-buyer-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, at: TABLE_PLAYER.at, yaw: TABLE_PLAYER.yaw },
    { id: 'granny', preset: 'granny', held: null, at: GRANNY.at, yaw: GRANNY.yaw },
    { id: 'driver', name: 'Driver', look: DRIVER_LOOK, hidden: true, seatedIn: 'tanker', at: [0, 0] },
  ],
  vehicles: [
    { id: 'tanker', kind: 'hoa-van', at: [10, 390], yaw: Math.PI, tint: 0x34363a, hidden: true },
  ],
  props: [
    { id: 'map', prefab: 'folded-map', at: up(TABLE_AT[0], TABLE_AT[1], TABLE_TOP), yaw: 0.2, size: 0.9 },
    { id: 'tin', prefab: 'pie-tin', at: up(TABLE_AT[0] + 0.1, TABLE_AT[1] + 0.05, TABLE_TOP + 0.02), yaw: 0 },
  ],
  steps: [
    // Hook: the pie tin comes up like a cloche, and the first line is a complaint.
    { do: 'despawn', id: 'tin' },
    { do: 'hold', who: 'granny', prop: 'pie-tin' },
    { do: 'sfx', id: 'clatter', at: 'granny', gain: 0.4, async: true },
    cut(GRANNY_PLAYER.single('granny', 'mcu')),
    { do: 'say', who: 'granny', text: 'Sugar, the Dew you brought me keeps walking off.' },
    // The map, from above: a pencil line that leaves the page going west.
    { do: 'sfx', id: 'paper', at: 'granny', gain: 0.4, async: true },
    cut({ kind: 'cut', pos: up(TABLE_AT[0] + 0.2, TABLE_AT[1] + 1.1, 1.75), look: up(TABLE_AT[0], TABLE_AT[1], TABLE_TOP), fov: 40 }),
    { do: 'wait', s: 1.6 },
    cut(GRANNY_PLAYER.single('granny', 'mcu')),
    { do: 'say', who: 'granny', text: 'One tanker a night. Always west. Never a plate on it.' },
    cut(GRANNY_PLAYER.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Who is buying?' },
    cut(GRANNY_PLAYER.single('granny', 'mcu')),
    { do: 'say', who: 'granny', text: 'That is what I pay you to find. In pie.' },
    // The turn: an engine that is not a combine. Right on time.
    { do: 'sfx', id: 'engine-rev', at: up(-30, 330, 1), gain: 0.35, async: true },
    { do: 'spawn', id: 'driver' },
    { do: 'spawn', id: 'tanker', at: [10, 390], yaw: Math.PI },
    { do: 'cam', shot: { kind: 'track', pos: up(-52.5, 328.5, 1.3), who: 'tanker', fov: 46 } },
    { do: 'drive', vehicle: 'tanker', path: TANKER_PASS, speed: 15, depart: false, arrive: false, async: true },
    { do: 'wait', s: 5.5 },
    cut(GRANNY_PLAYER.single('granny', 'mcu')),
    { do: 'say', who: 'granny', text: 'There. Right on time, headlamps off.' },
    cut(GRANNY_PLAYER.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Going west.' },
    // The objective in her voice, then the tin goes back over the map.
    cut(GRANNY_PLAYER.single('granny', 'mcu')),
    { do: 'say', who: 'granny', text: 'Tail it from Route South. Stay well back. They know your hat.' },
    { do: 'sfx', id: 'clatter', at: 'granny', gain: 0.4, async: true },
    { do: 'wait', s: 0.8 },
    cut(GRANNY_PLAYER.single('granny', 'ms', { height: 'high' })),
    { do: 'say', who: 'granny', text: 'Bring me a name. I will bring the pie.' },
  ],
};

/** Row 17 mid: the tanker at the vineyard gate; Chicory lets it in and looks at the lane. Dusk. */
const MID: SceneScript = {
  id: 'm17-the-dew-buyer-mid',
  stage: { kind: 'world' },
  music: 'tension',
  ambience: 'garden',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m17-the-dew-buyer-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, at: GATE_PLAYER.at, yaw: GATE_PLAYER.yaw },
    { id: 'chicory', preset: 'chicory', at: CHICORY_GATE.at, yaw: CHICORY_GATE.yaw },
    { id: 'driver', name: 'Driver', look: DRIVER_LOOK, seatedIn: 'tanker', at: [0, 0] },
  ],
  vehicles: [
    { id: 'tanker', kind: TANKER.kind, at: TANKER.at, yaw: TANKER.yaw, tint: 0x34363a, headlights: true },
  ],
  steps: [
    // Hook: the engine idling at the arch, and the horn that makes Chicory look up.
    cut(spot(GATE, 'gate')),
    { do: 'horn', vehicle: 'tanker' },
    { do: 'wait', s: 1.2 },
    cut(CHICORY_PLAYER.single('chicory', 'mcu')),
    { do: 'say', who: 'chicory', text: 'Late. The frost does not wait for invoices.' },
    { do: 'intro', who: 'chicory' },
    // The gate chain, the tanker rolling in between the pots.
    { do: 'sfx', id: 'creak', at: 'chicory', gain: 0.45, async: true },
    { do: 'gesture', who: 'chicory', name: 'beckon', s: 1.2, async: true },
    { do: 'cam', shot: { kind: 'track', pos: up(-1124, -62, 1.5), who: 'tanker', fov: 48 } },
    { do: 'drive', vehicle: 'tanker', path: TANKER_IN, speed: 4.5, arrive: false, async: true },
    { do: 'wait', s: 4.5 },
    // The turn: he does not follow it. He looks down the lane, at the verge where the player is not supposed to be.
    cut(CHICORY_PLAYER.single('chicory', 'ms')),
    { do: 'face', who: 'chicory', at: [GATE_PLAYER.at[0], GATE_PLAYER.at[1]], s: 0.9 },
    beat('beat'),
    { do: 'say', who: 'chicory', text: 'Hm.' },
    cut(CHICORY_PLAYER.single('player', 'mcu')),
    beat('pause'),
    // Button: he turns and walks after the tanker, shears swinging; the engine fades into the vines.
    cut(CHICORY_PLAYER.single('chicory', 'ms', { height: 'low' })),
    { do: 'sfx', id: 'crunch', at: 'chicory', gain: 0.4, async: true },
    { do: 'walk', who: 'chicory', path: [[-1140, -73]], speed: 1.6 },
  ],
};

/** Row 17 outro: night; the frost-pots burn Dew; the Countess on her terrace, glimpsed; the player slips away. */
const OUTRO: SceneScript = {
  id: 'm17-the-dew-buyer-outro',
  stage: { kind: 'world' },
  music: 'mystery',
  ambience: 'garden',
  sky: 'night',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m17-the-dew-buyer-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, held: 'field-camera', at: POTS_PLAYER.at, yaw: POTS_PLAYER.yaw },
    { id: 'chicory', preset: 'chicory', held: 'watering-can', at: CHICORY_POTS.at, yaw: CHICORY_POTS.yaw },
    // On the raised terrace (1.2 m above the forecourt): an exact [x, y, z].
    { id: 'wisteria', preset: 'wisteria', held: 'hoa-clipboard', at: up(-1138, 19.5, 1.2), yaw: Math.PI },
  ],
  steps: [
    // Hook: the can tips, the pot takes the fire, and he says the line he is not allowed to say to anyone.
    cut(shot('chicory', 'ms', { height: 'low' })),
    { do: 'gesture', who: 'chicory', name: 'bow', s: 1.5, async: true },
    { do: 'sfx', id: 'pour', at: 'chicory', gain: 0.5, async: true },
    { do: 'wait', s: 1.1 },
    { do: 'sfx', id: 'pop', at: 'chicory', gain: 0.5 },
    cut(shot('chicory', 'mcu', { height: 'low' })),
    { do: 'say', who: 'chicory', text: 'Pots. All I am allowed to light.' },
    // The player, flat to the vines, the shutter.
    cut(shot('player', 'mcu', { toward: 'chicory', height: 'high' })),
    { do: 'sfx', id: 'snap', at: 'player', gain: 0.4, async: true },
    { do: 'shake', amp: 0.02, s: 0.3 },
    { do: 'say', who: 'player', text: 'Dew. In a vineyard.' },
    // The glimpse: very long lens across the lane. She lifts her glasses to the vines, writes, never turns.
    { do: 'sfx', id: 'paper', at: 'wisteria', gain: 0.15, async: true },
    cut({ kind: 'cut', pos: up(-1131, -80, 1.8), look: 'wisteria', fov: 7 }),
    { do: 'gesture', who: 'wisteria', name: 'think', s: 2.0, async: true },
    { do: 'wait', s: 3.0 },
    cut(shot('player', 'mcu', { toward: 'chicory', height: 'high' })),
    { do: 'sfx', id: 'cloth', at: 'player', gain: 0.35, async: true },
    beat('pause'),
    // Button: all the pots, glowing, and the player slipping out of the bottom of the frame.
    cut({ kind: 'cut', pos: up(-1119, -98, 3.2), look: up(-1135, -82, 0.6), fov: 46 }),
    { do: 'walk', who: 'player', path: [[-1119, -97]], speed: 1.5, async: true },
    { do: 'sfx', id: 'rustle', at: 'player', gain: 0.4, async: true },
    { do: 'wait', s: 3.0 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm17-the-dew-buyer-intro': INTRO,
  'm17-the-dew-buyer-mid': MID,
  'm17-the-dew-buyer-outro': OUTRO,
};
