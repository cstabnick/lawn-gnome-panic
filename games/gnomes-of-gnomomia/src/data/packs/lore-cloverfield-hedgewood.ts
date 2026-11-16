// Lore pack: Cloverfield and Hedgewood. Readable books, notes and scrolls for the farm and lumber country.
import type { ContentPack } from '../../config';

export const PACK: ContentPack = {
  id: 'lore-cloverfield-hedgewood',
  books: {
    // ---- Cloverfield: common (on shelves in Cloverfield houses) ----
    'lch-snail-herding-handbook': {
      id: 'lch-snail-herding-handbook',
      title: 'A Handbook for Snail Herding',
      author: "The Fieldwardens' Office",
      kind: 'book',
      common: true,
      where: ['cloverfield'],
      pages: [
        "A Handbook for Snail Herding\n\nFor new herders, and for anyone whose snail has got into the granary again.\n\nA snail does not hurry, and you must not try to make it. A hurried snail stops, goes into its shell and sulks until the thaw. Walk at the pace of the slowest snail in the team, and say nothing about it.",
        "Harness with the green strap, never the brown. The brown strap is for carts. A snail that feels a cart-strap round its middle will try to go backwards, and it is a long way back to Sodbury.\n\nLasso from behind, never from the front. Speak low. A snail hears a shout through its foot and drops straight down into the dirt, where it will stay until somebody sings to it.",
        "Keep the pen gates tied with twine, not cord. Cord gets into their shells and they chew it off, and then you are paying for a new cord and a new snail.\n\nIf a snail is lost, check the nearest ditch first, then the next one. They never go up hills. They are not that sort of animal.\n\nCount the herd twice before the cart leaves. Once with your finger and once with your eyes. The two numbers never agree, and you will want to know why.",
      ],
    },
    'lch-honeydew-almanac': {
      id: 'lch-honeydew-almanac',
      title: 'The Honeydew Almanac for the Year of the Late Frost',
      author: 'Honeydew Haybale',
      kind: 'book',
      common: true,
      where: ['cloverfield'],
      pages: [
        "The Honeydew Almanac for the Year of the Late Frost\n\nKept at the Honeydew Ranch by the Haybale family, who have counted aphids here longer than anyone has written the number down.\n\nThaw: Brand the herd. Dab each aphid's back with the ochre-green clay and count them in the book. Do not brand in the wind. The clay will not stick, and you will spend the summer arguing with your neighbours about whose aphid is whose.",
        "Spring: Walk the herd north to the clover before the dew comes up. An aphid eats the first leaf it finds, so lay a fence along the path, not in the field, and let the herd choose its own bit of green.\n\nSummer: Milk them early, while the honeydew is thick and the sun has not dried it. Take only what the family needs. A ranch that takes everything has nothing left for next year.",
        "Autumn: Ladybirds come to the herd in the autumn. Count them. A ladybird is a friend until there are too many, and then it is a bill.\n\nWinter: Keep the pens dry and the ledger up to date. A rancher who does not know how many aphids she has is a rancher who will be told how many, and it will not be the number she wanted.",
      ],
    },
    'lch-brand-clay-recipe': {
      id: 'lch-brand-clay-recipe',
      title: 'Brand Clay, as It Is Made',
      kind: 'note',
      common: true,
      where: ['cloverfield'],
      pages: [
        "Brand Clay, as It Is Made\n\nTake one handful of ochre clay from the bank below the pump, dug before the thaw. Take half a handful of green clay from the pond edge. Mix them dry, then wet, until the lump holds a thumbprint and lets go of your hand.\n\nDo not use Shard clay. It is too hard and will not take the stamp. Do not use grey clay. It washes out in the first rain, which suits grey clay very well, but a brand is meant to last.",
        "Press the stamp, with the leaf cut into it, deep enough that a finger can feel the edge. Lift it straight up. A brand that smears is a brand that someone else will claim.\n\nLeave the clay to dry in the shade for three days, then warm it lightly on a flat stone. It should come out the colour of a healthy leaf. If it comes out brown, it has been left too near the fire, and you should begin again.",
      ],
    },
    // ---- Cloverfield: named buildings and hand-placed ----
    'lch-seed-order-book': {
      id: 'lch-seed-order-book',
      title: 'Order Book, Seed and Sundries',
      author: 'Sorrel Hoe',
      kind: 'journal',
      pages: [
        "Order Book, Seed and Sundries\n\nThe Seed Packet, Sodbury. Kept by Sorrel Hoe. Orders in, orders out, debts in red. Please do not ask for a discount on the clover. The clover is not mine to discount, and the Fieldwardens have very good memories.\n\nThaw, first week: Eleven sacks of barley seed to the Granary, on account, to be paid at harvest. Four sacks of clover to the Fieldwardens. Paid in full, in grain, which I have not yet counted.",
        "Thaw, third week: Two packets of bean for the Snail Pens. The snails will eat it. This is not my fault. A snail is an animal that does not read the label.\n\nSummer: Seed for the north field at Pettigrew. Sent the boy with it. He came back without the seed. I am told the ants had it. I have written it down as spoiled, because I do not know who spoiled it.",
        "Debts: a great many, most to the Thousand on the north bank, who pay in clover. I accept clover. I accept anything green.\n\nAutumn: Forty pickets ordered for the Honeydew Ranch. Paid for thirty. The other ten stand in red on this page, and I have decided to leave them there until somebody asks.",
      ],
    },
    'lch-pettigrew-diary': {
      id: 'lch-pettigrew-diary',
      title: 'A Diary from Pettigrew Ranch',
      author: 'Dill Pettigrew',
      kind: 'journal',
      pages: [
        "A Diary from Pettigrew Ranch\n\nDill Pettigrew, aged twenty-two, who has the ranch now that Father has stopped going out in the mornings.\n\nThaw. Father says the ants walked the north pasture again last night. He says it the way some gnomes say it will rain. The stone fence between us and them is the one my grandfather built, and their side is made of sticks. Both are still standing. It is the only thing we agree about.",
        "Summer. Forty aphids gone from the north pen since the last count, and none of the pickets down. Father blames the ants. The Sheriff blames the ants. I want to blame them too, because it would be easy. I do not think the ants carry them away one at a time.\n\nMy sister went to the Keep to clerk for the Crown. She sends a card every harvest. I keep them in the drawer with the brand stamp.",
        "Winter. Half the herd is in the barn, and the other half is wherever it wanders when the gate is left open. I have asked the Sheriff to come and look. He says he will, after the Roundup. I am beginning to think the Roundup is what he calls the thing that never happens.\n\nFather still walks to the fence each morning and counts to the old post. He does not say what he counts.",
      ],
    },
    'lch-young-gnome-primer': {
      id: 'lch-young-gnome-primer',
      title: "The Young Gnome's First Primer",
      kind: 'book',
      pages: [
        "The Young Gnome's First Primer\n\nA is for Ant, which is a neighbour. Do not hit the neighbour.\nB is for Bell. Ring it at the start of the day and at the end of it, and between the two keep your hands clean.\nC is for Clover, which we keep.\nD is for Dirt, which is not a rude word, but do not say it in front of the Reeve.\nE is for Earth, which is under you. Mind it.",
        "F is for Fence. Fences are for keeping things in and things out, and it is not your place to decide which.\nG is for Gnome. You were made, and you were made well. Be glad of it, and glaze your cracks before they spread.\nH is for Honeydew, which comes from the aphids, which come from the ranches, which are kept by the grown-ups.\nI is for Iron. Do not put it in your mouth.\n\nSay each line after the teacher.",
        "Written at the back, in a different and older hand:\n\nRing the bell anyway. The schoolhouse was built for a full room and it still remembers the sound of one. Someone should still hear it, even if there is only one to hear, and even if that one is still too small to read the line above.",
      ],
    },
    'lch-pump-plaque': {
      id: 'lch-pump-plaque',
      title: 'The Charter Plaque at the Pump',
      kind: 'plaque',
      pages: [
        "The Charter Plaque at the Pump\n\nBy the Charter of Root and Seed, the grain of this land is the Fieldwardens' to keep, and the honeydew is the Fieldwardens' to share. The tenth is the Keep's. The well is the town's.\n\nLet no one dig a second well within a stone's throw of this one. It is the first water the lawn ever gave us, and the old men say it was not given freely.",
        "Re-cut by the Fieldwardens in the three hundredth year of the Charter. The letters were worn when we found them, so the lettering here is our best guess at what they said. Where the guess is poor, the stone has been left blank, and nobody has asked us to fill it in.",
      ],
    },
    'lch-guard-duty-note': {
      id: 'lch-guard-duty-note',
      title: 'Night Watch, Sodbury Ring',
      kind: 'note',
      pages: [
        "Night Watch, Sodbury Ring\n\nWalk the ring twice between dusk and the first bell. Count the lamps on the thatch. Report any lamp that is out, and any door that is open, to the Sheriff's board by morning.\n\nDo not count the stars. They do not need counting, and the last watch who tried came back with a headache and no report.",
        "If you hear a noise in the north pasture, it is the ants, the aphids or the wind. Do not go to see which. Stand at the gate, shout once, and wait for the Sheriff's answer.\n\nAny gnome who leaves the ring after the bell will be fined one honeydew cake, and will be expected to eat it in front of the watch-house as a reminder to the others.\n\nSigned for the Sheriff, in the hand of the one who writes it.",
      ],
    },
    'lch-tithe-tally-scroll': {
      id: 'lch-tithe-tally-scroll',
      title: 'The Tithe Tally, Granary Side',
      kind: 'scroll',
      pages: [
        "The Tithe Tally, Granary Side\n\nGrain in, sixty measures. Grain out to the Keep, one tenth, as charted. Grain out to the Keep, a second tenth, as the Keep has asked. Grain out to the old folk of the empty farms, a small measure, not charted, and not written in this column.\n\nThe Crown wants a tenth. The Crown does not plough.",
        "Written on the back in a different hand, pressed hard:\n\nThe second tenth is a debt, not a tithe. Someone should say so to the Keep before the next thaw. I have said it three times and been given a cup of tea each time, and the tea was good, and the debt is still standing.",
      ],
    },
    // ---- Hedgewood ----
    'lch-how-to-tally-a-log': {
      id: 'lch-how-to-tally-a-log',
      title: 'How to Tally a Log',
      kind: 'book',
      common: true,
      where: ['hedgewood'],
      pages: [
        "How to Tally a Log\n\nMeasure the girth at the thick end with a knotted string. Count the knots. A knot is a hand's width, not a gnome's width, and the Reeve has been told so more than once.\n\nNotch the tally stick once for every log. Use a fresh stick each week. Old sticks lie, because wood shrinks in the cold, and a tally that shrinks is a tally that cheats the Keep.",
        "Keep clippings apart from logs. Clippings are the small branches the mill cannot use. Pile them to the north of the sawpit, never the south, where the wind carries the dust over the cabins.\n\nWhen the cutters meet anyone from the Tangle at the edge of the cut, do not argue. Count the logs again, and write the number in the book, not on the bark.",
      ],
    },
    'lch-growing-songs': {
      id: 'lch-growing-songs',
      title: 'The Growing Songs',
      kind: 'book',
      common: true,
      where: ['hedgewood'],
      pages: [
        "The Growing Songs\n\nSing this at the first shoot. Sing it softly, or the shoot will think it is being mown.\n\nUp the stem, up the stem,\nno blade will take the green from them.\nThe hedge was here before the sun,\nand it will stand when the cutters run.\n\nSing it again if the saw has been heard in the morning.",
        "Sing for the bramble, sing for the thorn,\nsing for the seed the wind has torn.\nLet the root go deep and the bark go grey,\nthe hedge will be standing when we are clay.\n\nThe singers say the Tall Ones sowed it, and the old ones say the hedge sowed itself. Both verses are sung. Nobody has ever been asked to choose.",
      ],
    },
    'lch-step-back-rhyme': {
      id: 'lch-step-back-rhyme',
      title: 'Step Back From the Tall Branch',
      kind: 'book',
      common: true,
      where: ['hedgewood'],
      pages: [
        "Step Back From the Tall Branch\n\nA rhyme the children of the hedge say while they play at the edge of the cut:\n\nStep back, step back, when the branch is high,\nthe tree will lean and the tree will sigh.\nStep back, step back, and do not stare,\nthe trunk comes down with nobody there.",
        "The little ones say it fast and laugh at the end. The bigger ones say it slowly, and do not laugh.\n\nSome children learned it late. A list is cut into the bark of the Elder Privet, the names in order of their going, and nobody reads it out loud. If you go there, read it quietly, or not at all.",
      ],
    },
    'lch-lodge-rules': {
      id: 'lch-lodge-rules',
      title: 'Rules of the Lodge at Barkhollow',
      kind: 'book',
      pages: [
        "Rules of the Lodge at Barkhollow\n\nThe lodge is neutral ground. What is said at the hearth stays at the hearth, and what is brought in stays on the hook.\n\n1. Weapons are hung on the hooks by the door. Hedgewrights hang axes and Wildlings hang bows. The hooks are the same height for both.\n\n2. No cutting, no burning and no brewing of bitter things at the hearth.\n\n3. Hunters sell what they catch to whoever has the coin, and to nobody who asks what for.",
        "4. A hunter who takes a side in the lodge loses the lodge. This has happened twice. Both times the hunter was surprised.\n\n5. The hollow root is older than these rules. Do not carve it. The bark is already full of other people's names.\n\n6. Beasts brought in for taming are fed before they are asked for anything.\n\nSigned for the Lodge, in the hand of the one who keeps the hooks.",
      ],
    },
    'lch-sawyers-letter': {
      id: 'lch-sawyers-letter',
      title: 'A Complaint to the Reeve',
      author: 'Rush Sawbuck, sawyer',
      kind: 'letter',
      pages: [
        "To the Reeve of Thatchford, from the sawpit at Clippings\n\nHonoured Reeve,\n\nI write because my saw has been stolen twice, and the door of my cabin has been found open on four mornings since the thaw. I have no proof that the Wildlings did it. I have no proof that they did not. The Foreman says I should not write this, so I am writing it to you.",
        "The clippings pile was set alight in the night, by something with bows. Nobody was hurt, and that is the only good part of this letter. The pile was the Foreman's count for the Keep, and the count is now short, and I am the one who has to say so.\n\nI do not hate the people in the Tangle. I have walked past their tents every day for eleven years, and they have never once asked me the price of anything. But the charter says the wood is ours, and a sawyer must cut what the charter gives him.",
        "I ask for two guards on the sawpit at night, a proper lock for the tool shed, and for the Reeve to tell the Keep the clippings were not my fault. I will not pretend the Tangle has never cost us a log, but I will not be blamed for the fire either, when I was asleep in my own bed and the pile was burning at the far end.\n\nI remain your servant, and I would like an answer before the next thaw.\n\nRush Stoutpot, sawyer.",
      ],
    },
    'lch-sawyers-tally-book': {
      id: 'lch-sawyers-tally-book',
      title: 'The Sawpit Tally Book',
      kind: 'journal',
      pages: [
        "The Sawpit Tally Book, Clippings\n\nWeek of the thaw: 412 logs, 38 short of the Keep's count. Short because the north bank was not finished. Written in the margin: the north bank is not ours to finish.\n\nWeek of the first rain: 290 logs. The mill ran out of wheel-grease. The grease is in a jar under the bench, where it has been all along, and the Foreman has been told twice.",
        "Week of the long sun: 501 logs, the most this camp has cut in a season. The Foreman asked us to write the number on the door, so we have written it on the door, and we have kept a copy in here in case the door is ever painted.\n\nWeek of the falling leaves: 14 logs, and one saw taken from the shed. Net: a loss. It is in the book so that it cannot be argued with later.",
        "A note at the back, in pencil:\n\nThe Tangle is quiet on the feast day. We left a bundle of kindling on the stump by the north bank, dry side up, the way they like it. It is not in the count, and it is not to be in the count. The Tangle folk will not thank us for it and will not refuse it either.\n\nWhoever reads this, leave the kindling where it lies.",
      ],
    },
    'lch-bramble-tent-prayer': {
      id: 'lch-bramble-tent-prayer',
      title: 'A Prayer for the Cut Hedge',
      kind: 'book',
      pages: [
        "A Prayer for the Cut Hedge\n\nSaid by the Wildlings at a stump, with the hand flat on the wood.\n\nHedge that was here before the cutters,\nbark that was here before the names,\nwe leave you the warm side of the stone\nand the cool side of the stump.\nTake back what was taken, and be patient with us.",
        "Tall Ones, if you planted this, you planted it to be left alone. We have not forgotten that. The Crown and the Hedgewrights say they have not forgotten it either. They say keep the lawn, and we say keep the hedge. It is the same charge. We only disagree about which of us is the lawn, and which of us is the weed.",
      ],
    },
    // ---- Hedgewood: hand-placed ----
    'lch-clippings-notice': {
      id: 'lch-clippings-notice',
      title: 'Notice at the Clippings Post',
      kind: 'note',
      pages: [
        "Notice at the Clippings Post\n\nA hot meal is given at the sawpit to anyone who carries a log to the mill, whatever their charter, their colour or their side of the cut.\n\nThe cook will not ask which side you cut on, and will not be told. Eat sitting down. Bring your own bowl if you have one. The Foreman is not paying for bowls this season.",
        "Clippings is a hard camp and the work is hard. Nobody here has been asked to like the Tangle. Nobody has been asked to hate it, either. If you have a grievance, write it in the book by the stove, and it will be read by the Reeve, once the Reeve can be found.\n\nWood is wood. Look after the axe.",
      ],
    },
    'lch-elder-privet-scroll': {
      id: 'lch-elder-privet-scroll',
      title: 'The Names on the Elder Privet',
      kind: 'scroll',
      pages: [
        "The Names on the Elder Privet\n\nCopied out at the Reeve's request, with a clay stylus, from the bark of the oldest hedge in Fescue. The oldest names are cut deep and nearly grown over. They are the names of gnomes and of Wildlings, and some are three hundred years old.\n\nThe copy is not finished. The copier ran out of clay, and then ran out of the will to go on.",
        "The newest names are cut low, at the height of a small child's reach. Each has a simple mark beside it, a single notch, the way a tally is kept. The copier did not know what the notch was for. The one who showed them the tree said only that it means a tree fell there.\n\nNo more names are cut. Nobody says why.",
      ],
    },
  },
  objects: {
    'lch-pump-plaque': {
      id: 'lch-pump-plaque',
      zone: 'cloverfield',
      name: 'Charter plaque at the pump',
      x: -2.5, z: -3,
      model: 'plaque',
      book: 'lch-pump-plaque',
      verb: 'Read',
      examine: 'A clay plaque by the pump, worn smooth on one side.',
    },
    'lch-guard-duty-note': {
      id: 'lch-guard-duty-note',
      zone: 'cloverfield',
      name: 'Notice on the watch post',
      x: -6.5, z: 6.5,
      model: 'post',
      book: 'lch-guard-duty-note',
      verb: 'Read',
      examine: 'A duty note nailed to the post, weathered at one corner.',
    },
    'lch-tithe-tally-scroll': {
      id: 'lch-tithe-tally-scroll',
      zone: 'cloverfield',
      name: 'Tithe tally on the granary cart',
      x: -4, z: -22,
      model: 'cart',
      book: 'lch-tithe-tally-scroll',
      verb: 'Read',
      examine: 'A tally scroll left under a stone on the grain cart.',
    },
    'lch-clippings-notice': {
      id: 'lch-clippings-notice',
      zone: 'hedgewood',
      name: 'Notice at the Clippings post',
      x: 44, z: 36,
      model: 'post',
      book: 'lch-clippings-notice',
      verb: 'Read',
      examine: 'A notice nailed to the post, in two hands.',
    },
    'lch-elder-privet-scroll': {
      id: 'lch-elder-privet-scroll',
      zone: 'hedgewood',
      name: 'Scroll at the Elder Privet',
      x: -52, z: -60,
      model: 'scroll',
      book: 'lch-elder-privet-scroll',
      verb: 'Read',
      examine: 'A rolled copy of names, tied with a strip of bark.',
    },
  },
};
