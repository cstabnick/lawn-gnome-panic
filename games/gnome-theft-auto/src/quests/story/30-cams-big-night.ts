// Story row 30 "Cam's Big Night" (docs/design/gnome-theft-auto/story-outline.md): Cam has saved for one Speedway entry and
// asks the player to be his pit crew. The player picks him up at Side-Valve (broom in his hand), drives the support stint
// of a relay against the Carburettors, watches him come in last, and drives him home, where a man in a beige vest hands
// him a racing-charter envelope. Scenes: cutscene/scenes/story/m30-cams-big-night.ts.
//
// The race: one lap of the Speedway against Lugnut Lulu and Two-Ton Teasel. The support stint is the player's leg and the
// story's loss is Cam's, shown in the mid scene, so `mustPlace` is 3 of 3 (any finish counts): the player can come last
// and the quest goes on. Cam does not hold the player to a place; Lulu does not need to.
// The mid scene is the race's own result scene: the Speedway runner plays `race-<raceId>-podium` when the race is done
// (quests/objectivesRace.ts), so the scene file registers 'm30-cams-big-night-mid' under that id too, and there is no
// separate visit step.
import type { QuestDef, RaceRival } from '../types';
import { brief, call, type StoryFile } from './kit';

/** Cam's cot is in the storeroom; he waits on the apron where he sweeps, and is dropped at the storeroom door. */
const CAM_APRON: [number, number] = [-155, 67];
const CAM_STOREROOM: [number, number] = [-153.4, 72];
/** The pit lane by the garages (the Speedway pit stage). */
const PIT_DROP: [number, number] = [756, -386];

const LULU: RaceRival = {
  name: 'Lugnut Lulu', look: { hat: 0xff6a00, shirt: 0x1a1a1a, beard: null, dress: true }, tint: 0x8e44ad,
  pace: 0.97, grip: 1.0, line: 2.5, aggression: 0.5,
  taunts: ['Carburettors run this town. Low and loud!', 'Where is the sweeper? Is he sweeping the line?'],
};
const TEASEL: RaceRival = {
  name: 'Two-Ton Teasel', look: { hat: 0xff6a00, shirt: 0x3a3a3a, beard: 0x2a2a2a }, tint: 0xd8342c,
  pace: 0.92, grip: 0.9, line: -2, aggression: 0.6,
  taunts: ['Two tons of attitude, coming through.', 'I do not brake. I negotiate.'],
};

const CAMS_BIG_NIGHT: QuestDef = {
  id: 'm30-cams-big-night',
  title: "Cam's Big Night",
  giver: 'side-valve',
  prereq: 'm29-the-kicked-board',
  chapter: 2,
  rewardAcorns: 350,
  radioBulletin: 'm30-cams-big-night',
  cutscene: { kind: 'script', script: 'm30-cams-big-night-intro' },
  outro: { kind: 'script', script: 'm30-cams-big-night-outro' },
  // A pit-crew favour, not a heist: no Hat Watch on the rides there and back or on the track.
  hoa: 'off',
  objectives: [
    {
      kind: 'passenger',
      text: 'Pick up Cam at Side-Valve Salvage and drive him to the Speedway pits',
      who: 'turncoat cam',
      name: 'Cam',
      pickup: CAM_APRON,
      dropAt: PIT_DROP,
      radius: 14,
      hint: 'Cam, at Side-Valve Salvage',
      vehicle: { kind: 'ride-on', at: [-146, 68, Math.PI] },
      maxDamage: 0.6,
      banter: [
        'Cam: Entry fee was six weeks of tips.',
        'Cam: Lulu races there. She will not know my name.',
        'Cam: The broom is for luck. Do not ask.',
      ],
      onBoard: 'Cam climbs on behind you and holds the broom upright, like a flag.',
      onDrop: 'Cam looks up at the floodlights for a while and says nothing.',
    },
    {
      kind: 'race',
      text: 'Run the support stint for Cam against the Carburettors',
      raceId: 'cams-big-night',
      vehicle: 'ride-on',
      laps: 1,
      rivals: [LULU, TEASEL],
      mustPlace: 3,
      hint: 'Lost & Found Speedway grid',
      tint: 0xf4f4f8,
      night: true,
    },
    {
      kind: 'passenger',
      text: 'Drive Cam home to Side-Valve Salvage',
      who: 'turncoat cam',
      name: 'Cam',
      pickup: [738, -367],
      dropAt: CAM_STOREROOM,
      radius: 12,
      hint: 'Cam, at the finish line',
      vehicle: { kind: 'ride-on', at: [722, -384, Math.PI / 2] },
      maxDamage: 0.6,
      banter: [
        'Cam: Last. Not by much. By a lot.',
        'Cam: Somebody has to be last. Somebody has to sweep.',
        'Cam: Do not tell Tansy about the line.',
      ],
      onBoard: 'Cam sits down with the broom across his knees, and does not look back at the track.',
      onDrop: 'Cam stands at the storeroom door. The bay lamp makes him very small.',
    },
  ],
  doneText: 'Last place, and a ride home. Cam took an envelope he did not mention, and you did not ask. Three hundred and fifty acorns.',
};

export const STORY: StoryFile = {
  quests: [CAMS_BIG_NIGHT],
  comms: {
    'm30-cams-big-night': {
      0: brief(
        ['turncoat cam', 'Entry slip for the Lost and Found Speedway. One race. I saved for it.'],
        ['turncoat cam', 'Be my pit crew. Pick me up at Side-Valve and run the support leg.'],
        ['turncoat cam', 'Do it and there are three hundred fifty acorns, and an entry for you.'],
      ),
      1: call(['tansy', 'Cam is racing. Good for him. Do not let him bet the bench.']),
      2: call(['turncoat cam', 'Last. Flat last. Thanks for the stint. Home, please.']),
    },
  },
  plans: { 'm30-cams-big-night': { suite: 'story', expect: 'pass' } },
  bulletins: {
    'm30-cams-big-night': [
      'The Lost and Found Speedway reports a new record for the slowest relay leg on file. The Carburettors have asked for it to be framed.',
      'One relay driver was seen holding a push-broom upright like a pennant the whole way round. Stewards are still deciding what class he ran in.',
    ],
  },
};
