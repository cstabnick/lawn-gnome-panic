# E22 lore pass part 2: menial lore (L86), the common rules

Read `docs/roadmaps/gta-batch-3/E22/issues/_lore-common.md` first, in full (environment, entry schema, house style,
checks, report). Part 1 of the lore pass (done) filled the missing entries for people and places and fixed the
contradictions. Part 2 is what the user literally asked for: **menial lore** that makes the new places feel lived-in.

## What "menial lore" means here

The small, everyday, specific things a local would know and a visitor would notice. For each place in your group:

- **Shops and stalls:** what they sell, a price list or menu with three to six items in the place's voice (gnome names
  for things: R-021, canon "renamed objects"), opening hours, the owner's house rule ("No mowers inside. Mowers
  includes you, Gerald.").
- **Notices:** what is pinned on the board, taped to the door, painted on the wall: lost-and-found, a club meeting, a
  rota, a warning, an HOA letter and the reply scrawled under it, graffiti.
- **Local sayings and habits:** two or three sayings only locals use, a local custom (what everybody does at noon), a
  local food or drink, a local feud.
- **Small history:** who built it, what it was before, one thing that went wrong once and is still talked about.

Keep it short and specific: one good concrete detail beats three general ones. Keep the charm: satire of HOAs, beige,
paperwork, tidy lawns; warmth for the outcasts; dry, no gore, no pop culture, no "wet"/"soak"/"blood" (R-021).
Check every new name with `npm run lore -- find` first; follow the place's existing entries (do not contradict them).

## Where it goes

1. **Lore** (always): for each place, either add a section `## Everyday` to its existing entry (shops, notices,
   sayings, habits: in that order, as short bullet lists) or, for a shop/stall/custom big enough to stand alone, a new
   entry (`kind: place`, `object` or `custom` as the schema allows: check `tools/lore.mjs` for the allowed kinds) and a
   `related:` link both ways. Part 1 workers have finished: you may edit any entry of your group's places.
2. **Game text** (where it is cheap and safe): the place's existing sign, menu, notice or board **text strings** in
   its own area module (grep `sign(`, `text:`, `menu`, `notice`, `board`, `label:` in the files your issue names).
   You may rewrite a string or add strings to an existing list of texts. You may **not** add new sign objects, move
   anything, change positions, sizes, code logic or imports, or touch any file your issue does not name. Sign texts
   are often drawn into a fixed-size texture: keep a rewritten string no longer than the one it replaces (or the
   longest in its list), and run the area's tests.
3. If a place has no sign/menu text in its code and you think one is needed, list it in your report (place,
   coordinates, text) instead: the lead decides.

## Checks

From the repo root: `npm run lore` (must print `Lore OK`). From `games/gnome-theft-auto`, if you changed any game file:
`npx tsc --noEmit` and `npx vitest run <the test files next to each file you changed>` (e.g. `src/pardonlin/`), plus
`npx vitest run src/quests/quests.test.ts` (it checks every player-facing text for R-021).

## Final report (at most 20 lines)

Per place: entries changed or added, game strings changed (file: count), suggested new signs for the lead.
