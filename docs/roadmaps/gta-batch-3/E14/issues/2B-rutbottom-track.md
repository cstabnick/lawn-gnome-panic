Epic: E14-2 (content on the track registry)
Depends on: none
Worker: Sonnet (general-purpose) — track geometry

## Environment
Read `docs/roadmaps/gta-batch-3/E14/issues/_env.md` first (worktree, toolchain, rules, the Track contract).

## Goal
The Rutbottom Dirt Bowl circuit: a bumpy dirt track with big banked turns (source request: "add a dirt race track that
is rather bumpy with big banked turns"), replacing the placeholder oval in `src/raceTrack/defs/rutbottom.ts`.

## Read first
- `games/gnome-theft-auto/src/raceTrack/defs/rutbottom.ts` (placeholder to replace), `src/raceTrack/trackDef.ts`
  (how control points, bank, lift, jumps, whoops become samples and terrain), `src/raceTrack/track.ts` (the Speedway def
  as a worked example: lifts up to 3.5 m, banks up to 2.2 m, two jumps), `src/raceTrack/tracks.test.ts` (rules every track
  must pass).

## Change
- `src/raceTrack/defs/rutbottom.ts`: keep `export const RUTBOTTOM: TrackDef`, id `'rutbottom'`, name
  `'Rutbottom Dirt Bowl'`, `closed: true`, `surface: 'dirt'`, `relief: 'raise'`, `reserve: { x: 1200, z: -650, hw: 200, hd: 130 }`,
  `width` 11, `barrierOffset` 10 (hay bales go there). Design the control line:
  - lap 1.2-1.6 km, inside the reserve with `barrierOffset` to spare (the site is x 1000..1400, z -780..-520; the gate from
    the road is at the west edge (1000, -650), so leave the west end between z -670 and -630 clear of the track for an
    entrance lane and the pits: keep the centre line at least 35 m from (1015, -650));
  - 4-6 big banked corners: `bank` 2.5-4 m at the apex (ease in over neighbouring points), so the bank tilt
    `bank / width` stays at or under 0.38; one corner is "the Berm" (biggest bank, name it in a comment);
  - rises (`lift` 1-4 m) and 2-3 whoops sections (`whoops: [{ from, to, amp: 0.25-0.4, wave: 6-9 }]`) on straights,
    none within 25 m of a jump or the start line;
  - 1-2 jumps (`rise` 1.2-1.8, `up` 8-10, `down` 4-6) with names that fit the place (e.g. "Clary's Hump"); `s` values
    are lap distances from the start line, negative counts back;
  - a crossover is not allowed (barriers never cross: tracks.test.ts checks every two parts stay apart by
    `2 * barrierOffset + 6`);
  - `startOffset` so the start line sits on the longest straight, `gates` 10.
- `src/raceTrack/rutbottom.test.ts` (new): length 1200-1600; at least 4 sample runs where `bank >= 2.5`; every `bank /
  width <= 0.38`; at least two whoops ranges and every whoop range is >= 25 m from every jump and from s = 0; centre line
  >= 35 m from (1015, -650); every sample within the `dirt-track` site rect from `siteRect('dirt-track')` (`src/sites.ts`)
  shrunk by `barrierOffset`; the gate tracker counts a lap (copy the pattern from `tracks.test.ts`).

## Contract
`RUTBOTTOM` keeps its name, id and the fields above. Other workers read `TRACKS.rutbottom` (via `tracks.ts`): the race
runtime, the dressing (hay bales at `barrierOffset`, a starter's tower and pits by the start), the quests.

## Done when
- `npx vitest run src/raceTrack/tracks.test.ts src/raceTrack/rutbottom.test.ts src/sites.test.ts` passes.
- `npx tsc --noEmit -p .` passes for your files.
- Report the lap length, the corner names and bank values, the jump names and s values, the start line position, and
  the s ranges of the whoops (the dressing worker places signs from them).

## Out of scope
Every file except the two above. Do not edit `trackDef.ts`, `tracks.ts`, `track.ts`, the site documents or other defs.
