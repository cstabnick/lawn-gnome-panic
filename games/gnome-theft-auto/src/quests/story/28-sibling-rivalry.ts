// Story row 28 "Sibling Rivalry" (docs/design/gnome-theft-auto/story-outline.md): Hedda will print Juniper's Even-Estates
// permits only if Reginald confirms them. The player clears the HOA watchers outside Thorne Tower, fetches Reginald from
// his audit office (passenger, a smooth ride) and takes him to the Tattler's desk, where he does not confirm: he corrects
// the spelling of his sister's name, and Juniper laughs for the first time. Reginald's doubt is planted, not resolved.
// Scenes: cutscene/scenes/story/m28-sibling-rivalry.ts. Stages: stages/story/s28-*.ts.
import type { GnomeLook } from '@lawn/gnome';
import { workOf } from '../../homes/data';
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const HOA_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xc9b99b };

/** Reginald's workplace, the HOA audit office at the foot of Thorne Tower (the Glaze & Tax Office stage stands in for it). */
const AUDIT_OFFICE = workOf('reginald')?.at ?? [28, -48];

const SIBLING_RIVALRY: QuestDef = {
  id: 'm28-sibling-rivalry',
  title: 'Sibling Rivalry',
  giver: 'city-hall',
  prereq: 'm27-heap-of-trouble',
  chapter: 2,
  rewardAcorns: 400,
  radioBulletin: 'm28-sibling-rivalry',
  cutscene: { kind: 'script', script: 'm28-sibling-rivalry-intro' },
  outro: { kind: 'script', script: 'm28-sibling-rivalry-outro' },
  // The cracking is the only rough part: the ride and the walk-in are gentle (no Hat Watch).
  hoaSteps: { 1: 'off', 2: 'off' },
  // Reginald's scene plays as the pick-up starts (he is measuring the Ride-On seat when you pull up).
  beats: { 1: 'm28-sibling-rivalry-mid' },
  objectives: [
    {
      kind: 'crack',
      text: 'Crack the two HOA watchers outside Thorne Tower before they can tail the ride',
      targets: [
        { id: 'sibling-watcher-1', name: 'HOA Watcher Plumb', near: [12, -46], hint: 'Foot of Thorne Tower', look: HOA_LOOK },
        { id: 'sibling-watcher-2', name: 'HOA Watcher Level', near: [44, -46], hint: 'Foot of Thorne Tower', look: HOA_LOOK },
      ],
    },
    {
      kind: 'passenger',
      text: 'Pick up Reginald at the HOA audit office and drive him to the Tattler, smooth',
      who: 'reginald',
      name: 'Reginald',
      pickup: [AUDIT_OFFICE[0], AUDIT_OFFICE[1]],
      dropAt: [-85.6, 6.4],
      radius: 9,
      hint: "the Tattler's desk, Founders' Green",
      vehicle: { kind: 'ride-on', at: [24, -49.4, Math.PI / 2] },
      maxDamage: 0.25,
      banter: [
        'Reginald: "Four-oh-four dash B. No vehicle shall exceed the pace of a brisk walk. You are exceeding it."',
        'Reginald: "That corner was not square. I will not say by how much. It was more than a quarter-inch."',
        'Reginald: "My sister has nothing to say to me. I have prepared a long reply."',
      ],
      onBoard: 'Reginald folds himself onto the seat. He measures it again, to be sure.',
      onDrop: 'Reginald climbs out and checks the kerb against a quarter-inch. It passes. He is disappointed.',
    },
    {
      kind: 'visit',
      text: "Follow Reginald to Hedda's desk",
      at: [-90, 6],
      radius: 4,
      hint: "the Tattler's desk, Founders' Green",
    },
  ],
  doneText: "The permits go to print, spelled correctly. Reginald confirmed nothing. Juniper laughed. Nobody is going to mention it.",
};

export const STORY: StoryFile = {
  quests: [SIBLING_RIVALRY],
  comms: {
    'm28-sibling-rivalry': {
      0: brief(
        ['juniper', 'Juniper Vance. Eleven permits, ten signatures. Hedda prints once my brother confirms.'],
        ['juniper', 'He audits at Thorne Tower. HOA watchers loiter there: clear them first.'],
        ['juniper', 'Bring him, unscratched. Four hundred Acorns. Do not say I sent you.'],
      ),
      1: call(['reginald', 'I will be at the kerb. Four-oh-four dash B: the pace of a brisk walk.']),
      2: call(['hedda', "Permits. Eleven. Reginald's word. Desk, Founders' Green gate. Now."]),
    },
  },
  bulletins: {
    'm28-sibling-rivalry': [
      "The Turfton Tattler will print eleven Even-Estates permits tomorrow, \"spelled correctly\". A staff source says one councilwoman's name was fixed by hand.",
      'An HOA audit officer was seen riding a municipal mower very slowly through downtown. A councilwoman was heard laughing at a news desk. City Hall denies both.',
    ],
  },
  plans: {
    'm28-sibling-rivalry': { suite: 'story', expect: 'pass' },
  },
};
