// Story row 41: Pinwheel Ridge. Three scenes on the wind farm (campus/windFarm.ts): the intro at dawn, where Lulu's lowrider
// drops the player at Ragwort Coilspring's control hut and Ragwort, who explains in numbers, names the three pinwheels the HOA
// re-cabled; the mid on the crest at Old Spin, which is heard before it is seen (the first sincere beat: Ragwort tips her hard
// hat to a pinwheel); and the outro at Whirly Bob at dusk, ten pinwheels turning and Turfton's lights steady far down the valley (W10).
// Notes: docs/design/gnome-theft-auto/direction/scenes/m41-pinwheel-ridge-{intro,mid,outro}.md
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, shot } from '../../direct';
import { carMark, markOf, up } from './kit';

const HUT = 'pinwheel-hut';
const OLD = 'pinwheel-old-spin';
const LAST = 'pinwheel-last-mast';
const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

// ---- Intro: the drop-off (dawn) --------------------------------------------------------------------------------------------

const I_PLAYER = markOf(HUT, 'player');
const I_RAGWORT = markOf(HUT, 'ragwort');
const I_CAR = carMark(HUT, 'ridge-lulu-car');
const I_EXIT: Vec2 = [862.5, -1243];
/** The car pulls up facing +z (it drove south down the track from the north road), then loops round and goes back. */
const CAR_IN: Vec2[] = [[850, -1290], [850, -1270], I_CAR.at];
const CAR_OUT: Vec2[] = [I_CAR.at, [853.4, -1251], [854, -1262], [852, -1276], [850, -1296]];
const LP = coverage('lulu', 'player', 1);
const RP = coverage('ragwort', 'player', -1);

