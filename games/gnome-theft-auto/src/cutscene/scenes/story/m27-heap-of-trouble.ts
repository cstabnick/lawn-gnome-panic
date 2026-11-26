// Story row 27 "Heap of Trouble": Ernie at the furnace mouth as the plate vans leave (dusk), and the convoy going on north over
// the snow line without its lead van (night). Notes: docs/design/gnome-theft-auto/direction/scenes/m27-heap-of-trouble-{intro,outro}.md
// Plants act III's four parts and answers none: a deck, a crate, a place name, a torn page. Tansy is on the phone in both
// scenes (an off-screen voice, as the card in m21); Ernie is introduced here (L105 card).
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, shot } from '../../direct';
import { markOf, spot } from './kit';

const heading = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

/** The player and Ernie: every shot of them talking stays on one side of the line between them. */
const ERNIE_AND_ME = coverage('player', 'ernie', 1);

const FURNACE = 'compost-heap-furnace';
const LAY_BY = 'snow-line-lay-by';

// ---- Stage marks --------------------------------------------------------------------------------------------------------
const F_ERNIE = markOf(FURNACE, 'ernie');
const F_PLAYER = markOf(FURNACE, 'player');
const L_PLAYER = markOf(LAY_BY, 'player');
/** Where the forge track meets the west highway, and the highway out west: both vans drive this. */
const OUT_A: Vec2[] = [[-251.5, -30], [-250, -22], [-250, -20], [-285, 0]];
const OUT_B: Vec2[] = [[-249, -26], [-250, -22], [-250, -20], [-285, 0]];
/** The road north from the lay-by, over the snow line: what the rest of the convoy drives. */
const NORTH: Vec2[] = [[40, -1060], [52, -1190]];

// ---- Intro: the furnace (dusk) ------------------------------------------------------------------------------------------
/**
 * Plates leave the Heap by van after dark, four ways. A van pulls out as the scene opens; Ernie, at the furnace mouth,
 * roasts a chestnut and says what he has noticed, in his own way (the last word twice, humming into nothing). The four
 * plates laid out in a cross on the yard are the picture of it. Tansy rings from the bay and gives the order; the
 * second van starts up, and that is the one. Ernie is introduced here.
 */
export const M27_HEAP_OF_TROUBLE_INTRO: SceneScript = {
  id: 'm27-heap-of-trouble-intro',
  stage: { kind: 'world' },
  music: 'fescue',
  ambience: 'forest',
  radio: 0.08,
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m27-heap-of-trouble-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, held: null, at: F_PLAYER.at, yaw: heading(F_PLAYER.at, F_ERNIE.at) },
    { id: 'ernie', preset: 'ernie', name: 'Ash-Shovel Ernie', at: F_ERNIE.at, yaw: heading(F_ERNIE.at, F_PLAYER.at) },
  ],
  vehicles: [
    { id: 'van-a', kind: 'hoa-van', at: [-252, -43.5], yaw: Math.PI, headlights: true },
    { id: 'van-b', kind: 'hoa-van', at: [-247, -36], yaw: Math.PI },
  ],
  props: [
    // Four plates in a cross on the yard, and the HOA's loading sheet on top: four ways out, written down.
    { id: 'plate-n', prefab: 'pot-lid-shield', at: [-243.2, -57.9], yaw: 0, size: 1.3 },
    { id: 'plate-e', prefab: 'pot-lid-shield', at: [-241.7, -59.4], yaw: 1.57, size: 1.3 },
    { id: 'plate-s', prefab: 'pot-lid-shield', at: [-243.2, -60.9], yaw: 3.14, size: 1.3 },
    { id: 'plate-w', prefab: 'pot-lid-shield', at: [-244.7, -59.4], yaw: 4.71, size: 1.3 },
    { id: 'sheet', prefab: 'hoa-clipboard', at: [-243.2, -59.4], yaw: 0.3, size: 0.7 },
  ],
  steps: [
    // 1. Hook: the first van of the night leaves the yard, loaded, its headlights sweeping the heaps.
    { do: 'cam', shot: { kind: 'track', pos: [-245.5, 1.6, -30], who: 'van-a', fov: 50 } },
    { do: 'sfx', id: 'engine-rev', at: 'van-a', gain: 0.5, async: true },
    { do: 'drive', vehicle: 'van-a', path: OUT_A, speed: 8, arrive: false, async: true },
    { do: 'wait', s: 2.6 },
    // 2. Ernie at the furnace mouth, a chestnut on the trowel. He is introduced here.
    cut(ERNIE_AND_ME.single('ernie')),
    { do: 'sfx', id: 'crunch', at: 'ernie', gain: 0.4, async: true },
    { do: 'gesture', who: 'ernie', name: 'point', s: 1.0, async: true },
    { do: 'say', who: 'ernie', text: 'Chestnut? Tastes of petrol. Better.' },
    { do: 'intro', who: 'ernie' },
    // 3. What he has seen.
    cut(ERNIE_AND_ME.single('ernie', 'ms')),
    { do: 'say', who: 'ernie', text: 'Third van tonight. Plates, leaving. Hmm, hm, hm.' },
    cut(ERNIE_AND_ME.single('player')),
    { do: 'say', who: 'player', text: 'Where do they go?' },
    cut(ERNIE_AND_ME.single('ernie')),
    { do: 'say', who: 'ernie', text: 'Four ways. North, south, east, west. Nobody tells the stoker.' },
    // 4. The insert: the plates in a cross, and the sheet on top. It is the whole story and nobody says it.
    cut(spot(FURNACE, 'plates')),
    { do: 'sfx', id: 'paper', gain: 0.4, async: true },
    { do: 'wait', s: 1.9 },
    // 5. The turn: Tansy rings from the bay and gives the order in three short clauses.
    cut(ERNIE_AND_ME.single('player')),
    { do: 'say', who: 'Tansy', hz: 118, sfx: 'phone', text: 'Ernie rang the bay. I want to know where those plates go.' },
    cut(ERNIE_AND_ME.single('ernie')),
    { do: 'say', who: 'Tansy', hz: 118, text: 'Pick one van. Follow it north. Do not get close.' },
    // 6. Button: the second van starts up, headlights on, and Ernie hums the tune he has lost.
    { do: 'lights', vehicle: 'van-b', on: true },
    { do: 'sfx', id: 'engine-rev', at: 'van-b', gain: 0.5, async: true },
    cut(ERNIE_AND_ME.single('ernie')),
    { do: 'say', who: 'ernie', text: 'That one. North. Hmm, hm, hm...' },
    { do: 'cam', shot: { kind: 'track', pos: [-245.5, 1.6, -30], who: 'van-b', fov: 50 } },
    { do: 'drive', vehicle: 'van-b', path: OUT_B, speed: 7, arrive: false, async: true },
    { do: 'wait', s: 3.0 },
  ],
};

