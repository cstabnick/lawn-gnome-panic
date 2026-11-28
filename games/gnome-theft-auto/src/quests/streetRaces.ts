// E26's side questline: five street races, a chain by `prereq`, one rival (STREET_RIVAL) who drives in quests 2 and 5.
// Plain QuestDefs: defs.ts registers them (another issue); the three givers `street-<meet id>` are the meets' organisers (cast.ts).
// Lore: docs/lore/entries/apocrypha/turfton-street-racing.md and the meet entries beside it.
import type { GnomeLook } from '@lawn/gnome';
import { MEET_CAST, STREET_RIVAL } from '../streetRace/cast';
import type { DialogueLine, QuestDef } from './types';

const RATCHET: Partial<GnomeLook> = MEET_CAST['skyway-foot'].organiser.look;
const AURELIE: Partial<GnomeLook> = MEET_CAST.pardonlin.organiser.look;
const DUNE: Partial<GnomeLook> = MEET_CAST.saltbucket.organiser.look;
const SABLE: Partial<GnomeLook> = STREET_RIVAL.look;
const LULU_LOOK: Partial<GnomeLook> = { hat: 0xff6a00, shirt: 0x1a1a1a, beard: null, dress: true };

const say = (speaker: string, text: string, look: Partial<GnomeLook>): DialogueLine => ({ speaker, text, look });

export const STREET_QUEST_IDS = ['sr-kerb-row', 'sr-skyway-midnight', 'sr-boucle', 'sr-saltbucket-dash', 'sr-ring-road'] as const;

const skyway = MEET_CAST['skyway-foot'];
const pardonlin = MEET_CAST.pardonlin;
const saltbucket = MEET_CAST.saltbucket;

