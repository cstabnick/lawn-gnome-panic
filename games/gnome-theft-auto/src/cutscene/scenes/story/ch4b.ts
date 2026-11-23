// Chapter 4, the opener and the drop briefing at the Dust Flats safehouse. Re-directed in the Story B direction pass (docs/design/gnome-theft-auto/direction/lanes.md);
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

export const CH4B_SCENES: Record<string, SceneScript> = {
  'runway-intro': RUNWAY_INTRO,
  'sandpit-drop-intro': SANDPIT_DROP_INTRO,
};
