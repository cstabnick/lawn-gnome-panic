// Story row 10 (m10-under-the-span): Under the Span. Three scenes: Pip circling the bench at Side-Valve Salvage, Hogweed's
// yard under the Unfinished Span (the Dewdrop rolls past, Grout brings the citation), and Pip hiding the jammer in a toolbox.
// Notes: docs/design/gnome-theft-auto/direction/scenes/under-the-span-{intro,mid,outro}.md. Played by quests/story/10-under-the-span.ts.
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, reaction, shot } from '../../direct';
import { markOf, up } from './kit';

const SV = 'side-valve-bay';
const UNDERSPAN = 'hogweed';
const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

// ---- Side-Valve Salvage (intro, outro) ------------------------------------------------------------------------------------
const SV_PLAYER = markOf(SV, 'player');
const SV_CAM = markOf(SV, 'turncoat-cam');
/** Pip's circuit of the workbench (its footprint is x -159.1..-156.9, z 75.4..76.6), clear of the pail and the crates. */
const BENCH_LAP: Vec2[] = [[-155.4, 73.6], [-154.2, 75.6], [-155.8, 78.6], [-158.6, 79.2], [-161.4, 77.4], [-161.2, 74.4], [-158.6, 73.2]];
const PIP_START: Vec2 = BENCH_LAP[6];
const PIP_BY_BENCH: Vec2 = [-157.4, 73.6];
const SV_TALK = coverage('pip', 'player', 1);

/** Under the Span, scene 1: Pip circles the bench, cannot say what the jammer is for, and sends the player to Hogweed. */
export const UNDER_THE_SPAN_INTRO: SceneScript = {
  id: 'under-the-span-intro',
  stage: { kind: 'world' },
  music: 'turfton',
  ambience: 'street',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/under-the-span-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, at: SV_PLAYER.at, yaw: towards(SV_PLAYER.at, PIP_START) },
    { id: 'pip', preset: 'pip', at: PIP_START, yaw: towards(PIP_START, BENCH_LAP[0]) },
    { id: 'cam', preset: 'turncoat cam', name: 'Cam', at: SV_CAM.at, yaw: SV_CAM.yaw },
  ],
  steps: [
    // Hook: Pip on his lap of the bench, the radio on the bench hissing at him.
    cut(SV_TALK.single('pip', 'ms')),
    { do: 'sfx', id: 'static', at: up(-158, 76, 1), gain: 0.6, async: true },
    { do: 'walk', who: 'pip', path: BENCH_LAP.slice(0, 5), speed: 2.2, async: true },
    { do: 'say', who: 'pip', text: 'Radio jammer, radio jammer. Where does a gnome even get a radio jammer?' },
    // The player's flat question; Pip stops dead on the answer.
    { do: 'walk', who: 'pip', path: [BENCH_LAP[5], BENCH_LAP[6], PIP_BY_BENCH], speed: 2.4 },
    { do: 'face', who: 'pip', at: 'player', s: 0.3, async: true },
    { do: 'face', who: 'player', at: 'pip', s: 0.3 },
    cut(SV_TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'What are you jamming?' },
    cut(SV_TALK.single('pip', 'mcu')),
    { do: 'sfx', id: 'keys', at: 'pip', gain: 0.5, async: true },
    { do: 'say', who: 'pip', text: 'Nothing! Birds. It is totally legal. Do not tell Tansy.' },
    ...reaction('player', { size: 'mcu', hold: 'pause' }),
    // The turn: the job, in his own run-on.
    cut(SV_TALK.single('pip', 'ms')),
    { do: 'gesture', who: 'pip', name: 'point', s: 1.4, async: true },
    { do: 'say', who: 'pip', text: 'Hogweed Sprocket, under the Unfinished Span, builds anything for scrap!' },
    { do: 'say', who: 'pip', text: 'Three scrap bins downtown. Spring, bolt, panel. Bring him those.' },
    cut(SV_TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'What is it really for?' },
    // Button: he answers by lapping the bench faster; Cam stops sweeping to watch.
    cut(SV_TALK.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: '...Birds.' },
    { do: 'sfx', id: 'clatter', at: 'pip', gain: 0.5, async: true },
    { do: 'walk', who: 'pip', path: [BENCH_LAP[0], BENCH_LAP[1], BENCH_LAP[2], BENCH_LAP[3]], run: true, async: true },
    { do: 'cam', shot: { kind: 'track', pos: up(-150, 70, 1.9), who: 'pip', fov: 50 } },
    { do: 'face', who: 'cam', at: 'pip', s: 0.6 },
    { do: 'wait', s: 2.2 },
  ],
};

