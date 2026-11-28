// Chapter 1 story scenes, fourth file: Founder's Boot (intro) and the chapter 1 closer.
// Owner: the Story A re-direction lane; E20 row 15 extended the outro. Played by ch1-founders-boot (quests/story/15-founders-boot.ts).
import type { ScriptActor, SceneScript, Step, Vec2 } from '../../script';
import { beat, coverage, cut, pushIn, shot } from '../../direct';
import { carMark, markOf, pathOf, spot, up } from './kit';

type Look = NonNullable<ScriptActor['look']>;

/** Mayor Barnaby Mulch in a fresh coat (not a cast preset: the two-coat ladder's third rung). */
const MAYOR_LOOK: Look = { hat: 0x2c3e50, shirt: 0x8b1e24, beard: 0xeeeeee, glasses: true };
/** HOA enforcers and bodyguards (no preset in cast.ts). */
const ENFORCER_LOOK: Look = { hat: 0x18181e, shirt: 0xc9b99b };

const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);
/** Pip and Tansy at the bay: every shot of their exchange on one side of their line. */
const BAY = coverage('pip', 'tansy', 1);

// ---- Stage marks (quests/stages/turfton.ts, turftonB.ts) ---------------------------------------------------------------
const BAY_PLAYER = markOf('side-valve-bay', 'player');
const BAY_TANSY = markOf('side-valve-bay', 'tansy');
const BAY_PIP = markOf('side-valve-bay', 'pip');

const AMPH_BAILIFF_A = markOf('amphitheater', 'hoa-bailiff', 0);
const AMPH_BAILIFF_B = markOf('amphitheater', 'hoa-bailiff', 1);
const PARADE = pathOf('amphitheater', 'parade-route');
const AMPH_PULL_UP = carMark('amphitheater', 'amphitheater-pull-up');
/** Juniper on the arena floor in front of the dais, facing the tiers and the Boot. */
const GREEN_JUNIPER: Vec2 = [-90, -91.2];
/** Vesper behind the Glaze & Tax counter, against the glass of Thorne Tower (stage glaze-tax-office). */
const WINDOW_VESPER: Vec2 = [23.6, -43.4];

/**
 * The Founders' Green crowd: Turfton townsfolk standing on the tiers, facing Juniper at the ribbon. Mixed hats and coats;
 * nobody in HOA black. Rows rise to the south; the middle stays clear for the Boot in the jury box.
 */
const TIER_CROWD: ReadonlyArray<{ x: number; z: number; hat: number; shirt: number; beard?: number }> = [
  { x: -95, z: -84, hat: 0xc0392b, shirt: 0xd9b26a, beard: 0xdddddd },
  { x: -92.5, z: -85, hat: 0x2e86c1, shirt: 0xf0e6c8 },
  { x: -87.5, z: -85, hat: 0xf1c40f, shirt: 0x7a5a8a, beard: 0x8a5a2b },
  { x: -85, z: -84, hat: 0x27ae60, shirt: 0xb04a3a },
  { x: -96.5, z: -81, hat: 0x8e44ad, shirt: 0x5f7fa8, beard: 0xeeeeee },
  { x: -93, z: -81.5, hat: 0xe67e22, shirt: 0x3d7a4a },
  { x: -87, z: -81.5, hat: 0x16a085, shirt: 0xe0c040 },
  { x: -83.5, z: -81, hat: 0xd35400, shirt: 0xa7c4a0, beard: 0xbbbbbb },
  { x: -98, z: -86.5, hat: 0xf39c12, shirt: 0x6d8f3a },
  { x: -82, z: -86.5, hat: 0x2980b9, shirt: 0xd98880 },
];
const CROWD_ACTORS: ScriptActor[] = TIER_CROWD.map((c, i) => ({
  id: `crowd-${i}`,
  name: 'Townsfolk',
  look: { hat: c.hat, shirt: c.shirt, ...(c.beard ? { beard: c.beard } : {}) },
  at: [c.x, c.z] as Vec2,
  yaw: towards([c.x, c.z], GREEN_JUNIPER),
}));

const BODEGA = markOf('bodega-front', 'bodega');
/** Asphalt, on the crate-side of John's counter: 1.6 m from him (the bottlecap's cat). */
const CAT_AT: Vec2 = [-78.4, 88.4];

/**
 * Founder's Boot, intro: Vesper's HOA tribunal during Founder's Trim Day. Tansy tells the crew; the Amphitheater (Reginald
 * reads the charges and plants the Whirligig; a bailiff; the Mayor in a fresh coat); the Boot float on parade; then Pip's
 * first "Okay, hear me out" at the bay, the plan, and Tansy's flat "...Yes." Notes:
 * docs/design/gnome-theft-auto/direction/scenes/founders-boot-intro.md.
 */
