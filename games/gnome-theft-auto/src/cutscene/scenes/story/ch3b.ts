// Chapter 3, Frostbite Fells: the raid's payoff at the basin and the Kiln-Resin cure. Re-directed in the Story B
// direction pass (docs/design/gnome-theft-auto/direction/lanes.md); notes in direction/scenes/<id>.md.
// Registered through CH3_SCENES in ch3.ts.
import type { SceneScript } from '../../script';
import { beat, coverage, cut, exchangeLooks, reaction, shot } from '../../direct';
import { carMark, markOf, rideOf, spot, up } from './kit';

const BASIN = 'birdbath-basin';

/** Loam's snowmobile at the basin (the rideOf('loam') vehicle, parked by the rim). */
const LOAM_SLED = carMark(BASIN, 'loam-snowmobile');

/**
 * Salvage raid outro: the player arrives on Pip's Zero-Turn at the Frozen Birdbath Basin, with Pip
 * in the passenger seat, one arm short. Father Loam is preaching from his snowmobile.
 */
export const SALVAGE_RAID_OUTRO: SceneScript = {
  id: 'salvage-raid-outro',
  stage: { kind: 'world' },
  music: 'frost',
  ambience: 'wind',
  actors: [
    { id: 'player', player: true, seatedIn: 'ride', at: [6, -333] },
    { id: 'pip', preset: 'pip', seatedIn: 'ride', seat: 1, at: [6, -333] },
    { id: 'loam', preset: 'loam', seatedIn: 'loam-ride', at: LOAM_SLED.at },
  ],
  vehicles: [
    { id: 'ride', kind: 'zero-turn', from: 'player', at: [30, -300], yaw: -2.5 },
    { id: 'loam-ride', ...rideOf('loam'), at: LOAM_SLED.at, yaw: LOAM_SLED.yaw },
  ],
  steps: [
    { do: 'cam', shot: { kind: 'track', pos: up(46, -318, 2.2), who: 'ride', fov: 50 } },
    { do: 'drive', vehicle: 'ride', path: [[30, -300], [30, -318], [16, -330], [7, -333]], speed: 8 },
    { do: 'sfx', id: 'skid', at: 'ride' },
    { do: 'exit', who: 'pip' },
    { do: 'exit', who: 'player' },
    { do: 'walk', who: 'player', path: [[3, -336], [0, -336]], speed: 1.2 },
    { do: 'cam', shot: { kind: 'cut', pos: up(14, -356, 2), look: 'loam', fov: 48 } },
    { do: 'gesture', who: 'pip', name: 'handsUp', s: 1.0, async: true },
    { do: 'cam', shot: { kind: 'cut', pos: [-1.27, 1.6, -353.67], look: 'loam', fov: 46 } },
    { do: 'say', who: 'loam', text: 'Another cracked pilgrim. Sit by the stove.' },
    { do: 'cam', shot: { kind: 'cut', pos: up(26, -338, 2), look: 'pip', fov: 48 } },
    { do: 'cam', shot: { kind: 'cut', pos: [3.24, 1.6, -330.12], look: 'pip', fov: 46 } },
    { do: 'say', who: 'pip', text: "It's a hairline fracture. ...Did my elbow just rattle?" },
    { do: 'cam', shot: { kind: 'cut', pos: up(14, -356, 2), look: 'loam', fov: 48 } },
    { do: 'cam', shot: { kind: 'cut', pos: [-1.27, 1.6, -353.67], look: 'loam', fov: 46 } },
    { do: 'say', who: 'loam', text: 'I was excommunicated for preaching on a snowmobile. Yet here we are.' },
    { do: 'gesture', who: 'loam', name: 'wave', s: 1.0 },
    { do: 'say', who: 'loam', text: 'A castaway at Loch Moss keeps sending snails about a turtle. Big as a barn.' },
  ],
};

/**
 * Kiln-Resin: Loam needs fresh resin from the northern shrine to cure Pip's arm. The shrine, the plows that block the
 * road, then the wait by the basin.
 */
