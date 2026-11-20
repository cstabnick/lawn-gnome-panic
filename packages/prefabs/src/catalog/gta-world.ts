// Gnome Theft Auto: desert, airfield and tundra scenery (issue 1B1).
import type { PrefabDef } from '../types';

const CACTUS_GREEN = 0x4f8f4a;
const ICE_BLUE = 0xbfe6ef;
const ICE_BLUE_DEEP = 0xa8dcf0;
const CORE_BLUE = 0x9fe8ff;

export const GTA_WORLD: readonly PrefabDef[] = [
  {
    id: 'tall-cactus', name: 'Tall Cactus', category: 'prop', uses: ['place'],
    tags: ['cactus', 'saguaro', 'desert', 'tall', 'arms', 'green', 'spines'], emoji: [],
    footprint: { r: 0.6, h: 4 },
    about: 'Gnome Theft Auto: the Tall Cactus. A 4-tall green saguaro with a trunk, a rounded top and two upturned arms, each a horizontal stub and a vertical limb.',
    examine: [
      'A tall green cactus with two arms bent up like a gnome who has just remembered something important.',
      'Old saying: a cactus that waves at you is only being polite, and so is the cactus that does not.',
      'Tip: walk around it, not between the arms. The arms do not mind, but the spines have very long memories.',
      'Joke: it has been the tallest thing at Fort Sandpit for longer than anyone has been counting, and it still has not been asked to sit down.',
      'Carved near the base is a very small arrow pointing back the way you came. Nobody has ever explained it.',
    ],
    parts: [
      { s: 'cyl', d: [0.2, 0.2, 3.8], at: [0, 1.9, 0], c: CACTUS_GREEN, seg: 8 },                                  // trunk
      { s: 'ball', d: [0.2], at: [0, 3.8, 0], c: CACTUS_GREEN, seg: 8 },                                            // rounded top
      { s: 'cyl', d: [0.09, 0.09, 0.42], rot: [0, 0, 90], at: [0.4, 1.5, 0], c: CACTUS_GREEN, seg: 8, mirror: true }, // arm, stub
      { s: 'cyl', d: [0.09, 0.09, 0.9], at: [0.6, 1.95, 0], c: CACTUS_GREEN, seg: 8, mirror: true },               // arm, upturned
      { s: 'cone', d: [0.012, 0.05], at: [0, 2.5, 0.21], rot: [90, 0, 0], c: 'bone', seg: 4 },                     // spine
    ],
  },
  {
    id: 'desert-mesa', name: 'Desert Mesa', category: 'prop', uses: ['place'],
    tags: ['mesa', 'rock', 'sandstone', 'desert', 'layers', 'red', 'butte', 'stone'], emoji: [],
    footprint: { r: 5, h: 6 },
    about: 'Gnome Theft Auto: the Desert Mesa. A flat-topped rock, 10 wide and 6 tall, built of three stepped sandstone layers in clay-red, terracotta and dark clay.',
    examine: [
      'A flat-topped rock built in layers of red and tan sandstone, like a cake the desert has been eating from the top.',
      'Saying: the mesa was once the whole of the desert, until the rest of it was carried off in a hurry.',
      'Tip: climb only where the steps are cut. The other sides are far too smooth to hold a gnome, however well-meaning.',
      'Joke: the top is flat enough to play croquet on, and has been used for exactly that, by one very persistent crow.',
      'The bands in the stone are old colours laid down one season at a time. Gnomes read them like a book nobody has finished.',
    ],
    parts: [
      { s: 'box', d: [10, 2.5, 7], at: [0, 1.25, 0], c: 'clay-dark' },        // base layer
      { s: 'box', d: [8.2, 2.2, 5.8], at: [0, 3.6, 0], c: 'clay' },           // middle layer
      { s: 'box', d: [6.4, 1.3, 4.6], at: [0, 5.35, 0], c: 'terracotta' },   // top layer
    ],
  },
  {
    id: 'adobe-hut', name: 'Adobe Hut', category: 'prop', uses: ['place'],
    tags: ['adobe', 'hut', 'house', 'clay', 'mud', 'desert', 'roof', 'beams'], emoji: [],
    footprint: { r: 3.2, h: 4 },
    about: 'Gnome Theft Auto: the Adobe Hut. A 6 x 4 x 4 clay hut with a flat roof, a dark doorway on +z and beam ends poking out under the eaves.',
    examine: [
      'A squat clay hut with a flat roof, a dark doorway facing the path and a row of beam ends poking out under the eaves.',
      'Gnome saying: a hut built of mud keeps the sun out and the rain in, and the gnome inside decides which is which.',
      'Tip: knock on the wall before you go in. Adobe is mostly patience, and it does not like to be surprised.',
      'Joke: the flat roof is the best place in the desert for a nap, and the worst place for a nap that is interrupted.',
      'Someone has pressed a small handprint into the wall beside the door. It is still there, and nobody will say whose it is.',
    ],
    parts: [
      { s: 'box', d: [6, 4, 4], at: [0, 2, 0], c: 'sand' },                                         // walls
      { s: 'box', d: [6.2, 0.2, 4.2], at: [0, 4.1, 0], c: 'burlap' },                                // flat roof
      { s: 'box', d: [1.2, 2.0, 0.06], at: [0, 1.0, 2.02], c: 'black' },                             // doorway
      { s: 'box', d: [0.14, 0.14, 0.5], at: [-2.5, 3.92, 2.25], c: 'wood-dark' },                    // beam end
      { s: 'box', d: [0.14, 0.14, 0.5], at: [-1.25, 3.92, 2.25], c: 'wood-dark' },                   // beam end
      { s: 'box', d: [0.14, 0.14, 0.5], at: [0, 3.92, 2.25], c: 'wood-dark' },                       // beam end
      { s: 'box', d: [0.14, 0.14, 0.5], at: [1.25, 3.92, 2.25], c: 'wood-dark' },                    // beam end
      { s: 'box', d: [0.14, 0.14, 0.5], at: [2.5, 3.92, 2.25], c: 'wood-dark' },                     // beam end
    ],
  },
  {
    id: 'hangar', name: 'Hangar', category: 'prop', uses: ['place'],
    tags: ['hangar', 'shed', 'aircraft', 'plane', 'airfield', 'tin', 'shelter', 'corrugated'], emoji: [],
    footprint: { r: 12, h: 9 },
    about: 'Gnome Theft Auto: the Hangar. An aircraft shed 24 wide, 14 deep and 9 tall, with a stepped corrugated roof and a dark open gap on +z.',
    examine: [
      'A long shed of corrugated tin, stepped at the top like a cake with three layers, and open at the front like a mouth.',
      'Saying: what goes into the hangar comes out with wings, and the wings are not always the colour they went in.',
      'Tip: keep well clear of the open front when the Whirligig is warming up. The wind inside can lift a hat clean off a gnome.',
      'Joke: it was built for a bird, and the bird has never once been seen going in, though it is always heard coming out.',
      'Someone has chalked a row of numbers down the back wall. Nobody remembers what they count, and nobody dares to rub them off.',
    ],
    parts: [
      { s: 'box', d: [24, 7.5, 0.4], at: [0, 3.75, -6.8], c: 'iron' },                              // back wall
      { s: 'box', d: [0.4, 7.5, 14], at: [-11.8, 3.75, 0], c: 'iron' },                              // side wall
      { s: 'box', d: [0.4, 7.5, 14], at: [11.8, 3.75, 0], c: 'iron' },                              // side wall
      { s: 'box', d: [24.4, 0.5, 14.4], at: [0, 7.75, 0], c: 'slate' },                             // roof, step 1
      { s: 'box', d: [18.4, 0.7, 14.4], at: [0, 8.35, 0], c: 'iron-dark' },                         // roof, step 2
      { s: 'box', d: [10.4, 0.3, 14.4], at: [0, 8.85, 0], c: 'slate' },                             // roof, step 3
      { s: 'box', d: [2.2, 7.5, 0.4], at: [-10.9, 3.75, 6.8], c: 'iron', mirror: true },            // front pillars
      { s: 'box', d: [19.6, 1.2, 0.4], at: [0, 6.9, 6.8], c: 'iron' },                              // front lintel
      { s: 'box', d: [19.4, 6.3, 0.1], at: [0, 3.15, 6.5], c: 'black' },                            // dark gap
    ],
  },
  {
    id: 'windsock', name: 'Windsock', category: 'prop', uses: ['place'],
    tags: ['windsock', 'wind', 'sock', 'striped', 'airfield', 'pole', 'orange'], emoji: [],
    pivots: { sock: [0, 4.95, 0] },
    about: 'Gnome Theft Auto: the Windsock. A 5-tall pole with a short arm and an orange and white striped sock on a pivot named "sock" (the game swings it about y).',
    examine: [
      'A tall pole with an orange and white striped sock on a short arm, pointing wherever the wind has decided to go.',
      'Old rhyme: the sock that points up is calm, the sock that points down is sulking, and the sock that lies flat is asleep.',
      'Tip: check the sock before you fly. A sock that hangs limp in a gale means something has gone badly wrong somewhere.',
      'Joke: the sock is the only thing at Fort Sandpit that has never been told where to go, and it still knows the way.',
      'The stripes are painted by hand, one band at a time, and the bands are never quite the same width twice.',
    ],
    parts: [
      { s: 'cyl', d: [0.03, 0.03, 5], at: [0, 2.5, 0], c: 'wood', seg: 6 },                                  // pole
      { s: 'cyl', d: [0.02, 0.02, 0.5], rot: [0, 0, 90], at: [0.25, 4.95, 0], c: 'wood-dark', seg: 6 },     // arm
      { s: 'cone', d: [0.2, 0.9], rot: [0, 0, -90], at: [0.5, 4.95, 0], c: 'orange', seg: 8, group: 'sock' }, // sock
      { s: 'ring', d: [0.135, 0.02], rot: [0, 90, 0], at: [0.35, 4.95, 0], c: 'white', seg: 8, group: 'sock' }, // stripe
      { s: 'ring', d: [0.06, 0.015], rot: [0, 90, 0], at: [0.7, 4.95, 0], c: 'white', seg: 8, group: 'sock' },  // stripe
    ],
  },
  {
    id: 'snow-pine', name: 'Snow Pine', category: 'prop', uses: ['place'],
    tags: ['pine', 'tree', 'snow', 'winter', 'evergreen', 'cone', 'tundra', 'frost'], emoji: [],
    footprint: { r: 1, h: 7 },
    about: 'Gnome Theft Auto: the Snow Pine. A 7-tall cone pine: a short trunk, three dark green tiers and a top tier, each tier capped in snow-white.',
    examine: [
      'A tall cone-shaped pine with dark green tiers, each one capped in white snow like a cake nobody wants to cut first.',
      'Old saying: a pine is always green underneath and always white on top, and the gnomes who climb it are usually somewhere in between.',
      'Tip: shake the snow off the lower tiers before you pass beneath. A cold drop down the back of the neck is a poor welcome.',
      'Joke: it has been voted the most seasonal tree in Thatchford four years running, and the other trees are still arguing about it.',
      'A tiny carved gnome has been pinned near the very top, looking out over the snow with great and terrible patience.',
    ],
    parts: [
      { s: 'cyl', d: [0.1, 0.1, 1], at: [0, 0.5, 0], c: 'bark', seg: 8 },                                    // trunk
      { s: 'cone', d: [1, 2.2], at: [0, 2.1, 0], c: 'leaf-dark', seg: 8 },                                   // tier 1
      { s: 'cone', d: [0.31, 0.66], at: [0, 2.87, 0], c: 'white', seg: 8 },                                  // tier 1 snow cap
      { s: 'cone', d: [0.75, 1.9], at: [0, 3.65, 0], c: 'leaf-dark', seg: 8 },                              // tier 2
      { s: 'cone', d: [0.235, 0.57], at: [0, 4.315, 0], c: 'white', seg: 8 },                               // tier 2 snow cap
      { s: 'cone', d: [0.5, 1.6], at: [0, 5.0, 0], c: 'leaf-dark', seg: 8 },                                // tier 3
      { s: 'cone', d: [0.16, 0.48], at: [0, 5.56, 0], c: 'white', seg: 8 },                                 // tier 3 snow cap
      { s: 'cone', d: [0.28, 1.5], at: [0, 6.25, 0], c: 'leaf-dark', seg: 8 },                              // top tier
    ],
  },
  {
    id: 'snowman', name: 'Snowman', category: 'prop', uses: ['place'],
    tags: ['snowman', 'snow', 'carrot', 'winter', 'coal', 'hat', 'frost'], emoji: [],
    footprint: { r: 0.6, h: 2 },
    about: 'Gnome Theft Auto: the Snowman. Three white balls, a carrot nose, two coal eyes (mirrored pair) and a little red gnome hat. About 2 tall.',
    examine: [
      'Three balls of packed snow with a carrot nose, two lumps of coal for eyes and a little red hat set jauntily on top.',
      'Gnome saying: a snowman is only as honest as its carrot, and the carrot is always a little too honest.',
      'Tip: build it on the flat, not the slope. A snowman built on a hill leans toward the nearest gnome and says sorry.',
      'Joke: it is the only gnome in the snow who does not feel the cold, and the only one who keeps losing its hat.',
      'The coal eyes came from a fire nobody will admit to lighting. They still look a little warm.',
    ],
    parts: [
      { s: 'ball', d: [0.5], at: [0, 0.5, 0], c: 'white', seg: 10 },                                         // base ball
      { s: 'ball', d: [0.34], at: [0, 1.2, 0], c: 'white', seg: 10 },                                        // middle ball
      { s: 'ball', d: [0.24], at: [0, 1.76, 0], c: 'white', seg: 10 },                                       // head ball
      { s: 'cone', d: [0.04, 0.2], at: [0, 1.76, 0.34], rot: [90, 0, 0], c: 'orange', seg: 6 },              // carrot nose
      { s: 'ball', d: [0.035], at: [0.09, 1.82, 0.2], c: 'black', seg: 6, mirror: true },                    // coal eye
      { s: 'cyl', d: [0.28, 0.28, 0.04], at: [0, 2.02, 0], c: 'red', seg: 10 },                              // hat brim
      { s: 'cone', d: [0.17, 0.34], at: [0, 2.04, 0], c: 'red', seg: 8 },                                    // hat crown
      { s: 'ball', d: [0.03], at: [0, 1.25, 0.34], c: 'black', seg: 6 },                                     // button
      { s: 'ball', d: [0.03], at: [0, 1.1, 0.33], c: 'black', seg: 6 },                                      // button
    ],
  },
  {
    id: 'ice-rock', name: 'Ice Rock', category: 'prop', uses: ['place'],
    tags: ['ice', 'crystal', 'spire', 'blue', 'rock', 'tundra', 'frozen', 'glass'], emoji: [],
    footprint: { r: 1.6, h: 4 },
    about: 'Gnome Theft Auto: the Ice Rock. A cluster of pale blue crystal spires, the tallest 4 tall and the side spires tilted outward (mirrored pair).',
    examine: [
      'A cluster of pale blue crystal spires, the tallest taller than three gnomes, glinting faintly wherever the light gets in.',
      'Gnome saying: ice is water that has made up its mind, and once it has decided, it does not change for anyone.',
      'Tip: do not lick it. The Rain-school healers say a tongue will stick, and the healers are rarely wrong about tongues.',
      'Joke: it is very cold to the touch, and so are the gnomes who have touched it and then claimed they had not.',
      'A small bubble is trapped in the tallest spire. Gnomes take turns looking at it, and it has never once looked back.',
    ],
    parts: [
      { s: 'cone', d: [0.5, 4], at: [0, 2, 0], c: ICE_BLUE, seg: 5 },                                       // tallest spire
      { s: 'cone', d: [0.45, 2], rot: [0, 0, -15], at: [1.2, 1.1, 0], c: ICE_BLUE, seg: 5, mirror: true },   // side spire, tilted
      { s: 'cone', d: [0.3, 1.2], at: [0.2, 0.66, 0.8], c: ICE_BLUE_DEEP, seg: 5 },                        // front spire
      { s: 'ball', d: [0.2], at: [0, 0.25, 0], c: CORE_BLUE, glow: true, seg: 6 },                          // glowing core
    ],
  },
  {
    id: 'snow-lodge', name: 'Snow Lodge', category: 'prop', uses: ['place'],
    tags: ['lodge', 'cabin', 'log', 'snow', 'chimney', 'winter', 'tundra', 'hut'], emoji: [],
    footprint: { r: 4, h: 5 },
    about: 'Gnome Theft Auto: the Snow Lodge. A 7 x 5 x 5 log lodge with a thick snow roof, a stone chimney, a dark wooden door on +z and a lit window.',
    examine: [
      'A log lodge with a thick cap of snow on its roof, a stone chimney and a warm lit window beside a dark wooden door.',
      'Old rhyme: a lodge of logs keeps out the wind, and the wind keeps out the gnomes, and so everyone is content.',
      'Tip: knock the snow off the roof before the door freezes shut. A door that will not open is a cold way to spend a winter.',
      'Joke: the chimney smokes all winter, and the gnome inside says it is only steam from the kettle, which is never on.',
      'Scratched above the door are the marks of everyone who has ever spent a night here, and one space nobody will fill.',
    ],
    parts: [
      { s: 'box', d: [7, 3, 5], at: [0, 1.5, 0], c: 'wood' },                                             // walls
      { s: 'box', d: [7.1, 0.2, 5.1], at: [0, 2.9, 0], c: 'wood-dark' },                                   // frieze
      { s: 'box', d: [7.6, 0.9, 5.6], at: [0, 3.45, 0], c: 'white' },                                       // snow roof, lower
      { s: 'box', d: [6.4, 0.5, 4.4], at: [0, 4.15, 0], c: 'white' },                                       // snow roof, upper
      { s: 'box', d: [0.6, 1.8, 0.6], at: [-2, 3.9, -1], c: 'stone' },                                      // chimney
      { s: 'box', d: [0.9, 1.8, 0.08], at: [0, 0.9, 2.53], c: 'wood-dark' },                                // door
      { s: 'box', d: [0.7, 0.6, 0.06], at: [2, 1.8, 2.52], c: 'spark', glow: true },                        // lit window
    ],
  },
  {
    id: 'gta-ambulance', name: 'Glaze Clinic Ambulance', category: 'prop', uses: ['place'],
    tags: ['ambulance', 'clinic', 'glaze', 'van', 'siren', 'white', 'red', 'vehicle', 'rescue'],
    emoji: [],
    footprint: { r: 1.3, h: 1.5 },
    pivots: { siren: [0, 1.32, 0.3] },
    about: 'Gnome Theft Auto: the Glaze Clinic Ambulance. A white van 1.0 wide and 2.4 long with a red stripe and cross, four wheels, and a light bar (group siren, spins on its hub) that is red on one end and blue on the other. Nose toward +z.',
    examine: [
      'A small white van with a red cross on the side, a siren on the roof and a boot full of glue, string and very small clamps.',
      'Clinic motto, painted on the back doors: we will put you back together, mostly the right way round.',
      'Tip: if the siren is going, do not stand in the road. The Clinic is in a hurry, and a hurried driver is only a different way to get cracked.',
      'Joke: the paramedics say the hard part is finding all the pieces. The harder part is deciding whose ear is whose.',
      'A tin of terracotta touch-up paint sits on the dashboard, labelled: for the visible bits.',
    ],
    parts: [
      { s: 'box', d: [1.0, 0.7, 2.2], at: [0, 0.75, -0.05], c: 0xf4f4f0 },                              // body
      { s: 'box', d: [0.96, 0.5, 0.7], at: [0, 0.65, 1.0], c: 0xf4f4f0 },                              // bonnet
      { s: 'box', d: [0.9, 0.34, 0.06], at: [0, 1.0, 0.7], c: 0xa8dcf0, alpha: 0.7 },                  // windscreen
      { s: 'box', d: [0.06, 0.1, 1.9], at: [0.51, 0.75, -0.1], c: 0xd64541, mirror: true },            // red side stripe
      { s: 'box', d: [0.04, 0.34, 0.1], at: [0.52, 0.95, -0.4], c: 0xd64541, mirror: true },           // cross, upright
      { s: 'box', d: [0.04, 0.1, 0.34], at: [0.52, 0.95, -0.4], c: 0xd64541, mirror: true },           // cross, bar
      { s: 'box', d: [0.3, 0.06, 0.3], at: [0, 1.15, 0.3], c: 'iron-dark' },                            // light bar base
      { s: 'ball', d: [0.1], at: [0.14, 1.32, 0.3], c: 0xd64541, glow: true, seg: 6, group: 'siren' }, // siren, red
      { s: 'ball', d: [0.1], at: [-0.14, 1.32, 0.3], c: 0x4a7bd6, glow: true, seg: 6, group: 'siren' }, // siren, blue
      { s: 'cyl', d: [0.2, 0.2, 0.12], rot: [0, 0, 90], at: [0.5, 0.2, 0.8], c: 0x222222, seg: 10, mirror: true },  // front wheel
      { s: 'cyl', d: [0.2, 0.2, 0.12], rot: [0, 0, 90], at: [0.5, 0.2, -0.75], c: 0x222222, seg: 10, mirror: true }, // rear wheel
    ],
  },
  {
    id: 'gta-clay-pile', name: 'Cracked Gnome', category: 'prop', uses: ['place'],
    tint: 0x2f8a4a,
    tags: ['clay', 'shards', 'pile', 'cracked', 'broken', 'pottery', 'terracotta', 'gnome', 'body', 'remains'], emoji: [],
    about: 'Gnome Theft Auto: a Cracked Gnome. A gnome lying in clay pieces: the torso split in two, the head in halves with a loose beard, a cracked hat, a loose arm, two legs and a scatter of shards. About 1 wide. Tint sets the coat.',
    examine: [
      'A gnome in several pieces, the pointy hat a little way off and the beard somehow still in one piece.',
      'Clinic rule: every piece goes back in the van, even the ones that look like they belong to someone else.',
      'Tip: do not stand on it. The shards are sharp, and the gnome is still in there somewhere, being brave about it.',
      'Joke: the hat is always the only piece that survives. The hat, as ever, has no comment.',
      'A tiny label has been tied to one boot: handle with glue.',
    ],
    parts: [
      { s: 'box', d: [0.3, 0.12, 0.26], at: [0.05, 0.06, 0], rot: [0, 15, 4], c: 'tint' },                  // torso, left half
      { s: 'box', d: [0.26, 0.1, 0.24], at: [-0.22, 0.05, -0.1], rot: [0, -35, -8], c: 'tint' },           // torso, right half
      { s: 'ball', d: [0.15], at: [0.42, 0.08, 0.22], scale: [1, 0.55, 1], c: 0xf1c27d, seg: 6 },          // head, front half
      { s: 'ball', d: [0.12], at: [0.55, 0.05, 0.05], scale: [1, 0.5, 1], c: 0xf1c27d, seg: 6 },           // head, back half
      { s: 'box', d: [0.04, 0.02, 0.1], at: [0.42, 0.14, 0.22], rot: [0, 40, 0], c: 'black' },             // crack line
      { s: 'cone', d: [0.1, 0.2], at: [0.3, 0.14, 0.5], rot: [0, 0, 80], c: 0xe8e8e8, seg: 5 },             // beard
      { s: 'cone', d: [0.12, 0.26], at: [-0.45, 0.14, 0.3], rot: [0, 20, 75], c: 0xd93636, seg: 6 },       // hat, tipped over
      { s: 'cyl', d: [0.045, 0.045, 0.3], at: [-0.1, 0.045, 0.32], rot: [0, 0, 90], c: 'tint', seg: 6 },   // loose arm
      { s: 'cyl', d: [0.06, 0.06, 0.32], at: [-0.3, 0.09, -0.38], rot: [0, 0, 80], c: 0x4b3a2a, seg: 6 }, // leg, left
      { s: 'box', d: [0.12, 0.07, 0.1], at: [-0.48, 0.035, -0.4], c: 0x222222 },                           // boot, left
      { s: 'cyl', d: [0.06, 0.06, 0.28], at: [0.1, 0.09, -0.42], rot: [0, 0, 100], c: 0x4b3a2a, seg: 6 }, // leg, right
      { s: 'box', d: [0.12, 0.07, 0.1], at: [0.26, 0.035, -0.44], rot: [0, 25, 0], c: 0x222222 },          // boot, right
      { s: 'box', d: [0.12, 0.04, 0.09], at: [0.22, 0.02, 0.0], rot: [0, 50, 0], c: 'terracotta' },        // shard
      { s: 'box', d: [0.09, 0.04, 0.12], at: [-0.5, 0.02, -0.1], rot: [0, -20, 0], c: 'clay' },            // shard
      { s: 'box', d: [0.1, 0.035, 0.07], at: [0.0, 0.018, 0.5], rot: [0, 70, 0], c: 'clay-dark' },         // shard
      { s: 'box', d: [0.08, 0.03, 0.1], at: [0.55, 0.015, -0.2], rot: [0, 10, 0], c: 'terracotta' },       // shard
      { s: 'box', d: [0.07, 0.03, 0.06], at: [-0.1, 0.015, -0.15], rot: [0, 35, 0], c: 'clay' },           // shard
    ],
  },
  {
    id: 'gta-hospital', name: 'Glaze Clinic Hospital', category: 'prop', uses: ['place'],
    tags: ['hospital', 'clinic', 'glaze', 'building', 'cross', 'white', 'red', 'ambulance', 'respawn'], emoji: [],
    footprint: { r: 2.3, h: 2.6 },
    about: 'Gnome Theft Auto: the Glaze Clinic Hospital. A white hospital 4 wide, 3 deep and about 2.4 tall, a taller centre block, rows of windows, a red cross on the roof and over the door, a canopy and an ambulance bay. The door faces +z.',
    examine: [
      'A white hospital with a red cross on the roof and a very busy front door. The sign says: we will put you back together.',
      'Clinic motto, carved over the entrance: mostly the right way round.',
      'Tip: walk in cracked, walk out glued. Visiting hours are whenever somebody finds all the pieces.',
      'Joke: the waiting room is full of hats. Nobody is sure who is waiting for whom.',
      'A bin by the door is labelled spare ears. It is never empty, and nobody asks.',
    ],
    parts: [
      { s: 'box', d: [4, 1.6, 3], at: [0, 0.8, 0], c: 0xf0f0ea },                                    // main block
      { s: 'box', d: [1.8, 0.9, 2.4], at: [0, 2.05, -0.2], c: 0xe4e4dc },                          // upper block
      { s: 'box', d: [4.2, 0.1, 3.2], at: [0, 1.65, 0], c: 0x8a8a90 },                              // roof slab
      { s: 'box', d: [0.9, 0.6, 0.06], at: [0, 0.3, 1.52], c: 0x6fa8c8, alpha: 0.7 },               // front doors, glass
      { s: 'box', d: [1.5, 0.08, 0.7], at: [0, 0.75, 1.85], c: 0xd64541 },                          // canopy
      { s: 'box', d: [0.08, 0.75, 0.08], at: [-0.7, 0.38, 2.15], c: 'iron' },                       // canopy post
      { s: 'box', d: [0.08, 0.75, 0.08], at: [0.7, 0.38, 2.15], c: 'iron' },                        // canopy post
      { s: 'box', d: [0.18, 0.5, 0.06], at: [0, 1.2, 1.53], c: 0xd64541 },                          // cross over the door, upright
      { s: 'box', d: [0.5, 0.18, 0.06], at: [0, 1.2, 1.53], c: 0xd64541 },                          // cross over the door, bar
      { s: 'box', d: [0.16, 0.62, 0.16], at: [0, 2.78, -0.2], c: 0xd64541, glow: true },            // roof cross, upright
      { s: 'box', d: [0.62, 0.16, 0.16], at: [0, 2.78, -0.2], c: 0xd64541, glow: true },            // roof cross, bar
      { s: 'box', d: [0.4, 0.3, 0.06], at: [-1.4, 1.0, 1.52], c: 0xa8dcf0, alpha: 0.8 },            // window, ground floor
      { s: 'box', d: [0.4, 0.3, 0.06], at: [-0.8, 1.0, 1.52], c: 0xa8dcf0, alpha: 0.8 },
      { s: 'box', d: [0.4, 0.3, 0.06], at: [0.8, 1.0, 1.52], c: 0xa8dcf0, alpha: 0.8 },
      { s: 'box', d: [0.4, 0.3, 0.06], at: [1.4, 1.0, 1.52], c: 0xa8dcf0, alpha: 0.8 },
      { s: 'box', d: [0.4, 0.3, 0.06], at: [-1.4, 1.45, 1.52], c: 0xa8dcf0, alpha: 0.8 },            // window, first floor
      { s: 'box', d: [0.4, 0.3, 0.06], at: [-0.8, 1.45, 1.52], c: 0xa8dcf0, alpha: 0.8 },
      { s: 'box', d: [0.4, 0.3, 0.06], at: [0.8, 1.45, 1.52], c: 0xa8dcf0, alpha: 0.8 },
      { s: 'box', d: [0.4, 0.3, 0.06], at: [1.4, 1.45, 1.52], c: 0xa8dcf0, alpha: 0.8 },
      { s: 'box', d: [0.4, 0.3, 0.06], at: [-0.5, 2.1, 0.99], c: 0xa8dcf0, alpha: 0.8 },             // window, upper block
      { s: 'box', d: [0.4, 0.3, 0.06], at: [0.5, 2.1, 0.99], c: 0xa8dcf0, alpha: 0.8 },
    ],
  },
];
