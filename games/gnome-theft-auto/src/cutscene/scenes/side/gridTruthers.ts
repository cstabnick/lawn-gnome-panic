// The Grid Truthers (Mossley "Plumb-Line" Inkcap): paranoid surveillance. Long lenses on his face, a light handheld drift
// on every shot, whispered lines, the radio switched off ("they listen through it"), and a Code-Enforcement van that makes
// him freeze. Staged at bodega-front (quests/stages/turfton.ts). Dusk held at `sky: 'golden'` so Mossley reads against the
// sky and the bodega front, not against black ground. Re-directed against
// docs/design/gnome-theft-auto/direction/bible.md; notes per scene in
// docs/design/gnome-theft-auto/direction/scenes/sq-grid-truthers-*.md.
import type { SceneScript, Vec2 } from '../../script';
import { beat, coverage, cut, reaction, shot } from '../../direct';
import { above, castRide, markOf, walkOf } from './kit';

const MOSSLEY = markOf('bodega-front', 'mossley');
const PLAYER = markOf('bodega-front', 'player');
const BURT = markOf('bodega-front', 'burt');
const PACE = walkOf('bodega-front', 'mossley');
const SWEEP = walkOf('bodega-front', 'bodega');

const towards = (a: Vec2, b: Vec2): number => Math.atan2(b[0] - a[0], b[1] - a[1]);

/** The intro's two-hander: the player and Mossley on one side of the line. */
const TALK = coverage('mossley', 'you', 1);
/** Each frame of Mossley: long lens, a light drift, his eyeline to the player. */
const WHISPER = { toward: 'you', side: 30, fov: 28, handheld: 0.02 };

export const GRID_TRUTHERS_INTRO: SceneScript = {
  id: 'sq-grid-truthers-intro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  title: 'The Grid Truthers',
  music: 'mystery',
  ambience: 'night',
  radio: 0,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sq-grid-truthers-intro.md', kind: 'intro' },
  actors: [
    { id: 'you', player: true, at: [-64, 96], yaw: towards([-64, 96], PLAYER.at) },
    { id: 'mossley', preset: 'mossley', at: PACE[0], yaw: 0, held: 'ruler-stick' },
    { id: 'john', preset: 'bodega', name: 'John Bodega', at: SWEEP[0], yaw: Math.PI / 2, held: 'broom' },
    { id: 'burt', preset: 'burt', at: BURT.at, yaw: towards(BURT.at, PLAYER.at), held: 'espresso-cup' },
  ],
  vehicles: [
    { id: 'van', kind: 'hoa-van', at: [-62.5, 40], yaw: 0, headlights: true, loadout: { paint: 0xf4f1e6, lamp: 'square', beam: 'xenon' } },
  ],
  steps: [
    // 1. Hook: a long lens on Mossley at the kerb, the player already walking straight at him.
    cut(shot('mossley', 'mcu', WHISPER)),
    { do: 'walk', who: 'you', path: [[-66, 93], PLAYER.at], speed: 1.2, async: true },
    { do: 'say', who: 'mossley', text: 'Don\'t walk straight at me. Walk on the crack in the paving.' },
    // 2. Setup: the sixty-unit grid, one flat answer from the player.
    { do: 'walk', who: 'mossley', path: [MOSSLEY.at], speed: 1.2, async: true },
    { do: 'face', who: 'mossley', at: 'you', s: 0.4 },
    cut(shot('mossley', 'mcu', WHISPER)),
    { do: 'say', who: 'mossley', text: 'Sixty units. Every road in Turfton, sixty units apart.' },
    { do: 'say', who: 'mossley', text: 'Does soil grow in squares?' },
    cut(TALK.single('you', 'mcu')),
    { do: 'gesture', who: 'you', name: 'shrug', async: true },
    { do: 'say', who: 'you', text: 'Somebody planned the roads. That\'s what roads are.' },
    // 3. Turn: the Code-Enforcement van glides past with its lights on. Mossley freezes; the camera tracks the van.
    { do: 'cam', shot: { kind: 'track', pos: above(-67, 86, 1.0), who: 'van', fov: 40, handheld: 0.02 } },
    { do: 'drive', vehicle: 'van', path: [[-62.5, 70], [-62.5, 100], [-62.5, 140]], speed: 7, arrive: false, async: true },
    { do: 'stinger', id: 'danger' },
    { do: 'gesture', who: 'mossley', name: 'handsUp', s: 1.6, async: true },
    { do: 'wait', s: 2.5 },
    cut(shot('mossley', 'mcu', WHISPER)),
    { do: 'say', who: 'mossley', text: 'Code-Enforcement. Don\'t look at it. They measure everything after midnight.' },
    cut(shot('burt', 'mcu', { toward: 'you', side: 30, fov: 34 })),
    { do: 'say', who: 'burt', text: 'I\'m Burt. Ex-HOA. He\'s right about the vans. I drove one.' },
    // 4. The plan, in a whisper, close over the table.
    cut(shot('mossley', 'mcu', WHISPER)),
    { do: 'say', who: 'mossley', text: 'Four survey markers, one at each corner of the grid.' },
    { do: 'say', who: 'mossley', text: 'Then the dead centre. Zero, zero.' },
    cut(TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'What\'s at zero, zero?' },
    // 5. Button: Mossley looks up at the sky, the camera tilts with him, the mystery sting, a held look.
    cut(shot('mossley', 'mcu', WHISPER)),
    { do: 'say', who: 'mossley', text: 'Whatever they drew it with.', stinger: 'mystery' },
    beat('tiny'),
    // He looks up, past the lens, at a sky that might be watching back: shot from below, the dusk behind him.
    cut(shot('mossley', 'ms', { toward: 'you', side: -35, height: 'low', fov: 46, handheld: 0.02 })),
    { do: 'gesture', who: 'mossley', name: 'think', s: 1.6, async: true },
    { do: 'walk', who: 'you', path: [[-66, 92]], async: true },
    { do: 'wait', s: 2.4 },
  ],
};

