// Story row 19: The Squall-Box Forecast (Rooster Weatherby, three barometers, one white hat). Comedy only, no sincere
// beat: Rooster is loud and slightly right. Intro at noon with a sky that has nothing in it, outro at dusk when the last
// needle settles. Notes: docs/design/gnome-theft-auto/direction/scenes/m19-squall-box-forecast-{intro,outro}.md.
import type { SceneScript, ScriptProp, Vec2 } from '../../script';
import { beat, coverage, cut, reaction, shot } from '../../direct';
import { markOf, rideOf, spot, up } from './kit';

const YARD = 'squall-box-yard';
const FIELD = 'squall-box-field';

const ROOSTER = markOf(YARD, 'rooster');
const BRAMBLE = markOf(YARD, 'bramble');
const PLAYER = markOf(YARD, 'player');

const FIELD_PLAYER = markOf(FIELD, 'player');
const FIELD_BRAMBLE = markOf(FIELD, 'bramble');
const FIELD_ROOSTER = markOf(FIELD, 'rooster');
/** Where the last barometer stands (the quest's last gate and reading point). */
const LAST_BAROMETER: Vec2 = [-22, 408];
/** The highway past the field, east to west, for the pearl Lowrider that nobody is driving (cloverfield.ts highway). */
const HIGHWAY_PASS: Vec2[] = [[62, 452], [44, 432], [26, 412], [10, 392], [-10, 370], [-24, 346], [-40, 322]];

/** Rooster and Bramble at the yard share one side of the line to the player; the three barometers stand in a row. */
const ROOSTER_P = coverage('rooster', 'player', 1);
const BRAMBLE_P = coverage('bramble', 'player', 1);
const BRAMBLE_I = coverage('bramble', 'player', -1);

const BAROMETERS: ScriptProp[] = [-5, -3, -1].map((x, i) => ({
  id: `barometer-${i + 1}`,
  prefab: 'squall-box-barometer',
  at: [x, 392] as Vec2,
  size: 0.9,
  by: 'h' as const,
}));

