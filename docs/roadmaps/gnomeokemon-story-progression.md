# Gnomokemon Snap: Story & Point-Based Progression Plan

**Design doc:** [docs/design/gnomeokemon/story.md](../design/gnomeokemon/story.md)  
**Target game:** `games/gnomeokemon`

## Goal

Implement the 7-chapter story arc, point-based safari map unlocking, Lab rank progression, and Page #036 / 80,000-point finale beats in `games/gnomeokemon`, so players earn their way through Fescue and the Yard with a clear sense of progress.

## Shape

| Epic | Goal | Issues | Done when |
|---|---|---:|---|
| 1. Progression Core & Story Data | Pure progression logic, story/rank tables, milestone tracking, unit tests | 1 | `npx tsc --noEmit -p games/gnomeokemon` and `npm test -w games/gnomeokemon` pass |
| 2. UI, Grading & Guard Wiring | Safari Map locks & briefings, Lobby rank & Quick Ride, Grading Office unlocks & Page #036, `app.ts` guard | 3 (parallel) | `npm run build -w games/gnomeokemon`, `npm test -w games/gnomeokemon`, and `bash tools/smoke.sh` pass |

---

## Epic 1 — Progression Core & Story Data

### Issue 1A — `src/snap/progression.ts` + `src/snap/progression.test.ts`

~~~~text
Epic: 1. Progression Core & Story Data
Depends on: none

## Environment
Working directory: repo root. On Windows; if `node` is not found in Git Bash, `export PATH="/c/Program Files/nodejs:$PATH"`.
Only touch `games/gnomeokemon`.

## Goal
Create `games/gnomeokemon/src/snap/progression.ts` with all 7-chapter story metadata, point-based course unlock thresholds, Lab ranks, pure progress helpers, and milestone announcement tracking, plus unit tests in `games/gnomeokemon/src/snap/progression.test.ts`.

