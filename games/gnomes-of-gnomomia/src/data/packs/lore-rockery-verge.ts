// Lore pack for the Rockery and the Verge: readable books, notes and letters, the named buildings that hold them,
// and three hand-placed outdoor readables. Written to docs/design/gnomomia/lore-rules.md.
import type { ContentPack } from '../../config';

export const PACK: ContentPack = {
  id: 'lore-rockery-verge',
  books: {
    // ---- common: turn up on shelves and lecterns in the zone's houses ----
    'lrv-shard-songbook': {
      id: 'lrv-shard-songbook', title: "The Shard Miners' Songbook", kind: 'book', common: true, where: ['rockery'],
      pages: [
        'Sing down, sing down, the iron is humming,\nthe lamp is low and the rock is warm.\nDig where the old tooth lies in the rocks,\nand mind the seam that sings in the storm.\n\nHammer and hum, hammer and hum,\nthe seam sings true when the seam is done.\n\nSing it at the end of a shift, and stamp on the last hum. The Delvers say the stamp is the only part the rock agrees with.',
        'The old folk say the tooth was the Blade\'s,\nbroke off where the Blade came down too hard.\nDon\'t ask the rock what the Blade was for.\nAsk it nothing. Keep your shovel and your shard.\n\nHammer and hum, hammer and hum,\nthe seam sings true when the seam is done.\n\nWhoever wrote the third verse crossed it out and wrote the first verse again underneath, which is why the book is in the Kiln\'s front room with the margins full of stamps.',
      ],
    },
    'lrv-blade-iron-notes': {
      id: 'lrv-blade-iron-notes', title: 'Notes on Blade-Iron', kind: 'note', common: true, where: ['rockery'],
      pages: [
        'Notes on Blade-iron, for apprentices who think they know it.\n\n1. It comes out of the furnace grey and sulks. Heat it slow. Do not hurry it because it looks pretty, since it is not pretty until the third quench.\n\n2. It hums when it is cold and sings when it is hot. If it sings in the quench, put it down and walk away. Nobody has been cracked that way yet, but Sax says it is a near thing every time.',
        '3. A Blade-iron edge keeps a keen line for ten years. Plain Delver iron keeps one for three. Charge the extra. Smiths who undercharge end up owing the Delvers, and nobody has ever got a debt out of the Delvers.\n\n4. Never file the hum out of it. The hum is the iron\'s own opinion, and the iron is never wrong about the weather. Keep a note of the nights it hums and send the notes up to the Keep with the tithe.',
      ],
    },
    'lrv-kilnwright-primer': {
      id: 'lrv-kilnwright-primer', title: 'A Primer for Young Kilnwrights', kind: 'book', common: true, where: ['rockery'],
      pages: [
        'A Primer for Young Kilnwrights, for gnomes who want to make gnomes.\n\nA gnome is clay, a glaze and a fire. That is all. You will hear grander things from the old songs. Ignore them. The clay does not care about songs, and it cracks faster if you sing at it.\n\nMix the clay wet. Knead it until it stops sticking to your thumbs. Shape the head first. Most good gnomes are ruined by a bad head and a good body, and nobody ever notices until the glaze goes on.',
        'Fire it slow. A gnome fired too fast cracks through the belly, and then it is no use to anyone, least of all to itself.\n\nGlaze it when it is cool. Paint the eyes last. The eyes are the only part you are allowed to be proud of.\n\nRemember that no gnome is born. Gnomes are made, and a made gnome is only as good as the kilnwright who made it. The old Kiln made the first seven, and nobody living has seen it do so. We have never managed it as well since.',
      ],
    },
    'lrv-shorn-field-guide': {
      id: 'lrv-shorn-field-guide', title: 'A Field Guide to the Shorn', author: 'Sergeant Nettle Trowell', kind: 'book', common: true, where: ['verge'],
      pages: [
        'A Field Guide to the Shorn, for every soldier posted to the Last Tuft. Read it before the cart goes out.\n\nThe Shorn is a stubble desert. Nothing grows over a finger\'s height, so nothing hides, and anything that moves can be seen from a long way off. Walk low and walk slow, and do not walk in the same line twice.\n\nClippers wear grey and carry shears. They are slow to anger and quick to pray. They will walk up to you singing. Do not answer the singing.',
        'Acolytes push their scythes in straight lines and do not go round anything. Do not stand in their line. If they stop, you stop.\n\nIf you see a cart on the Shorn with a king\'s arms on its side, go round it at a good distance. Someone keeps the grass there perfectly even, and the grass is the only thing on the Shorn that is not afraid of anyone. Do not step on the edge of it.\n\nWater at dusk. Carry a bean in your pocket. A bean is a small hope, and a sergeant is allowed to have one.',
      ],
    },
    'lrv-watch-duty-note': {
      id: 'lrv-watch-duty-note', title: 'Watch Duty, the Fence Line', kind: 'note', common: true, where: ['verge'],
      pages: [
        'WATCH DUTY, FENCE LINE, NIGHT SHIFT. Read and sign.\n\n1. Keep the lamp lit at the Shed door. It does not like the dark. Nobody has asked the thing in the Shed what it likes, but the lamp is cheap.\n\n2. Do not pull the Waking Rope, for any reason. Yes, the Even Cut have asked nicely. No.\n\n3. If the ground shudders, count to forty. If it shudders again, run to the Last Tuft and do not look back at the Shed.',
        '4. Something drinks from the water barrels after midnight. It leaves them dry and leaves no tracks that a gnome can follow. Fill the barrels before dusk and sleep with your back to them.\n\n5. The rust-rats on the fence line are not for fighting. They are running from something north of them. Let them through and write down which way they went.\n\n6. Sign the sheet. Signing is not a promise to stay awake.\n\nCaptain Thistle Haybale, for the Fence Line.',
      ],
    },
    'lrv-soldier-letter': {
      id: 'lrv-soldier-letter', title: 'A Letter from the Front', author: 'Yarrow Mattock', kind: 'letter', common: true, where: ['verge'],
      pages: [
        'Dear Mum,\n\nI am well, and my glaze is holding. The clay out here is greyer than at home and it cracks easier, so I have been careful with my knees on the long marches.\n\nWe are at the Last Tuft now. It is the last bit of long grass before the Shorn, and I think that is why it got its name. The tents are warm at night. The bean soup is not, but I have stopped complaining about it, mostly.',
        'I have seen the Even Cut. They are not what the stories say. They are tidy and quiet and they cut everything, even the bits that are not in anyone\'s way. One of them gave me a cup of water and asked me to forgive the grass. I did not know what to say, so I said nothing and drank the water.\n\nTell Dad the bread from the Hedgewood camp is not as good as his, and do not tell him I said so.\n\nYour loving son, Yarrow.\n\nP.S. Please send more clove oil. Please send it in the tin, not the jar.',
      ],
    },
    // ---- named buildings ----
    'lrv-anvilroot-ledger': {
      id: 'lrv-anvilroot-ledger', title: 'Forge Ledger', author: 'Cobalt Anvilroot', kind: 'journal',
      pages: [
        'FORGE LEDGER, THE RINGING ANVIL, FLINTDELVE\n\nShard iron in: four bars, two cracked on the way up the lift.\nShard iron out: a bell-sword for the Reeve\'s son, a spade-blade for Mossbottom, one helm for the Delvers (paid in full, which is a first).\nOwed to the forge by Hob Tallow: three pints at the Hot Seam, and a hinge.\nOwed by the forge to nobody. Good.',
        'Note to self. The iron hummed all week. Do not lean on the anvil when it hums. Last time I leaned on it I lost a tooth and the iron kept humming.\n\nBramble has gone off to Mossbottom with his own hammer. I told him he had no hands for it. That was a lie, and she has the best hands I ever trained. I drank the words I said to her, and I should have drunk less.\n\nStop drinking before the quench, not after.',
      ],
    },
    'lrv-hum-log': {
      id: 'lrv-hum-log', title: 'The Hum Log', author: 'Saxifraga Hammerclod', kind: 'journal',
      pages: [
        'THE HUM LOG. Kept by S. Hammerclod, Forewoman of the Delvers. Not for the Keep\'s clerks.\n\nNight 1: The seam hummed from supper until midnight. Stopped the lift. Two hours lost.\n\nNight 9: Hummed again, slower. Cups came off the shelf at the Hot Seam. Told the clerks it was a bad wind down the shaft. They believed me. I think they wanted to.\n\nNight 14: The iron sang while we were cutting. Grout says it is further along than last month. Grout is blind and wrong about most things, and he has never been wrong about that.',
        'Night 22: Stopped the mine for three days. Told the Keep it was a roof fall. The tithe is short. I will pay the difference out of my own pocket if I have to, and I may have to.\n\nNight 30: Iron is iron. If it sings while I dig, I dig louder. I said that to the lads, and it is true, and I do not like how true it is.\n\nFor whoever finds this book: the hum is not in the rock. It comes from the far side of the seam, where the Shard is open to the air. Do not put your ear to it.',
      ],
    },
    'lrv-kiln-tallies': {
      id: 'lrv-kiln-tallies', title: 'The Kiln Tallies', author: 'The Kilnkeepers, by hand', kind: 'book',
      pages: [
        'THE KILN TALLIES. Kept in the Kilnhouse by the Kilnkeepers, year on year, since the Charter of Stone.\n\nThe Charter says the Delvers keep the Kiln and the Kilnkeepers keep the count. The count is what this book is for. The Kiln itself needs no keeping, the Charter says, since it has not been lit in living memory.\n\nYear 1: The Kiln fired no gnomes. Clay tithed from Flintdelve, forty tubs.\nYear 2: Clay tithed, forty tubs. Kiln unlit.',
        'The first entry of the old count is copied from a book that has since been lost. It reads: Seven gnomes. Glazed. Walked out. Where to, it does not say.\n\nSince then the count has been kept in the small kilns of the towns. Flintdelve, nine gnomes. Mossbottom, two (one cracked on the road home, glued, and still counted). Thatchford, four.\n\nA note in a later hand, in different ink: The Kiln-born were stronger. We have made eighty gnomes here and none of them has stood up to the Blade. Make them better. Do not ask what better means.',
      ],
    },
    'lrv-kiln-born-legend': {
      id: 'lrv-kiln-born-legend', title: 'On the Kiln-Born', kind: 'scroll',
      pages: [
        'ON THE KILN-BORN, as told in Flintdelve, which disagrees with the songs.\n\nSeven came out of the Kiln first. The songs give six names and a seventh that the songs have forgotten. The Flintdelve version says the first gnome out was a woman with a cracked foot, and that she walked straight toward the Spigot without stopping to be admired. Mossbottom says the first was a gnome named Moss, who sat down on a stone and asked for tea.',
        'The Kilnkeepers\' copy says the Kiln-born were not glazed at all. They were fired in their own dark and came out already grey. It says they were stronger than the gnomes of today. Ask a stronger gnome what that was like and it will say, "Heavy."\n\nNobody who knows the Kiln will tell you how to light it. Nobody who has been to the back chambers will tell you what stands in them. This scroll is only the Flintdelve story, and the Flintdelve story is wrong about the tea.',
      ],
    },
    'lrv-unfired-register': {
      id: 'lrv-unfired-register', title: 'The Unfired: Evening Visits', author: 'Kilnkeeper Sedum', kind: 'journal',
      pages: [
        'THE UNFIRED: EVENING VISITS. Kept by Sedum, Kilnkeeper, for the Kilnhouse. Read it after the lamps are out.\n\nThe Unfired stand in rows in the back chambers. There are one hundred and twelve. I count them every evening, so I know when one has gone.\n\nThey are soft, half-shaped gnomes. Some have only a face. Some have a hand and nothing else. Their eyes are painted on, and the paint is still bright, which means somebody cared about the painting and then stopped.',
        'Most are still. A few turn toward me when I speak. They do not attack. They want to be finished, and I cannot finish them, because the glaze is not mine to pour.\n\nI tell them the glaze is nearly ready. That is not true. I tell them it will be soon.\n\nFour nights ago the lamp in the front chamber burned all night. I did not light it. In the morning it had gone out, and the Unfired by the door were a little nearer the front. Nobody believes me when I write things like that. I have written it anyway.',
      ],
    },
    'lrv-hobnail-letter': {
      id: 'lrv-hobnail-letter', title: 'A Letter for Hob', author: 'Vetch Haybale', kind: 'letter',
      pages: [
        'Hob,\n\nThe lamp is lit in the window, the way you asked, though I cannot see why it had to be lit while you were down the seam. Grout says the seam is quiet this week. I do not believe Grout, but I want to.\n\nThe children have started a game where one of them is the Shard and the others have to hum louder than it. They are very good at it. Pip hums in her sleep now. I told her to stop, and she said the hum is not hers.',
        'Come up when the shift bell rings, not when you feel like it. I know you will want to finish the face. Finish it tomorrow. There is always another face, and there is only one of you, and you are the only one who knows how to wind the lift.\n\nIf the seam sings again, sing back. You always said that helped. I have not tried it. I would rather hear you tell me it is nonsense over a plate of barley.\n\nYour Vetch.\n\nP.S. The goat is fine. The goat is always fine.',
      ],
    },
    'lrv-quartermaster-roll': {
      id: 'lrv-quartermaster-roll', title: 'Supply Roll, Last Tuft', author: 'Quartermaster Fennel Burlap', kind: 'note',
      pages: [
        'SUPPLY ROLL, LAST TUFT, KEPT IN THE QUARTERMASTER\'S TENT.\n\nDried peas: forty sacks, three damp. Eat the damp ones first.\nHoneydew: twelve jars from Cloverfield, paid for.\nSnail-cart spare wheels: two.\nRope, lengths of: thirty from the Hedgewood, ten of which are still wet.\nLamp oil: a little. Use it on the walls at night, not for reading.',
        'Glaze paste: eight pots. Use it on the fresh cracks first. Do not use it on the old ones. The old ones have already decided.\n\nShard iron: none issued. The Delvers keep it.\n\nRequests sent to the Keep and not answered: more blankets, more hands, more bean. The Keep says the Verge is quiet. The Verge is not quiet. Someone should tell them.\n\nLast entry: the Even Cut asked for our spare shears. We gave them the blunt ones.',
      ],
    },
    'lrv-glazing-records': {
      id: 'lrv-glazing-records', title: 'Glazing Records, the Glazing Tent', author: 'Clove Haybale, Glazier', kind: 'journal',
      pages: [
        'GLAZING RECORDS, FIELD HOSPITAL, THE LAST TUFT. Cracks sealed are marked with a dot. Shattered is written in full, because it is a fact.\n\nDay 1: fourteen soldiers in. Eleven dotted. Two sent to the Keep. One I cannot place yet. The glaze holds on the eleven, and it will hold for a season if they stay out of the wind.\n\nDay 4: twenty-two in. Two of them asked me to write their names on the cart in their own hands, so that their mothers would know. I did.',
        'Day 9: nineteen in. The wind has been cutting in off the Shorn. Cracks that ought to heal are not healing. I am short of clear glaze, and the Keep\'s carts are late.\n\nDay 11: a soldier with a deep crack along the chest, which will not hold through the road. He stays. I have written him under "not for the cart". He asked me to tell his brother he was still glazed. I have told him I will.\n\nDay 12: glaze, three pots. Tent Two is full. I have started a third row.',
      ],
    },
    'lrv-even-cut-catechism': {
      id: 'lrv-even-cut-catechism', title: 'The Catechism of the Even Cut', kind: 'book',
      pages: [
        'THE CATECHISM OF THE EVEN CUT. Learn it by heart. Recite each morning at first light.\n\nQ. What is the lawn?\nA. The lawn is one height. All height that is not one height is a sin.\n\nQ. Who levelled the lawn?\nA. The Tall Ones, who sowed it, and who left it for us to keep even.\n\nQ. Who keeps the lawn?\nA. We do. The Crown keeps it badly. The Wildlings do not keep it at all.',
        'Q. What is the Saint?\nA. The Saint is the Old Beast in the Shed, and it is level in its heart. It drinks Black Dew and breathes stink, and it wakes when the Rope is pulled. It is not wicked. It is the only thing that has ever cut the lawn to one height, and it will do so again.\n\nQ. What do we do when the Saint stirs?\nA. Stand at the edge of the Shorn and wait, with clean shears and a quiet mouth. Do not be afraid. Fear makes the grass uneven.\n\nQ. What is the sin?\nA. Wildness. Let it grow, and it grows over us.',
      ],
    },
    // ---- outdoor readables ----
    'lrv-forge-plaque': {
      id: 'lrv-forge-plaque', title: 'The Forge Plaque', kind: 'plaque',
      pages: [
        'THIS FORGE IS OPEN TO ALL DELVERS. SHARD IRON IS FOR TOOLS, NOT FOR SPITE. SET UP IN THE YEAR OF THE CHARTER OF STONE, BY THE DELVERS OF FLINTDELVE, WHO DUG THE SEAM AND KEPT THE TITHE.\n\nWho takes iron without the tithe will be struck from the Board. Who hears the iron sing is asked to tell the Forewoman, who will listen, and then dig louder anyway.',
      ],
    },
    'lrv-last-tuft-epitaph': {
      id: 'lrv-last-tuft-epitaph', title: 'Epitaph at the Last Tuft', kind: 'plaque',
      pages: [
        'HERE LIES BURDOCK HAYRAKE, GLAZIER OF THE LAST TUFT. HE WAS CRACKED ON THE SHORN AND GLUED TWICE. HE WAS SHATTERED ON THE THIRD MORNING, WHEN THE WIND CAME FROM THE WRONG SIDE. HE MENDED THE CRACKS OF EIGHTEEN GNOMES BEFORE HIS OWN.\n\nHe never said he was brave. He said the clay did it. His tent-mates raised this stone. Please do not walk on the grass above him. It is the only uneven grass on the Verge.',
      ],
    },
    'lrv-kings-note': {
      id: 'lrv-kings-note', title: "The King's Note", kind: 'scroll',
      pages: [
        'To the Keep, from the King on the road. The door on the Shed is cracked at the left hinge but it is holding. Re-bar it with Rockery iron before the next Rumble, and send the bars by the Fieldwardens\' cart, not the Pipewrights\', since the Pipewrights are busy with the pipes.\n\nP.S. The grass by this cart has been cut again. Tell the Even Cut I said thank you, and that I did not ask them to. G.',
      ],
    },
  },
  objects: {
    'lrv-plaque-flintdelve': {
      id: 'lrv-plaque-flintdelve', zone: 'rockery', name: 'a forge plaque', model: 'plaque', book: 'lrv-forge-plaque', verb: 'Read',
      examine: 'A brass-coloured plate on a post by the forge, worn smooth at the middle.',
    },
    'lrv-grave-last-tuft': {
      id: 'lrv-grave-last-tuft', zone: 'verge', name: "Burdock Hayrake's grave", model: 'grave', book: 'lrv-last-tuft-epitaph', verb: 'Read',
      examine: 'A small grey headstone, glued at one corner. The grass around it is uneven.',
    },
    'lrv-scroll-kings-cart': {
      id: 'lrv-scroll-kings-cart', zone: 'verge', name: "the King's cart", x: -60, z: -10, model: 'scroll', book: 'lrv-kings-note', verb: 'Read',
      examine: 'A scroll nailed to the side of an old cart. The grass around the cart is cut perfectly level.',
    },
  },
};