// ---- The Underspan (mid) --------------------------------------------------------------------------------------------------
const HOGWEED = markOf(UNDERSPAN, 'hogweed');
const UNDER_PLAYER = markOf(UNDERSPAN, 'player');
/** The Dewdrop's run across the yard (z -30 is clear from wall to wall of the site, x 560..600). */
const DEWDROP_RUN: Vec2[] = [[563, -30], [583, -30], [598, -30]];
const GROUT_IN: Vec2[] = [[567, -12], [575.5, -14.5]];
const HOG_TALK = coverage('hogweed', 'player', 1);
const GROUT_TALK = coverage('grout', 'hogweed', -1);

/** Under the Span, scene 2: the parts for the jammer; the Dewdrop rolls past with a gnome running in it; Grout's citation. */
export const UNDER_THE_SPAN_MID: SceneScript = {
  id: 'under-the-span-mid',
  stage: { kind: 'world' },
  music: 'turfton',
  ambience: 'wind',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/under-the-span-mid.md', kind: 'arrival' },
  actors: [
    { id: 'player', player: true, at: UNDER_PLAYER.at, yaw: UNDER_PLAYER.yaw },
    { id: 'hogweed', preset: 'hogweed', at: HOGWEED.at, yaw: HOGWEED.yaw },
    { id: 'tester', name: 'Tester', look: { hat: 0xe0b020, shirt: 0x3d5a80, glasses: true }, hz: 150, hidden: true, seatedIn: 'dewdrop', at: [0, 0] },
    { id: 'grout', preset: 'grout', held: 'brass-wrench', hidden: true, at: GROUT_IN[0], yaw: towards(GROUT_IN[0], GROUT_IN[1]) },
  ],
  vehicles: [{ id: 'dewdrop', kind: 'bubble-mobile', at: DEWDROP_RUN[0], yaw: Math.PI / 2, hidden: true }],
  props: [
    { id: 'citation', prefab: 'citation-slip', at: up(579, -21.2, 0), yaw: -0.5, size: 1.1, by: 'h', hidden: true },
  ],
  steps: [
    // Establishing: the underside of the Span is the roof; a slow dolly along the yard, looking up at the concrete.
    { do: 'cam', shot: { kind: 'dolly', from: up(571, -25, 0.6), to: up(577, -25, 0.6), look: up(607, -25, 9), s: 2.8, fov: 58 } },
    { do: 'sfx', id: 'static', at: 'hogweed', gain: 0.4, async: true },
    { do: 'wait', s: 2.8 },
    // Hogweed, breathless, three ideas at once. First story appearance: his card after the line.
    cut(HOG_TALK.single('hogweed', 'ms')),
    { do: 'say', who: 'hogweed', text: 'Parts! Springs, bolts, panels! Oh you wonderful, is that a bolt?' },
    { do: 'intro', who: 'hogweed' },
    // The trade: the three parts go over, the jammer comes back.
    cut(HOG_TALK.two('ms')),
    { do: 'sfx', id: 'clatter', at: 'hogweed', gain: 0.6, async: true },
    { do: 'give', from: 'player', to: 'hogweed', prop: 'mower-scrap-spring', s: 1 },
    { do: 'give', from: 'hogweed', to: 'player', prop: 'radio-jammer', s: 1 },
    cut(HOG_TALK.single('hogweed', 'mcu')),
    { do: 'say', who: 'hogweed', text: 'It jams radios. Mostly. Ask Pip about Fescue for me. He changes subjects beautifully.' },
    ...reaction('player', { size: 'mcu', hold: 'pause' }),
    // The turn: something rolls through the yard, a gnome running flat out inside it.
    { do: 'spawn', id: 'dewdrop' },
    { do: 'spawn', id: 'tester' },
    { do: 'sfx', id: 'whoosh', at: 'dewdrop', gain: 0.6, async: true },
    { do: 'cam', shot: { kind: 'track', pos: up(578, -26, 1.1), who: 'dewdrop', fov: 52 } },
    { do: 'drive', vehicle: 'dewdrop', path: DEWDROP_RUN, speed: 5.5, arrive: false, async: true },
    { do: 'wait', s: 2.0 },
    cut(shot('tester', 'ms', { side: 55 })),
    { do: 'say', who: 'tester', text: 'How do you STOP it?' },
    cut(HOG_TALK.single('hogweed', 'mcu')),
    { do: 'gesture', who: 'hogweed', name: 'point', s: 1.2, async: true },
    { do: 'say', who: 'hogweed', text: 'Run slower!' },
    { do: 'despawn', id: 'dewdrop' },
    { do: 'despawn', id: 'tester' },
    // Grout, the Union, a pink citation. His first appearance: the card follows his first line.
    { do: 'spawn', id: 'grout' },
    { do: 'walk', who: 'grout', path: GROUT_IN, speed: 1.7, async: true },
    { do: 'cam', shot: { kind: 'track', pos: up(571, -20, 1.6), who: 'grout', fov: 50 } },
    { do: 'wait', s: 3 },
    { do: 'face', who: 'hogweed', at: 'grout', s: 0.4 },
    cut(GROUT_TALK.single('grout', 'mcu', { height: 'low' })),
    { do: 'say', who: 'grout', text: 'Local 404 says: unauthorised verticality.' },
    { do: 'intro', who: 'grout' },
    { do: 'sfx', id: 'knock', at: up(579, -21, 0.5), gain: 0.7, async: true },
    { do: 'spawn', id: 'citation' },
    { do: 'cam', shot: { kind: 'cut', pos: up(577.4, -19.5, 1.3), look: 'citation', fov: 36 } },
    { do: 'wait', s: 1.4 },
    cut(GROUT_TALK.single('hogweed', 'mcu')),
    { do: 'say', who: 'hogweed', text: 'Lovely! Third one this week. I am framing it.' },
    { do: 'wait', s: 1.2 },
  ],
};

