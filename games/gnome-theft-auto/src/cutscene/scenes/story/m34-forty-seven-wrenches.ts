// Story row 34: Forty-Seven Wrenches. Three scenes at the Side-Valve bay: Pip on a ladder hanging bunting for a party (intro,
// noon), the party itself, Tansy counting her wrenches and stopping short of the forty-eighth (mid, dusk), and Cam's tin-can
// call to Vesper once the guests have gone home (outro, night; the call moved here from the old tablet-outro, wording kept).
// Notes: docs/design/gnome-theft-auto/direction/scenes/m34-forty-seven-wrenches-{intro,mid,outro}.md
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, shot } from '../../direct';
import { carMark, markOf, up } from './kit';

const SV = 'side-valve-bay';
const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

/** Tansy's wrench wall and the bench with the cigar box, as the prologue and the Even Cut scenes place them. */
const RACK: Vec2 = [-157.6, 74.2];
const BOX_AT: [number, number, number] = up(-156.9, 76.1, 0.6);
/** Cam's mark on the apron: the broom is in every Side-Valve scene. */
const CAM = markOf(SV, 'turncoat-cam');

// ---- Intro: the ladder ---------------------------------------------------------------------------------------------------

const I_PLAYER: Vec2 = [-152.4, 69.2];
const I_LADDER: Vec2 = [-146.6, 73.6];
const I_PIP: Vec2 = [-148.2, 72.4];
const PP = coverage('pip', 'player', 1);

