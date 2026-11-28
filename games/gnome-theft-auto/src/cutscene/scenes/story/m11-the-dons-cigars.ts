// Story row 11 (m11-the-dons-cigars): The Don's Cigars. Three scenes: two taps at the Mulch Club's side door (Big Lou
// translates the HOA citation), Baroness Brenda's toll on the canal bank with an HOA van sliding across the road, and Big Lou
// checking the player's hat at the door while the Don lights one and an HOA van watches from across the road.
// Notes: docs/design/gnome-theft-auto/direction/scenes/dons-cigars-{intro,mid,outro}.md. Played by quests/story/11-the-dons-cigars.ts.
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, reaction, shot } from '../../direct';
import { markOf, spot, up } from './kit';

const MCD = 'mulch-club-door';
const THRONE = 'brenda-throne';
const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);
const HOA_LOOK = { hat: 0x18181e, shirt: 0xc9b99b };
const BIKER_LOOK = { hat: 0xf06aa8, shirt: 0xf6b6d2, pants: 0x6a2a4a };

// ---- The Mulch Club's side door (intro, outro) ----------------------------------------------------------------------------
const DON = markOf(MCD, 'don-compost');
const LOU = markOf(MCD, 'bodyguard', 0);
const DOOR_PLAYER = markOf(MCD, 'player');
const DON_AND_LOU = coverage('lou', 'player', 1);

/** The Don's doorstep: a stack of cigar boxes and the pink HOA citation propped against the lamp. Same in both scenes. */
const DOORSTEP_PROPS: NonNullable<SceneScript['props']> = [
  { id: 'cigar-stack', prefab: 'cigar-box', at: up(-15.4, -27.8, 0), yaw: 0.3, size: 0.5 },
  { id: 'citation', prefab: 'citation-slip', at: up(-16.2, -32.6, 0), yaw: 1.2, size: 1.0, by: 'h' },
];

