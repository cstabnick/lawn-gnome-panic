// The Grid Truthers (Mossley "Plumb-Line" Inkcap): paranoid surveillance. Long-lens shots from across the road, a
// handheld shake that never stops, whispered lines, the radio switched off ("they listen through it"), and a
// Code-Enforcement van that makes him duck. Staged at bodega-front at night (quests/stages/turfton.ts).
import type { SceneScript } from '../../script';
import { above, castRide, markOf, stageCut, walkOf } from './kit';

const MOSSLEY = markOf('bodega-front', 'mossley');
const PLAYER = markOf('bodega-front', 'player');
const BURT = markOf('bodega-front', 'burt');
const PACE = walkOf('bodega-front', 'mossley');
const SWEEP = walkOf('bodega-front', 'bodega');

export const GRID_TRUTHERS_INTRO: SceneScript = {
  id: 'sq-grid-truthers-intro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'night',
  title: 'The Grid Truthers',
  music: 'mystery',
  ambience: 'night',
  radio: 0,
  actors: [
    { id: 'you', player: true, at: [-64, 96], yaw: -Math.PI / 2 },
    { id: 'mossley', preset: 'mossley', at: PACE[0], yaw: 0, held: 'ruler-stick' },
    { id: 'john', preset: 'bodega', name: 'John Bodega', at: SWEEP[0], yaw: Math.PI / 2, held: 'broom' },
    { id: 'burt', preset: 'burt', at: BURT.at, yaw: BURT.yaw, held: 'espresso-cup' },
  ],
  vehicles: [
    { id: 'van', kind: 'hoa-van', at: [-62.5, 40], yaw: 0, headlights: true, loadout: { paint: 0xf4f1e6, lamp: 'square', beam: 'xenon' } },
  ],
  steps: [
    // Surveillance: a long lens from across the road, the camera never quite still.
    { do: 'shake', amp: 0.025, s: 90 },
    { do: 'cam', shot: { kind: 'dolly', from: [-55, 2.2, 74], to: [-55.5, 2.0, 77], look: 'mossley', s: 7, fov: 24 } },
    { do: 'caption', text: 'Old Brick Quarter. Nobody is watching. Allegedly.' },
    // Street life: John sweeps the step, Mossley paces the kerb with a ruler, sighting along it.
    { do: 'walk', who: 'john', path: [SWEEP[1], SWEEP[0], SWEEP[1]], speed: 0.8, async: true },
    { do: 'walk', who: 'mossley', path: [PACE[1]], speed: 1.0 },
    { do: 'caption', text: null },
    { do: 'gesture', who: 'mossley', name: 'point', s: 1.4, async: true },
    { do: 'walk', who: 'you', path: [[-66, 93], PLAYER.at], async: true },
    { do: 'cam', shot: { kind: 'cut', pos: above(-66.5, 95.5, 1.5), look: 'mossley', fov: 34 } },
    { do: 'say', who: 'mossley', text: 'Don\'t walk straight at me. Walk on the crack in the paving. That one. Diagonals confuse them.' },
    { do: 'face', who: 'mossley', at: 'you', s: 0.5 },
    { do: 'walk', who: 'mossley', path: [MOSSLEY.at], speed: 1.2 },
    { do: 'cam', shot: { kind: 'cut', pos: above(-68.2, 87.6, 1.3), look: 'mossley', fov: 30 } },
    { do: 'say', who: 'mossley', text: 'Sixty units. Every road in Turfton, sixty units apart. Dead even. Does soil grow in squares?' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-73.5, 86.5, 1.3), look: 'you', fov: 34 } },
    { do: 'gesture', who: 'you', name: 'shrug', async: true },
    { do: 'say', who: 'you', text: 'Somebody planned the roads. That\'s what roads are.' },
    // The van: headlights sweep the pavement and Mossley freezes.
    { do: 'cam', shot: { kind: 'track', pos: above(-67, 86, 1.0), who: 'van', fov: 40 } },
    { do: 'drive', vehicle: 'van', path: [[-62.5, 70], [-62.5, 100], [-62.5, 140]], speed: 7, arrive: false, async: true },
    { do: 'stinger', id: 'danger' },
    { do: 'gesture', who: 'mossley', name: 'handsUp', s: 1.6, async: true },
    { do: 'say', who: 'mossley', text: 'Code-Enforcement. Don\'t look at it. They measure everything after midnight.' },
    { do: 'wait', s: 1.2 },
    // Close and low over the table: the plan, in a whisper.
    { do: 'cam', shot: { kind: 'dolly', from: above(-69.0, 85.6, 1.1), to: above(-69.6, 85.2, 1.05), look: 'mossley', s: 6, fov: 28 } },
    { do: 'say', who: 'mossley', text: 'Four survey markers, one at each corner of the grid. Check them. Then the dead centre. Zero, zero.' },
    { do: 'say', who: 'you', text: 'What\'s at zero, zero?' },
    { do: 'say', who: 'mossley', text: 'Whatever they drew it with.', stinger: 'mystery' },
    // Burt, from the wall: a dry second opinion (and his own side job, later).
    { do: 'cam', shot: { kind: 'cut', pos: above(-72.5, 92.5, 1.4), look: 'burt', fov: 36 } },
    { do: 'say', who: 'burt', text: 'He\'s right about the vans. I used to drive one.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-68.2, 87.6, 1.3), look: 'mossley', fov: 30 } },
    { do: 'say', who: 'mossley', text: 'And don\'t take a free gun from Ammu-Gnation. Free means counted.' },
    { do: 'say', who: 'you', text: 'Their list got lost. They can\'t count anything.' },
    { do: 'say', who: 'mossley', text: 'That\'s exactly what a list would want you to think.' },
    // Out: Mossley back to pacing, the camera lifts away like a drone that was there all along.
    { do: 'walk', who: 'mossley', path: [PACE[0], PACE[1]], speed: 1.0, async: true },
    { do: 'walk', who: 'you', path: [[-66, 92]], async: true },
    { do: 'cam', shot: { kind: 'dolly', from: above(-63, 92, 3), to: above(-58, 98, 12), look: [-72, 1.5, 86], s: 5 }, wait: true },
  ],
};

