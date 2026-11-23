// The Grid Truthers (Mossley "Plumb-Line" Inkcap): paranoid surveillance. Long-lens shots from across the road, a
// handheld shake that never stops, whispered lines, the radio switched off ("they listen through it"), and a
// Code-Enforcement van that makes him duck. Staged at bodega-front at night (quests/stages/turfton.ts).
import type { SceneScript } from '../../script';
import { above, markOf, walkOf } from './kit';

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

export const GRID_TRUTHERS_SCENES: SceneScript[] = [GRID_TRUTHERS_INTRO];
