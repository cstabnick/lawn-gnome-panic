// Gnome Theft Auto: the scrap a wrecked mower sheds (three debris pieces) and three reward gear items for the fleet achievements.
// Ids are a contract with the game and the achievement catalog: do not rename them.
import type { PrefabDef } from '../types';

const MOWER_RED = 0xd8342c;

export const GTA_FLEET: readonly PrefabDef[] = [
  // ---- Mower Panel Scrap: a bent red body panel knocked off a mower -------------------------------------------------
  {
    id: 'mower-scrap-panel', name: 'Mower Panel Scrap', category: 'prop', uses: ['place'],
    tags: ['scrap', 'panel', 'mower', 'body', 'metal', 'debris', 'gta'], emoji: [],
    tint: MOWER_RED,
    about: 'Gnome Theft Auto: the Mower Panel Scrap. A bent red body panel with a kink in the middle and one loose bolt head. Lies flat. Tint sets the colour.',
    examine: [
      'A red metal panel, bent in the middle as if something heavy sat on it and then thought better of it.',
      'Saying: a mower that loses a panel is only trimming its figure, and the Yard will take the rest in due course.',
      'Tip: the sharp corner cuts boots. Step round it, or kick it into the hedge where it will not be anyone\'s problem.',
      'Joke: the paint still says "Turfton Pride" on the inside, which is more than the mower ever did for anyone.',
      'The bolt head is still in the panel. Its partner is somewhere under the Oakcount with the other one.',
    ],
    parts: [
      { s: 'box', d: [0.22, 0.03, 0.3], at: [-0.11, 0.015, 0], c: 'tint', name: 'panel-a' },
      { s: 'box', d: [0.23, 0.03, 0.3], at: [0.12, 0.015, 0], rot: [0, -6, 0], c: 'tint', name: 'panel-b' },
      { s: 'cyl', d: [0.025, 0.025, 0.02], at: [-0.12, 0.04, 0.08], c: 'iron', seg: 6, name: 'bolt-head' },
    ],
  },
  // ---- Loose Bolt: a hex bolt with a thin shank --------------------------------------------------------------------
  {
    id: 'mower-scrap-bolt', name: 'Loose Bolt', category: 'prop', uses: ['place'],
    tags: ['bolt', 'hex', 'fastener', 'metal', 'scrap', 'debris', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: the Loose Bolt. A steel hex bolt about a finger long, stood on its head. Dropped by a mower that did not want to lose it.',
    examine: [
      'A hex bolt, steel-grey and about the length of a gnome\'s finger, with a thread that goes round three times and then gives up.',
      'Saying: a bolt that falls out is a bolt that was never tightened, and gnomes have been saying so since the first mower.',
      'Tip: do not put a loose bolt in your pocket. It will work its way out through the lining and show up in the soup.',
      'Joke: the Tall Ones have hundreds of these in a tin, and they still say the tin is "for emergencies".',
      'The head is worn flat on one side, which is where the spanner always slipped and somebody said a word.',
    ],
    parts: [
      { s: 'cyl', d: [0.04, 0.04, 0.035], at: [0, 0.0175, 0], c: 'steel', seg: 6, name: 'head' },
      { s: 'cyl', d: [0.012, 0.012, 0.105], at: [0, 0.0875, 0], c: 'iron', seg: 6, name: 'shank' },
    ],
  },
  // ---- Seat Spring: a coil from under a mower seat -----------------------------------------------------------------
  {
    id: 'mower-scrap-spring', name: 'Seat Spring', category: 'prop', uses: ['place'],
    tags: ['spring', 'coil', 'seat', 'steel', 'metal', 'scrap', 'debris', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: the Seat Spring. A steel coil spring of five turns, the sort that held up a mower seat and then gave up. Stands upright.',
    examine: [
      'Five steel loops stacked one above the other, each a little bit tired and a little bit bent out of its proper shape.',
      'Saying: a spring that has been sat on will bounce back, but only as far as the last person who sat on it.',
      'Tip: a coil like this bounces. Do not drop it on your foot, and do not drop it on anyone else\'s foot either.',
      'Joke: the seat was a very comfortable seat until the spring was pulled out, and then it was only a board.',
      'The top coil has a bend that fits a particular gnome\'s bottom. Nobody will say whose, and nobody will sit there.',
    ],
    parts: [
      { s: 'ring', d: [0.05, 0.012], at: [0, 0.012, 0], rot: [90, 0, 0], c: 'steel', seg: 8, name: 'coil-0' },
      { s: 'ring', d: [0.05, 0.012], at: [0, 0.057, 0], rot: [90, 0, 0], c: 'steel', seg: 8, name: 'coil-1' },
      { s: 'ring', d: [0.05, 0.012], at: [0, 0.102, 0], rot: [90, 0, 0], c: 'steel', seg: 8, name: 'coil-2' },
      { s: 'ring', d: [0.05, 0.012], at: [0, 0.147, 0], rot: [90, 0, 0], c: 'steel', seg: 8, name: 'coil-3' },
      { s: 'ring', d: [0.05, 0.012], at: [0, 0.192, 0], rot: [90, 0, 0], c: 'steel', seg: 8, name: 'coil-4' },
    ],
  },
  // ---- Country Club Visor: a white visor band with a green peak (head) ----------------------------------------------
  {
    id: 'country-club-visor', name: 'Country Club Visor', category: 'armor', uses: ['wear-head'],
    tags: ['visor', 'golf', 'country', 'club', 'peak', 'white', 'green', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: the Country Club Visor. A white sweatband visor with a green peak and a tiny flag pin on the side. Sized like the Sunday Driver\'s Cap.',
    examine: [
      'A white band with a green peak on the front and a little flag pin on the side, the sort of thing worn to be seen on the links.',
      'Saying: the club shows its members by the visor, and the members show their handicap by how often the visor falls off.',
      'Tip: the peak keeps the sun out of your eyes on the putting green, but it will not keep the ball out of the rough.',
      'Joke: the flag on the pin is the club flag, and the club has never been able to agree which one that is.',
      'The white band is spotless, which proves nobody who wears it has ever been near a mower in their life.',
    ],
    parts: [
      { s: 'ring', d: [0.16, 0.03], at: [0, 0.03, 0], rot: [90, 0, 0], c: 'white', seg: 12, name: 'band' },
      { s: 'box', d: [0.26, 0.012, 0.14], at: [0, 0.075, 0.13], c: 'green', name: 'peak' },
      { s: 'cyl', d: [0.005, 0.005, 0.12], at: [-0.16, 0.1, 0], c: 'steel', seg: 6, name: 'pin' },
      { s: 'box', d: [0.07, 0.04, 0.004], at: [-0.125, 0.15, 0], c: 'red', name: 'flag' },
    ],
  },
  // ---- Spark Plug Pendant: a plug on a cord (neck) -------------------------------------------------------------------
  {
    id: 'spark-plug-pendant', name: 'Spark Plug Pendant', category: 'armor', uses: ['wear-neck'],
    tags: ['pendant', 'necklace', 'spark', 'plug', 'cord', 'mower', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: the Spark Plug Pendant. A white ceramic spark plug with a steel hex and a copper tip, hung on a cord loop. Worn on the neck, hanging at the chest.',
    examine: [
      'A spark plug on a cord, white ceramic with a steel hex at the top and a little copper tip at the bottom, worn with pride.',
      'Saying: a plug that sparks keeps the engine running, and a gnome that wears one keeps the engine running in his heart.',
      'Tip: keep the tip clean. A plug with soot on it will not spark, and a gnome with soot on him will not be invited to sit down.',
      'Joke: the Tall Ones put these in their machines in rows, and the gnomes wear them one at a time, which is the sensible way.',
      'The copper tip has gone green at one edge, which the wearer says is "character" and the mower says is "damp".',
    ],
    parts: [
      { s: 'ring', d: [0.07, 0.008], at: [0, 0.14, 0], c: 'leather-dark', seg: 10, name: 'cord' },
      { s: 'cyl', d: [0.02, 0.02, 0.05], at: [0, 0.035, 0.03], c: 'white', seg: 8, name: 'insulator' },
      { s: 'cyl', d: [0.026, 0.026, 0.014], at: [0, 0.07, 0.03], c: 'steel', seg: 6, name: 'hex' },
      { s: 'cyl', d: [0.006, 0.006, 0.02], at: [0, 0.01, 0.03], c: 'copper', seg: 6, name: 'tip' },
    ],
  },
  // ---- Spare Tyre Pack: a spare wheel in a frame, worn on the back ---------------------------------------------------
  {
    id: 'spare-tyre-pack', name: 'Spare Tyre Pack', category: 'armor', uses: ['wear-back'],
    wear: { at: [0, -0.08, 0], scale: 0.85 },
    tags: ['tyre', 'tire', 'spare', 'wheel', 'pack', 'backpack', 'frame', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: the Spare Tyre Pack. A small black spare tyre with a steel hub, in a dark frame with two shoulder straps. Worn on the back like the Water Tank Pack.',
    examine: [
      'A small black spare tyre with a steel hub, bolted into a dark frame that has seen better days and more potholes.',
      'Saying: always carry a spare, and you will never need one, because the carrying is the only thing that wears you down.',
      'Tip: the hub is sharp at the edges. Keep the straps tight, or the hub will find the back of your neck on the first bump.',
      'Joke: a spare tyre worn on the back is the only time a gnome is allowed to say he is "running a bit flat" with pride.',
      'The tread has the name of a Tall One town on one side, which nobody has managed to pronounce since the rain came.',
    ],
    parts: [
      { s: 'box', d: [0.26, 0.36, 0.03], at: [0, 0.19, -0.22], c: 'iron-dark', name: 'frame' },
      { s: 'ring', d: [0.11, 0.035], at: [0, 0.19, -0.12], c: 'black', seg: 10, name: 'tyre' },
      { s: 'cyl', d: [0.04, 0.04, 0.03], at: [0, 0.19, -0.12], rot: [90, 0, 0], c: 'steel', seg: 8, name: 'hub' },
      { s: 'box', d: [0.03, 0.36, 0.02], at: [0.09, 0.19, 0.02], c: 'leather-dark', mirror: true, name: 'strap' },
    ],
  },
  // ---- Spent Acorn Shell: the husk and cap of a fired acorn round (gun casings, Gnome Theft Auto) -------------------
  {
    id: 'acorn-shell', name: 'Spent Acorn Shell', category: 'prop', uses: ['place'],
    tags: ['acorn', 'shell', 'casing', 'ammo', 'spent', 'gta', 'debris'], emoji: [],
    tint: 0x8a5a2b,
    about: 'Gnome Theft Auto: the Spent Acorn Shell. The empty husk and cupule cap of a fired acorn round, about 4 cm long. Lies on its side.',
    examine: [
      'An open acorn husk, hollow at one end, with its cupule cap still stuck on the back and a crack along one side.',
      'Saying: a shell that has gone off has done its job, and the gnome who fired it will be the first to say so.',
      'Tip: gather your shells after a fight. A gnome who counts his ammo is a gnome who does not run dry in the middle of a skirmish.',
      'Joke: the Tall Ones call these "brass", which makes no sense, because acorns have never been brass in their lives.',
      'The crack goes straight through the husk, which means it was a good shot and went through whatever was in the way.',
    ],
    parts: [
      { s: 'cyl', d: [0.018, 0.018, 0.04], at: [0, 0.02, 0], c: 'tint', seg: 8, name: 'husk' },
      { s: 'ring', d: [0.02, 0.006], at: [0, 0.036, 0], c: 'leather-dark', seg: 8, name: 'cap' },
    ],
  },
  // ---- Pulled-Over Cap: reward for cracking gnomes at the wheel (achievement gta-driver-down) -----------------------
  {
    id: 'pulled-over-cap', name: 'Pulled-Over Cap', category: 'armor', uses: ['wear-head'],
    tags: ['cap', 'hat', 'peaked', 'stop', 'traffic', 'warden', 'head', 'reward', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a navy peaked cap with a red stop disc badge on the front. Reward for the Pulled Over achievement. Plain colours, no tint.',
    examine: [
      'A navy peaked cap with a stiff crown, a black peak and a little red stop disc pinned to the front.',
      'Saying: a gnome at the wheel is going somewhere, and a gnome in this cap decides whether they get there.',
      'Tip: tip the peak to the drivers you let pass. The ones you do not let pass will not be looking.',
      'Joke: the HOA asked to borrow it for a parking review and gave it back with three warnings stapled to the lining.',
      'The stop disc has a dent in it. Nobody says how, and the cap does not say either.',
    ],
    parts: [
      { s: 'cyl', d: [0.14, 0.15, 0.09], at: [0, 0.045, 0], c: 0x1f2a4a, seg: 10 },
      { s: 'cyl', d: [0.17, 0.16, 0.03], at: [0, 0.105, 0], c: 0x1f2a4a, seg: 10 },
      { s: 'box', d: [0.2, 0.014, 0.1], at: [0, 0.007, 0.13], c: 'black' },
      { s: 'cyl', d: [0.03, 0.03, 0.008], at: [0, 0.07, 0.15], rot: [90, 0, 0], c: 'red', seg: 8 },
    ],
  },
  // ---- Acorn-Shell Bandolier: reward for leaving 500 shells (achievement gta-shell-collector) ------------------------
  {
    id: 'acorn-shell-bandolier', name: 'Acorn-Shell Bandolier', category: 'armor', uses: ['wear-back'],
    tags: ['bandolier', 'acorn', 'shell', 'belt', 'strap', 'ammo', 'back', 'reward', 'gta'], emoji: [],
    about: 'Gnome Theft Auto: a leather strap worn on the back with a row of spent acorn shells in loops. Reward for the Shell Shock achievement. Plain colours, no tint.',
    examine: [
      'A broad leather strap with a row of loops, each holding a spent acorn shell, polished by a lot of handling.',
      'Saying: an acorn fired is an acorn spent, and a gnome who keeps the shells has kept count of every one.',
      'Tip: do not run with it unbuckled. The shells rattle, and every gnome in Turfton turns round to look.',
      'Joke: the squirrels think it is a lunch belt and follow the wearer home with great hope and no luck.',
      'One loop near the buckle is empty. The wearer says it is for the next one, and means it.',
    ],
    parts: [
      { s: 'box', d: [0.06, 0.32, 0.02], at: [0, 0.16, 0], rot: [0, 0, 35], c: 'leather' },
      { s: 'cyl', d: [0.016, 0.016, 0.04], at: [-0.06, 0.08, 0.02], rot: [0, 0, 35], c: 0x8a5a2b, seg: 6 },
      { s: 'cyl', d: [0.016, 0.016, 0.04], at: [-0.02, 0.14, 0.02], rot: [0, 0, 35], c: 0x8a5a2b, seg: 6 },
      { s: 'cyl', d: [0.016, 0.016, 0.04], at: [0.02, 0.2, 0.02], rot: [0, 0, 35], c: 0x8a5a2b, seg: 6 },
      { s: 'cyl', d: [0.016, 0.016, 0.04], at: [0.06, 0.26, 0.02], rot: [0, 0, 35], c: 0x8a5a2b, seg: 6 },
      { s: 'box', d: [0.05, 0.04, 0.025], at: [0.09, 0.3, 0.005], c: 'brass' },
    ],
  },
];
