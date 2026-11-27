// Story row 64 (docs/design/gnome-theft-auto/story-outline.md): All Hats, the extended quest where the coalition gathers.
// This file holds parts 1 and 2; part 3 (By Road) and the final (By Root, the table) are in 64-all-hats.ts.
// Previously: Don Compost tapped four times (row 63) and his crews are in; now every other outcast in Turfton has to
// reach one table. Pip runs the plan off the other sock of his sock map (four red crosses: water, air, road, root), and
// Tansy lets him.
// - p1 By Water (dawn, day): Baroness Brenda opens New Puddle for one day (and charges for the waiver); the Bathtub
//   Queen waits in the dune cut (the Saltcut under the dune line, row 32) for a pilot; the player leads her up the cut
//   and across the Puddle Sea in Driftwood's walnut dinghy, and she ties up at Brenda's travelling throne at New Puddle
//   Marina, a flamingo on her bow. The Queen only sails in the scenes (L95); the lead is the dinghy's gates.
// - p2 By Air (day): Wally and Hogweed argue over a propeller on the Desert Airfield apron (ratios against "just fly it");
//   the player helps the Underspanners fit the beacon kit to the Crop Duster and flies it, Wally aboard, up to the Bobble,
//   the Hatbrim's summit and the yard's highest ground (R-234). Hogweed went up by road; Velma Crown at the Top Hat counts
//   the plane as a car; the kit comes down under Hogweed's parachute and the beacon goes up, to be lit at dawn on the
//   longest day. Back at the overlook, a line of odd aircraft and one Dewdrop waits on the apron.
// Scenes: cutscene/scenes/story/m64a-all-hats.ts. Stages: quests/stages/story/s64a-all-hats.ts.
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const P1 = 'm64-all-hats-p1';
const P2 = 'm64-all-hats-p2';

/** The lead up the dune cut and across the Puddle Sea: the Saltcut is ~14 m wide (centre x ~706 at z 912), then open water. */
const LEAD: { at: [number, number]; radius: number; label: string }[] = [
  { at: [707, 912], radius: 6, label: 'Up the dune cut, the Queen close behind' },
  { at: [703, 893], radius: 6, label: 'Out of the cut, bowsprit at your stern' },
  { at: [686, 864], radius: 8, label: 'Into the Puddle Sea' },
  { at: [660, 830], radius: 8, label: "Across the Republic's water" },
  { at: [646, 796], radius: 8, label: 'Off the east dock of New Puddle Marina' },
];

/** The Bobble's summit (mountainRoutes/defs/brimWalk.ts BRIM_WALK_SPOTS.summit (690, -1690)): the kit drop, just east of the cairn. */
const BOBBLE: [number, number] = [692, -1688];

