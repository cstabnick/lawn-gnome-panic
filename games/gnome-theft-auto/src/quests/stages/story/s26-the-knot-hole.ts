// Story row 26: the stages its scenes play on (new ones), and extra quest ids for existing stages' usedBy.
// New: the Fence gap where Sorrel records the rain, at the glowing knot-hole of the old west fence in Mossy Wood (the same
// bay of the fence as Knot-Hole Nora's post, `knot-hole` in wilds.ts; this stage stands a few metres south-east of her
// thimble, round the crate and the pail). The Side-Valve bay is the existing `side-valve-bay` stage, listed in USES.
import { cam, mark, type Stage } from '../kit';

/** The glowing knot in the fence panel: x on the old fence line, z the panel's middle (levels: setpiece `knot-hole`). */
const KNOT: [number, number] = [-594.4, -120];

export const STAGES: readonly Stage[] = [
  {
    id: 'knot-hole-recording',
    name: 'The Fence gap, where Sorrel records the rain',
    region: 'mossy-wood',
    center: [-588, -120],
    radius: 9,
    facing: -Math.PI / 2,
    time: 'night',
    built: 'dressed',
    usedBy: ['m26-the-knot-hole'],
    look: 'The old west fence at night, a tall panel of split cedar with one window cut in it and a knot in the window glowing amber, a crate and a pail at its foot, a microphone on a stand pointed at the knot and a boombox on the grass.',
    sounds: 'Wire humming in the wind, a creak of old cedar, and far off, as if behind the boards, a soft steady rain that does not fall on this side.',
    marks: [
      mark('sorrel', [-587, -117.2], KNOT, 'stand', 'stands by her microphone, headphones round her neck, the recorder running'),
      mark('pip', [-589.8, -122], KNOT, 'stand', 'stands at the foot of the knot-hole, face lifted, the toolbox in both arms'),
      mark('pip', [-584.8, -122.6], KNOT, 'stand', 'arrives from the pull-up, slowly'),
      mark('player', [-587.6, -124], KNOT, 'stand', 'stands a pace behind Pip and a little to one side'),
    ],
    cameras: [
      cam('wide', [-577, 2.2, -127], [-592, 3.0, -120], 'establishing: three small figures at the foot of a tall fence, the knot glowing above them', 48),
      cam('glow', [-587.2, 0.8, -124.4], [-594.2, 4.2, -120.4], 'low, behind Pip, up at the glowing knot: what he is looking at', 46),
      cam('mic', [-586.2, 0.9, -113.4], [-591.3, 1.2, -116.8], 'low on the microphone and the boombox, the rain recorder at work', 40),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [
      { prefab: 'groan-mic-stand', at: [-591.3, -116.8], yaw: -1.2, scale: 1.4 },
      { prefab: 'gsr-boombox', at: [-589.4, -115.6], yaw: 0.6, scale: 1.2 },
    ],
  },
];
/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Readonly<Record<string, readonly string[]>> = {
  'side-valve-bay': ['m26-the-knot-hole'],
};
