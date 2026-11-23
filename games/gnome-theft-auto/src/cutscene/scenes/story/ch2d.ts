// Chapter 2 story scenes, fourth file: the Cracked Tablet (intro and the chapter 2 closer).
// Owner: the Story A re-direction lane (docs/roadmaps/gta-redirect-story-a.md). Every id here is played by a quest in quests/chapter2.ts and checked by scenes.test.ts.
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut } from '../../direct';
import { carMark, markOf, rideOf, spot, up } from './kit';

/** Heading (radians, 0 = +z, PI/2 = +x) from `a` towards `b`. */
function heading(a: Vec2, b: Vec2): number {
  return Math.atan2(b[0] - a[0], b[1] - a[1]);
}

const TURNCOAT_LOOK = { hat: 0xf4f4f8, shirt: 0xc9b99b };

const HOLLOW_BRACKEN = markOf('unmowed-hollow', 'bracken');
const HOLLOW_SORREL = markOf('unmowed-hollow', 'sorrel');
const BOOTH_SORREL = markOf('sorrel-radio-booth', 'sorrel');
const CAM_MARK = markOf('side-valve-bay', 'turncoat-cam');
const RIG_AT: Vec2 = [-320, 20];
const RIG_STOP: Vec2 = [-325, 22];
const PIP_HOLLOW: Vec2 = [-341, 41];
/** Bracken and Pip: every shot of their exchange on one side of their line. */
const BP = coverage('bracken', 'pip', 1);
/** Bracken and Sorrel: one side of their line for the whole explanation. */
const BS = coverage('bracken', 'sorrel', 1);

// ---- 4. The Cracked Tablet (intro, giver unmowed-hollow, exit (-345, 34)) ------------------------------------------------

/**
 * Elder Bracken calls Pip out as a Potsworth; Sorrel steps in from the hollow's edge; the cracked tablet, and beside it the
 * Stopping Stone, shows that only a Fescue Stopping Stone can jam the Grand Combine. The player is sent to clear the
 * welders at the Compost Heap. Notes: docs/design/gnome-theft-auto/direction/scenes/tablet-intro.md.
 */
