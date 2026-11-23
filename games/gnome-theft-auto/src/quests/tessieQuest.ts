// The Tessie side quest (Wild World Epic 7): Driftwood's hunt for the giant turtle of Loch Moss. Unlocks after The Salvage Raid
// (SIDE_UNLOCKS in unlocks.ts; older saves keep a rolled beat, tessieUnlock.ts): its prereq is the TESSIE.unlockKey pseudo-entry in the quest save.
// The numbers live in config.ts TESSIE. The words (dialogue, objective text, endings) are issue 7E's.
import type { GnomeLook } from '@lawn/gnome';
import { TESSIE } from '../config';
import type { QuestDef } from './types';

const DRIFTWOOD_LOOK: Partial<GnomeLook> = { hat: 0x4f9d92, shirt: 0xd9c79e, beard: 0xe5e0d4 };

export const TESSIE_QUEST: QuestDef = {
  id: TESSIE.questId,
  title: 'The Loch Moss Monster',
  giver: TESSIE.giver,
  prereq: TESSIE.unlockKey,
  rewardAcorns: 800,
  radioBulletin: TESSIE.questId,
  achievement: TESSIE.achievements.finish,
  cutscene: {
    kind: 'dialogue',
    room: 'unmowed-hollow',
    lines: [
      { speaker: 'Driftwood', text: 'I told you about the lawn sharks. Nobody listened. Now listen about the loch.', look: DRIFTWOOD_LOOK, hz: 94 },
      { speaker: 'Driftwood', text: 'Something big lives in Loch Moss. I heard it singing through the hull of my raft all night, deep and slow, like a bell under the water.', look: DRIFTWOOD_LOOK, hz: 98 },
      { speaker: 'Driftwood', text: 'The HOA has a dredger out there now. They mean to drain the loch for a golf course. Nobody has asked what lives in it.', look: DRIFTWOOD_LOOK, hz: 102 },
      { speaker: 'Driftwood', text: 'I can\'t go out myself. My raft has one oar and a grudge.', look: DRIFTWOOD_LOOK, hz: 96 },
      { speaker: 'Driftwood', text: 'Take a boat out at dusk. Follow the ripples. Bring me proof.', look: DRIFTWOOD_LOOK, hz: 98 },
    ],
  },
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
        endingText: 'The Tattler runs the photo on the front page. Nobody believes it. Driftwood sighs.',
        bonusAcorns: TESSIE.tabloidAcorns,
        achievement: TESSIE.achievements.tabloid,
      },
      optionB: {
        label: 'Keep her secret',
        at: [...TESSIE.secretAt],
        endingText: 'Driftwood nods. Tessie rolls once in the shallows and is gone. He hands you a small shell pack from his raft.',
        achievement: TESSIE.achievements.secret,
      },
    },
  ],
  doneText: 'Tessie swims home, and Driftwood says he told you so.',
};
