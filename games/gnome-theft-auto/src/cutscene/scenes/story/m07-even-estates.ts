// Story row 7 (m07-even-estates): its three scenes. Notes: docs/design/gnome-theft-auto/direction/scenes/even-estates-{intro,mid,outro}.md
// Intro: dusk on the City Hall steps. Mid: night at Even-Estates Plot 1, three permits and the foreman. Outro: night, Kerb Row.
import type { GnomeLook } from '@lawn/gnome';
import type { SceneScript, ScriptVehicle, Vec2 } from '../../script';
import { beat, coverage, cut, insert, pushIn, reaction, shot } from '../../direct';
import { carMark, markOf, pathOf, rideOf, up } from './kit';

type Look = Partial<GnomeLook>;

/** Levelright's night-watch: slate vests (the same look as the quest's targets). */
const WATCH_LOOK: Look = { hat: 0x2a3b4a, shirt: 0x7a8a96, beard: 0x555555 };

const facing = (from: Vec2, to: Vec2): number => Math.atan2(to[0] - from[0], to[1] - from[1]);

// ---- Intro: City Hall steps, dusk ----------------------------------------------------------------------------------------
const CH_JUNIPER = markOf('city-hall-steps', 'juniper');
/** Closer than the stage mark (8 m): the two talk across a flowerpot. */
const CH_PLAYER: Vec2 = [10.4, -67.2];
const JP = coverage('juniper', 'player', 1);

/**
 * Even-Estates, intro. Juniper on the steps at dusk with the budget map: forty thousand acorns of median money and nothing to
 * show for it. Someone is using her brother's stamp (she says it, then defends him by insulting him). The site is out on the
 * ring road; she does not drive, she arrives, and her own Ride-On has a flag on it. Button: the flag, fluttering.
 */
export const EVEN_ESTATES_INTRO: SceneScript = {
  id: 'even-estates-intro',
  stage: { kind: 'world' },
  music: 'turfton-dusk',
  ambience: 'street',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/even-estates-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, at: CH_PLAYER, yaw: facing(CH_PLAYER, CH_JUNIPER.at) },
    { id: 'juniper', preset: 'juniper', name: 'Councilwoman Vance', at: CH_JUNIPER.at, yaw: facing(CH_JUNIPER.at, CH_PLAYER), held: 'folded-map' },
  ],
  vehicles: [{ id: 'juniper-ride', ...rideOf('juniper'), at: [24, -68.5], yaw: 0 }],
  steps: [
    // Hook: the map, struck against the lectern. Her number, her deadpan.
    { do: 'sfx', id: 'paper', at: 'juniper', gain: 0.6, async: true },
    cut(shot('juniper', 'mcu')),
    { do: 'say', who: 'juniper', text: 'Median money. Forty thousand acorns a year. The medians look exactly the same.' },
    cut(JP.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Where does it go?' },
    cut(JP.single('juniper', 'mcu')),
    { do: 'say', who: 'juniper', text: "Somewhere with a crane. Reginald's stamp is on every page." },
    ...reaction('player', { toward: 'juniper', size: 'mcu', side: -25, hold: 'beat' }),
    { do: 'say', who: 'player', text: 'Your brother?' },
    // The turn: she defends him by insulting him.
    cut(JP.single('juniper', 'mcu')),
    { do: 'gesture', who: 'juniper', name: 'crossArms', s: 1.2, async: true },
    { do: 'say', who: 'juniper', text: 'My brother cannot sign a birthday card without measuring it. Someone is using his stamp.' },
    // The job, in her voice: she arrives, the player drives.
    cut(pushIn('juniper', 'mcu', 3.5, { toward: 'player', side: 25 })),
    { do: 'say', who: 'juniper', text: 'The site is out on the ring road. You drive. I arrive.' },
    ...reaction('player', { toward: 'juniper', size: 'mcu', side: -25, hold: 'tiny' }),
    { do: 'say', who: 'player', text: 'Your Ride-On?' },
    // Button: her own ride, parked and spotless, with a flag on it.
    cut(JP.single('juniper', 'mcu')),
    { do: 'face', who: 'juniper', at: 'juniper-ride', s: 0.5 },
    { do: 'say', who: 'juniper', text: 'Mine has a flag. Nobody sneaks anywhere with a flag.' },
    { do: 'sfx', id: 'flutter', at: 'juniper-ride', gain: 0.7, async: true },
    { do: 'cam', shot: { kind: 'cut', pos: up(20.2, -65.4, 1.3), look: 'juniper-ride', fov: 40 } },
    { do: 'wait', s: 1.8 },
  ],
};

