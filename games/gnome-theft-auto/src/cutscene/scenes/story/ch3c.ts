// Chapter 3, the drift run and the chapter's close at the Dust Flats Overlook. Re-directed in the Story B direction
// pass (docs/design/gnome-theft-auto/direction/lanes.md); notes in direction/scenes/<id>.md.
// Rewritten for E21 (row 53, "Volatile on Ice"): Bracken lends the Stopping Stone, and Tansy's ridge call points at the
// Dust Flats for air power. Registered through CH3_SCENES in ch3.ts.
import type { SceneScript } from '../../script';
import { beat, coverage, cut, reaction, shot } from '../../direct';
import { carMark, markOf, spot, up } from './kit';

const BASIN = 'birdbath-basin';

const towards = (a: [number, number], b: [number, number]): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

/**
 * Tundra run (dusk): the Combine has cut its test line and Vesper has named the day. Bracken and Father Loam load the
 * Stopping Stone into the ice-packed Zero-Turn, and Bracken lends it in words: lent, not given, back uncracked. Pip,
 * steadier now, sits it out on the bench with his glued arm. The scene ends on foot beside the mower.
 */
const MOWER_AT: [number, number] = [10, -335];
const B_FROM: [number, number] = [3, -341];
const B_AT: [number, number] = [7.4, -338.6];
const L_AT: [number, number] = [12.6, -338.8];
const BL = coverage('bracken', 'player', 1);
const BP = coverage('bracken', 'pip', -1);

export const TUNDRA_INTRO: SceneScript = {
  id: 'tundra-intro',
  stage: { kind: 'world' },
  music: 'frost',
  ambience: 'wind',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/tundra-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, at: [4, -331], yaw: towards([4, -331], B_AT) },
    { id: 'bracken', preset: 'bracken', at: B_FROM, yaw: towards(B_FROM, B_AT) },
    { id: 'loam', preset: 'loam', at: L_AT, yaw: towards(L_AT, MOWER_AT) },
    { id: 'pip', preset: 'pip', held: null, ...markOf(BASIN, 'pip') },
  ],
  vehicles: [
    // The drift-run mower: the stage's parked ice-zero-turn, where the quest starts.
    { id: 'mower', ...carMark(BASIN, 'ice-zero-turn') },
  ],
  props: [
    // L95: the Stone, set in the seat once loaded, and a salt-sack roped beside it for ballast.
    { id: 'stone-seat', prefab: 'stopping-stone', at: up(10.2, -335, 0.95), yaw: 0.3, size: 0.55, hidden: true },
    { id: 'ballast', prefab: 'sugar-sack', at: [9, -332.6], yaw: 0.5, size: 0.5, by: 'h' },
  ],
  steps: [
    { do: 'gesture', who: 'pip', name: 'sit', s: 0.8, async: true },
    // 1. Hook: Bracken carries the Stone across the basin ice, slow and level.
    { do: 'cam', shot: spot(BASIN, 'arrival') },
    { do: 'sfx', id: 'crunch', at: 'bracken', gain: 0.5, async: true },
    { do: 'walk', who: 'bracken', path: [B_AT], speed: 0.9 },
    // 2. Loam gives the Previously.
    cut(shot('loam', 'mcu', { toward: 'bracken', side: 25 })),
    { do: 'say', who: 'loam', text: 'The Combine cut its line through Hedgeworth. Vesper has named the day.' },
    { do: 'sfx', id: 'cloth', at: 'loam', gain: 0.4, async: true },
    // 3. The loading: the Stone leaves Bracken's arms and settles into the seat. Nobody speaks over it.
    cut({ kind: 'cut', pos: up(14.4, -331.4, 1.7), look: up(9.2, -337, 1.0), fov: 42 }),
    { do: 'face', who: 'bracken', at: MOWER_AT, s: 0.4 },
    { do: 'hold', who: 'bracken', prop: null },
    { do: 'spawn', id: 'stone-seat' },
    { do: 'sfx', id: 'thud', at: 'mower', gain: 0.6, async: true },
    { do: 'sfx', id: 'creak', at: 'mower', gain: 0.4 },
    { do: 'gesture', who: 'loam', name: 'bow', s: 1.2, async: true },
    beat('pause'),
    // 4. Bracken lends it, in words, to the player. No joke anywhere near him.
    { do: 'face', who: 'bracken', at: 'player', s: 0.5 },
    cut(BL.single('bracken', 'mcu', { height: 'low' })),
    { do: 'say', who: 'bracken', text: 'This Stone stopped one machine. One. Nothing since.', hz: 76 },
    ...reaction('player', { toward: 'bracken', size: 'mcu', hold: 'pause' }),
    cut(BL.single('bracken', 'mcu', { height: 'low' })),
    { do: 'say', who: 'bracken', text: 'I lend it. I do not give it. Bring it back uncracked.', hz: 76 },
    cut(BL.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Uncracked. I will.' },
    ...reaction('bracken', { toward: 'player', gesture: 'nod', size: 'mcu', side: 25, hold: 'pause' }),
    // 5. The turn: Bracken looks past the player to Pip on the bench. Two short lines. Pip stands for it.
    { do: 'face', who: 'bracken', at: 'pip', s: 0.5, async: true },
    cut(BP.single('bracken', 'mcu', { height: 'low' })),
    { do: 'say', who: 'bracken', text: 'Potsworth. Hold the arm level, and the load will follow.', hz: 76 },
    cut(BP.single('pip', 'mcu')),
    { do: 'gesture', who: 'pip', name: 'stand', s: 0.4 },
    { do: 'say', who: 'pip', text: 'Level. Yes, Elder.' },
    beat('beat'),
    // 6. Loam's blessing, short, and the button: Pip leans on the horn and Bracken does not blink.
    cut(shot('loam', 'mcu', { toward: 'player', side: -30 })),
    { do: 'say', who: 'loam', text: 'Go with the Kiln, and keep the ice under you.' },
    { do: 'walk', who: 'player', path: [[6, -331]], speed: 1.2, async: true },
    cut(shot('pip', 'ms', { toward: 'player', side: 30 })),
    { do: 'gesture', who: 'pip', name: 'lean', s: 1.0 },
    { do: 'horn', vehicle: 'mower' },
    beat('beat'),
    cut(shot('bracken', 'mcu', { toward: 'pip', side: -25, height: 'low' })),
    beat('pause'),
  ],
};