export const STREET_QUESTS: readonly QuestDef[] = [
  {
    id: 'sr-kerb-row',
    title: 'Kerb Row Warm-Up',
    giver: 'street-skyway-foot',
    rewardAcorns: 300,
    achievement: 'gta-street-first',
    hoa: { cap: 1 },
    cutscene: {
      kind: 'dialogue', room: 'street',
      lines: [
        say('Ratchet Gaskin', 'Fresh face at the Skyway Foot. Everyone starts on Kerb Row: two laps through downtown, live traffic, no road closed.', RATCHET),
        say('Ratchet Gaskin', 'Podium or you are a spectator. The traffic does not know it is in a race. Be kind to it, if you can.', RATCHET),
        say('Ratchet Gaskin', 'Mind the Watch. They are not here. They are very much not here.', RATCHET),
      ],
    },
    objectives: [{
      kind: 'race', text: 'Finish the Kerb Row Circuit on the podium', raceId: 'kerb-row', trackId: 'kerb-row-circuit', vehicle: 'lowrider', laps: 2,
      rivals: skyway.roster.slice(), mustPlace: 3, hint: 'Kerb Row Circuit grid, north downtown', tint: 0xff6a00,
    }],
    doneText: 'Podium. Ratchet writes your name on the wall of the Skyway Foot in marker pen, beside the other names nobody reads.',
  },
  {
    id: 'sr-skyway-midnight',
    title: 'Skyway Midnight',
    giver: 'street-skyway-foot',
    prereq: 'sr-kerb-row',
    rewardAcorns: 500,
    achievement: 'gta-street-night',
    hoa: { cap: 1 },
    cutscene: {
      kind: 'dialogue', room: 'street',
      lines: [
        say('Ratchet Gaskin', 'Midnight, up the Skyway Sprint. One run, lights off the hill, a lot of sky and nothing to lean on.', RATCHET),
        say('Sable Throttlewick', 'My brother held the Ring Road record until the Watch took his lowrider. I am here for the record. And for the lowrider.', SABLE),
        say('Ratchet Gaskin', 'Beat her, and she will tell you why she is so cross. It takes a while.', RATCHET),
        say('Sable Throttlewick', 'It does not take a while. It is a very short reason.', SABLE),
      ],
    },
    objectives: [{
      kind: 'race', text: 'Win the Skyway Sprint at night against Sable Throttlewick', raceId: 'skyway-midnight', trackId: 'skyway-sprint', vehicle: 'lowrider', laps: 1,
      rivals: [STREET_RIVAL, skyway.roster[1], skyway.roster[2]], mustPlace: 1, hint: 'Skyway Foot grid, west Turfton', tint: 0x6b2a8a, night: true,
    }],
    doneText: 'You win. Sable stands by her car for a while, then says "fine" in a voice that has been in the garage a long time.',
  },
  {
    id: 'sr-boucle',
    title: 'La Boucle de Pardonlin',
    giver: 'street-pardonlin',
    prereq: 'sr-skyway-midnight',
    rewardAcorns: 600,
    hoa: 'off',
    cutscene: {
      kind: 'dialogue', room: 'street',
      lines: [
        say('Commissaire Aurelie Fonce', 'Here the road is closed, licensed and lightly sprinkled with geraniums. Two laps of the Boucle.', AURELIE),
        say('Commissaire Aurelie Fonce', 'Please take the Deux-Pots. It is a car of character. It has also been inspected, which is a character of its own.', AURELIE),
        say('Commissaire Aurelie Fonce', 'Podium, and a rosette. No podium, and a form.', AURELIE),
      ],
    },
    objectives: [{
      kind: 'race', text: 'Finish La Boucle de Pardonlin on the podium', raceId: 'boucle', trackId: 'pardonlin-boucle', vehicle: 'deux-pots', laps: 2,
      rivals: pardonlin.roster.slice(), mustPlace: 3, hint: 'Quai de la Boucle grid, the Boulevard, Pardonlin', tint: 0x1f3a6a, closedRoad: true,
    }],
    doneText: 'Podium, and a rosette. The Commissaire shakes your hand, then stamps the handshake.',
  },
  {
    id: 'sr-saltbucket-dash',
    title: 'The Saltbucket Dash',
    giver: 'street-saltbucket',
    prereq: 'sr-boucle',
    rewardAcorns: 700,
    hoa: { cap: 1 },
    cutscene: {
      kind: 'dialogue', room: 'street',
      lines: [
        say('Dune Gritstone', 'Band road out to the coast, past the dunes, lay-by to lay-by. One run, and the road stays open to anything that wants to cross it.', DUNE),
        say('Dune Gritstone', 'Sand drifts onto the tarmac. The sea breeze does the rest. It is fair; it is the same for everyone.', DUNE),
        say('Dune Gritstone', 'Win it and Haddock gives you a free chip. One chip. He counts.', DUNE),
      ],
    },
    objectives: [{
      kind: 'race', text: 'Win the Saltbucket Dash', raceId: 'saltbucket-dash', trackId: 'saltbucket-dash', vehicle: 'wespa', laps: 1,
      rivals: saltbucket.roster.map((r) => ({ ...r, pace: Math.min(r.pace, 0.94) })), // a straight run: rivals a touch slower than the bookie's
      mustPlace: 1, hint: 'Saltbucket lay-by, the East Band road', tint: 0x2a7a8a,
    }],
    doneText: 'You win. Haddock hands you one chip, still hot, and watches you eat it as if it were evidence.',
  },
  {
    id: 'sr-ring-road',
    title: 'The Ring Road Run',
    giver: 'street-skyway-foot',
    prereq: 'sr-saltbucket-dash',
    rewardAcorns: 900,
    achievement: 'gta-street-champion',
    hoa: { cap: 1 },
    cutscene: {
      kind: 'dialogue', room: 'street',
      lines: [
        say('Ratchet Gaskin', 'The Ring Road. The Carburettors\' illicit time trial: two laps, the record on the wall, a captain watching.', RATCHET),
        say('Lugnut Lulu', 'Low and loud, newcomer. Sable holds a grudge and a lap record. She can keep one of them.', LULU_LOOK),
        say('Sable Throttlewick', 'My brother\'s time. I will not share it. I will, however, share the road.', SABLE),
        say('Ratchet Gaskin', 'Win, and the Skyway Foot is yours. Lose, and you are still the best in the lay-by. Go.', RATCHET),
      ],
    },
    objectives: [{
      kind: 'race', text: 'Win the Ring Road Run against Sable Throttlewick', raceId: 'ring-road', trackId: 'ring-road-run', vehicle: 'lowrider', laps: 2,
      rivals: [STREET_RIVAL, skyway.roster[0], skyway.roster[2]], mustPlace: 1, hint: 'Ring Road grid, north-west Ring Road', tint: 0x6b2a8a,
    }],
    doneText: 'You win the Ring Road. Sable hangs her brother\'s old number on your wing mirror, and Lulu says "not bad" without laughing.',
  },
];