export const PINWHEEL_RIDGE_INTRO: SceneScript = {
  id: 'm41-pinwheel-ridge-intro',
  stage: { kind: 'world' },
  music: 'frost',
  ambience: 'wind',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m41-pinwheel-ridge-intro.md', kind: 'intro' },
  title: 'Pinwheel Ridge',
  actors: [
    { id: 'player', player: true, at: I_PLAYER.at, yaw: towards(I_PLAYER.at, I_RAGWORT.at) },
    { id: 'ragwort', preset: 'ragwort', name: 'Ragwort Coilspring', at: I_RAGWORT.at, yaw: I_RAGWORT.yaw },
    { id: 'lulu', preset: 'lugnut lulu', name: 'Lugnut Lulu', at: CAR_IN[0], yaw: 0, seatedIn: 'lulu-car' },
  ],
  vehicles: [
    { id: 'lulu-car', kind: 'lowrider', at: CAR_IN[0], yaw: 0, tint: 0xff6a00, headlights: true },
  ],
  props: [
    // L95: the ridge has been waiting. A seized HOA cable reel with a clipboard notice nailed to it, a bench with a thermos and
    // a mug for one, and a spare pinwheel stuck in a flowerpot: Ragwort's whole life in a corner of the hillside.
    { id: 'reel', prefab: 'hoa-cable-reel', at: [864.8, -1244.6], yaw: 0.6 },
    { id: 'notice', prefab: 'hoa-clipboard', at: up(863.7, -1243.8, 0.5), yaw: 0.2, size: 0.4 },
    { id: 'bench', prefab: 'bench', at: [854.6, -1238.4], yaw: Math.PI },
    { id: 'thermos', prefab: 'cocoa-mug', at: up(854.6, -1238.4, 0.55), yaw: 0.5 },
  ],
  steps: [
    // 1. Hook: the ridge, dawn light, ten silent pinwheels in a high wind; a lowrider's engine comes up the track.
    { do: 'cam', shot: { kind: 'dolly', from: up(871, -1248, 0.8), to: up(866, -1245, 1.1), look: up(841.5, -1203.2, 24), s: 4.2, fov: 54 } },
    { do: 'sfx', id: 'creak', at: up(840, -1214, 6), gain: 0.4, async: true },
    { do: 'drive', vehicle: 'lulu-car', path: CAR_IN, speed: 9, async: true },
    { do: 'sfx', id: 'engine-rev', at: 'lulu-car', gain: 0.5, async: true },
    { do: 'wait', s: 4.2 },
    // 2. The lowrider stops, Lulu leans out of the window (the shot comes from the player's side, outside the car).
    { do: 'cam', shot: { kind: 'cut', pos: up(854.6, -1257.4, 1.5), look: 'lulu', fov: 40 } },
    { do: 'horn', vehicle: 'lulu-car' },
    { do: 'say', who: 'lulu', text: "Ridge. The Combine charges its cells up here. Ragwort's expecting you." },
    { do: 'face', who: 'player', at: 'lulu', s: 0.3, async: true },
    cut(LP.single('player', 'mcu')),
    { do: 'say', who: 'player', text: "You're not coming up?" },
    { do: 'cam', shot: { kind: 'cut', pos: up(854.6, -1257.4, 1.5), look: 'lulu', fov: 40 } },
    { do: 'gesture', who: 'lulu', name: 'wave', s: 1.2, async: true },
    { do: 'say', who: 'lulu', text: 'Heights? We are low and loud, remember. Go on. I will hold the road.' },
    // 3. Lulu leaves in a loop; the player turns towards the hut.
    { do: 'drive', vehicle: 'lulu-car', path: CAR_OUT, speed: 9, spline: true, async: true },
    { do: 'cam', shot: { kind: 'track', pos: up(853, -1262, 2.2), who: 'lulu-car', fov: 50 } },
    { do: 'sfx', id: 'engine-rev', at: 'lulu-car', gain: 0.5, async: true },
    { do: 'wait', s: 2.8 },
    // 4. Ragwort, at her hut door in the wind, looking up at the blades, not at the player. Her first line is a count.
    { do: 'face', who: 'player', at: 'ragwort', s: 0.4, async: true },
    cut(shot('ragwort', 'mcu', { toward: 'player', side: -25 })),
    { do: 'sfx', id: 'cloth', at: 'ragwort', gain: 0.4, async: true },
    { do: 'gesture', who: 'ragwort', name: 'point', s: 1.2, async: true },
    { do: 'say', who: 'ragwort', text: 'Twenty-two knots. Ten pinwheels. Not one turning. Naturally.' },
    { do: 'intro', who: 'ragwort' },
    // 5. The job: three re-cabled, named. Her names for them are the warmth in the scene.
    cut(RP.single('ragwort', 'mcu')),
    { do: 'say', who: 'ragwort', text: 'HOA re-cabled three. Old Spin, Sulks, Whirly Bob. Naturally the hard ones.' },
    cut(RP.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'What do I cut?' },
    // 6. The cable reel insert: a black drum with an HOA tag, a seized one, on the slope by the hut.
    { do: 'cam', shot: { kind: 'dolly', from: up(861.6, -1241.6, 1.3), to: up(862.6, -1242.2, 1.0), look: up(864.8, -1244.6, 0.5), s: 2.2, fov: 38 } },
    { do: 'sfx', id: 'tap', at: 'reel', gain: 0.4, async: true },
    { do: 'wait', s: 2.2 },
    cut(RP.single('ragwort', 'mcu')),
    { do: 'say', who: 'ragwort', text: 'The cable at the first. Then the linemen notice. Torque is a mood.' },
    // 7. She hands the wrench over: a gift, and a joke that is not a joke.
    { do: 'give', from: 'ragwort', to: 'player', prop: 'torque-wrench-chrome', s: 0.8 },
    { do: 'sfx', id: 'keys', at: 'player', gain: 0.4, async: true },
    cut(RP.single('ragwort', 'ms')),
    { do: 'say', who: 'ragwort', text: 'Mind the mood.' },
    // 8. Button: the player walks up the hill; the blades above are as still as ever. One last gust.
    { do: 'walk', who: 'player', path: [I_EXIT], speed: 1.5, async: true },
    { do: 'cam', shot: { kind: 'dolly', from: up(870, -1246, 0.8), to: up(866, -1243, 1.4), look: up(841.5, -1203.2, 24), s: 3.6, fov: 54 } },
    { do: 'sfx', id: 'whoosh', gain: 0.5, async: true },
    { do: 'wait', s: 3.6 },
  ],
};

