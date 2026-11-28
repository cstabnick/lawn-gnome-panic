// The back room: Juniper walks into the Mulch Club, the doorman stands guard, and the music turns from mystery to
// tension when she speaks up.
import type { SceneScript } from '../script';

export const BACK_ROOM: SceneScript = {
  id: 'back-room',
  stage: { kind: 'room', room: 'mulch-club' },
  title: 'The Mulch Club',
  music: 'mystery',
  ambience: 'room',
  actors: [
    { id: 'juniper', preset: 'juniper', name: 'Juniper', at: [6.2, 3.5], yaw: 3.4 },
    { id: 'guard', preset: 'diggs', name: 'Doorman', at: [-4.8, 0.6], yaw: 0.3 },
  ],
  steps: [
    { do: 'cam', shot: { kind: 'dolly', from: [0, 1.9, 10], to: [0, 1.7, 8], look: [0, 1.2, -3], s: 3 } },
    // The door latches behind her; the floorboards give her away on the way in.
    { do: 'sfx', id: 'latch', async: true },
    { do: 'sfx', id: 'creak', at: 'juniper', async: true },
    { do: 'walk', who: 'juniper', path: [[3.4, 0.2], [1.6, 0.4]] },
    { do: 'face', who: 'juniper', at: 'guard', s: 0.4 },
    { do: 'say', who: 'guard', text: 'The boss does not take visitors. He does not talk either.' },
    { do: 'sfx', id: 'cloth', at: 'juniper', async: true },
    { do: 'gesture', who: 'juniper', name: 'crossArms', s: 1.0 },
    { do: 'say', who: 'juniper', text: 'Then he can listen. Forty-one members, and I have read every one of your file cabinets.', music: 'tension' },
    { do: 'cam', shot: { kind: 'orbit', around: 'juniper', radius: 3.0, height: 1.8, fromYaw: -0.5, toYaw: -1.3, s: 5 }, wait: true },
    { do: 'cam', shot: { kind: 'cut', pos: [3.7, 1.9, 1.9], look: 'guard', fov: 46 } },
    { do: 'gesture', who: 'guard', name: 'crossArms', s: 1.2 },
    { do: 'say', who: 'guard', text: 'Nobody reads the cabinets. That is why the cabinets are still standing.' },
    { do: 'say', who: 'juniper', text: 'Watch me.' },
    { do: 'call', name: 'back-room-done' },
    { do: 'title', text: 'Off the Books' },
    { do: 'wait', s: 1.5 },
    { do: 'title', text: null },
  ],
};
