// Story row 38 (m38-pail-pond): Pail Pond. Two scenes. Intro (midday, the back of the lodge): Gentian plants a mug on a table
// and points over the snow at the pale patch of Pail Pond, where an HOA radio went through the ice, still talking.
// Outro (dusk, the porch): the fished-out radio dries by the stove, wakes, and a dispatcher names the Combine's four parts
// and where each goes: deck to Hedgeworth, guidance to Rootwell, power to Pinwheel Ridge, money to Trellisdown. Pip inks it
// on a sock. The laugh row between the lodge's warmth and the part hunts; the map is also in the doneText and the journal.
// Notes: docs/design/gnome-theft-auto/direction/scenes/m38-pail-pond-{intro,outro}.md
import type { CamShot, SceneScript } from '../../script';
import { beat, coverage, cut, pushIn, reaction, shot } from '../../direct';
import { markOf, spot, up } from './kit';

const BACK = 'lodge-back-table';
const PORCH = 'lodge-stove-dusk';

// ---- 1. Intro: a mug on the table -------------------------------------------------------------------------------------------
const K_GEN = markOf(BACK, 'gentian');
const K_YOU = markOf(BACK, 'player');
const K_PIP = markOf(BACK, 'pip');
const PIPTALK = coverage('pip', 'gentian', 1);

/**
 * Midday at the back of the lodge, pale light on the snow. Gentian does not ask anyone to sit: she puts a mug on the table
 * and points at a pond. Brisk, funny, counting in threes; the job is a radio, and the bears are relaxed.
 */
export const M38_INTRO: SceneScript = {
  id: 'm38-pail-pond-intro',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'warm',
  ambience: 'snow',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m38-pail-pond-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, held: null, at: K_YOU.at, yaw: K_YOU.yaw },
    { id: 'gentian', preset: 'gentian', held: 'cocoa-mug', at: K_GEN.at, yaw: K_GEN.yaw },
    { id: 'pip', preset: 'pip', held: 'cocoa-mug', at: K_PIP.at, yaw: K_PIP.yaw },
  ],
  props: [
    { id: 'table', prefab: 'table', at: [-463.2, -1021.2], yaw: 0.3, size: 1.5, by: 'w' },
    { id: 'mug', prefab: 'cocoa-mug', at: [-463.4, -1021.0], yaw: 0.6, size: 0.22, by: 'h', hidden: true },
  ],
  steps: [
    // Hook: the mug lands on the table hard enough to slop.
    cut(spot(BACK, 'wide')),
    { do: 'gesture', who: 'gentian', name: 'cheer', s: 0.9, async: true },
    { do: 'spawn', id: 'mug' },
    { do: 'sfx', id: 'clink', at: 'gentian', gain: 0.6, async: true },
    { do: 'wait', s: 1.4 },
    // Setup: the cocoa rules.
    cut(PIPTALK.single('gentian', 'mcu')),
    { do: 'say', who: 'gentian', text: 'Three sips. Then listen. I do not repeat myself, I count.' },
    cut(PIPTALK.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'This is my second mug. Is that allowed?' },
    cut(PIPTALK.single('gentian', 'mcu')),
    { do: 'say', who: 'gentian', text: 'It is encouraged. That was my mug, though.' },
    // The pond, from beside the table: the pale patch a long way out.
    cut(spot(BACK, 'pond')),
    { do: 'gesture', who: 'gentian', name: 'point', s: 1.6, async: true },
    { do: 'sfx', id: 'creak', at: 'gentian', gain: 0.3, async: true },
    { do: 'wait', s: 1.0 },
    cut(pushIn('gentian', 'mcu', 3.4, { toward: 'pip', side: -25 })),
    { do: 'say', who: 'gentian', text: 'That pale patch is Pail Pond. An HOA radio went through the ice.' },
    cut(PIPTALK.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Still talking? Radios are for talking to somebody!' },
    // The turn: what a radio can tell.
    cut(PIPTALK.single('gentian', 'mcu')),
    { do: 'say', who: 'gentian', text: 'Quite. It may say where they take the parts.' },
    ...reaction('player', { toward: 'gentian', gesture: 'nod', size: 'mcu', hold: 'pause' }),
    cut(PIPTALK.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'And the bears? Please say they are friendly.' },
    cut(PIPTALK.single('gentian', 'mcu')),
    { do: 'say', who: 'gentian', text: 'Relaxed, not friendly. Theo holds a hole open, so do not keep him.' },
    // Button: the mug taken back, and Pip caught with two.
    cut(PIPTALK.two('fs')),
    { do: 'give', from: 'pip', to: 'gentian', prop: 'cocoa-mug', s: 1.0 },
    cut(PIPTALK.single('gentian', 'ms')),
    { do: 'gesture', who: 'gentian', name: 'beckon', s: 1.0, async: true },
    { do: 'say', who: 'gentian', text: 'Up and at them! I will take that one.' },
    { do: 'wait', s: 0.8 },
  ],
};

// ---- 2. Outro: the dispatch --------------------------------------------------------------------------------------------------
const P_GEN = markOf(PORCH, 'gentian');
const P_PIP = markOf(PORCH, 'pip');
const P_YOU = markOf(PORCH, 'player');
const PG = coverage('gentian', 'pip', 1);
/** The radio on its crate from two sides, then the sock map spread beside it. */
const RADIO_A: CamShot = { kind: 'cut', pos: up(-432.4, -1018.0, 1.0), look: 'radio', fov: 40 };
const RADIO_B: CamShot = { kind: 'cut', pos: up(-433.2, -1021.8, 1.1), look: 'radio', fov: 38 };
const MAP_CLOSE: CamShot = { kind: 'cut', pos: up(-432.6, -1017.6, 1.0), look: 'map', fov: 40 };

