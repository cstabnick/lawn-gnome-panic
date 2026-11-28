// Story row 48 (m48-the-groundskeepers-secret): The Groundskeeper's Secret. Three scenes on the ninth green. The intro (dusk):
// Thrift Hosepipe talks to the grass and the grass seems to answer (molehills that pop up on cue: the comedy), then admits a
// mole family lives under his ninth and Basil is coming with traps. The mid scene (dusk, the inspect step's reveal): Basil
// arrives in a golf cart with a sack of traps, "where are the pests"; Thrift has the player show him the sprinkler and the
// ball, the sprinkler pops, and Nubbin rolls the ball out of the spray exactly as in the final. The outro (night): Basil
// kneels on the ninth with a hand on Nubbin's back, and points down to Loamdeep. The outro is sincere: no gag on top.
// Only in the scenes: the cart-load of mole traps Basil puts down, the sprinkler that comes up on time, the garden lamp.
// Notes: docs/design/gnome-theft-auto/direction/scenes/m48-the-groundskeepers-secret-{intro,mid,outro}.md
import type { SceneScript, Step, Vec2 } from '../../script';
import { beat, coverage, cut, pushIn, reaction, shot } from '../../direct';
import { markOf, pathOf, spot, up } from './kit';

const NINTH = 'hedgeworth-ninth-green';

// ---- Stage marks ------------------------------------------------------------------------------------------------------
const N_THRIFT = markOf(NINTH, 'thrift');
const N_PLAYER = markOf(NINTH, 'player');
const N_NUBBIN = markOf(NINTH, 'nubbin');
const N_BASIL = markOf(NINTH, 'basil');
/** The three molehills the grass answers from (all within a long stride of Thrift). */
const HILLS: Vec2[] = [[-1072.2, 637.2], [-1068.8, 630.4], [-1074.4, 633.4]];
/** The sprinkler head by the cup, the ball beside it, and the cup (the pin): see the quest's inspect points. */
const HEAD: Vec2 = [-1063.5, 639.4];
const PIN: Vec2 = [-1062, 642];
const BALL_AT: Vec2 = [-1062.9, 640.5];

/** A mole pops out of hill `n` and ducks (the grass's answer): the hill stays, the mole is a prop that appears and goes. */
function pop(n: number, hold = 0.8): Step[] {
  const h = HILLS[n];
  return [
    { do: 'spawn', id: `hill-${n}`, at: up(h[0], h[1], 0) },
    { do: 'spawn', id: `mole-${n}`, at: up(h[0], h[1], 0.22) },
    { do: 'sfx', id: 'squeak', at: up(h[0], h[1], 0.2), gain: 0.4, async: true },
    { do: 'wait', s: hold },
    { do: 'despawn', id: `mole-${n}` },
  ];
}

// ---- 1. Intro: Thrift talks to the grass (dusk) -------------------------------------------------------------------------
const GRASS = coverage('thrift', 'player', 1);
const HILL_PROPS: SceneScript['props'] = [
  ...HILLS.flatMap((h, n) => [
    { id: `hill-${n}`, prefab: 'mole-hill', at: up(h[0], h[1], 0) as [number, number, number], size: 0.7, hidden: true },
    { id: `mole-${n}`, prefab: 'mole', at: up(h[0], h[1], 0.22) as [number, number, number], size: 0.5, hidden: true },
  ]),
];

/**
 * Dusk on the ninth. Thrift on one knee, murmuring to the turf in the voice he does not use on people; molehills pop up as
 * if the grass were replying. He says the ninth "has opinions", and the grass says the player walks loud. Then he turns
 * serious: a mole family, a year under his green, and Basil is coming with traps. The player is to drive them to the shed,
 * slowly, because they are shy of engines. Thrift's intro card was given in The Kicked Board, so none here.
 */
