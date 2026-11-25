// Chapter 3, the drift run and the chapter's close at the Dust Flats Overlook. Re-directed in the Story B direction
// pass (docs/design/gnome-theft-auto/direction/lanes.md); notes in direction/scenes/<id>.md.
// Registered through CH3_SCENES in ch3.ts.
import type { SceneScript } from '../../script';
import { beat, coverage, cut, exchangeLooks, reaction, shot } from '../../direct';
import { carMark, markOf, spot, up } from './kit';

const BASIN = 'birdbath-basin';
const SAFE = 'dust-safehouse';

/**
 * Tundra run: Pip carries a Black Dew barrel onto the parked mower, Loam blesses it, and Pip hands the player the key.
 * The player drives the run; the scene ends on foot beside the mower.
 */
/** Pip and the player talk across the mower: one side of their line. */
const PP = coverage('pip', 'player', 1);

export const TUNDRA_INTRO: SceneScript = {
  id: 'tundra-intro',
  stage: { kind: 'world' },
  music: 'frost',
  ambience: 'wind',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/tundra-intro.md' },
  actors: [
    { id: 'player', player: true, ...markOf(BASIN, 'player') },
    { id: 'loam', preset: 'loam', held: 'clay-jar', ...markOf(BASIN, 'loam') },
    { id: 'pip', preset: 'pip', held: 'gta-dew-barrel', ...markOf(BASIN, 'pip') },
  ],
  vehicles: [
    // The drift-run mower: the stage's parked ice-zero-turn, where the quest starts.
    { id: 'mower', ...carMark(BASIN, 'ice-zero-turn') },
  ],
  steps: [
    // 1. Hook: Pip carries a barrel across the basin to the mower, with two arms.
    { do: 'cam', shot: spot(BASIN, 'arrival') },
    // West round the rim building (it stands between Pip's bench and the mower), to the mower's west side.
    { do: 'walk', who: 'pip', path: [[9, -347], [7.5, -340]], run: true },
    { do: 'hold', who: 'pip', prop: null },
    { do: 'sfx', id: 'clatter', at: 'mower', gain: 0.5, async: true },
    { do: 'sfx', id: 'thud', at: 'mower' },
    cut(PP.single('pip', 'ms')),
    { do: 'say', who: 'pip', text: 'Both arms, both barrels. Watch this.' },
    // 2. Loam blesses the getaway from the rim.
    cut(shot('loam', 'mcu', { side: -30 })),
    { do: 'gesture', who: 'loam', name: 'bow', s: 1.6 },
    { do: 'say', who: 'loam', text: 'Compost tea, for the getaway. The Kiln wants a clean lap.' },
    // 3. The turn: Pip gives the player the key. He trusts them to drive.
    ...reaction('player', { toward: 'pip', side: -25, hold: 'beat' }),
    { do: 'say', who: 'player', text: "Where's it going?" },
    cut(PP.single('pip', 'ms')),
    { do: 'say', who: 'pip', text: "Dust Flats. Tansy's there." },
    beat('beat'),
    { do: 'hold', who: 'pip', prop: 'brass-key' },
    { do: 'sfx', id: 'keys', at: 'pip', gain: 0.6, async: true },
    { do: 'give', from: 'pip', to: 'player', prop: 'brass-key', s: 1.2 },
    { do: 'say', who: 'pip', text: "You drive. I'll guard the barrels." },
    cut(PP.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Why me?' },
    cut(PP.single('pip', 'ms')),
    { do: 'say', who: 'pip', text: "Because you're not me. Don't drift." },
    cut(PP.single('player', 'mcu')),
    { do: 'say', who: 'player', text: "I won't." },
    cut(PP.single('pip', 'ms')),
    { do: 'say', who: 'pip', text: 'Okay, drift a little.' },
    // 4. Button: Pip leans on the mower and sounds the horn; the player's flat look.
    { do: 'walk', who: 'player', path: [[6, -331]], speed: 1.2, async: true },
    cut(PP.single('pip', 'ms')),
    { do: 'gesture', who: 'pip', name: 'lean', s: 1.2 },
    { do: 'horn', vehicle: 'mower' },
    ...reaction('player', { toward: 'pip', side: -25, hold: 'pause' }),
  ],
};

/**
 * Chapter 3 closer: dusk at the Dust Flats Overlook. Tansy has the Stopping Stone; the reunion with Pip's resin arm
 * (her first hug, no music); then Vesper's Grand Combine fires up on the horizon. Title: END OF CHAPTER 3.
 */
const TP = coverage('tansy', 'pip', 1);
const TL = coverage('tansy', 'player', 1);
/** Where the hug happens: Pip's mark, with Tansy stopping 0.45 m in front of him. */
const HUG_CENTRE: [number, number] = [277.85, 55.82];

export const TUNDRA_OUTRO: SceneScript = {
  id: 'tundra-outro',
  stage: { kind: 'world' },
  music: 'warm',
  ambience: 'wind',
  direction: { kind: 'chapter-close', notes: 'docs/design/gnome-theft-auto/direction/scenes/tundra-outro.md' },
  actors: [
    { id: 'player', player: true, ...markOf(SAFE, 'player') },
    { id: 'tansy', preset: 'tansy', held: 'stopping-stone', ...markOf(SAFE, 'tansy') },
    { id: 'pip', preset: 'pip', ...markOf(SAFE, 'pip') },
  ],
  vehicles: [
    { id: 'whirligig', ...carMark(SAFE, 'safehouse-whirligig') },
  ],
  props: [
    // The Grand Combine, held back for the threat cut (the picture, not a line).
    { id: 'combine', prefab: 'grand-combine-boss', at: [0, -200], yaw: Math.PI, size: 14, by: 'w', hidden: true },
  ],
  steps: [
    // 1. Hook: Tansy at the map table hears them and turns.
    cut(TL.single('tansy', 'mcu')),
    { do: 'face', who: 'tansy', at: 'player', s: 0.4 },
    { do: 'say', who: 'tansy', text: "You're late." },
    cut(shot('pip', 'ms', { side: -60 })),
    { do: 'say', who: 'pip', text: 'We were cracked. Partially.' },
    // 2. She sees the arm.
    { do: 'face', who: 'tansy', at: 'pip', s: 0.3 },
    cut(TP.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Pip. Your arm is... shiny.' },
    cut(TP.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Kiln-Resin. Shinier, even.' },
    // 3. The hug: the first time Tansy touches anyone. No music; she walks over and stops in front of him.
    { do: 'music', track: null, fade: 0.6 },
    { do: 'hold', who: 'tansy', prop: null },
    cut(shot('tansy', 'ms', { toward: 'pip', side: 40 })),
    { do: 'walk', who: 'tansy', path: [[270, 44], [276, 50], [277.7, 55.65]], speed: 2.4 },
    { do: 'face', who: 'pip', at: 'tansy', s: 0.3, async: true },
    { do: 'wait', s: 0.3 },
    // Side-on, eye level, locked: the two of them in one frame, the hug held through the silence.
    { do: 'cam', shot: { kind: 'cut', pos: up(HUG_CENTRE[0] + 1.75, HUG_CENTRE[1] - 1.5, 1.1), look: up(HUG_CENTRE[0], HUG_CENTRE[1], 0.95), fov: 34 } },
    { do: 'gesture', who: 'tansy', name: 'hug', s: 2.5, async: true },
    { do: 'gesture', who: 'pip', name: 'hug', s: 2.5 },
    beat('silence'),
    // A reaction on Pip, stunned; then Tansy steps back, dry again.
    // Pip's reaction from his own side: Tansy stands between him and the default camera.
    ...reaction('pip', { size: 'cu', side: 90, hold: 'pause' }),
    cut(TP.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: "Don't tell anyone." },
    // 4. The plan: she lifts the Stopping Stone and the music comes back under it.
    { do: 'music', track: 'warm', fade: 1.5 },
    { do: 'hold', who: 'tansy', prop: 'stopping-stone' },
    ...exchangeLooks('tansy', 'player'),
    cut(TL.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Bracken lent us the Stopping Stone. He wants it back uncracked.' },
    cut(TL.single('player', 'mcu')),
    { do: 'say', who: 'player', text: "What's it for?" },
    cut(TL.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: 'Jamming things that shouldn\'t run.' },
    // 5. The turn: a machine horn rolls over the dunes. Everyone looks north-west; cut to the Combine itself.
    { do: 'sfx', id: 'alarm', gain: 0.3 },
    { do: 'shake', amp: 0.05, s: 1.5 },
    { do: 'face', who: 'player', at: [200, 0], s: 0.5, async: true },
    { do: 'face', who: 'pip', at: [200, 0], s: 0.5, async: true },
    { do: 'face', who: 'tansy', at: [200, 0], s: 0.5 },
    { do: 'spawn', id: 'combine' },
    { do: 'cam', shot: { kind: 'cut', pos: up(-14, -226, 1.4), look: up(0, -200, 6), fov: 50 } },
    { do: 'stinger', id: 'villain' },
    { do: 'music', track: 'villain', fade: 1 },
    { do: 'wait', s: 2.5 },
    // 6. Back at the overlook: the acorn, the bad news, and the answer.
    { do: 'walk', who: 'player', path: [[275, 42]], speed: 1.2, async: true },
    { do: 'face', who: 'tansy', at: 'player', s: 0.4 },
    cut(TL.single('tansy', 'mcu')),
    { do: 'say', who: 'tansy', text: "Vesper's put the acorn in the Grand Combine. We can't outdrive that." },
    // Pip turns to the fort and points; Tansy follows his look. Both shot from the fort side of their look.
    { do: 'face', who: 'pip', at: [374, 30], s: 0.4 },
    cut(shot('pip', 'ms', { side: -60 })),
    { do: 'gesture', who: 'pip', name: 'point', s: 1.0 },
    { do: 'say', who: 'pip', text: "Then we don't drive." },
    { do: 'face', who: 'tansy', at: [374, 30], s: 0.5 },
    // She turns to look at the fort: shoot her from the front of that look, not over her shoulder.
    cut(shot('tansy', 'mcu', { side: -60 })),
    { do: 'say', who: 'tansy', text: 'Fort Sandpit has a Whirligig.' },
    { do: 'gesture', who: 'pip', name: 'cheer', s: 1.2, async: true },
    beat('beat'),
    // 7. Button: the threat, not the plan. Back to the Combine, closer now, a slow push-in under the title.
    { do: 'cam', shot: { kind: 'dolly', from: up(-9, -221, 1.0), to: up(-6.5, -214, 1.3), look: up(0, -200, 6), s: 6, fov: 54 } },
    { do: 'sfx', id: 'engine-rev', gain: 0.8 },
    { do: 'title', text: 'END OF CHAPTER 3' },
    { do: 'wait', s: 3 },
    { do: 'title', text: null },
    { do: 'wait', s: 1.5 },
  ],
};

export const CH3C_SCENES: Record<string, SceneScript> = {
  'tundra-intro': TUNDRA_INTRO,
  'tundra-outro': TUNDRA_OUTRO,
};
