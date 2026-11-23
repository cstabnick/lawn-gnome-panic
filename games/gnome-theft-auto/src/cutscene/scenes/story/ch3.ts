// Chapter 3 story scenes (intros, outros, the chapter's opening and closing set pieces). Owner: one issue of
// docs/roadmaps/gta-story-cutscenes.md. Every id here is played by a quest in quests/chapter3.ts and checked by scenes.test.ts.
import type { Point, SceneScript } from '../../script';
import { carMark, markOf, pathOf, rideOf, spot, up } from './kit';

const BAY = 'side-valve-bay';
const BASIN = 'birdbath-basin';
const SAFE = 'dust-safehouse';

/** The HOA raid: two vans in the two lanes of the z = 60 road, westbound, ending at the bay's road edge. */
const RAID_VAN_1: Point[] = pathOf(BAY, 'hoa-raid').slice(0, 3);
const RAID_VAN_2: Point[] = [[-60, 62.5], [-120, 62.5], [-156, 62.5]];
/** Vesper's pearl Lowrider comes in behind the vans and turns into the apron. */
const VESPER_IN: Point[] = [[-120, 57.5], [-146, 57.5], [-146, 64]];
/** The getaway: west along the road, then north up the x = -180 road. */
const VESPER_OUT: Point[] = [[-146, 57.5], [-177.5, 57.5], [-177.5, 20]];

/** Loam's snowmobile at the basin (the rideOf('loam') vehicle, parked by the rim). */
const LOAM_SLED = carMark(BASIN, 'loam-snowmobile');

/**
 * Chapter 3 opener. Rain at the Side-Valve bay: two HOA vans tear in, Turncoat Cam steps out of the first one (the
 * betrayal), Vesper takes the Golden Acorn from him, the chapter title, then a raider takes Pip's arm off and Vesper
 * drives off with the acorn. A cut to Bodega & Sons closes it.
 */
