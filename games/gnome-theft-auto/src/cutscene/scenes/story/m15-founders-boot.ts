// Story row 15: the scenes of Founder's Boot's two new parts. The final part's intro and outro are in ch1d.ts.
// - parade-permits-intro (p1, morning): Tansy sends the player to Hedda Galley; Hedda's parade desk across from the
//   Amphitheater, where a bailiff tapes up the tribunal banner; Hedda's intro card; the keys are in the Mayor's cigar box.
// - dress-rehearsal-intro (p2, night): Chard Levelright's night round at Even-Estates Plot 1; the Boot float rolls in out
//   of the dark; Pip hands the player the wheel; the night watch's whistle.
// - dress-rehearsal-outro (p2, night): the float home at the bay, one scrape; Tansy says Saturday is in daylight.
// Stages: quests/stages/story/s15-founders-boot.ts. Notes: docs/design/gnome-theft-auto/direction/scenes/<id>.md.
import type { ScriptActor, SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, exchangeLooks, pushIn, shot } from '../../direct';
import { carMark, markOf, pathOf, spot, up } from './kit';

type Look = NonNullable<ScriptActor['look']>;

/** HOA bailiffs (no CAST preset): the black hat and the tan shirt. */
const BAILIFF_LOOK: Look = { hat: 0x18181e, shirt: 0xc9b99b };
/** Levelright's night watch (row 7's watchmen): slate hat, grey coat. */
const WATCH_LOOK: Look = { hat: 0x2a3b4a, shirt: 0x7a8a96, beard: 0x555555 };

// ---- p1: the bay and the Tattler's parade desk ----------------------------------------------------------------------
const BAY_TANSY = markOf('side-valve-bay', 'tansy');
const DESK_HEDDA = markOf('tattler-parade-desk', 'hedda');
const DESK_PLAYER = markOf('tattler-parade-desk', 'player');
const DESK_BAILIFF = markOf('tattler-parade-desk', 'hoa-bailiff');
/** The tribunal banner going up on the Amphitheater's front, across the road from Hedda's desk. */
const BANNER_AT: Vec2 = [-95.6, -66.4];

/** Hedda and the player across her desk: every single on one side of their line. */
const DESK = coverage('hedda', 'player', 1);

