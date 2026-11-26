// Story row 42 stages (Rutbottom Dirt Bowl: rutbottom/spots.ts).
// - bowl-gate-fence: the fence just inside the road gate, west of the pits, where Lulu waits (giver lulu-dirt-bowl).
// - bowl-impound: the impound yard in the pits, six Carburettor rides taped up by the HOA in two rows.
// - the existing rutbottom-tower stage carries the outro (Clary's green flag on the start line).
import { cam, car, mark, type Stage } from '../kit';

const ID = 'm42-rutbottom-impound';

export const STAGES: readonly Stage[] = [
  {
    id: 'bowl-gate-fence',
    name: 'Rutbottom Dirt Bowl, the gate fence',
    region: 'east-campus',
    center: [1008, -642],
    radius: 10,
    facing: Math.PI / 2,
    time: 'golden',
    built: 'existing',
    givers: ['lulu-dirt-bowl'],
    usedBy: [ID],
    look: 'The corrugated fence just inside the road gate, dust hanging gold in the late sun, the pits and their taped-up rows of lowriders beyond it.',
    sounds: 'Two-strokes warming up over the berm, gravel on tin, a cap-gun rattle from the pits, Lulu drumming her fingers on a fence post.',
    marks: [
      mark('lulu', [1008, -641.5], [1024, -682], 'lean', 'leaning on the fence post, arms crossed, looking at the impound rows'),
      mark('player', [1004.4, -645], [1008, -641.5], 'stand', 'steps in through the gate'),
    ],
    cameras: [
      cam('fence-face', [1003, 1.5, -648], [1008, 1.5, -641.5], 'from the gate onto Lulu at the fence', 46),
      cam('fence-yard', [1005.5, 1.2, -650], [1022, 0.9, -684], 'along the fence across the dusty pits onto the taped-up rides', 50),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'bowl-impound',
    name: 'Rutbottom Dirt Bowl, the impound yard',
    region: 'east-campus',
    center: [1020, -684],
    radius: 14,
    facing: Math.PI,
    time: 'golden',
    built: 'dressed',
    usedBy: [ID],
    look: 'Two rows of three Carburettor lowriders on the packed dirt, each wrapped in beige HOA tape and stamped with a clipboard notice, a chain-link pen round them and a beige bunting of warnings strung over the top.',
    sounds: 'Tape fluttering in the dust wind, a clipboard slapping a bonnet, a lowrider hydraulic sighing once.',
    marks: [
      mark('lulu', [1011, -672], [1020, -684], 'stand', 'at the pen, one hand flat on the nearest bonnet'),
      mark('player', [1007, -668], [1020, -684], 'stand', 'alongside her at the chain-link'),
    ],
    cameras: [
      cam('impound-low', [1008, 0.8, -668], [1022, 0.8, -686], 'low along the fence at the six taped rides', 50),
    ],
    walks: [],
    vehicles: [
      car('impound-1', 'parked', 'lowrider', [1013, -680], Math.PI / 2, 'lulu', 'taped, first row'),
      car('impound-2', 'parked', 'lowrider', [1021, -680], Math.PI / 2, undefined, 'taped, first row'),
      car('impound-3', 'parked', 'lowrider', [1029, -680], Math.PI / 2, undefined, 'taped, first row'),
      car('impound-4', 'parked', 'lowrider', [1013, -690], Math.PI / 2, undefined, 'taped, second row'),
      car('impound-5', 'parked', 'lowrider', [1021, -690], Math.PI / 2, undefined, 'taped, second row'),
      car('impound-6', 'parked', 'lowrider', [1029, -690], Math.PI / 2, undefined, 'taped, second row'),
    ],
    paths: [],
    set: [
      { prefab: 'chain-link-fence', at: [1007, -676], yaw: Math.PI / 2 },
      { prefab: 'bunting-span', at: [1021, -685], yaw: Math.PI / 2, scale: 1.1, lift: 1.3 },
    ],
  },
];

/** Existing stage id -> this row's quest ids. */
export const USES: Record<string, string[]> = { 'rutbottom-tower': [ID] };
