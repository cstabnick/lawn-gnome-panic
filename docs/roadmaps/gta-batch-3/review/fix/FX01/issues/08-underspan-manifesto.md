Epic: FX01-B
Depends on: none
Findings: G1#17 (must, D58), G2#11 rule (free-standing boards print both faces)

## Goal
The Underspan's two manifesto hoardings read from the follow camera: big posters (about 2.6 x 1.5 m, one joke per
board-half), on both faces of each free-standing board, plus a "Read the manifesto" interact spot that toasts every
line. Today 3-4 A4-sized posters per board are white specks.

## Read first
- `societies/underspan/build.ts`: the helpers `place`, `plate` (wraps `textPlate`), `posters(id, x, z, yaw, texts)`
  (~line 89-100: spreads the texts across the board's +z face, each ≤ 0.9 x 0.5 m at 55% of the board height), the two
  `posters('manifesto-board', ...)` calls (~line 212-222) with their 7 texts, `toWorld(x, z, yaw, lateral, depth)`,
  `UNDERSPAN.manifestoWall`, and `W` (the boards' yaw).
- `packages/prefabs/src/catalog/gta-underspan.ts`: `manifesto-board` is a 6 x 1.9 x 0.2 m hoarding, face centre y 1.45,
  front face z +0.1, back face z -0.1; its `examine` line says "Someone has written RULES ARE PROTOTYPES on the back in
  small letters".
- `homes/notices.ts` `addNoticeSpot` and `homes/pieces.ts` `BOARD_FACES` (pasted above).

## Change (only `societies/underspan/build.ts`, plus its test if needed)
- Rewrite `posters` as `manifesto(x, z, yaw, front: string[], back: string[])`: up to two posters per face, each
  `w = 2.6, h = 1.5`, centred at lateral ±1.45 m (one poster: lateral 0), at the face centre height
  (`heightAt(x, z) + 1.45`), 0.03 m off the face: front at depth `0.1 + 0.03` facing `yaw`, back at depth
  `-(0.1 + 0.03)` facing `yaw + Math.PI` (on the back the lateral sign flips, so the first back poster is on the
  viewer's left). Use the existing `plate()` helper (white paper `PAPER` background).
- Board 1 (manifestoWall): front 'A RULE IS ONLY A\nPROTOTYPE NOBODY\nTESTED', 'PERMITS ARE FOR\nPEOPLE WHO ASK';
  back 'THE GROUND IS\nALREADY OBSOLETE', 'UP IS A DIRECTION,\nNOT A CRIME'.
  Board 2 (z -34): front 'WE BUILT A LIFT.\nTHEY BUILT A FORM.', 'CITATIONS ARE\nA FORM OF PRAISE'; back
  'FORM 7 IS A\nSUGGESTION', 'rules are prototypes' (the small back-of-board joke from the prefab's examine line, as
  a handwritten-looking second poster: `bg` a pale yellow 0xf3e9a6).
- One `addNoticeSpot` per board, 1.4 m in front of its front face (`toWorld(x, z, yaw, 0, 1.4)`), prompt
  `'Read the manifesto'`, lines = all of that board's poster texts with `\n` replaced by spaces.
- Keep the other plates and stake signs as they are (textPlate now wraps them).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your files.
- `npx vitest run src/societies/underspan` (inside games/gnome-theft-auto) passes. If a test counts plates or names,
  update it to the new count and say so.

## Out of scope
`homes/**`, `highways/**`, the prefab catalog, `societies/underspan/life.ts` and `workshop.ts`.
