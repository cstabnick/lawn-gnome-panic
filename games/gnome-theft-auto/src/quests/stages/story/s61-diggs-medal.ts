// Story row 61 stages: Diggs's Medal. Two places. Diggs's yard in Pebblewick (the giver `diggs-bungalow` stands at its
// gate; the E10 yard and the hut are already in the world: a corrugated fence with a gate gap at x 613..617, the Nissen
// hut with its door and two lit windows on the north face at z ~218, a half-dug hole with a spade and a deck chair at its
// edge). And the HOA lost-property shed outside Fort Sandpit's gate (new: a beige site cabin with a rail of tagged hats,
// the bin, cones; built as set dressing, kept after the quest as part of the gate). The roster wall and the hung medal
// are shown only in the scenes (scene props), never in the world.
import { cam, car, mark, type Stage } from '../kit';

export const STAGES: readonly Stage[] = [
  {
    id: 'diggs-yard',
    name: "Commander Diggs's yard, Pebblewick",
    region: 'dust-flats',
    center: [615, 213],
    radius: 12,
    facing: Math.PI,
    time: 'golden',
    built: 'existing',
    givers: ['diggs-bungalow'],
    usedBy: ['m61-diggs-medal'],
    look: 'A tin Nissen hut in a corrugated yard at dusk, one lit window either side of the door, a half-dug hole with a spade standing in it and a deck chair at its edge that nobody has sat in, a hammock of sacks, a mailbox, a sign that says no.',
    sounds: 'Wind through corrugated tin, the hut ticking as it cools, a hen in the town, a gate latch, boots on packed sand.',
    marks: [
      mark('diggs', [615, 217.4], [615, 211], 'stand', 'at attention at his door, facing the gate, a long shadow behind him'),
      mark('player', [615, 213.2], [615, 217.4], 'stand', 'steps through the gate gap and stops at the proper distance'),
      mark('player', [614.4, 213.8], [611.8, 215.8], 'stand', 'comes up the yard with the medal held by its ribbon'),
      mark('yarrow', [617.3, 212.6], [611.8, 215.8], 'stand', 'stands inside the gate by the fence, ledger held to his chest, watching'),
    ],
    cameras: [
      cam('gate-wide', [615, 1.5, 203.4], [615, 1.4, 217], 'low from the road through the gate gap onto the hut, the lit windows and the figure at the door', 46),
      cam('wall-insert', [613.9, 1.5, 214.6], [613.1, 1.25, 218.4], 'an insert on the board of rosters beside the door, the one empty nail in the middle', 38),
      cam('yard-side', [621.4, 1.7, 213.4], [611.8, 1.0, 215.8], 'from the east side of the yard across to the deck chair at the hole, the hut dark behind it', 44),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'hoa-lost-property',
    name: 'HOA lost-property shed, Fort Sandpit gate',
    region: 'dust-flats',
    center: [398, 59],
    radius: 14,
    facing: -Math.PI / 2,
    time: 'day',
    built: 'dressed',
    usedBy: ['m61-diggs-medal'],
    look: 'A beige site cabin by the fort-gate road with a hatch, a hook rail of tagged lost hats outside it, a lost-property bin, two cones and a stencilled sign; on the rail, one tin star on a faded green ribbon with a beige tag on it.',
    sounds: 'A stapler, a rubber stamp, a radio inside the gatehouse a long way off, wind in the tags on the rail.',
    marks: [
      mark('hoa-clerk', [399.4, 56], [394, 58], 'stand', 'behind the hatch, stamping a tag without looking up'),
      mark('hoa-clerk', [397.8, 62.4], [394, 58], 'stand', 'counting lost gloves into a bin'),
      mark('player', [395.5, 58.4], [399.8, 58], 'stand', 'steps up to the hook rail by the hatch'),
    ],
    cameras: [
      cam('shed-wide', [388.5, 1.7, 66], [400.5, 1.3, 58], 'from the fort-gate road onto the cabin and its rail of hats', 46),
      cam('rail', [396.2, 1.3, 59.8], [400.2, 1.2, 58.4], 'close on the hook rail, the hats, and the tin star with its beige tag', 36),
    ],
    walks: [],
    vehicles: [
      car('lost-property-van', 'parked', 'hoa-van', [392, 66], Math.PI, undefined, 'the clerks\' van, back doors open, a crate of unclaimed umbrellas in it'),
    ],
    paths: [],
    set: [
      { prefab: 'portacabin', at: [404, 58], yaw: -Math.PI / 2, scale: 1, solid: [3, 1.3, 2.6], always: true },
      { prefab: 'hat-rail', at: [399.7, 58.4], yaw: -Math.PI / 2, scale: 1.3, always: true },
      { prefab: 'lost-property-bin', at: [399.6, 62.4], yaw: -Math.PI / 2, scale: 1.2, solid: [0.5, 0.5, 0.9], always: true },
      { prefab: 'site-cone', at: [397.4, 54.4], yaw: 0, scale: 1.2 },
      { prefab: 'site-cone', at: [397.4, 64], yaw: 0, scale: 1.2 },
    ],
  },
];

/** Existing stage id -> this row's quest ids (the fort gate road is the way to the shed). */
export const USES: Record<string, string[]> = {
  'fort-sandpit-gate': ['m61-diggs-medal'],
};
