// Story row 46 (docs/design/gnome-theft-auto/story-outline.md): Starfall at the Anthill, act III's extended set-piece
// and its one long adventure (tension 5 -> 7: p1 and p2 comic, p3 tense, the final a release).
// - p1 Night Class (night): Professor Sextant lends the player a faculty gown on the Long Shelf's steps (it hides the
//   hat); cross Rootwell's dark quad past Dean Inkwell's patrol lantern to the Anthill's north door.
// - p2 The Sugar Toll (night -> dawn): the ants want their rent; take a barrow of sugar from the store behind the
//   Trencher (the refectory) to the north door and pay it. The ants never speak: they point, up the mound.
// - p3 The Lens (dawn): six HOA technicians on the summit have the guidance lens out of the dome and on a sighting
//   stand, aimed along the Even Line; crack them (Pip fights beside the player), then take the lens. Under its cradle:
//   the work order, signed by the Dean.
// - final Dean's Leap (dawn): Betony's farewell on the observatory step; the HOA holds the road, so off the ramp in the
//   Dean's own valet cart, round the mound to Rootwell Field, where Wind-Sock Wally (on the radio until then) lifts the
//   plane with the dome open and empty behind (W12). Part 2 of 4 (guidance) is taken.
// The outline's fallback is used for the flight: the last step is a visit to Wally on the Field and the plane climbs in
// the outro, Wally at the stick (the outline's outro and his first appearance both have him flying, so the player does
// not fly alone). Scenes: cutscene/scenes/story/m46-starfall-at-the-anthill.ts. Stages: stages/story/s46-*.ts.
import type { GnomeLook } from '@lawn/gnome';
import type { QuestDef, TargetDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const P1 = 'm46-starfall-at-the-anthill-p1';
const P2 = 'm46-starfall-at-the-anthill-p2';
const P3 = 'm46-starfall-at-the-anthill-p3';
const FINAL = 'm46-starfall-at-the-anthill';

/** HOA technicians: the black hat and a white survey coat (the scenes dress them the same). */
const TECH_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xe8e4d8, pants: 0x3a3a40 };
const tech = (n: number, name: string, near: [number, number], hint: string): TargetDef => ({ id: `anthill-tech-${n}`, name, near, hint, look: TECH_LOOK });

/** The ants' north door (campus/types.ts OBSERVATORY.antDoors[0], (1172, 82)): the flat lawn below it, and its step. */
const DOOR_LAWN: [number, number] = [1161, 70];
const DOOR_STEP: [number, number] = [1167.4, 77.4];
/** The sighting stand on the summit's west rim (campus/observatory.ts gsr-telescope-stand at (1222, 152)). */
const STAND: [number, number] = [1223.8, 153.4];

