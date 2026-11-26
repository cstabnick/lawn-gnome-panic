// Story row 43 (m43-saltbucket-boardwalk): Saltbucket Boardwalk. Three scenes: Driftwood's phone call, cut between the player at the
// Rutbottom Dirt Bowl gate and Driftwood on the sand at dawn with the Saltwater at his back (he turns his back on it to tell
// someone, and asks nobody to tell the sea); Marram Teaspoon's Spokewheel in full day, where the wheel lifts the player out of the
// frame, three black HOA barges lie far out at the top, and the wheel stops (the light moment); and the dusk outro at the Last Tube,
// Driftwood in a deckchair with the sea in front of him, no jokes: the sincere payoff of rows 25 and 32. What is across the Saltwater
// is not answered.
// Notes: docs/design/gnome-theft-auto/direction/scenes/m43-saltbucket-boardwalk-{intro,mid,outro}.md
import type { SceneScript, Vec2, Vec3 } from '../../script';
import { beat, coverage, cut, pushIn, reaction, shot } from '../../direct';
import { markOf, spot, up } from './kit';

const GATE = 'm43-bowl-gate';
const SHORE = 'm43-shore-dawn';
const PLATFORM = 'coast-spokewheel';
const HUT = 'm43-tube-hut-dusk';
/** Sea level of the Saltwater (coast/config.ts). */
const SEA_Y = -8.9;

// ---- 1. Intro: the call -----------------------------------------------------------------------------------------------------
const G_YOU = markOf(GATE, 'player');
const S_DRIFT = markOf(SHORE, 'driftwood');

/**
 * Dawn, cut between two places eighteen hundred metres apart. A phone rings at the Dirt Bowl gate. On the beach Driftwood has
 * turned his back on the Saltwater to say it out loud: he crossed the dunes, he is standing at the sea, and he has a hut. His voice
 * cracks once. The tide is a bell; the player hears it through the can, then the empty road south.
 */