## Read first
- `docs/design/gnomeokemon/story.md` (source of truth for thresholds, ranks, and Hyssop's lines)
- `games/gnomeokemon/src/snap/types.ts` (`CourseId`, `PhotoRecord`)
- `games/gnomeokemon/src/snap/storage.ts` (`BestPhotoMap`, `loadBestPhotos`)

## Change
- Create `games/gnomeokemon/src/snap/progression.ts` exporting:
  - `COURSE_ORDER: readonly CourseId[] = ['lawn', 'desert', 'depths', 'kiln', 'ocean', 'night', 'frost']`
  - `FINALE_POINTS = 80000`
  - `CourseStoryInfo`, `COURSE_STORY: Record<CourseId, CourseStoryInfo>`
  - `LabRank`, `LAB_RANKS: readonly LabRank[]`
  - `computeTotalPoints(best: BestPhotoMap): number`
  - `isCourseUnlocked(courseId: CourseId, totalPoints: number): boolean`
  - `getUnlockedCourses(totalPoints: number): CourseId[]`
  - `getNextLockedCourse(totalPoints: number): { courseId: CourseId; unlockPts: number; remainingPts: number } | null`
  - `getHighestUnlockedIncompleteCourse(best: BestPhotoMap, getSpeciesIds: (c: CourseId) => readonly string[]): CourseId`
  - `getLabRank(totalPoints: number): { current: LabRank; next: LabRank | null; progressFrac: number }`
  - `MilestoneAnnouncement` + `collectNewMilestones(totalPoints: number, best: BestPhotoMap, storage?: Pick<Storage, 'getItem' | 'setItem'>): MilestoneAnnouncement[]`
  - `clearProgressionState(storage?: Pick<Storage, 'removeItem'>): void`
- Create `games/gnomeokemon/src/snap/progression.test.ts` testing:
  - Point thresholds (`0`, `10000`, `20000`, `30000`, `40000`, `52000`, `65000`)
  - `getNextLockedCourse` and `getHighestUnlockedIncompleteCourse`
  - `getLabRank` progression & progress fraction
  - `collectNewMilestones` fires once per unlock/rank/finale and does not repeat

## Done when
- `npx tsc --noEmit -p games/gnomeokemon` succeeds
- `npm test -w games/gnomeokemon` passes
~~~~

---

## Epic 2 — UI, Grading & Guard Wiring

### Issue 2A — Lobby & Safari Map (`src/screens/lobby.ts`)

~~~~text
Epic: 2. UI, Grading & Guard Wiring
Depends on: Epic 1

## Goal
Update `games/gnomeokemon/src/screens/lobby.ts` to show the player's Lab Rank and progress toward the next unlock, gate locked Safari Map courses behind their point thresholds with story teasers/briefings, and point Quick Ride at the highest unlocked incomplete course.

## Read first
- `games/gnomeokemon/src/snap/progression.ts`
- `games/gnomeokemon/src/screens/lobby.ts`

## Change
- In `renderLobby`:
  - Display the player's current Lab Rank (`getLabRank(total).current.title`) and a compact progress bar toward the next locked course (or next Lab Rank if all courses are unlocked).
  - Update Quick Ride button label and behavior to launch `getHighestUnlockedIncompleteCourse(best, ...)` (e.g. `🐾 Quick Ride: Ch. 2 — Dry Yard`).
  - Update Map Room cell subtitle to `${unlocked.length}/${COURSE_ORDER.length} open · ${courseDone} done`.
- In `renderCourseMap`:
  - Add a top progress summary card showing Total Points, Lab Rank, and progress toward the next locked course (or Season Complete status).
  - Replace `World ${index + 1}` with `Ch. ${index + 1}` for unlocked courses.
  - Show `COURSE_STORY[cid].fieldBriefing` on unlocked cards.
  - For locked courses (`!isCourseUnlocked(cid, total)`): render a locked state (`🔒 ${unlockPts.toLocaleString()} pts`), show `COURSE_STORY[cid].lockedTeaser`, show a points progress bar (`total / unlockPts`), dim the card, and disable clicking (`card.disabled = true`).

## Done when
- `npx tsc --noEmit -p games/gnomeokemon` succeeds
~~~~

### Issue 2B — Grading Office Unlocks & Page #036 (`src/snap/grading.ts`, `src/snap/jesus.ts`)

~~~~text
Epic: 2. UI, Grading & Guard Wiring
Depends on: Epic 1

## Goal
Update `games/gnomeokemon/src/snap/jesus.ts` with Hyssop's grade-specific Page #036 reactions and `games/gnomeokemon/src/snap/grading.ts` to show points gained, progress toward the next Safari Map, and Hyssop's unlock/rank/finale announcements after grading.

## Read first
- `docs/design/gnomeokemon/story.md` (Section 3 unlock lines, Section 4 promotion lines, Section 5 Page #036 & Finale)
- `games/gnomeokemon/src/snap/progression.ts`
- `games/gnomeokemon/src/snap/jesus.ts`
- `games/gnomeokemon/src/snap/grading.ts`

## Change
- In `jesus.ts`:
  - Export `page036Line(grade: PhotoGrade): string` with the 4 grade-specific Hyssop lines from `story.md` Beat A, and use it in `linesFor` when `pic.speciesId === 'gnomejesus'`.
- In `grading.ts`:
  - Before calling `saveBestPhoto(pic)` on submit, record `prevPoints = computeTotalPoints(loadBestPhotos())`.
  - After saving all chosen photos, compute `newPoints = computeTotalPoints(loadBestPhotos())` and `milestones = collectNewMilestones(newPoints, loadBestPhotos())`.
  - After the photo-by-photo reveal completes, render a compact Progress & Unlocks summary panel below the grid (showing `+delta pts`, `Total: newPoints pts`, next unlock progress bar, and any newly unlocked course/rank/finale cards with Hyssop's quote) and have Gnome Jesus speak the top milestone announcement in his bubble.

## Done when
- `npx tsc --noEmit -p games/gnomeokemon` succeeds
~~~~

### Issue 2C — Course Guard & Quick Ride Target (`src/app.ts`)

~~~~text
Epic: 2. UI, Grading & Guard Wiring
Depends on: Epic 1

## Goal
Ensure `games/gnomeokemon/src/app.ts` prevents launching locked courses from normal UI navigation and routes Quick Ride to the highest unlocked incomplete course.

## Read first
- `games/gnomeokemon/src/snap/progression.ts`
- `games/gnomeokemon/src/app.ts`

## Change
- In `app.ts`:
  - In `startRide(course, bypassLock = false)`: unless `bypassLock` is true (used only for `?mode=snap&course=...` direct dev/demo links), check `isCourseUnlocked(course, computeTotalPoints(loadBestPhotos()))`; if locked, call `show('map')` instead of starting the ride.
  - Update `onQuickRide` callbacks (in `title` and `hall`) to use `getHighestUnlockedIncompleteCourse(loadBestPhotos(), (c) => [...new Set(getCourseSpawns(c).map((s) => s.speciesId))])`.

## Done when
- `npx tsc --noEmit -p games/gnomeokemon` succeeds
~~~~
