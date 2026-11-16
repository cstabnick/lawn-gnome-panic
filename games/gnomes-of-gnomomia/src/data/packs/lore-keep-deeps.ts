// Lore pack: Birdbath Keep and the Drainpipe Deeps (ids start with lkd-).
import type { ContentPack } from '../../config';

export const PACK: ContentPack = {
  id: 'lore-keep-deeps',
  books: {
    // ---- The Royal Archive (keep house royal-archive): the Charters layer, three accounts of the Stopping.
    'lkd-stopping-crown': {
      id: 'lkd-stopping-crown', kind: 'book', title: 'The Stopping of the Blade, as the Crown Keeps It',
      author: 'Chronicler Sorrel Spade',
      pages: [
        'In the year the Blade came out of the Shed, King Gnorwin Clayfoot rode to the Rockery with the Kiln-born at his back. He carried the Stopping Stone up from the Kiln in his own two hands, for no other gnome was strong enough to lift it.\n\nWhen the Blade came rolling through the Rockery, it struck the rocks and broke a piece from its own edge. The King did not flinch. He stepped in front of the great iron mouth and threw the Stone into it. The Blade jammed and fell silent.',
        'The Kiln-born rolled the Blade back into the Shed and barred the door. King Gnorwin raised the Keep on the tallest stone in Fescue, so that his heirs could watch the door for ever.\n\nThe Crown holds that this is the whole truth, and that the Crown\'s duty is to keep the watch. Any gnome who says the Blade was not stopped by the King\'s own hand is a liar, or a Wildling, which the Crown considers much the same.',
      ],
    },
    'lkd-stopping-pipewrights': {
      id: 'lkd-stopping-pipewrights', kind: 'book', title: 'The Stopping, as the Pipewrights Hold It',
      author: 'Oswin Gasket, Pipewright',
      pages: [
        'Everyone in the Crown\'s books says the King threw a stone. Our guild says no stone was ever thrown at anything. The Blade was stopped by water.\n\nThere was an old buried pipe under the Rockery, older than anything the Guild ever made, and it was full and cold. The Blade came down on it, drank the lot, and choked. Stones do not stop machines. Water does. Anyone who has ever cleared a blocked drain knows this.',
        'The Guild\'s own ledgers show a pipe was opened to the Rockery in the summer of the Stopping. The ledgers also show that a great deal of the Guild\'s work that year went unpaid. The Crown\'s books do not mention the pipe at all.\n\nWe are not saying the King did nothing. We are saying that water works, and that nobody has ever thrown a stone at a drain and kept the drain.',
      ],
    },
    'lkd-stopping-wildling': {
      id: 'lkd-stopping-wildling', kind: 'book', title: 'The Stopping, Copied Out Again',
      author: 'Clover Hushwell, copyist',
      pages: [
        'This is a copy of a copy of the Crown\'s book. I have kept the Crown\'s words where I could. Where the copy is wrong I have written the right word beside it in brackets, which the Crown would not like.\n\nThe Crown\'s book says the King stopped the Blade. The older copy, which I found under a loose board in the Hedgewood, says something else. It says the Blade was let rest.',
        'The older copy says the Blade lay still in the Rockery because dandelions came up round it that spring, and nobody cut them. It says a gnome sat beside the iron mouth for three days and told it stories about the Hedgewood, and that it went quiet after that. It says nobody threw anything at all.\n\n(Margin: I do not know which account is true. I only know which one the Crown did not keep.)',
      ],
    },
    'lkd-clayfoot-kings': {
      id: 'lkd-clayfoot-kings', kind: 'scroll', title: 'The Kings of the Clayfoot Line',
      pages: [
        '1. Gnorwin Clayfoot, the Kiln-born, who raised the Keep on the tallest stone.\n2. Hollis Clayfoot, his son. Under the name someone has written, in a smaller hand, "he was fond of hats".\n3. Bramble Clayfoot, a builder, who cut the great stair from the Basin to the Pedestal.\n4. Tarragon Clayfoot, who lent the Rockery to the Delvers for one winter and asked for it back in spring.\n5. Sedge Clayfoot, who never sat on the throne because he was afraid of the draught.',
        '6 to 15 are missing. The fold in the paper has eaten them. Beside the gap a later archivist has written: "Ask the mice."\n\n16. Bartholomew III, who signed the three Charters, set the Pipewrights\' Guild to work in the Dry, and exiled the Dandelion gnomes.\n17. Gnorbert, who was shattered past mending on the Shorn.\n18. Marigold, who is queen now. Her line is in a different ink, and the ink is still wet.',
      ],
    },
    'lkd-archivist-note': {
      id: 'lkd-archivist-note', kind: 'note', title: 'A note pinned inside the catalogue cover',
      author: 'Basil Inkcap, Archivist',
      pages: [
        'To whoever reshelves this next.\n\nThe catalogue on the lower lectern is missing entries nineteen to twenty-three. The mice had them, or the damp did, or a previous archivist who did not like the look of them. Please do not write them out again from memory. I have tried. My memory is not in the Crown\'s pay, and it says three different things.',
        'The Chancellor has asked, twice, that the Archive keep its opinions at the back. I have put them at the back. They are all still there, neatly filed, side by side.\n\nThe letters in the tray by the door are mine to answer. I know. I know. I will get to them when I have finished being sensible about the accounts of the Stopping, which I have now been sensible about for thirty years.',
      ],
    },
    // ---- The Pipewrights' Guildhall (keep house pipewrights-guild).
    'lkd-valve-manual': {
      id: 'lkd-valve-manual', kind: 'book', title: 'A Turner\'s Manual for the Great Valve',
      author: 'Yarrow Gasket, Journeyman',
      pages: [
        'Read this before you touch the Valve. Then read it again. The Valve has three wheels, and each one turns the way of the bright stripe. Turn a wheel the wrong way and the Deeps will do as the Deeps are told, which is not always what you meant.\n\nFirst, shut the sluice at the top of the stair. Never turn a wheel against water. Listen for the knock before you turn any further. If the knock stops, stop too.',
        'Second, the seals. Seals wear. Check every seal in each dry season and renew it with a Shard iron washer, sent up from the Rockery. A clay seal will hold for a good while, and then it will not, and the water does not give a warning.\n\nThird, when the Valve is open, always leave a Pipewright at the top to watch the gauge. A gauge can be read by a gnome of any height. It is no use to a gnome who has gone down to look.',
      ],
    },
    'lkd-drowned-roll': {
      id: 'lkd-drowned-roll', kind: 'scroll', title: 'The Roll of the Drowned, the Backflow',
      pages: [
        'Read aloud at the Valve on the first day of every Dry Season by the Master Pipewright, in the order given here.\n\nOswin Gasket, Journeyman. Hazel Reedhook, Journeyman. Comfrey Pennywick, Gauge-reader, who was counting the gauge and was not told to stop. Wilder Sprig, apprentice, aged twelve, who went down for the spare washers. Mabel Coil. Dunstan Hob. Pell Marrowby, who sang the whole way down.',
        'Forty Pipewrights went down that night. Twelve names are read here. The rest are painted on the wall of this hall, in the order they were found, which was not the order they were lost.\n\nMaster Gromwell is read last. He did not go down with the others. He went to the Valve by himself to close it by hand, and he did not come up. The Guild has never agreed on whether that is the same thing as being lost.',
      ],
    },
    // ---- The Robin-Master's Loft (keep house robin-master-loft).
    'lkd-robin-notes': {
      id: 'lkd-robin-notes', kind: 'book', title: 'Notes on Keeping Robins, for a Queen\'s Use',
      author: 'Wren Tumble, Robin-Master',
      pages: [
        'Your Majesty asked how a robin is kept. A robin is not a horse. A robin is a robin, and it comes when it likes, which is mostly when the Basin has worms in it and the wind is from the north.\n\nFeed them twice a day on crumbs of the Ward bread. Never feed them the hard loaves from the bakery on the Pedestal steps. They were never made for birds, and a robin will not forgive you for them.',
        'The robins know the Basin better than any gnome. They land on its rim at dawn and look down at the Keep as if checking the stonework. Some of them have never been further than the foot of the Pedestal steps. I have asked them where they would go, and they have not said.\n\nIf Your Majesty wishes to see the Verge, the robins will carry you there. I have said so before. I will say it again when you are ready to hear it.',
      ],
    },
    // ---- Stitchwort and Daughter, Court Tailors (keep house court-tailor).
    'lkd-love-letter': {
      id: 'lkd-love-letter', kind: 'letter', title: 'A Letter to Sorrel, Not Yet Sent',
      author: 'Clover Stitchwort',
      pages: [
        'Sorrel,\n\nI have finished the blue waistcoat for the Chancellor\'s clerk. It is the only thing I have made this month that has not come back with a complaint about the seams. He stood on the stool and said it was a waistcoat fit for a turnip. I did not tell him that turnips do not wear waistcoats. I thought it was a very grown-up thing to leave unsaid.',
        'I have not sent the last few letters, because I could not work out how to say the important part without a great deal of stitching round it. So I will say it plainly. I miss the smell of the Hedgewood at the end of a working day. I miss the way you hum when you are cutting. I miss you.\n\nI will come out to the Ward on the next dry day. If you are not at the stall, I will sit by the robin wall and wait. You always said I was too stubborn to give up. Stubborn gnomes keep their promises.',
      ],
    },
    // ---- The Pump Keepers' Shack (deeps house pump-keepers-shack).
    'lkd-pump-diary': {
      id: 'lkd-pump-diary', kind: 'journal', title: 'Work Diary of Teasel Sluice, Pump Keeper, the Backflow',
      author: 'Teasel Sluice',
      pages: [
        'Day 1 of the Backflow. Watch went down at six. The gauge at the Great Valve reads high. Master Gromwell says it is only the cold. I have counted the washers: forty-one in the bucket, two cracked, one with a thumbprint in the clay. Sent the apprentice up to the Guild for more.\n\nDay 3. Pumps running steady. The Shorn is drying out on the far side, which is good. The crowd at the Ward complains about the taste of the water. There is nothing to be done about the taste.',
        'Day 4. The gauge reads higher. The Master has gone down to the Valve himself. He told me to keep the pumps running, and to shut the sluice if the knock stops. The knock has stopped.\n\nDay 4, later. The sluice is shut. I am writing this down because Yarrow asked me to keep a true book, and a true book does not leave out the bad days. Master Gromwell has not come up.',
      ],
    },
    'lkd-valve-settings': {
      id: 'lkd-valve-settings', kind: 'note', title: 'Valve Settings, the Cistern and the Backflow',
      pages: [
        'Wheel one, the Cistern feed: a quarter turn for the pool, half for the barracks, never full. Wheel two, the Backflow drain: shut in the dry, half open in the wet. Wheel three, the Great Valve: do not touch without a Master.\n\nSeals: clay, as supplied by the office. Renew each dry season. A clay seal may last a year. It may not.',
        'Pressure at the Gutters: low, as always. Pressure at the Shorn: high, as ordered. Pressure at the Ward fountains: whatever the Chancellor\'s clerk says it should be on the day.\n\nDo not argue with the clerk. Argue with the water. The water is more reasonable.',
      ],
    },
    // ---- The Valve-Keepers' Hut (deeps house valve-keepers-hut).
    'lkd-spare-ledger': {
      id: 'lkd-spare-ledger', kind: 'journal', title: 'Spare Washers, Counted',
      pages: [
        'Spare washers, Shard iron. Counted at the start of each dry. Fifty in the box at the last count. Thirty-eight after the Backflow, nine of them cracked. Replaced: none. Ordered: forty, from the Rockery, to come by cart. The cart did not come.\n\nCount, next dry: thirty-eight. Ordered again. The cart came, but carried a sack of clay washers instead, with a note saying the Rockery was short this season. The clay ones are not used. They are kept at the back of the box, marked CLAY, for the day somebody needs them.',
      ],
    },
    // ---- Common readables for the Keep (shelves in its houses).
    'lkd-keep-songbook': {
      id: 'lkd-keep-songbook', kind: 'book', title: 'The Long Lawn and Other Songs', common: true, where: ['keep'],
      pages: [
        'First the Lamp, then the Rain, then the Hand in the soil.\nThe Hand made the Kiln and the Kiln made the clay,\nand the clay stood up and was gnome.\n\nSing it slow for the Tall Ones, who sowed us, who sowed us,\nand sing it loud for the lawn, which is ours to keep.',
        'Gnorwin came up from the Kiln with a stone in his hand,\nand the Blade came rolling through the Rockery,\nand he threw his stone and the Blade lay still.\n\n(Mossbottom sings that it was Moss who threw it. Thatchford sings that it was a Thatchford gnome named Pell. The Pedestal sings the first verse only, and then hums.)',
        'Verse seven of the old version is lost. Sing it anyway. The Tall Ones do not mind a wrong word, we are told, so long as the tune is kind.',
      ],
    },
    'lkd-primer': {
      id: 'lkd-primer', kind: 'book', title: 'A Primer for Young Gnomes', author: 'The Kilnkeepers of the Keep school', common: true, where: ['keep'],
      pages: [
        'Lesson one: you are fired clay. You are glazed. You are proud of your glaze.\n\nLesson two: you will crack. Everyone does. A small crack is a matter for glue and a good Bloom-healer. A large crack is a matter for a Glaze Shrine, and there is one in the Pedestal Ward for those who forget to look where they are walking.',
        'Lesson three: shattered is death, and it is not a thing to joke about at supper.\n\nLesson four: you were not born. You were made, by a kilnwright in a small town kiln, and that kiln is not the old Kiln. Be a little kinder to yourself for that.\n\nLesson five: keep the lawn. Nobody has ever agreed what that means, so start with the weeds in your own plot and work the rest out in your own time.',
      ],
    },
    'lkd-guard-duty': {
      id: 'lkd-guard-duty', kind: 'note', title: 'Duty Note: the Deeps Stairs', common: true, where: ['keep'],
      pages: [
        'Guard the stairs from dusk to the second bell. Nobody goes down without a Pipewright\'s pass. The pass is a brass tag with a wheel stamped on it, and you may check it by the light of the lamp.\n\nIf you hear knocking from below, it is the pipes. If the knocking stops and starts in time with your own heartbeat, fetch the Sergeant. Do not go down to check.',
        'The Duty Sergeant is Crumble Harrow. He sleeps at the post. You are not to tell him I said so. Bring him tea. He is kinder with tea.\n\nReport any cold draught coming up the stairs. Report any water that runs uphill.',
      ],
    },
    // ---- Common readables for the Deeps.
    'lkd-gutter-warning': {
      id: 'lkd-gutter-warning', kind: 'note', title: 'A Warning for the Gutters', common: true, where: ['deeps'],
      pages: [
        'To Pipewrights going down into the Gutters, and to anyone else who is going anyway.\n\nThe ankle water is deeper than it looks, and cold enough to stiffen the joints. Stay on the dry ledge where you can. The leeches prefer the middle. Lately, so does Clogmaw, who has been seen rolling along the drain in the evenings like a bad cabbage.',
        'Do not try to clear the grating on the north wall. Do not take anything from the blocked pipe at the bottom of the ledge, however shiny. Shiny things in the Gutters belong to somebody, and that somebody is usually a rat.\n\nSigned, the Gutter Wardens, in the year the last wick ran out.',
      ],
    },
    'lkd-cistern-almanac': {
      id: 'lkd-cistern-almanac', kind: 'book', title: 'The Cistern Almanac, Wet and Dry', author: 'A Fieldwarden of Cloverfield, unpaid', common: true, where: ['deeps'],
      pages: [
        'Sow when the drip counts nine in the cistern and the moles are quiet. Do not sow when the drip counts ten. The moles have started again, and the cistern is only a day from the top.\n\nThe Cistern drips slow in the first moon of Dry and quick in the Wet. The Pipewrights say this is the pipes. The old women say it is the lawn breathing. Both are right, and neither of them will lend you a bucket.',
        'Rule of the dry: take a second bucket to the Cistern in case the first is stolen. Rule of the wet: keep the second bucket for the first bucket\'s grandchildren.\n\nIf the drip stops entirely, this almanac has no advice. Go up to the Keep and tell somebody. Do not go back down to see for yourself.',
      ],
    },
    // ---- Hand-placed readables.
    'lkd-plaque-gnorwin': {
      id: 'lkd-plaque-gnorwin', kind: 'plaque', title: 'Gnorwin Raised This Keep', author: 'Erected by the Crown',
      pages: [
        'Here Gnorwin Clayfoot, first king of Fescue, raised this watch on the tallest stone in the lawn, so that his heirs might watch the Shed for ever. He came up from the Kiln with the stone in his hands. He asked for nothing for it but a good view.',
        'Keep the watch. Keep the lawn. Keep the Blade in the Shed, and keep your feet off the Basin steps.',
      ],
    },
    'lkd-stairs-note': {
      id: 'lkd-stairs-note', kind: 'note', title: 'A Note for Whoever Goes Down',
      pages: [
        'If you are going down to the Deeps, take a lamp, a length of rope and a friend. Tie the rope to the post and not to the stair rail. The rail came off in the last wet, and nobody has had the time.\n\nThe Pipewrights will tell you the Deeps are safe for anyone with a pass. The pass is only a tag. The Deeps do not read tags.',
        'If you come back up with wet boots and nothing else, that is still a good day. Hang the boots in the Ward and not in the Guildhall, which has enough damp already.\n\n- a Guard of the Stair',
      ],
    },
    'lkd-gutter-scroll': {
      id: 'lkd-gutter-scroll', kind: 'scroll', title: 'A Scroll Tucked in the Gutters',
      pages: [
        'Whoever you are, you have come a long way down into the wet. Good. The Gutters are for going through, not for stopping in.',
        'I came down in the Dry to fetch spare washers for the seals, and I have not been up since. If you find this, tell Ida Gromwell that I kept the count. Thirty-one of the forty. The rest I could not find in the dark.',
      ],
    },
  },
  objects: {
    'lkd-pedestal-plaque': {
      id: 'lkd-pedestal-plaque', zone: 'keep', name: 'Plaque on the Pedestal', x: -8, z: -40, model: 'plaque',
      book: 'lkd-plaque-gnorwin', verb: 'Read',
      examine: 'A tin plaque set into the Pedestal stone. Someone has polished the words.',
    },
    'lkd-stairs-post': {
      id: 'lkd-stairs-post', zone: 'keep', name: 'Notice Post by the Deeps Stairs', x: -25, z: 40, model: 'post',
      book: 'lkd-stairs-note', verb: 'Read',
      examine: 'A post with a notice pinned to it, weathered to the grain.',
    },
    'lkd-gutter-scroll-cache': {
      id: 'lkd-gutter-scroll-cache', zone: 'deeps', name: 'Scroll in the Gutter', x: -12, z: 58, model: 'scroll',
      book: 'lkd-gutter-scroll', verb: 'Read',
      examine: 'A roll of wet paper, tucked behind a pipe joint.',
    },
  },
};
