// Story row 68 (docs/design/gnome-theft-auto/story-outline.md): Lights Out in Turfton. The hush before the finale. Juniper is out of City
// Hall; the Combine moves at dawn; Pip cooks dinner for the crew in flat 3B (Hyssop objects to the number of gnomes on the stairs).
// Then the last night tour: the player drives each friend home, one at a time, and stays for one short exchange at each door, then
// goes back to Saucer Court and up to the roof with Pip. The roof is the sincere beat (no gag on top, no line for the last ten seconds).
// Order (by geography, and so the long quiet drive is the last one): Juniper (Kerb Row), Bodega (the shop), Tansy (the sealed bay),
// Granny (her farmhouse in Cloverfield, the outline's first choice: it is about 250 m from the bay, so no downtown-bed fallback).
// The passenger kind carries one friend at a time, so each next friend waits on the kerb at the last door, having walked the last one
// to it ("you do not leave a friend at a door by themselves"); the four goodnights are staged as one montage (mid), played as the
// drive back begins, so every door is a real shot and the objectives stay plain drives. Pip lives on the player's couch (W09), so he
// is not dropped: he is waiting on the roof. The Hyssop note ("Your light was on") is the toast on arriving back at the court.
// Scenes: cutscene/scenes/story/m68-lights-out.ts. Stages: quests/stages/story/s68-lights-out.ts.
import { homeDoor } from '../../homes/data';
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const ID = 'm68-lights-out';

/** Saucer Court's courtyard, in front of the stairwell door (the player's front door). */
const COURT: [number, number] = homeDoor('player');
/** The kerb of Juniper's street, Kerb Row, outside her third door (the terrace door is on the north side, to z 120). */
const KERB_ROW: [number, number] = [-90, 123.5];
/** The pavement outside Bodega & Sons, on the x = -60 road side. */
const BODEGA_KERB: [number, number] = [-66, 90];
/** The apron of Side-Valve Salvage, in front of the sealed bay (the walk-in door on the east half is the only way in). */
const BAY_APRON: [number, number] = [-150, 66];
/** The gravel yard of Granny's farm, at the foot of the farmhouse porch (stage `granny-barn`). */
const FARMYARD: [number, number] = [-28, 332];

const QUEST: QuestDef = {
  id: ID,
  title: 'Lights Out in Turfton',
  giver: 'flat-3b-mat',
  prereq: 'm67-emergency-assessment',
  chapter: 4,
  rewardAcorns: 200,
  radioBulletin: ID,
  achievement: 'gta-last-lift-home',
  // The last quiet night: nobody hunts a car full of dinner guests.
  hoa: 'off',
  cutscene: { kind: 'script', script: 'm68-lights-out-intro' },
  outro: { kind: 'script', script: 'm68-lights-out-outro' },
  // The four goodnights play as the drive back begins (objective 4), at the four doors, one exchange apiece.
  beats: { 4: 'm68-lights-out-mid' },
  objectives: [
    {
      kind: 'passenger',
      text: 'Dinner is done. Drive Juniper home to her terrace on Kerb Row',
      who: 'juniper',
      name: 'Juniper',
      pickup: [COURT[0] + 0.6, COURT[1] + 3],
      dropAt: KERB_ROW,
      radius: 9,
      hint: 'Saucer Court, then Kerb Row, south-west of it',
      maxDamage: 0.35,
      banter: [
        'Juniper: "Two nights in a sub-basement. I read every pipe label. They are all wrong."',
        'Juniper: "Reginald will say I look tired. He will be correct. I shall be furious."',
      ],
      onBoard: 'Juniper: "Kerb Row. I will direct you. I always do."',
      onDrop: 'Juniper: "Third door. The hedge is straight because I am."',
    },
    {
      kind: 'passenger',
      text: 'Drive John Bodega home to his shop',
      who: 'bodega',
      name: 'John Bodega',
      pickup: [KERB_ROW[0] + 5, KERB_ROW[1] + 0.5],
      dropAt: BODEGA_KERB,
      radius: 9,
      hint: 'Bodega & Sons, along the x = -60 road',
      maxDamage: 0.35,
      banter: [
        'Bodega: "Sirens. Mind the step."',
        'Bodega: "Dinner was good. Acorn-Cola, lukewarm. Free. Do not tell the cat."',
      ],
      onBoard: 'Bodega: "Shop is east of here. The sign is on."',
      onDrop: 'Bodega: "Asphalt is waiting. She will say nothing."',
    },
    {
      kind: 'passenger',
      text: 'Drive Tansy back to the sealed Side-Valve bay',
      who: 'tansy',
      name: 'Tansy',
      pickup: [BODEGA_KERB[0] - 4, BODEGA_KERB[1] + 7],
      dropAt: BAY_APRON,
      radius: 9,
      hint: 'Side-Valve Salvage, west along the z = 60 road',
      maxDamage: 0.35,
      banter: [
        'Tansy: "Slower. I like the streets lit and I like them quiet."',
        'Tansy: "Pip ran the plan well. I did not say that. You did not hear it."',
      ],
      onBoard: 'Tansy: "The bay. Not the couch. I have a key."',
      onDrop: 'Tansy: "Under the mat. Where else."',
    },
    {
      kind: 'passenger',
      text: 'Drive Granny home to her farmhouse in Cloverfield',
      who: 'granny',
      name: 'Granny',
      pickup: [BAY_APRON[0] + 8, BAY_APRON[1] - 4],
      dropAt: FARMYARD,
      radius: 10,
      hint: 'Granny\'s farm, south along the highway in Cloverfield',
      maxDamage: 0.35,
      banter: [
        'Granny: "Slow is fine, sugar. A pie does not like a corner."',
        'Granny: "Stars are out. Rooster says that means nothing. Rooster is wrong."',
        'Granny: "I would rather my own roof than your couch. No offence to the couch."',
      ],
      onBoard: 'Granny: "Take the long road, sugar. I like to see the fields."',
      onDrop: 'Granny: "Home. Mind the dog. We do not have a dog."',
    },
    {
      kind: 'visit',
      text: 'Drive back to Saucer Court. Pip is waiting up',
      at: [COURT[0], COURT[1] + 2],
      radius: 8,
      hint: 'Saucer Court, downtown',
      toastOnEnter: 'A folded note under the door of 3B: "Your light was on. Good. For the record. H.D."',
    },
  ],
  doneText: 'Four friends home, one lit city, and a roof with Pip on it. Tomorrow is the longest day. Tonight was the shortest.',
};

export const STORY: StoryFile = {
  quests: [QUEST],
  comms: {
    [ID]: {
      0: brief(
        ['pip', 'Previously: Juniper is out of City Hall. The Combine moves at dawn.'],
        ['pip', 'Dinner at ours, then everybody home. Juniper first. Two hundred acorns.'],
        ['pip', 'Saucer Court, flat 3B. Hyssop is counting. Do not count back.'],
      ),
      1: call(['bodega', 'Shop is on the corner. Lights stay on. They always do.']),
      2: call(['tansy', 'Bay next. I have a key under the mat. Do not tell Pip.']),
      3: call(['granny', 'I would rather the farmhouse than your couch, sugar. Take the long road.']),
      4: call(['pip', 'Come up to the roof when you are back. Bring nothing. Just come.']),
    },
  },
  bulletins: {
    [ID]: [
      'Turfton FM: the city is quiet tonight. Residents report a feeling. The Association has not been able to confirm the feeling.',
      'Saucer Court reports a dinner for six in a flat for two. The warden on the stairs has declined to comment, and has counted.',
    ],
  },
  plans: {
    [ID]: { suite: 'story', expect: 'pass' },
  },
};
