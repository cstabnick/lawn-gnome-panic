// Story row 67 (docs/design/gnome-theft-auto/story-outline.md): Emergency Assessment. Vesper has declared an HOA emergency and seized City Hall;
// Juniper is held. Hedda calls it from her street desk at the Tattler (R-229: the desk at Founders' Green north gate). The player
// drives to City Hall's side-door yard, where Reginald opens the service door with a caliper in his hand and says he will not be
// here; cracks the HOA enforcers in the yard; Juniper comes out the side door (the outro, played as the pick-up starts) and walks
// out without her brother, who stays behind to "measure something"; the player drives her to Founders' Green (her terrace is watched).
// What I chose: City Hall has no walk-in interior, so the outline's fallback is used (the side-door yard, a scene and a short crack-
// and-run); the outline's checkpoints leg is the passenger drive the lead asked for. Hedda's "filed" gag is the only gag.
// Scenes: cutscene/scenes/story/m67-emergency-assessment.ts. Stages: quests/stages/story/s67-emergency-assessment.ts.
import type { GnomeLook } from '@lawn/gnome';
import type { GiverDef, QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const ID = 'm67-emergency-assessment';

const HOA_LOOK: Partial<GnomeLook> = { hat: 0x18181e, shirt: 0xc9b99b };

/** The Tattler's desk in the Founders' Green north gate: Hedda gives the job by call from here (R-229). */
const DESK_GIVER: GiverDef = {
  id: 'tattler-desk',
  name: "Hedda Galley (the Tattler's desk)",
  label: 'Talk to Hedda Galley',
  x: -90,
  z: 4.7,
  exit: { x: -90, z: 3.2, yaw: 0 },
  room: 'street',
  letter: 'H',
};

/** The side-door yard on City Hall's west wall: the service door is in the wall at x = 10. */
const YARD: [number, number] = [3, -87];
const DOOR_PICKUP: [number, number] = [4.5, -88.4];
/** Founders' Green north gate, in front of the Tattler's desk. */
const GREEN_GATE: [number, number] = [-90, 4.2];

const QUEST: QuestDef = {
  id: ID,
  title: 'Emergency Assessment',
  giver: 'tattler-desk',
  prereq: 'm66-porcelain-hearts',
  chapter: 4,
  rewardAcorns: 500,
  radioBulletin: ID,
  // The drive in and the drive out are gentle; only the yard is rough.
  hoaSteps: { 0: 'off', 2: 'off' },
  cutscene: { kind: 'script', script: 'm67-emergency-assessment-intro' },
  // Juniper walks out of the side door as the pick-up starts: that is the outline's outro (Reginald, behind the door).
  beats: { 2: 'm67-emergency-assessment-outro' },
  objectives: [
    {
      kind: 'visit',
      text: "Drive to the side-door yard on City Hall's west wall",
      at: YARD,
      radius: 6,
      hint: "The lane west of City Hall, off the z = -60 road, downtown",
      scene: 'm67-emergency-assessment-mid',
    },
    {
      kind: 'crack',
      text: 'Crack the HOA enforcers in the side-door yard',
      targets: [
        { id: 'assess-enforcer-1', name: 'HOA Enforcer Gusset', near: [2.5, -83.5], hint: 'City Hall side-door yard', look: HOA_LOOK },
        { id: 'assess-enforcer-2', name: 'HOA Enforcer Lath', near: [-1.5, -92], hint: 'City Hall side-door yard', look: HOA_LOOK },
        { id: 'assess-enforcer-3', name: 'HOA Enforcer Rivet', near: [6, -94.5], hint: 'City Hall side-door yard', look: HOA_LOOK },
      ],
    },
    {
      kind: 'passenger',
      text: "Take Juniper from the side door to Founders' Green",
      who: 'juniper',
      name: 'Juniper',
      pickup: DOOR_PICKUP,
      dropAt: GREEN_GATE,
      radius: 8,
      hint: "Founders' Green north gate, the Tattler's desk: her terrace is watched",
      vehicle: { kind: 'ride-on', at: [0.5, -92, Math.PI / 2] },
      maxDamage: 0.5,
      banter: [
        'Juniper: "Reginald stayed to measure something. I did not ask what."',
        'Juniper: "The counter-order is signed and folded. It is only paper. It is all I have ever had."',
        'Juniper: "Do not speak of him until we are past the Green."',
      ],
      onBoard: 'Juniper: "The Green. My terrace is watched. Drive."',
      onDrop: 'Hedda: "Filed. Front page. Spelled correctly."',
    },
  ],
  doneText: "Juniper is out of City Hall, and rejoins the coalition. Her brother stayed behind, to measure something. The Tattler has it spelled correctly.",
};

export const STORY: StoryFile = {
  quests: [QUEST],
  comms: {
    [ID]: {
      0: brief(
        ['hedda', 'Previously: Countess relents. Mayor signs. Now: emergency.'],
        ['hedda', 'HOA emergency. City Hall seized. Juniper held. Side door, west wall. Reginald opens.'],
        ['hedda', 'Five hundred acorns. Front page, if you live. Drive.'],
      ),
      1: call(['reginald', 'The service door is open. I will not be here. Three enforcers in the yard.']),
      2: call(['juniper', 'This way. Quickly. Do not wait for my brother.']),
    },
  },
  givers: { 'tattler-desk': DESK_GIVER },
  bulletins: {
    [ID]: [
      'Turfton FM: the Association has declared an emergency assessment of City Hall, effective immediately, pending a small fee. A councilwoman is said to be assessing it from inside.',
      'The Turfton Tattler goes to press with a headline already spelled correctly. Its editor says she checked it twice, and that it was a long afternoon.',
    ],
  },
  plans: {
    [ID]: { suite: 'story', expect: 'pass' },
  },
};
