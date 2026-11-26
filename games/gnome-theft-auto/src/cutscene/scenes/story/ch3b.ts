// Chapter 3, Frostbite Fells: the raid's payoff at the basin and the Kiln-Resin cure. Re-directed in the Story B
// direction pass (docs/design/gnome-theft-auto/direction/lanes.md); notes in direction/scenes/<id>.md.
// Registered through CH3_SCENES in ch3.ts.
import type { SceneScript } from '../../script';
import { beat, coverage, cut, reaction, shot } from '../../direct';
import { carMark, markOf, rideOf, spot, up } from './kit';

const BASIN = 'birdbath-basin';
const BLOCKADE = 'salt-plow-blockade';
const CAMP = 'theo-camp';

/** Loam's snowmobile at the basin (the rideOf('loam') vehicle, parked by the rim). */
const LOAM_SLED = carMark(BASIN, 'loam-snowmobile');

/**
 * Salvage raid outro: the player arrives on Pip's Zero-Turn at the Frozen Birdbath Basin, with Pip
 * in the passenger seat, one arm short. Father Loam takes them in; the night is safe, and tomorrow is promised.
 */
export const SALVAGE_RAID_OUTRO: SceneScript = {
  id: 'salvage-raid-outro',
  stage: { kind: 'world' },
  ambience: 'wind',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/salvage-raid-outro.md' },
  actors: [
    { id: 'player', player: true, seatedIn: 'ride', at: [6, -333] },
    { id: 'pip', preset: 'pip', seatedIn: 'ride', seat: 1, armless: true, at: [6, -333] },
    { id: 'loam', preset: 'loam', held: null, ...markOf(BASIN, 'loam') },
  ],
  vehicles: [
    { id: 'ride', kind: 'zero-turn', from: 'player', at: [30, -300], yaw: -2.5 },
    { id: 'loam-ride', ...rideOf('loam'), at: LOAM_SLED.at, yaw: LOAM_SLED.yaw },
  ],
  steps: [
    // The hook: the Zero-Turn slides in off the north highway. No music yet, just wind.
    { do: 'cam', shot: { kind: 'track', pos: up(46, -318, 2.2), who: 'ride', fov: 50 } },
    { do: 'drive', vehicle: 'ride', path: [[30, -300], [30, -318], [16, -330], [7, -333]], speed: 8 },
    { do: 'sfx', id: 'skid', at: 'ride' },
    { do: 'exit', who: 'pip', s: 1.2 },
    { do: 'exit', who: 'player', s: 1.2 },
    // Pip denies it; the player says what happened; Pip checks his shoulder and loses the argument.
    ...denialBeat(),
  ],
};

