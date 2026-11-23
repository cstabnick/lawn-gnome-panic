// The Fizz Cup: four races at the Lost & Found Speedway (raceTrack/track.ts), each in a different machine, given by
// Burdock "Big Flag" Bellweather at the race desk in the pit lane. Lore: docs/lore/entries/apocrypha/lost-and-found-speedway.md.
// Plugs into the quest system as plain QuestDefs (defs.ts spreads RACE_QUESTS into QUESTS, the 'speedway' giver is in GIVERS).
import type { GnomeLook } from '@lawn/gnome';
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

/** Quest ids, in order. */
export const RACE_IDS = ['race-rookie-mowdown', 'race-lowrider-derby', 'race-snail-endurance', 'race-fizz-cup-final'] as const;

/**
 * Suggested story gating for each race (for the side-quest unlock system): offered once `afterQuest` is done. Each race
 * also needs the one before it (`prereq`). The first race waits for the player to have stolen a mower or two.
 */
export const RACE_UNLOCKS: Record<(typeof RACE_IDS)[number], { afterQuest: string; why: string }> = {
  'race-rookie-mowdown': { afterQuest: 'ch1-mowers-keepers', why: 'the player has learned to drive' },
  'race-lowrider-derby': { afterQuest: 'ch2-dew-run', why: 'Chapter 2 opens the Dust Flats roads' },
  'race-snail-endurance': { afterQuest: 'ch3-tundra-drift-run', why: 'after the Carburettors rally in Chapter 3' },
  'race-fizz-cup-final': { afterQuest: 'ch4-runway-flares', why: 'Chapter 4 is set at the airfield next door' },
};

export const RACE_QUESTS: readonly QuestDef[] = [
  {
    id: 'race-rookie-mowdown',
    title: 'Fizz Cup: Rookie Mow-Down',
    giver: 'speedway',
    rewardAcorns: 400,
    achievement: 'gta-speedway-rookie',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      titleCard: 'The Lost & Found Speedway',
      lines: [
        { speaker: 'Burdock "Big Flag" Bellweather', text: 'Welcome to the Lost & Found Speedway! Everything you can see fell out of the sky one night. We paved round it.', look: BURDOCK, hz: 150 },
        { speaker: 'Burdock "Big Flag" Bellweather', text: 'The Fizz Cup starts with the rookies. Plain Ride-On Mowers, two laps. Finish on the podium and I will let you near the fast stuff.', look: BURDOCK, hz: 150 },
        { speaker: 'Burdock "Big Flag" Bellweather', text: 'Your mower is in the last slot on the grid. Wait for my flag. It is a tea towel, but it is a very serious tea towel.', look: BURDOCK, hz: 150 },
      ],
    },
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
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: 'Burdock "Big Flag" Bellweather', text: 'The Carburettors want a word. Well, a race. Lowriders, two laps, and they do not lose to tourists.', look: BURDOCK, hz: 150 },
        { speaker: 'Lugnut Lulu', text: 'Low and loud, rookie. You hop the Rake-Handle, we hop higher. Win it or walk home.', look: LUGNUT.look, hz: 220 },
      ],
    },
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
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        { speaker: 'Burdock "Big Flag" Bellweather', text: 'Endurance round. Snail-coaches, two laps. Snail-Mail Express entered a driver. He has... conditions.', look: BURDOCK, hz: 150 },
        { speaker: 'Shelldon "No-Trail" Mucilage', text: 'I will not set one foot on that paving. I race on the gravel. The gravel is honest. And still I will beat you.', look: SHELLDON, hz: 230 },
      ],
    },
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
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      titleCard: 'The Fizz Cup Final',
      lines: [
        { speaker: 'Burdock "Big Flag" Bellweather', text: 'The Final. Zero-Turn Racers, three laps, and the whole yard is listening on the radio.', look: BURDOCK, hz: 150 },
        { speaker: 'Vinnie "Turbo-Sod" Delacroix', text: 'Three-time Grand Zero-Turn champion, kid. Four after today. Try to keep my exhaust in sight.', look: VINNIE, hz: 200 },
        { speaker: 'Dock "Full-Throttle" Hoewright', text: 'Last time I raced, my seat bolt came loose on the final bend. I have checked it twice. One, two, Blade.', look: DOCK, hz: 170 },
      ],
    },
    objectives: [{
      kind: 'race', text: 'Win the Fizz Cup Final', raceId: 'fizz-cup-final', vehicle: 'zero-turn', laps: 3,
      rivals: [VINNIE_RIVAL, DOCK_RIVAL, RAZOR], mustPlace: 1, hint: 'Lost & Found Speedway grid', tint: 0xffd21f,
    }],
    doneText: 'FIZZ CUP CHAMPION! Vinnie demands a recount. Dock Hoewright shakes your hand and says it on air: one, two, you.',
  },
];
