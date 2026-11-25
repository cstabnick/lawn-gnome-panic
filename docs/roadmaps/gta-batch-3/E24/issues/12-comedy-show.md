Epic: E24-2 (workplace jobs, parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E24/_env.md` first.

## Goal
`workplaces/comedy/show.ts`: the pure clock of a comedy set. It walks a `ComedySet` beat by beat and emits
`ShowEvent`s (intro, line, reaction, heckle, tomato, doubled, closer, end) with timing, handles the one player input
(Double Down), and keeps the cringe meter, tomato count and the set's stars. Unit-tested.

## Read first
- `games/gnome-theft-auto/src/workplaces/comedy/types.ts`: `ComedySet`, `Beat`, `CrowdReaction`, `Heckler`,
  `ShowEvent`, `CLUB.seats`.
- `games/gnome-theft-auto/src/workplaces/comedy/show.ts`: the stub (`Show`, `createShow`); keep both signatures.
- `games/gnome-theft-auto/src/jobs/workDefs.ts`: `Stars`, `toStars`.

## Change
- `games/gnome-theft-auto/src/workplaces/comedy/show.ts`: `createShow(set, { heckles, hecklers, doubleDownLines, seed })`
  with a seeded PRNG (mulberry32 from `seed`):
  - Timeline: t=0 `{ t: 'intro', text: set.intro }`, hold 3.5 s. Then for each beat: `{ t: 'line', text, anim, s }`,
    hold `beat.s`; then the reaction: `{ t: 'react', kind: beat.react }` and, by kind: 'heckle' -> also
    `{ t: 'heckle', who: <a seeded pick from hecklers>, text: beat.heckle ?? <seeded pick from heckles, not the same
    as the previous heckle> }`; 'tomato' -> `{ t: 'tomato', seat: <a heckler's seat or a random 0..9> }`; hold 2.2 s
    (3 s after a heckle) before the next line. After the last beat: `{ t: 'closer', text: set.closer }`, hold 3 s, then
    `{ t: 'end' }` once; `done()` true from then; further `step` calls return [].
  - `step(dt)` advances the clock and returns every event whose time has come, in order (a large dt can return
    several).
  - Cringe: starts at 10; per reaction add silence 4, cricket 5, cough 5, sigh 6, groan 8, boo 10, heckle 9, tomato 14,
    walkout 16, pity-clap 12 (the worst); clamp 0..100.
  - Double Down: `canDoubleDown()` is true from a reaction of kind groan, boo, heckle, sigh, silence, cricket or
    walkout until the next line starts. `doubleDown()` when allowed: emits on the next `step` a
    `{ t: 'doubled', text: <next doubleDownLines line, cycling> }`, holds 3 s more, then an escalated reaction: groan ->
    boo, silence/cricket -> groan, sigh -> groan, boo -> tomato (with its 'tomato' event), heckle -> heckle (a new
    heckler and line), walkout -> walkout; cringe as above; counts `doubleDowns()`; then the set goes on. Only one
    Double Down per beat (`canDoubleDown()` false after using it until the next reaction). Returns false when not allowed.
  - `tomatoes()`: number of 'tomato' events emitted.
  - `stars()`: "commitment", not laughs: start 1, +1 if the set reached `end`, +1 if doubleDowns >= 2, +1 if tomatoes
    >= 2, +1 if cringe >= 80; `toStars`.
- `games/gnome-theft-auto/src/workplaces/comedy/show.test.ts` (new), with a tiny inline 3-beat set (do not import
  material.ts): stepping in 0.1 s ticks yields intro, 3 lines, 3 reacts, closer, end in order; same seed = same
  events; a 'tomato' beat yields one tomato event with a seat 0..9; `doubleDown()` right after a groan returns true,
  emits 'doubled' then a 'react' of kind 'boo'; `doubleDown()` during a line returns false; stars of a finished set
  with no double downs is 2 (1 + finished) unless cringe >= 80.

## Contract
`Show` and `createShow(set, opts)` exactly as in the stub. Pure: no DOM, no three.js, no timers.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/workplaces/comedy/show.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in `workplaces/comedy/show*.ts`.

## Out of scope
`comedy/types.ts`, `comedy/material.ts` (another worker), every other file.
