/// Chapter 4 closer: the coalition at Fort Sandpit's gate (re-directed in the Story B direction pass; notes in
// docs/design/gnome-theft-auto/direction/scenes/spade-truce-outro.md). The rest of chapter 4 is in ch4b.ts (the opener
// and the drop briefing) and ch4c.ts (the flight home and the truce); every id is played by a quest in quests/chapter4.ts.
import type { Point, SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, reaction, shot } from '../../direct';
import { rideOf, up } from './kit';
import { CH4B_SCENES } from './ch4b';
import { CH4C_SCENES } from './ch4c';

const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

/** Spade Guard look (no preset in cast.ts). */
const SPADE = { hat: 0x4b6329, shirt: 0x556b2f, beard: 0x5c3e24 };

/** Outside the gatehouse, on the fort-gate road: Diggs, the player and two of his Guard. */
const ST_DIGGS: Vec2 = [374, 44];
const ST_PLAYER: Vec2 = [377.6, 46.2];
const ST_GUARD_W: Vec2 = [369.4, 42.4];
const ST_GUARD_E: Vec2 = [379.4, 41.8];
/** The three rides come up the fort-gate road from the highway and pull up in a fan. */
const GRANNY_IN: Point[] = [[380, 76], [376, 62], [370.5, 54]];
const TANSY_IN: Point[] = [[382, 82], [379, 66], [380.5, 55]];
const PIP_IN: Point[] = [[384, 88], [381, 72], [375.5, 58.5]];
/** Where they stand once out of their rides. */
const ST_GRANNY: Vec2 = [371.6, 49.6];
const ST_TANSY: Vec2 = [379.8, 50.4];
const ST_PIP: Vec2 = [376.2, 52.2];
const ST_BRACKEN_FROM: Vec2 = [362, 60];
const ST_BRACKEN: Vec2 = [369.4, 47.6];

const PT = coverage('pip', 'tansy', 1);

/**
 * Act IV, row 59 outro (quest: Nobody Fires the Guard, ends at the armory doors; dusk). Diggs comes out from the sealed
 * armory (it opens from below later, row 60). Up the road come the rides of everyone the HOA ever ticketed: Granny
 * with pie, Bracken on foot with his boots on, Tansy and Pip. Pip asks if this is big enough for the forty-eighth
 * wrench: "No. ...Close." The hardliner turns, salutes the player and says the Guard is with them. Quiet, no title:
 * the act goes on (the Combine's wake-up is no longer this scene's button).
 */
