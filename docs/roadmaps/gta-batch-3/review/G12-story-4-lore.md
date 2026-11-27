# G12 Story act IV and the lore: editorial review, round 1

Editor: G12 (Opus). Scope: main quests #54-#70 (incl. extended #64 and the finale #70 with both endings, Cam's choice in
#62), their cutscenes and comms, W15-W17 and W19, the catch-up rule for old saves, and the lore base `docs/lore/`.
Read: every act IV quest file (`src/quests/story/54..70*.ts`), every line of every act IV scene (`cutscene/scenes/story/
m54..m70*.ts`, `ch4*.ts`, `ch5.ts`), `storyMarks.ts`, `worldChanges/defs.ts` + `rows/epilogue.ts`, `questSave.ts`
(finale migration), the outline's act 4, the E22 roadmap, canon, rulings R-232..R-236 and a wide sample of entries.
Checks: `npm run cutscene-report` (Story A/B 0 faults), `npm run lore` (OK, 834 entries). Screenshots of `?cutscene=`
for all-hats-p4-intro, all-hats-outro, m66 outro, m68 outro, m69 outro, even-cut-hat and even-cut-outro; the ones cited
are in [shots/G12/](shots/G12/).

## Verdict

The act's writing is the best in the game: every voice is distinct (Diggs's "Effective immediately", Big Lou's
one-word sentences, Hedda's telegrams, Yarrow's minutes, Wally's stall speed), the sincere beats land and are protected
(Diggs's medal, Clara's porch, the roof, "...It is a nice hat."), and every arc the outline promised closes: Tansy says
"Mine." and then Pip's line, Diggs salutes a mole, the Countess says thank you, Reginald measures the scar, Vesper loses
his hat line. The charm is intact. What is not yet hand-crafted is the **structure around the words**: the finale's
four parts each send the player back to the overlook to start the next (a break at tension 10); the PA code that #62
exists to fetch is never used; choice B is contradicted twice; both endings get the same epilogue; veteran saves get
the whole act after the finale with nothing saying so; and the climax scenes play under a busy ordinary downtown. The
lore is rich and mostly consistent, but still carries pre-batch facts that contradict the finale (the Combine in the
canal), stale "Planned"/draft markers, and a few position and coordinate slips.

Counts: **2 blocker, 16 polish, 10 nit**; 23 craft, 5 spirit.

## Findings

### 1. The finale's parts each start at the overlook: the player has to drive away from the climax to continue it
- **What:** `ch5-even-cut-p1`, `-p2`, `-p3` and `ch5-even-cut` all have `giver: 'dust-overlook'`, and quests only start
  by walking up to a giver (`quests.ts` `interact`). m69 ends on the verge at the downtown crossing (-12, 3); the player
  must drive ~280 m east to Tansy to start p1, whose brief then says "Take the highway west into downtown". p2 ends with
  the player landed "on the deck" at (0, -240); to play p3 they must drive back to the overlook, where p3's intro shows the
  deck "through the player's eyes" and Tansy says "Crack the Guard. Reach the throne", while they stand 300 m away; then
  drive back. p3 ends at the z = -120 kerb; back to the overlook again for the final. Same shape, milder, in #64: p1 ends
  at New Puddle Marina (650, 762), p2 starts at the overlook (~700 m north).
- **Where:** `src/quests/story/70a-even-cut.ts`, `70-even-cut.ts` (giver), `64a-all-hats.ts` p2.
- **Why it matters:** the climax (tension 9 -> 10) is cut into four commutes. The split exists for save compatibility,
  not for the player; the old single quest never had this. The quest sim passes because it walks to givers.
- **Proposed fix:** a part that follows another part starts itself: add `QuestDef.continues?: true` (or
  `autoStart`), and when its prereq part's outro ends, `activate()` it in place and play its intro there (the intro is
  already a world-stage scene). Apply to `ch5-even-cut-p2`, `-p3`, `ch5-even-cut` and `m64-all-hats-p2`; p1 can stay a
  giver start but give it a giver at the crossing (Tansy by the Zero-Turn, `e70` stage) instead of the overlook.
