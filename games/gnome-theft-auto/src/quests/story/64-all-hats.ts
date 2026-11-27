// Story row 64 (docs/design/gnome-theft-auto/story-outline.md): All Hats, part 3 and the final. Previously: Don Compost's
// crews are in (row 63), the Bathtub Queen is up the canal (p1) and the planes are ready (p2). This is the whole coalition
// at one table: the high of the game (batch-3 notes section 2: tension 6 -> 7, comedy first, a sincere last minute).
// - p3 By Road (dusk): Lulu and the three Carburettors who stayed (R-233: Big-End Bertha, Dipstick Dunstan, Fanbelt
//   Fennimore) wait in the Rutbottom Dirt Bowl pits; Lulu rides point on a borrowed dirt bike. The player follows her down
//   the band road and the east highway to the foot of the overlook rise, where the engines park in a ring.
// - final By Root (night): the overlook camp (W16 builds it afterwards on the same spots, worldChanges/rows/
//   coalitionCamp.ts). The Flock are there first, on one leg; the Unmowed walk in out of the scrub and the Burrowfolk come
//   up through the ground; the Spade Guard march up from the highway with Granny's Ride-On stuck behind them. Every
//   faction leaves a cap at the slot where its tent will stand; the player hangs each on the rail; Tansy counts them out
//   loud at the table and says "All hats." Granny's pie rung pays in the outro ("I brought pie."). The Countess's absence
//   is named in the intro (she comes in row 65).
// Scenes: cutscene/scenes/story/m64-all-hats.ts. Stages: quests/stages/story/s64-all-hats.ts.
import { BOWL_GATE } from '../../rutbottom/spots';
import { CAST } from '../../cutscene/cast';
import type { InspectPoint, QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const P3 = 'm64-all-hats-p3';
const FINAL = 'm64-all-hats';

/** The camp centre (W16 CAMP) and a point on W16's faction ring at `deg` (from +x towards +z), `r` metres out. */
const CAMP: [number, number] = [246, 82];
function slot(deg: number, r = 7.5): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [Math.round((CAMP[0] + Math.cos(a) * r) * 100) / 100, Math.round((CAMP[1] + Math.sin(a) * r) * 100) / 100];
}

/** Where the convoy parks: the foot of the overlook rise, west of the highway bend (stage m64-overlook-ring). */
const RING: [number, number] = [288, 70];
/** The bike's slot in the ring, where Lulu stops. */
const RING_BIKE: [number, number] = [282.98, 71.35];

/**
 * The caps, one per faction, each left at the slot where that faction's tent goes up (W16's ring). Each note is a
 * memory of what the crew did with them, told as the cap goes on the rail.
 */
const HATS: InspectPoint[] = [
  {
    at: slot(30),
    label: "The Carburettors' pitch: Lulu's crash helmet",
    prop: 'gta-crash-helmet',
    radius: 2,
    note: "Lulu's crash helmet, first on the rail. You beat her up a mountain; she brought the road.",
  },
  {
    at: slot(81),
    label: "The Underspanners' pitch: Hogweed's goggles",
    prop: 'underspan-goggles',
    radius: 2,
    note: "Hogweed's welding goggles go on a post. Not a hat, he says. A permit is pending.",
  },
  {
    at: slot(133),
    label: "The Unmowed's pitch: Elder Bracken's leaf cap",
    prop: 'hedge-hopper-cap',
    radius: 2,
    note: "Elder Bracken's leaf cap. He lent you the Stopping Stone. He has not given it.",
  },
  {
    at: slot(184),
    label: "The Burrowfolk's pitch: a digging helmet",
    prop: 'mole-lamp-helmet',
    radius: 2,
    note: 'Moles do not wear hats. Tumblesoil sends a digging helmet: they dug you into a fort.',
  },
  {
    at: slot(236),
    label: "The Spade Guard's pitch: Diggs's campaign hat",
    prop: 'ranger-campaign-hat',
    radius: 2,
    note: "Commander Diggs's campaign hat, hung square. Fifteen years, and nobody asked. Tansy asked.",
  },
  {
    at: slot(287),
    label: "The Flock's pitch: Mother Saxifrage's tall hat",
    prop: 'pointy-hat',
    radius: 2,
    note: "Mother Saxifrage's tall hat. The Flock stood in the Combine's line for you, on one leg.",
  },
  {
    at: slot(339),
    label: "Granny's pie table: her garden straw",
    prop: 'croft-straw-hat',
    radius: 2,
    note: "Granny's garden straw. The purple one stays on her head: she is cooking.",
  },
];

