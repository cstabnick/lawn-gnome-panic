// New prefabs for nothing-left-to-collect (Nothing Left to Collect). One owner: add entries here and nowhere else.
import type { Part, PrefabDef } from '../types';

/** A paperclip standing upright: three nested U-loops of wire, `k` times the Clip's size (0.155 tall at k = 1). */
function clipParts(k: number): Part[] {
  const t = 0.005 * k; // wire radius
  const u = (n: number) => n * k;
  return [
    { s: 'ring', d: [u(0.03), t, 180], at: [0, u(0.035), 0], rot: [0, 0, 180], c: 'steel', seg: 8 },        // outer bottom U (min.y = 0)
    { s: 'pill', d: [t, u(0.09)], at: [u(-0.03), u(0.08), 0], c: 'steel', seg: 6 },                           // outer left side
    { s: 'pill', d: [t, u(0.08)], at: [u(0.03), u(0.075), 0], c: 'steel', seg: 6 },                           // outer right side (free end)
    { s: 'ring', d: [u(0.022), t, 180], at: [u(-0.008), u(0.125), 0], c: 'steel', seg: 8 },                  // top U
    { s: 'pill', d: [t, u(0.065)], at: [u(0.014), u(0.0925), 0], c: 'steel', seg: 6 },                        // middle side
    { s: 'ring', d: [u(0.016), t, 180], at: [u(-0.002), u(0.06), 0], rot: [0, 0, 180], c: 'steel', seg: 8 }, // inner bottom U
    { s: 'pill', d: [t, u(0.05)], at: [u(-0.018), u(0.085), 0], c: 'steel', seg: 6 },                         // inner side (free end)
  ];
}

/** A flat five-point star facing +z: a centre bump and five little cones pointing outwards. */
function starParts(cx: number, cy: number, cz: number, r: number, c: number | 'gold' | 'white', glow = false): Part[] {
  const parts: Part[] = [{ s: 'ball', d: [r * 0.55], at: [cx, cy, cz], scale: [1, 1, 0.4], c, glow, seg: 6 }];
  for (let i = 0; i < 5; i++) {
    const a = i * 72;
    const rad = (a * Math.PI) / 180;
    parts.push({
      s: 'cone', d: [r * 0.35, r], at: [cx - Math.sin(rad) * r * 0.75, cy + Math.cos(rad) * r * 0.75, cz],
      rot: [0, 0, a], scale: [1, 1, 0.4], c, glow, seg: 4,
    });
  }
  return parts;
}

// The Sticky Square leans back 10 degrees about its centre; this places a point given in the note's own frame.
const NOTE_Y = 0.09;
const TILT = (-10 * Math.PI) / 180;
function onNote(y: number, z: number): [number, number, number] {
  return [0, NOTE_Y + y * Math.cos(TILT) - z * Math.sin(TILT), y * Math.sin(TILT) + z * Math.cos(TILT)];
}

// The nameplate's sloped front faces +z and up: normal (0, 0.6, 0.8), so flat parts on it turn -36.87 degrees about x.
const SLOPE_ROT: [number, number, number] = [-36.87, 0, 0];