/** The Don's Cigars, scene 1: two taps. Big Lou translates a pink HOA citation and a crate run to the canal. */
export const DONS_CIGARS_INTRO: SceneScript = {
  id: 'dons-cigars-intro',
  stage: { kind: 'world' },
  music: 'heist',
  ambience: 'street',
  sky: 'noon',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/dons-cigars-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, at: DOOR_PLAYER.at, yaw: towards(DOOR_PLAYER.at, LOU.at) },
    { id: 'don', preset: 'don compost', at: DON.at, yaw: DON.yaw },
    { id: 'lou', preset: 'big lou', at: LOU.at, yaw: towards(LOU.at, DOOR_PLAYER.at) },
  ],
  props: DOORSTEP_PROPS,
  steps: [
    // Hook: the Don's hand, still. Two taps. Nobody says anything.
    cut(shot('don', 'ms', { toward: 'player', height: 'low', side: -30 })),
    { do: 'wait', s: 0.8 },
    { do: 'sfx', id: 'knock', at: 'don' },
    { do: 'wait', s: 0.55 },
    { do: 'sfx', id: 'knock', at: 'don' },
    { do: 'wait', s: 0.6 },
    // Lou translates, slowly, one fact at a time.
    cut(DON_AND_LOU.single('lou', 'mcu', { height: 'low' })),
    { do: 'say', who: 'lou', text: 'Two taps. Acorns.' },
    // L105: Big Lou's first story appearance (the first contract's translator is an unnamed bodyguard).
    { do: 'intro', who: 'lou' },
    cut(DON_AND_LOU.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'For what?' },
    // The picture answers first: the citation, an HOA ticket, a cigar stubbed out on it.
    { do: 'cam', shot: { kind: 'cut', pos: up(-13.6, -31.4, 1.2), look: 'citation', fov: 36 } },
    { do: 'sfx', id: 'paper', at: 'citation', gain: 0.6, async: true },
    { do: 'wait', s: 1.4 },
    cut(DON_AND_LOU.single('lou', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'lou', name: 'point', s: 1.2, async: true },
    { do: 'say', who: 'lou', text: 'HOA cited the boats. Unlicensed smoke.' },
    cut(DON_AND_LOU.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Smoke needs a licence?' },
    cut(DON_AND_LOU.single('lou', 'mcu', { height: 'low' })),
    beat('beat'),
    { do: 'say', who: 'lou', text: 'Now it does.' },
    // The turn: one tap, the job.
    cut(shot('don', 'mcu', { toward: 'player', height: 'low', side: -30 })),
    { do: 'sfx', id: 'knock', at: 'don' },
    { do: 'wait', s: 1.3 },
    cut(DON_AND_LOU.single('lou', 'mcu', { height: 'low' })),
    { do: 'say', who: 'lou', text: 'One tap. Crates, on the canal. Brenda tolls the road.' },
    cut(DON_AND_LOU.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Do I pay her?' },
    // Button: Lou, the one-word verdict, and the Don's brow.
    cut(DON_AND_LOU.single('lou', 'mcu', { height: 'low' })),
    { do: 'sfx', id: 'cloth', at: 'lou', gain: 0.5, async: true },
    { do: 'say', who: 'lou', text: 'Don pays. You bring them dry.' },
    { do: 'wait', s: 1.4 },
  ],
};

// ---- Baroness Brenda's toll (mid) -----------------------------------------------------------------------------------------
const BRENDA = markOf(THRONE, 'brenda');
const THRONE_PLAYER = markOf(THRONE, 'player');
const BRENDA_STANDS: Vec2 = [-44.8, 218];
const BRENDA_TALK = coverage('brenda', 'player', -1);
/** The HOA van's slow arrival: up the highway, then across the road. */
const HOA_VAN_PATH: Vec2[] = [[-2.5, 150], [-2.5, 188], [-6, 198]];

/** The Don's Cigars, scene 2: Brenda's toll on the canal bank, the crates on the quay, an HOA van across the road. */
export const DONS_CIGARS_MID: SceneScript = {
  id: 'dons-cigars-mid',
  stage: { kind: 'world' },
  music: 'turfton',
  ambience: 'water',
  sky: 'noon',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/dons-cigars-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, at: THRONE_PLAYER.at, yaw: towards(THRONE_PLAYER.at, BRENDA_STANDS) },
    { id: 'brenda', preset: 'brenda', held: 'feather-duster', at: BRENDA_STANDS, yaw: towards(BRENDA_STANDS, THRONE_PLAYER.at) },
    { id: 'biker', name: 'Biker', look: BIKER_LOOK, at: [-52, 216], yaw: Math.PI / 2 },
    { id: 'hoa-driver', name: 'HOA Inspector', look: HOA_LOOK, hidden: true, seatedIn: 'hoa-van', at: [0, 0] },
  ],
  vehicles: [{ id: 'hoa-van', kind: 'hoa-van', at: HOA_VAN_PATH[0], yaw: 0, hidden: true }],
  props: [
    { id: 'crate-a', prefab: 'cigar-crate', at: up(-32.4, 219.6, 0), yaw: 0.2, size: 0.9, by: 'h' },
    { id: 'crate-b', prefab: 'cigar-crate', at: up(-30.8, 220.4, 0), yaw: -0.3, size: 0.9, by: 'h' },
    { id: 'crate-c', prefab: 'cigar-crate', at: up(-31.8, 219.9, 0.9), yaw: 0.1, size: 0.9, by: 'h' },
    { id: 'rope', prefab: 'wooden-post', at: up(-38.6, 217.4, 0), yaw: 0, size: 1.1, by: 'h' },
  ],
  steps: [
    // The republic's waterfront, shot from the road side: a boombox, a flamingo, a pink bike gang.
    cut(spot(THRONE, 'wide')),
    { do: 'sfx', id: 'squeak', at: 'biker', gain: 0.4, async: true },
    { do: 'wait', s: 1.6 },
    // Brenda, first appearance: a proclamation. Her card follows it.
    cut(BRENDA_TALK.single('brenda', 'mcu')),
    { do: 'gesture', who: 'brenda', name: 'point', s: 1.3, async: true },
    { do: 'say', who: 'brenda', text: 'By decree: the Republic taxes cigars, boats and hats.' },
    { do: 'intro', who: 'brenda' },
    cut(BRENDA_TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'The Don sent me. For his crates.' },
    cut(BRENDA_TALK.single('brenda', 'mcu')),
    { do: 'sfx', id: 'cash', at: 'player', gain: 0.5, async: true },
    { do: 'say', who: 'brenda', text: 'The Don is a friend. Friends pay fifty acorns. By decree.' },
    ...reaction('player', { size: 'mcu', hold: 'pause' }),
    // The turn: an HOA van, slowly, up the road she cannot tax. She is the first to see it.
    { do: 'spawn', id: 'hoa-van' },
    { do: 'spawn', id: 'hoa-driver' },
    { do: 'cam', shot: { kind: 'track', pos: up(-26, 204, 2.4), who: 'hoa-van', fov: 48 } },
    { do: 'drive', vehicle: 'hoa-van', path: HOA_VAN_PATH, speed: 8, async: true },
    { do: 'wait', s: 4.4 },
    cut(BRENDA_TALK.single('brenda', 'mcu')),
    { do: 'gesture', who: 'brenda', name: 'flinch', s: 0.8, async: true },
    { do: 'say', who: 'brenda', text: 'An HOA van! By decree, nobody has seen you.' },
    { do: 'wait', s: 1.2 },
  ],
};

