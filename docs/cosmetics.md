# Cosmetics: what each achievement unlocks

Every achievement unlocks one cosmetic: a piece of gear on the gnome (`reward`: `head`, `back`, `neck` or `hand`) or an
animated emote (`emote`). The catalog is `packages/achievements/src/catalog.ts`; the table below lists it. The gear is
shared by every game, and it shows on the gnome in the Gnome Creator and online.

## Rules

`npm test -w packages/achievements` enforces these:

1. **One achievement, one cosmetic.** No gear prefab and no emote is granted by two achievements. An achievement that
   shares an item with another makes the hard one worth less, so every achievement has its own.
2. **RARE (`reward.exclusive: true`).** The hardest achievements get a RARE item. It is locked behind that achievement
   alone, and the Gnome Creator and the unlock toast mark it RARE. Set the flag on the hard ones: long goals, perfect
   runs, the finals and the 50-kill and 6-model achievements.
3. **The right slot.** A gear reward's prefab must carry the matching use (`wear-head`, `wear-back`, `wear-neck`, or
   `hold` for the hand).

To add a cosmetic to a new achievement: pick a prefab nobody else uses (browse `npm run dev -w games/prefab-gallery`),
or add one to `packages/prefabs/src/catalog/` (see `packages/prefabs/README.md`). Then run the achievements test.

## Counts

108 achievements: 95 gear (head 35, neck 24, back 13, hand 23) and 13 emotes. 16 are RARE. Every gear and emote reward is
unique.

## Make your gnome stand out

The Gnome Creator shows this guidance under the name field (`games/gnome-creator/src/editor.ts`):

- Pick a hat colour nobody else picks. The hat is the first thing a crowd sees.
- Clash on purpose: a bright coat over pants from the other end of the palette looks like nobody else's.
- Features do the rest: a beard, pigtails, freckles, glasses or a dress. Two gnomes in the same colours look nothing alike with different features.
- Gear shows what you have done, so pick the pieces that match your own story, not the first ones you unlock.
- RARE gear comes only from the hardest achievements. Earn it, then show it off.

## The inventory

The table lists every achievement, its goal, what it unlocks and whether that item is RARE.

