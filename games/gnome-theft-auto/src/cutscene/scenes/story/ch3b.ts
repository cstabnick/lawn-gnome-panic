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
    { do: 'say', who: 'loam', text: 'Another cracked pilgrim. Sit by the stove, my child.' },
    { do: 'face', who: 'pip', at: 'loam', s: 0.3, async: true },
    cut(L.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: "I'm not cracked. I'm ventilated." },
    cut(L.single('loam', 'ms')),
    { do: 'say', who: 'loam', text: 'They threw me out for preaching on a snowmobile. The Kiln keeps no grudges.' },
    // The button: Pip sits down by the Zero-Turn, quiet for once, and asks.
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
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/kiln-resin-intro.md' },
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
    cut(L.single('loam', 'mcu')),
    { do: 'sfx', id: 'knock', at: 'loam' },
    { do: 'gesture', who: 'loam', name: 'lean', s: 1.0, async: true },
    { do: 'say', who: 'loam', text: 'The jar is empty, and the Kiln is not a patient god.' },
    cut(L.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'How empty? A-little-bit empty?' },
    cut(L.single('loam', 'mcu')),
    { do: 'sfx', id: 'knock', at: 'loam' },
    { do: 'gesture', who: 'loam', name: 'lean', s: 1.0, async: true },
    beat('pause'),
    cut(L.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Okay. Very empty.' },
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
    { do: 'say', who: 'pip', text: "Ninety seconds? I've glued a hat in less." },
    ...reaction('player', { toward: 'pip', gesture: 'nod', size: 'mcu', hold: 'pause' }),
    { do: 'walk', who: 'player', path: [[1, -336]], speed: 1.2 },
  ];
}

/**
 * Kiln-Resin outro: the scroll from Thermos Theo's barrel at the north highway. Pip's resin arm is done.
 * A sincere beat (no jokes until Pip is coping), then the snail-mail from Tansy.
 */
export const KILN_RESIN_OUTRO: SceneScript = {
  id: 'kiln-resin-outro',
  stage: { kind: 'world' },
  music: 'warm',
  ambience: 'wind',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/kiln-resin-outro.md' },
  actors: [
    { id: 'player', player: true, ...markOf(CAMP, 'player') },
    { id: 'theo', name: 'Thermos Theo', look: { hat: 0x9e3b2a, shirt: 0x4a5a6a, beard: 0xdddddd }, ...markOf(CAMP, 'theo') },
    { id: 'pip', preset: 'pip', at: [48, -349], yaw: -Math.PI / 2 },
  ],
  props: [
    { id: 'snail', prefab: 'riding-snail', at: [36, -333], yaw: 0.5, size: 0.6, by: 'h', hidden: true },
  ],
  steps: [
    // The hook: Theo pours at the barrel.
    { do: 'cam', shot: spot(CAMP, 'wide') },
    { do: 'gesture', who: 'theo', name: 'lean', s: 1.0 },
    cut(shot('theo', 'mcu', { toward: 'player' })),
    { do: 'say', who: 'theo', text: 'Acorn-broth. Burns the throat, warms the soul.' },
    // Pip flexes the new arm. No line for a beat.
    cut(shot('pip', 'mcu', { toward: 'player' })),
    { do: 'gesture', who: 'pip', name: 'wave', s: 1.6 },
    beat('pause'),
    // The sincere beat: music out, close singles on one side of the line, one held silence.
    { do: 'music', track: null, fade: 0.6 },
    ...sincere(),
    { do: 'music', track: 'warm', fade: 1.5 },
    // The snail-mail: the scroll, and the note as the scene's only caption.
    { do: 'spawn', id: 'snail' },
    { do: 'stinger', id: 'mystery' },
    cut({ kind: 'cut', pos: up(33, -329, 1.2), look: 'snail', fov: 44 }),
    beat('pause'),
    cut(shot('theo', 'mcu', { toward: 'player', side: -25 })),
    { do: 'say', who: 'theo', text: "Post's here." },
    { do: 'hold', who: 'theo', prop: 'rolled-scroll' },
    { do: 'give', from: 'theo', to: 'player', prop: 'rolled-scroll', s: 1.2 },
    cut(shot('player', 'mcu', { toward: 'theo' })),
    { do: 'caption', text: 'Found the Stopping Stone. Dust Flats. Bring Pip. Bring snacks. - T.' },
    beat('pause'),
    beat('pause'),
    beat('pause'),
    { do: 'caption', text: null },
    // The button: Pip, coping and proud, reading over the player's shoulder.
    cut(shot('pip', 'ms', { toward: 'player', side: 25 })),
    { do: 'gesture', who: 'pip', name: 'cheer', s: 1.2, async: true },
    { do: 'say', who: 'pip', text: 'She said bring Pip. By name.' },
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
