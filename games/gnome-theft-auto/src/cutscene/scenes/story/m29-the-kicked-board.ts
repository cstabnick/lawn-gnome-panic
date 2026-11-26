// Story row 29 (m29-the-kicked-board): The Kicked Board. Three scenes: Frank at his sign at dawn as the fourth golf ball
// lands in the road (he reviews it like an engine), the first sight of Hedgeworth (Thrift talking to the grass, shouting the
// player off it; Peony glimpsed on the clubhouse terrace; something under the fairway that Thrift stands in front of) and
// Frank at noon, keeping the ball. Nobody says whose garden it is. Notes: docs/design/gnome-theft-auto/direction/scenes/
// m29-the-kicked-board-{intro,mid,outro}.md
import type { SceneScript, Step, Vec2 } from '../../script';
import { beat, coverage, cut, pushIn, reaction, shot } from '../../direct';
import { markOf, spot, up } from './kit';

const SIGN = 'frank-sign-road';
const FAIR = 'hedgeworth-ninth-fairway';

// ---- Stage marks ------------------------------------------------------------------------------------------------------
const SIGN_FRANK = markOf(SIGN, 'frank');
const SIGN_PLAYER = markOf(SIGN, 'player');
const FAIR_THRIFT = markOf(FAIR, 'thrift');
const FAIR_PLAYER = markOf(FAIR, 'player');
/** Where the golf ball lands in Route South (the middle of the highway, north of the sign's reach). */
const ROAD: Vec2 = [-2.5, 263.6];
/** Dame Peony on the clubhouse terrace (golf/types.ts PEOPLE_SPOTS.peony): the real one stands there; this is only a long shot. */
const TERRACE: Vec2 = [-1060, 462];
/** The molehill under the fairway beside Thrift. */
const HILL: Vec2 = [-1031.8, 641.6];
/** The bucket at the foot of Frank's sign, where the balls go. */
const BUCKET: Vec2 = [-9.9, 262.2];

/** A ball falling out of the sky onto `at` and bouncing twice: discrete drops, no physics (the spawn step moves a prop). */
function ballDrop(id: string, at: Vec2, from: number): Step[] {
  const h = (y: number) => up(at[0], at[1], y);
  return [
    { do: 'spawn', id, at: h(from), yaw: 0 },
    { do: 'wait', s: 0.12 },
    { do: 'spawn', id, at: h(from * 0.55) },
    { do: 'wait', s: 0.1 },
    { do: 'spawn', id, at: h(from * 0.2) },
    { do: 'wait', s: 0.08 },
    { do: 'spawn', id, at: h(0.11) },
    { do: 'sfx', id: 'tap', at: h(0.11), gain: 0.7, async: true },
    { do: 'wait', s: 0.16 },
    { do: 'spawn', id, at: h(0.7) },
    { do: 'wait', s: 0.16 },
    { do: 'spawn', id, at: h(0.11) },
    { do: 'sfx', id: 'tap', at: h(0.11), gain: 0.45, async: true },
    { do: 'wait', s: 0.12 },
    { do: 'spawn', id, at: h(0.28) },
    { do: 'wait', s: 0.12 },
    { do: 'spawn', id, at: h(0.11) },
    { do: 'sfx', id: 'tap', at: h(0.11), gain: 0.25, async: true },
  ];
}

// ---- 1. Intro: Frank's sign at dawn -----------------------------------------------------------------------------------
const ROADSIDE = coverage('frank', 'player', -1);

/**
 * Dawn on Route South. A golf ball hits the empty road from a long way off; Frank, who has not moved, reviews it the way he
 * reviews engines. He does not know who is hitting them and says they hit like a clock. The loose board is named, the sign that
 * says no, and the second ball lands on top of the first (his tic, as a compliment).
 */
