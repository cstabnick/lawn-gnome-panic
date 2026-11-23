// The Fizz Cup: four races at the Lost & Found Speedway (raceTrack/track.ts), each in a different machine, given by
// Burdock "Big Flag" Bellweather at the race desk in the pit lane. Lore: docs/lore/entries/apocrypha/lost-and-found-speedway.md.
// Plugs into the quest system as plain QuestDefs (defs.ts spreads RACE_QUESTS into QUESTS, the 'speedway' giver is in GIVERS).
import type { GnomeLook } from '@lawn/gnome';
import type { Gesture } from '../cutscene/script';
import type { QuestDef, RaceRival } from './types';

const BURDOCK: Partial<GnomeLook> = { hat: 0x111111, shirt: 0xf4f4f4, beard: 0xc9c2b4, glasses: true };
const VINNIE: Partial<GnomeLook> = { hat: 0xffd21f, shirt: 0x1d1d1d, beard: null, glasses: true };
const DOCK: Partial<GnomeLook> = { hat: 0xd8342c, shirt: 0x2a3b4c, beard: 0x8a6a4a };
const SHELLDON: Partial<GnomeLook> = { hat: 0x7a8a78, shirt: 0x3f4740, glasses: true };

const PEBBLE: RaceRival = {
  name: 'Pebble Quickloam', look: { hat: 0x7ec8e3, shirt: 0xf2e6c8, beard: null, freckles: true }, tint: 0x7ec8e3,
  pace: 0.86, grip: 0.75, line: -2.5, aggression: 0.1,
  taunts: ['Sorry! Sorry! Was that a corner?', 'My mum is in the Book Stand. Hi Mum!'],
};
const MARIGOLD: RaceRival = {
  name: 'Marigold "Mulch-Mouth" Fennick', look: { hat: 0x2f6b2a, shirt: 0xe0b23a, beard: null, dress: true }, tint: 0x2f6b2a,
  pace: 0.95, grip: 0.95, line: 2, aggression: 0.55,
  taunts: ['Buck-Iron! Nothing runs like it!', 'Eat my clippings, rookie.'],
};
const TUMBLEWEED: RaceRival = {
  name: 'Tumbleweed Tom', look: { hat: 0xc9a66b, shirt: 0x8a5a3c, beard: 0xe8e0d0 }, tint: 0xc9a66b,
  pace: 0.9, grip: 0.85, line: 0, aggression: 0.3,
  taunts: ['Been racing this pan since it was just a pile of junk.', 'Hold onto your hat. I lost mine in 1994.'],
};
const LUGNUT: RaceRival = {
  name: 'Lugnut Lulu', look: { hat: 0xff6a00, shirt: 0x1a1a1a, beard: null, dress: true }, tint: 0x8e44ad,
  pace: 0.97, grip: 1.0, line: 2.5, aggression: 0.6,
  taunts: ['Carburettors run this town. Low and loud!', 'Nice hop. Shame about the rest.'],
};
const TEASEL: RaceRival = {
  name: 'Two-Ton Teasel', look: { hat: 0xff6a00, shirt: 0x3a3a3a, beard: 0x2a2a2a }, tint: 0xd8342c,
  pace: 0.93, grip: 0.9, line: -2, aggression: 0.8,
  taunts: ['Two tons of attitude, coming through.', 'I do not brake. I negotiate.'],
};
const CHROME: RaceRival = {
  name: 'Chrome-Dome Delphine', look: { hat: 0xc0c0c8, shirt: 0x2a2d36, beard: null, glasses: true }, tint: 0xc0c0c8,
  pace: 1.0, grip: 1.05, line: 0, aggression: 0.35,
  taunts: ['Polished it this morning. Do not touch.', 'See you at the Glaze, if you can keep up.'],
};
const SHELLDON_RIVAL: RaceRival = {
  name: 'Shelldon "No-Trail" Mucilage', look: SHELLDON, tint: 0x6b7d5a,
  // He will not touch a paved road, so he races the whole lap on the run-off.
  pace: 0.92, grip: 0.9, line: 9.5, aggression: 0.2,
  taunts: ['Paved roads are a government trap. Gravel is freedom.', 'Eventually is still on time!'],
};
const PERIWINKLE: RaceRival = {
  name: 'Auntie Periwinkle', look: { hat: 0x9b7fd4, shirt: 0xf0d6e6, beard: null, dress: true, glasses: true }, tint: 0x9b7fd4,
  pace: 0.97, grip: 1.0, line: -1.5, aggression: 0.4,
  taunts: ['I bred this snail myself. Her name is Doris.', 'Doris does not like being overtaken, dear.'],
};
const SLOW_MOE: RaceRival = {
  name: 'Slow Moe', look: { hat: 0x5a4632, shirt: 0xa08060, beard: 0x5a4632 }, tint: 0x5a4632,
  pace: 0.88, grip: 0.8, line: 1.5, aggression: 0.15,
  taunts: ['Steady wins it. Usually. Sometimes.', 'I am not slow. I am pacing myself.'],
};
const VINNIE_RIVAL: RaceRival = {
  name: 'Vinnie "Turbo-Sod" Delacroix', look: VINNIE, tint: 0xffd21f,
  pace: 1.02, grip: 1.25, line: 0, aggression: 0.9,
  taunts: ['Three-time Grand Zero-Turn champion! Say it with me!', '110% pollen, 0% brakes!'],
};
const DOCK_RIVAL: RaceRival = {
  name: 'Dock "Full-Throttle" Hoewright', look: DOCK, tint: 0xd8342c,
  pace: 1.0, grip: 1.15, line: -2, aggression: 0.5,
  taunts: ['One, two, BLADE!', 'I checked the seat bolt. Twice.'],
};
const RAZOR: RaceRival = {
  name: 'Sprocket Vane', look: { hat: 0xff7a00, shirt: 0x1d1d1d, beard: 0x3a3a3a }, tint: 0xff7a00,
  pace: 0.98, grip: 1.1, line: 2.5, aggression: 0.45,
  taunts: ['Razor-Back works team. Zero turning radius, zero regrets.', 'Factory parts beat garage parts.'],
};

