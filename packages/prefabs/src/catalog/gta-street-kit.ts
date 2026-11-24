// Gnome Theft Auto: street furniture A (docs/roadmaps/gta-parks-and-fringe.md, issue 1A). Life-size metres, standing on
// y = 0, centred on x and z, front on +z.
import type { PrefabDef } from '../types';

export const GTA_STREET_KIT: readonly PrefabDef[] = [
  {
    id: 'park-bench', name: 'Park Bench', category: 'prop', uses: ['place', 'sit'],
    tags: ['gta', 'scenery', 'park', 'bench', 'wood'], emoji: [],
    trim: 'wood',
    footprint: { r: 0.9, h: 0.9 },
    seat: [0, 0.45, 0.05],
    about: 'Gnome Theft Auto: the Park Bench. Slatted wooden seat on cast-iron ends, slatted back on -z. Trim = the wood. 1.8 x 0.7 x 0.9 m.',
    examine: [
      'Two cast-iron ends hold up a row of pale wooden slats, and the gnomes have decided the whole thing is a very long, low, patient shelf.',
      'Saying: the flat boards are for holding up whatever is leaning on them, and that is usually a gnome with a long opinion.',
      'Tip: the slatted back faces the hedge, so the wind has to go all the way round and then apologise for the trouble.',
      'Joke: the wooden slats were once a fence, and they still complain about it on wet mornings.',
      'Scratched into the left iron end is a name that was crossed out, carved back in, and crossed out again by the same hand.',
    ],
    parts: [
      { s: 'box', d: [0.07, 0.42, 0.6], at: [-0.8, 0.21, 0], c: 'iron-dark' },                  // cast-iron end frames
      { s: 'box', d: [0.07, 0.42, 0.6], at: [0.8, 0.21, 0], c: 'iron-dark' },
      { s: 'box', d: [0.07, 0.42, 0.08], at: [-0.8, 0.66, -0.3], c: 'iron-dark' },              // back uprights
      { s: 'box', d: [0.07, 0.42, 0.08], at: [0.8, 0.66, -0.3], c: 'iron-dark' },
      { s: 'box', d: [1.8, 0.05, 0.12], at: [0, 0.45, -0.27], c: 'trim' },                      // seat slats
      { s: 'box', d: [1.8, 0.05, 0.12], at: [0, 0.45, -0.135], c: 'trim' },
      { s: 'box', d: [1.8, 0.05, 0.12], at: [0, 0.45, 0], c: 'trim' },
      { s: 'box', d: [1.8, 0.05, 0.12], at: [0, 0.45, 0.135], c: 'trim' },
      { s: 'box', d: [1.8, 0.05, 0.12], at: [0, 0.45, 0.27], c: 'trim' },
      { s: 'box', d: [1.8, 0.05, 0.05], at: [0, 0.6, -0.3], c: 'trim' },                        // back slats
      { s: 'box', d: [1.8, 0.05, 0.05], at: [0, 0.72, -0.3], c: 'trim' },
      { s: 'box', d: [1.8, 0.05, 0.05], at: [0, 0.84, -0.3], c: 'trim' },
    ],
  },
  {
    id: 'litter-bin', name: 'Litter Bin', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'litter', 'bin', 'metal'], emoji: [],
    footprint: { r: 0.3, h: 1 },
    about: 'Gnome Theft Auto: the Litter Bin. Round dark-green bin with a lid ring and an acorn-shell label plate. 0.6 x 0.6 x 1 m. No tint.',
    examine: [
      'A round green drum of fired clay and sheet iron, with a lid that clacks when the wind gets under it and a plate on the front.',
      'Saying: whatever goes in here is never seen again, which is how the gnomes know it is working properly.',
      'Tip: the lid lifts with a hand flat on top, not a fist. A fist sets off the dust and the dust sets off the pigeons.',
      'Joke: the label plate says ACORN SHELLS, which is the most honest thing anyone in Turfton has ever written on a bin.',
      'The inside is cooler than the street, and there is always one shiny button down there that nobody will admit to losing.',
    ],
    parts: [
      { s: 'cyl', d: [0.12, 0.13, 0.1], at: [0, 0.05, 0], c: 'iron-dark', seg: 8 },            // base
      { s: 'cyl', d: [0.28, 0.24, 0.8], at: [0, 0.45, 0], c: 'leaf-dark', seg: 8 },            // bin body
      { s: 'cyl', d: [0.29, 0.27, 0.1], at: [0, 0.9, 0], c: 'leaf-dark', seg: 8 },            // lid
      { s: 'ring', d: [0.27, 0.03], at: [0, 0.95, 0], rot: [90, 0, 0], c: 'iron-dark' },      // lid ring
      { s: 'box', d: [0.3, 0.12, 0.02], at: [0, 0.5, 0.29], c: 'paper' },                     // label plate
      { s: 'box', d: [0.2, 0.03, 0.01], at: [0, 0.5, 0.3], c: 'black' },                      // label text
    ],
  },
  {
    id: 'street-bollard', name: 'Street Bollard', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'street', 'bollard', 'iron'], emoji: [],
    tint: 0xd4a843,
    footprint: { r: 0.15, h: 0.9 },
    about: 'Gnome Theft Auto: the Street Bollard. Black iron post with a rounded cap and a gold band (tint). 0.3 x 0.3 x 0.9 m.',
    examine: [
      'A short black iron post with a round cap, set in the kerb like a very small chess piece that has given up on moving.',
      'Saying: the post does not move for anyone, not for carts, not for gnomes, and only occasionally for the weather.',
      'Tip: a gold band marks the top of the post, so a gnome in a hurry can see where to stop walking into it.',
      'Joke: the bollards were put here to keep cars out, and they have been keeping the gnomes out with the same dedication.',
      'Someone has tied a ribbon round the third one from the bridge, and the ribbon has faded to exactly the colour of the wind.',
    ],
    parts: [
      { s: 'cyl', d: [0.14, 0.14, 0.06], at: [0, 0.03, 0], c: 'black', seg: 8 },                // base plate
      { s: 'cyl', d: [0.12, 0.13, 0.66], at: [0, 0.36, 0], c: 'black', seg: 8 },               // post
      { s: 'cyl', d: [0.135, 0.135, 0.06], at: [0, 0.6, 0], c: 'tint', seg: 8 },               // gold band
      { s: 'ball', d: [0.15], scale: [1, 0.6, 1], at: [0, 0.8, 0], c: 'black', seg: 8 },       // rounded cap
    ],
  },
  {
    id: 'newspaper-box', name: 'Newspaper Box', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'newspaper', 'box', 'metal'], emoji: [],
    tint: 'red',
    footprint: { r: 0.3, h: 1.1 },
    about: 'Gnome Theft Auto: the Newspaper Box. Coin-op box on legs with a window showing a folded paper and a TATTLER header. Tint = body. 0.6 x 0.5 x 1.1 m.',
    examine: [
      'A tall coin box on four short legs, with a window on the front where a folded paper waits for someone to pay for it.',
      'Saying: the Turfton Tattler is printed fresh each morning, and by noon it has been read so often it is practically gravy.',
      'Tip: the coin slot takes Acorns only. Anything else goes in and comes back out the next morning, slightly more crumpled.',
      'Joke: the box has a headline printed on it in gold letters, which means the headline is the one thing that is always up to date.',
      'Under the lid, on the inside, a pencilled list of every story that was never printed, in a hand that keeps getting smaller.',
    ],
    parts: [
      { s: 'box', d: [0.05, 0.3, 0.05], at: [-0.2, 0.15, 0.1], c: 'iron-dark' },               // legs
      { s: 'box', d: [0.05, 0.3, 0.05], at: [0.2, 0.15, 0.1], c: 'iron-dark' },
      { s: 'box', d: [0.6, 0.76, 0.5], at: [0, 0.68, 0], c: 'tint' },                          // body
      { s: 'box', d: [0.62, 0.04, 0.52], at: [0, 1.08, 0], c: 'black' },                      // lid
      { s: 'box', d: [0.44, 0.44, 0.02], at: [0, 0.8, 0.26], c: 'black' },                    // window frame
      { s: 'box', d: [0.36, 0.34, 0.02], at: [0, 0.8, 0.27], c: 'paper' },                    // folded paper
      { s: 'box', d: [0.5, 0.12, 0.03], at: [0, 1.0, 0.265], c: 'gold' },                     // TATTLER header
      { s: 'box', d: [0.1, 0.04, 0.02], at: [0.2, 0.6, 0.26], c: 'black' },                   // coin slot
    ],
  },
  {
    id: 'parking-meter', name: 'Parking Meter', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'parking', 'meter', 'iron'], emoji: [],
    footprint: { r: 0.15, h: 1.4 },
    about: 'Gnome Theft Auto: the Parking Meter. Iron post with a domed head and a little dial window on +z. 0.3 x 0.25 x 1.4 m. No tint.',
    examine: [
      'An iron post with a domed head like a helmet, and a little round window on the front where a dial counts something nobody asked for.',
      'Saying: the meter takes coins and gives nothing back except a tick, and the tick is the only honest sound in the whole street.',
      'Tip: put the coins in before the dial reaches the red. The dial does not care why you are late, only that you are.',
      'Joke: the gnomes tried to park beside it once, and it has never quite forgiven them for the wrong-way parking.',
      'The dial has a small brass needle that has pointed at the same numeral since the Tall Ones left, and nobody dares to ask it why.',
    ],
    parts: [
      { s: 'cyl', d: [0.04, 0.04, 1.2], at: [0, 0.6, 0], c: 'iron-dark', seg: 6 },              // post
      { s: 'cyl', d: [0.1, 0.12, 0.1], at: [0, 0.05, 0], c: 'iron-dark', seg: 8 },              // base
      { s: 'ball', d: [0.15], scale: [1, 0.7, 0.85], at: [0, 1.28, 0], c: 'iron', seg: 8 },     // domed head
      { s: 'box', d: [0.12, 0.08, 0.02], at: [0, 1.28, 0.11], c: 'glass' },                    // dial window
      { s: 'ball', d: [0.025], at: [0, 1.28, 0.105], c: 'black', seg: 6 },                     // dial
    ],
  },
  {
    id: 'bike-rack', name: 'Bike Rack', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'bike', 'rack', 'steel'], emoji: [],
    footprint: { r: 0.9, h: 0.8 },
    about: 'Gnome Theft Auto: the Bike Rack. Three galvanised inverted-U hoops on a bar. 1.8 x 0.5 x 0.8 m. No tint.',
    examine: [
      'Three grey hoops stand in a line on a common bar, each one shaped like a cursor waiting for something to be locked to it.',
      'Saying: a hoop is a patient thing, and it will hold any wheel you bring it, provided you bring the chain as well.',
      'Tip: lock the frame, not the hoop. Frames are only ever stolen by people who have also forgotten their keys.',
      'Joke: the hoops have been empty so long that the pigeons have started using them as a very exclusive perch.',
      'On the bar, someone scratched a tally of every bicycle that was ever taken, and then stopped, out of respect for the bicycles.',
    ],
    parts: [
      { s: 'box', d: [1.74, 0.05, 0.05], at: [0, 0.05, 0], c: 'iron' },                       // floor bar along x
      { s: 'box', d: [0.04, 0.78, 0.04], at: [-0.85, 0.39, -0.23], c: 'iron' },                 // hoop -x legs
      { s: 'box', d: [0.04, 0.78, 0.04], at: [-0.85, 0.39, 0.23], c: 'iron' },
      { s: 'box', d: [0.04, 0.04, 0.5], at: [-0.85, 0.8, 0], c: 'iron' },                      // hoop -x top
      { s: 'box', d: [0.04, 0.78, 0.04], at: [0, 0.39, -0.23], c: 'iron' },                    // hoop middle
      { s: 'box', d: [0.04, 0.78, 0.04], at: [0, 0.39, 0.23], c: 'iron' },
      { s: 'box', d: [0.04, 0.04, 0.5], at: [0, 0.8, 0], c: 'iron' },
      { s: 'box', d: [0.04, 0.78, 0.04], at: [0.85, 0.39, -0.23], c: 'iron' },                 // hoop +x
      { s: 'box', d: [0.04, 0.78, 0.04], at: [0.85, 0.39, 0.23], c: 'iron' },
      { s: 'box', d: [0.04, 0.04, 0.5], at: [0.85, 0.8, 0], c: 'iron' },
    ],
  },
  {
    id: 'kerb-hydrant', name: 'Kerb Hydrant', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'kerb', 'hydrant', 'water'], emoji: [],
    footprint: { r: 0.225, h: 0.8 },
    about: 'Gnome Theft Auto: the Kerb Hydrant. Stubby red hydrant with two side caps and a chained cap on +z. 0.45 x 0.45 x 0.8 m. No tint.',
    examine: [
      'A squat red post with a dome on top and fat caps on its sides, like a short stout gnome who has been left out in the rain.',
      'Saying: the water under the kerb belongs to whoever is first to turn the cap, and the gnomes have never once been first.',
      'Tip: the chained cap on the front is not for decoration. It is for the sort of gnome who turns a cap and then runs away.',
      'Joke: the hydrant is painted red so that the fire engines can find it, and no engine has come down this street in a century.',
      'The chain is hung with a small brass plate that reads the name of a tap that was turned off by somebody very tall.',
    ],
    parts: [
      { s: 'cyl', d: [0.2, 0.2, 0.1], at: [0, 0.05, 0], c: 'iron-dark', seg: 8 },                // base
      { s: 'cyl', d: [0.12, 0.15, 0.6], at: [0, 0.35, 0], c: 'red', seg: 8 },                   // stand pipe
      { s: 'ball', d: [0.14], scale: [1, 0.5, 1], at: [0, 0.72, 0], c: 'red', seg: 8 },         // dome
      { s: 'cyl', d: [0.05, 0.05, 0.08], rot: [0, 0, 90], at: [-0.18, 0.45, 0], c: 'red', seg: 8 },  // side caps
      { s: 'cyl', d: [0.05, 0.05, 0.08], rot: [0, 0, 90], at: [0.18, 0.45, 0], c: 'red', seg: 8 },
      { s: 'cyl', d: [0.045, 0.045, 0.08], rot: [90, 0, 0], at: [0, 0.45, 0.17], c: 'red', seg: 8 }, // front cap
      { s: 'box', d: [0.02, 0.12, 0.02], at: [0.05, 0.38, 0.21], c: 'iron-dark' },              // chain
    ],
  },
  {
    id: 'poster-pillar', name: 'Poster Pillar', category: 'prop', uses: ['place'],
    tags: ['gta', 'scenery', 'poster', 'pillar', 'stone'], emoji: [],
    tint: 'red',
    footprint: { r: 0.5, h: 2.6 },
    about: 'Gnome Theft Auto: the Poster Pillar. Round advertising column with three coloured poster panels and a brass dome cap. Tint = the main poster. 1 x 1 x 2.6 m.',
    examine: [
      'A round stone column plastered in coloured bills, each one so layered over the last that the lowest is only a rumour.',
      'Saying: the column is older than the posters, and the posters are older than the reasons anyone put them up.',
      'Tip: read the bottom poster first. The top ones are always for things that have already happened and been forgotten.',
      'Joke: the pillar advertises a sale every week, and the sale has been on for so long that it is now the usual price.',
      'Under the brass dome is a single unpasted notice, written in green wax, asking whoever finds it to please take it down.',
    ],
    parts: [
      { s: 'cyl', d: [0.1, 0.1, 0.1], at: [0, 0.05, 0], c: 'stone-dark', seg: 8 },                // plinth
      { s: 'cyl', d: [0.46, 0.46, 2.3], at: [0, 1.15, 0], c: 'stone', seg: 8 },                  // column
      { s: 'box', d: [0.5, 1.0, 0.03], at: [0, 1.2, 0.48], c: 'tint' },                       // main poster (front)
      { s: 'box', d: [0.5, 1.0, 0.03], at: [0.48, 1.2, 0], rot: [0, 90, 0], c: 'blue' },       // side poster
      { s: 'box', d: [0.5, 1.0, 0.03], at: [0, 1.2, -0.48], c: 'yellow' },                     // back poster
      { s: 'ball', d: [0.5], scale: [1, 0.6, 1], at: [0, 2.3, 0], c: 'brass', seg: 8 },        // dome cap
    ],
  },
];