// ---- Side-Valve Salvage, dusk (outro) --------------------------------------------------------------------------------------
const OUTRO_TALK = coverage('pip', 'player', -1);

/** Under the Span, scene 3: the jammer goes into Pip's toolbox, beside the thing he keeps in it. He dodges Fescue. */
export const UNDER_THE_SPAN_OUTRO: SceneScript = {
  id: 'under-the-span-outro',
  stage: { kind: 'world' },
  music: 'turfton-dusk',
  ambience: 'street',
  sky: 'golden',
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/under-the-span-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, at: SV_PLAYER.at, yaw: towards(SV_PLAYER.at, PIP_BY_BENCH), held: 'radio-jammer' },
    { id: 'pip', preset: 'pip', at: PIP_BY_BENCH, yaw: towards(PIP_BY_BENCH, SV_PLAYER.at) },
    { id: 'cam', preset: 'turncoat cam', name: 'Cam', at: SV_CAM.at, yaw: SV_CAM.yaw },
  ],
  props: [
    { id: 'toolbox', prefab: 'glaze-extra-toolbox', at: up(-156.2, 73.4, 0), yaw: -2.2, size: 0.7 },
    { id: 'vial', prefab: 'fescue-vial', at: up(-156.2, 73.4, 0.26), yaw: 0, size: 0.18, by: 'h', hidden: true },
  ],
  steps: [
    // Hook: Pip sees what the player is carrying before they have reached him.
    cut(OUTRO_TALK.single('pip', 'mcu')),
    { do: 'say', who: 'pip', text: 'Is that it? Is that the jammer? Oh, it is beautiful.' },
    { do: 'sfx', id: 'clatter', at: 'pip', gain: 0.5, async: true },
    { do: 'give', from: 'player', to: 'pip', prop: 'radio-jammer', s: 1 },
    // The question he was told to be asked.
    cut(OUTRO_TALK.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Hogweed says to ask you about Fescue.' },
    cut(OUTRO_TALK.single('pip', 'mcu')),
    beat('beat'),
    { do: 'say', who: 'pip', text: 'Fescue? Never heard of it. Sounds like a mower.' },
    // The insert: the jammer goes into the toolbox, beside a small glass vial wrapped in a rag. Shown, not told.
    { do: 'cam', shot: { kind: 'cut', pos: up(-155.6, 74.6, 0.9), look: up(-156.2, 73.4, 0.1), fov: 34 } },
    { do: 'spawn', id: 'vial' },
    { do: 'sfx', id: 'latch', at: 'toolbox', gain: 0.7, async: true },
    { do: 'hold', who: 'pip', prop: null },
    { do: 'wait', s: 1.6 },
    { do: 'despawn', id: 'vial' },
    // Button: the lid is shut, he sits on it, and Cam has stopped sweeping.
    cut(OUTRO_TALK.single('pip', 'ms')),
    { do: 'gesture', who: 'pip', name: 'crossArms', s: 1.4, async: true },
    { do: 'face', who: 'cam', at: 'pip', s: 0.5, async: true },
    { do: 'say', who: 'pip', text: 'Totally normal toolbox.' },
    { do: 'wait', s: 1.6 },
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'under-the-span-intro': UNDER_THE_SPAN_INTRO,
  'under-the-span-mid': UNDER_THE_SPAN_MID,
  'under-the-span-outro': UNDER_THE_SPAN_OUTRO,
};
