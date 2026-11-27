// Story row 60 (The Moles Dig): the stages its three scenes play on, all at Fort Sandpit (config.ts BASE: the walls run x 340..408,
// z -34..34, the gate gap is at (374, 34) on the south wall, the armory is at (374, 10) inside).
// - m60-dune-dusk (intro, dusk): a dune south of the fort, below the gate road (the walled lot at x 411..425 is east of it). Nubbin and two diggers have come over the
//   sand in single file with a tiny pickaxe each; Commander Diggs has walked out to look at them; far off on the next ridge a Hat
//   Watch spotter has a brass spyglass. The quest's meeting point (and the escort's first waypoint) is here.
// - m60-armory-night (mid and outro, night): the armory yard inside the fort. The armory is not a building in the world (its doors
//   are only a toast in the quests), so the scenes carry a cutscene-only set of props: a sealed steel container with a padlock bar,
//   an HOA notice, a pegboard tool wall, lanterns and sandbags. The hole in the floor is at HOLE below. Nothing here is built into
//   the world; the dig mouth the player holds is outside the south wall at (392, 46), reached on the gate road side (no stage).
import { cam, mark, type Stage } from '../kit';

const ID = 'm60-the-moles-dig';

export const STAGES: readonly Stage[] = [
  {
    id: 'm60-dune-dusk',
    name: 'The dune south of Fort Sandpit at dusk',
    region: 'dust-flats',
    center: [406, 110],
    radius: 12,
    facing: Math.PI,
    time: 'golden',
    built: 'existing',
    usedBy: [ID],
    look: 'A long gold dune in the last low sun, the fort walls pink to the north-west, three small grey moles in single file with a pickaxe each, their shadows ten times their size, and one very tall commander at the crest with his arms behind his back.',
    sounds: 'Sand hissing off the crest, a tiny pickaxe tapping the dune twice, a squeak, boots, a brass spyglass clicking far off.',
    marks: [
      mark('nubbin', [407.4, 110.6], [402.4, 106.6], 'stand', 'at the front of the line, a tiny pickaxe planted point-down in the crest like a flag, satchel straight'),
      mark('digger', [405.2, 113.2], [402.4, 106.6], 'stand', 'second in line, pickaxe over the shoulder, looking up at the commander'),
      mark('digger', [409.8, 113.6], [402.4, 106.6], 'stand', 'last in line, sniffing the air for sand that will not hold'),
      mark('diggs', [398, 102.6], [407.4, 110.6], 'stand', 'at the crest, rifle slung, hands behind his back, staring down at three moles'),
      mark('player', [402.4, 106.6], [407.4, 110.6], 'stand', 'up the dune from the gate road, hat in hand, a little late'),
      mark('hoa-spotter', [362, 122], [407.4, 110.6], 'stand', 'far off on the next ridge, a brass spyglass up, tiny'),
    ],
    cameras: [
      cam('crest', [396.6, 0.5, 100], [407, 0.9, 110.4], 'ground level on the dune at a mole\'s eye line: Nubbin and his pickaxe, the sky behind them gold', 44),
      cam('line', [412.8, 0.6, 119], [406, 0.8, 112.6], 'low from the south: the three moles in single file, the long shadows, Diggs a tall shape behind them', 42),
      cam('wide', [389, 4.4, 92], [406, 1.0, 110], 'high and back on the gate-road side: the dune, the moles small on it, the fort wall at the edge of frame', 50),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
  {
    id: 'm60-armory-night',
    name: 'The Fort Sandpit armory yard at night',
    region: 'dust-flats',
    center: [374, 10],
    radius: 14,
    facing: Math.PI,
    time: 'night',
    built: 'existing',
    usedBy: [ID],
    look: 'A swept yard inside the sandbag wall: a sealed steel container with a padlock bar and an HOA notice, a pegboard tool wall in the dark beside it with the spades hung in rows, two lanterns on posts throwing orange on the sand, and a patch of floor that has started to move.',
    sounds: 'Lantern wicks, wind in the sandbags, a boot on gravel, a tap from below the floor, then another, then sand falling.',
    marks: [
      mark('diggs', [373.6, 3.1], [374, 1.2], 'stand', 'the mid: at the sealed door, one flat hand on the steel, listening'),
      mark('diggs', [375.0, 14.4], [375, 9.0], 'stand', 'the outro: at attention over the hole, rifle slung, a very tall shadow'),
      mark('nubbin', [375.0, 11.6], [375, 14.4], 'stand', 'the outro: just out of the floor, satchel full of sand, standing as straight as a mole can'),
      mark('spade-guard', [371.4, 15.0], [375, 9.0], 'stand', 'the outro: left of the Commander, rifle slung, hand ready to salute'),
      mark('spade-guard', [378.6, 15.2], [375, 9.0], 'stand', 'the outro: right of the Commander, hat slightly off'),
      mark('digger', [372.8, 11.8], [375, 14.4], 'stand', 'the outro: second out of the floor, pickaxe over the shoulder'),
      mark('digger', [377.2, 12.0], [375, 14.4], 'stand', 'the outro: third out of the floor, sniffing at the gravel'),
      mark('player', [378.6, 19.6], [375, 14.4], 'stand', 'the outro: in through the gate and up the yard to see it'),
    ],
    cameras: [
      cam('yard', [360.4, 3.2, 22], [374, 1.2, 8], 'establishing from the south-west corner of the yard: container, pegboard, lanterns, the dark patch of floor', 50),
      cam('floor', [379.4, 0.35, 12.6], [375, 0.25, 9], 'ground level beside the patch of floor: the sand about to move, boots at the edge of frame', 40),
      cam('door', [369.6, 1.4, 1.0], [373.6, 1.5, 3.1], 'from beside the container at the sealed door: Diggs in near profile, his hand flat on the steel, the lantern behind him', 38),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
];

/** Existing stage id -> this row's quest ids: the gate and the pad are where the escort and the derby end up. */
export const USES: Record<string, string[]> = {
  'fort-sandpit-gate': [ID],
};
