// Chapter 1 story scenes, fourth file: Founder's Boot (intro) and the chapter 1 closer.
// Owner: the Story A re-direction lane (docs/roadmaps/gta-redirect-story-a.md). Every id here is played by a quest in quests/chapter1.ts and checked by scenes.test.ts.
import type { ScriptActor, ScriptVehicle, SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, shot } from '../../direct';
import { markOf, pathOf, rideOf, spot, up } from './kit';

type Look = NonNullable<ScriptActor['look']>;

/** Mayor Barnaby Mulch in a fresh coat (not a cast preset: the two-coat ladder's third rung). */
const MAYOR_LOOK: Look = { hat: 0x2c3e50, shirt: 0x8b1e24, beard: 0xeeeeee, glasses: true };
/** HOA enforcers and bodyguards (no preset in cast.ts). */
const ENFORCER_LOOK: Look = { hat: 0x18181e, shirt: 0xc9b99b };

/** A cast member's own vehicle (rideOf: kind and Pay 'n' Glaze look) at a point. */
function ride(id: string, castId: string, at: Vec2, yaw: number, extra: Partial<ScriptVehicle> = {}): ScriptVehicle {
  return { id, ...rideOf(castId), at, yaw, ...extra };
}
const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);
/** Pip and Tansy at the bay: every shot of their exchange on one side of their line. */
const BAY = coverage('pip', 'tansy', 1);

// ---- Stage marks (quests/stages/turfton.ts, turftonB.ts) ---------------------------------------------------------------
const PATIO_VESPER = markOf('patio-gallery', 'vesper');
const PATIO_APPROACH = pathOf('patio-gallery', 'patio-gallery-approach');
const PATIO_GETAWAY = pathOf('patio-gallery', 'patio-gallery-getaway');

const BAY_PLAYER = markOf('side-valve-bay', 'player');
const BAY_TANSY = markOf('side-valve-bay', 'tansy');
const BAY_PIP = markOf('side-valve-bay', 'pip');

const AMPH_BAILIFF_A = markOf('amphitheater', 'hoa-bailiff', 0);
const AMPH_BAILIFF_B = markOf('amphitheater', 'hoa-bailiff', 1);
const PARADE = pathOf('amphitheater', 'parade-route');

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
    { do: 'say', who: 'tansy', text: '...Yes.' },
  ],
};