/** The raid outro's denial beat (kept as its own function so the scene reads in order above). */
function denialBeat(): SceneScript['steps'] {
  const T = coverage('player', 'pip', 1);
  return [
    { do: 'face', who: 'player', at: 'pip', s: 0.3, async: true },
    { do: 'face', who: 'pip', at: 'player', s: 0.3 },
    cut(T.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Hairline fracture. Barely a chip.' },
    cut(T.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Pip. It came off.' },
    ...reaction('pip', { toward: 'player', gesture: 'clutch', size: 'mcu', side: -25 }),
    { do: 'say', who: 'pip', text: '...Hairline.' },
    // Father Loam walks over from his snowmobile and the frost bells come in on his first line.
    { do: 'sfx', id: 'crunch', at: 'loam', gain: 0.5, async: true },
    { do: 'walk', who: 'loam', path: [[0, -338]], speed: 1.4 },
    { do: 'music', track: 'frost', fade: 1.5 },
    ...loamScene(),
  ];
}

/** Loam takes them in, then Pip sits on the bench and asks the only question that matters. */
function loamScene(): SceneScript['steps'] {
  const L = coverage('loam', 'pip', 1);
  return [
    cut(L.single('loam', 'ms')),
    { do: 'say', who: 'loam', text: 'I\'m Father Loam. Another cracked pilgrim. Sit by the stove, my child.' },
    { do: 'face', who: 'pip', at: 'loam', s: 0.3, async: true },
    cut(L.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: "I'm not cracked. I'm ventilated." },
    cut(L.single('loam', 'ms')),
    { do: 'say', who: 'loam', text: 'The Chapel threw me out for preaching on a snowmobile. The Kiln keeps no grudges.' },
    // The button: Pip sits down by the Zero-Turn, quiet for once, and asks.
    { do: 'sfx', id: 'creak', at: 'pip', gain: 0.5, async: true },
    { do: 'gesture', who: 'pip', name: 'sit', s: 1.0 },
    { do: 'face', who: 'pip', at: 'loam', s: 0.3 },
    cut(L.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Does the Kiln do arms?' },
    beat('beat'),
    cut(L.single('loam', 'ms')),
    { do: 'say', who: 'loam', text: 'Tomorrow.' },
    beat('pause'),
    { do: 'fade', to: 1, s: 1.2 },
  ];
}

/**
 * Kiln-Resin: Loam needs fresh resin from the northern shrine to cure Pip's arm. The shrine, the plows that block the
 * road, then the wait by the basin. The scene only sets the job up; the derby is played out by the player.
 */
export const KILN_RESIN_INTRO: SceneScript = {
  id: 'kiln-resin-intro',
  stage: { kind: 'world' },
  music: 'frost',
  ambience: 'wind',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/kiln-resin-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, ...markOf(BASIN, 'player') },
    { id: 'loam', preset: 'loam', held: 'clay-jar', ...markOf(BASIN, 'loam') },
    { id: 'pip', preset: 'pip', armless: true, ...markOf(BASIN, 'pip') },
    { id: 'plow1', name: 'HOA Plow Driver', look: { hat: 0x18181e, shirt: 0xc9b99b }, ...markOf(BLOCKADE, 'salt-plow-driver', 0) },
    { id: 'plow2', name: 'HOA Plow Driver', look: { hat: 0x18181e, shirt: 0xc9b99b }, ...markOf(BLOCKADE, 'salt-plow-driver', 1) },
  ],
  vehicles: [
    { id: 'plow-1', ...carMark(BLOCKADE, 'salt-plow-1') },
    { id: 'plow-2', ...carMark(BLOCKADE, 'salt-plow-2') },
  ],
  steps: [
    { do: 'gesture', who: 'pip', name: 'sit', s: 0.8, async: true },
    // The hook: the jar is upended over the stove, close on Loam.
    ...hook(),
    // Pip on the bench, Loam at the rim: one side of their line.
    ...arrangeBasin(),
  ],
};

function hook(): SceneScript['steps'] {
  const L = coverage('loam', 'pip', 1);
  return [
    // The Previously: the basin at dusk, Pip shivering on his bench, one sleeve empty.
    cut(spot(BASIN, 'wide')),
    { do: 'sfx', id: 'cloth', at: 'pip', gain: 0.5, async: true },
    { do: 'gesture', who: 'pip', name: 'flinch', s: 1.2, async: true },
    beat('pause'),
    cut(L.single('loam', 'mcu')),
    { do: 'say', who: 'loam', text: 'The shop, the Acorn, the arm. The Kiln takes in threes.' },
    { do: 'intro', who: 'loam', s: 2.8 },
    // Pip, small on the bench, takes it in.
    ...reaction('pip', { toward: 'loam', gesture: 'flinch', size: 'mcu', hold: 'pause' }),
    // The empty jar: upended over the stove.
    cut(L.single('loam', 'mcu')),
    { do: 'sfx', id: 'knock', at: 'loam' },
    { do: 'gesture', who: 'loam', name: 'lean', s: 1.0, async: true },
    { do: 'say', who: 'loam', text: 'And the jar is empty. The Kiln is not a patient god.' },
    cut(L.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'How empty? A-little-bit empty?' },
    cut(L.single('loam', 'mcu')),
    { do: 'sfx', id: 'knock', at: 'loam' },
    { do: 'gesture', who: 'loam', name: 'lean', s: 1.0, async: true },
    beat('pause'),
    cut(L.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: "Okay. Very empty. I'm not shivering. These are my regular teeth." },
  ];
}

function arrangeBasin(): SceneScript['steps'] {
  const L = coverage('loam', 'pip', 1);
  const M = shot('loam', 'mcu', { toward: 'player' });
  const P = coverage('plow1', 'plow2', 1);
  return [
    // Loam sends the player up the highway.
    cut(M),
    { do: 'say', who: 'loam', text: 'The northern shrine weeps fresh resin. Up the highway, past the bend.' },
    ...reaction('player', { toward: 'loam', size: 'mcu', hold: 'pause' }),
    // The blockade: a wide, then the two plow drivers.
    { do: 'music', track: 'tension', fade: 0.3 },
    cut(spot(BLOCKADE, 'wide')),
    { do: 'sfx', id: 'engine-rev', at: 'plow-1' },
    beat('pause'),
    cut(P.single('plow1', 'ms', { height: 'low' })),
    { do: 'say', who: 'plow1', text: "Highway's closed. Salt in progress. HOA orders." },
    ...reaction('plow2', { toward: 'plow1', gesture: 'crossArms', size: 'mcu', side: -25, hold: 'pause' }),
    // Back at the basin.
    { do: 'music', track: 'frost', fade: 0.5 },
    cut(spot(BASIN, 'wide')),
    beat('pause'),
    cut(L.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'They are salting the ice. Who salts ice?' },
    cut(L.single('loam', 'mcu')),
    { do: 'say', who: 'loam', text: 'Men who are afraid to skid.' },
    // The job, to the player, then the button.
    cut(M),
    { do: 'say', who: 'loam', text: 'Bring me the resin. Then hold the basin while it sets.' },
    cut(L.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: "Ninety seconds? I've glued a hat in less. Warmer, though." },
    ...reaction('player', { toward: 'pip', gesture: 'nod', size: 'mcu', hold: 'pause' }),
    { do: 'walk', who: 'player', path: [[1, -336]], speed: 1.2 },
  ];
}

/**
 * Kiln-Resin outro (night): Thermos Theo's barrel on the north highway. Pip's resin arm is done: a sincere beat (no
 * jokes until Pip is coping), then Shelldon's snail brings Tansy's scroll (the Combine is built in parts, out at the
 * edges; the crew must find friends there), and a plow's headlamps sweep past the bend: the road north is next.
 */
const PT = coverage('pip', 'player', 1);

export const KILN_RESIN_OUTRO: SceneScript = {
  id: 'kiln-resin-outro',
  stage: { kind: 'world' },
  music: 'warm',
  ambience: 'wind',
  sky: 'night',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/kiln-resin-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, ...markOf(CAMP, 'player') },
    { id: 'theo', preset: 'thermos theo', ...markOf(CAMP, 'theo') },
    { id: 'pip', preset: 'pip', at: [48, -349], yaw: -Math.PI / 2 },
  ],
  vehicles: [
    // L95: an HOA plow on the ring road, headlamps sweeping the bend, slowing and not stopping. Theo's camp is known.
    { id: 'plow', ...carMark(BLOCKADE, 'salt-plow-1'), at: [118, -296], yaw: -2.1, headlights: true, hidden: true },
  ],
  props: [
    { id: 'snail', prefab: 'riding-snail', at: [36, -333], yaw: 0.5, size: 0.6, by: 'h', hidden: true },
    { id: 'lamp', prefab: 'torch', at: [41.5, -347], yaw: 0, size: 1.2, by: 'h' },
  ],
  steps: [
    // 1. Hook: Theo pours at the barrel, the lamp low and yellow on the snow.
    { do: 'cam', shot: spot(CAMP, 'wide') },
    { do: 'sfx', id: 'pour', at: 'theo', gain: 0.6, async: true },
    { do: 'gesture', who: 'theo', name: 'lean', s: 1.0 },
    { do: 'sfx', id: 'clink', at: 'theo', gain: 0.5, async: true },
    cut(shot('theo', 'mcu', { toward: 'player' })),
    { do: 'say', who: 'theo', text: 'Acorn-broth. Burns the throat, warms the soul.' },
    { do: 'intro', who: 'theo', s: 2.8 },
    // 2. Pip flexes the new arm. No line for a beat.
    cut(shot('pip', 'mcu', { toward: 'player' })),
    { do: 'gesture', who: 'pip', name: 'wave', s: 1.6 },
    beat('pause'),
    // 3. The sincere beat: music out, close singles on one side of the line, one held silence.
    { do: 'music', track: null, fade: 0.6 },
    ...sincere(),
    { do: 'music', track: 'warm', fade: 1.5 },
    // 4. The snail-mail: the scroll, and the note as the scene's only caption.
    { do: 'spawn', id: 'snail' },
    { do: 'stinger', id: 'mystery' },
    { do: 'sfx', id: 'bell', at: 'snail', gain: 0.4, async: true },
    cut({ kind: 'cut', pos: up(33, -329, 1.2), look: 'snail', fov: 44 }),
    beat('pause'),
    cut(shot('theo', 'mcu', { toward: 'player', side: -25 })),
    { do: 'say', who: 'theo', text: "Post's here. Shelldon's best, and slowest." },
    { do: 'hold', who: 'theo', prop: 'rolled-scroll' },
    { do: 'sfx', id: 'paper', at: 'theo', gain: 0.6, async: true },
    { do: 'give', from: 'theo', to: 'player', prop: 'rolled-scroll', s: 1.2 },
    cut(shot('player', 'mcu', { toward: 'theo' })),
    { do: 'caption', text: 'Vesper builds the Combine in parts, out at the edges. Find friends there. - T.' },
    beat('pause'),
    beat('pause'),
    beat('pause'),
    { do: 'caption', text: null },
    // 5. Pip reads it aloud and takes it badly, then well.
    cut(PT.single('pip', 'ms')),
    { do: 'say', who: 'pip', text: "'Parts. Out at the edges. Find friends there.' Friends. Out there." },
    { do: 'gesture', who: 'pip', name: 'shrug', s: 1.0, async: true },
    cut(PT.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'We have Theo.' },
    cut(shot('theo', 'mcu', { toward: 'player', side: -25 })),
    { do: 'say', who: 'theo', text: 'You have a barrel. Which is more than most.' },
    // 6. The turn: headlamps sweep the bend. The plows know where the camp is.
    { do: 'spawn', id: 'plow' },
    { do: 'sfx', id: 'engine-rev', at: 'plow', gain: 0.35, async: true },
    { do: 'drive', vehicle: 'plow', path: [[118, -296], [88, -314], [70, -318]], speed: 7, arrive: false, async: true },
    { do: 'stinger', id: 'danger' },
    cut({ kind: 'cut', pos: up(52, -330, 1.3), look: up(92, -312, 1.2), fov: 46 }),
    beat('pause'),
    cut(shot('theo', 'mcu', { toward: 'player', side: -25 })),
    { do: 'face', who: 'theo', at: [0, -420], s: 0.5, async: true },
    { do: 'say', who: 'theo', text: "They know my bend. Not safe past morning. North's the road, up Snowcap Rise." },
    // 7. Button: Pip, steadier, flexing the glued fingers at the dark.
    cut(PT.single('pip', 'ms')),
    { do: 'gesture', who: 'pip', name: 'cheer', s: 1.0, async: true },
    { do: 'say', who: 'pip', text: "North, then. I'll bring the arm. It's the warmest thing I own." },
    beat('pause'),
  ],
};

/** Pip and the player: 'It holds.' and the nod, shot on one side of their line. */
function sincere(): SceneScript['steps'] {
  const T = coverage('pip', 'player', 1);
  return [
    cut(T.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'It holds.' },
    beat('beat'),
    { do: 'say', who: 'pip', text: "You didn't leave me on the apron." },
    cut(T.single('player', 'mcu')),
    { do: 'say', who: 'player', text: "Wasn't going to." },
    ...reaction('pip', { toward: 'player', gesture: 'nod', size: 'mcu', side: 25, hold: 'silence' }),
  ];
}

export const CH3B_SCENES: Record<string, SceneScript> = {
  'salvage-raid-outro': SALVAGE_RAID_OUTRO,
  'kiln-resin-intro': KILN_RESIN_INTRO,
  'kiln-resin-outro': KILN_RESIN_OUTRO,
};