export const SPADE_TRUCE_OUTRO: SceneScript = {
  id: 'spade-truce-outro',
  stage: { kind: 'world' },
  music: 'sandpit',
  ambience: 'wind',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/spade-truce-outro.md', kind: 'outro' },
  actors: [
    { id: 'diggs', preset: 'diggs', name: 'Commander Diggs', at: [374, 38.5], yaw: 0 },
    { id: 'player', player: true, at: ST_PLAYER, yaw: towards(ST_PLAYER, ST_DIGGS) },
    { id: 'guard-w', name: 'Spade Guard', look: SPADE, at: ST_GUARD_W, yaw: towards(ST_GUARD_W, [374, 56]) },
    { id: 'guard-e', name: 'Spade Guard', look: SPADE, at: ST_GUARD_E, yaw: towards(ST_GUARD_E, [374, 56]) },
    { id: 'granny', preset: 'granny', name: 'Granny Gnertrude', at: [0, 0], seatedIn: 'granny-ride', held: 'acorn-cake' },
    { id: 'tansy', preset: 'tansy', name: 'Tansy Clayfoot', at: [0, 0], seatedIn: 'tansy-ride', held: null },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: [0, 0], seatedIn: 'pip-ride', held: null },
    { id: 'bracken', preset: 'bracken', name: 'Elder Bracken', at: ST_BRACKEN_FROM, yaw: towards(ST_BRACKEN_FROM, ST_BRACKEN), hidden: true },
  ],
  vehicles: [
    { id: 'granny-ride', ...rideOf('granny'), at: GRANNY_IN[0], yaw: Math.PI },
    { id: 'tansy-ride', ...rideOf('tansy'), at: TANSY_IN[0], yaw: Math.PI },
    { id: 'pip-ride', ...rideOf('pip'), at: PIP_IN[0], yaw: Math.PI },
  ],
  steps: [
    // 1. Hook: from the sealed armory behind him, two raps of a fist on steel, then Diggs walks out into the dusk.
    cut(shot('diggs', 'ms', { toward: 'player', side: 20, height: 'low' })),
    { do: 'sfx', id: 'knock', at: 'diggs', gain: 0.8 },
    { do: 'sfx', id: 'latch', at: 'diggs', gain: 0.5, async: true },
    { do: 'walk', who: 'diggs', path: [ST_DIGGS], speed: 1.4 },
    { do: 'face', who: 'diggs', at: 'player', s: 0.3 },
    { do: 'say', who: 'diggs', text: 'The armory is sealed from Thorne Tower. Not tonight.' },
    ...reaction('player', { toward: 'diggs', gesture: 'nod', size: 'mcu', side: -20, hold: 'pause' }),
    // 2. Engines on the road: everyone the HOA ever ticketed, arriving at once.
    { do: 'sfx', id: 'engine-rev', at: 'pip-ride', gain: 0.8 },
    cut({ kind: 'track', pos: up(369.5, 64, 1.0), who: 'granny-ride', fov: 50 }),
    { do: 'drive', vehicle: 'pip-ride', path: PIP_IN, speed: 8, async: true },
    { do: 'drive', vehicle: 'tansy-ride', path: TANSY_IN, speed: 8, async: true },
    { do: 'drive', vehicle: 'granny-ride', path: GRANNY_IN, speed: 7 },
    { do: 'face', who: 'diggs', at: 'granny-ride', s: 0.4 },
    { do: 'exit', who: 'granny', async: true },
    { do: 'exit', who: 'tansy', async: true },
    { do: 'exit', who: 'pip' },
    { do: 'spawn', id: 'bracken' },
    // 3. Bracken walks in, archaic and dry; Diggs, by the book, takes the boots in stride.
    { do: 'walk', who: 'bracken', path: [ST_BRACKEN], speed: 1.6, async: true },
    { do: 'walk', who: 'granny', path: [ST_GRANNY], speed: 1.2, async: true },
    { do: 'walk', who: 'tansy', path: [ST_TANSY], speed: 1.2, async: true },
    { do: 'walk', who: 'pip', path: [ST_PIP], speed: 1.6, async: true },
    cut(shot('bracken', 'ms', { toward: 'diggs', side: 25, height: 'low' })),
    { do: 'wait', s: 2.6 },
    { do: 'face', who: 'bracken', at: 'diggs', s: 0.4 },
    { do: 'say', who: 'bracken', text: 'The Unmowed are here, Commander. Mostly with their boots on.' },
    { do: 'face', who: 'diggs', at: 'bracken', s: 0.3 },
    cut(shot('diggs', 'mcu', { toward: 'bracken', side: -20, height: 'low' })),
    { do: 'say', who: 'diggs', text: 'Welcome to Fort Sandpit. Wipe your boots.' },
    // 4. Granny's pie, rung two: the Commander is handed dessert at attention.
    { do: 'face', who: 'granny', at: 'diggs', s: 0.3 },
    cut(shot('granny', 'mcu', { toward: 'diggs', side: 20 })),
    { do: 'say', who: 'granny', text: 'I brought pie.' },
    { do: 'face', who: 'diggs', at: 'granny', s: 0.3 },
    cut(shot('diggs', 'ms', { toward: 'granny', side: 30 })),
    { do: 'walk', who: 'granny', path: [[372.6, 47.2]], speed: 1.2 },
    { do: 'give', from: 'granny', to: 'diggs', s: 1.0 },
    beat('pause'),
    // 5. The brass wrench, rung two: the Guard is a big win, and still not big enough.
    { do: 'face', who: 'pip', at: 'tansy', s: 0.3 },
    { do: 'face', who: 'tansy', at: 'pip', s: 0.3 },
    cut(PT.single('pip', 'mcu')),
    { do: 'gesture', who: 'pip', name: 'cheer', s: 1.0, async: true },
    { do: 'say', who: 'pip', text: 'The Guard is ours! Big enough for the forty-eighth wrench?' },
    cut(PT.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'No.' },
    ...reaction('pip', { toward: 'tansy', gesture: 'slump', size: 'mcu', side: 25, hold: 'pause' }),
    cut(PT.single('tansy', 'cu')),
    beat('tiny'),
    { do: 'say', who: 'tansy', text: '...Close.' },
    // 6. The button: music out, the dusk goes quiet, and the hardliner salutes the player (his turn, in a gesture).
    { do: 'music', track: null, fade: 0.8 },
    { do: 'face', who: 'diggs', at: 'player', s: 0.5 },
    cut(shot('diggs', 'ms', { toward: 'player', side: -20, height: 'low' })),
    { do: 'wait', s: 0.8 },
    { do: 'gesture', who: 'diggs', name: 'tipHat', s: 1.6, async: true },
    { do: 'say', who: 'diggs', text: 'The Guard stands with you. Effective immediately.' },
    beat('silence'),
  ],
};

export const CH4_SCENES: Record<string, SceneScript> = {
  'spade-truce-outro': SPADE_TRUCE_OUTRO,
  ...CH4B_SCENES,
  ...CH4C_SCENES,
};
