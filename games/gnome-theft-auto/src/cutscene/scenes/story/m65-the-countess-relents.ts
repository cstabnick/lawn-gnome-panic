// Story row 65 (m65-the-countess-relents): The Countess Relents. Three scenes. Intro (day, Brassknock Manor's terrace): Countess Wisteria at a
// chart table with a pencil line through her vineyard: she funded the Even Line for six harvests and never asked where it ran, and it runs
// through her first vine. Chicory stands by with the key to the Combine's shield grates, as long as his arm, carried like a crook ("It has
// been mislaid four times"); the Unmown is the one corner no mower goes (R-234), and she does not apologise: she adjusts the arrangements.
// Mid (golden, the Unmown Ranger Station's yard, first card): Head Ranger Burdock Haybright, who has never been to Brassknock and has opinions
// about mowing, takes the vine in and tells the player to wipe their boots. Outro (dusk): the vine in the earth by the hut wall, the book
// written, Chicory arriving on foot from the meadow with the key, which he gives over ("Both hands") and a watering can, and then a call:
// the Countess, from her terrace, who paid for six harvests and never looked, says she is looking now, and thank you, and it costs her. All
// dressing (the chart table, the key, the crate, the planted vine, the book) is cutscene-only.
// Notes: docs/design/gnome-theft-auto/direction/scenes/countess-relents-{intro,mid,outro}.md
import type { SceneScript, Vec2, Vec3 } from '../../script';
import { beat, coverage, cut, pushIn, reaction, shot } from '../../direct';
import { markOf, spot, up } from './kit';

const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

/** The terrace is a walkable rooftop 1.2 m above the forecourt gravel (country/manor.ts). */
const TERRACE_LIFT = 1.2;
/** Brassknock Manor's terrace point at ground + the terrace lift. */
const terrace = (p: Vec2, dy = 0): Vec3 => up(p[0], p[1], TERRACE_LIFT + dy);

// ---- Brassknock Manor, the terrace by day (intro) -------------------------------------------------------------------------------
const TERR = 'manor-terrace-day';
const T_WISTERIA = markOf(TERR, 'wisteria');
const T_CHICORY = markOf(TERR, 'chicory');
const T_PLAYER = markOf(TERR, 'player');
/** The chart table sits on the terrace between the Countess and the forecourt. */
const MAP_AT: Vec2 = [-1141.6, 19.2];

const W_P = coverage('wisteria', 'player', -1);
const W_C = coverage('wisteria', 'chicory', 1);

