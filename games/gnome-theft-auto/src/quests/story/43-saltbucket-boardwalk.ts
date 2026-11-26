// Story row 43 (docs/design/gnome-theft-auto/story-outline.md): Saltbucket Boardwalk. Driftwood phones the player at the Rutbottom
// Dirt Bowl gate: he crossed the dunes and stands on the Saltwater's shore with a tube hut. The player drives south to the
// boardwalk, rides the Spokewheel with Marram Teaspoon (E11: the ride probe) and sees three black HOA barges far out, tow-skis
// out behind Driftwood's boat to read their numbers (E11: the tow probe), and ends at the hut at dusk, where Driftwood sits
// in a deckchair with the sea in front of him. The sincere payoff of rows 25 and 32: no gag on top; what is across the
// Saltwater stays unanswered. The barges are only shown in the scenes (cutscene-only boats).
// Scenes: cutscene/scenes/story/m43-saltbucket-boardwalk.ts. Stages: quests/stages/story/s43-saltbucket-boardwalk.ts.
import { COAST } from '../../coast/config';
import type { GiverDef, QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const ID = 'm43-saltbucket-boardwalk';

const WHEEL = COAST.spokewheel.board;
const RACK = COAST.lastTube.rack;
const HUT = COAST.lastTube.hut;

/** Driftwood's phone call finds the player at the Rutbottom Dirt Bowl gate (BOWL_GATE (1000, -650): where row 42 ends). */
const CALL_GIVER: GiverDef = {
  id: 'driftwood-call',
  name: "Driftwood's call",
  label: "Answer Driftwood's call",
  x: 1000,
  z: -650,
  exit: { x: 1000, z: -645.5, yaw: Math.PI },
  room: 'street',
  letter: '!',
};

const QUEST: QuestDef = {
  id: ID,
  title: 'Saltbucket Boardwalk',
  giver: 'driftwood-call',
  prereq: 'm42-rutbottom-impound',
  chapter: 3,
  rewardAcorns: 300,
  radioBulletin: ID,
  // A boardwalk, a wheel and a tow: nothing here is a crime.
  hoa: 'off',
  cutscene: { kind: 'script', script: 'm43-saltbucket-boardwalk-intro' },
  outro: { kind: 'script', script: 'm43-saltbucket-boardwalk-outro' },
  // Marram's scene plays as the ride starts: she loads the player into a teacup, and the barges come up over the rim.
  beats: { 1: 'm43-saltbucket-boardwalk-mid' },
  objectives: [
    {
      kind: 'visit',
      text: 'Drive south through the dunes to Saltbucket Boardwalk',
      at: [0, 1098],
      radius: 16,
      hint: 'Saltbucket Boardwalk, at the end of the coast spur',
    },
    {
      kind: 'probe',
      text: 'Ride the Spokewheel and look south for the barges',
      probe: 'coast-spokewheel-rides',
      count: 1,
      at: [WHEEL.x, WHEEL.z],
      hint: "The Spokewheel, at the boardwalk's west end",
    },
    {
      kind: 'probe',
      text: "Water-ski out behind Driftwood's boat, three gates, and read the barges' numbers",
      probe: 'coast-tow-gates',
      count: 3,
      at: [RACK.x, RACK.z],
      hint: 'The Last Tube rack on the beach by Long Spoon Pier: rent skis there',
    },
    {
      kind: 'visit',
      text: "Sit down with Driftwood at the Last Tube",
      at: [HUT.x, HUT.z + 5],
      radius: 7,
      hint: "Driftwood's tube hut, on the beach west of the pier",
    },
  ],
  doneText: 'Driftwood sits in a deckchair on the sand, looking at the sea. The Last Tube is open, and so is the boardwalk.',
};

export const STORY: StoryFile = {
  quests: [QUEST],
  comms: {
    [ID]: {
      0: brief(
        ['driftwood', 'Previously: I saw the glow and could not cross. Friend, I crossed.'],
        ['driftwood', 'I have a hut now. Drive south through the dunes to the boardwalk.'],
        ['driftwood', 'Come and see the Saltwater. Three hundred acorns for the trouble, and the sea for free.'],
      ),
      1: call(
        ['marram', 'First ride is free, pet. Mind the teacups, and look south past the pier.'],
        ['marram', 'Three black barges, HOA flags. Count them from the top.'],
      ),
      2: call(
        ['driftwood', 'Skis are at the rack. I will tow you out past the third gate.'],
        ['driftwood', 'Read the numbers off the barges as you go by. I want them written down.'],
      ),
      3: call(['driftwood', 'Numbers noted. Come and sit down, friend. I would like to sit with it.']),
    },
  },
  givers: { 'driftwood-call': CALL_GIVER },
  bulletins: {
    [ID]: [
      'Turfton FM: a tube hut has opened on the Saltwater. The board outside reads TUBES: THEY FLOAT. Early customers confirm it.',
      'The Spokewheel reports a record number of passengers looking south. Marram Teaspoon reports the wheel stopped at the top only once, briefly.',
    ],
  },
  plans: {
    [ID]: { suite: 'story', expect: 'pass' },
  },
};
