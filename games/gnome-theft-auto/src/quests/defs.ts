// The quests and givers across Turfton and the four outer biomes.
import { SIDE_VALVE } from '../config';
import { CHAPTER_1_QUESTS } from './chapter1';
import { CHAPTER_2_QUESTS } from './chapter2';
import { CHAPTER_3_QUESTS } from './chapter3';
import { CHAPTER_4_QUESTS } from './chapter4';
import { CHAPTER_5_QUESTS } from './chapter5';
import type { GiverDef, QuestDef } from './types';

export const GIVERS: Record<string, GiverDef> = {
  'pip-spawn': {
    id: 'pip-spawn',
    name: 'Pip Potsworth',
    label: 'Talk to Pip Potsworth',
    x: -10,
    z: 18,
    exit: { x: -8, z: 18, yaw: 0 },
    room: 'street',
    letter: 'P',
  },
  'mulch-club': {
    id: 'mulch-club',
    name: 'The Mulch Club',
    label: 'Enter The Mulch Club',
    x: -16,
    z: -30,
    exit: { x: -13, z: -30, yaw: Math.PI / 2 },
    room: 'mulch-club',
    letter: 'D',
  },
  'side-valve': {
    id: 'side-valve',
    name: 'Side-Valve Salvage',
    label: 'Enter Side-Valve Salvage',
    x: SIDE_VALVE.bay.x,
    z: SIDE_VALVE.bay.z,
    exit: { x: SIDE_VALVE.bay.x + 4, z: SIDE_VALVE.bay.z - 4, yaw: Math.PI },
    room: 'side-valve',
    letter: 'T',
  },
  'city-hall': {
    id: 'city-hall',
    name: 'Councilwoman Juniper Vance',
    label: 'Meet Juniper Vance',
    x: 0,
    z: -72,
    exit: { x: 4, z: -72, yaw: 0 },
    room: 'street',
    letter: 'J',
  },
  'cloverfield-barn': {
    id: 'cloverfield-barn',
    name: "Granny Gnertrude's Barn",
    label: "Visit Granny Gnertrude",
    x: -25,
    z: 330,
    exit: { x: -20, z: 325, yaw: 0 },
    room: 'cloverfield-barn',
    letter: 'G',
  },
  'unmowed-hollow': {
    id: 'unmowed-hollow',
    name: 'Unmowed Hollow',
    label: 'Speak with Elder Bracken',
    x: -350,
    z: 40,
    exit: { x: -345, z: 40, yaw: Math.PI / 2 },
    room: 'unmowed-hollow',
    letter: 'B',
  },
  'fells-basin': {
    id: 'fells-basin',
    name: 'Frozen Birdbath Basin',
    label: 'Meet Father Loam',
    x: 0,
    z: -340,
    exit: { x: 0, z: -334, yaw: 0 },
    room: 'fells-shrine',
    letter: 'L',
  },
  'dust-overlook': {
    id: 'dust-overlook',
    name: 'Dust Flats Safehouse',
    label: 'Meet the Crew',
    x: 280,
    z: 40,
    exit: { x: 276, z: 40, yaw: -Math.PI / 2 },
    room: 'dust-overlook',
    letter: 'S',
  },
  strangers: {
    id: 'strangers',
    name: 'Strangers & Freaks',
    label: 'Talk to Stranger',
    x: -60,
    z: 60,
    exit: { x: -56, z: 60, yaw: 0 },
    room: 'street',
    letter: '!',
  },
};

export const QUESTS: readonly QuestDef[] = [
  ...CHAPTER_1_QUESTS,
  ...CHAPTER_2_QUESTS,
  ...CHAPTER_3_QUESTS,
  ...CHAPTER_4_QUESTS,
  ...CHAPTER_5_QUESTS,
];

export const questById = (id: string): QuestDef | undefined => QUESTS.find((q) => q.id === id);