export const TABLET_INTRO: SceneScript = {
  id: 'tablet-intro',
  stage: { kind: 'world' },
  music: 'fescue',
  ambience: 'forest',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/tablet-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, at: [-344, 38], yaw: heading([-344, 38], HOLLOW_BRACKEN.at), hidden: true },
    { id: 'bracken', preset: 'bracken', at: HOLLOW_BRACKEN.at, yaw: HOLLOW_BRACKEN.yaw, held: null },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: PIP_HOLLOW, yaw: heading(PIP_HOLLOW, HOLLOW_BRACKEN.at) },
    { id: 'sorrel', preset: 'sorrel', at: BOOTH_SORREL.at, yaw: BOOTH_SORREL.yaw },
  ],
  props: [
    { id: 'tablet', prefab: 'stone-plaque', at: [-355, 39], yaw: 0, size: 0.5, hidden: true },
    // The Stopping Stone lies beside the tablet: its shape is what the finale rhymes with.
    { id: 'stone', prefab: 'stopping-stone', at: [-352.6, 38.2], yaw: 0, size: 0.6, hidden: true },
  ],
  steps: [
    // 1. Hook: Bracken rises on a low medium close-up and accuses, facing the camera.
    cut(BP.single('bracken', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'bracken', name: 'stand', s: 0.4 },
    { do: 'say', who: 'bracken', text: 'A Potsworth in Mossy Wood, reeking of Black Dew!', hz: 76 },
    // 2. Pip takes it: he slumps, and says nothing.
    cut(BP.single('pip', 'mcu')),
    { do: 'gesture', who: 'pip', name: 'slump', s: 1.1, async: true },
    beat('pause'),
    // 3. Two short lines about Wendel, still on Bracken.
    cut(BP.single('bracken', 'mcu', { height: 'low' })),
    { do: 'say', who: 'bracken', text: 'Cousin Wendel runs Fescue. You ran.', hz: 76 },
    { do: 'say', who: 'bracken', text: 'You traded the old soil for Stink-Gro and engines.', hz: 76 },
    // 4. Sorrel's booth (she stands, pulls her headphones off), then she is in the hollow, stepping in.
    { do: 'cam', shot: spot('sorrel-radio-booth', 'two-shot') },
    { do: 'gesture', who: 'sorrel', name: 'stand', s: 1.2 },
    { do: 'despawn', id: 'sorrel' },
    { do: 'spawn', id: 'sorrel', at: HOLLOW_SORREL.at, yaw: HOLLOW_SORREL.yaw },
    cut(BS.single('sorrel', 'mcu')),
    { do: 'say', who: 'sorrel', text: 'Steady, Elder. Show them the tablet.', hz: 122 },
    // 5. The insert: the tablet and the Stopping Stone, before anyone explains them.
    { do: 'spawn', id: 'tablet' },
    { do: 'spawn', id: 'stone' },
    { do: 'cam', shot: { kind: 'dolly', from: up(-348.5, 30.5, 2.2), to: up(-348, 31.5, 2.0), look: up(-354.2, 38.6, 0.6), s: 2.6, fov: 42 } },
    { do: 'wait', s: 2.6 },
    // 6. Sorrel explains the copy; Bracken explains the jam.
    cut(BS.single('sorrel', 'mcu')),
    { do: 'say', who: 'sorrel', text: 'Vesper\'s Grand Combine is copied from Fescue\'s original.', hz: 122 },
    { do: 'say', who: 'sorrel', text: 'The one in the Shed, three thousand years old.', hz: 122 },
    cut(BS.single('bracken', 'ms', { height: 'low' })),
    { do: 'say', who: 'bracken', text: 'Only a Fescue Stopping Stone can jam it.', hz: 76 },
    { do: 'say', who: 'bracken', text: 'Clear his welders at the Compost Heap. Bring their rig here.', hz: 76 },
    // 7. Button: Sorrel's dry schedule aside on her close shot.
    cut(BS.single('sorrel', 'cu')),
    { do: 'say', who: 'sorrel', text: 'After this, 88.7 is playing forty-five minutes of rain on terracotta.', hz: 122 },
  ],
};

// ---- 5. The Cracked Tablet, end (chapter 2 closer; the player arrives in the armoured Ride-On) --------------------------

/**
 * The armoured rig rolls into the hollow and the jokes stop: Bracken holds up the Stopping Stone, Pip asks the sincere
 * question, the silence. Sorrel's errand hook, then the cut to the Side-Valve bay at night: Turncoat Cam on the tin-can
 * phone, one look of envy at Pip's racer, and the chapter's cliffhanger. Notes:
 * docs/design/gnome-theft-auto/direction/scenes/tablet-outro.md.
 */
