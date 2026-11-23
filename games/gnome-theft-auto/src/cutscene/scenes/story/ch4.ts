// Chapter 4 story scenes (intros, outros, the chapter's opening and closing set pieces). Owner: one issue of
// docs/roadmaps/gta-story-cutscenes.md. Every id here is played by a quest in quests/chapter4.ts and checked by scenes.test.ts.
import type { SceneScript } from '../../script';
import { carMark, markOf, rideOf, spot, up } from './kit';

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
 * CHAPTER 4 OPENER (quest: Runway Flares, giver Dust Flats Overlook). A crane over the Dust Flats to Fort Sandpit,
 * the title card, the crew at the safehouse map table, a cut to the airfield where Wally reads the windsock, then
 * Pip toots his golden kazoo. The player ends on foot at the overlook.
 */
export const RUNWAY_INTRO: SceneScript = {
  id: 'runway-intro',
  stage: { kind: 'world' },
  music: 'sandpit',
  ambience: 'wind',
  actors: [
    { id: 'tansy', preset: 'tansy', name: 'Tansy Clayfoot', at: TANSY.at, yaw: TANSY.yaw, held: 'stopping-stone' },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: PIP.at, yaw: PIP.yaw, held: 'ammu-golden-kazoo' },
    { id: 'player', player: true, at: PLAYER_SAFE.at, yaw: PLAYER_SAFE.yaw },
    { id: 'wally', preset: 'wally', name: 'Wind-Sock Wally', at: WALLY.at, yaw: WALLY.yaw },
    { id: 'guard-a', name: 'Spade Guard', look: SPADE, at: GUARD_A.at, yaw: GUARD_A.yaw },
    { id: 'guard-b', name: 'Spade Guard', look: SPADE, at: GUARD_B.at, yaw: GUARD_B.yaw },
  ],
  vehicles: [
    { id: 'duster', kind: 'plane', at: DUSTER.at, yaw: DUSTER.yaw },
  ],
  steps: [
    { do: 'cam', shot: { kind: 'dolly', from: up(214, -70, 64), to: up(246, -14, 44), look: up(330, -6, 6), lookTo: up(366, 4, 10), s: 9, fov: 54 } },
    { do: 'stinger', id: 'chapter' },
    { do: 'title', text: 'CHAPTER 4 — SANDPIT PROTOCOL' },
    { do: 'wait', s: 3 },
    { do: 'title', text: null },
    { do: 'cam', shot: spot(SAFE, 'wide') },
    { do: 'cam', shot: { kind: 'cut', pos: [268.12, 2.73, 39.8], look: 'tansy', fov: 46 } },
    { do: 'say', who: 'tansy', text: 'I\'ve got the Stopping Stone. We\'re not driving a combine through Fort Sandpit\'s front gate.' },
    { do: 'cam', shot: spot(SAFE, 'overhead') },
    { do: 'walk', who: 'pip', path: [[276, 50], [272, 47]], async: true },
    { do: 'cam', shot: { kind: 'cut', pos: [275.4, 2.66, 53.49], look: 'pip', fov: 46 } },
    { do: 'say', who: 'pip', text: 'Then we don\'t drive. We fly. First, clear the Spade Guard patrols at the Desert Airfield.' },
    { do: 'say', who: 'pip', text: 'Steal a Crop Duster, then buzz the Dust Flats so the Unmowed know we are coming.' },
    { do: 'cam', shot: spot(FIELD, 'wide') },
    { do: 'gesture', who: 'guard-a', name: 'point', s: 1.2, async: true },
    { do: 'gesture', who: 'guard-b', name: 'shrug', s: 1.2 },
    { do: 'cam', shot: { kind: 'cut', pos: up(552, -100, 2.4), look: 'wally', fov: 46 } },
    { do: 'gesture', who: 'wally', name: 'sit', s: 0.3 },
    { do: 'cam', shot: { kind: 'cut', pos: [562.27, 1.81, -108.33], look: 'wally', fov: 46 } },
    { do: 'say', who: 'wally', text: 'Wind\'s west at four knots. Stall speed\'s 22, kid.' },
    { do: 'say', who: 'wally', text: 'Don\'t clip my lawn chair on the way up.' },
    { do: 'cam', shot: spot(SAFE, 'two-shot') },
    { do: 'say', who: 'pip', text: 'Ammu-Gnation gave me the pistol free. The golden kazoo bolt-on cost forty acorns.' },
    { do: 'gesture', who: 'pip', name: 'handsUp', s: 0.8, async: true },
    { do: 'stinger', id: 'comic' },
    { do: 'sfx', id: 'whistle', gain: 0.6 },
    { do: 'say', who: 'pip', text: 'Toot. That is the sound of a lethal, shiny plan.' },
    { do: 'say', who: 'tansy', text: 'Pip, put the kazoo down before the spotters hear you.' },
    { do: 'walk', who: 'player', path: [[274, 44]] },
    { do: 'face', who: 'player', at: 'tansy', s: 0.3 },
  ],
};