export const M43_INTRO: SceneScript = {
  id: 'm43-saltbucket-boardwalk-intro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'warm',
  ambience: 'wind',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m43-saltbucket-boardwalk-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, held: 'tin-can-phone', at: G_YOU.at, yaw: G_YOU.yaw },
    { id: 'driftwood', preset: 'driftwood', held: 'tin-can-phone', at: S_DRIFT.at, yaw: S_DRIFT.yaw },
  ],
  steps: [
    // Hook: a ring in an empty gate, the second ring answered.
    cut(spot(GATE, 'wide')),
    { do: 'sfx', id: 'phone', at: up(G_YOU.at[0], G_YOU.at[1], 1), gain: 0.6, async: true },
    { do: 'wait', s: 1.4 },
    { do: 'sfx', id: 'phone', at: up(G_YOU.at[0], G_YOU.at[1], 1), gain: 0.6, async: true },
    { do: 'gesture', who: 'player', name: 'beckon', s: 0.8, async: true },
    cut(shot('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Hello? Driftwood?' },
    // Setup: the other end of the line. Surf, gulls, a man with his back to the biggest thing he has ever seen.
    { do: 'ambience', bed: 'shore', fade: 1.2 },
    cut(spot(SHORE, 'wide')),
    { do: 'sfx', id: 'flutter', at: up(S_DRIFT.at[0], S_DRIFT.at[1], 3), gain: 0.4, async: true },
    { do: 'wait', s: 2.2 },
    cut(shot('driftwood', 'mcu')),
    { do: 'say', who: 'driftwood', text: 'Friend! Can you hear it? That hush behind me is the Saltwater.' },
    cut(shot('player', 'mcu')),
    { do: 'say', who: 'player', text: 'You crossed the dunes?' },
    cut(shot('driftwood', 'mcu')),
    { do: 'say', who: 'driftwood', text: 'Only to the edge. The edge is plenty. I am standing in it.' },
    // Turn: the voice goes, once.
    beat('pause'),
    cut(pushIn('driftwood', 'mcu', 3.6, { to: 'cu' })),
    { do: 'gesture', who: 'driftwood', name: 'clutch', s: 1.4, async: true },
    { do: 'say', who: 'driftwood', text: 'Do not tell the sea I turned my back on it.' },
    ...reaction('player', { gesture: 'nod', hold: 'pause' }),
    cut(shot('driftwood', 'mcu')),
    { do: 'say', who: 'driftwood', text: 'I had to tell somebody. The gulls already knew.' },
    ...reaction('player', { gesture: 'nod', hold: 'pause' }),
    // The job, in his voice: a place and a roof.
    cut(shot('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Where do I find you?' },
    cut(shot('driftwood', 'mcu')),
    { do: 'say', who: 'driftwood', text: 'South, through the dunes. There is a hut. The roof is mostly a roof.' },
    cut(shot('player', 'mcu')),
    { do: 'say', who: 'player', text: 'I am on my way.' },
    // Button: he turns to the sea at last; a bell answers from the water, and then the empty road.
    cut(spot(SHORE, 'wide')),
    { do: 'face', who: 'driftwood', yaw: 0, s: 2.2, async: true },
    { do: 'wait', s: 1.0 },
    { do: 'sfx', id: 'bell', at: up(S_DRIFT.at[0], S_DRIFT.at[1] + 40, 1), gain: 0.5, async: true },
    { do: 'wait', s: 2.4 },
    cut(spot(GATE, 'road-south')),
    { do: 'sfx', id: 'bell', at: up(G_YOU.at[0], G_YOU.at[1], 1), gain: 0.25, async: true },
    { do: 'wait', s: 2.0 },
  ],
};

// ---- 2. Mid: the Spokewheel -------------------------------------------------------------------------------------------------
const P_MARRAM = markOf(PLATFORM, 'marram');
const P_YOU = markOf(PLATFORM, 'player');
/** The wheel's hub is 21 m up and the rim 18 m round it: the top teacup hangs about 36.5 m above the ground. */
const TOP: Vec3 = up(-260, 1100, 36.5);
/** The three barges, far out, in a convoy line heading west. The third is the one row 44 boards. */
const BARGES: { id: string; at: Vec2 }[] = [
  { id: 'barge-1', at: [-70, 1425] },
  { id: 'barge-2', at: [18, 1470] },
  { id: 'barge-3', at: [107, 1452] },
];
const SEA_SIDE: Vec3 = up(-260, 1096, 38.4);
const RIDE = coverage('marram', 'player', 1);

/**
 * Noon on the boardwalk. Marram works the bell and the patter and loads the player into a teacup (first ride is free). The wheel
 * carries them up out of the frame: from the top, only the sea, and three black barges flying the Association's flags far out on it.
 * Then the wheel stops at the top, as it sometimes does. Back on the platform Marram says nobody panicked. The light moment of the row.
 */
export const M43_MID: SceneScript = {
  id: 'm43-saltbucket-boardwalk-mid',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'turfton',
  ambience: 'shore',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m43-saltbucket-boardwalk-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, held: null, at: P_YOU.at, yaw: P_YOU.yaw },
    { id: 'marram', preset: 'marram', at: P_MARRAM.at, yaw: P_MARRAM.yaw },
  ],
  vehicles: BARGES.map((b) => ({ id: b.id, kind: 'watering-can-steamer' as const, at: b.at, yaw: -Math.PI / 2, tint: 0x16161d })),
  steps: [
    // Hook: the bell, and a barker who has already decided to sell you the sea.
    cut(spot(PLATFORM, 'platform')),
    { do: 'sfx', id: 'bell', at: 'marram', gain: 0.6, async: true },
    { do: 'gesture', who: 'marram', name: 'wave', s: 1.4, async: true },
    { do: 'wait', s: 1.8 },
    cut(RIDE.single('marram', 'mcu')),
    { do: 'say', who: 'marram', text: 'Step up, pet! The whole sea for two acorns!' },
    cut(RIDE.single('player', 'mcu')),
    { do: 'gesture', who: 'player', name: 'shrug', s: 1.2 },
    cut(RIDE.single('marram', 'mcu')),
    { do: 'gesture', who: 'marram', name: 'point', s: 1.0, async: true },
    { do: 'say', who: 'marram', text: 'Not you, pet. First ride is free. Mind the teacups.' },
    { do: 'intro', who: 'marram' },
    // The ride: hat on, hands in, the wheel takes them up past the stalls and out of the frame.
    cut(RIDE.single('player', 'mcu')),
    { do: 'gesture', who: 'player', name: 'nod', s: 0.8 },
    { do: 'sfx', id: 'bell', at: 'marram', gain: 0.5, async: true },
    { do: 'despawn', id: 'marram' },
    { do: 'despawn', id: 'player' },
    { do: 'sfx', id: 'creak', at: up(-260, 1100, 4), gain: 0.5, async: true },
    cut({ kind: 'dolly', from: up(-266, 1086, 1.8), to: up(-266, 1086, 33), look: up(-260, 1100, 8), lookTo: TOP, s: 3.2, fov: 50 }),
    { do: 'sfx', id: 'whoosh', at: up(-260, 1100, 20), gain: 0.4, async: true },
    { do: 'wait', s: 2.6 },
    // Turn: the top of the wheel, the whole Saltwater, and three black shapes lying on it in a row.
    { do: 'music', track: 'mystery', fade: 0.6 },
    cut({ kind: 'dolly', from: SEA_SIDE, to: [SEA_SIDE[0] + 0.6, SEA_SIDE[1] + 0.2, SEA_SIDE[2] - 0.4], look: [-120, SEA_Y, 1400], lookTo: [18, SEA_Y, 1452], s: 3.4, fov: 30 }),
    { do: 'sfx', id: 'flutter', at: SEA_SIDE, gain: 0.3, async: true },
    { do: 'stinger', id: 'reveal' },
    { do: 'wait', s: 2.8 },
    // The wheel stops at the top.
    { do: 'music', track: null, fade: 0.4 },
    { do: 'sfx', id: 'thud', at: TOP, gain: 0.6, async: true },
    { do: 'shake', amp: 0.05, s: 0.7 },
    { do: 'sfx', id: 'creak', at: TOP, gain: 0.5, async: true },
    beat('silence'),
    { do: 'music', track: 'turfton', fade: 0.4 },
    { do: 'sfx', id: 'whoosh', at: TOP, gain: 0.4, async: true },
    // Back on the platform.
    { do: 'spawn', id: 'marram', at: P_MARRAM.at, yaw: P_MARRAM.yaw },
    { do: 'spawn', id: 'player', at: P_YOU.at, yaw: P_YOU.yaw },
    cut(RIDE.single('marram', 'mcu', { height: 'low' })),
    { do: 'say', who: 'marram', text: 'Three black barges, pet. HOA flags. They come in the dark and leave light.' },
    cut(RIDE.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'The wheel stopped.' },
    cut(RIDE.single('marram', 'mcu')),
    { do: 'say', who: 'marram', text: 'Lovely view, that. Nobody panicked.' },
    cut(RIDE.single('player', 'mcu')),
    { do: 'gesture', who: 'player', name: 'shrug', s: 1.0 },
    cut(RIDE.single('marram', 'mcu')),
    { do: 'sfx', id: 'bell', at: 'marram', gain: 0.6, async: true },
    { do: 'say', who: 'marram', text: 'Hands inside the teacup, pet.' },
  ],
};

