// Story row 40 (docs/design/gnome-theft-auto/story-outline.md): The Capwood Run. Lugnut Lulu refused the HOA charter and says the
// Carburettors will back the crew if the player wins her rally: up the Fells mountain road past the three who stayed (Bertha,
// Dunstan, Fennimore), through the Cap-water fords without stalling and down through the toadstools, where Warden Chanterelle
// Stook fines everybody for bruising the caps. The race is the E14 Capwood Run (trackId 'capwood-run', the Petit Pois euro-hatch,
// one go, mustPlace 1). The win is carried to the Great Ring clearing in the toadstools, where Chanterelle writes the player a fine
// for the caps and Lulu tears the HOA charter up in front of everyone: from Cam's rival to the crew's ally, in one gesture.
// Scenes: cutscene/scenes/story/m40-the-capwood-run.ts. Stages: quests/stages/story/s40-the-capwood-run.ts.
import { GREAT_RING } from '../../capwood/spots';
import type { QuestDef, RaceRival } from '../types';
import { brief, call, type StoryFile } from './kit';

const ID = 'm40-the-capwood-run';

/** The three Carburettors who stayed when the rest signed for the free tyres (lore ruling to add: see the row report). */
const BERTHA: RaceRival = {
  name: 'Big-End Bertha', look: { hat: 0xff6a00, shirt: 0x3a2a2a, beard: 0xd8d0c0, dress: true }, tint: 0xb8452c,
  pace: 0.93, grip: 1.0, line: -2, aggression: 0.55,
  taunts: ['Thirty years on this road. It still owes me a wheel nut.', 'Charter? I would sooner sign for a puncture.'],
};
const DUNSTAN: RaceRival = {
  name: 'Dipstick Dunstan', look: { hat: 0xe8c33a, shirt: 0x2a3a4a, beard: 0x8a6a4a, glasses: true }, tint: 0xe8c33a,
  pace: 0.9, grip: 0.95, line: 2, aggression: 0.2,
  taunts: ['After you! No, after me. Actually, excuse me, I am overtaking.', 'Sorry about the mud. It is not my mud.'],
};
const FENNIMORE: RaceRival = {
  name: 'Fanbelt Fennimore', look: { hat: 0x3a7a6a, shirt: 0xd8d0c0, beard: null, freckles: true }, tint: 0x3a7a6a,
  pace: 0.96, grip: 1.05, line: 0, aggression: 0.7,
  taunts: ['I am the youngest Carburettor! Also the loudest!', 'Is it a ford or a puddle? I will find out at speed.'],
};

const QUEST: QuestDef = {
  id: ID,
  title: 'The Capwood Run',
  giver: 'capwood-lulu',
  prereq: 'm39-couch-surfing',
  chapter: 3,
  rewardAcorns: 350,
  radioBulletin: ID,
  achievement: 'gta-cap-bruiser',
  // The rally has its own marshals; the Hat Watch does not climb the Fells.
  hoa: 'off',
  cutscene: { kind: 'script', script: 'm40-the-capwood-run-intro' },
  outro: { kind: 'script', script: 'm40-the-capwood-run-outro' },
  objectives: [
    {
      kind: 'race',
      text: 'Win the Capwood Run: up the Fells, over the Cap-water fords, down through the toadstools',
      raceId: 'capwood-story',
      trackId: 'capwood-run',
      vehicle: 'euro-hatch',
      laps: 1,
      rivals: [BERTHA, DUNSTAN, FENNIMORE],
      mustPlace: 1,
      hint: 'Capwood Run paddock, Frostbite Fells (north road)',
      tint: 0xff6a00,
    },
    {
      kind: 'visit',
      text: "Carry the win to the Great Ring clearing, where Lulu and the Carburettors are waiting",
      at: [GREAT_RING.x, GREAT_RING.z],
      radius: 9,
      hint: 'The Great Ring, a fairy ring of glowing toadstools in Capwood',
    },
  ],
  doneText:
    'You won the Capwood Run, bruised eleven caps and were fined for every one. Lulu tore the HOA charter in half, and the Carburettors are yours to call.',
};

export const STORY: StoryFile = {
  quests: [QUEST],
  comms: {
    [ID]: {
      0: brief(
        ['lugnut lulu', 'Previously: the HOA charter wants every Carburettor signed. Three of us said no.'],
        ['lugnut lulu', 'Win the Capwood Run and the Carburettors back your crew. Low and loud!'],
        ['lugnut lulu', 'North road past the Fells to the paddock. Three hundred fifty acorns.'],
      ),
      1: call(
        ['lugnut lulu', 'You won! Come to the Great Ring. Everyone is waiting to shout at you.'],
        ['chanterelle', 'Section Nine: eleven bruised caps. Present yourself in person, and bring your hat.'],
      ),
    },
  },
  bulletins: {
    [ID]: [
      'Turfton FM: the Capwood Run was won this morning by a newcomer in a Petit Pois. The Carburettors describe the finish as "close" and the mud as "everywhere".',
      'Warden Chanterelle Stook reports eleven bruised caps along the Capwood Run, and has issued a fine for each. The caps declined to comment.',
    ],
  },
  plans: {
    // 900 s: the bot's racing line wins on its third or fourth attempt (rivals sit within metres of it; FX04 narrowed the collision).
    [ID]: { suite: 'story', expect: 'pass', budget: 900 },
  },
};
