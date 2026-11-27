# G10 Story acts I–II: editorial review, round 1

Editor: G10 (main quests #1–#35, their scenes, comms, intro cards and the side quests unlocked on those beats).
Branch `gta-batch-3` at 0db911aa. Read: every quest def and comms line for rows 1–35 (`quests/chapter1.ts`,
`chapter2.ts`, `comms.ts`, `quests/story/02..35`, `glazeQuests.ts`), every scene in `cutscene/scenes/story/` for those
rows (ch1, ch1b–d, ch2, ch2b–d, ch3, ch3b, m02–m35), `unlocks.ts` rows for acts I–II, against the spine, the outline,
the character bible, `direction/batch-3-notes.md` (ladders, context rule) and the lore rulings (R-166, R-2xx act I–II
ruling). `npm run cutscene-report`: Story A/B 0 faults. Dev server `:5410`, headless Edge, `?cutscene=<id>` frames in
`shots/G10/` (paths below are relative to this folder). Not done: a full playthrough on a save, a real phone.

## Verdict

The cast is the best thing in the game, and these two acts mostly earn it. Reginald at home with the photograph (#12),
the spelling correction and Juniper's first laugh (#28), Nubbin under the log (#24), the knot-hole (#26), Granny's
silo (#31) and "Of course, Cameron." (#34) are hand-crafted scenes with real character in them; the comedy keeps the
old charm (Lou's "Hat.", Gary's sighs, Rooster's capitals, Hedda's telegrams). Voices match the bible almost
everywhere.

The problems are structural, and they cluster at the two act turns, which is where the user will look hardest:

- **#15 is told backwards**: the player fetches the keys and rehearses a plan that is only proposed in the final.
- **Founders' Green exists before it is founded**, so the act I climax rezones a park the player has been skating in.
- **#35 spends its reveal twice** and contradicts #33 about who knew the code.
- **Pip's first sincere beat (#14) is shot through the back of the player's hat.**

Below those: promises the game does not keep (the jammer, the key in flat 3B, the penthouse), a few continuity slips
(#4, #12, #28, #31), and two habits that wear the writing thin over 35 rows: every briefing ends with its fee, and
act II becomes a taxi service (four of the last five rows before the raid are passenger runs).

Counts: **4 blockers, 22 polish, 5 nits** (31 findings). 25 craft, 6 spirit.

## Findings

### 1. #15 Founder's Boot is told in the wrong order
- **What:** p1 (Parade Permits) has the player steal the Boot float's keys, and p2 (Dress Rehearsal) rehearses driving
  it, but nobody has said why. The plan ("We steal the Boot and park it in the jury box." / "...Yes.") and the news
  of the tribunal ("Vesper has called an emergency HOA zoning tribunal") arrive only in the final's intro
  (`founders-boot-intro`, ch1d.ts), after the player has already done two parts of it. Hedda has already headlined the
  tribunal in p1 ("Tribunal. Trim Day. Crowd barred."), so Tansy announcing it as news later reads as a repeat. The
  stakes are never said: what does the tribunal decide? The charges are "unlawful grass", the outro rezones "three
  condemned blocks" nobody mentioned, and the done text says "Tansy's deed is stamped" (her deed was recovered in #8).
- **Where:** `ch1-founders-boot-p1` comms 0 and `parade-permits-intro` (m15-founders-boot.ts); `founders-boot-intro`
  and `founders-boot-outro` (ch1d.ts); doneText in `quests/story/15-founders-boot.ts`.
- **Why it matters:** this is the act I turn and one of only two extended quests in this group. The context rule
  (why now, what is at stake) fails on all three parts, and the user asked for exactly this context.
- **Proposed fix:** move the plan to the front. `parade-permits-intro` opens on Tansy with the Tattler: Vesper's
  tribunal on Trim Day will condemn three blocks (name them: the court and the skate bowls the player has used, see
  #2). Pip: "Okay, hear me out." The Boot in the jury box. Tansy: "...Yes." Then Hedda and the keys. The final's intro
  keeps only the parade and Reginald's charges (cut the bay beat). Done text: "Tribunal adjourned. Three blocks saved
  as a park, and Vesper knows your hat." Drop "Tansy's deed is stamped".
- **Severity:** blocker · **Type:** craft

### 2. Founders' Green is on the map, in hints and bulletins before #15 creates it
- **What:** #15's payoff is Juniper rezoning "three condemned blocks" as Founders' Green (W03). But the map blip says
  Founders' Green from minute one (`mapPois.ts` from `parks/blocks.ts`), #9's hint is "The Gutter Bowls, Founders'
  Green", #14's bulletin says "the politest upset in Founders' Green", `sq-court-regulars` (unlocked after #14) says
  the court is in it, and the court runtime toast says so too. Nothing ever shows the blocks as condemned.
- **Where:** `quests/story/09-where-asphalt-sleeps.ts` (hint), `14-drainpipe-court.ts` (bulletin), `unlocks.ts`
  (`sq-court-regulars`, `sq-gutter-bowls-sessions` why), `mapPois.ts`, `court/runtime.ts`; W03 in
  `worldChanges/rows/greenAndBarn.ts`. G1 found the same from the world side.
- **Why it matters:** the act I climax "creates" a park the player has played basketball and skated in for six
  quests, under that name. That kills the payoff and the stakes of #1.
- **Proposed fix:** before `ch1-founders-boot` is done, call the place "Gnorwin Park and the condemned blocks" (map
  label gated on W03, hints "The Gutter Bowls, behind the HOA hoarding"), put HOA CONDEMNED notices on the court and
  bowls (W03 already removes them), and give #9 and #14 one line each that plants it (Fennel: "They want the bowls
  flat by Trim Day."; Swish: "Last season, chief. Then it's a car park."). The rezoning then saves places the player
  cares about.
- **Severity:** blocker · **Type:** craft

### 3. #14's sincere beat is hidden behind the player's hat, in near darkness
- **What:** in `drainpipe-court-outro` the close-up for "A Potsworth gets a stool and a ledger. Mine had my name on
  it." is `PIP_PLAYER.single('pip', 'cu')`, and the player's hat fills the frame; Pip is invisible
  (`shots/G10/drainpipe-court-outro-28.png`, `-31.png`). The scene is at night and the other singles are almost black
  (`-25.png`).
- **Where:** `cutscene/scenes/story/m14-drainpipe-court.ts` line ~158 (and the `sky: 'night'` choice).
- **Why it matters:** the bible and the direction notes call this the first sincere beat of the game. The
  cutscene report passes it because it does not test occlusion by the player.
- **Proposed fix:** shoot the cu from Pip's other side (or `side`/`height` so the player is out of the cone), and play
  the scene at `golden` dusk with the court lamps coming on at the end, as the comment already describes.
- **Severity:** blocker · **Type:** craft

### 4. #35 spends the betrayal twice and contradicts #33 about the code
- **What:** `ch3-salvage-raid-p2-mid` ends with Tansy working it out: "Two of us had the number." Pip: "I never wrote
  it down." Tansy: "Three." Then the final's intro (`salvage-raid-intro`) plays the reveal again: Pip "...Cam?",
  Tansy "How much?". And #33 said the opposite: "The code is mine. Not yours, not Pip's. Not the broom's."
- **Where:** `cutscene/scenes/story/m35-salvage-raid.ts` (p2-mid), `ch3.ts`, `m33-the-bench-lock.ts` (outro).
- **Why it matters:** this is the act II turn and the lowest point of the game. The audience gets the answer a scene
  early, and an attentive player catches Tansy contradicting herself.
- **Proposed fix:** keep Tansy's rule from #33 ("Mine. Nobody else's."). End p2-mid on pictures only: the open
  shackle, the cot, the bare wall where the broom stood, and Tansy's face (no "Three"). Let the van door and Cam's
  broom carry the reveal in the final. If a line is wanted: Tansy, to herself: "Nobody else had it."
- **Severity:** blocker · **Type:** craft

### 5. Vesper "does not negotiate twice", then invites the player to a viewing the next quest
- **What:** #20 ends on "A pity. Porcelain does not negotiate twice." and an ambush. #21 opens with Vesper's card at
  the player's own door ("There are no conditions.") and the player goes, with nobody on the crew reacting to the
  ambush, the card or the address.
- **Where:** `vesper-diner` (ch2b.ts), `m21-penthouse-viewing-intro` (m21-penthouse-viewing.ts), comms 0 for
  `m21-penthouse-viewing`.
- **Why it matters:** motivation for both sides is missing. The player's "He knows my address." is the right note,
  but nothing follows it.
- **Proposed fix:** change #20's line to "Porcelain does not ask twice. It invites." and add one call before the
  gate (Granny or Tansy): "He wants you to see what you said no to. Go. Count the guards. Touch nothing." Vesper's
  card can keep "no conditions"; it is creepier with the warning in front of it.
- **Severity:** polish · **Type:** craft

### 6. "Penthouse Viewing" never shows a penthouse, and the key choice promises a prop that does not exist
- **What:** the tour plays on a rainy street in the Double Pot Tunnel (fallback noted in the quest header;
  `shots/G10/m21-penthouse-viewing-mid-38.png`). The choice's option A says "A key will hang in flat 3B" and Vesper's
  call says "If you take the key, it will hang in flat 3B." Nothing in `interiors/` or `homes/` reads the choice.
- **Where:** `quests/story/21-penthouse-viewing.ts`, `m21-penthouse-viewing.ts`.
- **Why it matters:** two promises the game does not keep, and the user asked for environmental storytelling and new
  buildings. The beige silence of Vesper's world is the point of the quest.
- **Proposed fix:** a small beige interior (one room, E05 kit) for the tour, or at least the lift and a beige
  landing; hang the key on a hook in flat 3B when option A was chosen (a prop gated on the quest's choice), or
  change both lines to say only that the key is yours.
- **Severity:** polish · **Type:** spirit

### 7. "Okay, hear me out" is used seven times in acts I–II
- **What:** the direction notes make it one of the two cheapest ladders: planted at #15 p1, once an act, Tansy lets
  him finish in #54, Tansy says it in #70. It appears in #14 comms and intro, #15 final intro (labelled "Pip's first"),
  #22 banter, comms and intro, #26 comms.
- **Where:** `quests/story/14-…`, `22-…`, `26-…`; `m14-drainpipe-court.ts`, `m22-off-air.ts`, `ch1d.ts`.
- **Why it matters:** the act IV payoff only lands if the phrase is rare.
- **Proposed fix:** keep exactly one in acts I–II, at #15 p1 (see #1). Replace the rest with Pip's other tic, the
  second sentence that undoes the first ("I have never heard of west. I have been west. Once.").
- **Severity:** polish · **Type:** craft

### 8. "Previously:" is spoken aloud, the journal has none, and two recaps point at scenes the player may not have seen
- **What:** the context rule asks for a one-line "Previously" in the journal. The journal (`quests/journal.ts`) has no
  such field; instead seven briefings say it out loud ("Previously: you cracked a lot of hats."). Frank (#29) recaps the
  knot-hole he was not at. Driftwood (#32): "Previously: you hauled my raft to the canal" refers to the side quest
  `sq-castaway-drydock`, which a player can skip (#25 towed the raft to his trailer, not the canal).
- **Where:** comms 0 of #7, #9, #24, #25, #29, #32, #33.
- **Why it matters:** characters reading a system label break voice, and #32 breaks "nothing depends on a skipped
  scene".
- **Proposed fix:** add an optional `previously` line to the quest def and show it in the journal's Active card; turn
  the spoken lines into in-voice clauses ("Last time you brought my raft home. The chart says…"), and fix #32 to refer
  to #25.
- **Severity:** polish · **Type:** craft

### 9. Every briefing ends with its fee, including the sad ones
- **What:** all 28 briefings in rows 2–35 state the reward ("Three hundred fifty acorns, hm."). It lands badly in the
  sincere and crisis rows: Pip's knot-hole (#26, "Tansy says the lift is worth two hundred fifty"), Bramble while
  Granny is cracked (#31), the party (#34, "It pays 400 Acorns"), and the raid (#35 p1 and p2, "Hold the alley. We
  load. Four hundred and fifty acorns."). Odd payers too: broke Cam pays 350 (#30), Sorrel pays for a mole (#24).
- **Where:** comms 0 of `quests/story/02..35`.
- **Why it matters:** it makes friends into clients and flattens the warmest beats; the done card already shows the
  reward.
- **Proposed fix:** keep the fee only where money is the story (#2, #3, #11, #21's "for your time", #16). Elsewhere cut
  it, or let it be a favour ("Granny would say pie." is enough on its own).
- **Severity:** polish · **Type:** spirit

### 10. Pip's radio jammer is never paid off
- **What:** #10 is built around a jammer Pip will not explain ("Birds."). It never appears again except #33, where
  Tansy calls it "our jammer", though Pip hid it from her ("Quick, before Tansy asks what it is").
- **Where:** `quests/story/10-under-the-span.ts`, `33-the-bench-lock.ts` comms 0; the scenes in m10.
- **Why it matters:** a setup with no payoff, and the one continuity slip makes it worse.
- **Proposed fix:** pay it off in #15's final: Pip jams the Hat Watch band so the Boot reaches the jury box (a call:
  "Birds!"), or in #35 p2 (the raiders' radios). Change #33's line to "Hogweed built Pip's mystery box. This time he
  builds something I can see."
- **Severity:** polish · **Type:** craft

### 11. Cam wears the HOA's colours from the prologue
- **What:** Cam's preset is `{ hat: 0xf4f4f8, shirt: 0xc9b99b }`: porcelain white (Vesper's guards) and HOA beige.
  The bible says a drab olive cap, no beard, a chip on one ear, an HOA vest only after #35. So the "HOA vest" at the
  Patio Gate in #21 is no change at all, and the betrayal is telegraphed by costume.
- **Where:** `cutscene/cast.ts` line 59 (`'turncoat cam'`), three scenes with an inline look (ch3.ts and others).
- **Why it matters:** character consistency against the bible, and the act II twist.
- **Proposed fix:** olive cap and a Side-Valve apron; swap to the beige vest for #21's gate scene and from #35 on.
- **Severity:** polish · **Type:** craft

### 12. Nobody remarks that Cam works for the HOA after #21
- **What:** the player sees Cam parking cars at the Patio Gate in an HOA vest (#21; Gary: "New valet. Do not talk to
  him."). From #30 to #34 the crew trusts him with the bench, the code and the party, and nobody mentions it. In #35
  p1 Tansy knows: "He parks their cars at the Patio Gate."
- **Where:** #21 gate scene, #30/#33/#34 comms and scenes.
- **Why it matters:** without one line the crew looks careless, not betrayed.
- **Proposed fix:** one exchange in #30's intro: player "You park cars for Patio Heights?" Cam: "Tips. For the
  entry." Tansy (call, step 1): "Tips are tips. He sweeps here." Trust becomes a choice.
- **Severity:** polish · **Type:** craft

### 13. #12 contradicts #6, and the photograph contradicts itself
- **What:** Juniper says "We last spoke at a funeral" and "We speak only in notices" (#12), but they spoke face to
  face in #6 (`two-coat-outro`: "Reginald. Your boss is a crook."). The photograph note says the taller child (Juniper,
  ten) holds the pencil; Reginald says "She held the ruler. I held the pencil."
- **Where:** `quarter-inch-intro` (m12), comms 0 of `m12-quarter-inch-at-home`, the inspect note in
  `quests/story/12-…`, `quarter-inch-mid`.
- **Why it matters:** the Vance siblings are the act's most careful thread; the ruling says the photograph is never
  a joke.
- **Proposed fix:** "We last spoke properly at a funeral." Make the note match his line (the taller holds the
  ruler).
- **Severity:** polish · **Type:** craft

### 14. #28's "Eleven permits, ten signatures" does not match #7, and the missing signature goes nowhere
- **What:** #7 photographs three permits, all signed "R. Vance". #28 opens on "Eleven permits. Ten signatures. One
  brother." The unsigned one is never mentioned again; the scene is about a misspelled name.
- **Where:** `m28-sibling-rivalry-intro`, comms 0 of `m28-sibling-rivalry`; #7 inspect notes.
- **Why it matters:** a number the player is asked to notice, then dropped.
- **Proposed fix:** either "Three permits. Three signatures. One brother." or pay it off: the one he did not sign is
  the one he "corrected" (his doubt made visible).
- **Severity:** polish · **Type:** craft

### 15. Granny's secret silo is a silo the player has already towed
- **What:** #31's outro tells of her late husband's silo "somewhere nobody counts", but in #18 Granny says "Reginald
  Vance's laser squad wants my acorn silo" and the player hauls "Granny's armored silo rig".
- **Where:** `m31-granny-cracks-outro`, `sprinkler-intro` (ch2c.ts), `ch2-sprinkler-gauntlet` objective text.
- **Why it matters:** the sincere reveal reads as a mistake.
- **Proposed fix:** one clause: "Not the one in the yard, sugar. His." (and "Where is it?" stays unanswered).
- **Severity:** polish · **Type:** craft

### 16. #34's party is for something that happened 19 quests ago
- **What:** Pip: "The Green is open! Rezoned, ours, legal." The rezoning was #15. The bulletin also puts Side-Valve
  "on the rezoned Green" (it is not).
- **Where:** `m34-forty-seven-wrenches-intro`, comms 0, bulletins in `quests/story/34-…`.
- **Why it matters:** "why now" fails on the act's warm high point.
- **Proposed fix:** make it a party for something recent: the Tattler's front page from #28 ("Even-Estates permits:
  printed!"), or the Green's first market day. Fix the bulletin's location.
- **Severity:** polish · **Type:** craft

### 17. Act II turns into a taxi service
- **What:** 15 passenger legs in act II (#22, #26 ×2, #28, #30 ×2, #31, #33 ×2, #34 ×3). Four of the five rows
  before the raid (#30, #31, #33, #34) are mainly "pick X up, drive to Y". "Crack the two X" opens #7, #22, #23, #24,
  #27, #28 and #31. #9 and #10 are back to back "search three spots" in the same alley behind Bodega & Sons.
- **Where:** the objective lists of those rows.
- **Why it matters:** the user asked for variety and for quests that explore the world; the run into the act II
  climax sags.
- **Proposed fix:** #33: Cam rides on the back, the player tows the lock home on Hogweed's trailer through the
  Underspan yard (a checkpoint run), or drop the return leg. #34: one guest arrives by Mabel's cab, Granny drives
  herself and needs escorting past an HOA van, so one leg is a convoy. #10: put the scrap bins at the Underspan
  heaps, not the Bodega alley.
- **Severity:** polish · **Type:** spirit

### 18. The Buck-Iron combine is every job's vehicle
- **What:** steal a combine in #8, flee in "Pip's getaway Combine" in #15, steal a combine in #16, and tow Driftwood's
  raft home behind a combine from Wader's Rest (−1130, −640) to his trailer in Cloverfield (34, 463), about 1.6 km
  (#25).
- **Where:** `ch1-tax-break-in`, `ch1-founders-boot`, `ch2-dew-run`, `m25-one-leg-to-stand-on`.
- **Why it matters:** "Combine" is also the villain's god-machine, so the word blurs, and the user asked for new
  vehicles. The 1.6 km tow is a long slow drive with nothing in it.
- **Proposed fix:** #15 getaway in Pip's Zero-Turn (the vehicle the act ends on in #35); #25 the Flock punt the raft
  across the loch and the player tows it from the loch shore with the barrow buggy, or the drop moves to the canal
  mooring #32 starts from (which also fixes #8's recap).
- **Severity:** polish · **Type:** spirit

### 19. After the Grand Combine reveal, six quests pass without anyone mentioning it
- **What:** #8 ends on "The Grand Combine. A harvester the size of a block. ... A Fescue Golden Acorn." Rows 9–14 (cat,
  jammer, cigars, calipers, diner, basketball) never refer to it, nor does #15. The next mention is #23.
- **Where:** rows 9–15.
- **Why it matters:** light relief is planned (notes: rows 9–11), but nobody reacting makes the threat feel forgotten
  for a third of the act.
- **Proposed fix:** one line in two of them, no new scenes: Frank in #13 ("Something the size of a block came down
  Route South on a low-loader. ...Not nice."), Hogweed in #10 ("Somebody's ordering blades by the thousand.").
- **Severity:** polish · **Type:** spirit

### 20. #5: why can't Cam deliver the part himself?
- **What:** "Why not take it yourself?" "Somebody has to sweep." Then Cam rides to the meet himself. The comms make it
  worse: "Somebody has to sweep. So it has to be you."
- **Where:** `sweepers-wages-intro`, comms 0 of `m05-sweepers-wages`.
- **Why it matters:** the row's whole job is planting Cam's motive; its logic has to hold.
- **Proposed fix:** make it shyness about Lulu: "I cannot hand it to her. You do it. I will show you the way."
  That sets up the stare at her charter plate.
- **Severity:** polish · **Type:** craft

### 21. #30's relay: who loses?
- **What:** the player drives the "support stint" (never explained), `mustPlace: 3`, and the scenes always say Cam
  came last "by a lot". If the player wins their leg, the mid scene contradicts the race just driven.
- **Where:** `quests/story/30-cams-big-night.ts`, `m30-cams-big-night-mid`.
- **Why it matters:** the player's own result is ignored on a quest about someone's big night.
- **Proposed fix:** explain the relay in the brief ("You drive the first leg. I bring it home."), and let the mid
  scene branch on place, or write one line that covers both: Cam: "You gave me a lead. I gave it back."
- **Severity:** polish · **Type:** craft

### 22. #4: three bikes in the scene, two in the quest
- **What:** Tansy: "Three Cloverfield farmers. Three bikes, clamped"; the quest repos two (and Pip's call says "One
  more!" after the first).
- **Where:** `mowers-keepers-intro` (ch1.ts), `ch1-mowers-keepers` objectives.
- **Proposed fix:** "Two farmers. Two bikes." (or add a third repo).
- **Severity:** polish · **Type:** craft

### 23. Chapter cards do not match the acts
- **What:** the cards say "CHAPTER 2 — BLACK DEW & GREENBACKS" and "CHAPTER 3 — COLD CLAY"; the acts are "Turf & Dew"
  and "Cold Clay, Far Edges"; act I has no card. #35 p1 and p2 carry `chapter: 3`, so the journal tags act II's
  finale "Ch.3" before the Chapter 3 card plays.
- **Where:** `dew-run-intro` (ch2.ts), `salvage-raid-intro` (ch3.ts), `founders-boot-outro` ("END OF CHAPTER 1"),
  `quests/story/35-salvage-raid.ts`.
- **Proposed fix:** cards "ACT II — TURF & DEW", "ACT III — COLD CLAY, FAR EDGES", "END OF ACT I"; #35 parts
  `chapter: 2`.
- **Severity:** polish · **Type:** craft

### 24. Side quests unlock before their giver is met, or after the line that promises them
- **What:** `sq-big-lou-embargo` unlocks after #9, but Lou is introduced in #11 ("Red Caps. Downtown. My towels." is
  context-free before then). Sorrel ends #23 with "The Elder has another stone on his mind. Come back for it." but
  `sq-fescue-fugitive` unlocks only after #24, and #24 starts at the Hollow with a different job.
  `sq-windfall-croft-deed` (buying a farm from Bramble) unlocks right on Granny's crack (#31).
- **Where:** `quests/unlocks.ts`.
- **Proposed fix:** move Lou's embargo to `m11-the-dons-cigars`; move the fugitive to `ch2-unmowed-tablet`; move the
  croft deed to `m32-driftwoods-chart`.
- **Severity:** polish · **Type:** craft

### 25. The act I "last bright image" is four gnomes in the rain
- **What:** `founders-boot-outro` wants "the crowd on the tiers"; the frame shows four gnomes, a rope and rain
  streaks (`shots/G10/founders-boot-outro-14.png`, `-34.png`). Rain also falls through #21's tour and the #34 party is
  thin. Scenes do not pin the weather.
- **Where:** `ch1d.ts`, `m21-penthouse-viewing.ts`, `m34-forty-seven-wrenches.ts`.
- **Proposed fix:** a crowd (8–12 extras) on the tiers and bunting for the ribbon; a `weather: 'clear'` override for
  scenes whose mood needs it (G9 owns the mechanism).
- **Severity:** polish · **Type:** spirit

### 26. Pip never says "Fescue" on the bench
- **What:** Pip lies about Fescue twice ("Never been. Is that far?", #1; "Never heard of it. Sounds like a mower.",
  #10). The #14 bench pays it off with "Back home…" and never names the place.
- **Where:** `drainpipe-court-outro`.
- **Proposed fix:** "Back in Fescue, everything is already built." One word; the rest stays half told, as the bible
  wants.
- **Severity:** polish · **Type:** craft

### 27. Generic names clash with the cast
- **What:** HOA Enforcer **Bramble** (#4), HOA Bodyguard **Loam** (#6), Surveyor **Loam** and Bailiff **Mulch** (#18),
  Night-Watchman **Plumb** (#7) and Watcher **Plumb** (#28). Random pedestrians draw first names Sorrel, Yarrow,
  Lovage and Teasel, and surnames Spadewell, Gravelbottom and Dibbler (the three gnomes cracked in #3)
  (`config.ts` `NPC_FIRST`/`NPC_LAST`). "Old Burdock" (court) and Head Ranger Burdock Haybright.
- **Proposed fix:** rename the enemies (Finch/Felt style: Tack, Grommet, Shim…); drop cast names from the NPC pools.
- **Severity:** nit · **Type:** craft

### 28. Units and scale
- **What:** "a thirty-foot boot" (twice, #15 p2) in a game that measures in metres; "the Big Puddle" vs "the Puddle
  Sea" (#32).
- **Proposed fix:** "a boot the size of a shed"; "the Puddle Sea".
- **Severity:** nit · **Type:** craft

### 29. Small context slips
- **What:** #9's call at step 1 is Pip, who is not in the quest, and its brief repeats the scene's "cracked a lot of
  hats". #22: Sorrel wants Pip because "he knows vans", and he does nothing with the van (the real reason, the Elder,
  comes only in the outro). #24: "he is carrying the post" (Nubbin) is unexplained until `sq-burrow-post`.
- **Proposed fix:** #9 step 1 from John; #22 brief: "Bring Pip. The Elder asked for him."; #24: "he carries the
  Burrow's post".
- **Severity:** nit · **Type:** craft

### 30. Formatting of banter and money
- **What:** passenger banter is quoted in some rows ('Cam: "Is this one yours?"', #33) and not in others ('Cam:
  Entry fee was six weeks of tips.', #30; Granny in #31). "acorns" and "Acorns" alternate, sometimes in one brief.
- **Proposed fix:** one style (quoted) and the capitalised currency, as the prologue narrator has it.
- **Severity:** nit · **Type:** craft

### 31. "Tuesday" as a throwaway joke dilutes the betrayal's code word
- **What:** besides Cam's "Tuesday. The charter's mine." (#34) and #35 p1, Tuesday is a passing gag in #9 (Fennel:
  "She turned up on Tuesday") and #31's bulletin ("not blinked since Tuesday"). The prologue's "Must be Tuesday" is a
  good plant; the others blur it.
- **Proposed fix:** use another day in #9 and #31.
- **Severity:** nit · **Type:** craft
