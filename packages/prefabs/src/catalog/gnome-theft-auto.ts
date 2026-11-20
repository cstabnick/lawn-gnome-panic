// Gnome Theft Auto: water guns, mowers, Fort Sandpit props and achievement gear.
import type { PrefabDef } from '../types';
import { ZERO_TURN_DAMAGE } from './damage-stages';

const SQUIRT_ORANGE = 0xf08a24;
const TANK_BLUE = 0x5ec8ff;
const SOAKER_GREEN = 0x3fa34d;
const MOWER_BLUE = 0x2f64c9;
const TYRE = 0x222222;
const DECK_GREY = 0x3a3f44;
const OLIVE = 0x556b2f;
const SANDBAG_A = 0xc8b48a;
const SANDBAG_B = 0xb59f73;
const RAIN_YELLOW = 0xf2c230;
const LENS_BLUE = 0xa8dcf0;

export const GNOME_THEFT_AUTO: readonly PrefabDef[] = [
  {
    id: 'squirt-pistol', name: 'Squirt Pistol', category: 'weapon', uses: ['hold', 'shoot'],
    tags: ['water', 'gun', 'pistol', 'squirt', 'toy', 'plastic', 'ranged', 'shoot'], emoji: ['🔫'],
    tint: SQUIRT_ORANGE,
    grip: [0, 0.09, 0],
    about: 'Gnome Theft Auto: the Squirt Pistol. Upright, with a grip at the bottom, a chunky body that takes a tint, a short barrel pointing up with a nozzle, a clear blue tank on the back and a trigger.',
    examine: [
      'An orange plastic pistol with a clear blue tank strapped to the back, so the water is always visible and always about to leave.',
      'Old saying: a gnome who aims at the sky will soak the weather, and the weather never forgives him for it.',
      'Tip: fill the tank from the Spigot, not from the rain barrel by the Shed. The barrel water has a lid of leaves on it.',
      'Joke: nobody has ever been seriously hurt by it. Several have been seriously offended.',
      'The trigger is stiff on purpose. A gnome who pulled too hard once squirted his own boots at the Fort Sandpit gate.',
    ],
    parts: [
      { s: 'box', d: [0.05, 0.14, 0.06], at: [0, 0.07, 0], c: 'tint' },                              // grip
      { s: 'box', d: [0.06, 0.09, 0.1], at: [0, 0.2, 0], c: 'tint' },                                // body
      { s: 'cyl', d: [0.04, 0.04, 0.11], at: [0, 0.22, -0.09], c: TANK_BLUE, alpha: 0.6, seg: 10 },  // water tank
      { s: 'cyl', d: [0.016, 0.016, 0.08], at: [0, 0.28, 0], c: 'tint', seg: 8 },                    // barrel
      { s: 'cyl', d: [0.012, 0.016, 0.02], at: [0, 0.33, 0], c: 'white', seg: 8 },                   // nozzle
      { s: 'box', d: [0.012, 0.03, 0.02], at: [0, 0.13, 0.03], c: 'iron-dark' },                    // trigger
    ],
  },
  {
    id: 'super-soaker', name: 'Pump Soaker', category: 'weapon', uses: ['hold', 'shoot'],
    tags: ['water', 'gun', 'soaker', 'pump', 'squirt', 'big', 'ranged', 'shoot', 'green'], emoji: [],
    tint: SOAKER_GREEN,
    grip: [0, 0.1, 0],
    about: 'Gnome Theft Auto: the Pump Soaker. A long upright body that takes a tint, a big translucent blue tank on the back, a yellow pump handle under the barrel and a wide nozzle.',
    examine: [
      'A long green body with a fat clear tank on the back, a yellow pump handle slung under the barrel and a wide nozzle at the top.',
      'Saying from Fort Sandpit: a pump is only a pump until it has been worked twenty times, and then it is an argument.',
      'Tip: pump before you aim. Pumping after you aim gives the target a long, dignified look at you first.',
      'Joke: the tank holds more water than the Hat Watch has ever admitted to drinking in a single afternoon.',
      'The nozzle has a small dent where a tired gnome once used it to stir the tea. The tea was not improved.',
    ],
    parts: [
      { s: 'box', d: [0.07, 0.2, 0.09], at: [0, 0.1, 0], c: 'black' },                                   // grip
      { s: 'cyl', d: [0.04, 0.04, 0.36], at: [0, 0.38, 0], c: 'tint', seg: 10 },                         // body
      { s: 'ball', d: [0.09], at: [0, 0.4, -0.08], c: TANK_BLUE, alpha: 0.6, seg: 10 },                 // tank
      { s: 'cyl', d: [0.028, 0.02, 0.05], at: [0, 0.585, 0], c: 'tint', seg: 10 },                       // wide nozzle
      { s: 'box', d: [0.04, 0.04, 0.2], at: [0, 0.19, 0.1], c: 'yellow' },                               // pump handle
    ],
  },
  {
    id: 'zero-turn-mower', name: 'Zero-Turn Racer', category: 'prop', uses: ['place', 'sit'],
    damage: ZERO_TURN_DAMAGE,
    tags: ['mower', 'zero', 'turn', 'racer', 'ride-on', 'seat', 'wheel', 'lawn'], emoji: [],
    tint: MOWER_BLUE,
    seat: [0, 0.5, -0.3],
    pivots: {
      'wheel-0': [-0.55, 0.32, -0.6], 'wheel-1': [0.55, 0.32, -0.6],
      'wheel-2': [-0.5, 0.14, 0.8], 'wheel-3': [0.5, 0.14, 0.8],
      steer: [0, 0.6, -0.1],
    },
    about: 'Gnome Theft Auto: the Zero-Turn Racer. A low tinted deck with a bucket seat, two lap bars (group steer), an engine block behind, a dark mowing deck and two big rear and two small front wheels that spin (wheel-0 to wheel-3). Tint sets the deck.',
    examine: [
      'A low blue deck on fat rear wheels, with small casters at the front, a bucket seat, and an engine box humming away behind the driver.',
      'Turfton saying: the fastest mower is the one that turns on its own spot, and the slowest is the one that asks for a second go.',
      'Tip: pull both lap bars back together to stop. Pull only one, and enjoy a very interesting spin across the Verge.',
      'Joke: the seat is shaped for a gnome who has never once looked behind them, which is most of the gnomes in Turfton.',
      'The mowing deck underneath still has last week\'s grass stuck to it, and nobody has been brave enough to scrape it off.',
    ],
    parts: [
      { s: 'box', d: [0.9, 0.16, 1.6], at: [0, 0.42, 0.15], c: 'tint' },                              // deck
      { s: 'box', d: [0.95, 0.2, 0.9], at: [0, 0.24, 0.1], c: DECK_GREY },                              // mowing deck
      { s: 'box', d: [0.5, 0.16, 0.5], at: [0, 0.42, -0.3], c: 'black' },                              // seat cushion
      { s: 'box', d: [0.5, 0.6, 0.1], at: [0, 0.8, -0.6], c: 'black' },                                // backrest
      { s: 'box', d: [0.5, 0.3, 0.3], at: [0, 0.55, -0.85], c: 'iron-dark' },                          // engine block
      { s: 'cyl', d: [0.02, 0.02, 0.36], rot: [90, 0, 0], at: [-0.32, 0.6, -0.1], c: 'iron', seg: 6, group: 'steer', mirror: true }, // lap bars
      { s: 'cyl', d: [0.32, 0.32, 0.2], rot: [0, 0, 90], at: [-0.55, 0.32, -0.6], c: TYRE, seg: 14, group: 'wheel-0' },
      { s: 'cyl', d: [0.32, 0.32, 0.2], rot: [0, 0, 90], at: [0.55, 0.32, -0.6], c: TYRE, seg: 14, group: 'wheel-1' },
      { s: 'cyl', d: [0.14, 0.14, 0.12], rot: [0, 0, 90], at: [-0.5, 0.14, 0.8], c: TYRE, seg: 10, group: 'wheel-2' },
      { s: 'cyl', d: [0.14, 0.14, 0.12], rot: [0, 0, 90], at: [0.5, 0.14, 0.8], c: TYRE, seg: 10, group: 'wheel-3' },
    ],
  },
  {
    id: 'whirligig-mower', name: 'The Whirligig', category: 'prop', uses: ['place', 'sit'],
    tags: ['mower', 'flying', 'helicopter', 'rotor', 'whirligig', 'military', 'seat', 'skid'], emoji: [],
    seat: [0, 0.5, -0.2],
    pivots: {
      rotor: [0, 1.62, -0.6],
      'tail-rotor': [0, 0.3, -1.6],
    },
    about: 'Gnome Theft Auto: The Whirligig. An olive mower-helicopter on two skids, with a seat, a yellow windscreen, a mast with a spinning three-blade rotor (group rotor) and a tail boom with a tail rotor (group tail-rotor).',
    examine: [
      'An olive mower deck on two long skids, with a yellow windscreen in front of the seat and a mast rising from behind it like a lamppost.',
      'Saying: what goes up on a mast must come down on a lawn, and the lawn has never once complained about it.',
      'Tip: keep the blades clear of low branches and washing lines. Turfton washing lines are very proud and very long.',
      'Joke: this mower decided it would rather be a bird, and it is not at all shy about saying so, very loudly.',
      'The white star on each side was painted by a gnome at Fort Sandpit who was told it was a bird. Nobody believed him.',
    ],
    parts: [
      { s: 'box', d: [1.1, 0.3, 1.6], at: [0, 0.2, 0], c: OLIVE },                                       // deck
      { s: 'cyl', d: [0.035, 0.035, 1.5], rot: [90, 0, 0], at: [-0.4, 0.035, 0], c: 'iron-dark', seg: 6 }, // skid, left
      { s: 'cyl', d: [0.035, 0.035, 1.5], rot: [90, 0, 0], at: [0.4, 0.035, 0], c: 'iron-dark', seg: 6 },  // skid, right
      { s: 'box', d: [0.6, 0.16, 0.5], at: [0, 0.42, -0.2], c: 'black' },                                // seat cushion (top at 0.5)
      { s: 'box', d: [0.6, 0.4, 0.02], at: [0, 0.7, 0.1], c: 'yellow', alpha: 0.5 },                     // windscreen
      { s: 'cyl', d: [0.03, 0.03, 1.27], at: [0, 0.975, -0.6], c: 'iron', seg: 8 },                     // mast (top at 1.6)
      { s: 'box', d: [1.4, 0.02, 0.08], at: [0, 1.62, -0.6], c: 'iron-dark', group: 'rotor' },          // blade
      { s: 'box', d: [1.4, 0.02, 0.08], rot: [0, 120, 0], at: [0, 1.62, -0.6], c: 'iron-dark', group: 'rotor' }, // blade
      { s: 'box', d: [1.4, 0.02, 0.08], rot: [0, 240, 0], at: [0, 1.62, -0.6], c: 'iron-dark', group: 'rotor' }, // blade
      { s: 'box', d: [0.06, 0.06, 0.8], at: [0, 0.3, -1.2], c: OLIVE },                                 // tail boom
      { s: 'box', d: [0.03, 0.3, 0.02], at: [0, 0.3, -1.6], c: 'iron-dark', group: 'tail-rotor' },       // tail blade
      { s: 'box', d: [0.03, 0.3, 0.02], rot: [0, 0, 90], at: [0, 0.3, -1.6], c: 'iron-dark', group: 'tail-rotor' }, // tail blade
      { s: 'cyl', d: [0.11, 0.11, 0.01], rot: [0, 0, 90], at: [0.556, 0.2, 0], c: 'white', seg: 5, mirror: true }, // star decal
    ],
  },
  {
    id: 'sandbag-wall', name: 'Sandbag Wall', category: 'prop', uses: ['place'],
    tags: ['sandbag', 'wall', 'barrier', 'military', 'sand'], emoji: [],
    about: 'Gnome Theft Auto: the Sandbag Wall. Three rows of tan sandbags, 2 wide, 0.6 tall, front facing +z. Built from boxes; the two tans alternate.',
    examine: [
      'Three rows of tan sandbags, each one tied off at the ends like a pudding, stacked to about the height of a gnome\'s hat.',
      'Saying: a wall of sand is only as good as the gnomes behind it, and the gnomes behind it are usually sitting down.',
      'Tip: stamp each bag flat before stacking. A wobbly row makes the next row wobble, and the whole wall leans toward the enemy.',
      'Joke: it keeps out water guns better than anything else in Turfton, which is not saying much, but is still a point.',
      'Someone has written a name on the bottom bag in a neat hand. The sand says it was not them.',
    ],
    parts: [
      { s: 'box', d: [0.66, 0.2, 0.5], at: [-0.66, 0.1, 0], c: SANDBAG_A },
      { s: 'box', d: [0.66, 0.2, 0.5], at: [0, 0.1, 0], c: SANDBAG_B },
      { s: 'box', d: [0.66, 0.2, 0.5], at: [0.66, 0.1, 0], c: SANDBAG_A },
      { s: 'box', d: [0.66, 0.2, 0.5], at: [-0.66, 0.3, 0], c: SANDBAG_B },
      { s: 'box', d: [0.66, 0.2, 0.5], at: [0, 0.3, 0], c: SANDBAG_A },
      { s: 'box', d: [0.66, 0.2, 0.5], at: [0.66, 0.3, 0], c: SANDBAG_B },
      { s: 'box', d: [0.66, 0.2, 0.5], at: [-0.66, 0.5, 0], c: SANDBAG_A },
      { s: 'box', d: [0.66, 0.2, 0.5], at: [0, 0.5, 0], c: SANDBAG_B },
      { s: 'box', d: [0.66, 0.2, 0.5], at: [0.66, 0.5, 0], c: SANDBAG_A },
    ],
  },
  {
    id: 'watch-tower', name: 'Watch Tower', category: 'prop', uses: ['place'],
    tags: ['tower', 'watchtower', 'lookout', 'military', 'wood'], emoji: [],
    about: 'Gnome Theft Auto: the Watch Tower. Four wooden legs, a railed platform at 1.8, a pitched roof and a ladder up the front. About 2.6 tall.',
    examine: [
      'A tall wooden tower on four legs, with a railed platform, a steep pitched roof, and a ladder up the front that rattles in the wind.',
      'Saying: from the top of the tower you can see the whole of Turfton, and every gnome in it can see you looking.',
      'Tip: climb with both hands on the rungs and your eyes on the ladder. The view will wait, and it always does.',
      'Joke: the Hat Watch took this tower over in a hurry and has been very cross about the lack of a kettle ever since.',
      'The top step is worn pale. Gnomes say a lookout\'s boots are still up there, watching for something that never came.',
    ],
    parts: [
      { s: 'cyl', d: [0.06, 0.06, 1.8], at: [-0.55, 0.9, -0.55], c: 'wood-dark', seg: 8 },  // legs
      { s: 'cyl', d: [0.06, 0.06, 1.8], at: [0.55, 0.9, -0.55], c: 'wood-dark', seg: 8 },
      { s: 'cyl', d: [0.06, 0.06, 1.8], at: [-0.55, 0.9, 0.55], c: 'wood-dark', seg: 8 },
      { s: 'cyl', d: [0.06, 0.06, 1.8], at: [0.55, 0.9, 0.55], c: 'wood-dark', seg: 8 },
      { s: 'box', d: [1.3, 0.1, 1.3], at: [0, 1.8, 0], c: 'wood' },                              // platform
      { s: 'box', d: [1.3, 0.25, 0.04], at: [0, 1.975, -0.63], c: 'wood-light' },                 // rail, back
      { s: 'box', d: [1.3, 0.25, 0.04], at: [0, 1.975, 0.63], c: 'wood-light' },                  // rail, front
      { s: 'box', d: [0.04, 0.25, 1.3], at: [-0.63, 1.975, 0], c: 'wood-light' },                 // rail, left
      { s: 'box', d: [0.04, 0.25, 1.3], at: [0.63, 1.975, 0], c: 'wood-light' },                  // rail, right
      { s: 'cone', d: [0.9, 0.5], at: [0, 2.35, 0], c: 'wood-dark', seg: 4 },                     // roof
      { s: 'box', d: [0.04, 1.8, 0.04], at: [-0.15, 0.9, 0.75], c: 'wood-dark' },                 // ladder rail, left
      { s: 'box', d: [0.04, 1.8, 0.04], at: [0.15, 0.9, 0.75], c: 'wood-dark' },                  // ladder rail, right
      { s: 'box', d: [0.3, 0.03, 0.03], at: [0, 0.3, 0.75], c: 'wood-light' },                    // rung
      { s: 'box', d: [0.3, 0.03, 0.03], at: [0, 0.6, 0.75], c: 'wood-light' },                    // rung
      { s: 'box', d: [0.3, 0.03, 0.03], at: [0, 0.9, 0.75], c: 'wood-light' },                    // rung
      { s: 'box', d: [0.3, 0.03, 0.03], at: [0, 1.2, 0.75], c: 'wood-light' },                    // rung
      { s: 'box', d: [0.3, 0.03, 0.03], at: [0, 1.5, 0.75], c: 'wood-light' },                    // rung
    ],
  },
  {
    id: 'rain-hat', name: 'Rain Hat', category: 'armor', uses: ['wear-head'],
    tags: ['hat', 'rain', 'souwester', 'yellow'], emoji: [],
    about: 'Gnome Theft Auto: the Rain Hat. A yellow sou\'wester with a rounded crown and a wide brim that runs longer at the back. Sits like the Golf Visor.',
    examine: [
      'A yellow sou\'wester with a rounded crown and a broad brim that sticks out further at the back, to send the rain away from the neck.',
      'Saying: a good hat keeps the sky off the head, and a sou\'wester keeps the sky off the collar as well.',
      'Tip: tie it on before the rain starts. Gnomes who tie it on during the downpour are seen dripping for a week.',
      'Joke: it is the only hat in Turfton that makes a noise when wet, and the noise is mostly pride.',
      'The brim is stiff with old wax. Someone has written their name inside it, and then, underneath, the word "still".',
    ],
    parts: [
      { s: 'ring', d: [0.175, 0.028], at: [0, 0.03, 0], rot: [90, 0, 0], c: RAIN_YELLOW, seg: 12 },   // base ring
      { s: 'ball', d: [0.165], at: [0, 0.12, 0], scale: [1, 0.7, 1], c: RAIN_YELLOW, seg: 10 },       // crown
      { s: 'cyl', d: [0.22, 0.22, 0.02], at: [0, 0.035, -0.05], scale: [1, 1, 1.25], c: RAIN_YELLOW, seg: 12 }, // brim
    ],
  },
  {
    id: 'flight-goggles', name: 'Flight Goggles', category: 'armor', uses: ['wear-head'],
    tags: ['goggles', 'flight', 'pilot', 'strap'], emoji: [],
    about: 'Gnome Theft Auto: the Flight Goggles. A brown leather strap ring with two round light-blue lenses on brass rims at the front. Sits like the Golf Visor.',
    examine: [
      'A brown leather strap with two round blue lenses set in brass rims at the front, polished until they almost hum.',
      'Saying: whoever looks through the lenses sees the world a little further off, which is exactly what a pilot wants.',
      'Tip: adjust the strap before you go up. Goggles that slide down the nose make the view very blue and very short.',
      'Joke: wearing them does not make you a pilot, but it does give you a fine excuse to say "look up" and then point.',
      'One rim is a slightly different brass from the other. Nobody remembers which lens was swapped in a hurry.',
    ],
    parts: [
      { s: 'ring', d: [0.175, 0.028], at: [0, 0.03, 0], rot: [90, 0, 0], c: 'leather', seg: 12 },   // strap
      { s: 'cyl', d: [0.04, 0.04, 0.012], at: [0.07, 0.09, 0.17], rot: [90, 0, 0], c: LENS_BLUE, alpha: 0.6, seg: 10, mirror: true }, // lens
      { s: 'ring', d: [0.045, 0.012], at: [0.07, 0.09, 0.175], c: 'brass', seg: 10, mirror: true },   // brass rim
    ],
  },
  {
    id: 'water-tank-pack', name: 'Water Tank Pack', category: 'armor', uses: ['wear-back'],
    tags: ['tank', 'backpack', 'water', 'pack'], emoji: [],
    about: 'Gnome Theft Auto: the Water Tank Pack. A translucent blue tank in a dark frame, with two shoulder straps. Worn on the back like the Caddie Bag.',
    examine: [
      'A see-through blue tank in a dark frame, with two straps over the shoulders and a short tube at the base for letting water out.',
      'Saying: carry the water on your back and you will never be thirsty when the fight starts, only when it ends.',
      'Tip: fill the tank only to the line. Over-full, it sloshes, and everyone downwind learns the weight of your mistake.',
      'Joke: the tank is see-through so everyone can check how much water you have left, which is either honest or rude.',
      'One side of the frame is scorched. Nobody will say whether it was the Sun school or a particularly strong cup of tea.',
    ],
    parts: [
      { s: 'box', d: [0.24, 0.44, 0.03], at: [0, 0.22, -0.21], c: 'iron-dark' },                    // frame back
      { s: 'cyl', d: [0.09, 0.09, 0.36], at: [0, 0.22, -0.11], c: TANK_BLUE, alpha: 0.6, seg: 10 },  // tank
      { s: 'ring', d: [0.1, 0.012], at: [0, 0.04, -0.11], rot: [90, 0, 0], c: 'iron-dark', seg: 10 }, // tank rim, bottom
      { s: 'ring', d: [0.1, 0.012], at: [0, 0.4, -0.11], rot: [90, 0, 0], c: 'iron-dark', seg: 10 },  // tank rim, top
      { s: 'box', d: [0.03, 0.36, 0.02], at: [0.09, 0.22, 0.02], c: 'leather-dark', mirror: true },  // shoulder strap
    ],
  },
  {
    id: 'pocket-transistor', name: 'Pocket Transistor', category: 'tool', uses: ['hold', 'collect'],
    tags: ['radio', 'transistor', 'pocket', 'wireless', 'dial', 'music'], emoji: [],
    tint: 0xe8822e,
    grip: [0, 0.07, 0],
    about: 'Gnome Theft Auto: the Pocket Transistor. An upright orange box with a black speaker grille, a white dial strip and a telescopic aerial. The case takes a tint.',
    examine: [
      'A small orange box with a black speaker grille, a white dial strip across the front and a thin metal aerial that pulls out to the sky.',
      'Saying: turn the dial and the Tall-Eye in the box finds a song. Nobody has checked this. Nobody has needed to.',
      'Tip: hold it by the bottom and keep the aerial up, away from the sprinklers. The sprinklers also like to be heard.',
      'Joke: a gnome with a transistor always knows what the weather is doing, but never what the weather will say next.',
      'The dial strip has three numbers on it, and one of them has been scratched out by a thumb. The thumb was never identified.',
    ],
    parts: [
      { s: 'box', d: [0.1, 0.16, 0.04], at: [0, 0.08, 0], c: 'tint' },                                // case
      { s: 'cyl', d: [0.035, 0.035, 0.012], at: [0, 0.1, 0.02], rot: [90, 0, 0], c: 'black', seg: 10 }, // speaker grille
      { s: 'box', d: [0.06, 0.012, 0.012], at: [0, 0.14, 0.021], c: 'white' },                       // dial strip
      { s: 'cyl', d: [0.005, 0.005, 0.2], at: [0.035, 0.26, 0], c: 'silver', seg: 6 },                // aerial
    ],
  },
  {
    id: 'press-pass-cap', name: 'Press Pass Cap', category: 'armor', uses: ['wear-head'],
    tags: ['press', 'pass', 'cap', 'reporter', 'badge', 'radio'], emoji: [],
    tint: 0x3466b8,
    about: 'Gnome Theft Auto: the Press Pass Cap. A blue cloth cap with a short brim and a white laminated press badge on the front. The cap takes a tint.',
    examine: [
      'A blue cloth cap with a short brim and a white laminated badge pinned to the front, the kind a reporter wears to be let past the tape.',
      'Saying: a badge that says PRESS gets a gnome through most gates, and a badge that says PRESS on both sides gets them through the rest.',
      'Tip: keep the badge clean. A smudged badge is read as a question, and questions are not let past anything.',
      'Joke: the badge has a photograph on it. Nobody has ever been able to recognise the gnome in the photograph, including the gnome.',
      'Someone has written "ON AIR" on the back in very small letters, and no one remembers whether it was a warning or a boast.',
    ],
    parts: [
      { s: 'ball', d: [0.16], at: [0, 0.12, 0], scale: [1, 0.7, 1], c: 'tint', seg: 10 },                    // crown
      { s: 'cyl', d: [0.2, 0.2, 0.02], at: [0, 0.02, -0.05], scale: [1, 1, 1.25], c: 'tint', seg: 12 },    // brim
      { s: 'box', d: [0.07, 0.04, 0.005], at: [0, 0.12, 0.152], c: 'white' },                              // press badge
    ],
  },
];
