// Story row 58: The Reeve's Barn. Two scenes, both in Pebblewick, both at the pace of a town that keeps minutes.
// Intro (day, the market square, played when the player reaches Yarrow): Reeve Yarrow Potsherd (first card) sweeps the square in neat
// stripes with the Association's cut-off notice on a clipboard under his arm. "A bell, a bus and a reeve, and now a letter." The
// pump is non-compliant, the pails stand empty at the well, and the barn is empty and has always been empty: he pre-denies the
// helicopter before anybody has mentioned one. He sends the player to Wally's hangar for the part, and sweeps out their footprints.
// Outro (dusk, the yard of the hay barn): the Whirligig in the hay, rotor ticking down. Yarrow and the player throw a tarp over the
// rotor; Pip, on the radio, asks if anybody noticed; nothing was ever in the barn. Then the quiet: the pump's hum comes up the
// street, the town bell rings once for the water, and Yarrow tips his hat to the sound. No joke after the bell.
// The barn, the haystacks and the bales are the stage's set (built into the world); the pails, the clipboard and the tarp (a moss rug,
// flung and settling in three frames) are scene props. The Whirligig is the player's own: it is the vehicle they flew in.
// Notes: docs/design/gnome-theft-auto/direction/scenes/m58-the-reeves-barn-{intro,outro}.md
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, insert, pushIn, reaction, shot } from '../../direct';
import { markOf, spot, up } from './kit';

const SQ = 'm58-pebblewick-square';
const S_YARROW = markOf(SQ, 'yarrow');
const S_PLAYER = markOf(SQ, 'player');

const YARD = 'm58-barn-yard';
const Y_YARROW = markOf(YARD, 'yarrow');
const Y_PLAYER = markOf(YARD, 'player');

const TALK = coverage('yarrow', 'player', 1);
const YARD_TALK = coverage('yarrow', 'player', -1);

/** The town hall's bell rope (outskirts/town.ts SIGHTS.bell), which the quiet moment rings once. */
const BELL: [number, number, number] = [662.3, 4.0, 141];

/** The wishing well is at (681, 92); the town's tin pails stand on its south-east side, every one of them empty. */
const PAILS: Vec2[] = [[683.6, 95.4], [684.9, 94.3], [685.8, 93.0], [686.1, 91.5]];

// ---- 1. Intro: the square ----------------------------------------------------------------------------------------------------

/**
 * Day on Pebblewick's market square. Yarrow sweeps in stripes, the notice on a clipboard under his arm; the player walks in off
 * Route East. The bell, the bus, the reeve; the letter; the pump; and a barn that has always been empty. He asks for a part, and
 * sweeps the player's tracks out behind them as they go.
 */
