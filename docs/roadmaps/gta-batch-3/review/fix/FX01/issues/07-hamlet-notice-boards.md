Epic: FX01-B
Depends on: none
Findings: G3#28 (must, D58), G6#2 part (Espalier End notice board)

## Goal
Dunelow's and Espalier End's village notice boards read: each board's plate carries a short headline that is legible at
6 m, and a "Read the notices" interact spot in front of the board toasts the full notices one by one. Dunelow's
deckchair board prices in Acorns.

## Read first
- `living/hamletDunelow.ts` lines ~140-170: the notice plate at (bx -578, bz 936) (seven lines on a 1.3 x 0.8 plate),
  the bus timetable, the deckchair board ('DECKCHAIRS\nHIRE 50p\nFalling over included'), the judges' card. Find which
  prefab the "rules board" is (search the file's plan for the piece at -578, 936) and its face (the comment says face
  centre (0, 1.45, 0.05), 1.4 x 0.9).
- `living/hamletEspalier.ts` lines ~170-195: the `rules-board` plate (three long notices on a 1.3 x 0.82 plate) and
  `plateOn()`.
- `homes/notices.ts` (`addNoticeSpot`, pasted above). It imports `interactables.ts`; calling it at world build is fine
  (other world modules do the same, e.g. `coast/spokewheel.ts`).

## Change
- `living/hamletDunelow.ts`:
  - Notice board plate: keep the same spot and size (it sits on the board face), but cut its text to a headline of at
    most four short rows, e.g. `'VILLAGE NOTICES\nGULLS ARE NOT TO BE FED.\nGULLS DISAGREE.\n(read on)'`: the headline may
    shorten a joke only because the full joke follows in the spot. Then
    `addNoticeSpot({ x: bx, z: bz + 1.3 }, [ 'GULLS ARE NOT TO BE FED. GULLS ARE AWARE OF THIS AND DISAGREE.',
    'Ice cream van Tuesdays, and whenever it hears you.', 'Lost: one flip-flop. Left. Possibly at sea.' ])` (the board
    faces +z, yaw 0, so the approach side is +z; confirm with the code).
  - Deckchair board: `'DECKCHAIRS\nHIRE 1 ACORN\nFalling over included'`.
- `living/hamletEspalier.ts`: the rules-board plate becomes a headline (`'NOTICES\nTOPIARY CONTEST\nLOST: ONE PEAR\nHEDGE
  MEDIATION TUESDAY'` or similar, ≤ 4 rows) and an `addNoticeSpot` 1.3 m in front of the board on its facing side
  (use the board's yaw: `x + Math.sin(yaw) * 1.3`, `z + Math.cos(yaw) * 1.3`) with the three full notices verbatim:
  'TOPIARY CONTEST: entries must not resemble the judges.', 'LOST: one pear. Answers to nothing.',
  'The hedge between No. 3 and No. 4 is 1.2 m. It is ALSO 1.4 m. Mediation Tuesday.'
  Only add the spot when the board exists (inside the same `if`).
- These builders also run in tests (no DOM): `addNoticeSpot` only pushes into a list, which is fine.
- Search `docs/lore/` for "50p" (`npm run lore -- find 50p` from the repo root, or grep): if a lore entry says 50p,
  report the file and line in your final message (do not edit lore).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your files.
- `npx vitest run src/living` (inside games/gnome-theft-auto) passes.

## Out of scope
`homes/notices.ts`, `homes/pieces.ts`, `interactables.ts`, every other `living/` file, `docs/lore/`.
