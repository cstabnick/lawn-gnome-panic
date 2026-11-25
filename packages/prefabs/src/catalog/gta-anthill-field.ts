// Gnome Theft Auto (E13): the Anthill Observatory, the ants' kit and Rootwell Field's airfield kit (control tower,
// windsock mast, runway lights and board, fuel cart). Scenery for games/gnome-theft-auto campus and field.
import type { PrefabDef, Part } from '../types';

// Sugar cubes in the crate: a grid of small white boxes, three columns by three rows by three layers.
const sugarCubes: Part[] = [];
for (const y of [0.125, 0.275, 0.425]) {
  for (const z of [-0.18, 0, 0.18]) {
    for (const x of [-0.2, 0, 0.2]) {
      sugarCubes.push({ s: 'box', d: [0.13, 0.13, 0.13], at: [x, y, z], c: 'white' });
    }
  }
}

export const GTA_ANTHILL_FIELD: readonly PrefabDef[] = [
  {
    id: 'anthill-observatory', name: 'Anthill Observatory', category: 'prop', uses: ['place'],
    tags: ['observatory', 'dome', 'telescope', 'anthill', 'mound', 'stars', 'astronomy', 'tower', 'gta', 'rootwell'], emoji: [],
    footprint: { r: 9, h: 11.5 },
    about: 'Gnome Theft Auto: the Anthill Observatory. Round, about 18 m across and 11 m tall: a pale stone drum under a white dome, a dark observing slit up the front, a brass telescope poking out of the slit, a porch door on +z and three round windows. Life-size metres.',
    examine: [
      'A round drum of pale stone under a white dome, with a dark slit up the front and a brass tube poking out of it like a nose.',
      'Saying: a level line is never drawn by a gnome. It is drawn by the stars, and then the stars are asked to wait.',
      'Tip: the door is on the porch. The telescope is the only reason to go in, and it does not like to be hurried.',
      'Joke: the rent to the ants is paid up through the dome, though nobody has yet found the stairs that lead up to it.',
      'Three round windows watch the lawn, and the brass star over the door has been polished so often it is now thinner than a star.',
    ],
    parts: [
      { s: 'cyl', d: [8.6, 8.6, 5.5], at: [0, 2.75, 0], c: 'stone', seg: 12 },                          // drum
      { s: 'ball', d: [8.0], at: [0, 5.5, 0], scale: [1, 0.6, 1], c: 'white', seg: 12 },                 // dome (squashed, base inside drum)
      { s: 'cyl', d: [0.05, 0.05, 1.2], at: [0, 10.8, 0], c: 'brass', seg: 6 },                         // dome finial
      { s: 'box', d: [1.0, 3.6, 0.04], at: [0, 8.27, 6.56], rot: [-49.4, 0, 0], c: 'ink' },           // observing slit, follows the dome
      { s: 'cyl', d: [0.16, 0.16, 1.6], at: [0, 8.88, 7.08], rot: [40.6, 0, 0], c: 'brass', seg: 8 }, // telescope out of the slit
      { s: 'box', d: [2.4, 3.0, 1.5], at: [0, 1.5, 9.25], c: 'stone' },                                 // door porch
      { s: 'box', d: [1.2, 2.2, 0.04], at: [0, 1.1, 10.03], c: 'wood-dark' },                           // door
      { s: 'ball', d: [0.2], at: [0, 3.25, 10.0], c: 'brass', seg: 6 },                                 // brass star over the door
      { s: 'cyl', d: [0.4, 0.4, 0.06], at: [-8.63, 3.0, 0], rot: [0, 0, 90], c: 'yellow', glow: true, seg: 8 }, // window, left
      { s: 'cyl', d: [0.4, 0.4, 0.06], at: [8.63, 3.0, 0], rot: [0, 0, 90], c: 'yellow', glow: true, seg: 8 },  // window, right
      { s: 'cyl', d: [0.4, 0.4, 0.06], at: [0, 3.0, -8.63], rot: [90, 0, 0], c: 'yellow', glow: true, seg: 8 }, // window, back
    ],
  },
  {
    id: 'anthill-telescope', name: 'Anthill Telescope', category: 'prop', uses: ['place'],
    tags: ['telescope', 'observatory', 'brass', 'tube', 'stars', 'lens', 'ladder', 'anthill', 'gta', 'rootwell'], emoji: [],
    footprint: { r: 3, h: 3 },
    about: 'Gnome Theft Auto: the Anthill Telescope. A cast pier with a fork mount, a long brass tube tilted up toward +z, an eyepiece at the low end, a dew cap at the high end and a little step ladder. About 6 m long. Life-size metres.',
    examine: [
      'A long brass tube on a dark green pier, tilted up at the sky with an eyepiece at its low end and a dew cap at its high end.',
      'Saying: look at the stars long enough and they will tell you where the level is. They never say it kindly.',
      'Tip: climb the little step ladder to reach the eyepiece, then let go of the ladder. The telescope will not hold still for you.',
      'Joke: it is the most exact instrument in Rootwell, and it was bought second-hand from a gnome who wanted to get home sooner.',
      'A cloth is folded over the dew cap. Someone is still waiting for the dew to tell them something.',
    ],
    parts: [
      { s: 'cyl', d: [1.0, 1.0, 0.3], at: [0, 0.15, 0], c: 'leaf-dark', seg: 10 },           // pier, base step
      { s: 'cyl', d: [0.7, 0.7, 0.6], at: [0, 0.6, 0], c: 'leaf-dark', seg: 10 },            // pier, middle step
      { s: 'cyl', d: [0.45, 0.45, 0.6], at: [0, 1.2, 0], c: 'leaf-dark', seg: 10 },         // pier, top step
      { s: 'box', d: [1.2, 0.4, 0.5], at: [0, 1.6, 0], c: 'iron-dark' },                    // fork saddle
      { s: 'box', d: [0.2, 1.25, 0.3], at: [0.5, 2.35, 0], c: 'iron-dark', mirror: true },  // fork arms
      { s: 'cyl', d: [0.12, 0.12, 5.0], at: [0, 2.6, 0], rot: [55, 0, 0], c: 'brass', seg: 8 },    // tube, tilted 35 degrees up toward +z
      { s: 'cyl', d: [0.16, 0.16, 0.6], at: [0, 0.993, -2.293], rot: [55, 0, 0], c: 'black', seg: 8 }, // eyepiece, low end
      { s: 'cyl', d: [0.17, 0.17, 0.5], at: [0, 4.179, 2.252], rot: [55, 0, 0], c: 'black', seg: 8 },   // dew cap, high end
      { s: 'box', d: [0.06, 1.0, 0.06], at: [0.6, 0.478, -1.346], rot: [17, 0, 0], c: 'wood' },        // ladder leg
      { s: 'box', d: [0.06, 1.0, 0.06], at: [1.2, 0.478, -1.346], rot: [17, 0, 0], c: 'wood' },
      { s: 'box', d: [0.06, 1.0, 0.06], at: [0.6, 0.478, -1.054], rot: [-17, 0, 0], c: 'wood' },
      { s: 'box', d: [0.06, 1.0, 0.06], at: [1.2, 0.478, -1.054], rot: [-17, 0, 0], c: 'wood' },
      { s: 'box', d: [0.7, 0.05, 0.4], at: [0.9, 0.3, -1.2], c: 'wood-light' },                        // ladder step, low
      { s: 'box', d: [0.7, 0.05, 0.4], at: [0.9, 0.6, -1.2], c: 'wood-light' },                        // ladder step, high
    ],
  },
  {
    id: 'ant-door', name: 'Ant Door', category: 'prop', uses: ['place'],
    tags: ['door', 'mound', 'anthill', 'ants', 'hatch', 'wood', 'knocker', 'letterbox', 'gta', 'rootwell'], emoji: [],
    footprint: { r: 1.2, h: 2.4 },
    about: 'Gnome Theft Auto: the Ant Door. A round plank door in a dark earth frame, set into the side of the mound, about 2.2 m tall, with iron hinges, a sugar-cube knocker and a brass letterbox slot. Front faces +z. Life-size metres.',
    examine: [
      'A round plank door in a dark earth frame, set into the side of the mound, with a sugar-cube knocker and a brass letterbox.',
      'Saying: a door in the mound opens on the first knock and stays shut on the second. Nobody has ever knocked a third time.',
      'Tip: knock with the sugar cube, not the fist. The ants can tell the difference, and they do not care for fists.',
      'Joke: the letterbox is only ever used for rent. It has never once been used for post, and it is still polished every morning.',
      'Not termites. Do not call them termites. They know. The door has been shut since the rent fell behind again.',
    ],
    parts: [
      { s: 'cyl', d: [1.1, 1.1, 0.3], at: [0, 1.1, 0], rot: [90, 0, 0], c: 'dirt', seg: 12 },     // earth frame ring
      { s: 'cyl', d: [0.9, 0.9, 0.04], at: [0, 1.1, 0.18], rot: [90, 0, 0], c: 'wood', seg: 12 }, // round plank door
      { s: 'box', d: [0.12, 0.2, 0.03], at: [-0.78, 0.75, 0.22], c: 'iron-dark' },                // hinge, low
      { s: 'box', d: [0.12, 0.2, 0.03], at: [-0.78, 1.45, 0.22], c: 'iron-dark' },                // hinge, high
      { s: 'box', d: [0.12, 0.12, 0.08], at: [0, 1.25, 0.25], c: 'white' },                       // sugar-cube knocker
      { s: 'box', d: [0.22, 0.05, 0.03], at: [0, 0.85, 0.22], c: 'brass' },                       // letterbox slot
    ],
  },
  {
    id: 'sugar-sack', name: 'Sugar Sack', category: 'prop', uses: ['place'],
    tags: ['sack', 'sugar', 'hessian', 'burlap', 'ants', 'rent', 'anthill', 'gta', 'rootwell'], emoji: [],
    about: 'Gnome Theft Auto: the Sugar Sack. A fat hessian sack about 0.9 m tall, tied at the neck with string, with white sugar cubes spilled at its foot. Life-size metres.',
    examine: [
      'A fat hessian sack tied at the neck with string, with white sugar cubes spilled across the ground at its foot.',
      'Saying: whoever has the sugar has the mound\'s attention, and the ants pay that attention in rent.',
      'Tip: do not untie the string. The ants notice, close their doors, and the rent goes up by a cube.',
      'Joke: the sack says SUGAR on it in faded letters, which is the only word in the whole university nobody argues about.',
      'The ants have never once spoken of the sack. They simply take a cube from the pile each morning and leave the rest.',
    ],
    parts: [
      { s: 'ball', d: [0.42], at: [0, 0.4, 0], scale: [1, 0.95, 1], c: 'burlap', seg: 8 },  // sack body
      { s: 'cyl', d: [0.1, 0.12, 0.2], at: [0, 0.85, 0], c: 'burlap', seg: 8 },            // tied neck
      { s: 'ring', d: [0.12, 0.02], at: [0, 0.85, 0], rot: [90, 0, 0], c: 'straw', seg: 8 }, // string tie
      { s: 'box', d: [0.07, 0.07, 0.07], at: [0.55, 0.035, 0.25], c: 'white' },           // spilled cube
      { s: 'box', d: [0.07, 0.07, 0.07], at: [0.62, 0.035, -0.12], c: 'white' },          // spilled cube
      { s: 'box', d: [0.07, 0.07, 0.07], at: [0.5, 0.035, -0.35], c: 'white' },           // spilled cube
    ],
  },
  {
    id: 'sugar-cube-crate', name: 'Sugar Cube Crate', category: 'container', uses: ['place'],
    tags: ['crate', 'box', 'sugar', 'cubes', 'wood', 'ants', 'rent', 'anthill', 'gta', 'rootwell'], emoji: [],
    about: 'Gnome Theft Auto: the Sugar Cube Crate. An open wooden crate about 0.8 m wide, packed to the rim with white sugar cubes in three layers. Life-size metres.',
    examine: [
      'An open wooden crate packed to the rim with white sugar cubes, stacked in neat layers that nobody has dared to disturb.',
      'Saying: a cube of sugar is a small promise, and a crate of them is a very large promise to the ants.',
      'Tip: take one cube from the top layer. The bottom layer is for the rent, and it is counted every morning.',
      'Joke: the Trencher keeps the university sugar under the refectory, but this is the crate the landlords come to check.',
      'Each cube is stamped with a tiny mound. Nobody has seen the stamp used, and nobody has been allowed to ask why.',
    ],
    parts: [
      { s: 'box', d: [0.7, 0.04, 0.56], at: [0, 0.02, 0], c: 'wood' },        // crate floor
      { s: 'box', d: [0.7, 0.5, 0.04], at: [0, 0.25, 0.28], c: 'wood' },      // front wall
      { s: 'box', d: [0.7, 0.5, 0.04], at: [0, 0.25, -0.28], c: 'wood' },     // back wall
      { s: 'box', d: [0.04, 0.5, 0.6], at: [0.38, 0.25, 0], c: 'wood-dark' }, // side wall, east
      { s: 'box', d: [0.04, 0.5, 0.6], at: [-0.38, 0.25, 0], c: 'wood-dark' }, // side wall, west
      ...sugarCubes,
    ],
  },
  {
    id: 'rootwell-ant', name: 'Rootwell Ant', category: 'prop', uses: ['place'],
    tags: ['ant', 'ants', 'insect', 'sugar', 'cube', 'rent', 'anthill', 'gta', 'rootwell'], emoji: [],
    about: 'Gnome Theft Auto: a Rootwell ant. A small garden ant, about 0.3 m long, dark red-brown, with three body segments, six legs, two bent antennae and a white sugar cube on its back. No footprint.',
    examine: [
      'A garden ant about the size of a thumb, dark red-brown, with a white sugar cube balanced on its back like a very small tax.',
      'Saying: an ant that carries a cube is only ever going home, and an ant that is not carrying one is already home.',
      'Tip: do not stand between an ant and its sugar. It will go around you, and it will remember where you were standing.',
      'Joke: the ants are the landlords here. This one is the rent collector, and it is in no hurry to collect from you.',
      'Not termites. Do not call them termites. They know.',
    ],
    parts: [
      { s: 'ball', d: [0.035], at: [0, 0.035, 0.1], c: 0x5a1f12, seg: 6 },          // head
      { s: 'ball', d: [0.04], at: [0, 0.04, 0.03], c: 0x5a1f12, seg: 6 },           // thorax
      { s: 'ball', d: [0.06], at: [0, 0.06, -0.07], c: 0x5a1f12, seg: 6 },         // abdomen
      { s: 'cyl', d: [0.008, 0.008, 0.16], at: [0.07, 0.047, 0.05], rot: [0, 0, 60], c: 0x5a1f12, seg: 4, mirror: true }, // legs, front pair
      { s: 'cyl', d: [0.008, 0.008, 0.16], at: [0.07, 0.047, 0], rot: [0, 0, 60], c: 0x5a1f12, seg: 4, mirror: true },    // legs, middle pair
      { s: 'cyl', d: [0.008, 0.008, 0.16], at: [0.07, 0.047, -0.06], rot: [0, 0, 60], c: 0x5a1f12, seg: 4, mirror: true }, // legs, back pair
      { s: 'cyl', d: [0.005, 0.005, 0.08], at: [0.02, 0.085, 0.12], rot: [40, 0, 0], c: 0x5a1f12, seg: 4, mirror: true },  // antennae
      { s: 'box', d: [0.04, 0.02, 0.04], at: [0, 0.125, -0.07], c: 'white' },      // sugar cube on its back
    ],
  },
  {
    id: 'rootwell-control-tower', name: 'Rootwell Control Tower', category: 'prop', uses: ['place'],
    tags: ['tower', 'control', 'airfield', 'runway', 'brick', 'beacon', 'radio', 'cab', 'aeronautics', 'gta', 'rootwell'], emoji: [],
    footprint: { r: 2.5, h: 10.5 },
    about: 'Gnome Theft Auto: the Rootwell Control Tower. A very small tower: a square brick stalk 7 m tall, a glazed cab on top with dark panes and a white frame, a flat roof, a little radio mast and a red beacon. Door on +z. Life-size metres.',
    examine: [
      'A very small tower of red brick with a glazed cab on top, a little radio mast and a red beacon that is never quite switched off.',
      'Saying: the tower can see every plane on the field and says nothing about any of them, which is the proper manner for a tower.',
      'Tip: the door is at the bottom and the stairs are very long. Nobody has yet climbed to the cab without stopping for tea.',
      'Joke: the field has one working plane and four students. The tower keeps track of all five, and has been asked to stop counting the students.',
      'Someone has written CLEARED on the inside of the cab glass in grease pencil, and nobody has cleared it since.',
    ],
    parts: [
      { s: 'box', d: [3.0, 7.0, 3.0], at: [0, 3.5, 0], c: 'terracotta' },                // brick stalk
      { s: 'box', d: [0.7, 1.6, 0.04], at: [0, 0.8, 1.53], c: 'wood-dark' },              // door
      { s: 'box', d: [4.0, 2.4, 4.0], at: [0, 8.15, 0], c: 'white' },                    // glazed cab
      { s: 'box', d: [3.2, 1.6, 0.03], at: [0, 8.15, 2.02], c: 'ink' },                  // cab pane, +z
      { s: 'box', d: [3.2, 1.6, 0.03], at: [0, 8.15, -2.02], c: 'ink' },                 // cab pane, -z
      { s: 'box', d: [0.03, 1.6, 3.2], at: [2.02, 8.15, 0], c: 'ink' },                  // cab pane, +x
      { s: 'box', d: [0.03, 1.6, 3.2], at: [-2.02, 8.15, 0], c: 'ink' },                 // cab pane, -x
      { s: 'box', d: [0.2, 2.4, 0.2], at: [2.0, 8.15, 2.0], c: 'white', mirror: true },  // cab corner posts, front
      { s: 'box', d: [0.2, 2.4, 0.2], at: [2.0, 8.15, -2.0], c: 'white', mirror: true }, // cab corner posts, back
      { s: 'box', d: [4.2, 0.2, 4.2], at: [0, 9.43, 0], c: 'white' },                    // flat roof
      { s: 'cyl', d: [0.03, 0.03, 1.0], at: [0.8, 10.0, 0.8], c: 'steel', seg: 6 },      // radio mast
      { s: 'ball', d: [0.08], at: [0.8, 10.6, 0.8], c: 'red', glow: true, seg: 6 },      // beacon
    ],
  },
  {
    id: 'windsock-mast', name: 'Windsock Mast', category: 'prop', uses: ['place'],
    tags: ['windsock', 'sock', 'mast', 'pole', 'wind', 'airfield', 'runway', 'stripes', 'flag', 'gta', 'rootwell'], emoji: [],
    footprint: { r: 0.5, h: 6.3 },
    about: 'Gnome Theft Auto: the Windsock Mast. A 6 m white pole on a stone base, a swivel and arm at the top and an orange and white striped windsock streaming toward +x. Life-size metres.',
    examine: [
      'A tall white pole on a stone base, topped by a swivel and a striped orange and white windsock streaming out on the breeze.',
      'Saying: a sock that points the way the wind blows has never once been wrong about the weather, only about where anyone is going.',
      'Tip: the closer the sock lies to the pole, the stronger the wind. A limp sock means it is time to go indoors and wait.',
      'Joke: the windsock is the only thing on Rootwell Field that has never once been late for take-off.',
      'A small brass plate on the base says the mast was a gift from the department, and that it was not a gift the department had asked for.',
    ],
    parts: [
      { s: 'cyl', d: [0.5, 0.5, 0.3], at: [0, 0.15, 0], c: 'stone', seg: 10 },           // concrete base
      { s: 'cyl', d: [0.06, 0.06, 6.0], at: [0, 3.2, 0], c: 'white', seg: 6 },           // pole
      { s: 'ball', d: [0.07], at: [0, 6.2, 0], c: 'steel', seg: 6 },                    // swivel
      { s: 'cyl', d: [0.025, 0.025, 0.9], at: [0.45, 6.2, 0], rot: [0, 0, 90], c: 'steel', seg: 4 }, // arm
      { s: 'ring', d: [0.2, 0.02], at: [0.9, 6.2, 0], rot: [0, 90, 0], c: 'white', seg: 8 },        // mouth hoop
      { s: 'cyl', d: [0.2, 0.2, 0.45], at: [1.2, 6.2, 0], rot: [0, 0, -98], c: 'orange', seg: 8 },  // sock, stripe 1
      { s: 'cyl', d: [0.16, 0.16, 0.45], at: [1.67, 6.2, 0], rot: [0, 0, -98], c: 'white', seg: 8 }, // sock, stripe 2
      { s: 'cyl', d: [0.13, 0.13, 0.45], at: [2.14, 6.2, 0], rot: [0, 0, -98], c: 'orange', seg: 8 }, // sock, stripe 3
      { s: 'cyl', d: [0.1, 0.1, 0.45], at: [2.6, 6.2, 0], rot: [0, 0, -98], c: 'white', seg: 8 },   // sock, tail
    ],
  },
  {
    id: 'runway-edge-light', name: 'Runway Edge Light', category: 'prop', uses: ['place'],
    tags: ['light', 'lamp', 'runway', 'edge', 'airfield', 'beacon', 'glow', 'post', 'gta', 'rootwell'], emoji: [],
    about: 'Gnome Theft Auto: a runway edge light. A squat grey frangible post about 0.45 m tall with a clear dome that glows pale yellow. Tint takes the dome colour (spark by default). Life-size metres.',
    examine: [
      'A squat grey post with a clear dome on top, glowing pale yellow to show the way down the runway in the dark.',
      'Saying: a light on the edge of the way is a promise that the way has an edge, which is more than the lawn can say.',
      'Tip: stand just inside the lights, not on them. The lights are for the planes, and the planes are not known for looking down.',
      'Joke: there are four lights on each side of the runway and only one plane. The plane has been very understanding about the arithmetic.',
      'The dome is cracked along one side, and someone has glued a small pale patch over the crack that is not, technically, a patch.',
    ],
    tint: 'spark',
    parts: [
      { s: 'cyl', d: [0.03, 0.03, 0.3], at: [0, 0.15, 0], c: 'stone', seg: 6 },             // frangible post
      { s: 'ball', d: [0.09], at: [0, 0.36, 0], c: 'tint', glow: true, seg: 8 },            // dome light
    ],
  },
  {
    id: 'runway-number-board', name: 'Runway Number Board', category: 'prop', uses: ['place'],
    tags: ['board', 'sign', 'runway', 'number', 'threshold', 'airfield', 'white', 'painted', 'gta', 'rootwell'], emoji: [],
    footprint: { r: 1.3, h: 2.2 },
    about: 'Gnome Theft Auto: the Runway Number Board. A painted board about 2.4 m wide and 1.2 m tall on two legs, white with a dark border, for a text plate of the runway number. Life-size metres.',
    examine: [
      'A white board on two legs, dark-bordered and plain-faced, waiting beside the threshold for someone to write a number on it.',
      'Saying: a number on the runway is a promise about which way to face, and gnomes have always been a little confused about promises.',
      'Tip: read the board from the end of the runway. From the side it says nothing useful at all.',
      'Joke: the number is written on by whichever student is holding the brush today, and the brush is always the same brush.',
      'The face is blank now. It was last painted with the number of the runway that was there before the runway was moved.',
    ],
    parts: [
      { s: 'box', d: [0.12, 1.02, 0.12], at: [0.9, 0.51, -0.06], c: 'wood' },                // leg, east
      { s: 'box', d: [0.12, 1.02, 0.12], at: [-0.9, 0.51, -0.06], c: 'wood' },               // leg, west
      { s: 'box', d: [2.4, 1.2, 0.06], at: [0, 1.6, 0], c: 'ink' },                           // dark border
      { s: 'box', d: [2.2, 1.0, 0.02], at: [0, 1.6, 0.035], c: 'white' },                    // plain white face
    ],
  },
  {
    id: 'fuel-cart', name: 'Fuel Cart', category: 'prop', uses: ['place'],
    tags: ['fuel', 'cart', 'trailer', 'tank', 'hose', 'airfield', 'runway', 'aviation', 'wheel', 'gta', 'rootwell'], emoji: [],
    footprint: { r: 1.4, h: 1.0 },
    about: 'Gnome Theft Auto: the Fuel Cart. A little aviation fuel trailer about 2.6 m long: a red tank lying along it, two wheels, a tow bar, a coiled hose reel at the back and a no smoking disc. Life-size metres.',
    examine: [
      'A low trailer with a fat red tank lying along it, two wheels, a tow bar at the front and a hose reel coiled up at the back.',
      'Saying: the red tank is for flying things, and the flying things are for going up, and the cart is for going nowhere in particular.',
      'Tip: wind the hose back onto the reel before you go. It is much easier to find the next time than it is to find the end.',
      'Joke: the NO SMOKING disc is painted on, and the cart has been told it is not allowed to take that personally.',
      'A gnome once tried to pull the cart up the hill with a rope. The cart has not been up the hill since, and neither has the gnome.',
    ],
    parts: [
      { s: 'box', d: [0.8, 0.12, 2.2], at: [0, 0.3, 0], c: 'iron-dark' },                       // chassis
      { s: 'cyl', d: [0.32, 0.32, 1.8], at: [0, 0.62, 0], rot: [90, 0, 0], c: 'red', seg: 10 }, // fuel tank
      { s: 'cyl', d: [0.28, 0.28, 0.12], at: [0.42, 0.28, 0], rot: [0, 0, 90], c: 'black', seg: 10, mirror: true }, // wheels
      { s: 'box', d: [0.08, 0.08, 0.7], at: [0, 0.3, 1.46], c: 'steel' },                     // tow bar
      { s: 'cyl', d: [0.16, 0.16, 0.14], at: [0, 0.5, -1.05], rot: [90, 0, 0], c: 'black', seg: 8 }, // hose reel
      { s: 'ring', d: [0.14, 0.04], at: [0, 0.5, -1.2], c: 'black', seg: 8 },                 // coiled hose
      { s: 'cyl', d: [0.12, 0.12, 0.03], at: [0.335, 0.62, 0], rot: [0, 0, 90], c: 'white', seg: 10 }, // no smoking disc
      { s: 'ring', d: [0.12, 0.015], at: [0.345, 0.62, 0], rot: [0, 90, 0], c: 'red', seg: 8 },  // no smoking ring
    ],
  },
];