export const FOUNDERS_BOOT_INTRO: SceneScript = {
  id: 'founders-boot-intro',
  stage: { kind: 'world' },
  music: 'turfton',
  ambience: 'crowd',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/founders-boot-intro.md' },
  actors: [
    { id: 'player', player: true, at: BAY_PLAYER.at, yaw: BAY_PLAYER.yaw },
    { id: 'tansy', preset: 'tansy', at: BAY_TANSY.at, yaw: BAY_TANSY.yaw },
    { id: 'pip', preset: 'pip', at: BAY_PIP.at, yaw: BAY_PIP.yaw },
    // Reginald stands on the dais floor in front of the lectern (his mark's dais edge is a wall).
    { id: 'reginald', preset: 'reginald', at: [-86, -91], yaw: 0, hidden: true },
    { id: 'bailiff-a', name: 'HOA Bailiff', look: ENFORCER_LOOK, at: AMPH_BAILIFF_A.at, yaw: AMPH_BAILIFF_A.yaw, hidden: true },
    { id: 'bailiff-b', name: 'HOA Bailiff', look: ENFORCER_LOOK, at: AMPH_BAILIFF_B.at, yaw: AMPH_BAILIFF_B.yaw, hidden: true },
    { id: 'mayor', name: 'Mayor Mulch', look: MAYOR_LOOK, at: [-88, -80], yaw: 0, hidden: true },
  ],
  vehicles: [
    { id: 'boot', kind: 'boot-float', at: PARADE[0], yaw: -Math.PI / 2, hidden: true },
  ],
  steps: [
    // 1. Hook: Tansy at her bay, the news first.
    cut({ kind: 'cut', pos: [-142.88, 1.25, 69.8], look: 'tansy', fov: 46 }),
    { do: 'say', who: 'tansy', text: 'Vesper has called an emergency HOA zoning tribunal at the Amphitheater.' },
    { do: 'say', who: 'tansy', text: 'During Founder\'s Trim Day. So nobody can protest it.' },
    // 2. The Amphitheater: the charges, read by Reginald.
    { do: 'spawn', id: 'reginald' },
    { do: 'spawn', id: 'bailiff-a' },
    { do: 'spawn', id: 'bailiff-b' },
    { do: 'spawn', id: 'mayor' },
    cut(spot('amphitheater', 'wide')),
    { do: 'wait', s: 2.2 },
    { do: 'sfx', id: 'paper', at: 'reginald', gain: 0.4, async: true },
    cut(shot('reginald', 'mcu')),
    { do: 'say', who: 'reginald', text: 'Municipal Code four-oh-four, dash B: unlawful grass is a crime against the Tribunal.' },
    cut(shot('reginald', 'cu')),
    // The plant: the Whirligig, cited under "unauthorised verticality" (named again in chapter 3).
    { do: 'say', who: 'reginald', text: 'Item two: unauthorised verticality. One Whirligig, Fort Sandpit.' },
    // The bailiff turns to the camera for his line.
    { do: 'face', who: 'bailiff-a', at: [-82, -70], s: 0.3 },
    cut(shot('bailiff-a', 'mcu')),
    { do: 'say', who: 'bailiff-a', text: 'Yes, sir. The crowd is unlawful too.' },
    // The Mayor, in a fresh coat, posing for a camera that is not there.
    cut(shot('mayor', 'mcu')),
    { do: 'sfx', id: 'bell', at: 'mayor', gain: 0.5, async: true },
    { do: 'gesture', who: 'mayor', name: 'wave', s: 1.2, async: true },
    { do: 'say', who: 'mayor', text: 'Fresh coat for the occasion! Ding, ding!' },
    // 3. The Boot on parade: a follow on the float, then cut away while it rolls on.
    { do: 'spawn', id: 'boot' },
    { do: 'cam', shot: { kind: 'follow', who: 'boot', offset: [0, 4, -13], lag: 0.5 } },
    { do: 'sfx', id: 'engine-rev', at: 'boot', gain: 0.4, async: true },
    { do: 'drive', vehicle: 'boot', path: PARADE.slice(0, -1), speed: 11, async: true },
    { do: 'wait', s: 6 },
    { do: 'cam', shot: { kind: 'dolly', from: up(-74, -134, 9), to: up(-80, -131, 9), look: 'boot', s: 5, fov: 50 } },
    { do: 'wait', s: 5 },
    // 4. Back at the bay: Pip's first "Okay, hear me out", then Tansy's answer. One side of the line all scene.
    { do: 'walk', who: 'player', path: [[-147, 67]], speed: 1.4, async: true },
    { do: 'cam', shot: BAY.single('pip', 'mcu', { handheld: 0.02 }) },
    { do: 'say', who: 'pip', text: 'Okay, hear me out.' },
    { do: 'gesture', who: 'pip', name: 'point', s: 1.1, async: true },
    { do: 'cam', shot: BAY.single('pip', 'ms', { handheld: 0.02 }) },
    { do: 'say', who: 'pip', text: 'We steal the Boot and park it in the jury box.' },
    beat('pause'),
    { do: 'cam', shot: BAY.single('tansy', 'mcu') },
    { do: 'face', who: 'tansy', at: [-136, 82], s: 0.3 },
    { do: 'say', who: 'tansy', text: '...Yes.' },
  ],
};