/** Chapter 1 closer: the Combine rolls in, the crew's deed, Bodega & Sons, then Vesper and Reginald on the patio at dusk. */
export const FOUNDERS_BOOT_OUTRO: SceneScript = {
  id: 'founders-boot-outro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'triumph',
  ambience: 'street',
  direction: {
    notes: 'docs/design/gnome-theft-auto/direction/scenes/founders-boot-outro.md',
    waive: [{ code: 'speaker-small', match: 'Lap of joy', why: 'physical gag: Pip laps the bay, shot wide and locked off' }],
  },
  actors: [
    { id: 'player', player: true, seatedIn: 'ride', seat: 0, at: [0, 0] },
    { id: 'tansy', preset: 'tansy', at: BAY_TANSY.at, yaw: BAY_TANSY.yaw },
    { id: 'pip', preset: 'pip', at: BAY_PIP.at, yaw: BAY_PIP.yaw },
    { id: 'bodega', preset: 'bodega', at: BODEGA.at, yaw: BODEGA.yaw },
    { id: 'vesper', preset: 'vesper', at: PATIO_VESPER.at, yaw: PATIO_VESPER.yaw },
    { id: 'reginald', preset: 'reginald', seatedIn: 'van', hidden: true, at: [0, 0] },
  ],
  vehicles: [
    { id: 'ride', kind: 'combine', from: 'player', at: [-122.5, 57.5], yaw: -Math.PI / 2 },
    ride('van', 'reginald', [110, -117.5], Math.PI / 2, { hidden: true }),
  ],
  props: [{ id: 'cat', prefab: 'asphalt-cat', at: CAT_AT, yaw: towards(CAT_AT, BODEGA.at), size: 0.55 }],
  steps: [
    // 1. The Combine rolls onto the apron; the player steps down (the tracking shot stays under 12 s).
    { do: 'cam', shot: { kind: 'track', pos: up(-160, 50, 4), who: 'ride', fov: 50 } },
    { do: 'drive', vehicle: 'ride', path: [[-150, 57.5], [-150, 72]], speed: 7 },
    { do: 'exit', who: 'player' },
    { do: 'walk', who: 'player', path: [[-148, 67]], speed: 1.4, async: true },
    { do: 'sfx', id: 'paper', at: 'tansy', gain: 0.5, async: true },
    { do: 'hold', who: 'tansy', prop: 'ledger' },
    cut({ kind: 'cut', pos: up(-139, 70.5, 1.8), look: 'tansy', fov: 46 }),
    { do: 'say', who: 'tansy', text: 'Stamped. Filed. Ours.' },
    // 2. Pip's lap of joy: the widest locked-off shot, so the gag reads.
    { do: 'cam', shot: { kind: 'track', pos: up(-128, 50, 5), who: 'pip', fov: 52 } },
    { do: 'gesture', who: 'pip', name: 'cheer', s: 1.5, async: true },
    { do: 'walk', who: 'pip', path: [[-130, 72], [-126, 76], [-130, 70], [-134, 70]], speed: 3, run: true, async: true },
    { do: 'say', who: 'pip', text: 'Lap of joy! Lap of joy!' },
    // 3. Bodega & Sons: Asphalt and her bottlecap, close; then John's report.
    { do: 'music', track: 'turfton-dusk', fade: 1.5 },
    { do: 'cam', shot: { kind: 'dolly', from: up(-76.4, 90.4, 0.9), to: up(-77.2, 89.6, 0.8), look: up(CAT_AT[0], CAT_AT[1], 0.6), s: 2.4, fov: 40 } },
    { do: 'sfx', id: 'knock', at: 'cat', gain: 0.3 },
    { do: 'wait', s: 2.4 },
    cut({ kind: 'cut', pos: [-76.89, 1.25, 88.75], look: 'bodega', fov: 46 }),
    { do: 'say', who: 'bodega', text: 'Turfton FM says the Boot parked itself in the jury box.' },
    { do: 'say', who: 'bodega', text: 'Asphalt says she knew.' },
    // 4. Patio Heights at dusk: Vesper alone, low, pushing in on him. The one villain stinger.
    { do: 'music', track: 'villain', fade: 1 },
    { do: 'stinger', id: 'villain' },
    { do: 'cam', shot: { kind: 'dolly', from: up(146, -152, 0.7), to: up(142.5, -152, 0.7), look: up(137, -152, 1.0), s: 5, fov: 34 } },
    { do: 'wait', s: 3 },
    // Reginald arrives in his van with the bent calipers.
    { do: 'spawn', id: 'van' },
    { do: 'spawn', id: 'reginald' },
    { do: 'cam', shot: { kind: 'track', pos: up(122, -125, 3), who: 'van', fov: 50 } },
    { do: 'drive', vehicle: 'van', path: [[110, -117.5], [150, -117.5], [150, -124]], speed: 9 },
    { do: 'sfx', id: 'latch', at: 'van', gain: 0.5, async: true },
    { do: 'exit', who: 'reginald' },
    cut(shot('reginald', 'ms', { toward: 'vesper', side: 20 })),
    { do: 'walk', who: 'reginald', path: [[150, -124], [146, -136]], speed: 2.6 },
    { do: 'face', who: 'reginald', at: 'vesper', s: 0.4 },
    { do: 'cam', shot: shot('reginald', 'mcu', { toward: 'vesper' }) },
    { do: 'wait', s: 0.6 },
    { do: 'say', who: 'reginald', text: 'They crashed the tribunal, sir. With a boot.' },
    // Vesper: low, alone in the frame, pushing in; no cut while he talks.
    cut(shot('vesper', 'mcu', { toward: 'reginald', height: 'low', side: 15 })),
    { do: 'say', who: 'vesper', text: 'Freeze the Black Dew. Cloverfield first.' },
    { do: 'cam', shot: shot('reginald', 'mcu', { toward: 'vesper' }) },
    { do: 'say', who: 'reginald', text: 'And when the Council asks questions, sir?' },
    cut(shot('vesper', 'cu', { toward: 'reginald', height: 'low', side: 15 })),
    { do: 'say', who: 'vesper', text: 'Then we stop asking.' },
    // The button: the threat, held. The title comes up over him, not over his car.
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
