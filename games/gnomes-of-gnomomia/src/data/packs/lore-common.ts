// Lore pack: world-wide common books (Fescue-wide, on any generated shelf or lectern).
import type { ContentPack } from '../../config';

export const PACK: ContentPack = {
  id: 'lore-common',
  books: {
    // ---- The Planting: songs, rhymes, prayers, sayings ----
    'lc-the-long-lawn': {
      id: 'lc-the-long-lawn', title: 'The Long Lawn (the full verses)', kind: 'scroll', common: true,
      pages: [
        `First the Lamp, then the Rain, then the Hand in the soil.
The Hand made the Kiln and the Kiln made the clay,
and the clay stood up and was gnome.

Now we stand on the Long Lawn,
short at the root and tall at the tip,
and we keep what we were given to keep.`,
        `Who sowed the grass in the dark?
The Hand, who was tall, who was far.
Who turned the Rope and set the Blade to go?
The Hand, who was tall, and then was not.

Sing for the Hand, and sing for the Blade,
and sing for the stone that stopped its mouth.
The Long Lawn is kept by the stone and the song.`,
        `Keep it low, keep it low,
wet the root and let the top go.
Keep the grass and keep the gnome,
keep the lawn and bring us home.

Written down by a clerk who sang it at harvest. The Even Cut sing "level" where the verse says "low". The Wildlings sing "let" for "keep" in the last line and are not sorry.`,
      ],
    },
    'lc-seven-kiln-born': {
      id: 'lc-seven-kiln-born', title: 'Counting the Kiln-born', kind: 'book', common: true,
      pages: [
        `One for the foot that walked the clay,
two for the hand that smoothed the face,
three for the brow that turned to look,
four for the mouth that said not yet,
five for the back that bent to lift,
six for the eye that did not blink,
and seven for the one who came out last,
whose name each village keeps for itself.`,
        `Mossbottom says the seventh was called Moss, which is why Mossbottom is always damp.

Thatchford says the seventh was called Hobnail, which is why Thatchford has so many boots.

Cloverfield says the seventh was called Tansy, and that she was the first to be fired right.

The Keep says the seventh was simply the Keeper, and nobody has ever needed to ask him anything else.`,
        `Teach the children to count the seven twice, once with each name. A child who counts seven and gets the same answer twice is not yet ready for the Keep, the schoolmaster says, and the schoolmaster is from Thatchford.

Nobody has yet explained why the seventh is always last. Count them on your fingers, and if you run out, start again with the foot.`,
      ],
    },
    'lc-prayer-for-lying-down': {
      id: 'lc-prayer-for-lying-down', title: 'A Prayer for Lying Down', kind: 'scroll', common: true,
      pages: [
        `Tall Ones, who sowed us, we are lying down.
The lawn is wet and the day is shut.
Keep the rain on the roots and the frost off the eyes.
If we crack in the night, let the glue be warm.
If we are shattered, let us be swept up gently
and put back in the ground to keep the lawn.`,
        `Leave us the Long Lawn, low and green.
Do not come up the path to see if we are kept.
We are kept. We are keeping it for you.
Shut the door of the Dark House, and let it be quiet.
So be it, to the Hand, to the Kiln, to the stone.

Give the frost a rest and the sun a turn,
and keep the glue warm for the ones who will need it.`,
        `Said at the bedside. Mothers say the last line. Fathers say the line before it. A glazier says the line about the glue, and says it louder than the others.

The prayer is said in a whisper. A child who says it aloud is told that the Tall Ones are a little deaf, and that the lawn can hear just fine.`,
      ],
    },
    'lc-sayings-of-the-clay': {
      id: 'lc-sayings-of-the-clay', title: 'Sayings of the Clay, Gathered for Schools', kind: 'book', common: true,
      pages: [
        `A fired gnome is a finished gnome, but a finished gnome is still a little soft in the middle.
Wet the root before you judge the leaf.
Crack first, then glaze. Glaze first and you will crack anyway.
The old Kiln took its time, and so should you.
Every gnome is a little bit of the ground that made him.`,
        `Never trust a glaze that shines too bright.
A Tall One's trowel is worth more than a Tall One's promise.
Keep your face to the Sun, your feet in the Rain and your hands in the Bloom.
Nobody is cut level by being told.
Leave the Rope where it hangs.
A dry gnome is a happy gnome, and a wet gnome is a glazed one, and both are better than a cracked one.`,
        `What the gnome who wrote this down said: half of these are true, and the other half are what your grandmother said when she wanted you in by dark.

If you find a saying here that you cannot make sense of, do not be ashamed. Most of them were made by gnomes who could not make sense of it either.`,
      ],
    },

    // ---- The Charters: partisan histories and primers ----
    'lc-crown-primer': {
      id: 'lc-crown-primer', title: 'A Primer of the Crown, for Young Gnomes', author: 'Clary Weedwell, Clerk of the Keep', kind: 'book', common: true,
      pages: [
        `Tend it.

That is the first word of the Crown and the last word of this book. A lawn that is tended is a lawn that stays. A lawn left to itself will go to nettle, then to bramble, then to nothing a gnome can eat.

Cut a little. Water a little. Keep the balance, as the Tall Ones kept it before they went.`,
        `In the Dry Summer, the Spigot ran down to a trickle, and the Crown was the only power in Fescue able to answer. The Pipewrights were sent for. The Deeps were dug. Water came back to the plains, and no gnome went hungry who could walk to a depot.

Some gnomes thought the drought was a judgement. They let their plots go to dandelion and clover and called it freedom. The King, in mercy, did not hang them. He gave them the Hedgewood, and they have been free there ever since.`,
        `Three things make a Crown gnome. A good glaze. A straight row. A quiet tongue about the Dark House.

The three guilds of the Charters are the Fieldwardens, the Hedgewrights and the Delvers. Be grateful to each, and pay your tithe at the Keep on the bell.

Learn these, and the Chancellor will know your name.`,
      ],
    },
    'lc-why-the-lawn-must-grow': {
      id: 'lc-why-the-lawn-must-grow', title: 'Why the Lawn Must Grow', author: 'Yarrow Crumble, of the Hedgewood', kind: 'book', common: true,
      pages: [
        `Every gnome was given a lawn, and every lawn was given a want. The lawn wants to grow. It wants the clover, the dandelion, the bramble and the bee. The Crown calls this a mess. We call it the lawn, finally allowed to be itself.

Cutting is cruelty. A gnome who shears his lawn each morning is cutting the lawn short of its breath, and calling it tidiness.`,
        `The Dandelion Schism was not a judgement. It was an eviction. The King's Groundskeepers came with rakes and took our plots in the Dry Summer, when every gnome was thirsty, and then called it charity. We were sent to the Hedgewood. We went. The Hedge was too thick for the Turning Blade, and our grandmothers said that was a sign.`,
        `We will say this plainly. Some of our young have taken the idea too far. They have gone out with axes and torches against the lumber camps, and we are sorry for every camp that was burned. The idea was never to burn. The idea was to let the wood be wood.

The Hedgewrights have a Charter for the wood. We have the trees. Let the Keep read which is older.`,
      ],
    },
    'lc-on-the-holiness-of-the-level': {
      id: 'lc-on-the-holiness-of-the-level', title: 'On the Holiness of the Level', author: 'Edger Plumbline', kind: 'book', common: true,
      pages: [
        `A lawn is holy when it is level. That is the whole of the faith, and everything else is decoration.

The Tall Ones gave us the Long Lawn and the duty to keep it. Keeping is not guessing. It is cutting to one height, so that nothing stands above the rest to be taken.`,
        `In the Dry Summer, the lawn was uneven, and the Spigot ran dry. The Crown tended the lanes and forgot the level. We do not say the lawn was angry. We say it was crooked, and that the Crown let it stay crooked.

The Turning Blade was the only thing in the Tall Ones' service that did its work without fault. It did one thing, and did it level. It is not a monster. It is the honest tool of an honest garden, and it has been left to rust in the dark by a lawn that has forgotten what it is for.`,
        `Our chapel in Thatchford keeps the Edge. Our fort on the Shorn keeps the line. Come and see the work, and bring your shears. We will teach you to hold them.

Do not be put off by the smell of the fort. It is the smell of a clean edge, and a clean edge is a kind of prayer.`,
      ],
    },
    'lc-three-charters': {
      id: 'lc-three-charters', title: 'The Three Charters, a Clerk\'s Copy', author: 'Royal Archive, Birdbath Keep', kind: 'book', common: true,
      pages: [
        `In the year the Spigot ran dry, King Bartholomew III of the Crown of Fescue, in the sight of the Keep, set his seal to three charters, so that each of the three great guilds might keep one region of the lawn forever and feed the realm.

The Charter of Root and Seed was given to the Fieldwardens, for Cloverfield, to grow grain and honeydew and load the snail-carts, and to pay the Crown its tithe at the Keep.`,
        `The Charter of Bough was given to the Hedgewrights, for the Hedgewood, to take timber, game and bowstring, and to pay the same tithe.

The Charter of Stone was given to the Delvers, for the Rockery, to take iron, slate and tall-eyes, and to pay the same tithe at the same bell.`,
        `Note by the copyist. The Charter of Bough does not say which wood. The Hedgewrights hold that it means the whole Hedge. Others hold that it means only the wood where no gnome lives. The copyist has been asked to leave this out and has not. The Crown's seal is on both readings.`,
      ],
    },
    'lc-pipewright-dry-summer': {
      id: 'lc-pipewright-dry-summer', title: 'A Pipewright\'s Account of the Dry Summer', author: 'Master Rushlight Gasket, Pipewright', kind: 'journal', common: true,
      pages: [
        `Day one of the drought. The Spigot is down to a dribble. The Hose is a lane of stones across the plains, and the moles are complaining about the dust, which I have never seen them do before.

Day nine. The Crown sends for the Guild. I am to dig where the water was. I said we could dig, but that the water was not ours to call up, only to follow.`,
        `Day thirty. We cut into the Keep's old cistern and found pipe under it. Not our pipe. Not anyone's I know. It is laid with a care that is not gnome care: clean curves, no glaze, a joint that would hold a river. We were told to tap it, and tap it we did. Nobody would say who laid it. The Master said not to ask. I asked. He did not answer, which is an answer of a kind.`,
        `Day ninety. Water is back in the plains, and the Crown has given the Guild a bell for it. We are proud. Some of us are also tired of being thanked for something we did not start. Write down what you find under the ground, even when no one asks, and keep your gloves on.`,
      ],
    },
    'lc-charter-of-bough-tract': {
      id: 'lc-charter-of-bough-tract', title: 'The Charter of Bough, and Why We Log', author: 'Thyme Oakhandle, Warden of the Hedgewrights', kind: 'book', common: true,
      pages: [
        `The King gave us the Hedgewood by his own hand, and we keep it by ours. Anyone who says otherwise is a Wildling, or a liar, or from Thatchford, which is much the same in the eyes of the Charter.

We take only what is dead or drooping. A bough that sags over the path is a bough that will break someone's head. We clear the drooping, the Crown has its bowstrings, and the wood is the thinner for the better.`,
        `Hedgewrights built Thatchford's first bridge over the Hose. We built the charter-hall at the Keep. We felled the timber for every hearth in the south. None of this is a boast. It is what the Charter asks, and the Charter is older than any of the rest of us.

Those who burn our camps say our axes are cruel. We say the wood does not feel an axe as a gnome feels a crack. Let them come and tell the saplings what they think of it.`,
        `For the record: the Wildlings had only just settled in the wood when the Charter was sealed, and the Crown has moved them to the edge of it several times since. We have had no quarrel with the trees. We have only ever had a quarrel with the people who sit in them.`,
      ],
    },

    // ---- Everyday books ----
    'lc-crack-care-handbook': {
      id: 'lc-crack-care-handbook', title: 'Crack-Care and Glazing: a Handbook for Kilnwrights and Their Families', author: 'Gilda Ashlar, Kilnwright of Thatchford', kind: 'book', common: true,
      pages: [
        `Every gnome cracks. The good ones crack less, and the careful ones crack in the right place. This book is about the right place.

A hairline crack is a thing to watch. Dust it with dry clay, wet it with a little slip and close it with a thumb. A runner, a crack that climbs from the foot toward the knee, needs the glue and the Bloom.`,
        `Glue: use sap-glue from the Hedgewood willow, warmed, never boiling. Boiled sap gives a gnome a shine you can see from the next village, and nobody likes to be looked at for a fault.

Glaze: lay it thin, lay it even, and let it set under the Sun for one full day. Rain on a green glaze is the quickest way to a second crack.`,
        `A split is a deeper matter. A split runs through the chest or the head, and a gnome with a split has been shattered in all but name. Do not try to fire him again. Do not try to paint over it. Sit with the family, bring the dew, and sweep him gently into the ground beside the Long Lawn, as the prayer asks.

Kilnwrights cannot remake a gnome. The Kiln did that. We only mend.`,
      ],
    },
    'lc-sun-and-rain-almanac': {
      id: 'lc-sun-and-rain-almanac', title: 'The Sun and Rain Almanac for Mossbottom and the South', author: 'Hollis Loamby, Almanac-keeper', kind: 'book', common: true,
      pages: [
        `Sun. The long days come in the sixth month, when the Sun sits over the Keep and the paths dry out by noon. Work the vegetable beds before the heat and sit in the shade of a toadstool after. A gnome who works at noon in the sixth month will be a glaze-crack by the eighth.`,
        `Rain. The wet days come in the ninth month, and the brook at Mossbottom rises a tail-length. Keep your tools off the floor. Keep the cellar dry. Do not walk the low path after a storm; the banks slip, and the moles are always glad of a new hole.

Frost. Frost at the top of the Rockery is a fine thing to look at from a distance.`,
        `Bloom. Plant the clover in the second month, the bean in the fourth and the sorrel any time you have a spare hour. Sorrel forgives everything. The old folk say Bloom is the gentlest school, and the almanac agrees, provided you are gentle with the soil first.

Dry years come about once in a lifetime. Mark the ground. Mark the year. Keep a little water in the cellar in case.`,
      ],
    },
    'lc-seed-cakes-and-dew-broth': {
      id: 'lc-seed-cakes-and-dew-broth', title: 'Seed Cakes and Dew Broth', author: 'Sorrel Tinwhistle', kind: 'book', common: true,
      pages: [
        `Seed cakes (makes twelve, or six for a gnome with a sweet tooth and a Bloom-school doctor on call).

Take a cup of clover flour, a cup of ground sunflower seed, two spoons of honey and one pinch of dry clay, for binding. Stir until it holds a shape. Press into small rounds. Bake in the sun on a flat stone for half a day, turning twice.`,
        `Dew broth.

Gather dew from the lip of a broad leaf before the Sun is up. Never take it from the Hose; it tastes of the Spigot, and no gnome likes to be reminded where the water came from. Warm the dew in a clay pot. Add a sprig of thyme, a crumb of seed cake and a pinch of salt from the cellar jar.`,
        `Serve in the good cups, and do not let the cups sit by the window in a storm. A cup that rattles is a cup that has been waiting for something. Nobody in Mossbottom has ever said what. Eat while it is warm.

Seed cakes keep for a week in a tin. Dew broth does not keep at all, which is why it is the better of the two, and why it is always made again the next morning.`,
      ],
    },
    'lc-manners-for-gnomes': {
      id: 'lc-manners-for-gnomes', title: 'Manners for Gnomes Who Mean Well', author: 'Dame Fennel Kettleby', kind: 'book', common: true,
      pages: [
        `On greeting. Stand straight. Nod to a gnome of your own height and bow to one of greater age. Do not bow to a Keep guard unless you have been asked to, and do not bow to the Even Cut at all; they will bow back, and then you will both stand there.

On cracks. Do not remark on a gnome's glaze unless he remarks on yours. A hairline is a private matter, and a runner is a family matter. Never say a crack is "charming".`,
        `On visits. Bring something edible, or a good tool, or a tidy bit of news. Do not bring a cracked cup. Stay for one cup of dew broth and no more, unless it is raining, in which case stay until it stops.

On the Dark House. Do not walk round the back of it. Do not ask a gnome what he heard through its door. If the door is cracked, mention it to the Reeve, and do not mention it to the Edger, who will mention it to you at length.`,
        `On the dead. Say the name. Say it again the next morning. Do not say they were lucky to go quickly, because there was no luck in it, and the family knows that better than you do.

Bring a cake. Sit for a while. Leave before the tea goes cold, so that the family does not have to say goodbye twice.`,
      ],
    },

    // ---- The Rumbling: memory, notices, letters ----
    'lc-what-to-do-when-the-ground-hums': {
      id: 'lc-what-to-do-when-the-ground-hums', title: 'What To Do When the Ground Hums', author: 'Office of the Reeve of Thatchford', kind: 'note', common: true,
      pages: [
        `1. Stop what you are doing. Do not try to finish the cup.
2. Put the good cups on the low shelf. Put the heavy ones on the floor.
3. Sit down, with your back to a wall, and keep your hands in your lap.
Children may hold a cup, but only a cup that has been checked for hairlines.`,
        `4. Do not go looking for the sound. It is not in the cellar, it is not in the brook, and it is not in your neighbour's kitchen, whatever your neighbour says.
5. If iron hums, tell the Delver on the nearest shift. Do not touch the iron. The Delvers have been told this and are very tired of being told.`,
        `6. When it stops, count to a hundred and count again. If it has not come back, the Reeve advises tea. If it has, the Reeve advises you to go to the Keep and say so. Do not write to the Crown about it. The Crown has asked us to stop.

This notice is to be read aloud at every harvest, and to anyone new in the parish. It was last revised after the First Rumble, and nobody has yet found a reason to revise it again.`,
      ],
    },
    'lc-names-on-the-shorn-stone': {
      id: 'lc-names-on-the-shorn-stone', title: 'The Names on the Shorn Stone', kind: 'plaque', common: true,
      pages: [
        `Here are the names of the escort of His Majesty King Gnorbert Clayfoot, who rode back from the Verge by the Shorn road in the thirtieth year before this stone was raised, and who did not come home to Birdbath Keep.

Dock Halfpenny, captain of the escort. Fennel Tallow. Comfrey Pennyweight. Hazel Ridgeback. Mattock the Younger.`,
        `Thistle Nailer. Yarrow Pottage. Moss Twine. Bramble Hobnail. Clay Kettleby. Teasel Wick. Sedum Frame.

They rode for the King. They carried his cart. They did not come back down the road, and nobody in the Keep has said how it happened.

The stone was cut by a kilnwright from the Rockery, who asked for no payment and would not say why he did not ask for one.`,
        `The escort's squire came back. His name is not on this stone. He is not dead, and he has not come to the Keep to say why he was spared. Leave the space below the last name blank. The Keep says this is for the next names. Nobody has asked the Keep what it means.`,
      ],
    },
    'lc-letter-from-cloverfield': {
      id: 'lc-letter-from-cloverfield', title: 'A Letter From Cloverfield, Copied and Passed Round', author: 'Sainfoin Lowmoor', kind: 'letter', common: true,
      pages: [
        `Dear Dock,

The cups came down on the second night, all at once, like a shelf deciding something. I have kept the good ones on the low shelf since, and so far we have lost only a saucer. The children think it is the best game they have ever had.

You will ask what it sounded like. It sounded like the largest throat in the world clearing itself, once, and then not wanting to say the thing it had meant to say.`,
        `The men from the Rockery say the iron in the cart-hoops was humming all night. They put their ears to it, and then they went very quiet and would not say what they heard. I have not asked them again. I do not think I want the answer.

I know what the Crown will call it. I know what the Even Cut will call it. I am calling it nothing for now, so I can sleep.`,
        `Keep your door shut and your cups low. Come to Cloverfield for the harvest, if the road is clear. Bring the good glaze. Tell Father the bean is up.

With love, and with a glue-pot in reach,
Sainfoin

P.S. The good cups are the ones on the top shelf now. Do not ask me why I moved them. I moved them because the low shelf is where I keep the cups I am afraid of.`,
      ],
    },
    'lc-complaint-to-the-reeve': {
      id: 'lc-complaint-to-the-reeve', title: 'A Complaint to the Reeve, Concerning the Dark House Door', author: 'Clayton Pottage, Ratepayer of Sodbury Road', kind: 'letter', common: true,
      pages: [
        `To the Reeve of Thatchford, from a ratepayer who has paid his tithe on time for thirty-one years.

The door of the Dark House has split again. The crack runs from the latch to the lintel, and at night a cold breath comes through it that smells of old Black Dew and the inside of a boot. My children cannot sleep. My cups walk off the shelf.`,
        `I have been to the Edger. He said the door is holy and must be left as it is. I have been to the Chancellor's clerk. He said the door is a fairy tale and must not be discussed. I am not asking for either. I am asking that someone who is neither a saint nor a fairy tale look at the planks, and say whether they will hold.`,
        `I enclose a sketch of the crack, drawn with a rule. I also enclose two of my son's tall-eyes, which he has been told are the best in Sodbury, and which he would like returned if the door is found to be mended. I remain, sir, your obedient ratepayer, and not a Wildling, whatever the Reeve's cousin says.`,
      ],
    },
    'lc-duty-note-dark-house-door': {
      id: 'lc-duty-note-dark-house-door', title: 'Duty Note for the Dark House Door', author: 'Verge Watch, Sergeant Weeder\'s section', kind: 'note', common: true,
      pages: [
        `Night watch, Dark House door. Two gnomes on the step at all hours, one facing the road and one facing the door. Change at the second bell. Do not sit on the step after the bell; the step is cold and the wood is wet.

Do not open the door. Not for the Edger. Not for the Reeve. Not for a cousin who says he heard his brother in there. The bar is set, and the bar is to stay set.`,
        `Do not stare through the crack. You will see nothing, and then you will go on seeing it when you close your eyes. Put a cloth over the crack and tie it. If the cloth is pulled off in the night, do not go to see who did it. Call the Sergeant and count the bells.

Tea is brought on Sundays by the Edger's boys. It is not to be drunk on the step.`,
        `Report any change in the sound: a tick, a hum, a long slow drawing-in, like a breath held by something very large. Write it down exactly. Do not write what you think it means. Sergeant's orders, and I agree with them.

The relief gnomes are to be told of any change in the watch before they take the step, not after. A gnome who finds the step already warm has been sitting on it too long.`,
      ],
    },
  },
  objects: {},
};
