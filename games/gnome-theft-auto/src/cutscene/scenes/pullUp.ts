// The pull-up: the player drives up to the Bodega & Sons kerb, gets out, and talks to the shopkeeper.
import type { SceneScript } from '../script';

export const PULL_UP: SceneScript = {
  id: 'pull-up',
  stage: { kind: 'world' },
  title: 'Pull Up',
  ambience: 'street',
  actors: [
    { id: 'player', player: true, name: 'You', seatedIn: 'car', seat: 0, at: [0, 0] },
    { id: 'keeper', preset: 'bodega', name: 'John', at: [-64, 90], yaw: Math.PI / 2 },
  ],
  vehicles: [
    // from: 'player' drives the vehicle the player is in; on foot, a ride-on mower is spawned instead.
    { id: 'car', kind: 'ride-on', from: 'player', at: [-57.5, 62], yaw: 0 },
  ],
  steps: [
    // Interior shot: over the driver's shoulder, looking out past the bonnet.
    { do: 'cam', shot: { kind: 'follow', who: 'car', offset: [0, 1.9, -2.3], look: [0, 0.9, 5], lag: 0, fov: 60 } },
    { do: 'sfx', id: 'engine-rev', at: 'car', async: true },
    { do: 'drive', vehicle: 'car', path: [[-57.5, 90]], speed: 6 },
    // The kerb: John has come out to meet the car.
    { do: 'cam', shot: { kind: 'dolly', from: [-58.5, 1.8, 97.5], to: [-59.5, 1.6, 95.5], look: [-61.5, 0.9, 90.3], s: 6 } },
    { do: 'sfx', id: 'door-creak', at: 'car', async: true },
    { do: 'exit', who: 'player' },
    { do: 'walk', who: 'player', path: [[-56.2, 92.4], [-60, 92.2], [-62.4, 90.4]] },
    { do: 'face', who: 'player', at: 'keeper', s: 0.3 },
    // The shop bell over John's door, a beat before the first line.
    { do: 'sfx', id: 'bell', at: 'keeper', async: true },
    { do: 'cam', shot: { kind: 'cut', pos: [-65.4, 1.35, 88.9], look: 'player', fov: 46 } },
    { do: 'say', who: 'player', text: 'Evening, John. I need spark plugs and a reason to keep driving.' },
    { do: 'cam', shot: { kind: 'cut', pos: [-60.9, 1.35, 91.4], look: 'keeper', fov: 46 } },
    { do: 'gesture', who: 'keeper', name: 'point', s: 1.2, async: true },
    { do: 'say', who: 'keeper', text: 'Spark plugs are aisle two. The lukewarm Acorn-Cola is free if you do not tell anyone.' },
    // E09 variety: the same frame as the first, drifting in a little, so the three talk cuts are not identical.
    { do: 'cam', shot: { kind: 'dolly', from: [-65.4, 1.35, 88.9], to: [-65.0, 1.38, 89.2], look: 'player', s: 6, fov: 46 } },
    { do: 'sfx', id: 'cloth', at: 'player', async: true },
    { do: 'gesture', who: 'player', name: 'shrug', s: 1.0, async: true },
    { do: 'say', who: 'player', text: 'I will take the Acorn-Cola. Put the plugs on my tab.' },
    { do: 'cam', shot: { kind: 'orbit', around: 'keeper', radius: 2.6, height: 0.35, fromYaw: 1.2, toYaw: 2.0, s: 5 } },
    { do: 'gesture', who: 'keeper', name: 'nod', s: 0.9, async: true },
    { do: 'say', who: 'keeper', text: 'Asphalt says hello. She does not say anything else, so do not wait for it.' },
  ],
};
