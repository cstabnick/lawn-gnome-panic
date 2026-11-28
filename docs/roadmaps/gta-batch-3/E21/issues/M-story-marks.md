Epic: E21-1 foundation (cast, props, gear, story marks)
Depends on: none

## Environment
Worktree `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-adcca8ae7d2f22e45`, game `games/gnome-theft-auto`.
Git Bash; if `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`. Do not commit, stash or checkout. Keep LF
line endings. Three other workers edit other files of this game (and the prefabs/achievements packages) at the same
time: touch only the files below. Do not start a dev server.

## Goal
Story quests can reveal **map markers** and give **journal items** when they are finished, from one pure data table.
Today several finished story rows promise "X becomes a map marker" or "Y is a journal item" and nothing shows (there is
no API). After this issue: a finished quest's markers are blips on the minimap and big map, and its items are listed in
the Quest Journal under a new **Items** tab.

## Read first
- `src/types.ts` `interface Blip` (x, z, color, kind, label, ...), `src/mapIcons.ts` (`PlaceKind`, `PLACE_STYLE`,
  `drawPlaceIcon`, the legend order), `src/mapPois.ts` (`placeBlips()`: how fixed places become blips).
- `src/app.ts` around line 2614: `const blips: Blip[] = [ ... ...placeBlips(), ...landmarkBlips(), ... ]` (rebuilt every
  frame); line 784 `const journal = createQuestJournal(ui, quests, hud);`. Find how app.ts asks whether a quest is done
  (grep `quests.` for a done/state query, or `getJournal()` in `src/quests/quests.ts` line ~921 and its `JournalSnapshot`).
- `src/quests/journal.ts` (the tabs `active | available | later | done`, `.j-tab` buttons, the CSS string, how a tab body
  renders).

## Change
1. New `src/quests/storyMarks.ts` (pure data + pure functions, no DOM, no imports from app.ts):
   ```ts
   export interface StoryMarker { label: string; x: number; z: number }
   export interface StoryItem { id: string; title: string; text: string }
   export interface StoryMarks { markers?: readonly StoryMarker[]; items?: readonly StoryItem[] }
   /** Finished quest id -> what it reveals. E20/E21/E22 leads add rows; quest writers report them. */
   export const STORY_MARKS: Readonly<Record<string, StoryMarks>> = { ... };
   /** Markers of every finished quest, in table order, deduplicated by label. */
   export function storyMarkers(isDone: (questId: string) => boolean): StoryMarker[];
   /** Items of every finished quest, in table order (later rows last), deduplicated by id. */
   export function storyItems(isDone: (questId: string) => boolean): StoryItem[];
   ```
   Fill `STORY_MARKS` with the **E20 promises that were never wired** (look each place up in the named story file's
   stages/objectives for exact coordinates, or in the area config named):
   - `m17-the-dew-buyer` (Trellisdown Vineyard gate: `src/quests/story/17-the-dew-buyer.ts`), `m24-the-burrow-door` (the
     Burrow Door: `BURROW_DOOR` in `src/societies/config.ts`), `m25-one-leg-to-stand-on` (Wader's Rest: `WADERS_REST`),
     `m26-the-knot-hole` (the Knot-Hole: its story file), `m29-the-kicked-board` (the Kicked Board: `KICKED_BOARD` in
     `src/golf/types.ts`), `m32-driftwoods-chart` (the dune line over the Saltcut, `[693, 926]`; item "Driftwood's chart":
     "The canal does not end at the Puddle Sea. Past the dunes, the Saltwater."). Read each row's outline line in
     `docs/design/gnome-theft-auto/story-outline.md` (its "reward and unlock" column) for the exact promise; skip one
     whose place already has a fixed blip in `mapPois.ts` and say so.
   - Leave a comment `// E21 rows 36-53 (added by the E21 lead)` at the end for the act III rows.
2. `src/mapIcons.ts`: add a `PlaceKind` `'story'` with a `PLACE_STYLE` entry (`name: 'Story place'`, a gold colour
   close to the main-quest gold) and an icon in `drawPlaceIcon` (a small scroll or a gold ring with a dot: simple canvas
   strokes, readable at minimap size). Keep the legend working (`mapIcons.test.ts`).
3. `src/app.ts`: one spread in the `blips` array: `...storyMarkers(<done query>).map((m) => ({ x: m.x, z: m.z, color:
   PLACE_STYLE.story.color, kind: 'story' as const, label: m.label }))` (or a helper `storyMarkBlips(isDone)` in
   `mapPois.ts`); the done query must be cheap (it runs every frame: build it from the quest save, not by scanning the
   journal HTML).
4. `src/quests/journal.ts`: a fifth tab **Items** (`data-tab="items"`) listing `storyItems(...)` (title in bold, text
   under it; "No story items yet." when empty). Buttons stay at least 44 px tall and the five tabs fit a 390 px wide
   phone (shrink the tab font or let them wrap; check the CSS).
5. `src/quests/storyMarks.test.ts`: every `STORY_MARKS` key is a real quest id (`questById` from `./defs`); markers are
   inside `WORLD_HALF` (`src/config.ts`); item ids are unique; `storyMarkers`/`storyItems` return nothing when no quest
   is done and dedupe as documented.

## Done when
- `npx tsc --noEmit` passes (from `games/gnome-theft-auto`).
- `npx vitest run src/quests/storyMarks.test.ts src/mapIcons.test.ts src/quests` passes.
- Reading the code: a finished `m32-driftwoods-chart` puts "the dune line" on the map and "Driftwood's chart" under Items.

## Out of scope
Quest defs, story files, scenes, every other file. Do not change how existing blips draw.
Final report (<= 12 lines): files, the STORY_MARKS rows added, how the done query works, any promise skipped and why.
