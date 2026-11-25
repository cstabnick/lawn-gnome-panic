// Achievement cosmetics (neck slot): one new item per achievement that used to share a prefab. See docs/cosmetics.md.
import type { PrefabDef } from '../types';

export const COSMETICS_NECK: PrefabDef[] = [
  {
    id: 'feather-garland', name: 'Feather Garland', category: 'trinket', uses: ['wear-neck'],
    tags: ['feather', 'garland', 'cord', 'clover', 'bead', 'friend', 'neck', 'reward'], emoji: [],
    about: 'Friend of the Yard: a leather cord with three small feathers (brown, grey, white) and a green clover bead hung on the chest, clear of the head and face.',
    examine: [
      'Three small feathers, brown, grey and white, tied to a cord with a green clover bead hung at the front.',
      'Saying from the Planting: a critter that eats from your hand is a friend, and one that eats your hat is a neighbour.',
      'Tip: sit very still in the hedge with the garland on. The critters decide you are part of the hedge and come up close.',
      'Joke: a robin has taken the feathers for a nest, which is why it now sings loudest outside your porch every morning.',
      'The clover bead is cracked and mended with glaze, so it has been through at least one friendship already.',
    ],
    // Cord ring laid under the chin; feathers and bead hang forward on the chest, well clear of HEAD & FACE.
    parts: [
      { s: 'ring', d: [0.21, 0.01], at: [0, 0.01, -0.05], rot: [90, 0, 0], c: 'leather', seg: 12 }, // cord (min.y = 0)
      { s: 'cone', d: [0.012, 0.07], at: [-0.05, 0.05, 0.17], rot: [-10, 0, 0], c: 'bark', seg: 5 }, // brown feather
      { s: 'cone', d: [0.012, 0.07], at: [0, 0.045, 0.18], rot: [-10, 0, 0], c: 'slate', seg: 5 }, // grey feather
      { s: 'cone', d: [0.012, 0.07], at: [0.05, 0.05, 0.17], rot: [-10, 0, 0], c: 'white', seg: 5 }, // white feather
      { s: 'ball', d: [0.018], at: [0, 0.02, 0.2], c: 'leaf', seg: 6 },                              // clover bead
    ],
  },
  {
    id: 'tin-can-phone', name: 'Tin-Can Phone', category: 'trinket', uses: ['wear-neck'],
    tags: ['tin', 'can', 'phone', 'string', 'chat', 'club', 'neck', 'reward'], emoji: [],
    about: 'Chatterbox: two tin cans joined by a length of string. One can hangs on the chest, the second sits at the far end of the string beside it.',
    examine: [
      'Two tin cans joined by a length of string, one hung on a cord at the chest, the other waiting at the far end.',
      'Gnome saying: a string pulled tight carries words further than any shout, though it carries them just as loud.',
      'Tip: talk with the can close to your chin, not your belt, or the message arrives as a faint buzz and a complaint.',
      'Joke: Club Gnome gossip has been carried down this string so often that both cans have worn shiny at the rims.',
      'Somebody scratched a tally of twenty-five short marks into the lower can, one for every line of chatter.',
    ],
    parts: [
      { s: 'ring', d: [0.21, 0.01], at: [0, 0.01, -0.05], rot: [90, 0, 0], c: 'leather', seg: 12 }, // neck cord (min.y = 0)
      { s: 'cyl', d: [0.045, 0.045, 0.06], at: [0, 0.03, 0.17], c: 'steel', seg: 8 },            // first can (min.y = 0)
      { s: 'ring', d: [0.045, 0.005], at: [0, 0.06, 0.17], rot: [90, 0, 0], c: 'iron', seg: 8 }, // can rim
      { s: 'cyl', d: [0.003, 0.003, 0.14], at: [0.07, 0.05, 0.12], rot: [0, 0, 90], c: 'bark', seg: 4 }, // string
      { s: 'cyl', d: [0.04, 0.04, 0.055], at: [0.14, 0.0275, 0.12], c: 'steel', seg: 8 },         // second can (min.y = 0)
    ],
  },
  {
    id: 'tire-tread-collar', name: 'Tyre-Tread Collar', category: 'trinket', uses: ['wear-neck'],
    tags: ['tyre', 'tread', 'rubber', 'collar', 'valve', 'black', 'neck', 'reward'], emoji: [],
    about: 'Sideways Gnome: a thick black rubber collar moulded with raised tread ribs and a brass valve nub at the front.',
    examine: [
      'A thick black rubber collar moulded with raised tread ribs, with a small brass valve nub sticking out at the front.',
      'Sideways Gnome proverb: the road is for going round, and the tread is for going round it sideways.',
      'Tip: keep the tread turning the same way as the slide, or the whole collar will spin you neatly into a hedge.',
      'Joke: it was sold as a neck support for beginners, and every beginner has since learned to skid properly.',
      'Someone has written a neat tally of full seconds on the inside of the rubber, each one a little squiggly.',
    ],
    parts: [
      { s: 'ring', d: [0.2, 0.03], at: [0, 0.03, -0.04], rot: [90, 0, 0], c: 'black', seg: 12 },   // rubber collar (min.y = 0)
      { s: 'ring', d: [0.2, 0.012], at: [0, 0.058, -0.04], rot: [90, 0, 0], c: 'iron-dark', seg: 12 }, // top tread rib
      { s: 'cyl', d: [0.008, 0.008, 0.03], at: [0, 0.03, 0.21], rot: [90, 0, 0], c: 'brass', seg: 6 }, // valve stem
      { s: 'ball', d: [0.012], at: [0, 0.03, 0.235], c: 'brass', seg: 6 },                            // valve nub
    ],
  },
  {
    id: 'crew-bandana', name: 'Crew Bandana', category: 'trinket', uses: ['wear-neck'],
    tags: ['bandana', 'scarf', 'crew', 'party', 'friend', 'green', 'neck', 'reward'], emoji: [],
    about: 'Squad Up: a green cotton bandana tied round the neck, its knotted point hanging down on the chest.',
    examine: [
      'A green cotton bandana folded into a band, tied at the back with its pointed end hanging down on the chest.',
      'Turfton saying: one gnome is a lookout, two gnomes are a crew, and three gnomes are a parade the Hat Watch will notice.',
      'Tip: wave the point of it from a rooftop and every gnome in your crew knows exactly where to meet.',
      'Joke: the crew agreed on green so they could spot each other in a crowd, then all got lost in the same hedge.',
      'A row of tiny stitched initials runs along the hem, each in a different thread, one for every gnome who wore it.',
    ],
    parts: [
      { s: 'ring', d: [0.2, 0.025], at: [0, 0.025, -0.04], rot: [90, 0, 0], c: 'leaf', seg: 12 },       // folded band (min.y = 0)
      { s: 'cone', d: [0.06, 0.09], at: [0, 0.02, 0.19], rot: [-80, 0, 0], c: 'leaf', seg: 3 },        // hanging point
      { s: 'ball', d: [0.022], at: [0, 0.03, -0.25], c: 'leaf', seg: 6 },                               // knot at the back
    ],
  },
  {
    id: 'frosting-garland', name: 'Frosting Garland', category: 'trinket', uses: ['wear-neck'],
    tags: ['frosting', 'icing', 'cake', 'cherry', 'garland', 'cord', 'neck', 'reward'], emoji: [],
    about: 'Cake Day: a cord ringed with piped frosting dollops (cream and rose) and one bright cherry bead hanging at the front.',
    examine: [
      'A cord ringed with piped dollops of cream and rose frosting, with one bright red cherry bead dangling at the front.',
      'Saying: a cake is only as good as its garnish, and a gnome is only as good as his cherry.',
      'Tip: keep the garland cool. Warm frosting slides down the front of your coat, and nobody forgives a sticky coat.',
      'Joke: the Hat Watch once tried to arrest it for cake fraud, but the frosting was too sweet to hold a grudge.',
      'Five acorn cakes have been iced with this exact rose pattern, which is the only way the baker knows how to sign.',
    ],
    parts: [
      { s: 'ring', d: [0.21, 0.01], at: [0, 0.01, -0.05], rot: [90, 0, 0], c: 'leather', seg: 12 }, // cord (min.y = 0)
      { s: 'ball', d: [0.02], at: [-0.07, 0.025, 0.16], scale: [1, 0.7, 1], c: 'chalk', seg: 8 }, // cream dollop
      { s: 'ball', d: [0.02], at: [0, 0.025, 0.19], scale: [1, 0.7, 1], c: 'petal', seg: 8 },     // rose dollop
      { s: 'ball', d: [0.02], at: [0.07, 0.025, 0.16], scale: [1, 0.7, 1], c: 'chalk', seg: 8 }, // cream dollop
      { s: 'ball', d: [0.012], at: [0, 0.05, 0.2], c: 'ruby', seg: 6 },                           // cherry bead
    ],
  },
  {
    id: 'stitched-collar', name: 'Stitched Collar', category: 'trinket', uses: ['wear-neck'],
    tags: ['leather', 'collar', 'stitch', 'seam', 'crack', 'glue', 'brown', 'neck', 'reward'], emoji: [],
    about: 'Glued Back Together: a brown leather collar with a visible stitched seam and a dark glue line across the front where it cracked.',
    examine: [
      'A brown leather collar with a neat stitched seam running round the top and a crack line across the front, sealed with dark glue.',
      'Glazing proverb: a crack that is glued is a crack that is honest, and the glue is the only part anyone can see.',
      'Tip: the seam is the strong part. Hold the collar by it when you take it off, never by the glued crack.',
      'Joke: the leather has been mended so often it now has more stitches than the neighbour\'s favourite quilt.',
      'Someone pressed a tiny cracked-cup stamp into the buckle, and nobody has yet admitted to being the one who mended it.',
    ],
    parts: [
      { s: 'ring', d: [0.2, 0.03], at: [0, 0.03, -0.04], rot: [90, 0, 0], c: 'leather', seg: 12 },      // leather collar (min.y = 0)
      { s: 'ring', d: [0.205, 0.005], at: [0, 0.06, -0.04], rot: [90, 0, 0], c: 'leather-dark', seg: 12 }, // stitched seam
      { s: 'box', d: [0.01, 0.05, 0.012], at: [0, 0.03, 0.165], rot: [0, 0, 15], c: 'ink' },           // dark glue crack
      { s: 'ball', d: [0.007], at: [0.05, 0.045, 0.16], c: 'cloth', seg: 6, mirror: true },           // stitch knots
    ],
  },
  {
    id: 'felt-scarf', name: 'Felt Table Scarf', category: 'trinket', uses: ['wear-neck'],
    tags: ['felt', 'scarf', 'green', 'billiards', 'table', 'cloth', 'neck', 'reward'], emoji: [],
    about: 'Regular: a short green felt scarf wrapped twice round the neck, with a neat fold tucked at the front.',
    examine: [
      'A short green felt scarf wrapped twice round the neck, with a neat fold tucked at the front like a tidy napkin.',
      'Billiards saying: a green cloth belongs on the table or the neck, and a gnome should keep to whichever one he chose.',
      'Tip: wrap it twice or not at all. A single wrap slides loose the moment the cue comes up.',
      'Joke: five finished games of Gnome Billiards, and the scarf is the only thing at the table that is never cued.',
      'Chalk dust from the cue tip is pressed into the fibres in a tidy triangle that no washing has ever shifted.',
    ],
    parts: [
      { s: 'ring', d: [0.2, 0.02], at: [0, 0.02, -0.04], rot: [90, 0, 0], c: 'green', seg: 12 },  // first wrap (min.y = 0)
      { s: 'ring', d: [0.2, 0.02], at: [0, 0.05, -0.04], rot: [90, 0, 0], c: 'green', seg: 12 },  // second wrap, stacked on top
      { s: 'box', d: [0.06, 0.07, 0.03], at: [0.02, 0.035, 0.15], rot: [0, 0, -6], c: 'green' },   // front fold (min.y = 0)
      { s: 'box', d: [0.062, 0.02, 0.032], at: [0.02, 0.07, 0.15], c: 'leaf-dark' },               // fold tuck
    ],
  },
  {
    id: 'scrabble-tile-pendant', name: 'Letter Tile Pendant', category: 'trinket', uses: ['wear-neck', 'collect'],
    tags: ['tile', 'letter', 'scrabble', 'pendant', 'cord', 'gnome', 'neck', 'reward'], emoji: [],
    about: 'Gnome.: a square cream letter tile with a dark G pressed into its face, hung on a cord at the chest.',
    examine: [
      'A square cream letter tile with a dark G pressed into its face, hung on a plain cord at the chest.',
      'Charter rhyme: a letter alone is only a shape, but a G beside a gnome spells the whole answer.',
      'Tip: keep the tile face-out so the letter reads, or you will have to explain your answer to every passing critic.',
      'Joke: the tile has been turned over so many times that the Club Gnome judges now demand a second opinion.',
      'Two smaller letters are scratched on the back, which were never solved and are the only proof of a sequel.',
    ],
    parts: [
      { s: 'ring', d: [0.21, 0.008], at: [0, 0.008, -0.05], rot: [90, 0, 0], c: 'leather', seg: 12 }, // cord (min.y = 0)
      { s: 'box', d: [0.07, 0.07, 0.012], at: [0, 0.055, 0.17], c: 'chalk' },                       // letter tile (min.y = 0.02)
      { s: 'box', d: [0.008, 0.04, 0.005], at: [-0.015, 0.055, 0.182], c: 'ink' },                  // G: left stroke
      { s: 'box', d: [0.03, 0.008, 0.005], at: [0, 0.075, 0.182], c: 'ink' },                       // G: top bar
      { s: 'box', d: [0.03, 0.008, 0.005], at: [0, 0.035, 0.182], c: 'ink' },                       // G: bottom bar
      { s: 'box', d: [0.008, 0.02, 0.005], at: [0.015, 0.045, 0.182], c: 'ink' },                   // G: right spur
    ],
  },
  {
    id: 'visitor-lanyard', name: 'Visitor Lanyard', category: 'trinket', uses: ['wear-neck'],
    tags: ['lanyard', 'visitor', 'name', 'card', 'badge', 'cord', 'neck', 'reward'], emoji: [],
    about: 'Name Drop: a cord lanyard with a small white name card clipped to its end, hanging on the chest.',
    examine: [
      'A plain cord lanyard with a small white name card clipped to its end, the name still blank and waiting for an answer.',
      'Gnomillion rule: the name card goes on the outside, where the room can read it, and the answer goes in your head.',
      'Tip: turn the card over before entering, or the guard will think you are a gnome who has not yet been introduced.',
      'Joke: the card has been stamped VISITOR so many times that nobody remembers which visitor it first belonged to.',
      'A tiny ink smudge in one corner is all that is left of the first name anyone ever wrote on one of these cards.',
    ],
    parts: [
      { s: 'ring', d: [0.21, 0.008], at: [0, 0.008, -0.05], rot: [90, 0, 0], c: 'leather', seg: 12 }, // neck cord (min.y = 0)
      { s: 'box', d: [0.016, 0.07, 0.004], at: [0, 0.07, 0.165], c: 'glaze-blue' },                  // lanyard strap
      { s: 'box', d: [0.06, 0.045, 0.004], at: [0, 0.03, 0.172], c: 'paper' },                       // name card (min.y = 0.0075)
      { s: 'box', d: [0.04, 0.006, 0.002], at: [0, 0.03, 0.175], c: 'ink' },                         // written name line
      { s: 'box', d: [0.012, 0.012, 0.008], at: [0, 0.058, 0.172], c: 'steel' },                     // card clip
    ],
  },
  {
    id: 'time-card-clip', name: 'Time-Card Clip', category: 'trinket', uses: ['wear-neck'],
    tags: ['time', 'card', 'clip', 'brass', 'chain', 'shift', 'punch', 'neck', 'reward'], emoji: [],
    about: 'Punching the Clock: a brass time-card clip holding a punched card, on a short brass chain round the neck.',
    examine: [
      'A brass time-card clip on a short chain, a punched card pinched in its jaws, marked with a neat row of hours.',
      'Shift saying: the clock punches you in, the clock punches you out, and the card remembers the rest.',
      'Tip: clip the card on before the whistle, not after. The clip sticks to a sweaty palm and the card goes missing.',
      'Joke: the pay is in acorns, the card is in brass, and the two are seldom in the same pocket at the same time.',
      'A row of hour-punches runs down the card, each one slightly off-centre, as if the clock had been in a hurry.',
    ],
    parts: [
      { s: 'ring', d: [0.2, 0.006], at: [0, 0.006, -0.05], rot: [90, 0, 0], c: 'brass', seg: 12 }, // short chain (min.y = 0)
      { s: 'box', d: [0.05, 0.07, 0.002], at: [0, 0.035, 0.168], c: 'paper' },                    // punched card (min.y = 0)
      { s: 'box', d: [0.054, 0.02, 0.01], at: [0, 0.06, 0.172], c: 'brass' },                      // brass clip
      { s: 'ring', d: [0.008, 0.002], at: [0, 0.08, 0.17], c: 'brass', seg: 6 },                  // hanging eyelet
    ],
  },
  {
    id: 'rubber-duck-cord', name: 'Rubber Duck Cord', category: 'trinket', uses: ['wear-neck', 'collect'],
    tags: ['rubber', 'duck', 'bath', 'yellow', 'cord', 'toy', 'neck', 'reward'], emoji: [],
    about: 'Squeaky Gnome: a small yellow rubber duck with a flat base on a cord, hanging on the chest.',
    examine: [
      'A small yellow rubber duck with a flat base and a little orange beak, hung on a cord at the chest.',
      'Bath-time saying: a duck that floats is a gnome that will live, and a duck that sinks is a gnome in trouble.',
      'Tip: give it a squeeze before a dunk. The squeak is pitched high enough to send the nearest pigeon off the roof.',
      'Joke: the Hat Watch confiscated one as a smuggled decoy, and it has squeaked at them ever since.',
      'Somebody has painted a tiny black eye on each side of the duck, in case it needs to keep watch on its own.',
    ],
    parts: [
      { s: 'ring', d: [0.21, 0.008], at: [0, 0.008, -0.05], rot: [90, 0, 0], c: 'leather', seg: 12 }, // cord (min.y = 0)
      { s: 'box', d: [0.07, 0.01, 0.05], at: [0, 0.005, 0.17], c: 'yellow' },                        // flat base
      { s: 'ball', d: [0.035], at: [0, 0.03, 0.17], scale: [1, 0.9, 1.1], c: 'yellow', seg: 8 },     // body
      { s: 'ball', d: [0.022], at: [0, 0.06, 0.2], c: 'yellow', seg: 8 },                            // head
      { s: 'cone', d: [0.008, 0.02], at: [0, 0.055, 0.225], rot: [90, 0, 0], c: 'orange', seg: 5 },  // beak
      { s: 'ball', d: [0.004], at: [0.012, 0.07, 0.216], c: 'black', mirror: true, seg: 6 },         // eyes
    ],
  },
  {
    id: 'shared-ride-lanyard', name: 'Shared Ride Lanyard', category: 'trinket', uses: ['wear-neck'],
    tags: ['carpool', 'lanyard', 'passenger', 'ticket', 'seat', 'ride', 'neck', 'reward'], emoji: [],
    about: 'Carpool Pass: a cord lanyard with a paper ride ticket clipped to its end, hanging on the chest.',
    examine: [
      'A plain cord lanyard with a paper ride ticket clipped to its end, stamped PASSENGER in a hurry.',
      'Carpool rule: one gnome drives, the rest hold on, and the ticket says which seat is yours.',
      'Tip: keep the ticket visible, or the driver will assume you walked there and make you pay the fuel.',
      'Joke: the ticket has no seat number, so every passenger in Turfton insists the good one is theirs.',
    ],
    parts: [
      { s: 'ring', d: [0.21, 0.008], at: [0, 0.008, -0.05], rot: [90, 0, 0], c: 'leather', seg: 12 }, // neck cord (min.y = 0)
      { s: 'box', d: [0.016, 0.07, 0.004], at: [0, 0.07, 0.165], c: 'glaze-blue' },                  // lanyard strap
      { s: 'box', d: [0.06, 0.045, 0.004], at: [0, 0.03, 0.172], c: 'paper' },                       // ride ticket (min.y = 0.0075)
      { s: 'box', d: [0.04, 0.006, 0.002], at: [0, 0.03, 0.175], c: 'ink' },                         // printed PASSENGER line
      { s: 'box', d: [0.012, 0.012, 0.008], at: [0, 0.058, 0.172], c: 'brass' },                     // ticket clip
    ],
  },
  {
    id: 'road-token-lanyard', name: 'Road Token Lanyard', category: 'trinket', uses: ['wear-neck'],
    tags: ['lanyard', 'token', 'road', 'fellow', 'party', 'bead', 'tag', 'neck', 'reward'], emoji: [],
    about: 'Fellowship: a leather lanyard with an iron tag and three clay beads, one per companion a gnome walks with. Plain colours, no tint.',
    examine: [
      'A leather lanyard with an iron tag stamped with letters nobody can read, and three clay beads strung beside it.',
      'Saying from the Charters: a road is only as long as the gnomes walking it, and three is the most that fit one gate.',
      'Tip: give each bead to a companion before you leave the Hearth, then count them again at the gate in case one has wandered off.',
      'Joke: the iron tag is so heavily stamped that every gnome who looks at it agrees it says something important.',
      'The cord has been retied so many times that its knot has settled into the shape of a small, cheerful gnome.',
    ],
    parts: [
      { s: 'ring', d: [0.21, 0.01], at: [0, 0.01, -0.05], rot: [90, 0, 0], c: 'leather', seg: 12 }, // cord (min.y = 0)
      { s: 'box', d: [0.04, 0.05, 0.008], at: [0, 0.05, 0.175], c: 'iron' },                        // iron tag
      { s: 'ball', d: [0.014], at: [-0.05, 0.02, 0.165], c: 'clay', seg: 6 },                       // clay bead
      { s: 'ball', d: [0.014], at: [0, 0.02, 0.18], c: 'clay', seg: 6 },                            // clay bead
      { s: 'ball', d: [0.014], at: [0.05, 0.02, 0.165], c: 'clay', seg: 6 },                        // clay bead
    ],
  },
  {
    id: 'notched-tally-cord', name: 'Notched Tally Cord', category: 'trinket', uses: ['wear-neck'],
    tags: ['tally', 'notch', 'stick', 'cord', 'lucky', 'horn', 'neck', 'reward'], emoji: [],
    about: 'Two Notches: a leather cord with two wooden tally sticks hung on the chest, notched with dark marks. Achievement reward for Two Notches.',
    examine: [
      'Two thin wooden tally sticks hung on a leather cord, each one cut with dark notches where a count was kept.',
      'Saying from the Charters: one notch is luck, two notches is a horn, and three notches means the gnome was counting for someone else.',
      'Tip: keep the sticks matched. A single stick is only half a count, and a Reeve will not pay out on half a count.',
      'Joke: the notches were cut by a gnome who could not decide whether they had won one fight or two, so they cut both.',
      'The cord has been knotted so often that one stick hangs a little higher than the other, like a gnome who has had a good day.',
    ],
    parts: [
      { s: 'ring', d: [0.21, 0.01], at: [0, 0.01, -0.05], rot: [90, 0, 0], c: 'leather', seg: 12 }, // cord (min.y = 0)
      { s: 'box', d: [0.018, 0.1, 0.006], at: [-0.03, 0.05, 0.17], c: 'wood-light' },             // tally stick (min.y = 0)
      { s: 'box', d: [0.018, 0.1, 0.006], at: [0.03, 0.05, 0.17], c: 'wood-light' },              // tally stick
      { s: 'box', d: [0.024, 0.008, 0.008], at: [-0.03, 0.03, 0.174], c: 'ink' },                 // notch
      { s: 'box', d: [0.024, 0.008, 0.008], at: [-0.03, 0.07, 0.174], c: 'ink' },                 // notch
      { s: 'box', d: [0.024, 0.008, 0.008], at: [0.03, 0.05, 0.174], c: 'ink' },                  // notch
      { s: 'box', d: [0.07, 0.006, 0.004], at: [0, 0.1, 0.168], c: 'leather-dark' },              // lashing
    ],
  },
  {
    id: 'trellisdown-cravat', name: 'Trellisdown Cravat', category: 'trinket', uses: ['wear-neck'],
    tags: ['cravat', 'silk', 'old-money', 'estate', 'trellisdown', 'pink', 'neck', 'reward'], emoji: [],
    about: 'A puffed pink silk cravat with a brass pin, as worn on the terraces of Trellisdown.',
    examine: [
      'A puffed pink silk cravat tied high at the throat and held with a small brass pin.',
      'Saying: in Trellisdown a cravat is not worn, it is displayed.',
      'Tip: tie it before the grape-dew is poured; nobody ties a good knot after.',
      'Joke: the pin is solid brass, which is the only solid thing anyone in Brassknock Manor has said all year.',
      'Old money keeps its cravats in a drawer of their own, folded by somebody else.',
    ],
    parts: [
      { s: 'ring', d: [0.19, 0.025], at: [0, 0.03, -0.04], rot: [90, 0, 0], c: 'pink', seg: 12 },
      { s: 'ball', d: [0.05], at: [0, 0.03, 0.15], scale: [1.2, 1, 0.6], c: 'pink', seg: 8 },
      { s: 'box', d: [0.05, 0.07, 0.015], at: [0, 0.035, 0.16], c: 'pink' },
      { s: 'ball', d: [0.01], at: [0, 0.035, 0.18], c: 'brass', seg: 6 },
    ],
  },
];
