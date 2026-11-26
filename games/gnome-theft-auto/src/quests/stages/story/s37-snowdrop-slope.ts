// Story row 37 (m37-snowdrop-slope): the stages its scenes play on. Three places: Thermos Theo's bend on the north highway
// (the giver `theo-bend`; the barrel and woodpile of the theo-camp stage stand just west of these marks), the foot of the
// Bootlace Tow at Snowdrop Slope (E12: the rope-tow road ends at winter/types.ts TOW.base; the ground rises north and
// east, and the two salt-plows crest the rise south-east of the foot), and the Woolly Sock Lodge door (LODGE faces east).
import { cam, car, mark, type Stage } from '../kit';

export const STAGES: readonly Stage[] = [
  {
    id: 'theo-bend-dawn',
    name: "Thermos Theo's bend at first light",
    region: 'frostbite-fells',
    center: [46, -346],
    radius: 10,
    facing: Math.PI,
    time: 'dawn',
    built: 'dressed',
    givers: ['theo-bend'],
    usedBy: ['m37-snowdrop-slope'],
    look: 'The pine-cone barrel with a pot steaming on its lid, the woodpile under its tarp, three tin mugs on the stool, frost on the stubble and the first pale light coming over the north highway.',
    sounds: 'Tea pouring, a pot lid ticking, the long hush of snow, one far engine that is not a friend.',
    marks: [
      mark('theo', [46, -344.5], [42, -349.5], 'stand', 'at the barrel with a ladle and the thermos, never in a hurry'),
      mark('player', [42, -349.5], [46, -344.5], 'stand', 'steps up to the fire with both hands out'),
      mark('pip', [49.5, -349], [46, -344.5], 'stand', 'bouncing on his heels, the new clay arm held out like a trophy'),
    ],
    cameras: [
      cam('wide', [22, 7, -322], [45, 1.2, -345], 'establishing: the barrel, the steam and three gnomes in the blue light'),
      cam('barrel', [43.6, 1.6, -340.4], [46, 1.4, -344.2], 'close on the pot and the ladle: the steam is the first thing you see'),
      cam('road', [58, 1.7, -352], [30, 1.8, -330], 'along the highway to the north-west, where the trouble is coming from'),
    ],
    walks: [],
    vehicles: [
      car('bend-pull-up', 'pull-up', 'lowrider', [60, -320], Math.PI / 2 + 0.3, undefined, 'a visitor stops on the ring road by the camp'),
    ],
    paths: [],
    set: [],
  },
  {
    id: 'bootlace-tow-foot',
    name: 'The foot of the Bootlace Tow, Snowdrop Slope',
    region: 'north-highlands',
    center: [-304, -1022],
    radius: 14,
    facing: Math.PI / 2,
    time: 'day',
    built: 'existing',
    usedBy: ['m37-snowdrop-slope'],
    look: 'The rope-tow road ending at the first pylon: handles clacking on the loop, striped skis in the snow bank, the slope climbing away north and a pale rise to the south-east where the road comes in.',
    sounds: 'Cotton reels clacking on the Bootlace Tow, wind across the snow, a diesel that is a long way off and getting nearer.',
    marks: [
      mark('player', [-300, -1018], [-258, -990], 'stand', 'stands by the tow base, looking back down the road'),
      mark('pip', [-297.5, -1023.5], [-258, -990], 'stand', 'on tiptoe, one mitten shading his eyes'),
    ],
    cameras: [
      cam('wide', [-326, 6, -1040], [-262, 3, -984], 'establishing: the tow base in the foreground and the rise where the road comes in'),
      cam('pylon', [-310, 1.5, -1012], [-296, 1.6, -1022], 'low past the first pylon onto the two of them'),
      cam('ridge', [-280, 1.5, -1012], [-248, 3, -976], 'from the tow base along the rise, where the plows come over'),
    ],
    walks: [],
    vehicles: [
      car('plow-1', 'pull-up', 'hoa-van', [-246, -976], -2.3, undefined, 'an HOA salt-plow cresting the rise, blade down'),
      car('plow-2', 'pull-up', 'hoa-van', [-238, -986], -2.2, undefined, 'a second plow a length behind the first'),
    ],
    paths: [],
    set: [],
  },
  {
    id: 'woolly-sock-door',
    name: 'The Woolly Sock Lodge door, after the run',
    region: 'north-highlands',
    center: [-434, -1020],
    radius: 10,
    facing: Math.PI / 2,
    time: 'day',
    built: 'existing',
    usedBy: ['m37-snowdrop-slope'],
    look: 'The lodge front door in snow glare: a sock rack on the wall, a woolly sock on every peg, a ski rack and a cocoa hatch steaming beside it, a polar bear asleep on the porch bench.',
    sounds: 'Cocoa on the boil, wind chimes made of ski poles, a polar bear snoring, boots stamped three times.',
    marks: [
      mark('gentian', [-439.5, -1020.5], [-431, -1019.5], 'stand', 'on the threshold with her poles planted like a flag, counting boots'),
      mark('player', [-431, -1019.5], [-439.5, -1020.5], 'stand', 'steps onto the porch, snow to the knees'),
      mark('pip', [-432.5, -1022.8], [-439.5, -1020.5], 'stand', 'right behind, clutching his skis like a bouquet'),
    ],
    cameras: [
      cam('wide', [-416, 3.4, -1006], [-439, 1.6, -1020], 'establishing: the lodge front, the racks and the porch in the glare'),
      cam('door', [-433.4, 1.5, -1016.4], [-440, 1.5, -1020.4], 'from the porch onto Gentian in the doorway'),
      cam('pegs', [-433, 1.5, -1025], [-441, 1.7, -1024], 'along the wall: a woolly sock on every peg'),
    ],
    walks: [],
    vehicles: [],
    paths: [],
    set: [],
  },
];

/** Existing stage id -> this row's quest ids. */
export const USES: Record<string, string[]> = {};