export const M29_INTRO: SceneScript = {
  id: 'm29-the-kicked-board-intro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'warm',
  ambience: 'wind',
  radio: 0.1,
  title: 'The Kicked Board',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m29-the-kicked-board-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, at: SIGN_PLAYER.at, yaw: SIGN_PLAYER.yaw },
    { id: 'frank', preset: 'frank', held: null, at: SIGN_FRANK.at, yaw: SIGN_FRANK.yaw },
  ],
  props: [
    { id: 'ball-a', prefab: 'golf-ball', at: up(ROAD[0], ROAD[1], 9), size: 0.22, hidden: true },
    { id: 'ball-b', prefab: 'golf-ball', at: up(ROAD[0] + 0.05, ROAD[1], 9), size: 0.22, hidden: true },
  ],
  steps: [
    // 1. Hook: ground level on the empty road, a hiss from the sky, a tock. The picture is the first line.
    cut(spot(SIGN, 'road-low')),
    { do: 'sfx', id: 'whoosh', gain: 0.3, async: true },
    ...ballDrop('ball-a', ROAD, 9),
    { do: 'wait', s: 0.8 },
    // 2. Frank has not moved. He says the number.
    cut(ROADSIDE.single('frank', 'mcu')),
    { do: 'say', who: 'frank', text: 'Fourth since sunrise.' },
    cut(shot('frank', 'ms', { toward: 'player', side: -35 })),
    { do: 'sfx', id: 'cloth', at: 'frank', gain: 0.35, async: true },
    { do: 'say', who: 'frank', text: 'Two-piece. Soft cover. Expensive. ...Nice.' },
    // 3. Setup: where from.
    cut(ROADSIDE.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Where are they coming from?' },
    cut(ROADSIDE.single('frank', 'mcu')),
    { do: 'say', who: 'frank', text: 'Over the fence. West, past Tallgrass Commons.' },
    cut(shot('frank', 'ms', { toward: 'player', side: -35, height: 'low' })),
    { do: 'say', who: 'frank', text: 'Same angle. Same gap. Nobody golfs like a clock.' },
    cut(ROADSIDE.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Why not go and look?' },
    // 4. Turn: why it is the player and not him, and the loose board.
    cut(ROADSIDE.single('frank', 'mcu')),
    { do: 'say', who: 'frank', text: 'I stay at my sign. That is the arrangement.' },
    cut(pushIn('frank', 'mcu', 3.4, { toward: 'player', side: -26 })),
    { do: 'say', who: 'frank', text: 'A board is loose in that fence. A sign says no. It is wrong.' },
    ...reaction('player', { toward: 'frank', side: 25, gesture: 'nod', hold: 'pause' }),
    { do: 'say', who: 'player', text: 'I will find it.' },
    // 5. Button: a second ball lands on the first. Frank approves of the shot.
    cut(spot(SIGN, 'road-low')),
    ...ballDrop('ball-b', [ROAD[0] + 0.05, ROAD[1]], 10),
    { do: 'wait', s: 0.4 },
    cut(ROADSIDE.single('frank', 'mcu')),
    { do: 'say', who: 'frank', text: '...Nice.' },
    beat('pause'),
  ],
};

// ---- 2. Mid: the first sight of Hedgeworth ----------------------------------------------------------------------------
const GRASS = coverage('thrift', 'player', 1);

/**
 * Inside the Kicked Board. A hush of mown grass, a sprinkler, a groundskeeper on his knees murmuring to the fairway; the
 * player steps onto it and he shouts them off. Dame Peony is glimpsed on the terrace, a long way off, with a driver for a
 * cane. A molehill pops up beside Thrift and ducks back, and he stands in front of the place it was. He does not say what. The
 * player runs. Thrift's intro card follows his first line.
 */
export const M29_MID: SceneScript = {
  id: 'm29-the-kicked-board-mid',
  stage: { kind: 'world' },
  sky: 'noon',
  ambience: 'garden',
  radio: 0.08,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m29-the-kicked-board-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, held: null, at: FAIR_PLAYER.at, yaw: FAIR_PLAYER.yaw },
    { id: 'thrift', preset: 'thrift', at: FAIR_THRIFT.at, yaw: FAIR_THRIFT.yaw },
  ],
  props: [{ id: 'hill', prefab: 'mole-hill', at: up(HILL[0], HILL[1], 0), size: 0.7, hidden: true }],
  steps: [
    // 1. Hook: ground level through the blades, a sprinkler, a man's voice that is not for people.
    cut(spot(FAIR, 'fairway-low')),
    { do: 'sfx', id: 'rustle', gain: 0.35, async: true },
    { do: 'wait', s: 1.3 },
    cut(GRASS.single('thrift', 'mcu')),
    { do: 'say', who: 'thrift', text: 'Morning, my dear. Nobody will walk on you today.' },
    { do: 'intro', who: 'thrift' },
    // 2. The player steps onto the stripes; the sound is the crime.
    { do: 'walk', who: 'player', path: [[-1026, 638.4]], speed: 1.6, async: true },
    { do: 'sfx', id: 'crunch', at: 'player', gain: 0.5, async: true },
    cut(GRASS.single('player', 'ms')),
    { do: 'wait', s: 1.5 },
    // 3. The shout: he turns, he stomps.
    { do: 'face', who: 'thrift', at: 'player', s: 0.3, async: true },
    { do: 'gesture', who: 'thrift', name: 'stomp', s: 0.9, async: true },
    cut(shot('thrift', 'mcu', { toward: 'player', side: 25, height: 'low' })),
    { do: 'say', who: 'thrift', text: 'OFF! Off the damp!' },
    cut(GRASS.single('player', 'mcu')),
    { do: 'say', who: 'player', text: "It's grass." },
    cut(GRASS.single('thrift', 'mcu')),
    { do: 'say', who: 'thrift', text: 'It is a fairway. It has a tee time.' },
    // 4. The glimpse: a long lens on the clubhouse terrace, a driver for a cane, one small figure. No line.
    { do: 'cam', shot: { kind: 'cut', pos: up(-1022, 636, 1.5), look: up(TERRACE[0], TERRACE[1], 1.4), fov: 14 } },
    { do: 'sfx', id: 'bell', gain: 0.18, async: true },
    { do: 'wait', s: 2.4 },
    // 5. What he stands in front of: a molehill that rises, looks, and ducks.
    { do: 'cam', shot: { kind: 'cut', pos: up(-1029.2, 638.4, 0.45), look: up(HILL[0], HILL[1], 0.25), fov: 34 } },
    { do: 'spawn', id: 'hill' },
    { do: 'sfx', id: 'shovel', at: up(HILL[0], HILL[1], 0.2), gain: 0.35, async: true },
    { do: 'wait', s: 0.9 },
    { do: 'despawn', id: 'hill' },
    { do: 'sfx', id: 'squeak', at: up(HILL[0], HILL[1], 0.2), gain: 0.4, async: true },
    cut(GRASS.single('thrift', 'ms')),
    { do: 'say', who: 'thrift', text: 'Nothing under there. Nobody lives under there. Off.' },
    // 6. Button: the player runs for the board; his last shout follows them.
    { do: 'walk', who: 'player', path: [[-1016, 637.6], [-1005, 639]], speed: 4.2, run: true, async: true },
    cut(GRASS.single('thrift', 'mcu', { height: 'low' })),
    { do: 'say', who: 'thrift', text: 'And mind the edges!' },
    cut(spot(FAIR, 'board-wide')),
    { do: 'wait', s: 1.4 },
  ],
};

