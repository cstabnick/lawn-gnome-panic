// Chapter 1 story scenes, first file: the prologue, the First Contract, Mower's Keepers. Owner: one issue of
// docs/roadmaps/gta-story-cutscenes.md. Every id here is played by a quest in quests/chapter1.ts and checked by scenes.test.ts.
import type { SceneScript } from '../../script';
import { markOf, spot, up } from './kit';

const PIP = markOf('bus-stop', 'pip');

/**
 * The game's cold open (Fresh Out the Kiln, intro). The snail-coach pulls in at the downtown stop, the player steps
 * off into Turfton, Pip skids up on a borrowed Push-Mower Bike with the Hat Watch two blocks behind, points at a
 * Ride-On at the kerb (left in the world for the chase), a cut to Bodega & Sons, then the title slams in.
 */
export const PROLOGUE_INTRO: SceneScript = {
  id: 'prologue-intro',
  stage: { kind: 'world' },
  music: 'turfton',
  ambience: 'street',
  actors: [
    { id: 'player', player: true, at: [-6.4, 20], yaw: Math.PI / 2, hidden: true },
    { id: 'pip', preset: 'pip', name: 'Pip Potsworth', at: [0, 0], seatedIn: 'bike', hidden: true },
    { id: 'john', preset: 'bodega', name: 'John Bodega', at: [-79.5, 86], yaw: 0 },
  ],
  vehicles: [
    { id: 'coach', kind: 'snail-coach', at: [2.5, 95], yaw: Math.PI },
    { id: 'bike', kind: 'push-bike', at: [-2.5, 70], yaw: Math.PI, hidden: true, tint: 0x3b7a57 },
    // The Ride-On the player borrows for the chase: stays in the world after the scene.
    { id: 'kerb-ride', kind: 'ride-on', at: [-7.6, 27], yaw: Math.PI, keep: true },
  ],
  steps: [
    // Establishing: down out of the towers onto the stop while the coach rolls in.
    { do: 'cam', shot: { kind: 'dolly', from: up(24, -6, 34), to: up(-16, 6, 4.5), look: up(-6, 18, 1.2), lookTo: up(0, 30, 1), s: 7.5, fov: 54 } },
    { do: 'drive', vehicle: 'coach', path: [[2.5, 60], [2.5, 32], [2.5, 21]], speed: 8, async: true },
    { do: 'say', who: 'Narrator', text: 'Every gnome thinks they are limited edition.', hz: 130 },
    { do: 'say', who: 'Narrator', text: 'Then you step off the snail-coach in Turfton, five thousand Acorns of Kiln-Debt in your pocket.', hz: 130 },
    { do: 'cam', shot: { kind: 'track', pos: up(-4.2, 31, 1.8), who: 'coach', fov: 50 } },
    { do: 'wait', s: 1.2 },
    { do: 'sfx', id: 'door' },
    { do: 'spawn', id: 'player' },
    { do: 'walk', who: 'player', path: [[-6.6, 18.5], [-7, 16]] },
    { do: 'face', who: 'player', yaw: 0, s: 0.4 },
    { do: 'drive', vehicle: 'coach', path: [[2.5, 0], [2.5, -60]], speed: 9, arrive: false, async: true },
    { do: 'say', who: 'Narrator', text: 'And half the block was cast from the same garden-centre mould.', hz: 130 },
    // The Hat Watch, two blocks over. Then Pip, at speed.
    { do: 'sfx', id: 'whistle', gain: 0.35 },
    { do: 'cam', shot: { kind: 'cut', pos: up(-4.6, 13.2, 1.5), look: 'player', fov: 46 } },
    { do: 'gesture', who: 'player', name: 'shrug', s: 1.0 },
    { do: 'spawn', id: 'bike' },
    { do: 'spawn', id: 'pip' },
    { do: 'cam', shot: { kind: 'track', pos: up(-0.8, 6, 1.5), who: 'bike', fov: 50 } },
    { do: 'drive', vehicle: 'bike', path: [[-2.5, 40], [-3.2, 22], [-4.2, 18]], speed: 10, async: true },
    { do: 'horn', vehicle: 'bike', async: true },
    { do: 'wait', s: 2.6 },
    { do: 'sfx', id: 'skid', at: 'bike' },
    { do: 'exit', who: 'pip' },
    { do: 'walk', who: 'pip', path: [PIP.at] },
    { do: 'face', who: 'pip', at: 'player', s: 0.3 },
    { do: 'face', who: 'player', at: 'pip', s: 0.3, async: true },
    { do: 'cam', shot: spot('bus-stop', 'two-shot') },
    { do: 'gesture', who: 'pip', name: 'handsUp', s: 1.2, async: true },
    { do: 'say', who: 'pip', text: 'Don\'t look at me like that! It\'s not stealing if the owner left the key in.' },
    { do: 'say', who: 'pip', text: 'He went inside a flowerpot for an Acorn-Cola. That\'s basically a gift.' },
    { do: 'sfx', id: 'whistle', gain: 0.6 },
    { do: 'cam', shot: { kind: 'cut', pos: up(-4.5, 14.5, 1.5), look: 'player', fov: 44 } },
    { do: 'say', who: 'player', text: 'Is that whistle for you?' },
    { do: 'cam', shot: { kind: 'cut', pos: up(-8.2, 15.2, 1.45), look: 'pip', fov: 44 } },
    { do: 'gesture', who: 'pip', name: 'point', s: 1.4, async: true },
    { do: 'say', who: 'pip', text: 'Grab that Ride-On at the kerb and follow me. Side-Valve Salvage. Tansy\'s got a crate that hums.' },
    { do: 'cam', shot: { kind: 'dolly', from: up(-11, 21, 1.8), to: up(-11.5, 24, 1.6), look: 'kerb-ride', s: 3 } },
    { do: 'say', who: 'pip', text: 'It smells faintly of Chirp & Crumb. Don\'t ask. I didn\'t.' },
    // Meanwhile at Bodega & Sons.
    { do: 'cam', shot: { kind: 'dolly', from: up(-73, 84, 1.7), to: up(-74.5, 86.5, 1.5), look: 'john', s: 5, fov: 48 } },
    // Async steps keep the scene open until they end: keep them shorter than the lines they run under.
    { do: 'walk', who: 'john', path: [[-79.5, 90]], speed: 0.9, async: true },
    { do: 'say', who: 'john', text: 'Bodega & Sons, late morning. Asphalt bats a bottlecap off the counter. Something fast is coming.', icon: '🐈' },
    // The title.
    { do: 'cam', shot: { kind: 'orbit', around: up(-8.5, 16.5, 0.9), radius: 4.2, height: 0.7, fromYaw: 2.3, toYaw: 1.5, s: 4 } },
    { do: 'music', track: 'turfton', fade: 0.4 },
    { do: 'stinger', id: 'chapter' },
    { do: 'title', text: 'GNOME THEFT AUTO' },
    { do: 'shake', amp: 0.06, s: 0.5 },
    { do: 'say', who: 'pip', text: 'Okay. Go go go!' },
    { do: 'title', text: null },
  ],
};

export const CH1_SCENES: Record<string, SceneScript> = {
  'prologue-intro': PROLOGUE_INTRO,
};
