// E14's side quests: three races on the dirt (the Rutbottom Dirt Bowl and the Capwood Run) and the Cap Count, a walk
// through Capwood for its warden. Plain QuestDefs: defs.ts spreads DIRT_QUESTS into QUESTS and holds the four givers.
// Lore: docs/lore/entries/apocrypha/rutbottom-dirt-bowl.md, capwood-run.md, the-rutbottom-regulars.md.
import type { GnomeLook } from '@lawn/gnome';
import { CAP_COUNT_SPOTS, WARDEN_HUT } from '../capwood/spots';
import type { DialogueLine, QuestDef, RaceRival } from './types';

const CLARY_LOOK: Partial<GnomeLook> = { hat: 0xe8e8e8, shirt: 0x8a7a5c, beard: null };
const TEASEL_LOOK: Partial<GnomeLook> = { hat: 0xff6a00, shirt: 0x3a3a3a, beard: 0x2a2a2a };
const LULU_LOOK: Partial<GnomeLook> = { hat: 0xff6a00, shirt: 0x1a1a1a, beard: null, dress: true };
const CHANTERELLE_LOOK: Partial<GnomeLook> = { hat: 0x7a5a3a, shirt: 0x4f6b3a, beard: 0xb0b0b0 };

const SKID: RaceRival = {
  name: 'Skid Thistlewaite', look: { hat: 0x8a6a4a, shirt: 0xb8a070, beard: 0xe8e0d0 }, tint: 0x8a6a4a,
  pace: 0.9, grip: 0.9, line: -2, aggression: 0.3,
  taunts: ['Raced here since it was a puddle. It was a better puddle.', 'Mind the berm. I helped dig the berm.'],
};
const POLLY: RaceRival = {
  name: 'Polly Pebbledash', look: { hat: 0xff5fa2, shirt: 0xf2e6c8, beard: null, freckles: true }, tint: 0xff5fa2,
  pace: 0.98, grip: 1.1, line: 2, aggression: 0.5,
  taunts: ['Brakes are for people who plan to stop!', 'Is this a good time to say I have no insurance?'],
};
const BRAMBLE: RaceRival = {
  name: 'Brakeless Bramble', look: { hat: 0x2f6b2a, shirt: 0xd8342c, beard: 0x5a4632 }, tint: 0x2f6b2a,
  pace: 0.94, grip: 1.0, line: 0, aggression: 0.7,
  taunts: ['Bramble, brakeless. It is on the form.', 'I would slow down but I would need a lever.'],
};
// Two-Ton Teasel keeps his Speedway look; here he races the dirt on the Carburettors' lowriders.
const TEASEL_DIRT: RaceRival = {
  name: 'Two-Ton Teasel', look: TEASEL_LOOK, tint: 0xd8342c,
  pace: 1.0, grip: 0.95, line: -2, aggression: 0.8,
  taunts: ['My sister is watching. Do not make me look slow.', 'I do not brake. I negotiate. With the berm.'],
};
const POLLY_HEATS: RaceRival = { ...POLLY, pace: 1.02 };
const BRAMBLE_HEATS: RaceRival = { ...BRAMBLE, pace: 0.97 };

const GERTIE: RaceRival = {
  name: 'Gravel Gertie', look: { hat: 0x9a9a9a, shirt: 0x2a2d36, beard: null, dress: true }, tint: 0x8e44ad,
  pace: 0.97, grip: 1.0, line: -2, aggression: 0.5,
  taunts: ['Gravel in the gearbox is just seasoning.', 'The Run is not a road. It is an argument.'],
};
const FOGG: RaceRival = {
  name: 'Fenwick "Flat-Out" Fogg', look: { hat: 0xffd21f, shirt: 0x3a3a3a, beard: 0x8a6a4a }, tint: 0xffd21f,
  pace: 1.0, grip: 1.05, line: 2, aggression: 0.6,
  taunts: ['Flat out. Always. The ford is just a wet corner.', 'Lift? What is lift?'],
};
const MOSS: RaceRival = {
  name: 'Spanner Moss', look: { hat: 0x4f7a5a, shirt: 0xa08060, beard: 0xc9c2b4, glasses: true }, tint: 0x4f7a5a,
  pace: 0.9, grip: 0.9, line: 0, aggression: 0.25,
  taunts: ['I built this hatch. I know where it will break.', 'Mind the stalks. They mind you back.'],
};

const say = (speaker: string, text: string, look: Partial<GnomeLook>): DialogueLine => ({ speaker, text, look });

/** The Cap Count's route: a loop out from the Warden's hut and back, nearest to next (spots.ts labels). */
const CAP_ORDER = ['the Puffball Hollow', 'the Shelf Stump', 'the Dewbowl Cap', "the Warden's Favourite", 'the Leaning Cap', 'the Twin Stalks'];

export const DIRT_QUEST_IDS = ['race-rutbottom-knobbly', 'sq-rutbottom-heats', 'race-capwood-open', 'sq-capwood-cap-count'] as const;

