Epic: E25-2 (jobs III, parallel build)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E25/_env.md` first. Touch-controls issue: it must feel good with a thumb, a keyboard
and a gamepad. No dev server needed (the runtime that opens it comes later); a throwaway HTML harness is fine if you
delete it.

## Goal
`firefighter/hoseUi.ts`: the controls while the player mans the hose of the fire engine: an aim pad, a big Spray hold
button, a Ladder hold button on rescue calls, a tank gauge, a ladder gauge with its target band, a hint line and a
"Back to the cab" button.

## Read first
- `games/gnome-theft-auto/src/workplaces/firefighter/hoseUi.ts`: the stub (`HoseInput`, `HoseUi`, `openHoseUi`).
- `games/gnome-theft-auto/src/workplaces/chef/stepWidgets.ts`: E24's touch widgets (CSS injected once by id, pointer
  handling for holds, `data-gnl-touch="none"`, `firstPad()` from '@lawn/gamepad').
- `games/gnome-theft-auto/src/keys.ts`: `isTyping`, `KEYS` (`KEYS.close` is Escape).
- `packages/gamepad/src/` (or its README): `firstPad()` shape (axes, buttons) - check the names before using them.

## Change
- `games/gnome-theft-auto/src/workplaces/firefighter/hoseUi.ts`: `openHoseUi(ui)` appends its own container
  (id `gta-hose-ui`, CSS injected once, fixed, `env(safe-area-inset-*)`), fits 390x844 and 844x390:
  - **Aim pad** bottom-left: a 150 px circular drag pad with a thumb knob; dragging gives aimX/aimY in -1..1 (knob
    offset / radius, dead zone 0.12); release recentres. Also arrow keys / WASD (each held key = +-1) and the
    gamepad's left stick (dead zone 0.15).
  - **Spray** bottom-right: a 96 px round hold button with a water-drop icon; held = spray. Also Space and gamepad
    A / right trigger (value > 0.4).
  - **Ladder** above Spray: a 64 px hold button "Ladder" shown only while `setLadder` has a band; held = ladder. Also
    the L key and gamepad X.
  - **Tank gauge** top-left (under the safe area): a vertical bar 0..1 with "Tank" and "Refilling..." when
    refilling; turns red under 15%.
  - **Ladder gauge** next to the Ladder button when shown: a vertical bar with the green target band and the current
    extension.
  - **Hint line** top-centre (one line, ellipsis).
  - **Back to the cab** top-right, 44 px: sets `leave` (edge). Also Escape / `KEYS.close` and gamepad B.
  - `read()` returns the current input and clears `leave`. Pointer capture on the pad (`setPointerCapture`), multi-
    touch: pad and Spray can be held at the same time (track pointer ids separately). `close()` removes every
    listener and the container; `isOpen()`.

## Contract
`openHoseUi(ui): HoseUi` and the `HoseInput` / `HoseUi` shapes exactly as in the stub.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in `hoseUi.ts`.
- Layout reasoned (or checked in a throwaway harness) at 390x844 and 844x390: nothing overlaps or leaves the screen;
  every target >= 44 px; pad and Spray reachable with two thumbs in landscape.

## Out of scope
Every other file.
