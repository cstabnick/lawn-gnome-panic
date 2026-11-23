# DayG UI today

What each screen does at commit `0782730` (plus the uncommitted edits on the branch on 2026-11-22), and which
[user stories](user-stories.md) it fails. Screenshots from the phase 3 and 4 checks are referred to by name only:
`dayg-34-portrait.png`, `dayg-34-landscape.png`, `dayg-34-desktop.png` (pack), `dayg-35-portrait.png`,
`dayg-35-landscape.png`, `dayg-35-desktop.png` (HUD), `dayg-41-portrait.png`, `dayg-41-landscape.png` (touch). The
390 px shots (`dayg-41-portrait.png`, `dayg-34-portrait.png`) show a black band to the right of the page: headless
Edge does not make a window narrower than about 492 px, so the new shot script wraps the page in a 390 px iframe.

## Shared

- Every module builds its own inline CSS with its own colours (`#f4f7f2`, `#2d3a25`, `#e8c35a`, ...), its own font
  sizes (11 to 22 px) and its own z-index. There is no theme, no text scale, no high-contrast mode and no
  reduce-motion. Fails S10, S36, S37, S40.
- Layout zones are numbers in `config.ts` `LAYOUT` and in `hud.ts` CSS (`bottom: 276px`, `340px`, `120px`, `170px`);
  `touch.ts` has its own `BLOCK_W`/`BLOCK_H` (212 x 252). Nothing checks that zones do not overlap at a bigger text
  size. Fails S36.
- No live region, no focus helpers, no shared button. Fails S38, S39.
- `main.ts` never calls `input.setPointerLockAllowed`, so opening the pack on desktop does not release pointer lock.
  Fails S22.

## HUD (`src/ui/hud.ts`)

Does: top-left five bars (Warm, Water, Food, Calm, Stamina; 12 px labels, 6 px bars) and a 40 x 56 SVG clay figure
with cracks, grey moss overlay and veins by infection stage; top-right clock line (`☾ hh:mm · Day n · season ·
weather`), region name, "Safe: <haven>", stance ("crouched") and carry (`2.3 / 8 kg`, amber when over); centred busy
bar and context prompt (`hud.prompt(text)`), up to 3 toasts that fade after 3 s. Values are cached so the DOM changes
only when they do.

Fails:
- S02: stamina, carry and the region name are always on.
- S03: no noise or signature indicator.
- S04, S05: the figure shows cracks and moss only as shapes and colours; no words, no stage name, no time since the
  bite, no treatment.
- S06: season is always on (crowds the top line) and there is no on-demand detail.
- S08: toasts sit under the top bar across the width; they are not checked against the touch buttons.
- S09: no first-hour guidance.
- S10: bar state is colour only (`#d64a3a` red, `#e0a030` amber, a pulse at 0); text-shadow instead of a plate.
- S36, S37, S40: fixed 12 px text; no theme; the pulse ignores reduced motion.
- S39: toasts are not announced.

## Interaction prompt (`hud.prompt`, `src/game/interact.ts`, `main.ts`)

Does: `interact.update` picks the single nearest labelled interactable; `main.ts` shows its label, or the climb hint
("Vault", "Climb", "Climb with the rope", "Too high to climb"), in a pill above the touch block (portrait) or in the
middle third (landscape). E or ACT runs it.

Fails:
- S11: the prompt has no key or button name, and the ACT button always reads "ACT".
- S12: only the nearest action shows; at the Tap "Fill your containers" is hidden behind "Drink from the Tap". The
  action wheel from `survival.md` (hold E, long press) does not exist.
- S13: consequences are only in some labels ("(dirty)"); "Too high to climb" does not say what would help and looks
  like an action.
- S14: no interior or door prompt kind.

## Pack (`src/ui/inventoryPanel.ts`, screenshots `dayg-34-*`)

Does: portrait bottom sheet at 72% height with a sticky full-width Close bar; landscape right panel at 62% width with
a 48 px Close in the corner. Sections: Hands (2 slots), Worn (4), Pack (56 px icon grid with count, litres and a
condition bar), kg and litre meters, the selected item's actions, Recipes (disabled buttons with a reason beside them,
as in `dayg-34-portrait.png`), and a "Searching: <container>" column with Take and Take all. `?inv=1` opens it.

Fails:
- S16: the container column is above the pack in portrait (one long scroll), not a tab.
- S18: condition is a colour bar only; no item weight.
- S19: meters show numbers but "over" is colour only (`#c0623a`).
- S21: no filters.
- S22, S23: no Esc, no focus handling, no `role="dialog"`; the pack is the only sheet so far, styled on its own.
- S33-S38 parts: slots have a `title` but no `aria-label`; selected state is a gold border only.

## Touch (`src/ui/touch.ts`, screenshots `dayg-41-*`)

Does: floating stick in the left 45% and bottom 60% of the screen (sprint past 90% travel), look-drag anywhere else,
a 212 x 252 bottom-right block with ACT, PACK, CROUCH (60 px), UP (60 px, glows when a climb is possible), HIT
(72 px), and VIEW (48 px) under the clock. Shown on coarse pointers, `?touch=1`, or after the first touch.

Fails:
- S11: ACT never shows the verb.
- S12: no long press.
- S29: CROUCH does not show the current stance; UP glows yellow (colour only) and has no disabled state.
- S30: no camera follow; looking needs a second finger.
- S31: no left-handed layout.
- S36, S37: 13 px bold labels on a 60% black fill; no theme.

## Camera (`src/game/camera.ts`)

Does: low third person with pull-in along the ray when a block is in the way (S15 is met), and a first-person toggle
(V, VIEW).

Fails: S30 (no follow mode).

## Map

Does not exist. `survival.md` lists M and a map button; there is no `folded-map` or `compass` item yet. Fails S25,
S26, S27.

## Recap (`src/ui/recap.ts`)

Does: a centred card (max 440 px) with a cause title, the last 60 s of the event log joined into one paragraph (up to
8 sentences), "Day n, hh:mm, in the <place>", three statistics, "You will rise as a Hatless in your gear" for Hatless
and moss deaths, and one "Walk again" button (48 px) that loads a new seed.

Fails:
- S33: the chain is a paragraph, not an ordered list.
- S34: no tip for the cause.
- S35: no "Same world" button.
- S38, S39: no focus move, no `role="alertdialog"`, nothing announced.

## Build menu, talk, board, ledger and room panels

Planned in [dayg-phases-4-8.md](../../../roadmaps/dayg-phases-4-8.md) (issues 8.1, 8.2, 8.3, 8.7, 9.1) and not in
the code yet. They are written to that roadmap's own conventions, so S23 and S24 will fail until roadmap 11's round 4
moves them onto the shared sheet.