// ---- Mid: Old Spin (day) -------------------------------------------------------------------------------------------------

const M_PLAYER = markOf(OLD, 'player');
const M_RAGWORT = markOf(OLD, 'ragwort');
const M_START: Vec2 = [780, -1197.5];
const OP = coverage('ragwort', 'player', 1);

export const PINWHEEL_RIDGE_MID: SceneScript = {
  id: 'm41-pinwheel-ridge-mid',
  stage: { kind: 'world' },
  music: 'mystery',
  ambience: 'wind',
  sky: 'noon',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m41-pinwheel-ridge-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, at: M_PLAYER.at, yaw: towards(M_PLAYER.at, [745, -1201.5]) },
    { id: 'ragwort', preset: 'ragwort', name: 'Ragwort Coilspring', at: M_START, yaw: towards(M_START, M_RAGWORT.at) },
  ],
  props: [
    // L95: the cut cable lies on the crest in two black halves with a hand-lettered tag Ragwort will not take down.
    { id: 'cable-tag', prefab: 'hoa-clipboard', at: up(742.6, -1200.4, 0.2), yaw: 1.2, size: 0.4 },
  ],
  steps: [
    // 1. Hook: the blades above the crest, still; then the wind finds them. No picture of a spinning blade, only sound:
    //    a long creak, a shudder, a whoosh that keeps going.
    { do: 'cam', shot: { kind: 'cut', pos: up(753, -1193, 0.9), look: up(752, -1201.2, 23), fov: 54 } },
    { do: 'sfx', id: 'creak', at: up(746, -1201, 20), gain: 0.6, async: true },
    { do: 'shake', amp: 0.06, s: 1.6 },
    { do: 'wait', s: 1.6 },
    { do: 'sfx', id: 'whoosh', at: up(746, -1201, 20), gain: 0.7, async: true },
    { do: 'wait', s: 1.4 },
    // 2. Ragwort comes running up the crest, hard hat in her hand against the wind.
    { do: 'walk', who: 'ragwort', path: [[760, -1197.5], M_RAGWORT.at], speed: 3.2, run: true, async: true },
    cut(shot('ragwort', 'ms', { toward: 'player', side: 30 })),
    { do: 'wait', s: 3.2 },
    // 3. She stops, looks up, the sincere beat: no gag on it. She says hello to a pinwheel.
    { do: 'face', who: 'ragwort', at: [745, -1201.5], s: 0.5 },
    cut(OP.single('ragwort', 'cu')),
    { do: 'music', track: 'warm', fade: 2 },
    beat('pause'),
    { do: 'say', who: 'ragwort', text: 'Hello, Old Spin.' },
    { do: 'gesture', who: 'ragwort', name: 'tipHat', s: 1.4, async: true },
    beat('silence'),
    // 4. She comes back to the job, a little rough at the edges, in numbers.
    { do: 'face', who: 'player', at: 'ragwort', s: 0.3, async: true },
    cut(OP.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'How long?' },
    cut(OP.single('ragwort', 'mcu')),
    { do: 'say', who: 'ragwort', text: 'Eleven years, four months. Two more, then all ten sing. Sulks next.' },
    cut(OP.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Linemen?' },
    cut(OP.single('ragwort', 'mcu')),
    { do: 'say', who: 'ragwort', text: 'Two. With clipboards. Mind the clipboards.' },
    // 5. Button: the ridge east, ninety metres to Sulks, standing still; Ragwort puts her hat back on.
    { do: 'cam', shot: { kind: 'dolly', from: up(748, -1196, 1.3), to: up(756, -1196.4, 1.5), look: up(841.5, -1203.2, 24), s: 3.4, fov: 44 } },
    { do: 'sfx', id: 'cloth', at: 'ragwort', gain: 0.4, async: true },
    { do: 'wait', s: 3.4 },
  ],
};