const QUESTS: readonly QuestDef[] = [
  {
    id: P1,
    title: 'All Hats: By Water',
    giver: 'dust-overlook',
    prereq: 'm63-four-taps',
    chapter: 4,
    rewardAcorns: 300,
    radioBulletin: P1,
    // A lead up a channel and a royal favour: the Hat Watch has no business on the water today.
    hoa: 'off',
    // Dawn at the overlook rail: Pip's other sock, four red crosses; Tansy lets him run it.
    cutscene: { kind: 'script', script: 'all-hats-p1-intro' },
    // Day at New Puddle Marina: the Queen tied up at Brenda's travelling throne, Samphire saluting.
    outro: { kind: 'script', script: 'all-hats-p1-outro' },
    objectives: [
      {
        kind: 'visit',
        text: 'Ask Baroness Brenda to open New Puddle to the Bathtub Queen',
        at: [-40, 213],
        radius: 8,
        hint: "The Vinyl Lounge, Brenda's throne on the drainage canal",
        scene: 'all-hats-p1-toll',
      },
      {
        kind: 'visit',
        text: 'Meet the Bathtub Queen where she waits in the dune cut',
        at: [697, 932],
        radius: 9,
        hint: 'The dune line over the Saltcut, south of the Puddle Sea',
        scene: 'all-hats-p1-cut',
      },
      {
        kind: 'checkpoints',
        text: "Lead the Queen up the cut and across the Puddle Sea in Driftwood's dinghy",
        points: LEAD,
        vehicle: { kind: 'walnut-dinghy', at: [706.5, 928, Math.PI] },
        requireVehicle: 'walnut-dinghy',
        hint: 'The Saltcut, north into the Puddle Sea, then New Puddle Marina',
      },
      {
        kind: 'visit',
        text: 'Tie up at New Puddle Marina and step ashore by the east dock',
        at: [650, 762],
        radius: 6,
        hint: 'New Puddle Marina, the east dock',
      },
    ],
    doneText: 'The Bathtub Queen is tied up at New Puddle with a flamingo on her bow. By water: one cross on the sock.',
  },
  {
    id: P2,
    title: 'All Hats: By Air',
    giver: 'dust-overlook',
    prereq: P1,
    chapter: 4,
    rewardAcorns: 300,
    radioBulletin: P2,
    // A flight with friends and a fire on a hill: no Hat Watch.
    hoa: 'off',
    // Noon: Tansy takes Wally's call at the overlook; on the apron, Hogweed's ratios against Wally's "just fly it".
    cutscene: { kind: 'script', script: 'all-hats-p2-intro' },
    // Day at the overlook: Wally's binoculars on the apron, a line of aircraft and one Dewdrop.
    outro: { kind: 'script', script: 'all-hats-p2-outro' },
    // As the flight home starts: Velma counts the plane as a car; the kit comes down on the Bobble; the beacon goes up.
    beats: { 3: 'all-hats-p2-gap' },
    objectives: [
      {
        kind: 'visit',
        text: 'Drive east to the Desert Airfield and find Wally and Hogweed on the apron',
        at: [456, -84],
        radius: 10,
        hint: 'The Desert Airfield apron, east along the highway',
        toastOnEnter: "Hogweed's ratios are chalked on a board. Under them, in Wally's hand: JUST FLY IT.",
      },
      {
        kind: 'inspect',
        text: 'Help the Underspanners fit the beacon kit to the Crop Duster',
        verb: 'Fit',
        holdSeconds: 2,
        hint: 'The Crop Duster on the north apron',
        points: [
          {
            at: [437.4, -97.4],
            label: 'The drop sling, under the wing',
            prop: 'parachute-rig',
            note: 'Sling fitted, chute packed. A tag on it says ALMOST CERTAINLY, in Hogweed\'s hand.',
          },
          {
            at: [437.6, -86.4],
            label: 'The beacon kit, into the hold',
            prop: 'cargo-crate',
            note: 'A fire basket, a tripod, kindling and a bucket. THIS WAY UP is stencilled on every side.',
          },
          {
            at: [445.6, -92.6],
            label: 'The propeller, at the nose',
            prop: 'fuel-can',
            note: 'Hogweed says point-four of a turn. Wally says "tight". You give it point-four, tight.',
          },
        ],
      },
      {
        kind: 'steal-deliver',
        text: 'Fly the Crop Duster up to the Bobble, Wally aboard, and drop the kit on the summit',
        vehicleKind: 'plane',
        spawnAt: [440, -92, Math.PI / 2],
        dropAt: BOBBLE,
        radius: 30,
        hint: 'The Bobble, the summit of the Hatbrim, far north',
        banter: [
          'Wally: "Stall speed twenty-two, kid. You are doing forty. Good."',
          'Wally: "Same as the flares. Low over the flats, then climb."',
          'Wally: "Snow on the Bobble. Never named, never mown. My kind of hill."',
        ],
      },
      {
        kind: 'visit',
        text: 'Fly Wally back to the overlook',
        at: [268, 32],
        radius: 16,
        hint: 'The Dust Flats overlook',
      },
    ],
    doneText: 'The beacon waits on the Bobble for the longest day, and the apron is full of aircraft. By air: two crosses.',
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    [P1]: {
      0: brief(
        ['tansy', 'Previously: the Don tapped four times. His crews are in. Now everybody else.'],
        ['pip', 'By water first! The Bathtub Queen needs the canal, and Brenda owns the canal!'],
        ["tansy", "Brenda's Vinyl Lounge: south of town, on the drainage canal. Three hundred acorns."],
      ),
      1: call(
        ['samphire', 'Ahoy, matey! The Queen waits in the dune cut. She cannot read a channel.'],
        ['samphire', 'East along the canal, then south to the dunes. Bring a small boat.'],
      ),
      2: call(
        ['driftwood', 'Steady up the cut, friend. She follows the walnut, the walnut follows the water.'],
        ['samphire', 'Lead on! The Queen will follow anything braver than she is.'],
      ),
      3: call(['brenda', 'By decree, the Queen may tie up at New Puddle Marina. Step ashore, vessel!']),
    },
    [P2]: {
      0: brief(
        ['tansy', 'Previously: the Bathtub Queen is in. Water is done. Now air.'],
        ['wally', 'Wally. Hogweed is re-pitching my propeller with a blackboard. Get out here, kid.'],
        ['tansy', 'The Desert Airfield, east along the highway. Three hundred acorns.'],
      ),
      1: call(
        ['hogweed', 'Sling under the wing! Kit in the hold! Propeller, point-four! Hold each one!'],
        ['wally', 'Or you could just fly it.'],
      ),
      2: call(
        ['hogweed', 'Already up the hill by road! Drop it on the Bobble. I will catch it. Probably.'],
        ['wally', 'Top of the yard, kid. Due north. I will sit here and read the wind.'],
      ),
      3: call(
        ['hogweed', 'It opened! Bring Wally home, kid. I have a fire to build.'],
        ['wally', 'Back to the overlook, kid. Wind behind us. Twenty-two, remember.'],
      ),
    },
  },
  plans: {
    [P1]: { suite: 'story', expect: 'pass' },
    [P2]: { suite: 'story', expect: 'pass' },
  },
  bulletins: {
    [P1]: [
      'Baroness Brenda has opened New Puddle to shipping for one day only. A toll applies to the opening.',
      'A toy pirate ship sailed up the Saltcut this morning behind a walnut shell. Tourists aboard called the canal very much part of the tour.',
    ],
    [P2]: [
      'Desert Airfield reports four aircraft on the apron, a dandelion and a ball. Wind-Sock Wally says the wind is fine.',
      'The Top Hat café at Brim Gap counted four cars today. One of them flew over. Velma Crown stands by the count.',
    ],
  },
};
