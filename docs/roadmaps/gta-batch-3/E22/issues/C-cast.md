Epic: E22-1 foundation (cast, props, gear, W16, lore part 1)
Depends on: none

## Environment
Worktree `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-adec7594cd8bfc2db`, game `games/gnome-theft-auto`.
Git Bash; if `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`. Do not commit, stash or checkout, do not
run `npm install`. Keep LF line endings. Seven other workers edit other files at the same time: touch only the files below.

## Goal
Every character story act IV (outline rows 54-70) puts on screen who has no CAST preset yet gets one, with an intro card,
a voice and a comms caller name, under the fixed keys below, so the quest writers that follow can use
`preset: '<key>'`, `{ do: 'intro', who }` and comms `who: '<key>'` without touching these tables. Also check that every
act IV character listed under "Check" resolves in all four tables, and fill only what is missing.

## Keys to add (fixed: other issues already use them)
For each: `src/cutscene/cast.ts` `CAST[key]` (look, hz, held?, scale ~1.38-1.5), `src/cutscene/castIntros.ts`
`CAST_INTROS[key]` (name, role <= 28 chars, line <= 70 chars, accent colour = hat colour; no spoilers past the first
meeting), `src/voice/voices.ts` `VOICES[key]` (distinct from every other voice: vary hz, wave, style, speed, formant;
`voices.test.ts` forbids duplicates), `src/quests/comms.ts` `CALLER_NAMES[key]` (display name). Skip any table that
already has the key. Do not change existing entries.

**Key choice matters**: `presetFor(speaker)` matches a CAST key as a substring of the speaker label, so a key must not be
a substring of other names (that is why Sal is `'silt-diver sal'`). Check each key below against every `name:` and
speaker label in `src/` (`grep -rn "<key>" src/ -i`) and report a clash instead of guessing.

| key | who | look source (reuse its colours so the character looks the same everywhere) | first seen |
|---|---|---|---|
| `yarrow` | Reeve Yarrow Potsherd, reeve of Pebblewick: formal, council-minutes diction, "Noted." Tall grey felt hat with a council band, brown waistcoat, watch chain, neat white beard; holds a ledger (`ledger-book` or `ledger` prefab) | `docs/design/gnome-theft-auto/characters.md` "Reeve Yarrow Potsherd"; `src/homes/data.ts` (his home row) | row 58 |
| `burdock` | Head Ranger Burdock Haybright of the Unmown: patient, counts and watches, tidies nothing | `src/unmown/vignettes.ts` (`unmown-burdock`), `src/unmown/station.ts`; lore `docs/lore/entries/apocrypha/unmown-rangers.md` | row 65 |
| `hector` | Hector Disdain, the waiter of Café Pardon in Pardonlin, who never takes an order | `src/pardonlin/interiors.ts`, `src/pardonlin/districts/teacupQuays.data.ts`; lore `npm run lore -- find Hector` | row 63 |
| `velma` | Velma Crown, keeps the Top Hat café at Brim Gap on the Hatbrim, counts every car that stops | `src/mountainRoutes/brimGapPlan.ts`; lore R-232 in `docs/lore/rulings.md` | row 64 p2 |

Voices: Yarrow slow and even; Burdock low and unhurried; Hector a clipped continental sniff; Velma brisk and bright.
Held props must be `@lawn/prefabs` ids (grep `packages/prefabs/src/catalog/`): Yarrow a ledger, Burdock a clipboard or
binoculars if one exists, Hector a `serving-tray`, Velma a teapot or cup if one exists.

## Check (existing act IV cast: fill only a missing table entry, report what you filled)
`pip`, `tansy`, `vesper`, `granny`, `diggs`, `bracken`, `wally`, `hogweed`, `tumblesoil`, `nubbin`, turncoat cam,
`juniper`, `reginald`, don compost, big lou, mayor mulch, `samphire`, `brenda`, lugnut lulu, `wisteria`, `chicory`,
`clara`, `hedda`, `bodega`, `hyssop`, `ernie`, `chard`, `betony`, `gary`. Print the exact key each one uses in
`CAST` (some keys contain a space, e.g. `'big lou'`) in your report: the lead pastes them into the quest issues.

Also add `src/quests/stages.ts` `CAST` (the `CastMember[]` list) rows for the four new keys where a stage id for their
home or haunt exists (`grep "id: '" src/quests/stages/*.ts`; e.g. Yarrow's home row in `src/homes/data.ts` names
`pebblewick-plots`); otherwise skip and report.

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
Final report (<= 20 lines): keys added per table, looks reused from where, CAST rows added or skipped, the exact keys of the "Check" list.