export const M48_INTRO: SceneScript = {
  id: 'm48-the-groundskeepers-secret-intro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'warm',
  ambience: 'garden',
  radio: 0.08,
  title: "The Groundskeeper's Secret",
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m48-the-groundskeepers-secret-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, held: null, at: N_PLAYER.at, yaw: N_PLAYER.yaw },
    { id: 'thrift', preset: 'thrift', at: N_THRIFT.at, yaw: N_THRIFT.yaw },
  ],
  props: HILL_PROPS,
  steps: [
    // 1. Hook: ground level through the fringe at dusk; a sprinkler's tick; a gruff voice for grass.
    cut(spot(NINTH, 'ninth-low')),
    { do: 'sfx', id: 'rustle', gain: 0.35, async: true },
    { do: 'gesture', who: 'thrift', name: 'water', s: 3, async: true },
    { do: 'wait', s: 1.2 },
    cut(GRASS.single('thrift', 'mcu', { height: 'low' })),
    { do: 'say', who: 'thrift', text: 'Evening, my dear. Are you comfortable?' },
    // The grass replies.
    cut({ kind: 'cut', pos: up(-1066.4, 634.2, 0.5), look: up(HILLS[0][0], HILLS[0][1], 0.25), fov: 34 }),
    ...pop(0, 0.9),
    cut(GRASS.single('thrift', 'mcu')),
    { do: 'say', who: 'thrift', text: 'Good. Good. Mind your roots.' },
    // 2. Setup: the player asks the obvious question.
    cut(GRASS.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Who are you talking to?' },
    { do: 'face', who: 'thrift', at: 'player', s: 0.5, async: true },
    cut(GRASS.single('thrift', 'ms')),
    { do: 'say', who: 'thrift', text: 'The ninth. She has opinions.' },
    cut({ kind: 'cut', pos: up(-1071.4, 631.6, 0.5), look: up(HILLS[1][0], HILLS[1][1], 0.25), fov: 34 }),
    ...pop(1, 0.8),
    cut(shot('thrift', 'mcu', { toward: 'player', side: 25, height: 'low' })),
    { do: 'say', who: 'thrift', text: 'She says you walk loud.' },
    cut(GRASS.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'The grass answers you?' },
    cut(GRASS.single('thrift', 'mcu')),
    { do: 'say', who: 'thrift', text: 'Only those who ask nicely.' },
    // 3. The turn: three hills in a row like a wave, and then he stops joking.
    cut(spot(NINTH, 'ninth-wide')),
    { do: 'spawn', id: 'hill-0' },
    ...pop(0, 0.35),
    ...pop(2, 0.35),
    ...pop(1, 0.6),
    { do: 'gesture', who: 'thrift', name: 'beckon', s: 1.0, async: true },
    cut(pushIn('thrift', 'mcu', 3.4, { toward: 'player', side: 25 })),
    { do: 'say', who: 'thrift', text: 'There. You saw. A family, under my ninth, a year now.' },
    cut(GRASS.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Basil hates moles.' },
    cut(GRASS.single('thrift', 'mcu')),
    { do: 'say', who: 'thrift', text: 'He is coming with a trap-line. Drive them to my shed, gently.' },
    { do: 'say', who: 'thrift', text: 'They are shy of engines.' },
    // 4. Button: all three pop at once and look at the player; the sprinkler ticks on.
    cut(spot(NINTH, 'ninth-wide')),
    ...[0, 1, 2].flatMap((n): Step[] => [
      { do: 'spawn', id: `mole-${n}`, at: up(HILLS[n][0], HILLS[n][1], 0.22) },
    ]),
    { do: 'sfx', id: 'squeak', gain: 0.45, async: true },
    { do: 'wait', s: 1.0 },
    ...[0, 1, 2].map((n): Step => ({ do: 'despawn', id: `mole-${n}` })),
    { do: 'sfx', id: 'squirt', gain: 0.25, async: true },
    { do: 'wait', s: 1.2 },
  ],
};

// ---- 2. Mid: Basil arrives; the sprinkler and the ball (dusk) ------------------------------------------------------------
const FACE = coverage('basil', 'thrift', 1);
const REVEAL = coverage('basil', 'player', -1);
const CART_PATH = pathOf(NINTH, 'cart-arrival');
const CART_PARK = markOf(NINTH, 'basil');
const CART_AT = CART_PATH[CART_PATH.length - 1];

/**
 * The reveal. Basil's cart comes down the cart path with a sack of mole traps on the back seat. He asks Thrift where the pests
 * are; Thrift stands in front of the green and says there is only a ninth. Basil says a mole ruined his final. The player
 * puts the ball by the sprinkler head, the head pops up, and Nubbin bolts out of the hill and rolls the ball a hand out of
 * the spray, exactly as he did in the final. Basil watches it. He puts the sack down and asks for a minute.
 */
export const M48_MID: SceneScript = {
  id: 'm48-the-groundskeepers-secret-mid',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'tension',
  ambience: 'garden',
  radio: 0.06,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m48-the-groundskeepers-secret-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, held: 'golf-ball', at: [-1058.2, 641.4], yaw: -Math.PI / 2 },
    { id: 'thrift', preset: 'thrift', at: [-1060.6, 636.6], yaw: Math.PI / 2 },
    { id: 'nubbin', preset: 'nubbin', hidden: true, at: [-1057.4, 644.6], yaw: -Math.PI / 2 },
    { id: 'basil', preset: 'basil', held: null, seatedIn: 'basil-cart', at: CART_AT, yaw: 0 },
  ],
  vehicles: [{ id: 'basil-cart', kind: 'golf-cart', at: CART_PATH[0], yaw: Math.atan2(CART_PATH[1][0] - CART_PATH[0][0], CART_PATH[1][1] - CART_PATH[0][1]) }],
  props: [
    { id: 'head', prefab: 'sprinkler-head', at: up(HEAD[0], HEAD[1], 0), size: 0.6, hidden: true },
    { id: 'ball', prefab: 'golf-ball', at: up(BALL_AT[0], BALL_AT[1], 0.1), size: 0.18, hidden: true },
    { id: 'trap-a', prefab: 'mole-trap', at: up(-1053.8, 640.4, 0), size: 0.9, hidden: true },
    { id: 'trap-b', prefab: 'mole-trap', at: up(-1054.4, 642.6, 0), size: 0.9, hidden: true },
  ],
  steps: [
    // 1. Hook: the cart, a long way off, coming nearer; the engine is the first sound.
    cut(spot(NINTH, 'cart-in')),
    { do: 'sfx', id: 'engine-rev', gain: 0.3, async: true },
    { do: 'drive', vehicle: 'basil-cart', path: [...CART_PATH.slice(1)], speed: 6, arrive: true, async: true },
    { do: 'wait', s: 2.4 },
    cut({ kind: 'track', pos: up(-1048, 654, 1.6), who: 'basil-cart', fov: 46 }),
    { do: 'wait', s: 1.6 },
    { do: 'exit', who: 'basil' },
    { do: 'walk', who: 'basil', path: [CART_PARK.at], speed: 1.8, async: true },
    // 2. Setup: the smell of fur, and Thrift in the way.
    { do: 'face', who: 'thrift', at: 'basil', s: 0.4, async: true },
    cut(FACE.single('basil', 'mcu', { height: 'low' })),
    { do: 'say', who: 'basil', text: 'Where are the pests, Thrift? I can smell fur. As they say.' },
    cut(FACE.single('thrift', 'ms')),
    { do: 'say', who: 'thrift', text: 'No pests, Basil. Only a ninth green.' },
    cut(FACE.single('basil', 'mcu')),
    { do: 'say', who: 'basil', text: 'A mole ruined my final. I shall have that mole.' },
    // 3. Turn: the player puts the ball down, Thrift sets the cue.
    { do: 'face', who: 'thrift', at: 'player', s: 0.4, async: true },
    cut(shot('thrift', 'mcu', { toward: 'player', side: 25 })),
    { do: 'say', who: 'thrift', text: 'Show him, my dear. The head, then the ball.' },
    { do: 'walk', who: 'player', path: [[-1061.4, 640.6]], speed: 1.4, async: true },
    { do: 'spawn', id: 'head' },
    { do: 'hold', who: 'player', prop: null },
    { do: 'spawn', id: 'ball' },
    cut(spot(NINTH, 'cup-insert')),
    { do: 'wait', s: 1.4 },
    // The sprinkler comes on at seven. Nubbin has done this before.
    { do: 'sfx', id: 'squirt', at: up(HEAD[0], HEAD[1], 0.2), gain: 0.5, async: true },
    { do: 'shake', amp: 0.02, s: 0.8 },
    { do: 'spawn', id: 'nubbin', at: [-1058.6, 644.2] },
    { do: 'parallel', tracks: [
      [{ do: 'walk', who: 'nubbin', path: [[-1061.4, 641.6]], speed: 4.2, run: true }],
      [{ do: 'wait', s: 0.5 }, { do: 'spawn', id: 'ball', at: up(-1062.4, 640.9, 0.1) }, { do: 'wait', s: 0.18 }, { do: 'spawn', id: 'ball', at: up(-1061.4, 641.6, 0.1) },
        { do: 'wait', s: 0.18 }, { do: 'spawn', id: 'ball', at: up(-1060.2, 642.4, 0.1) }, { do: 'wait', s: 0.16 }, { do: 'spawn', id: 'ball', at: up(-1059.0, 643.2, 0.1) }],
    ] },
    { do: 'sfx', id: 'squeak', at: 'nubbin', gain: 0.4, async: true },
    // 4. The look on his face: a held close-up, then one line.
    cut(REVEAL.single('basil', 'cu')),
    { do: 'wait', s: 1.4 },
    { do: 'say', who: 'basil', text: '...It was in the beam.' },
    cut(FACE.single('thrift', 'mcu')),
    { do: 'say', who: 'thrift', text: 'Every evening at seven, Basil. A stride from the head.' },
    cut(REVEAL.single('basil', 'mcu')),
    { do: 'say', who: 'basil', text: 'He moved it. I called him a thief for a year.' },
    // 5. Button: the sack goes down; he asks for a minute and walks onto the green.
    { do: 'hold', who: 'basil', prop: null },
    { do: 'spawn', id: 'trap-a' },
    { do: 'spawn', id: 'trap-b' },
    { do: 'sfx', id: 'clatter', at: 'basil', gain: 0.4, async: true },
    { do: 'say', who: 'basil', text: 'Leave me a minute, champ.' },
    { do: 'walk', who: 'basil', path: [[-1059.8, 641.8]], speed: 1.7, async: true },
    cut(spot(NINTH, 'ninth-wide')),
    { do: 'wait', s: 1.8 },
  ],
};