// ---- The hat check (outro) ------------------------------------------------------------------------------------------------
const HOA_VAN_AT: Vec2 = [2.5, -52];
const HAT_CHECK = coverage('lou', 'player', -1);
const DON_VIEW = coverage('don', 'lou', 1);

/** The Don's Cigars, scene 3: Lou checks the hat; the Don lights one; an HOA van across the road sees, and is seen. */
export const DONS_CIGARS_OUTRO: SceneScript = {
  id: 'dons-cigars-outro',
  stage: { kind: 'world' },
  music: 'heist',
  ambience: 'night',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/dons-cigars-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, at: DOOR_PLAYER.at, yaw: towards(DOOR_PLAYER.at, LOU.at) },
    { id: 'don', preset: 'don compost', held: 'cigar-box', at: DON.at, yaw: DON.yaw },
    { id: 'lou', preset: 'big lou', at: LOU.at, yaw: towards(LOU.at, DOOR_PLAYER.at) },
    { id: 'inspector', name: 'HOA Inspector', look: HOA_LOOK, held: 'field-binoculars', at: [1.2, -49.6], yaw: -Math.PI / 2 },
  ],
  vehicles: [{ id: 'hoa-van', kind: 'hoa-van', at: HOA_VAN_AT, yaw: Math.PI, headlights: true }],
  props: DOORSTEP_PROPS,
  steps: [
    // Hook: Lou, one word, at the player's hat.
    cut(HAT_CHECK.single('lou', 'mcu', { height: 'low' })),
    { do: 'walk', who: 'lou', path: [[-12.4, -31.4]], speed: 1.0, async: true },
    { do: 'say', who: 'lou', text: 'Hat.' },
    { do: 'face', who: 'lou', at: 'player', s: 0.3 },
    { do: 'sfx', id: 'cloth', at: 'lou', gain: 0.6, async: true },
    cut(shot('lou', 'cu', { toward: 'player', side: -20 })),
    { do: 'gesture', who: 'lou', name: 'beckon', s: 1.2, async: true },
    beat('pause'),
    { do: 'say', who: 'lou', text: 'Dry.' },
    ...reaction('player', { size: 'mcu', hold: 'pause' }),
    cut(HAT_CHECK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Is that good?' },
    cut(HAT_CHECK.single('lou', 'mcu', { height: 'low' })),
    { do: 'say', who: 'lou', text: 'Don says yes. I say hat.' },
    // The turn: the Don opens the box, and lights one. The sound of a lighter, and a very long look across the road.
    { do: 'music', track: null, fade: 0.5 },
    cut(DON_VIEW.single('don', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'don', name: 'think', s: 1.2, async: true },
    { do: 'sfx', id: 'latch', at: 'don', gain: 0.8 },
    { do: 'wait', s: 0.5 },
    { do: 'sfx', id: 'latch', at: 'don', gain: 0.8 },
    { do: 'wait', s: 1.0 },
    // Shown, not told: across the road the HOA van idles with its lamps on; its inspector lowers his binoculars.
    { do: 'cam', shot: { kind: 'cut', pos: up(-15.2, -33.4, 1.5), look: up(1.4, -49.8, 1.2), fov: 30 } },
    { do: 'sfx', id: 'tap', at: 'don', gain: 0.7 },
    { do: 'wait', s: 1.6 },
    { do: 'lights', vehicle: 'hoa-van', on: false },
    { do: 'cam', shot: { kind: 'track', pos: up(-8, -46, 1.6), who: 'hoa-van', fov: 46 } },
    { do: 'drive', vehicle: 'hoa-van', path: [[2.5, -52], [2.5, -74], [2.5, -96]], speed: 9, arrive: false, async: true },
    { do: 'sfx', id: 'engine-rev', at: 'hoa-van', gain: 0.5, async: true },
    { do: 'wait', s: 2.4 },
    // Button: Lou's farewell, the same word.
    { do: 'music', track: 'turfton-dusk', fade: 0.8 },
    cut(HAT_CHECK.single('lou', 'mcu', { height: 'low' })),
    { do: 'say', who: 'lou', text: 'Hat.' },
    { do: 'wait', s: 1.0 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'dons-cigars-intro': DONS_CIGARS_INTRO,
  'dons-cigars-mid': DONS_CIGARS_MID,
  'dons-cigars-outro': DONS_CIGARS_OUTRO,
};
