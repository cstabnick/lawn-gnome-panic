// Story row 68 (m68-lights-out): the stages its scenes play on. Six places: the stairwell door of Saucer Court at dusk (intro: the
// guests queue under Hyssop's lollipop), the four doors of the last night tour (mid: Juniper's terrace on Kerb Row, the step of
// Bodega & Sons, the sealed Side-Valve bay with its key under the mat, Granny's farmhouse porch in Cloverfield), and the roof of
// the north wing (outro: a cutscene-only roof terrace, built in the scene from a viewing platform, with the Combine's glow far
// off on the north horizon). Door marks stand on the pavement outside each door, clear of the other stages' marks.
import { cam, mark, type Stage } from '../kit';

/** The roof terrace is real set dressing: a viewing platform laid over the zinc mansard of the north wing, 13.4 m up (deck top 14.4). */
export const ROOF_LIFT = 13.4;

const ROW = ['m68-lights-out'];

export const STAGES: readonly Stage[] = [
  {
    id: 'm68-stair-dusk',
    name: 'Saucer Court, the stairwell door at dusk',
    region: 'turfton',
    center: [30, 85],
    radius: 8,
    facing: Math.PI,
    time: 'dusk',
    built: 'existing',
    usedBy: ROW,
    look: 'The north wing of the courtyard in low gold light: the stairwell door open, a leaning stop sign, the dry saucer behind, and a queue of six on the paving with a pie, a briefcase and a broom between them.',
    sounds: 'A washing line creaking, boots on gravel, a kettle somewhere above, a warden counting under her breath.',
    marks: [
      mark('hyssop', [30, 79.9], 0, 'stand', 'on the top step in the stairwell doorway, the stop-sign lollipop planted across it like a barrier bar'),
      mark('juniper', [28.2, 83.6], [30, 79.9], 'stand', 'at the head of the queue, a briefcase in one hand, two days out of the City Hall sub-basement'),
      mark('granny', [31.9, 84.0], [30, 79.9], 'stand', 'second in the queue with a pie tin held level in both hands'),
      mark('bodega', [27.2, 85.6], [30, 79.9], 'stand', 'third, a folded broom under one arm'),
      mark('tansy', [32.8, 85.4], [30, 79.9], 'stand', 'fourth, arms crossed, the key ring in her pocket'),
      mark('pip', [29.4, 87.2], [30, 79.9], 'stand', 'at the back, bouncing on his toes, a toolbox in each hand'),
      mark('player', [31.0, 88.0], [30, 79.9], 'stand', 'at the back of the queue, last up the stairs'),
    ],
    cameras: [
      cam('wide', [30, 3.6, 96], [30, 1.6, 80.5], 'from across the saucer, the queue and the stair door, Hyssop small and upright in it'),
      cam('queue-low', [34.4, 0.7, 90], [29.4, 1.3, 83.6], 'low at the back of the queue, six boots and a pie tin'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'm68-door-juniper',
    name: "Juniper Vance's doorstep, Kerb Row, at night",
    region: 'turfton',
    center: [-90, 127],
    radius: 6,
    facing: Math.PI,
    time: 'night',
    built: 'existing',
    usedBy: ROW,
    look: 'A narrow terrace with one porch lamp lit, a brass J. VANCE plate, a boot scraper and the straightest hedge on the street.',
    sounds: 'The porch lamp humming, a key that has been in the lock for years, a very far siren going the other way.',
    marks: [
      mark('juniper', [-90, 128.6], [-91.4, 125.2], 'stand', 'on her doorstep under the porch lamp, the briefcase at her feet, her key already out'),
      mark('player', [-91.4, 125.2], [-90, 128.6], 'stand', 'on the pavement at the foot of the step'),
    ],
    cameras: [],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'm68-door-bodega',
    name: 'Bodega & Sons at night, the step',
    region: 'turfton',
    center: [-76, 90],
    radius: 6,
    facing: Math.PI / 2,
    time: 'night',
    built: 'existing',
    usedBy: ROW,
    look: 'The neon window of Bodega & Sons on the east face, buzzing, the one lit sign on the block; a swept step, a crate with a cat on it.',
    sounds: 'The neon buzz, a broom on stone, a cat purring.',
    marks: [
      mark('bodega', [-80, 88], [-72, 89], 'work', 'on the swept step under the neon, the broom in his hands'),
      mark('player', [-72.4, 89], [-80, 88], 'stand', 'on the pavement, the x = -60 road behind'),
    ],
    cameras: [],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'm68-door-bay',
    name: 'Side-Valve Salvage, the sealed bay, at night',
    region: 'turfton',
    center: [-148, 70],
    radius: 7,
    facing: Math.PI,
    time: 'night',
    built: 'dressed',
    usedBy: ROW,
    look: 'The boarded west half of the bay front under the red SEIZED banner, two beige guards in the dark by the wall, the walk-in door on the east half with a doormat in front of it.',
    sounds: 'A far dog, a banner flapping, boots on concrete, the click of a lock that nobody has changed.',
    marks: [
      mark('tansy', [-150, 74.2], [-146, 68], 'stand', 'at the walk-in door, crouched at the mat with one hand under it'),
      mark('player', [-146, 68], [-150, 74.2], 'stand', 'on the apron a few paces back'),
    ],
    cameras: [],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'm68-door-farm',
    name: "Granny's farmhouse porch, Cloverfield, at night",
    region: 'cloverfield-farms',
    center: [-60, 336],
    radius: 6,
    facing: Math.PI / 2,
    time: 'night',
    built: 'existing',
    usedBy: ROW,
    look: 'The cabin porch with its rocking chair and one lamp, the oven ticking cool in the yard, a farm radio playing bluegrass very low behind the door.',
    sounds: 'Crickets, the oven ticking, a rocking chair that someone has just left, a radio turned down.',
    marks: [
      mark('granny', [-64.4, 335], [-58.4, 336.6], 'stand', 'on the porch step by the rocking chair, the pie tin on her hip, her own door at her back'),
      mark('player', [-58.4, 336.6], [-64.4, 335], 'stand', 'in the yard at the foot of the step'),
    ],
    cameras: [],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'm68-roof',
    name: 'Saucer Court, the roof of the north wing, late night',
    region: 'turfton',
    center: [30, 82.5], // the courtyard under the roof (the terrace itself is up at y 14.4, in the set below)
    radius: 10,
    facing: Math.PI,
    time: 'night',
    built: 'dressed',
    usedBy: ROW,
    look: 'A plank roof terrace laid over the zinc mansard: a rail on the north side with a brass telescope on it, a crate, two cocoa mugs, a toolbox; below it the lit windows of Turfton; far north on the horizon the orange glow of the Grand Combine.',
    sounds: 'Night wind across a roof, a far engine idling, a washing line three storeys down, no one talking.',
    marks: [
      mark('pip', [28.6, 72.5], [30, 60], 'stand', 'at the north rail, a cocoa mug in his hand, the red hat very still for once', 14.4),
      mark('player', [31.4, 72.5], [30, 60], 'stand', 'beside him at the rail, a mug of their own', 14.4),
    ],
    cameras: [],
    walks: [],
    vehicles: [],
    paths: [],
    // Solid: the terrace's deck is a floor (top 14.4 m up) for the line-of-sight check and for Pip's and the player's feet.
    set: [{ prefab: 'viewing-platform', at: [30, 74], yaw: Math.PI, lift: ROOF_LIFT, solid: [4, 3, ROOF_LIFT + 1.0] }],
  },
];

/** Existing stage id -> this row's quest ids to add to its usedBy (the row stands on its own stages). */
export const USES: Record<string, string[]> = {};