export const FORTY_SEVEN_WRENCHES_INTRO: SceneScript = {
  id: 'm34-forty-seven-wrenches-intro',
  stage: { kind: 'world' },
  music: 'turfton',
  ambience: 'street',
  sky: 'noon',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m34-forty-seven-wrenches-intro.md', kind: 'intro' },
  title: 'Forty-Seven Wrenches',
  actors: [
    { id: 'player', player: true, at: I_PLAYER, yaw: towards(I_PLAYER, I_PIP) },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: I_PIP, yaw: towards(I_PIP, I_PLAYER), held: 'banner-scrap-flag' },
    { id: 'turncoat', preset: 'turncoat cam', name: 'Turncoat Cam', at: CAM.at, yaw: CAM.yaw, held: 'broom' },
  ],
  props: [
    // L95: Pip's ladder, a bunting span half-hung behind it, and a pie tin set out far too early.
    { id: 'ladder', prefab: 'ladder', at: I_LADDER, yaw: Math.PI, size: 2.4, by: 'h' },
    { id: 'bunting-a', prefab: 'bunting-span', at: [-150, 75.6], yaw: 0, size: 10 },
    { id: 'table', prefab: 'table', at: [-140, 76], yaw: 0 },
    { id: 'early-pie', prefab: 'pie-tin', at: up(-140, 76, 0.78), yaw: 0.4 },
  ],
  steps: [
    // 1. Hook: Pip at the ladder's foot, low shot, a banner in one hand and no hand free for the ladder.
    cut(shot('pip', 'mcu', { toward: 'player' })),
    { do: 'sfx', id: 'creak', at: 'pip', gain: 0.5, async: true },
    { do: 'gesture', who: 'pip', name: 'point', s: 1.2, async: true },
    { do: 'say', who: 'pip', text: "Hold the ladder! Not that one. The one I'm holding." },
    // 2. The player's dry question; Pip answers it too big.
    cut(PP.single('player', 'mcu')),
    { do: 'say', who: 'player', text: "What's the bunting for?" },
    cut(PP.single('pip', 'mcu')),
    { do: 'gesture', who: 'pip', name: 'cheer', s: 1.3, async: true },
    { do: 'say', who: 'pip', text: 'The Green is open! Rezoned, ours, legal. We are having a party!' },
    // 3. The job.
    cut(PP.single('player', 'mcu')),
    { do: 'say', who: 'player', text: "Who's coming?" },
    cut(PP.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Granny, Juniper, John from the shop. Go and fetch them. Pie is mandatory.' },
    cut(PP.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Does Tansy know?' },
    cut(PP.single('pip', 'mcu')),
    { do: 'gesture', who: 'pip', name: 'shrug', s: 1.0, async: true },
    { do: 'say', who: 'pip', text: "She says it's not a party. It's an inventory. She's coming!" },
    // 4. Button: the ladder answers for him; Cam keeps sweeping.
    { do: 'sfx', id: 'clatter', at: 'ladder', gain: 0.6, async: true },
    { do: 'gesture', who: 'pip', name: 'flinch', s: 1.0, async: true },
    cut(shot('pip', 'ms', { toward: 'player', side: 40 })),
    { do: 'say', who: 'pip', text: "I'm fine! Granny first!" },
    { do: 'walk', who: 'turncoat', path: [[-156, 67.2], [-153, 67.2]], speed: 0.8, async: true },
    { do: 'wait', s: 1.4 },
  ],
};

// ---- Mid: the party ---------------------------------------------------------------------------------------------------

const M_PLAYER: Vec2 = [-152, 70.2];
const M_TANSY: Vec2 = [-155, 73.6];
const M_PIP: Vec2 = [-148.8, 72.2];
const M_GRANNY: Vec2 = [-151, 74.8];
const M_JUNIPER: Vec2 = [-148.4, 75];
const M_BODEGA: Vec2 = [-145.6, 73.2];
const TP = coverage('tansy', 'player', -1);
const JT = coverage('tansy', 'juniper', -1);
const GT = coverage('tansy', 'granny', 1);
const GB = coverage('granny', 'bodega', 1);
const BP = coverage('bodega', 'pip', -1);
const TALK = coverage('tansy', 'pip', -1);

export const FORTY_SEVEN_WRENCHES_MID: SceneScript = {
  id: 'm34-forty-seven-wrenches-mid',
  stage: { kind: 'world' },
  music: 'warm',
  ambience: 'crowd',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m34-forty-seven-wrenches-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, at: M_PLAYER, yaw: towards(M_PLAYER, M_TANSY) },
    { id: 'tansy', preset: 'tansy', name: 'Tansy Clayfoot', at: M_TANSY, yaw: towards(M_TANSY, M_PIP), held: null },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: M_PIP, yaw: towards(M_PIP, M_TANSY), held: null },
    { id: 'granny', preset: 'granny', name: 'Granny Gnertrude', at: M_GRANNY, yaw: towards(M_GRANNY, M_TANSY), held: 'pie-tin' },
    { id: 'juniper', preset: 'juniper', name: 'Councilwoman Vance', at: M_JUNIPER, yaw: towards(M_JUNIPER, M_TANSY), held: null },
    { id: 'bodega', preset: 'bodega', name: 'John Bodega', at: M_BODEGA, yaw: towards(M_BODEGA, M_TANSY), held: 'broom' },
    { id: 'turncoat', preset: 'turncoat cam', name: 'Turncoat Cam', at: CAM.at, yaw: CAM.yaw, held: 'broom' },
  ],
  props: [
    // L95: the wall of forty-seven, the bunting along the front, the cigar box on the bench (shut), and a table of pie.
    { id: 'rack', prefab: 'wrench-rack', at: RACK, yaw: Math.PI / 2, size: 1.5 },
    { id: 'cigar-box', prefab: 'cigar-box', at: BOX_AT, yaw: 0.2, size: 0.32 },
    { id: 'bunting-a', prefab: 'bunting-span', at: [-150, 75.6], yaw: 0, size: 10 },
    { id: 'bunting-b', prefab: 'bunting-span', at: [-150.25, 64.4], yaw: 0, size: 13.5 },
    { id: 'table', prefab: 'table', at: [-140, 76], yaw: 0 },
    { id: 'pie', prefab: 'pie-tin', at: up(-140, 76, 0.78), yaw: 0.4 },
  ],
  steps: [
    // 1. Hook: the party seen from the apron, bunting overhead, a pie going round. Warm, loud, golden.
    { do: 'cam', shot: { kind: 'dolly', from: up(-141, 64.5, 2.4), to: up(-144, 66, 1.7), look: up(-150, 74, 1.3), s: 3.6, fov: 52 } },
    { do: 'sfx', id: 'clink', at: 'pip', gain: 0.5, async: true },
    { do: 'wait', s: 3.6 },
    cut(TALK.single('pip', 'mcu')),
    { do: 'gesture', who: 'pip', name: 'cheer', s: 1.2, async: true },
    { do: 'say', who: 'pip', text: "Everyone's here! Speech, Tansy! Speech!" },
    // 2. Tansy will not give a speech: she gives an inventory. She counts the wall aloud, the cigar box in shot behind her.
    cut(TALK.single('tansy', 'ms')),
    { do: 'gesture', who: 'tansy', name: 'point', s: 1.4, async: true },
    { do: 'say', who: 'tansy', text: 'No speech. Inventory. Forty-five. Forty-six. Forty-seven. All present.' },
    cut(JT.single('juniper', 'mcu')),
    { do: 'say', who: 'juniper', text: 'Forty-seven wrenches, and a hook for a forty-eighth.' },
    // 3. The story of the empty hook. The first sincere beat of the night: the music drops, Tansy slows down.
    cut(JT.single('tansy', 'mcu')),
    { do: 'music', track: 'mystery', fade: 1.2 },
    { do: 'gesture', who: 'tansy', name: 'think', s: 1.2, async: true },
    { do: 'say', who: 'tansy', text: 'Gnorwin Clayfoot hung them in size order. One for every job he finished.' },
    cut(TP.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'And the last hook?' },
    cut(TP.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'He cast one more. Brass. Biggest of all.' },
    // The cigar box, shut, on the bench: the held look.
    { do: 'cam', shot: { kind: 'dolly', from: up(-153.6, 74.2, 1.5), to: up(-155, 75, 1.2), look: BOX_AT, s: 2.8, fov: 36 } },
    { do: 'sfx', id: 'tap', at: BOX_AT, gain: 0.4, async: true },
    { do: 'wait', s: 2.8 },
    cut(TP.single('tansy', 'cu')),
    beat('pause'),
    { do: 'say', who: 'tansy', text: 'That one is for the day we...' },
    beat('pause'),
    { do: 'say', who: 'tansy', text: 'Eat your pie.' },
    // 4. The room exhales: Granny, then John, then the toast. The warm music comes back.
    { do: 'music', track: 'warm', fade: 1.4 },
    cut(GT.single('granny', 'mcu')),
    { do: 'gesture', who: 'granny', name: 'nod', s: 1.0, async: true },
    { do: 'say', who: 'granny', text: 'Hush now, sugar. The crust is waiting.' },
    cut(GB.single('bodega', 'mcu')),
    { do: 'say', who: 'bodega', text: 'Pie. Not for sale. Six acorns.' },
    { do: 'face', who: 'pip', at: 'bodega', s: 0.4 },
    cut(BP.single('pip', 'mcu')),
    { do: 'gesture', who: 'pip', name: 'cheer', s: 1.2, async: true },
    { do: 'say', who: 'pip', text: 'To the Green!' },
    // 5. Button: under the cheering, the broom stops. Cam, in the corner, looking at the cigar box.
    { do: 'sfx', id: 'clink', gain: 0.6, async: true },
    cut(shot('turncoat', 'ms', { toward: 'tansy', side: 35 })),
    { do: 'face', who: 'turncoat', at: [-156.9, 76.1], s: 0.8 },
    beat('pause'),
    { do: 'wait', s: 1.2 },
  ],
};

