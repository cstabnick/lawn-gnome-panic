// Club Gnome: shop furniture for Acorn Row (the Gnome Salon, the Gnome Market dressing room, the furniture shop).
import type { PrefabDef } from '../types';

export const CLUB_GNOME_SHOPS: PrefabDef[] = [
  {
    id: 'barber-chair', name: 'Barber Chair', category: 'furniture', uses: ['sit','place'],
    seat: [0, 0.55, 0.05],
    tint: 'leather',
    tags: ['barber','chair','salon','hair','seat','furniture','leather','pedestal','footrest','chrome'], emoji: [],
    about: 'A padded leather salon chair on a chrome pedestal with a footrest. Tint is the leather.',
    examine: [
      'Padded leather on a shiny pedestal. The chrome is only polished tin, but it has been buffed every morning for years.',
      'Salon saying: "Sit still and the scissors will not slip." Nobody has ever checked whether this is true.',
      'A tip: pull the footrest out before you sit, or your boots will dangle for the whole appointment.',
      'It turns a full circle when you push it. Most customers would prefer it turned less.',
      'The left armrest has a dent in the exact shape of a gnome elbow. Several gnomes claim it as their own.',
    ],
    parts: [
      { s: 'cyl', d: [0.3, 0.3, 0.04], at: [0, 0.02, 0], c: 'steel', seg: 12 },                     // round base
      { s: 'cyl', d: [0.05, 0.05, 0.4], at: [0, 0.24, 0], c: 'steel', seg: 8 },                     // pedestal
      { s: 'box', d: [0.5, 0.12, 0.5], at: [0, 0.49, 0.05], c: 'tint' },                           // padded seat
      { s: 'box', d: [0.5, 0.45, 0.1], at: [0, 0.78, -0.25], c: 'tint' },                          // back
      { s: 'cyl', d: [0.02, 0.02, 0.5], at: [0, 0.12, 0.32], c: 'steel', seg: 6, rot: [0, 0, 90] }, // footrest bar
      { s: 'box', d: [0.06, 0.05, 0.4], at: [0.25, 0.7, 0.05], c: 'tint', mirror: true },          // armrest
      { s: 'box', d: [0.05, 0.16, 0.05], at: [0.25, 0.63, 0.05], c: 'steel', mirror: true },       // armrest support
    ],
  },
  {
    id: 'salon-mirror', name: 'Salon Mirror', category: 'furniture', uses: ['place'],
    tags: ['mirror','salon','vanity','glass','hair','furniture','comb','scissors','shelf','wood'], emoji: [],
    about: 'A tall standing salon mirror in a wooden frame, with a shelf of combs, scissors and a bottle.',
    examine: [
      'A tall wooden frame around a sheet of pale blue glass. It shows you exactly what is there, which many gnomes find rude.',
      'Old saying: "A gnome who will not look in the glass will never learn the beard is crooked."',
      'A tip: polish the glass with a damp cloth, not a wet sleeve. Sleeves leave streaks shaped like sleeves.',
      'It is the only thing in the Salon that never talks back, and it still gets blamed for the haircuts.',
      'The shelf holds a comb, a pair of scissors that are mostly bent, and a bottle of something green nobody will name.',
    ],
    parts: [
      { s: 'box', d: [0.1, 0.08, 0.3], at: [0.3, 0.04, 0], c: 'wood-dark', mirror: true },           // feet
      { s: 'box', d: [0.8, 1.6, 0.06], at: [0, 0.88, -0.05], c: 'wood' },                            // back board
      { s: 'box', d: [0.08, 1.6, 0.1], at: [0.36, 0.88, -0.02], c: 'wood-dark', mirror: true },     // side rails
      { s: 'box', d: [0.8, 0.08, 0.1], at: [0, 1.64, -0.02], c: 'wood' },                            // top rail
      { s: 'box', d: [0.64, 1.1, 0.01], at: [0, 1.0, 0.035], c: 'glass', alpha: 0.7 },              // mirror
      { s: 'box', d: [0.7, 0.04, 0.2], at: [0, 0.36, 0.05], c: 'wood-light' },                       // shelf
      { s: 'box', d: [0.12, 0.01, 0.03], at: [-0.22, 0.385, 0.08], c: 'black' },                     // comb
      { s: 'box', d: [0.14, 0.012, 0.02], at: [0.05, 0.386, 0.08], rot: [0, 35, 0], c: 'steel' },    // scissors blade
      { s: 'box', d: [0.14, 0.012, 0.02], at: [0.05, 0.386, 0.08], rot: [0, -35, 0], c: 'steel' },   // scissors blade
      { s: 'cyl', d: [0.03, 0.035, 0.12], at: [0.2, 0.44, 0.08], c: 'glaze-green', seg: 8 },        // bottle
    ],
  },
  {
    id: 'changing-screen', name: 'Changing Screen', category: 'furniture', uses: ['place'],
    tint: 'pink',
    trim: 'wood',
    tags: ['screen','changing','dressing','folding','cloth','furniture','panel','wood','fitting'], emoji: [],
    about: 'A three-panel folding cloth screen for trying on clothes behind. Tint is the cloth, trim the frames.',
    examine: [
      'Three panels of cloth in thin wooden frames, hinged so they fold flat. The middle panel is always the one that sags.',
      'Salon saying: "Hang your coat behind the screen and the whole street will think you have company."',
      'A tip: stand behind the middle panel, not an edge. The edges are where the gossip gets through.',
      'It hides everything above the boots, and every gnome has been caught by their boots at least once.',
      'Someone stitched a patch onto the left panel. It is the wrong colour, and the Market does not discuss it.',
    ],
    parts: [
      { s: 'box', d: [0.45, 1.5, 0.03], at: [0, 0.75, 0], c: 'tint' },                                 // centre cloth
      { s: 'box', d: [0.48, 1.5, 0.02], at: [0, 0.75, -0.03], c: 'trim' },                             // centre frame
      { s: 'box', d: [0.45, 1.5, 0.03], at: [-0.42, 0.75, 0.1125], rot: [0, 30, 0], c: 'tint', mirror: true }, // outer cloth panels
      { s: 'box', d: [0.48, 1.5, 0.02], at: [-0.435, 0.75, 0.0865], rot: [0, 30, 0], c: 'trim', mirror: true }, // outer frame panels
    ],
  },
  {
    id: 'coming-soon-placard', name: 'Coming Soon Placard', category: 'prop', uses: ['place'],
    tags: ['placard','sign','easel','coming','soon','board','prop','banner','shop'], emoji: [],
    about: 'A cream board on a wooden easel with a red stripe and COMING SOON marks. Not a real sign; a shape.',
    examine: [
      'A cream board on a wooden easel, a red stripe across it, and six dark marks meant to say COMING SOON.',
      'Gnomes stop, squint at the marks, and ask what is coming. Nobody has ever known, and nobody has ever asked the shop.',
      'A tip: the easel is light and the wind is not. Tie it down, or it will be in the Verge by morning.',
      'It has been coming soon for longer than the furniture shop has existed.',
      'The first board of this kind was painted in a hurry by a gnome who then forgot which shop it was for.',
    ],
    parts: [
      { s: 'box', d: [0.05, 0.97, 0.05], at: [0.3, 0.475, -0.02], rot: [11.9, 0, 0], c: 'wood-dark', mirror: true }, // front legs
      { s: 'box', d: [0.05, 0.95, 0.05], at: [0, 0.475, -0.02], rot: [-11.9, 0, 0], c: 'wood-dark' },           // centre brace leg
      { s: 'box', d: [0.7, 0.5, 0.04], at: [0, 0.7, 0.1], c: 'paper' },                                      // board
      { s: 'box', d: [0.7, 0.1, 0.01], at: [0, 0.7, 0.125], c: 'red' },                                      // red stripe
      { s: 'box', d: [0.06, 0.07, 0.01], at: [-0.225, 0.7, 0.135], c: 'ink' },                               // letter marks
      { s: 'box', d: [0.06, 0.07, 0.01], at: [-0.135, 0.7, 0.135], c: 'ink' },
      { s: 'box', d: [0.06, 0.07, 0.01], at: [-0.045, 0.7, 0.135], c: 'ink' },
      { s: 'box', d: [0.06, 0.07, 0.01], at: [0.045, 0.7, 0.135], c: 'ink' },
      { s: 'box', d: [0.06, 0.07, 0.01], at: [0.135, 0.7, 0.135], c: 'ink' },
      { s: 'box', d: [0.06, 0.07, 0.01], at: [0.225, 0.7, 0.135], c: 'ink' },
    ],
  },
];
