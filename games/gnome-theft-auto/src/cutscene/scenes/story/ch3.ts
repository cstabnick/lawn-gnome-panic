// Chapter 3 story scenes (intros, outros, the chapter's opening and closing set pieces). Owner: one issue of
// docs/roadmaps/gta-story-cutscenes.md. Every id here is played by a quest in quests/chapter3.ts and checked by scenes.test.ts.
import type { Point, SceneScript } from '../../script';
import { carMark, markOf, pathOf, rideOf, spot, up } from './kit';
import { CH3B_SCENES } from './ch3b';
import { CH3C_SCENES } from './ch3c';

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
    { do: 'cam', shot: { kind: 'cut', pos: [-142.88, 1.25, 69.8], look: 'tansy', fov: 46 } },
    { do: 'say', who: 'tansy', text: 'Cam sold us out for a Patio Heights racing charter!' },
    { do: 'sfx', id: 'whoosh', gain: 0.6 },
    { do: 'despawn', id: 'tansy' },
    // The raid turns ugly: a raider swings, Pip gets in the way.
    { do: 'music', track: 'chase', fade: 0.8 },
    { do: 'exit', who: 'raider' },
    { do: 'walk', who: 'raider', path: [[-158, 66], [-157, 68]], run: true },
    { do: 'walk', who: 'pip', path: [[-154, 68.5]], run: true },
    { do: 'sfx', id: 'glass', gain: 0.8 },
    { do: 'shake', amp: 0.25, s: 0.6 },
    { do: 'stinger', id: 'sad' },
    { do: 'gesture', who: 'pip', name: 'handsUp', s: 1.0 },
    { do: 'gesture', who: 'pip', name: 'facepalm', s: 1.2 },
    { do: 'say', who: 'Narrator', text: "Pip's clay arm cracks clean off at the shoulder." },
    { do: 'cam', shot: { kind: 'cut', pos: [-157.09, 1.25, 69.33], look: 'pip', fov: 46 } },
    { do: 'say', who: 'pip', text: 'My arm! Take my Zero-Turn and go north up the Ring Road!' },
    { do: 'gesture', who: 'pip', name: 'point', s: 1.0 },
    { do: 'walk', who: 'player', path: [[-147, 67]], speed: 1.6 },
    // Vesper leaves with the acorn.
    { do: 'enter', who: 'vesper', vehicle: 'vesper-car' },
    { do: 'drive', vehicle: 'vesper-car', path: VESPER_OUT, speed: 14, arrive: false },
    // Meanwhile at Bodega & Sons, in the rain.
    { do: 'cam', shot: spot('bodega-front', 'wide') },
    { do: 'cam', shot: { kind: 'cut', pos: [-76.89, 1.25, 88.75], look: 'john', fov: 46 } },
    { do: 'say', who: 'john', text: "Bodega & Sons, in the rain. Sirens go past. Asphalt doesn't even blink. Just bats the bottlecap." },
  ],
};

export const CH3_SCENES: Record<string, SceneScript> = {
  'salvage-raid-intro': SALVAGE_RAID_INTRO,
  ...CH3B_SCENES,
  ...CH3C_SCENES,
};
