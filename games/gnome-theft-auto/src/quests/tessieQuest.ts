// The Tessie side quest (Wild World Epic 7): Driftwood's hunt for the giant turtle of Loch Moss. Unlocks after The Salvage Raid
// (SIDE_UNLOCKS in unlocks.ts; older saves keep a rolled beat, tessieUnlock.ts): its prereq is the TESSIE.unlockKey pseudo-entry in the quest save.
// The numbers live in config.ts TESSIE. The words (dialogue, objective text, endings) are issue 7E's.
import { TESSIE } from '../config';
import type { QuestDef } from './types';

export const TESSIE_QUEST: QuestDef = {
  id: TESSIE.questId,
  title: 'The Loch Moss Monster',
  giver: TESSIE.giver,
  prereq: TESSIE.unlockKey,
  rewardAcorns: 800,
  radioBulletin: TESSIE.questId,
  achievement: TESSIE.achievements.finish,
  // Scenes: real-world scripts in cutscene/scenes/side/tessie.ts (roadmap docs/roadmaps/gta-side-quest-cutscenes.md).
  cutscene: { kind: 'script', script: 'sq-tessie-intro' },
  beats: { 2: 'sq-tessie-eggs', 4: 'sq-tessie-shore' },
  objectives: [
    {
      kind: 'tessie-sightings',
      text: 'Follow the three sightings around the loch by boat',
      points: [...TESSIE.sightings],
      radius: TESSIE.sightingRadius,
      hint: 'Loch Moss',
    },
    {
      kind: 'tessie-buoys',
      text: 'Drop four sonar buoys before the HOA patrol boat spots you',
      points: [...TESSIE.buoys],
      radius: TESSIE.buoyRadius,
      spotRadius: TESSIE.spotRadius,
      hint: 'Loch Moss',
    },
    {
      kind: 'tessie-escort',
      text: 'Escort the egg raft to the island and ram the dredger off',
      route: [...TESSIE.escortRoute],
      nest: [TESSIE.nest.x, TESSIE.nest.z],
      dredgerAt: [...TESSIE.dredgerStart],
      hint: "Tessie's island",
    },
    {
      kind: 'tessie-ride',
      text: 'Climb aboard Tessie and ride her back to the dock',
      spawnAt: [...TESSIE.rideSpawn],
      to: [...TESSIE.rideTo],
      radius: TESSIE.rideRadius,
      hint: 'Loch Moss dock',
    },
    {
      kind: 'choice',
      text: 'Sell the photo, or keep her secret',
      optionA: {
        label: 'Sell the photo to the Tattler',
        at: [...TESSIE.tabloidAt],
        outro: 'sq-tessie-tabloid',
        endingText: 'The Tattler runs the photo on the front page. Nobody believes it. Driftwood sighs.',
        bonusAcorns: TESSIE.tabloidAcorns,
        achievement: TESSIE.achievements.tabloid,
      },
      optionB: {
        label: 'Keep her secret',
        at: [...TESSIE.secretAt],
        outro: 'sq-tessie-secret',
        endingText: 'Driftwood nods. Tessie rolls once in the shallows and is gone. He hands you a small shell pack from his raft.',
        achievement: TESSIE.achievements.secret,
      },
    },
  ],
  doneText: 'Tessie swims home, and Driftwood says he told you so.',
};
