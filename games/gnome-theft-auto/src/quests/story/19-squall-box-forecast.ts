// Story row 19 (docs/design/gnome-theft-auto/story-outline.md): The Squall-Box Forecast. Rooster Weatherby's three
// barometers have to leave the windmill before the porcelain front arrives: a barrow-buggy run over three fields with a
// damage limit, then the last needle settles on "A white hat at the diner" (the next row's meeting). Comedy only: no
// sincere beat. Scenes: cutscene/scenes/story/m19-squall-box-forecast.ts; stages: quests/stages/story/s19-*.ts.
import { brief, call, type StoryFile } from './kit';

/** Where the loaded barrow buggy waits at the windmill foot (x, z, yaw). */
const BUGGY_AT: [number, number, number] = [10, 394, -Math.PI / 2];
/** The last field: the barometer stands here, the gate and the reading are the same spot. */
const LAST_FIELD: [number, number] = [-22, 408];

export const STORY: StoryFile = {
  quests: [
    {
      id: 'm19-squall-box-forecast',
      title: 'The Squall-Box Forecast',
      giver: 'squall-box',
      prereq: 'ch2-sprinkler-gauntlet',
      chapter: 2,
      rewardAcorns: 250,
      radioBulletin: 'm19-squall-box-forecast',
      // A farm errand: the Hat Watch has no business in Rooster's fields.
      hoa: 'off',
      cutscene: { kind: 'script', script: 'm19-squall-box-forecast-intro' },
      outro: { kind: 'script', script: 'm19-squall-box-forecast-outro' },
      achievement: 'gta-fair-weather-friend',
      objectives: [
        {
          kind: 'checkpoints',
          text: "Drive Rooster's three barometers to three fields, one set down at each",
          points: [
            { at: [50, 365], radius: 6, label: 'East stubble field' },
            { at: [-45, 375], radius: 6, label: "Bramble's wheat" },
            { at: LAST_FIELD, radius: 6, label: 'The windmill field' },
          ],
          vehicle: { kind: 'barrow-buggy', at: BUGGY_AT },
          requireVehicle: 'barrow-buggy',
          maxDamage: 0.35,
          hint: 'Cloverfield fields',
        },
        {
          kind: 'inspect',
          text: 'Read the last barometer',
          verb: 'Read',
          points: [
            {
              at: LAST_FIELD,
              label: 'The last barometer',
              note: 'The needle swings past every mark and settles on: A WHITE HAT AT THE DINER.',
              prop: 'squall-box-barometer',
              radius: 3,
            },
          ],
          hint: 'The windmill field',
        },
      ],
      doneText: 'Rooster was right. Granny, on the phone: "Once a year, sugar. Mark the calendar."',
    },
  ],
  comms: {
    'm19-squall-box-forecast': {
      0: brief(
        ['rooster weatherby', 'THREE BAROMETERS! THREE FIELDS! THE PORCELAIN FRONT ARRIVES BEFORE DARK!'],
        ['rooster weatherby', 'SET ONE DOWN AT EACH FIELD. BOUNCE ONE AND I WILL KNOW. TWO HUNDRED FIFTY ACORNS.'],
        ['granny', 'Easy on the ruts, sugar. Those dials are older than my pie crust.'],
      ),
      1: call(['bramble', 'That is the last one down. Go and read the needle. Do not drop it.']),
    },
  },
  bulletins: {
    'm19-squall-box-forecast': [
      'Cloverfield reports three brass barometers crossing the stubble on a barrow buggy, driven with great care and one man shouting.',
      'Rooster Weatherby says a porcelain front is due by dark. The sky over Cloverfield, as of noon, was blue.',
    ],
  },
  plans: {
    'm19-squall-box-forecast': { suite: 'story', expect: 'pass' },
  },
  givers: {
    'squall-box': {
      id: 'squall-box',
      name: 'Squall-Box Windmill',
      label: "Hear Rooster's forecast",
      x: -7,
      z: 397,
      exit: { x: -9, z: 395, yaw: 1.3 },
      room: 'street',
      letter: 'R',
    },
  },
};