const QUESTS: readonly QuestDef[] = [
  {
    id: P3,
    title: 'All Hats: By Road',
    giver: 'dust-overlook',
    prereq: 'm64-all-hats-p2',
    chapter: 4,
    rewardAcorns: 400,
    radioBulletin: P3,
    // A friendly convoy on open roads: no Hat Watch on the drive.
    hoa: 'off',
    objectives: [
      {
        // The intro plays where it happens: the Carburettors' entrance, in the Dirt Bowl pits at dusk.
        kind: 'visit',
        text: 'Drive to the Rutbottom Dirt Bowl, where Lulu and the Carburettors are waiting',
        at: [BOWL_GATE.x + 6, BOWL_GATE.z + 3],
        radius: 8,
        hint: 'Out the east highway to its end, north up the band road, in at the Dirt Bowl gate',
        scene: 'all-hats-p3-intro',
      },
      {
        // The convoy: Lulu rides point and waits whenever the player falls behind (chase-follow waits; it never fails).
        kind: 'chase-follow',
        text: "Follow Lulu's dirt bike at the back of the convoy, down to the overlook",
        leaderName: 'Lugnut Lulu',
        leaderKind: 'dirt-bike',
        leaderLook: CAST['lugnut lulu'].look,
        // Out of the gate, south down the band road, west along the east highway past Pebblewick and the fort, then off
        // the highway bend across the dust to the foot of the rise.
        waypoints: [[1012, -652], [950, -650], [940, 24], [650, 20], [450, 70], [300, 40], RING_BIKE],
        speed: 12,
        maxDist: 90,
        hint: "Lulu's dirt bike, at the head of the convoy",
      },
      {
        kind: 'visit',
        text: 'Park in the ring with the Carburettors at the foot of the rise',
        at: RING,
        radius: 9,
        hint: 'The foot of the overlook rise, west of the highway bend',
      },
    ],
    // Dusk: the engines in a ring, headlights in; up the rise, one fire.
    outro: { kind: 'script', script: 'all-hats-p3-outro' },
    doneText: "Lulu brought the road: three Carburettors and her own lowrider, parked in a ring at the foot of the overlook. They are early. They are never early.",
  },
  {
    // The final part keeps the row id (prereq chain: p1 <- m63, p2 <- p1, p3 <- p2, this <- p3).
    id: FINAL,
    title: 'All Hats: By Root',
    giver: 'dust-overlook',
    prereq: P3,
    chapter: 4,
    rewardAcorns: 1200,
    radioBulletin: FINAL,
    achievement: 'gta-all-hats',
    // A supper, not a fight: no Hat Watch at the camp.
    hoa: 'off',
    // Night at the camp: Pip builds the table, the Flock are already there, Tansy says it is her problem.
    cutscene: { kind: 'script', script: 'all-hats-p4-intro' },
    // Night: every cap on the rail, Granny's pie in the middle, Tansy counts them and says "All hats."
    outro: { kind: 'script', script: 'all-hats-outro' },
    objectives: [
      {
        kind: 'visit',
        text: 'Meet the lanterns coming out of the scrub at the west edge of the camp',
        at: [237.5, 84.0],
        radius: 6,
        hint: 'The west edge of the camp, on the rise above the highway',
        scene: 'all-hats-p4-roots',
      },
      {
        kind: 'visit',
        text: 'Meet the Spade Guard where the track comes up from the highway',
        at: [253.6, 78.6],
        radius: 6,
        hint: 'The east edge of the camp, at the top of the track',
        scene: 'all-hats-p4-guard',
      },
      {
        kind: 'inspect',
        text: "Every faction left a cap where its tent will stand: hang each one on the rail",
        verb: 'Hang',
        holdSeconds: 0.8,
        hint: 'Round the camp, one cap at each pitch',
        points: HATS,
      },
      {
        kind: 'visit',
        text: 'Tell Tansy the rail is full: she is at the heist board',
        at: [252.8, 82.6],
        radius: 2.5,
        hint: 'The heist board, at the east edge of the camp',
      },
    ],
    doneText: 'Every faction hung a cap on one rail, and Tansy counted them and said "All hats." The overlook is the coalition camp now.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    [P3]: {
      0: brief(
        ['tansy', 'The Queen is moored and the planes are fuelled. Now the engines.'],
        ["tansy", "Lulu's waiting at the Rutbottom Dirt Bowl with the Carburettors who stayed. Bring them."],
        ['tansy', 'East highway to its end, then north up the band road. Four hundred acorns.'],
      ),
      1: call(
        ['lugnut lulu', 'Carburettors, on me! Bike up front, cars behind, you at the back.'],
        ['lugnut lulu', 'Fall behind and I wait. Nobody gets left at a junction.'],
      ),
      2: call(['lugnut lulu', 'See that fire up the rise? Your lot. Ring up at the foot!']),
    },
    [FINAL]: {
      0: brief(
        ['tansy', "The Don's crews. The Queen. The planes. Lulu's engines. That leaves the old ones."],
        ['tansy', 'Unmowed, Burrowfolk, the Guard, Granny. Tonight, at the camp on the rise.'],
        ['tansy', 'Meet them as they come in. Twelve hundred acorns. Supper is on Granny.'],
      ),
      1: call(
        ['diggs', 'Spade Guard on the track from the highway. Marching. Farm vehicle to our rear.'],
        ['granny', 'I do not overtake soldiers, sugar. Take your time.'],
      ),
      2: call(['tansy', 'Everybody left a cap where they are pitching. Bring every one to the rail.']),
      3: call(['pip', "That's all of them! Tansy's at the board. She's got her counting face on."]),
    },
  },
  plans: {
    [P3]: { suite: 'story', expect: 'pass' },
    [FINAL]: { suite: 'story', expect: 'pass' },
  },
  bulletins: {
    [P3]: [
      'Motorists on the east highway report a convoy of three lowriders at dusk, led by a dirt bike, all driving at the posted speed and sounding their horns at it.',
      'The HOA reminds residents that the Carburettors are not a chartered club. The Carburettors remind the HOA, at length, by horn.',
    ],
    [FINAL]: [
      'A great many gnomes are camped on the Dust Flats overlook tonight. Observers count tents, lanterns, one long table and a single pie.',
      'Asked who is in charge of the overlook camp, one resident said "Tansy", one said "the pie", and a mole said "most kind".',
    ],
  },
};
