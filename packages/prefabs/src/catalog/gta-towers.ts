// Gnome Theft Auto: rooftop and facade gear for the downtown towers (tower styling, epic 1). Life-size scenery: 1 unit = 1
// metre, standing on y = 0, centred on x and z. Each piece has a `footprint`, so the size limit is 30 m. The game scales
// them per tower. Parts that sit on a roof or a wall sink into it or stand clearly proud of it (docs/rendering.md).
import type { PrefabDef } from '../types';

export const GTA_TOWERS: readonly PrefabDef[] = [
  {
    id: 'tower-water-tank', name: 'Rooftop Water Tank', category: 'prop', uses: ['place'],
    tags: ['water', 'tank', 'barrel', 'wood', 'roof', 'tower', 'ladder', 'gta'], emoji: [],
    tint: 0x8a5a3a,
    footprint: { r: 0.65, h: 2.05 },
    about: 'Gnome Theft Auto: the Rooftop Water Tank. A timber barrel tank on four legs, 1.2 across and about 2 m tall, with a cone lid and a ladder. Tint colours the barrel.',
    examine: [
      'A barrel of brown timber on four stubby legs, bound with dark hoops and capped with a pointed lid, like a very serious pudding.',
      'Saying: a tank on a roof is where the rain goes to wait for the gnomes, and the rain has never once been in a hurry.',
      'Tip: climb the little ladder slowly. The top rung is loose, and the water inside has heard about it.',
      'Joke: the tank has never held a drop of water it did not complain about, mostly about the temperature.',
      'Scratched into one hoop is a row of tally marks, one for every gnome who has tried to sit on the lid.',
    ],
    parts: [
      { s: 'box', d: [0.08, 0.6, 0.08], at: [0.45, 0.3, 0.45], c: 'iron-dark' },                     // legs
      { s: 'box', d: [0.08, 0.6, 0.08], at: [-0.45, 0.3, 0.45], c: 'iron-dark' },
      { s: 'box', d: [0.08, 0.6, 0.08], at: [0.45, 0.3, -0.45], c: 'iron-dark' },
      { s: 'box', d: [0.08, 0.6, 0.08], at: [-0.45, 0.3, -0.45], c: 'iron-dark' },
      { s: 'box', d: [0.9, 0.05, 0.05], at: [0, 0.25, -0.45], c: 'iron-dark' },                   // cross brace
      { s: 'cyl', d: [0.6, 0.6, 1.1], at: [0, 1.15, 0], c: 'tint', seg: 10 },                       // barrel
      { s: 'cyl', d: [0.62, 0.62, 0.05], at: [0, 0.9, 0], c: 'iron-dark', seg: 10 },                // hoops
      { s: 'cyl', d: [0.62, 0.62, 0.05], at: [0, 1.4, 0], c: 'iron-dark', seg: 10 },
      { s: 'cone', d: [0.65, 0.4], at: [0, 1.85, 0], c: 'wood-dark', seg: 10 },                    // cone lid, sunk 0.05
      { s: 'box', d: [0.04, 1.2, 0.04], at: [0.15, 0.6, 0.72], c: 'iron-dark' },                   // ladder rails
      { s: 'box', d: [0.04, 1.2, 0.04], at: [-0.15, 0.6, 0.72], c: 'iron-dark' },
      { s: 'box', d: [0.3, 0.03, 0.03], at: [0, 0.25, 0.72], c: 'iron-dark' },                     // rungs
      { s: 'box', d: [0.3, 0.03, 0.03], at: [0, 0.5, 0.72], c: 'iron-dark' },
      { s: 'box', d: [0.3, 0.03, 0.03], at: [0, 0.75, 0.72], c: 'iron-dark' },
      { s: 'box', d: [0.3, 0.03, 0.03], at: [0, 1.0, 0.72], c: 'iron-dark' },
    ],
  },
  {
    id: 'tower-hvac', name: 'Rooftop Air Unit', category: 'prop', uses: ['place'],
    tags: ['air', 'conditioning', 'hvac', 'unit', 'vent', 'fan', 'grille', 'roof', 'tower', 'gta'], emoji: [],
    footprint: { r: 0.6, h: 0.82 },
    about: 'Gnome Theft Auto: the Rooftop Air Unit. A grey box 1.2 x 0.7 x 0.8 on two skids, a round fan grille on top and three slatted vents on the front. Fixed colours, no tint.',
    examine: [
      'A square grey box on two skids, with a round dark grille on its lid and three slatted vents on its front, humming quietly to itself.',
      'Saying: the cold air comes out of the box and the warm air goes in, and no gnome has ever worked out which is the trick.',
      'Tip: stand well back from the vents. The air inside is colder than the tea and it will tell you so.',
      'Joke: the box makes a noise like a sleepy goose, which is why the pigeons sit on it and the gnomes do not.',
      'Someone has stuck a faded paper gnome to one side, with a note asking the box to please breathe a little more quietly.',
    ],
    parts: [
      { s: 'box', d: [0.1, 0.2, 0.9], at: [0.4, 0.1, 0], c: 'iron-dark' },                         // skids, sunk into the body
      { s: 'box', d: [0.1, 0.2, 0.9], at: [-0.4, 0.1, 0], c: 'iron-dark' },
      { s: 'box', d: [1.2, 0.7, 0.8], at: [0, 0.45, 0], c: 'steel' },                              // body
      { s: 'cyl', d: [0.25, 0.25, 0.04], at: [0, 0.8, 0], c: 'iron-dark', seg: 8 },                 // fan grille
      { s: 'box', d: [0.5, 0.05, 0.16], at: [0, 0.3, 0.45], c: 'ink' },                             // vent slots, 0.13 proud
      { s: 'box', d: [0.5, 0.05, 0.16], at: [0, 0.45, 0.45], c: 'ink' },
      { s: 'box', d: [0.5, 0.05, 0.16], at: [0, 0.6, 0.45], c: 'ink' },
    ],
  },
  {
    id: 'tower-dish', name: 'Satellite Dish', category: 'prop', uses: ['place'],
    tags: ['satellite', 'dish', 'antenna', 'receiver', 'sky', 'roof', 'tower', 'gta'], emoji: [],
    footprint: { r: 0.4, h: 0.95 },
    about: 'Gnome Theft Auto: the Satellite Dish. A flattened white dish on a short post, tilted 30 degrees up, with a feed arm and a receiver nub. About 0.95 m tall.',
    examine: [
      'A flat white dish on a short post, tilted up to face the sky, with a stubby arm reaching out and a little nub at its focus.',
      'Saying: the dish listens to the sky, and the sky, as everyone knows, only talks to the tallest gnomes.',
      'Tip: do not stand in front of the dish while it is listening. It is hard to tell whether it hears you or is just looking.',
      'Joke: the dish has heard everything the town has said and has kept very quiet about all of it, which is more than the town can say.',
      'The nub at the centre has a small crack, and one gnome swore he heard his grandmother singing badly through it.',
    ],
    parts: [
      { s: 'box', d: [0.4, 0.04, 0.4], at: [0, 0.02, 0], c: 'iron' },                              // base plate
      { s: 'cyl', d: [0.04, 0.04, 0.5], at: [0, 0.27, 0], c: 'iron-dark', seg: 6 },                 // post, sunk into the plate
      { s: 'ball', d: [0.4], at: [0, 0.6, 0.1], scale: [1, 1, 0.35], rot: [-30, 0, 0], c: 'white', seg: 8 }, // dish
      { s: 'box', d: [0.03, 0.03, 0.3], at: [0, 0.66, 0.3], rot: [-30, 0, 0], c: 'iron-dark' },     // feed arm
      { s: 'ball', d: [0.05], at: [0, 0.73, 0.33], c: 'iron-dark', seg: 6 },                        // receiver nub
    ],
  },
  {
    id: 'tower-mast', name: 'Radio Mast', category: 'prop', uses: ['place'],
    tags: ['radio', 'mast', 'pole', 'aerial', 'antenna', 'light', 'roof', 'tower', 'gta'], emoji: [],
    footprint: { r: 0.25, h: 3.0 },
    about: 'Gnome Theft Auto: the Radio Mast. A thin steel pole 3 m tall on a small base, with three cross-arms and a glowing red light on top. Fixed colours, no tint.',
    examine: [
      'A thin pole as tall as three gnomes, on a small square base, with three cross-arms and a red light winking at its very top.',
      'Saying: the tallest thing in the garden is the one that shouts the loudest, and the mast has been shouting since before the Charters.',
      'Tip: keep an eye on the red light. When it stops blinking, the mast is listening, and it is best to be somewhere else.',
      'Joke: the mast talks all day to the birds, who never reply, which makes it the tallest thing in the garden with no friends at all.',
      'Round its foot someone has painted a small arrow pointing at the sky, and under it, in smaller letters, the word nearly.',
    ],
    parts: [
      { s: 'box', d: [0.3, 0.1, 0.3], at: [0, 0.05, 0], c: 'iron-dark' },                          // base
      { s: 'cyl', d: [0.05, 0.05, 2.85], at: [0, 1.475, 0], c: 'steel', seg: 6 },                   // pole, sunk into the base
      { s: 'box', d: [0.5, 0.04, 0.04], at: [0, 2.3, 0], c: 'steel' },                             // cross-arms
      { s: 'box', d: [0.5, 0.04, 0.04], at: [0, 1.9, 0], c: 'steel' },
      { s: 'box', d: [0.5, 0.04, 0.04], at: [0, 1.5, 0], c: 'steel' },
      { s: 'ball', d: [0.08], at: [0, 2.92, 0], c: 0xff3030, glow: true, seg: 8 },                  // red light
    ],
  },
  {
    id: 'tower-helipad', name: 'Rooftop Helipad', category: 'prop', uses: ['place'],
    tags: ['helipad', 'helicopter', 'pad', 'landing', 'roof', 'tower', 'h', 'gta'], emoji: [],
    tint: 0xffc400,
    footprint: { r: 1.5, h: 0.2 },
    about: 'Gnome Theft Auto: the Rooftop Helipad. A round dark pad 3 m across with a white ring, a painted H in tint colour and four green rim lights. Tint colours the H.',
    examine: [
      'A round dark pad three gnomes across, with a white ring at its edge, a yellow H painted in the middle and four green lights on the rim.',
      'Saying: a pad marked with a letter is a place where something lands, and nothing has landed on this one in living memory.',
      'Tip: do not stand on the H. Gnomes who stand on the H are said to be lifted by the wind and set down somewhere damp.',
      'Joke: the green lights are very keen to help, and they flash at anybody who looks like they might be about to fly.',
      'A pebble shaped like a tiny Tall One boot sits in one corner of the pad, and the gnomes say it brings good fortune to whoever finds it.',
    ],
    parts: [
      { s: 'cyl', d: [1.5, 1.5, 0.12], at: [0, 0.06, 0], c: 0x3a3d42, seg: 12 },                      // pad
      { s: 'ring', d: [1.35, 0.02], at: [0, 0.14, 0], rot: [90, 0, 0], c: 'white', seg: 12 },        // white ring, bottom on the pad top
      { s: 'box', d: [0.12, 0.02, 0.9], at: [0.2, 0.13, 0], c: 'tint' },                            // H posts
      { s: 'box', d: [0.12, 0.02, 0.9], at: [-0.2, 0.13, 0], c: 'tint' },
      { s: 'box', d: [0.5, 0.02, 0.12], at: [0, 0.13, 0], c: 'tint' },                              // H bar
      { s: 'ball', d: [0.06], at: [1.35, 0.2, 0], c: 0x8fffa0, glow: true, seg: 6 },                // rim lights
      { s: 'ball', d: [0.06], at: [0, 0.2, 1.35], c: 0x8fffa0, glow: true, seg: 6 },
      { s: 'ball', d: [0.06], at: [-1.35, 0.2, 0], c: 0x8fffa0, glow: true, seg: 6 },
      { s: 'ball', d: [0.06], at: [0, 0.2, -1.35], c: 0x8fffa0, glow: true, seg: 6 },
    ],
  },
  {
    id: 'tower-gnome-hat', name: 'Gnome Hat Finial', category: 'prop', uses: ['place'],
    tags: ['hat', 'gnome', 'finial', 'cone', 'spire', 'tip', 'roof', 'tower', 'gta'], emoji: [],
    tint: 0xc62828,
    trim: 0xd4af37,
    footprint: { r: 0.62, h: 2.45 },
    about: 'Gnome Theft Auto: the Gnome Hat Finial. A giant gnome hat, 2.4 m tall and 1.2 across, bent over at the tip with a gold brim and a glowing bead. Tint colours the hat, trim the brim.',
    examine: [
      'A giant red gnome hat on a gold-banded brim, three stacked cones leaning a little further with each layer, until the tip droops like a tired cherry.',
      'Saying: a hat that droops at the top was worn by someone who thought too hard, and the tip still remembers the thinking.',
      'Tip: do not try to straighten the tip. It was bent that way by a very windy spring and has grown used to it.',
      'Joke: the first gnome to wear this hat could not see past the brim, which is why he is now the one who points the way.',
      'A small glowing bead sits on the tip, pale as a moon, and the gnomes say it is the last warm thought of the first hatter.',
    ],
    parts: [
      { s: 'cyl', d: [0.62, 0.62, 0.15], at: [0, 0.075, 0], c: 'trim', seg: 10 },                      // brim band
      { s: 'cyl', d: [0.45, 0.6, 0.8], at: [0, 0.5, 0], rot: [0, 0, 5], c: 'tint', seg: 8 },           // stacked pieces, each tilted more
      { s: 'cyl', d: [0.3, 0.45, 0.7], at: [-0.096, 1.243, 0], rot: [0, 0, 10], c: 'tint', seg: 8 },
      { s: 'cyl', d: [0.02, 0.3, 0.8], at: [-0.26, 1.974, 0], rot: [0, 0, 15], c: 'tint', seg: 8 },
      { s: 'ball', d: [0.08], at: [-0.36, 2.36, 0], c: 0xfff2c0, glow: true, seg: 6 },                // tip bead
    ],
  },
  {
    id: 'tower-planter', name: 'Roof Planter', category: 'prop', uses: ['place'],
    tags: ['planter', 'stone', 'shrub', 'hedge', 'box', 'green', 'roof', 'tower', 'gta'], emoji: [],
    footprint: { r: 0.62, h: 0.79 },
    about: 'Gnome Theft Auto: the Roof Planter. A long stone planter 1.2 x 0.4 x 0.6 with three round leafy shrubs on top. Fixed colours, no tint.',
    examine: [
      'A long grey stone planter with three round shrubs bunched on top, one dark and two bright, like a row of cabbages in good shoes.',
      'Saying: a planter on a roof is a garden that has climbed the stairs and decided to stay, and it is very proud of the climb.',
      'Tip: lean on the stone rather than the shrubs. The shrubs are still making up their minds about you.',
      'Joke: the shrubs have been clipped into balls so often that they bounce back when the wind pushes them, which the wind finds rude.',
      'Under the lowest shrub is a tiny stone bird, facing the wall, as if it has been told off and is sulking about it.',
    ],
    parts: [
      { s: 'box', d: [1.2, 0.4, 0.6], at: [0, 0.2, 0], c: 'stone' },                               // planter box
      { s: 'ball', d: [0.22], at: [-0.4, 0.57, 0], c: 'leaf', seg: 8 },                             // shrubs, sunk 0.05
      { s: 'ball', d: [0.22], at: [0, 0.57, 0], c: 'leaf-dark', seg: 8 },
      { s: 'ball', d: [0.22], at: [0.4, 0.57, 0], c: 'leaf', seg: 8 },
    ],
  },
  {
    id: 'tower-roof-tree', name: 'Potted Roof Tree', category: 'prop', uses: ['place'],
    tags: ['tree', 'potted', 'pot', 'terracotta', 'canopy', 'leaf', 'roof', 'tower', 'gta'], emoji: [],
    footprint: { r: 0.5, h: 1.6 },
    about: 'Gnome Theft Auto: the Potted Roof Tree. A square terracotta pot, a slim trunk and a canopy of three leaf balls, 1.6 m tall in total. Fixed colours, no tint.',
    examine: [
      'A square terracotta pot holding a slim tree, with a round green canopy made of three leaf balls, standing a little over one and a half gnomes tall.',
      'Saying: a tree in a pot has never seen the ground it came from, and it is still polite to every root that asks.',
      'Tip: water it from the side. From above, the leaves think it is raining and start a rumour about it.',
      'Joke: the tree has grown so high it has to look down to see the gutters, and it does not think much of them.',
      'A bird nest is tucked into the leaves at the back, with three pale eggs and a small note asking nobody to climb up.',
    ],
    parts: [
      { s: 'box', d: [0.5, 0.4, 0.5], at: [0, 0.2, 0], c: 'terracotta' },                          // pot
      { s: 'cyl', d: [0.06, 0.06, 0.6], at: [0, 0.67, 0], c: 'bark', seg: 6 },                      // trunk, sunk into the pot
      { s: 'ball', d: [0.4], at: [0, 1.2, 0], c: 'leaf', seg: 8 },                                  // canopy
      { s: 'ball', d: [0.28], at: [0.2, 1.05, 0.1], c: 'leaf-dark', seg: 8 },
      { s: 'ball', d: [0.26], at: [-0.2, 1.1, -0.12], c: 'leaf', seg: 8 },
    ],
  },
  {
    id: 'tower-pergola', name: 'Roof Pergola', category: 'prop', uses: ['place'],
    tags: ['pergola', 'arbour', 'shade', 'posts', 'beams', 'slats', 'vine', 'wood', 'roof', 'tower', 'gta'], emoji: [],
    footprint: { r: 1.0, h: 1.4 },
    about: 'Gnome Theft Auto: the Roof Pergola. Four timber posts, two beams, six slats and a trailing vine on a 2 x 2 m frame, 1.4 m tall. Fixed colours, no tint.',
    examine: [
      'A small wooden pergola of four posts, two beams and six slats, with a vine trailing from one corner, making a shady roof for two gnomes.',
      'Saying: a pergola is a roof that has forgotten how to be solid, and the shade under it is the only shade the gnomes fully trust.',
      'Tip: sit under the slats in the afternoon. The vine has been dropping leaves on the seats since spring and will not be told.',
      'Joke: the beams were pegged together with great care and a great deal of shouting, and they still do not agree about which way is up.',
      'Carved into the middle beam is a row of small notches, one for each summer, and the last notch is shaped like a sleeping snail.',
    ],
    parts: [
      { s: 'box', d: [0.08, 1.3, 0.08], at: [0.86, 0.65, 0.86], c: 'wood' },                       // posts
      { s: 'box', d: [0.08, 1.3, 0.08], at: [-0.86, 0.65, 0.86], c: 'wood' },
      { s: 'box', d: [0.08, 1.3, 0.08], at: [0.86, 0.65, -0.86], c: 'wood' },
      { s: 'box', d: [0.08, 1.3, 0.08], at: [-0.86, 0.65, -0.86], c: 'wood' },
      { s: 'box', d: [2.0, 0.1, 0.1], at: [0, 1.33, 0.86], c: 'wood-dark' },                      // beams, sunk into the posts
      { s: 'box', d: [2.0, 0.1, 0.1], at: [0, 1.33, -0.86], c: 'wood-dark' },
      { s: 'box', d: [0.2, 0.04, 1.8], at: [-0.8, 1.38, 0], c: 'wood-light' },                     // slats, resting on the beams
      { s: 'box', d: [0.2, 0.04, 1.8], at: [-0.5, 1.38, 0], c: 'wood-light' },
      { s: 'box', d: [0.2, 0.04, 1.8], at: [-0.2, 1.38, 0], c: 'wood-light' },
      { s: 'box', d: [0.2, 0.04, 1.8], at: [0.2, 1.38, 0], c: 'wood-light' },
      { s: 'box', d: [0.2, 0.04, 1.8], at: [0.5, 1.38, 0], c: 'wood-light' },
      { s: 'box', d: [0.2, 0.04, 1.8], at: [0.8, 1.38, 0], c: 'wood-light' },
      { s: 'ball', d: [0.12], at: [-0.9, 1.2, 0.9], c: 'leaf-dark', seg: 6 },                       // vines on corners
      { s: 'ball', d: [0.12], at: [0.9, 1.15, -0.9], c: 'moss', seg: 6 },
    ],
  },
  {
    id: 'tower-scaffold', name: 'Scaffold Bay', category: 'prop', uses: ['place'],
    tags: ['scaffold', 'scaffolding', 'bay', 'plank', 'rail', 'brace', 'metal', 'roof', 'tower', 'gta'], emoji: [],
    tint: 0xc8a26a,
    footprint: { r: 1.0, h: 2.0 },
    about: 'Gnome Theft Auto: the Scaffold Bay. One scaffolding bay 2 m wide and 2 m tall, with a plank deck, a front guard rail and a diagonal brace. Tint colours the planks; the frame is grey.',
    examine: [
      'A single bay of grey scaffold, two gnomes wide and two tall, with a plank deck, a guard rail along the front and one diagonal brace.',
      'Saying: scaffold is a ladder that was left out by someone very large, and it has never learned how to stop being a ladder.',
      'Tip: test each plank before you step on it. The deck is loose at one end, and the loose end is always the one you chose.',
      'Joke: the guard rail is there to stop gnomes falling off, and it does this by being exactly the height to trip over.',
      'Chalked on one upright in careful letters: Not a climbing frame. The letters have been added to twice, by people who disagree.',
    ],
    parts: [
      { s: 'cyl', d: [0.03, 0.03, 2.0], at: [0.95, 1.0, 0.25], c: 0x9aa0a6, seg: 6 },              // uprights
      { s: 'cyl', d: [0.03, 0.03, 2.0], at: [-0.95, 1.0, 0.25], c: 0x9aa0a6, seg: 6 },
      { s: 'cyl', d: [0.03, 0.03, 2.0], at: [0.95, 1.0, -0.25], c: 0x9aa0a6, seg: 6 },
      { s: 'cyl', d: [0.03, 0.03, 2.0], at: [-0.95, 1.0, -0.25], c: 0x9aa0a6, seg: 6 },
      { s: 'cyl', d: [0.025, 0.025, 1.9], at: [0, 1.95, 0.25], rot: [0, 0, 90], c: 0x9aa0a6, seg: 6 }, // ledgers, front and back
      { s: 'cyl', d: [0.025, 0.025, 1.9], at: [0, 1.95, -0.25], rot: [0, 0, 90], c: 0x9aa0a6, seg: 6 },
      { s: 'box', d: [1.9, 0.05, 0.5], at: [0, 1.9, 0], c: 'tint' },                                  // plank deck, top 1.925
      { s: 'cyl', d: [0.02, 0.02, 1.9], at: [0, 1.0, 0.25], rot: [0, 0, 90], c: 0x9aa0a6, seg: 6 },   // front guard rail
      { s: 'cyl', d: [0.015, 0.015, 1.4], at: [0, 1.0, 0.25], rot: [0, 0, 45], c: 0x9aa0a6, seg: 6 }, // diagonal brace
    ],
  },
  {
    id: 'tower-clock', name: 'Rooftop Clock', category: 'prop', uses: ['place'],
    tags: ['clock', 'tower', 'face', 'hands', 'stone', 'pyramid', 'roof', 'gta'], emoji: [],
    tint: 0x2c5e7a,
    footprint: { r: 0.72, h: 1.7 },
    about: 'Gnome Theft Auto: the Rooftop Clock. A stone box 1.2 m square with a clock face on each side and a small pyramid roof, 1.7 m tall. Tint colours the roof.',
    examine: [
      'A stone clock box as tall as a gnome and a half, with a clock face on each side, dark hands on cream discs and a small blue pyramid hat.',
      'Saying: a clock on a roof counts the hours the gnomes spend looking up at it, and every one of those hours is written down.',
      'Tip: check the time on the face that catches the sun. The other faces are always a little wrong, and nobody says which one is right.',
      'Joke: the four faces each show a different time, which the gnomes say is the clock being polite to everybody at once.',
      'The hands on the north face have been stuck at the same minute since before anybody remembers, and nobody has been brave enough to move them.',
    ],
    parts: [
      { s: 'box', d: [1.2, 1.2, 1.2], at: [0, 0.6, 0], c: 0xe8e4dc },                                   // clock box
      { s: 'cyl', d: [0.45, 0.45, 0.16], at: [0, 0.6, 0.64], rot: [90, 0, 0], c: 'chalk', seg: 12 },    // faces, 0.12 proud
      { s: 'cyl', d: [0.45, 0.45, 0.16], at: [0, 0.6, -0.64], rot: [90, 0, 0], c: 'chalk', seg: 12 },
      { s: 'cyl', d: [0.45, 0.45, 0.16], at: [-0.64, 0.6, 0], rot: [0, 0, 90], c: 'chalk', seg: 12 },
      { s: 'cyl', d: [0.45, 0.45, 0.16], at: [0.64, 0.6, 0], rot: [0, 0, 90], c: 'chalk', seg: 12 },
      { s: 'box', d: [0.05, 0.25, 0.02], at: [0, 0.725, 0.76], c: 'ink' },                             // hands, 0.03 in front
      { s: 'box', d: [0.04, 0.35, 0.02], at: [0.152, 0.6875, 0.76], rot: [0, 0, -60], c: 'ink' },
      { s: 'box', d: [0.05, 0.25, 0.02], at: [0, 0.725, -0.76], c: 'ink' },
      { s: 'box', d: [0.04, 0.35, 0.02], at: [-0.152, 0.6875, -0.76], rot: [0, 0, 60], c: 'ink' },
      { s: 'box', d: [0.02, 0.25, 0.05], at: [0.76, 0.725, 0], c: 'ink' },
      { s: 'box', d: [0.02, 0.35, 0.04], at: [0.76, 0.6875, 0.152], rot: [60, 0, 0], c: 'ink' },
      { s: 'box', d: [0.02, 0.25, 0.05], at: [-0.76, 0.725, 0], c: 'ink' },
      { s: 'box', d: [0.02, 0.35, 0.04], at: [-0.76, 0.6875, -0.152], rot: [-60, 0, 0], c: 'ink' },
      { s: 'cone', d: [0.85, 0.55], at: [0, 1.425, 0], rot: [0, 45, 0], c: 'tint', seg: 4 },           // pyramid roof, sunk 0.05
    ],
  },
];