export const NOTHING_LEFT_TO_COLLECT: readonly PrefabDef[] = [
  {
    id: 'fc-paperclip', name: 'Clip', category: 'material', uses: ['collect'],
    tags: ['clip', 'paperclip', 'squiggle', 'silver', 'office', 'wire', 'collectathon'], emoji: ['📎'],
    about: 'Nothing Left to Collect: a silver paperclip ("Clip") standing upright, three nested U-loops of thin wire. A Floor 2 pickup.',
    examine: [
      'A small silver squiggle of wire, bent back on itself three times so it can hold on to nothing in particular.',
      'Bucketworth saying: one Clip holds two papers, and a thousand Clips hold a gnome in his job.',
      'Tip: they come back if you leave the floor alone for a while. The office calls that retention.',
      'Joke: the Annex has more Clips than papers, so the Clips mostly hold on to each other for company.',
      'Every Clip on Floor 2 is bent the same way round, as if someone had gone along and checked.',
    ],
    parts: clipParts(1),
  },
  {
    id: 'fc-sticky-note', name: 'Sticky Square', category: 'document', uses: ['collect', 'read'],
    tags: ['sticky', 'square', 'note', 'paper', 'yellow', 'office', 'collectathon'], emoji: ['🟨'],
    about: 'Nothing Left to Collect: a yellow sticky note ("Sticky Square") leaning back on a tiny stand, with a glue strip and two written lines.',
    examine: [
      'A square of yellow paper with a tacky strip along the top and two lines of very small, very hopeful writing.',
      'Office saying: collect enough Sticky Squares and they form a sentence. The sentence is collect more Sticky Squares.',
      'Tip: peel from the corner, never the middle, or it curls up and sulks for the rest of the afternoon.',
      'Joke: the note says do not forget. Nobody remembers what, which proves the note was right to worry.',
      'The glue strip has picked up one grey hair, a crumb and the faint smell of the water cooler.',
    ],
    parts: [
      { s: 'box', d: [0.1, 0.012, 0.05], at: [0, 0.006, 0], c: 'slate' },                                        // little stand (min.y = 0)
      { s: 'box', d: [0.16, 0.16, 0.01], at: onNote(0, 0), rot: [-10, 0, 0], c: 0xffe066 },                      // the note
      { s: 'box', d: [0.16, 0.03, 0.012], at: onNote(0.065, 0.001), rot: [-10, 0, 0], c: 0xe8c840 },             // glue strip
      { s: 'box', d: [0.11, 0.008, 0.003], at: onNote(0.02, 0.006), rot: [-10, 0, 0], c: 'slate' },              // writing
      { s: 'box', d: [0.08, 0.008, 0.003], at: onNote(-0.015, 0.006), rot: [-10, 0, 0], c: 'slate' },            // more writing
    ],
  },
  {
    id: 'fc-appreciation-token', name: 'Token of Appreciation', category: 'trinket', uses: ['collect'],
    tags: ['token', 'appreciation', 'coin', 'gold', 'heart', 'office', 'collectathon'], emoji: ['🪙'],
    about: 'Nothing Left to Collect: an upright gold coin with a raised heart and a thin rim. Every 100 of anything on Floor 2½ becomes one.',
    examine: [
      'A gold coin standing on its edge, a raised heart pressed into the face and a thin rim round it to keep the heart in.',
      'Bucketworth saying: a Token of Appreciation is worth exactly as much as the gnome who gave it meant it.',
      'Tip: ten of them make a Star of Recognition. Nobody has asked what the Star is worth, out of politeness.',
      'Joke: the Annex appreciates you so much it has printed the feeling in gold, which is cheaper than saying it.',
      'The back of the coin is blank, so a gnome can decide for himself what he was appreciated for.',
    ],
    parts: [
      { s: 'cyl', d: [0.1, 0.1, 0.025], at: [0, 0.1, 0], rot: [90, 0, 0], c: 'gold', seg: 12 },               // coin (min.y = 0)
      { s: 'ring', d: [0.094, 0.006], at: [0, 0.1, 0.009], c: 'brass', seg: 12 },                              // rim
      { s: 'ball', d: [0.024], at: [-0.017, 0.112, 0.014], scale: [1, 1, 0.4], c: 'honey', seg: 6 },          // heart, left lobe
      { s: 'ball', d: [0.024], at: [0.017, 0.112, 0.014], scale: [1, 1, 0.4], c: 'honey', seg: 6 },           // heart, right lobe
      { s: 'cone', d: [0.036, 0.042], at: [0, 0.084, 0.014], rot: [0, 0, 180], scale: [1, 1, 0.4], c: 'honey', seg: 6 }, // heart point
    ],
  },
  {
    id: 'fc-collector-badge', name: "Collector's Badge", category: 'trinket', uses: ['collect'],
    tags: ['badge', 'collector', 'pin', 'pink', 'star', 'ribbon', 'office', 'collectathon'], emoji: ['📛'],
    about: "Nothing Left to Collect: a round pink pin badge with a white star and two ribbon tails. Every 5 Stars of Recognition become one.",
    examine: [
      'A round pink pin badge with a white star in the middle and two short ribbon tails hanging below it.',
      'Bucketworth saying: a badge says you collected, and a second badge says you collected badges.',
      'Tip: pin it on the left. The right side of the coat is for the badge you get for wearing the first one.',
      'Joke: the badge has a little badge printed on it, and that badge has a badge, and so on, all the way down.',
      'The pin on the back is bent, as if a gnome had once tried to put it away and changed his mind.',
    ],
    parts: [
      { s: 'box', d: [0.035, 0.08, 0.006], at: [-0.028, 0.04, -0.012], rot: [0, 0, -12], c: 'glaze-blue' },  // ribbon tail (min.y ~ 0)
      { s: 'box', d: [0.035, 0.08, 0.006], at: [0.028, 0.04, -0.012], rot: [0, 0, 12], c: 'glaze-blue' },    // ribbon tail
      { s: 'cyl', d: [0.09, 0.09, 0.02], at: [0, 0.15, 0], rot: [90, 0, 0], c: 0xff8fd0, seg: 12 },            // pink face
      { s: 'ring', d: [0.086, 0.006], at: [0, 0.15, 0.008], c: 0xd0559f, seg: 12 },                           // rim
      ...starParts(0, 0.15, 0.012, 0.04, 'white'),                                                             // white star
    ],
  },
  {
    id: 'fc-water-cooler', name: 'Water Cooler', category: 'furniture', uses: ['place'],
    tags: ['water', 'cooler', 'bottle', 'cups', 'office', 'gossip', 'collectathon'], emoji: ['🚰'],
    footprint: { r: 0.25, h: 1.1 },
    about: 'Nothing Left to Collect: an office water cooler, a white cabinet with a big upside-down blue bottle, two taps and a stack of paper cups.',
    examine: [
      'A white cabinet with a big blue bottle balanced upside down on top, two little taps and a stack of paper cups.',
      'Office saying: everything worth knowing in the Annex has been said within three steps of the water cooler.',
      'Tip: the blue tap is cold and the red tap is also cold. The red one is just there to keep the blue one company.',
      'Joke: Sorrel Gluepot has stood here so long that the Annex lists her as part of the cooler.',
      'The bottle gulps once every few minutes, whether or not anyone is drinking, as if it had remembered something.',
    ],
    parts: [
      { s: 'box', d: [0.4, 0.6, 0.4], at: [0, 0.3, 0], c: 'white' },                                         // cabinet (min.y = 0)
      { s: 'box', d: [0.22, 0.02, 0.08], at: [0, 0.34, 0.23], c: 'iron-dark' },                              // drip tray
      { s: 'box', d: [0.04, 0.04, 0.06], at: [-0.05, 0.45, 0.22], c: 'blue' },                               // cold tap
      { s: 'box', d: [0.04, 0.04, 0.06], at: [0.05, 0.45, 0.22], c: 'red' },                                 // the other cold tap
      { s: 'cyl', d: [0.06, 0.06, 0.06], at: [0, 0.62, 0], c: 0x7fc6ff, alpha: 0.6, seg: 10 },              // bottle neck
      { s: 'ball', d: [0.17], at: [0, 0.72, 0], scale: [1, 0.5, 1], c: 0x7fc6ff, alpha: 0.6, seg: 10 }, // shoulder
      { s: 'cyl', d: [0.17, 0.17, 0.28], at: [0, 0.86, 0], c: 0x7fc6ff, alpha: 0.6, seg: 10 },              // bottle body
      { s: 'ball', d: [0.17], at: [0, 1.0, 0], scale: [1, 0.35, 1], c: 0x7fc6ff, alpha: 0.6, seg: 10 },     // bottle base, up top
      { s: 'ring', d: [0.172, 0.008], at: [0, 0.8, 0], rot: [90, 0, 0], c: 0x5aa8e8, seg: 10 },             // bottle ridge
      { s: 'cyl', d: [0.035, 0.026, 0.14], at: [0.24, 0.42, 0.1], c: 'paper', seg: 8 },                     // stack of paper cups
    ],
  },
  {
    id: 'fc-photocopier', name: 'Photocopier', category: 'furniture', uses: ['place'],
    tags: ['photocopier', 'copier', 'machine', 'paper', 'office', 'grey', 'collectathon'], emoji: [],
    footprint: { r: 0.5, h: 0.8 },
    about: 'Nothing Left to Collect: a grey office photocopier with a lid, a paper tray out at +x, a green glowing button and a dark glass display.',
    examine: [
      'A grey box machine as big as a desk, with a heavy lid, a tray of paper sticking out of one side and one green button.',
      'Office saying: anything that goes under the lid comes out twice, and the second one is always a little lighter.',
      'Tip: lift the lid before you press the button. The copier will happily make copies of nothing all afternoon.',
      'Joke: the Annex once copied its rulebook to save paper, and now has two rulebooks that disagree with each other.',
      'It is warm on top even when it is switched off, as if it had just finished copying something it will not show you.',
    ],
    parts: [
      { s: 'box', d: [0.9, 0.6, 0.6], at: [0, 0.3, 0], c: 0xbfc3c8 },                                       // body (min.y = 0)
      { s: 'box', d: [0.84, 0.07, 0.56], at: [0, 0.63, 0], c: 'iron' },                                      // lid
      { s: 'box', d: [0.3, 0.05, 0.1], at: [0.25, 0.585, 0.33], c: 'slate' },                                // control panel
      { s: 'box', d: [0.12, 0.012, 0.05], at: [0.19, 0.614, 0.33], c: 'ink', glow: true },                  // dark glass display
      { s: 'cyl', d: [0.02, 0.02, 0.02], at: [0.34, 0.615, 0.33], c: 0x3fdc5a, glow: true, seg: 8 },        // green button
      { s: 'box', d: [0.8, 0.012, 0.012], at: [0, 0.35, 0.302], c: 'iron-dark' },                           // drawer line
      { s: 'box', d: [0.8, 0.012, 0.012], at: [0, 0.15, 0.302], c: 'iron-dark' },                           // drawer line
      { s: 'box', d: [0.2, 0.015, 0.35], at: [0.53, 0.35, 0], rot: [0, 0, -8], c: 'iron' },                 // paper tray (+x)
      { s: 'box', d: [0.18, 0.01, 0.3], at: [0.53, 0.362, 0], rot: [0, 0, -8], c: 'paper' },                // paper in the tray
      { s: 'box', d: [0.15, 0.015, 0.3], at: [-0.52, 0.2, 0], c: 'iron-dark' },                             // output tray (-x)
    ],
  },
  {
    id: 'fc-nameplate', name: 'Desk Nameplate', category: 'prop', uses: ['place', 'read'],
    tags: ['nameplate', 'name', 'desk', 'brass', 'plate', 'office', 'collectathon'], emoji: [],
    about: 'Nothing Left to Collect: a small brass desk nameplate, a wedge with a dark name panel on its sloped front. Primrose Paperweight\'s, at Reception.',
    examine: [
      'A small brass wedge with a dark panel on its sloping face and a name picked out in gold letters.',
      'Reception saying: a name on a plate is a name that has decided to stay.',
      'Tip: read it once and you know who she is. Read it four times and she starts to wonder who you are.',
      'Joke: the plate has been polished so often that the name has worn shinier than the gnome it belongs to.',
      'There is a faint outline under the letters, as if a different name had been there before and left politely.',
    ],
    parts: [
      { s: 'box', d: [0.32, 0.01, 0.08], at: [0, 0.005, 0], c: 'wood-dark' },                               // felt-backed base (min.y = 0)
      { s: 'wedge', d: [0.3, 0.08, 0.06], at: [0, 0.05, 0], rot: [0, 180, 0], c: 'brass' },                 // brass wedge, slope faces +z
      { s: 'box', d: [0.24, 0.06, 0.006], at: [0, 0.0512, 0.0016], rot: SLOPE_ROT, c: 'ink' },              // dark name panel
      { s: 'box', d: [0.16, 0.01, 0.006], at: [0, 0.0533, 0.0045], rot: SLOPE_ROT, c: 'gold', glow: true }, // the name
    ],
  },
  {
    id: 'fc-visitor-lanyard', name: 'Visitor Lanyard', category: 'trinket', uses: ['wear-neck'],
    tags: ['lanyard', 'visitor', 'card', 'badge', 'cord', 'office', 'neck', 'reward', 'collectathon'], emoji: [],
    about: 'Hello.: a red cord lanyard with a white visitor card and a blue stripe, hanging on the chest. From the Annex reception.',
    examine: [
      'A red cord with a white card clipped to the end, a blue stripe across the top and the word VISITOR under it.',
      'Reception saying: a visitor who says hello back is no longer a visitor, but keeps the lanyard anyway.',
      'Tip: wear the card face out. The lift reads it, or pretends to, and the doors open a little more politely.',
      'Joke: the card says VISITOR, which is what Bucketworth & Sons call everyone who has not yet collected anything.',
      'The clock printed in the corner of the card says nine, which is when Primrose says every visit starts.',
    ],
    parts: [
      { s: 'ring', d: [0.21, 0.008], at: [0, 0.008, -0.05], rot: [90, 0, 0], c: 'red', seg: 12 },           // neck cord (min.y = 0)
      { s: 'box', d: [0.016, 0.11, 0.004], at: [0, 0.06, 0.178], c: 'red' },                                // strap down to the clip
      { s: 'box', d: [0.1, 0.13, 0.01], at: [0, 0.07, 0.19], c: 'white' },                                   // visitor card
      { s: 'box', d: [0.1, 0.025, 0.012], at: [0, 0.115, 0.19], c: 'glaze-blue' },                          // blue stripe
      { s: 'box', d: [0.06, 0.008, 0.004], at: [0, 0.06, 0.196], c: 'ink' },                                 // VISITOR
      { s: 'box', d: [0.02, 0.016, 0.014], at: [0, 0.124, 0.19], c: 'steel' },                              // clip
    ],
  },
  {
    id: 'fc-giant-paperclip', name: 'Giant Paperclip', category: 'tool', uses: ['hold', 'swing'],
    wear: { rot: [180, 0, 0] },
    grip: [0, 0.08, 0],
    tags: ['paperclip', 'clip', 'giant', 'silver', 'steel', 'office', 'reward', 'collectathon'], emoji: [],
    about: 'Clip Art: the Clip at hand-held size, about 0.55 tall, nested steel loops standing upright with the lower loop as the handle.',
    examine: [
      'A silver squiggle as tall as a gnome\'s arm, bent back on itself three times, the bottom loop worn smooth by a hand.',
      'Bucketworth saying: a thousand small Clips make one large Clip, and nobody can say what it is meant to hold.',
      'Tip: hold it by the lower loop. The top loops bend if you swing it, and then it is just a long piece of wire.',
      'Joke: the Annex gave it out as a prize for collecting Clips, so it is a Clip you can collect more Clips with.',
      'If you hold it up to the window, the light makes the same shape on the floor as a very confused question mark.',
    ],
    parts: clipParts(3.5),
  },
  {
    id: 'fc-employee-cap', name: 'Employee of the Month Cap', category: 'armor', uses: ['wear-head'],
    tags: ['cap', 'baseball', 'navy', 'star', 'employee', 'office', 'head', 'reward', 'collectathon'], emoji: [],
    about: 'Employee of the Month: a navy baseball cap with a flat brim at +z, a top button and a glowing gold star badge on the front.',
    examine: [
      'A navy baseball cap with a flat brim, a button on top and a gold star stitched to the front that never quite stops shining.',
      'Bucketworth saying: the Employee of the Month is whoever was still collecting when the month ran out.',
      'Tip: wear the brim to the front. Backwards, it reads as Employee of Last Month, and people start to pity you.',
      'Joke: the Annex has had the same Employee of the Month for years. The month has also been the same for years.',
      'The label inside says the month in small letters. It says nine, which is not a month, but nobody has argued.',
    ],
    parts: [
      { s: 'ball', d: [0.2], at: [0, 0.12, 0], scale: [1, 0.6, 1], c: 0x24305e, seg: 10 },                 // crown (min.y = 0)
      { s: 'ring', d: [0.165, 0.008], at: [0, 0.05, 0], rot: [90, 0, 0], c: 0x1a2245, seg: 10 },           // sweatband seam
      { s: 'box', d: [0.24, 0.016, 0.16], at: [0, 0.035, 0.2], c: 0x24305e },                              // flat brim
      { s: 'ball', d: [0.018], at: [0, 0.24, 0], c: 0x1a2245, seg: 6 },                                     // top button
      ...starParts(0, 0.13, 0.2, 0.045, 'gold', true),                                                       // gold star badge
    ],
  },
  {
    id: 'fc-bottomless-sack', name: 'Bottomless Sack', category: 'container', uses: ['wear-back'],
    wear: { at: [0, -0.04, 0.03] },
    tags: ['sack', 'bag', 'burlap', 'bottomless', 'clip', 'acorn', 'back', 'reward', 'collectathon'], emoji: [],
    about: 'The Point: an overstuffed burlap sack tied at the top with string, a Clip, a Sticky Square and an acorn poking out.',
    examine: [
      'A burlap sack stuffed so full it has gone round, tied at the neck, a Clip, a Sticky Square and an acorn poking out.',
      'Bucketworth saying: a sack with no bottom is never full, which is the whole trouble with it.',
      'Tip: tie the string twice. Things do not fall out of a bottomless sack, but they do wander up and look around.',
      'Joke: it holds everything there is to collect, and it still feels exactly as heavy as an empty sack.',
      'Turn it inside out and there is nothing in it at all, which the Interviewer says is the point.',
    ],
    parts: [
      { s: 'ball', d: [0.2], at: [0, 0.18, 0], scale: [1, 0.9, 0.8], c: 'burlap', seg: 10 },               // sack body (min.y = 0)
      { s: 'box', d: [0.06, 0.06, 0.012], at: [0.08, 0.15, 0.142], rot: [0, 25, 0], c: 'leather' },        // patch
      { s: 'cyl', d: [0.06, 0.1, 0.08], at: [0, 0.37, 0], c: 'burlap', seg: 8 },                            // gathered neck
      { s: 'ring', d: [0.068, 0.012], at: [0, 0.37, 0], rot: [90, 0, 0], c: 'parchment', seg: 8 },          // string tie
      { s: 'cyl', d: [0.09, 0.06, 0.04], at: [0, 0.43, 0], c: 'burlap', seg: 8 },                           // flared mouth
      { s: 'ring', d: [0.02, 0.004, 180], at: [-0.04, 0.5, 0], rot: [0, 0, 15], c: 'steel', seg: 6 },      // a Clip, top loop
      { s: 'pill', d: [0.004, 0.05], at: [-0.025, 0.47, 0], rot: [0, 0, 15], c: 'steel', seg: 6 },         // a Clip, side
      { s: 'box', d: [0.06, 0.06, 0.005], at: [0.04, 0.48, 0.015], rot: [-10, 0, -15], c: 0xffe066 },      // a Sticky Square
      { s: 'ball', d: [0.025], at: [0.005, 0.465, -0.035], scale: [1, 1.2, 1], c: 'wood', seg: 6 },         // an acorn
      { s: 'ball', d: [0.027], at: [0.005, 0.49, -0.035], scale: [1, 0.5, 1], c: 'bark', seg: 6 },          // acorn cap
    ],
  },
  {
    id: 'fc-sun-hat', name: 'Shellshore Sun Hat', category: 'armor', uses: ['wear-head'],
    tags: ['sun', 'hat', 'straw', 'beach', 'shell', 'ribbon', 'shellshore', 'head', 'reward', 'collectathon'], emoji: [],
    about: "I'm Not Taking the Job: a wide straw sun hat with a low crown, a blue ribbon band and a small pink shell on the band.",
    examine: [
      'A wide straw sun hat with a low flat crown, a blue ribbon round it and one small pink shell tucked into the band.',
      'Shellshore saying: a hat wide enough for the sun is a hat wide enough for doing nothing underneath.',
      'Tip: tip the brim down over your eyes and lie back. On Shellshore that counts as a full day.',
      'Joke: it came with a job offer pinned inside. The gnome who wore it first used the offer to fan himself.',
      'There is a little sand in the crown that never runs out, however many times you turn the hat over.',
    ],
    parts: [
      { s: 'cyl', d: [0.32, 0.32, 0.02], at: [0, 0.01, 0], c: 'straw', seg: 12 },                          // wide brim (min.y = 0)
      { s: 'cyl', d: [0.14, 0.15, 0.12], at: [0, 0.08, 0], c: 'straw', seg: 12 },                           // low crown
      { s: 'cyl', d: [0.155, 0.156, 0.03], at: [0, 0.04, 0], c: 'glaze-blue', seg: 12 },                    // ribbon band
      { s: 'cone', d: [0.026, 0.034], at: [0.06, 0.04, 0.148], rot: [90, 0, 0], scale: [1, 1, 0.5], c: 'petal', seg: 6 }, // shell fan
      { s: 'ball', d: [0.012], at: [0.06, 0.03, 0.152], c: 'white', seg: 6 },                               // shell hinge
    ],
  },
  {
    id: 'fc-shell-necklace', name: 'Shell Necklace', category: 'trinket', uses: ['wear-neck'],
    tags: ['shell', 'necklace', 'beach', 'cord', 'pink', 'shellshore', 'neck', 'reward', 'collectathon'], emoji: [],
    about: 'Collector of Secrets: a cord with five shells, four small ones and a bigger pink one in the middle, hung forward on the chest.',
    examine: [
      'A plain cord strung with four small shells in cream, coral and white, and one bigger pink shell in the middle.',
      'Shellshore saying: a shell you find is a gift, and a shell you collect is just a shell you have to carry.',
      'Tip: hold the big shell to your ear. It does not play the sea. It plays the Annex hold music, very faintly.',
      'Joke: eight secrets went into finding it, and the shells will not tell you a single one of them.',
      'Each shell has a tiny nine scratched inside it, as if someone had been counting and given up at the same number.',
    ],
    parts: [
      { s: 'ring', d: [0.21, 0.008], at: [0, 0.008, -0.05], rot: [90, 0, 0], c: 'leather', seg: 12 },      // cord (min.y = 0)
      { s: 'ball', d: [0.016], at: [-0.085, 0.025, 0.17], scale: [1, 0.8, 0.5], c: 0xf6e3d0, seg: 6 },     // cream shell
      { s: 'ball', d: [0.016], at: [-0.045, 0.028, 0.185], scale: [1, 0.8, 0.5], c: 0xf2b8a0, seg: 6 },    // coral shell
      { s: 'cone', d: [0.03, 0.04], at: [0, 0.045, 0.195], scale: [1, 1, 0.4], c: 'petal', seg: 6 },       // big pink shell
      { s: 'ball', d: [0.014], at: [0, 0.028, 0.198], c: 'white', seg: 6 },                                // its hinge
      { s: 'ball', d: [0.016], at: [0.045, 0.028, 0.185], scale: [1, 0.8, 0.5], c: 'white', seg: 6 },      // white shell
      { s: 'ball', d: [0.016], at: [0.085, 0.025, 0.17], scale: [1, 0.8, 0.5], c: 0xf6e3d0, seg: 6 },      // cream shell
    ],
  },
];
