// The quests and givers across Turfton and the four outer biomes.
import { marker, markerNum } from '../levels';
import { CHAPTER_1_QUESTS } from './chapter1';
import { CHAPTER_2_QUESTS } from './chapter2';
import { CHAPTER_3_QUESTS } from './chapter3';
import { CHAPTER_4_QUESTS } from './chapter4';
import { CHAPTER_5_QUESTS } from './chapter5';
import { SIDE_QUESTS } from './sideQuests';
import { RACE_QUESTS } from './races';
import { TESSIE_QUEST } from './tessieQuest';
import type { GiverDef, QuestDef } from './types';

/** A giver's position and exit, from its giver/<id> marker in the level documents. */
function placed(id: string): { x: number; z: number; exit: { x: number; z: number; yaw: number } } {
  const m = marker('giver', `giver/${id}`);
  return {
    x: m.x,
    z: m.z,
    exit: { x: m.x + markerNum(m, 'exit', 'dx'), z: m.z + markerNum(m, 'exit', 'dz'), yaw: markerNum(m, 'exit', 'yaw') },
  };
}

export const GIVERS: Record<string, GiverDef> = {
  'pip-spawn': {
    id: 'pip-spawn',
    name: 'Pip Potsworth',
    label: 'Talk to Pip Potsworth',
    ...placed('pip-spawn'),
    room: 'street',
    letter: 'P',
  },
  'mulch-club': {
    id: 'mulch-club',
    name: 'The Mulch Club',
    label: 'Enter The Mulch Club',
    ...placed('mulch-club'),
    room: 'mulch-club',
    letter: 'D',
  },
  'side-valve': {
    id: 'side-valve',
    name: 'Side-Valve Salvage',
    label: 'Enter Side-Valve Salvage',
    ...placed('side-valve'),
    room: 'side-valve',
    letter: 'T',
  },
  'city-hall': {
    id: 'city-hall',
    name: 'Councilwoman Juniper Vance',
    label: 'Meet Juniper Vance',
    ...placed('city-hall'),
    room: 'street',
    letter: 'J',
  },
  'cloverfield-barn': {
    id: 'cloverfield-barn',
    name: 'Granny Gnertrude\'s Barn',
    label: 'Visit Granny Gnertrude',
    ...placed('cloverfield-barn'),
    room: 'cloverfield-barn',
    letter: 'G',
  },
  'unmowed-hollow': {
    id: 'unmowed-hollow',
    name: 'Unmowed Hollow',
    label: 'Speak with Elder Bracken',
    ...placed('unmowed-hollow'),
    room: 'unmowed-hollow',
    letter: 'B',
  },
  'fells-basin': {
    id: 'fells-basin',
    name: 'Frozen Birdbath Basin',
    label: 'Meet Father Loam',
    ...placed('fells-basin'),
    room: 'fells-shrine',
    letter: 'L',
  },
  'dust-overlook': {
    id: 'dust-overlook',
    name: 'Dust Flats Safehouse',
    label: 'Meet the Crew',
    ...placed('dust-overlook'),
    room: 'dust-overlook',
    letter: 'S',
  },
  'strangers': {
    id: 'strangers',
    name: 'Strangers & Freaks',
    label: 'Talk to Stranger',
    ...placed('strangers'),
    room: 'street',
    letter: '!',
  },
  'strangers-gnomecino': {
    id: 'strangers-gnomecino',
    name: 'Big Lou (The Gnomecino)',
    label: 'Talk to Big Lou',
    ...placed('strangers-gnomecino'),
    room: 'street',
    letter: '!',
  },
  'strangers-canal': {
    id: 'strangers-canal',
    name: 'Baroness Brenda (Canal)',
    label: 'Talk to Baroness Brenda',
    ...placed('strangers-canal'),
    room: 'street',
    letter: '!',
  },
  'strangers-porch': {
    id: 'strangers-porch',
    name: 'Clara (Tall House Porch)',
    label: 'Talk to Clara',
    ...placed('strangers-porch'),
    room: 'unmowed-hollow',
    letter: '!',
  },
  // The Tessie side quest (Epic 7): waits here only once the quest has unlocked (tessieUnlock.ts).
  'loch-driftwood': {
    id: 'loch-driftwood',
    name: 'Driftwood (Loch Moss)',
    label: 'Talk to Driftwood',
    ...placed('loch-driftwood'),
    room: 'unmowed-hollow',
    letter: '!',
  },
  // The Fizz Cup races (races.ts): the race desk in the Lost & Found Speedway's pit lane.
  speedway: {
    id: 'speedway',
    name: 'Lost & Found Speedway',
    label: 'Talk to Burdock "Big Flag" Bellweather',
    ...placed('speedway'),
    room: 'street',
    letter: 'R',
  },
};

export const QUESTS: readonly QuestDef[] = [
  ...CHAPTER_1_QUESTS,
  ...CHAPTER_2_QUESTS,
  ...CHAPTER_3_QUESTS,
  ...CHAPTER_4_QUESTS,
  ...CHAPTER_5_QUESTS,
  ...SIDE_QUESTS,
  TESSIE_QUEST,
  ...RACE_QUESTS,
];

export const questById = (id: string): QuestDef | undefined => QUESTS.find((q) => q.id === id);