// ---- Outro: Whirly Bob (dusk) --------------------------------------------------------------------------------------------

const O_PLAYER = markOf(LAST, 'player');
const O_RAGWORT = markOf(LAST, 'ragwort');
const OR = coverage('ragwort', 'player', -1);

export const PINWHEEL_RIDGE_OUTRO: SceneScript = {
  id: 'm41-pinwheel-ridge-outro',
  stage: { kind: 'world' },
  music: 'warm',
  ambience: 'wind',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m41-pinwheel-ridge-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, at: O_PLAYER.at, yaw: O_PLAYER.yaw },
    { id: 'ragwort', preset: 'ragwort', name: 'Ragwort Coilspring', at: O_RAGWORT.at, yaw: O_RAGWORT.yaw, held: 'cocoa-mug' },
  ],
  props: [
    // L95: the crank, after: a drop of oil on the plinth, and the tin thermos Ragwort carried up and set down.
    { id: 'thermos', prefab: 'cocoa-mug', at: up(922.6, -1198.4, 0.3), yaw: 0.6, size: 0.3 },
  ],
  steps: [
    // 1. Hook: low, east of the plinth, the last light on the ridge; the whirr of ten pinwheels building. Sound first.
    { do: 'cam', shot: { kind: 'dolly', from: up(935, -1194, 0.9), to: up(932, -1196, 1.4), look: up(928, -1200, 34), s: 4, fov: 56 } },
    { do: 'sfx', id: 'whoosh', at: up(925, -1201, 20), gain: 0.7, async: true },
    { do: 'wait', s: 4 },
    // 2. Ragwort, hat tipped back, looking south, says it. Her singles sit on her facing side (no `toward`), so the face reads.
    cut(shot('ragwort', 'mcu', { side: -25 })),
    { do: 'face', who: 'ragwort', at: [900, -1100], s: 0.4, async: true },
    { do: 'say', who: 'ragwort', text: 'All ten. I forgot how loud that is.' },
    cut(OR.single('player', 'mcu')),
    { do: 'face', who: 'player', at: 'ragwort', s: 0.4 },
    { do: 'say', who: 'player', text: 'Is it done?' },
    cut(shot('ragwort', 'mcu', { side: -25 })),
    { do: 'say', who: 'ragwort', text: 'Power is cut. Part one of four. The Combine charges at nought percent.' },
    // 3. The view: Turfton, far down the valley, dusk, the neon coming up steady.
    { do: 'music', track: 'turfton-dusk', fade: 2.4 },
    { do: 'cam', shot: { kind: 'dolly', from: up(927, -1196, 1.6), to: up(924, -1196.6, 2.4), look: up(850, -250, 60), s: 5, fov: 46 } },
    { do: 'sfx', id: 'bell', gain: 0.3, async: true },
    { do: 'wait', s: 5 },
    // 4. Ragwort's quiet line over the view; then the thermos: the tiny gag lands last.
    cut(shot('ragwort', 'mcu', { side: -25 })),
    { do: 'say', who: 'ragwort', text: 'There. Steady. The wind was always willing.' },
    { do: 'sfx', id: 'pour', at: 'ragwort', gain: 0.5, async: true },
    { do: 'gesture', who: 'ragwort', name: 'point', s: 1, async: true },
    cut(shot('ragwort', 'ms', { side: -25 })),
    { do: 'say', who: 'ragwort', text: 'Tea is cold. Naturally.' },
    { do: 'wait', s: 1.4 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm41-pinwheel-ridge-intro': PINWHEEL_RIDGE_INTRO,
  'm41-pinwheel-ridge-mid': PINWHEEL_RIDGE_MID,
  'm41-pinwheel-ridge-outro': PINWHEEL_RIDGE_OUTRO,
};