| Achievement (id) | Game | Goal | Reward | Kind | RARE |
|---|---|---|---|---|---|
| **Nice** (`golf-nice`) | gnome-golf | Par on a hole. | Golf Visor (`golf-visor`) | Gear: head |  |
| **How?!?!?!!** (`golf-how`) | gnome-golf | Par or better through 9 holes. | Golden Putter (`golden-putter`) | Gear: hand | RARE |
| **Ooops** (`golf-ooops`) | gnome-golf | Hit a ball into the water. | Bucket Helm (`bucket-helm`) | Gear: head |  |
| **Off the beaten path** (`golf-off-beaten-path`) | gnome-golf | Finish a hole without ever landing on the fairway, hitting from the rough at least once. | Rough Satchel (`rough-satchel`) | Gear: back |  |
| **Crisp In** (`golf-crisp-in`) | gnome-golf | Chip in the ball from off the green. | Caddie Bag (`caddie-bag`) | Gear: back |  |
| **Ace!** (`golf-ace`) | gnome-golf | Score a hole-in-one. | Ace Medallion (`ace-medallion`) | Gear: neck | RARE |
| **Birdie Hunter** (`golf-birdie-hunter`) | gnome-golf | Score 3 birdies or better. (3) | Titanium Driver (`titanium-driver`) | Gear: hand | RARE |
| **Sand Blaster** (`golf-bunker-escape`) | gnome-golf | Blast out of a sand bunker onto the fairway or green 3 times. (3) | Sun Bucket Hat (`golf-bucket-hat`) | Gear: head |  |
| **Chain Gang** (`golf-disc-hole`) | gnome-golf | Sink a throw in Gnome Disc mode. | Disco Disc Pack (`disco-pack`) | Gear: back |  |
| **Nineteenth Hole** (`golf-nineteenth-hole`) | gnome-golf | Drink 3 cans of golf water in a single round. | Caddie Towel (`caddie-towel`) | Gear: neck |  |
| **All gnomes down** (`bowling-all-gnomes-down`) | gnome-bowling | Bowl a strike. | Pin Crown (`bowling-pin-hat`) | Gear: head |  |
| **Certified Pilgrim** (`bowling-certified-pilgrim`) | gnome-bowling | Bowl a turkey (3 strikes in a row). | Pilgrim Hat (`pilgrim-hat`) | Gear: head | RARE |
| **7-10 inconvenience store** (`bowling-7-10-split`) | gnome-bowling | Leave a 7-10 split. | House Ball (`bowling-ball`) | Gear: hand |  |
| **Harvest Season** (`front-harvest-season`) | gnome-front | Mow down 3 gnomes in the combine. (3) | War Hoe (`war-hoe`) | Gear: hand |  |
| **Gnome Sweet Gnome** (`gsg-mossy-lane`) | gnome-sweet-gnome | Make over every room on Mossy Lane. | Mushroom Hood (`mushroom-hood`) | Gear: head |  |
| **Up a Tree** (`gsg-oakwood`) | gnome-sweet-gnome | Make over the Oakwood Treehouse. | Acorn Cap (`acorn-cap`) | Gear: head |  |
| **Beach Gnome** (`gsg-shell-cove`) | gnome-sweet-gnome | Make over Shell Cove. | Bead Necklace (`bead-necklace`) | Gear: neck |  |
| **Rode the Great Wave** (`gsg-great-wave`) | gnome-sweet-gnome | Beat level 60. | Wool Scarf (`wool-scarf`) | Gear: neck | RARE |
| **New at the Club** (`club-welcome`) | club-gnome | Walk into Club Gnome for the first time. | Name-Tag (`name-tag`) | Gear: neck |  |
| **Club Explorer** (`club-explorer`) | club-gnome | Visit all four places: Town Square, the Gnomecino, the Arcade and Links Park. (4) | Explorer's Pack (`explorer-pack`) | Gear: back |  |
| **High Roller** (`club-high-roller`) | club-gnome | Sit at the High Rollers table in the Gnomecino. | Dealer Visor (`dealer-visor`) | Gear: head |  |
| **Regular** (`club-regular`) | club-gnome | Open 10 games from Club Gnome. (10) | Stout Tankard (`stout-tankard`) | Gear: hand |  |
| **Chatterbox** (`club-chatterbox`) | club-gnome | Send 25 chat lines in Club Gnome. (25) | Tin-Can Phone (`tin-can-phone`) | Gear: neck |  |
| **Crowd Pleaser** (`club-crowd`) | club-gnome | Be in one place with 5 other gnomes. | Pointy Hat (`pointy-hat`) | Gear: head |  |
| **Take a Seat** (`club-sitter`) | club-gnome | Sit down on a bench, a bar stool or a picnic table in Club Gnome. | Golden Stopping-Stone Charm (`stopping-stone-charm`) | Gear: neck |  |
| **Garden Air** (`para-escape`) | paragnormal | Escape through the Garden Pet-Door. | Tall-eye Charm (`tall-eye-charm`) | Gear: neck |  |
| **Lights Out** (`para-lights-out`) | paragnormal | Have the lantern gutter out three times in one house. | Candle (`candle`) | Gear: hand |  |
| **Shh** (`para-shh`) | paragnormal | Stay hidden while The Hush brushes past you. | Tinfoil Conspiracy Brim (`tinfoil-brim`) | Gear: head |  |
| **Three Bells** (`para-bells`) | paragnormal | Ring all three Soul-Bells in one house. | Leaf Cloak (`leaf-cloak`) | Gear: back |  |
| **First Mowing Day** (`inc-first-mulch`) | incregnomtal | Survive your first visit from Old Saturday and rake up some Mulch. | Hedge Shears (`hedge-shears`) | Gear: hand |  |
| **Dandelion Blower** (`inc-wish-maker`) | incregnomtal | Pull 20 dandelions off the lawn. | Thimble Helm (`thimble-helm`) | Gear: head |  |
| **Good Boy, Biscuit** (`inc-good-boy`) | incregnomtal | Befriend the Great Biscuit with a game of fetch. | Mini Boot Hat (`mini-boot-hat`) | Gear: head |  |
| **Dry Summer Survivor** (`inc-dry-survivor`) | incregnomtal | Make it through Week 4 when the Tall Ones\' tap slows to a trickle. | Watering Can (`watering-can`) | Gear: hand |  |
| **Friend of the Yard** (`inc-all-critters`) | incregnomtal | Befriend 6 different garden critters. | Feather Garland (`feather-garland`) | Gear: neck |  |
| **Yard of the Year** (`inc-yard-of-the-year`) | incregnomtal | Tame Old Saturday and ride him across the lawn. | Hand Rake (`hand-rake`) | Gear: hand | RARE |
| **Against the Clock** (`prix-trial-first`) | lawn-prix | Finish a Time Trial and leave a ghost on the course. | Keep Helm (`keep-helm`) | Gear: head |  |
| **Ghost Buster** (`prix-ghost-buster`) | lawn-prix | Beat your own ghost in a Time Trial. | Reed Charm (`reed-charm`) | Gear: neck |  |
| **Bop to Victory** (`front-battle-bop`) | gnome-front | Win a Conquest match. | Battle Bop (`battle-bop`) | Emote |  |
| **Garden Guard** (`front-salute`) | gnome-front | Take down 25 gnomes. (25) | Salute (`salute`) | Emote |  |
| **Chequered Floss** (`prix-floss`) | lawn-prix | Win a race against the CPUs. | Floss (`floss`) | Emote |  |
| **Polite Applause** (`golf-clap`) | gnome-golf | Play all 9 holes. | Golf Clap (`golf-clap`) | Emote |  |
| **Picked Up** (`bowling-fist-pump`) | gnome-bowling | Bowl a spare. | Fist Pump (`fist-pump`) | Emote |  |
| **Gutter Gnome** (`bowling-facepalm`) | gnome-bowling | Roll a ball into the gutter. | Facepalm (`facepalm`) | Emote |  |
| **Dance Floor** (`club-dance-floor`) | club-gnome | Play 20 animated emotes in Club Gnome. (20) | Toadstool Jig (`toadstool-jig`) | Emote |  |
| **Pinwheel** (`gsg-pinwheel`) | gnome-sweet-gnome | Beat level 10. | Pinwheel Spin (`pinwheel-spin`) | Emote |  |
| **Still Shaking** (`para-shiver`) | paragnormal | Escape 3 houses. (3) | Spooked Shiver (`spooked-shiver`) | Emote |  |
| **Last but Loud** (`prix-donut`) | lawn-prix | Finish a race in last place. | The Worm (`worm`) | Emote |  |
| **Borrowed, Technically** (`gta-borrowed`) | gnome-theft-auto | Steal a mower with its driver still on it. | Squirt Pistol (`squirt-pistol`) | Gear: hand |  |
| **Clay Pigeon** (`gta-rainmaker`) | gnome-theft-auto | Crack 50 gnomes apart with gunfire. (50) | Rain Hat (`rain-hat`) | Gear: head | RARE |
| **Three Hats High** (`gta-three-hats`) | gnome-theft-auto | Reach Hat Watch level 3. | Water Tank Pack (`water-tank-pack`) | Gear: back | RARE |
| **Off the Pad** (`gta-whirligig`) | gnome-theft-auto | Steal the Whirligig from Fort Sandpit. | Flight Goggles (`flight-goggles`) | Gear: head |  |
| **Every Model in the Shed** (`gta-collector`) | gnome-theft-auto | Drive every vehicle model, the Crop Duster included. (6) | Pump Soaker (`super-soaker`) | Gear: hand | RARE |
| **Glued Back Together** (`gta-washed-out`) | gnome-theft-auto | Get cracked apart by the Hat Watch. | Stitched Collar (`stitched-collar`) | Gear: neck |  |
| **Wheels Up** (`gta-pilot`) | gnome-theft-auto | Take off in the Crop Duster at the Dust Flats airfield. | Aviator Cap (`aviator-cap`) | Gear: head |  |
| **Barbecue** (`gta-kaboom`) | gnome-theft-auto | Blow up a vehicle with gunfire. | Singed Party Hat (`party-hat`) | Gear: head |  |
| **Made Gnome** (`gta-first-contract`) | gnome-theft-auto | Finish your first contract for Don Compost. | Wiseguy Fedora (`wiseguy-fedora`) | Gear: head |  |
| **Soft Landing** (`gta-skydiver`) | gnome-theft-auto | Bail out of a plane in the air and land under your parachute. | Parachute Flip (`parachute-flip`) | Emote |  |
| **Grand Tour** (`gta-explorer`) | gnome-theft-auto | Visit every biome: Turfton, the Dust Flats, Mossy Wood, Frostbite Fells and Cloverfield Farms. (5) | Compass Point (`compass-point`) | Emote |  |
| **Crash Test Gnome** (`gta-ragdoll`) | gnome-theft-auto | Send 10 gnomes tumbling with a speeding mower. (10) | Cheer (`cheer`) | Emote |  |
| **Sideways Gnome** (`gta-drifter`) | gnome-theft-auto | Hold a slide for a full second in any ground vehicle: tail out, nose angled, still going. | Tyre-Tread Collar (`tire-tread-collar`) | Gear: neck |  |
| **Drive-Time Regular** (`gta-drive-time`) | gnome-theft-auto | In one drive, hear a song on all three Turfton FM stations. | Pocket Transistor (`pocket-transistor`) | Gear: hand |  |
| **Heard on Air** (`gta-on-air`) | gnome-theft-auto | Hear a news bulletin about something you did, while the radio is on. | Press Pass Cap (`press-pass-cap`) | Gear: head |  |
| **Fresh Out the Kiln** (`gta-fresh-kiln`) | gnome-theft-auto | Complete the Prologue and reach Side-Valve Salvage. | Side-Valve Tool Pack (`salvage-wrench-pack`) | Gear: back |  |
| **Boot-Legger** (`gta-boot-legger`) | gnome-theft-auto | Hijack Gnorwin's Boot Parade Float and crash the HOA Tribunal. | Founder's Parade Boot Cap (`parade-boot-cap`) | Gear: head |  |
| **Turf-Code Violator** (`gta-turf-violator`) | gnome-theft-auto | Trigger 4-Hat (THE HOA) heat and smash a Code-Enforcement Van. | Broken Brass Calipers (`brass-calipers`) | Gear: hand |  |
| **Mid-Air Mower-Jack** (`gta-mid-air-jack`) | gnome-theft-auto | Bail out of a Crop Duster over Fort Sandpit and lift the Whirligig. | Sandpit Pilot Helmet (`sandpit-flight-helm`) | Gear: head |  |
| **Snail-Mail Saboteur** (`gta-snail-saboteur`) | gnome-theft-auto | Rig the underground alley snail races for Shelldon. | Racing Snail Cap (`snail-shell-cap`) | Gear: head |  |
| **Dry as a Bone** (`gta-dry-bone`) | gnome-theft-auto | Deliver Big Lou's VIP bowler without chipping the ride. | Gnomecino VIP Towel (`vip-towel-scarf`) | Gear: neck |  |
| **The Even Cut** (`gta-even-cut`) | gnome-theft-auto | Jam the Grand Combine with the Stopping Stone and finish Chapter 5. | Even Cut Medallion (`even-cut-medallion`) | Gear: neck | RARE |
| **First Bake** (`kitchen-first-cake`) | cooking-gnoma | Finish your first acorn cake. | Baker's Toque (`baker-toque`) | Gear: head |  |
| **Golden Brown** (`kitchen-golden`) | cooking-gnoma | Take a cake out of the oven at the golden moment. | Tansy's Grease-Stained Apron (`tansy-apron`) | Gear: back |  |
| **Cake Day** (`kitchen-cakes`) | cooking-gnoma | Bake 5 acorn cakes. (5) | Frosting Garland (`frosting-garland`) | Gear: neck |  |
| **Perfect Slice** (`kitchen-perfect`) | cooking-gnoma | Finish a cake with all 15 stars. | Measuring Stick (`ruler-stick`) | Gear: hand | RARE |
| **Pocketed** (`billiards-first-pot`) | gnome-billiards | Pot your first ball. | Martini Glass (`martini-glass`) | Gear: hand |  |
| **Break Dancer** (`billiards-break-three`) | gnome-billiards | Pot three or more balls on your opening break. | Chalk-Dusted Cap (`chalk-cap`) | Gear: head |  |
| **Scratch City** (`billiards-scratch`) | gnome-billiards | Pocket the cue ball. | Microfiber Bowler (`microfiber-bowler`) | Gear: head |  |
| **Table Champ** (`billiards-cpu-win`) | gnome-billiards | Sink the 8 ball before Big Lou does. | Pool Cue Case (`cue-case`) | Gear: back |  |
| **Eight-Ball Champion** (`billiards-online-win`) | gnome-billiards | Win an online game against another player. | Honeycomb Charm (`honeycomb-charm`) | Gear: neck | RARE |
| **Regular** (`billiards-regular`) | gnome-billiards | Finish five games of Gnome Billiards. (5) | Felt Table Scarf (`felt-scarf`) | Gear: neck |  |
| **Boomshakalaka!** (`jam-first-dunk`) | gba-gjam | Throw down your first slam dunk in the Gnomerena. | GBA Sweatband (`gba-headband`) | Gear: head |  |
| **He's On Fire!** (`jam-on-fire`) | gba-gjam | Sink 3 consecutive baskets with one gnome to catch fire. | GBA #1 Foam Finger (`gba-foam-finger`) | Gear: hand |  |
| **From Downtown!** (`jam-downtown`) | gba-gjam | Drain 5 three-pointers across your GBA GJAM career. (5) | Referee Whistle (`gba-whistle`) | Gear: neck |  |
| **Tip-Off Victor** (`jam-first-win`) | gba-gjam | Win a 2-on-2 match in the Gnomerena. | GBA Team Duffel (`gba-gym-bag`) | Gear: back |  |
| **GBA Finals Champion** (`jam-champion`) | gba-gjam | Win the Top-6 Knockout Tournament to lift the Golden Acorn Trophy. | Golden Acorn Trophy (`gba-trophy`) | Gear: hand | RARE |
| **Genius** (`wordle-gnome-genius`) | wordle-gnome | Guess GNOME on the first try. | Letter Crown (`letter-crown`) | Gear: head |  |
| **Gnome.** (`wordle-gnome-solve`) | wordle-gnome | Solve the puzzle. The answer was gnome. | Letter Tile Pendant (`scrabble-tile-pendant`) | Gear: neck |  |
| **Still Gnome** (`wordle-gnome-regular`) | wordle-gnome | Solve it 7 times. It is still gnome. (7) | Brass Key (`brass-key`) | Gear: hand |  |
| **Name Drop** (`gnomillion-first-answer`) | gnomillion | Send your first answer in a Gnomillion room. | Visitor Lanyard (`visitor-lanyard`) | Gear: neck |  |
| **One in a Gnomillion** (`gnomillion-one-in-a-gnomillion`) | gnomillion | Be the only gnome in a round to give your answer. | Clover Wand (`clover-wand`) | Gear: hand |  |
| **Lone Voice** (`gnomillion-lone-voice`) | gnomillion | Earn the One in a Gnomillion tier in 3 rounds. (3) | Megaphone Cap (`megaphone-cap`) | Gear: head |  |
| **Five Rounds In** (`gnomillion-five-rounds`) | gnomillion | Play 5 rounds of Once in a Gnomillion. (5) | Quiz Card Satchel (`quiz-satchel`) | Gear: back |  |
| **Gnomillionaire** (`gnomillion-champion`) | gnomillion | Finish a full Gnomillion game. | Mole Crown (`mole-crown`) | Gear: head | RARE |
| **Brick by Brick** (`snigms-first-wall`) | snigms | Build your first wall. | Brick Beret (`brick-beret`) | Gear: head |  |
| **Four Walls and a Gnome** (`snigms-first-room`) | snigms | Close in a room of at least 4 tiles. | Picnic Blanket Cape (`picnic-cape`) | Gear: back |  |
| **Interior Gnome** (`snigms-first-furniture`) | snigms | Buy your first piece of furniture. | Iron Key (`iron-key`) | Gear: hand |  |
| **Punching the Clock** (`snigms-first-shift`) | snigms | Finish your first shift and come home paid. | Time-Card Clip (`time-card-clip`) | Gear: neck |  |
| **Top of the Ladder** (`snigms-promoted`) | snigms | Get promoted at work. | Foreman's Hard Hat (`foreman-hard-hat`) | Gear: head |  |
| **Living the Dream** (`snigms-full-house`) | snigms | Have all five needs at 90 or more at the same time. | Full House Wreath (`flower-wreath`) | Gear: head |  |
| **Squeaky Gnome** (`snigms-first-bath`) | snigms | Have your first bath. | Rubber Duck Cord (`rubber-duck-cord`) | Gear: neck |  |
| **Big Spender** (`snigms-spent-big`) | snigms | Buy something for 150 acorns or more. | Royal Spear (`royal-spear`) | Gear: hand |  |
| **One Week In** (`snigms-week-survived`) | snigms | Reach day 8 with your gnome still standing. | Tally-Stick Cap (`tally-stick-cap`) | Gear: head |  |
| **Jack of All Trades** (`snigms-all-jobs-tried`) | snigms | Hold each of the four jobs once: Gardener, Mailgnome, Mushroom Chef and Mower Mechanic. (4) | Broom (`broom`) | Gear: hand |  |
| **Hello.** (`collectathon-hello`) | nothing-left-to-collect | Say hello back to the secretary. | Visitor Lanyard (`fc-visitor-lanyard`) | Gear: neck |  |
| **Clip Art** (`collectathon-clip-art`) | nothing-left-to-collect | Collect 1,000 Clips on Floor 2. | Giant Paperclip (`fc-giant-paperclip`) | Gear: hand |  |
| **Employee of the Month** (`collectathon-employee-of-the-month`) | nothing-left-to-collect | Earn 50 Recognitions on Floor 2½. (50) | Employee of the Month Cap (`fc-employee-cap`) | Gear: head |  |
| **The Point** (`collectathon-the-point`) | nothing-left-to-collect | Collect everything there is to collect. | Bottomless Sack (`fc-bottomless-sack`) | Gear: back |  |
| **I'm Not Taking the Job** (`collectathon-not-taking-it`) | nothing-left-to-collect | Tell the secretary you are not taking the job, and leave. | Shellshore Sun Hat (`fc-sun-hat`) | Gear: head | RARE |
| **Collector of Secrets** (`collectathon-easter-eggs`) | nothing-left-to-collect | Find all 8 easter eggs. (8) | Shell Necklace (`fc-shell-necklace`) | Gear: neck | RARE |
