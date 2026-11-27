# FX23 Story act III: the crew, the turn, voices, stakes and set pieces
Wave: 8 · Depends on: FX05, FX21, FX14, FX15, FX16 · Kind: Fix (story)
Findings: 29 (G11#1, G11#2, G11#3, G11#4, G11#5, G11#6, G11#7, G11#8, G11#9, G11#10, G11#11, G11#12, G11#13, G11#14, G11#15, G11#19, G11#20, G11#21, G11#22, G11#23, G11#24, G11#25, G11#26, G11#27, G11#28, G11#29, G11#30, G11#31, G11#32) · Decisions: D25, D45, D46, D47, D50, D53, D54, D57

Inputs: the findings files `review/G<n>-*.md` (full text of each finding), `review/decisions.md`, `AGENTS.md`, `SOUL.md`, the game's rows in `AGENT_INDEX.md`. Paths are under `games/gnome-theft-auto/src/` unless they start with `packages/`, `docs/` or `tools/`.

## Goal

Act III keeps its crew (D47), its logic and its voices (GR4 voice pass), gives its set pieces stakes and a finish (D53, D54), and stops repeating its tics (D25).

## Scope

### Owned files (this epic may edit these, and only these, plus tests next to them)

- quests/story/36..53 row files, cutscene/scenes/story ch3b.ts, ch3c.ts and m36..m53 (dialogue and blocking; FX05's light, weather and the m52 re-block stay)
- quests/unlocks.ts (act III rows), tessie.ts (giver)
- worldChanges/defs.ts (W11, W13, W14 rows) and worldChanges/rows/mownScar.ts
- quests/storyMarks.ts (act III marks)
- docs/lore nubbin.md and act III entries

### Findings (29)

Each finding: ID (severity, type · priority, decision), what, where, the editor's proposed fix, the decision text when one applies, and where to re-check. Read the full finding in its file before planning its issue.

- **G11#1** (blocker, spirit · **must**, D47, D57) The crew vanishes for twelve quests; "we split the four parts" is never paid off
  - What: In #39 Tansy says "Four parts, four edges. Power first. We split them from here." From #40 to #51, Tansy has no line at all, in any scene or comms. Pip is in the #46 p2/p3 and final scenes (with no explanation of how he got from your couch to Rootwell) and …
  - Where: `m39-couch-surfing-outro` (the split line); comms of rows 40-51 (no `pip`/`tansy` entries except #46); `m46-...-intro` (Pip stays); `m52-...-p3-intro`.
  - Editor's fix: No new systems: comms and short scene beats only. (a) One short call per part cut: Tansy after #41 ("Power. One down. Pip's been sleeping in your bath."), Pip after #44 and #46, Tansy after #50, each also showing what *they* did with their share of the split (Tansy works the culvert and the HOA radio net; Pip scouts Hedgeworth from the couch). (b) A two-line Pip-and-player beat in the #46 p2 intro saying why Pip is …
  - Decision: D47, D57 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G11#2** (polish, craft · **should**) "Vesper sees the player's face for the first time" contradicts acts I-II
  - What: The header of `m50-trellisdown-tasting` and the outline call the tasting "the first time the two share one frame". But Vesper sits across a booth from the player and makes an offer in `vesper-diner` (ch2b, #20), and talks to them face to face at the penthouse …
  - Where: `cutscene/scenes/story/m50-trellisdown-tasting.ts` MID; outline row 50; `characters.md` Vesper arc III.
  - Editor's fix: Make the look a recognition. Vesper looks, the music drops, and his single soft line is "The gnome who would not take a penthouse." Then the Countess's "Vesper. You are staring at the help." This raises the stakes for #52 (he knows who is caddying), and Peony's bib in #52 becomes a real risk. Update the outline and character bible wording ("first shared frame since the diner").
  - Re-check: the spot and file named in Where (no editor shot)
- **G11#3** (polish, craft · **should**) Nubbin's history does not fit together (#24 vs #48/#49)
  - What: In #24 Nubbin is chased through Mossy Wood and carried home through the Burrow Door. His lore says he is "the one who first got lost above ground". In #48 he is the mole who has saved Basil's ball from the sprinkler "every evening at seven" under the ninth …
  - Where: `m48-the-groundskeepers-secret-mid/-outro`, `m49-loamdeep-intro`, `docs/lore/entries/apocrypha/nubbin.md`.
  - Editor's fix: Make the ninth-green family Nubbin's *cousins* (the Sifts' Hedgeworth branch). Nubbin comes up in the #48 mid to speak for them ("If you please, sir. It was my cousin Pim, and I am very sorry about your ball."), and he bows to the player first ("Most kind, again."). Alternatively keep Nubbin as the ball-saver and add one #48 line that explains it ("He runs the post up here. That is how he got lost, the first …
  - Re-check: the spot and file named in Where (no editor shot)
- **G11#4** (nit, craft · **could**) The mole family is moved to Thrift's shed in #48, then evacuated from the ninth green in #52
  - What: #48 drives "the mole family" from the ninth green to Thrift's shed so that Basil cannot trap them. In #52 p2 Peony says "the moles are under my ninth", and the player drives "Tumblesoil and the ninth-green family" off the green to the Burrow Door. The …
  - Where: `quests/story/48-*.ts`, `52-*.ts` p2 objective 0 and comms; `quests/unlocks.ts` line 100.
  - Editor's fix: Add one line in the #52 p2 intro: Thrift says "They went home to the green when Basil made his peace." Or have p2 pick them up at the shed (it stands by the ninth anyway) and change the objective text to match.
  - Re-check: the spot and file named in Where (no editor shot)
- **G11#5** (polish, craft · **should**) The four-parts logic has holes at the turn
  - What: Ragwort says "The Combine charges at nought percent" (#41) and the lens is taken (#46), yet the deck runs and cuts a straight line in #52 with no word on how. The "money part" is only *photographed* in #50, yet the #52 outro says "And stopped three." Nothing …
  - Where: `m41-pinwheel-ridge-outro`, `m50-*-outro` caption, `m52-the-test-cut-outro` (Tansy/player), outline act 3 intro.
  - Editor's fix: Two lines. In the #52 p1 mid, Vesper tells the Countess "The deck needs no ridge and no lens for one night. Little flags will do." The survey flags are already in the scene, so this pays them off. In the outro, replace "And stopped three." with "And cost him three." Have Juniper's #50 outro caption or #51 comms say what the photo will do in act IV (it pays off in #65 *The Countess Relents*).
  - Re-check: the spot and file named in Where (no editor shot)
- **G11#6** (polish, craft · **should**) Four disguises in one act, and none of them is worn in play
  - What: The plain cap over the hat (#39), the faculty gown (#46 p1), the waiter outfit (#50) and the caddy bib (#52 p1) are all text and cutscene only. Each of those quests sets `hoa: 'off'`, so there is also nothing to hide from. #50's outro dresses the player in a …
  - Where: `39-couch-surfing.ts` obj 0; `46-*.ts` p1; `50-*.ts`; `52-*.ts` p1; E21 known gaps (waiter outfit).
  - Editor's fix: Use the gnome package's own hook (`setEquipmentOverride`, as AGENTS.md prescribes) to wear each disguise during its objective: a head override for the plain cap, a back override for the gown (the `faculty-gown` prefab already exists as the Sugar Landlord reward), a neck or back override for the bib, and the tray as a held item. Clear the override on completion. Where a quest has no stealth, reword it so it doesn't …
  - Re-check: the spot and file named in Where (no editor shot)
- **G11#7** (polish, craft · **should**) Text promises things the game does not do
  - What: - #37 outro and doneText: "The Woolly Sock Lodge is the crew's base now: a bed, a wardrobe, a door the plows cannot find" / "Bunk, wardrobe... This lodge is yours." There is no save point, wardrobe or marker. - #45 doneText: "A Rootwell student badge on your …
  - Where: `37-snowdrop-slope.ts`, `m37-...-outro`, `45-rootwell-admissions.ts`, `quests/storyMarks.ts`.
  - Editor's fix: Register the lodge as a home through the same `registerHome` path the wind-farm hut uses (save and sleep), or else reword to "a bunk whenever you pass". Add the missing `m45` marker (the Anthill). Have the part markers update their labels as each part is done ("Power: cut", "Guidance: taken", "Money: on film", "Deck: tested (not stopped)"). Reword the badge to something cosmetic, or grant the mortarboard as a head …
  - Re-check: the spot and file named in Where (no editor shot)
- **G11#8** (polish, spirit · **must**, D45) Characters say the word "Previously:" out loud
  - What: 14 of the 18 act III briefings open with the literal label "Previously:" inside a character's line: Gentian's "Previously: you have a bunk and no plan."; Saxifrage's "Previously, I foretold the Even Cut."; Betony's "Previously: Captain Bilge flies your flag." …
  - Where: comms step 0 of rows 37-40, 43-46 (twice), 48-51.
  - Editor's fix: Rewrite each as an in-voice recap: Gentian: "Up, up, up! You have a bunk. Now you need a plan." Betony: "I hear a pirate flies your colours. Good: I need someone who does odd things." If a mechanical recap is wanted, show it as a separate journal "Previously" line (the spine already asks for one) or a briefing header.
  - Decision: D45 (quoted in full under "Decisions this epic applies").
  - Split: D45 mechanism (see G10#8). FX23 rewrites the act III step-0 lines. (part done by FX21)
  - Re-check: the spot and file named in Where (no editor shot)
- **G11#9** (polish, spirit · **must**, D46) Every briefing ends on a price, in the speaker's voice
  - What: Almost every step-0 brief closes with the reward amount: "Two hundred fifty acorns", "Six hundred fifty acorns", and Peony, fleeing a giant mower, saying "Seven hundred and fifty." Betony's "Two hundred and fifty acorns, as I was saying." turns her trait into …
  - Where: comms of every row 36-53 (`kit.ts` `brief`).
  - Editor's fix: Show the reward in the briefing UI (or a chip), and keep it in dialogue only where paying is part of the character: Sal's sock bargains, Samphire's "No questions, some invoices", Chanterelle's fines.
  - Decision: D46 (quoted in full under "Decisions this epic applies").
  - Split: D46 mechanism (see G10#9). FX23 cuts the act III spoken fees. (part done by FX21)
  - Re-check: the spot and file named in Where (no editor shot)
- **G11#10** (polish, craft · **should**) Everyone speaks in one register; Pip has drifted off his bible
  - What: Of 390 spoken lines in act III scenes, 17 (4%) use a contraction; acts I-II use them in 11%. Pip's bible voice is "fast, run-on, exclamation marks... a second sentence that undoes the first", but his 43 act III lines have 2 contractions and 7 exclamations …
  - Where: all act III scenes; `characters.md` voices for Pip, Thrift, Vesper.
  - Editor's fix: A voice pass per character against the bible. Pip gets contractions, run-ons and self-undoing second sentences ("I'm not scared of ants! I'm a bit scared of ants."). Driftwood gets his sea-words-for-land tic (none in #43/#44). Lulu laughs first. Thrift goes gruff ("They're no trouble, the little ones"), with "my dear" left to Peony. Vesper stays the only one with perfect grammar.
  - Re-check: the spot and file named in Where (no editor shot)
- **G11#11** (polish, craft · **should**, D25) Bible sample lines reused word for word, until they become catchphrases
  - What: Many bible example lines appear verbatim and are then repeated: Ragwort "Naturally the hard ones" / "Torque is a mood. Mind the mood." ("Naturally" 4 times, "Mind the mood" 3 times); Clary "Go on, then" 4 times and "The berm remembers" 3 times in two short …
  - Where: `m41`, `m42`, `m51`, `m52`, `m45`, `m44`, `m43`, `m49`, `m46` scenes and comms.
  - Editor's fix: At most one signature tic per scene per character, and no bible line used verbatim more than once in the game. Write new lines in the same voice. Give "Mind the..." to one character (Theo or Tansy) and cut it from the rest.
  - Decision: D25 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G11#12** (nit, craft · **should**, D25) "Eleven" everywhere
  - What: Tansy was gone "Eleven days"; the ants were unpaid for "eleven days"; Nubbin's post is "Eleven days late"; Old Spin stalled "eleven years"; Chanterelle fines "Eleven bruised caps... Eleven acorns each". The number appears 16 times in act III.
  - Where: `m39` outro, `46-*.ts` bulletin, `m49` intro, `m41`, `m40` outro.
  - Editor's fix: Keep Chanterelle's eleven (it is her bible line) and Tansy's eleven days. Change the rest (nine years, a week late, and so on).
  - Decision: D25 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G11#13** (polish, craft · **should**) Betony is both barred from Rootwell and its faculty
  - What: In the #45 intro Betony says "Rootwell no longer admits me. Enrol as a mature student." In #46 p1 the Dean greets her as "Professor Sextant. Out late. With a colleague?", she lends a *faculty* gown ("Faculty walk the quad at night"), and she is in the library …
  - Where: `m45-rootwell-admissions-intro`; `m46-...-p1-intro`.
  - Editor's fix: Make it "Rootwell no longer lets me near the observatory. The Dean signs the keys." She keeps her rooms and her gown, the Anthill is what she is barred from, and the work order under the lens pays this off.
  - Re-check: the spot and file named in Where (no editor shot)
- **G11#14** (polish, spirit · **should**, D53) #46, the act's extended set piece, ends on foot
  - What: The outline's finale is "fly out with Wally". The build ends with a visit to "Wally's chair by the Field's tower", and Wally flies in a 3-line, 24.8 s outro. Nobody from the act (Pip, Betony) is in it, and "Going home" never says where home is.
  - Where: `46-starfall-at-the-anthill.ts` final, objective 2; `m46-...-outro`.
  - Editor's fix: Let the player fly. Plane quests already exist: take off from Rootwell Field with Wally in the second seat on the radio, and reach one air checkpoint over the Anthill (the dome open below, W12) before the outro. Give the outro one more beat: Wally asks "Where to, kid?" and the player answers "The lodge."
  - Decision: D53 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G11#15** (polish, spirit · **should**, D54) The #50 heist has no stakes
  - What: "Trellisdown Tasting" is visit, visit (interior), inspect, visit, with `hoa: 'off'`. The ledger lies open on a lectern on the forecourt (the fallback for the study that was never built), and Chicory only stops you in a cutscene. The infiltration has no way to …
  - Where: `quests/story/50-trellisdown-tasting.ts`.
  - Editor's fix: Keep it light, but add one real constraint. Either a "keep the tray level" carry (a damage limit on the tray, as the #51 roller uses a low `maxDamage`), or a timed photograph while Chicory's lantern circles. Stage the ledger on a guarded side table under the terrace awning rather than on a public lectern.
  - Decision: D54 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G11#19** (polish, spirit · **should**, D50) Objective variety thins out in the ally run
  - What: #45 is four visits in a row (drive, cross, find, follow). #38 and #47 are visit-heavy, and #43 is visit, probe, probe, visit. Across 36-53 there is one race (#40), one dirt race (#42), and no chase except a cutscene-only gunboat in #44 (the outline's "outrun …
  - Where: `45-rootwell-admissions.ts`, `44-the-bathtub-queen.ts` obj 2, `38-pail-pond.ts`.
  - Editor's fix: Make #44's run home a real pursuit: an HOA gunboat as a traffic chaser using the boat kinds that already exist, or at least a timer. In #45, turn "cross the quad with your cap down" into a short checkpoints route away from the Dean's line of sight, like the #46 p1 shape.
  - Decision: D50 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G11#20** (polish, craft · **should**) #53, the act's closer, is thin
  - What: The title is still "Volatile on Ice" (the old quest's volatile cargo), but the cargo is now a stone. Loam's brief repeats news the player heard one scene earlier ("Vesper named the day"). Nobody says what the Stopping Stone stopped, or why lending it matters …
  - Where: `53-tundra-drift-run.ts`, `ch3c.ts`.
  - Editor's fix: Retitle it (e.g. "The Stopping Stone"). Have Bracken say in one line what it stopped ("The last machine that came for the Unmowed met this, and turned round."). Replace Loam's repeat with a reaction ("The whole Fells heard it, my child."). Add one closing beat in the tundra outro: Tansy looks at the overlook and says, with her stress tell, "I need a coffee." (her chicory coffee is allowed twice in the game).
  - Re-check: the spot and file named in Where (no editor shot)
- **G11#21** (polish, craft · **should**) Side quests contradict where people are, and two outline unlocks are missing
  - What: Tessie unlocks after #40 with Driftwood waiting "on the Loch Moss shore". From #43 he lives at the Last Tube, so if Tessie is left undone he stands in two places. `sq-hedgeworth-ninth-green` (after #50) has the moles under the green (see finding 4). The …
  - Where: `quests/unlocks.ts` 85, 100; `tessie.ts`; E21 roadmap "Not built".
  - Editor's fix: Hide the Loch Moss Driftwood once #43 is done and move the Tessie giver to the Last Tube ("Saw her from the sea, friend"). Fix the ninth-green "why" text. Either build the two missing side quests or record a reasoned deferral in the tracking doc.
  - Re-check: the spot and file named in Where (no editor shot)
- **G11#22** (polish, craft · **should**) World changes are one beat late or missing their half
  - What: W11 ("Tubes: they float") fires after #44, though the Last Tube opened in #43 ("The Last Tube is open"). W13's root stall on Bodega's street has no mention in #49 (Tumblesoil never says the Burrowfolk will trade topside). W14 builds only the Hedgeworth scar …
  - Where: `worldChanges/defs.ts` W11, W13, W14; `worldChanges/rows/mownScar.ts`.
  - Editor's fix: Move W11's hut board to `after: m43` and keep the Queen's flag on m44. Add one line in the m49 outro: "Roots for the market, now we're asked". Build the empty Lady plinth at Wader's Rest for W14 (one prop and the Flock facing it).
  - Re-check: the spot and file named in Where (no editor shot)
- **G11#23** (nit, craft · **could**) Gentian speaks on comms before she is introduced
  - What: `m37` comms step 2, "Take the lodge door! I will hold the gate.", plays before the outro where her intro card appears. The player hears a stranger called "Gentian" giving orders.
  - Where: `37-snowdrop-slope.ts` comms 2; `m37-snowdrop-slope-outro`.
  - Editor's fix: Give that call to Pip ("A lady at the lodge door is waving a flag at us!"), or move Gentian's card to the `-mid` scene with a long shot of her at the gate.
  - Re-check: the spot and file named in Where (no editor shot)
- **G11#24** (nit, craft · **could**) Lines that assume context the player doesn't have
  - What: Lulu's "Your Cam took one home. Read my plate all night, once." (#40) is too elliptical to connect to #5/#34. Peony's "Your radio says the Combine's deck will be tried here." (#47 brief) refers to a radio the player never mentioned to her. Clary's "East, past …
  - Where: `m40-the-capwood-run-intro`; `47-hedgeworth-links.ts` comms 0; `42-rutbottom-impound.ts` comms 0.
  - Editor's fix: Lulu: "Your friend Cam signed one. Stared at my plate all night first." Peony: "Vesper's letter says her deck will be tried here." Clary/Lulu: "East, past the university."
  - Re-check: the spot and file named in Where (no editor shot)
- **G11#25** (nit, craft · **could**) Driftwood contradicts himself between briefing and scene
  - What: The #43 brief says "I saw the glow and could not cross. Friend, I crossed." The intro then has the player ask "You crossed the dunes?" and Driftwood answer "Only to the edge."
  - Where: `43-saltbucket-boardwalk.ts` comms 0; `m43-saltbucket-boardwalk-intro`.
  - Editor's fix: Brief: "Friend, I made it to the edge." Keep the scene as written.
  - Re-check: the spot and file named in Where (no editor shot)
- **G11#26** (nit, craft · **could**) Pinwheel Ridge numbering and counts disagree
  - What: Ragwort says "The cable at the first" (the first of Old Spin, Sulks and Whirly Bob), but the objective says "Old Spin, the second pinwheel". She says "Ten pinwheels. Not one turning" and "All ten" at the end, though only three were re-cabled, and the scene …
  - Where: `m41-pinwheel-ridge-intro/-outro`; `41-pinwheel-ridge.ts` objectives.
  - Editor's fix: "The cable at Old Spin, second on the ridge." Add one line: "One cable on three, and the governor stops all ten. Naturally."
  - Re-check: the spot and file named in Where (no editor shot)
- **G11#27** (nit, craft · **could**) Juniper's call: who called whom?
  - What: The giver says "Answer Juniper's call", but in the scene Juniper's phone rings twice and she answers "Vance." ("You sound underground."), which reads as the player calling her.
  - Where: `50-trellisdown-tasting.ts` giver `juniper-call`; `m50-trellisdown-tasting-intro`.
  - Editor's fix: She dials instead: the pencil stops, she picks up the receiver and says "It's Vance. You sound underground. Good."
  - Re-check: the spot and file named in Where (no editor shot)
- **G11#28** (nit, craft · **could**) Time-of-day continuity in #37-#38
  - What: The m37 intro is golden (Theo: "not safe past morning"), the mid and the outro are both noon (the outline has the outro at night, with Gentian showing "the bunk room"), and the m38 intro is noon again. Nights in a bunk never happen on screen.
  - Where: `m37-snowdrop-slope.ts` skies; `m38-pail-pond.ts`.
  - Editor's fix: Make the m37 outro `night` with a lit stove, and make the m38 intro a morning (`golden`).
  - Re-check: the spot and file named in Where (no editor shot)
- **G11#29** (nit, craft · **could**) The player's lines break the "straight man" rule in sincere beats
  - What: The bible caps the player at one line in three of any exchange, at two to six words. The #43 outro alternates 1:1 ("It is real." / "The glow?" / "And tomorrow?"), and in the #47 intro the player argues in full sentences ("It will cut everything. Every lawn.").
  - Where: `m43-saltbucket-boardwalk-outro`, `m47-hedgeworth-links-intro`.
  - Editor's fix: In #43, cut "And tomorrow?" and let Driftwood carry the line alone. In #47, give "every lawn" to Peony as the thing she refuses to hear.
  - Re-check: the spot and file named in Where (no editor shot)
- **G11#30** (nit, craft · **should**, D25) The Flock's "so it is stood" swamps Saxifrage
  - What: Seven uses of "so it is stood" in two short scenes and their comms, sometimes twice in a row ("On one leg. One is plenty. So it is stood." then "So it is stood." on the next line).
  - Where: `m51-the-flock-stands-intro/-outro`, `51-the-flock-stands.ts` comms.
  - Editor's fix: Twice per scene at most. Let Brother Godwit's question and "Each other, Brother" carry the warmth (a good beat as written).
  - Decision: D25 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)
- **G11#31** (nit, craft · **could**) Pip's whereabouts between #39 and #53 are never explained
  - What: Pip moves onto the couch (#39, W09), turns up at the Anthill door (#46 p2) with no setup, stays there ("Somebody has to carry the sugar"), arrives at Hedgeworth with Tansy (#52), and is at the Fells basin for #53.
  - Where: as listed.
  - Editor's fix: One line each: #46 p2 ("Tansy sent me on the Snail-Coach"); #52 p3 is already covered; tundra-intro (Pip: "Bracken made me carry the scarf").
  - Re-check: the spot and file named in Where (no editor shot)
- **G11#32** (polish, spirit · **should**, D47) Act III has no on-screen reckoning with the Salvage Raid losses
  - What: The act opens with "Side-Valve is seized, the Golden Acorn is gone" (#35/#36). After Pip's "My hammock is evidence" in #39, neither the Acorn nor the bay comes up again in act III. Tansy's reunion skips the bay entirely, even though losing "the place she …
  - Where: `m39-couch-surfing-outro`; the act's scenes generally.
  - Editor's fix: Give Tansy one raised-voice beat about the bay, either in the #39 culvert after the hug ("They chained my bay. MY bay.") or at the #52 hedge. That would be her one break in act III.
  - Decision: D47 (quoted in full under "Decisions this epic applies").
  - Re-check: the spot and file named in Where (no editor shot)

### Decisions this epic applies (quoted from decisions.md)

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

#### D47. The crew vanishes in act III; Tansy's break — G11#1 (blocker), G11#32 · #1 **must**, #32 **should**
- **Decision:** G11's fix, as comms and short scene beats only:
  - one call per part cut (Tansy after #41 and #50, Pip after #44 and #46), each saying what the caller did with their
    share of the split;
  - Pip's reason for being at Rootwell, in the #46 p2 intro;
  - Pip's one act III "Okay, hear me out" (D57).
  - #32: Tansy's one raised-voice beat about the bay ("They chained my bay. MY bay."), in the #39 culvert after the hug.
- **Reason:** "more character development" is the user's first story ask (L84), and it is Tansy's bible arc ("never
  raises her voice until act III").

#### D50. Objective variety — G10#17, G12#14, G11#19 · **should**
- **Decision:** GR7, with the editors' fixes:
  - #33: tow the lock home on Hogweed's trailer as a checkpoint run, and drop the return passenger leg.
  - #34: Granny drives herself and needs escorting past an HOA van (a convoy).
  - #10: the scrap bins move to the Underspan heaps.
  - #67: the last step becomes an on-foot escort through the Green.
  - #44: the run home becomes a pursuit by an HOA gunboat using the existing boat chasers, or a timer as the fallback.
  - #45: "cross the quad with your cap down" becomes a short checkpoint route.

#### D53. #46 ends on foot — G11#14 · **should**
- **Decision:**
  - The player flies out: take off from Rootwell Field with Wally on the radio, and reach one air checkpoint over the
    open dome (W12).
  - Add the outro beat: "Where to, kid?" / "The lodge."
  - Plane quests already exist, so this uses an existing kind.
  - Fallback if the air checkpoint is unreliable in the quest sim: Wally flies, and the player rides as a passenger
    over the Anthill (a scene).

#### D54. The #50 heist has no stakes — G11#15 · **should**
- **Decision:**
  - One real constraint: a timed photograph of the ledger while Chicory's lantern circles. A failed attempt restarts
    the step, with the checkpoint auto-retry.
  - The ledger moves to a guarded side table under the terrace awning.
  - Use the tray-level `maxDamage` variant only if a timer is not available on the probe or inspect kind.
- **Reason:** tension 7 must be playable, and it should stay light.

#### D57. "Okay, hear me out": too often in acts I–II, missing in act III — G10#7, G11#1c (the two editors agree; a ruling makes it binding) · **should**
- **Decision:** exactly one per act, per the direction notes:
  - Act I: #15 p1.
  - Act II: one, at the writer's choice, from the existing six (keep #22's).
  - Act III: Pip in #46 (the ramp).
  - Act IV: as built (#54, #57 fixed per D56, #70).
  - Replace the rest with Pip's self-undoing second sentence.


### Out of scope

- Anything not listed above, even in the same files: other findings have their own epic (`review/fix-plan.md`).
- New systems, online modes, other games.

## Code pointers

The editors' pointers are in each finding's "Where" line above (file, function, line, coordinates, URL flags such as `?interior=`, `?worldchange=`, `?time=night`, `?at=x,z,yaw`). Confirm each before writing an issue; line numbers are from commit 6d217da8.

## Contracts this epic provides for later epics

- None.

## Contracts this epic consumes from earlier epics

- FX21 `previously`, chip and allow-lists (remove the act III rows; keep Sal, Samphire, Chanterelle and Betony's "as I was saying", Betony without the number).
- FX05 key frames (#39, #44, #46, #50, #52). FX14/FX15/FX16 places.

## Online / mobile / achievements / prefabs / lore notes

- D47: comms and short scene beats only. D57: Pip's one act III "Okay, hear me out" in #46.
- G11#6 disguises through `setEquipmentOverride` (AGENTS.md player gnome rule), no new gnome model.
- GR7 for #44, #45 (D50).
- D53 fallback: Wally flies, the player rides (a scene).

## Risks and open questions (with the decision taken)

- #46 flight and #50 timer touch the quest sim: run the suites and record any fallback in rounds.md.

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
- Every finding above is visibly resolved: re-shoot its spot with `node tools/gta-shots.mjs <url> docs/roadmaps/gta-batch-3/review/shots/FX23/ <name>:<x>,<z>,<yaw>` at 960x600 and `--size 390x844` (same names as the editor's shot, listed under "Re-check"), and compare with the editor's shot in `review/shots/G<n>/`. Screenshots stay local (not committed), like the editors'.
- Quest-sim suites and cutscene-report green; FX21 allow-lists contain no act III row.
- All 3 must findings are resolved; should and could findings are resolved or listed as deferred (with the reason) in the lead's report.
- The lead reports in at most 30 lines: branch, what landed per finding ID, what was deferred, perf numbers (if a density pass), known issues.