export const SALVAGE_RAID_INTRO: SceneScript = {
  id: 'salvage-raid-intro',
  stage: { kind: 'world' },
  music: 'tension',
  ambience: 'rain',
  actors: [
    { id: 'player', player: true, ...markOf(BAY, 'player') },
    { id: 'tansy', preset: 'tansy', ...markOf(BAY, 'tansy') },
    { id: 'pip', preset: 'pip', ...markOf(BAY, 'pip') },
    { id: 'cam', name: 'Turncoat Cam', look: { hat: 0xf4f4f8, shirt: 0xc9b99b }, at: [-150, 57.5], seatedIn: 'van1', seat: 1, hidden: true, held: 'golden-acorn-seed-cell' },
    { id: 'raider', name: 'HOA Raider', look: { hat: 0x18181e, shirt: 0xc9b99b }, at: [-156, 62.5], seatedIn: 'van2', seat: 1, hidden: true },
    { id: 'vesper', preset: 'vesper', at: [-146, 64], seatedIn: 'vesper-car', hidden: true },
    { id: 'john', preset: 'bodega', name: 'John Bodega', ...markOf('bodega-front', 'bodega') },
  ],
  vehicles: [
    { id: 'van1', kind: 'hoa-van', at: [-60, 57.5], yaw: -Math.PI / 2, hidden: true },
    { id: 'van2', kind: 'hoa-van', at: [-60, 62.5], yaw: -Math.PI / 2, hidden: true },
    { id: 'vesper-car', ...rideOf('vesper'), at: [-120, 57.5], yaw: -Math.PI / 2, hidden: true },
  ],
  steps: [
    { do: 'cam', shot: { kind: 'dolly', from: spot(BAY, 'wide').pos, to: up(-152, 60, 4), look: up(-150, 70, 1.2), s: 6, fov: 54 } },
    { do: 'say', who: 'Narrator', text: 'Rain on the Side-Valve apron. Sirens. Nobody called ahead.', hz: 130 },
    { do: 'spawn', id: 'van1' },
    { do: 'spawn', id: 'van2' },
    { do: 'spawn', id: 'cam' },
    { do: 'spawn', id: 'raider' },
    { do: 'sfx', id: 'alarm', gain: 0.5 },
    { do: 'drive', vehicle: 'van2', path: RAID_VAN_2, speed: 13, async: true },
    { do: 'cam', shot: { kind: 'track', pos: up(-124, 50, 3.5), who: 'van1', fov: 50 } },
    { do: 'drive', vehicle: 'van1', path: RAID_VAN_1, speed: 13 },
    // The betrayal.
    { do: 'stinger', id: 'reveal' },
    { do: 'exit', who: 'cam' },
    { do: 'say', who: 'Narrator', text: 'Turncoat Cam steps out of the first van, broom still in hand.' },
    { do: 'walk', who: 'cam', path: [[-152, 64], [-153, 66]], speed: 1.4 },
    // Vesper arrives behind the vans and walks up to the bay.
    { do: 'spawn', id: 'vesper-car' },
    { do: 'spawn', id: 'vesper' },
    { do: 'drive', vehicle: 'vesper-car', path: VESPER_IN, speed: 10 },
    { do: 'exit', who: 'vesper' },
    { do: 'walk', who: 'vesper', path: [[-150, 68]], speed: 1.4 },
    { do: 'face', who: 'cam', at: 'vesper', s: 0.3 },
    { do: 'face', who: 'vesper', at: 'cam', s: 0.3 },
    { do: 'give', from: 'cam', to: 'vesper', prop: 'golden-acorn-seed-cell', s: 1.2 },
    { do: 'cam', shot: spot(BAY, 'two-shot') },
    { do: 'gesture', who: 'vesper', name: 'lean', s: 1.0 },
    { do: 'say', who: 'vesper', text: 'Nice hat. Shame.' },
    // The title.
    { do: 'stinger', id: 'chapter' },
    { do: 'title', text: 'CHAPTER 3 — COLD CLAY' },
    { do: 'wait', s: 2.5 },
    { do: 'title', text: null },
    { do: 'say', who: 'tansy', text: 'Cam sold us out for a Patio Heights racing charter!' },
    { do: 'sfx', id: 'whoosh', gain: 0.6 },
    { do: 'despawn', id: 'tansy' },
    // The raid turns ugly: a raider swings, Pip gets in the way.
    { do: 'music', track: 'chase', fade: 0.8 },
    { do: 'walk', who: 'raider', path: [[-158, 66], [-157, 68]], speed: 2.5 },
    { do: 'walk', who: 'pip', path: [[-154, 68.5]], run: true },
    { do: 'sfx', id: 'glass', gain: 0.8 },
    { do: 'shake', amp: 0.25, s: 0.6 },
    { do: 'stinger', id: 'sad' },
    { do: 'gesture', who: 'pip', name: 'handsUp', s: 1.0 },
    { do: 'gesture', who: 'pip', name: 'facepalm', s: 1.2 },
    { do: 'say', who: 'Narrator', text: "Pip's clay arm cracks clean off at the shoulder." },
    { do: 'say', who: 'pip', text: 'My arm! Take my Zero-Turn and go north up the Ring Road!' },
    { do: 'gesture', who: 'pip', name: 'point', s: 1.0 },
    { do: 'walk', who: 'player', path: [[-147, 67]], speed: 1.6 },
    // Vesper leaves with the acorn.
    { do: 'enter', who: 'vesper', vehicle: 'vesper-car' },
    { do: 'drive', vehicle: 'vesper-car', path: VESPER_OUT, speed: 14, arrive: false },
    // Meanwhile at Bodega & Sons, in the rain.
    { do: 'cam', shot: spot('bodega-front', 'wide') },
    { do: 'say', who: 'john', text: "Bodega & Sons, in the rain. Sirens go past. Asphalt doesn't even blink. Just bats the bottlecap." },
  ],
};

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
    { do: 'say', who: 'loam', text: 'Another cracked pilgrim. Sit by the stove.' },
    { do: 'cam', shot: { kind: 'cut', pos: up(26, -338, 2), look: 'pip', fov: 48 } },
    { do: 'say', who: 'pip', text: "It's a hairline fracture. ...Did my elbow just rattle?" },
    { do: 'cam', shot: { kind: 'cut', pos: up(14, -356, 2), look: 'loam', fov: 48 } },
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
    { do: 'say', who: 'loam', text: 'The resin has gone thin. Fetch a fresh jar from the northern shrine, my child.' },
    { do: 'say', who: 'pip', text: 'The shrine is past the salt plows. Of course it is.' },
    { do: 'gesture', who: 'player', name: 'shrug', s: 1.0 },
    // The shrine.
    { do: 'stinger', id: 'mystery' },
    { do: 'cam', shot: spot('kiln-shrine', 'wide') },
    { do: 'say', who: 'Narrator', text: 'The northern shrine. Resin still drips from the ceiling, warm as a stove.' },
    // The blockade.
    { do: 'cam', shot: spot('salt-plow-blockade', 'wide') },
    { do: 'say', who: 'plow1', text: 'No Kiln-Resin past the blockade, pal. HOA orders. Turn around.' },
    { do: 'gesture', who: 'plow2', name: 'crossArms', s: 1.2 },
    { do: 'sfx', id: 'thud', gain: 0.5 },
    { do: 'say', who: 'Narrator', text: 'One sensible argument and two plow drivers later, the road is clear.' },
    // Back by the basin: the cure.
    { do: 'cam', shot: spot(BASIN, 'arrival') },
    { do: 'say', who: 'loam', text: 'Hold the basin for ninety seconds while I cure your arm.' },
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
    { do: 'walk', who: 'player', path: [[47, -346], [46, -334], [40, -330]], speed: 1.2 },
  ],
};