// ---- 3. Outro: Frank keeps the ball (day) -----------------------------------------------------------------------------
const OUTRO_TALK = coverage('frank', 'player', 1);

/**
 * Back at the sign at noon. Frank hears the engine before the player arrives and names what the hedge did to the grille. He
 * says the thing about golf and tea, and keeps the ball. A last tock, a long way west, closes it. His intro card was given
 * at the diner, so there is none here.
 */
export const M29_OUTRO: SceneScript = {
  id: 'm29-the-kicked-board-outro',
  stage: { kind: 'world' },
  sky: 'noon',
  music: 'turfton',
  ambience: 'wind',
  radio: 0.1,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m29-the-kicked-board-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, at: SIGN_PLAYER.at, yaw: SIGN_PLAYER.yaw },
    { id: 'frank', preset: 'frank', held: 'golf-ball', at: SIGN_FRANK.at, yaw: SIGN_FRANK.yaw },
  ],
  steps: [
    // 1. Hook: Frank hears them coming. He is looking at the ball, not the road.
    cut(spot(SIGN, 'sign-wide')),
    { do: 'sfx', id: 'engine-rev', gain: 0.35, async: true },
    { do: 'wait', s: 1.2 },
    cut(OUTRO_TALK.single('frank', 'mcu')),
    { do: 'say', who: 'frank', text: 'Heard you coming back. Hedge in the grille. ...Nice.' },
    // 2. Setup: the report.
    cut(OUTRO_TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: "It's a golf course. Nine holes." },
    cut(OUTRO_TALK.single('frank', 'mcu')),
    { do: 'say', who: 'frank', text: 'Nine. And a man shouted at you about grass.' },
    ...reaction('player', { toward: 'frank', side: -25, gesture: 'nod', hold: 'pause' }),
    // 3. Turn: Frank's one real worry, said flat.
    cut(pushIn('frank', 'mcu', 3.4, { toward: 'player', side: 24 })),
    { do: 'say', who: 'frank', text: 'Golf stops for tea. That did not stop.' },
    cut(OUTRO_TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Should I take the ball back?' },
    // 4. Button: he keeps it. The bucket takes it; far away, west, another tock.
    cut(OUTRO_TALK.single('frank', 'mcu')),
    { do: 'say', who: 'frank', text: 'It landed in my road. It is mine.' },
    { do: 'walk', who: 'frank', path: [[-9.2, 261.4]], speed: 1.1, async: true },
    { do: 'hold', who: 'frank', prop: null },
    { do: 'sfx', id: 'clink', at: up(BUCKET[0], BUCKET[1], 0.4), gain: 0.45, async: true },
    cut(spot(SIGN, 'sign-wide')),
    { do: 'wait', s: 1.4 },
    { do: 'sfx', id: 'thud', gain: 0.18, async: true },
    { do: 'wait', s: 1.5 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm29-the-kicked-board-intro': M29_INTRO,
  'm29-the-kicked-board-mid': M29_MID,
  'm29-the-kicked-board-outro': M29_OUTRO,
};
