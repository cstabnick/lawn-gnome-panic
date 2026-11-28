// Story row 26 "The Knot-Hole": Pip at the bench with nothing in his hands (dusk), the knot-hole (night, silent), the drive
// home with the laugh (night). Notes: docs/design/gnome-theft-auto/direction/scenes/m26-the-knot-hole-{intro,mid,outro}.md
// The vial holds Fescue soil and nothing more is said. Nobody says what lies beyond the Fence. Sorrel's card was row 22's.
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, insert, pushIn, shot } from '../../direct';
import { markOf, spot, up } from './kit';

const heading = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

/** The player and Pip: every shot of them talking stays on one side of the line between them. */
const PIP_AND_ME = coverage('player', 'pip', 1);

const BAY = 'side-valve-bay';
const GAP = 'knot-hole-recording';

// ---- Stage marks --------------------------------------------------------------------------------------------------------
const BAY_PIP = markOf(BAY, 'pip');
const BAY_CAM = markOf(BAY, 'turncoat-cam');
const GAP_SORREL = markOf(GAP, 'sorrel');
const GAP_PIP_FOOT = markOf(GAP, 'pip', 0);
const GAP_PIP_ARRIVE = markOf(GAP, 'pip', 1);
const GAP_PLAYER = markOf(GAP, 'player');
/** The glowing knot in the old fence, where everyone at the gap is looking. */
const KNOT: Vec2 = [-594.4, -120];
/** The back-office door of Side-Valve, in the north face of the concrete block behind the bay. */
const BACK_DOOR: Vec2 = [-150, 78.2];
/** A few steps short of it, where Pip turns to shout his goodnight. */
const DOOR_STEP: Vec2 = [-149.4, 76];

// ---- Intro: nothing in his hands (dusk) ---------------------------------------------------------------------------------
/**
 * Pip on his crate at Side-Valve with a spark plug-sized hole in his evening: nothing to flick, nothing to say. The
 * player is the straight man ("You have been quiet since the tablet"); Cam sweeps the same square of apron behind them
 * and stops when Pip does not answer. Pip asks to be driven to the Fence gap, before he talks himself out of it.
 */
export const M26_THE_KNOT_HOLE_INTRO: SceneScript = {
  id: 'm26-the-knot-hole-intro',
  stage: { kind: 'world' },
  music: 'turfton-dusk',
  ambience: 'street',
  radio: 0.05,
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m26-the-knot-hole-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, at: [-147.2, 73.6], yaw: heading([-147.2, 73.6], BAY_PIP.at) },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: BAY_PIP.at, yaw: heading(BAY_PIP.at, [-147.2, 73.6]), held: null },
    { id: 'cam', preset: 'turncoat cam', at: BAY_CAM.at, yaw: BAY_CAM.yaw },
  ],
  props: [
    // His toolbox, shut and strapped, on the ground at his boot: the one thing he did not put down.
    { id: 'toolbox', prefab: 'glaze-extra-toolbox', at: [-134.2, 75.2], yaw: 0.6, size: 0.55 },
  ],
  steps: [
    // 1. Hook: his hands, drumming on his knee with nothing in them. The sound is the question.
    cut(insert('pip', { toward: 'player' })),
    { do: 'sfx', id: 'tap', at: 'pip', gain: 0.5, async: true },
    { do: 'wait', s: 1.5 },
    { do: 'sfx', id: 'tap', at: 'pip', gain: 0.5, async: true },
    { do: 'wait', s: 0.9 },
    // 2. The bay at dusk: Cam sweeps the same square of apron, Pip is a small shape on a crate.
    cut(spot(BAY, 'wide')),
    { do: 'walk', who: 'cam', path: [[-157, 68], [-153, 68]], speed: 0.9, async: true },
    { do: 'sfx', id: 'rustle', at: 'cam', gain: 0.3, async: true },
    { do: 'wait', s: 2.0 },
    // 3. The player walks up; the straight man's one dry line.
    { do: 'walk', who: 'player', path: [[-140.8, 73.5]], speed: 1.6, async: true },
    cut(PIP_AND_ME.single('player')),
    { do: 'wait', s: 1.2 },
    { do: 'say', who: 'player', text: 'You have been quiet since the tablet.' },
    cut(PIP_AND_ME.single('pip')),
    { do: 'say', who: 'pip', text: 'I am not quiet. I am saving my voice.' },
    beat('tiny'),
    { do: 'say', who: 'pip', text: 'I have a lot of voice.' },
    // 4. Cam stops sweeping: the whole bay has noticed.
    cut(shot('cam', 'mcu')),
    { do: 'face', who: 'cam', at: 'pip', s: 0.4, async: true },
    { do: 'sfx', id: 'clatter', at: 'cam', gain: 0.3, async: true },
    beat('pause'),
    // 5. The turn: Pip's want, said fast so he cannot take it back.
    cut(PIP_AND_ME.single('pip')),
    { do: 'say', who: 'pip', text: 'Sorrel records the rain at the Fence gap tonight. I want to go. Drive me?' },
    cut(PIP_AND_ME.single('player')),
    { do: 'say', who: 'player', text: 'Now?' },
    cut(PIP_AND_ME.single('pip')),
    { do: 'say', who: 'pip', text: 'Before I talk myself out of it. I could. I am very good at it.' },
    // 6. Button: the toolbox in both arms, his eyes on the west; the picture stays on him.
    { do: 'gesture', who: 'pip', name: 'clutch', s: 1.6, async: true },
    { do: 'face', who: 'pip', yaw: -Math.PI / 2, s: 1.2, async: true },
    cut(pushIn('pip', 'ms', 3.4, { to: 'mcu', side: 35 })),
    { do: 'wait', s: 3.4 },
  ],
};