export const PARADE_PERMITS_INTRO: SceneScript = {
  id: 'parade-permits-intro',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'turfton',
  ambience: 'street',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/parade-permits-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, at: [-148.5, 70.5], yaw: Math.atan2(-143 + 148.5, 73 - 70.5) },
    { id: 'tansy', preset: 'tansy', at: BAY_TANSY.at, yaw: Math.atan2(-148.5 + 143, 70.5 - 73), held: 'pl-newspaper' },
    { id: 'hedda', preset: 'hedda', at: DESK_HEDDA.at, yaw: DESK_HEDDA.yaw, held: 'pl-newspaper' },
    { id: 'bailiff', name: 'HOA Bailiff', look: BAILIFF_LOOK, at: DESK_BAILIFF.at, yaw: DESK_BAILIFF.yaw },
  ],
  props: [
    { id: 'banner', prefab: 'team-banner', at: BANNER_AT, yaw: 0, size: 2.2, by: 'h', hidden: true },
  ],
  steps: [
    // 1. The bay: Tansy with the Trim Day programme, the problem and the name.
    { do: 'sfx', id: 'paper', at: 'tansy', gain: 0.5 },
    cut(shot('tansy', 'mcu', { toward: 'player', side: -25 })),
    { do: 'say', who: 'tansy', text: 'Parade\'s Saturday. Nobody at City Hall can find the Boot\'s keys.' },
    { do: 'gesture', who: 'tansy', name: 'point', s: 1.0, async: true },
    cut(shot('tansy', 'ms', { toward: 'player', side: -40, height: 'low' })),
    { do: 'say', who: 'tansy', text: 'Hedda Galley edits the Tattler. She owes Juniper. She finds things.' },
    // 2. The Tattler's parade desk, across from the Amphitheater: the bailiff is putting the tribunal up.
    { do: 'ambience', bed: 'street', fade: 0.4 },
    { do: 'spawn', id: 'player', at: [-96, -55.5], yaw: 0 },
    { do: 'spawn', id: 'banner' },
    cut(spot('tattler-parade-desk', 'desk-wide')),
    { do: 'walk', who: 'player', path: [DESK_PLAYER.at], speed: 1.4, async: true },
    { do: 'walk', who: 'hedda', path: [[-94.4, -46.4]], speed: 0.9, async: true },
    { do: 'sfx', id: 'tap', at: 'bailiff', gain: 0.5 },
    { do: 'wait', s: 2.2 },
    { do: 'cam', shot: spot('tattler-parade-desk', 'across') },
    { do: 'sfx', id: 'tap', at: 'bailiff', gain: 0.6 },
    { do: 'wait', s: 1.6 },
    // Hedda, not stopping, reading the banner off her proof: her first line, then her card.
    { do: 'face', who: 'hedda', at: 'player', s: 0.3 },
    cut(DESK.single('hedda', 'ms')),
    { do: 'sfx', id: 'paper', at: 'hedda', gain: 0.4, async: true },
    { do: 'say', who: 'hedda', text: 'Tribunal. Trim Day. Crowd barred. Headline writes itself.' },
    cut(DESK.single('hedda', 'mcu')),
    { do: 'intro', who: 'hedda' },
    // 3. The ask, and the answer in telegrams.
    ...exchangeLooks('player', 'hedda'),
    cut(DESK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'The Boot float\'s keys?' },
    cut(DESK.single('hedda', 'mcu')),
    { do: 'say', who: 'hedda', text: 'Parade office. Behind City Hall. Mayor\'s cigar box.' },
    { do: 'say', who: 'hedda', text: 'Juniper\'s favour. Paid in full.' },
    // 4. The turn: the bailiff has noticed them. Hedda's price.
    { do: 'face', who: 'bailiff', at: 'hedda', s: 0.4 },
    cut(shot('bailiff', 'ms', { toward: 'hedda', side: 20 })),
    { do: 'gesture', who: 'bailiff', name: 'crossArms', s: 1.4, async: true },
    beat('pause'),
    cut(pushIn('hedda', 'mcu', 3, { toward: 'player', side: 25 })),
    { do: 'say', who: 'hedda', text: 'One condition. The front page is mine.' },
    cut(DESK.single('player', 'mcu')),
    { do: 'gesture', who: 'player', name: 'nod', s: 0.9, async: true },
    { do: 'say', who: 'player', text: 'Deal.' },
    // 5. Button: she is already walking away, writing it.
    { do: 'walk', who: 'hedda', path: [[-97.2, -46.2]], speed: 1.0, async: true },
    cut(shot('hedda', 'ms', { toward: 'player', side: 30 })),
    { do: 'say', who: 'hedda', text: 'Boot. Tribunal. Exclusive. Go.' },
    beat('tiny'),
  ],
};

// ---- p2: Even-Estates Plot 1 at night, and the bay ------------------------------------------------------------------
const SITE_CHARD = markOf('estates-plot-1-east', 'chard');
const SITE_WATCH_A = markOf('estates-plot-1-east', 'levelright-watch', 0);
const SITE_WATCH_B = markOf('estates-plot-1-east', 'levelright-watch', 1);
const SITE_PLAYER = markOf('estates-plot-1-east', 'player');
const FLOAT_IN = pathOf('estates-plot-1-east', 'float-to-estates');
const CART = carMark('estates-plot-1-east', 'watch-cart');
const CART_CHASE = pathOf('estates-plot-1-east', 'watch-cart-chase');

/** Chard and his watchman along the hoarding. */
const ROUND = coverage('chard', 'watch-a', 1);