/** Quest ids, in order. When each one opens in the story: SIDE_UNLOCKS in unlocks.ts. */
export const RACE_IDS = ['race-rookie-mowdown', 'race-lowrider-derby', 'race-snail-endurance', 'race-fizz-cup-final'] as const;

export const RACE_QUESTS: readonly QuestDef[] = [
  {
    id: 'race-rookie-mowdown',
    title: 'Fizz Cup: Rookie Mow-Down',
    giver: 'speedway',
    rewardAcorns: 400,
    achievement: 'gta-speedway-rookie',
    cutscene: { kind: 'script', script: 'race-rookie-mowdown-intro' },
    objectives: [{
      kind: 'race', text: 'Finish the Rookie Mow-Down on the podium', raceId: 'rookie-mowdown', vehicle: 'ride-on', laps: 2,
      rivals: [PEBBLE, MARIGOLD, TUMBLEWEED], mustPlace: 3, hint: 'Lost & Found Speedway grid', tint: 0xffd21f,
    }],
    doneText: 'Podium! Burdock hands you a Fizz-sponsored rosette and a can of Dandelion Fizz you are advised not to drink before driving.',
  },
  {
    id: 'race-lowrider-derby',
    title: 'Fizz Cup: Low & Loud Derby',
    giver: 'speedway',
    prereq: 'race-rookie-mowdown',
    rewardAcorns: 650,
    achievement: 'gta-speedway-lowrider',
    cutscene: { kind: 'script', script: 'race-lowrider-derby-intro' },
    objectives: [{
      kind: 'race', text: 'Win the Low & Loud Derby', raceId: 'lowrider-derby', vehicle: 'lowrider', laps: 2,
      rivals: [LUGNUT, TEASEL, CHROME], mustPlace: 1, hint: 'Lost & Found Speedway grid', tint: 0x2fb5a8,
    }],
    doneText: 'The Carburettors bang on your bonnet in approval. Lugnut Lulu says you can come to the next midnight derby. Nobody says where it is.',
  },
  {
    id: 'race-snail-endurance',
    title: 'Fizz Cup: Snail-Coach Endurance',
    giver: 'speedway',
    prereq: 'race-lowrider-derby',
    rewardAcorns: 800,
    achievement: 'gta-speedway-snail',
    cutscene: { kind: 'script', script: 'race-snail-endurance-intro' },
    objectives: [{
      kind: 'race', text: 'Win the Snail-Coach Endurance', raceId: 'snail-endurance', vehicle: 'snail-coach', laps: 2,
      rivals: [SHELLDON_RIVAL, PERIWINKLE, SLOW_MOE], mustPlace: 1, hint: 'Lost & Found Speedway grid', tint: 0xe8b04a,
    }],
    doneText: 'You win by a shell. Shelldon finishes on the gravel, refuses the podium (it is paved) and accepts his medal by post.',
  },
  {
    id: 'race-fizz-cup-final',
    title: 'Fizz Cup: The Final',
    giver: 'speedway',
    prereq: 'race-snail-endurance',
    rewardAcorns: 1500,
    achievement: 'gta-fizz-cup',
    cutscene: { kind: 'script', script: 'race-fizz-cup-final-intro' },
    objectives: [{
      kind: 'race', text: 'Win the Fizz Cup Final', raceId: 'fizz-cup-final', vehicle: 'zero-turn', laps: 3,
      rivals: [VINNIE_RIVAL, DOCK_RIVAL, RAZOR], mustPlace: 1, hint: 'Lost & Found Speedway grid', tint: 0xffd21f,
    }],
    doneText: 'FIZZ CUP CHAMPION! Vinnie demands a recount. Dock Hoewright shakes your hand and says it on air: one, two, you.',
  },
];