/** Row 65 intro, afternoon: a pencil line, a first vine and a key as long as an arm; the Countess adjusts the arrangements. */
const INTRO: SceneScript = {
  id: 'countess-relents-intro',
  stage: { kind: 'world' },
  music: 'mystery',
  ambience: 'garden',
  sky: 'noon',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/countess-relents-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, held: null, at: T_PLAYER.at, yaw: T_PLAYER.yaw },
    // On the raised terrace, 1.2 m above the gravel: an exact [x, y, z].
    { id: 'wisteria', preset: 'wisteria', held: 'kiln-feather-quill', at: terrace(T_WISTERIA.at), yaw: T_WISTERIA.yaw },
    { id: 'chicory', preset: 'chicory', held: 'shield-grate-key', at: terrace(T_CHICORY.at), yaw: T_CHICORY.yaw },
  ],
  props: [
    // The chart table, the map on it with its drawn line and its red X, held flat at the corners by two thimble glasses.
    { id: 'chart', prefab: 'map-table', at: terrace(MAP_AT), yaw: 0, size: 1.9, by: 'w' },
    { id: 'plan', prefab: 'folded-map', at: terrace(MAP_AT, 0.7), yaw: 0.2, size: 0.95, by: 'w' },
    { id: 'glass-a', prefab: 'martini-glass', at: terrace([-1142.5, 19.0], 0.68), yaw: 0, size: 0.18, by: 'h' },
    { id: 'glass-b', prefab: 'martini-glass', at: terrace([-1140.7, 19.5], 0.68), yaw: 0, size: 0.18, by: 'h' },
  ],
  steps: [
    // Hook: a long chart table in afternoon light, a pencil moving along a straight edge, and a gardener holding a brass key like a crook.
    cut(spot(TERR, 'wide')),
    { do: 'sfx', id: 'paper', at: 'wisteria', gain: 0.4, async: true },
    { do: 'gesture', who: 'wisteria', name: 'point', s: 1.8, async: true },
    { do: 'wait', s: 2.2 },
    cut(W_P.single('wisteria', 'mcu', { height: 'low' })),
    { do: 'say', who: 'wisteria', text: 'Six harvests I paid for a line. I never asked where it ran.' },
    // The line is shown, not told: the red X on the first vine.
    cut(spot(TERR, 'table')),
    { do: 'sfx', id: 'paper', at: 'wisteria', gain: 0.35, async: true },
    { do: 'wait', s: 1.3 },
    cut(W_P.single('wisteria', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'wisteria', name: 'point', s: 1.0, async: true },
    { do: 'say', who: 'wisteria', text: 'It runs through my first vine.' },
    ...reaction('player', { toward: 'wisteria', size: 'mcu', hold: 'tiny' }),
    { do: 'say', who: 'player', text: 'The Even Line.' },
    cut(W_C.single('wisteria', 'mcu', { height: 'low' })),
    { do: 'say', who: 'wisteria', text: 'Very straight. One has never trusted a straight thing that is not a hedge.' },
    // Setup: Chicory, who loves the vine, says the quiet word: there is one corner no mower goes.
    cut(W_C.single('chicory', 'mcu')),
    { do: 'sfx', id: 'rustle', at: 'chicory', gain: 0.25, async: true },
    beat('beat'),
    { do: 'say', who: 'chicory', text: 'There is one corner no mower goes. The Unmown.' },
    // The turn: she decides, in the voice of a woman reading out a pruning schedule.
    cut(W_C.single('wisteria', 'mcu', { height: 'low' })),
    { do: 'say', who: 'wisteria', text: 'Then the vine goes there. Chicory digs. You drive.' },
    // The key: a brass absurdity in the head gardener's hands, which she holds out for the one joke she allows.
    cut(shot('chicory', 'ms', { toward: 'wisteria', side: 25 })),
    { do: 'sfx', id: 'keys', at: 'chicory', gain: 0.5, async: true },
    { do: 'gesture', who: 'chicory', name: 'point', s: 1.0, async: true },
    { do: 'wait', s: 1.0 },
    cut(W_C.single('wisteria', 'mcu', { height: 'low' })),
    { do: 'say', who: 'wisteria', text: 'My great-grandmother had it cut large, so it could not be mislaid.' },
    cut(W_C.single('chicory', 'mcu')),
    { do: 'say', who: 'chicory', text: 'It has been mislaid four times.' },
    cut(W_C.single('wisteria', 'mcu', { height: 'low' })),
    { do: 'say', who: 'wisteria', text: "The Combine's shield grates open to it. One merely observes." },
    // The sincere beat: no gag on top of it.
    cut(W_P.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Why help us?' },
    { do: 'music', track: null, fade: 0.5 },
    cut(pushIn('wisteria', 'mcu', 5.2, { to: 'cu', toward: 'player', side: -25, height: 'low' })),
    beat('silence'),
    { do: 'say', who: 'wisteria', text: 'One does not apologise. One adjusts the arrangements.' },
    // Button: the opera glasses come down; she looks, for the first time, at the hill.
    { do: 'music', track: 'warm', fade: 1.0 },
    cut(W_P.single('wisteria', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'wisteria', name: 'bow', s: 1.2, async: true },
    { do: 'say', who: 'wisteria', text: 'Mind the vine, dear. It was here first.' },
    cut(spot(TERR, 'wide')),
    { do: 'face', who: 'wisteria', yaw: Math.PI, s: 1.0, async: true },
    { do: 'wait', s: 1.6 },
  ],
};

// ---- The Unmown Ranger Station, the yard (mid, outro) ------------------------------------------------------------------------------
const YARD = 'unmown-station-yard';
const Y_BURDOCK_MEET = markOf(YARD, 'burdock haybright', 0);
const Y_PLAYER_MEET = markOf(YARD, 'player', 0);
const Y_BURDOCK_PLANT = markOf(YARD, 'burdock haybright', 1);
const Y_CHICORY = markOf(YARD, 'chicory');
const Y_PLAYER_PLANT = markOf(YARD, 'player', 1);
/** The hut's door and where the planting is (unmown/station.ts: the hut at (-1560, -1148), the east wall at x -1553.9). */
const HUT_DOOR: Vec2 = [-1560, -1141.4];
const PLANTING: Vec2 = [-1552.2, -1147.4];

const B_P = coverage('burdock', 'player', 1);

/** Row 65 mid, golden: a ranger who has opinions about mowing, a crate, and a pair of boots to be wiped. */
const MID: SceneScript = {
  id: 'countess-relents-mid',
  stage: { kind: 'world' },
  music: 'fescue',
  ambience: 'meadow',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/countess-relents-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, held: null, at: Y_PLAYER_MEET.at, yaw: Y_PLAYER_MEET.yaw },
    { id: 'burdock', preset: 'burdock haybright', held: null, at: HUT_DOOR, yaw: towards(HUT_DOOR, Y_BURDOCK_MEET.at) },
  ],
  props: [
    // The crate, set down on the grass at the player's feet, with its one bunch of grapes.
    { id: 'crate', prefab: 'first-vine-pot', at: up(-1547.4, -1137.8, 0), yaw: 0.5, size: 0.8, by: 'h' },
  ],
  steps: [
    // Hook: low gold light, a hut at the end of a lane, grass to the waist, and a ranger coming out of his door with his binoculars up.
    cut(spot(YARD, 'wide')),
    { do: 'sfx', id: 'creak', at: 'burdock', gain: 0.4, async: true },
    { do: 'walk', who: 'burdock', path: [Y_BURDOCK_MEET.at], speed: 1.1, async: true },
    { do: 'wait', s: 2.6 },
    // He has seen the crate before he has seen the player.
    cut(B_P.single('burdock', 'mcu', { height: 'low' })),
    { do: 'say', who: 'burdock', text: 'Welcome to the Unmown. Wipe your boots.' },
    { do: 'intro', who: 'burdock' },
    ...reaction('player', { toward: 'burdock', size: 'mcu', hold: 'pause' }),
    cut(B_P.single('burdock', 'mcu', { height: 'low' })),
    { do: 'say', who: 'burdock', text: 'And do not say hedge trimmers.' },
    cut(B_P.single('player', 'mcu')),
    { do: 'gesture', who: 'player', name: 'point', s: 0.9, async: true },
    { do: 'say', who: 'player', text: 'A vine. From the Countess.' },
    // The turn: he knows the name, and the name's record with grass.
    cut(B_P.single('burdock', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'burdock', name: 'think', s: 1.2, async: true },
    { do: 'say', who: 'burdock', text: 'Brassknock? She mowed her whole hill flat. Rule one: no mowing.' },
    cut(B_P.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'She has stopped.' },
    cut(B_P.single('burdock', 'mcu', { height: 'low' })),
    beat('beat'),
    { do: 'say', who: 'burdock', text: 'Then it may stay. By the east wall. The grass will help.' },
    // Button: the player wipes their boots on a lawn with nothing to wipe them on. The ranger watches, and approves.
    cut(shot('player', 'ms', { toward: 'burdock', side: 30 })),
    { do: 'gesture', who: 'player', name: 'stomp', s: 1.2, async: true },
    { do: 'sfx', id: 'rustle', at: 'player', gain: 0.4, async: true },
    { do: 'wait', s: 0.9 },
    cut(B_P.single('burdock', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'burdock', name: 'nod', s: 1.0, async: true },
    { do: 'say', who: 'burdock', text: 'Thorough.' },
    { do: 'wait', s: 0.8 },
  ],
};

const C_P = coverage('chicory', 'player', -1);
const W_X = coverage('wisteria', 'player', -1);
/** Chicory comes out of the meadow at the lane end and crosses the yard to the planting. */
const CHICORY_WALK: Vec2[] = [[-1541, -1133], [-1544.5, -1141], [-1547.5, -1150.8], Y_CHICORY.at];
const MANOR_COUNTESS: Vec2 = [-1139.4, 19.6];

/** Row 65 outro, dusk: a vine in the earth, a book, a key handed over with both hands, and a thank-you that costs. */
const OUTRO: SceneScript = {
  id: 'countess-relents-outro',
  stage: { kind: 'world' },
  music: 'warm',
  ambience: 'meadow',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/countess-relents-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, held: null, at: Y_PLAYER_PLANT.at, yaw: towards(Y_PLAYER_PLANT.at, PLANTING) },
    { id: 'burdock', preset: 'burdock haybright', held: 'ledger', at: Y_BURDOCK_PLANT.at, yaw: towards(Y_BURDOCK_PLANT.at, PLANTING) },
    { id: 'chicory', preset: 'chicory', held: 'shield-grate-key', hidden: true, at: CHICORY_WALK[0], yaw: towards(CHICORY_WALK[0], CHICORY_WALK[1]) },
    // Across the whole map, on her terrace in the same dusk, with the receiver at her ear.
    { id: 'wisteria', preset: 'wisteria', held: 'dispatch-radio', at: terrace(MANOR_COUNTESS), yaw: Math.PI },
  ],
  props: [
    // The planting: the crate sunk to its rim in a heap of dark earth, one bunch of grapes catching the light. A watering can waits beside it.
    { id: 'vine', prefab: 'first-vine-pot', at: up(PLANTING[0], PLANTING[1], 0), yaw: -Math.PI / 2, size: 1.0, by: 'h' },
    { id: 'can', prefab: 'watering-can', at: up(-1550.6, -1150.4, 0), yaw: 0.6, size: 0.4, by: 'h' },
  ],
  steps: [
    // Hook: the vine in the ground at dusk, and a pen scratching in a book. The sound of a man writing slowly.
    cut(spot(YARD, 'planting')),
    { do: 'sfx', id: 'paper', at: 'burdock', gain: 0.4, async: true },
    { do: 'gesture', who: 'burdock', name: 'think', s: 1.8, async: true },
    { do: 'wait', s: 2.2 },
    cut(B_P.single('burdock', 'mcu', { height: 'low' })),
    { do: 'say', who: 'burdock', text: 'One vine, Brassknock, of great age. Remarks: not mown.' },
    // Setup: boots in the grass, and a gardener who has walked the whole way.
    { do: 'spawn', id: 'chicory' },
    cut({ kind: 'cut', pos: up(-1536.5, -1128.4, 1.6), look: up(-1544.5, -1141, 1.0), fov: 46 }),
    { do: 'sfx', id: 'rustle', at: 'chicory', gain: 0.4, async: true },
    { do: 'walk', who: 'chicory', path: CHICORY_WALK, speed: 1.5, async: true },
    { do: 'wait', s: 3.4 },
    cut(C_P.single('chicory', 'mcu')),
    { do: 'face', who: 'chicory', at: PLANTING, s: 0.5 },
    { do: 'say', who: 'chicory', text: 'There. Nothing mows here.' },
    { do: 'face', who: 'chicory', at: 'player', s: 0.5 },
    ...reaction('player', { toward: 'chicory', size: 'mcu', hold: 'pause' }),
    cut(C_P.single('chicory', 'mcu')),
    { do: 'say', who: 'chicory', text: 'I walked. Engines frighten roots. She asked me to give you this.' },
    // The key goes over: a brass absurdity, and a half-step.
    cut(shot('chicory', 'ms', { toward: 'player', side: -25 })),
    { do: 'give', from: 'chicory', to: 'player', prop: 'shield-grate-key', s: 1.4 },
    { do: 'sfx', id: 'keys', at: 'player', gain: 0.5, async: true },
    cut(C_P.single('player', 'mcu')),
    { do: 'gesture', who: 'player', name: 'lean', s: 0.9, async: true },
    { do: 'wait', s: 0.8 },
    cut(C_P.single('chicory', 'mcu')),
    { do: 'say', who: 'chicory', text: 'Both hands.' },
    // Chicory takes up the can and begins, with the vine before the people.
    { do: 'hold', who: 'chicory', prop: 'watering-can' },
    { do: 'sfx', id: 'pour', at: 'vine', gain: 0.4, async: true },
    { do: 'wait', s: 0.8 },
    // The turn: a bell, once, from the player's pocket, and the music goes out of the evening.
    { do: 'music', track: null, fade: 0.5 },
    { do: 'sfx', id: 'phone', at: 'player', gain: 0.45 },
    cut(shot('player', 'mcu', { toward: 'chicory', side: 30 })),
    { do: 'wait', s: 1.0 },
    { do: 'sfx', id: 'phone', at: 'player', gain: 0.35, async: true },
    cut(W_X.single('wisteria', 'mcu', { height: 'low' })),
    { do: 'say', who: 'wisteria', text: 'Is it in the ground?' },
    { do: 'face', who: 'player', yaw: 0.34, s: 0.4, async: true },
    cut(W_X.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'By the wall. Nothing mows here.' },
    cut(pushIn('wisteria', 'mcu', 9.4, { to: 'cu', toward: 'player', side: -25, height: 'low' })),
    beat('beat'),
    { do: 'say', who: 'wisteria', text: 'Six harvests I paid, and never looked.' },
    beat('pause'),
    { do: 'say', who: 'wisteria', text: 'I am looking now.' },
    cut(W_X.single('wisteria', 'cu', { height: 'low' })),
    beat('silence'),
    { do: 'say', who: 'wisteria', text: 'Thank you.' },
    // Button: nobody says anything. The vine, the water going in, the long grass, and the light going.
    { do: 'music', track: 'turfton-dusk', fade: 1.2 },
    cut({ kind: 'dolly', from: up(-1545.6, -1153.6, 1.3), to: up(-1547.2, -1151.8, 1.5), look: up(PLANTING[0], PLANTING[1], 0.8), s: 3.6 }),
    { do: 'sfx', id: 'pour', at: 'vine', gain: 0.3, async: true },
    { do: 'wait', s: 3.6 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'countess-relents-intro': INTRO,
  'countess-relents-mid': MID,
  'countess-relents-outro': OUTRO,
};

