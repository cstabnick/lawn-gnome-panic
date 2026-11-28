// Gnome Theft Auto, Saltbucket Boardwalk's fair (FX11): the promenade's small rides, booths and kit.
import type { PrefabDef, Part } from '../types';

const r3 = (n: number): number => Math.round(n * 1000) / 1000;
const rad = (deg: number): number => (deg * Math.PI) / 180;

// Carousel: six seats on poles round the edge (gull, deckchair, teacup, duck, gull, deckchair) and a scalloped valance.
function carouselSeat(k: number): Part[] {
  const a = rad(k * 60 + 30);
  const x = r3(Math.sin(a) * 0.6);
  const z = r3(Math.cos(a) * 0.6);
  const yaw = k * 60 + 30;
  const pole: Part = { s: 'cyl', d: [0.015, 0.015, 0.95], at: [x, 0.575, z], c: 'brass', seg: 5 };
  switch (k % 4) {
    case 0: // gull: white body, grey head and an orange beak
      return [pole,
        { s: 'ball', d: [0.09], at: [x, 0.36, z], scale: [0.8, 0.8, 1.3], rot: [0, yaw, 0], c: 'white', seg: 6 },
        { s: 'ball', d: [0.05], at: [r3(x + Math.sin(a) * 0.07), 0.44, r3(z + Math.cos(a) * 0.07)], c: 'silver', seg: 6 }];
    case 1: // deckchair: a striped slab
      return [pole,
        { s: 'box', d: [0.14, 0.04, 0.2], at: [x, 0.34, z], rot: [0, yaw, 0], c: 'tint' }];
    case 2: // teacup
      return [pole,
        { s: 'cyl', d: [0.1, 0.06, 0.1], at: [x, 0.36, z], c: 'white', seg: 8 }];
    default: // duck
      return [pole,
        { s: 'ball', d: [0.09], at: [x, 0.36, z], scale: [0.9, 0.8, 1.2], rot: [0, yaw, 0], c: 'yellow', seg: 6 },
        { s: 'cone', d: [0.025, 0.06], at: [r3(x + Math.sin(a) * 0.1), 0.38, r3(z + Math.cos(a) * 0.1)], c: 'orange', seg: 5 }];
  }
}

const CAROUSEL_PARTS: Part[] = [
  { s: 'cyl', d: [0.8, 0.8, 0.1], at: [0, 0.05, 0], c: 'wood-dark', seg: 12 },
  { s: 'cyl', d: [0.06, 0.06, 1.1], at: [0, 0.65, 0], c: 'brass', seg: 8 },
  { s: 'cyl', d: [0.88, 0.88, 0.1], at: [0, 1.15, 0], c: 'trim', seg: 12 },
  { s: 'cone', d: [0.88, 0.3], at: [0, 1.35, 0], c: 'tint', seg: 12 },
  { s: 'ball', d: [0.05], at: [0, 1.53, 0], c: 'gold', seg: 6 },
  // scalloped valance: a ring of squashed balls, alternating tint and trim
  ...Array.from({ length: 12 }, (_, i): Part => {
    const a = rad(i * 30);
    return { s: 'ball', d: [0.1], at: [r3(Math.sin(a) * 0.86), 1.1, r3(Math.cos(a) * 0.86)], scale: [1, 0.7, 1],
      c: i % 2 ? 'trim' : 'tint', seg: 6 };
  }),
  ...Array.from({ length: 6 }, (_, k) => carouselSeat(k)).flat(),
];

// Helter-skelter: a slide that winds from the top, stepping round and down.
const TOWER_R = (y: number): number => 0.45 - (y / 2.0) * 0.15;
const HELTER_SLIDE: Part[] = Array.from({ length: 10 }, (_, k): Part => {
  const deg = 30 + k * 80;
  const a = rad(deg);
  const y = r3(1.85 - k * 0.15);
  const rr = TOWER_R(y) + 0.1;
  return { s: 'box', d: [0.5, 0.04, 0.2], at: [r3(Math.sin(a) * rr), y, r3(Math.cos(a) * rr)], rot: [0, deg, -12], c: 'wood-light' };
});

