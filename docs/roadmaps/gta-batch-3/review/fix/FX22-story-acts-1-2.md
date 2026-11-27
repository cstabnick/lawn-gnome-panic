# FX22 Story acts I-II: order, continuity, briefings, voices and variety
Wave: 7 · Depends on: FX05, FX07, FX21 · Kind: Fix (story)
Findings: 27 (G10#1, G10#4, G10#5, G10#7, G10#8, G10#9, G10#10, G10#11, G10#12, G10#13, G10#14, G10#15, G10#16, G10#17, G10#18, G10#19, G10#20, G10#21, G10#22, G10#23, G10#24, G10#26, G10#27, G10#28, G10#29, G10#30, G10#31) · Decisions: D25, D45, D46, D50, D51, D52, D57, D59

Inputs: the findings files `review/G<n>-*.md` (full text of each finding), `review/decisions.md`, `AGENTS.md`, `SOUL.md`, the game's rows in `AGENT_INDEX.md`. Paths are under `games/gnome-theft-auto/src/` unless they start with `packages/`, `docs/` or `tools/`.

## Goal

Acts I-II tell their story in the right order, spend each reveal once, keep their promises, sound like the bible, stop turning friends into clients, and stop being a taxi service.

## Scope

### Owned files (this epic may edit these, and only these, plus tests next to them)

- quests/story/01..35 row files, cutscene/scenes/story ch1*.ts, ch2*.ts, ch3*.ts (act I-II scenes), m02..m35 scene files (dialogue and blocking; FX05's light and weather stay)
- quests/unlocks.ts (act I-II rows)
- cutscene/cast.ts (Cam's look, G10#11)
- the act I-II comms in quests/comms*.ts

### Findings (27)

Each finding: ID (severity, type · priority, decision), what, where, the editor's proposed fix, the decision text when one applies, and where to re-check. Read the full finding in its file before planning its issue.

- **G10#1** (blocker, craft · **must**, D59) #15 Founder's Boot is told in the wrong order
  - What: p1 (Parade Permits) has the player steal the Boot float's keys, and p2 (Dress Rehearsal) rehearses driving it, but nobody has said why. The plan ("We steal the Boot and park it in the jury box." / "...Yes.") and the news of the tribunal ("Vesper has called an …
  - Where: `ch1-founders-boot-p1` comms 0 and `parade-permits-intro` (m15-founders-boot.ts); `founders-boot-intro` and `founders-boot-outro` (ch1d.ts); doneText in `quests/story/15-founders-boot.ts`.
  - Editor's fix: move the plan to the front. `parade-permits-intro` opens on Tansy with the Tattler: Vesper's tribunal on Trim Day will condemn three blocks (name them: the court and the skate bowls the player has used, see #2). Pip: "Okay, hear me out." The Boot in the jury box. Tansy: "...Yes." Then Hedda and the keys. The final's intro keeps only the parade and Reginald's charges (cut the bay beat). Done text: "Tribunal …
  - Decision: D59 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G10#4** (blocker, craft · **must**, D59) #35 spends the betrayal twice and contradicts #33 about the code
  - What: `ch3-salvage-raid-p2-mid` ends with Tansy working it out: "Two of us had the number." Pip: "I never wrote it down." Tansy: "Three." Then the final's intro (`salvage-raid-intro`) plays the reveal again: Pip "...Cam?", Tansy "How much?". And #33 said the …
  - Where: `cutscene/scenes/story/m35-salvage-raid.ts` (p2-mid), `ch3.ts`, `m33-the-bench-lock.ts` (outro).
  - Editor's fix: keep Tansy's rule from #33 ("Mine. Nobody else's."). End p2-mid on pictures only: the open shackle, the cot, the bare wall where the broom stood, and Tansy's face (no "Three"). Let the van door and Cam's broom carry the reveal in the final. If a line is wanted: Tansy, to herself: "Nobody else had it."
  - Decision: D59 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G10#5** (polish, craft · **should**) Vesper "does not negotiate twice", then invites the player to a viewing the next quest
  - What: #20 ends on "A pity. Porcelain does not negotiate twice." and an ambush. #21 opens with Vesper's card at the player's own door ("There are no conditions.") and the player goes, with nobody on the crew reacting to the ambush, the card or the address.
  - Where: `vesper-diner` (ch2b.ts), `m21-penthouse-viewing-intro` (m21-penthouse-viewing.ts), comms 0 for `m21-penthouse-viewing`.
  - Editor's fix: change #20's line to "Porcelain does not ask twice. It invites." and add one call before the gate (Granny or Tansy): "He wants you to see what you said no to. Go. Count the guards. Touch nothing." Vesper's card can keep "no conditions"; it is creepier with the warning in front of it.
  - Re-check: the spot and file named in Where (no editor shot)
- **G10#7** (polish, craft · **should**, D57) "Okay, hear me out" is used seven times in acts I–II
  - What: the direction notes make it one of the two cheapest ladders: planted at #15 p1, once an act, Tansy lets him finish in #54, Tansy says it in #70. It appears in #14 comms and intro, #15 final intro (labelled "Pip's first"), #22 banter, comms and intro, #26 …
  - Where: `quests/story/14-…`, `22-…`, `26-…`; `m14-drainpipe-court.ts`, `m22-off-air.ts`, `ch1d.ts`.
  - Editor's fix: keep exactly one in acts I–II, at #15 p1 (see #1). Replace the rest with Pip's other tic, the second sentence that undoes the first ("I have never heard of west. I have been west. Once.").
  - Decision: D57 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G10#8** (polish, craft · **must**, D45) "Previously:" is spoken aloud, the journal has none, and two recaps point at scenes the player may not have seen
  - What: the context rule asks for a one-line "Previously" in the journal. The journal (`quests/journal.ts`) has no such field; instead seven briefings say it out loud ("Previously: you cracked a lot of hats."). Frank (#29) recaps the knot-hole he was not at. …
  - Where: comms 0 of #7, #9, #24, #25, #29, #32, #33.
  - Editor's fix: add an optional `previously` line to the quest def and show it in the journal's Active card; turn the spoken lines into in-voice clauses ("Last time you brought my raft home. The chart says…"), and fix #32 to refer to #25.
  - Decision: D45 (quoted in full under "Decisions this epic applies").
  - Split: D45 mechanism: the `previously` field, the journal Active card line, the "no comms line starts with Previously" test. FX22 rewrites the act I-II step-0 lines. (part done by FX21)
  - Re-check: the spot and file named in Where (no editor shot)
- **G10#9** (polish, spirit · **must**, D46) Every briefing ends with its fee, including the sad ones
  - What: all 28 briefings in rows 2–35 state the reward ("Three hundred fifty acorns, hm."). It lands badly in the sincere and crisis rows: Pip's knot-hole (#26, "Tansy says the lift is worth two hundred fifty"), Bramble while Granny is cracked (#31), the party (#34 …
  - Where: comms 0 of `quests/story/02..35`.
  - Editor's fix: keep the fee only where money is the story (#2, #3, #11, #21's "for your time", #16). Elsewhere cut it, or let it be a favour ("Granny would say pie." is enough on its own).
  - Decision: D46 (quoted in full under "Decisions this epic applies").
  - Split: D46 mechanism: the reward chip on the comms card and the journal card. FX22 cuts the act I-II spoken fees. (part done by FX21)
  - Re-check: the spot and file named in Where (no editor shot)
- **G10#10** (polish, craft · **should**) Pip's radio jammer is never paid off
  - What: #10 is built around a jammer Pip will not explain ("Birds."). It never appears again except #33, where Tansy calls it "our jammer", though Pip hid it from her ("Quick, before Tansy asks what it is").
  - Where: `quests/story/10-under-the-span.ts`, `33-the-bench-lock.ts` comms 0; the scenes in m10.
  - Editor's fix: pay it off in #15's final: Pip jams the Hat Watch band so the Boot reaches the jury box (a call: "Birds!"), or in #35 p2 (the raiders' radios). Change #33's line to "Hogweed built Pip's mystery box. This time he builds something I can see."
  - Re-check: the spot and file named in Where (no editor shot)
- **G10#11** (polish, craft · **should**) Cam wears the HOA's colours from the prologue
  - What: Cam's preset is `{ hat: 0xf4f4f8, shirt: 0xc9b99b }`: porcelain white (Vesper's guards) and HOA beige. The bible says a drab olive cap, no beard, a chip on one ear, an HOA vest only after #35. So the "HOA vest" at the Patio Gate in #21 is no change at all …
  - Where: `cutscene/cast.ts` line 59 (`'turncoat cam'`), three scenes with an inline look (ch3.ts and others).
  - Editor's fix: olive cap and a Side-Valve apron; swap to the beige vest for #21's gate scene and from #35 on.
  - Re-check: the spot and file named in Where (no editor shot)
- **G10#12** (polish, craft · **should**) Nobody remarks that Cam works for the HOA after #21
  - What: the player sees Cam parking cars at the Patio Gate in an HOA vest (#21; Gary: "New valet. Do not talk to him."). From #30 to #34 the crew trusts him with the bench, the code and the party, and nobody mentions it. In #35 p1 Tansy knows: "He parks their cars at …
  - Where: #21 gate scene, #30/#33/#34 comms and scenes.
  - Editor's fix: one exchange in #30's intro: player "You park cars for Patio Heights?" Cam: "Tips. For the entry." Tansy (call, step 1): "Tips are tips. He sweeps here." Trust becomes a choice.
  - Re-check: the spot and file named in Where (no editor shot)
- **G10#13** (polish, craft · **should**) #12 contradicts #6, and the photograph contradicts itself
  - What: Juniper says "We last spoke at a funeral" and "We speak only in notices" (#12), but they spoke face to face in #6 (`two-coat-outro`: "Reginald. Your boss is a crook."). The photograph note says the taller child (Juniper, ten) holds the pencil; Reginald says …
  - Where: `quarter-inch-intro` (m12), comms 0 of `m12-quarter-inch-at-home`, the inspect note in `quests/story/12-…`, `quarter-inch-mid`.
  - Editor's fix: "We last spoke properly at a funeral." Make the note match his line (the taller holds the ruler).
  - Re-check: the spot and file named in Where (no editor shot)
- **G10#14** (polish, craft · **should**) #28's "Eleven permits, ten signatures" does not match #7, and the missing signature goes nowhere
  - What: #7 photographs three permits, all signed "R. Vance". #28 opens on "Eleven permits. Ten signatures. One brother." The unsigned one is never mentioned again; the scene is about a misspelled name.
  - Where: `m28-sibling-rivalry-intro`, comms 0 of `m28-sibling-rivalry`; #7 inspect notes.
  - Editor's fix: either "Three permits. Three signatures. One brother." or pay it off: the one he did not sign is the one he "corrected" (his doubt made visible).
  - Re-check: the spot and file named in Where (no editor shot)
- **G10#15** (polish, craft · **should**) Granny's secret silo is a silo the player has already towed
  - What: #31's outro tells of her late husband's silo "somewhere nobody counts", but in #18 Granny says "Reginald Vance's laser squad wants my acorn silo" and the player hauls "Granny's armored silo rig".
  - Where: `m31-granny-cracks-outro`, `sprinkler-intro` (ch2c.ts), `ch2-sprinkler-gauntlet` objective text.
  - Editor's fix: one clause: "Not the one in the yard, sugar. His." (and "Where is it?" stays unanswered).
  - Re-check: the spot and file named in Where (no editor shot)
- **G10#16** (polish, craft · **should**) #34's party is for something that happened 19 quests ago
  - What: Pip: "The Green is open! Rezoned, ours, legal." The rezoning was #15. The bulletin also puts Side-Valve "on the rezoned Green" (it is not).
  - Where: `m34-forty-seven-wrenches-intro`, comms 0, bulletins in `quests/story/34-…`.
  - Editor's fix: make it a party for something recent: the Tattler's front page from #28 ("Even-Estates permits: printed!"), or the Green's first market day. Fix the bulletin's location.
  - Re-check: the spot and file named in Where (no editor shot)
- **G10#17** (polish, spirit · **should**, D50) Act II turns into a taxi service
  - What: 15 passenger legs in act II (#22, #26 ×2, #28, #30 ×2, #31, #33 ×2, #34 ×3). Four of the five rows before the raid (#30, #31, #33, #34) are mainly "pick X up, drive to Y". "Crack the two X" opens #7, #22, #23, #24, #27, #28 and #31. #9 and #10 are back to …
  - Where: the objective lists of those rows.
  - Editor's fix: #33: Cam rides on the back, the player tows the lock home on Hogweed's trailer through the Underspan yard (a checkpoint run), or drop the return leg. #34: one guest arrives by Mabel's cab, Granny drives herself and needs escorting past an HOA van, so one leg is a convoy. #10: put the scrap bins at the Underspan heaps, not the Bodega alley.
  - Decision: D50 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G10#18** (polish, spirit · **should**, D51) The Buck-Iron combine is every job's vehicle
  - What: steal a combine in #8, flee in "Pip's getaway Combine" in #15, steal a combine in #16, and tow Driftwood's raft home behind a combine from Wader's Rest (−1130, −640) to his trailer in Cloverfield (34, 463), about 1.6 km (#25).
  - Where: `ch1-tax-break-in`, `ch1-founders-boot`, `ch2-dew-run`, `m25-one-leg-to-stand-on`.
  - Editor's fix: #15 getaway in Pip's Zero-Turn (the vehicle the act ends on in #35); #25 the Flock punt the raft across the loch and the player tows it from the loch shore with the barrow buggy, or the drop moves to the canal mooring #32 starts from (which also fixes #8's recap).
  - Decision: D51 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G10#19** (polish, spirit · **should**, D52) After the Grand Combine reveal, six quests pass without anyone mentioning it
  - What: #8 ends on "The Grand Combine. A harvester the size of a block. ... A Fescue Golden Acorn." Rows 9–14 (cat, jammer, cigars, calipers, diner, basketball) never refer to it, nor does #15. The next mention is #23.
  - Where: rows 9–15.
  - Editor's fix: one line in two of them, no new scenes: Frank in #13 ("Something the size of a block came down Route South on a low-loader. ...Not nice."), Hogweed in #10 ("Somebody's ordering blades by the thousand.").
  - Decision: D52 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G10#20** (polish, craft · **should**) #5: why can't Cam deliver the part himself?
  - What: "Why not take it yourself?" "Somebody has to sweep." Then Cam rides to the meet himself. The comms make it worse: "Somebody has to sweep. So it has to be you."
  - Where: `sweepers-wages-intro`, comms 0 of `m05-sweepers-wages`.
  - Editor's fix: make it shyness about Lulu: "I cannot hand it to her. You do it. I will show you the way." That sets up the stare at her charter plate.
  - Re-check: the spot and file named in Where (no editor shot)
- **G10#21** (polish, craft · **should**) #30's relay: who loses?
  - What: the player drives the "support stint" (never explained), `mustPlace: 3`, and the scenes always say Cam came last "by a lot". If the player wins their leg, the mid scene contradicts the race just driven.
  - Where: `quests/story/30-cams-big-night.ts`, `m30-cams-big-night-mid`.
  - Editor's fix: explain the relay in the brief ("You drive the first leg. I bring it home."), and let the mid scene branch on place, or write one line that covers both: Cam: "You gave me a lead. I gave it back."
  - Re-check: the spot and file named in Where (no editor shot)
- **G10#22** (polish, craft · **should**) #4: three bikes in the scene, two in the quest
  - What: Tansy: "Three Cloverfield farmers. Three bikes, clamped"; the quest repos two (and Pip's call says "One more!" after the first).
  - Where: `mowers-keepers-intro` (ch1.ts), `ch1-mowers-keepers` objectives.
  - Editor's fix: "Two farmers. Two bikes." (or add a third repo).
  - Re-check: the spot and file named in Where (no editor shot)
- **G10#23** (polish, craft · **should**) Chapter cards do not match the acts
  - What: the cards say "CHAPTER 2 — BLACK DEW & GREENBACKS" and "CHAPTER 3 — COLD CLAY"; the acts are "Turf & Dew" and "Cold Clay, Far Edges"; act I has no card. #35 p1 and p2 carry `chapter: 3`, so the journal tags act II's finale "Ch.3" before the Chapter 3 card …
  - Where: `dew-run-intro` (ch2.ts), `salvage-raid-intro` (ch3.ts), `founders-boot-outro` ("END OF CHAPTER 1"), `quests/story/35-salvage-raid.ts`.
  - Editor's fix: cards "ACT II — TURF & DEW", "ACT III — COLD CLAY, FAR EDGES", "END OF ACT I"; #35 parts `chapter: 2`.
  - Re-check: the spot and file named in Where (no editor shot)
- **G10#24** (polish, craft · **should**) Side quests unlock before their giver is met, or after the line that promises them
  - What: `sq-big-lou-embargo` unlocks after #9, but Lou is introduced in #11 ("Red Caps. Downtown. My towels." is context-free before then). Sorrel ends #23 with "The Elder has another stone on his mind. Come back for it." but `sq-fescue-fugitive` unlocks only after …
  - Where: `quests/unlocks.ts`.
  - Editor's fix: move Lou's embargo to `m11-the-dons-cigars`; move the fugitive to `ch2-unmowed-tablet`; move the croft deed to `m32-driftwoods-chart`.
  - Re-check: the spot and file named in Where (no editor shot)
- **G10#26** (polish, craft · **should**) Pip never says "Fescue" on the bench
  - What: Pip lies about Fescue twice ("Never been. Is that far?", #1; "Never heard of it. Sounds like a mower.", #10). The #14 bench pays it off with "Back home…" and never names the place.
  - Where: `drainpipe-court-outro`.
  - Editor's fix: "Back in Fescue, everything is already built." One word; the rest stays half told, as the bible wants.
  - Re-check: the spot and file named in Where (no editor shot)
- **G10#27** (nit, craft · **could**) Generic names clash with the cast
  - What: HOA Enforcer **Bramble** (#4), HOA Bodyguard **Loam** (#6), Surveyor **Loam** and Bailiff **Mulch** (#18), Night-Watchman **Plumb** (#7) and Watcher **Plumb** (#28). Random pedestrians draw first names Sorrel, Yarrow, Lovage and Teasel, and surnames …
  - Editor's fix: rename the enemies (Finch/Felt style: Tack, Grommet, Shim…); drop cast names from the NPC pools.
  - Re-check: the spot and file named in Where (no editor shot)
- **G10#28** (nit, craft · **could**) Units and scale
  - What: "a thirty-foot boot" (twice, #15 p2) in a game that measures in metres; "the Big Puddle" vs "the Puddle Sea" (#32).
  - Editor's fix: "a boot the size of a shed"; "the Puddle Sea".
  - Re-check: the spot and file named in Where (no editor shot)
- **G10#29** (nit, craft · **could**) Small context slips
  - What: #9's call at step 1 is Pip, who is not in the quest, and its brief repeats the scene's "cracked a lot of hats". #22: Sorrel wants Pip because "he knows vans", and he does nothing with the van (the real reason, the Elder, comes only in the outro). #24: "he is …
  - Editor's fix: #9 step 1 from John; #22 brief: "Bring Pip. The Elder asked for him."; #24: "he carries the Burrow's post".
  - Re-check: the spot and file named in Where (no editor shot)
- **G10#30** (nit, craft · **could**) Formatting of banter and money
  - What: passenger banter is quoted in some rows ('Cam: "Is this one yours?"', #33) and not in others ('Cam: Entry fee was six weeks of tips.', #30; Granny in #31). "acorns" and "Acorns" alternate, sometimes in one brief.
  - Editor's fix: one style (quoted) and the capitalised currency, as the prologue narrator has it.
  - Re-check: the spot and file named in Where (no editor shot)
- **G10#31** (nit, craft · **should**, D25) "Tuesday" as a throwaway joke dilutes the betrayal's code word
  - What: besides Cam's "Tuesday. The charter's mine." (#34) and #35 p1, Tuesday is a passing gag in #9 (Fennel: "She turned up on Tuesday") and #31's bulletin ("not blinked since Tuesday"). The prologue's "Must be Tuesday" is a good plant; the others blur it.
  - Editor's fix: use another day in #9 and #31.
  - Decision: D25 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)

### Decisions this epic applies (quoted from decisions.md)

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

#### D25. Running gags repeated until they become tics — G4#30, G4#31, G10#31, G11#11, G11#12, G11#30 · **should**
- **Rule:** a running gag appears **once per place**, and at most about three times per region, except where it is a
  planted ladder (the story's code words, "Okay, hear me out": see D57).
- **Fix round:**
  - G4#31: keep "41" on the sheep (tag and tally) and on Velma's buns. Change the mittens count. Keep "two hats" on one
    road sign. Rewrite the camper's note.
  - G4#30: the Capwood photographer becomes something only Capwood has: a spore-sweeper's broom and a jar of glow.
  - G10#31: "Tuesday" is used only in the betrayal code and in the prologue's "Must be Tuesday". #9 and #31 use other
    days.
  - G11#11, #12, #30: thin out reused bible lines, "eleven" and "so it is stood" in the act III voice pass (GR4).

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

#### D50. Objective variety — G10#17, G12#14, G11#19 · **should**
- **Decision:** GR7, with the editors' fixes:
  - #33: tow the lock home on Hogweed's trailer as a checkpoint run, and drop the return passenger leg.
  - #34: Granny drives herself and needs escorting past an HOA van (a convoy).
  - #10: the scrap bins move to the Underspan heaps.
  - #67: the last step becomes an on-foot escort through the Green.
  - #44: the run home becomes a pursuit by an HOA gunboat using the existing boat chasers, or a timer as the fallback.
  - #45: "cross the quad with your cap down" becomes a short checkpoint route.

#### D51. The Buck-Iron Combine as every job's vehicle — G10#18 · **should**
- **Decision:**
  - #15's getaway is in Pip's Zero-Turn, the vehicle act II ends on.
  - #25's tow is cut to the loch shore: the Flock punt the raft across, and the player tows it from the shore with the
    barrow buggy to the canal mooring that #32 starts from. That also fixes G10#8's #32 recap.
  - #8 and #16 keep their combines.
- **Reason:** "Combine" must stay the villain's word, and the 1.6 km empty tow is dead time.

#### D52. Six quests without a mention of the Grand Combine — G10#19 · **should**
- **Decision:** add one line each to two existing comms or banter lines, with no new scenes. Frank in #13 ("Something
  the size of a block came down Route South on a low-loader."). Hogweed in #10 ("Somebody's ordering blades by the
  thousand.").

#### D57. "Okay, hear me out": too often in acts I–II, missing in act III — G10#7, G11#1c (the two editors agree; a ruling makes it binding) · **should**
- **Decision:** exactly one per act, per the direction notes:
  - Act I: #15 p1.
  - Act II: one, at the writer's choice, from the existing six (keep #22's).
  - Act III: Pip in #46 (the ramp).
  - Act IV: as built (#54, #57 fixed per D56, #70).
  - Replace the rest with Pip's self-undoing second sentence.

#### D59. G10's act-turn blockers that touch spirit — G10#1, G10#4 (craft; noted for order) · **must**
- **Decision:** these are craft fixes, and they stay with G10's proposals. They are listed here only so the fix lead
  does them together with D1 and D45: #15's plan and the tribunal move into the p1 brief, and #35 spends its reveal
  once.


### Out of scope

- Anything not listed above, even in the same files: other findings have their own epic (`review/fix-plan.md`).
- New systems, online modes, other games.

## Code pointers

The editors' pointers are in each finding's "Where" line above (file, function, line, coordinates, URL flags such as `?interior=`, `?worldchange=`, `?time=night`, `?at=x,z,yaw`). Confirm each before writing an issue; line numbers are from commit 6d217da8.

## Contracts this epic provides for later epics

- None.

## Contracts this epic consumes from earlier epics

- FX21 `previously` and reward chip: rewrite every act I-II step 0 that starts with "Previously" (GR4 in-voice clause only where needed) and cut fees except GR5's list (#2, #3, #11, #16, #21). Remove these rows from FX21's allow-lists.
- FX07 names: before #15 the place is "the condemned blocks" / "Gnorwin Park" (GR2 test).
- FX05 key frames for #14, #15, #21, #34.

## Online / mobile / achievements / prefabs / lore notes

- D59 with D1 and D45: #15's plan and the tribunal move into the p1 brief; #35 spends its reveal once.
- D57: one "Okay, hear me out" in act I (#15 p1) and one in act II (writer's choice; keep #22's).
- GR7: no more than two consecutive passenger rows; use existing objective kinds only.
- GR10: rewrites add a clause, they do not replace a scene.

## Risks and open questions (with the decision taken)

- Objective changes (#10, #15, #25, #33, #34) touch the quest sim: run `npm run quest-sim:suites` and `npm run cutscene-report`.

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
- Every finding above is visibly resolved: re-shoot its spot with `node tools/gta-shots.mjs <url> docs/roadmaps/gta-batch-3/review/shots/FX22/ <name>:<x>,<z>,<yaw>` at 960x600 and `--size 390x844` (same names as the editor's shot, listed under "Re-check"), and compare with the editor's shot in `review/shots/G<n>/`. Screenshots stay local (not committed), like the editors'.
- Quest-sim suites and cutscene-report green; the GR2 test green; FX21 allow-lists contain no act I-II row.
- All 4 must findings are resolved; should and could findings are resolved or listed as deferred (with the reason) in the lead's report.
- The lead reports in at most 30 lines: branch, what landed per finding ID, what was deferred, perf numbers (if a density pass), known issues.