const QUESTS: readonly QuestDef[] = [
  {
    id: P1,
    title: 'Starfall at the Anthill: Night Class',
    giver: 'betony-library',
    prereq: 'm45-rootwell-admissions',
    chapter: 3,
    rewardAcorns: 250,
    radioBulletin: P1,
    // Gentle: the gown hides the hat, so the Hat Watch has nothing to see.
    hoa: 'off',
    // Night on the library steps: the gown, the Anthill across the dark quad, the Dean's lantern coming the other way.
    cutscene: { kind: 'script', script: 'm46-starfall-at-the-anthill-p1-intro' },
    objectives: [
      {
        kind: 'checkpoints',
        text: "Cross the quad in the faculty gown to the Anthill's north door",
        hint: "The Anthill's north door, south of the quad",
        points: [
          { at: [1110.5, -255], radius: 5, label: 'The library gate (gown on, hat in)' },
          { at: [1140, -224], radius: 6, label: "Across the quad, out of the Dean's lantern" },
          { at: [1180, -150], radius: 5, label: "The quad's south gate" },
          { at: [1147, -104], radius: 7, label: 'Between Tilth Hall and the Crucible Block' },
          { at: [1158, -24], radius: 8, label: 'The dark lawn below the Anthill' },
          { at: DOOR_LAWN, radius: 6, label: "The Anthill's north door" },
        ],
      },
    ],
    doneText: "Across the quad in a borrowed gown, and the Dean's lantern never once turned your way. Pip and the Professor are waiting at the Anthill's north door.",
  },
  {
    id: P2,
    title: 'Starfall at the Anthill: The Sugar Toll',
    giver: 'anthill-north-door',
    prereq: P1,
    chapter: 3,
    rewardAcorns: 250,
    radioBulletin: P2,
    hoa: 'off',
    // Night at the door: one ant on the step, a leg out, a bowl. Nobody gets in without the rent.
    cutscene: { kind: 'script', script: 'm46-starfall-at-the-anthill-p2-intro' },
    // Dawn: the rent is counted, and the ants part off the road up the mound.
    outro: { kind: 'script', script: 'm46-starfall-at-the-anthill-p2-outro' },
    objectives: [
      {
        kind: 'steal-deliver',
        text: "Take a barrow of sugar from behind the Trencher to the ants' north door",
        vehicleKind: 'barrow-buggy',
        spawnAt: [1266, -232, 0],
        dropAt: DOOR_LAWN,
        radius: 6,
        maxDamage: 0.6,
        hint: "The sugar store behind the Trencher, then the Anthill's north door",
        banter: [
          'Pip: "Is it a lot of sugar? Ants like a lot. I read it on a sugar bag."',
          'A sack labelled GRANT bounces in the barrow. It is heavier than a grant.',
          'Pip: "Do not hit anything! Sugar spills! Then it is a trail! Then they FOLLOW you!"',
        ],
      },
      {
        kind: 'visit',
        text: 'Carry the sugar up the step and pay the ant',
        at: DOOR_STEP,
        radius: 2.5,
        hint: "The Anthill's north door step",
        toastOnEnter: 'You fill the bowl. The ant counts it by tapping, every cube, twice.',
      },
    ],
    doneText: 'The rent is paid in full, counted twice, and the ants have pointed you up the mound. Betony is waiting at the observatory.',
  },
  {
    id: P3,
    title: 'Starfall at the Anthill: The Lens',
    giver: 'betony',
    prereq: P2,
    chapter: 3,
    rewardAcorns: 300,
    radioBulletin: P3,
    // Dawn on the summit: the dome groans open, and a technician lifts the lens to the last stars of the night.
    cutscene: { kind: 'script', script: 'm46-starfall-at-the-anthill-p3-intro' },
    // The lens is out of its cradle; on the stand an HOA radio starts to ring, and does not stop.
    outro: { kind: 'script', script: 'm46-starfall-at-the-anthill-p3-outro' },
    objectives: [
      {
        kind: 'crack',
        text: 'Crack the six HOA technicians on the Anthill summit, with Pip beside you',
        targets: [
          tech(1, 'HOA Technician Plinth', [1228, 150], 'The sighting stand, summit rim'),
          tech(2, 'HOA Technician Datum', [1232, 162], 'The bench by the survey pages'),
          tech(3, 'HOA Technician Benchmark', [1242, 146], 'The forecourt lamps'),
          tech(4, 'HOA Technician Level', [1244, 170], 'The observatory door'),
          tech(5, 'HOA Technician Plumb', [1236, 176], "The top of Dean's Leap"),
          tech(6, 'HOA Technician Grade', [1230, 138], 'The LEVEL LINE sign'),
        ],
      },
      {
        kind: 'inspect',
        text: 'Take the guidance lens off the sighting stand',
        verb: 'Take',
        holdSeconds: 3,
        hint: "The sighting stand on the summit's west rim",
        points: [
          {
            at: STAND,
            label: 'The guidance lens',
            prop: 'guidance-lens',
            radius: 3,
            note: "The lens lifts out warm. Under its cradle: an HOA work order, approved by L. Inkwell, Dean.",
          },
        ],
      },
    ],
    doneText: 'You have the guidance lens, and the work order that says the Dean signed it away. On the stand, an HOA radio will not stop ringing.',
  },
  {
    id: FINAL,
    title: "Starfall at the Anthill: Dean's Leap",
    giver: 'betony',
    prereq: P3,
    chapter: 3,
    rewardAcorns: 600,
    achievement: 'gta-sugar-landlord',
    radioBulletin: FINAL,
    // Dawn on the observatory step: Betony's farewell, the lens signed with her name, and the road below full of HOA.
    cutscene: { kind: 'script', script: 'm46-starfall-at-the-anthill-intro' },
    // At the top of the run-up: the ramp ends in air.
    beats: { 1: 'm46-starfall-at-the-anthill-mid' },
    // Rootwell Field: Wally lifts the plane, the dome open and empty behind (W12).
    outro: { kind: 'script', script: 'm46-starfall-at-the-anthill-outro' },
    objectives: [
      {
        kind: 'checkpoints',
        text: "Take the Dean's valet cart to the top of Dean's Leap",
        vehicle: { kind: 'golf-cart', at: [1238, 179, Math.PI] },
        hint: "Dean's Leap, the Anthill summit",
        points: [{ at: [1238, 166], radius: 5, label: "The top of Dean's Leap" }],
      },
      {
        kind: 'checkpoints',
        text: "Drive off Dean's Leap, land it, and get round the Anthill to Rootwell Field",
        maxDamage: 0.75,
        hint: 'Rootwell Field, south of the Anthill',
        points: [
          { at: [1238, 64], radius: 11, label: "Land on the Anthill's north slope" },
          { at: [1330, 40], radius: 11, label: "Round the Anthill's east foot" },
          { at: [1352, 200], radius: 11, label: 'The east lawn' },
          { at: [1300, 330], radius: 11, label: 'The south lawn' },
          { at: [1245, 548], radius: 11, label: 'Rootwell Field apron' },
        ],
      },
      {
        kind: 'visit',
        text: "Get to Wind-Sock Wally's chair by the Field's tower",
        at: [1235, 515],
        radius: 6,
        hint: "Rootwell Field's very small tower",
        toastOnEnter: 'Wally lowers his binoculars. He is already standing up.',
      },
    ],
    doneText: "Part 2 of 4, guidance, is taken: the lens is out of Rootwell with Wally, and the Anthill's dome stands open and empty.",
  },
];

