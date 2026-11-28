// Gnome Theft Auto (E16): Thorne Even-Estates building-site kit (Levelright Construction).
import type { PrefabDef } from '../types';

const BEIGE = 0xd9c8a5;
const PALE_BLUE = 0x9ec3d6;
const ROOF_FELT = 0x55585c;
const CREAM = 0xefe3c8;

export const GTA_COUNTRY_SITE: readonly PrefabDef[] = [
  {
    id: 'even-show-home', name: 'Even-Estates Show-home', category: 'prop', uses: ['place'],
    tags: ['house', 'home', 'show', 'beige', 'box', 'flat', 'roof', 'construction', 'levelright', 'even-estates', 'site', 'gta'], emoji: [],
    footprint: { r: 3.6, h: 4.75 },
    about: 'Gnome Theft Auto: an Even-Estates show-home. A flat-roofed beige box 7 by 7 and 4.5 tall, with a white door, identical windows and a square shrub by the door.',
    examine: [
      'A flat-roofed beige box with a white door and a number plate, exactly like the box beside it, and the box after that.',
      'Levelright saying: a house is finished when it is the same as every other house, and that is also when nobody moves in.',
      'Tip: the door opens onto a hallway with no furniture in it, which is the only room in Even-Estates nobody has argued over.',
      'Joke: every window is the same size, so the view is the same from every room, which the brochure calls choice.',
      'The shrub by the door is the same shrub as in every other show-home. Nobody has ever seen it grow, and nobody has ever seen it wilt.',
    ],
    parts: [
      { s: 'box', d: [7, 4.5, 7], at: [0, 2.25, 0], c: BEIGE },                                  // walls
      { s: 'box', d: [7.4, 0.25, 7.4], at: [0, 4.625, 0], c: ROOF_FELT },                          // roof slab
      { s: 'box', d: [1.0, 2.0, 0.04], at: [0, 1.0, 3.53], c: 'white' },                           // door
      { s: 'box', d: [0.3, 0.15, 0.02], at: [0, 2.3, 3.52], c: 'brass' },                          // number plate
      { s: 'box', d: [1.1, 1.1, 0.02], at: [-2.0, 2.6, 3.515], c: 'white' },                       // window frame
      { s: 'box', d: [0.8, 0.8, 0.02], at: [-2.0, 2.6, 3.535], c: 'glass' },                       // window pane
      { s: 'box', d: [1.1, 1.1, 0.02], at: [2.0, 2.6, 3.515], c: 'white' },                        // window frame
      { s: 'box', d: [0.8, 0.8, 0.02], at: [2.0, 2.6, 3.535], c: 'glass' },                        // window pane
      { s: 'box', d: [0.02, 1.1, 1.1], at: [3.515, 2.6, 2.0], c: 'white' },                        // side window frame
      { s: 'box', d: [0.02, 0.8, 0.8], at: [3.535, 2.6, 2.0], c: 'glass' },                        // side window pane
      { s: 'box', d: [0.02, 1.1, 1.1], at: [3.515, 2.6, -2.0], c: 'white' },                       // side window frame
      { s: 'box', d: [0.02, 0.8, 0.8], at: [3.535, 2.6, -2.0], c: 'glass' },                       // side window pane
      { s: 'box', d: [0.02, 1.1, 1.1], at: [-3.515, 2.6, 2.0], c: 'white' },                       // side window frame
      { s: 'box', d: [0.02, 0.8, 0.8], at: [-3.535, 2.6, 2.0], c: 'glass' },                       // side window pane
      { s: 'box', d: [0.02, 1.1, 1.1], at: [-3.515, 2.6, -2.0], c: 'white' },                      // side window frame
      { s: 'box', d: [0.02, 0.8, 0.8], at: [-3.535, 2.6, -2.0], c: 'glass' },                      // side window pane
      { s: 'box', d: [0.4, 0.35, 0.4], at: [-1.0, 0.175, 3.9], c: 'clay' },                        // pot
      { s: 'box', d: [0.36, 0.36, 0.36], at: [-1.0, 0.53, 3.9], c: 'leaf-dark' },                  // shrub
    ],
  },
  {
    id: 'even-half-built', name: 'Half-built Even-Estates House', category: 'prop', uses: ['place'],
    tags: ['house', 'half', 'built', 'frame', 'girder', 'brick', 'ladder', 'tarp', 'construction', 'levelright', 'even-estates', 'site', 'gta'], emoji: [],
    footprint: { r: 4, h: 4.4 },
    about: 'Gnome Theft Auto: a half-built Even-Estates house. A concrete slab, a frame of mushroom-stem girders, walls bricked to about 2 tall, a ladder and a tarp. No roof.',
    examine: [
      'Mushroom-stem girders hold up half a house, and the half that is still up has been up for a long time.',
      'Foreman saying: a wall is half-bricked when the bricks run out, and a house is half-built when the foreman runs out.',
      'Tip: the ladder is for the wall, not for the roof. There is no roof, and the ladder has been told.',
      'Joke: the tarp covers the one corner that is finished, which is how Levelright tells the roof from the rest of the house.',
      'The bricks stop at exactly two metres on every wall, and the gaps in the walls are exactly where the windows will be, one day.',
    ],
    parts: [
      { s: 'box', d: [8, 0.2, 8], at: [0, 0.1, 0], c: 'stone' },                                  // concrete slab
      { s: 'cyl', d: [0.12, 0.12, 4.0], at: [3.8, 2.2, 3.8], c: CREAM, seg: 8 },                  // corner post
      { s: 'cyl', d: [0.12, 0.12, 4.0], at: [-3.8, 2.2, 3.8], c: CREAM, seg: 8 },                 // corner post
      { s: 'cyl', d: [0.12, 0.12, 4.0], at: [3.8, 2.2, -3.8], c: CREAM, seg: 8 },                 // corner post
      { s: 'cyl', d: [0.12, 0.12, 4.0], at: [-3.8, 2.2, -3.8], c: CREAM, seg: 8 },                // corner post
      { s: 'cyl', d: [0.16, 0.12, 0.14], at: [3.8, 4.27, 3.8], c: 'wood-dark', seg: 8 },           // mushroom cap
      { s: 'cyl', d: [0.16, 0.12, 0.14], at: [-3.8, 4.27, 3.8], c: 'wood-dark', seg: 8 },          // mushroom cap
      { s: 'cyl', d: [0.16, 0.12, 0.14], at: [3.8, 4.27, -3.8], c: 'wood-dark', seg: 8 },          // mushroom cap
      { s: 'cyl', d: [0.16, 0.12, 0.14], at: [-3.8, 4.27, -3.8], c: 'wood-dark', seg: 8 },         // mushroom cap
      { s: 'cyl', d: [0.1, 0.1, 7.6], at: [0, 4.0, 3.8], rot: [0, 0, 90], c: CREAM, seg: 8 },      // beam
      { s: 'cyl', d: [0.1, 0.1, 7.6], at: [0, 4.0, -3.8], rot: [0, 0, 90], c: CREAM, seg: 8 },     // beam
      { s: 'cyl', d: [0.1, 0.1, 7.6], at: [3.8, 4.0, 0], rot: [90, 0, 0], c: CREAM, seg: 8 },      // beam
      { s: 'cyl', d: [0.1, 0.1, 7.6], at: [-3.8, 4.0, 0], rot: [90, 0, 0], c: CREAM, seg: 8 },     // beam
      { s: 'box', d: [2.4, 2.0, 0.3], at: [-2.6, 1.2, 3.8], c: 'sand' },                           // half-bricked wall
      { s: 'box', d: [2.4, 2.0, 0.3], at: [2.6, 1.2, 3.8], c: 'sand' },                            // half-bricked wall
      { s: 'box', d: [0.3, 2.0, 2.4], at: [-3.8, 1.2, -2.6], c: 'sand' },                          // half-bricked wall
      { s: 'box', d: [0.3, 2.0, 2.4], at: [-3.8, 1.2, 2.6], c: 'sand' },                           // half-bricked wall
      { s: 'box', d: [0.06, 3.0, 0.06], at: [-3.0, 1.61, 1.8], rot: [0, 0, 20], c: 'wood' },       // ladder rail
      { s: 'box', d: [0.06, 3.0, 0.06], at: [-3.0, 1.61, 2.2], rot: [0, 0, 20], c: 'wood' },       // ladder rail
      { s: 'box', d: [0.05, 0.04, 0.44], at: [-2.745, 0.905, 2.0], rot: [0, 0, 20], c: 'wood-light' }, // rung
      { s: 'box', d: [0.05, 0.04, 0.44], at: [-3.0, 1.61, 2.0], rot: [0, 0, 20], c: 'wood-light' },   // rung
      { s: 'box', d: [0.05, 0.04, 0.44], at: [-3.255, 2.315, 2.0], rot: [0, 0, 20], c: 'wood-light' }, // rung
      { s: 'box', d: [1.6, 0.03, 1.6], at: [3.1, 4.25, -3.1], rot: [0, 45, 8], c: PALE_BLUE },     // tarp
    ],
  },
  {
    id: 'site-hoarding', name: 'Levelright Hoarding', category: 'prop', uses: ['place'],
    tags: ['hoarding', 'hoardings', 'fence', 'board', 'panel', 'pale', 'blue', 'beige', 'site', 'construction', 'levelright', 'even-estates', 'gta'], emoji: [],
    footprint: { r: 2, h: 2.4 },
    about: 'Gnome Theft Auto: a Levelright hoarding. A pale blue panel 4 long and 2.4 tall with a beige band across the middle and two A-frame feet. No text.',
    examine: [
      'A pale blue board four long, with a beige stripe across the middle and two splayed feet that stop it falling on the gnome.',
      'Levelright saying: a hoarding should hide the work, and the work should hide the hoarding, and between them the view is perfectly level.',
      'Tip: read the board from the far side of the road. From the near side it is only a wall, and walls are for leaning on.',
      'Joke: the hoarding is painted in Even-Estates beige, which is the only colour that looks like nothing from both sides.',
      'Behind the board somebody has scratched a small spirit level into one foot. It reads level, which is more than the board does.',
    ],
    parts: [
      { s: 'box', d: [4.0, 2.4, 0.08], at: [0, 1.2, 0], c: PALE_BLUE },                             // panel
      { s: 'box', d: [4.0, 0.4, 0.01], at: [0, 1.2, 0.045], c: BEIGE },                             // beige band
      { s: 'box', d: [0.06, 1.28, 0.06], at: [1.4, 0.6, -0.27], rot: [21, 0, 0], c: 'iron-dark', mirror: true }, // foot
      { s: 'box', d: [2.8, 0.05, 0.05], at: [0, 0.4, -0.35], c: 'iron-dark' },                     // foot brace
    ],
  },
  {
    id: 'site-hoarding-gate', name: 'Levelright Gate', category: 'prop', uses: ['place'],
    tags: ['gate', 'gates', 'hoarding', 'mesh', 'open', 'post', 'pale', 'blue', 'site', 'construction', 'levelright', 'even-estates', 'gta'], emoji: [],
    pivots: { 'hinge-left': [-4, 0, 0], 'hinge-right': [4, 0, 0] },
    about: 'Gnome Theft Auto: a Levelright site gate. Two pale blue mesh leaves stand open in a V on hinge posts 8 apart. The gap between the posts is clear.',
    examine: [
      'Two pale blue gates stand open in a V, four long each, on posts two and a half tall, with nothing in the gap but the gap.',
      'Levelright saying: a gate that is open is a gate that is waiting, and a gate that waits has been waiting since the job began.',
      'Tip: the gap is clear, so walk through it. The gates are not locked. They are simply finished being open.',
      'Joke: the gates open for the Levelright van and close for everybody else, and the van has never once been seen arriving.',
      'A small brass plate on the left post says LEVEL IS KIND. Somebody has underlined KIND twice.',
    ],
    parts: [
      { s: 'cyl', d: [0.12, 0.12, 2.6], at: [-4, 1.3, 0], c: 'iron-dark', seg: 8 },              // hinge post
      { s: 'cyl', d: [0.12, 0.12, 2.6], at: [4, 1.3, 0], c: 'iron-dark', seg: 8 },               // hinge post
      { s: 'box', d: [4.0, 0.08, 0.06], at: [-3.316, 0.24, 1.88], rot: [0, -70, 0], c: PALE_BLUE }, // leaf rail
      { s: 'box', d: [4.0, 0.08, 0.06], at: [-3.316, 2.36, 1.88], rot: [0, -70, 0], c: PALE_BLUE }, // leaf rail
      { s: 'box', d: [0.04, 2.2, 0.04], at: [-3.996, 1.3, 0.0], c: PALE_BLUE },                   // leaf bar
      { s: 'box', d: [0.04, 2.2, 0.04], at: [-3.658, 1.3, 0.94], c: PALE_BLUE },                  // leaf bar
      { s: 'box', d: [0.04, 2.2, 0.04], at: [-3.316, 1.3, 1.88], c: PALE_BLUE },                  // leaf bar
      { s: 'box', d: [0.04, 2.2, 0.04], at: [-2.974, 1.3, 2.82], c: PALE_BLUE },                  // leaf bar
      { s: 'box', d: [0.04, 2.2, 0.04], at: [-2.632, 1.3, 3.76], c: PALE_BLUE },                  // leaf bar
      { s: 'box', d: [4.0, 0.08, 0.06], at: [3.316, 0.24, 1.88], rot: [0, -110, 0], c: PALE_BLUE }, // leaf rail
      { s: 'box', d: [4.0, 0.08, 0.06], at: [3.316, 2.36, 1.88], rot: [0, -110, 0], c: PALE_BLUE }, // leaf rail
      { s: 'box', d: [0.04, 2.2, 0.04], at: [4.0, 1.3, 0.0], c: PALE_BLUE },                      // leaf bar
      { s: 'box', d: [0.04, 2.2, 0.04], at: [3.658, 1.3, 0.94], c: PALE_BLUE },                   // leaf bar
      { s: 'box', d: [0.04, 2.2, 0.04], at: [3.316, 1.3, 1.88], c: PALE_BLUE },                   // leaf bar
      { s: 'box', d: [0.04, 2.2, 0.04], at: [2.974, 1.3, 2.82], c: PALE_BLUE },                   // leaf bar
      { s: 'box', d: [0.04, 2.2, 0.04], at: [2.632, 1.3, 3.76], c: PALE_BLUE },                   // leaf bar
    ],
  },
  {
    id: 'bucket-crane', name: 'Levelright Bucket Crane', category: 'prop', uses: ['place'],
    tags: ['crane', 'tower', 'bucket', 'jib', 'lattice', 'mast', 'counterweight', 'site', 'construction', 'levelright', 'even-estates', 'gta'], emoji: [],
    footprint: { r: 1.6, h: 14 },
    about: 'Gnome Theft Auto: a Levelright bucket crane. A yellow lattice tower about 14 tall on a concrete footing, a jib toward +z with a garden bucket on a cable, and a counterweight of bricks.',
    examine: [
      'A yellow lattice tower about fourteen tall, with a jib out toward the road and a garden bucket hanging from the end on one cable.',
      'Crane saying: a bucket that lifts a brick is a bucket with a job, and a bucket that lifts a gnome is a bucket with a story.',
      'Tip: stand well back from the jib when the bucket swings. The bucket is only a bucket, but it has been hit by worse.',
      'Joke: the counterweight is a stack of clay bricks, the only part of Levelright that has always been heavy enough.',
      'The motto is painted on the cab: LEVEL IS KIND. Nobody has ever said who it is kind to, or why the bucket is on a cable.',
    ],
    parts: [
      { s: 'box', d: [3, 0.5, 3], at: [0, 0.25, 0], c: 'stone' },                                  // footing
      { s: 'box', d: [0.1, 13.5, 0.1], at: [0.6, 7.25, 0.6], c: 'yellow', mirror: true },          // mast corner
      { s: 'box', d: [0.1, 13.5, 0.1], at: [0.6, 7.25, -0.6], c: 'yellow', mirror: true },         // mast corner
      { s: 'box', d: [1.2, 0.08, 0.08], at: [0, 2.5, 0.6], c: 'iron-dark' },                       // cross bar
      { s: 'box', d: [1.2, 0.08, 0.08], at: [0, 2.5, -0.6], c: 'iron-dark' },                      // cross bar
      { s: 'box', d: [1.2, 0.08, 0.08], at: [0, 6.5, 0.6], c: 'iron-dark' },                       // cross bar
      { s: 'box', d: [1.2, 0.08, 0.08], at: [0, 6.5, -0.6], c: 'iron-dark' },                      // cross bar
      { s: 'box', d: [1.2, 0.08, 0.08], at: [0, 10.5, 0.6], c: 'iron-dark' },                      // cross bar
      { s: 'box', d: [1.2, 0.08, 0.08], at: [0, 10.5, -0.6], c: 'iron-dark' },                     // cross bar
      { s: 'box', d: [0.9, 0.5, 0.9], at: [0, 14.25, 0], c: 'iron-dark' },                         // slewing head
      { s: 'box', d: [0.7, 0.7, 0.7], at: [0.6, 14.85, -0.5], c: 'yellow' },                       // cab
      { s: 'box', d: [0.3, 0.3, 12.0], at: [0, 14.65, 6.0], c: 'iron' },                           // jib
      { s: 'box', d: [0.3, 0.3, 4.0], at: [0, 14.65, -2.0], c: 'iron' },                           // counter-jib
      { s: 'box', d: [0.5, 0.3, 0.5], at: [0, 14.95, -3.5], c: 'clay' },                           // counterweight brick
      { s: 'box', d: [0.5, 0.3, 0.5], at: [0, 15.25, -3.5], c: 'clay' },                           // counterweight brick
      { s: 'box', d: [0.5, 0.3, 0.5], at: [0, 15.55, -3.5], c: 'clay' },                           // counterweight brick
      { s: 'box', d: [0.04, 0.8, 2.0], at: [0.2, 14.1, 4.5], c: PALE_BLUE },                       // sign board
      { s: 'cyl', d: [0.02, 0.02, 8.5], at: [0, 10.25, 11.5], c: 'iron-dark', seg: 4 },            // cable
      { s: 'cyl', d: [0.3, 0.22, 0.4], at: [0, 5.8, 11.5], c: 'green', seg: 10 },                  // garden bucket
      { s: 'ring', d: [0.25, 0.02], at: [0, 6.1, 11.5], c: 'iron-dark' },                           // bucket handle
    ],
  },
  {
    id: 'mushroom-girder-stack', name: 'Mushroom-stem Girders', category: 'prop', uses: ['place'],
    tags: ['girder', 'girders', 'mushroom', 'stem', 'beam', 'stack', 'timber', 'bearer', 'site', 'construction', 'levelright', 'even-estates', 'gta'], emoji: [],
    footprint: { r: 1, h: 1.2 },
    about: 'Gnome Theft Auto: a stack of four mushroom-stem girders with brown caps, lying on two timber bearers. About 1 tall. Plain colours.',
    examine: [
      'Four cream girders stacked on two timber bearers, each with a brown cap on one end, like mushrooms that have been measured and cut.',
      'Site saying: a stem is strong until it is cut, and a girder is strong until it is asked to hold a house.',
      'Tip: the caps are all on the same end, so lift from the other end, or the mushroom will tell you about it.',
      'Joke: the girders are numbered in order of length, which nobody has measured, so the numbers are only a guess.',
      'One cap has a neat bite out of it, about the size of a gnome tooth. Nobody on the site will say whose tooth it was.',
    ],
    parts: [
      { s: 'box', d: [0.3, 0.2, 1.6], at: [-1.8, 0.1, 0], c: 'wood' },                              // bearer
      { s: 'box', d: [0.3, 0.2, 1.6], at: [1.8, 0.1, 0], c: 'wood' },                               // bearer
      { s: 'cyl', d: [0.25, 0.25, 5.0], at: [0, 0.45, -0.27], rot: [0, 0, 90], c: 'mushroom-stem', seg: 8 }, // girder
      { s: 'cyl', d: [0.25, 0.25, 5.0], at: [0, 0.45, 0.27], rot: [0, 0, 90], c: 'mushroom-stem', seg: 8 },  // girder
      { s: 'cyl', d: [0.25, 0.25, 5.0], at: [0, 0.95, -0.27], rot: [0, 0, 90], c: 'mushroom-stem', seg: 8 }, // girder
      { s: 'cyl', d: [0.25, 0.25, 5.0], at: [0, 0.95, 0.27], rot: [0, 0, 90], c: 'mushroom-stem', seg: 8 },  // girder
      { s: 'cyl', d: [0.3, 0.3, 0.12], at: [2.56, 0.45, -0.27], rot: [0, 0, 90], c: 'wood-dark', seg: 8 },  // brown cap
      { s: 'cyl', d: [0.3, 0.3, 0.12], at: [2.56, 0.45, 0.27], rot: [0, 0, 90], c: 'wood-dark', seg: 8 },   // brown cap
      { s: 'cyl', d: [0.3, 0.3, 0.12], at: [2.56, 0.95, -0.27], rot: [0, 0, 90], c: 'wood-dark', seg: 8 },  // brown cap
      { s: 'cyl', d: [0.3, 0.3, 0.12], at: [2.56, 0.95, 0.27], rot: [0, 0, 90], c: 'wood-dark', seg: 8 },   // brown cap
    ],
  },
  {
    id: 'acorn-hard-hat', name: 'Acorn-cap Hard Hat', category: 'armor', uses: ['wear-head', 'place'],
    tags: ['hat', 'hard', 'helmet', 'acorn', 'cap', 'brim', 'spirit', 'level', 'site', 'construction', 'levelright', 'even-estates', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: an acorn-cap hard hat with a beige brim and a tiny spirit level in the band. About 0.35 across. Plain colours.',
    examine: [
      'A brown acorn cap with darker bands round it, worn as a hard hat, with a beige brim and a spirit level tucked in the band.',
      'Levelright saying: a hat with a spirit level in the band always knows which way is down, and which way is out of square.',
      'Tip: the brim keeps the rain off, and the acorn keeps the head on. Do not swap them, however tempting the shape.',
      'Joke: the hat is the right size for a gnome and the wrong size for every other site hat, which is how you know it is Levelright.',
      'Inside the band somebody has written a name in very small letters. It is not the name of the gnome who is wearing it.',
    ],
    parts: [
      { s: 'ball', d: [0.18], at: [0, 0.108, 0], scale: [1, 0.6, 1], c: 'wood', seg: 10 },           // acorn cap
      { s: 'cyl', d: [0.185, 0.185, 0.02], at: [0, 0.108, 0], c: 'wood-dark', seg: 10 },           // dark band
      { s: 'cyl', d: [0.177, 0.177, 0.02], at: [0, 0.14, 0], c: 'wood-dark', seg: 10 },           // dark band
      { s: 'cyl', d: [0.22, 0.22, 0.014], at: [0, 0.007, 0], c: 'sand', seg: 12 },                 // beige brim
      { s: 'box', d: [0.08, 0.025, 0.02], at: [0, 0.09, 0.195], c: 'yellow' },                     // spirit level
    ],
  },
  {
    id: 'site-plans-table', name: 'Plans Table', category: 'prop', uses: ['place'],
    tags: ['table', 'trestle', 'plans', 'blueprint', 'sheets', 'mug', 'pencil', 'ruler', 'site', 'construction', 'levelright', 'even-estates', 'gta'], emoji: [],
    footprint: { r: 1.1, h: 0.9 },
    about: 'Gnome Theft Auto: a Levelright trestle table about 2 long, with pale blue blueprint sheets, a mug, a pencil and a ruler. One sheet lies on the ground, held by a brick.',
    examine: [
      'A trestle table two long, covered in blueprint sheets, a mug, a pencil and a ruler, with one sheet lifting at the corner.',
      'Foreman saying: a plan on the table is a plan that is being looked at, and a plan on the ground is one that was looked at and dropped.',
      'Tip: hold the sheets down with the brick, not the mug. The mug is always empty, and the brick is the only thing holding the plan.',
      'Joke: the plans show every house in Even-Estates the same, and the only thing that changes is the date in the corner.',
      'The mug says WORLD\'S BEST LEVEL on the side, in a hand that has not been near a spirit level for years.',
    ],
    parts: [
      { s: 'box', d: [2.0, 0.06, 0.9], at: [0, 0.83, 0], c: 'wood-light' },                        // table top
      { s: 'box', d: [0.06, 0.8, 0.06], at: [0.8, 0.4, 0.35], c: 'wood-dark', mirror: true },       // trestle leg
      { s: 'box', d: [0.06, 0.8, 0.06], at: [0.8, 0.4, -0.35], c: 'wood-dark', mirror: true },      // trestle leg
      { s: 'box', d: [0.6, 0.005, 0.45], at: [-0.2, 0.8625, 0], c: PALE_BLUE },                    // blueprint sheet
      { s: 'box', d: [0.6, 0.005, 0.45], at: [0.5, 0.93, 0.2], rot: [12, 0, 0], c: PALE_BLUE },    // lifting sheet
      { s: 'box', d: [0.6, 0.005, 0.45], at: [1.3, 0.0025, 0.9], rot: [0, 20, 0], c: PALE_BLUE },  // fallen sheet
      { s: 'box', d: [0.22, 0.08, 0.11], at: [1.2, 0.045, 0.7], rot: [0, 20, 0], c: 'clay' },      // brick holding it
      { s: 'cyl', d: [0.045, 0.045, 0.1], at: [-0.7, 0.91, -0.25], c: 'blue', seg: 8 },             // mug
      { s: 'cyl', d: [0.01, 0.01, 0.2], at: [0.5, 0.87, -0.3], rot: [0, 0, 90], c: 'yellow', seg: 6 }, // pencil
      { s: 'box', d: [0.5, 0.01, 0.06], at: [-0.6, 0.865, 0.3], c: 'wood-light' },                  // ruler
    ],
  },
  {
    id: 'spirit-level-giant', name: 'Giant Spirit Level', category: 'prop', uses: ['place'],
    tags: ['spirit', 'level', 'bubble', 'vial', 'yellow', 'tool', 'site', 'construction', 'levelright', 'even-estates', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a gnome-scale spirit level 2 long, lying flat, with a yellow body and three pale green vials. Plain colours.',
    examine: [
      'A yellow bar two long with three pale green vials set in its top, each with a bubble that sits exactly in the middle and never moves.',
      'Levelright saying: a bubble in the middle is true, a bubble to the left is a lie, and a bubble to the right is a rumour.',
      'Tip: lay it on the wall, not the floor. The floor is never level, and the bubble will say so, loudly.',
      'Joke: the giant spirit level has checked the house, and the house has said nothing, which the foreman counts as a pass.',
      'Someone has pencilled a tally mark on one end for every wall that came out square. The tally has not moved since the job began.',
    ],
    parts: [
      { s: 'box', d: [2.0, 0.2, 0.1], at: [0, 0.1, 0], c: 'yellow' },                                // body
      { s: 'cyl', d: [0.035, 0.035, 0.06], at: [-0.6, 0.2, 0], c: 0xbfe8c8, seg: 8, alpha: 0.5 },   // vial
      { s: 'cyl', d: [0.035, 0.035, 0.06], at: [0, 0.2, 0], c: 0xbfe8c8, seg: 8, alpha: 0.5 },      // vial
      { s: 'cyl', d: [0.035, 0.035, 0.06], at: [0.6, 0.2, 0], c: 0xbfe8c8, seg: 8, alpha: 0.5 },    // vial
      { s: 'ball', d: [0.012], at: [-0.6, 0.205, 0], c: 'white', seg: 6 },                          // bubble
      { s: 'ball', d: [0.012], at: [0, 0.205, 0], c: 'white', seg: 6 },                             // bubble
      { s: 'ball', d: [0.012], at: [0.6, 0.205, 0], c: 'white', seg: 6 },                           // bubble
    ],
  },
  {
    id: 'clay-brick-pallet', name: 'Pallet of Clay Bricks', category: 'prop', uses: ['place'],
    tags: ['pallet', 'bricks', 'brick', 'clay', 'terracotta', 'stack', 'timber', 'strap', 'site', 'construction', 'levelright', 'even-estates', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a timber pallet about 1.2 square with a stack of terracotta bricks about 0.9 tall, strapped with two dark bands. Plain colours.',
    examine: [
      'A wooden pallet with a stack of terracotta bricks about as tall as a gnome\'s knee, strapped with two dark bands so it does not walk off.',
      'Site saying: a brick is a stone that has been to the Kiln and come back smaller, and a stack is a wall that has not made up its mind.',
      'Tip: take the top brick first. The bottom brick is the one holding up the stack, and the stack has opinions about that.',
      'Joke: the bricks are counted every week and every week there is one more, which the foreman says is the clay settling.',
      'A brick at the front has a thumbprint pressed into it. It is much smaller than any thumb on the site, and nobody admits to it.',
    ],
    parts: [
      { s: 'box', d: [1.2, 0.02, 0.18], at: [0, 0.11, -0.45], c: 'wood-light' },                  // pallet slat
      { s: 'box', d: [1.2, 0.02, 0.18], at: [0, 0.11, 0], c: 'wood-light' },                       // pallet slat
      { s: 'box', d: [1.2, 0.02, 0.18], at: [0, 0.11, 0.45], c: 'wood-light' },                    // pallet slat
      { s: 'box', d: [0.12, 0.1, 1.2], at: [-0.5, 0.05, 0], c: 'wood-dark' },                      // pallet runner
      { s: 'box', d: [0.12, 0.1, 1.2], at: [0, 0.05, 0], c: 'wood-dark' },                         // pallet runner
      { s: 'box', d: [0.12, 0.1, 1.2], at: [0.5, 0.05, 0], c: 'wood-dark' },                       // pallet runner
      { s: 'box', d: [0.5, 0.13, 0.24], at: [-0.02, 0.185, 0], c: 'terracotta' },                  // brick layer
      { s: 'box', d: [0.5, 0.13, 0.24], at: [0.02, 0.315, 0], c: 'clay' },                         // brick layer
      { s: 'box', d: [0.5, 0.13, 0.24], at: [-0.02, 0.445, 0], c: 'terracotta' },                  // brick layer
      { s: 'box', d: [0.5, 0.13, 0.24], at: [0.02, 0.575, 0], c: 'clay' },                         // brick layer
      { s: 'box', d: [0.5, 0.13, 0.24], at: [-0.02, 0.705, 0], c: 'terracotta' },                  // brick layer
      { s: 'box', d: [0.5, 0.13, 0.24], at: [0.02, 0.835, 0], c: 'clay' },                         // brick layer
      { s: 'box', d: [0.525, 0.02, 0.265], at: [0, 0.3, 0], c: 'black' },                          // strap
      { s: 'box', d: [0.525, 0.02, 0.265], at: [0, 0.7, 0], c: 'black' },                          // strap
    ],
  },
];
