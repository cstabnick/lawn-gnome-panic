Epic: 7 (Gnome Theft Auto Wild World: the Tessie side quest)
Depends on: none

## Environment

- Working directory: `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree). Run every command from there. Use absolute paths.
- Node: if `node`/`npm` is not found, in Git Bash `export PATH="/c/Program Files/nodejs:$PATH"`.
- Dependencies are installed. Do not run `npm install`. Do not `git commit`, push or open a PR. Do not start a dev server.
- Five other workers are editing other files at the same time (`quests/objectivesTessie.ts`, `quests/objectivesTessieEscort.ts`, `tessie.ts`, `app.ts`, two prefab files and the achievements catalog). Edit only the files this issue names.

## Goal

Write the words of the Tessie side quest (Gnome Theft Auto, Loch Moss): Driftwood's dialogue, objective and ending texts, its Turfton FM news bulletins, and the lore (a Tessie entry, a Turfton Tattler entry, updates to Loch Moss and Driftwood, and one ruling). The quest's mechanics already exist; only text changes in the quest file.

## The quest (what the player does; already built)

A random story beat in chapters 1-4 unlocks it. Turfton FM breaks the news ("something big in Loch Moss") and **Driftwood** (the sun-bleached castaway who raves about lawn sharks) turns up on the Loch Moss shore by the dock as the quest giver. Steps:

1. Take a boat out at dusk and follow three sightings around the loch; at each a huge hump rolls under the surface.
2. Drop four sonar buoys (Driftwood's listening floats, built from junk) while an HOA patrol boat circles; if it spots you it fishes them out.
3. The HOA wants the loch drained for a golf development; their dredger is out on the water. Escort a raft carrying the turtle's egg clutch to her island and ram the dredger three times to drive it off.
4. **Tessie** surfaces beside the island: a huge, ancient turtle with a mossy shell. Swim out, climb aboard and ride her back to the dock.
5. Choose: walk to the gold ring to **sell the photo to the Turfton Tattler** (a tabloid; +1500 Acorns), or to the cyan ring to **keep her secret** (a turtle-shell backpack cosmetic).

Afterwards Tessie surfaces in the loch now and then and can be ridden again. Achievements: `gta-tessie-rumour` "Something in the Loch" (the unlock), `gta-tessie-finish` "The Loch Moss Monster", `gta-tessie-tabloid` "Front Page" (sold the photo), `gta-tessie-secret` "Keeper of the Loch" (kept it).

Two readings (never spoken in game): to the Tall Ones, Loch Moss is the overgrown ornamental pond in the back corner of the garden, and Tessie is the pet pond turtle they left behind, still living there years later. To the gnomes she is a giant, ancient monster most of Turfton thinks is made up. Gnomes never say turtle-as-pet, pond, garden or Tall Ones about her; at most a hint (she is very calm around the stone heron lying in the reeds; she seems to wait for someone at the shore at feeding time).

## Read first

- `games/gnome-theft-auto/src/quests/tessieQuest.ts`: the quest definition with placeholder words. Change only text fields.
- `games/gnome-theft-auto/src/quests/sideQuests.ts` lines 218-254 (`sq-castaway-drydock`, Driftwood's first quest): his voice.
- `games/gnome-theft-auto/src/radio/content.ts` lines 280-300 and 425-435: the `EVENT_BULLETINS` table and its line style (`{ who: 'BULLETIN', text: '...' }`).
- `docs/lore/README.md` (entry schema), `docs/lore/canon.md` (house style), `docs/lore/entries/apocrypha/loch-moss.md`, `docs/lore/entries/apocrypha/driftwood-castaway.md`, `docs/lore/entries/apocrypha/drey-gang.md` (an example of a recent entry), and the last three rulings in `docs/lore/rulings.md` (R-048 to R-050).
- Run `npm run lore -- find tessie`, `npm run lore -- find tattler`, `npm run lore -- find hoa` first.

## Change

### 1. `games/gnome-theft-auto/src/quests/tessieQuest.ts` (text only)

- Keep every non-text field exactly (ids, `TESSIE.*` references, kinds, points, `room`, `look`, `achievement` fields, `bonusAcorns`, `rewardAcorns`, `radioBulletin`).
- `cutscene.lines`: 4 to 6 lines, all `speaker: 'Driftwood'`, `look: DRIFTWOOD_LOOK`, `hz` between 90 and 110. He opens with "I told you about the lawn sharks..." (or close to it), says something big lives in Loch Moss, that he has heard it singing through the hull of his raft, that the HOA has a dredger out to drain the loch for a golf course, and sends the player out by boat at dusk. Plain, short sentences, his half-mad maritime voice, one joke at most per line.
- `title` may stay "The Loch Moss Monster". Objective `text`s: keep the meaning (each one short, an instruction). Choice `optionA.label` 'Sell the photo to the Tattler', `optionB.label` 'Keep her secret'; `endingText`s: one or two sentences each (A: the Tattler runs it on the front page, nobody believes it anyway, Driftwood sighs; B: Driftwood nods, Tessie rolls once in the shallows and is gone, he gives you a small shell pack from his raft). `doneText`: one or two sentences.
- **R-021 test:** no `wet`, `wetter`, `wetness`, `soak...`, `drip...`, `blood...`, `gore` or `bleed...` anywhere (the quests test checks title, doneText, dialogue, objective texts and endings).

### 2. `games/gnome-theft-auto/src/radio/content.ts`

Add these keys to `EVENT_BULLETINS` (after the `sq-...` side-quest entries), each 2 to 4 `{ who: 'BULLETIN', text }` lines, in the same voice as the neighbours:

- `'gta-tessie-rumour'`: BREAKING news: something big in Loch Moss. A ferry passenger saw a hump the size of a Watering-Can Steamer; Driftwood has been seen on the loch shore telling anyone who will listen "I told you so".
- `'sq-tessie'`: the quest is done: the HOA dredger has withdrawn from Loch Moss, the golf development "is under review"; reports of a gnome riding something enormous across the loch at dusk.
- `'gta-tessie-tabloid'`: the Turfton Tattler's front page has a photo of Tessie; experts call it a log, a hat, or a very large shoe.
- `'tessie-surfaced'`: a sighting after the quest: Tessie surfaced in Loch Moss again; ferry timetables unaffected.
(No bulletin for `gta-tessie-secret`: it is a secret.) **R-021:** the radio test bans `wet`, `wetter`, `wetness`, `soak...`, `drip...`, `dripping`, `blood...`, `gore`, `bleed...` in every line.

### 3. Lore (`docs/lore/`)

- New entry `docs/lore/entries/apocrypha/tessie.md`: `kind: creature`, `tier: apocrypha`, `setting: apocrypha`, `era: now`, `status: draft`, `games: [gnome-theft-auto]`, `aliases: [The Loch Moss Monster, Tessie of Loch Moss]`, `sources: [games/gnome-theft-auto/src/quests/tessieQuest.ts, games/gnome-theft-auto/src/config.ts, docs/lore/rulings.md#r-043]` (use the ruling number you actually write), `related: [loch-moss, driftwood-castaway, hoa, turfton-tattler]`. Sections: summary paragraph, What gnomes say, The truth (the pet pond turtle reading: for writers only), In the games (the quest steps, the island at (-760, -720), she surfaces afterwards and can be ridden), Loose threads (how old she is; who she waits for at the shore).
- New entry `docs/lore/entries/apocrypha/turfton-tattler.md`: `kind: object` (a tabloid paper), `related: [tessie]`, sources the quest file and the radio content. One short paragraph and What gnomes say.
- Update `docs/lore/entries/apocrypha/loch-moss.md`: "In the games" (the dock, the Watering-Can Steamer, Tessie's island, the quest), add `tessie` to `related`; the Loose threads rumour is now Tessie (keep it a loose thread whether she is the only one).
- Update `docs/lore/entries/apocrypha/driftwood-castaway.md`: an "In the games" line for Loch Moss and the Tessie quest; add `loch-moss` and `tessie` to `related`; add `games/gnome-theft-auto/src/quests/tessieQuest.ts` to `sources`.
- `docs/lore/rulings.md`: append one ruling at the end. **Check the last number right before writing** (it is R-050 now, so this is R-051 unless someone added one). Question: Gnome Theft Auto adds Tessie, a giant turtle in Loch Moss. R-049 sizes animals for gnomes to live beside; is she an animal, how big, can she be hurt, and what is she really? Ruling: she is an animal, far bigger than R-049's sizes (about nine metres, five gnome-lengths of shell), the one exception, because she is very old and nobody knows how old; like every creature she wants something (her eggs safe, the loch left alone); she is never hurt and never dies (R-021, R-049): shots and rams do nothing to her shell; the HOA's plan to drain the loch for a golf course is why the dredger is there; the Tall-One reading (a pet pond turtle left behind) is a hint for writers and is never said in game. Applies to: apocrypha, gnome-theft-auto. Date: 2026-11-22. Why: one short line.
- `docs/lore/settings.md`: in the `apocrypha` section's Gnome Theft Auto description, add "Tessie of Loch Moss" and the new ruling number to the list.
- Run `npm run lore` (rewrites `docs/lore/INDEX.md`; that file is generated, do not hand-edit it).

## Done when

- `npx tsc --noEmit -p games/gnome-theft-auto` passes (if the only errors are in files other workers own, they are mid-edit; re-run a little later).
- From `games/gnome-theft-auto`: `npx vitest run src/quests/quests.test.ts src/quests/tessieUnlock.test.ts src/radio/schedule.test.ts` passes (the registry test needs >= 2 bulletin lines for `sq-tessie`; the R-021 tests check your words).
- `npm run lore` passes with no errors.

## Out of scope

Every other file: `quests/types.ts`, `quests/quests.ts`, `quests/defs.ts`, `config.ts`, `quests/objectivesTessie*.ts`, `tessie.ts`, `app.ts`, prefabs, achievements, and every other lore entry.
