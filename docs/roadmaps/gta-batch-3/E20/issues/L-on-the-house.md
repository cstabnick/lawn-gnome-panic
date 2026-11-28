Epic: E20-1 foundation (engine, cast, props)
Depends on: none

## Environment
Worktree `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a615015c8306f82da`, game `games/gnome-theft-auto`.
Git Bash; if `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`. Do not commit, stash or checkout. Keep LF
line endings. Six other workers edit other files of this game at the same time (cast tables in `cast.ts`,
`castIntros.ts`, `voices.ts`, `comms.ts`, `stages.ts`; the new objective kinds; prefabs): touch only the files below.

## Goal
L106 ("make an early quest that makes it free to repair at Pay 'n' Glaze"): a short early side quest, **On the House**
(`sq-on-the-house`), given by Chrome-Knuckle Cass, foreman of the Pay 'n' Glaze custom shop. Finishing it activates a
perk that makes every Pay 'n' Glaze repair free, shown as free in the shop's Repair tab. It unlocks right after the
first story contract, so a new player has free repairs early.

## Design (decided; write the details yourself)
- Giver: new giver id `cass` at the Pay 'n' Glaze client lot (E24: `src/workplaces/mechanic/lot.ts`, the lot board;
  Cass is described in `docs/lore/entries/apocrypha/chrome-knuckle-cass.md`; lore rulings on Pay 'n' Glaze in
  `docs/lore/rulings.md`, search "Pay 'n' Glaze"). Comms speaker key `cass` (another worker is adding the CAST preset,
  intro card, voice and caller name for `cass` right now; use the key, and give your scene actor `preset: 'cass'`).
- Story (2-3 objectives, 3-5 minutes): the HOA has done something petty to the shop (lore-consistent; e.g. an HOA
  Code-Enforcement Van has clamped a client's freshly glazed mower for "unapproved pinkness", or HOA auditors have
  taken Cass's chrome spray rig). The player gets it back (use existing kinds: crack, steal-deliver with `maxDamage`,
  checkpoints, visit), and Cass, who never gives anything away, puts the player "on the house" for repairs. Funny,
  short, in her voice; she explains in one line what the perk does.
- Reward: 200 acorns, `achievement: 'gta-on-the-house'` (being added to the achievements catalog by another worker
  right now; tsc does not check the id), and the perk.
- One short intro scene (world stage at the lot, `sky: 'noon'`, an intro card `{ do: 'intro', who: '<cass actor id>' }`
  after her first line) and one short outro (or a dialogue outro). Direction notes for each scene in
  `docs/design/gnome-theft-auto/direction/scenes/<scene-id>.md` (copy `direction/TEMPLATE.md`). Follow
  `docs/design/gnome-theft-auto/direction/bible.md` sections 4-6a (shot lengths, camera, sound, intro cards) and look
  at `src/cutscene/scenes/side/` for side-quest scene examples.

## Change
- New `src/quests/glazeQuests.ts`: `export const GLAZE_QUESTS: readonly QuestDef[]` (the one quest, no `chapter`),
  `export const GLAZE_GIVERS: Record<string, GiverDef>` (`cass`), `export const GLAZE_COMMS` (same shape as
  `COMMS` in comms.ts: build calls with a local `brief`/`call` like comms.ts does; step 0 says who, what, where, why,
  and the reward; 16 words max a line). Do **not** edit `comms.ts`: the lead wires `GLAZE_COMMS` in.
- `src/quests/defs.ts`: spread `GLAZE_GIVERS` into `GIVERS` and `GLAZE_QUESTS` into `QUESTS` (next to `DEWDROP_QUESTS`).
- `src/quests/unlocks.ts`: one `SIDE_UNLOCKS` row `{ questId: 'sq-on-the-house', after: 'first-contract', why: ... }`.
  If `npx vitest run src/quests/unlocks.test.ts` then fails on the act cap, use `after: 'ch1-mowers-keepers'` and say so.
- `src/perks.ts`: `PerkId` `'glaze-on-the-house'`, a `PERKS` row (questId `sq-on-the-house`, name "Cass's Tab", text
  "Pay 'n' Glaze repairs are free."), and a `PRICE_PERKS` row `{ perk: 'glaze-on-the-house', reasons: ["Pay 'n' Glaze
  repair"], scale: 0 }` (the Repair tab spends with that reason: `src/glazePanelRepair.ts`).
- `src/glazePanelRepair.ts`: when the perk is active (`activePerks()` from perks.ts), the quote shows "Free (Cass's tab)"
  and the repair button works with 0 acorns. Keep `repairQuote` pure and its tests green.
- `src/questSim/plans.ts`: `'sq-on-the-house': { suite: 'side', expect: 'pass' }`.
- Scenes: new `src/cutscene/scenes/side/onTheHouse.ts` exporting its scenes, added to `src/cutscene/scenes/side/index.ts`.
- A stage: add `sq-on-the-house` to the `usedBy` of the stage that holds the Pay 'n' Glaze lot (grep `src/quests/stages/`
  for `cass` or the lot) and `cass` to its `givers`; or add a new stage to that stage file. Every quest and giver must be
  on a stage (`stages.test.ts`).

## Done when
- `npx tsc --noEmit` passes (from `games/gnome-theft-auto`).
- `npx vitest run src/quests/unlocks.test.ts src/quests/stages.test.ts src/cutscene/scenes/scenes.test.ts src/questSim/coverage.test.ts src/glazePanelRepair.test.ts src/perkEffects.test.ts src/quests/quests.test.ts`
  pass (the cast tests may fail for `cass` until the cast worker lands: report, do not fix them).
- `npm run quest-sim -- --quest sq-on-the-house --force --out C:\Users\cpsai\AppData\Local\Temp\claude\e20-L\sim`
  passes.
- `npm run cutscene-report` shows your scenes without faults and not in the Variety/Sound lists.

## Out of scope
`comms.ts`, `cast.ts`, `castIntros.ts`, `voices.ts`, `stages.ts`, `types.ts`, `quests.ts`, `quests/story/**`, packages.
