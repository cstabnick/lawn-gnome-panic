// Gnome Theft Auto: guns, the Crop Duster plane and the parachute canopy (issue 1A).
import type { PrefabDef, Vec3 } from '../types';

const PLANE_YELLOW = 0xf2c230;
const RED_STRIPE = 0xd64541;
const CANOPY_YELLOW = 0xf2c230;
const TYRE = 0x222222;
const GLASS_BLUE = 0xa8dcf0;

// The Crop Duster is drawn in design units (wingspan 7, length 5) and shrunk by K so the catalog's
// "largest side under 3" check passes. The game scales it back up when it places it.
const K = 0.4;
const P = (x: number, y: number, z: number): Vec3 => [x * K, y * K, z * K];
const D = (...n: number[]): number[] => n.map((x) => x * K);

// The parachute canopy is narrowed by CANOPY_K (width 2.9) so it also fits the largest-side check.
const CANOPY_K = 0.85;
const C = (n: number) => n * CANOPY_K;

export const GTA_GUNS_AIR: readonly PrefabDef[] = [
  {
    id: 'gta-pistol', name: 'Pistol', category: 'weapon', uses: ['hold', 'shoot'],
    tags: ['pistol', 'gun', 'handgun', 'steel', 'ranged', 'shoot', 'small'], emoji: [],
    grip: [0, 0.04, 0.05],
    wear: { rot: [180, 0, 0] },
    about: 'Gnome Theft Auto: the Pistol. Held forward, barrel along +y (forward), grip hanging toward +z (underside), a dark frame and slide on top (-z), a small trigger guard and sights.',
    examine: [
      'A small dark steel gun with a black grip, a short barrel and a trigger guard just big enough for one stiff finger.',
      'Saying from the Verge: a pistol is only as honest as the gnome holding it, and most gnomes are honest about very little.',
      'Tip: hold it with the barrel up and the grip low, or it will point at your own hat and you will feel silly.',
      'Joke: it is the most polished piece of steel in Turfton, and the only thing it has ever been used to open is a tin of peas.',
      'The grip has a notch worn in it by a thumb. Gnomes say the thumb belonged to a gnome who was very sure of himself.',
    ],
    parts: [
      { s: 'box', d: [0.05, 0.2, 0.06], at: [0, 0.1, -0.04], c: 'iron-dark' },                    // frame and slide
      { s: 'cyl', d: [0.012, 0.012, 0.06], at: [0, 0.23, -0.045], c: 'steel', seg: 8 },           // barrel
      { s: 'box', d: [0.045, 0.055, 0.12], at: [0, 0.04, 0.05], c: 'black' },                     // grip, hangs below
      { s: 'box', d: [0.01, 0.012, 0.03], at: [0, 0.09, 0.01], c: 'iron-dark' },                  // trigger
      { s: 'box', d: [0.012, 0.05, 0.01], at: [0, 0.095, 0.03], c: 'iron-dark' },                 // trigger guard
      { s: 'box', d: [0.01, 0.012, 0.012], at: [0, 0.19, -0.074], c: 'iron-dark' },               // front sight
      { s: 'box', d: [0.02, 0.012, 0.012], at: [0, 0.02, -0.074], c: 'iron-dark' },               // rear sight
    ],
  },
  {
    id: 'gta-smg', name: 'SMG', category: 'weapon', uses: ['hold', 'shoot'],
    tags: ['smg', 'submachine', 'gun', 'steel', 'ranged', 'shoot', 'magazine', 'stick'], emoji: [],
    grip: [0, 0.16, 0.05],
    wear: { rot: [180, 0, 0] },
    pivots: { support: [0, 0.29, 0.0] },
    about: 'Gnome Theft Auto: the SMG. Held forward, barrel along +y (forward), grip and stick magazine hanging toward +z (underside), a wooden stock behind toward -y, the top is -z.',
    examine: [
      'A dark steel body with a stick of a magazine hanging in front of the grip, like a loaf that has been sent to the wrong shelf.',
      'Saying: a gnome with a stick magazine has many thoughts, all of them short and all of them very fast.',
      'Tip: keep the barrel pointing at the sky when you walk. Carrying it level makes passing gnomes nervous and the hedges take it personally.',
      'Joke: it is so light that its owner once forgot it on the Spigot, and it was found the next morning, still pointing at the fountain.',
      'The stock is a wooden spoon handle with a brass ring. Nobody has ever explained the ring, and nobody has asked.',
    ],
    parts: [
      { s: 'box', d: [0.04, 0.12, 0.06], at: [0, 0.06, -0.04], c: 'wood-dark', name: 'stock' },
      { s: 'box', d: [0.06, 0.2, 0.08], at: [0, 0.21, -0.045], c: 'iron-dark' },                   // receiver
      { s: 'box', d: [0.045, 0.05, 0.11], at: [0, 0.16, 0.05], c: 'black' },                       // grip
      { s: 'box', d: [0.035, 0.04, 0.15], at: [0, 0.25, 0.07], c: 'iron', name: 'mag' },
      { s: 'box', d: [0.01, 0.012, 0.03], at: [0, 0.2, 0.01], c: 'iron-dark' },                    // trigger
      { s: 'cyl', d: [0.013, 0.013, 0.14], at: [0, 0.38, -0.05], c: 'steel', seg: 8 },             // barrel
      { s: 'cyl', d: [0.02, 0.02, 0.02], at: [0, 0.46, -0.05], c: 'black', seg: 8 },               // muzzle
    ],
  },
  {
    id: 'gta-shotgun', name: 'Shotgun', category: 'weapon', uses: ['hold', 'shoot'],
    tags: ['shotgun', 'gun', 'pump', 'steel', 'wood', 'ranged', 'shoot', 'long'], emoji: [],
    grip: [0, 0.2, 0.045],
    wear: { rot: [180, 0, 0] },
    pivots: { support: [0, 0.36, 0.02] },
    about: 'Gnome Theft Auto: the Shotgun. Held forward, a long barrel along +y (forward), a wooden grip and pump on the underside (+z), a wooden stock behind toward -y, the top is -z.',
    examine: [
      'A long dark barrel with a wooden pump slung underneath, and a stock at the back that has been polished by many careful hands.',
      'Saying: a shotgun is a wide opinion, delivered quickly, and then the gnome is left to explain it.',
      'Tip: slide the pump slowly and listen for the click. A pump that clacks twice is a pump that is about to argue with you.',
      'Joke: it throws its contents in a fan, so it is good for parties, weddings and any argument with more than one gnome in it.',
      'The pump has a row of tiny scratches from a gnome counting something on it. Nobody knows what, or how high the count got.',
    ],
    parts: [
      { s: 'box', d: [0.05, 0.18, 0.08], at: [0, 0.09, -0.03], c: 'wood', name: 'stock' },
      { s: 'box', d: [0.07, 0.14, 0.09], at: [0, 0.24, -0.045], c: 'iron-dark' },                  // receiver
      { s: 'box', d: [0.045, 0.05, 0.1], at: [0, 0.2, 0.04], c: 'wood-dark' },                     // grip
      { s: 'box', d: [0.01, 0.012, 0.03], at: [0, 0.235, 0.01], c: 'iron-dark' },                  // trigger
      { s: 'cyl', d: [0.02, 0.02, 0.52], at: [0, 0.57, -0.06], c: 'steel', seg: 8 },               // barrel 0.31..0.83
      { s: 'cyl', d: [0.016, 0.016, 0.4], at: [0, 0.51, -0.025], c: 'iron', seg: 8 },              // magazine tube
      { s: 'box', d: [0.05, 0.12, 0.06], at: [0, 0.36, -0.01], c: 'wood', name: 'pump' },
    ],
  },
  {
    id: 'gta-rifle', name: 'Rifle', category: 'weapon', uses: ['hold', 'shoot'],
    tags: ['rifle', 'gun', 'scope', 'sight', 'steel', 'wood', 'ranged', 'shoot', 'long'], emoji: [],
    grip: [0, 0.21, 0.05],
    wear: { rot: [180, 0, 0] },
    pivots: { support: [0, 0.34, -0.01] },
    about: 'Gnome Theft Auto: the Rifle. Held forward, a long steel barrel along +y (forward), a grip and magazine hanging toward +z (underside), a scope tube on top (-z) and a wooden stock behind toward -y.',
    examine: [
      'A long steel barrel on a dark receiver, with a little scope tube on the side that makes the far fence look close and rude.',
      'Saying from Fort Sandpit: a rifle is patience with a barrel on it, and patience is the one thing a gnome never keeps in stock.',
      'Tip: look through the scope with both eyes open. One eye shut makes the target look three times as sure of itself.',
      'Joke: it is the longest thing a gnome has ever been allowed to carry past the Fence, and the Fence has never been asked how it felt.',
      'The stock is scuffed where it has been leaned against a great many walls, most of them somewhere the gnome was not supposed to be.',
    ],
    parts: [
      { s: 'box', d: [0.05, 0.18, 0.08], at: [0, 0.09, -0.03], c: 'wood', name: 'stock' },
      { s: 'box', d: [0.07, 0.16, 0.1], at: [0, 0.25, -0.05], c: 'iron-dark' },                    // receiver 0.17..0.33
      { s: 'box', d: [0.045, 0.05, 0.11], at: [0, 0.21, 0.045], c: 'wood-dark' },                   // grip
      { s: 'box', d: [0.01, 0.012, 0.03], at: [0, 0.245, 0.01], c: 'iron-dark' },                  // trigger
      { s: 'box', d: [0.035, 0.05, 0.1], at: [0, 0.29, 0.05], c: 'iron', name: 'mag' },
      { s: 'box', d: [0.055, 0.2, 0.06], at: [0, 0.42, -0.045], c: 'wood' },                        // handguard 0.32..0.52
      { s: 'cyl', d: [0.014, 0.014, 0.42], at: [0, 0.72, -0.055], c: 'steel', seg: 8 },             // barrel 0.51..0.93
      { s: 'box', d: [0.02, 0.1, 0.03], at: [0, 0.27, -0.11], c: 'iron-dark', name: 'scope-base' },
      { s: 'cyl', d: [0.02, 0.02, 0.16], at: [0, 0.27, -0.13], c: 'iron-dark', seg: 8, name: 'scope' },
      { s: 'cyl', d: [0.018, 0.018, 0.01], at: [0, 0.355, -0.13], c: GLASS_BLUE, glow: true, seg: 8, name: 'scope-lens' },
    ],
  },
  {
    id: 'crop-duster', name: 'Crop Duster', category: 'prop', uses: ['place', 'sit'],
    tags: ['plane', 'crop', 'duster', 'aircraft', 'biplane', 'propeller', 'flying', 'yellow', 'seat'], emoji: [],
    tint: PLANE_YELLOW,
    seat: P(0, 0.9, 0.2),
    pivots: {
      prop: P(0, 0.9, 1.9),
      'wheel-0': P(-0.8, 0.3, 0.2), 'wheel-1': P(0.8, 0.3, 0.2),
      'wheel-2': P(-0.25, 0.1, -2.2), 'wheel-3': P(0.25, 0.1, -2.2),
    },
    about: 'Gnome Theft Auto: the Crop Duster. A yellow single-wing plane with a cockpit bubble and seat, a nose propeller (group prop, spins on its hub), two main wheels (wheel-0, wheel-1) and two small tail wheels (wheel-2, wheel-3). Nose toward +z. Wingspan about 2.8 at scale 1 (the game draws it bigger). Tint sets the body and wings.',
    examine: [
      'A yellow plane with one long wing on top, a glass bubble for a cockpit and a propeller at the nose that looks very keen to get going.',
      'Saying from the Verge: the sky is only a lawn that has been turned upside down, and a gnome in a plane is simply a gnome who has been tidied out of the way.',
      'Tip: take off into the wind, not with it. A plane that takes off with the wind tends to land somewhere on the Fence, and the Fence does not give refunds.',
      'Joke: the wheels are very small, which the pilot says is for going fast and the mechanic says is for going nowhere in a hurry.',
      'Someone has painted a small white flower on the tail. Nobody will say whether it is a sign of luck or a warning to other pilots.',
    ],
    parts: [
      { s: 'box', d: D(0.55, 0.6, 2.6), at: P(0, 0.9, -1.6), c: 'tint' },                       // rear fuselage (y 0.6 to 1.2)
      { s: 'box', d: D(0.5, 0.08, 1.6), at: P(0, 0.62, 0.5), c: 'tint' },                      // cockpit floor
      { s: 'box', d: D(0.06, 0.36, 1.6), at: P(0.25, 0.9, 0.5), c: 'tint', mirror: true },    // cockpit side panel
      { s: 'cyl', d: D(0.25, 0.25, 0.5), rot: [90, 0, 0], at: P(0, 0.9, 1.65), c: 'tint', seg: 10 }, // nose (z 1.4 to 1.9)
      { s: 'box', d: D(0.4, 0.3, 0.4), at: P(0, 0.75, 0.2), c: 'black' },                       // seat (top at 0.9)
      { s: 'ball', d: D(0.34), at: P(0, 1.2, 0.25), scale: [0.9, 0.75, 1.5], c: GLASS_BLUE, alpha: 0.5, seg: 10 }, // cockpit bubble
      { s: 'box', d: D(7.0, 0.08, 1.0), at: P(0, 1.3, -0.2), c: 'tint' },                      // wing, span 7 design units
      { s: 'box', d: D(0.06, 0.5, 0.8), at: P(0, 1.4, -2.6), c: 'tint' },                      // tail fin
      { s: 'box', d: D(1.8, 0.05, 0.5), at: P(0, 1.1, -2.7), c: 'tint' },                      // tail plane
      { s: 'box', d: D(0.08, 0.62, 0.05), at: P(0, 1.21, 1.9), c: 'iron-dark', group: 'prop' }, // propeller blade, upper
      { s: 'box', d: D(0.08, 0.62, 0.05), at: P(0, 0.59, 1.9), c: 'iron-dark', group: 'prop' }, // propeller blade, lower
      { s: 'ball', d: D(0.06), at: P(0, 0.9, 1.92), c: 'iron', seg: 6, group: 'prop' },        // propeller hub
      { s: 'box', d: D(1.7, 0.08, 0.1), at: P(0, 0.55, 0.2), c: 'iron-dark' },                 // landing gear beam
      { s: 'cyl', d: D(0.3, 0.3, 0.14), rot: [0, 0, 90], at: P(-0.8, 0.3, 0.2), c: TYRE, seg: 12, group: 'wheel-0' }, // main wheel, left
      { s: 'cyl', d: D(0.3, 0.3, 0.14), rot: [0, 0, 90], at: P(0.8, 0.3, 0.2), c: TYRE, seg: 12, group: 'wheel-1' },  // main wheel, right
      { s: 'box', d: D(0.05, 0.5, 0.05), at: P(-0.25, 0.35, -2.2), c: 'iron-dark', mirror: true }, // tail wheel strut
      { s: 'cyl', d: D(0.1, 0.1, 0.06), rot: [0, 0, 90], at: P(-0.25, 0.1, -2.2), c: TYRE, seg: 8, group: 'wheel-2' }, // tail wheel, left
      { s: 'cyl', d: D(0.1, 0.1, 0.06), rot: [0, 0, 90], at: P(0.25, 0.1, -2.2), c: TYRE, seg: 8, group: 'wheel-3' },  // tail wheel, right
    ],
  },
  {
    id: 'parachute-canopy', name: 'Parachute Canopy', category: 'prop', uses: ['place'],
    // Hangs in the air from the gnome's shoulders, so it does not stand on y = 0 (like a painting on a wall).
    mount: 'wall',
    tags: ['parachute', 'canopy', 'chute', 'umbrella', 'stripe', 'drop', 'lines', 'sky'], emoji: [],
    about: 'Gnome Theft Auto: the Parachute Canopy. A striped dome of stacked yellow and red discs about 2.9 wide at y 3.0, with four thin lines down to the shoulders at y 1.2. Origin at the feet of a gnome of height 1.3; nothing below y 1.1.',
    examine: [
      'A dome of yellow and red stripes, stacked from a little cap at the top to a wide skirt at the bottom, with lines going down to the wearer.',
      'Saying: whatever goes up on a canopy must come down eventually, and the gnome underneath is always the last to be told.',
      'Tip: pull the lines evenly. A canopy that leans to one side turns every landing into a short, brisk walk across the Rockery.',
      'Joke: it is the only umbrella in Turfton that is expected to leave the ground, and it has never once been asked to keep anyone dry.',
      'Someone has sewn a small brass bell on one of the lines. Nobody remembers whether it was meant for luck or for finding the gnome in a hedge.',
    ],
    parts: [
      { s: 'cyl', d: [C(0.45), C(1.1), 0.3], at: [0, 3.35, 0], c: CANOPY_YELLOW, seg: 8 },           // top disc, yellow
      { s: 'cyl', d: [C(1.1), C(1.45), 0.3], at: [0, 3.05, 0], c: RED_STRIPE, seg: 8 },              // middle disc, red
      { s: 'cyl', d: [C(1.45), C(1.7), 0.3], at: [0, 2.75, 0], c: CANOPY_YELLOW, seg: 8 },          // skirt, yellow
      { s: 'cyl', d: [0.012, 0.012, 1.72], rot: [0, 0, -35.5], at: [0.7, 1.9, 0], c: 'white', seg: 4 },  // line, right (rim at x 1.2, y 2.6)
      { s: 'cyl', d: [0.012, 0.012, 1.72], rot: [0, 0, 35.5], at: [-0.7, 1.9, 0], c: 'white', seg: 4 },   // line, left
      { s: 'cyl', d: [0.012, 0.012, 1.72], rot: [35.5, 0, 0], at: [0, 1.9, 0.7], c: 'white', seg: 4 },    // line, front
      { s: 'cyl', d: [0.012, 0.012, 1.72], rot: [-35.5, 0, 0], at: [0, 1.9, -0.7], c: 'white', seg: 4 },  // line, back
    ],
  },
];