export const DRESS_REHEARSAL_INTRO: SceneScript = {
  id: 'dress-rehearsal-intro',
  stage: { kind: 'world' },
  sky: 'night',
  music: 'heist',
  ambience: 'night',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/dress-rehearsal-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, at: SITE_PLAYER.at, yaw: SITE_PLAYER.yaw },
    { id: 'chard', preset: 'chard', at: SITE_CHARD.at, yaw: SITE_CHARD.yaw, held: 'night-shift-lantern' },
    { id: 'watch-a', name: 'Night Watch', look: WATCH_LOOK, at: SITE_WATCH_A.at, yaw: SITE_WATCH_A.yaw },
    { id: 'watch-b', name: 'Night Watch', look: WATCH_LOOK, at: SITE_WATCH_B.at, yaw: SITE_WATCH_B.yaw },
    { id: 'pip', preset: 'pip', seatedIn: 'float', seat: 0, at: [0, 0] },
    { id: 'tansy', preset: 'tansy', seatedIn: 'float', seat: 1, at: [0, 0] },
  ],
  vehicles: [
    { id: 'float', kind: 'boot-float', at: FLOAT_IN[0], yaw: -Math.PI / 2, headlights: true },
    { id: 'cart', kind: 'golf-cart', at: CART.at, yaw: CART.yaw },
  ],
  steps: [
    // 1. Hook: the foreman's lantern on the hoarding, a level tapped on a post.
    { do: 'sfx', id: 'tap', at: 'chard', gain: 0.6 },
    cut(ROUND.single('chard', 'ms', { height: 'low' })),
    { do: 'say', who: 'chard', text: 'That hoarding is out of square. Everything else is fine.' },
    cut(ROUND.single('watch-a', 'mcu')),
    { do: 'say', who: 'watch-a', text: 'Nobody\'s here to see it, boss.' },
    cut(ROUND.single('chard', 'mcu')),
    beat('beat'),
    { do: 'say', who: 'chard', text: 'I see it.' },
    // 2. The turn: headlights out of the dark, a horn, a thirty-foot boot.
    { do: 'sfx', id: 'engine-rev', at: 'float', gain: 0.5, async: true },
    { do: 'cam', shot: { kind: 'track', pos: up(-249, -101, 2.2), who: 'float', fov: 54 } },
    { do: 'drive', vehicle: 'float', path: FLOAT_IN.slice(1), speed: 6.5 },
    { do: 'horn', vehicle: 'float' },
    { do: 'gesture', who: 'watch-a', name: 'flinch', s: 0.8, async: true },
    cut(shot('pip', 'mcu', { toward: 'chard', side: 25 })),
    { do: 'gesture', who: 'pip', name: 'wave', s: 1.1, async: true },
    { do: 'say', who: 'pip', text: 'Evening! Parade practice! Extremely official!' },
    // Chard walks up with the lantern; shot low, the boot towering over him.
    { do: 'walk', who: 'chard', path: [[-262, -111]], speed: 1.0, async: true },
    cut(shot('chard', 'ms', { toward: 'float', side: -30, height: 'low' })),
    { do: 'say', who: 'chard', text: 'A thirty-foot boot is not on my plan.' },
    cut(shot('tansy', 'mcu', { toward: 'chard', side: 25 })),
    { do: 'say', who: 'tansy', text: 'It\'s not staying. Round your hoarding and gone.' },
    cut(shot('chard', 'mcu', { toward: 'tansy', side: -25 })),
    { do: 'gesture', who: 'chard', name: 'think', s: 1.2, async: true },
    beat('beat'),
    { do: 'say', who: 'chard', text: 'Mind the hoarding. It\'s level.' },
    // 3. Pip climbs down and gives the player the wheel.
    { do: 'exit', who: 'pip', s: 1.4 },
    { do: 'walk', who: 'pip', path: [[-252.6, -110]], speed: 2.2, run: true, async: true },
    cut(shot('pip', 'ms', { toward: 'player', side: -30, handheld: 0.02 })),
    { do: 'sfx', id: 'keys', at: 'pip', gain: 0.6, async: true },
    { do: 'say', who: 'pip', text: 'You drive! I navigate! Tansy judges!' },
    cut(shot('player', 'mcu', { toward: 'pip', side: -30 })),
    { do: 'gesture', who: 'player', name: 'nod', s: 0.9 },
    // 4. Button: the second watchman's whistle, his cart's lamp, the chase music.
    { do: 'face', who: 'watch-b', at: 'float', s: 0.3 },
    cut(shot('watch-b', 'mcu', { toward: 'float', side: 20 })),
    { do: 'sfx', id: 'whistle', at: 'watch-b', gain: 0.8 },
    { do: 'music', track: 'chase', fade: 0.3 },
    { do: 'lights', vehicle: 'cart', on: true },
    { do: 'gesture', who: 'watch-b', name: 'point', s: 1.0 },
    { do: 'cam', shot: { kind: 'track', pos: up(-255, -101, 1.2), who: 'cart', fov: 48 } },
    { do: 'drive', vehicle: 'cart', path: CART_CHASE.slice(1), speed: 4 },
    beat('tiny'),
  ],
};