// ---- Outro: the tin-can call ---------------------------------------------------------------------------------------------

const O_CAM: Vec2 = [-152.6, 66.8];
const O_RACER: Vec2 = [-134, 70];

export const FORTY_SEVEN_WRENCHES_OUTRO: SceneScript = {
  id: 'm34-forty-seven-wrenches-outro',
  stage: { kind: 'world' },
  music: 'warm',
  ambience: 'night',
  sky: 'night',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m34-forty-seven-wrenches-outro.md', kind: 'outro' },
  actors: [
    { id: 'turncoat', preset: 'turncoat cam', name: 'Turncoat Cam', at: O_CAM, yaw: towards(O_CAM, O_RACER), held: null },
  ],
  vehicles: [
    { id: 'pip-ride', ...carMark(SV, 'pip-zero-turn') },
  ],
  props: [
    // L95: the party is over and the bay shows it: bunting still up, an empty pie tin, the broom leaned on the lamp.
    { id: 'lamp', prefab: 'lamp', at: [-154.4, 67.6], yaw: 0 },
    { id: 'broom', prefab: 'broom', at: up(-155, 67.6, 0.6), yaw: 0.3 },
    { id: 'bunting-b', prefab: 'bunting-span', at: [-150.25, 64.4], yaw: 0, size: 13.5 },
    { id: 'table', prefab: 'table', at: [-140, 76], yaw: 0 },
    { id: 'pie', prefab: 'pie-tin', at: up(-140, 76, 0.78), yaw: 0.4 },
  ],
  steps: [
    // 1. Hook: the bay after the guests, the bunting still up, the last of the party dying in the music.
    { do: 'cam', shot: { kind: 'cut', pos: up(-146, 61.6, 1.6), look: up(-148, 70, 1.4), fov: 48 } },
    { do: 'sfx', id: 'clink', at: 'pip-ride', gain: 0.3, async: true },
    { do: 'music', track: 'tension', fade: 2.4 },
    { do: 'wait', s: 2.4 },
    // 2. Cam, alone, looking at Pip's racer: the held beat that plants his motive. He holds the tin can to his ear.
    { do: 'hold', who: 'turncoat', prop: 'tin-can-phone' },
    cut(shot('turncoat', 'ms', { side: 50 })),
    { do: 'face', who: 'turncoat', at: O_RACER, s: 0.6 },
    { do: 'wait', s: 1.6 },
    // 3. The push-in: he faces the camera and says it. Short, flat, the price at the end.
    { do: 'cam', shot: { kind: 'dolly', from: up(-150.8, 64.4, 1.6), to: up(-152, 65.6, 1.5), look: 'turncoat', s: 4.5, fov: 44 } },
    { do: 'face', who: 'turncoat', at: [-150.8, 64.4], s: 0.5 },
    { do: 'sfx', id: 'static', at: 'turncoat', gain: 0.4, async: true },
    { do: 'say', who: 'turncoat', text: "It's Cam, at Tansy's. The acorn's under the bench. Tuesday. The charter's mine." },
    { do: 'stinger', id: 'villain' },
    { do: 'music', track: 'villain', fade: 1.2 },
    { do: 'say', who: 'Vesper Thorne', text: 'Of course, Cameron.', hz: 92 },
    beat('pause'),
    { do: 'sfx', id: 'static', at: 'turncoat', gain: 0.3, async: true },
    { do: 'cam', shot: { kind: 'dolly', from: up(-152, 65.6, 1.5), to: up(-147, 61.5, 2.6), look: 'turncoat', s: 3.4, fov: 48 } },
    { do: 'wait', s: 3.4 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm34-forty-seven-wrenches-intro': FORTY_SEVEN_WRENCHES_INTRO,
  'm34-forty-seven-wrenches-mid': FORTY_SEVEN_WRENCHES_MID,
  'm34-forty-seven-wrenches-outro': FORTY_SEVEN_WRENCHES_OUTRO,
};