- **Severity:** blocker. **Type:** craft.

### 2. Cam's PA code, the whole point of #62, is never used
- **What:** #62's brief, mid-scene, doneText and journal item ("The Combine's PA code ... and the Combine's route")
  say the crew needs the code; #63 repeats it ("gave the code"). Nothing in #64-#70 uses the code or the route: the
  finale's PA is only Vesper's, the HOA Address System talks unopposed in the p2 outro, Betony supplies the jump point.
  Lesser dangling plants of the same kind: the Photograph (outline: "shown at the finale") and Diggs's medal are not
  seen again.
- **Where:** `quests/story/62-cams-cell.ts`, `quests/storyMarks.ts` (`combine-pa-code`), `cutscene/scenes/story/m70a-even-cut.ts`
  (p2 outro), `m70-even-cut.ts` (p3 intro), `ch5.ts`.
- **Why it matters:** a quest whose stated purpose never pays off breaks "the 70-quest arc pays off" and teaches the
  player that story objects are filler. It is also the cheapest payoff available: the scene already has a PA.
- **Proposed fix:** in even-cut-p3-intro, Juniper's line goes out over the Combine's own horns ("Cam's code. Your
  speakers, Mr Thorne. The counter-order is signed; as of noon you are parked illegally."), with `sfx: 'static'` and a
  cutaway of Vesper's lamp flickering; optionally cut off the p2-outro "Visitor on deck" line mid-word. One line from
  Pip in p1-outro can use the route ("Cam's map says it turns at the top"). For the Photograph: Clara holds it in the
  outro's step shot (prop `porch-photograph`); for the medal: Diggs wears it at the Gnomecino rope.
- **Severity:** blocker. **Type:** craft.

### 3. Choice B (leave Cam) is contradicted, and Juniper's "I will notice" never comes
- **What:** (a) #63's brief: Big Lou "Previously: Cam is out and gave the code" plays for both choices. (b) W19's only
  bulletin says "somebody is sweeping Founders' Green ... He apologises anyway" also when the props show the broom alone
  (`bulletinB` exists only for W17). (c) Juniper in #62: "I will not ask which. I will notice." She never does. (d) The
  outline's "epilogue line for Cam depends on row 62's choice" is only a prop on the Green; the epilogue cutscene never
  mentions Cam.
- **Where:** `quests/story/63-four-taps.ts` comms 0; `worldChanges/defs.ts` W19; `quests/story/62-cams-cell.ts` comms 3;
  `cutscene/scenes/story/ch5.ts` even-cut-outro.
- **Why it matters:** a choice the game forgets or contradicts is worse than no choice.
- **Proposed fix:** (a) "Previously: we have Cam's code. Don tapped four." (b) add `bulletinB` for W19 ("A broom has been
  left on a bench on Founders' Green. Nobody has claimed it. It is very well kept.") and read it via `choiceOf`. (c)+(d)
  one shot in even-cut-outro, after Reginald: Juniper passing the bench, freed: "Cameron. You missed a leaf." / left:
  she picks the leaf off the broom's bench and says nothing. The script runner needs a choice-dependent step (or two
  outro variants, as #62 does with `outro` per option).
- **Severity:** polish. **Type:** craft.

### 4. Veteran saves play act IV after the finale, with nothing saying so
- **What:** the catch-up rule ("inserted runs appear as catch-up quests") hangs m54 off ch3-tundra-drift-run, m56 off
  runway-flares, m58 off sandpit-drop, m60 off spade-truce. A save that finished the old finale gets all of #54-#69
  after Vesper was stopped, in a W17 world (clover or neon on the meridian, Side-Valve reopened), with briefs that say
  "Previously: ... Vesper named his day", "Diggs is hunting it", "The Combine moves at dawn" and #69 "The Combine
  Wakes". A save mid-act IV (spade truce done) gets m54, m56 and m58 at once, out of order, while Diggs is already an
  ally. `migrateFinaleSave` also resumes an active old finale in p1 with none of the act IV setups (no key, no code).
- **Where:** prereqs in `quests/story/54..60`; `quests/questSave.ts`; journal.
- **Why it matters:** the users most likely to notice are the ones who already love the game; they hit 17 quests whose
  premise the world around them contradicts.
- **Proposed fix (decider):** keep "nothing hides or resets", but frame it: when the row's successor in the old chain
  is already done, show the row in the journal under **"Before the Even Cut"** and swap the brief's "Previously:" for
  "Before the Even Cut:" (one helper in `kit.ts`); skip the row's world-change and Turfton FM bulletins while W17 is on.
  Alternatively, for saves with the finale done, offer act IV as one "Retold" chain from the journal only.
- **Severity:** polish. **Type:** spirit.

### 5. Both endings get the same epilogue
- **What:** the choice's two options set no `outro`, so A and B both play the identical 92 s even-cut-outro (Clara,
  the Vance siblings, Side-Valve, the Mayor, Diggs, Bodega, the bus stop, the rail). The only differences are the
  one-line ending toast and W17 afterwards. The final doneText is also one text for both.
- **Where:** `quests/story/70-even-cut.ts` (choice), `cutscene/scenes/story/ch5.ts`.
- **Why it matters:** the last decision of a 70-quest story should be seen. "Both endings" is a requirement the
  player can't tell apart in the moment.
- **Proposed fix:** one ending shot each, after the Vance siblings measure the scar: A, the clover coming up through
  the stripe at dusk with Bracken kneeling; B, the meridian lit in a neon grid at night with Lulu's horn. Either two
  outro scripts sharing steps (`optionA.outro` / `optionB.outro`) or a choice-gated step. Make the doneText follow the
  ending.
- **Severity:** polish. **Type:** spirit.

### 6. The Combine turns north at the crossing in #69, then comes south back to it in the finale
- **What:** m69-outro: the Combine comes along the z = 0 road and "turns north onto the meridian at (0, 0)" and leaves.
  p1: the Vanguard walk at z -180..-220 and the Combine is at z -240..-262 "nose +z, rolling south"; final brief "still
  rolling south down the meridian"; it is jammed at the downtown crossing (0, 0), the same place it turned on.
- **Where:** `cutscene/scenes/story/m69-the-combine-wakes.ts` (W_TURN, W_AWAY); `m70a-even-cut.ts`; `70-even-cut.ts` comms.
- **Why it matters:** the player watches it drive away north, then finds it coming back with no reason given.
- **Proposed fix:** one line: Ernie in m69-outro "It goes to the top of the meridian first. Cuts from the top down.
  ...Down." (and Betony's "north end" line in p2 then makes sense), or move the m69 turn to the north end and make
  Hyssop's crossing downstream of it.
- **Severity:** polish. **Type:** craft.

### 7. "Across the deck" is played on the road
- **What:** p2 ends with the player on a "moving beige deck"; p3's text is "Fight Vesper's Porcelain Guard across the
  deck", its intro is the player's eyes on the deck. In play, `bossCombineRun` spawns the guards on the road beside the
  Combine and the player fights on foot on the road (known gap: actors cannot stand on the prop).
- **Where:** `quests/story/70-even-cut.ts` p3 text; `quests/objectivesAction.ts`.
- **Proposed fix:** until the deck is walkable, say what happens: p2-outro ends with the player sliding off the deck's
  tail to the road under the canopy (one shot), and p3's text becomes "Fight the Porcelain Guard alongside the Combine,
  up to the throne". Keep the deck POV in the intro as what the player saw from the canopy.
- **Severity:** polish. **Type:** craft.

### 8. Row 59's kept outro gathers the coalition and spends the pie line before All Hats
- **What:** spade-truce-outro (row 59) brings Bracken and the Unmowed to the fort ("The Unmowed are here, Commander")
  and Granny says "I brought pie." The outline cut the "every crew in four biomes" doneText from row 59 because the
  coalition forms in #64, where the pie rung is supposed to pay ("I brought pie." again in all-hats-outro, and "Pie,
  sugar. For the crew." in the finale).
- **Where:** `cutscene/scenes/story/ch4.ts` (spade-truce-outro lines 90-97); `m64-all-hats.ts` all-hats-outro.
- **Why it matters:** the act's triumph line is the third time the joke is told; the gathering is pre-empted.
- **Proposed fix:** in spade-truce-outro, replace the Bracken/Granny arrival with Diggs alone at the sealed doors (or
  Bracken on the radio only), and give Granny a different line there or none.
- **Severity:** polish. **Type:** craft.

### 9. "All hats" leaves out the Don, Samphire, Brenda and Wally
- **What:** Tansy counts seven caps: Carburettors, Underspanners, Unmowed, Burrowfolk, Spade Guard, Flock, Granny. The
  Mulch Club (the first to join, in #63), the Bathtub Queen and New Puddle (By Water, #64 p1) and Wally (By Air) have no
  cap on the rail. The lore entry `coalition-of-all-hats` lists By Water as a member.
- **Where:** `quests/story/64-all-hats.ts` HATS; all-hats-outro.
- **Why it matters:** the act's title moment is "every hat at one table"; the most hat-proud gnome in Turfton (the Don)
  and two of the four "ways" are missing.
- **Proposed fix:** add two pitches: Big Lou hangs the Don's hat (Lou: "Don's. ...Borrowed."), and Samphire's tricorn
  (with a flamingo feather from Brenda). Tansy counts to nine. W16 and the lore list follow.
- **Severity:** polish. **Type:** spirit.

### 10. The All Hats count is played in the dark, sometimes in the rain
- **What:** all-hats-outro (night) frames Tansy's count as near-black silhouettes; the fire does not light faces; the
  world's weather leaks into scenes (rain in [all-hats-outro-042](shots/G12/all-hats-outro-042.png); see also
  [all-hats-outro-032](shots/G12/all-hats-outro-032.png)). p4-intro is similarly dark.
- **Where:** `cutscene/scenes/story/m64-all-hats.ts` (all-hats-p4-*, all-hats-outro), scene runner.
- **Why it matters:** this is the act's high point (tension 7, "sincere last minute"); the player can't see the faces.
- **Proposed fix:** a warm point light on the `campfire` prop in scenes (or `sky: 'dusk'` with lanterns lit), and a
  scene-level `weather: 'clear'` for story scenes (check the roof in #68 and the jam/hat too).
- **Severity:** polish. **Type:** craft.

### 11. Downtown carries on as normal around the jammed god-machine
- **What:** even-cut-hat and even-cut-outro are shot at the downtown crossing with ambient gnomes walking past, a Hat
  Watch van and traffic in the background ([even-cut-hat-022](shots/G12/even-cut-hat-022.png),
  [-030](shots/G12/even-cut-hat-030.png)); the m69 outro has pedestrians crossing while Hyssop says "Stop."
- **Where:** `cutscene/scenes/story/m70-even-cut.ts`, `ch5.ts`, `m69-the-combine-wakes.ts` (world stage).
- **Why it matters:** "the meridian is closed", the city evacuated in #69, and the climax looks like a weekday.
- **Proposed fix:** world-stage story scenes on the meridian clear ambient NPCs and traffic in a radius (a scene flag
  `clearAmbient: 40`), and the finale quests close the meridian with W-style cones; evacuees can stand at the kerb.
- **Severity:** polish. **Type:** craft.

### 12. Chicory rides in the barrow buggy and also walked
- **What:** #65's banter is Chicory talking in the buggy on the drive ("Mind the roots..."); comms step 2 has the
  Countess say "Chicory carries the key. He is walking. He left at noon." and the outro has Chicory: "I walked. Engines
  frighten roots."
- **Where:** `quests/story/65-the-countess-relents.ts` (banter, comms 2), `cutscene/scenes/story/m65-the-countess-relents.ts`.
- **Proposed fix:** make the banter Chicory on the phone from the road ("Chicory, by phone: ...") and keep the walk, or
  drop "I walked" and let him ride.
- **Severity:** polish. **Type:** craft.

### 13. "By Road" has no convoy
- **What:** #64 p3 is "Follow Lulu's dirt bike at the back of the convoy"; in play there is only Lulu (E22 known gap);
  the three cars exist only in the intro and outro.
- **Where:** `quests/story/64-all-hats.ts` p3.
- **Proposed fix:** spawn the three Carburettor cars (`R_CAR_*` tints) as followers on the leader's path a few metres
  apart (no AI beyond path-follow), or have them pass the player at the band-road junction once. Fallback: reword to
  "Lulu rides point; the cars went ahead by the highway" and keep the outro.
- **Severity:** polish. **Type:** craft.

### 14. Four passenger runs back to back
- **What:** #63 (the Mayor), #67 (Juniper), #68 (four drives in a row) and #54 (Wally) are passenger objectives; #67
  and #68 are adjacent, so the player does five passenger drives in a row before the finale.
- **Where:** `quests/story/67-emergency-assessment.ts`, `68-lights-out.ts`.
- **Why it matters:** #68's drives are the point (the goodnights); #67's is just a ride and dulls them.
- **Proposed fix:** #67's last step becomes an on-foot escort out of the yard and through the Green (Juniper walks; a
  `chase-follow` on foot or a visit with her following), so #68's car trips are the only quiet drives.
- **Severity:** polish. **Type:** spirit.

### 15. The lore still sinks the Combine in a canal
- **What:** `the-grand-combine.md`: "It met its end when the protagonist jammed a ... Stopping Stone into its
  intake, tipping it sideways into the Southern Drainage Canal", loose thread "the submerged chassis in the canal";
  "three rolling deck tiers", "forty-foot PA horns". `the-even-cut-incident.md`: "jam the Grand Combine before it
  reached downtown" (it is jammed at the downtown crossing). `coalition-of-all-hats.md`: "must not cross the meridian"
  (it drives down it).
- **Where:** `docs/lore/entries/apocrypha/the-grand-combine.md`, `the-even-cut-incident.md`, `coalition-of-all-hats.md`.
- **Proposed fix:** rewrite to the shipped finale: stopped with the Stone in its mouth at the downtown crossing, the
  throne brought down to the road, clover (A) or neon (B) on the stripe; loose thread: what happens to the chassis now.
- **Severity:** polish. **Type:** craft.

### 16. Lore status markers are stale
- **What:** 27 entries still open their "In the games" with "Planned (batch 3)" for things that shipped (nubbin,
  hyssop-doormat, the-underspan, wisteria-brassknock, the-double-pot, hogweed-sprocket, samphire-bilge, ...). 598 of
  834 entries are `status: draft`, while the README defines draft as "not yet used by any game" (most are in the game).
  Four entries cite proposals "R-NEW-1/2/3" that R-235 settled; "R-NEW-1" names two different proposals
  (`sister-rail.md`, `vesper-thorne.md`; also `loamdeep-clans.md`, `flock-of-the-one-leg.md`).
- **Where:** `docs/lore/entries/apocrypha/*`.
- **Proposed fix:** a scripted pass: replace "Planned (batch 3)." with nothing (the row list after it is right), flip
  `status` to `canon` for entries whose `games:` includes gnome-theft-auto and whose ids appear in code or a ruling,
  and replace R-NEW-n with R-235 (6), (5), (7), (1).
- **Severity:** polish. **Type:** craft.

### 17. Older lore voices still contradict the act IV bible
- **What:** `commander-diggs.md`'s journal and intro: retired colonels "The Brass" in "air-conditioned bunkers", diesel
  drums, "warning shots at clipboards", a tactical trowel bandolier; the bible (and #61) make him a gnome who stayed in
  case the garden's makers came back. `vesper-thorne.md` loose thread: "rumors whisper he escaped the Tall House" while
  #66 answers it ("He was one of us on the porch"). `silt-diver-sal.md`: "three 9mm casings", "Turfton's 60-unit grid".
- **Where:** those entries.
- **Proposed fix:** trim each old journal to one paragraph in the bible's voice (Diggs's duty log can stay, minus the
  Brass and diesel); change Vesper's loose thread to what #66 leaves open (what happened on the porch, and why he left).
- **Severity:** polish. **Type:** craft.

### 18. Fort Sandpit's gate is in the north wall in the lore and in the south wall in the game
- **What:** `fort-sandpit.md`: "gate near (374, 44) in the north wall". The code: `gateZ = fort.z + fortD / 2` (+z is
  south), W15 builds the gate at (374, 34), m60's comment calls z = 34 the south wall, the enforcers in #59 stand at z
  42-52 (outside, south). #54 photographs "the north wall" from the overlook, which is west of the fort, with snipers
  "watching the road" (the road comes in at the south gate).
- **Where:** `docs/lore/entries/apocrypha/fort-sandpit.md`; `quests/story/54-the-heist-board.ts` probe 1.
- **Proposed fix:** lore: gate in the south wall at (374, 34); #54 probe 1 "The west wall, from the rail" or keep
  "north wall" and drop "watching the road".
- **Severity:** polish. **Type:** craft.

### 19. R-235 puts Yarrow's barn in the south of Pebblewick
- **What:** R-235 (9): "Reeve Yarrow's hay barn stands at the south of Pebblewick (706, 34)". The square is (674, 100);
  z 34 is north of it; #58's hint and `pebblewick-hay-barn.md` say north-east.
- **Where:** `docs/lore/rulings.md` R-235.
- **Proposed fix:** "at the north-east edge of Pebblewick (706, 34)".
- **Severity:** nit. **Type:** craft.

### 20. Coordinates and map talk inside "What gnomes say"
- **What:** gnome speech quoting engine coordinates: `the-grand-combine.md` "crossed `z = -300`", `highway-east.md`
  "the turn at `x: 300`", `highway-west.md` "past `x: -320`"; "the entire 1200×1200 map" (grand-combine summary).
- **Why it matters:** canon house style: no fourth-wall jokes; the "What gnomes say" section is in-world.
- **Proposed fix:** name the place instead ("the Ring Road", "past the Heap", "the highway bend"); coordinates belong
  in "In the games".
- **Severity:** nit. **Type:** craft.

### 21. The finale's doneText and ending lines are in the old style
- **What:** doneText "THE EVEN CUT — Clara sits with Vesper. Side-Valve reopens ..., Mulch adds a 3rd red coat, ...
  Phone buzzes — Club Gnome: ..."; the ending toasts "Ending A — The Unmowed Monument: ...". Em-dashes, a numeral,
  the same text for both endings, and none of the act IV coalition (Diggs is there; the moles, the Countess, Lulu are
  not).
- **Where:** `quests/story/70-even-cut.ts`.
- **Proposed fix:** rewrite in the act's voice, per ending (see #5), e.g. "Vesper sits on his own step with Clara. The
  Stone holds. Clover is coming up through the stripe. Side-Valve has forty-eight wrenches, and Pip has a plan about a
  bowling alley."
- **Severity:** nit. **Type:** craft.

### 22. Hogweed "now sells" parachute parts that no shop sells
- **What:** #56 doneText and outro: "Hogweed now sells spare canopy and cord"; the outline's reward "Hogweed becomes a
  vendor"; there is no shop (the file's own comment says so); the workshop's price list has no canopy.
- **Where:** `quests/story/56-mortar-for-a-mower.ts`, `cutscene/scenes/story/m56-mortar-for-a-mower.ts`,
  `docs/lore/entries/apocrypha/hogweeds-workshop.md`.
- **Proposed fix:** add "Spare canopy 5. Spare almost 0." to the workshop's price-list sign (it exists as lore) or say
  "Hogweed says he sells ...".
- **Severity:** nit. **Type:** craft.

### 23. The design docs still describe the pre-R-234 rows
- **What:** `characters.md` homes table: mayor-mulch "#63 pickup at home" (he is at Café Pardon); Clara "her plea is
  carried by Pip's call in #70" (it is her own call). `story-outline.md` rows 63 and 65 still send the player to Patio
  Heights and Granny's greenhouse without a note that R-234 overrides them.
- **Proposed fix:** one-line notes in the outline rows ("R-234: Café Pardon"; "R-234: the Unmown") and fix the two
  character lines.
- **Severity:** nit. **Type:** craft.

### 24. "Tonight, it cracks" at noon
- **What:** Vesper's PA in even-cut-p3-intro (sky noon) says "tonight".
- **Proposed fix:** "And to the gnome in that hat: today, it cracks." (the hat line's ladder survives).
- **Severity:** nit. **Type:** craft.

### 25. The Countess's "Previously" puts her at the overlook
- **What:** #65 brief: "Previously: at the overlook, one learned what the Even Line is. One has drawn it." She was
  the empty card at the overlook ("The Countess. Not tonight."); the line reads as if she was there.
- **Proposed fix:** "Previously: your coalition sat down without me. One has since looked at the Even Line. One has
  drawn it."
- **Severity:** nit. **Type:** craft.

### 26. Tansy's "Go." is undone two quests later
- **What:** #54 is the rung where Tansy first lets Pip run a plan ("Okay, hear me out." / "Go."); in the kept #57
  intro Pip says it again and Tansy says "Don't." as if #54 had not happened.
- **Proposed fix:** keep the gag, mark the change: Pip "Okay, okay. Hear me out." / Tansy "...Go on." / Pip "She said
  go on." Or Tansy "Don't." / Pip "You said go last time." / Tansy "That was a board. This is a parachute."
- **Severity:** nit. **Type:** spirit.

### 27. Small line and name nits
- Two different HOA heavies named Rivet (#62 "Lockup Guard Rivet", #67 "HOA Enforcer Rivet"): rename one (Grommet)
  or make it a gag (the same guard, transferred).
- #63 objective "Drive the Mayor home to the Mulch Club": it is not his home ("back to the Mulch Club").
- #68: Granny's comms step 3 repeats her banter and onBoard line ("I would rather the farmhouse than your couch ...
  Take the long road"): give the call a new line.
- #58: Pip "I parked the Whirligig on the apron" right after #57 hid it at the overlook from Diggs, a mile from his
  fort: one clause ("Diggs is watching the overlook, so I moved her to Wally's apron").
- Two lore entries named "The Gnomecino" (`the-yard/gnomecino.md`, `apocrypha/the-gnomecino.md`): separate settings,
  but add "Not the Yard's Gnomecino" to the GTA one.
- **Severity:** nit. **Type:** craft.

### 28. The two "the war arrives" intros are the act's shortest
- **What:** m69-the-combine-wakes-intro is 25.3 s and m67-emergency-assessment-intro 28.4 s (aim 30-60), with 6 and 7
  lines; both are the setups for tension 9. The p2 and p3 outros are 17.8 s and 18.4 s.
- **Proposed fix:** give m69's intro one more beat of the Combine (the heap's yard empty where it slept, R-235 (9))
  and m67's one shot of City Hall's windows going beige; not more dialogue.
- **Severity:** nit. **Type:** craft.

## What works (keep)

- The act IV voices and the protected sincere beats (#61 bungalow, #66 porch, #68 roof, the jam, "...It is a nice
  hat."): no gag lands on top of any of them.
- The running rungs pay: "Okay, Potsworth. Hear me out.", the forty-eighth wrench, the golden kazoo at the worst
  moment, Velma's car count, "almost certainly", Diggs's "Effective immediately: Corporal."
- Context: every brief opens with "Previously:" in the caller's voice; new faces get intro cards at first sight
  (Diggs #57, Yarrow #58, Hector #63, Velma #64, Burdock #65, Clara #66).
- The world is used: Pardonlin, the Unmown and the Hatbrim all carry act IV weight (R-234), and #68's roof shot over
  the lit city ([m68-lights-out-outro-020](shots/G12/m68-lights-out-outro-020.png)) is the quiet the act needs.
- The menial lore (R-236 `## Everyday` sections) is specific, funny and consistent with the code's prices.