/**
 * Tundra outro (night): the Dust Flats Overlook lit by a single lamp over the map table. Pip, steadier, has carried the
 * Stone the last stretch in both hands. Tansy calls down from the ridge: what stops the Combine is not on the ground.
 * Air power, and the air is at Fort Sandpit. Closes the chapter on the act's turn, not on the threat.
 */
const OVERLOOK_LAMP: [number, number] = [270.8, 41.6];
const TABLE: [number, number] = [270, 40];
const RIDGE: [number, number] = [272, 29.5];
const O_PLAYER: [number, number] = [274.5, 47];
const O_PIP: [number, number] = [278.5, 52];
const TP = coverage('pip', 'player', -1);
const UP = coverage('tansy', 'player', 1);

export const TUNDRA_OUTRO: SceneScript = {
  id: 'tundra-outro',
  stage: { kind: 'world' },
  music: 'warm',
  ambience: 'wind',
  sky: 'night',
  direction: { kind: 'chapter-close', notes: 'docs/design/gnome-theft-auto/direction/scenes/tundra-outro.md' },
  actors: [
    { id: 'player', player: true, at: O_PLAYER, yaw: towards(O_PLAYER, TABLE) },
    { id: 'pip', preset: 'pip', held: 'stopping-stone', at: O_PIP, yaw: towards(O_PIP, TABLE) },
    { id: 'tansy', preset: 'tansy', held: null, at: RIDGE, yaw: towards(RIDGE, O_PLAYER) },
  ],
  props: [
    // L95: one lamp in the whole dark, over the map table; Tansy a silhouette on the rim above it.
    { id: 'lamp', prefab: 'garden-lamp-post', at: OVERLOOK_LAMP, yaw: 0, size: 2.2, by: 'h' },
  ],
  steps: [
    // 1. Hook: the dark overlook, one lamp. Pip walks the last metres with the Stone in both hands, counting under his breath.
    { do: 'cam', shot: { kind: 'cut', pos: up(282, 56, 3.2), look: up(OVERLOOK_LAMP[0], OVERLOOK_LAMP[1], 1.2), fov: 50 } },
    { do: 'sfx', id: 'crunch', at: 'pip', gain: 0.4, async: true },
    { do: 'walk', who: 'pip', path: [[274, 44.4]], speed: 1.6 },
    // 2. He sets it on the map table, turns to the player, and checks it twice for cracks.
    { do: 'hold', who: 'pip', prop: null },
    { do: 'sfx', id: 'thud', at: 'pip', gain: 0.4, async: true },
    { do: 'face', who: 'pip', at: 'player', s: 0.4 },
    cut(TP.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Level, level, whole! Not a chip. Bracken gets it back with a bow on.' },
    { do: 'face', who: 'player', at: 'pip', s: 0.3 },
    cut(TP.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'You carried it well.' },
    cut(TP.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: "Both hands. Didn't drop it once." },
    beat('beat'),
    // 3. The call: from above, out of the dark. They look up before they hear her.
    { do: 'sfx', id: 'whoosh', gain: 0.25, async: true },
    { do: 'face', who: 'pip', at: RIDGE, s: 0.5, async: true },
    { do: 'face', who: 'player', at: RIDGE, s: 0.5 },
    cut(shot('tansy', 'ms', { toward: 'player', side: 25, height: 'low' })),
    { do: 'say', who: 'tansy', text: "Stone's here? Good. Now come up. Both of you." },
    // 4. Tansy on the rim: what stops a Combine is not on the ground.
    cut(UP.single('tansy', 'mcu', { height: 'low' })),
    { do: 'say', who: 'tansy', text: "We can't outdrive that. We can't outdig it either. We need air power." },
    cut(UP.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Where do we get air?' },
    { do: 'face', who: 'tansy', at: [374, 30], s: 0.5, async: true },
    cut(shot('tansy', 'mcu', { side: -60, height: 'low' })),
    { do: 'say', who: 'tansy', text: 'East. The Dust Flats. Fort Sandpit has a Whirligig.' },
    // 5. Pip turns to the fort and points: he wants the plan.
    { do: 'face', who: 'pip', at: [374, 30], s: 0.4 },
    cut(shot('pip', 'ms', { side: -60 })),
    { do: 'gesture', who: 'pip', name: 'point', s: 1.0 },
    { do: 'say', who: 'pip', text: "Then we don't drive." },
    beat('pause'),
    // 6. Button: the lamp, the Stone beneath it, and the title. The next act's breath, not the threat.
    cut({ kind: 'cut', pos: up(266.5, 45.5, 1.0), look: up(TABLE[0], TABLE[1], 0.9), fov: 38 }),
    { do: 'sfx', id: 'creak', at: 'lamp', gain: 0.3, async: true },
    { do: 'title', text: 'END OF CHAPTER 3' },
    { do: 'wait', s: 3 },
    { do: 'title', text: null },
    { do: 'wait', s: 1.2 },
  ],
};

export const CH3C_SCENES: Record<string, SceneScript> = {
  'tundra-intro': TUNDRA_INTRO,
  'tundra-outro': TUNDRA_OUTRO,
};
