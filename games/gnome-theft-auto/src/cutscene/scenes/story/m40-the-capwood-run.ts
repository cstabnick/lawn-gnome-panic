// Story row 40: The Capwood Run. Two scenes. Intro (dawn, the start line in the Fells paddock): Lulu sits on the bonnet of her
// lowrider with the three Carburettors who stayed drawn up in a row behind her, remembers that Cam read her plate all night and took
// the charter, and says she will not sign: she races. Outro (low gold sun, the Great Ring clearing in Capwood): Warden Chanterelle
// Stook fines the player for eleven bruised caps (her first appearance), and Lulu reads the HOA charter aloud, laughs, and tears it
// in half in front of everyone: from Cam's rival to the crew's ally, in one gesture. Timing follows batch-3-notes section 7.
// Notes: docs/design/gnome-theft-auto/direction/scenes/m40-the-capwood-run-{intro,outro}.md
import type { SceneScript } from '../../script';
import { beat, coverage, cut, pushIn, reaction, shot } from '../../direct';
import { carMark, markOf, spot, up } from './kit';

const LINE = 'capwood-start-line';
const RING = 'great-ring-clearing';
const BERTHA_LOOK = { hat: 0xff6a00, shirt: 0x3a2a2a, beard: 0xd8d0c0, dress: true } as const;
const DUNSTAN_LOOK = { hat: 0xe8c33a, shirt: 0x2a3a4a, beard: 0x8a6a4a, glasses: true } as const;
const FENNIMORE_LOOK = { hat: 0x3a7a6a, shirt: 0xd8d0c0, beard: null, freckles: true } as const;

// ---- 1. Intro: the line at dawn ----------------------------------------------------------------------------------------------
const S_LULU = markOf(LINE, 'lulu');
const S_YOU = markOf(LINE, 'player');
const S_BERTHA = markOf(LINE, 'bertha');
const S_DUNSTAN = markOf(LINE, 'dunstan');
const S_FENN = markOf(LINE, 'fennimore');
const CAR_LULU = carMark(LINE, 'start-lulu-lowrider');
const CAR_B = carMark(LINE, 'carb-bertha');
const CAR_D = carMark(LINE, 'carb-dunstan');
const CAR_F = carMark(LINE, 'carb-fennimore');
const LP = coverage('lulu', 'player', 1);

/**
 * Dawn at the line. Lulu, on her bonnet, teases the newcomer, then lets the joke go: Cam read her plate and took the paper. She
 * will not sign; she races, and the Carburettors go to whoever beats the Run. Three stayed. The row of cars answers with horns.
 */