/**
 * Chapter 1 closer (row 15's final outro), at dusk: Juniper cuts the ribbon in the Amphitheater with the Boot still in the
 * jury box and rezones Vesper's three condemned blocks as Founders' Green; Tansy's "Stamped. Filed. Ours."; Hedda's
 * headline; Asphalt knew; then Vesper alone at the window of his tower, and the threat. Ends on Vesper, never a gag.
 * Notes: docs/design/gnome-theft-auto/direction/scenes/founders-boot-outro.md.
 */
export const FOUNDERS_BOOT_OUTRO: SceneScript = {
  id: 'founders-boot-outro',
  stage: { kind: 'world' },
  sky: 'golden',
  weather: 'clear',
  music: 'turfton-dusk',
  ambience: 'crowd',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/founders-boot-outro.md' },
  actors: [
    { id: 'juniper', preset: 'juniper', at: GREEN_JUNIPER, yaw: 0, held: 'ceremonial-scissors' },
    { id: 'tansy', preset: 'tansy', at: [-95.5, -86.2], yaw: towards([-95.5, -86.2], GREEN_JUNIPER), held: 'ledger' },
    { id: 'pip', preset: 'pip', at: [-85.6, -86.6], yaw: towards([-85.6, -86.6], GREEN_JUNIPER) },
    { id: 'hedda', preset: 'hedda', at: [-99.5, -89.5], yaw: towards([-99.5, -89.5], GREEN_JUNIPER), held: 'pl-newspaper' },
    { id: 'juror-a', name: 'Juror', look: { hat: 0x6d8f3a, shirt: 0xd9b26a }, at: [-88.5, -83.2], yaw: Math.PI },
    { id: 'juror-b', name: 'Juror', look: { hat: 0xb04a3a, shirt: 0x5f7fa8 }, at: [-92.5, -82.8], yaw: Math.PI },
    { id: 'juror-c', name: 'Juror', look: { hat: 0xe0c040, shirt: 0x7a5a8a }, at: [-82.2, -88.8], yaw: towards([-82.2, -88.8], GREEN_JUNIPER) },
    ...CROWD_ACTORS,
    { id: 'bodega', preset: 'bodega', at: BODEGA.at, yaw: BODEGA.yaw },
    { id: 'vesper', preset: 'vesper', at: WINDOW_VESPER, yaw: towards(WINDOW_VESPER, [-90, -88]) },
    { id: 'reginald', preset: 'reginald', at: [19.5, -48], yaw: towards([19.5, -48], WINDOW_VESPER) },
  ],
  vehicles: [
    // The Boot is still parked in the jury box where the player left it.
    { id: 'boot', kind: 'boot-float', at: AMPH_PULL_UP.at, yaw: AMPH_PULL_UP.yaw },
  ],
  props: [
    { id: 'ribbon', prefab: 'opening-ribbon', at: [-90, -89.3], yaw: 0, size: 3.2 },
    // Bunting over the ribbon and along the tiers.
    { id: 'bunting-ribbon', prefab: 'bunting-span', at: [-90, -86.5], yaw: 0, size: 12 },
    { id: 'bunting-tiers', prefab: 'bunting-span', at: [-90, -80.6], yaw: 0, size: 18 },
    { id: 'cat', prefab: 'asphalt-cat', at: CAT_AT, yaw: towards(CAT_AT, BODEGA.at), size: 0.55 },
  ],
  steps: [
    // 1. Hook: over Juniper's shoulder, the crowd on the tiers and the Boot in the jury box behind them.
    { do: 'cam', shot: { kind: 'dolly', from: up(-91.5, -94.5, 2.6), to: up(-91, -93.2, 2.4), look: up(-89, -80, 1.6), s: 3, fov: 52 } },
    { do: 'sfx', id: 'bell', at: 'juniper', gain: 0.4 },
    { do: 'wait', s: 2.6 },
    // 2. Juniper, brisk: the rezoning.
    cut(shot('juniper', 'mcu', { side: 15 })),
    { do: 'say', who: 'juniper', text: 'By order of the Council, three condemned blocks are rezoned.' },
    { do: 'say', who: 'juniper', text: "Founders' Green. Signed, stamped, and open." },
    // The snip: the ribbon goes, the crowd goes up.
    cut(shot('juniper', 'ms', { side: -20, height: 'high' })),
    { do: 'sfx', id: 'snap', at: 'juniper', gain: 0.6 },
    { do: 'despawn', id: 'ribbon' },
    { do: 'stinger', id: 'triumph' },
    { do: 'gesture', who: 'pip', name: 'cheer', s: 1.6, async: true },
    { do: 'gesture', who: 'juror-a', name: 'cheer', s: 1.6, async: true },
    { do: 'gesture', who: 'juror-c', name: 'wave', s: 1.6, async: true },
    ...CROWD_ACTORS.map((c, i): Step => ({ do: 'gesture', who: c.id, name: i % 3 === 1 ? 'wave' : 'cheer', s: 1.4 + (i % 4) * 0.2, async: true })),
    { do: 'wait', s: 1.6 },
    // 3. The crew's win, and the press.
    cut(shot('tansy', 'mcu', { toward: 'juniper', side: -25 })),
    { do: 'say', who: 'tansy', text: 'Stamped. Filed. Ours.' },
    { do: 'walk', who: 'hedda', path: [[-98, -87.5]], speed: 0.9, async: true },
    cut(shot('hedda', 'mcu', { toward: 'juniper', side: -25 })),
    { do: 'say', who: 'hedda', text: 'Boot in jury box. Park for Turfton. Thorne unavailable.' },
    // 4. Bodega & Sons: Asphalt and her bottlecap, then John.
    { do: 'ambience', bed: 'street', fade: 0.5 },
    { do: 'cam', shot: { kind: 'dolly', from: up(-76.4, 90.4, 0.9), to: up(-77.2, 89.6, 0.8), look: up(CAT_AT[0], CAT_AT[1], 0.6), s: 2.2, fov: 40 } },
    { do: 'sfx', id: 'knock', at: 'cat', gain: 0.3 },
    { do: 'wait', s: 2.2 },
    cut({ kind: 'cut', pos: [-76.89, 1.25, 88.75], look: 'bodega', fov: 46 }),
    { do: 'say', who: 'bodega', text: 'Turfton FM says the Boot parked itself in the jury box. Asphalt says she knew.' },
    // 5. Thorne Tower at dusk: Vesper alone at the window of his tower, low. The one villain stinger.
    { do: 'ambience', bed: 'office', fade: 0.5 },
    { do: 'music', track: 'villain', fade: 1 },
    { do: 'stinger', id: 'villain' },
    cut(pushIn('vesper', 'ms', 4, { height: 'low', side: 10 })),
    { do: 'wait', s: 2.2 },
    cut(shot('reginald', 'mcu', { toward: 'vesper', side: 20, height: 'high' })),
    { do: 'sfx', id: 'paper', at: 'reginald', gain: 0.4, async: true },
    { do: 'say', who: 'reginald', text: 'Juniper rezoned your three blocks, sir. As a park.' },
    cut(shot('vesper', 'mcu', { toward: 'reginald', height: 'low', side: -15 })),
    { do: 'say', who: 'vesper', text: 'Freeze the Black Dew. Cloverfield first.' },
    cut(shot('reginald', 'mcu', { toward: 'vesper', side: 20, height: 'high' })),
    { do: 'say', who: 'reginald', text: "Building needs the Council's permission now, sir." },
    cut(pushIn('vesper', 'mcu', 5, { to: 'cu', toward: 'reginald', height: 'low', side: -15 })),
    { do: 'say', who: 'vesper', text: 'Then we stop asking.' },
    // The button: the threat, held. The title comes up over him.
    { do: 'music', track: null, fade: 1.2 },
    { do: 'wait', s: 1.0 },
    { do: 'title', text: 'END OF CHAPTER 1' },
    { do: 'wait', s: 3 },
    { do: 'title', text: null },
  ],
};

export const CH1D_SCENES: Record<string, SceneScript> = {
  'founders-boot-intro': FOUNDERS_BOOT_INTRO,
  'founders-boot-outro': FOUNDERS_BOOT_OUTRO,
};