/**
 * Dusk on the porch, the stove going. The frosted radio sits on a crate with its aerial toward the sky; it wakes slowly, like
 * a bear. A dispatcher names deck, guidance, power and money and where each is going, and Pip, who writes everything down
 * wrong first, inks it on a sock. The only scene of the row where the HOA says something true by mistake.
 */
export const M38_OUTRO: SceneScript = {
  id: 'm38-pail-pond-outro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'mystery',
  ambience: 'snow',
  direction: {
    notes: 'docs/design/gnome-theft-auto/direction/scenes/m38-pail-pond-outro.md',
    kind: 'outro',
    waive: [{ code: 'speaker-unseen', match: 'Dispatch', why: 'the dispatcher is a voice on the radio: the frame holds the radio itself' }],
  },
  actors: [
    { id: 'player', player: true, held: null, at: P_YOU.at, yaw: P_YOU.yaw },
    { id: 'gentian', preset: 'gentian', held: null, at: P_GEN.at, yaw: P_GEN.yaw },
    { id: 'pip', preset: 'pip', held: null, at: P_PIP.at, yaw: P_PIP.yaw },
  ],
  props: [
    { id: 'stove', prefab: 'stove', at: [-437.6, -1016.8], yaw: Math.PI / 2, size: 1.1, by: 'h' },
    { id: 'crate', prefab: 'crate', at: [-435.2, -1019.6], yaw: 0.2, size: 0.7, by: 'w' },
    { id: 'radio', prefab: 'hoa-radio', at: up(-435.2, -1019.6, 0.7), yaw: Math.PI / 2 + 0.3, size: 0.32, by: 'h' },
    { id: 'map', prefab: 'sock-map', at: [-434.6, -1019.0], yaw: 0.5, size: 0.5, by: 'w', hidden: true },
    { id: 'line-a', prefab: 'sock-rack', at: [-438.6, -1024.6], yaw: Math.PI / 2, size: 1.4, by: 'w' },
  ],
  steps: [
    // Hook: static ticking out of a frosted box on a crate, the stove going, nobody speaking yet.
    cut(spot(PORCH, 'radio')),
    { do: 'sfx', id: 'static', at: 'radio', gain: 0.45, async: true },
    { do: 'wait', s: 1.8 },
    cut(PG.single('gentian', 'mcu')),
    { do: 'say', who: 'gentian', text: 'Do not poke it. A radio wakes slowly, like a bear.' },
    cut(PG.single('pip', 'mcu')),
    { do: 'gesture', who: 'pip', name: 'point', s: 0.8, async: true },
    { do: 'sfx', id: 'tap', at: 'radio', gain: 0.5, async: true },
    { do: 'say', who: 'pip', text: 'I am not poking. I am encouraging.' },
    // The dispatch: the radio from two sides, the four parts and their yards, with the listeners between.
    { do: 'music', track: null, fade: 0.8 },
    cut(RADIO_A),
    { do: 'sfx', id: 'static', at: 'radio', gain: 0.7, async: true },
    { do: 'wait', s: 0.8 },
    { do: 'say', who: 'HOA Dispatch', text: 'Dispatch to all haulers. Four loads, four yards. Read back.', hz: 118 },
    ...reaction('pip', { toward: 'gentian', gesture: 'flinch', size: 'mcu', side: 25, hold: 'pause' }),
    cut(RADIO_B),
    { do: 'say', who: 'HOA Dispatch', text: 'Deck goes to Hedgeworth. Guidance goes to Rootwell.', hz: 118 },
    { do: 'spawn', id: 'map' },
    { do: 'sfx', id: 'paper', at: 'pip', gain: 0.5, async: true },
    cut(PG.single('pip', 'mcu', { height: 'high' })),
    { do: 'say', who: 'pip', text: 'Hedgeworth. Rootwell. Is Hedgeworth with a W? Never mind.' },
    cut(RADIO_A),
    { do: 'say', who: 'HOA Dispatch', text: 'Power goes to Pinwheel Ridge. Money goes to Trellisdown.', hz: 118 },
    { do: 'stinger', id: 'reveal' },
    ...reaction('gentian', { toward: 'pip', gesture: 'crossArms', size: 'mcu', side: 25, hold: 'pause' }),
    cut(RADIO_B),
    { do: 'say', who: 'HOA Dispatch', text: 'Combine parts only. No hats on the loads. Dispatch out.', hz: 118 },
    { do: 'sfx', id: 'static', at: 'radio', gain: 0.4, async: true },
    { do: 'wait', s: 0.8 },
    // The turn: four parts, and what they are parts of.
    { do: 'music', track: 'mystery', fade: 1.0 },
    cut(PG.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Pinwheel. Trellisdown. I need a bigger sock.' },
    cut(PG.single('gentian', 'mcu')),
    { do: 'say', who: 'gentian', text: 'I have forty.' },
    cut(pushIn('pip', 'mcu', 3.2, { toward: 'gentian', side: -25 })),
    { do: 'say', who: 'pip', text: 'Four parts of one Combine. They are building it in pieces!' },
    ...reaction('player', { toward: 'pip', size: 'mcu', hold: 'pause' }),
    // Button: the sock map on the crate, four red crosses, and the static dying out.
    cut(MAP_CLOSE),
    { do: 'sfx', id: 'cloth', at: 'map', gain: 0.5, async: true },
    { do: 'wait', s: 1.6 },
    cut(spot(PORCH, 'socks')),
    { do: 'sfx', id: 'static', at: 'radio', gain: 0.25, async: true },
    { do: 'wait', s: 1.4 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm38-pail-pond-intro': M38_INTRO,
  'm38-pail-pond-outro': M38_OUTRO,
};