export const M40_INTRO: SceneScript = {
  id: 'm40-the-capwood-run-intro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'turfton',
  ambience: 'wind',
  radio: 0,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m40-the-capwood-run-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, held: null, at: S_YOU.at, yaw: S_YOU.yaw },
    { id: 'lulu', preset: 'lugnut lulu', held: null, at: S_LULU.at, yaw: S_LULU.yaw },
    { id: 'bertha', name: 'Big-End Bertha', look: BERTHA_LOOK, at: S_BERTHA.at, yaw: S_BERTHA.yaw },
    { id: 'dunstan', name: 'Dipstick Dunstan', look: DUNSTAN_LOOK, at: S_DUNSTAN.at, yaw: S_DUNSTAN.yaw },
    { id: 'fennimore', name: 'Fanbelt Fennimore', look: FENNIMORE_LOOK, at: S_FENN.at, yaw: S_FENN.yaw },
  ],
  vehicles: [
    { id: 'lulu-car', kind: CAR_LULU.kind, at: CAR_LULU.at, yaw: CAR_LULU.yaw, tint: 0xff6a00, headlights: true },
    { id: 'b-car', kind: CAR_B.kind, at: CAR_B.at, yaw: CAR_B.yaw, tint: 0xb8452c, headlights: true },
    { id: 'd-car', kind: CAR_D.kind, at: CAR_D.at, yaw: CAR_D.yaw, tint: 0xe8c33a, headlights: true },
    { id: 'f-car', kind: CAR_F.kind, at: CAR_F.at, yaw: CAR_F.yaw, tint: 0x3a7a6a, headlights: true },
  ],
  props: [
    { id: 'pennant-a', prefab: 'capwood-rally-pennant', at: [79.4, -764.6], yaw: 0.4 },
    { id: 'pennant-b', prefab: 'capwood-rally-pennant', at: [91.6, -764.2], yaw: -0.4 },
  ],
  steps: [
    // Hook: a row of headlights in the blue-gold dawn, one engine revving to be heard over a tuba on a boom box.
    cut(spot(LINE, 'wide')),
    { do: 'gesture', who: 'lulu', name: 'lean', s: 0.8, async: true },
    { do: 'sfx', id: 'engine-rev', at: 'lulu-car', gain: 0.6, async: true },
    { do: 'horn', vehicle: 'f-car' },
    { do: 'walk', who: 'player', path: [[S_YOU.at[0], S_YOU.at[1] + 2.2]], speed: 1.3, async: true },
    { do: 'wait', s: 2.6 },
    // Setup: Lulu on the bonnet, low, with the sun behind her.
    cut(LP.single('lulu', 'mcu', { height: 'low' })),
    { do: 'say', who: 'lulu', text: 'Look who climbed the mountain. Hat on straight and everything.' },
    cut(LP.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'I need the Carburettors.' },
    cut(LP.single('lulu', 'mcu', { height: 'low' })),
    { do: 'say', who: 'lulu', text: 'Everybody needs the Carburettors. The HOA sent a charter. Beige paper, one line.' },
    // The sting: Cam.
    cut(LP.single('lulu', 'mcu', { height: 'low' })),
    { do: 'say', who: 'lulu', text: 'Your Cam took one home. Read my plate all night, once.' },
    ...reaction('player', { toward: 'lulu', gesture: 'slump', hold: 'pause', side: -25 }),
    // Turn: she lets it go, and asks the thing.
    cut(pushIn('lulu', 'mcu', 3.4, { toward: 'player', side: 25, height: 'low' })),
    { do: 'say', who: 'lulu', text: 'I do not sign. I race. Win the Capwood Run, and the Carburettors are yours.' },
    // The row.
    cut(spot(LINE, 'row')),
    { do: 'sfx', id: 'engine-rev', at: 'b-car', gain: 0.5, async: true },
    { do: 'wait', s: 0.8 },
    cut(shot('bertha', 'mcu', { toward: 'lulu', side: 20 })),
    { do: 'gesture', who: 'bertha', name: 'nod', s: 1.0, async: true },
    { do: 'say', who: 'bertha', text: 'Bertha. Thirty years on this road.' },
    cut(shot('dunstan', 'mcu', { toward: 'lulu', side: 20 })),
    { do: 'gesture', who: 'dunstan', name: 'wave', s: 1.0, async: true },
    { do: 'say', who: 'dunstan', text: 'Dunstan! Sorry about the mud, in advance.' },
    cut(shot('fennimore', 'mcu', { toward: 'lulu', side: 20 })),
    { do: 'gesture', who: 'fennimore', name: 'cheer', s: 1.0, async: true },
    { do: 'say', who: 'fennimore', text: 'Fennimore! Youngest! Loudest!' },
    cut(LP.single('lulu', 'mcu', { height: 'low' })),
    { do: 'say', who: 'lulu', text: 'The ones who stayed. Mind the fords, and do not bruise the caps.' },
    // Button: four horns, one tuba, and the row of cars catching the first sun.
    cut(spot(LINE, 'hood')),
    { do: 'horn', vehicle: 'lulu-car' },
    { do: 'horn', vehicle: 'b-car' },
    { do: 'horn', vehicle: 'd-car' },
    { do: 'horn', vehicle: 'f-car' },
    { do: 'stinger', id: 'triumph' },
    { do: 'wait', s: 2.2 },
  ],
};

// ---- 2. Outro: the Great Ring clearing --------------------------------------------------------------------------------------
const R_LULU = markOf(RING, 'lulu');
const R_YOU = markOf(RING, 'player');
const R_CHAN = markOf(RING, 'chanterelle');
const R_BERTHA = markOf(RING, 'bertha');
const R_DUNSTAN = markOf(RING, 'dunstan');
const R_FENN = markOf(RING, 'fennimore');
const RC_B = carMark(RING, 'ring-bertha');
const RC_F = carMark(RING, 'ring-fennimore');
const WARDEN = coverage('chanterelle', 'player', 1);
const RING_TALK = coverage('lulu', 'player', -1);

/**
 * Low gold sun through the glowing caps. Chanterelle writes the player a fine for the bruised caps; Lulu, who has been waiting
 * to be asked, reads the charter aloud to a clearing that groans at clause two, laughs, and tears it in half. Chanterelle fines
 * her for littering. The torn halves lie in the grass as the sun goes.
 */
