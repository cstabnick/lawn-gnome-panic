// Gnome Theft Auto, Ammu-Gnation gun mods A: optics, muzzle devices, barrels, underbarrel parts (gunmod-*). One owner: the issue that fills this file. Starts empty.
import type { PrefabDef } from '../types';

// Gun frame: the barrel points along +y, the gun's top is the -z side and its underside (trigger, magazine) is +z.
// Each mod stands on y = 0, centred on x and z. A mod that runs along the barrel stands upright along y.
export const GTA_GUN_MODS_A: readonly PrefabDef[] = [
  {
    id: 'gunmod-red-dot', name: 'Dew-Drop Dot', category: 'tool', uses: ['place'],
    tags: ['gun', 'mod', 'sight', 'optic', 'dot', 'red', 'glass', 'glow'], emoji: [],
    about: 'Gnome Theft Auto: the Dew-Drop Dot. A short squat sight, a small box base on +z that touches the gun with a red glowing bead on top. Along y.',
    examine: [
      'A squat little box with a round red bead on top, glowing like a traffic light that has lost its nerve.',
      'Saying from the Rockery: a gnome who keeps one eye on the red bead will always hit something, though not always the thing he meant.',
      'Tip: look at the bead, not the target. The target has never once been impressed by being looked at.',
      'Joke: it is called a dot because that is the most a gnome can say about the aim before the bead goes dark.',
      'The base has four tiny holes, and the gnome who drilled them swore they were for dew. Nobody has ever seen dew go in.',
    ],
    parts: [
      { s: 'box', d: [0.05, 0.07, 0.02], at: [0, 0.035, 0.015], c: 'iron-dark', name: 'base' },   // base, touches the gun on +z
      { s: 'ball', d: [0.014], at: [0, 0.075, 0], c: 'red', glow: true, seg: 8, name: 'bead' },   // red bead on top
    ],
  },
  {
    id: 'gunmod-holo', name: 'Firefly Holo', category: 'tool', uses: ['place'],
    tags: ['gun', 'mod', 'sight', 'optic', 'holo', 'window', 'glass', 'firefly'], emoji: [],
    about: 'Gnome Theft Auto: the Firefly Holo. An open rectangular window frame on a flat base (on +z), a faint green glass pane and a glowing yellow firefly dot. Along y.',
    examine: [
      'A little window of faint green glass on a flat foot, with a yellow spark floating in the middle like a firefly told to wait.',
      'Saying: look through the window and the world becomes a ring of green, and every gnome in the ring is a little bit guilty.',
      'Tip: keep both eyes open. The spark is easier to find that way, and so is the thing you are aiming at.',
      'Joke: the firefly is not really inside the window. It is simply very sure that it is, and it has never been asked to leave.',
      'The glass has a crack in one corner that the shop calls a feature and the previous owner called a Tuesday.',
    ],
    parts: [
      { s: 'box', d: [0.06, 0.012, 0.05], at: [0, 0.006, 0.01], c: 'iron-dark', name: 'base' },   // flat base, on +z
      { s: 'box', d: [0.008, 0.07, 0.008], at: [-0.026, 0.047, 0], c: 'iron-dark' },              // left post
      { s: 'box', d: [0.008, 0.07, 0.008], at: [0.026, 0.047, 0], c: 'iron-dark' },               // right post
      { s: 'box', d: [0.06, 0.008, 0.008], at: [0, 0.078, 0], c: 'iron-dark' },                   // top rail
      { s: 'box', d: [0.06, 0.008, 0.008], at: [0, 0.016, 0], c: 'iron-dark' },                   // bottom rail
      { s: 'box', d: [0.044, 0.06, 0.002], at: [0, 0.047, 0], c: 'green', alpha: 0.4 },           // green glass pane
      { s: 'ball', d: [0.012], at: [0, 0.047, 0], c: 'spark', glow: true, seg: 8, name: 'firefly' }, // firefly dot
    ],
  },
  {
    id: 'gunmod-long-scope', name: 'Long-Look Scope', category: 'tool', uses: ['place'],
    tags: ['gun', 'mod', 'scope', 'sight', 'optic', 'long', 'lens', 'tube'], emoji: [],
    about: 'Gnome Theft Auto: the Long-Look Scope. A long dark tube along y with fat bell ends, a glowing blue lens at the top, two ring mounts with feet on +z and a turret knob on -z.',
    examine: [
      'A long dark tube with fat bells at each end, a glowing blue eye on top and a little knob on the side for turning the world.',
      'Saying from Mossbottom: a scope brings the far fence up close, which is how most gnomes learn that the far fence is also looking.',
      'Tip: wind the knob slowly. A quick turn sends the target three fences away, and the gnome after it on foot.',
      'Joke: it makes a distant hedge look so near that several gnomes have tried to introduce themselves to it.',
      'The blue lens was once a marble that saw something it should not have, or so the Charters are very quiet about.',
    ],
    parts: [
      { s: 'cyl', d: [0.02, 0.02, 0.18], at: [0, 0.13, 0], c: 'black', seg: 8, name: 'tube' },           // tube
      { s: 'cyl', d: [0.03, 0.03, 0.04], at: [0, 0.06, 0], c: 'iron-dark', seg: 8 },                     // bell, low end
      { s: 'cyl', d: [0.03, 0.03, 0.04], at: [0, 0.2, 0], c: 'iron-dark', seg: 8 },                      // bell, high end
      { s: 'cyl', d: [0.017, 0.017, 0.012], at: [0, 0.226, 0], c: 'glaze-blue', glow: true, seg: 8, name: 'lens' }, // blue lens
      { s: 'ball', d: [0.016], at: [0, 0.13, -0.036], c: 'iron', seg: 6, name: 'knob' },                  // turret knob, on -z
      { s: 'cyl', d: [0.03, 0.03, 0.025], rot: [90, 0, 0], at: [0, 0.09, 0], c: 'iron-dark', seg: 8 },   // ring mount, low
      { s: 'cyl', d: [0.03, 0.03, 0.025], rot: [90, 0, 0], at: [0, 0.17, 0], c: 'iron-dark', seg: 8 },   // ring mount, high
      { s: 'box', d: [0.02, 0.09, 0.02], at: [-0.02, 0.045, 0.03], c: 'iron-dark' },                       // foot, left
      { s: 'box', d: [0.02, 0.09, 0.02], at: [0.02, 0.045, 0.03], c: 'iron-dark' },                        // foot, right
    ],
  },
  {
    id: 'gunmod-jam-jar-scope', name: 'Jam-Jar Scope', category: 'tool', uses: ['place'],
    tags: ['gun', 'mod', 'scope', 'sight', 'optic', 'jar', 'jam', 'glass', 'comedy'], emoji: [],
    about: 'Gnome Theft Auto: the Jam-Jar Scope. A glass jam jar along y (alpha 0.4) with a red and white gingham lid, a dark plum blob inside and two wire mounts on +z.',
    examine: [
      'A glass jam jar fixed along the barrel, with a gingham lid on top and a dark plum blob floating inside like a secret.',
      'Saying: a plum in a jar sees the far fence clearly, provided the jar has been wiped, and nobody has wiped it since the summer.',
      'Tip: the lid unscrews for cleaning. Do not unscrew it mid-aim, or the plum rolls out and makes a sticky mess of the view.',
      'Joke: it is the only scope on the lawn that could be spread on toast after a long day of looking.',
      'The gingham lid was cut from an old tablecloth, and if you squint at it a faint pattern of small boats can be seen.',
    ],
    parts: [
      { s: 'cyl', d: [0.04, 0.04, 0.12], at: [0, 0.06, 0], c: 'glass', alpha: 0.4, seg: 10, name: 'jar' },   // glass jar
      { s: 'cyl', d: [0.042, 0.042, 0.02], at: [0, 0.13, 0], c: 'red', seg: 10, name: 'lid' },             // red lid
      { s: 'cyl', d: [0.044, 0.044, 0.006], at: [0, 0.143, 0], c: 'white', seg: 10 },                       // white lid band
      { s: 'ball', d: [0.022], at: [0, 0.05, 0], scale: [1, 1.1, 1], c: 'purple', seg: 8, name: 'plum' },   // plum blob
      { s: 'box', d: [0.008, 0.12, 0.008], at: [-0.03, 0.06, 0.035], c: 'iron', name: 'mount' },            // wire mount, left
      { s: 'box', d: [0.008, 0.12, 0.008], at: [0.03, 0.06, 0.035], c: 'iron', name: 'mount' },             // wire mount, right
    ],
  },
  {
    id: 'gunmod-suppressor', name: 'Hush-Puppy Suppressor', category: 'tool', uses: ['place'],
    tags: ['gun', 'mod', 'suppressor', 'silencer', 'quiet', 'black', 'tube'], emoji: [],
    about: 'Gnome Theft Auto: the Hush-Puppy Suppressor. A fat matte-black cylinder along y (radius 0.025, length 0.16) with two thin rings and a dark bore cap at the front.',
    examine: [
      'A fat matte black tube with two thin rings around it and a dark bore at the front, very quiet about its own opinions.',
      'Saying: the loudest gnome is the one who has not yet been fitted with a suppressor, and the quietest is the one who has.',
      'Tip: it takes the bang out of the shot, not the blame. Gnomes still hear you coming.',
      'Joke: it is called a Hush-Puppy after a dog, which was never consulted and is still barking about it.',
      'The rings are brass, but the shop painted them black so they would look as if they had never been anywhere loud.',
    ],
    parts: [
      { s: 'cyl', d: [0.025, 0.025, 0.16], at: [0, 0.08, 0], c: 'black', seg: 10, name: 'body' },     // body
      { s: 'cyl', d: [0.027, 0.027, 0.008], at: [0, 0.03, 0], c: 'iron-dark', seg: 10 },                   // ring, low
      { s: 'cyl', d: [0.027, 0.027, 0.008], at: [0, 0.13, 0], c: 'iron-dark', seg: 10 },                   // ring, high
      { s: 'cyl', d: [0.02, 0.02, 0.006], at: [0, 0.163, 0], c: 'iron-dark', seg: 8, name: 'bore' },        // bore cap
    ],
  },
  {
    id: 'gunmod-muzzle-brake', name: 'Muzzle Brake', category: 'tool', uses: ['place'],
    tags: ['gun', 'mod', 'brake', 'muzzle', 'steel', 'slots', 'recoil'], emoji: [],
    about: 'Gnome Theft Auto: the Muzzle Brake. A short steel cylinder along y (radius 0.022, length 0.06) with three black slots cut across its sides and a ring at the tip.',
    examine: [
      'A short steel tube with three black slots cut across its sides and a thin ring at the tip, like a biscuit tin that has been in an argument.',
      'Saying: a brake holds the kick back, and a gnome who holds back the kick is a gnome who will one day be asked to explain why.',
      'Tip: keep the slots on top, where they throw the bang sideways into the hedge rather than into your own hat.',
      'Joke: the brake does not stop anything. It simply makes the recoil feel as though it has been thought about.',
      'Someone has scratched a tiny word on the ring in a language nobody reads, which may be a warning or a price.',
    ],
    parts: [
      { s: 'cyl', d: [0.022, 0.022, 0.06], at: [0, 0.03, 0], c: 'steel', seg: 8, name: 'body' },       // steel body
      { s: 'box', d: [0.056, 0.007, 0.012], at: [0, 0.018, 0], c: 'black', name: 'slot' },               // slot, low
      { s: 'box', d: [0.056, 0.007, 0.012], at: [0, 0.031, 0], c: 'black', name: 'slot' },              // slot, middle
      { s: 'box', d: [0.056, 0.007, 0.012], at: [0, 0.044, 0], c: 'black', name: 'slot' },              // slot, high
      { s: 'ring', d: [0.022, 0.004], at: [0, 0.058, 0], rot: [90, 0, 0], c: 'iron-dark', seg: 8 },       // tip ring
    ],
  },
  {
    id: 'gunmod-kazoo', name: 'Party Kazoo', category: 'tool', uses: ['place'],
    tags: ['gun', 'mod', 'kazoo', 'party', 'horn', 'yellow', 'buzz', 'toy'], emoji: [],
    about: 'Gnome Theft Auto: the Party Kazoo. A tapered yellow body flaring out at +y, a red stripe ring and a round buzzer bump on -z. Along y.',
    examine: [
      'A tapered yellow tube with a red stripe round its middle and a round buzzer bump on one side, flaring out at the top like a trumpet.',
      'Saying from Birdbath Keep: a kazoo buzzes the truth into a gnome\'s ear, and the truth buzzes back in a voice like a wasp.',
      'Tip: hum into the narrow end and keep the buzzer side down, or the hum comes out of your nose.',
      'Joke: it is the most musical thing ever fitted to a gun, which is not saying much, but it is a loud start.',
      'The buzzer is a thin skin of something soft that the shop will not name, and it wobbles faster when the gnome is nervous.',
    ],
    parts: [
      { s: 'cyl', d: [0.028, 0.02, 0.12], at: [0, 0.06, 0], c: 'yellow', seg: 10, name: 'body' },     // tapered body, wide end at +y
      { s: 'cyl', d: [0.0255, 0.0255, 0.012], at: [0, 0.08, 0], c: 'red', seg: 10 },                       // red stripe ring
      { s: 'ball', d: [0.01], at: [0, 0.05, -0.022], c: 'white', seg: 8, name: 'buzzer' },                 // buzzer bump, on -z
    ],
  },
  {
    id: 'gunmod-squeaker', name: 'Squeaky Duck', category: 'tool', uses: ['place'],
    tags: ['gun', 'mod', 'duck', 'squeaker', 'squeak', 'toy', 'yellow', 'rubber'], emoji: [],
    about: 'Gnome Theft Auto: the Squeaky Duck. A tiny yellow duck head on a short collar that fits over the muzzle, with an orange flat beak pointing along +y and two black eyes.',
    examine: [
      'A tiny yellow duck head on a short collar, with a flat orange beak and two black eyes that are watching you watch it.',
      'Saying: a duck that squeaks is a duck that has been told it is important, and an important duck always squeaks.',
      'Tip: squeeze the collar, not the beak. The beak is pointed at the enemy and should be left in peace.',
      'Joke: it sounds exactly like a gnome sitting on a rubber toy in the bath, which is why nobody takes it seriously.',
      'The collar fits over the muzzle with a satisfying click, and the duck has never once been told where it is going.',
    ],
    parts: [
      { s: 'cyl', d: [0.026, 0.026, 0.03], at: [0, 0.015, 0], c: 'iron', seg: 8, name: 'collar' },   // collar, fits over the muzzle
      { s: 'ball', d: [0.026], at: [0, 0.05, 0], c: 'yellow', seg: 8, name: 'head' },                   // yellow head
      { s: 'box', d: [0.026, 0.035, 0.012], at: [0, 0.075, 0.02], c: 'orange', name: 'beak' },        // flat orange beak
      { s: 'ball', d: [0.006], at: [0.02, 0.06, -0.005], c: 'black', seg: 6, mirror: true, name: 'eye' }, // eyes
    ],
  },
  {
    id: 'gunmod-long-barrel', name: 'Long Barrel', category: 'tool', uses: ['place'],
    tags: ['gun', 'mod', 'barrel', 'long', 'steel', 'tube', 'reach'], emoji: [],
    about: 'Gnome Theft Auto: the Long Barrel. A long thin steel cylinder along y (radius 0.015, length 0.24) with a slightly fatter dark ring at each end.',
    examine: [
      'A long thin steel tube with a dark ring at each end, like a stick of rhubarb that has been to a very important dinner.',
      'Saying: a long barrel reaches further than a short temper, which is why the long ones are carried by the calm gnomes.',
      'Tip: keep it level when you run. A long barrel that swings like a pendulum takes the hedge out along with your balance.',
      'Joke: it is the only barrel in Turfton that has ever been described as thoughtful.',
      'The steel is polished along one side only, where a gnome has held it on every walk to the Fence for longer than anyone remembers.',
    ],
    parts: [
      { s: 'cyl', d: [0.015, 0.015, 0.24], at: [0, 0.12, 0], c: 'steel', seg: 8, name: 'barrel' },     // steel tube
      { s: 'cyl', d: [0.018, 0.018, 0.01], at: [0, 0.005, 0], c: 'iron-dark', seg: 8 },                     // ring, bottom
      { s: 'cyl', d: [0.018, 0.018, 0.01], at: [0, 0.235, 0], c: 'iron-dark', seg: 8 },                   // ring, tip
    ],
  },
  {
    id: 'gunmod-heavy-barrel', name: 'Heavy Barrel', category: 'tool', uses: ['place'],
    tags: ['gun', 'mod', 'barrel', 'heavy', 'iron', 'ribs', 'crown'], emoji: [],
    about: 'Gnome Theft Auto: the Heavy Barrel. A thick dark iron cylinder along y (radius 0.025, length 0.18) with three raised fluting ribs and a heavy crown ring at the tip.',
    examine: [
      'A thick dark iron tube with three long ribs running its length and a heavy crown ring at the tip, like a tree stump that has decided to be a barrel.',
      'Saying: a heavy barrel is slow to start and slower to stop, and so is every gnome who has had to carry one up the Rockery.',
      'Tip: rest the crown on a fence post for a steady shot. The post will not complain, though it may lean a little.',
      'Joke: it weighs so much that it has its own name for the gnome who carries it, and the name is not repeatable in front of hedges.',
      'The ribs are for grip, the shop says. The gnomes say the ribs are where the rust gets in, which makes them a tradition.',
    ],
    parts: [
      { s: 'cyl', d: [0.025, 0.025, 0.18], at: [0, 0.09, 0], c: 'iron-dark', seg: 10, name: 'barrel' }, // iron body
      { s: 'box', d: [0.008, 0.16, 0.008], at: [0.027, 0.09, 0], c: 'iron', name: 'rib' },                  // rib, +x
      { s: 'box', d: [0.008, 0.16, 0.008], at: [-0.0135, 0.09, 0.0234], c: 'iron', name: 'rib' },          // rib, back left
      { s: 'box', d: [0.008, 0.16, 0.008], at: [-0.0135, 0.09, -0.0234], c: 'iron', name: 'rib' },         // rib, front left
      { s: 'ring', d: [0.03, 0.008], at: [0, 0.175, 0], rot: [90, 0, 0], c: 'iron-dark', seg: 8, name: 'crown' }, // crown ring
    ],
  },
  {
    id: 'gunmod-ported-barrel', name: 'Ported Barrel', category: 'tool', uses: ['place'],
    tags: ['gun', 'mod', 'barrel', 'ported', 'steel', 'ports', 'vents'], emoji: [],
    about: 'Gnome Theft Auto: the Ported Barrel. A steel cylinder along y (radius 0.017, length 0.16) with a row of four small black ports down its -z side and a ring at the tip.',
    examine: [
      'A steel tube with a row of small black ports down one side and a ring at the tip, like a sieve that has joined the army.',
      'Saying: the ports let the bang out sideways, so the bang never has to go through the gnome who fired it. That is the whole philosophy.',
      'Tip: keep the ports facing the hedge, not the friendly gnome on your left. Friendship is delicate and the ports are not.',
      'Joke: the ports are very good at letting pressure out, which is more than the shop could say for its own opinions.',
      'Four ports, always four. A gnome once counted five, and the fifth has never been found, which is either a mystery or a very small hole.',
    ],
    parts: [
      { s: 'cyl', d: [0.017, 0.017, 0.16], at: [0, 0.08, 0], c: 'steel', seg: 8, name: 'barrel' },   // steel tube
      { s: 'box', d: [0.012, 0.012, 0.01], at: [0, 0.03, -0.018], c: 'black', name: 'port' },           // port, lowest
      { s: 'box', d: [0.012, 0.012, 0.01], at: [0, 0.06, -0.018], c: 'black', name: 'port' },           // port
      { s: 'box', d: [0.012, 0.012, 0.01], at: [0, 0.09, -0.018], c: 'black', name: 'port' },           // port
      { s: 'box', d: [0.012, 0.012, 0.01], at: [0, 0.12, -0.018], c: 'black', name: 'port' },           // port, highest
      { s: 'ring', d: [0.02, 0.004], at: [0, 0.155, 0], rot: [90, 0, 0], c: 'iron-dark', seg: 8 },        // tip ring
    ],
  },
  {
    id: 'gunmod-foregrip', name: 'Twig Foregrip', category: 'tool', uses: ['place'],
    tags: ['gun', 'mod', 'grip', 'foregrip', 'twig', 'wood', 'stick'], emoji: [],
    about: 'Gnome Theft Auto: the Twig Foregrip. A mount block on the -z side at the top, a wooden stick sticking out along +z from under the barrel, with a small knot ball at the end.',
    examine: [
      'A forked twig handle on a small block: the block grips the gun from above, and the wooden stick sticks out forward with a knot on the end.',
      'Saying: a stick under the gun is a hand that is not yours, and that is the most useful kind of help in a hedge.',
      'Tip: hold it by the knot if you are in a hurry. It is the only part of the twig that has never been bent.',
      'Joke: the twig came from a tree that once stood by the Shed, and it has been pointing in the same direction ever since.',
      'The knot has a face in it, if you look at it sideways, and the face always looks slightly disappointed in you.',
    ],
    parts: [
      { s: 'box', d: [0.03, 0.03, 0.03], at: [0, 0.015, -0.03], c: 'iron-dark', name: 'mount' },       // mount block, -z side
      { s: 'cyl', d: [0.009, 0.009, 0.1], rot: [90, 0, 0], at: [0, 0.014, 0.03], c: 'wood', seg: 8, name: 'stick' }, // wooden stick along +z
      { s: 'ball', d: [0.014], at: [0, 0.014, 0.085], c: 'wood-dark', seg: 8, name: 'knot' },           // knot ball
    ],
  },
  {
    id: 'gunmod-laser', name: 'Firefly Laser', category: 'tool', uses: ['place'],
    tags: ['gun', 'mod', 'laser', 'sight', 'optic', 'firefly', 'glow', 'light'], emoji: [],
    about: 'Gnome Theft Auto: the Firefly Laser. A small box housing along y with a glass jar holding a glowing yellow-green firefly and a glowing red emitter dot at the top. Mount side on -z.',
    examine: [
      'A small dark housing with a glass jar on top holding a yellow-green glow, and a red dot at the tip that never blinks, not even when asked.',
      'Saying from the Verge: a laser is a firefly that has been asked to stand very still and point, which no firefly has ever agreed to.',
      'Tip: the red dot lands where the barrel points, not where the gnome is hoping. Hope is not a sight.',
      'Joke: the firefly is very bright for a bug in a jar, and it has been very quiet about the rest of the arrangement.',
      'The housing has a tiny leaf painted on it, the mark of a gnome who tried to make it look natural and gave up halfway.',
    ],
    parts: [
      { s: 'box', d: [0.04, 0.06, 0.04], at: [0, 0.03, 0], c: 'iron-dark', name: 'housing' },        // housing
      { s: 'box', d: [0.03, 0.04, 0.01], at: [0, 0.02, -0.025], c: 'iron', name: 'mount' },            // mount, -z side
      { s: 'cyl', d: [0.012, 0.012, 0.02], at: [0, 0.07, 0], c: 'glass', alpha: 0.4, seg: 8, name: 'jar' }, // glass jar
      { s: 'ball', d: [0.008], at: [0, 0.07, 0], c: 0xc8e63a, glow: true, seg: 8, name: 'firefly' },    // yellow-green firefly
      { s: 'ball', d: [0.007], at: [0, 0.085, 0], c: 'red', glow: true, seg: 8, name: 'emitter' },      // red emitter dot
    ],
  },
];