/**
 * One beat of a race scene (cutscene/scenes/speedway.ts stages them; director's notes:
 * docs/design/gnome-theft-auto/direction/scenes/race-scenes.md). `who` is 'burdock', 'you', a rival by grid index (intro)
 * or 'second' / 'third' (podium). Lines stay under 16 words (aim 12); the shot is a close single on the speaker.
 */
export interface RaceBeat {
  who: 'burdock' | 'you' | 'second' | 'third' | number;
  text: string;
  /** What the speaker does as the line starts. */
  gesture?: Gesture;
  /** A sound first: the speaker's engine ('engine-rev', intro rivals) or every rival's horn at once ('horns'). */
  sfx?: 'engine-rev' | 'horns';
  /** Shot size; 'cu' for a line that lands. Default 'mcu'. */
  size?: 'cu' | 'mcu' | 'ms';
  /** Voice pitch. */
  hz?: number;
  /** Shelldon only: walks off the paving onto the gravel run-off before his line. */
  toGravel?: boolean;
}

/** A race's intro: Burdock counts the grid as he walks down it (`count`), then the beats; the last beat is the button. */
export interface RaceIntroTalk { count: string; beats: RaceBeat[] }

/** A race's podium: the beats after the top three take the steps. `emptySecond`: the runner-up refuses the podium. */
export interface RacePodiumTalk { beats: RaceBeat[]; emptySecond?: boolean }

/**
 * The Fizz Cup's intros, by race id. One staging for all four (the crane down, Burdock counting the grid twice as he
 * walks down it, the rival's taunt, the player's question, Burdock's button); each race has its own rival, stakes and turn.
 */