export const M40_OUTRO: SceneScript = {
  id: 'm40-the-capwood-run-outro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'turfton-dusk',
  ambience: 'garden',
  radio: 0,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m40-the-capwood-run-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, held: null, at: R_YOU.at, yaw: R_YOU.yaw },
    { id: 'lulu', preset: 'lugnut lulu', held: 'rolled-scroll', at: R_LULU.at, yaw: R_LULU.yaw },
    { id: 'chanterelle', preset: 'chanterelle', at: R_CHAN.at, yaw: R_CHAN.yaw },
    { id: 'bertha', name: 'Big-End Bertha', look: BERTHA_LOOK, at: R_BERTHA.at, yaw: R_BERTHA.yaw },
    { id: 'dunstan', name: 'Dipstick Dunstan', look: DUNSTAN_LOOK, at: R_DUNSTAN.at, yaw: R_DUNSTAN.yaw },
    { id: 'fennimore', name: 'Fanbelt Fennimore', look: FENNIMORE_LOOK, at: R_FENN.at, yaw: R_FENN.yaw },
  ],
  vehicles: [
    { id: 'b-car', kind: RC_B.kind, at: RC_B.at, yaw: RC_B.yaw, tint: 0xb8452c },
    { id: 'f-car', kind: RC_F.kind, at: RC_F.at, yaw: RC_F.yaw, tint: 0x3a7a6a },
  ],
  props: [
    // The torn halves, left in the grass where Lulu throws them: seen only here.
    { id: 'half-a', prefab: 'rolled-scroll', at: [152.2, -1126.9], yaw: 0.6, size: 0.5, by: 'w', hidden: true },
    { id: 'half-b', prefab: 'rolled-scroll', at: [152.9, -1123.6], yaw: -0.9, size: 0.5, by: 'w', hidden: true },
  ],
  steps: [
    // Hook: the signature Capwood shot, through two stalks onto the ring and the low sun; a pencil already ticking.
    cut(spot(RING, 'through-caps')),
    { do: 'walk', who: 'player', path: [[R_YOU.at[0] + 1.4, R_YOU.at[1]]], speed: 1.2, async: true },
    { do: 'sfx', id: 'tap', at: 'chanterelle', gain: 0.5, async: true },
    { do: 'wait', s: 2.4 },
    // Setup: the warden, and her first words are a section number.
    cut(WARDEN.single('chanterelle', 'mcu')),
    { do: 'say', who: 'chanterelle', text: 'Section Nine. Eleven bruised caps.' },
    { do: 'intro', who: 'chanterelle' },
    { do: 'give', from: 'chanterelle', to: 'player', s: 1.0, async: true },
    { do: 'sfx', id: 'paper', at: 'chanterelle', gain: 0.5, async: true },
    cut(spot(RING, 'slip')),
    { do: 'wait', s: 1.4 },
    { do: 'face', who: 'player', at: 'chanterelle', s: 0.4, async: true },
    cut(WARDEN.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Eleven? I was winning.' },
    cut(WARDEN.single('chanterelle', 'mcu')),
    { do: 'say', who: 'chanterelle', text: 'Eleven acorns each. One hundred twenty-one. Section Nine does not round.' },
    // Turn: Lulu, who has been waiting, unfolds the charter.
    cut(RING_TALK.single('lulu', 'mcu', { height: 'low' })),
    { do: 'sfx', id: 'paper', at: 'lulu', gain: 0.5, async: true },
    { do: 'gesture', who: 'lulu', name: 'handsUp', s: 1.4, async: true },
    { do: 'say', who: 'lulu', text: 'Clause one: the Carburettors shall be quiet.' },
    cut(shot('bertha', 'mcu', { toward: 'lulu', side: 20 })),
    { do: 'gesture', who: 'bertha', name: 'facepalm', s: 1.0 },
    cut(RING_TALK.single('lulu', 'mcu', { height: 'low' })),
    { do: 'say', who: 'lulu', text: 'Clause two: the Carburettors shall be beige.' },
    cut(shot('fennimore', 'mcu', { toward: 'lulu', side: 20 })),
    { do: 'gesture', who: 'fennimore', name: 'flinch', s: 0.9 },
    // The gesture: she laughs, and tears it.
    cut(RING_TALK.single('lulu', 'mcu', { height: 'low' })),
    { do: 'sfx', id: 'paper', at: 'lulu', gain: 0.7, async: true },
    { do: 'gesture', who: 'lulu', name: 'cheer', s: 1.2, async: true },
    { do: 'say', who: 'lulu', text: 'You won. The Carburettors are yours. Low and loud!' },
    { do: 'hold', who: 'lulu', prop: null },
    { do: 'spawn', id: 'half-a' },
    { do: 'spawn', id: 'half-b' },
    { do: 'horn', vehicle: 'b-car' },
    { do: 'horn', vehicle: 'f-car' },
    { do: 'stinger', id: 'triumph' },
    // Button: the halves in the grass, and a pencil that has noticed.
    cut(spot(RING, 'wide')),
    { do: 'wait', s: 1.2 },
    cut(WARDEN.single('chanterelle', 'mcu')),
    { do: 'say', who: 'chanterelle', text: 'Littering. Four acorns. Section Ten.' },
    { do: 'wait', s: 1.2 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm40-the-capwood-run-intro': M40_INTRO,
  'm40-the-capwood-run-outro': M40_OUTRO,
};