// ---- Mid: Even-Estates Plot 1, night -------------------------------------------------------------------------------------
const SITE = 'estates-plot-1-showhome';
const SITE_PLAYER = markOf(SITE, 'player');
const SITE_JUNIPER = markOf(SITE, 'juniper');
const SITE_CHARD = markOf(SITE, 'chard');
const SITE_WATCH_A = markOf(SITE, 'levelright-watch', 0);
const SITE_WATCH_B = markOf(SITE, 'levelright-watch', 1);
const CHARD_RIDE = carMark(SITE, 'chard-site-ride');
const CHARD_GETAWAY = pathOf(SITE, 'chard-getaway');
/** The permit panel between the first two show-homes and the three clipboards pinned along it (the insert shot looks at them). */
const PANEL: Vec2 = [-303, -135.3];
const SJ = coverage('juniper', 'player', 1);
const SC = coverage('juniper', 'chard', -1);

/** The three permits' insert: a still camera on the panel (also the hook of the scene). */
const PERMITS_SHOT = { kind: 'cut' as const, pos: up(-303, -132.8, 1.45), look: up(-303, -135.2, 1.35), fov: 38 };

const mid: ScriptVehicle[] = [
  { id: 'chard-ride', kind: CHARD_RIDE.kind, at: CHARD_RIDE.at, yaw: CHARD_RIDE.yaw, tint: 0xd9c8a5 },
];

/**
 * Even-Estates, mid scene (night). The third permit is photographed under a torch: three clipboards on one panel, the same
 * R. Vance in the same ink. Then the torch swings round: Chard Levelright, who reads the bubble and not the signature, calls
 * the night-watch and flees on his site Ride-On with the hazard lamp going. Juniper gives the objective.
 */
export const EVEN_ESTATES_MID: SceneScript = {
  id: 'even-estates-mid',
  stage: { kind: 'world' },
  music: 'mystery',
  ambience: 'night',
  sky: 'night',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/even-estates-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, at: SITE_PLAYER.at, yaw: SITE_PLAYER.yaw, held: 'field-camera' },
    { id: 'juniper', preset: 'juniper', name: 'Councilwoman Vance', at: SITE_JUNIPER.at, yaw: SITE_JUNIPER.yaw, held: null },
    { id: 'chard', preset: 'chard', name: 'Chard Levelright', at: SITE_CHARD.at, yaw: SITE_CHARD.yaw, held: 'torch', hidden: true },
    { id: 'watch-a', name: 'Night-Watchman Plumb', look: WATCH_LOOK, at: SITE_WATCH_A.at, yaw: SITE_WATCH_A.yaw, hidden: true },
    { id: 'watch-b', name: 'Night-Watchman Bevel', look: WATCH_LOOK, at: SITE_WATCH_B.at, yaw: SITE_WATCH_B.yaw, hidden: true },
  ],
  vehicles: mid,
  props: [
    // L95: three clipboards on one panel, the same signature in the same hand, hung level to the quarter-inch.
    { id: 'panel', prefab: 'site-hoarding', at: PANEL, yaw: 0, size: 2.6 },
    { id: 'permit-1', prefab: 'hoa-clipboard', at: up(-304.1, -135.15, 1.0), yaw: Math.PI, size: 0.45 },
    { id: 'permit-2', prefab: 'hoa-clipboard', at: up(-303, -135.15, 1.0), yaw: Math.PI, size: 0.45 },
    { id: 'permit-3', prefab: 'hoa-clipboard', at: up(-301.9, -135.15, 1.0), yaw: Math.PI, size: 0.45 },
  ],
  steps: [
    // Hook: the shutter, the three permits, level to the quarter-inch.
    cut(PERMITS_SHOT),
    { do: 'sfx', id: 'shutter', gain: 0.8 },
    { do: 'wait', s: 1.5 },
    cut(SJ.single('juniper', 'mcu')),
    { do: 'say', who: 'juniper', text: 'Three permits. Same ink, same hour, same hand.' },
    ...reaction('player', { toward: 'juniper', size: 'mcu', side: -25, hold: 'pause' }),
    { do: 'face', who: 'juniper', at: 'chard', s: 0.3, async: true },
    { do: 'face', who: 'player', at: 'chard', s: 0.3, async: true },
    // The torch swings in from the yard. Chard first, level and unhurried; he checks the wall before the trespassers.
    { do: 'sfx', id: 'rustle', at: up(-299, -126.5, 1), gain: 0.6, async: true },
    { do: 'spawn', id: 'chard' },
    { do: 'music', track: 'tension', fade: 1.0 },
    cut(SC.single('chard', 'ms')),
    { do: 'say', who: 'chard', text: 'That wall is true. You are not.' },
    cut(SC.single('chard', 'mcu')),
    { do: 'intro', who: 'chard' },
    // Juniper does not raise her voice. She asks whose plans these are.
    cut(SC.single('juniper', 'mcu')),
    { do: 'say', who: 'juniper', text: 'Councilwoman Vance. Whose plans are these?' },
    cut(SC.single('chard', 'mcu')),
    { do: 'say', who: 'chard', text: 'Signed plans. I read the bubble, not the name.' },
    cut(SC.single('juniper', 'cu')),
    { do: 'say', who: 'juniper', text: 'That is the whole problem with this town.' },
    // Turn: the torch finds the camera. He calls the watch and runs for his Ride-On.
    cut(SC.single('chard', 'ms', { height: 'low' })),
    { do: 'sfx', id: 'whistle', at: 'chard', gain: 0.7, async: true },
    { do: 'say', who: 'chard', text: 'Night-watch! Visitors! They have a camera!' },
    { do: 'walk', who: 'chard', path: [CHARD_RIDE.at], run: true, async: true },
    { do: 'spawn', id: 'watch-a' },
    { do: 'spawn', id: 'watch-b' },
    { do: 'walk', who: 'watch-a', path: [[-303, -128]], run: true, async: true },
    { do: 'walk', who: 'watch-b', path: [[-300, -124]], run: true, async: true },
    cut({ kind: 'track', pos: up(-313, -126, 1.7), who: 'chard', fov: 46 }),
    { do: 'wait', s: 1.4 },
    { do: 'enter', who: 'chard', vehicle: 'chard-ride' },
    { do: 'lights', vehicle: 'chard-ride', on: true },
    { do: 'horn', vehicle: 'chard-ride' },
    { do: 'drive', vehicle: 'chard-ride', path: CHARD_GETAWAY, speed: 9, arrive: false, async: true },
    { do: 'wait', s: 2.4 },
    // Button: the objective in her voice, over the watchmen running in.
    { do: 'face', who: 'juniper', at: 'player', s: 0.3, async: true },
    cut(SJ.single('juniper', 'mcu')),
    { do: 'say', who: 'juniper', text: 'Two watchmen. Crack them. Politely.' },
  ],
};

