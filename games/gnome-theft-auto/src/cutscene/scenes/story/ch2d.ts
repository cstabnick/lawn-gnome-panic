// Chapter 2 story scenes, fourth file: the Cracked Tablet (intro and outro; E20 row 23 rewrite).
// Every id here is played by quest ch2-unmowed-tablet (quests/story/23-unmowed-tablet.ts) and checked by scenes.test.ts.
// Rewrite: Sorrel is in the hollow from the start (row 22 brought her and Pip west), Bracken gets his intro card, and the
// outro ends on the tablet and Pip's silence: Cam's tin-can call to Vesper moved to row 34's outro.
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut } from '../../direct';
import { markOf, up } from './kit';

/** Heading (radians, 0 = +z, PI/2 = +x) from `a` towards `b`. */
function heading(a: Vec2, b: Vec2): number {
  return Math.atan2(b[0] - a[0], b[1] - a[1]);
}

const HOLLOW_BRACKEN = markOf('unmowed-hollow', 'bracken');
const HOLLOW_SORREL = markOf('unmowed-hollow', 'sorrel');
const RIG_AT: Vec2 = [-320, 20];
const RIG_STOP: Vec2 = [-325, 22];
const PIP_HOLLOW: Vec2 = [-341, 41];
/** Bracken and Pip: every shot of their exchange on one side of their line. */
const BP = coverage('bracken', 'pip', 1);
/** Bracken and Sorrel: one side of their line for the whole explanation. */
const BS = coverage('bracken', 'sorrel', 1);

// ---- 4. The Cracked Tablet (intro, giver unmowed-hollow, exit (-345, 34)) ------------------------------------------------

/**
 * Dusk in the hollow. Elder Bracken calls Pip out as a Potsworth and is introduced; Sorrel (who brought them west) steps
 * in; the cracked tablet, and beside it the Stopping Stone, shows that only a Fescue Stopping Stone can jam the Grand
 * Combine. The player is sent to clear the welders at the Compost Heap.
 * Notes: docs/design/gnome-theft-auto/direction/scenes/tablet-intro.md.
 */
export const TABLET_INTRO: SceneScript = {
  id: 'tablet-intro',
  stage: { kind: 'world' },
  music: 'fescue',
  ambience: 'forest',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/tablet-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, at: [-344, 38], yaw: heading([-344, 38], HOLLOW_BRACKEN.at), hidden: true },
    { id: 'bracken', preset: 'bracken', at: HOLLOW_BRACKEN.at, yaw: HOLLOW_BRACKEN.yaw, held: null },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: PIP_HOLLOW, yaw: heading(PIP_HOLLOW, HOLLOW_BRACKEN.at) },
    { id: 'sorrel', preset: 'sorrel', at: HOLLOW_SORREL.at, yaw: heading(HOLLOW_SORREL.at, HOLLOW_BRACKEN.at) },
  ],
  props: [
    { id: 'tablet', prefab: 'stone-plaque', at: [-355, 39], yaw: 0, size: 0.5, hidden: true },
    // The Stopping Stone lies beside the tablet: its shape is what the finale rhymes with.
    { id: 'stone', prefab: 'stopping-stone', at: [-352.6, 38.2], yaw: 0, size: 0.6, hidden: true },
  ],
  steps: [
    // 1. Hook: Bracken rises on a low medium close-up and accuses, facing the camera. Then his card.
    cut(BP.single('bracken', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'bracken', name: 'stand', s: 0.4 },
    { do: 'say', who: 'bracken', text: 'A Potsworth in Mossy Wood, reeking of Black Dew!', hz: 76 },
    { do: 'intro', who: 'bracken', s: 2.8 },
    // 2. Pip takes it: he slumps, and says nothing.
    cut(BP.single('pip', 'mcu')),
    { do: 'gesture', who: 'pip', name: 'slump', s: 1.1, async: true },
    beat('pause'),
    // 3. Two short lines about Wendel, still on Bracken: Pip is told he ran from Fescue.
    cut(BP.single('bracken', 'mcu', { height: 'low' })),
    { do: 'say', who: 'bracken', text: 'Cousin Wendel runs Fescue. You ran.', hz: 76 },
    { do: 'say', who: 'bracken', text: 'You traded the old soil for Stink-Gro and engines.', hz: 76 },
    // 4. Sorrel, who brought them, steps in between the two of them.
    cut(BS.single('sorrel', 'mcu')),
    { do: 'sfx', id: 'rustle', at: 'sorrel', gain: 0.4, async: true },
    { do: 'say', who: 'sorrel', text: 'Steady, Elder. Show them the tablet.', hz: 122 },
    // 5. The insert: the tablet and the Stopping Stone, before anyone explains them.
    { do: 'spawn', id: 'tablet' },
    { do: 'spawn', id: 'stone' },
    { do: 'sfx', id: 'thud', at: 'stone', gain: 0.3, async: true },
    { do: 'cam', shot: { kind: 'dolly', from: up(-348.5, 30.5, 2.2), to: up(-348, 31.5, 2.0), look: up(-354.2, 38.6, 0.6), s: 2.6, fov: 42 } },
    { do: 'wait', s: 2.6 },
    // 6. Sorrel explains the copy; Bracken explains the jam.
    cut(BS.single('sorrel', 'mcu')),
    { do: 'say', who: 'sorrel', text: 'Vesper\'s Grand Combine is copied from Fescue\'s original.', hz: 122 },
    { do: 'say', who: 'sorrel', text: 'The one in the Shed, three thousand years old.', hz: 122 },
    cut(BS.single('bracken', 'ms', { height: 'low' })),
    { do: 'say', who: 'bracken', text: 'Only a Fescue Stopping Stone can jam it.', hz: 76 },
    { do: 'say', who: 'bracken', text: 'Clear his welders at the Compost Heap. Bring their rig here.', hz: 76 },
    // 7. Button: Sorrel, gently, on her close shot: the plates are heavy, and so is the tablet. No gag.
    cut(BS.single('sorrel', 'cu')),
    { do: 'say', who: 'sorrel', text: 'Go carefully. It is heavier than it looks.', hz: 122 },
  ],
};