export const M58_INTRO: SceneScript = {
  id: 'm58-the-reeves-barn-intro',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'warm',
  ambience: 'wind',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m58-the-reeves-barn-intro.md', kind: 'intro' },
  actors: [
    { id: 'yarrow', preset: 'yarrow', held: 'broom', at: S_YARROW.at, yaw: S_YARROW.yaw },
    { id: 'player', player: true, held: null, at: S_PLAYER.at, yaw: S_PLAYER.yaw },
  ],
  props: PAILS.map((p, i) => ({ id: `pail-${i}`, prefab: 'tin-pail', at: [p[0], p[1]] as Vec2, yaw: 0.6 * i, size: 0.5, by: 'h' as const })),
  steps: [
    // Hook: a broom on dry sand, a stripe at a time, and a town that is not saying what it is waiting for.
    cut(spot(SQ, 'wide')),
    { do: 'sfx', id: 'rustle', at: 'yarrow', gain: 0.5, async: true },
    { do: 'walk', who: 'yarrow', path: [[674.2, 108.0]], speed: 0.6, async: true },
    { do: 'sfx', id: 'creak', at: BELL, gain: 0.25, async: true },
    { do: 'wait', s: 2.4 },
    { do: 'walk', who: 'yarrow', path: [[675.6, 106.6]], speed: 0.9, async: true },
    { do: 'face', who: 'player', at: 'yarrow', s: 0.5, async: true },
    // Setup: the formal greeting, and the card.
    cut(TALK.single('yarrow', 'ms', { height: 'low' })),
    { do: 'face', who: 'yarrow', at: 'player', s: 0.4 },
    { do: 'say', who: 'yarrow', text: 'Good day. Thank you for your patience.' },
    { do: 'intro', who: 'yarrow' },
    cut(TALK.single('yarrow', 'mcu')),
    { do: 'say', who: 'yarrow', text: 'We have a bell, a bus and a reeve.' },
    beat('beat'),
    { do: 'hold', who: 'yarrow', prop: 'hoa-clipboard' },
    { do: 'say', who: 'yarrow', text: 'And now, a letter.' },
    cut(TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'A letter?' },
    // The insert: the Association's notice, on its clipboard, with the pen on its string.
    cut(insert('yarrow', { toward: 'player', side: 25 })),
    { do: 'sfx', id: 'paper', at: 'yarrow', gain: 0.5, async: true },
    { do: 'wait', s: 1.6 },
    cut(TALK.single('yarrow', 'mcu')),
    { do: 'say', who: 'yarrow', text: 'The Association cuts our water at sunset. The pump is non-compliant.' },
    // A cutaway to the pails: the wind finds one, and it is empty.
    cut(spot(SQ, 'well')),
    { do: 'sfx', id: 'clatter', at: [PAILS[1][0], 0.2, PAILS[1][1]], gain: 0.45, async: true },
    { do: 'wait', s: 1.8 },
    cut(TALK.single('yarrow', 'mcu')),
    { do: 'say', who: 'yarrow', text: 'It has seized every summer. This summer, they noticed.' },
    // The player's one question, and Yarrow's pre-emptive answer.
    cut(TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Pip says you have a barn.' },
    cut(TALK.single('yarrow', 'mcu')),
    { do: 'say', who: 'yarrow', text: 'I have a barn. It is empty. It has always been empty.' },
    cut(TALK.single('player', 'mcu', { height: 'low' })),
    { do: 'say', who: 'player', text: 'Big enough for a helicopter?' },
    cut(TALK.single('yarrow', 'cu')),
    { do: 'wait', s: 0.8 },
    { do: 'say', who: 'yarrow', text: 'There has never been a helicopter. Noted.' },
    // The turn: the condition, in the language of the minutes.
    cut(pushIn('yarrow', 'mcu', 4, { toward: 'player', side: 25 })),
    { do: 'say', who: 'yarrow', text: 'Fix the pump before sunset, and the barn is yours. With conditions.' },
    cut(TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Conditions?' },
    cut(TALK.single('yarrow', 'mcu', { height: 'low' })),
    { do: 'say', who: 'yarrow', text: 'Wally keeps a spare impeller at Hangar Two. Bring it by the shortest route.' },
    ...reaction('player', { toward: 'yarrow', gesture: 'nod', hold: 'pause', side: -25 }),
    cut(TALK.single('yarrow', 'mcu')),
    { do: 'say', who: 'yarrow', text: 'I do not ask which.' },
    // Button: the player walks out; the reeve sweeps their footprints away, one stripe behind.
    { do: 'hold', who: 'yarrow', prop: 'broom' },
    { do: 'walk', who: 'player', path: [[684.0, 100.0]], speed: 1.5, async: true },
    cut(TALK.single('yarrow', 'ms')),
    { do: 'say', who: 'yarrow', text: 'Mind the stripes.' },
    cut(spot(SQ, 'wide')),
    { do: 'walk', who: 'yarrow', path: [[678.2, 103.4]], speed: 1.0, async: true },
    { do: 'sfx', id: 'rustle', at: 'yarrow', gain: 0.5, async: true },
    { do: 'wait', s: 2.4 },
  ],
};

// ---- 2. Outro: the hay -----------------------------------------------------------------------------------------------------

/** The Whirligig's yard spot and the barn door beyond it (the stage's set: croft-barn at (706, 34), doors on +z). */
const WHIRLIGIG_AT: Vec2 = [706, 47];
/** Mast and rotor stand about 2.4 m over the deck (prefab whirligig-mower at scale 1.5), a little behind its middle. */
const ROTOR: Vec2 = [706, 46.1];
const tarpAt = (h: number): [number, number, number] => up(ROTOR[0], ROTOR[1], h);

/**
 * Dusk in the yard. The player has put the Whirligig down in the hay in front of the barn doors; the rotor is still turning slowly.
 * Yarrow comes up with a tarp. They throw it together (three frames: the cloth up, falling, settled), Pip asks over the radio if
 * anyone noticed, Yarrow says nothing was ever in the barn. Then the quiet: the music goes, the pump's water runs, the bell rings
 * once, Yarrow tips his hat.
 */
export const M58_OUTRO: SceneScript = {
  id: 'm58-the-reeves-barn-outro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'turfton-dusk',
  ambience: 'wind',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m58-the-reeves-barn-outro.md', kind: 'outro' },
  actors: [
    { id: 'yarrow', preset: 'yarrow', held: 'ledger-book', at: [Y_YARROW.at[0] - 5, Y_YARROW.at[1] + 4], yaw: Y_YARROW.yaw },
    { id: 'player', player: true, held: null, at: Y_PLAYER.at, yaw: Y_PLAYER.yaw },
  ],
  vehicles: [{ id: 'whirligig', kind: 'whirligig', from: 'player', at: WHIRLIGIG_AT, yaw: 0 }],
  props: [
    // The tarp is a moss rug stretched over the rotor: up in the air, coming down, settled.
    { id: 'tarp-1', prefab: 'moss-rug', at: tarpAt(3.7), yaw: 0.2, size: 4.2, by: 'w', hidden: true },
    { id: 'tarp-2', prefab: 'moss-rug', at: tarpAt(3.0), yaw: 0.1, size: 4.4, by: 'w', hidden: true },
    { id: 'tarp-3', prefab: 'moss-rug', at: tarpAt(2.52), yaw: 0, size: 4.5, by: 'w', hidden: true },
    { id: 'lantern', prefab: 'camp-lantern-post', at: up(711.0, 56.4, 0), yaw: 0, size: 1.9, by: 'h' },
  ],
  steps: [
    // Hook: low on the yard, the rotor ticking down over the hay, the barn doors in gold; a hen.
    cut(spot(YARD, 'door')),
    { do: 'sfx', id: 'flutter', at: 'whirligig', gain: 0.4, async: true },
    { do: 'sfx', id: 'creak', at: [706, 4, 40], gain: 0.3, async: true },
    { do: 'walk', who: 'yarrow', path: [[Y_YARROW.at[0], Y_YARROW.at[1]]], speed: 1.3, async: true },
    { do: 'wait', s: 2.4 },
    // Setup: the thanks, in writing.
    cut(YARD_TALK.single('yarrow', 'mcu', { height: 'low' })),
    { do: 'face', who: 'yarrow', at: 'player', s: 0.4 },
    { do: 'say', who: 'yarrow', text: 'The pump is humming. Pebblewick thanks you. In writing.' },
    cut(YARD_TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Where does she go?' },
    cut(YARD_TALK.single('yarrow', 'mcu')),
    { do: 'gesture', who: 'yarrow', name: 'point', s: 1.0, async: true },
    { do: 'say', who: 'yarrow', text: 'In the hay, under this. On three.' },
    // The tarp: the cloth up, falling, settled over the rotor. Both of them pull.
    cut(spot(YARD, 'wide')),
    { do: 'gesture', who: 'yarrow', name: 'handsUp', s: 1.4, async: true },
    { do: 'gesture', who: 'player', name: 'handsUp', s: 1.4, async: true },
    { do: 'wait', s: 1.0 },
    { do: 'sfx', id: 'cloth', at: 'whirligig', gain: 0.6, async: true },
    { do: 'spawn', id: 'tarp-1' },
    { do: 'wait', s: 0.4 },
    { do: 'despawn', id: 'tarp-1' },
    { do: 'spawn', id: 'tarp-2' },
    { do: 'sfx', id: 'flutter', at: 'whirligig', gain: 0.5, async: true },
    { do: 'wait', s: 0.4 },
    { do: 'despawn', id: 'tarp-2' },
    { do: 'spawn', id: 'tarp-3' },
    { do: 'sfx', id: 'thud', at: 'whirligig', gain: 0.3, async: true },
    { do: 'wait', s: 1.8 },
    // Pip, on the radio in the player's pocket: the question, and the answer that never was.
    { do: 'sfx', id: 'static', at: 'player', gain: 0.4, async: true },
    cut(YARD_TALK.single('player', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'player', name: 'clutch', s: 1.0, async: true },
    { do: 'say', who: 'Pip', hz: 126, text: 'Is she hidden? Did anybody notice?' },
    cut(pushIn('yarrow', 'mcu', 3.4, { toward: 'player', side: -25 })),
    { do: 'say', who: 'yarrow', text: 'Nobody noticed. There was never anything in the barn.' },
    cut(YARD_TALK.single('player', 'mcu')),
    { do: 'say', who: 'Pip', hz: 126, text: '...Sure.' },
    cut(YARD_TALK.single('yarrow', 'cu')),
    { do: 'say', who: 'yarrow', text: 'Noted.' },
    // The quiet. The music goes; under the ambience, water. A bell, once, from the square. Nobody says anything over it.
    { do: 'music', track: null, fade: 1.4 },
    { do: 'ambience', bed: 'water', fade: 2.0 },
    cut(spot(YARD, 'tower')),
    { do: 'wait', s: 1.6 },
    { do: 'sfx', id: 'bell', at: BELL, gain: 1.0 },
    { do: 'wait', s: 2.6 },
    // Button: Yarrow, in profile, tips his hat to the sound.
    cut({ kind: 'frame', who: 'yarrow', size: 'ms', toward: 'player', side: -55 }),
    { do: 'gesture', who: 'yarrow', name: 'tipHat', s: 1.5 },
    { do: 'wait', s: 1.4 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm58-the-reeves-barn-intro': M58_INTRO,
  'm58-the-reeves-barn-outro': M58_OUTRO,
};
