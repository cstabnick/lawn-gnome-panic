# G11 Story act III (main quests 36-53): editorial review, round 1

Editor: G11. Read in player order: every act III quest def, its comms and bulletins, every scene script (`ch3b.ts`
kiln-resin, `m37`-`m52`, `ch3c.ts` tundra), the story marks, W09-W14 and the unlocks on these beats, against
`characters.md`, the outline's act 3, E21's roadmap and the lore. `npm run cutscene-report`: Story A/B 0 faults; every
act III scene is OK, but six run short of their aim (m39 intro 26.8 s, m50 intro 26.4 s, m52-p3 intro 24.8 s, the
tundra-outro chapter close 39.7 s against 40-80, and m46's final outro has only 3 lines). 24 scenes were watched at
`?cutscene=<id>` (headless Edge); stills in `shots/G11/`.

## Verdict

The act has real charm and range: twelve far edges, each with a resident who is funny on first contact (the Dean
lecturing twelve empty chairs, the registrar's sugar bursary, Hyssop's "I am putting it on the door", Ragwort's cold
tea), and four sincere beats that land: Driftwood at the edge of the Saltwater (#43), Basil's hand on the mole (#48),
Chicory lifting the napkin and letting you go (#50), Tansy's reunion (#39). Vesper's "A straight line goes round
nothing. Not greens. Not hedges. Not vines." is the best line in the act.

It is not yet hand-crafted. Three things hold it back. (1) **The crew disappears**: after #39 Tansy says "we split the
four parts", then neither she nor Pip has a line for twelve quests, so the act reads as a run of favours for
strangers. The user asked first for more character development, and this is where it is missing. (2) **The act's two
pivotal frames don't land on screen**: Vesper's look at the tasting is a black frame, and the Test Cut's reveal and its
broadcast play over an empty sky. The deck itself is a small brown box. (3) **The voice has gone flat across the
cast**: almost no one uses contractions, every briefing opens with the word "Previously:" and closes on a price, and
the bible's sample lines are reused word for word until they turn into catchphrases. There are also several continuity
slips (Vesper "seeing the player for the first time", Nubbin, the moles), and text promises things the game does not
do. All of it is fixable without touching any system that works.

Counts (32 findings): 3 blockers, 18 polish, 11 nits. 25 craft, 7 spirit.

---

## Findings

### 1. The crew vanishes for twelve quests; "we split the four parts" is never paid off
- **What:** In #39 Tansy says "Four parts, four edges. Power first. We split them from here." From #40 to #51, Tansy
  has no line at all, in any scene or comms. Pip is in the #46 p2/p3 and final scenes (with no explanation of how he
  got from your couch to Rootwell) and then says "I will stay too" at the Anthill. Both come back at the #52 p3 intro
  with "We're through the board". The act's outline promises "Pip thaws toward the crew" and "Tansy runs the ridge
  call". Between #40 and #51 the player has no one to report to, and no scene shows what the split was or what the
  others did.
- **Where:** `m39-couch-surfing-outro` (the split line); comms of rows 40-51 (no `pip`/`tansy` entries except #46);
  `m46-...-intro` (Pip stays); `m52-...-p3-intro`.
- **Why it matters:** The user's first story ask is "more character development", and act III is the act where the
  crew is broken and rebuilding. With twelve allies met in a row and no crew between them, the act plays as a list of
  errands. Each part cut should land with the people the player is doing this for.
- **Proposed fix:** No new systems: comms and short scene beats only. (a) One short call per part cut: Tansy after #41
  ("Power. One down. Pip's been sleeping in your bath."), Pip after #44 and #46, Tansy after #50, each also showing
  what *they* did with their share of the split (Tansy works the culvert and the HOA radio net; Pip scouts Hedgeworth
  from the couch). (b) A two-line Pip-and-player beat in the #46 p2 intro saying why Pip is there ("Tansy sent me. She
  said you'd forget the sugar."). (c) Give Pip one act III "Okay, hear me out" (the bible allows one per act; act III
  has none), e.g. the gates-are-narrow plan in #37 or the ramp in #46.
- **Severity:** blocker · **Type:** spirit

### 2. "Vesper sees the player's face for the first time" contradicts acts I-II
- **What:** The header of `m50-trellisdown-tasting` and the outline call the tasting "the first time the two share one
  frame". But Vesper sits across a booth from the player and makes an offer in `vesper-diner` (ch2b, #20), and talks to
  them face to face at the penthouse viewing (`m21-...-mid`/`-outro`: "You are early, friend.").
- **Where:** `cutscene/scenes/story/m50-trellisdown-tasting.ts` MID; outline row 50; `characters.md` Vesper arc III.
- **Why it matters:** An attentive player knows Vesper has met them, so the long look reads as Vesper failing to
  recognise someone he made an offer to. It is also a weaker beat than the one the history allows.
- **Proposed fix:** Make the look a recognition. Vesper looks, the music drops, and his single soft line is "The
  gnome who would not take a penthouse." Then the Countess's "Vesper. You are staring at the help." This raises the
  stakes for #52 (he knows who is caddying), and Peony's bib in #52 becomes a real risk. Update the outline and
  character bible wording ("first shared frame since the diner").
- **Severity:** polish · **Type:** craft

### 3. Nubbin's history does not fit together (#24 vs #48/#49)
- **What:** In #24 Nubbin is chased through Mossy Wood and carried home through the Burrow Door. His lore says he is
  "the one who first got lost above ground". In #48 he is the mole who has saved Basil's ball from the sprinkler
  "every evening at seven" under the ninth green, which Thrift says has been "a year now", and he apologises to Basil
  without any sign that he knows the player who carried him home. In #49 Tumblesoil says "This door has not been shut
  since you carried him home", yet nobody mentions that he was living under Hedgeworth in between.
- **Where:** `m48-the-groundskeepers-secret-mid/-outro`, `m49-loamdeep-intro`, `docs/lore/entries/apocrypha/nubbin.md`.
- **Why it matters:** This is the player's one friend among the Burrowfolk, and the reunion is missing. It is a free
  warm beat lost, and lore readers will notice the timeline.
- **Proposed fix:** Make the ninth-green family Nubbin's *cousins* (the Sifts' Hedgeworth branch). Nubbin comes up in
  the #48 mid to speak for them ("If you please, sir. It was my cousin Pim, and I am very sorry about your ball."), and
  he bows to the player first ("Most kind, again."). Alternatively keep Nubbin as the ball-saver and add one #48 line
  that explains it ("He runs the post up here. That is how he got lost, the first time."). Update `nubbin.md` either
  way.
- **Severity:** polish · **Type:** craft

### 4. The mole family is moved to Thrift's shed in #48, then evacuated from the ninth green in #52
- **What:** #48 drives "the mole family" from the ninth green to Thrift's shed so that Basil cannot trap them. In #52
  p2 Peony says "the moles are under my ninth", and the player drives "Tumblesoil and the ninth-green family" off the
  green to the Burrow Door. The `sq-hedgeworth-ninth-green` unlock (after #50) is also about "Thrift's moles under the
  ninth green".
- **Where:** `quests/story/48-*.ts`, `52-*.ts` p2 objective 0 and comms; `quests/unlocks.ts` line 100.
- **Why it matters:** This is a small break in continuity, but it sits in the act's turn.
- **Proposed fix:** Add one line in the #52 p2 intro: Thrift says "They went home to the green when Basil made his
  peace." Or have p2 pick them up at the shed (it stands by the ninth anyway) and change the objective text to match.
- **Severity:** nit · **Type:** craft

### 5. The four-parts logic has holes at the turn
- **What:** Ragwort says "The Combine charges at nought percent" (#41) and the lens is taken (#46), yet the deck runs
  and cuts a straight line in #52 with no word on how. The "money part" is only *photographed* in #50, yet the #52
  outro says "And stopped three." Nothing explains how a photograph stops funding.
- **Where:** `m41-pinwheel-ridge-outro`, `m50-*-outro` caption, `m52-the-test-cut-outro` (Tansy/player), outline act
  3 intro.
- **Why it matters:** The act's whole question is whether the parts can be stopped. If the machine runs anyway with
  no explanation, the player's last ten quests feel pointless rather than tragic. "Nothing works" lands harder when the
  reason is stated.
- **Proposed fix:** Two lines. In the #52 p1 mid, Vesper tells the Countess "The deck needs no ridge and no lens for
  one night. Little flags will do." The survey flags are already in the scene, so this pays them off. In the outro,
  replace "And stopped three." with "And cost him three." Have Juniper's #50 outro caption or #51 comms say what the
  photo will do in act IV (it pays off in #65 *The Countess Relents*).
- **Severity:** polish · **Type:** craft

### 6. Four disguises in one act, and none of them is worn in play
- **What:** The plain cap over the hat (#39), the faculty gown (#46 p1), the waiter outfit (#50) and the caddy bib
  (#52 p1) are all text and cutscene only. Each of those quests sets `hoa: 'off'`, so there is also nothing to hide
  from. #50's outro dresses the player in a `WAITER` look in the cutscene, but play shows their normal gnome.
- **Where:** `39-couch-surfing.ts` obj 0; `46-*.ts` p1; `50-*.ts`; `52-*.ts` p1; E21 known gaps (waiter outfit).
- **Why it matters:** The same device used four times with no change to how the game plays starts to feel cheap, and
  "Gown on, hat in" on a checkpoint label is a promise the player can see is not kept.
- **Proposed fix:** Use the gnome package's own hook (`setEquipmentOverride`, as AGENTS.md prescribes) to wear each
  disguise during its objective: a head override for the plain cap, a back override for the gown (the `faculty-gown`
  prefab already exists as the Sugar Landlord reward), a neck or back override for the bib, and the tray as a held
  item. Clear the override on completion. Where a quest has no stealth, reword it so it doesn't claim to ("Ride in
  quietly").
- **Severity:** polish · **Type:** craft

### 7. Text promises things the game does not do
- **What:**
  - #37 outro and doneText: "The Woolly Sock Lodge is the crew's base now: a bed, a wardrobe, a door the plows cannot
    find" / "Bunk, wardrobe... This lodge is yours." There is no save point, wardrobe or marker.
  - #45 doneText: "A Rootwell student badge on your hat: the quad gates open by day." There is no badge and no gate.
  - #45 doneText: "The Anthill is marked on your map". `STORY_MARKS` has no `m45` row.
  - #38's four part markers ("The power: Pinwheel Ridge", ...) stay forever: they never change to cut or taken as
    each part is done.
  - The outline's "Driftwood's hut as a save point" and "Tansy's culvert as a save point" are not stated in text, so
    those are fine. The dirt bike was fixed by E22 (the `impound-knobbly` grant).
- **Where:** `37-snowdrop-slope.ts`, `m37-...-outro`, `45-rootwell-admissions.ts`, `quests/storyMarks.ts`.
- **Why it matters:** When the doneText describes something that isn't there, the player stops trusting the doneText.
- **Proposed fix:** Register the lodge as a home through the same `registerHome` path the wind-farm hut uses (save
  and sleep), or else reword to "a bunk whenever you pass". Add the missing `m45` marker (the Anthill). Have the part
  markers update their labels as each part is done ("Power: cut", "Guidance: taken", "Money: on film", "Deck: tested
  (not stopped)"). Reword the badge to something cosmetic, or grant the mortarboard as a head item.
- **Severity:** polish · **Type:** craft

### 8. Characters say the word "Previously:" out loud
- **What:** 14 of the 18 act III briefings open with the literal label "Previously:" inside a character's line:
  Gentian's "Previously: you have a bunk and no plan."; Saxifrage's "Previously, I foretold the Even Cut."; Betony's
  "Previously: Captain Bilge flies your flag." (she has never met you, and could not know about the flag); Juniper's
  "Previously: Granny's Dew went west...". The rule in `_quest-common.md` asks for a one-breath recap "in the speaker's
  voice", not a narrator's label. Acts I-II and IV do the same (less often), so G10 and G12 should agree a single fix.
- **Where:** comms step 0 of rows 37-40, 43-46 (twice), 48-51.
- **Why it matters:** It breaks the fourth wall in every briefing, flattens every voice into the same opening, and
  sometimes hands a character knowledge they cannot have. That works directly against "dialog is written in such a
  way that player has enough context" being done by characters.
- **Proposed fix:** Rewrite each as an in-voice recap: Gentian: "Up, up, up! You have a bunk. Now you need a plan."
  Betony: "I hear a pirate flies your colours. Good: I need someone who does odd things." If a mechanical recap is
  wanted, show it as a separate journal "Previously" line (the spine already asks for one) or a briefing header.
- **Severity:** polish · **Type:** spirit

### 9. Every briefing ends on a price, in the speaker's voice
- **What:** Almost every step-0 brief closes with the reward amount: "Two hundred fifty acorns", "Six hundred fifty
  acorns", and Peony, fleeing a giant mower, saying "Seven hundred and fifty." Betony's "Two hundred and fifty acorns,
  as I was saying." turns her trait into a price tag.
- **Where:** comms of every row 36-53 (`kit.ts` `brief`).
- **Why it matters:** It is a mechanical line inside the most character-revealing slot of every quest, and in #52 it
  cuts the tension of the act's climax.
- **Proposed fix:** Show the reward in the briefing UI (or a chip), and keep it in dialogue only where paying is
  part of the character: Sal's sock bargains, Samphire's "No questions, some invoices", Chanterelle's fines.
- **Severity:** polish · **Type:** spirit

### 10. Everyone speaks in one register; Pip has drifted off his bible
- **What:** Of 390 spoken lines in act III scenes, 17 (4%) use a contraction; acts I-II use them in 11%. Pip's bible
  voice is "fast, run-on, exclamation marks... a second sentence that undoes the first", but his 43 act III lines have
  2 contractions and 7 exclamations ("It is counting.", "They are letting us up.", "I am not poking. I am
  encouraging."). Thrift borrows Peony's "my dear" (four times) and Nubbin's "if you please". Vesper's signature in the
  bible is "no contractions", and it stops standing out when the whole cast avoids them.
- **Where:** all act III scenes; `characters.md` voices for Pip, Thrift, Vesper.
- **Why it matters:** When voices blur, the cast starts to read as one writer, the opposite of "hand crafted".
- **Proposed fix:** A voice pass per character against the bible. Pip gets contractions, run-ons and self-undoing
  second sentences ("I'm not scared of ants! I'm a bit scared of ants."). Driftwood gets his sea-words-for-land tic
  (none in #43/#44). Lulu laughs first. Thrift goes gruff ("They're no trouble, the little ones"), with "my dear" left
  to Peony. Vesper stays the only one with perfect grammar.
- **Severity:** polish · **Type:** craft

### 11. Bible sample lines reused word for word, until they become catchphrases
- **What:** Many bible example lines appear verbatim and are then repeated: Ragwort "Naturally the hard ones" / "Torque
  is a mood. Mind the mood." ("Naturally" 4 times, "Mind the mood" 3 times); Clary "Go on, then" 4 times and "The berm
  remembers" 3 times in two short scenes; Saxifrage "so it is stood" 7 times; "Mind the..." 16 times across at least
  nine speakers; "my dear" 17 times; Basil "champ" 7 times; Lovage "We must be mindful of the optics, and of the quad";
  Samphire "Everything on this ship is a lie... except the smuggling"; Marram "Step up, pet! The whole sea for two
  acorns!"; Tumblesoil "We dig where we are asked"; Wally's stall speed (said twice in one quest).
- **Where:** `m41`, `m42`, `m51`, `m52`, `m45`, `m44`, `m43`, `m49`, `m46` scenes and comms.
- **Why it matters:** A tic used once is character; used in every scene, it replaces the character. The bible lines
  were meant as samples, not a script.
- **Proposed fix:** At most one signature tic per scene per character, and no bible line used verbatim more than once
  in the game. Write new lines in the same voice. Give "Mind the..." to one character (Theo or Tansy) and cut it from
  the rest.
- **Severity:** polish · **Type:** craft

### 12. "Eleven" everywhere
- **What:** Tansy was gone "Eleven days"; the ants were unpaid for "eleven days"; Nubbin's post is "Eleven days late";
  Old Spin stalled "eleven years"; Chanterelle fines "Eleven bruised caps... Eleven acorns each". The number appears
  16 times in act III.
- **Where:** `m39` outro, `46-*.ts` bulletin, `m49` intro, `m41`, `m40` outro.
- **Why it matters:** Players will read it as a deliberate clue that leads nowhere.
- **Proposed fix:** Keep Chanterelle's eleven (it is her bible line) and Tansy's eleven days. Change the rest (nine
  years, a week late, and so on).
- **Severity:** nit · **Type:** craft

### 13. Betony is both barred from Rootwell and its faculty
- **What:** In the #45 intro Betony says "Rootwell no longer admits me. Enrol as a mature student." In #46 p1 the
  Dean greets her as "Professor Sextant. Out late. With a colleague?", she lends a *faculty* gown ("Faculty walk the
  quad at night"), and she is in the library in #45.
- **Where:** `m45-rootwell-admissions-intro`; `m46-...-p1-intro`.
- **Why it matters:** The premise of #45 (why the player must enrol) falls apart one scene later.
- **Proposed fix:** Make it "Rootwell no longer lets me near the observatory. The Dean signs the keys." She keeps her
  rooms and her gown, the Anthill is what she is barred from, and the work order under the lens pays this off.
- **Severity:** polish · **Type:** craft

### 14. #46, the act's extended set piece, ends on foot
- **What:** The outline's finale is "fly out with Wally". The build ends with a visit to "Wally's chair by the
  Field's tower", and Wally flies in a 3-line, 24.8 s outro. Nobody from the act (Pip, Betony) is in it, and "Going
  home" never says where home is.
- **Where:** `46-starfall-at-the-anthill.ts` final, objective 2; `m46-...-outro`.
- **Why it matters:** The mid-act set piece's release should be the player's moment. Driving off Dean's Leap is
  great; then walking to a chair undercuts it.
- **Proposed fix:** Let the player fly. Plane quests already exist: take off from Rootwell Field with Wally in the
  second seat on the radio, and reach one air checkpoint over the Anthill (the dome open below, W12) before the
  outro. Give the outro one more beat: Wally asks "Where to, kid?" and the player answers "The lodge."
- **Severity:** polish · **Type:** spirit

### 15. The #50 heist has no stakes
- **What:** "Trellisdown Tasting" is visit, visit (interior), inspect, visit, with `hoa: 'off'`. The ledger lies open
  on a lectern on the forecourt (the fallback for the study that was never built), and Chicory only stops you in a
  cutscene. The infiltration has no way to fail.
- **Where:** `quests/story/50-trellisdown-tasting.ts`.
- **Why it matters:** Tension 7 is the second-highest beat of the act, and it plays like a museum visit. "Special
  scripted stuff" was asked for here.
- **Proposed fix:** Keep it light, but add one real constraint. Either a "keep the tray level" carry (a damage limit
  on the tray, as the #51 roller uses a low `maxDamage`), or a timed photograph while Chicory's lantern circles. Stage
  the ledger on a guarded side table under the terrace awning rather than on a public lectern.
- **Severity:** polish · **Type:** spirit

### 16. Night scenes are too dark to read, including #50's key frame
- **What:** In `m50-trellisdown-tasting-mid` the Countess's intro card plays over an almost black frame (her
  silhouette only), and the shot where Vesper turns to the player, the act's emotional fulcrum, is unreadable dark
  blue. In `m44-the-bathtub-queen-outro` Samphire's close-up is a black face, and the `m39` culvert reunion is very
  dark. It was also raining in both the m39 and m44 runs (random weather, not pinned).
- **Where:** `shots/G11/m50-trellisdown-tasting-mid-20.png`, `-28.png`; `m44-the-bathtub-queen-outro-28.png`;
  `m39-couch-surfing-outro-30.png`.
- **Why it matters:** An intro card over a black frame introduces nobody, and the first-look beat is the reason #50
  exists.
- **Proposed fix:** Add key lights for night scenes: the scene's props already include lanterns and lamp posts, so
  give the forecourt and the Queen's deck a warm practical light and a fill on faces in mcu/cu shots. Pin `weather`
  for sincere scenes. Coordinate the shared lighting fix with G9.
- **Severity:** blocker · **Type:** craft

### 17. The Test Cut's turn plays over empty frames, and the deck has no scale
- **What:** In `m52-the-test-cut-p2-intro` the frame at about 24 s is solid flat orange (the camera is in the sky or
  inside geometry) at the moment the first blade should rise over the hedge. In `m52-the-test-cut-outro` Vesper's
  "Friends of Turfton... A date, for your calendars." plays over an empty night-sky frame. In
  `m52-the-test-cut-p2-outro` the deck is a small brown box with two knobs, far off among reed tufts, and reads like a
  toy. In the p3 outro, "It didn't even slow down." is a close-up of the back of Pip's head, with no deck in frame.
- **Where:** `shots/G11/m52-the-test-cut-p2-intro-24.png`, `m52-the-test-cut-outro-26.png`,
  `m52-the-test-cut-p2-outro-24.png`, `m52-the-test-cut-p3-outro-18.png`.
- **Why it matters:** This is the act's peak (tension 8), and the machine the whole game builds toward has to look
  enormous and wrong. The user asked for "new vehicles for cutscenes... special scripted stuff", and this is the
  scene that most needs it.
- **Proposed fix:** Re-block the reveal as a low angle from the ninth green, with the deck rising over the hedge to
  fill the top of the frame (scale the `combine-test-deck` set piece 3-4x and let its blades turn). Put the loudspeaker
  horn and the crew in the broadcast shot, so "the longest day" is heard over faces. In the p3 outro, frame Pip in
  front of the passing blades. Run `?cutscenecheck` for occluders and re-shoot.
- **Severity:** blocker · **Type:** craft

### 18. Key close-ups show the back of the speaker's head
- **What:** Several mcu singles are framed from behind and above, so the speaker's face is turned away on their most
  important line: Ragwort's "All ten. I forgot how loud that is." (m41 outro), Driftwood's "Six months I said it was
  real." (m43 outro, the sincere beat), Pip's "...It didn't even slow down." (m52 p3 outro), and Wally's intro card
  (the back of his cap, seen from above).
- **Where:** `shots/G11/m41-pinwheel-ridge-outro-18.png`, `m43-saltbucket-boardwalk-outro-24.png`,
  `m52-the-test-cut-p3-outro-18.png`, `m46-starfall-at-the-anthill-outro-20.png`.
- **Why it matters:** Sincere beats need faces. The cutscene report cannot catch this.
- **Proposed fix:** For singles whose subject faces a third point (the sea, the ridge, the deck), move the camera to
  the subject's facing side (`toward` the subject's look target, not the listener). Re-shoot Wally's card at eye
  level. Also, in the m52 p2 intro, Thrift's held tool crosses his face.
- **Severity:** polish · **Type:** craft

### 19. Objective variety thins out in the ally run
- **What:** #45 is four visits in a row (drive, cross, find, follow). #38 and #47 are visit-heavy, and #43 is visit,
  probe, probe, visit. Across 36-53 there is one race (#40), one dirt race (#42), and no chase except a cutscene-only
  gunboat in #44 (the outline's "outrun the HOA gunboat" is only `steal-deliver`).
- **Where:** `45-rootwell-admissions.ts`, `44-the-bathtub-queen.ts` obj 2, `38-pail-pond.ts`.
- **Why it matters:** The middle of the act sags in play even where the writing is good.
- **Proposed fix:** Make #44's run home a real pursuit: an HOA gunboat as a traffic chaser using the boat kinds that
  already exist, or at least a timer. In #45, turn "cross the quad with your cap down" into a short checkpoints route
  away from the Dean's line of sight, like the #46 p1 shape.
- **Severity:** polish · **Type:** spirit

### 20. #53, the act's closer, is thin
- **What:** The title is still "Volatile on Ice" (the old quest's volatile cargo), but the cargo is now a stone.
  Loam's brief repeats news the player heard one scene earlier ("Vesper named the day"). Nobody says what the Stopping
  Stone stopped, or why lending it matters now (the context sits in act II's ch2d). The tundra-outro chapter close is
  39.7 s against an aim of 40-80, and it ends on Pip's "Then we don't drive."
- **Where:** `53-tundra-drift-run.ts`, `ch3c.ts`.
- **Why it matters:** The coda is the last thing the player sees of act III.
- **Proposed fix:** Retitle it (e.g. "The Stopping Stone"). Have Bracken say in one line what it stopped ("The last
  machine that came for the Unmowed met this, and turned round."). Replace Loam's repeat with a reaction ("The whole
  Fells heard it, my child."). Add one closing beat in the tundra outro: Tansy looks at the overlook and says, with her
  stress tell, "I need a coffee." (her chicory coffee is allowed twice in the game).
- **Severity:** polish · **Type:** craft

### 21. Side quests contradict where people are, and two outline unlocks are missing
- **What:** Tessie unlocks after #40 with Driftwood waiting "on the Loch Moss shore". From #43 he lives at the Last
  Tube, so if Tessie is left undone he stands in two places. `sq-hedgeworth-ninth-green` (after #50) has the moles
  under the green (see finding 4). The outline's `sq-pinwheel-linemen` (#42) and `sq-trellisdown-pickers` (#51) were
  never built, so those rows open nothing.
- **Where:** `quests/unlocks.ts` 85, 100; `tessie.ts`; E21 roadmap "Not built".
- **Why it matters:** These are small breaks in the "world reacts to the story" feel.
- **Proposed fix:** Hide the Loch Moss Driftwood once #43 is done and move the Tessie giver to the Last Tube ("Saw
  her from the sea, friend"). Fix the ninth-green "why" text. Either build the two missing side quests or record a
  reasoned deferral in the tracking doc.
- **Severity:** polish · **Type:** craft

### 22. World changes are one beat late or missing their half
- **What:** W11 ("Tubes: they float") fires after #44, though the Last Tube opened in #43 ("The Last Tube is open").
  W13's root stall on Bodega's street has no mention in #49 (Tumblesoil never says the Burrowfolk will trade topside).
  W14 builds only the Hedgeworth scar, not the Wader's Rest side (the empty plinth where the Standing Lady stood).
- **Where:** `worldChanges/defs.ts` W11, W13, W14; `worldChanges/rows/mownScar.ts`.
- **Why it matters:** The user asked for players to "feel connected to the world". Changes that arrive late or
  without a story reason connect less.
- **Proposed fix:** Move W11's hut board to `after: m43` and keep the Queen's flag on m44. Add one line in the m49
  outro: "Roots for the market, now we're asked". Build the empty Lady plinth at Wader's Rest for W14 (one prop and
  the Flock facing it).
- **Severity:** polish · **Type:** craft

### 23. Gentian speaks on comms before she is introduced
- **What:** `m37` comms step 2, "Take the lodge door! I will hold the gate.", plays before the outro where her intro
  card appears. The player hears a stranger called "Gentian" giving orders.
- **Where:** `37-snowdrop-slope.ts` comms 2; `m37-snowdrop-slope-outro`.
- **Why it matters:** This is a direct gap against L105: intros at the right time, so the player knows who is talking.
- **Proposed fix:** Give that call to Pip ("A lady at the lodge door is waving a flag at us!"), or move Gentian's
  card to the `-mid` scene with a long shot of her at the gate.
- **Severity:** nit · **Type:** craft

### 24. Lines that assume context the player doesn't have
- **What:** Lulu's "Your Cam took one home. Read my plate all night, once." (#40) is too elliptical to connect to
  #5/#34. Peony's "Your radio says the Combine's deck will be tried here." (#47 brief) refers to a radio the player
  never mentioned to her. Clary's "East, past the campus." (#42) comes before the player has seen Rootwell.
- **Where:** `m40-the-capwood-run-intro`; `47-hedgeworth-links.ts` comms 0; `42-rutbottom-impound.ts` comms 0.
- **Why it matters:** The user asked for "enough context".
- **Proposed fix:** Lulu: "Your friend Cam signed one. Stared at my plate all night first." Peony: "Vesper's letter
  says her deck will be tried here." Clary/Lulu: "East, past the university."
- **Severity:** nit · **Type:** craft

### 25. Driftwood contradicts himself between briefing and scene
- **What:** The #43 brief says "I saw the glow and could not cross. Friend, I crossed." The intro then has the player
  ask "You crossed the dunes?" and Driftwood answer "Only to the edge."
- **Where:** `43-saltbucket-boardwalk.ts` comms 0; `m43-saltbucket-boardwalk-intro`.
- **Why it matters:** The sincere payoff depends on exactly what he did.
- **Proposed fix:** Brief: "Friend, I made it to the edge." Keep the scene as written.
- **Severity:** nit · **Type:** craft

### 26. Pinwheel Ridge numbering and counts disagree
- **What:** Ragwort says "The cable at the first" (the first of Old Spin, Sulks and Whirly Bob), but the objective
  says "Old Spin, the second pinwheel". She says "Ten pinwheels. Not one turning" and "All ten" at the end, though only
  three were re-cabled, and the scene never says why the other seven stood still.
- **Where:** `m41-pinwheel-ridge-intro/-outro`; `41-pinwheel-ridge.ts` objectives.
- **Why it matters:** This is a small confusion during a navigation step.
- **Proposed fix:** "The cable at Old Spin, second on the ridge." Add one line: "One cable on three, and the
  governor stops all ten. Naturally."
- **Severity:** nit · **Type:** craft

### 27. Juniper's call: who called whom?
- **What:** The giver says "Answer Juniper's call", but in the scene Juniper's phone rings twice and she answers
  "Vance." ("You sound underground."), which reads as the player calling her.
- **Where:** `50-trellisdown-tasting.ts` giver `juniper-call`; `m50-trellisdown-tasting-intro`.
- **Why it matters:** This is a staging nit, but this kind of thing is what makes scenes feel hand-made.
- **Proposed fix:** She dials instead: the pencil stops, she picks up the receiver and says "It's Vance. You sound
  underground. Good."
- **Severity:** nit · **Type:** craft

### 28. Time-of-day continuity in #37-#38
- **What:** The m37 intro is golden (Theo: "not safe past morning"), the mid and the outro are both noon (the outline
  has the outro at night, with Gentian showing "the bunk room"), and the m38 intro is noon again. Nights in a bunk
  never happen on screen.
- **Where:** `m37-snowdrop-slope.ts` skies; `m38-pail-pond.ts`.
- **Why it matters:** The "warm 4" rest beat of the act is a bunk at night, and it reads warmer at night.
- **Proposed fix:** Make the m37 outro `night` with a lit stove, and make the m38 intro a morning (`golden`).
- **Severity:** nit · **Type:** craft

### 29. The player's lines break the "straight man" rule in sincere beats
- **What:** The bible caps the player at one line in three of any exchange, at two to six words. The #43 outro
  alternates 1:1 ("It is real." / "The glow?" / "And tomorrow?"), and in the #47 intro the player argues in full
  sentences ("It will cut everything. Every lawn.").
- **Where:** `m43-saltbucket-boardwalk-outro`, `m47-hedgeworth-links-intro`.
- **Why it matters:** The player as a quiet audience surrogate is part of the game's tone.
- **Proposed fix:** In #43, cut "And tomorrow?" and let Driftwood carry the line alone. In #47, give "every lawn" to
  Peony as the thing she refuses to hear.
- **Severity:** nit · **Type:** craft

### 30. The Flock's "so it is stood" swamps Saxifrage
- **What:** Seven uses of "so it is stood" in two short scenes and their comms, sometimes twice in a row ("On one
  leg. One is plenty. So it is stood." then "So it is stood." on the next line).
- **Where:** `m51-the-flock-stands-intro/-outro`, `51-the-flock-stands.ts` comms.
- **Why it matters:** #51 is meant to be the act's gentle laugh. The ritual is funnier when it is rare.
- **Proposed fix:** Twice per scene at most. Let Brother Godwit's question and "Each other, Brother" carry the
  warmth (a good beat as written).
- **Severity:** nit · **Type:** craft (a sub-case of 11, kept separate because #51 is a laugh beat)

### 31. Pip's whereabouts between #39 and #53 are never explained
- **What:** Pip moves onto the couch (#39, W09), turns up at the Anthill door (#46 p2) with no setup, stays there
  ("Somebody has to carry the sugar"), arrives at Hedgeworth with Tansy (#52), and is at the Fells basin for #53.
- **Where:** as listed.
- **Why it matters:** This overlaps finding 1. Listed separately so the fix round can also handle it with one line
  per scene if finding 1 is decided narrowly.
- **Proposed fix:** One line each: #46 p2 ("Tansy sent me on the Snail-Coach"); #52 p3 is already covered; tundra-intro
  (Pip: "Bracken made me carry the scarf").
- **Severity:** nit · **Type:** craft

### 32. Act III has no on-screen reckoning with the Salvage Raid losses
- **What:** The act opens with "Side-Valve is seized, the Golden Acorn is gone" (#35/#36). After Pip's "My hammock is
  evidence" in #39, neither the Acorn nor the bay comes up again in act III. Tansy's reunion skips the bay entirely,
  even though losing "the place she built" is her bible fear.
- **Where:** `m39-couch-surfing-outro`; the act's scenes generally.
- **Why it matters:** Tansy's arc ("never raises her voice until act III") needs its act III moment, and this is
  where it should be.
- **Proposed fix:** Give Tansy one raised-voice beat about the bay, either in the #39 culvert after the hug ("They
  chained my bay. MY bay.") or at the #52 hedge. That would be her one break in act III.
- **Severity:** polish · **Type:** spirit

---

## Notes for the decider (spirit items)

1, 8, 9, 14, 15, 19 and 32 are spirit calls. All of them keep the satire and the residents as they are. They ask for
the crew to be present, for less mechanical framing in briefings, and for the two set pieces (#46, #50) to be played
rather than watched. None of them rewrites a system. Finding 8 ("Previously:") and finding 9 (prices in dialogue)
also affect acts I-II and IV, so the decision should apply to the whole story.