// ---- 5. The Cracked Tablet, end (the player arrives in the armoured Ride-On) ----------------------------------------------

/**
 * The armoured rig rolls into the hollow and the jokes stop: Bracken reads the tablet and lays the Stopping Stone by it, so
 * its shape shows; Pip asks the sincere question; the silence; Sorrel's hook to the Elder's next stone. The scene ends on the
 * tablet and then on Pip, silent, with no music and no gag. Cam's call to Vesper is no longer here (it is row 34's outro).
 * Notes: docs/design/gnome-theft-auto/direction/scenes/tablet-outro.md.
 */
export const TABLET_OUTRO: SceneScript = {
  id: 'tablet-outro',
  stage: { kind: 'world' },
  music: 'fescue',
  ambience: 'forest',
  radio: 0.15,
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/tablet-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, at: RIG_AT, yaw: heading(RIG_AT, RIG_STOP), seatedIn: 'ride' },
    { id: 'bracken', preset: 'bracken', at: HOLLOW_BRACKEN.at, yaw: HOLLOW_BRACKEN.yaw, held: null },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: PIP_HOLLOW, yaw: heading(PIP_HOLLOW, HOLLOW_BRACKEN.at) },
    { id: 'sorrel', preset: 'sorrel', at: HOLLOW_SORREL.at, yaw: HOLLOW_SORREL.yaw },
  ],
  vehicles: [{ id: 'ride', from: 'player', kind: 'ride-on', at: RIG_AT, yaw: heading(RIG_AT, RIG_STOP) }],
  props: [
    { id: 'tablet', prefab: 'stone-plaque', at: [-355, 39], yaw: 0, size: 0.5, hidden: true },
    { id: 'stone', prefab: 'stopping-stone', at: [-352.6, 38.2], yaw: 0, size: 0.6, hidden: true },
  ],
  steps: [
    // 1. Hook: the armoured rig rolls into the hollow. No narration: the picture is the line.
    { do: 'cam', shot: { kind: 'track', pos: up(-322, 26, 2.2), who: 'ride', fov: 50 } },
    { do: 'sfx', id: 'engine-rev', at: 'ride', gain: 0.4, async: true },
    { do: 'drive', vehicle: 'ride', path: [RIG_AT, RIG_STOP], speed: 8 },
    { do: 'sfx', id: 'latch', at: 'ride', gain: 0.5, async: true },
    { do: 'exit', who: 'player' },
    { do: 'cam', shot: { kind: 'track', pos: up(-334, 30, 1.8), who: 'player', fov: 50 } },
    { do: 'walk', who: 'player', path: [[-347, 34]], run: true },
    // 2. The sincere beat starts: Bracken holds the Stopping Stone up, a low close shot.
    { do: 'hold', who: 'bracken', prop: 'stopping-stone' },
    cut(BP.single('bracken', 'mcu', { height: 'low' })),
    { do: 'stinger', id: 'sad' },
    { do: 'music', track: 'sad', fade: 1 },
    { do: 'gesture', who: 'bracken', name: 'handsUp', s: 1.6, async: true },
    { do: 'say', who: 'bracken', text: 'The Stopping Stone. It was made to hold back the Grand Combine, and it will.', hz: 76 },
    // 3. He reads the tablet: the stone is laid beside it and the two shapes are the same shape.
    { do: 'hold', who: 'bracken', prop: null },
    { do: 'spawn', id: 'tablet' },
    { do: 'spawn', id: 'stone' },
    { do: 'sfx', id: 'thud', at: 'stone', gain: 0.3, async: true },
    { do: 'cam', shot: { kind: 'dolly', from: up(-348.5, 30.5, 2.2), to: up(-348.2, 31.4, 2.0), look: up(-354.2, 38.6, 0.6), s: 2.6, fov: 42 } },
    { do: 'wait', s: 2.6 },
    // 4. Pip, quiet, facing the camera: the first sincere question of the game.
    cut(BP.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Wait... they\'re really gonna level the whole lawn?' },
    // 5. Bracken answers; then the held silence (music out, ambience only).
    cut(BP.single('bracken', 'mcu')),
    { do: 'say', who: 'bracken', text: 'They have done it before. Long ago. To us.', hz: 76 },
    { do: 'music', track: null, fade: 0.6 },
    beat('silence'),
    // 6. Sorrel's hook, said gently: the Elder's replica stone, the next job.
    cut(BS.single('sorrel', 'mcu')),
    { do: 'say', who: 'sorrel', text: 'The Elder has another stone on his mind. Come back for it.', hz: 122 },
    // 7. The last two images, wordless and with no music: the tablet, then Pip.
    { do: 'cam', shot: { kind: 'dolly', from: up(-350.4, 33.8, 1.5), to: up(-351.6, 35.4, 1.2), look: up(-354.2, 38.6, 0.5), s: 3.0, fov: 40 } },
    { do: 'sfx', id: 'creak', at: 'stone', gain: 0.25, async: true },
    { do: 'wait', s: 3.0 },
    cut(BP.single('pip', 'ms', { height: 'eye' })),
    { do: 'gesture', who: 'pip', name: 'slump', s: 1.6, async: true },
    { do: 'wait', s: 3.2 },
  ],
};

export const CH2D_SCENES: Record<string, SceneScript> = {
  'tablet-intro': TABLET_INTRO,
  'tablet-outro': TABLET_OUTRO,
};