// ---- Outro: the snow line (night) ---------------------------------------------------------------------------------------
/**
 * The lead van has stopped and its escort is cracked. The rest of the convoy does not wait for it: three vans pull out
 * past the lay-by and climb north over the snow line, their lights shrinking. The player holds the page with no route
 * on it; Tansy says only that this was one of four. Ends on the taillights.
 */
export const M27_HEAP_OF_TROUBLE_OUTRO: SceneScript = {
  id: 'm27-heap-of-trouble-outro',
  stage: { kind: 'world' },
  music: 'mystery',
  ambience: 'snow',
  radio: 0.05,
  sky: 'night',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m27-heap-of-trouble-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, held: 'hoa-clipboard', at: L_PLAYER.at, yaw: heading(L_PLAYER.at, [30, -1030]) },
  ],
  vehicles: [
    { id: 'lead', kind: 'hoa-van', at: [24.2, -1002.8], yaw: 2.88 },
    { id: 'conv-1', kind: 'hoa-van', at: [27.6, -1017.4], yaw: 2.88, headlights: true },
    { id: 'conv-2', kind: 'hoa-van', at: [30.1, -1025.8], yaw: 2.88, headlights: true },
    { id: 'conv-3', kind: 'hoa-van', at: [32.6, -1034.2], yaw: 2.88, headlights: true },
  ],
  steps: [
    // 1. Hook: the convoy pulls out ahead of us, one van after another, up the road north.
    cut(spot(LAY_BY, 'north')),
    { do: 'sfx', id: 'engine-rev', at: 'conv-3', gain: 0.5, async: true },
    { do: 'drive', vehicle: 'conv-3', path: NORTH, speed: 11, arrive: false, async: true },
    { do: 'wait', s: 1.0 },
    { do: 'sfx', id: 'engine-rev', at: 'conv-2', gain: 0.5, async: true },
    { do: 'drive', vehicle: 'conv-2', path: NORTH, speed: 11, arrive: false, async: true },
    { do: 'wait', s: 1.0 },
    { do: 'sfx', id: 'engine-rev', at: 'conv-1', gain: 0.5, async: true },
    { do: 'drive', vehicle: 'conv-1', path: NORTH, speed: 11, arrive: false, async: true },
    { do: 'wait', s: 0.8 },
    // 2. The player, the page in hand: what it says, and what it does not.
    cut(shot('player', 'mcu', { side: 25 })),
    { do: 'sfx', id: 'paper', at: 'player', gain: 0.4, async: true },
    { do: 'say', who: 'player', text: 'A cutting deck. A crate. A town. The route is torn off.' },
    // 3. Tansy, from the bay: one of four, said flat.
    cut(shot('player', 'cu', { side: -25, height: 'low' })),
    { do: 'say', who: 'Tansy', hz: 118, sfx: 'phone', text: 'Four vans left the Heap. That was one. Bring me the paper.' },
    beat('beat'),
    // 4. Button: the wide, north. Three pairs of taillights going up into the dark, smaller every second.
    cut(spot(LAY_BY, 'north')),
    { do: 'wait', s: 1.0 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm27-heap-of-trouble-intro': M27_HEAP_OF_TROUBLE_INTRO,
  'm27-heap-of-trouble-outro': M27_HEAP_OF_TROUBLE_OUTRO,
};