export const KILN_RESIN_INTRO: SceneScript = {
  id: 'kiln-resin-intro',
  stage: { kind: 'world' },
  music: 'frost',
  ambience: 'wind',
  actors: [
    { id: 'player', player: true, ...markOf(BASIN, 'player') },
    { id: 'loam', preset: 'loam', held: 'clay-jar', ...markOf(BASIN, 'loam') },
    { id: 'pip', preset: 'pip', ...markOf(BASIN, 'pip') },
    { id: 'plow1', name: 'HOA Plow Driver', look: { hat: 0x18181e, shirt: 0xc9b99b }, ...markOf('salt-plow-blockade', 'salt-plow-driver', 0) },
    { id: 'plow2', name: 'HOA Plow Driver', look: { hat: 0x18181e, shirt: 0xc9b99b }, ...markOf('salt-plow-blockade', 'salt-plow-driver', 1) },
  ],
  steps: [
    { do: 'cam', shot: spot(BASIN, 'arrival') },
    { do: 'gesture', who: 'loam', name: 'bow', s: 1.2, async: true },
    { do: 'cam', shot: { kind: 'cut', pos: [-0.81, 1.6, -342.28], look: 'loam', fov: 46 } },
    { do: 'say', who: 'loam', text: 'The resin has gone thin. Fetch a fresh jar from the northern shrine, my child.' },
    { do: 'cam', shot: { kind: 'cut', pos: [13.25, 1.6, -344.89], look: 'pip', fov: 46 } },
    { do: 'say', who: 'pip', text: 'The shrine is past the salt plows. Of course it is.' },
    { do: 'gesture', who: 'player', name: 'shrug', s: 1.0 },
    // The shrine.
    { do: 'stinger', id: 'mystery' },
    { do: 'cam', shot: spot('kiln-shrine', 'wide') },
    { do: 'say', who: 'Narrator', text: 'The northern shrine. Resin still drips from the ceiling, warm as a stove.' },
    // The blockade.
    { do: 'cam', shot: spot('salt-plow-blockade', 'wide') },
    { do: 'cam', shot: { kind: 'cut', pos: [-9.58, 1.75, -392.1], look: 'plow1', fov: 46 } },
    { do: 'say', who: 'plow1', text: 'No Kiln-Resin past the blockade, pal. HOA orders. Turn around.' },
    { do: 'gesture', who: 'plow2', name: 'crossArms', s: 1.2 },
    { do: 'sfx', id: 'thud', gain: 0.5 },
    { do: 'say', who: 'Narrator', text: 'One sensible argument and two plow drivers later, the road is clear.' },
    // Back by the basin: the cure.
    { do: 'cam', shot: spot(BASIN, 'arrival') },
    { do: 'cam', shot: { kind: 'cut', pos: [-0.81, 1.6, -342.28], look: 'loam', fov: 46 } },
    { do: 'say', who: 'loam', text: 'Hold the basin for ninety seconds while I cure your arm.' },
    { do: 'cam', shot: { kind: 'cut', pos: [13.25, 1.6, -344.89], look: 'pip', fov: 46 } },
    { do: 'say', who: 'pip', text: "Ninety seconds? I've glued a hat in less." },
    { do: 'caption', text: 'Ninety seconds later.' },
    { do: 'fade', to: 1, s: 0.8 },
    { do: 'fade', to: 0, s: 0.8 },
    { do: 'caption', text: null },
    { do: 'walk', who: 'player', path: [[1, -336]], speed: 1.2 },
  ],
};

/**
 * Kiln-Resin outro: the scroll from Thermos Theo's barrel at the north highway. Pip's resin arm is done.
 */
export const KILN_RESIN_OUTRO: SceneScript = {
  id: 'kiln-resin-outro',
  stage: { kind: 'world' },
  music: 'warm',
  ambience: 'wind',
  actors: [
    { id: 'player', player: true, ...markOf('theo-camp', 'player') },
    { id: 'theo', name: 'Thermos Theo', look: { hat: 0x9e3b2a, shirt: 0x4a5a6a, beard: 0xdddddd }, ...markOf('theo-camp', 'theo') },
    { id: 'pip', preset: 'pip', at: [46, -341], yaw: -2.5 },
  ],
  props: [
    { id: 'snail', prefab: 'riding-snail', at: [36, -333], yaw: 0.5, size: 0.6, by: 'h', hidden: true },
  ],
  steps: [
    { do: 'cam', shot: spot('theo-camp', 'wide') },
    { do: 'cam', shot: { kind: 'cut', pos: [42.33, 1.57, -346.73], look: 'theo', fov: 46 } },
    { do: 'say', who: 'theo', text: "Tea? It's acorn-broth. Burns the throat, warms the soul. Kiln-approved." },
    { do: 'face', who: 'pip', at: 'theo', s: 0.4 },
    { do: 'cam', shot: { kind: 'cut', pos: up(38, -336, 1.8), look: 'pip', fov: 46 } },
    { do: 'gesture', who: 'pip', name: 'cheer', s: 1.4 },
    { do: 'say', who: 'pip', text: 'Good as new. Shinier, even.' },
    // The racing snail with the micro-scroll.
    { do: 'spawn', id: 'snail' },
    { do: 'stinger', id: 'mystery' },
    { do: 'music', track: 'mystery', fade: 1 },
    { do: 'cam', shot: { kind: 'cut', pos: up(33, -329, 1.2), look: 'snail', fov: 44 } },
    { do: 'say', who: 'Narrator', text: 'A racing snail creeps up the camp with a micro-scroll on its shell.' },
    { do: 'hold', who: 'theo', prop: 'rolled-scroll' },
    { do: 'give', from: 'theo', to: 'player', prop: 'rolled-scroll', s: 1.2 },
    { do: 'cam', shot: { kind: 'cut', pos: up(44, -331, 1.4), look: 'player', fov: 44 } },
    { do: 'say', who: 'Tansy', hz: 118, text: 'Found the Stopping Stone. Dust Flats. Bring Pip. Bring snacks.' },
    { do: 'cam', shot: spot('theo-camp', 'close') },
    { do: 'say', who: 'theo', text: "Baroness Brenda's been asking for you down the canal. Something about a hose." },
  ],
};

export const CH3B_SCENES: Record<string, SceneScript> = {
  'salvage-raid-outro': SALVAGE_RAID_OUTRO,
  'kiln-resin-intro': KILN_RESIN_INTRO,
  'kiln-resin-outro': KILN_RESIN_OUTRO,
};
