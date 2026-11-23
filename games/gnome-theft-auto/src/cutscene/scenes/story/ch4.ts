// Chapter 4 story scenes (intros, outros, the chapter's opening and closing set pieces). Owner: one issue of
// docs/roadmaps/gta-story-cutscenes.md. Every id here is played by a quest in quests/chapter4.ts and checked by scenes.test.ts.
import type { SceneScript } from '../../script';
import { carMark, markOf, rideOf, spot, up } from './kit';
import { CH4B_SCENES } from './ch4b';
import { CH4C_SCENES } from './ch4c';

const SAFE = 'dust-safehouse';
const FIELD = 'airfield-apron';
const GATE = 'fort-sandpit-gate';
const PAD = 'fort-sandpit-pad';

const TANSY = markOf(SAFE, 'tansy');
const PIP = markOf(SAFE, 'pip');
const PLAYER_SAFE = markOf(SAFE, 'player');
const WALLY = markOf(FIELD, 'wally');
const GUARD_A = markOf(FIELD, 'spade-guard', 0);
const GUARD_B = markOf(FIELD, 'spade-guard', 1);
const DUSTER = carMark(FIELD, 'wally-crop-duster');
const CHOPPER = carMark(PAD, 'fort-whirligig');
const SNIPER_W = markOf(PAD, 'spade-guard-sniper', 0);
const SNIPER_E = markOf(PAD, 'spade-guard-sniper', 1);
const GATE_DIGGS = markOf(GATE, 'diggs');
const GATE_PLAYER = markOf(GATE, 'player');
const GATE_GUARD_W = markOf(GATE, 'spade-guard', 0);
const GATE_GUARD_E = markOf(GATE, 'spade-guard', 1);
const DIGGS_RIDE = carMark(GATE, 'diggs-zero-turn');

/** Spade Guard look, shared by every guard in this chapter's scenes (no preset in cast.ts). */
const SPADE = { hat: 0x4b6329, shirt: 0x556b2f, beard: 0x5c3e24 };

/**
 * CHAPTER 4 CLOSER (quest: Nobody Fires the Guard, ends at the armory inside Fort Sandpit (374, 10)). The arrivals
 * montage at the gate (Granny with pies, Elder Bracken, Tansy and Pip on Zero-Turns), the armory opens, the ground
 * shakes and a cut north to the Grand Combine on the Turfton meridian. Vesper on the PA, the chapter's end card.
 * The player ends on foot inside the fort.
 */
