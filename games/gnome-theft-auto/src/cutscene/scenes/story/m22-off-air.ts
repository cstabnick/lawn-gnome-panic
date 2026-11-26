// Story row 22 "Off Air": Sorrel's call from her booth (dusk) and the tape on air (night).
// Notes: docs/design/gnome-theft-auto/direction/scenes/m22-off-air-{intro,outro}.md
// Sorrel never says "mower" and never says what the rain is or where it falls. She is introduced here (L105 card).
import type { SceneScript, Vec2 } from '../../script';
import { beat, cut, pushIn, shot } from '../../direct';
import { carMark, markOf, spot, up } from './kit';

const heading = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

// ---- Stage marks (quests/stages/wilds.ts: sorrel-radio-booth; turfton.ts: side-valve-bay) ------------------------------
const BOOTH_SORREL = markOf('sorrel-radio-booth', 'sorrel');
const BOOTH_PLAYER = markOf('sorrel-radio-booth', 'player');
const VAN_EXIT = carMark('sorrel-radio-booth', 'sorrel-radio-booth-exit');
const BAY_PLAYER = markOf('side-valve-bay', 'player');
const BAY_PIP = markOf('side-valve-bay', 'pip');
/** Pip stops at the booth door: the edge of the crates, not inside. */
const DOOR_PIP: Vec2 = [-371, 61];
/** The van's way out: the booth's own getaway path, then east along the west highway. */
const VAN_AWAY: Vec2[] = [[-352, 12], [-322, 20], [-285, 0]];

// ---- Intro: the call (dusk) ------------------------------------------------------------------------------------------
/**
 * The HOA van pulls away from the lay-by with a shoebox of cassettes; in the booth Sorrel pulls her headphones off and
 * tells the player what it took (never what the rain is); Pip, across the map, hears his name and wants nothing to do with
 * it; Sorrel puts the headphones back on. She is introduced here.
 */
export const M22_OFF_AIR_INTRO: SceneScript = {
  id: 'm22-off-air-intro',
  stage: { kind: 'world' },
  music: 'fescue',
  ambience: 'forest',
  radio: 0.12,
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m22-off-air-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, at: BAY_PLAYER.at, yaw: heading(BAY_PLAYER.at, BAY_PIP.at) },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: BAY_PIP.at, yaw: heading(BAY_PIP.at, BAY_PLAYER.at), held: null },
    { id: 'sorrel', preset: 'sorrel', at: BOOTH_SORREL.at, yaw: BOOTH_SORREL.yaw },
  ],
  vehicles: [{ id: 'van', kind: 'hoa-van', at: VAN_EXIT.at, yaw: VAN_EXIT.yaw }],
  props: [
    // Left on the bench by the van crew: the paper that says the tapes are "unlicensed weather".
    { id: 'slip', prefab: 'citation-slip', at: up(-376.4, 49.4, 0.62), yaw: 0.4, size: 0.5, hidden: true },
  ],
  steps: [
    // 1. Hook: the van pulls away down the highway with the tapes. The picture is the first line.
    { do: 'cam', shot: { kind: 'track', pos: up(-336, 4, 2.2), who: 'van', fov: 50 } },
    { do: 'sfx', id: 'engine-rev', at: 'van', gain: 0.45, async: true },
    { do: 'drive', vehicle: 'van', path: VAN_AWAY, speed: 9, arrive: false, async: true },
    { do: 'wait', s: 2.4 },
    // 2. The booth: Sorrel takes her headphones off (tipHat: the hand to the head) and speaks to the player.
    { do: 'spawn', id: 'slip' },
    cut(shot('sorrel', 'mcu', { height: 'eye' })),
    { do: 'sfx', id: 'static', at: 'sorrel', gain: 0.4, async: true },
    { do: 'gesture', who: 'sorrel', name: 'tipHat', s: 1.0, async: true },
    { do: 'say', who: 'sorrel', text: 'This is Sorrel Tillbrook, 88.7 Fescue Public.' },
    { do: 'intro', who: 'sorrel' },
    cut(shot('sorrel', 'ms', { height: 'low', side: -30 })),
    { do: 'say', who: 'sorrel', text: 'The HOA took my tapes this afternoon. They call it unlicensed weather.' },
    // 3. The insert: the tape bank with a gap in it, and the citation left on the bench.
    { do: 'cam', shot: { kind: 'cut', pos: up(-379.4, 47.0, 1.5), look: up(-383.4, 44.6, 0.9), fov: 38 } },
    { do: 'sfx', id: 'paper', at: 'sorrel', gain: 0.4, async: true },
    { do: 'wait', s: 1.8 },
    // The player asks the one question; the answer is the stake.
    cut(shot('player', 'mcu')),
    { do: 'say', who: 'player', text: 'What does the HOA want with rain tapes?' },
    cut(shot('sorrel', 'mcu', { height: 'low' })),
    { do: 'say', who: 'sorrel', text: 'Nothing. They want me quiet.' },
    // 4. The turn: she wants Pip, and says he will not want to come.
    cut(shot('sorrel', 'cu', { side: -20 })),
    { do: 'say', who: 'sorrel', text: 'The van went west. Bring Pip. He knows vans, and he will not want to come.' },
    // 5. Pip, at the bay, hears his name.
    cut(shot('pip', 'mcu')),
    { do: 'sfx', id: 'clatter', at: 'pip', gain: 0.35, async: true },
    { do: 'gesture', who: 'pip', name: 'flinch', s: 0.7, async: true },
    { do: 'say', who: 'pip', text: 'Okay, hear me out. I have never heard of west.' },
    // 6. Button: Sorrel, headphones back on, says the one thing she needs.
    cut(shot('sorrel', 'cu')),
    { do: 'gesture', who: 'sorrel', name: 'tipHat', s: 0.8, async: true },
    beat('tiny'),
    { do: 'say', who: 'sorrel', text: 'Bring me my rain.' },
    beat('beat'),
  ],
};

