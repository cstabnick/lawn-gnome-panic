# Gnome Theft Auto: the directing bible

How the game's cutscenes are directed. Every scene, story or side quest, is held to this page; the numbers in it are the
ones the pacing checker enforces (`games/gnome-theft-auto/src/cutscene/pacing.ts`, `PACING`). Change a number in both
places or in neither.

- Per-scene notes: copy [TEMPLATE.md](TEMPLATE.md) to `scenes/<scene-id>.md`. The worked reference is
  [scenes/mowers-keepers-intro.md](scenes/mowers-keepers-intro.md).
- Who re-directs what, in which order: [lanes.md](lanes.md).
- The engine and its format: [../cutscenes.md](../cutscenes.md). Story canon: [../story.md](../story.md), `docs/lore/`
  (`npm run lore -- find <word>`). Places and set dressing: [../environments.md](../environments.md).
- The report: `npm run cutscene-report -w games/gnome-theft-auto`.

---

## 1. What our cinema is

Gnome Theft Auto is a crime saga played completely straight by people who are eighteen centimetres tall. The joke is
never that the characters know they are funny. The joke is the gap between how seriously they take it and what it is:
a mob boss who taps his armrest, a tribunal about grass height, a getaway on a push-mower.

**The five laws.**

1. **Deadpan first.** Characters mean every word. Nobody winks, nobody laughs at their own line, no stinger tells the
   player a joke happened. A `comic` stinger is a confession that the line did not land; use it at most once a scene,
   and only on a physical gag.
2. **Escalate, one notch at a time.** A good gag is a ladder: ticket the bike, then the farmer's boot. A good threat
   too: compliment the hat, then offer to buy it, then stop talking to you. Each beat raises the previous one; a beat
   that only repeats it is dead.
3. **Show the thing, then let someone react to it.** The picture carries the plot, the line carries the attitude. If a
   line describes what is on screen ("Turncoat Cam steps out of the van"), cut the line and stage the shot.
4. **Physical comedy is in the body, not the caption.** Gnomes are stiff, round and short. Use it: the run that takes too
   long, the sit that misses, the bow that tips the hat, the arm that is not there. Give the gag its own shot and hold
   it long enough to read (1.5 to 3 s).
5. **The sincere beats are played sincerely.** The lore has real weight (the Mower, the Kiln, cracking). When a scene
   turns serious (the tablet, Pip's arm, the jam, Clara's porch), the jokes stop completely for that beat: no stinger,
   no button gag, slower cuts, and one held silence. Comedy right after a sincere beat is allowed only from a character
   who is coping, never from the camera or the music.

**Visual style.** Crime-film grammar at garden scale. Low angles make petty officials enormous. Long lenses (30 to 40
degrees) on faces flatten gnomes into portraits; wide lenses (52 to 60) on places make them toy towns. Turfton is shot
like a city (street level, eye-level traffic, deep focus down the grid); the biomes are shot like westerns (horizon in
the lower third, small figures, big sky) but only for establishing. Night scenes need a lit subject: give them
`sky: 'golden'` or a light source in frame (headlights, the diner window) rather than shooting black on black.

