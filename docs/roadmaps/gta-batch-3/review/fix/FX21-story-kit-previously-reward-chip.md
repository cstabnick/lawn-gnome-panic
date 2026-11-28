# FX21 Story kit: the `previously` field, the reward chip, act IV for veteran saves
Wave: 3 · Depends on: none · Kind: Fix (story engine, GR4/GR5)
Findings: 1 (G12#4) · Decisions: D7, D45, D46

Inputs: the findings files `review/G<n>-*.md` (full text of each finding), `review/decisions.md`, `AGENTS.md`, `SOUL.md`, the game's rows in `AGENT_INDEX.md`. Paths are under `games/gnome-theft-auto/src/` unless they start with `packages/`, `docs/` or `tools/`.

## Goal

The two shared story rules get their mechanism once (GR4, GR5): a journal recap in the narrator's voice and a visible reward, so the act epics can cut spoken labels and fees. Veteran saves see act IV framed as "Before the Even Cut" (D7).

## Scope

### Owned files (this epic may edit these, and only these, plus tests next to them)

- quests/types.ts (`QuestDef.previously?`), a new quests/story/previously.ts (the 70 journal lines, keyed by quest id, from the outline's "Previously" column)
- quests/journal.ts (Active card: `previously` line, reward chip, "Before the Even Cut" section)
- briefing/briefing.ts (reward chip on the comms card or briefing header, built from the quest's reward data)
- quests/comms.ts / comms.test.ts (the Previously test)
- quests/questSave.ts and the chain queue (D7)

### Findings (1)

Each finding: ID (severity, type · priority, decision), what, where, the editor's proposed fix, the decision text when one applies, and where to re-check. Read the full finding in its file before planning its issue.

- **G12#4** (polish, spirit · **should**, D7) Veteran saves play act IV after the finale, with nothing saying so
  - What: the catch-up rule ("inserted runs appear as catch-up quests") hangs m54 off ch3-tundra-drift-run, m56 off runway-flares, m58 off sandpit-drop, m60 off spade-truce. A save that finished the old finale gets all of #54-#69 after Vesper was stopped, in a W17 …
  - Where: prereqs in `quests/story/54..60`; `quests/questSave.ts`; journal.
  - Editor's fix: keep "nothing hides or resets", but frame it: when the row's successor in the old chain is already done, show the row in the journal under **"Before the Even Cut"** and swap the brief's "Previously:" for "Before the Even Cut:" (one helper in `kit.ts`); skip the row's world-change and Turfton FM bulletins while W17 is on. Alternatively, for saves with the finale done, offer act IV as one "Retold" chain from the …
  - Decision: D7 (quoted in full under "Decisions this epic applies").
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

Global rules GR1-GR10 are summarised under "Rules for every fix epic" below; read them in full in `decisions.md`.

#### D7. Veteran saves play act IV after the old finale — G12#4 · **should**
- **Options:**
  - (a) Frame those rows as "Before the Even Cut".
  - (b) A "Retold" chain started from the journal.
  - (c) Leave as is.
- **Decision:** (a).
- **Reason:** keeps "nothing hides or resets", costs one helper, and protects the players who already love the game.
- **Fix round:**
  - When a row's old-chain successor is already done, the journal files the row under "Before the Even Cut". With
    GR4 this becomes the `previously` text ("Before the Even Cut: ..."), not a spoken label.
  - Skip that row's world change and its Turfton FM bulletins while W17 is on.
  - A mid-act-IV save gets m54, m56 and m58 one at a time, in order (chain them through the chain queue).

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


### Also does (a part of a finding owned by another epic)

- **G10#8** (owned by FX22): D45 mechanism: the `previously` field, the journal Active card line, the "no comms line starts with Previously" test. FX22 rewrites the act I-II step-0 lines.
- **G11#8** (owned by FX23): D45 mechanism (see G10#8). FX23 rewrites the act III step-0 lines.
- **G12#25** (owned by FX24): D45 mechanism (see G10#8). FX24 rewrites the Countess line.
- **G10#9** (owned by FX22): D46 mechanism: the reward chip on the comms card and the journal card. FX22 cuts the act I-II spoken fees.
- **G11#9** (owned by FX23): D46 mechanism (see G10#9). FX23 cuts the act III spoken fees.

### Out of scope

- Anything not listed above, even in the same files: other findings have their own epic (`review/fix-plan.md`).
- New systems, online modes, other games.

## Code pointers

The editors' pointers are in each finding's "Where" line above (file, function, line, coordinates, URL flags such as `?interior=`, `?worldchange=`, `?time=night`, `?at=x,z,yaw`). Confirm each before writing an issue; line numbers are from commit 6d217da8.

## Contracts this epic provides for later epics

- `QuestDef.previously?: string` shown on the journal Active card.
- A reward chip on the comms card (desktop and phone) and the journal card.
- A test "no comms line starts with Previously" with an allow-list of today's offenders by row; FX22, FX23 and FX24 remove their rows; FX24 leaves it empty.
- A fee test: no spoken Acorn amount in the sincere and crisis rows #26, #31, #34, #35, #52 and the act IV finale (GR5), also allow-listed until the act epics land.
- D7: a helper `isBeforeTheEvenCut(row)`; such rows file under "Before the Even Cut" (as the `previously` text, not a spoken label), skip their world change and Turfton FM bulletins while W17 is on, and a mid-act-IV save gets m54, m56, m58 one at a time through the chain queue.

## Contracts this epic consumes from earlier epics

- None.

## Online / mobile / achievements / prefabs / lore notes

- Do not edit the quests/story row files or the scene files: the act epics do the lines. This keeps FX21 parallel with FX07.
- GR10 keeps the comms card on desktop: the chip is an addition, not a redesign.

## Risks and open questions (with the decision taken)

- Reward data: rows whose reward is not money (a favour, a key) show a non-money chip.

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
- Every finding above is visibly resolved: re-shoot its spot with `node tools/gta-shots.mjs <url> docs/roadmaps/gta-batch-3/review/shots/FX21/ <name>:<x>,<z>,<yaw>` at 960x600 and `--size 390x844` (same names as the editor's shot, listed under "Re-check"), and compare with the editor's shot in `review/shots/G<n>/`. Screenshots stay local (not committed), like the editors'.
- Journal Active card shows the line and chip for a sample of rows (#2, #26, #45, #63) at 390x844 and desktop; the comms card shows the chip.
- All 0 must findings are resolved; should and could findings are resolved or listed as deferred (with the reason) in the lead's report.
- The lead reports in at most 30 lines: branch, what landed per finding ID, what was deferred, perf numbers (if a density pass), known issues.
