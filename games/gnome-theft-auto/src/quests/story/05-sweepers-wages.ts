// Story row 5: Sweeper's Wages. Turncoat Cam asks the player to run a carburettor to the Carburettors' night meet at the
// Skyway foot (E26's MEETS['skyway-foot']); the player follows him there on his push-bike, watches Lulu win a heat and
// Cam stare at her charter plate (the plant for his betrayal), and rides home.
import { CAST } from '../../cutscene/cast';
import { SIDE_VALVE } from '../../config';
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

/** The Carburettors' meet, west foot of the Skyway (streetRace/meets.ts 'skyway-foot', centre -292, -60). */
const MEET: [number, number] = [-300, -55.5];

const QUEST: QuestDef = {
  id: 'm05-sweepers-wages',
  title: "Sweeper's Wages",
  giver: 'side-valve',
  prereq: 'ch1-mowers-keepers',
  chapter: 1,
  rewardAcorns: 250,
  radioBulletin: 'm05-sweepers-wages',
  hoa: 'off',
  cutscene: { kind: 'script', script: 'sweepers-wages-intro' },
  outro: { kind: 'script', script: 'sweepers-wages-outro' },
  objectives: [
    {
      kind: 'chase-follow',
      text: "Follow Turncoat Cam's push-bike to the Carburettors' night meet",
      leaderName: 'Turncoat Cam',
      leaderKind: 'push-bike',
      leaderLook: CAST['turncoat cam'].look,
      // West out of the bay, north up the x = -180 road, then along the clear ground south of the Skyway's feet.
      waypoints: [[SIDE_VALVE.bay.x, SIDE_VALVE.bay.z], [-150, 60], [-180, 60], [-180, -43], [-232, -43], [-284, -43]],
      speed: 9,
      maxDist: 75,
      hint: 'Cam on his push-bike',
    },
    {
      kind: 'visit',
      text: 'Hand the carburettor to Lulu at the Skyway night meet',
      at: MEET,
      radius: 9,
      hint: 'The Skyway foot, the Carburettors',
      scene: 'sweepers-wages-mid',
    },
    {
      kind: 'visit',
      text: 'Ride home to Side-Valve Salvage',
      at: [SIDE_VALVE.bay.x, SIDE_VALVE.bay.z],
      radius: 8,
      hint: 'Side-Valve Salvage bay',
    },
  ],
  doneText: 'Tansy counts your 250 Acorns out on the bench. Cam is still sweeping, slower than before.',
};

export const STORY: StoryFile = {
  quests: [QUEST],
  comms: {
    'm05-sweepers-wages': {
      0: brief(
        ['turncoat cam', 'The Carburettors need a carburettor at tonight\'s meet. I will ride ahead.'],
        ['turncoat cam', 'Somebody has to sweep. So it has to be you. Sorry.'],
        ['tansy', 'Run it to the Skyway, ride home slow. It pays 250 Acorns.'],
      ),
      1: call(
        ['tansy', 'Lulu captains the Carburettors. Be polite. Hand it over and watch.'],
      ),
      2: call(
        ['lugnut lulu', 'Tell your sweeper nice following! Go home slow, gnome. Low and loud!'],
      ),
    },
  },
  bulletins: {
    'm05-sweepers-wages': [
      'The Carburettors held a night meet at the foot of the Skyway. A captain won a heat, a part arrived in time, and a sweeper watched.',
      'Side-Valve Salvage says its apron is "very clean this week". Witnesses report one broom, working slowly.',
    ],
  },
  plans: { 'm05-sweepers-wages': { suite: 'story', expect: 'pass' } },
};
