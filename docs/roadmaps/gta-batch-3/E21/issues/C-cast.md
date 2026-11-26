Epic: E21-1 foundation (cast, props, gear, story marks)
Depends on: none

## Environment
Worktree `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-adcca8ae7d2f22e45`, game `games/gnome-theft-auto`.
Git Bash; if `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`. Do not commit, stash or checkout. Keep LF
line endings. Three other workers edit other files of this game at the same time: touch only the files below.

## Goal
Every character story act III (outline rows 36-53) puts on screen or on the phone has a CAST preset (look, voice pitch,
held prop), an intro card, a voice and a comms caller name, under the fixed keys below, so the quest writers that follow
can use `preset: '<key>'`, `{ do: 'intro', who }` and comms `who: '<key>'` without touching these tables.

## Keys to add (fixed: other issues already use them)
For each: `src/cutscene/cast.ts` `CAST[key]` (look, hz, held?, scale ~1.38-1.5), `src/cutscene/castIntros.ts`
`CAST_INTROS[key]` (name, role <= 28 chars, line <= 70 chars, accent colour = hat colour; no spoilers past the first
meeting), `src/voice/voices.ts` `VOICES[key]` (distinct from every other voice: vary hz, wave, style, speed, formant;
`voices.test.ts` forbids duplicates), `src/quests/comms.ts` `CALLER_NAMES[key]` (display name). Skip any table that
already has the key (`'thermos theo'` and `'dj moleman'` already have voices; `'dj moleman'` has a caller name). Do not
change existing entries.

**Key choice matters**: `presetFor(speaker)` matches a CAST key as a substring of the speaker label, so a key must not be
a substring of other names (that is why Sal is `'silt-diver sal'`, not `sal`, which would match "Salt-Plow Driver").

| key | who (read `docs/design/gnome-theft-auto/characters.md` section of the same name) | first seen |
|---|---|---|
| `gentian` | Gentian Bootlace, ski instructor, keeps the Woolly Sock Lodge on Snowdrop Slope | row 37 |
| `thermos theo` | Thermos Theo, ice fisher, stirs his barrel at the bend in Frostbite Fells (voice exists) | row 37 (on screen) |
| `chanterelle` | Warden Chanterelle Stook, Capwood's warden, fines anyone who bruises a cap | row 40 |
| `ragwort` | Ragwort Coilspring, keeper of the Pinwheel Ridge wind farm, hard hat | row 41 |
| `clary` | Marshal Clary Mudguard, Rutbottom Dirt Bowl starter/marshal | row 42 |
| `marram` | Marram Teaspoon, runs the Spokewheel on Saltbucket Boardwalk | row 43 |
| `samphire` | Captain Samphire Bilge, the Bathtub Queen's captain, toy cutlass, tells tour groups about pirates with a straight face | row 44 |
| `betony` | Professor Betony Sextant, astronomer, Rootwell / the Anthill Observatory | row 45 |
| `lovage` | Dean Lovage Inkwell, Rootwell's dean, pompous, mildly menacing | row 45 |
| `silt-diver sal` | Silt-Diver Sal, lives in the Under-Deck culvert, surfaces with Tansy | row 39 |
| `dj moleman` | DJ Moleman, mole DJ at Loamdeep, never speaks (voice + caller exist: add the CAST preset and intro card) | row 49 |

Looks: where an area epic already gave the character a look, use the same colours so the character looks the same
everywhere. Grep `src/` for the name: Gentian `src/winter/`, `src/quests/winterQuests.ts`; Theo `src/quests/stages/winter.ts`,
`wilds.ts`, `src/cutscene/scenes/story/ch3b.ts`; Chanterelle and Clary `src/quests/dirtRaces.ts` (`CHANTERELLE_LOOK`,
`CLARY_LOOK`), `src/capwood/`, `src/rutbottom/`; Ragwort `src/campus/windFarm.ts`; Betony/Lovage `src/campus/observatory.ts`,
`src/quests/stages/rootwell.ts`; Marram/Samphire `src/coast/life.ts`, `src/coast/config.ts`, `src/quests/coastQuests.ts`;
Sal `src/vibeNpcs.ts`, `src/cutscene/scenes/side/gridTruthers.ts`; DJ Moleman `src/societies/loamdeep/moleman.ts` (he
is a mole: follow how E17 shows moles, e.g. the `nubbin`/`tumblesoil` CAST entries: grey skin, small scale; say what you did).
Held props must be `@lawn/prefabs` ids (grep `packages/prefabs/src/catalog/`): e.g. Samphire a cutlass or spyglass if one
exists (an E21 worker is adding `toy-cutlass`; do not use it, it may not exist yet), Ragwort a wrench, Chanterelle a
clipboard or `citation-slip`, Clary a flag (`slalom-flag` or a chequered one), Betony a `rolled-chart`.

Also add `src/quests/stages.ts` `CAST` (the `CastMember[]` list) rows for each new key where a stage id for their home
exists (`grep "id: '" src/quests/stages/*.ts`; homes: `src/homes/data.ts` rows for gentian, chanterelle, ragwort, clary,
betony, lovage, samphire, marram name the site); otherwise skip and report.

## Read first
- `src/cutscene/cast.ts` (CastPreset, existing entries), `src/cutscene/castIntros.ts` (+ `castIntros.test.ts`),
  `src/voice/voices.ts` (+ `voices.test.ts`), `src/quests/comms.ts` (CALLER_NAMES only), `src/quests/stages/kit.ts` (CastMember).

## Change
- `src/cutscene/cast.ts`, `src/cutscene/castIntros.ts`, `src/voice/voices.ts`, `src/quests/comms.ts` (CALLER_NAMES
  block only), `src/quests/stages.ts` (the CAST array only).

## Done when
- `npx tsc --noEmit` passes (from `games/gnome-theft-auto`).
- `npx vitest run src/cutscene/castIntros.test.ts src/cutscene/cutscenes.test.ts src/quests/comms.test.ts src/quests/stages.test.ts src/voice`
  pass.
- Every key in the table resolves in all four tables.

## Out of scope
Scenes, quests, prefabs, every other file. Do not rename or restyle existing presets.
Final report (<= 15 lines): keys added per table, looks reused from where, CAST rows added or skipped.
