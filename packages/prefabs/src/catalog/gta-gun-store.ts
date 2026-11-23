// Gnome Theft Auto, Ammu-Gnation: the storefront, the back-room display stage props and the achievement gear (ammu-*). One owner: the issue that fills this file. Starts empty.
import type { Part, PrefabDef } from '../types';

// Ammu-Gnation: olive drab and safety orange, the gun-mod store.
const OLIVE = 0x4b5d2a;
const OLIVE_DARK = 0x3a4820;
const ORANGE = 0xff7a1a;

// Dog-tag chain: twelve beads on a ring of radius 0.15 (every 30 degrees), centred on the neck.
const CHAIN_BEADS: readonly (readonly [number, number])[] = Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * Math.PI * 2;
  return [Math.round(Math.sin(a) * 0.2 * 1000) / 1000, Math.round((Math.cos(a) * 0.2 - 0.05) * 1000) / 1000] as const;
});

export const GTA_GUN_STORE: readonly PrefabDef[] = [
  {
    id: 'gta-ammu-gnation', name: 'Ammu-Gnation', category: 'prop', uses: ['place'],
    tags: ['ammu', 'gnation', 'gun', 'store', 'shop', 'mods', 'olive', 'orange', 'turfton'], emoji: [],
    footprint: { r: 2.4, h: 2.7 },
    about: 'Gnome Theft Auto: Ammu-Gnation. A walk-in olive drab gun-mod store open toward +z, with an orange sign board, a glowing crosshair emblem, a pegboard wall and a counter inside.',
    examine: [
      'A squat olive shop front open toward the path, with a safety orange sign board and a glowing crosshair emblem above the door.',
      'Slogan, painted on the board: The Gun Is Free. The Shiny Bits Are Not.',
      'Tip: the pegboard behind the counter shows what is in stock, and the stock is mostly empty pegs with a few silhouettes.',
      'Joke: every gun in the window is free, and every gnome who asks for one is told the bolt-on is the part that costs.',
      'Fort Sandpit surplus hangs on the back wall, and nobody in Turfton has ever explained why the surplus is still warm.',
    ],
    parts: [
      { s: 'box', d: [0.3, 2.0, 3.6], at: [2.05, 1.0, 0], c: OLIVE, mirror: true },              // side walls (x 1.9..2.2)
      { s: 'box', d: [3.84, 1.97, 0.3], at: [0, 0.995, -1.64], c: OLIVE },                        // back wall (between the side walls)
      { s: 'box', d: [4.6, 0.16, 3.9], at: [0, 2.08, 0.05], c: OLIVE_DARK },                      // roof
      { s: 'box', d: [0.32, 0.12, 0.04], at: [2.05, 1.6, 1.82], c: ORANGE, mirror: true },        // orange band on the wall fronts
      { s: 'box', d: [0.08, 0.1, 0.06], at: [1.5, 2.2, 1.9], c: 'iron-dark', mirror: true },      // sign posts
      { s: 'box', d: [3.6, 0.5, 0.08], at: [0, 2.45, 1.9], c: ORANGE },                           // sign board over the front
      { s: 'ring', d: [0.16, 0.03], at: [-1.45, 2.45, 1.96], c: 'white', glow: true },            // crosshair emblem ring
      { s: 'box', d: [0.36, 0.03, 0.02], at: [-1.45, 2.45, 1.97], c: 'white', glow: true },       // emblem cross bar
      { s: 'box', d: [0.03, 0.36, 0.02], at: [-1.45, 2.45, 1.975], c: 'white', glow: true },      // emblem upright bar
      { s: 'box', d: [2.4, 0.08, 0.02], at: [0.25, 2.45, 1.95], c: 'white', glow: true },         // lettering bar (stands in for the name)
      { s: 'box', d: [2.6, 0.4, 0.4], at: [0, 0.2, -0.7], c: 'wood-dark' },                       // counter
      { s: 'box', d: [2.7, 0.04, 0.48], at: [0, 0.42, -0.7], c: 'stone' },                        // counter top
      { s: 'box', d: [0.9, 0.18, 0.3], at: [0.6, 0.53, -0.7], c: 'glass', alpha: 0.35 },          // glass case on the counter
      { s: 'box', d: [3.0, 1.0, 0.04], at: [0, 1.2, -1.47], c: 'wood' },                          // pegboard on the back wall
      { s: 'box', d: [0.5, 0.08, 0.03], at: [-0.9, 1.45, -1.435], c: 'iron-dark' },               // rack gun silhouettes
      { s: 'box', d: [0.6, 0.08, 0.03], at: [0.15, 1.5, -1.435], c: 'iron-dark' },
      { s: 'box', d: [0.45, 0.08, 0.03], at: [1.05, 1.4, -1.435], c: 'iron-dark' },
      { s: 'box', d: [0.55, 0.08, 0.03], at: [-0.4, 1.0, -1.435], c: ORANGE },
      { s: 'box', d: [0.4, 0.3, 0.3], at: [-1.5, 0.15, 0.6], c: 'wood' },                         // ammo crates
      { s: 'box', d: [0.34, 0.26, 0.3], at: [1.5, 0.13, 0.9], c: OLIVE_DARK },
    ],
  },
  {
    id: 'ammu-stage-counter', name: 'Stage Counter', category: 'prop', uses: ['place'],
    tags: ['ammu', 'counter', 'glass', 'case', 'display', 'gun', 'parts', 'stage', 'shop', 'turfton'], emoji: [],
    footprint: { r: 1.3, h: 0.5 },
    about: 'Ammu-Gnation back-room stage: a long glass-topped display counter, wooden base with an orange trim strip, a few gun parts under the glass. Front toward +z.',
    examine: [
      'A long glass-topped counter with a wooden base edged in safety orange, and a few gun parts laid out under the glass like jewellery.',
      'Saying: the parts that matter are always kept under the glass, where a gnome has to ask for them by name.',
      'Tip: tap the glass only once. The shopkeeper hears the first tap and nothing after it, which is how he likes it.',
      'Joke: the till sits on the other side of the counter, which is the only part of the shop that never gets dusty.',
    ],
    parts: [
      { s: 'box', d: [2.4, 0.4, 0.6], at: [0, 0.2, 0], c: 'wood-dark' },                        // wooden base
      { s: 'box', d: [2.42, 0.05, 0.02], at: [0, 0.25, 0.31], c: ORANGE },                       // orange trim strip (+z)
      { s: 'box', d: [2.4, 0.1, 0.6], at: [0, 0.45, 0], c: 'glass', alpha: 0.35 },              // glass top case
      { s: 'box', d: [0.22, 0.05, 0.06], at: [-0.6, 0.425, 0], c: 'iron-dark' },                // pistol part
      { s: 'cyl', d: [0.02, 0.02, 0.2], rot: [0, 0, 90], at: [0.1, 0.43, 0], c: 'steel', seg: 6 }, // barrel
      { s: 'box', d: [0.06, 0.08, 0.04], at: [0.7, 0.44, 0], c: 'iron' },                        // magazine
      { s: 'box', d: [0.14, 0.03, 0.04], at: [-0.1, 0.415, -0.15], c: 'gold' },                  // gold trigger guard
    ],
  },
  {
    id: 'ammu-stage-pegboard', name: 'Stage Pegboard', category: 'prop', uses: ['place'],
    tags: ['ammu', 'pegboard', 'board', 'wall', 'pegs', 'gun', 'silhouette', 'display', 'shop', 'turfton'], emoji: [],
    footprint: { r: 1.6, h: 2.1 },
    about: 'Ammu-Gnation back-room stage: a free-standing wood pegboard on two feet, rows of dark peg dots, gun silhouettes and an orange AMMU-GNATION bar along the top. Front toward +z.',
    examine: [
      'A wooden board on two feet, rows of dark peg holes, a few gun shapes in silhouette and an orange bar running along the top.',
      'Saying from the Shed: a pegboard with the same gun on every hook is a shop, and a pegboard with a gap is a story.',
      'Tip: hang the spare parts from the lower pegs first. The upper pegs are for the things a gnome means to keep.',
      'Joke: the silhouettes are all the same gun, and the shopkeeper says that is a choice, not a stock problem.',
    ],
    parts: [
      { s: 'box', d: [3.0, 2.0, 0.08], at: [0, 1.4, 0], c: 'wood' },                            // pegboard
      { s: 'box', d: [0.12, 0.4, 0.3], at: [-1.2, 0.2, 0], c: 'wood-dark', mirror: true },       // feet
      { s: 'box', d: [2.8, 0.14, 0.1], at: [0, 2.47, 0], c: ORANGE },                            // orange AMMU-GNATION bar
      { s: 'ball', d: [0.025], at: [-1.2, 0.7, 0.045], scale: [1, 1, 0.5], c: 'iron-dark', seg: 6 }, // peg holes
      { s: 'ball', d: [0.025], at: [-0.6, 0.7, 0.045], scale: [1, 1, 0.5], c: 'iron-dark', seg: 6 },
      { s: 'ball', d: [0.025], at: [0, 0.7, 0.045], scale: [1, 1, 0.5], c: 'iron-dark', seg: 6 },
      { s: 'ball', d: [0.025], at: [0.6, 0.7, 0.045], scale: [1, 1, 0.5], c: 'iron-dark', seg: 6 },
      { s: 'ball', d: [0.025], at: [1.2, 0.7, 0.045], scale: [1, 1, 0.5], c: 'iron-dark', seg: 6 },
      { s: 'ball', d: [0.025], at: [-1.2, 1.1, 0.045], scale: [1, 1, 0.5], c: 'iron-dark', seg: 6 },
      { s: 'ball', d: [0.025], at: [-0.6, 1.1, 0.045], scale: [1, 1, 0.5], c: 'iron-dark', seg: 6 },
      { s: 'ball', d: [0.025], at: [0, 1.1, 0.045], scale: [1, 1, 0.5], c: 'iron-dark', seg: 6 },
      { s: 'ball', d: [0.025], at: [0.6, 1.1, 0.045], scale: [1, 1, 0.5], c: 'iron-dark', seg: 6 },
      { s: 'ball', d: [0.025], at: [1.2, 1.1, 0.045], scale: [1, 1, 0.5], c: 'iron-dark', seg: 6 },
      { s: 'box', d: [0.5, 0.08, 0.03], at: [-0.9, 1.5, 0.055], c: 'iron-dark' },                // gun silhouettes
      { s: 'box', d: [0.6, 0.08, 0.03], at: [0.2, 1.85, 0.055], c: 'iron-dark' },
      { s: 'box', d: [0.45, 0.08, 0.03], at: [1.0, 1.85, 0.055], c: 'iron-dark' },
    ],
  },
  {
    id: 'ammu-stage-turntable', name: 'Stage Turntable', category: 'prop', uses: ['place'],
    tags: ['ammu', 'turntable', 'plinth', 'display', 'stand', 'ring', 'orange', 'gun', 'shop', 'turfton'], emoji: [],
    footprint: { r: 0.5, h: 0.3 },
    about: 'Ammu-Gnation back-room stage: a round display plinth, dark base, pale top disc with its top at y = 0.3 (the game sets the display gun above it) and a glowing orange ring around the edge.',
    examine: [
      'A round display plinth with a dark base, a pale top disc and a glowing orange ring around its edge, ready for one gun at a time.',
      'Saying: whatever sits on the turn gets seen from every side, which is more than most gnomes manage on a Sunday.',
      'Tip: stand back before you spin it. A turning gun at arm length is a gun that is about to be pointed at you.',
      'Joke: the plinth has turned every gun in the shop and still makes the same noise, which the shopkeeper calls the sound of profit.',
    ],
    parts: [
      { s: 'cyl', d: [0.45, 0.45, 0.24], at: [0, 0.12, 0], c: 'iron-dark', seg: 10 },           // dark base (y 0..0.24)
      { s: 'cyl', d: [0.42, 0.42, 0.04], at: [0, 0.28, 0], c: 'stone', seg: 10 },                // top disc (top at y 0.3)
      { s: 'ring', d: [0.42, 0.02], rot: [90, 0, 0], at: [0, 0.3, 0], c: ORANGE, glow: true },  // glowing ring round the top edge
    ],
  },
  {
    id: 'ammu-range-earmuffs', name: 'Range Earmuffs', category: 'armor', uses: ['wear-head'],
    tags: ['earmuffs', 'ear', 'muffs', 'headband', 'orange', 'olive', 'range', 'head', 'reward'], emoji: [],
    about: 'Ammu-Gnation: two big orange ear cups on a dark olive headband arch. Sits on the head at y 0. No tint.',
    examine: [
      'Two fat orange ear cups on a dark olive band that arches over the crown, built for a gnome who wants the world a little quieter.',
      'Saying from the Fence: a gnome who cannot hear the shouting cannot be told off for it either.',
      'Tip: wear them with the cups snug over the ears, or every loud noise still gets in through the gaps.',
      'Joke: the Range Officer wears a pair too, and nobody has ever once managed to get his attention without shouting.',
      'One cup has lost most of its orange where a gnome held it too long, and the bare clay shows through like a sunburn.',
    ],
    parts: [
      { s: 'cyl', d: [0.065, 0.065, 0.05], rot: [0, 0, 90], at: [0.2, 0.065, 0], c: ORANGE, seg: 10, mirror: true }, // ear cups
      { s: 'box', d: [0.03, 0.2, 0.03], at: [0.17, 0.1, 0], c: OLIVE_DARK, mirror: true },         // band drops
      { s: 'box', d: [0.36, 0.03, 0.03], at: [0, 0.215, 0], c: OLIVE_DARK },                      // headband arch
    ],
  },
  {
    id: 'ammu-dog-tags', name: 'Dog Tags', category: 'trinket', uses: ['wear-neck'],
    tags: ['dog', 'tags', 'chain', 'beads', 'steel', 'tag', 'acorn', 'neck', 'reward'], emoji: [],
    about: 'Ammu-Gnation: a thin bead chain loop round the neck with two small steel tags hanging on the chest, one stamped with a tiny acorn. No tint.',
    examine: [
      'A loop of tiny beads with two steel tags hanging at the chest, one of them stamped with a very small acorn.',
      'Saying: a gnome is known by the name on his tag, and by what he does when nobody has checked the tag.',
      'Tip: keep the tags apart when you walk, or they clink together and the Watch hears you from the Shed.',
      'Joke: the tags carry the gnome\'s name and his rank, and only the first of those two has ever been checked.',
      'The acorn stamp was struck by a gnome who had seen an acorn only once, so the acorn has a slightly worried look.',
    ],
    parts: [
      ...CHAIN_BEADS.map(([x, z]): Part => ({ s: 'ball', d: [0.008], at: [x, 0.02, z], c: 'silver', seg: 6 })), // chain beads
      { s: 'box', d: [0.035, 0.05, 0.004], at: [-0.012, 0.025, 0.17], c: 'steel' },            // tag one
      { s: 'box', d: [0.035, 0.05, 0.004], at: [0.012, 0.025, 0.175], c: 'silver' },             // tag two
      { s: 'ball', d: [0.008], at: [0.012, 0.02, 0.18], scale: [1, 1.2, 1], c: 'wood-dark', seg: 6 }, // acorn stamp
    ],
  },
  {
    id: 'ammu-golden-kazoo', name: 'Golden Kazoo', category: 'trinket', uses: ['hold'],
    tags: ['kazoo', 'party', 'gold', 'horn', 'whistle', 'buzz', 'noise', 'trinket', 'hum'], emoji: [],
    grip: [0, 0.06, 0],
    about: 'Ammu-Gnation: a gold party kazoo, upright, mouthpiece at the bottom and a flared bell at the top, with a small round buzzer bump on the side. Held at the lower body. No tint.',
    examine: [
      'A gold party kazoo, mouthpiece at the bottom and a flared bell at the top, with a small round membrane bump on the side.',
      'Saying from the Planting: a gnome who hums through a comb has a plan, and a gnome with a kazoo has no plan at all.',
      'Tip: hum into it steadily and it sounds like a fiddle. Stop humming and it sounds like a fiddle being sat on.',
      'Joke: it is the only instrument in Mossbottom that makes the Hat Watch tap their feet, and they do not know why.',
      'The bell has a dent the shape of a thumb, and gnomes agree it was made by a very confident gnome in a very quiet hour.',
    ],
    parts: [
      { s: 'cyl', d: [0.014, 0.014, 0.04], at: [0, 0.02, 0], c: 'gold', seg: 8 },                // mouthpiece (min y 0)
      { s: 'cyl', d: [0.02, 0.02, 0.12], at: [0, 0.1, 0], c: 'gold', seg: 8 },                  // body
      { s: 'cone', d: [0.06, 0.08], rot: [180, 0, 0], at: [0, 0.2, 0], c: 'gold', seg: 8 },    // flared bell (base up)
      { s: 'cyl', d: [0.055, 0.055, 0.012], at: [0, 0.24, 0], c: 'gold', seg: 8 },             // bell rim
      { s: 'ball', d: [0.014], at: [0, 0.1, 0.02], scale: [1, 1, 0.6], c: 'silver', seg: 6 },  // buzzer bump
    ],
  },
  {
    id: 'ammu-gun-case', name: 'Gun Case', category: 'armor', uses: ['wear-back'],
    tags: ['gun', 'case', 'hard', 'box', 'olive', 'orange', 'latch', 'handle', 'back', 'reward'], emoji: [],
    about: 'Ammu-Gnation: a long olive hard case slung on the back with orange latches and a carry handle on top. Sits on the back at y 0. No tint.',
    examine: [
      'A long olive hard case slung on the back, with orange latches and a carry handle worn pale where a hand has gripped it.',
      'Saying: a gnome who carries his case on his back has nothing to ask for at the Shed, because he has already brought it.',
      'Tip: keep the latches shut in the rain, or the case fills with water and whatever is inside goes soft as wet bread.',
      'Joke: the case is long enough to hold a rake, a spade and a whole argument, and the gnome has never said which is inside.',
      'A scratch runs from one corner to the other in the shape of a bird\'s foot, and the owner says it was there when he bought it.',
    ],
    parts: [
      { s: 'box', d: [0.12, 0.28, 0.05], at: [0, 0.14, -0.03], c: OLIVE },                      // hard case body (y 0..0.28)
      { s: 'box', d: [0.02, 0.03, 0.014], at: [0.04, 0.2, -0.002], c: ORANGE, mirror: true },    // orange latches
      { s: 'box', d: [0.06, 0.02, 0.02], at: [0, 0.29, -0.03], c: 'leather-dark' },             // carry handle
    ],
  },
  {
    id: 'ammu-gilded-pistol', name: 'Gilded Pistol', category: 'weapon', uses: ['hold'],
    wear: { rot: [180, 0, 0] },
    tags: ['pistol', 'gun', 'handgun', 'gold', 'gilded', 'pearl', 'grip', 'ranged', 'small'], emoji: [],
    grip: [0, 0.09, 0],
    about: 'Ammu-Gnation: the gta-pistol in gold, with a white pearl grip. Upright, grip at the bottom, a short barrel pointing up. No tint.',
    examine: [
      'A pistol gone gold, with a white pearl grip and a short barrel, and the shine is so thick it shows the shape of the hand.',
      'Saying from the Rockery: gold is the metal of gnomes who have stopped asking for permission.',
      'Tip: polish the grip with a damp sleeve, not a dry one. Pearl scratches, and a scratched pearl looks like an old egg.',
      'Joke: it is worth more than the gnome who holds it, which is why he holds it very carefully and never on Fence day.',
      'The gold is only a skin, and under a thumbnail it turns out to be the same dark steel as the free pistols on the Verge.',
    ],
    parts: [
      { s: 'box', d: [0.05, 0.14, 0.06], at: [0, 0.07, 0], c: 'white' },                     // pearl grip
      { s: 'box', d: [0.06, 0.1, 0.08], at: [0, 0.19, 0], c: 'gold' },                        // gold frame
      { s: 'cyl', d: [0.012, 0.012, 0.12], at: [0, 0.31, 0], c: 'gold', seg: 8 },            // gold barrel
      { s: 'box', d: [0.012, 0.03, 0.02], at: [0, 0.14, 0.04], c: 'gold' },                   // trigger
      { s: 'box', d: [0.03, 0.02, 0.05], at: [0, 0.27, 0.0], c: 'gold' },                     // slide step
    ],
  },
  {
    id: 'ammu-spotter-cap', name: "Spotter's Cap", category: 'armor', uses: ['wear-head'],
    tags: ['cap', 'hat', 'boonie', 'bush', 'olive', 'orange', 'scope', 'lens', 'spotter', 'head', 'reward'], emoji: [],
    about: "Ammu-Gnation: a boonie-style olive bush hat with a floppy brim, an orange band round the crown and a tiny scope lens clipped to the brim. Sits on the head at y 0. No tint.",
    examine: [
      'An olive bush hat with a floppy brim, an orange band round the crown and a tiny scope lens clipped to the front of the brim.',
      'Saying: a gnome who can see the hedge from the top of his hat has no need to climb the hedge.',
      'Tip: tip the brim down when the sun is high over the Fence, or the lens flashes and the whole garden knows where you are.',
      'Joke: the lens is so small it can only see one thing at a time, which is usually the gnome standing next to you.',
      'The orange band has a line of stitching that runs off the edge, and a gnome once said it was the start of a longer message.',
    ],
    parts: [
      { s: 'cyl', d: [0.24, 0.24, 0.012], at: [0, 0.006, 0], c: OLIVE, seg: 12 },              // floppy brim (min y 0)
      { s: 'cyl', d: [0.15, 0.16, 0.14], at: [0, 0.082, 0], c: OLIVE, seg: 10 },               // crown
      { s: 'ball', d: [0.15], at: [0, 0.152, 0], scale: [1, 0.35, 1], c: OLIVE, seg: 10 },    // flattened crown top
      { s: 'cyl', d: [0.163, 0.163, 0.03], at: [0, 0.04, 0], c: ORANGE, seg: 10 },             // orange band
      { s: 'cyl', d: [0.018, 0.018, 0.05], rot: [90, 0, 0], at: [0.12, 0.03, 0.17], c: 'iron-dark', seg: 8 }, // scope tube
      { s: 'ball', d: [0.012], at: [0.12, 0.03, 0.196], c: 'glass', seg: 6 },                  // scope lens
    ],
  },
];