/**
 * Giver line before the Sandpit Drop (quest: The Sandpit Drop). The crew plans the air drop over the wall, and
 * the Whirligig pad inside Fort Sandpit is shown with a sniper on it. The player ends on foot at the overlook.
 */
export const SANDPIT_DROP_INTRO: SceneScript = {
  id: 'sandpit-drop-intro',
  stage: { kind: 'world' },
  music: 'heist',
  ambience: 'wind',
  actors: [
    { id: 'tansy', preset: 'tansy', name: 'Tansy Clayfoot', at: TANSY.at, yaw: TANSY.yaw },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: PIP.at, yaw: PIP.yaw, held: 'ammu-golden-kazoo' },
    { id: 'player', player: true, at: [274, 44], yaw: -2.36 },
    { id: 'sniper-w', name: 'Spade Guard Sniper', look: SPADE, at: SNIPER_W.at, yaw: SNIPER_W.yaw },
    { id: 'sniper-e', name: 'Spade Guard Sniper', look: SPADE, at: SNIPER_E.at, yaw: SNIPER_E.yaw },
  ],
  vehicles: [
    { id: 'chopper', kind: 'whirligig', at: CHOPPER.at, yaw: CHOPPER.yaw },
  ],
  steps: [
    { do: 'cam', shot: spot(SAFE, 'overhead') },
    { do: 'cam', shot: { kind: 'cut', pos: [278.12, 2.63, 52.8], look: 'pip', fov: 46 } },
    { do: 'say', who: 'pip', text: 'Okay, hear me out. Five Spade Guard snipers watch the gate.' },
    { do: 'say', who: 'pip', text: 'So we fly a Crop Duster over the wall and bail out without checking the parachute.' },
    { do: 'cam', shot: spot(SAFE, 'two-shot') },
    { do: 'say', who: 'tansy', text: 'Land on the Whirligig pad inside: the chopper Vesper cited for "unauthorized verticality".' },
    { do: 'cam', shot: spot(PAD, 'overhead') },
    { do: 'gesture', who: 'sniper-w', name: 'point', s: 1.2, async: true },
    { do: 'cam', shot: spot(PAD, 'wide') },
    { do: 'wait', s: 1.5 },
    { do: 'cam', shot: spot(SAFE, 'two-shot') },
    { do: 'say', who: 'pip', text: 'Parachutes are just umbrellas with ambition.' },
  ],
};

/**
 * Chapter 4 flight home (quest: The Sandpit Drop, ends at the safehouse (280, 40)). The player flies the stolen
 * Whirligig in and lands in a dust cloud. Commander Diggs tears out of the fort gate on his Zero-Turn and stops
 * in a standoff. The player steps out on foot at the overlook.
 */
