# FX24 Story act IV and the lore base
Wave: 8 · Depends on: FX05, FX07, FX21 · Kind: Fix (story, lore)
Findings: 26 (G12#1, G12#2, G12#3, G12#5, G12#6, G12#7, G12#8, G12#9, G12#11, G12#12, G12#13, G12#14, G12#15, G12#16, G12#17, G12#18, G12#19, G12#20, G12#21, G12#22, G12#23, G12#24, G12#25, G12#26, G12#27, G12#28) · Decisions: D45, D46, D48, D50, D55, D56

Inputs: the findings files `review/G<n>-*.md` (full text of each finding), `review/decisions.md`, `AGENTS.md`, `SOUL.md`, the game's rows in `AGENT_INDEX.md`. Paths are under `games/gnome-theft-auto/src/` unless they start with `packages/`, `docs/` or `tools/`.

## Goal

The finale plays through without driving away from it, Cam's code and choice pay off, both endings end differently (D48), All Hats counts everyone (D55), the meridian stops for the god-machine, and the lore base matches what shipped (GR1).

## Scope

### Owned files (this epic may edit these, and only these, plus tests next to them)

- quests/story/54..70 row files (incl. 64a, 70a), cutscene/scenes/story ch4*.ts, ch5.ts and m54..m70a (dialogue and blocking; FX05's light stays)
- quests/types.ts `continues?` for parts (G12#1) and the activation hook in the quest runtime
- worldChanges/defs.ts (W16, W19 rows), quests/storyMarks.ts (`combine-pa-code`)
- docs/lore/** entries listed in G12#15-20, G12#23, docs/lore/rulings.md, and the design docs (E04 outline notes)

### Findings (26)

Each finding: ID (severity, type · priority, decision), what, where, the editor's proposed fix, the decision text when one applies, and where to re-check. Read the full finding in its file before planning its issue.

- **G12#1** (blocker, craft · **must**) The finale's parts each start at the overlook: the player has to drive away from the climax to continue it
  - What: `ch5-even-cut-p1`, `-p2`, `-p3` and `ch5-even-cut` all have `giver: 'dust-overlook'`, and quests only start by walking up to a giver (`quests.ts` `interact`). m69 ends on the verge at the downtown crossing (-12, 3); the player must drive ~280 m east to Tansy …
  - Where: `src/quests/story/70a-even-cut.ts`, `70-even-cut.ts` (giver), `64a-all-hats.ts` p2.
  - Editor's fix: a part that follows another part starts itself: add `QuestDef.continues?: true` (or `autoStart`), and when its prereq part's outro ends, `activate()` it in place and play its intro there (the intro is already a world-stage scene). Apply to `ch5-even-cut-p2`, `-p3`, `ch5-even-cut` and `m64-all-hats-p2`; p1 can stay a giver start but give it a giver at the crossing (Tansy by the Zero-Turn, `e70` stage) instead of the …
  - Re-check: the spot and file named in Where (no editor shot)
- **G12#2** (blocker, craft · **must**) Cam's PA code, the whole point of #62, is never used
  - What: #62's brief, mid-scene, doneText and journal item ("The Combine's PA code ... and the Combine's route") say the crew needs the code; #63 repeats it ("gave the code"). Nothing in #64-#70 uses the code or the route: the finale's PA is only Vesper's, the HOA …
  - Where: `quests/story/62-cams-cell.ts`, `quests/storyMarks.ts` (`combine-pa-code`), `cutscene/scenes/story/m70a-even-cut.ts` (p2 outro), `m70-even-cut.ts` (p3 intro), `ch5.ts`.
  - Editor's fix: in even-cut-p3-intro, Juniper's line goes out over the Combine's own horns ("Cam's code. Your speakers, Mr Thorne. The counter-order is signed; as of noon you are parked illegally."), with `sfx: 'static'` and a cutaway of Vesper's lamp flickering; optionally cut off the p2-outro "Visitor on deck" line mid-word. One line from Pip in p1-outro can use the route ("Cam's map says it turns at the top"). For the …
  - Re-check: the spot and file named in Where (no editor shot)
- **G12#3** (polish, craft · **must**, D45, D48) Choice B (leave Cam) is contradicted, and Juniper's "I will notice" never comes
  - What: (a) #63's brief: Big Lou "Previously: Cam is out and gave the code" plays for both choices. (b) W19's only bulletin says "somebody is sweeping Founders' Green ... He apologises anyway" also when the props show the broom alone (`bulletinB` exists only for …
  - Where: `quests/story/63-four-taps.ts` comms 0; `worldChanges/defs.ts` W19; `quests/story/62-cams-cell.ts` comms 3; `cutscene/scenes/story/ch5.ts` even-cut-outro.
  - Editor's fix: (a) "Previously: we have Cam's code. Don tapped four." (b) add `bulletinB` for W19 ("A broom has been left on a bench on Founders' Green. Nobody has claimed it. It is very well kept.") and read it via `choiceOf`. (c)+(d) one shot in even-cut-outro, after Reginald: Juniper passing the bench, freed: "Cameron. You missed a leaf." / left: she picks the leaf off the broom's bench and says nothing. The script runner needs …
  - Decision: D45, D48 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G12#5** (polish, spirit · **must**, D48) Both endings get the same epilogue
  - What: the choice's two options set no `outro`, so A and B both play the identical 92 s even-cut-outro (Clara, the Vance siblings, Side-Valve, the Mayor, Diggs, Bodega, the bus stop, the rail). The only differences are the one-line ending toast and W17 afterwards. …
  - Where: `quests/story/70-even-cut.ts` (choice), `cutscene/scenes/story/ch5.ts`.
  - Editor's fix: one ending shot each, after the Vance siblings measure the scar: A, the clover coming up through the stripe at dusk with Bracken kneeling; B, the meridian lit in a neon grid at night with Lulu's horn. Either two outro scripts sharing steps (`optionA.outro` / `optionB.outro`) or a choice-gated step. Make the doneText follow the ending.
  - Decision: D48 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G12#6** (polish, craft · **should**) The Combine turns north at the crossing in #69, then comes south back to it in the finale
  - What: m69-outro: the Combine comes along the z = 0 road and "turns north onto the meridian at (0, 0)" and leaves. p1: the Vanguard walk at z -180..-220 and the Combine is at z -240..-262 "nose +z, rolling south"; final brief "still rolling south down the meridian" …
  - Where: `cutscene/scenes/story/m69-the-combine-wakes.ts` (W_TURN, W_AWAY); `m70a-even-cut.ts`; `70-even-cut.ts` comms.
  - Editor's fix: one line: Ernie in m69-outro "It goes to the top of the meridian first. Cuts from the top down. ...Down." (and Betony's "north end" line in p2 then makes sense), or move the m69 turn to the north end and make Hyssop's crossing downstream of it.
  - Re-check: the spot and file named in Where (no editor shot)
- **G12#7** (polish, craft · **should**) "Across the deck" is played on the road
  - What: p2 ends with the player on a "moving beige deck"; p3's text is "Fight Vesper's Porcelain Guard across the deck", its intro is the player's eyes on the deck. In play, `bossCombineRun` spawns the guards on the road beside the Combine and the player fights on …
  - Where: `quests/story/70-even-cut.ts` p3 text; `quests/objectivesAction.ts`.
  - Editor's fix: until the deck is walkable, say what happens: p2-outro ends with the player sliding off the deck's tail to the road under the canopy (one shot), and p3's text becomes "Fight the Porcelain Guard alongside the Combine, up to the throne". Keep the deck POV in the intro as what the player saw from the canopy.
  - Re-check: the spot and file named in Where (no editor shot)
- **G12#8** (polish, craft · **should**) Row 59's kept outro gathers the coalition and spends the pie line before All Hats
  - What: spade-truce-outro (row 59) brings Bracken and the Unmowed to the fort ("The Unmowed are here, Commander") and Granny says "I brought pie." The outline cut the "every crew in four biomes" doneText from row 59 because the coalition forms in #64, where the pie …
  - Where: `cutscene/scenes/story/ch4.ts` (spade-truce-outro lines 90-97); `m64-all-hats.ts` all-hats-outro.
  - Editor's fix: in spade-truce-outro, replace the Bracken/Granny arrival with Diggs alone at the sealed doors (or Bracken on the radio only), and give Granny a different line there or none.
  - Re-check: the spot and file named in Where (no editor shot)
- **G12#9** (polish, spirit · **should**, D55) "All hats" leaves out the Don, Samphire, Brenda and Wally
  - What: Tansy counts seven caps: Carburettors, Underspanners, Unmowed, Burrowfolk, Spade Guard, Flock, Granny. The Mulch Club (the first to join, in #63), the Bathtub Queen and New Puddle (By Water, #64 p1) and Wally (By Air) have no cap on the rail. The lore entry …
  - Where: `quests/story/64-all-hats.ts` HATS; all-hats-outro.
  - Editor's fix: add two pitches: Big Lou hangs the Don's hat (Lou: "Don's. ...Borrowed."), and Samphire's tricorn (with a flamingo feather from Brenda). Tansy counts to nine. W16 and the lore list follow.
  - Decision: D55 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G12#11** (polish, craft · **should**) Downtown carries on as normal around the jammed god-machine
  - What: even-cut-hat and even-cut-outro are shot at the downtown crossing with ambient gnomes walking past, a Hat Watch van and traffic in the background ([even-cut-hat-022](shots/G12/even-cut-hat-022.png), [-030](shots/G12/even-cut-hat-030.png)); the m69 outro has …
  - Where: `cutscene/scenes/story/m70-even-cut.ts`, `ch5.ts`, `m69-the-combine-wakes.ts` (world stage).
  - Editor's fix: world-stage story scenes on the meridian clear ambient NPCs and traffic in a radius (a scene flag `clearAmbient: 40`), and the finale quests close the meridian with W-style cones; evacuees can stand at the kerb.
  - Re-check: `review/shots/G12/`: `even-cut-hat-022.png`, `even-cut-hat-030.png`, `even-cut-hat-022`, `even-cut-hat-030`
- **G12#12** (polish, craft · **should**) Chicory rides in the barrow buggy and also walked
  - What: #65's banter is Chicory talking in the buggy on the drive ("Mind the roots..."); comms step 2 has the Countess say "Chicory carries the key. He is walking. He left at noon." and the outro has Chicory: "I walked. Engines frighten roots."
  - Where: `quests/story/65-the-countess-relents.ts` (banter, comms 2), `cutscene/scenes/story/m65-the-countess-relents.ts`.
  - Editor's fix: make the banter Chicory on the phone from the road ("Chicory, by phone: ...") and keep the walk, or drop "I walked" and let him ride.
  - Re-check: the spot and file named in Where (no editor shot)
- **G12#13** (polish, craft · **should**) "By Road" has no convoy
  - What: #64 p3 is "Follow Lulu's dirt bike at the back of the convoy"; in play there is only Lulu (E22 known gap); the three cars exist only in the intro and outro.
  - Where: `quests/story/64-all-hats.ts` p3.
  - Editor's fix: spawn the three Carburettor cars (`R_CAR_*` tints) as followers on the leader's path a few metres apart (no AI beyond path-follow), or have them pass the player at the band-road junction once. Fallback: reword to "Lulu rides point; the cars went ahead by the highway" and keep the outro.
  - Re-check: the spot and file named in Where (no editor shot)
- **G12#14** (polish, spirit · **should**, D50) Four passenger runs back to back
  - What: #63 (the Mayor), #67 (Juniper), #68 (four drives in a row) and #54 (Wally) are passenger objectives; #67 and #68 are adjacent, so the player does five passenger drives in a row before the finale.
  - Where: `quests/story/67-emergency-assessment.ts`, `68-lights-out.ts`.
  - Editor's fix: #67's last step becomes an on-foot escort out of the yard and through the Green (Juniper walks; a `chase-follow` on foot or a visit with her following), so #68's car trips are the only quiet drives.
  - Decision: D50 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G12#15** (polish, craft · **should**) The lore still sinks the Combine in a canal
  - What: `the-grand-combine.md`: "It met its end when the protagonist jammed a ... Stopping Stone into its intake, tipping it sideways into the Southern Drainage Canal", loose thread "the submerged chassis in the canal"; "three rolling deck tiers", "forty-foot PA …
  - Where: `docs/lore/entries/apocrypha/the-grand-combine.md`, `the-even-cut-incident.md`, `coalition-of-all-hats.md`.
  - Editor's fix: rewrite to the shipped finale: stopped with the Stone in its mouth at the downtown crossing, the throne brought down to the road, clover (A) or neon (B) on the stripe; loose thread: what happens to the chassis now.
  - Re-check: the spot and file named in Where (no editor shot)
- **G12#16** (polish, craft · **should**) Lore status markers are stale
  - What: 27 entries still open their "In the games" with "Planned (batch 3)" for things that shipped (nubbin, hyssop-doormat, the-underspan, wisteria-brassknock, the-double-pot, hogweed-sprocket, samphire-bilge, ...). 598 of 834 entries are `status: draft`, while the …
  - Where: `docs/lore/entries/apocrypha/*`.
  - Editor's fix: a scripted pass: replace "Planned (batch 3)." with nothing (the row list after it is right), flip `status` to `canon` for entries whose `games:` includes gnome-theft-auto and whose ids appear in code or a ruling, and replace R-NEW-n with R-235 (6), (5), (7), (1).
  - Re-check: the spot and file named in Where (no editor shot)
- **G12#17** (polish, craft · **should**) Older lore voices still contradict the act IV bible
  - What: `commander-diggs.md`'s journal and intro: retired colonels "The Brass" in "air-conditioned bunkers", diesel drums, "warning shots at clipboards", a tactical trowel bandolier; the bible (and #61) make him a gnome who stayed in case the garden's makers came …
  - Where: those entries.
  - Editor's fix: trim each old journal to one paragraph in the bible's voice (Diggs's duty log can stay, minus the Brass and diesel); change Vesper's loose thread to what #66 leaves open (what happened on the porch, and why he left).
  - Re-check: the spot and file named in Where (no editor shot)
- **G12#18** (polish, craft · **should**) Fort Sandpit's gate is in the north wall in the lore and in the south wall in the game
  - What: `fort-sandpit.md`: "gate near (374, 44) in the north wall". The code: `gateZ = fort.z + fortD / 2` (+z is south), W15 builds the gate at (374, 34), m60's comment calls z = 34 the south wall, the enforcers in #59 stand at z 42-52 (outside, south). #54 …
  - Where: `docs/lore/entries/apocrypha/fort-sandpit.md`; `quests/story/54-the-heist-board.ts` probe 1.
  - Editor's fix: lore: gate in the south wall at (374, 34); #54 probe 1 "The west wall, from the rail" or keep "north wall" and drop "watching the road".
  - Re-check: the spot and file named in Where (no editor shot)
- **G12#19** (nit, craft · **could**) R-235 puts Yarrow's barn in the south of Pebblewick
  - What: R-235 (9): "Reeve Yarrow's hay barn stands at the south of Pebblewick (706, 34)". The square is (674, 100); z 34 is north of it; #58's hint and `pebblewick-hay-barn.md` say north-east.
  - Where: `docs/lore/rulings.md` R-235.
  - Editor's fix: "at the north-east edge of Pebblewick (706, 34)".
  - Re-check: the spot and file named in Where (no editor shot)
- **G12#20** (nit, craft · **could**) Coordinates and map talk inside "What gnomes say"
  - What: gnome speech quoting engine coordinates: `the-grand-combine.md` "crossed `z = -300`", `highway-east.md` "the turn at `x: 300`", `highway-west.md` "past `x: -320`"; "the entire 1200×1200 map" (grand-combine summary).
  - Editor's fix: name the place instead ("the Ring Road", "past the Heap", "the highway bend"); coordinates belong in "In the games".
  - Re-check: the spot and file named in Where (no editor shot)
- **G12#21** (nit, craft · **could**) The finale's doneText and ending lines are in the old style
  - What: doneText "THE EVEN CUT — Clara sits with Vesper. Side-Valve reopens ..., Mulch adds a 3rd red coat, ... Phone buzzes — Club Gnome: ..."; the ending toasts "Ending A — The Unmowed Monument: ...". Em-dashes, a numeral, the same text for both endings, and none …
  - Where: `quests/story/70-even-cut.ts`.
  - Editor's fix: rewrite in the act's voice, per ending (see #5), e.g. "Vesper sits on his own step with Clara. The Stone holds. Clover is coming up through the stripe. Side-Valve has forty-eight wrenches, and Pip has a plan about a bowling alley."
  - Re-check: the spot and file named in Where (no editor shot)
- **G12#22** (nit, craft · **could**) Hogweed "now sells" parachute parts that no shop sells
  - What: #56 doneText and outro: "Hogweed now sells spare canopy and cord"; the outline's reward "Hogweed becomes a vendor"; there is no shop (the file's own comment says so); the workshop's price list has no canopy.
  - Where: `quests/story/56-mortar-for-a-mower.ts`, `cutscene/scenes/story/m56-mortar-for-a-mower.ts`, `docs/lore/entries/apocrypha/hogweeds-workshop.md`.
  - Editor's fix: add "Spare canopy 5. Spare almost 0." to the workshop's price-list sign (it exists as lore) or say "Hogweed says he sells ...".
  - Re-check: the spot and file named in Where (no editor shot)
- **G12#23** (nit, craft · **could**) The design docs still describe the pre-R-234 rows
  - What: `characters.md` homes table: mayor-mulch "#63 pickup at home" (he is at Café Pardon); Clara "her plea is carried by Pip's call in #70" (it is her own call). `story-outline.md` rows 63 and 65 still send the player to Patio Heights and Granny's greenhouse …
  - Editor's fix: one-line notes in the outline rows ("R-234: Café Pardon"; "R-234: the Unmown") and fix the two character lines.
  - Re-check: the spot and file named in Where (no editor shot)
- **G12#24** (nit, craft · **could**) "Tonight, it cracks" at noon
  - What: Vesper's PA in even-cut-p3-intro (sky noon) says "tonight".
  - Editor's fix: "And to the gnome in that hat: today, it cracks." (the hat line's ladder survives).
  - Re-check: the spot and file named in Where (no editor shot)
- **G12#25** (nit, craft · **must**, D45) The Countess's "Previously" puts her at the overlook
  - What: #65 brief: "Previously: at the overlook, one learned what the Even Line is. One has drawn it." She was the empty card at the overlook ("The Countess. Not tonight."); the line reads as if she was there.
  - Editor's fix: "Previously: your coalition sat down without me. One has since looked at the Even Line. One has drawn it."
  - Decision: D45 (quoted in full under "Decisions this epic applies").
  - Split: D45 mechanism (see G10#8). FX24 rewrites the Countess line. (part done by FX21)
  - Re-check: the spot and file named in Where (no editor shot)
- **G12#26** (nit, spirit · **could**, D56) Tansy's "Go." is undone two quests later
  - What: #54 is the rung where Tansy first lets Pip run a plan ("Okay, hear me out." / "Go."); in the kept #57 intro Pip says it again and Tansy says "Don't." as if #54 had not happened.
  - Editor's fix: keep the gag, mark the change: Pip "Okay, okay. Hear me out." / Tansy "...Go on." / Pip "She said go on." Or Tansy "Don't." / Pip "You said go last time." / Tansy "That was a board. This is a parachute."
  - Decision: D56 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G12#27** (nit, craft · **could**) Small line and name nits
  - Re-check: the spot and file named in Where (no editor shot)
- **G12#28** (nit, craft · **could**) The two "the war arrives" intros are the act's shortest
  - What: m69-the-combine-wakes-intro is 25.3 s and m67-emergency-assessment-intro 28.4 s (aim 30-60), with 6 and 7 lines; both are the setups for tension 9. The p2 and p3 outros are 17.8 s and 18.4 s.
  - Editor's fix: give m69's intro one more beat of the Combine (the heap's yard empty where it slept, R-235 (9)) and m67's one shot of City Hall's windows going beige; not more dialogue.
  - Re-check: the spot and file named in Where (no editor shot)

### Decisions this epic applies (quoted from decisions.md)

**GR1. Lore and the game disagree: which one changes.**
- If the disagreement is about **what a place's name or lore promises it looks like** (its signature image: Saltbucket's
  bucket and dunes, Snowcap's snow, the Unmown's tall grass, the Double Pot's two pots, City Hall's upside-down planter,
  Pardonlin's queues and pavements), **the game changes**. Canon 1 ("every landmark is an ordinary yard object at giant
  scale") is the game's best visual joke, and the name is the promise.
- If it is about **positions, coordinates, counts, who stands where, colours, small facts or "Planned" markers**, **the
  lore changes** to match the build. The cast tables and the code are the fixed points (G2#23, G4#24, G4#32, G12#15–20,
  G1#29).
- Where the lore and the build both fall short of the brief (for example Espalier End's twelve houses, or Capwood's
  "gnomes walk under the caps"), build towards the lore.
- Every ruling below that changes the lore is recorded as a new ruling in `docs/lore/rulings.md`, numbered from
  R-237 in the order the fix epics merge. `npm run lore` must pass.

**GR2. World-change timing: a place exists before the story founds it, in its *before* state.**
- Places stay **playable from the start**. Content epics (court, bowls, estates) must not be locked behind story
  beats. Locking them would cut fun the player already has (L104).
- Until the world change fires, the place's **name, map label, hints, bulletins, toasts and dressing** show the
  before state. When the change fires, it visibly transforms the place (signs off, name on, crowd for a day).
- After the payoff, the "event" dressing (crowds, ribbons, bands) **settles into an everyday state**. It does not stay
  as a permanent party.
- No text before the beat may use the after-name: hint, bulletin, side-quest `why`, app label, map POI or runtime
  toast. Add a test that greps the before-beat quest text for after-names (`Founders' Green` before
  `ch1-founders-boot`, at least).

**GR4. Briefing style: no spoken "Previously:" label (all acts).**
- Characters never say the word "Previously" as a label. This overrides G12's "what works" note. The context rule
  asks for the recap "in the speaker's voice ... not a system note", and a spoken label is a system note.
- The quest def gets an optional `previously` field. The journal's Active card shows it in the narrator's voice,
  which is the spine's journal line.
- Comms step 0 opens with an **in-voice clause** only where the player needs the context. Example: "Last time you
  brought my raft home. The chart says..." The clause must only refer to things the speaker could know, and to
  scenes the player cannot have skipped (G10#8: #29, #32; G11#8: Betony; G12#25: the Countess).
- One shared pass covers all 70 rows. The writer does a voice pass on the same lines (G11#10: contractions, and Pip's
  run-ons and self-undoing second sentences).

**GR5. Fees: shown, not said (all acts).**
- The context rule says what the player gets must be "said **or shown**". From now on it is shown: a reward chip on
  the comms card (or a briefing header) and on the journal card, built from the quest's reward data.
- The amount stays in dialogue **only where money is the story or the speaker's trait**: #2 (the loan), #3 (the
  Don's debt), #11 (Brenda's toll), #16 (clearing the Kiln-Debt), #21 ("for your time"), and Sal, Samphire,
  Chanterelle and Betony's "as I was saying". Betony keeps her trait but loses the number.
- Everywhere else the line is cut, or turned into a favour ("Granny would say pie.").
- Sincere and crisis rows must never carry a spoken fee: #26, #31, #34, #35, #52, the act IV finale.

**GR7. Objective variety in the main story.**
- No more than **two consecutive main rows** whose main objective is a passenger run.
- No row has more than two passenger legs unless the legs are the point (#68's goodnights are; #67's are not).
- "Search three spots" never runs twice in a row in the same place.
- Fixes reuse existing objective kinds only (`chase-follow`, `checkpoints`, `convoy-ambush`, `race`, timers,
  `maxDamage`). No new kinds in the fix round.

Global rules GR1-GR10 are summarised under "Rules for every fix epic" below; read them in full in `decisions.md`.

#### D45. "Previously:" spoken aloud — G10#8, G11#8, G12#3a, G12#25 (and G12's opposite "what works" note) · **must**
- **The disagreement:** G10 and G11 say the spoken label breaks the fourth wall and flattens every voice. G12 lists
  "every brief opens with Previously: in the caller's voice" as working.
- **Options:**
  - (a) Keep the spoken label.
  - (b) A journal field plus in-voice clauses (GR4).
  - (c) A UI header line on the comms card, with no clause.
- **Decision:** (b), applied to all 70 rows (GR4).
- **Reason:** the context rule asks for the journal line "in the speaker's voice ... not a system note". The spoken
  label is a system note, and it hands characters knowledge they cannot have (Betony, the Countess, #32's skippable
  side quest).
- **Fix round:**
  - Add `previously` to the quest def and show it in the journal's Active card, filled for every row from the
    outline's "Previously" column, which already exists for each row.
  - Rewrite every comms step 0 that starts with the label.
  - Fix #29 (Frank), #32 (point at #25, not the side quest), #63 (choice-aware), #65 (the Countess).
  - Add a test: no comms line starts with "Previously".

#### D46. Every briefing ends on a price — G10#9, G11#9 · **must**
- **Options:**
  - (a) Keep the spoken fees.
  - (b) Show fees in a reward chip and keep them in dialogue only where money is the story (GR5).
  - (c) Remove fees from the briefing entirely.
- **Decision:** (b).
- **Reason:** the context rule is satisfied by "shown". The warm beats stop turning friends into clients. (c) would
  break the "what the player gets" item of the context rule.
- **Fix round:**
  - The reward chip goes on the comms card and the journal card.
  - Cut the spoken fees except in GR5's list.
  - Fix the odd payers: broke Cam (#30) pays in "the entry money back, someday"; Sorrel (#24) gives a favour.
  - Do this in the same pass as D45.

#### D48. Both endings get the same epilogue; Cam's choice is forgotten — G12#5, G12#3 · **must**
- **Options:**
  - (a) Two outro variants per option, as #62 already does.
  - (b) A choice-gated step inside one outro.
- **Decision:** whichever the scene runner already supports. #62's per-option `outro` is (a), so prefer (a). Add
  (b) only if (a) would duplicate 92 s of steps.
- **Fix round:**
  - **Ending shots:** A, clover through the stripe at dusk with Bracken kneeling; B, the neon grid at night with
    Lulu's horn.
  - **Cam's line, after Reginald:** if freed, "Cameron. You missed a leaf."; if left, Juniper picks the leaf off the
    broom's bench and says nothing.
  - **Text:** `bulletinB` for W19. #63's brief becomes choice-aware. The doneText follows the ending.

#### D50. Objective variety — G10#17, G12#14, G11#19 · **should**
- **Decision:** GR7, with the editors' fixes:
  - #33: tow the lock home on Hogweed's trailer as a checkpoint run, and drop the return passenger leg.
  - #34: Granny drives herself and needs escorting past an HOA van (a convoy).
  - #10: the scrap bins move to the Underspan heaps.
  - #67: the last step becomes an on-foot escort through the Green.
  - #44: the run home becomes a pursuit by an HOA gunboat using the existing boat chasers, or a timer as the fallback.
  - #45: "cross the quad with your cap down" becomes a short checkpoint route.

#### D55. All Hats leaves out the Don, Samphire, Brenda and Wally — G12#9 · **should**
- **Decision:** add two pitches. Big Lou hangs the Don's hat (Lou: "Don's. ...Borrowed."). Samphire's tricorn hangs
  with Brenda's flamingo feather. Tansy counts to nine.
- **Fix round:** W16 and `coalition-of-all-hats.md` follow. Wally's "By Air" is honoured by his flypast in the count
  scene, not by a hat: he keeps his own.

#### D56. Tansy's "Go." is undone in #57 — G12#26 · **could**
- **Decision:** the second variant. "Don't." / "You said go last time." / "That was a board. This is a parachute."


### Out of scope

- Anything not listed above, even in the same files: other findings have their own epic (`review/fix-plan.md`).
- New systems, online modes, other games.

## Code pointers

The editors' pointers are in each finding's "Where" line above (file, function, line, coordinates, URL flags such as `?interior=`, `?worldchange=`, `?time=night`, `?at=x,z,yaw`). Confirm each before writing an issue; line numbers are from commit 6d217da8.

## Contracts this epic provides for later epics

- None.

## Contracts this epic consumes from earlier epics

- FX21 `previously`, chip, allow-lists (FX24 lands last: leave both allow-lists empty) and D7. FX05 scene weather and key light; the could `clearAmbient` flag if it landed.
- FX07 Founders' Green names and W-rows.

## Online / mobile / achievements / prefabs / lore notes

- D48: prefer per-option `outro` variants (as #62 does); a choice-gated step only if (a) would duplicate 92 s.
- D56 (could): the second variant of Tansy's "Go.".
- GR7: #67's last step becomes an on-foot escort (D50).
- Lore: `npm run lore`; every ruling appended to rulings.md (the orchestrator renumbers in merge order).
- GR10 keeps the cast's distinct voices in act IV and the Spine Cut and the World's Edge.

## Risks and open questions (with the decision taken)

- `continues` auto-start must not fire twice on reload: a save test.

## Rules for every fix epic (from decisions.md)

- Decisions are final for batch 3. If a ruled fix proves impossible, take the ruling's fallback (or its cheaper
  option), and record it in `review/rounds.md`. Do not reopen the question.
- **GR9 scope guard:** no new systems (the only exceptions: the `previously` field, the reward chip, scene weather, the
  Gnomlet `mount(root)` adapter, the ambient-gnome `y`/`surface` field, the vehicle capsule, quest-scoped stage sets,
  choice-gated outro steps). No new online modes. Density passes are measured with `node tools/gta-perf.mjs --cpu 4` at
  the densest spot before and after, and may raise phone frame time there by at most 15%.
- **GR10 keep list:** the sign and dialogue voice, the HOA as the butt of the jokes, the gentle Flock, the kind moles,
  act IV's voices, Radio Adagio, the Spine Cut and the World's Edge, Casual handling and Casual-chassis traffic, the
  comms card on desktop, Gnomey Bird, the moored-only Bathtub Queen, "Tours at noon. Cargo at midnight." Rewrites add a
  clause; they do not replace a scene.
- **GR1 lore:** signature images change the game; positions, counts, colours and small facts change the lore. Every
  lore change gets a ruling appended to `docs/lore/rulings.md` (use the next free number on your branch; the
  orchestrator renumbers from R-237 in merge order). `npm run lore` must pass.
- Priorities: **must** is done this round and checked in R1 round 2; **should** is done unless it blocks a must;
  **could** only if there is room. Nits without a decision are *could*: do them where cheap, bundle several per issue.
- Edit only the files this brief owns. Hot files (`config.ts`, `app.ts`, `hud.ts`, save keys, the prefab catalog
  index, `rulings.md`, `AGENT_INDEX.md`) take small, additive edits only; conflicts are resolved at merge.
- Prefab rule for every new object (`@lawn/prefabs`), z-fight rule for anything flat (`flatLayer`), mobile by default
  (390x844 and 844x390, 44 px targets), keep LF line endings. Workers never commit; the lead commits on its branch.
- Load: at most ~30 worker issues. If decompose finds more, do the musts first, commit a working state, and report
  the rest as deferred.

## Done when

- `npm run build -w games/gnome-theft-auto` and `npm test -w games/gnome-theft-auto` pass (rerun a timing-sensitive file alone before calling it a regression).
- With the dev server up: `bash tools/smoke.sh <url> #ui canvas` reports no console errors.
- Any 3D scenery or prop change: `npm run zfight -- <url>` at each changed spot is clean.
- Prefabs added or changed: `npm test -w packages/prefabs` passes. Lore changed: `npm run lore` passes.
- Every finding above is visibly resolved: re-shoot its spot with `node tools/gta-shots.mjs <url> docs/roadmaps/gta-batch-3/review/shots/FX24/ <name>:<x>,<z>,<yaw>` at 960x600 and `--size 390x844` (same names as the editor's shot, listed under "Re-check"), and compare with the editor's shot in `review/shots/G<n>/`. Screenshots stay local (not committed), like the editors'.
- Quest-sim suites and cutscene-report green; `npm run lore` green; FX21 allow-lists empty.
- All 5 must findings are resolved; should and could findings are resolved or listed as deferred (with the reason) in the lead's report.
- The lead reports in at most 30 lines: branch, what landed per finding ID, what was deferred, perf numbers (if a density pass), known issues.
