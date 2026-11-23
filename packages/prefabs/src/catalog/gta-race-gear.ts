// Gnome Theft Auto: Lost & Found Speedway achievement rewards (gear for the gnome's head, neck, back and hand).
import type { PrefabDef } from '../types';

export const GTA_RACE_GEAR: readonly PrefabDef[] = [
  {
    id: 'speedway-chequered-cap', name: 'Chequered Speedway Cap', category: 'armor', uses: ['wear-head'],
    tags: ['chequered', 'checkered', 'cap', 'hat', 'racing', 'speedway', 'race', 'head', 'reward'], emoji: [],
    about: 'Gnome Theft Auto: a racing cap with a black-and-white chequered crown, a short black peak. Plain colours, no tint.',
    examine: [
      'A racing cap with a black-and-white chequered crown, a short peak, and a few scorch marks from the last lap.',
      'Saying from the Speedway: the flag falls once, and everything after that is just a lot of going round.',
      'Tip: keep the peak pointing forward. Turned back, it catches the wind and you come round the first bend sideways.',
      'Joke: Big Flag waves a chequered tea towel at every finish and insists it is the same pattern. It is not.',
      'The chequers stop short at the back of the crown. Gnomes say the last square belongs to whoever crossed the line first.',
    ],
    parts: [
      { s: 'cyl', d: [0.14, 0.15, 0.1], at: [0, 0.05, 0], c: 'white', seg: 8 },                  // crown (min.y = 0)
      { s: 'box', d: [0.05, 0.04, 0.02], at: [0.0, 0.03, 0.15], c: 'black' },                   // chequer row A
      { s: 'box', d: [0.05, 0.04, 0.02], at: [0.15, 0.03, 0.0], rot: [0, 90, 0], c: 'black' }, // chequer row A
      { s: 'box', d: [0.05, 0.04, 0.02], at: [0.0, 0.03, -0.15], c: 'black' },                  // chequer row A
      { s: 'box', d: [0.05, 0.04, 0.02], at: [-0.15, 0.03, 0.0], rot: [0, 90, 0], c: 'black' }, // chequer row A
      { s: 'box', d: [0.05, 0.04, 0.02], at: [0.106, 0.07, 0.106], rot: [0, 45, 0], c: 'black' },   // chequer row B
      { s: 'box', d: [0.05, 0.04, 0.02], at: [-0.106, 0.07, 0.106], rot: [0, -45, 0], c: 'black' }, // chequer row B
      { s: 'box', d: [0.05, 0.04, 0.02], at: [0.106, 0.07, -0.106], rot: [0, 135, 0], c: 'black' }, // chequer row B
      { s: 'box', d: [0.05, 0.04, 0.02], at: [-0.106, 0.07, -0.106], rot: [0, -135, 0], c: 'black' }, // chequer row B
      { s: 'ball', d: [0.012], at: [0, 0.102, 0], c: 'black', seg: 6 },                          // crown button
      { s: 'box', d: [0.2, 0.014, 0.12], at: [0, 0.007, 0.13], c: 'black' },                    // short peak (min.y = 0)
    ],
  },
  {
    id: 'speedway-stopwatch-pendant', name: 'Stopwatch Pendant', category: 'trinket', uses: ['wear-neck'],
    tags: ['stopwatch', 'watch', 'timer', 'pendant', 'cord', 'silver', 'neck', 'speedway', 'reward'], emoji: [],
    about: 'Gnome Theft Auto: a chunky silver stopwatch on a leather cord, hung on the chest, with a red second hand on its face. Plain colours, no tint.',
    examine: [
      'A chunky silver stopwatch on a cord, its face marked in seconds and a red hand that never quite stops.',
      'Saying: a gnome who counts every second will never be late, and never be happy either.',
      'Tip: press the crown before the flag drops, not after. The watch only starts when it is told to, like everything else.',
      'Joke: it has timed nine hundred laps, and by its own account every one of them was late.',
      'The back is scratched with a single figure, 42, and nobody in the Yard will say whether it is a time or a warning.',
    ],
    // Cord ring laid under the chin (min.y = 0); the watch hangs on the chest, clear of the head and face.
    parts: [
      { s: 'ring', d: [0.21, 0.01], at: [0, 0.01, -0.05], rot: [90, 0, 0], c: 'leather', seg: 12 }, // cord (min.y = 0)
      { s: 'cyl', d: [0.055, 0.055, 0.03], at: [0, 0.075, 0.17], rot: [90, 0, 0], c: 'silver', seg: 10 }, // watch case
      { s: 'cyl', d: [0.045, 0.045, 0.004], at: [0, 0.075, 0.187], rot: [90, 0, 0], c: 'white', seg: 10 }, // dial
      { s: 'box', d: [0.005, 0.036, 0.003], at: [0, 0.088, 0.19], c: 'red' },                     // second hand
      { s: 'cyl', d: [0.012, 0.012, 0.014], at: [0, 0.13, 0.17], c: 'steel', seg: 6 },            // crown button
      { s: 'ring', d: [0.018, 0.005], at: [0, 0.158, 0.17], c: 'iron', seg: 8 },                  // bow loop
    ],
  },
  {
    id: 'speedway-fizz-rosette', name: 'Fizz Cup Rosette', category: 'trinket', uses: ['wear-neck'],
    tags: ['rosette', 'ribbon', 'prize', 'medal', 'podium', 'fizz', 'neck', 'speedway', 'reward'], emoji: [],
    about: 'Gnome Theft Auto: a yellow prize rosette with pleated rings and two ribbon tails, pinned to a red neck ribbon. Plain colours, no tint.',
    examine: [
      'A yellow prize rosette with pleated rings and two long ribbon tails, pinned to a red ribbon round the neck.',
      'Saying from the Charters: the cup is only fizz, but the rosette is forever, and so is the sticky bit on the back.',
      'Tip: pin the rosette to the front, not the back. Nobody reads a rosette from behind, and that is the whole point.',
      'Joke: the rosette has been handed out at every fete on the Dust Flats, usually to the gnome who came second.',
      'Dandelion Fizz is printed in gold along one ribbon tail, which was the sponsor\'s idea and nobody else\'s.',
    ],
    parts: [
      { s: 'ring', d: [0.21, 0.012], at: [0, 0.012, -0.05], rot: [90, 0, 0], c: 'red', seg: 12 },   // neck ribbon (min.y = 0)
      { s: 'ring', d: [0.085, 0.03], at: [0, 0.12, 0.17], c: 0xffd21f, seg: 12 },                  // outer pleat
      { s: 'ring', d: [0.055, 0.02], at: [0, 0.12, 0.2], c: 0xffd21f, seg: 10 },                  // inner pleat
      { s: 'ball', d: [0.025], at: [0, 0.12, 0.215], scale: [1, 1, 0.5], c: 0xffd21f, seg: 8 },   // rosette centre
      { s: 'box', d: [0.03, 0.08, 0.008], at: [-0.025, 0.05, 0.165], rot: [0, 0, -8], c: 'red' }, // left ribbon tail
      { s: 'box', d: [0.03, 0.08, 0.008], at: [0.025, 0.05, 0.165], rot: [0, 0, 8], c: 'red' },   // right ribbon tail
    ],
  },
  {
    id: 'speedway-exhaust-pack', name: 'Twin-Exhaust Backpack', category: 'armor', uses: ['wear-back'],
    tags: ['exhaust', 'pack', 'backpack', 'pipes', 'flame', 'chrome', 'back', 'speedway', 'carburettors', 'reward'], emoji: [],
    about: 'Gnome Theft Auto: a small chrome backpack frame with two upturned exhaust pipes and an orange Carburettors flame on the front. Plain colours, no tint.',
    examine: [
      'A small chrome backpack frame with two upturned exhaust pipes and an orange flame painted across the front.',
      'Carburettor saying: a pipe that sounds like a gnome clearing his throat has never been on time for anything.',
      'Tip: fill the pack before a race. Empty, it rattles, and the rattle carries all the way to the Fence.',
      'Joke: the pipes were meant to puff smoke. They puff only the wind, and quite a lot of dust.',
      'Someone has scratched a row of little crosses along one pipe, one for each gnome left behind at a bend.',
    ],
    parts: [
      { s: 'box', d: [0.18, 0.2, 0.08], at: [0, 0.1, 0], c: 'iron-dark' },                         // pack body (min.y = 0)
      { s: 'box', d: [0.02, 0.2, 0.02], at: [-0.1, 0.1, -0.05], c: 'steel' },                      // chrome frame rail
      { s: 'box', d: [0.02, 0.2, 0.02], at: [0.1, 0.1, -0.05], c: 'steel' },                       // chrome frame rail
      { s: 'cyl', d: [0.02, 0.02, 0.14], at: [-0.06, 0.27, 0], rot: [0, 0, 10], c: 'steel', seg: 8 }, // left exhaust pipe
      { s: 'cyl', d: [0.02, 0.02, 0.14], at: [0.06, 0.27, 0], rot: [0, 0, -10], c: 'steel', seg: 8 }, // right exhaust pipe
      { s: 'cyl', d: [0.024, 0.024, 0.02], at: [-0.075, 0.345, 0], rot: [0, 0, 10], c: 'iron-dark', seg: 8 }, // left pipe mouth
      { s: 'cyl', d: [0.024, 0.024, 0.02], at: [0.075, 0.345, 0], rot: [0, 0, -10], c: 'iron-dark', seg: 8 }, // right pipe mouth
      { s: 'cone', d: [0.055, 0.12], at: [0, 0.14, 0.035], scale: [1, 1, 0.3], c: 0xff6a00, glow: true, seg: 6 }, // Carburettors flame decal
    ],
  },
  {
    id: 'speedway-shell-visor', name: 'Snail-Shell Visor', category: 'armor', uses: ['wear-head'],
    tags: ['visor', 'sun', 'snail', 'shell', 'spiral', 'hat', 'cap', 'head', 'speedway', 'reward'], emoji: [],
    about: 'Gnome Theft Auto: a green sun visor with a short brim whose crown is a spiral snail shell. Plain colours, no tint.',
    examine: [
      'A green sun visor with a short brim, and a crown that is a spiral snail shell with a clay-coloured coil on the front.',
      'Saying from the Hedgewood: the slow gnome keeps the shade, and the shade keeps the slow gnome cool.',
      'Tip: wear it with the spiral facing forward. Turned round, the snail looks like it is retreating, which it is not, usually.',
      'Joke: Shelldon wore it to the Snail-Coach Endurance and still finished first, which surprised everyone but Shelldon.',
      'The shell leaves no trail behind it, which Shelldon says is the whole secret of the visor and nothing to do with the sun.',
    ],
    parts: [
      { s: 'ring', d: [0.16, 0.012], at: [0, 0.02, 0], rot: [90, 0, 0], c: 'green', seg: 12 },   // headband (min.y = 0.008)
      { s: 'box', d: [0.32, 0.012, 0.16], at: [0, 0.006, 0.085], c: 'green' },                    // visor brim (min.y = 0)
      { s: 'ball', d: [0.1], at: [0, 0.11, -0.03], scale: [1, 0.85, 1], c: 'shell', seg: 10 },   // shell crown
      { s: 'ring', d: [0.04, 0.012], at: [0, 0.12, 0.075], c: 'clay-dark', seg: 10 },             // spiral coil, outer
      { s: 'ring', d: [0.018, 0.009], at: [0, 0.12, 0.085], c: 'clay-dark', seg: 8 },             // spiral coil, inner
    ],
  },
  {
    id: 'speedway-tea-towel', name: 'Big Flag\'s Tea Towel', category: 'prop', uses: ['hold'], grip: [0, 0.23, 0],
    tags: ['tea towel', 'towel', 'flag', 'chequered', 'checkered', 'race', 'start', 'speedway', 'burdock'], emoji: [],
    about: 'Gnome Theft Auto: Burdock Bellweather\'s chequered tea towel, the Lost & Found Speedway\'s starting flag. A black-and-white chequered cloth held by one corner, hanging straight down. Plain colours, no tint.',
    examine: [
      'A black-and-white chequered tea towel, washed thin, with a hanging loop sewn into one corner.',
      'Saying from the pan: wait for the flag. It is a tea towel, but it is a very serious tea towel.',
      'Tip: watch the lights, not the towel. Big Flag waves it at the lights, and the lights do the starting.',
      'Joke: it has started forty races and dried no dishes at all, which Burdock says is the correct ratio.',
      'One corner is singed. Burdock says that was the Final of a year he will not name.',
    ],
    // Held by the top corner (grip), the cloth hanging straight down below the hand (min.y = 0).
    parts: [
      { s: 'box', d: [0.16, 0.22, 0.006], at: [0, 0.11, 0], c: 'white' },              // the cloth
      { s: 'box', d: [0.04, 0.055, 0.008], at: [-0.06, 0.1925, 0], c: 'black' },       // chequer, row 1
      { s: 'box', d: [0.04, 0.055, 0.008], at: [0.02, 0.1925, 0], c: 'black' },        // chequer, row 1
      { s: 'box', d: [0.04, 0.055, 0.008], at: [-0.02, 0.1375, 0], c: 'black' },       // chequer, row 2
      { s: 'box', d: [0.04, 0.055, 0.008], at: [0.06, 0.1375, 0], c: 'black' },        // chequer, row 2
      { s: 'box', d: [0.04, 0.055, 0.008], at: [-0.06, 0.0825, 0], c: 'black' },       // chequer, row 3
      { s: 'box', d: [0.04, 0.055, 0.008], at: [0.02, 0.0825, 0], c: 'black' },        // chequer, row 3
      { s: 'box', d: [0.04, 0.055, 0.008], at: [-0.02, 0.0275, 0], c: 'black' },       // chequer, row 4
      { s: 'box', d: [0.04, 0.055, 0.008], at: [0.06, 0.0275, 0], c: 'black' },        // chequer, row 4
      { s: 'ring', d: [0.014, 0.004], at: [0, 0.226, 0], c: 'white', seg: 6 },         // hanging loop
    ],
  },
  {
    id: 'speedway-fizz-cup', name: 'The Fizz Cup', category: 'trinket', uses: ['hold'], grip: [0, 0.08, 0],
    tags: ['cup', 'trophy', 'fizz', 'gold', 'prize', 'chalice', 'hand', 'speedway', 'reward'], emoji: [],
    about: 'Gnome Theft Auto: The Fizz Cup. A gold trophy on a short stem with two looped handles and a yellow fizz-bubble lid. Held upright by the stem. Rare reward.',
    examine: [
      'A gold trophy cup on a short stem, two looped handles and a yellow fizz-bubble lid that is always, faintly, fizzing.',
      'Saying from the Charters: the first sip is the race, and the last sip is the victory lap. Nobody has found the middle.',
      'Tip: hold it by the stem, upright. Tilted, the fizz slops out and the Dandelion Fizz sponsor sends a bill.',
      'Joke: Turbo-Sod has tried to drink from it three times and has not yet won the argument about whose name is engraved first.',
      'The lid bubbles when a Carburettor comes near. Gnomes say the cup is pleased, and the Carburettors say it is angry.',
    ],
    parts: [
      { s: 'cyl', d: [0.07, 0.08, 0.02], at: [0, 0.01, 0], c: 'gold', seg: 10 },                  // base (min.y = 0)
      { s: 'cyl', d: [0.018, 0.018, 0.12], at: [0, 0.08, 0], c: 'gold', seg: 8 },                 // stem (grip at its centre)
      { s: 'cyl', d: [0.1, 0.06, 0.12], at: [0, 0.2, 0], c: 'gold', seg: 10 },                    // bowl
      { s: 'ring', d: [0.035, 0.008], at: [0.1, 0.2, 0], c: 'gold', seg: 8, mirror: true },       // handles, both sides
      { s: 'cyl', d: [0.062, 0.062, 0.02], at: [0, 0.27, 0], c: 'gold', seg: 10 },                // lid
      { s: 'ball', d: [0.04], at: [0, 0.31, 0], scale: [1, 0.8, 1], c: 'spark', glow: true, seg: 8 }, // fizz bubble
      { s: 'ball', d: [0.012], at: [0.03, 0.35, 0.02], c: 'spark', glow: true, seg: 6 },          // loose bubble
    ],
  },
];