**The phone rule.** Most players watch on a phone. The subtitle card covers the bottom third of the frame, and a portrait
screen crops a 16:9 frame to about its centre square. So: faces in the upper half, the speaker inside the centre square
(the checker's safe frame), and nothing that matters in the bottom third while a line is up. The `frame` shot sizes
already aim the eyes at the upper third.

---

## 2. The characters

Want = what they are trying to get in a scene. Need = what they actually need (the arc). Fear and secret are subtext:
play them, never say them. Secrets come from the lore's loose threads; a scene must not answer one on screen without a
ruling in `docs/lore/rulings.md`.

### The player ("You")

- **Want:** clear the Kiln-Debt and keep their head down. **Need:** to choose a side and a home. **Fear:** being one more
  gnome from the same mould. **Secret:** none; the player is the audience's seat.
- **Voice:** the straight man. Short, flat, practical lines, two to six words, mostly questions ("Your bikes?", "Why
  me?", "Is that whistle for you?"). Never a quip that tops a cast member's quip; the player's comedy is the dry
  question that exposes the absurdity. At most one line in three of any exchange.
- **Body:** still. Nods, a shrug, crossed arms at Vesper. Lets others move round them. Always given a reaction shot after
  a big line (the player's face is where the audience lives).
- **Arc:** ch1 a hired hand doing errands for the debt; ch2 debt paid, and the first refusal (Vesper's offer): the player
  chooses the crew over comfort; ch3 drives Pip to safety: the player is now the one others lean on; ch4 the one
  everybody's plan depends on (the drop); ch5 the hand on the jam, and the one the city's choice falls to.

### Pip "Two-Stroke" Potsworth

- **Want:** to be useful, now, loudly. **Need:** to stop running from Fescue and be proud of what he is.
  **Fear:** being the family embarrassment (cousin Wendel is regent). **Secret:** the vial of Fescue soil in his toolbox.
- **Voice:** fast, run-on, exclamation marks, engine names ("Husky-Blade two-strokes!"). Tics: "Okay, hear me out" before
  every plan (no more than once a chapter), answering a question nobody asked, a second sentence that undoes the first
  ("We're legitimate! ...Don't tell anyone."). Bad at numbers. Never cruel.
- **Body:** never still: bouncing, sitting on the wrong thing, running when walking would do. Enters frame at speed (use
  `run`, a short `handheld`). Points at machines. Slumps when shut down, recovers within one shot.
- **Arc:** ch1 the liability who drags the player in; ch2 shamed by Bracken in Mossy Wood (the first time he goes quiet)
  and the first to ask the sincere question ("they're really gonna level the whole lawn?"); ch3 takes the hit for the
  player (the arm) and jokes through the pain; ch4 the plan-man, finally right; ch5 says the line that sends them in
  ("Let's go jam a god-machine with a rock!"), and the last laugh in the epilogue.

### Tansy "Side-Valve" Clayfoot

- **Want:** to keep the bay open and stay out of everybody's war. **Need:** to admit she cares about the crew and the
  city, not just the bay. **Fear:** losing the place she built (and being found out as no Clayfoot at all).
  **Secret:** the brass forty-eighth wrench, and whether the surname is real.
- **Voice:** dry, low, short. Garden proverbs twisted into street slang ("A clamp is just a lock in a uniform."). Never
  raises her voice until chapter 3. Chicory coffee is her tell for stress, not a catchphrase: mention it at most twice
  in the game. Gives orders as three short clauses ("Unclamp them. Bring them to my bay. Mind the Hat Watch.").
- **Body:** works while she talks (a spanner, the ticket, the crate); looks at the job, not at Pip; turns to face the
  player only when she means it. Arms crossed = no. The one time she hugs (ch3 close) must be the first time she
  touches anyone.
- **Arc:** ch1 "not my bay, not my problem" while her bay is the target; ch2 sends the player to Vesper knowing it is a
  trap; ch3 loses the bay, goes underground, and surfaces for the crew (the snail-mail); ch4 runs the plan and finally
  calls a heist big enough for the brass wrench; ch5 opens the cigar box, hangs the forty-eighth wrench back up.

### Vesper "The Glazier" Thorne

- **Want:** a silent, even, beige Turfton, and the Golden Acorn to power the Grand Combine. **Need:** (he does not get
  it) to accept that cracks are not failure. **Fear:** cracking: porcelain does not glue back. **Secret:** the Tall
  House (never say it; let him avoid lanterns and dark doorways).
- **Voice:** soft, slow, complete sentences, perfect grammar, never a contraction, never an exclamation mark (the only
  exception is the finale's PA, where he finally loses control). Calls everyone "friend" or by their full name. Threats
  are compliments ("Nice hat."). He files; he does not fight.
- **Body:** still. Arrives in frame already standing there or in the pearl Lowrider that "nobody is driving". Never runs,
  never sits on anything dirty, tips his hat (`tipHat`) as a threat. Shot from a low angle, alone in the frame, with
  space round him; never in a shared two-shot with a crew member until the finale.
- **Music:** `villain` is his and only his. A `villain` stinger marks his arrival, once per scene.
- **The hat ladder** (his running line; never the same rung twice): ch1 two-coat-handover "Nice hat." (curious) ->
  ch1 tax-break-in "Nice hat. Shame if it cracked." (the full threat, the one time) -> ch2 vesper-diner the offer, no
  hat line at all, he buys instead of threatening -> ch3 salvage-raid "Nice hat. Shame." (he no longer finishes it)
  -> ch5 even-cut-intro PA "And to the gnome in that hat: tonight, it cracks." -> payoff: in the finale it is his top
  hat that comes off.
- **Arc:** ch1 a polite rumour with a lien; ch2 the reasonable man with an offer; ch2 close buys the betrayal; ch3 takes
  the acorn in person (the only time he touches anything); ch4 fires the Spade Guard by phone; ch5 on the PA, unravelling.

### Granny Gnertrude (Cloverfield)

- **Want:** her silos and Dew-Wells kept, and a cut of everything. **Need:** (complete already) she is the crew's proof
  that the old and the crooked can be kind. **Fear:** foreclosure. **Secret:** the sharpest fence in three biomes.
- **Voice:** warm, "sugar" once per scene at most, homely metaphors for crime ("Now we can cook."), pie as currency.
  Gives practical crime advice in a recipe's rhythm. **Body:** slow, sits, offers things (pie, a shotgun, tea).
- **Arc:** ch2 employer and debt-clearer; ch2 sends the player to Vesper; ch4 brings pie to the coalition; ch5 holds the
  south canal.

### Councilwoman Juniper "The Trowel" Vance and Reginald "Quarter-Inch" Vance

- **Juniper. Want:** to beat the HOA through paperwork, faster. **Need:** to accept she needs a street driver. **Secret:**
  what she found in the City Hall sub-basement. **Voice:** brisk, formal, devastating one-liners; full sentences;
  insults her brother by agreeing with him. **Body:** briefcase, cold Acorn-Cola, never hurries.
- **Reginald. Want:** a quarter-inch of order. **Need:** to stop working for a crook (he does not get there until the
  finale's "...It's uneven."). **Voice:** municipal code, numbers, "four-oh-four dash B". **Body:** crouches to measure,
  calipers out, a whistle. Shot high (looking down on him) except when he is enforcing.
- The siblings' scenes are a double act: they never look at each other while insulting each other.

### Mayor Barnaby "Two-Coat" Mulch

- **Want:** to be on the winning side. **Voice:** campaign slogans, "Ding, ding!". **Body:** waves, poses for cameras
  that are not there. His joke: repainting himself to match whoever is winning. Payoff in the epilogue.

### Don Compost

- **Silent.** Never speaks (R-025). Directs with taps (one = mower, two = acorns, three = crack a hat), eyebrows, a
  folded napkin. Direct him like a silent-film star: a close-up of the hand, a reaction shot of whoever has to translate,
  and a hold. Others talk about him in his presence, nervously. His menace is the room's fear, so frame the room.

### Turncoat Cam

- **Want:** a Patio Heights racing charter (and to be someone in Turfton). **Need:** loyalty (he never gets it).
  **Fear:** sweeping someone else's apron for ever. **Secret:** he is selling the crew out (from chapter 2).
- **Voice:** almost none until the betrayal; then short, transactional. **Body:** sweeping with the push-broom, always in
  the background of Side-Valve shots, eyes on the bay. **Direction:** plant him in every Side-Valve scene before chapter 3
  as background business; give him one look in chapter 1 (the worked example's button) and one beat of envy at a
  racing Zero-Turn in chapter 2. The broom is still in his hand when he steps out of the HOA van.

### The chorus: John Bodega and Asphalt the cat

- Bodega & Sons is the town's heartbeat; the cut to it is our "meanwhile". **John:** dry, a sentence or two, reports
  Turfton FM gossip. **Asphalt:** the bottlecap is the barometer (bats it = normal, ignores sirens = Turfton is used to
  it, hops off the counter = something is truly wrong, back on the counter = all is well).
- **Fix needed in the current scenes:** John speaks stage directions ("Bodega & Sons, late morning. Asphalt bats a
  bottlecap..."). Show the cat and the cap; give John one line of commentary.

### Elder Bracken and Sorrel Tillbrook (Mossy Wood)

- **Bracken. Want:** to keep the Unmowed hidden and the old ways pure. **Need:** to trust a Potsworth who loves engines.
  **Voice:** archaic, heavy, low `hz`; accusations as statements. **Body:** still, staff, stands higher than the others
  (shoot low). The first scene where nobody makes a joke (tablet-outro) is his.
- **Sorrel. Want:** to keep the peace and the broadcast going. **Voice:** a radio host's calm, measured warmth; dry
  asides about the schedule. Refuses to say "mower" (she says "the one in the Shed"). **Body:** headphones on and off.

### Father Loam, Thermos Theo (Frostbite Fells)

- **Loam:** excommunicated chaplain; blesses getaways; preacher's cadence, "my child". Kind first, odd second.
- **Theo:** acorn-broth, gossip, the warm stop in the cold. Both are the chapter-3 found family: shoot them warm (close,
  firelight) against the cold wides.

### Commander Diggs (Fort Sandpit)

- **Want:** his chopper guarded and his Guard respected. **Need:** to choose his city over his orders. **Voice:** clipped
  military, numbers, "effective immediately". **Body:** stands at attention, salutes, shot low.
- **Fix needed:** "Nobody fires the Guard. Especially not a guy in a porcelain hat." is Diggs's line (story.md), not
  Tansy's (spade-truce-intro gives it to her). His turn is the chapter-4 spine; give it to him.

### Side cast (one row each)

| Who | Want in their quest | Voice in one line |
| --- | --- | --- |
| Mossley "Plumb-Line" Inkcap (Grid Truthers) | proof the grid is watched | whispers, numbers, instructions about where not to look |
| Clara (Porcelain Blues, Support Group) | her porch sealed, her people safe | quiet, careful, every sentence ends early; sincere register |
| Elder Bracken (Fescue Fugitive) | the replica Stopping Stone back | as above, now offended by a doorstop |
| Burt (HOA Audit) | to come clean (and his overtime) | nervous, corporate jargon, apologises mid-sentence |
| Driftwood (Castaway, Tessie) | the Big Puddle; Tessie believed | sun-bleached rambler: cut him short, give him one great line |
| Cedric "Double-Bag" Peat (Mulch Pyramid) | recruits for the upline | sales patter, never answers a question |
| Farmer Bramble (Biscuit's Squeaky Toy) | Biscuit gone before the barns go flat | trembling, whispered, from the storm cellar |
| Shelldon "No-Trail" Mucilage (Snail Rigging) | his snails winning | conspiracy capitals, refuses roads |
| Baroness Brenda (Hose-Pipe Revolt) | sovereignty for New Puddle | royal "we", proclamations, feather-duster sceptre |
| Big Lou (Dry-Hat Embargo) | his towels back, the door kept | two-word sentences, arms crossed, the rope |
| Burdock Bellweather (Fizz Cup races) | a clean race and a full grandstand | a commentator's patter; the tea towel |
| Wind-Sock Wally, Fence-Post Frank, Mabel Kerbstone, Ash-Shovel Ernie, Rooster | local colour | one line, one prop, one gesture each |

---

## 3. The spine and the tension curve

The story is one question: **will Turfton stay crooked, loud and alive, or be mown even?** The player starts owing the
town money and ends owning a share of its fate.

| Chapter | Dramatic question | Stakes | Tension (0-10) start -> end | Mood and music |
| --- | --- | --- | --- | --- |
| Prologue | Who are these people? | a stolen Ride-On | 3 -> 5 | `turfton`, bright |
| 1 Acorns & Alibis | Can the player pay their way out? | the debt; Tansy's bay | 3 -> 6 (Vesper: "Then we stop asking.") | `turfton`, `heist`, first `villain` |
| 2 Black Dew & Greenbacks | Will the player take Vesper's deal? | Cloverfield; the acorn | 4 -> 8 (the tablet; Cam's sale) | `warm`, `fescue`, `villain`; first `sad` |
| 3 Cold Clay | Can the crew survive losing everything? | the bay, Pip's arm, the acorn | 9 (raid) -> 4 (resin) -> 7 (the Combine fires) | `chase`, `frost`, `turfton-dusk` |
| 4 Sandpit Protocol | Can a crew of outcasts take a fort? | the Whirligig; the Guard | 6 -> 8 ("Tonight...") | `sandpit`, `triumph`, `villain` |
| 5 The Even Cut | Will they stop the Combine, and what will Turfton be? | the city | 9 -> 10 -> release 2 | `finale`, then `turfton-dusk`, `turfton` |

Rules that follow from the curve:

- **Chapter openers** state the chapter's question in their first 10 seconds (in a picture, not a caption) and end on the
  title card. **Chapter closers** answer the previous question and pose the next one: the last image is a threat
  (Vesper, the Combine, Cam) followed by `END OF CHAPTER n`.
- **Comedy density follows the curve inverted:** a gag every 5 to 10 s at tension 3 to 5; one gag a scene at 8 and above;
  none in the sincere beats (tablet-outro, salvage-raid's arm, kiln-resin's cure, even-cut's jam).
- **Never two sincere scenes back to back without a laugh between them,** and never a chapter closer that ends on a gag
  (the button of a closer is the threat).

### Running jokes and their ladders

| Running thread | Setup | Rungs (each must escalate) | Payoff |
| --- | --- | --- | --- |
| Vesper's hat line | ch1 two-coat-handover | see Vesper above | finale: his top hat comes off |
| Asphalt's bottlecap | prologue-intro | ch1 close "she knew", ch3 raid ignores sirens, ch5 intro hops off | epilogue: back on the counter |
| The brass forty-eighth wrench | **plant in ch1** (prologue-outro: Tansy counts 47 out loud, the cigar box in shot) | ch4 spade-truce-outro "not a big enough heist" | ch5 intro opens the box; epilogue hangs it up |
| Pip's "Okay, hear me out" | founders-boot-intro | sandpit-drop-intro | finale: Tansy says it, and Pip is speechless |
| The golden kazoo | tax-break-in-intro "I want the golden kazoo" | runway-intro "Toot" | a kazoo toot in the finale at the worst moment |
| Turncoat Cam's broom | prologue-outro (background) | mowers-keepers-intro (he watches), a ch2 look at a racer | ch2 close sale; ch3 raid: broom still in hand |
| Tansy's "not my problem" | mowers-keepers-intro | mowers-keepers-outro (the eviction is on her door) | ch3: the bay is everybody's problem |
| Granny's pie | sprinkler-outro | ch4 coalition "I brought pie." | finale: pie for the crew |
| Mabel's taxi | two-coat-intro "Hop in, dear" (refused) | (any side scene) | epilogue: "on the house" |
| The Mayor's coats | two-coat-handover "A second coat? Streaky." | founders-boot (fresh paint) | epilogue: a third coat, "on your side the whole time" |

### Setups that must be planted earlier

- **The Whirligig** is named for the first time in chapter 3's closer. Plant it: Turfton FM or Vesper's line in ch1/ch2
  (the citation for "unauthorised verticality" is a good gag to move earlier).
- **Commander Diggs** appears from nowhere in chapter 4. Plant him: Wind-Sock Wally mentions him in runway-intro.
- **Cam's motive** (the racing charter): one envious look at a racing Zero-Turn in a chapter 2 scene.
- **Pip and Fescue** (Bracken calls him a traitor in ch2): plant a dodge in ch1 (Pip changes the subject when Fescue is
  mentioned in prologue-outro).
- **The Stopping Stone** is first named in tablet-intro and is the finale's key: show its shape on the tablet (a prop)
  so the finale can rhyme with it.

---

## 4. Pacing rules (with numbers)

The player reads every line. Lines type at the player's speed (Normal 40 characters a second) and hold for reading time
(238 words a minute, at least 1.5 s). The checker compiles every scene at Normal speed.

| Rule | Number | Checker code |
| --- | --- | --- |
| Words in a line | aim 12, never more than 16 (two short sentences) | `line-long` |
| Lines in one shot before a cut | at most 3 (2 is better) | `lines-per-shot` |
| Lines in a row by one speaker | at most 3, then someone reacts or speaks | `speaker-run` |
| Narrator lines plus captions per scene | 1 (2 in a chapter opener or closer) | `narration` |
| Shortest shot | 0.8 s (a flash cut is a mistake unless waived) | `shot-short` |
| A shot replaced at once (two `cam` steps in a row) | never | `dead-shot` |
| Longest hold: close (cu/mcu) / medium (ms/fs) / wide / moving | 7 / 9 / 6 / 12 s | `shot-long` |
| A cut during a line | not in the first 80% of its typing: cut on the end of the line | `line-outruns-shot` |
| Time with nothing new (no line, move, sound hit or cut) | at most 3 s | `dead-air` |
| The hook | something happens by 3 s (a line, a move, a sound hit) | `no-hook` |
| First line | not narration: open on a picture or a character | `opens-on-narration` |
| Speaker in frame while the line types | at least 50% of the typing, inside the centre square | `speaker-unseen` |
| Speaker size while talking | at least 25% of the frame height (MS or closer) | `speaker-small` |
| Speaker facing | not more than 115 degrees from the camera (no back-of-hat lines) | `speaker-back` |
| The 180-degree line | consecutive lines of two actors within 10 m stay on one side | `crosses-line` |
| A line said word for word in another scene | vary or escalate it | `repeat-line` |

### Shot lengths by moment

| Moment | Shot | Length |
| --- | --- | --- |
| Establishing a place | WS/EWS, still or a slow dolly, no dialogue | 2-5 s |
| A line of dialogue | MCU single on the speaker | the line's length, 2-6 s |
| A reaction | MCU/CU on the listener, no line | 0.8-2 s |
| An exchange of two or three lines | OTS or two-shot (MS) | 4-9 s |
| A reveal or awe | dolly in / crane, then hold | move 3-6 s, hold 1.5-3 s |
| A gag | the widest shot that shows the whole action, locked off | 1.5-3 s after the gag lands |
| A threat | low single, slow push-in | 3-6 s |
| A chase or arrival | track / follow | 2-12 s |
| An insert (prop, ticket, crate) | CU of the object | 1-2 s |

### Beats and silence (`direct.ts` `beat()`)

`tiny` 0.3 s (between a line and its reaction), `beat` 0.7 s (the look before an answer), `pause` 1.2 s (something
landed), `silence` 2.0 s (after a sincere or shocking moment; once a scene at most, music out, ambience only). A held
silence is a waiver of `dead-air` only if it is longer than 3 s; write it down.

### The shape of a scene

Every scene of 30 to 90 s has four parts:

1. **Hook (0-3 s).** An image with a question in it: an action, a sound, a face mid-reaction. Never a wide of an empty
   place under narration.
2. **Setup (by 10 s).** Who wants what, here. One line or one picture each.
3. **Turn (at about 60%).** Something changes the want: a reveal, an interruption, a refusal, a new arrival. A scene
   without a turn is a briefing; make something go wrong in it.
4. **Button (the last 3 s).** The last image is a punchline, a threat or a look. Then cut (the fade is the cut). Never end
   on a walk-off with nothing to see, never end on a line that only gives directions.

Quest intros put the objective in the turn or the button, said by the character in their own voice, not as a waypoint
read-out. The HUD already shows the waypoint: one place name per briefing is enough.

### Scene length targets

| Kind (`direction.kind`, or inferred) | Aim | Fault above |
| --- | --- | --- |
| `intro` (a quest being given) | 30-60 s | 75 s |
| `outro` (the payoff) | 15-45 s | 60 s |
| `arrival` (a visit objective, a mid-quest beat) | 10-35 s | 45 s |
| `chapter-open` | 45-80 s | 100 s |
| `chapter-close` | 40-80 s | 100 s |
| `race-intro` | 15-30 s | 35 s |
| `race-podium` | 10-22 s | 30 s |

These are lengths at Normal text speed; fast readers see them shorter. Long scenes are almost always too many lines:
cut lines before cutting shots.

---

## 5. Camera language

**Coverage, not stage spots.** The stage cameras in `quests/stages.ts` are establishing and arrival spots, chosen to see a
place. They are wides: dialogue on them makes `speaker-small` faults. Use them to open and to place a scene, then cover
the talk with `frame` shots (`direct.ts`: `shot(who, size)`, `coverage(a, b)`, `reaction(who)`).

| Moment | Size and angle | Move | Lens |
| --- | --- | --- | --- |
| Establishing | WS/EWS, high | slow dolly or locked | 52-60 |
| Dialogue | MCU singles on the eyeline (`coverage().single`), OTS for back-and-forth | locked | 35-40 |
| Confrontation | singles tighten as it escalates (MS -> MCU -> CU), the stronger party shot low, the cornered one high | push in on the turn | 30-35 |
| Comedy | the widest shot that holds cause and effect; react in a separate MCU | locked off, never moving on the gag | 40-45 |
| Awe / reveal | low, looking up past a foreground figure; or a crane up | dolly or orbit, slow, then hold | 45-60 |
| Threat (Vesper, the Combine) | low, alone in frame with space round them | slow push-in, no cuts while he talks | 30-35 |
| Chase / getaway | `follow` and `track`, `handheld` 0.02-0.04 | moving | 50-60 |
| Tenderness | MCU two-shot or close singles at eye level, nobody above anybody | locked, long holds | 35-40 |

- **Eyelines.** Before a two-hander, turn the actors to each other (`exchangeLooks(a, b)`). A single taken with
  `toward: <listener>` sits on the eyeline, so the speaker looks just past the lens.
- **The 180-degree rule.** Pick the side of the line for a conversation (`coverage(a, b, side)`) and stay there. Cross it
  only on a motivated move (an actor walks round, or a dolly carries the camera across on screen), and waive
  `crosses-line` for that line.
- **Reaction shots.** Every big line (a reveal, an insult, an offer) gets one, on the person it hits, 0.8-2 s, before the
  answer. Reactions are where the comedy lives: Pip's face, the player's stillness, the enforcer's nod.
- **Move or lock?** Move when the move means something (a push-in on a decision, a crane for scale, a follow for speed).
  Lock off for jokes and for lines. Never move during a punchline. Never cut during a move unless the cut lands on its
  end.
- **Handheld** (`handheld` on any shot): 0.01-0.02 for a nervous scene, 0.03-0.05 for a raid or a chase. Never on
  Vesper (he is the still point), never in a sincere beat.
- **Watch it, do not trust the numbers alone.** The line-of-sight check knows buildings and terrain, not the scene's own
  vehicles or props: a parked Zero-Turn can fill a "clear" shot. A `frame` shot moves with its actor: aimed where a
  runner is going it leads them (good), aimed across their path it sweeps through the set (bad).
- **Lens per shot** (`fov`): long (30-35) for faces and threat, normal (40-45) for groups and comedy, wide (52-60) for
  places and speed. The `frame` sizes pick a lens for you.

### Variety without changing intent

The same two-hander cut the same way three times is a flat scene. The `direct.ts` helpers vary the set-up while the
scene's intent (who is looked at, how big, from which side) stays the same:

| Helper | For |
| --- | --- |
| `pickAngle(seed, size, side)` | a deterministic swing and height (eye, low, high) for a size, per seed; the sign of `side` is kept |
| `varied(who, size, seed, opts)` | `shot()` with `pickAngle` applied: an eyeline single that differs per seed but keeps the line |
| `pushIn(who, from, s, opts)` | a slow push-in from size `from` (default one size tighter) over `s` seconds: a decision, a turn, a threat |
| `pullOut(...)` | the reverse, one size wider: an exit, a reveal of the room, a deflation |
| `insert(who)` | a high CU on what `who` holds or does (the hands, the thing) |
| `cutaway(who, opts)` | a held shot of a bystander or listener (steps) to break a long exchange |
| `coverage(...).two(size)` | the two-shot of a coverage set, for a beat both people share |
| `vary(steps, seed)` | a pass over a step list: after three of the same `frame` set-up in a row, every second repeat gets a new angle; same seed, same result |

- **Never the same set-up three times running.** The cutscene report flags `MONOTONE`. Vary size, angle or move on the
  third.
- **Variation never flips the side of the line.** Every helper keeps `side`; the 180-degree rule above still holds.
- Vary the **picture**, not the **meaning**: a threat stays low, a cornered person stays high, a joke stays locked off.

---

## 6. Sound and music

| Theme | Use it for | Never for |
| --- | --- | --- |
| `turfton` | the crew's world, Side-Valve, downtown, good news | a threat |
| `turfton-dusk` | chapter endings, a quiet win, the morning after | an action beat |
| `finale` | chapter 5 only, from the brass wrench on | anything earlier |
| `villain` | Vesper (and his machine) on screen or on the phone | the HOA's foot soldiers (they get `tension` or nothing) |
| `fescue` | Mossy Wood, the Unmowed, Fescue memory | comedy |
| `frost` | Frostbite Fells | |
| `sandpit` | Fort Sandpit, Diggs, the Guard | |
| `heist`, `chase`, `tension`, `mystery`, `warm`, `sad`, `triumph` | the moment they name | stacking: one per beat |

- **Silence is a cue.** Drop the music (`music: null`, fade 0.4-0.8) for: the beat before a reveal, a sincere moment, a
  threat line, and the deadpan cold open. Ambience stays. The most effective music cue in a scene is often the one that
  starts after a silence.
- **Stingers:** at most two a scene. `villain` once when Vesper enters. `reveal` on the picture, not on the line that
  explains it. `chapter` only on the chapter title. `comic` at most once, on a physical gag.
- **SFX tell the cut what happened** off screen and on: the clamp (`handbrake`), the knock, the glass of a cracked arm,
  the door. Put the sound a beat before the reaction shot.
- **Ambience** fits the place (`street` downtown, `forest`, `wind` for the Flats and the diner, `night`, `rain`,
  `water`, `crowd` at the Speedway). Change it on the cut to a new place, so the ear tells the player they moved.
- **Radio** stays ducked (0.25); bring Turfton FM up only when the scene is about the radio.
- **Foley and new beds.** Batch 3 adds 22 foley sounds (`cloth`, `paper`, `pour`, `clink`, `chair`, `keys`, `zip`,
  `bell`, `crunch`, `creak`, `thunder`, `gulp`, `tap`, `pop`, `clatter`, `latch`, `squeak`, `shovel`, `flutter`,
  `static`, `snap`, `rustle`) and eight beds (`snow`, `shore`, `cave`, `market`, `meadow`, `storm`, `office`,
  `garden`). **Every scene has a bed and at least two foley or sfx cues** tied to what is on screen (a bed or a stated
  reason for silence; a chair, a cup, a page). The full sound design bible, with the per-region palette, the loudness
  budget, weather and voices, is [../sound-design.md](../sound-design.md).

---

## 6a. Character intros

The `{ do: 'intro', who }` step introduces a main character the way a film does: a camera-flash **freeze** on the
frame, the `intro` stinger (a shutter snap and a flourish), and a **name / role / line card** (text from
`cutscene/castIntros.ts`, `name`, `role` and `line` override it). It holds 3.2 s (`INTRO_SECONDS`, or `s`) and waits.
`freeze: false` keeps the colour and skips the flash-freeze look.

When to use it:
- A main character's **first on-screen appearance in the story**. **Once per character**, ever.
- **After** their first line or action, so we have seen them do something. **Never mid-sentence**: wait for the line to
  end, then intro.
- On an **mcu or ms of them** (cut to the shot first, then the intro). Not on a wide.
- Not for the side cast's walk-ons, and not under another stinger.

Outside a cutscene (a quest meets a character in the live world) call `showCharacterIntro(card)` from
`cutscene/introCard.ts`. Sound rules: [../sound-design.md](../sound-design.md) section 7.

---

## 7. Waivers

A rule broken on purpose is written down in the scene:

```ts
direction: {
  notes: 'docs/design/gnome-theft-auto/direction/scenes/salvage-raid-intro.md',
  waive: [{ code: 'dead-air', match: 'from 31', why: 'held silence after the arm breaks' }],
},
```

`match` narrows the waiver to faults whose line text or detail contains it. A waiver needs a reason; keep them rare (a
scene with more than two is a scene that needs re-directing).

---

## 8. Common faults in the current scenes

From a read of all 37 story scenes, the 35 side scenes and the race scenes, and the first checker report (720+ faults).
Each is cited by scene id; the lanes fix them.

1. **Dialogue on wide stage spots** (`speaker-small`, the commonest fault, 160+). The stage cameras are wides; scenes talk
   on them. `tablet-intro` plays Bracken at 12% of the frame, back to camera, for three lines; `sq-tessie-intro` has
   Driftwood at 2-6% of the frame for most of the scene; `sq-porcelain-blues-intro` holds one wide for 28 s and five
   lines. Fix: open on the wide, cover the talk with `frame` singles and OTS.
2. **Back-of-hat lines** (`speaker-back`, 90+). Cameras placed from a stage spot while the actor faces their mark's look
   point: `sq-big-lou-embargo-intro` (Lou, six lines), `prologue-intro` (the player's "Is that whistle for you?"),
   `even-cut-outro` (Reginald's "...It's uneven." and the Mayor). Fix: turn the actor to the listener and cover on the
   eyeline.
3. **Dead shots and flash cuts** (`dead-shot` 68, `shot-short`). Two `cam` steps in a row where the first never shows:
   `even-cut-outro` opens with four in a row, `two-coat-intro` has three, `mowers-keepers-intro` (before re-direction)
   cut `spot(PB,'two-shot')` -> `spot(SV,'two-shot')` -> a cut in 0.4 s. Fix: one shot per idea; delete the rest.
4. **Shots held far too long** (`shot-long` 160): a wide with five lines in it (`sq-porcelain-blues-intro` 28 s, the
   `sq-tessie-intro` wides at 14-18 s, `two-coat-intro` three wides at 11-13 s, `prologue-outro` a 13 s medium). Fix: cut
   on every speaker change, add reactions.
5. **Narration doing the acting.** The Narrator describes what the camera should show: `salvage-raid-intro` ("Turncoat
   Cam steps out of the first van", "Pip's clay arm cracks clean off" over a shot that does not show it),
   `tundra-outro` ("She hugs him, carefully"), `kiln-resin-intro` ("One sensible argument and two plow drivers later"),
   `compost-forge`, `founders-boot-intro`, `prologue-outro`, `mowers-keepers-intro/outro` all open on narration. Fix:
   stage it; keep one narrator line for chapter openers' noir voice.
6. **John Bodega reads stage directions** (`prologue-intro`, `salvage-raid-intro`, `even-cut-intro`, `even-cut-outro`):
   "Bodega & Sons, in the rain. Sirens go past. Asphalt doesn't even blink." Fix: show it; John gets one dry line.
7. **Briefings without a turn.** Quest intros that are a giver reading the objective in three or four lines:
   `dew-run-intro` (Granny's four lines), `runway-intro`, `tablet-intro`, `sq-hoa-audit-intro`, `sq-mulch-pyramid-intro`.
   Fix: give the scene a want, an obstacle and an interruption; put the objective in the button.
8. **Waypoint read-outs in dialogue.** "Block (60, -60)" (`mowers-keepers-intro` before), "crossed z = -300 on the center
   meridian" (`even-cut-intro`), "Ring road east" (`tundra-intro`). Characters name places, never coordinates.
9. **Lines too long** (`line-long` 65): 17-22 words (`sq-tessie-intro` four of them, `sq-porcelain-blues-intro`,
   `tablet-intro`, `prologue-outro`). Split or cut.
10. **The camera jumps the line** (`crosses-line` 61): `two-coat-intro` (Juniper and the press, three times),
    `tablet-intro` (Bracken and Sorrel), `even-cut-outro`, `sq-big-lou-embargo-intro`.
11. **A running line repeated word for word.** "Nice hat. Shame if it cracked." in `two-coat-handover` and `vesper-diner`
    (`repeat-line`), "Nice hat, by the way. Shame if it cracked." in `tax-break-in-intro`, "Nice hat. Shame." in
    `salvage-raid-intro`. Five uses, one rung. Fix: the hat ladder (section 2).
12. **A character given another's line.** `spade-truce-intro` gives Diggs's turn ("Nobody fires the Guard...") to Tansy.
13. **The big moment off camera.** `salvage-raid-intro`: Pip's arm breaks during a `shake` on a shot of Tansy's mark,
    then Tansy vanishes with a whoosh (`despawn`). `tax-break-in-outro` reveals the Grand Combine with Pip's line before
    the picture. Fix: the camera is on the event; the line comes after the picture.
14. **Endings that drift off.** Scenes end on the player walking to the exit with nothing to see (`mowers-keepers-outro`,
    `prologue-outro`), or on a line that only gives the next errand (`tablet-outro`'s Sorrel line, `tundra-outro`'s Burt
    phone call, `sq-castaway-drydock-outro`). Fix: a button; move errand hooks earlier.
15. **Too dark to read.** Night scenes with dark-hatted actors on dark ground (`sq-grid-truthers-intro`,
    `sq-grid-truthers-gamma`, `sq-big-lou-embargo-intro`, `first-contract-outro`). Fix: `sky: 'golden'`, a lit window or
    headlights behind the subject, a light hat in the foreground.
16. **Race scenes overlong and the announcer unseen** (`race-rookie-mowdown-intro` 43 s, every podium: Burdock speaks
    off frame). Fix: cut the crane short, frame Burdock for his line. The live `?cutscenecheck` also reports
    camera-blocked shots in the race intros (grandstand meshes without colliders): check them in the browser.
17. **First Contract has no scripted intro.** It still plays the old `{ kind: 'contract' }` wanted-poster card. Story A
    writes `first-contract-intro` (Don Compost's three taps) as a new scene.

---

## 9. Engine vocabulary for directors

Added for this pass (documented in [../cutscenes.md](../cutscenes.md)):

- `frame` shot: `{ kind: 'frame', who, size: 'cu'|'mcu'|'ms'|'fs'|'ws', toward?, over?, side?, height?, fov? }`, placed
  from where the actors stand, with the lens that goes with the size.
- `handheld` on any shot.
- Emotes: `flinch`, `slump`, `think`, `clutch`, `beckon`, `tipHat`, `stomp` (as well as wave, point, shrug, nod, cheer,
  handsUp, lean, crossArms, facepalm, bow, sit, stand).
- `direct.ts`: `beat(name)`, `shot(who, size)`, `cut(shot)`, `coverage(a, b, side)`, `reaction(who, opts)`,
  `exchangeLooks(a, b)`.
- `direction` on a scene: `notes`, `kind`, `waive`.