/** Intro, noon: Rooster at the windmill foot with his tin funnel, a sky with nothing in it, a thunderclap that is a truck. */
export const M19_INTRO: SceneScript = {
  id: 'm19-squall-box-forecast-intro',
  stage: { kind: 'world' },
  sky: 'noon',
  title: 'The Squall-Box Forecast',
  music: 'warm',
  ambience: 'wind',
  radio: 0.3,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m19-squall-box-forecast-intro.md', kind: 'intro' },
  actors: [
    { id: 'player', player: true, held: null, at: PLAYER.at, yaw: PLAYER.yaw },
    { id: 'rooster', preset: 'rooster weatherby', held: null, at: ROOSTER.at, yaw: ROOSTER.yaw },
    { id: 'bramble', preset: 'bramble', held: null, at: BRAMBLE.at, yaw: BRAMBLE.yaw },
  ],
  props: BAROMETERS,
  steps: [
    // Hook: Rooster, low, the windmill behind him, the prophecy first.
    { do: 'sfx', id: 'flutter', at: 'rooster', gain: 0.5, async: true },
    cut(shot('rooster', 'mcu', { height: 'low' })),
    { do: 'gesture', who: 'rooster', name: 'handsUp', s: 1.6, async: true },
    { do: 'say', who: 'rooster', text: 'THE BAROMETER IS DROPPING! THE BAROMETER IS DROPPING!' },
    // The card, after his first line, on the same mcu.
    { do: 'intro', who: 'rooster' },
    // The callback and the straight man: the sky has nothing in it.
    cut(ROOSTER_P.single('rooster', 'ms', { height: 'low' })),
    { do: 'say', who: 'rooster', text: 'ROOSTER WEATHERBY! I SHOUTED AT YOU AT THE GAUNTLET. I WAS RIGHT THEN TOO!' },
    cut(ROOSTER_P.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'It is noon. The sky is empty.' },
    cut(spot(YARD, 'sky')),
    { do: 'sfx', id: 'flutter', gain: 0.4, async: true },
    { do: 'wait', s: 1.6 },
    // Bramble's wet finger: the field's own forecast.
    cut(BRAMBLE_I.single('bramble', 'mcu')),
    { do: 'gesture', who: 'bramble', name: 'point', s: 1.2, async: true },
    { do: 'say', who: 'bramble', text: 'Finger says dry, boss.' },
    cut(ROOSTER_P.single('rooster', 'mcu', { height: 'low' })),
    { do: 'say', who: 'rooster', text: 'FINGERS ARE CHILDREN! THREE BAROMETERS! THREE FIELDS! THE PORCELAIN FRONT COMES BY DARK!' },
    // The three dials, all on FAIR: an insert while a sprinkler hisses on, which Rooster takes as proof.
    cut(spot(YARD, 'barometers')),
    { do: 'sfx', id: 'squirt', at: up(-2, 404, 0.4), gain: 0.6, async: true },
    { do: 'wait', s: 1.8 },
    cut(ROOSTER_P.single('rooster', 'ms')),
    { do: 'gesture', who: 'rooster', name: 'point', s: 1.2, async: true },
    { do: 'say', who: 'rooster', text: 'SEE?! THE SPRINKLERS KNOW!' },
    cut(BRAMBLE_I.single('bramble', 'mcu')),
    { do: 'say', who: 'bramble', text: 'That is the sprinkler timer.' },
    // The turn: the job, in his voice. One place name.
    cut(ROOSTER_P.single('rooster', 'mcu', { height: 'low' })),
    { do: 'say', who: 'rooster', text: 'THE BUGGY IS LOADED. ONE DOWN IN EACH FIELD. DO NOT BOUNCE THEM!' },
    cut(ROOSTER_P.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Which fields?' },
    cut(ROOSTER_P.single('rooster', 'mcu', { height: 'low' })),
    { do: 'say', who: 'rooster', text: 'ALL OF CLOVERFIELD! THE DIALS WILL TELL YOU! OFF!' },
    // The button: a far thunder under a clear sky. Bramble: a truck. Rooster does not blink.
    { do: 'sfx', id: 'thunder', gain: 0.4, async: true },
    cut(shot('player', 'mcu')),
    { do: 'gesture', who: 'player', name: 'think', s: 1.2, async: true },
    beat('pause'),
    cut(BRAMBLE_I.single('bramble', 'mcu')),
    { do: 'say', who: 'bramble', text: 'That was a truck.' },
    cut(ROOSTER_P.single('rooster', 'mcu', { height: 'low' })),
    { do: 'say', who: 'rooster', text: '...WITH A CHANCE OF PORCELAIN.' },
  ],
};

/** Outro, dusk: the last needle settles on the diner; Rooster is smug across the field; a pearl Lowrider passes with nobody in it. */
export const M19_OUTRO: SceneScript = {
  id: 'm19-squall-box-forecast-outro',
  stage: { kind: 'world' },
  sky: 'golden',
  music: 'turfton-dusk',
  ambience: 'wind',
  radio: 0.3,
  direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/m19-squall-box-forecast-outro.md', kind: 'outro' },
  actors: [
    { id: 'player', player: true, held: null, at: FIELD_PLAYER.at, yaw: FIELD_PLAYER.yaw },
    { id: 'bramble', preset: 'bramble', held: null, at: FIELD_BRAMBLE.at, yaw: FIELD_BRAMBLE.yaw },
    { id: 'rooster', preset: 'rooster weatherby', held: null, at: FIELD_ROOSTER.at, yaw: FIELD_ROOSTER.yaw },
  ],
  vehicles: [
    // The buggy stays at the windmill: the quest's reward.
    { id: 'buggy', kind: 'barrow-buggy', at: [8, 396], yaw: -Math.PI / 2, keep: true },
    // Vesper's own pearl Lowrider, with nobody visibly driving it (characters.md: "nobody is driving").
    { id: 'pearl', ...rideOf('vesper'), at: HIGHWAY_PASS[0], yaw: Math.atan2(HIGHWAY_PASS[1][0] - HIGHWAY_PASS[0][0], HIGHWAY_PASS[1][1] - HIGHWAY_PASS[0][1]), hidden: true, headlights: true },
  ],
  props: [{ id: 'last-barometer', prefab: 'squall-box-barometer', at: LAST_BAROMETER, size: 0.9, by: 'h' }],
  steps: [
    // Hook: the dial, close, the needle past every mark and settling. A reveal sting, then the reading.
    { do: 'sfx', id: 'tap', at: 'last-barometer', gain: 0.5, async: true },
    cut(spot(FIELD, 'dial')),
    { do: 'stinger', id: 'mystery' },
    { do: 'wait', s: 1.8 },
    cut(BRAMBLE_P.single('bramble', 'mcu')),
    { do: 'say', who: 'bramble', text: 'White hat. At the diner.' },
    ...reaction('player', { toward: 'bramble', gesture: 'think', hold: 'pause' }),
    cut(BRAMBLE_P.single('player', 'mcu')),
    { do: 'say', who: 'player', text: 'Whose hat?' },
    // Rooster, across the whole field, smug.
    cut(spot(FIELD, 'wide')),
    { do: 'wait', s: 1.2 },
    cut(shot('rooster', 'ms', { toward: 'player' })),
    { do: 'sfx', id: 'flutter', at: 'rooster', gain: 0.5, async: true },
    { do: 'gesture', who: 'rooster', name: 'cheer', s: 1.6, async: true },
    { do: 'say', who: 'rooster', text: 'I DO NOT DO NAMES! I DO WEATHER! WRITE IT DOWN!' },
    cut(BRAMBLE_P.single('bramble', 'mcu')),
    { do: 'say', who: 'bramble', text: 'Huh. Do not tell him.' },
    // The turn: the highway, and a pearl Lowrider that nobody seems to be driving.
    cut(spot(FIELD, 'highway')),
    { do: 'spawn', id: 'pearl' },
    { do: 'sfx', id: 'engine-rev', at: 'pearl', gain: 0.3, async: true },
    { do: 'drive', vehicle: 'pearl', path: HIGHWAY_PASS, speed: 22, arrive: false, async: true },
    { do: 'wait', s: 3.2 },
    cut(shot('rooster', 'mcu', { toward: 'player', height: 'low' })),
    { do: 'say', who: 'rooster', text: 'SEE?! ...ONLY A CHANCE OF PORCELAIN.' },
    // Button: Bramble, at last, has nothing to add.
    cut(BRAMBLE_P.single('bramble', 'mcu')),
    beat('pause'),
  ],
};

export const SCENES: Record<string, SceneScript> = {
  'm19-squall-box-forecast-intro': M19_INTRO,
  'm19-squall-box-forecast-outro': M19_OUTRO,
};