export const RACE_INTROS: Record<string, RaceIntroTalk> = {
  'rookie-mowdown': {
    count: 'Four on the grid. One, two, three, four. And again.',
    beats: [
      { who: 'burdock', text: 'Rookie Mow-Down. Two laps. Make the podium and you get the fast stuff.', gesture: 'point' },
      { who: 1, text: 'A rookie on a Ride-On. Eat my clippings, sweetheart.', gesture: 'crossArms', sfx: 'engine-rev', hz: 210 },
      { who: 'you', text: 'Is that a tea towel?' },
      { who: 'burdock', text: 'I left the Hat Watch over this tea towel.', gesture: 'handsUp' },
      { who: 'burdock', text: 'It is a very serious tea towel.', size: 'cu' },
    ],
  },
  'lowrider-derby': {
    count: 'Four lowriders. One, two, three, four. Nobody hop yet.',
    beats: [
      { who: 'burdock', text: 'Low & Loud Derby. The Carburettors do not lose to tourists.', gesture: 'point' },
      { who: 0, text: 'Vesper\'s lot drive silent carts. We drive noise. Which are you?', gesture: 'crossArms', sfx: 'engine-rev', hz: 220 },
      { who: 'you', text: 'Loud, apparently.' },
      { who: 0, text: 'Then prove it on the Rake-Handle. Win, or walk home.', gesture: 'nod', size: 'cu', hz: 220 },
      { who: 'burdock', text: 'Nobody honks at my flag.', gesture: 'flinch', sfx: 'horns', size: 'cu' },
    ],
  },
  'snail-endurance': {
    count: 'Three snails, one rookie. One, two, three... Where is he going?',
    beats: [
      { who: 0, text: 'Paving is a government trap. I race on the gravel.', gesture: 'crossArms', toGravel: true, hz: 230 },
      { who: 'burdock', text: 'Snail-Mail Express entered him. He has conditions.', gesture: 'facepalm' },
      { who: 1, text: 'This is Doris. Doris does not get overtaken, dear.', gesture: 'wave', hz: 240 },
      { who: 'you', text: 'Which one is Doris?' },
      { who: 1, text: 'The snail, dear.', gesture: 'crossArms', size: 'cu', hz: 240 },
      { who: 'burdock', text: 'Win this one and the Final is yours. Watch the lights.', gesture: 'handsUp' },
    ],
  },
  'fizz-cup-final': {
    count: 'The Final. One, two, three, four. Counting twice tonight.',
    beats: [
      { who: 'burdock', text: 'Three laps, and the whole yard listening on Turfton FM.', gesture: 'point' },
      { who: 0, text: 'Three-time champion! Four after today. Keep my exhaust in sight, kid.', gesture: 'cheer', sfx: 'engine-rev', hz: 200 },
      { who: 1, text: 'My cousin Pip says you\'re all right. I checked my seat bolt anyway.', gesture: 'think', hz: 170 },
      { who: 'you', text: 'Pip\'s cousin?' },
      { who: 1, text: 'Twice. One, two, Blade.', gesture: 'nod', size: 'cu', hz: 170 },
      { who: 'burdock', text: 'One, two, three, four. Engines.', gesture: 'handsUp', sfx: 'horns', size: 'cu' },
    ],
  },
};

/** The Fizz Cup's podiums, by race id: Burdock's call, then the runner-up's answer as the button. */
export const RACE_PODIUMS: Record<string, RacePodiumTalk> = {
  'rookie-mowdown': {
    beats: [
      { who: 'burdock', text: 'A podium on your first go! Half the crowd is chanting your name.', gesture: 'point' },
      { who: 'second', text: 'Mum! Mum, I\'m on a box!', gesture: 'cheer', hz: 260 },
    ],
  },
  'lowrider-derby': {
    beats: [
      { who: 'burdock', text: 'The Carburettors are speechless. That has never happened.', gesture: 'point' },
      { who: 'second', text: 'Midnight derby. You\'re in. Nobody will tell you where.', gesture: 'nod', size: 'cu', hz: 220 },
    ],
  },
  'snail-endurance': {
    emptySecond: true,
    beats: [
      { who: 'burdock', text: 'Shelldon refuses the podium. It is paved. His medal goes by snail.', gesture: 'shrug' },
      { who: 'third', text: 'Doris would like a word, dear.', gesture: 'crossArms', size: 'cu', hz: 240 },
    ],
  },
  'fizz-cup-final': {
    beats: [
      { who: 'burdock', text: 'Ladies and gnomes, your Fizz Cup champion!', gesture: 'handsUp' },
      { who: 'second', text: 'Recount! I demand a recount!', gesture: 'stomp', hz: 200 },
      { who: 'burdock', text: 'I counted twice.', size: 'cu' },
    ],
  },
};

/** Burdock's look and voice, for the race scenes. */
export const BURDOCK_LOOK = BURDOCK;
export const BURDOCK_NAME = 'Burdock "Big Flag" Bellweather';
