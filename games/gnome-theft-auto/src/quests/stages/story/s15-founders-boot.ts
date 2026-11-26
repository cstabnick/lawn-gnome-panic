// Story row 15 (ch1-founders-boot, extended): the stages its scenes play on (new ones), and extra quest ids for existing
// stages' usedBy.
// - p1 Parade Permits: the Tattler's parade-week desk on the Kiln-Shield kerb, across the z = -60 road from the Amphitheater
//   (the Tattler Building's own block is Founders' Green now, so Hedda works the parade from the street), and the parade
//   office on the City Hall block, on the z = -120 road where the Boot float waits for Trim Day.
// - p2 Dress Rehearsal: outside the east hoarding of Even-Estates Plot 1 (E16 country/estates.ts EVEN_ESTATES[0]: hoarding
//   x -319..-271, z -144..-96). The float (radius 3.8) is wider than the 8 m gate, so the rehearsal runs round the outside.
// - The final's outro: the Amphitheater (turftonB.ts), Bodega & Sons, and the Glaze & Tax counter at the foot of Thorne Tower.
import { cam, car, mark, type Stage } from '../kit';

export const STAGES: readonly Stage[] = [
  {
    id: 'tattler-parade-desk',
    name: "The Tattler's parade desk, Kiln-Shield kerb",
    region: 'turfton',
    center: [-96, -49],
    radius: 10,
    facing: Math.PI,
    time: 'day',
    built: 'dressed',
    givers: [],
    usedBy: ['ch1-founders-boot-p1'],
    look: "A desk on the pavement under Kiln-Shield Plaza, a news kiosk, a printer and a red newspaper box; across the road the Amphitheater's front, where the tribunal banners go up.",
    sounds: 'A printer chattering, pages turning, traffic on the z = -60 road, a bailiff taping a banner across the way.',
    marks: [
      mark('hedda', [-96, -46.4], Math.PI, 'stand', 'behind the parade desk, pencil behind one ear, never quite stopping'),
      mark('player', [-96, -51.2], 0, 'stand', 'at the front of the desk, off the road'),
      mark('hoa-bailiff', [-93.5, -65.6], -Math.PI / 2, 'work', 'across the road, taping a TRIBUNAL banner to the Amphitheater front'),
    ],
    cameras: [
      cam('desk-wide', [-105, 2.6, -57], [-96, 1.2, -47], 'establishing: from the road onto the desk, the kiosk and the tower behind', 52),
      cam('across', [-99, 1.7, -44.5], [-93, 1.4, -66], "Hedda's view: across the road to the bailiff and the Amphitheater front", 40),
    ],
    walks: [
      { who: 'hedda', points: [[-98.2, -46.4], [-93.8, -46.4]], loop: false, speed: 1.0, pauseS: 2, activity: 'paces behind the desk reading a proof, never quite stopping' },
    ],
    vehicles: [],
    paths: [],
    set: [
      { prefab: 'office-desk', at: [-99.4, -48.2], yaw: Math.PI, solid: [0.8, 0.4, 0.8] },
      { prefab: 'printer', at: [-97.8, -47.9], yaw: Math.PI },
      { prefab: 'news-kiosk', at: [-102.5, -47], yaw: Math.PI, solid: [1, 1, 2.4] },
      { prefab: 'newspaper-box', at: [-91, -50.5], yaw: Math.PI, solid: [0.35, 0.3, 1] },
    ],
  },
  {
    id: 'parade-office',
    name: 'The parade office, behind City Hall',
    region: 'turfton',
    center: [14, -109],
    radius: 10,
    facing: Math.PI,
    time: 'day',
    built: 'dressed',
    usedBy: ['ch1-founders-boot-p1', 'ch1-founders-boot-p2'],
    look: "A cab-rank booth turned parade office, bunting on a pole, a duty desk, the Founder's Trim Day banner; the Boot float sleeps on the road beside it.",
    sounds: 'A kettle nobody switched off, bunting flapping, a Hat Watch clerk stamping forms next door.',
    marks: [
      mark('player', [8, -111.5], [16, -108], 'stand', 'steps off the road into the office yard'),
      mark('hoa-clerk', [20, -110.5], [12, -110], 'stand', 'a Hat Watch clerk on a break, back to the yard'),
    ],
    cameras: [
      cam('yard', [-2, 3.2, -116], [15, 1.2, -108], 'establishing: from the road onto the booth, the bunting and the duty desk'),
    ],
    walks: [],
    vehicles: [
      car('boot-float-depot', 'parked', 'boot-float', [2.5, -120], -Math.PI / 2, undefined, "where the Boot float waits for Trim Day (the final part spawns it here)"),
    ],
    paths: [],
    set: [
      { prefab: 'cab-rank-booth', at: [18, -107], yaw: Math.PI, solid: [1.1, 0.9, 2.4] },
      { prefab: 'street-banner-pole', at: [5, -112], yaw: Math.PI },
      { prefab: 'street-banner-pole', at: [26, -112], yaw: Math.PI },
    ],
  },
  {
    id: 'estates-plot-1-east',
    name: 'Even-Estates Plot 1, outside the east hoarding',
    region: 'mossy-wood',
    center: [-258, -112],
    radius: 16,
    facing: Math.PI / 2,
    time: 'night',
    built: 'dressed',
    usedBy: ['ch1-founders-boot-p2'],
    look: "The east hoarding at night, the crane painted \"Level Is Kind\" over it, two folding chairs and a lantern where the night watch sits watching nothing, the watch's golf cart.",
    sounds: 'Beige silence: no birds, no wind, a lantern ticking, a spirit level tapped on a post.',
    marks: [
      mark('chard', [-265.5, -110], [-262, -108], 'stand', 'lantern up against the hoarding, checking it is true'),
      mark('levelright-watch', [-262, -107.5], [-265.5, -110], 'stand', 'the night watch, a whistle on a string'),
      mark('levelright-watch', [-266, -101.5], [-262, -106], 'sit', 'on a folding chair by the lantern'),
      mark('player', [-251.5, -108.5], [-256, -112], 'stand', 'waits on the dirt for the float'),
    ],
    cameras: [
      cam('east-wide', [-243, 3.5, -101], [-262, 1.2, -112], 'establishing: the dirt, the hoarding, the crane against the stars'),
      cam('hoarding', [-261, 1.4, -116], [-265, 1.3, -108], 'along the hoarding onto Chard and the watch'),
    ],
    walks: [],
    vehicles: [
      car('watch-cart', 'parked', 'golf-cart', [-265, -97.5], 0, undefined, "the night watch's cart, lamp on the roof"),
      car('boot-float-rehearsal', 'pull-up', 'boot-float', [-256, -112], 0, undefined, 'the float stops here; the rehearsal starts here'),
    ],
    paths: [
      { id: 'float-to-estates', role: 'arrival', kind: 'boot-float', offRoad: true, points: [[-226, -117], [-246, -117], [-256, -113]], note: 'the float comes out of the dark from the city edge' },
      { id: 'watch-cart-chase', role: 'chase', kind: 'golf-cart', offRoad: true, points: [[-265, -97.5], [-262, -103], [-258, -104.5]], note: 'the watch cart lurches out after the float' },
    ],
    set: [
      { prefab: 'folding-chair', at: [-266, -101.5], yaw: Math.PI / 2 },
      { prefab: 'folding-chair', at: [-266, -104], yaw: Math.PI / 2 },
      { prefab: 'night-shift-lantern', at: [-267, -102.8], yaw: 0 },
    ],
  },
];

/** Existing stage id -> quest ids (this row's) to add to its usedBy. */
export const USES: Readonly<Record<string, readonly string[]>> = {
  'side-valve-bay': ['ch1-founders-boot-p1', 'ch1-founders-boot-p2'],
  'glaze-tax-office': ['ch1-founders-boot'],
  'bodega-front': ['ch1-founders-boot'],
};
