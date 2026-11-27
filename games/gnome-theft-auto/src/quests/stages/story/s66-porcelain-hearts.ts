// Story row 66 stages: Porcelain Hearts. One new place on the Tall House porch (the existing stage `tall-house-porch` is the
// refugees' evening porch; this one is its quiet corner, seen at dusk with nobody on it): Clara's hollow log south of the porch
// steps, the sealed door on the house wall with the HOA's new seal tape across it, and the boards where the old photograph
// stands. The tape is dressed into the world (so the player crosses it, not a cutscene prop); the photograph is the inspect
// objective's own prop. Clara never says "the Tall House": the scenes say "the porch".
import { cam, mark, type Stage } from '../kit';

const ROW = ['m66-porcelain-hearts'];

export const STAGES: readonly Stage[] = [
  {
    id: 'm66-porch-log',
    name: "Clara's hollow log and the sealed porch door",
    region: 'mossy-wood',
    center: [-546, 36],
    radius: 10,
    facing: Math.PI,
    time: 'dusk',
    built: 'dressed',
    usedBy: ROW,
    look: "A hollow log in the grass below the porch steps, a porcelain lantern unlit in a pale hand, the grey porch boards behind her, and across the sealed door in the house wall a line of the HOA's yellow-and-black seal tape, new and very straight.",
    sounds: 'Crickets starting up, a lantern chain ticking on its hook, tape stirring in the draught, a long quiet where a refuge usually argues.',
    marks: [
      mark('clara', [-545.5, 34.6], [-545.5, 28], 'stand', 'waits at the mouth of her hollow log with the lantern unlit, the porch behind her'),
      mark('player', [-545.5, 29.2], [-545.5, 34.6], 'stand', 'comes up the path from the road and stops short of the log'),
      mark('clara', [-549.4, 41.2], [-552.4, 41.2], 'stand', 'stops at the seal tape, one hand not quite touching it'),
      mark('player', [-549.4, 43.4], [-552.4, 41.2], 'stand', 'at the tape beside her, a hand on the first post'),
      mark('clara', [-547.2, 38.4], [-545.5, 34.6], 'stand', 'on the porch steps in the last light, the photograph in both hands'),
      mark('player', [-545.4, 37.6], [-547.2, 38.4], 'stand', 'on the grass below the steps, facing her'),
    ],
    cameras: [
      cam('wide', [-532, 5.5, 22], [-546, 2.0, 38], 'establishing: the log, the porch boards and the sealed door at dusk'),
      cam('tape', [-547, 1.0, 38.0], [-551.2, 0.9, 41.2], 'low on the seal tape across the door, the house wall behind'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [
      // The seal tape: three runs side by side across the sealed door, the strip along z (yaw pi/2), 1 m each.
      { prefab: 'site-hazard-tape', at: [-551, 39.9], yaw: Math.PI / 2, scale: 1 },
      { prefab: 'site-hazard-tape', at: [-551, 40.9], yaw: Math.PI / 2, scale: 1 },
      { prefab: 'site-hazard-tape', at: [-551, 41.9], yaw: Math.PI / 2, scale: 1 },
      { prefab: 'site-hazard-tape', at: [-551, 42.9], yaw: Math.PI / 2, scale: 1 },
      // The hollow log she lives in.
      { prefab: 'fallen-log', at: [-548.8, 33.4], yaw: Math.PI / 2, scale: 1.4 },
    ],
  },
];

/** Existing stage id -> this row's quest ids: the giver `strangers-porch` stands on the evening porch. */
export const USES: Record<string, string[]> = { 'tall-house-porch': ROW };