export const SANDPIT_DROP_OUTRO: SceneScript = {
  id: 'sandpit-drop-outro',
  stage: { kind: 'world' },
  music: 'triumph',
  ambience: 'wind',
  actors: [
    { id: 'player', player: true, at: [290, 38], seatedIn: 'ride' },
    { id: 'tansy', preset: 'tansy', name: 'Tansy Clayfoot', at: TANSY.at, yaw: TANSY.yaw },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: PIP.at, yaw: PIP.yaw, held: 'ammu-golden-kazoo' },
    { id: 'diggs', preset: 'diggs', name: 'Commander Diggs', at: [0, 0], seatedIn: 'diggs-ride', hidden: true },
  ],
  vehicles: [
    { id: 'ride', kind: 'whirligig', from: 'player', at: up(340, 70, 60) },
    { id: 'diggs-ride', ...rideOf('diggs'), at: DIGGS_RIDE.at, yaw: DIGGS_RIDE.yaw, hidden: true },
  ],
  steps: [
    { do: 'cam', shot: { kind: 'cut', pos: spot(SAFE, 'wide').pos, look: 'ride', fov: 50 } },
    { do: 'drive', vehicle: 'ride', path: [up(330, 40, 52), up(308, 16, 46), up(291, 4, 39)], speed: 9, async: true },
    { do: 'cam', shot: { kind: 'cut', pos: [268.12, 2.73, 39.8], look: 'tansy', fov: 46 } },
    { do: 'say', who: 'tansy', text: 'Lower, Pip. Lower. The dust is not your friend.' },
    { do: 'wait', s: 1.5 },
    { do: 'shake', amp: 0.25, s: 1.2 },
    { do: 'sfx', id: 'thud', at: 'ride', gain: 0.9 },
    { do: 'cam', shot: { kind: 'track', pos: up(304, 1.6, 14), who: 'ride', fov: 50 } },
    { do: 'gesture', who: 'tansy', name: 'cheer', s: 1.2, async: true },
    { do: 'gesture', who: 'pip', name: 'handsUp', s: 1.2 },
    { do: 'cam', shot: { kind: 'cut', pos: [278.12, 2.63, 52.8], look: 'pip', fov: 46 } },
    { do: 'say', who: 'pip', text: 'Landed! Nobody check the parachute. Nobody.' },
    { do: 'spawn', id: 'diggs-ride' },
    { do: 'spawn', id: 'diggs' },
    { do: 'music', track: 'chase', fade: 0.5 },
    { do: 'sfx', id: 'engine-rev', at: 'diggs-ride', gain: 1 },
    { do: 'cam', shot: { kind: 'track', pos: up(386, 4, 66), who: 'diggs-ride', fov: 50 } },
    { do: 'drive', vehicle: 'diggs-ride', path: [[374, 70], [340, 56], [302, 44]], speed: 15, depart: true, arrive: true },
    { do: 'sfx', id: 'skid', at: 'diggs-ride', gain: 0.9 },
    { do: 'stinger', id: 'danger' },
    { do: 'cam', shot: { kind: 'cut', pos: up(296, 1.8, 36), look: 'diggs', fov: 46 } },
    { do: 'cam', shot: { kind: 'cut', pos: [298.9, 2.65, 44.77], look: 'diggs', fov: 46 } },
    { do: 'say', who: 'diggs', text: 'Fifteen years I\'ve guarded that chopper. Fifteen years nobody\'s been allowed to turn it on.' },
    { do: 'exit', who: 'diggs' },
    { do: 'gesture', who: 'diggs', name: 'point', s: 1.2 },
    { do: 'cam', shot: { kind: 'cut', pos: [268.12, 2.73, 39.8], look: 'tansy', fov: 46 } },
    { do: 'say', who: 'tansy', text: 'Diggs, nobody is turning anything on. We\'re only borrowing it.' },
    { do: 'exit', who: 'player' },
    { do: 'walk', who: 'player', path: [[284, 40]], run: true },
    { do: 'face', who: 'player', at: 'diggs', s: 0.3 },
  ],
};