// ---- Outro: the tape on air (night) ----------------------------------------------------------------------------------
/**
 * The tapes are home. Sorrel loads one and plays it on the air: the rain fills 88.7 (the sound is the payoff, never an
 * explanation), Pip stands silent at the door, and she asks the player to meet the Elder. Ends on Pip.
 */
export const M22_OFF_AIR_OUTRO: SceneScript = {
  id: 'm22-off-air-outro',
  stage: { kind: 'world' },
  music: 'fescue',
  ambience: 'night',
  radio: 0.1,
  sky: 'night',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m22-off-air-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, at: BOOTH_PLAYER.at, yaw: BOOTH_PLAYER.yaw },
    { id: 'sorrel', preset: 'sorrel', at: BOOTH_SORREL.at, yaw: BOOTH_SORREL.yaw },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: DOOR_PIP, yaw: heading(DOOR_PIP, BOOTH_SORREL.at), held: null },
  ],
  props: [
    // Two porcelain lanterns on the crates: the booth is lit like a stage in the dark wood.
    { id: 'lamp-a', prefab: 'porcelain-lantern', at: [-369.4, 56], yaw: 0, size: 0.9 },
    { id: 'lamp-b', prefab: 'porcelain-lantern', at: [-380.6, 45.5], yaw: 0, size: 0.9 },
  ],
  steps: [
    // 1. Hook: the tape goes into the deck.
    { do: 'cam', shot: spot('sorrel-radio-booth', 'close') },
    { do: 'sfx', id: 'latch', at: 'sorrel', gain: 0.5, async: true },
    { do: 'gesture', who: 'sorrel', name: 'lean', s: 1.2, async: true },
    { do: 'wait', s: 1.4 },
    // 2. Sorrel to the player, dry.
    cut(shot('sorrel', 'mcu')),
    { do: 'say', who: 'sorrel', text: 'They filed it under crime. I filed it under rain.' },
    // 3. Play: the rain comes up under the wood, then fills the dial.
    { do: 'cam', shot: { kind: 'cut', pos: up(-377.6, 45.4, 1.5), look: up(-376, 49.6, 1.0), fov: 36 } },
    { do: 'sfx', id: 'tap', at: 'sorrel', gain: 0.5, async: true },
    { do: 'sfx', id: 'static', at: 'sorrel', gain: 0.4, async: true },
    { do: 'music', track: null, fade: 0.8 },
    { do: 'ambience', bed: 'rain', fade: 2.5 },
    { do: 'radio', level: 0.5 },
    { do: 'wait', s: 2.0 },
    // 4. Pip at the door, silent, listening.
    cut(shot('pip', 'mcu', { toward: 'sorrel' })),
    { do: 'gesture', who: 'pip', name: 'think', s: 2.2, async: true },
    beat('silence'),
    // 5. The booth in the rain: the picture holds while it plays.
    cut(spot('sorrel-radio-booth', 'wide')),
    { do: 'sfx', id: 'thunder', at: 'sorrel', gain: 0.3, async: true },
    { do: 'wait', s: 2.2 },
    // 6. The turn: the Elder wants them both.
    cut(shot('sorrel', 'mcu', { height: 'low' })),
    { do: 'say', who: 'sorrel', text: 'Elder Bracken is waiting at the Hollow. Take Pip with you.' },
    // 7. Button: a slow push-in on Pip, who has nothing to say.
    cut(pushIn('pip', 'ms', 3.5, { toward: 'sorrel' })),
    { do: 'wait', s: 3.5 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm22-off-air-intro': M22_OFF_AIR_INTRO,
  'm22-off-air-outro': M22_OFF_AIR_OUTRO,
};