/**
 * Tundra run: Pip and Loam load ice-packed Black Dew barrels onto a Zero-Turn, Loam blesses it, and Pip takes it for
 * a short drift east along the ring road.
 */
export const TUNDRA_INTRO: SceneScript = {
  id: 'tundra-intro',
  stage: { kind: 'world' },
  music: 'frost',
  ambience: 'wind',
  actors: [
    { id: 'player', player: true, ...markOf(BASIN, 'player') },
    { id: 'loam', preset: 'loam', ...markOf(BASIN, 'loam') },
    { id: 'pip', preset: 'pip', ...markOf(BASIN, 'pip') },
  ],
  vehicles: [
    // Outside the basin's rim, on the highway side (the rim blocks walks and sightlines inside it).
    { id: 'mower', kind: 'zero-turn', at: [24, -340], yaw: Math.PI / 2 },
  ],
  steps: [
    { do: 'cam', shot: spot(BASIN, 'arrival') },
    { do: 'hold', who: 'pip', prop: 'gta-dew-barrel' },
    { do: 'hold', who: 'loam', prop: 'gta-dew-barrel' },
    { do: 'say', who: 'pip', text: 'Keep it clean. The loyal Carburettors need every drop.' },
    { do: 'walk', who: 'pip', path: [[20, -345]], speed: 1.2 },
    { do: 'hold', who: 'pip', prop: null },
    { do: 'hold', who: 'loam', prop: null },
    { do: 'cam', shot: { kind: 'cut', pos: spot(BASIN, 'arrival').pos, look: 'mower', fov: 46 } },
    { do: 'gesture', who: 'loam', name: 'bow', s: 1.6 },
    { do: 'say', who: 'loam', text: 'Compost tea, for the getaway. The Kiln wants a clean lap.' },
    { do: 'horn', vehicle: 'mower' },
    { do: 'walk', who: 'pip', path: [[14, -348]], speed: 1.2 },
    { do: 'cam', shot: { kind: 'track', pos: spot(BASIN, 'arrival').pos, who: 'mower', fov: 50 } },
    { do: 'say', who: 'pip', text: "Ring road east. Don't drift." },
    { do: 'say', who: 'pip', text: 'Okay, drift a little.' },
    { do: 'drive', vehicle: 'mower', path: [[24, -340], [40, -330], [70, -300]], speed: 9, arrive: false },
    { do: 'walk', who: 'player', path: [[1, -335]], speed: 1.2 },
  ],
};