// ---- Mid: the knot-hole (night, silent) ---------------------------------------------------------------------------------
/**
 * Pip stands at the foot of the old fence and lifts his face to the glowing knot while Sorrel's recorder runs. He opens
 * the vial of Fescue soil. He does not pour it. Nobody speaks; there is no music and no joke. The rain is only a sound
 * from the other side of the boards. The player is the witness.
 */
export const M26_THE_KNOT_HOLE_MID: SceneScript = {
  id: 'm26-the-knot-hole-mid',
  stage: { kind: 'world' },
  ambience: 'night',
  radio: 0,
  sky: 'night',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m26-the-knot-hole-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, held: null, at: GAP_PLAYER.at, yaw: heading(GAP_PLAYER.at, KNOT) },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: GAP_PIP_ARRIVE.at, yaw: heading(GAP_PIP_ARRIVE.at, KNOT), held: null },
    { id: 'sorrel', preset: 'sorrel', at: GAP_SORREL.at, yaw: heading(GAP_SORREL.at, KNOT) },
  ],
  steps: [
    // 1. Hook: old cedar creaks; three small figures under a tall fence, a knot glowing high above them.
    cut(spot(GAP, 'wide')),
    { do: 'sfx', id: 'creak', gain: 0.3, async: true },
    { do: 'wait', s: 2.2 },
    // 2. Pip walks the last few paces, slowly, the toolbox in both arms.
    cut(shot('pip', 'fs', { side: -55 })),
    { do: 'sfx', id: 'footsteps', at: 'pip', gain: 0.25, async: true },
    { do: 'walk', who: 'pip', path: [GAP_PIP_FOOT.at], speed: 0.95 },
    { do: 'face', who: 'pip', at: KNOT, s: 0.7 },
    // 3. What he is looking at: the knot, amber in the dark. The far rain comes up under it.
    cut(spot(GAP, 'glow')),
    { do: 'ambience', bed: 'rain', fade: 3 },
    { do: 'sfx', id: 'creak', gain: 0.2, async: true },
    { do: 'wait', s: 2.6 },
    // 4. Sorrel, at her recorder, who has heard this sound before and does not speak over it.
    cut(shot('sorrel', 'mcu', { toward: 'pip' })),
    { do: 'sfx', id: 'latch', at: 'sorrel', gain: 0.3, async: true },
    { do: 'gesture', who: 'sorrel', name: 'nod', s: 0.9, async: true },
    beat('pause'),
    // 5. The vial, out of the toolbox: an insert, then it is in his hand.
    cut(insert('pip', { side: 25 })),
    { do: 'sfx', id: 'latch', at: 'pip', gain: 0.35, async: true },
    { do: 'hold', who: 'pip', prop: 'fescue-vial' },
    { do: 'gesture', who: 'pip', name: 'clutch', s: 1.4, async: true },
    { do: 'sfx', id: 'cloth', at: 'pip', gain: 0.3, async: true },
    { do: 'wait', s: 2.0 },
    // 6. Opened: the stopper comes out. He leans over it, and over the grass at the foot of the fence, and the picture holds.
    cut(shot('pip', 'mcu', { side: -25 })),
    { do: 'sfx', id: 'pop', at: 'pip', gain: 0.4, async: true },
    { do: 'gesture', who: 'pip', name: 'lean', s: 1.8, async: true },
    { do: 'wait', s: 1.4 },
    beat('silence'),
    // 7. The player, who has not moved and does not now.
    cut(PIP_AND_ME.single('player')),
    { do: 'sfx', id: 'cloth', at: 'player', gain: 0.25, async: true },
    { do: 'wait', s: 1.5 },
    // 8. The stopper goes back in. He did not pour it.
    cut(shot('pip', 'cu', { side: 20 })),
    { do: 'sfx', id: 'pop', at: 'pip', gain: 0.3, async: true },
    { do: 'gesture', who: 'pip', name: 'clutch', s: 1.6, async: true },
    { do: 'wait', s: 1.8 },
    // 9. Sorrel puts her headphones back on over the rain; the recorder takes it all.
    cut(shot('sorrel', 'mcu', { toward: 'pip', height: 'low' })),
    { do: 'sfx', id: 'latch', at: 'sorrel', gain: 0.3, async: true },
    { do: 'gesture', who: 'sorrel', name: 'tipHat', s: 1.0, async: true },
    { do: 'wait', s: 1.4 },
    // 10. Button: the wide again, the three of them under the fence.
    cut(spot(GAP, 'wide')),
    { do: 'sfx', id: 'creak', gain: 0.2, async: true },
    { do: 'wait', s: 2.6 },
  ],
};

