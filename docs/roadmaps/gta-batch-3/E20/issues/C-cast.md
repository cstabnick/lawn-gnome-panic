Epic: E20-1 foundation (engine, cast, props)
Depends on: none

## Environment
Worktree `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a615015c8306f82da`, game `games/gnome-theft-auto`.
Git Bash; if `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`. Do not commit, stash or checkout. Keep LF
line endings. Six other workers edit other files of this game at the same time: touch only the files below.

## Goal
Every character the story rows 1-35 put on screen or on the phone has a CAST preset (look, voice pitch, held prop),
an intro card, a voice and a comms caller name, under the fixed keys below, so the quest writers that follow can use
`preset: '<key>'`, `{ do: 'intro', who }` and comms `who: '<key>'` without touching these tables.

## Keys to add (fixed: other issues already use them)
For each: `src/cutscene/cast.ts` `CAST[key]` (look, hz, held?, scale ~1.38-1.5), `src/cutscene/castIntros.ts`
`CAST_INTROS[key]` (name, role <= 28 chars, line <= 70 chars, accent colour; no spoilers past first meeting),
`src/voice/voices.ts` `VOICES[key]` (distinct from every other voice: vary hz, wave, style, speed, formant),
`src/quests/comms.ts` `CALLER_NAMES[key]` (display name). Skip any table that already has the key (several voices and
intros exist: 'lugnut lulu', 'rooster weatherby', 'turncoat cam', 'mayor mulch', ...). Do not change existing entries.

| key | who (characters.md / outline) | first seen |
|---|---|---|
| `don compost` | Don Compost, silent Mulch Club boss, taps his armrest (Big Lou translates) | row 3 |
| `parsley` | Parsley Inkpot, loan officer, First Kiln Bank | row 2 |
| `hyssop` | Hyssop Doormat, flat 3A neighbour, recites stairwell rules | row 2 |
| `mabel` | Mabel Kerbstone, the one Turfton Taxi (exists: check all four tables) | row 2 |
| `turncoat cam` | Turncoat Cam, Side-Valve sweeper (intro + voice exist; add the CAST preset) | row 1 |
| `mayor mulch` | Mayor Barnaby "Two-Coat" Mulch (intro + voice exist; add the CAST preset) | row 6 |
| `lugnut lulu` | Lugnut Lulu, Carburettors captain (voice exists) | row 5 |
| `chard` | Chard Levelright, Even-Estates site foreman | row 7 |
| `hogweed` | Hogweed Sprocket, Underspan inventor (E17/E18 have his look: reuse it) | row 10 |
| `gary` | Gate-Guard Gary, Patio Gate | row 12 |
| `sage` | Sage Ladle, Route South Acorn Diner cook | row 13 |
| `frank` | Fence-Post Frank, shack behind the south welcome sign | row 13 |
| `chicory` | Chicory Snips, Trellisdown head gardener (E16 has a look: reuse) | row 17 |
| `wisteria` | Countess Wisteria Brassknock of Trellisdown (E16 has a look: reuse) | row 17 (glimpsed) |
| `rooster weatherby` | Rooster, Squall-Box windmill weather-shouter (voice exists) | row 18/19 |
| `nubbin` | Nubbin, a small mole (E17 has a look: reuse) | row 24 |
| `tumblesoil` | Old Mother Tumblesoil, Loamdeep (E17: reuse) | row 24 |
| `saxifrage` | Mother Saxifrage Wader, Flock of the One Leg (E17: reuse) | row 25 |
| `ernie` | Ash-Shovel Ernie, Compost Heap furnace | row 27 |
| `midge` | Squeaky-Clean Midge, Glaze Clinic | row 31 |
| `cass` | Chrome-Knuckle Cass, Pay 'n' Glaze custom-shop foreman (E24 `workplaces/mechanic/`: reuse look) | L106 side quest |
| `dj moleman` | DJ Moleman, never seen: voice + caller name only (no CAST/intro needed unless the test demands) | row 24 |

Looks: read each character's entry in `docs/design/gnome-theft-auto/characters.md` (look, voice notes) and the bible
side-cast rows (`docs/design/gnome-theft-auto/direction/bible.md` section 2). Where an area epic already gave the
character a look (grep `src/` for the name: `societies/`, `country/`, `workplaces/`, `dewdrop/`, `homes/`,
`vibeNpcs.ts`, `quests/stages/*.ts`), use the same colours so the character looks the same everywhere. A non-gnome
(Nubbin the mole) keeps a gnome-model preset only if the cast system needs one: check how E17 shows moles in scenes
and follow that; say what you did.

Also add `src/quests/stages.ts` `CAST` (the `CastMember[]` list: id with hyphens, name, preset, home stage, haunts,
routine, vehicle) rows for `chard` (site cart or van), `lugnut-lulu` (her race car), `hogweed`, `sage`, `frank`,
`gary`, `midge`, `ernie`, `rooster`, `cass`, only where a stage id for their home exists (`grep "id: '" src/quests/stages/`);
otherwise skip and report. `mabel` exists there: give her `vehicle: { kind: 'taxi', parkedAt: ... }` only if a matching
vehicle mark exists; else leave it.

## Read first
- `src/cutscene/cast.ts` (CastPreset, existing entries), `src/cutscene/castIntros.ts` (+ `castIntros.test.ts`),
  `src/voice/voices.ts`, `src/quests/comms.ts` (CALLER_NAMES only), `src/quests/stages/kit.ts` (CastMember).

## Change
- `src/cutscene/cast.ts`, `src/cutscene/castIntros.ts`, `src/voice/voices.ts`, `src/quests/comms.ts` (CALLER_NAMES
  block only), `src/quests/stages.ts` (the CAST array only).

## Done when
- `npx tsc --noEmit` passes (from `games/gnome-theft-auto`).
- `npx vitest run src/cutscene/castIntros.test.ts src/cutscene/cutscenes.test.ts src/quests/comms.test.ts src/quests/stages.test.ts src/voice`
  pass.
- Every key in the table resolves in all four tables (except `dj moleman`: voice + caller name).

## Out of scope
Scenes, quests, prefabs, every other file. Do not rename or restyle existing presets.
