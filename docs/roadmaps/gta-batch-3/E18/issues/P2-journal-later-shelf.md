Epic: E18-A
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E18/issues/_env.md` first.

## Goal
The Quest Journal shows a manageable set: **Open** (story quests that can be taken plus the side quests pacing offers,
at most 3-6), a **Later** shelf (unlocked side quests not offered now, still takeable from their giver), a short
"Coming up" hint, and no long Locked list.

## Read first
- `games/gnome-theft-auto/src/quests/journal.ts` (the whole file, 250 lines): tabs `active | available | locked | done`.
- `games/gnome-theft-auto/src/quests/pacing.ts` (do not edit): `sidePacing(saves, quests)` returns
  `{ row, beats, cap, offered: string[], later: string[], upcoming: string[] }`; `isPaced(questId)`.
- `games/gnome-theft-auto/src/quests/unlocks.ts`: `unlockRule(id)?.after` (the story quest id that unlocks it).

## Change (only `games/gnome-theft-auto/src/quests/journal.ts`)
- Tabs become `active | available | later | done`, labels `Active`, `Open N`, `Later N`, `Done a/b`. Replace the
  `locked` tab button and its CSS rule `[data-tab="locked"]` with `later` (same flex-grow 1.1).
- In `render()`: `const pace = sidePacing(snap.saves, snap.quests);`
  - `avail` (Open) = quests with `isQuestAvailable(q, snap.saves)` AND (`q.chapter !== undefined` OR `!isPaced(q.id)` OR
    `pace.offered.includes(q.id)`). Story quests first (as now), then side quests in `pace.offered` order.
  - `later` = `pace.later` mapped to quests (skip ids not in `snap.quests`), in that order.
  - Open tab: as today (button pins the giver). Under the cards add, when `pace.upcoming.length > 0`, one small
    `.j-item-sub` box headed "Coming up" listing each upcoming quest title with "after <story quest title>" (the
    title of `unlockRule(id)?.after`), no buttons. Header line at the top of the Open tab, one `.j-item-sub`:
    `Side jobs on offer: <offered side count>/<pace.cap>. More wait on the Later shelf.` (only when `pace.later.length > 0`).
  - Later tab: an intro line ("Still open. Their givers will take you on any time; tap one to set a waypoint.") then
    one button per quest exactly like an Open item (title, Side tag, giver and place, perk line), clicking pins the giver
    and closes, same toast. Empty text: "Nothing on the shelf."
  - Remove the Locked rendering and the `unlockMet` / `SIDE_UNLOCKS` imports if unused.
- Keep everything else (Active tab, Done tab, keyboard, `registerAction('journal')`, 44 px buttons).

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` has no errors in `journal.ts`.
- `npx vitest run src/quests` passes.
- Read your render code once as a phone user (390 px wide): four tabs fit (labels are short), every button >= 44 px.

## Out of scope
Every other file (quests.ts, pacing.ts, unlocks.ts are owned elsewhere).
