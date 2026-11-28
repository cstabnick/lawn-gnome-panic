Epic: FX01-B
Depends on: none
Findings: G1#17 part (must, D58): Saucer Court's 0.6-0.95 m plates and Kerb Row's street sign are unreadable.

## Goal
Saucer Court's signage ("STAIRWELL RULES", "SAUCER COURT residents only (and the bank)", the cleaning rota) and the
Turfton town homes' street-facing plates (Kerb Row's sign, the long shop and notice plates) read at 6 m on a phone.
Dense notices also get a "Read the notices" spot.

## Read first
- `homes/saucerCourt.ts` lines ~60-100: `details()` (the plates: 'SAUCER COURT\nSTAIRS 1-3', the buzzer plate,
  'STAIRWELL RULES ...' 0.9 x 0.5 on the door at z 78.99, 'SAUCER COURT\nresidents only\n(and the bank)' 0.6 x 0.4 at
  (21.5, 0.72, 109.5), the rota 0.95 x 0.55 on the west face), `NORTH_FACE_B`, `WEST_FACE`, `HALF_PI`, and where the
  court's builder is called (to know where to add a spot).
- `homes/townHomes.ts` lines ~70-200 (`Plate` rows per home: text, lx, y, lz, w, h) and ~218-232 (`buildTownHomes`
  turns each row into a `textPlate`).
- `homes/saucerCourt.test.ts`, `homes/townHomes.test.ts` (what they assert about plates).
- `homes/notices.ts` `addNoticeSpot` (pasted above).

## Change
- `homes/saucerCourt.ts`:
  - Roughly double the joke plates' area, keeping them on their walls and clear of doors and windows (check the door
    and window rectangles in the same file; plates stay 0.05 m off their wall):
    'STAIRWELL RULES ...' → 1.3 x 0.8 beside the door on the north wall (not on the door leaf), y ~1.6;
    'SAUCER COURT\nresidents only\n(and the bank)' → 1.2 x 0.8 at y ~1.3 (raise it: 0.72 is knee height);
    the rota → 1.5 x 0.9 at y ~1.8. Texts unchanged.
  - `addNoticeSpot` in front of the rules plate (lines: '1. WIPE FEET', '2. NO RUNNING', '3. NO LODGERS',
    '4. I AM WATCHING') and in front of the rota (the rota lines joined: 'MON: nobody. TUE: nobody. WED: nobody.
    THU: nobody...'). Put the spots 1.2 m out from the wall on the courtyard side. If `details()` must stay pure (tests
    call it), add the spots in the builder that adds `details()` to the scene instead, and export a small pure
    `SAUCER_NOTICES` list for the test.
- `homes/townHomes.ts`: in the plate rows, raise the street-facing joke plates to legible sizes: Kerb Row's sign
  (`'KERB ROW\nkerbs: yes  row: ongoing'`) → `w: 1.8, h: 0.8`, and since it stands free in the front garden, print both
  faces and give it a backing: extend the `Plate` row type with optional `back?: boolean` and pass
  `{ back: p.back, backing: p.back ? true : undefined }` to `textPlate`; set `back: true` on Kerb Row's row only.
  'LAWN UNDER\nOBSERVATION' → 1.5 x 0.6; 'NOTICE OF\nNON-COMPLIANCE' → 1.0 x 0.5; 'PARKING FINE\nISSUED BY: COUNCIL' →
  0.9 x 0.4. Keep each plate's anchor (lx, lz) and wall offset; adjust y only if the larger plate would hit the
  ground (bottom edge at least 0.15 m above ground).
- Update the two tests only where they pin the old sizes.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your files.
- `npx vitest run src/homes` (inside games/gnome-theft-auto) passes (this includes the lead's `plates.test.ts`).

## Out of scope
`homes/pieces.ts`, `homes/notices.ts`, `homes/outerHomes.ts`, `interiors/**`, `worldChanges/**`.
