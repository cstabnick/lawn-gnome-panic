// Story row 69 (docs/design/gnome-theft-auto/story-outline.md): The Combine Wakes. Dawn, the longest day. Ash-Shovel Ernie rings from the
// Compost Heap: the furnace is out, the Grand Combine is rolling, and the Even Line it follows runs straight through Chard
// Levelright's building site. The player drives out to Even-Estates Plot 1 (Chard realises, flatly, that he built forty beige houses for
// nobody), takes the Levelright work bus with the crews on it to Founders' Green (L58: the evacuees have no individual home), then
// sweeps the meridian crossings clear of fringe traffic in a Ride-On (a timed run, the tension) to Hyssop's crossing, where she holds
// up the lanes with her old stop-sign lollipop. The Combine itself is only ever in the scenes (the Heap's headlights in the intro, the
// turn onto the meridian in the outro). Tension 9; one gag a scene, and it is Hyssop's.
// Fallbacks used: the outline's "work bus of workers and fringe residents" is a Snail-Coach (the game's bus; one passenger seat is not a
// limit for steal-deliver), and "Hyssop holds up traffic" is the third checkpoint of a timed run plus the outro, not a live NPC.
// Scenes: cutscene/scenes/story/m69-the-combine-wakes.ts. Stages: quests/stages/story/s69-the-combine-wakes.ts.
import type { QuestDef } from '../types';
import { brief, call, type StoryFile } from './kit';

const ID = 'm69-the-combine-wakes';

/** The gate gap of Even-Estates Plot 1, on the west fringe (E16 EVEN_ESTATES[0]: gate gap x -320, z -124..-116). */
const SITE_GATE: [number, number] = [-326, -120];
/** The kerb south-west of the gate gap (the sign board stands north of it), where Levelright's work bus waits. */
const BUS_AT: [number, number, number] = [-335, -128, Math.PI];
/** Founders' Green, the south corner of the Gnorwin skate block (park id gnorwin-skate): the evacuees' camp, off the Combine's line. */
const FOUNDERS_GREEN: [number, number] = [-30, 62];
/** Where the Ride-On waits at the Green for the sweep. */
const SWEEP_RIDE: [number, number, number] = [-24, 64, 0];
/** The verge at Hyssop's crossing: the z = 0 road at the meridian. */
const VERGE: [number, number] = [-12, 3];

const QUEST: QuestDef = {
  id: ID,
  title: 'The Combine Wakes',
  giver: 'compost-heap',
  prereq: 'm68-lights-out',
  chapter: 4,
  rewardAcorns: 400,
  radioBulletin: ID,
  achievement: 'gta-lollipop-lady',
  // The danger is the machine, not the Association: nobody is chasing a bus full of builders.
  hoa: 'off',
  cutscene: { kind: 'script', script: 'm69-the-combine-wakes-intro' },
  outro: { kind: 'script', script: 'm69-the-combine-wakes-outro' },
  objectives: [
    {
      kind: 'visit',
      text: "Drive to Chard's building site at Even-Estates, on the west fringe, and get his crews out",
      at: SITE_GATE,
      radius: 10,
      hint: 'Even-Estates Plot 1, west of the Compost Heap on the fringe',
      scene: 'm69-the-combine-wakes-mid',
    },
    {
      kind: 'steal-deliver',
      text: "Take Levelright's work bus, crews aboard, to Founders' Green, clear of the Combine's line",
      vehicleKind: 'snail-coach',
      spawnAt: BUS_AT,
      dropAt: FOUNDERS_GREEN,
      radius: 12,
      hint: "Founders' Green, downtown: the skate-bowl corner, south of the z = 60 road",
      maxDamage: 0.6,
      banter: [
        'Foreman Chard: "Left at the junction. Level road. Do not speed on a level road."',
        'Builder: "Is that rumble the bus? It is not the bus."',
        'Builder: "My caravan was on the line. My kettle was in the caravan."',
        'Foreman Chard: "Nobody look back. Look at the road. The road is level."',
      ],
    },
    {
      kind: 'checkpoints',
      text: "Sweep the meridian's crossings clear of fringe traffic, north to Hyssop's crossing, before the Combine turns on",
      points: [
        { at: [2.5, 48], radius: 7, label: 'South crossing, lane clear' },
        { at: [2.5, 26], radius: 7, label: 'Middle crossing, lane clear' },
        { at: [2.5, 6], radius: 7, label: "Hyssop's crossing" },
      ],
      seconds: 45,
      vehicle: { kind: 'ride-on', at: SWEEP_RIDE },
      requireVehicle: 'ride-on',
      maxDamage: 0.8,
      hint: "Up the x = 0 road from the Green: three crossings, the last is Hyssop's",
    },
    {
      kind: 'visit',
      text: 'Stand on the verge at the crossing and watch the lanes hold',
      at: VERGE,
      radius: 8,
      hint: "The verge at Hyssop's crossing, where the z = 0 road meets the meridian",
    },
  ],
  doneText: 'The crews are at Founders\' Green, the lanes held for one second, and the Grand Combine has turned onto the meridian. It is the longest day.',
};

export const STORY: StoryFile = {
  quests: [QUEST],
  comms: {
    [ID]: {
      0: brief(
        ['ernie', 'Previously: one last night at home. Dawn, now. Furnace out. ...Out.'],
        ['ernie', 'The Combine is rolling. Its line runs through Chard\'s Even-Estates. Get his crews out.'],
        ['ernie', 'Bus at the gate. Four hundred acorns. Go. Go on.'],
      ),
      1: call(['chard', 'I built those houses for nobody. Get the crews on the bus.']),
      2: call(['hyssop', 'I am holding the crossing? For the record, the lanes are mine?']),
      3: call(['ernie', 'It is turning onto the meridian. ...Meridian. Watch it from the verge.']),
    },
  },
  bulletins: {
    [ID]: [
      'Turfton FM: a long, low noise from the west fringe this morning. The Association says it is "scheduled maintenance".',
      'Levelright Construction reports its crews on the move. A foreman declined to say where, and checked the level of the road.',
    ],
  },
  plans: {
    [ID]: { suite: 'story', expect: 'pass' },
  },
};