export const STORY: StoryFile = {
  quests: QUESTS,
  comms: {
    [P1]: {
      0: brief(
        ['betony', 'Previously: the HOA took my survey. The Dean let them. Now they want my lens.'],
        ['betony', 'It is in the Anthill, south across the lawns. We walk there tonight.'],
        ['betony', 'Wear the gown. It hides the hat. Two hundred and fifty acorns, as I was saying.'],
      ),
    },
    [P2]: {
      0: brief(
        ['pip', 'Ants. I do not like ants. That one is pointing at me.'],
        ['betony', 'They want sugar. The Trencher keeps it, out the back, on pallets.'],
        ['betony', 'Fill the barrow, bring it here, pay the rent. Two hundred and fifty acorns.'],
      ),
      1: call(['pip', 'Up the step! Slowly! No eye contact! Do ants have eyes?']),
    },
    [P3]: {
      0: brief(
        ['pip', 'Technicians! Six of them! Little white coats! Round the dome!'],
        ['betony', 'They have my lens on a stand, sighting the last stars. Crack them.'],
        ['betony', 'Then take the lens, gently. Three hundred acorns, and my thanks.'],
      ),
      1: call(['betony', 'Unscrew it slowly. Lefty-loosey. That is the only rhyme I trust.']),
    },
    [FINAL]: {
      0: brief(
        ['betony', 'Previously: you took the lens. Now the HOA holds the road down.'],
        ['pip', "The Dean's cart is up here! Keys in! And there's a ramp!"],
        ['betony', 'My pilot waits at Rootwell Field. Six hundred acorns. Go the quick way.'],
      ),
      1: call(
        ['wally', "Wind-Sock Wally. I fly the Professor's charters. Ramp's yours, kid."],
        ['wally', "Stall speed's twenty-two. Don't embarrass yourself. I'll be on the apron."],
      ),
      2: call(['wally', "Saw that. Four seconds of air. I'm by the tower, in the chair."]),
    },
  },
  givers: {
    'betony-library': {
      id: 'betony-library',
      name: 'The Long Shelf steps',
      label: 'Talk to Professor Sextant',
      x: 1110.4,
      z: -271.2,
      exit: { x: 1108.6, z: -269.6, yaw: Math.PI },
      room: 'street',
      letter: '!',
    },
    'anthill-north-door': {
      id: 'anthill-north-door',
      name: "The Anthill's north door",
      label: 'Knock at the ants\' door',
      x: 1161,
      z: 70,
      exit: { x: 1160.4, z: 69.2, yaw: 0.8 },
      room: 'street',
      letter: '!',
    },
  },
  plans: {
    [P1]: { suite: 'story', expect: 'pass' },
    [P2]: { suite: 'story', expect: 'pass' },
    [P3]: { suite: 'story', expect: 'pass' },
    [FINAL]: { suite: 'story', expect: 'pass' },
  },
  bulletins: {
    [P1]: [
      'Rootwell University reports a visiting astronomer on the quad after dark, in a faculty gown that does not appear to be hers. The Dean says he waved.',
      'A reminder from Rootwell: the quad is closed after sundown, except to faculty, and to anyone who looks like faculty in poor light.',
    ],
    [P2]: [
      "The ants of the Anthill have been paid in full for the first time in eleven days. The Trencher reports a barrow missing and a sack labelled GRANT gone with it.",
      'Rootwell would like to remind students that the ants are landlords, not termites, and that they can hear you.',
    ],
    [P3]: [
      'An HOA survey team on the Anthill summit has stopped answering its radio. A spokesman says the team is resting, all six, at once.',
      'Stargazers report the Anthill Observatory pointed at nothing in particular this morning, for the first time in months.',
    ],
    [FINAL]: [
      "A valet cart left Dean's Leap at dawn and landed on the north slope. Dean Inkwell says it was not him, and that he was asleep, and that it was a very good landing.",
      'A charter plane took off from Rootwell Field at first light with one passenger and a small parcel. The pilot logged the wind and nothing else.',
    ],
  },
};
