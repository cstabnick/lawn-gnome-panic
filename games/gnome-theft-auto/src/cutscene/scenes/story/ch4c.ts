// Chapter 4, the flight home and the Spade Guard truce. Re-directed in the Story B direction pass (docs/design/gnome-theft-auto/direction/lanes.md);
// notes in direction/scenes/<id>.md. Registered through CH4_SCENES in ch4.ts.
import type { SceneScript } from '../../script';
import { beat, coverage, cut, exchangeLooks, reaction, shot } from '../../direct';
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

export const CH4C_SCENES: Record<string, SceneScript> = {
  'sandpit-drop-outro': SANDPIT_DROP_OUTRO,
  'spade-truce-intro': SPADE_TRUCE_INTRO,
};