// ---- 3. Outro: the Last Tube at dusk ----------------------------------------------------------------------------------------
const H_DRIFT = markOf(HUT, 'driftwood');
const H_YOU = markOf(HUT, 'player');
const HUT_TALK = coverage('driftwood', 'player', 1);

/**
 * Dusk at the Last Tube. Driftwood in a deckchair with the Saltwater in front of him; the player sits on a tube at his shoulder.
 * He thought he had made it up. It is enormous, and he is still at the edge, and the glow is still out there. He thanks the
 * player for coming. No jokes: the one held silence, the bell, and nothing is said about what is across.
 */
export const M43_OUTRO: SceneScript = {
  id: 'm43-saltbucket-boardwalk-outro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'turfton-dusk',
  ambience: 'shore',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m43-saltbucket-boardwalk-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, held: null, at: [H_YOU.at[0] + 3, H_YOU.at[1] + 5], yaw: Math.PI },
    { id: 'driftwood', preset: 'driftwood', held: null, at: H_DRIFT.at, yaw: H_DRIFT.yaw },
  ],
  props: [
    { id: 'chair', prefab: 'deck-chair', at: H_DRIFT.at, yaw: H_DRIFT.yaw, size: 1.7, by: 'h' },
    { id: 'tube', prefab: 'tow-tube', at: H_YOU.at, yaw: 0, size: 1.8, by: 'w' },
    { id: 'tubes', prefab: 'tube-rack', at: [153.4, 1161.2], yaw: Math.PI, size: 3.2, by: 'w' },
  ],
  steps: [
    { do: 'gesture', who: 'driftwood', name: 'sit', s: 0.1, async: true },
    // Hook: the hut, the stacked tubes, a chair, and a man not moving. A rope slaps a rail.
    cut(spot(HUT, 'wide')),
    { do: 'sfx', id: 'creak', at: 'chair', gain: 0.4, async: true },
    { do: 'walk', who: 'player', path: [H_YOU.at], speed: 1.2, async: true },
    { do: 'wait', s: 2.8 },
    { do: 'gesture', who: 'player', name: 'sit', s: 0.1 },
    // Setup: he does not turn round.
    cut(HUT_TALK.single('driftwood', 'mcu')),
    { do: 'say', who: 'driftwood', text: 'Sit, friend. The sea does not mind company.' },
    cut(HUT_TALK.single('player', 'mcu')),
    beat('pause'),
    cut(HUT_TALK.single('driftwood', 'mcu')),
    { do: 'say', who: 'driftwood', text: 'Six months I said it was real. Now it is only there.' },
    // The look: the two of them from behind, and the whole Saltwater.
    cut(spot(HUT, 'behind')),
    { do: 'music', track: null, fade: 1.2 },
    { do: 'ambience', bed: 'shore', fade: 1.0 },
    beat('silence'),
    cut(HUT_TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'It is real.' },
    // Turn: he says what it is, and that he is still on the edge of it.
    cut(pushIn('driftwood', 'mcu', 3.6, { to: 'cu', toward: 'player', side: 25 })),
    { do: 'music', track: 'turfton-dusk', fade: 2.0 },
    { do: 'say', who: 'driftwood', text: 'It is enormous, is what it is. And I am only at the edge.' },
    cut(HUT_TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'The glow?' },
    cut(HUT_TALK.single('driftwood', 'mcu')),
    { do: 'say', who: 'driftwood', text: 'Still out there. I will not ask what it is tonight.' },
    cut(HUT_TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'And tomorrow?' },
    cut(HUT_TALK.single('driftwood', 'mcu')),
    { do: 'say', who: 'driftwood', text: 'Tomorrow, the hut. Somebody has to open the door.' },
    cut(pushIn('driftwood', 'mcu', 3.0, { to: 'cu', toward: 'player', side: 25 })),
    { do: 'say', who: 'driftwood', text: 'Thank you for coming to see it.' },
    // Button: the bell, once, far out on the water; the two of them small against a very large sea.
    cut(spot(HUT, 'behind')),
    { do: 'sfx', id: 'bell', at: up(148, 1260, 1), gain: 0.5, async: true },
    { do: 'wait', s: 3.2 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm43-saltbucket-boardwalk-intro': M43_INTRO,
  'm43-saltbucket-boardwalk-mid': M43_MID,
  'm43-saltbucket-boardwalk-outro': M43_OUTRO,
};