// Beat: the player reaches Gamma (120,-120). Mossley pedals up the x = 120 road on his own bike, sighting along the line.
const GAMMA_ROAD: [number, number] = [120, -150];
const GAMMA_STOP: [number, number] = [120, -127];
const GAMMA_TALK = coverage('mossley', 'you', 1);

export const GRID_TRUTHERS_GAMMA: SceneScript = {
  id: 'sq-grid-truthers-gamma',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  music: 'mystery',
  ambience: 'night',
  radio: 0,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sq-grid-truthers-gamma.md', kind: 'arrival' },
  actors: [
    { id: 'you', player: true, at: [120, -117], yaw: Math.PI },
    { id: 'mossley', preset: 'mossley', seatedIn: 'bike', held: 'ruler-stick', at: [0, 0] },
  ],
  vehicles: [castRide('mossley', 'bike', [GAMMA_ROAD[0], GAMMA_ROAD[1]], 0)],
  steps: [
    // Hook: the bike comes up the road, the ruler in his hand, the camera riding with it.
    { do: 'cam', shot: { kind: 'track', pos: above(123.2, -121, 1.0), who: 'bike', fov: 34, handheld: 0.02 } },
    { do: 'drive', vehicle: 'bike', path: [[120, -138], GAMMA_STOP], speed: 3.5, arrive: true },
    { do: 'exit', who: 'mossley' },
    { do: 'walk', who: 'mossley', path: [[120.5, -125]], speed: 1.0 },
    { do: 'face', who: 'mossley', at: 'you', s: 0.4 },
    cut(GAMMA_TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Gamma. What am I looking at?' },
    cut(GAMMA_TALK.single('mossley', 'mcu')),
    { do: 'gesture', who: 'mossley', name: 'point', s: 1.6, async: true },
    { do: 'say', who: 'mossley', text: 'Alpha, Beta, Gamma. Run a line through each one.' },
    cut(GAMMA_TALK.single('mossley', 'cu')),
    { do: 'say', who: 'mossley', text: 'They all point downtown. Something has been rubbed out of the old maps.', stinger: 'mystery' },
    cut(GAMMA_TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'Maps get redrawn. That\'s all that is.' },
    // Button: Mossley does his best bored face, on a frame of him.
    cut(GAMMA_TALK.single('mossley', 'mcu')),
    { do: 'gesture', who: 'mossley', name: 'shrug', s: 1.2, async: true },
    { do: 'say', who: 'mossley', text: 'Look at me like you\'re bored. They\'ll think you\'re a tourist.' },
    { do: 'wait', s: 1.0 },
  ],
};

// Payoff: the datum at (0,0), under the crossing. The storm grate gives and the Tall-One Pencil is revealed.
const CULVERT = 'culvert-under-deck';
const OUT_TALK = coverage('mossley', 'you', 1);

export const GRID_TRUTHERS_OUTRO: SceneScript = {
  id: 'sq-grid-truthers-outro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  title: 'The Grid Truthers',
  music: 'mystery',
  ambience: 'night',
  radio: 0,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/sq-grid-truthers-outro.md', kind: 'outro' },
  // Traffic and pedestrians keep clear of the portal lot and the crossing beside it.
  clearArea: { at: [-10, -11], r: 18 },
  actors: [
    { id: 'you', player: true, at: [-7.5, -8], yaw: towards([-7.5, -8], [-6, -6]) },
    { id: 'mossley', preset: 'mossley', at: [-6, -6], yaw: towards([-6, -6], [-7.5, -8]), held: 'ruler-stick' },
    { id: 'sal', name: 'Silt-Diver Sal', look: { hat: 0x6b5a3e, shirt: 0x2f4f4f, beard: 0x8a8a7a }, at: markOf(CULVERT, 'sal').at, yaw: markOf(CULVERT, 'sal').yaw, held: 'torch' },
  ],
  props: [
    { id: 'pencil', prefab: 'tall-one-pencil', at: [-15, -16], yaw: Math.PI / 2, size: 10, by: 'w', hidden: true },
  ],
  steps: [
    // 1. Hook: the storm grate gives. Picture and thud first, no talking.
    { do: 'cam', shot: { kind: 'cut', pos: above(-5, -18, 4.0), look: above(-10, -12, 0.1), fov: 40, handheld: 0.02 } },
    { do: 'shake', amp: 0.22, s: 1.8 },
    { do: 'sfx', id: 'thud' },
    { do: 'stinger', id: 'reveal' },
    { do: 'spawn', id: 'pencil' },
    { do: 'wait', s: 1.0 },
    // The Pencil rolls up out of the drain: a slow low dolly up its length, held with no line.
    { do: 'cam', shot: { kind: 'dolly', from: above(-21, -9, 1.2), to: above(-22, -7, 4.5), look: 'pencil', s: 4, fov: 46, handheld: 0.02 }, wait: true },
    { do: 'face', who: 'mossley', at: 'pencil', s: 0.5, async: true },
    { do: 'face', who: 'you', at: 'pencil', s: 0.5 },
    // 2. Mossley's awe (one line), the player's turn.
    cut(OUT_TALK.single('mossley', 'cu')),
    { do: 'say', who: 'mossley', text: 'Oh. Redwood-sized cedar. Somebody sharpened it and left it under the kerb.' },
    { do: 'face', who: 'you', at: 'mossley', s: 0.4 },
    cut(OUT_TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'The eraser end is worn right down.' },
    // 3. Mossley: the sincere line. Music out before it, a held silence after it.
    { do: 'music', track: null, fade: 0.4 },
    cut(OUT_TALK.single('mossley', 'mcu')),
    { do: 'say', who: 'mossley', text: 'Somebody has been rubbing things out of Turfton.' },
    cut({ kind: 'cut', pos: above(-22, -7, 3.5), look: 'pencil', fov: 46 }),
    beat('silence'),
    // 4. The deflation: the artisan eyebrow pencil, and the job is over.
    { do: 'music', track: 'mystery', fade: 1.2 },
    cut(OUT_TALK.single('mossley', 'ms')),
    { do: 'say', who: 'mossley', text: 'Three pounds of graphite, give or take. Artisan eyebrow pencil. I retire today.' },
    { do: 'face', who: 'you', at: 'mossley', s: 0.4 },
    cut(OUT_TALK.single('you', 'mcu')),
    { do: 'say', who: 'you', text: 'That\'s stealing from the Tall Ones.' },
    cut(OUT_TALK.single('mossley', 'cu')),
    { do: 'say', who: 'mossley', text: 'Nobody has ever seen a Tall One. Nobody will notice a few grams.' },
    // Main-story tie, one line: the HOA corrects the maps (Vesper's name is kept).
    // The Pencil again, huge in the gutter, while he talks himself into it.
    cut({ kind: 'cut', pos: above(-21, -8.5, 2.6), look: 'pencil', fov: 46 }),
    beat('pause'),
    cut(OUT_TALK.single('mossley', 'ms', { height: 'low' })),
    { do: 'say', who: 'mossley', text: 'Vesper\'s HOA will correct the maps by Friday.' },
    // 5. Button: Mossley chips at the graphite with his ruler, the player looks at the pencil, Sal walks past and does not look.
    { do: 'walk', who: 'sal', path: walkOf(CULVERT, 'sal'), speed: 0.9, async: true },
    cut({ kind: 'dolly', from: above(-2.6, -2.8, 1.5), to: above(-3.4, -3.6, 1.4), look: 'mossley', s: 4, fov: 50, handheld: 0.02 }),
    { do: 'gesture', who: 'mossley', name: 'point', s: 1.4, async: true },
    { do: 'wait', s: 2.8 },
  ],
};

export const GRID_TRUTHERS_SCENES: SceneScript[] = [GRID_TRUTHERS_INTRO, GRID_TRUTHERS_GAMMA, GRID_TRUTHERS_OUTRO];