// Beat: the player reaches Gamma (120,-120). Mossley pedals up the x = 120 road on his own bike, sighting along the line.
const GAMMA_ROAD: [number, number] = [120, -150];
const GAMMA_STOP: [number, number] = [120, -127];

export const GRID_TRUTHERS_GAMMA: SceneScript = {
  id: 'sq-grid-truthers-gamma',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'night',
  music: 'mystery',
  ambience: 'night',
  radio: 0,
  actors: [
    { id: 'you', player: true, at: [120, -117], yaw: Math.PI },
    { id: 'mossley', preset: 'mossley', seatedIn: 'bike', held: 'ruler-stick', at: [0, 0] },
  ],
  vehicles: [castRide('mossley', 'bike', [GAMMA_ROAD[0], GAMMA_ROAD[1]], 0)],
  steps: [
    { do: 'shake', amp: 0.02, s: 30 },
    { do: 'cam', shot: { kind: 'track', pos: above(124.5, -113, 1.5), who: 'bike', fov: 32 } },
    { do: 'drive', vehicle: 'bike', path: [[120, -138], GAMMA_STOP], speed: 3.5, arrive: true },
    { do: 'exit', who: 'mossley' },
    { do: 'walk', who: 'mossley', path: [[120.5, -125]], speed: 1.0 },
    { do: 'cam', shot: { kind: 'cut', pos: above(124, -119.5, 1.3), look: 'mossley', fov: 30 } },
    { do: 'say', who: 'mossley', text: 'Keep your voice down. The markers can hear a loud voice from sixty units.' },
    { do: 'say', who: 'you', text: 'Gamma. I\'m on Gamma. What am I looking at?' },
    { do: 'gesture', who: 'mossley', name: 'point', s: 1.6, async: true },
    { do: 'say', who: 'mossley', text: 'Alpha, Beta, Gamma. Run a line from each one through the middle. They all point the same way.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(116.8, -119, 1.35), look: 'mossley', fov: 26 } },
    { do: 'say', who: 'mossley', text: 'Downtown. Dead centre. Something there has been rubbed out of the old maps.', stinger: 'mystery' },
    { do: 'face', who: 'mossley', at: 'you', s: 0.5 },
    { do: 'cam', shot: { kind: 'cut', pos: above(118, -123.5, 1.35), look: 'you', fov: 30 } },
    { do: 'say', who: 'you', text: 'Maps get redrawn. That\'s all that is.' },
    { do: 'shake', amp: 0.03, s: 3 },
    { do: 'say', who: 'mossley', text: 'Don\'t look over your shoulder. Look at me like you\'re bored. They\'ll think you\'re a tourist.' },
    { do: 'gesture', who: 'mossley', name: 'shrug', s: 1.2 },
    { do: 'say', who: 'mossley', text: 'Zero, zero. Let\'s go before the grass remembers where the road was.' },
    { do: 'wait', s: 1.0 },
  ],
};

// Payoff: the datum at (0,0), under the crossing. The storm grate gives and the Tall-One Pencil is revealed.
const CULVERT = 'culvert-under-deck';

export const GRID_TRUTHERS_OUTRO: SceneScript = {
  id: 'sq-grid-truthers-outro',
  stage: { kind: 'world' },
  world: 'live',
  sky: 'golden',
  title: 'The Grid Truthers',
  music: 'mystery',
  ambience: 'night',
  radio: 0,
  // Traffic and pedestrians keep clear of the portal lot and the crossing beside it.
  clearArea: { at: [-10, -11], r: 18 },
  actors: [
    { id: 'you', player: true, at: [-7.5, -8], yaw: -2.4 },
    { id: 'mossley', preset: 'mossley', at: [-6, -6], yaw: -2.6, held: 'ruler-stick' },
    { id: 'sal', name: 'Silt-Diver Sal', look: { hat: 0x6b5a3e, shirt: 0x2f4f4f, beard: 0x8a8a7a }, at: markOf(CULVERT, 'sal').at, yaw: markOf(CULVERT, 'sal').yaw, held: 'torch' },
  ],
  props: [
    { id: 'pencil', prefab: 'tall-one-pencil', at: [-15, -16], yaw: Math.PI / 2, size: 10, by: 'w', hidden: true },
  ],
  steps: [
    { do: 'shake', amp: 0.02, s: 70 },
    { do: 'cam', shot: { kind: 'dolly', from: above(-15, -6.5, 1.6), to: above(-14, -6.8, 1.5), look: 'mossley', s: 6, fov: 36 } },
    { do: 'walk', who: 'sal', path: walkOf(CULVERT, 'sal'), speed: 0.9, async: true },
    { do: 'say', who: 'mossley', text: 'Sixty units from the bodega. Dead centre. Zero, zero.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-5.2, -10, 1.35), look: 'you', fov: 34 } },
    { do: 'say', who: 'you', text: 'Mossley, the grate is moving.' },
    // The ground gives behind them: the Pencil rolls up out of the drain.
    { do: 'shake', amp: 0.22, s: 1.8 },
    { do: 'sfx', id: 'thud' },
    { do: 'stinger', id: 'reveal' },
    { do: 'spawn', id: 'pencil' },
    { do: 'face', who: 'mossley', at: 'pencil', s: 0.5, async: true },
    { do: 'face', who: 'you', at: 'pencil', s: 0.5, async: true },
    { do: 'cam', shot: { kind: 'dolly', from: above(-21, -9, 2.5), to: above(-22, -7, 4.5), look: 'pencil', s: 7, fov: 46 } },
    { do: 'say', who: 'mossley', text: 'Oh. Oh, look at the size of it. Cedar. Redwood-sized cedar.' },
    { do: 'say', who: 'mossley', text: 'Somebody sharpened this and left it in the dark. Under the kerb.' },
    { do: 'cam', shot: { kind: 'dolly', from: above(-9.5, -12.6, 1.2), to: above(-12, -12.6, 1.2), look: 'pencil', s: 4, fov: 40 }, wait: true },
    { do: 'cam', shot: { kind: 'cut', pos: above(-5.2, -10, 1.35), look: 'you', fov: 34 } },
    { do: 'say', who: 'you', text: 'The eraser end is worn right down.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-9.8, -8.6, 1.3), look: 'mossley', fov: 30 } },
    { do: 'say', who: 'mossley', text: 'Somebody has been rubbing things out of Turfton. The streets. The old names.', stinger: 'mystery' },
    { do: 'face', who: 'mossley', at: 'you', s: 0.4 },
    { do: 'cam', shot: { kind: 'cut', pos: above(-9.8, -8.6, 1.3), look: 'mossley', fov: 30 } },
    { do: 'say', who: 'mossley', text: 'Three pounds of graphite, give or take. Artisan eyebrow pencil. I retire today.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-5.2, -10, 1.35), look: 'you', fov: 34 } },
    { do: 'say', who: 'you', text: 'That\'s stealing from the Tall Ones.' },
    { do: 'cam', shot: { kind: 'cut', pos: above(-9.8, -8.6, 1.3), look: 'mossley', fov: 30 } },
    { do: 'say', who: 'mossley', text: 'Nobody has ever seen a Tall One. Nobody will notice a few grams.' },
    { do: 'say', who: 'mossley', text: 'Vesper\'s HOA will correct the maps by Friday. Turfton FM will call this a sinkhole by breakfast.' },
    { do: 'cam', shot: { kind: 'dolly', from: above(-15, -7, 3), to: above(-21, -9, 10), look: 'pencil', s: 5 }, wait: true },
  ],
};

export const GRID_TRUTHERS_SCENES: SceneScript[] = [GRID_TRUTHERS_INTRO, GRID_TRUTHERS_GAMMA, GRID_TRUTHERS_OUTRO];
