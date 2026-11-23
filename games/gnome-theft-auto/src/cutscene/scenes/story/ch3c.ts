// Chapter 3, the drift run and the chapter's close at the Dust Flats Overlook. Re-directed in the Story B direction
// pass (docs/design/gnome-theft-auto/direction/lanes.md); notes in direction/scenes/<id>.md.
// Registered through CH3_SCENES in ch3.ts.
import type { SceneScript } from '../../script';
import { beat, coverage, cut, exchangeLooks, reaction, shot } from '../../direct';
import { carMark, markOf, spot, up } from './kit';

const BASIN = 'birdbath-basin';
const SAFE = 'dust-safehouse';

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
    { do: 'cam', shot: { kind: 'cut', pos: [13.25, 1.6, -344.89], look: 'pip', fov: 46 } },
    { do: 'say', who: 'pip', text: 'Keep it clean. The loyal Carburettors need every drop.' },
    { do: 'walk', who: 'pip', path: [[20, -345]], speed: 1.2 },
    { do: 'hold', who: 'pip', prop: null },
    { do: 'hold', who: 'loam', prop: null },
    { do: 'cam', shot: { kind: 'cut', pos: spot(BASIN, 'arrival').pos, look: 'mower', fov: 46 } },
    { do: 'gesture', who: 'loam', name: 'bow', s: 1.6 },
    { do: 'cam', shot: { kind: 'cut', pos: [-0.81, 1.6, -342.28], look: 'loam', fov: 46 } },
    { do: 'say', who: 'loam', text: 'Compost tea, for the getaway. The Kiln wants a clean lap.' },
    { do: 'horn', vehicle: 'mower' },
    { do: 'walk', who: 'pip', path: [[14, -348]], speed: 1.2 },
    { do: 'cam', shot: { kind: 'track', pos: spot(BASIN, 'arrival').pos, who: 'mower', fov: 50 } },
    { do: 'cam', shot: { kind: 'cut', pos: [10.81, 1.6, -347.72], look: 'pip', fov: 46 } },
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

export const CH3C_SCENES: Record<string, SceneScript> = {
  'tundra-intro': TUNDRA_INTRO,
  'tundra-outro': TUNDRA_OUTRO,
};