export const TABLET_OUTRO: SceneScript = {
  id: 'tablet-outro',
  stage: { kind: 'world' },
  music: 'fescue',
  ambience: 'forest',
  radio: 0.15,
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/tablet-outro.md', kind: 'chapter-close' },
  actors: [
    { id: 'player', player: true, at: RIG_AT, yaw: heading(RIG_AT, RIG_STOP), seatedIn: 'ride' },
    { id: 'bracken', preset: 'bracken', at: HOLLOW_BRACKEN.at, yaw: HOLLOW_BRACKEN.yaw, held: null },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: PIP_HOLLOW, yaw: heading(PIP_HOLLOW, HOLLOW_BRACKEN.at) },
    { id: 'sorrel', preset: 'sorrel', at: HOLLOW_SORREL.at, yaw: HOLLOW_SORREL.yaw },
    { id: 'turncoat', look: TURNCOAT_LOOK, name: 'Turncoat Cam', at: CAM_MARK.at, yaw: CAM_MARK.yaw, hidden: true },
  ],
  vehicles: [
    { id: 'ride', from: 'player', kind: 'ride-on', at: RIG_AT, yaw: heading(RIG_AT, RIG_STOP) },
    // Pip's red Zero-Turn on the bay apron: Cam's envy is planted on it before he speaks.
    { id: 'pip-ride', ...rideOf('pip'), ...carMark('side-valve-bay', 'pip-zero-turn') },
  ],
  props: [
    { id: 'lamp', prefab: 'porcelain-lantern', at: [-159, 71], yaw: 0, size: 1.2, hidden: true },
  ],
  steps: [
    // 1. Hook: the armoured rig rolls into the hollow. No narration: the picture is the line.
    { do: 'cam', shot: { kind: 'track', pos: up(-322, 26, 2.2), who: 'ride', fov: 50 } },
    { do: 'drive', vehicle: 'ride', path: [RIG_AT, RIG_STOP], speed: 8 },
    { do: 'exit', who: 'player' },
    { do: 'cam', shot: { kind: 'track', pos: up(-334, 30, 1.8), who: 'player', fov: 50 } },
    { do: 'walk', who: 'player', path: [[-347, 34]], run: true },
    // 2. The sincere beat starts: Bracken on the Stopping Stone, a low close shot.
    { do: 'hold', who: 'bracken', prop: 'stopping-stone' },
    cut(BP.single('bracken', 'mcu', { height: 'low' })),
    { do: 'stinger', id: 'sad' },
    { do: 'music', track: 'sad', fade: 1 },
    { do: 'gesture', who: 'bracken', name: 'handsUp', s: 1.6, async: true },
    { do: 'say', who: 'bracken', text: 'The Stopping Stone. It was made to hold back the Grand Combine, and it will.', hz: 76 },
    // 3. Pip, quiet, facing the camera: the first sincere question of the game.
    cut(BP.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Wait... they\'re really gonna level the whole lawn?' },
    // 4. Bracken answers; then the held silence (music out, ambience only).
    cut(BP.single('bracken', 'mcu')),
    { do: 'say', who: 'bracken', text: 'They have done it before. Long ago. To us.', hz: 76 },
    { do: 'music', track: null, fade: 0.6 },
    beat('silence'),
    // 5. Sorrel's errand hook, said gently: it opens a side quest.
    cut(BS.single('sorrel', 'mcu')),
    { do: 'say', who: 'sorrel', text: 'The Elder has another stone on his mind. Come back for it.', hz: 122 },
    // 6. The threat: the bay at night, Cam, the tin-can phone, and Pip's racer in the frame.
    { do: 'music', track: 'tension', fade: 1.2 },
    { do: 'ambience', bed: 'rain', fade: 1.5 },
    { do: 'spawn', id: 'turncoat', at: CAM_MARK.at },
    { do: 'spawn', id: 'lamp' },
    { do: 'hold', who: 'turncoat', prop: 'tin-can-phone' },
    cut(spot('side-valve-bay', 'wide')),
    { do: 'wait', s: 2.0 },
    { do: 'cam', shot: { kind: 'cut', pos: up(-146, 62, 1.6), look: up(-145, 69.5, 1.2), fov: 46 } },
    { do: 'wait', s: 0.6 },
    // Cam looks at the racer for a held beat (the plant for his motive).
    { do: 'face', who: 'turncoat', at: [-134, 70], s: 0.6 },
    { do: 'wait', s: 1.6 },
    // The push-in: Cam faces the camera as he talks, low and alone in frame.
    { do: 'cam', shot: { kind: 'dolly', from: up(-152, 65, 1.6), to: up(-153.5, 66.5, 1.5), look: 'turncoat', s: 4.5, fov: 44 } },
    { do: 'say', who: 'turncoat', text: 'It\'s Cam, at Tansy\'s. The acorn\'s under the bench. Tuesday. The charter\'s mine.' },
    { do: 'stinger', id: 'villain' },
    { do: 'music', track: 'villain', fade: 1.2 },
    { do: 'say', who: 'Vesper Thorne', text: 'Of course, Cameron.', hz: 92 },
    { do: 'wait', s: 1.5 },
    { do: 'title', text: 'END OF CHAPTER 2' },
    { do: 'wait', s: 2.5 },
    { do: 'title', text: null },
  ],
};

export const CH2D_SCENES: Record<string, SceneScript> = {
  'tablet-intro': TABLET_INTRO,
  'tablet-outro': TABLET_OUTRO,
};
