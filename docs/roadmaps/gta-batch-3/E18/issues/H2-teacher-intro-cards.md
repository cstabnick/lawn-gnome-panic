Epic: E18-A
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E18/issues/_env.md` first.

## Goal
Wenna Gudgeon (fishing), Hazel Mattock (hunting) and Dunnock Pell (birding) get character intro cards that show once per
browser when the player first walks up to them on foot, and the achievement "Rod, Comb and Notebook" unlocks once all
three hobby intro quests are done.

## Read first
- `games/gnome-theft-auto/src/hobbyIntros.ts` (stub; keep its exported types and `installHobbyIntros` signature exactly).
- `games/gnome-theft-auto/src/cutscene/castIntros.ts`: `CharacterIntro { name, role (<= 28 chars), line (<= 70 chars),
  accent }` and `CAST_INTROS`.
- `games/gnome-theft-auto/src/golf/runtime.ts` ~l.186-200: the pattern (`introduced` set, distance check, `void
  showCharacterIntro(CAST_INTROS[key]).catch(() => {})` inside try/catch). `showCharacterIntro` is in
  `src/cutscene/introCard.ts`.
- Positions: `SHOP` in `src/fishing/types.ts` (x -110, z 252), `LODGE` in `src/hunting/species.ts` (x -548, z -52),
  `HIDE` in `src/birding/types.ts` (x -630, z -546).
- Lore (`npm run lore -- find "Bent Pin"`, `find "Tuft & Tally"`, `find Reedwatch`): Wenna is cheerful, quick, exact
  about centimetres, every fish goes back; Hazel sells the Tuft License, "nobody gets hurt"; Dunnock keeps the hide and
  the life list, birds don't mind you there. Accent colours: hat colours in `quests/newcomerQuests.ts` `HOST_LOOK`
  (wenna 0x2f6f8f, hazel 0x5a6b2e, dunnock 0x6b7a5a).

## Change
- `cutscene/castIntros.ts`: add `wenna`, `hazel`, `dunnock` entries (name, role, line, accent) in the file's dry voice.
- `hobbyIntros.ts`: implement `installHobbyIntros(deps)`:
  - Three spots `{ key, x, z }` from the constants above; range 9 m.
  - `update(dt)`: every 0.25 s; if `deps.onFoot()`, the first not-yet-shown key within range shows its card and is
    stored as shown in localStorage key `gta-hobby-intros-v1` (JSON array of keys; wrap every storage access in
    try/catch). One card per update at most.
  - Also every 2 s: if `deps.saves()` has `nc-bent-pin`, `nc-tuft-and-tally` and `nc-reedwatch` all with
    `state === 'done'`, call `deps.unlock('gta-rod-comb-notebook')` once (remember in a local flag).
- `src/hobbyIntros.test.ts` (new): with a stubbed `localStorage` (see `vi.stubGlobal` use in
  `src/quests/unlocks.test.ts`) and `vi.mock('./cutscene/introCard', () => ({ showCharacterIntro: vi.fn(() => Promise.resolve()) }))`:
  a player standing at the Bent Pin gets exactly one call for Wenna, none the second time; the achievement fires once
  when all three quests are done.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` clean for your files; `npx vitest run src/hobbyIntros.test.ts` passes.

## Out of scope
`app.ts` (already wired), `newcomerQuests.ts`, `defs.ts` (issue H1).
