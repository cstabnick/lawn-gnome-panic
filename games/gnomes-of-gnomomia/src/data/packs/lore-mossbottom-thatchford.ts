// Lore pack: readable lore for Mossbottom Vale and Thatchford Downs.
import type { ContentPack } from '../../config';

export const PACK: ContentPack = {
  id: 'lore-mossbottom-thatchford',
  books: {
    // Common family books: they turn up on ordinary shelves in these zones.
    'lmt-harvest-songbook': {
      id: 'lmt-harvest-songbook', title: 'The Mossbottom Harvest Songbook', kind: 'book',
      common: true, where: ['mossbottom'],
      pages: [
        'The Long Lawn\n\nFirst the Lamp, then the Rain, then the hand in the soil.\nThe hand made the Kiln, and the Kiln made the clay,\nand the clay stood up, and was gnome.\n\nSing it slow at the cutting. The Long Lawn was long before any of us, and it will be long after the last cart is loaded. Mind the sickle hand.',
        'The Mowing Verse (sing it low)\n\nWhen the lawn grew proud, the Rope was pulled,\nand the Hand’s own beast came out in the dark.\nIt drank the Black Dew. It breathed its stink.\nThe grass lay down, all one height.\n\nWe went under. We came up. The lawn grew back.\n\nThe old ones still sing the last verse at the harvest. The young ones sing it faster to get to the pie.',
      ],
    },
    'lmt-almanac': {
      id: 'lmt-almanac', title: 'The Mossbottom Almanac', author: 'Yarrow Dibble', kind: 'book',
      common: true, where: ['mossbottom'],
      pages: [
        'Sow the early peas when the blackbird stops sulking, which is usually the second week of spring.\n\nDo not sow beans on the Dewdrop side. The mist sits too long and the roots go soft. My grandmother did it anyway and lost four rows for her trouble.\n\nWhen mushrooms come up in a ring overnight, leave them be. That is a Tall One’s footprint, or so my grandmother said. Pick them and you pick the luck, and the luck does not come back.',
        'Moles come up through the cabbage bed in the late dry. They are not doing it to spite you. Something has upset them underground. Put down a bit of sacking and a bowl of water and they will go on their way. The old ones say the moles used to be friendly. Nobody under fifty believes it.\n\nWeather, as a rule: when the brook smells of pennies, rain by morning. When the water at Puddlemere goes dead still, there is trouble up on the Shorn. I have never known the second rule to fail. I wish I had.',
      ],
    },
    'lmt-love-letter': {
      id: 'lmt-love-letter', title: 'A Letter to Sweetbriar', author: 'Borage', kind: 'letter',
      common: true, where: ['mossbottom'],
      pages: [
        'Sweetbriar,\n\nThe well is low again. I have carried the water up for you three mornings running, so you can stop pretending you did not see me. The Keep is sending fewer carts this way, and I am not sure I want a cart-job anyway. I am staying in Mossbottom, where the mushrooms are lumpy and the neighbours are honest about it.\n\nI put a clean bit of clay in the top of your door. It is the one I fired myself. It cracked in the kiln and I glued it, so it is honest work.',
        'You said I would be glazed over before I said a true thing. Well. I love you. My knees are bad and my glaze is patchy, but the rest of me is still fired properly.\n\nCome to the well at dusk. Bring your trowel. The Moss girl on the statue has one too, and I think she would like the company.\n\nYours, with mud on the envelope,\nBurdock',
      ],
    },
    'lmt-price-list': {
      id: 'lmt-price-list', title: 'Thatchford Market-Day Prices', kind: 'note',
      common: true, where: ['thatchford'],
      pages: [
        'THATCHFORD MARKET-DAY PRICES\n\nGrain (Cloverfield, per sack): 4 pence\nHoneydew (Cloverfield, per jar): 2 pence\nTimber (Hedgewood, per length): 6 pence, the Hedgewrights’ surcharge included\nIron (Rockery, per bar): 1 shilling, ask for the Delvers’ stamp\nTall-eyes (glass, per dozen): 3 shillings, Keep-stamped only\nPots, lids and buckets: whatever the potter says\n\nNo tallies on credit after the Dry Summer. The Reeve’s word on this is final.',
        '[Pencilled beside the grain line:] Four pence, my foot. Four pence is what I paid in the Dry Summer, and that was for dust with a beetle in it.\n\n[Under that, in a shakier hand:] Mind your mouth, Yarrow. You know whose charter this is.\n\n[Lower still, very small:] Still four. Count the sacks yourself.',
      ],
    },
    'lmt-ferry-log': {
      id: 'lmt-ferry-log', title: 'The Ford Log', author: 'Eelgrass Hobnail', kind: 'journal',
      common: true, where: ['thatchford'],
      pages: [
        'Log of the ford, kept by E. Hobnail, ferryman, Thatchford.\n\nDay 1 of the thaw: Hose high. One cart over on the rope, one cart stuck in the middle. Pulled out by two Fieldwardens and a goat. Goat fee charged to the Fieldwardens. They will not pay it.\n\nDay 3: crossed nine gnomes, one dog and a barrow of turnips. Lost one turnip to the current. Recovered it. It was eaten by the Wildling on the bank before I could charge him.',
        'Day 9: the water at the stones is fresh-sweet, which it never is. Tasted it twice to be sure. Master Pipewright Ida Gromwell came down and looked at the river for a long time and said nothing. Then she went back up the hill. I have not seen her since.\n\nDay 10: no crossing. The Hose is too clear. I do not like it. Put the rope on the high post and went home.\n\nNote for the next ferryman: the rope is rotting at the south post. Tell the Reeve. He will say it is carts.',
      ],
    },
    'lmt-recipes': {
      id: 'lmt-recipes', title: 'Stoop’s Receipts for a Thatchford Kitchen', author: 'Chervil Stoop', kind: 'book',
      common: true, where: ['thatchford'],
      pages: [
        'To Make Mushroom Stew Worth Eating\n\nTake one cap, fresh, from the north side of the ring. Not the ring. Never the ring.\n\nSimmer with the barley until it stops arguing. Add salt, one pinch of sorrel, and the end of yesterday’s bread for thickness. Serve hot in a clean pot, not the one the goat has been in.\n\nIf the stew tastes of rain, you have used the brook. Start again.',
        'Honeydew Cake\n\nHoneydew from Cloverfield, two spoons, warmed with a splash of rainwater from the Spigot. Not the brook. The brook is for the goat.\n\nBake in a pot lid until the top goes the colour of a Kiln shelf. Serves four gnomes, or one gnome who has had a bad week.\n\nDo not serve it to the Even Cut. They will ask whether the cake is level.',
      ],
    },

    // Named buildings.
    'lmt-young-gnomes-primer': {
      id: 'lmt-young-gnomes-primer', title: 'A Primer for Young Gnomes', author: 'Thrift Hollin', kind: 'book',
      pages: [
        'A Primer for Young Gnomes\n\nLesson one: You are fired clay. You are not a biscuit. Biscuits are for the goat.\n\nFired clay cracks. This is not a tragedy. A kind gnome with a pot of glue will mend you, and you will be more interesting for it. Ask anyone in Mossbottom with a seam down their face.\n\nLesson two: the lawn is for keeping, and keeping means tending. Cut a little, water a little, and let the rest be.',
        'Lesson three: which way is north? North is the Keep, where the water comes from. South is the road home. Up is the sun. Down is the Deeps, and you will not go there. When you are older you will be told why, by someone who will not like telling you.\n\nLesson four: gnomes are made, not born. A kilnwright made you. Kilnwrights are not as good as the old Kiln was, and the old Kiln is a long way off. Be a good gnome anyway. We are warm here.\n\nRecite these aloud before supper.',
      ],
    },
    'lmt-fernwick-journal': {
      id: 'lmt-fernwick-journal', title: 'Elder Fernwick’s Journal', author: 'Fernwick', kind: 'journal',
      pages: [
        'The Night of the First Rumble (thirty-two years ago, I think, I have stopped trusting my sums)\n\nI was in this chair with a bowl of barley. The bowl walked off the table. Not fell. Walked, two inches, and stopped. I have written it down because my apprentice says I make things up when I am tired, and I should like it on paper, in my own hand, for once.\n\nThe cups in Thatchford fell off their shelves that same night, so I am told. Mossbottom only shook. We are used to shaking here. That is the sort of thing you can say about a village.',
        'The King came through the vale in the spring after the Rumble, going to the Verge with a cart of Rockery iron. King Gnorbert is a young gnome with a clean glaze and a kind voice. He asked me to put my ear to the ground. I did. It was like the ground was holding its breath.\n\nI told him it was fine. It was fine then. I am not sure what I would tell him now.',
        'Thistle sweeps the path to the Keep. He has done it for forty years and I have never asked him to stop. Primrose walked home by that path every season from the waterworks, and when the water came up under the Keep, nine years after he began, she was lost below with the others.\n\nI do not say her name when he is within earshot. I am 212. The knees are the only honest thing about me, and they tell me when a thing needs leaving alone.',
      ],
    },
    'lmt-complaint-to-reeve': {
      id: 'lmt-complaint-to-reeve', title: 'A Complaint to the Reeve', author: 'Fernwick', kind: 'letter',
      pages: [
        'To Reeve Yarrow Burlap, Thatchford, by the post.\n\nSir,\n\nI write to complain of the ground. It has moved under my house on four nights this month, and my teacups have moved with it, which I find a poor sign in a cup. You will say it is carts. The road to Thatchford has carts on it, I accept. The ground under Mossbottom has no carts on it at all, which is rather the point.',
        'I ask that a gnome be sent to listen at the north end of the vale. I do not ask for a Warden, as I know what a Warden costs. I ask for someone who will kneel down and put an ear to the earth.\n\nI am aware my knees are not the Crown’s business. Nevertheless.\n\nYours, with a beard that has its own postcode,\nFernwick, Elder of Mossbottom (212)',
      ],
    },
    'lmt-drinking-songs': {
      id: 'lmt-drinking-songs', title: 'Songs for the Tipsy Toadstool', author: 'Dill Puddleby', kind: 'book',
      pages: [
        'The Ford Song\n\nHoist the mug and mind the stair,\nthe Hose is high and so’s the chair.\nDrink the ale and not the ford,\nthe ford is wet and so’s my word.\n\nSing it twice if the cart is stuck. Sing it three times if the cart is the Reeve’s, and then go and pay your toll like a proper gnome.',
        'The Toadstool Round\n\nWhen the lamp is low and the barrel’s spent,\nwe sing for the ones the water went.\nFill up the cup for the bench by the wall,\nthe one that stays empty. We drink it all.\n\nThe room goes quiet at the last line. That is how you know it is the proper ending.',
      ],
    },
    'lmt-tabs-owed': {
      id: 'lmt-tabs-owed', title: 'Tabs Owed', author: 'Dill Puddleby', kind: 'note',
      pages: [
        'TABS OWED, as of Thursday\n\nSergeant Stoutpot: two rounds, one shield repaired (not by me). Will pay in the morning.\nMagister Dimm: three rounds and a go at the cellar door. Morning is not a word he understands.\nNettle, Pipewright: one pie. Not a crumb given back. I will not chase it.\n\nPlease note that the long table at the back is not for sitting. It is laid, and it has been laid since before my mother’s time. Mind it.',
      ],
    },
    'lmt-town-charter': {
      id: 'lmt-town-charter', title: 'The Charter of the Ford at Thatchford', kind: 'book',
      pages: [
        'The Charter of the Ford at Thatchford\n\nBe it known that the Crown grants to the market at the Hose-ford the right to hold a market on every fourth day, the Square being kept by the Reeve and swept by the town.\n\nThe ford shall be kept clear for the passage of all goods between the south villages and the Keep. No gnome shall build within a cart’s width of it. The Crown has been asked twice on this point and has answered twice.',
        'Of the goods that cross: grain under the Charter of Root and Seed, timber under the Charter of Bough, and iron under the Charter of Stone, each to pay the ford toll in its own kind.\n\nThe Hedgewrights’ right to the timber of the Hedgewood is upheld in full, including the stands where other gnomes have lately made their homes. The Crown does not take sides between a tree and a gnome. Where the Crown does take sides, it will say so in the next charter.',
        'Signed at the Keep in the year the Hose was high, by the hand of King Bartholomew III.\n\nA later hand has written in the margin, in ink gone brown: “The ford was never meant to be a town. It was a place to cross. Towns grow where people stop, and we were told to keep moving.”\n\nBeneath it, another hand: “Who told us?”\n\nNo answer is written.',
      ],
    },
    'lmt-guild-minutes': {
      id: 'lmt-guild-minutes', title: 'Minutes of the Thatchford Traders’ Guild', kind: 'book',
      pages: [
        'Minutes of the Thatchford Traders’ Guild, held in the Guildhall on the first night of the thaw. Present: eleven gnomes and one goat (not a member, not asked to leave).\n\nItem one: the roof. Hollin proposes thatch. Stoutpot proposes slate from the Rockery. Argued for two hours. Slate carried, on condition the Delvers pay for the carting, which they have not agreed to. Item carried over.',
        'Item two: the tithe to the Keep. The clerk reads the Crown’s letter. Murmurs. Someone says the Keep should pay for its own water. Someone else says the Keep is where the water comes from. The chair asks the room to be civil. Civil is refused; the room is not in the mood.\n\nVote to write a polite letter. Carried, narrowly, after a second vote because the first was disputed.',
        'Item three: the mill wheel. The miller was not invited, and came anyway, with a tally.\n\nItem four: the Even Cut’s request to lay out a level lawn in the Guildhall yard. Refused by ten votes to one. The one was Sergeant Stoutpot, who says she has no opinion and voted for it to annoy the room.\n\nAny other business: none. Adjourned in an argument about the adjournment.',
      ],
    },
    'lmt-miller-ledger': {
      id: 'lmt-miller-ledger', title: 'The Mill Ledger', author: 'Rye Grindwell', kind: 'book',
      pages: [
        'Rye Grindwell, miller. Book of the wheel, begun the year after the cracking.\n\nFlour, sacks in: 412 (grain from Cloverfield, paid in full, mostly).\nFlour, sacks out: 388. The rest went to mice and to a Wildling, whom I did not charge. I have decided to be proud of that.\n\nWheel repairs: three pegs, one spoke, and one “fixing” by the Crown’s man, which made it worse.',
        'Tremors, tallied by hand. A stroke for each one felt through the floor. A bar for each one that shook the cups.\n\nA quiet year: ||||\nA bad year: |||| |||| |||| |||| ||||\nThe year it started again: |||| |||| |||| |||| |||| |||| |||| |||| ||||\n\nIt is not carts. I have carted. I know a cart.',
      ],
    },
    'lmt-even-cut-sermon': {
      id: 'lmt-even-cut-sermon', title: 'A Sermon on the Level', author: 'Brother Sedge', kind: 'book',
      pages: [
        'A Sermon on the Level, preached at the Neat Chapel on the Sabbath of the cut.\n\nFriends, we come bareheaded to the Level, as the sky comes to it. Nothing stands above the lawn in this house. Leave your hat on its hook and your pride beside it, and walk in on the stones.\n\nSome of you have asked why. Look at the wall. Forty names. Forty Pipewrights who went down into the Deeps and did not come up. Not one of them stood taller than the rest in the end. That is the Level.',
        'The Long Lawn tells us the Hand cut the grass so that no gnome would be the highest. Other villages sing the same verse and say it is about hiding. We say it is about rest. A cut lawn is a lawn that is kept. A lawn that grows is a lawn that is running off.\n\nDo not be afraid of the Level. It has never been unkind to us. It asks only for our attention, and for our heads to be bare when we give it.',
        'Each evening the names are read aloud. Listen with your head bare.\n\nHob Mattock. Tobias Stile. Wren Pailer. Rue Lintel.\n\nThe Level keeps them. We keep the Level. There is no more to it than that, and nothing in it that needs answering. Go in peace, and mind the stones on the way out.',
      ],
    },

    // Hand-placed outdoor readables.
    'lmt-founding-plaque': {
      id: 'lmt-founding-plaque', title: 'Founding Plaque, Thatchford Fountain', kind: 'plaque',
      pages: [
        'THIS SQUARE WAS MADE WHERE THE HOSE CROSSES THE ROAD.\n\nA market grew at the ford, the only ford between the south villages and the Keep. Grain came down from the fields, timber from the wood, iron from the Rockery. Those who stayed built the first roofs. Those who came after kept the fountain running, and we have kept it running since.\n\nMind the ford. Pay the toll. Thatchford is what you make of a crossing.',
      ],
    },
    'lmt-ford-notice': {
      id: 'lmt-ford-notice', title: 'Notice at the Ford', kind: 'note',
      pages: [
        'NOTICE TO ALL WHO CROSS\n\nThe rope is to be hauled by two gnomes at a time, and not by one gnome and a goat. The goat has been told.\n\nDo not cross in high water. If the Hose is as clear as glass, do not cross either. Ask the ferryman. If there is no ferryman, ask the Reeve, who will say it is carts.\n\nPaid tolls go in the box. The box is emptied on the fourth day.',
      ],
    },
    'lmt-primrose-cenotaph': {
      id: 'lmt-primrose-cenotaph', title: 'Primrose, Who Walked Home', kind: 'plaque',
      pages: [
        'PRIMROSE THISTLE\nof the waterworks at the Keep, and of this vale\n\nShe walked home by the Keep path every season. She is not under this stone.\n\nThe water came up through the Deeps, and she was lost below with the others. There was nothing to bury. We set this stone where her path begins, so that anyone who sweeps past can read her name.',
      ],
    },
  },
  objects: {
    'lmt-founding-plaque': {
      id: 'lmt-founding-plaque', zone: 'thatchford', name: 'Founding Plaque', x: 4, z: -9,
      model: 'plaque', yaw: 0, book: 'lmt-founding-plaque', verb: 'Read',
      examine: 'A brass plate on the fountain’s stone. Someone has polished the first line and no other.',
    },
    'lmt-ford-notice': {
      id: 'lmt-ford-notice', zone: 'thatchford', name: 'Notice Post', x: -2, z: 10,
      model: 'post', yaw: 0, book: 'lmt-ford-notice', verb: 'Read',
      examine: 'A post by the ford, with a notice pinned to it and a box nailed below.',
    },
    'lmt-primrose-cenotaph': {
      id: 'lmt-primrose-cenotaph', zone: 'mossbottom', name: 'Primrose’s Stone', x: -4, z: 6,
      model: 'grave', yaw: 0.4, book: 'lmt-primrose-cenotaph', verb: 'Read',
      examine: 'A small grave-stone with no grave under it. Someone sweeps around it.',
    },
  },
};