// ---- 3. Outro: Basil kneels on the ninth (night) ---------------------------------------------------------------------
const KNEEL = coverage('basil', 'nubbin', 1);
const LOOK = coverage('basil', 'player', -1);

/**
 * Night, and a single garden lamp. Basil is on the ninth green on his knees, alone but for a very small mole. Nubbin says he is
 * sorry about the ball; Basil will not have it; his hand finds Nubbin's back, and neither moves. A held silence. Then Basil
 * points at the turf: their hall is under here, Loamdeep, and the player should go and see it. Thrift, at the shed light,
 * says goodnight to the grass. Sincere: nothing after Nubbin's "most kind" is a joke.
 */
export const M48_OUTRO: SceneScript = {
  id: 'm48-the-groundskeepers-secret-outro',
  stage: { kind: 'world' },
  sky: 'night',
  music: 'turfton-dusk',
  ambience: 'night',
  radio: 0.05,
  direction: {
    notes: 'docs/design/gnome-theft-auto/direction/scenes/m48-the-groundskeepers-secret-outro.md',
    kind: 'outro',
    waive: [{ code: 'crosses-line', why: 'Basil turns from Nubbin to the player to point at the turf, so the axis moves with him' }],
  },
  actors: [
    { id: 'player', player: true, held: null, at: [-1056.4, 645.2], yaw: -Math.PI / 2 },
    { id: 'basil', preset: 'basil', held: null, at: [-1062.6, 641.2], yaw: Math.PI / 2 },
    { id: 'nubbin', preset: 'nubbin', at: [-1061.3, 641.3], yaw: -Math.PI / 2 },
    { id: 'thrift', preset: 'thrift', held: null, at: [-1050.4, 634.6], yaw: -Math.PI / 2 },
  ],
  props: [
    { id: 'lamp', prefab: 'garden-lamp-post', at: up(-1057.6, 646.6, 0) },
    { id: 'ball', prefab: 'golf-ball', at: up(-1061.8, 641.2, 0.1), size: 0.18 },
  ],
  steps: [
    // 1. Hook: the green at night under a single lamp; a sprinkler ticking; a figure kneeling.
    { do: 'gesture', who: 'basil', name: 'sit-ground', s: 22, async: true },
    cut(spot(NINTH, 'night-lamp')),
    { do: 'sfx', id: 'squirt', gain: 0.18, async: true },
    { do: 'wait', s: 2.2 },
    // 2. Setup: Nubbin says his small piece.
    cut(KNEEL.single('nubbin', 'mcu')),
    { do: 'say', who: 'nubbin', text: 'If you please, sir. I am very sorry about your ball.' },
    cut({ kind: 'frame', who: 'basil', size: 'mcu', toward: 'nubbin', side: -60 }),
    { do: 'say', who: 'basil', text: "Don't. ...I called you a thief for a year." },
    // 3. Turn: his hand on the mole's back. The held silence.
    cut({ kind: 'frame', who: 'basil', size: 'cu', height: 'high', toward: 'nubbin', side: 75 }),
    { do: 'gesture', who: 'basil', name: 'clutch', s: 1.2, async: true },
    { do: 'wait', s: 1.6 },
    cut({ kind: 'frame', who: 'nubbin', size: 'mcu', height: 'high', toward: 'basil', side: -40 }),
    beat('silence'),
    { do: 'say', who: 'nubbin', text: 'Most kind.' },
    // 4. Button: Loamdeep, said to the player, with a hand pointed at the turf.
    ...reaction('basil', { toward: 'player', side: 70, hold: 'pause' }),
    cut(LOOK.single('basil', 'mcu')),
    { do: 'gesture', who: 'basil', name: 'point', s: 1.2, async: true },
    { do: 'say', who: 'basil', text: 'Their hall is under here. Loamdeep. Go and see it, champ.' },
    cut(LOOK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'I will.' },
    cut(shot('thrift', 'ms', { toward: 'basil', side: 20 })),
    { do: 'say', who: 'thrift', text: 'Goodnight, my dears.' },
    { do: 'sfx', id: 'squeak', gain: 0.25, async: true },
    cut(spot(NINTH, 'ninth-wide')),
    { do: 'wait', s: 1.8 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm48-the-groundskeepers-secret-intro': M48_INTRO,
  'm48-the-groundskeepers-secret-mid': M48_MID,
  'm48-the-groundskeepers-secret-outro': M48_OUTRO,
};