/**
 * Chapter 3 closer: dusk at the Dust Flats Overlook. Tansy has the Stopping Stone, the reunion with Pip's resin arm,
 * and a deep machine horn from Vesper's Grand Combine. Title: END OF CHAPTER 3.
 */
export const TUNDRA_OUTRO: SceneScript = {
  id: 'tundra-outro',
  stage: { kind: 'world' },
  music: 'warm',
  ambience: 'wind',
  actors: [
    { id: 'player', player: true, ...markOf(SAFE, 'player') },
    { id: 'tansy', preset: 'tansy', held: 'stopping-stone', ...markOf(SAFE, 'tansy') },
    { id: 'pip', preset: 'pip', ...markOf(SAFE, 'pip') },
  ],
  vehicles: [
    { id: 'whirligig', ...carMark(SAFE, 'safehouse-whirligig') },
  ],
  steps: [
    { do: 'cam', shot: spot(SAFE, 'two-shot') },
    { do: 'walk', who: 'tansy', path: [[270, 44], [276, 52]], speed: 1.2 },
    { do: 'face', who: 'tansy', at: 'pip', s: 0.3 },
    { do: 'gesture', who: 'tansy', name: 'wave', s: 1.0 },
    { do: 'say', who: 'tansy', text: 'Pip. Your arm is... shiny.' },
    { do: 'say', who: 'pip', text: 'Resin. Shinier, even.' },
    { do: 'say', who: 'Narrator', text: 'She hugs him, carefully, round the resin.' },
    { do: 'cam', shot: { kind: 'cut', pos: up(280, 50, 1.6), look: 'tansy', fov: 46 } },
    { do: 'say', who: 'tansy', text: "Got the Stopping Stone off Bracken's tablet. Nobody jams anything without it." },
    // Fort Sandpit glows in the distance; the Grand Combine fires up.
    { do: 'music', track: 'turfton-dusk', fade: 1 },
    { do: 'cam', shot: { kind: 'cut', pos: up(296, 62, 7), look: up(374, 44, 5), fov: 46 } },
    { do: 'say', who: 'Narrator', text: "Fort Sandpit's walls glow gold across the dunes." },
    { do: 'sfx', id: 'alarm', gain: 0.3 },
    { do: 'shake', amp: 0.05, s: 1.5 },
    { do: 'stinger', id: 'villain' },
    { do: 'music', track: 'villain', fade: 1 },
    { do: 'say', who: 'Narrator', text: 'Far off, a deep machine horn. The Grand Combine has fired up.' },
    { do: 'cam', shot: spot(SAFE, 'two-shot') },
    { do: 'say', who: 'tansy', text: "Vesper's put the acorn in it. We can't outdrive that thing." },
    { do: 'cam', shot: { kind: 'cut', pos: up(280, 52, 1.6), look: 'pip', fov: 46 } },
    { do: 'gesture', who: 'pip', name: 'point', s: 1.0 },
    { do: 'say', who: 'pip', text: 'Then we don\'t drive.' },
    { do: 'walk', who: 'pip', path: [[286, 56]], speed: 1.1 },
    { do: 'cam', shot: { kind: 'cut', pos: up(276, 48, 1.6), look: 'whirligig', fov: 48 } },
    { do: 'say', who: 'tansy', text: 'Fort Sandpit has a Whirligig.' },
    { do: 'gesture', who: 'pip', name: 'cheer', s: 1.2 },
    { do: 'say', who: 'Burt', hz: 102, text: "Tansy? Burt. Somebody's been asking about the audit. Call me back." },
    { do: 'title', text: 'END OF CHAPTER 3' },
    { do: 'walk', who: 'player', path: [[275, 42]], speed: 1.2 },
  ],
};

export const CH3_SCENES: Record<string, SceneScript> = {
  'salvage-raid-intro': SALVAGE_RAID_INTRO,
  'salvage-raid-outro': SALVAGE_RAID_OUTRO,
  'kiln-resin-intro': KILN_RESIN_INTRO,
  'kiln-resin-outro': KILN_RESIN_OUTRO,
  'tundra-intro': TUNDRA_INTRO,
  'tundra-outro': TUNDRA_OUTRO,
};