export const DIRT_QUESTS: readonly QuestDef[] = [
  {
    id: 'race-rutbottom-knobbly',
    title: 'Rutbottom: Knobbly Heat',
    giver: 'rutbottom-clary',
    rewardAcorns: 350,
    achievement: 'gta-dirt-rookie',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        say('Marshal Clary Mudguard', 'Knobbly Heat. Dirt bike, two laps, three riders who ought to know better.', CLARY_LOOK),
        say('Marshal Clary Mudguard', 'Podium or go home. The bike is on the grid. Three. Two. Go on, then.', CLARY_LOOK),
        say('Marshal Clary Mudguard', 'Mind the berm. The berm remembers.', CLARY_LOOK),
      ],
    },
    objectives: [{
      kind: 'race', text: 'Finish the Knobbly Heat on the podium', raceId: 'rutbottom-knobbly', trackId: 'rutbottom', vehicle: 'dirt-bike', laps: 2,
      rivals: [SKID, POLLY, BRAMBLE], mustPlace: 3, hint: 'Rutbottom Dirt Bowl grid', tint: 0xc9a66b,
    }],
    doneText: 'Podium. Clary waves the flag at you twice, which is her version of applause, and tells you the berm has made a note of you.',
  },
  {
    id: 'sq-rutbottom-heats',
    title: 'Rutbottom Heats',
    giver: 'rutbottom-teasel',
    prereq: 'race-rutbottom-knobbly',
    rewardAcorns: 600,
    achievement: 'gta-dirt-champion',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        say('Two-Ton Teasel', 'The Carburettors\' lowriders are back from the impound. Nobody has told them about dirt.', TEASEL_LOOK),
        say('Two-Ton Teasel', 'My little sister runs this bowl, and she is watching. I want a rematch where she can see.', TEASEL_LOOK),
        say('Two-Ton Teasel', 'Three laps. Beat me and I will say it out loud..', TEASEL_LOOK),
      ],
    },
    objectives: [{
      kind: 'race', text: 'Win the Rutbottom Heats against Two-Ton Teasel', raceId: 'rutbottom-heats', trackId: 'rutbottom', vehicle: 'lowrider', laps: 3,
      rivals: [TEASEL_DIRT, POLLY_HEATS, BRAMBLE_HEATS], mustPlace: 1, hint: 'Rutbottom Dirt Bowl grid', tint: 0xd8342c,
    }],
    doneText: 'You win. Teasel says "well driven" so quietly that Clary makes him say it again into the tannoy. A lowrider on dirt is a boat with opinions.',
  },
  {
    id: 'race-capwood-open',
    title: 'The Capwood Run: Open Stage',
    giver: 'capwood-lulu',
    rewardAcorns: 500,
    achievement: 'gta-rally-finish',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        say('Lugnut Lulu', 'The Capwood Run. Over the Fells, down through the toadstools, mud to the axles. No laps. One go.', LULU_LOOK),
        say('Lugnut Lulu', 'The Carburettors keep the route open to anyone who can beat my time. So far, that is nobody.', LULU_LOOK),
        say('Lugnut Lulu', 'Take the Petit Pois. It is a proper rally car, whatever it says on the badge.', LULU_LOOK),
      ],
    },
    objectives: [{
      kind: 'race', text: 'Finish the Capwood Run on the podium', raceId: 'capwood-open', trackId: 'capwood-run', vehicle: 'euro-hatch', laps: 1,
      rivals: [GERTIE, FOGG, MOSS], mustPlace: 3, hint: 'Capwood Run paddock, Frostbite Fells', tint: 0x8e44ad,
      // Gold: the quest-sim bot (racing line) finishes in 150..165 s (bisected), so 1.08 x ~160 s = 175 s.
      timeAchievement: { seconds: 175, id: 'gta-rally-gold' },
    }],
    doneText: 'You finish with mud to the axles and your hat still on. Lulu stamps your card, the one nobody has ever filled in.',
  },
  {
    id: 'sq-capwood-cap-count',
    title: 'The Cap Count',
    giver: 'capwood-warden',
    prereq: 'race-capwood-open',
    rewardAcorns: 250,
    achievement: 'gta-cap-count',
    cutscene: {
      kind: 'dialogue',
      room: 'street',
      lines: [
        say('Warden Chanterelle Stook', 'Section Nine: every cap in Capwood is to be counted. Six remain unfined. I cannot walk them all.', CHANTERELLE_LOOK),
        say('Warden Chanterelle Stook', 'Here is a clipboard. Visit each flagged cap and look at it sternly. Touch nothing. That is a bruise.', CHANTERELLE_LOOK),
        say('Warden Chanterelle Stook', 'Then come back. Eleven acorns for a bruised cap. Two hundred and fifty for the count.', CHANTERELLE_LOOK),
      ],
    },
    objectives: [
      {
        kind: 'checkpoints',
        text: 'Count the six unfined caps of Capwood',
        points: CAP_ORDER.map((label) => {
          const s = CAP_COUNT_SPOTS.find((c) => c.label === label)!;
          return { at: [s.x, s.z] as [number, number], radius: 4, label: s.label[0].toUpperCase() + s.label.slice(1) };
        }),
        hint: 'Capwood, Snowcap Rise',
      },
      {
        kind: 'visit',
        text: 'Return to Warden Chanterelle Stook with the count',
        at: [WARDEN_HUT.x, WARDEN_HUT.z - 4],
        radius: 6,
        hint: "Warden's hut, Capwood",
      },
    ],
    doneText: 'Six caps, none bruised. Chanterelle ticks the count off by number and fines you eleven acorns for the paperwork, then refunds it, citing Section Ten.',
  },
];