export const SPADE_TRUCE_OUTRO: SceneScript = {
  id: 'spade-truce-outro',
  stage: { kind: 'world' },
  music: 'sandpit',
  ambience: 'wind',
  actors: [
    { id: 'diggs', preset: 'diggs', name: 'Commander Diggs', at: GATE_DIGGS.at, yaw: GATE_DIGGS.yaw },
    { id: 'guard-w', name: 'Spade Guard', look: SPADE, at: GATE_GUARD_W.at, yaw: GATE_GUARD_W.yaw },
    { id: 'guard-e', name: 'Spade Guard', look: SPADE, at: GATE_GUARD_E.at, yaw: GATE_GUARD_E.yaw },
    { id: 'sniper-w', name: 'Spade Guard Sniper', look: SPADE, at: SNIPER_W.at, yaw: SNIPER_W.yaw },
    { id: 'sniper-e', name: 'Spade Guard Sniper', look: SPADE, at: SNIPER_E.at, yaw: SNIPER_E.yaw },
    { id: 'player', player: true, at: GATE_PLAYER.at, yaw: GATE_PLAYER.yaw },
    { id: 'granny', preset: 'granny', name: 'Granny Gnertrude', at: [0, 0], seatedIn: 'granny-ride', hidden: true },
    { id: 'tansy', preset: 'tansy', name: 'Tansy Clayfoot', at: [0, 0], seatedIn: 'tansy-ride', hidden: true },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: [0, 0], seatedIn: 'pip-ride', hidden: true, held: 'ammu-golden-kazoo' },
    { id: 'bracken', preset: 'bracken', name: 'Elder Bracken', at: [372, 80], hidden: true },
  ],
  vehicles: [
    { id: 'granny-ride', ...rideOf('granny'), at: [300, 40], yaw: Math.PI / 2, hidden: true },
    { id: 'tansy-ride', ...rideOf('tansy'), at: [300, 40], yaw: Math.PI / 2, hidden: true },
    { id: 'pip-ride', ...rideOf('pip'), at: [300, 40], yaw: Math.PI / 2, hidden: true },
  ],
  props: [
    { id: 'combine', prefab: 'grand-combine-boss', at: [0, -200], yaw: Math.PI, size: 14, by: 'w', hidden: true },
  ],
  steps: [
    { do: 'cam', shot: spot(GATE, 'wide') },
    { do: 'cam', shot: { kind: 'cut', pos: [375.67, 2.18, 40.73], look: 'diggs', fov: 46 } },
    { do: 'say', who: 'diggs', text: 'The armory is ours. Spade Guard reinstated, effective immediately.' },
    // The arrivals run together: three cars come up the fort-gate road while the crew talks over them.
    { do: 'spawn', id: 'granny-ride' },
    { do: 'spawn', id: 'granny' },
    { do: 'spawn', id: 'tansy-ride' },
    { do: 'spawn', id: 'tansy' },
    { do: 'spawn', id: 'pip-ride' },
    { do: 'spawn', id: 'pip' },
    { do: 'cam', shot: { kind: 'track', pos: up(386, 4, 66), who: 'granny-ride', fov: 50 } },
    { do: 'drive', vehicle: 'granny-ride', path: [[340, 56], [374, 70], [374, 56]], speed: 8, depart: true, arrive: true, async: true },
    { do: 'drive', vehicle: 'tansy-ride', path: [[340, 56], [374, 70], [380, 64]], speed: 8, depart: true, arrive: true, async: true },
    { do: 'drive', vehicle: 'pip-ride', path: [[340, 56], [374, 70], [364, 60]], speed: 8, depart: true, arrive: true, async: true },
    { do: 'cam', shot: { kind: 'cut', pos: [303.33, 2.65, 39.53], look: 'tansy', fov: 46 } },
    { do: 'say', who: 'tansy', text: 'Forty-seven wrenches in size order. The brass one stays locked until a big heist.' },
    { do: 'cam', shot: { kind: 'cut', pos: [346.22, 2.39, 56.77], look: 'pip', fov: 46 } },
    { do: 'say', who: 'pip', text: 'This is the big heist, Tansy. We just took a fort.' },
    { do: 'say', who: 'pip', text: 'Clara\'s refugees still need a lift to Porcelain Support.' },
    { do: 'spawn', id: 'bracken', at: [374, 72] },
    { do: 'walk', who: 'bracken', path: [[376, 62]], speed: 1.6, async: true },
    { do: 'cam', shot: { kind: 'cut', pos: [372.99, 2.13, 68.53], look: 'bracken', fov: 46 } },
    { do: 'say', who: 'bracken', text: 'The Unmowed are here, Commander. Mostly with their boots on.' },
    { do: 'cam', shot: { kind: 'cut', pos: [375.67, 2.18, 40.73], look: 'diggs', fov: 46 } },
    { do: 'say', who: 'diggs', text: 'Spade Guard, Unmowed, Carburettors, Cloverfield. In one sandbox.' },
    { do: 'cam', shot: { kind: 'cut', pos: [372.22, 2.18, 53.34], look: 'granny', fov: 46 } },
    { do: 'say', who: 'granny', text: 'I brought pie.' },
    { do: 'despawn', id: 'diggs' },
    { do: 'despawn', id: 'player' },
    { do: 'cam', shot: spot(PAD, 'two-shot') },
    { do: 'spawn', id: 'diggs', at: [374, 16], yaw: Math.PI },
    { do: 'spawn', id: 'player', at: [372, 18], yaw: Math.PI },
    { do: 'sfx', id: 'door', at: 'diggs' },
    { do: 'music', track: 'triumph', fade: 0.6 },
    { do: 'gesture', who: 'diggs', name: 'cheer', s: 1.4 },
    { do: 'gesture', who: 'sniper-w', name: 'handsUp', s: 1.2, async: true },
    { do: 'gesture', who: 'sniper-e', name: 'handsUp', s: 1.2 },
    { do: 'shake', amp: 0.15, s: 1.5 },
    { do: 'sfx', id: 'boom', gain: 0.5 },
    { do: 'cam', shot: { kind: 'cut', pos: up(0, -236, 2.4), look: up(0, -200, 6), fov: 56 } },
    { do: 'spawn', id: 'combine' },
    { do: 'say', who: 'Vesper', text: 'Tonight, Turfton achieves zero-millimetre perfection.', hz: 92, music: 'villain', stinger: 'villain' },
    { do: 'title', text: 'END OF CHAPTER 4' },
    { do: 'wait', s: 3 },
    { do: 'title', text: null },
  ],
};

export const CH4_SCENES: Record<string, SceneScript> = {
  'spade-truce-outro': SPADE_TRUCE_OUTRO,
  ...CH4B_SCENES,
  ...CH4C_SCENES,
};