/**
 * Standoff after the Sandpit Drop (quest: Nobody Fires the Guard, giver Dust Flats Overlook). Diggs's radio crackles:
 * Vesper has locked the armory and made the Spade Guard redundant. Diggs stands down and asks the player to help
 * retake the armory. He climbs on his Zero-Turn. The player ends on foot at the overlook.
 */
export const SPADE_TRUCE_INTRO: SceneScript = {
  id: 'spade-truce-intro',
  stage: { kind: 'world' },
  music: 'tension',
  ambience: 'wind',
  actors: [
    { id: 'player', player: true, at: [288, 46], yaw: Math.PI / 2 },
    { id: 'tansy', preset: 'tansy', name: 'Tansy Clayfoot', at: [276, 50], yaw: Math.PI / 2 },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: [272, 46], yaw: Math.PI / 2, held: 'ammu-golden-kazoo' },
    { id: 'diggs', preset: 'diggs', name: 'Commander Diggs', at: [302, 44], yaw: -Math.PI / 2 },
  ],
  vehicles: [
    { id: 'chopper', kind: 'whirligig', from: 'player', at: [290, 38] },
    { id: 'diggs-ride', ...rideOf('diggs'), at: [306, 44], yaw: -Math.PI / 2, hidden: true },
  ],
  steps: [
    { do: 'cam', shot: { kind: 'cut', pos: up(283, 1.7, 50), look: 'diggs', fov: 48 } },
    { do: 'sfx', id: 'phone', at: 'diggs' },
    { do: 'say', who: 'Vesper', text: 'Commander. The armory is locked, effective immediately. The Spade Guard is redundant.', hz: 92, music: 'villain', stinger: 'villain' },
    { do: 'gesture', who: 'diggs', name: 'crossArms', s: 1.4 },
    { do: 'cam', shot: { kind: 'cut', pos: [299.27, 2.65, 45.67], look: 'diggs', fov: 46 } },
    { do: 'say', who: 'diggs', text: 'Redundant.' },
    { do: 'cam', shot: { kind: 'cut', pos: up(276, 1.7, 50), look: 'tansy', fov: 46 } },
    { do: 'cam', shot: { kind: 'cut', pos: [278.73, 2.64, 48.33], look: 'tansy', fov: 46 } },
    { do: 'say', who: 'tansy', text: 'Nobody fires the Guard. Especially not a guy in a porcelain hat.' },
    { do: 'music', track: 'sandpit', fade: 1.2 },
    { do: 'cam', shot: { kind: 'cut', pos: up(283, 1.7, 50), look: 'diggs', fov: 48 } },
    { do: 'cam', shot: { kind: 'cut', pos: [299.27, 2.65, 45.67], look: 'diggs', fov: 46 } },
    { do: 'say', who: 'diggs', text: 'Roll with me back to the gate and help me take my armory back.' },
    { do: 'spawn', id: 'diggs-ride' },
    { do: 'enter', who: 'diggs', vehicle: 'diggs-ride' },
    { do: 'cam', shot: { kind: 'cut', pos: [274.73, 2.68, 44.33], look: 'pip', fov: 46 } },
    { do: 'say', who: 'pip', text: 'Ten acorns says he hits the gate first.' },
    { do: 'walk', who: 'player', path: [[280, 44], [276, 42]] },
    { do: 'face', who: 'player', at: 'tansy', s: 0.3 },
  ],
};

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
  'runway-intro': RUNWAY_INTRO,
  'sandpit-drop-intro': SANDPIT_DROP_INTRO,
  'sandpit-drop-outro': SANDPIT_DROP_OUTRO,
  'spade-truce-intro': SPADE_TRUCE_INTRO,
  'spade-truce-outro': SPADE_TRUCE_OUTRO,
};