// ---- Outro: the drive home, with the laugh (night) ----------------------------------------------------------------------
/**
 * Back at Side-Valve and Pip has found his voice, and every word of it is about the engine. The player says one dry
 * thing. Cam's broom stops mid-sweep. Pip walks into the back office still talking, and into the doorframe, which is
 * also flat. The last image is Cam, sweeping the same square.
 */
export const M26_THE_KNOT_HOLE_OUTRO: SceneScript = {
  id: 'm26-the-knot-hole-outro',
  stage: { kind: 'world' },
  music: 'turfton',
  ambience: 'street',
  radio: 0.12,
  sky: 'night',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m26-the-knot-hole-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, held: null, at: [-146, 72.6], yaw: heading([-146, 72.6], [-149.2, 72.4]) },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: [-149.2, 72.4], yaw: heading([-149.2, 72.4], [-146, 72.6]), held: null },
    { id: 'cam', preset: 'turncoat cam', at: [-154.4, 73.8], yaw: heading([-154.4, 73.8], [-149.2, 72.4]) },
  ],
  steps: [
    // 1. Hook: Pip, mid-rant, hands going. The voice is back and it is about an engine.
    cut(PIP_AND_ME.single('pip')),
    { do: 'gesture', who: 'pip', name: 'point', s: 1.4, async: true },
    { do: 'say', who: 'pip', text: 'Flat! The whole way home! A carburettor is a fussy little lung.' },
    cut(PIP_AND_ME.single('player')),
    { do: 'say', who: 'player', text: 'It was fine.' },
    cut(PIP_AND_ME.single('pip', 'ms')),
    { do: 'gesture', who: 'pip', name: 'cheer', s: 1.2, async: true },
    { do: 'say', who: 'pip', text: 'Forty-three flat revs. Or four hundred. I am bad at numbers!' },
    // 2. Cam, mid-sweep, stops and stares: the bay has not heard this much Pip in a day.
    cut(shot('cam', 'mcu')),
    { do: 'face', who: 'cam', at: 'pip', s: 0.4, async: true },
    { do: 'sfx', id: 'clatter', at: 'cam', gain: 0.3, async: true },
    beat('pause'),
    // 3. The starter.
    cut(PIP_AND_ME.single('pip')),
    { do: 'say', who: 'pip', text: 'And the starter! Do not get me started on the starter!' },
    cut(PIP_AND_ME.single('player')),
    { do: 'say', who: 'player', text: 'Goodnight, Pip.' },
    // 4. Pip goes in, still talking over his shoulder, and meets the doorframe. A profile shot from the side, so the
    //    camera is never behind the building and never on the back of his hat.
    { do: 'walk', who: 'pip', path: [DOOR_STEP], speed: 1.7, async: true },
    cut(PIP_AND_ME.single('pip', 'ms')),
    { do: 'wait', s: 2.2 },
    { do: 'face', who: 'pip', at: 'player', s: 0.4 },
    { do: 'say', who: 'pip', text: 'Night! Mind the starter, it is flat!' },
    { do: 'walk', who: 'pip', path: [BACK_DOOR], speed: 1.5, async: true },
    { do: 'cam', shot: { kind: 'cut', pos: up(-146.6, 78.8, 1.1), look: 'pip', fov: 42 } },
    { do: 'wait', s: 1.5 },
    { do: 'sfx', id: 'thud', at: 'pip', gain: 0.5, async: true },
    { do: 'gesture', who: 'pip', name: 'flinch', s: 0.7 },
    { do: 'say', who: 'pip', text: '...Also the doorframe.' },
    // 5. Button: Cam resumes, on exactly the same square of apron.
    cut(shot('cam', 'ms')),
    { do: 'face', who: 'cam', yaw: -Math.PI / 2, s: 0.5, async: true },
    { do: 'walk', who: 'cam', path: [[-157, 73.8], [-153.4, 73.8]], speed: 1.0, async: true },
    { do: 'sfx', id: 'rustle', at: 'cam', gain: 0.35, async: true },
    { do: 'wait', s: 2.8 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm26-the-knot-hole-intro': M26_THE_KNOT_HOLE_INTRO,
  'm26-the-knot-hole-mid': M26_THE_KNOT_HOLE_MID,
  'm26-the-knot-hole-outro': M26_THE_KNOT_HOLE_OUTRO,
};
