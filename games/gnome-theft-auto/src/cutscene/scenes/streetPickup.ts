// The street pickup: Pip drives up in a lowrider, hands over a pistol on the sidewalk, and they both drive off.
import type { SceneScript } from '../script';

export const STREET_PICKUP: SceneScript = {
  id: 'street-pickup',
  stage: { kind: 'world' },
  title: 'Street Pickup',
  music: 'tension',
  ambience: 'street',
  actors: [
    { id: 'pip', preset: 'pip', name: 'Pip', at: [-2.5, -30], seatedIn: 'lowrider', seat: 0, held: 'gta-pistol' },
    { id: 'player', player: true, name: 'You', at: [-6.25, 14], yaw: 0 },
  ],
  vehicles: [
    { id: 'lowrider', kind: 'lowrider', at: [-2.5, -30], yaw: 0, headlights: true },
  ],
  steps: [
    // The drive-by entrance: a fixed camera on the kerb turns to follow the lowrider up the road, horn first.
    { do: 'cam', shot: { kind: 'track', pos: [-8, 2.2, 0], who: 'lowrider', fov: 55 } },
    { do: 'horn', vehicle: 'lowrider', async: true },
    { do: 'drive', vehicle: 'lowrider', path: [[-2.5, 9]], speed: 7 },
    // Close in for the talk: a two-shot from the kerb, then over-the-shoulder shots for each speaker.
    { do: 'cam', shot: { kind: 'dolly', from: [-6.5, 1.9, 19], to: [-5.6, 1.5, 17.4], look: [-4.6, 0.9, 12.4], s: 4 } },
    { do: 'exit', who: 'pip' },
    { do: 'walk', who: 'pip', path: [[-3.6, 11.8], [-4.4, 13.0]] },
    { do: 'face', who: 'pip', at: 'player', s: 0.3 },
    { do: 'face', who: 'player', at: 'pip', s: 0.3, async: true },
    { do: 'cam', shot: { kind: 'cut', pos: [-7.05, 1.5, 15.45], look: 'pip', fov: 46 } },
    { do: 'say', who: 'pip', text: 'You came! I tuned her myself. She only backfires when she is happy.' },
    // E09 variety: the reply drifts in a little, so the talk is not four locked cuts in a row.
    { do: 'cam', shot: { kind: 'dolly', from: [-2.9, 1.5, 13.3], to: [-3.2, 1.5, 13.6], look: 'player', s: 3, fov: 46 } },
    { do: 'say', who: 'player', text: 'Breathe, Pip. Where is the gear?' },
    { do: 'cam', shot: { kind: 'cut', pos: [-7.05, 1.5, 15.45], look: 'pip', fov: 46 } },
    { do: 'gesture', who: 'pip', name: 'point', s: 1.2, async: true },
    { do: 'say', who: 'pip', text: 'Right here. Safety on until we are moving. Please. I am begging you.', icon: '🔫' },
    { do: 'gesture', who: 'pip', name: 'shrug', s: 1.2, async: true },
    { do: 'say', who: 'pip', text: 'Do not ask where I got it. I asked nicely. Mostly.' },
    { do: 'cam', shot: { kind: 'cut', pos: [-5.4, 1.6, 17.2], look: [-5.3, 0.85, 13.5], fov: 50 } },
    { do: 'sfx', id: 'cloth', at: 'pip', async: true },
    { do: 'give', from: 'pip', to: 'player', prop: 'gta-pistol' },
    { do: 'stinger', id: 'reveal', async: true },
    { do: 'say', who: 'player', text: 'Nice doing business with you. Get in.' },
    { do: 'cam', shot: { kind: 'track', pos: [-7.5, 2.0, 16.5], who: 'lowrider', fov: 52 } },
    { do: 'sfx', id: 'latch', at: 'lowrider', async: true },
    { do: 'enter', who: 'player', vehicle: 'lowrider', seat: 1 },
    { do: 'enter', who: 'pip', vehicle: 'lowrider', seat: 0 },
    // The getaway: the chase camera takes over, the music changes, and the lowrider leaves at speed.
    { do: 'cam', shot: { kind: 'follow', who: 'lowrider', offset: [0, 2.2, -5.5], lag: 0.35, fov: 58 } },
    { do: 'music', track: 'heist', fade: 1.2 },
    { do: 'sfx', id: 'skid', at: 'lowrider', async: true },
    { do: 'stinger', id: 'danger' },
    { do: 'drive', vehicle: 'lowrider', path: [[-2.5, 60], [-2.5, 110]], speed: 14, depart: true, arrive: false },
    { do: 'call', name: 'pickup-done' },
  ],
};
