Epic: E31 wave 1 (prefabs and systems)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E31/_common.md` first.

## Goal
The Unmown checklist ("Spot the Species") is a Gnomlet tablet app: a touch-friendly list of the 12 entries showing which
are ticked, each with the rangers' hint, and a progress line.

## Read first
- `games/gnome-theft-auto/src/unmown/checklist.ts` (CHECKLIST, ChecklistStore — done, do not change)
- `games/gnome-theft-auto/src/unmown/checklistApp.ts` (your stub: keep `registerChecklistApp(store: ChecklistStore): void`)
- `games/gnome-theft-auto/src/gnomlet/registry.ts` (`registerGnomletApp`, `GnomletApp`: `open(root, ctx)` builds inside
  the tablet screen and returns a cleanup function; `detail()`; `badge()`; groups)
- `games/gnome-theft-auto/src/gnomlet/apps/gnomeyBird.ts` (an app that builds DOM inside `root`)

## Change
- `games/gnome-theft-auto/src/unmown/checklistApp.ts`: `registerChecklistApp(store)` calls `registerGnomletApp({ id:
  'unmown-checklist', label: 'Unmown Checklist', icon: '🦆', group: 'journals', detail: () => \`${n}/12 ticked\`,
  open(root) {...} })`. The screen: a title "Spot the Species — the Unmown", a one-line ranger note ("Look, don't mow.
  Ticks happen by themselves when you see something; birds count once they are in your binocular journal."), a progress
  bar, then one row per entry (min-height 44 px, readable at 390 px wide): a tick or an empty box, the name, the kind
  (Bird / Animal / Plant), and the hint in smaller text. Ticked rows look done (muted, ✓). Re-read `store.seen()` each
  time the app opens. Build DOM only inside `open` (never at import). Style with inline styles or a `<style>` element
  scoped by a class prefix `uc-`; never restyle `#ui` or the tablet.
- NEW `games/gnome-theft-auto/src/unmown/checklist.test.ts`: tests for `createChecklistStore` (empty start, mark returns
  true once, unknown ids ignored, garbage storage starts empty, persists through a fake storage) and `sightings`
  (a hare within 12 m in the Unmown ticks 'hare', outside the Unmown it does not, a seen bird ticks its entry anywhere,
  already-ticked ids are not returned).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/unmown/checklist.test.ts src/gnomlet` passes.
- `npx tsc --noEmit -p .` clean for your files.

## Out of scope
`unmown/checklist.ts`, `living/runtime.ts`, gnomlet files.
