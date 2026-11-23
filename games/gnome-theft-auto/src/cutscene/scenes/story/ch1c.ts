// Chapter 1 story scenes, third file: Mower's Keepers payoff and the Glaze & Tax break-in (Side-Valve Salvage scenes).
// Owner: the Story A re-direction lane (docs/roadmaps/gta-redirect-story-a.md). Every id here is played by a quest in quests/chapter1.ts and checked by scenes.test.ts.
import type { ScriptActor, ScriptVehicle, SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, reaction, shot } from '../../direct';
import { markOf, pathOf, rideOf, spot, up } from './kit';

type Look = NonNullable<ScriptActor['look']>;

const TURNCOAT_LOOK: Look = { hat: 0xf4f4f8, shirt: 0xc9b99b };

/** A cast member's own vehicle (rideOf: kind and Pay 'n' Glaze look) at a point. */
function ride(id: string, castId: string, at: Vec2, yaw: number, extra: Partial<ScriptVehicle> = {}): ScriptVehicle {
  return { id, ...rideOf(castId), at, yaw, ...extra };
}

// ---- Stage marks (quests/stages/turfton.ts, side-valve-bay) -----------------------------------------------------------
const BAY_PLAYER = markOf('side-valve-bay', 'player');
const BAY_TANSY = markOf('side-valve-bay', 'tansy');
const BAY_PIP = markOf('side-valve-bay', 'pip');
const BAY_TURNCOAT = markOf('side-valve-bay', 'turncoat-cam');
const BAY_VESPER_ARRIVAL = pathOf('side-valve-bay', 'side-valve-approach');
const BAY_VESPER_GETAWAY = pathOf('side-valve-bay', 'side-valve-getaway');

/** Tansy and Pip: one side of their line for every exchange in these scenes (the 180-degree rule). */
const CREW = coverage('tansy', 'pip', 1);