// ---- Outro: Kerb Row, night ----------------------------------------------------------------------------------------------
const TERRACE = 'kerb-row-terrace';
const T_PLAYER = markOf(TERRACE, 'player');
const T_JUNIPER = markOf(TERRACE, 'juniper');
const JT = coverage('juniper', 'player', 1);

/**
 * Even-Estates, outro (night). Juniper on her doorstep under the porch lamp with the developed permit. A forger wobbles;
 * this does not. The sincere beat gets silence and no joke after it.
 */
export const EVEN_ESTATES_OUTRO: SceneScript = {
  id: 'even-estates-outro',
  stage: { kind: 'world' },
  music: 'turfton-dusk',
  ambience: 'night',
  sky: 'night',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/even-estates-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, at: T_PLAYER.at, yaw: T_PLAYER.yaw },
    { id: 'juniper', preset: 'juniper', name: 'Councilwoman Vance', at: T_JUNIPER.at, yaw: T_JUNIPER.yaw, held: 'hoa-clipboard' },
  ],
  steps: [
    // Hook: the print, under the porch lamp, held very still.
    cut(insert('juniper', { toward: 'player' })),
    { do: 'sfx', id: 'paper', at: 'juniper', gain: 0.6, async: true },
    { do: 'wait', s: 1.6 },
    cut(JT.single('juniper', 'mcu')),
    { do: 'say', who: 'juniper', text: 'Reginald says a signature should never wobble.' },
    cut(pushIn('juniper', 'mcu', 3.2, { to: 'cu', toward: 'player', side: 25 })),
    { do: 'say', who: 'juniper', text: 'This one does not. It is exactly his.' },
    ...reaction('player', { toward: 'juniper', size: 'mcu', side: -25, hold: 'pause' }),
    { do: 'say', who: 'player', text: 'A forgery?' },
    // The sincere beat: the music out, a held silence, no gag on top.
    { do: 'music', track: null, fade: 0.5 },
    cut(JT.single('juniper', 'cu')),
    beat('pause'),
    { do: 'say', who: 'juniper', text: 'Forgers wobble.' },
    ...reaction('player', { toward: 'juniper', size: 'mcu', side: -25, hold: 'pause' }),
    cut(JT.single('juniper', 'cu', { height: 'low' })),
    { do: 'say', who: 'juniper', text: 'I hoped.' },
    beat('silence'),
    // Button: she goes in; the lamp stays on over an empty street.
    { do: 'face', who: 'juniper', yaw: Math.PI, s: 0.6 },
    { do: 'sfx', id: 'keys', at: 'juniper', gain: 0.6, async: true },
    { do: 'walk', who: 'juniper', path: [[-90, 130.2]], speed: 1.2, async: true },
    { do: 'cam', shot: { kind: 'track', pos: up(-95.5, 123, 1.6), who: 'juniper', fov: 44 } },
    { do: 'wait', s: 1.4 },
    { do: 'sfx', id: 'door', at: 'juniper', gain: 0.7 },
    { do: 'despawn', id: 'juniper' },
    { do: 'music', track: 'turfton-dusk', fade: 1.5 },
    { do: 'wait', s: 1.6 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'even-estates-intro': EVEN_ESTATES_INTRO,
  'even-estates-mid': EVEN_ESTATES_MID,
  'even-estates-outro': EVEN_ESTATES_OUTRO,
};