const OUT_TANSY = markOf('side-valve-bay', 'tansy');

export const DRESS_REHEARSAL_OUTRO: SceneScript = {
  id: 'dress-rehearsal-outro',
  stage: { kind: 'world' },
  sky: 'night',
  music: 'turfton-dusk',
  ambience: 'night',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/dress-rehearsal-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, seatedIn: 'ride', seat: 0, at: [0, 0] },
    { id: 'pip', preset: 'pip', seatedIn: 'ride', seat: 1, at: [0, 0] },
    { id: 'tansy', preset: 'tansy', at: OUT_TANSY.at, yaw: Math.atan2(-147 - OUT_TANSY.at[0], 64 - OUT_TANSY.at[1]), held: 'night-shift-lantern' },
  ],
  vehicles: [
    { id: 'ride', kind: 'boot-float', from: 'player', at: [-124, 57.5], yaw: -Math.PI / 2, headlights: true },
  ],
  steps: [
    // 1. The Boot rolls onto the apron with its lights on, and they go off.
    { do: 'sfx', id: 'engine-rev', at: 'ride', gain: 0.4, async: true },
    { do: 'cam', shot: { kind: 'track', pos: up(-133, 68, 2.4), who: 'ride', fov: 54 } },
    { do: 'drive', vehicle: 'ride', path: [[-142, 57.5], [-147.5, 62.5]], speed: 6 },
    { do: 'lights', vehicle: 'ride', on: false },
    { do: 'sfx', id: 'creak', at: 'ride', gain: 0.6 },
    // 2. Tansy and her lantern; the scrape.
    cut(shot('tansy', 'mcu', { toward: 'ride', side: -25 })),
    { do: 'say', who: 'tansy', text: 'One scrape. Your foreman would call that out of square.' },
    { do: 'exit', who: 'pip', s: 1.2 },
    cut(shot('pip', 'mcu', { toward: 'tansy', side: 25 })),
    { do: 'gesture', who: 'pip', name: 'shrug', s: 1.0, async: true },
    { do: 'say', who: 'pip', text: 'That\'s not a scrape. That\'s character!' },
    // 3. The turn: Tansy turns to the player. Saturday is public.
    { do: 'exit', who: 'player', s: 1.2 },
    { do: 'face', who: 'tansy', at: 'player', s: 0.4 },
    cut(pushIn('tansy', 'mcu', 3, { toward: 'player', side: -25 })),
    { do: 'say', who: 'tansy', text: 'Saturday it goes down the parade route. Daylight. In front of everyone.' },
    // 4. Button: Pip, held.
    cut(shot('pip', 'cu', { toward: 'tansy', side: 25 })),
    beat('beat'),
    { do: 'say', who: 'pip', text: '...Everyone?' },
    { do: 'sfx', id: 'gulp', at: 'pip', gain: 0.7 },
    beat('pause'),
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'parade-permits-intro': PARADE_PERMITS_INTRO,
  'dress-rehearsal-intro': DRESS_REHEARSAL_INTRO,
  'dress-rehearsal-outro': DRESS_REHEARSAL_OUTRO,
};