// Rope between the two stanchion posts: four boxes making a sag.
const ROPE_NODES: ReadonlyArray<readonly [number, number]> = [[-0.25, 0.38], [-0.125, 0.32], [0, 0.29], [0.125, 0.32], [0.25, 0.38]];
const ROPE_PARTS: Part[] = ROPE_NODES.slice(1).map(([x1, y1], i): Part => {
  const [x0, y0] = ROPE_NODES[i];
  const len = Math.hypot(x1 - x0, y1 - y0);
  return { s: 'box', d: [r3(len + 0.02), 0.04, 0.04], at: [r3((x0 + x1) / 2), r3((y0 + y1) / 2), 0],
    rot: [0, 0, r3((Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI)], c: 'red' };
});

// Deckchair stack: eight folded chairs leaning on a rack, canvas in alternating colours.
const CHAIR_COLOURS = ['tint', 'trim', 'blue', 'yellow'] as const;
const CHAIR_PARTS: Part[] = Array.from({ length: 8 }, (_, i): Part => ({
  s: 'box', d: [0.5, 0.9, 0.03], at: [0, 0.44, r3(-0.22 + i * 0.07)], rot: [-15, 0, 0], c: CHAIR_COLOURS[i % 4],
}));

export const GTA_COAST_FAIR: readonly PrefabDef[] = [
  {
    id: 'mini-carousel', name: 'Mini Carousel', category: 'prop', uses: ['place'],
    tags: ['carousel', 'gallopers', 'roundabout', 'ride', 'fair', 'fairground', 'canopy', 'saltbucket', 'boardwalk', 'gta'], emoji: [],
    tint: 0xe8453c, trim: 0xf2e3c6,
    about: 'Gnome Theft Auto: a small gallopers carousel, about 1.8 across and 1.55 tall: round platform, brass pole, striped canopy and scalloped valance, six seats (gull, deckchair, teacup, duck). Tint and trim = the canopy stripes.',
    examine: [
      'A round platform with a brass pole, a striped canopy and six little seats on poles: two gulls, two ducks, a teacup and a deckchair.',
      'Fair saying: a carousel goes nowhere gently, and that is the whole of its charm.',
      'Tip: take the gull, not the duck, because the duck is a few turns slower and has a very low opinion of passengers.',
      'Joke: the ride has never once arrived anywhere, and the gnomes in the queue still ask how the trip was.',
      'A small brass plaque on the pole says MIND THE GULL, and the gull is looking right at it.',
    ],
    parts: CAROUSEL_PARTS,
  },
  {
    id: 'helter-skelter', name: 'Helter Skelter', category: 'prop', uses: ['place'],
    tags: ['helter', 'skelter', 'slide', 'tower', 'ride', 'fair', 'fairground', 'saltbucket', 'boardwalk', 'gta'], emoji: [],
    tint: 0xe8453c, trim: 0xf2e3c6,
    about: 'Gnome Theft Auto: a striped helter-skelter tower, about 0.9 across at the base and 2.7 tall, a spiral slide winding down it, a door at the bottom on +z and a pointed cap with a flag. Tint and trim = the stripes.',
    examine: [
      'A tall striped tower with a slide winding round it, a little door at the bottom, and a red cap with a flag on the point.',
      'Fair saying: what goes up the stairs must come down the slide, and it will not be consulted about how.',
      'Tip: take a mat, and sit up straight, because the last turn is faster than it looks and the sand is not softer.',
      'Joke: the door at the bottom says EXIT, and the gnomes who use it all say they meant to do that.',
      'The mats are stacked inside, a little warm from the last gnome, and one has been left with a hat on it.',
    ],
    parts: [
      { s: 'cyl', d: [0.42, 0.45, 0.4], at: [0, 0.2, 0], c: 'tint', seg: 12 },
      { s: 'cyl', d: [0.39, 0.42, 0.4], at: [0, 0.6, 0], c: 'trim', seg: 12 },
      { s: 'cyl', d: [0.36, 0.39, 0.4], at: [0, 1.0, 0], c: 'tint', seg: 12 },
      { s: 'cyl', d: [0.33, 0.36, 0.4], at: [0, 1.4, 0], c: 'trim', seg: 12 },
      { s: 'cyl', d: [0.3, 0.33, 0.4], at: [0, 1.8, 0], c: 'tint', seg: 12 },
      { s: 'cyl', d: [0.36, 0.34, 0.06], at: [0, 2.03, 0], c: 'wood-dark', seg: 12 },
      { s: 'cone', d: [0.34, 0.45], at: [0, 2.255, 0], c: 'red', seg: 12 },
      { s: 'cyl', d: [0.01, 0.01, 0.3], at: [0, 2.6, 0], c: 'wood', seg: 4 },
      { s: 'box', d: [0.2, 0.1, 0.01], at: [0.1, 2.68, 0], c: 'yellow' },
      { s: 'box', d: [0.24, 0.4, 0.04], at: [0, 0.2, 0.445], c: 'wood-dark' },
      ...HELTER_SLIDE,
    ],
  },
  {
    id: 'punch-booth', name: 'Punch Booth', category: 'prop', uses: ['place'],
    tags: ['punch', 'judy', 'puppet', 'booth', 'theatre', 'show', 'fair', 'saltbucket', 'boardwalk', 'gta'], emoji: [],
    tint: 0xe8453c, trim: 0xf2e3c6,
    about: 'Gnome Theft Auto: a Punch-and-Judy style puppet booth, about 1.0 wide, 0.6 deep and 1.6 tall: striped cloth body, a stage opening on +z with red curtains, a gnome puppet and a gull puppet, a roof and a sign board. Tint and trim = the stripes.',
    examine: [
      'A striped cloth booth with a little stage near the top, red curtains, a gnome in a pointy hat and a gull, both mid-argument.',
      'Fair saying: the show is always the same, and the gnomes are always surprised by it.',
      'Tip: stand at the back and clap in the right places, because the gull in the window keeps count.',
      'Joke: the gnome puppet hits the gull with a stick every show, and the gull has never once flinched.',
      'The sign says SHOWS AT THREE, and under it, in smaller paint, three has been quite flexible lately.',
    ],
    parts: [
      { s: 'box', d: [0.9, 1.3, 0.5], at: [0, 0.65, 0], c: 'tint' },
      { s: 'box', d: [0.14, 1.3, 0.02], at: [-0.38, 0.65, 0.26], c: 'trim' },
      { s: 'box', d: [0.14, 1.3, 0.02], at: [0.38, 0.65, 0.26], c: 'trim' },
      { s: 'box', d: [0.14, 0.55, 0.02], at: [-0.22, 0.28, 0.26], c: 'trim' },
      { s: 'box', d: [0.14, 0.55, 0.02], at: [0.22, 0.28, 0.26], c: 'trim' },
      { s: 'box', d: [0.56, 0.46, 0.02], at: [0, 0.95, 0.262], c: 'wood-dark' },
      { s: 'box', d: [0.46, 0.36, 0.02], at: [0, 0.95, 0.274], c: 'black' },
      { s: 'box', d: [0.06, 0.4, 0.03], at: [0.25, 0.95, 0.285], c: 'red', mirror: true },
      { s: 'box', d: [0.12, 0.18, 0.04], at: [-0.11, 0.8, 0.3], c: 'blue' },
      { s: 'ball', d: [0.07], at: [-0.11, 0.93, 0.3], c: 'terracotta', seg: 8 },
      { s: 'cone', d: [0.075, 0.15], at: [-0.11, 1.03, 0.3], c: 'red', seg: 6 },
      { s: 'box', d: [0.12, 0.18, 0.04], at: [0.12, 0.8, 0.3], c: 'white' },
      { s: 'ball', d: [0.07], at: [0.12, 0.93, 0.3], c: 'white', seg: 8 },
      { s: 'cone', d: [0.025, 0.07], at: [0.12, 0.92, 0.37], rot: [90, 0, 0], c: 'orange', seg: 5 },
      { s: 'box', d: [1.0, 0.05, 0.6], at: [0, 1.325, 0], c: 'red' },
      { s: 'box', d: [0.7, 0.2, 0.04], at: [0, 1.47, 0.1], rot: [-12, 0, 0], c: 'wood-light' },
      { s: 'box', d: [0.5, 0.04, 0.01], at: [0, 1.5, 0.125], rot: [-12, 0, 0], c: 'wood-dark' },
      { s: 'box', d: [0.36, 0.04, 0.01], at: [0, 1.42, 0.125], rot: [-12, 0, 0], c: 'wood-dark' },
    ],
  },
  {
    id: 'coin-telescope', name: 'Coin Telescope', category: 'prop', uses: ['place'],
    tags: ['telescope', 'coin', 'viewer', 'pedestal', 'seaside', 'saltbucket', 'boardwalk', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a coin-op seaside telescope, about 0.9 tall on a short green iron post: a box head with a coin plate, two eyepieces facing -z and a tube pointing +z (the sea at yaw 0).',
    examine: [
      'A short green iron post carries a box head with a brass coin plate, two eyepieces at the back and a long tube aimed at the sea.',
      'Shore saying: a coin buys two minutes of the horizon, and the horizon always looks exactly the same.',
      'Tip: you need an acorn, not a coin, and it will take the acorn without giving you any change.',
      'Joke: it has shown generations of gnomes the Bathtub Queen, and has never once shown her moving.',
      'Someone has scratched LOOK UP on the tube, and the tube is pointing straight at them as they do.',
    ],
    parts: [
      { s: 'cyl', d: [0.12, 0.15, 0.06], at: [0, 0.03, 0], c: 'leaf-dark', seg: 8 },
      { s: 'cyl', d: [0.05, 0.07, 0.55], at: [0, 0.335, 0], c: 'leaf-dark', seg: 8 },
      { s: 'box', d: [0.22, 0.16, 0.26], at: [0, 0.69, 0], c: 'leaf-dark' },
      { s: 'box', d: [0.1, 0.04, 0.12], at: [0, 0.6, 0.08], c: 'iron-dark' },
      { s: 'cyl', d: [0.045, 0.06, 0.46], at: [0, 0.7, 0.3], rot: [90, 0, 0], c: 'leaf-dark', seg: 8 },
      { s: 'cyl', d: [0.065, 0.065, 0.04], at: [0, 0.7, 0.54], rot: [90, 0, 0], c: 'brass', seg: 8 },
      { s: 'cyl', d: [0.025, 0.025, 0.1], at: [0.05, 0.71, -0.17], rot: [90, 0, 0], c: 'iron-dark', seg: 6, mirror: true },
      { s: 'box', d: [0.02, 0.09, 0.07], at: [0.115, 0.7, 0], c: 'brass' },
      { s: 'box', d: [0.025, 0.04, 0.012], at: [0.122, 0.71, 0], c: 'black' },
    ],
  },
  {
    id: 'deckchair-stack', name: 'Deckchair Stack', category: 'prop', uses: ['place'],
    tags: ['deckchair', 'chair', 'stack', 'rack', 'canvas', 'seaside', 'saltbucket', 'boardwalk', 'gta'], emoji: [],
    tint: 0xe8453c, trim: 0xf2e3c6,
    about: 'Gnome Theft Auto: eight folded deckchairs leaning in a stack on a little wooden rack, about 0.9 tall and 0.8 wide. Tint and trim = two of the canvas stripes; the others are blue and yellow.',
    examine: [
      'Eight folded deckchairs lean in a stack against a little wooden rack, in canvas of red, white, blue and yellow.',
      'Seaside saying: all deckchairs are folded until you want one, and then none of them know how to open.',
      'Tip: take one from the top, not the middle, because the middle one is holding the whole stack up and knows it.',
      'Joke: you hire a chair by the hour, and the stack is always one chair short of however many you came with.',
      'The rack has a note pinned to it: PLEASE RETURN THE CHAIRS, and under it, the chairs, apparently, are not listening.',
    ],
    parts: [
      { s: 'box', d: [0.8, 0.04, 0.7], at: [0, 0.02, 0.02], c: 'wood-dark' },
      { s: 'box', d: [0.05, 0.8, 0.05], at: [0.38, 0.4, -0.32], c: 'wood', mirror: true },
      { s: 'box', d: [0.8, 0.05, 0.05], at: [0, 0.78, -0.32], c: 'wood' },
      ...CHAIR_PARTS,
      { s: 'box', d: [0.04, 0.92, 0.04], at: [0.27, 0.44, 0.0], rot: [-15, 0, 0], c: 'wood-light', mirror: true },
    ],
  },
  {
    id: 'rope-stanchion', name: 'Rope Stanchion', category: 'prop', uses: ['place'],
    tags: ['stanchion', 'rope', 'queue', 'post', 'brass', 'barrier', 'saltbucket', 'boardwalk', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a pair of brass queue posts 0.5 apart along x with a thick red rope sagging between them, about 0.55 wide and 0.45 tall.',
    examine: [
      'Two round-footed brass posts, each topped with a brass ball, with a thick red rope hung between them in a gentle sag.',
      'Fair saying: a rope is only a barrier if every gnome agrees it is one.',
      'Tip: lift the rope, do not duck under it, and thank the post for its patience as you go.',
      'Joke: the queue behind it has been orderly for hours, and the ride it leads to has been shut since Tuesday.',
      'The brass is polished to a shine on top, where every passing gnome has stopped to pat it.',
    ],
    parts: [
      { s: 'cyl', d: [0.08, 0.09, 0.03], at: [-0.25, 0.015, 0], c: 'brass', seg: 8 },
      { s: 'cyl', d: [0.08, 0.09, 0.03], at: [0.25, 0.015, 0], c: 'brass', seg: 8 },
      { s: 'cyl', d: [0.025, 0.025, 0.4], at: [-0.25, 0.22, 0], c: 'brass', seg: 6 },
      { s: 'cyl', d: [0.025, 0.025, 0.4], at: [0.25, 0.22, 0], c: 'brass', seg: 6 },
      { s: 'ball', d: [0.04], at: [-0.25, 0.43, 0], c: 'brass', seg: 6 },
      { s: 'ball', d: [0.04], at: [0.25, 0.43, 0], c: 'brass', seg: 6 },
      ...ROPE_PARTS,
    ],
  },
  {
    id: 'seaside-bin', name: 'Seaside Bin', category: 'prop', uses: ['place'],
    tags: ['bin', 'litter', 'rubbish', 'trash', 'gull', 'seaside', 'saltbucket', 'boardwalk', 'gta'], emoji: [],
    tint: 0x3f8f4a,
    about: 'Gnome Theft Auto: a round green litter bin on a post with a little roof, a flap and a gull sticker on +z, about 0.35 across and 0.65 tall. Tint = the green paint.',
    examine: [
      'A round green bin on a short post, with a tiny roof, a black flap and a white gull sticker looking out of it.',
      'Shore saying: the gull on the sticker is the only one on the Shore that ever stays out of the bin.',
      'Tip: mind the flap, because the bin keeps its own opinions about what ought to go in it.',
      'Joke: a sign on it says KEEP THE SHORE TIDY, and the real gulls have taken that as an invitation.',
      'Somebody has stuck a second gull over the first one, and the first gull looks quite put out about it.',
    ],
    parts: [
      { s: 'cyl', d: [0.12, 0.14, 0.03], at: [0, 0.015, 0], c: 'iron-dark', seg: 8 },
      { s: 'cyl', d: [0.04, 0.05, 0.22], at: [0, 0.14, 0], c: 'iron-dark', seg: 6 },
      { s: 'cyl', d: [0.17, 0.14, 0.3], at: [0, 0.38, 0], c: 'tint', seg: 8 },
      { s: 'cyl', d: [0.175, 0.175, 0.03], at: [0, 0.3, 0], c: 'iron-dark', seg: 8 },
      { s: 'cone', d: [0.22, 0.1], at: [0, 0.58, 0], c: 'iron-dark', seg: 8 },
      { s: 'box', d: [0.14, 0.05, 0.02], at: [0, 0.45, 0.155], c: 'black' },
      { s: 'ball', d: [0.05], at: [0, 0.35, 0.155], scale: [1.3, 0.8, 0.25], c: 'white', seg: 6 },
      { s: 'cone', d: [0.012, 0.03], at: [0.06, 0.355, 0.16], rot: [0, 0, -90], c: 'orange', seg: 4 },
    ],
  },
  {
    id: 'ice-cream-kiosk', name: 'Ice Cream Kiosk', category: 'prop', uses: ['place'],
    tags: ['ice', 'cream', 'kiosk', 'cone', 'scoop', 'stall', 'round', 'hatch', 'saltbucket', 'boardwalk', 'gta'], emoji: [],
    tint: 0xf5c9d6, trim: 0x6fbfb2,
    about: 'Gnome Theft Auto: a small round ice cream kiosk, about 1.3 across and 1.7 tall, a serving hatch with a counter on +z, a roof with a big fibreglass cone and scoop on top. Tint = the walls, trim = the band and roof.',
    examine: [
      'A round kiosk in sorbet colours, a hatch with a little counter at the front, and a huge cone with a pink scoop on the roof.',
      'Boardwalk saying: the biggest cone is always the one on the roof, and nobody has ever been served from it.',
      'Tip: ask for a flake, then ask for another, because the first one is only there to keep the scoop company.',
      'Joke: the scoop on the roof has been melting for three summers and has not lost an ounce, which the Shore finds suspicious.',
      'The menu says seven flavours, and the stallholder says there are three, and it depends on the weather which three.',
    ],
    parts: [
      { s: 'cyl', d: [0.62, 0.62, 0.1], at: [0, 0.05, 0], c: 'wood-dark', seg: 12 },
      { s: 'cyl', d: [0.6, 0.6, 0.9], at: [0, 0.55, 0], c: 'tint', seg: 12 },
      { s: 'cyl', d: [0.615, 0.615, 0.12], at: [0, 0.2, 0], c: 'trim', seg: 12 },
      { s: 'box', d: [0.5, 0.4, 0.05], at: [0, 0.7, 0.59], c: 'black' },
      { s: 'box', d: [0.6, 0.05, 0.22], at: [0, 0.5, 0.65], c: 'wood-light' },
      { s: 'box', d: [0.5, 0.12, 0.04], at: [0, 0.95, 0.585], c: 'white' },
      { s: 'box', d: [0.7, 0.04, 0.3], at: [0, 0.96, 0.74], rot: [12, 0, 0], c: 'trim' },
      { s: 'cyl', d: [0.72, 0.62, 0.06], at: [0, 1.03, 0], c: 'trim', seg: 12 },
      { s: 'cone', d: [0.7, 0.16], at: [0, 1.14, 0], c: 'trim', seg: 12 },
      { s: 'cone', d: [0.14, 0.3], at: [0, 1.37, 0], rot: [180, 0, 0], c: 'terracotta', seg: 8 },
      { s: 'ball', d: [0.15], at: [0, 1.55, 0], c: 'pink', seg: 8 },
      { s: 'ball', d: [0.04], at: [0, 1.7, 0], c: 'red', seg: 6 },
    ],
  },
  {
    id: 'shell-grotto-booth', name: 'Shell Grotto Booth', category: 'prop', uses: ['place'],
    tags: ['shell', 'grotto', 'fortune', 'booth', 'hut', 'moon', 'curtain', 'saltbucket', 'boardwalk', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: the Grotto of Shells fortune booth, a small hut about 1.0 wide, 1.0 deep and 1.35 tall covered in shell bumps, a dark curtained doorway on +z and a gold crescent-moon sign.',
    examine: [
      'A small hut crusted in shells, a dark curtain across its doorway and a gold crescent moon above, hung a little crooked.',
      'Shore saying: the grotto tells you what you already knew, and charges extra for the part you did not.',
      'Tip: ask about the weather, because it is always right about that, and never right about anything else.',
      'Joke: the fortune teller sees your future clearly, but not your face, since the curtain is in the way.',
      'A hand-lettered card says CLOSED FOR LUNCH, and under it, in a different hand, the lunch has been closed for a while.',
    ],
    parts: [
      { s: 'box', d: [1.0, 0.9, 0.9], at: [0, 0.45, 0], c: 'sand' },
      { s: 'cone', d: [0.72, 0.4], at: [0, 1.1, 0], rot: [0, 45, 0], c: 'shell', seg: 4 },
      { s: 'ball', d: [0.06], at: [0, 1.33, 0], c: 'gold', seg: 6 },
      { s: 'box', d: [0.42, 0.62, 0.02], at: [0, 0.35, 0.46], c: 'black' },
      { s: 'box', d: [0.2, 0.64, 0.03], at: [0.11, 0.35, 0.475], c: 'ink', mirror: true },
      { s: 'ring', d: [0.1, 0.025, 260], at: [0, 0.78, 0.47], rot: [0, 0, 100], c: 'gold', seg: 8 },
      { s: 'ball', d: [0.1], at: [0.36, 0.2, 0.46], scale: [1, 0.6, 0.5], c: 'shell', seg: 6, mirror: true },
      { s: 'ball', d: [0.09], at: [0.36, 0.5, 0.46], scale: [1, 0.6, 0.5], c: 'pink', seg: 6, mirror: true },
      { s: 'ball', d: [0.1], at: [0.36, 0.75, 0.46], scale: [1, 0.6, 0.5], c: 'shell', seg: 6, mirror: true },
      { s: 'ball', d: [0.1], at: [0.5, 0.25, 0.25], scale: [0.5, 0.6, 1], c: 'shell', seg: 6, mirror: true },
      { s: 'ball', d: [0.1], at: [0.5, 0.55, 0], scale: [0.5, 0.6, 1], c: 'pink', seg: 6, mirror: true },
      { s: 'ball', d: [0.1], at: [0.5, 0.3, -0.25], scale: [0.5, 0.6, 1], c: 'shell', seg: 6, mirror: true },
      { s: 'ball', d: [0.1], at: [0.5, 0.75, -0.2], scale: [0.5, 0.6, 1], c: 'shell', seg: 6, mirror: true },
      { s: 'ball', d: [0.1], at: [-0.2, 0.3, -0.46], scale: [1, 0.6, 0.5], c: 'shell', seg: 6 },
      { s: 'ball', d: [0.1], at: [0.15, 0.6, -0.46], scale: [1, 0.6, 0.5], c: 'pink', seg: 6 },
      { s: 'ball', d: [0.09], at: [0.3, 0.3, -0.46], scale: [1, 0.6, 0.5], c: 'shell', seg: 6 },
    ],
  },
];