/** Mower's Keepers payoff: the eviction notice comes off Tansy's door, then Vesper's pearl Lowrider cruises past. */
export const MOWERS_KEEPERS_OUTRO: SceneScript = {
  id: 'mowers-keepers-outro',
  stage: { kind: 'world' },
  music: 'turfton',
  ambience: 'street',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/mowers-keepers-outro.md' },
  actors: [
    { id: 'player', player: true, ...BAY_PLAYER },
    { id: 'tansy', preset: 'tansy', name: 'Tansy Clayfoot', ...BAY_TANSY, held: null },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', ...BAY_PIP },
  ],
  vehicles: [{ id: 'vesper-car', ...rideOf('vesper'), at: [-120, 57.5], yaw: -Math.PI / 2 }],
  props: [{ id: 'notice', prefab: 'sealed-letter', at: [-142.4, 65.6], yaw: 0, size: 0.35 }],
  steps: [
    // Hook: Tansy walks to her own bay door and takes the notice down. No narration.
    { do: 'cam', shot: { kind: 'cut', pos: up(-139.2, 64.6, 1.3), look: up(-142.4, 67.4, 0.9), fov: 44 } },
    { do: 'walk', who: 'tansy', path: [[-142.5, 68.5]], speed: 1.2 },
    { do: 'despawn', id: 'notice' },
    { do: 'hold', who: 'tansy', prop: 'sealed-letter' },
    { do: 'gesture', who: 'tansy', name: 'facepalm', s: 1.0 },
    { do: 'face', who: 'tansy', at: 'pip', s: 0.5 },
    cut(CREW.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Eviction notice. Taped to my bay door. Who sends an eviction to a salvage yard?' },
    { do: 'gesture', who: 'pip', name: 'stand', s: 0.9, async: true },
    cut(CREW.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Eviction? We don\'t even pay rent.' },
    cut(CREW.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Exactly.' },
    // Vesper's first drive-by: the pearl Lowrider with nobody visibly driving it.
    { do: 'cam', shot: { kind: 'track', pos: up(-150, 50, 3), who: 'vesper-car', fov: 50 } },
    { do: 'music', track: 'villain', fade: 1.2 },
    { do: 'stinger', id: 'villain' },
    { do: 'drive', vehicle: 'vesper-car', path: [[-150, 57.5], [-190, 57.5]], speed: 9, depart: true, arrive: false, async: true },
    { do: 'wait', s: 5 },
    cut(CREW.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Vesper Thorne. He doesn\'t knock. He files.' },
    cut(CREW.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Is anyone driving that? Nobody\'s driving that.' },
    cut(CREW.single('tansy', 'mcu')),
    // Button: the line lands, the music goes, and Tansy holds the notice on the held frame while the engine fades.
    { do: 'say', who: 'tansy', text: 'Nobody\'s driving it. That\'s worse.' },
    { do: 'music', track: null, fade: 1.2 },
    { do: 'wait', s: 2.5 },
  ],
};

/**
 * Glaze & Tax break-in, intro: Vesper serves Tansy a foreclosure lien in person; Pip hides; the crew plans the raid on
 * the Buck-Iron Combine. Notes: docs/design/gnome-theft-auto/direction/scenes/tax-break-in-intro.md.
 */
export const TAX_BREAK_IN_INTRO: SceneScript = {
  id: 'tax-break-in-intro',
  stage: { kind: 'world' },
  ambience: 'street',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/tax-break-in-intro.md' },
  actors: [
    { id: 'player', player: true, at: BAY_PLAYER.at, yaw: BAY_PLAYER.yaw },
    { id: 'tansy', preset: 'tansy', at: BAY_TANSY.at, yaw: BAY_TANSY.yaw },
    { id: 'pip', preset: 'pip', at: BAY_PIP.at, yaw: BAY_PIP.yaw },
    { id: 'vesper', preset: 'vesper', seatedIn: 'vesper-car', hidden: true, at: [0, 0] },
  ],
  vehicles: [ride('vesper-car', 'vesper', BAY_VESPER_ARRIVAL[0], -Math.PI / 2, { hidden: true })],
  steps: [
    // Hook: the clean car on the road, and the villain motif on its first frame.
    { do: 'music', track: null, fade: 0.4 },
    { do: 'cam', shot: { kind: 'track', pos: up(-135, 49, 3), who: 'vesper-car', fov: 50 } },
    { do: 'spawn', id: 'vesper-car', at: [-120, 57.5] },
    { do: 'stinger', id: 'villain' },
    { do: 'music', track: 'villain', fade: 0.8 },
    { do: 'drive', vehicle: 'vesper-car', path: BAY_VESPER_ARRIVAL.slice(2, 4), speed: 10, async: true },
    { do: 'wait', s: 2.5 },
    cut(CREW.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'A clean car. In Turfton. That\'s never good news.' },
    cut(CREW.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Vesper Thorne. Hide the toast.' },
    // Pip ducks behind the barrel: his own shot, a run and a flinch.
    // Behind the barrel (gta-dew-barrel at -132, 77) from the apron to the east: the barrel is between Pip and the lens.
    cut({ kind: 'cut', pos: up(-124, 70.5, 1.1), look: up(-134.2, 77.8, 0.5), fov: 40 }),
    { do: 'walk', who: 'pip', path: [[-134.2, 78.2]], run: true },
    { do: 'gesture', who: 'pip', name: 'flinch', s: 1.0 },
    // Vesper steps out of the Lowrider onto the apron, alone.
    { do: 'spawn', id: 'vesper' },
    { do: 'exit', who: 'vesper' },
    cut(shot('vesper', 'ms', { toward: 'tansy', height: 'low' })),
    { do: 'walk', who: 'vesper', path: [[-148, 70.5]], speed: 1.2 },
    { do: 'face', who: 'vesper', at: 'tansy', s: 0.5 },
    { do: 'hold', who: 'vesper', prop: 'sealed-letter' },
    // The threat: a slow push-in on Vesper, low, alone in frame, nobody else in it.
    { do: 'cam', shot: { kind: 'dolly', from: up(-144.5, 67.5, 0.9), to: up(-146.2, 68.6, 0.9), look: 'vesper', s: 3.2, fov: 36 } },
    { do: 'say', who: 'vesper', text: 'Forty-eight hours, Ms. Clayfoot.' },
    { do: 'give', from: 'vesper', to: 'tansy', prop: 'sealed-letter', s: 0.9 },
    ...reaction('tansy', { toward: 'vesper', gesture: 'crossArms', size: 'mcu', hold: 'pause' }),
    // The hat ladder, rung two: the one time he says the full line, and it is said to the player.
    { do: 'face', who: 'vesper', at: 'player', s: 0.5 },
    cut(shot('vesper', 'mcu', { toward: 'player', height: 'low' })),
    { do: 'gesture', who: 'vesper', name: 'tipHat', s: 1.2 },
    { do: 'say', who: 'vesper', text: 'Nice hat. Shame if it cracked.' },
    ...reaction('player', { toward: 'vesper', size: 'mcu', hold: 'pause' }),
    // The crate: Vesper knows about it. The line lands on Tansy, with the sweeper behind her.
    { do: 'face', who: 'vesper', at: 'tansy', s: 0.4 },
    cut(shot('vesper', 'mcu', { toward: 'tansy', height: 'low' })),
    { do: 'say', who: 'vesper', text: 'And do not open that Seed-Cell crate.' },
    cut({ kind: 'cut', pos: up(-137.5, 72.5, 1.3), look: 'tansy', fov: 40 }),
    { do: 'wait', s: 1.5 },
    // He drives off: a follow shot on the getaway.
    { do: 'enter', who: 'vesper', vehicle: 'vesper-car' },
    { do: 'cam', shot: { kind: 'follow', who: 'vesper-car', offset: [0, 2.2, -5.5] } },
    { do: 'drive', vehicle: 'vesper-car', path: BAY_VESPER_GETAWAY.slice(0, 3), speed: 12, arrive: false },
    { do: 'music', track: 'heist', fade: 1 },
    // The plan, in three short clauses, from Tansy. Pip comes back to his crate while she talks.
    { do: 'walk', who: 'pip', path: [[-134.5, 74.8]], speed: 1.4, async: true },
    cut(CREW.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'He filed my deed at the Glaze & Tax Office, in Thorne Tower.' },
    cut(CREW.single('tansy', 'cu')),
    { do: 'say', who: 'tansy', text: 'We crack the auditors, take the deed, and steal the Buck-Iron Combine.' },
    cut(CREW.single('pip', 'mcu')),
    { do: 'gesture', who: 'pip', name: 'nod', s: 1.0 },
    cut(CREW.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Famous for opening with a butter knife.' },
    cut(CREW.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'I brought two butter knives. One for the ignition, one for emergency toast.' },
    cut(CREW.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Guns are free at Ammu-Gnation on the east road. The shiny bits are not.' },
    // Button: Pip close, the plant for the golden kazoo; then Tansy's look at him.
    cut(CREW.single('pip', 'cu')),
    { do: 'say', who: 'pip', text: 'I want the golden kazoo.' },
    ...reaction('tansy', { toward: 'pip', size: 'mcu', hold: 'pause' }),
  ],
};

/**
 * Glaze & Tax break-in, outro: the player brings the stolen Buck-Iron Combine onto the apron; the blueprints say
 * "golden acorn". Notes: docs/design/gnome-theft-auto/direction/scenes/tax-break-in-outro.md.
 */
export const TAX_BREAK_IN_OUTRO: SceneScript = {
  id: 'tax-break-in-outro',
  stage: { kind: 'world' },
  music: 'heist',
  ambience: 'street',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/tax-break-in-outro.md' },
  actors: [
    { id: 'player', player: true, seatedIn: 'ride', seat: 0, at: [0, 0] },
    { id: 'tansy', preset: 'tansy', at: BAY_TANSY.at, yaw: BAY_TANSY.yaw },
    { id: 'pip', preset: 'pip', at: BAY_PIP.at, yaw: BAY_PIP.yaw },
    { id: 'turncoat', name: 'Turncoat Cam', look: TURNCOAT_LOOK, at: BAY_TURNCOAT.at, yaw: BAY_TURNCOAT.yaw },
  ],
  vehicles: [
    { id: 'ride', kind: 'combine', from: 'player', at: [-122.5, 57.5], yaw: -Math.PI / 2 },
  ],
  props: [
    { id: 'plans', prefab: 'folded-map', at: up(-158, 75.6, 0.95), yaw: 0 },
  ],
  steps: [
    // Hook: the engine, the shake, and the Combine rolling onto the apron.
    { do: 'cam', shot: { kind: 'track', pos: up(-160, 50, 4), who: 'ride', fov: 50 } },
    { do: 'sfx', id: 'engine-rev' },
    { do: 'shake', amp: 0.08, s: 2.5 },
    { do: 'walk', who: 'turncoat', path: [[-158, 68], [-156, 65.5]], speed: 1, async: true },
    { do: 'drive', vehicle: 'ride', path: [[-150, 57.5], [-150, 72]], speed: 6 },
    { do: 'gesture', who: 'pip', name: 'cheer', s: 1.2, async: true },
    cut(CREW.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'She is enormous! Tansy, she is enormous!' },
    cut(shot('player', 'ms', { toward: 'tansy' })),
    { do: 'exit', who: 'player' },
    { do: 'walk', who: 'player', path: [[-148, 67]], speed: 1.4 },
    // The picture first: a dolly down onto the blueprints on the bench, then the hold.
    { do: 'cam', shot: { kind: 'dolly', from: up(-152, 73, 2.5), to: up(-156, 75.5, 1.2), look: 'plans', s: 4 } },
    { do: 'wait', s: 1.5 },
    cut(CREW.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'The Grand Combine. A harvester the size of a block.' },
    { do: 'say', who: 'tansy', text: 'Zero-millimetre scalp.' },
    cut(CREW.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'What does it run on?' },
    cut(CREW.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'A Fescue Golden Acorn.' },
    // Everyone turns to the crate: music out for a beat, then the reveal on the picture of the crate.
    { do: 'music', track: null, fade: 0.5 },
    { do: 'wait', s: 0.7 },
    { do: 'cam', shot: { kind: 'cut', pos: up(-146, 66, 1.7), look: up(-160, 72, 0.6), fov: 46 } },
    { do: 'stinger', id: 'reveal' },
    { do: 'music', track: 'villain', fade: 1 },
    { do: 'face', who: 'pip', at: [-160, 72], s: 0.3, async: true },
    { do: 'face', who: 'tansy', at: [-160, 72], s: 0.3, async: true },
    { do: 'face', who: 'turncoat', at: [-160, 72], s: 0.3 },
    { do: 'wait', s: 0.6 },
    // Button: the held picture of the crew and Cam, all looking at the crate.
    { do: 'cam', shot: spot('side-valve-bay', 'wide') },
    { do: 'wait', s: 2.5 },
  ],
};

export const CH1C_SCENES: Record<string, SceneScript> = {
  'mowers-keepers-outro': MOWERS_KEEPERS_OUTRO,
  'tax-break-in-intro': TAX_BREAK_IN_INTRO,
  'tax-break-in-outro': TAX_BREAK_IN_OUTRO,
};
